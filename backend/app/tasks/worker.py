import os
import fitz
import traceback
from concurrent.futures import ThreadPoolExecutor
from app.extensions import db
from app.models.document import File, Page, Sentence, Translation
from app.services.pdf_service import PDFService
from app.services.storage_service import StorageService
from app.services.translation_service import TranslationService

executor = ThreadPoolExecutor(max_workers=3)

def process_file_pipeline(app, file_id: str, file_path: str):
    """
    Main background pipeline that processes a PDF:
    1. Render pages to image & upload to R2/Local.
    2. Extract multi-line bounding boxes & texts.
    3. Translate texts via Google API / Fallback.
    4. Save everything to DB and set status = 'ready'.
    """
    with app.app_context():
        file_record = File.query.get(file_id)
        if not file_record:
            print(f"[Worker] File record {file_id} not found.")
            return

        try:
            file_record.status = "processing"
            db.session.commit()

            doc = fitz.open(file_path)
            file_record.page_count = len(doc)
            db.session.commit()

            storage_service = StorageService()
            translation_service = TranslationService()

            temp_images_dir = os.path.join(os.path.dirname(file_path), f"temp_{file_id}")
            os.makedirs(temp_images_dir, exist_ok=True)

            for page_index in range(len(doc)):
                page = doc[page_index]
                page_number = page_index + 1

                # 1. Render page image
                temp_img_path = os.path.join(temp_images_dir, f"page_{page_number}.png")
                width, height = PDFService.render_page_to_image(page, temp_img_path, dpi=150)
                image_url = storage_service.save_page_image(file_id, page_number, temp_img_path)

                # 2. Create Page in DB
                page_db = Page(
                    file_id=file_id,
                    page_number=page_number,
                    image_url=image_url,
                    width=float(page.rect.width),
                    height=float(page.rect.height)
                )
                db.session.add(page_db)
                db.session.flush()  # get page_db.id

                # 3. Extract text sentences & bboxes
                structured_sentences = PDFService.extract_structured_page_content(page)
                if not structured_sentences:
                    continue

                texts_to_translate = [s["original_text"] for s in structured_sentences]
                translated_texts = translation_service.translate_batch(texts_to_translate)

                # 4. Save Sentences & Translations
                for idx, sent_data in enumerate(structured_sentences):
                    sentence_db = Sentence(
                        page_id=page_db.id,
                        original_text=sent_data["original_text"],
                        bboxes=sent_data["bboxes"],
                        order_index=sent_data["order_index"]
                    )
                    db.session.add(sentence_db)
                    db.session.flush()

                    translated = translated_texts[idx] if idx < len(translated_texts) else ""
                    translation_db = Translation(
                        sentence_id=sentence_db.id,
                        translated_text=translated
                    )
                    db.session.add(translation_db)

                db.session.commit()

            doc.close()

            # Clean up temp images
            if os.path.exists(temp_images_dir):
                import shutil
                shutil.rmtree(temp_images_dir, ignore_errors=True)

            file_record.status = "ready"
            db.session.commit()
            print(f"[Worker] File {file_id} processed successfully!")

        except Exception as e:
            traceback.print_exc()
            file_record.status = "failed"
            file_record.error_message = str(e)
            db.session.commit()


def enqueue_pdf_processing(app, file_id: str, file_path: str):
    """
    Submits the task to the background executor.
    Supports ThreadPoolExecutor for lightweight setups or Redis Queue if configured.
    """
    executor.submit(process_file_pipeline, app, file_id, file_path)
