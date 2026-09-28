import os
import fitz
import arabic_reshaper
from bidi.algorithm import get_display
from app.models import UserDocument

def shape_ar(text: str) -> str:
    if not text:
        return ""
    try:
        reshaped = arabic_reshaper.reshape(text)
        return get_display(reshaped)
    except Exception:
        return text

class PDFExportService:
    @staticmethod
    def generate_translation_only_pdf(user_doc: UserDocument, output_pdf_path: str):
        """
        Generates a pure Arabic translation PDF document (ملف الترجمة فقط).
        No original slides included. Formatted as clean A4 study notes per slide.
        """
        font_path = "C:/Windows/Fonts/arial.ttf"
        font_bold = "C:/Windows/Fonts/arialbd.ttf"
        
        # A4 Portrait: width = 595, height = 842
        page_w, page_h = 595, 842
        doc = fitz.open()

        for page_rec in user_doc.file.pages:
            page = doc.new_page(width=page_w, height=page_h)
            page.insert_font(fontname="ArialArabic", fontfile=font_path)
            page.insert_font(fontname="ArialBold", fontfile=font_bold)

            # Top Header Bar
            header_rect = fitz.Rect(0, 0, page_w, 50)
            page.draw_rect(header_rect, color=None, fill=(0.10, 0.22, 0.44))

            # Header brand & title
            brand_text = shape_ar("منصة لِـثْ (LITH) للترجمة الجامعية")
            doc_title = shape_ar(user_doc.custom_title)
            page.insert_text(fitz.Point(page_w - 220, 26), brand_text, fontname="ArialBold", fontsize=11, color=(1, 1, 1))
            page.insert_text(fitz.Point(35, 26), f"Slide {page_rec.page_number} / {user_doc.file.page_count}", fontsize=11, color=(0.8, 0.88, 1.0))
            page.insert_text(fitz.Point(page_w - 220, 42), doc_title, fontname="ArialArabic", fontsize=9, color=(0.7, 0.8, 0.95))

            # Slide Badge & Title Banner
            slide_banner = fitz.Rect(35, 70, page_w - 35, 105)
            page.draw_rect(slide_banner, color=None, fill=(0.94, 0.96, 0.99))
            page.draw_rect(slide_banner, color=(0.82, 0.88, 0.95), width=1)

            slide_label = shape_ar(f"محتوى الشريحة رقم ({page_rec.page_number})")
            page.insert_text(fitz.Point(page_w - 180, 93), slide_label, fontname="ArialBold", fontsize=13, color=(0.12, 0.25, 0.55))

            # Circle badge for slide number
            page.draw_circle(fitz.Point(55, 87.5), 14, color=None, fill=(0.15, 0.35, 0.75))
            page.insert_text(fitz.Point(51, 92), str(page_rec.page_number), fontsize=11, color=(1, 1, 1))

            # Content area
            curr_y = 125
            content_left = 35
            content_right = page_w - 35

            for s_idx, sent in enumerate(page_rec.sentences):
                if not sent.translation:
                    continue

                ar_text = sent.translation.translated_text
                shaped_ar = shape_ar(ar_text)

                # Card height based on length
                card_h = 68 if len(ar_text) > 70 else 52
                card_rect = fitz.Rect(content_left, curr_y, content_right, curr_y + card_h)
                
                # Card background
                page.draw_rect(card_rect, color=(0.90, 0.92, 0.95), fill=(0.98, 0.99, 1.0), width=0.8)

                # Right color accent bar
                accent_rect = fitz.Rect(content_right - 4, curr_y, content_right, curr_y + card_h)
                page.draw_rect(accent_rect, color=None, fill=(0.15, 0.40, 0.85))

                # Arabic translation text
                text_rect = fitz.Rect(content_left + 15, curr_y + 8, content_right - 18, curr_y + card_h - 18)
                page.insert_textbox(
                    text_rect,
                    shaped_ar,
                    fontname="ArialBold" if s_idx < 2 else "ArialArabic",
                    fontsize=12.5 if s_idx < 2 else 11.5,
                    color=(0.08, 0.12, 0.22) if s_idx < 2 else (0.12, 0.15, 0.20),
                    lineheight=1.35,
                    align=fitz.TEXT_ALIGN_RIGHT
                )

                # English original snippet below
                en_rect = fitz.Rect(content_left + 15, curr_y + card_h - 18, content_right - 18, curr_y + card_h - 4)
                page.insert_textbox(
                    en_rect,
                    sent.original_text,
                    fontsize=8,
                    color=(0.50, 0.55, 0.62),
                    lineheight=1.1
                )

                curr_y += card_h + 12

            # Footer
            footer_line = fitz.Rect(35, page_h - 35, page_w - 35, page_h - 34)
            page.draw_rect(footer_line, color=None, fill=(0.88, 0.90, 0.94))
            
            ft_text = shape_ar("ترجمة حصرية بواسطة منصة لِـثْ • دراسة المحاضرات الإنجليزية بالعربية")
            page.insert_text(fitz.Point(page_w - 290, page_h - 18), ft_text, fontname="ArialArabic", fontsize=8.5, color=(0.55, 0.60, 0.68))
            page.insert_text(fitz.Point(35, page_h - 18), f"{page_rec.page_number} / {user_doc.file.page_count}", fontsize=9, color=(0.45, 0.50, 0.58))

        os.makedirs(os.path.dirname(output_pdf_path), exist_ok=True)
        doc.save(output_pdf_path, deflate=True, garbage=4)
        doc.close()
        return output_pdf_path

    @staticmethod
    def generate_bilingual_slides_pdf(user_doc: UserDocument, output_pdf_path: str):
        """
        Generates a comprehensive Bilingual Slide PDF (السلايد المدمج ثنائي اللغة).
        Keeps the original English text and places the Arabic translation directly under each point,
        accompanied by the high-resolution original slide visual for context and diagrams.
        """
        font_path = "C:/Windows/Fonts/arial.ttf"
        font_bold = "C:/Windows/Fonts/arialbd.ttf"

        # Landscape A4: 842 x 595 pt
        page_w, page_h = 842, 595
        doc = fitz.open()

        from flask import current_app
        base_dir = current_app.root_path if current_app else os.path.dirname(__file__)

        file_rec = user_doc.file
        for page_rec in file_rec.pages:
            page = doc.new_page(width=page_w, height=page_h)
            page.insert_font(fontname="ArialArabic", fontfile=font_path)
            page.insert_font(fontname="ArialBold", fontfile=font_bold)

            # Top Header Bar
            header_rect = fitz.Rect(0, 0, page_w, 42)
            page.draw_rect(header_rect, color=None, fill=(0.08, 0.18, 0.36))

            brand = shape_ar("منصة لِـثْ (LITH) • السلايد المدمج ثنائي اللغة")
            page.insert_text(fitz.Point(page_w - 360, 26), brand, fontname="ArialBold", fontsize=11, color=(1, 1, 1))
            page.insert_text(fitz.Point(30, 26), f"Slide {page_rec.page_number} / {file_rec.page_count}", fontsize=11, color=(0.8, 0.88, 1.0))
            
            title_text = shape_ar(user_doc.custom_title)
            page.insert_text(fitz.Point(140, 26), title_text, fontname="ArialArabic", fontsize=9.5, color=(0.75, 0.85, 0.95))

            # Left side: Original Slide Visual
            img_name = f"{file_rec.id}_page_{page_rec.page_number}.png"
            img_full_path = os.path.join(base_dir, "..", "page_images", file_rec.id, img_name)

            slide_box = fitz.Rect(30, 56, 380, 56 + 262)
            if os.path.exists(img_full_path):
                page.insert_image(slide_box, filename=img_full_path)
                page.draw_rect(slide_box, color=(0.8, 0.85, 0.9), width=1)

            # Left Bottom: Study Guidelines Badge
            info_rect = fitz.Rect(30, 330, 380, 565)
            page.draw_rect(info_rect, color=(0.88, 0.92, 0.96), fill=(0.97, 0.985, 1.0), width=0.8)
            lbl1 = shape_ar("ميزة السلايد ثنائي اللغة (Interlinear Mode):")
            lbl2 = shape_ar("• النص الإنجليزي الأصلي محفوظ بالكامل لترسيخ المصطلحات.")
            lbl3 = shape_ar("• الترجمة العربية التفسيرية مباشرة تحته لتثبيت المعنى.")
            lbl4 = shape_ar("• الشريحة الأصلية أعلاه لمطابقة الرسوم والمخططات بدقة.")
            page.insert_text(fitz.Point(48, 365), lbl1, fontname="ArialBold", fontsize=10.5, color=(0.12, 0.28, 0.58))
            page.insert_text(fitz.Point(48, 395), lbl2, fontname="ArialArabic", fontsize=9.5, color=(0.2, 0.25, 0.35))
            page.insert_text(fitz.Point(48, 420), lbl3, fontname="ArialArabic", fontsize=9.5, color=(0.2, 0.25, 0.35))
            page.insert_text(fitz.Point(48, 445), lbl4, fontname="ArialArabic", fontsize=9.5, color=(0.2, 0.25, 0.35))

            # Right side: Interlinear Bilingual Breakdown
            right_left = 398
            right_w = page_w - 30 - right_left
            curr_y = 56

            sents = [s for s in page_rec.sentences if s.translation]
            num_sents = len(sents)
            avail_h = 565 - 56
            gap = 6 if num_sents <= 7 else 4
            base_h = (avail_h - max(0, num_sents - 1) * gap) / max(1, num_sents)
            base_h = min(base_h, 68)

            for sent in sents:
                en_text = sent.original_text
                ar_text = shape_ar(sent.translation.translated_text)

                card_h = base_h
                card_rect = fitz.Rect(right_left, curr_y, right_left + right_w, curr_y + card_h)
                page.draw_rect(card_rect, color=(0.86, 0.89, 0.93), fill=(0.99, 1.0, 1.0), width=0.8)
                page.draw_rect(fitz.Rect(right_left, curr_y, right_left + 4, curr_y + card_h), color=None, fill=(0.15, 0.45, 0.88))

                half_h = (card_h - 6) / 2
                en_rect = fitz.Rect(right_left + 12, curr_y + 3, right_left + right_w - 12, curr_y + 3 + half_h)
                f_en = 9.0 if num_sents <= 7 else 8.0
                page.insert_textbox(en_rect, en_text, fontsize=f_en, color=(0.15, 0.20, 0.28), lineheight=1.1)

                div_y = curr_y + 3 + half_h
                page.draw_line(fitz.Point(right_left + 12, div_y), fitz.Point(right_left + right_w - 12, div_y), color=(0.90, 0.92, 0.96), width=0.5)

                ar_rect = fitz.Rect(right_left + 12, div_y + 1, right_left + right_w - 12, curr_y + card_h - 2)
                f_ar = 10.0 if num_sents <= 7 else 9.0
                page.insert_textbox(ar_rect, ar_text, fontname="ArialBold", fontsize=f_ar, color=(0.10, 0.35, 0.75), lineheight=1.2, align=fitz.TEXT_ALIGN_RIGHT)

                curr_y += card_h + gap

            # Footer
            footer_line = fitz.Rect(30, page_h - 22, page_w - 30, page_h - 21)
            page.draw_rect(footer_line, color=None, fill=(0.88, 0.9, 0.94))
            ft = shape_ar("منصة لِـثْ • السلايد المدمج (النص الإنجليزي والترجمة العربية معاً)")
            page.insert_text(fitz.Point(page_w - 320, page_h - 10), ft, fontname="ArialArabic", fontsize=8, color=(0.5, 0.55, 0.65))
            page.insert_text(fitz.Point(30, page_h - 10), f"Slide {page_rec.page_number} / {file_rec.page_count}", fontsize=8.5, color=(0.5, 0.55, 0.65))

        os.makedirs(os.path.dirname(output_pdf_path), exist_ok=True)
        doc.save(output_pdf_path, deflate=True, garbage=4)
        doc.close()
        return output_pdf_path

