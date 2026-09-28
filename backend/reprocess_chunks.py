import os
import fitz
from app import create_app
from app.extensions import db
from app.models import File, Page, Sentence, Translation
from app.services.pdf_service import PDFService
from app.services.translation_service import TranslationService

app = create_app()

def reprocess_all_files():
    with app.app_context():
        trans_service = TranslationService()
        files = File.query.all()
        print(f"Found {len(files)} files to check/reprocess...")

        pdf_path = "../Lecture_Neural_Networks_5Pages.pdf"
        if not os.path.exists(pdf_path):
            pdf_path = "Lecture_Neural_Networks_5Pages.pdf"

        if not os.path.exists(pdf_path):
            print("Lecture PDF not found!")
            return

        doc = fitz.open(pdf_path)

        for f in files:
            # Check if this file has 5 pages (matching our demo lecture)
            if f.page_count == 5:
                print(f"Reprocessing File {f.id} into semantic chunks...")
                
                # Delete existing pages, sentences, and translations for this file
                for p in f.pages:
                    db.session.delete(p)
                db.session.commit()

                # Recreate pages and semantic chunks
                for p_no in range(len(doc)):
                    page_num = p_no + 1
                    page = doc[p_no]

                    image_url = f"/api/storage/{f.id}/{f.id}_page_{page_num}.png"
                    new_page = Page(
                        file_id=f.id,
                        page_number=page_num,
                        image_url=image_url,
                        width=float(page.rect.width),
                        height=float(page.rect.height)
                    )
                    db.session.add(new_page)
                    db.session.flush()

                    chunks = PDFService.extract_structured_page_content(page)
                    print(f"  Page {page_num}: {len(chunks)} semantic chunks")

                    for c in chunks:
                        new_sent = Sentence(
                            page_id=new_page.id,
                            original_text=c["original_text"],
                            bboxes=c["bboxes"],
                            order_index=c["order_index"]
                        )
                        db.session.add(new_sent)
                        db.session.flush()

                        # Translate chunk as a complete thought
                        ar_text = trans_service.translate_batch([c["original_text"]])[0]
                        new_trans = Translation(
                            sentence_id=new_sent.id,
                            translated_text=ar_text
                        )
                        db.session.add(new_trans)

                db.session.commit()
                print(f"Successfully reprocessed File {f.id} into clean semantic chunks!")

if __name__ == "__main__":
    reprocess_all_files()
