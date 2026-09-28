import hashlib
import os
import re
from typing import List, Dict, Any, Tuple
import fitz  # PyMuPDF

class PDFService:
    @staticmethod
    def calculate_file_hash(filepath: str) -> str:
        """Calculate SHA-256 hash of a file for cache deduplication."""
        hasher = hashlib.sha256()
        with open(filepath, "rb") as f:
            while chunk := f.read(65536):
                hasher.update(chunk)
        return hasher.hexdigest()

    @staticmethod
    def calculate_bytes_hash(file_bytes: bytes) -> str:
        """Calculate SHA-256 hash from in-memory bytes."""
        return hashlib.sha256(file_bytes).hexdigest()

    @staticmethod
    def render_page_to_image(page: fitz.Page, output_path: str, dpi: int = 150) -> Tuple[int, int]:
        """Render a PDF page to a PNG image with high crispness."""
        pix = page.get_pixmap(dpi=dpi)
        os.makedirs(os.path.dirname(output_path), exist_ok=True)
        pix.save(output_path)
        return pix.width, pix.height

    @staticmethod
    def extract_structured_page_content(page: fitz.Page) -> List[Dict[str, Any]]:
        """
        Extract text line-by-line. Each physical line on the PDF becomes its own
        independent chunk (sentence) with a single precise bbox. This ensures
        highlight boxes match exactly the text the user clicked — no more giant
        paragraph-wide blue blocks.

        Continuation lines (same block, same font, small vertical gap) are kept
        as separate chunks but their original_text shows the FULL readable line,
        making them independently translatable and precisely highlightable.
        """
        text_dict = page.get_text("dict")
        chunks = []
        sentence_index = 0

        bullet_start = re.compile(r"^([\u2022\u25E6\u25AA\u2023\-*■●◆·]|\d+[\.\)])\s+")

        for b in text_dict.get("blocks", []):
            if b.get("type") != 0:
                continue
            for l in b.get("lines", []):
                text = "".join(s.get("text", "") for s in l.get("spans", [])).strip()
                if not text:
                    continue

                # Skip footer / page-number lines near the very bottom
                if l["bbox"][1] > page.rect.height - 35:
                    continue

                # Skip small isolated slide-number badges at top (e.g. "1", "2")
                if text.isdigit() and len(text) <= 2 and l["bbox"][1] < 100:
                    continue

                x0, y0, x1, y1 = l["bbox"]
                bbox = {
                    "x": round(x0, 2),
                    "y": round(y0, 2),
                    "w": round(x1 - x0, 2),
                    "h": round(y1 - y0, 2)
                }

                chunks.append({
                    "order_index": sentence_index,
                    "original_text": text,
                    "bboxes": [bbox]   # always exactly ONE bbox per line
                })
                sentence_index += 1

        return chunks


    @classmethod
    def inspect_pdf(cls, filepath: str) -> Dict[str, Any]:
        """Inspect page count and dimensions without full rendering."""
        doc = fitz.open(filepath)
        page_count = len(doc)
        first_page_dims = (doc[0].rect.width, doc[0].rect.height) if page_count > 0 else (0, 0)
        doc.close()
        return {
            "page_count": page_count,
            "width": first_page_dims[0],
            "height": first_page_dims[1]
        }
