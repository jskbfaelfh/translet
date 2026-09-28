import os
import re
from typing import List, Dict
from deep_translator import MyMemoryTranslator
from app.config import Config

class TranslationService:
    def __init__(self):
        self.google_client = None
        self._init_google_client()
        self.mymemory = MyMemoryTranslator(source="en-US", target="ar-SA")
        self._memory_cache: Dict[str, str] = {}

    def _init_google_client(self):
        cred_path = os.getenv("GOOGLE_APPLICATION_CREDENTIALS")
        if cred_path and os.path.exists(cred_path):
            try:
                from google.cloud import translate_v2 as translate
                self.google_client = translate.Client()
            except Exception as e:
                print(f"[TranslationService] Could not init Google Cloud Translate Client: {e}")
                self.google_client = None

    def translate_batch(self, texts: List[str], target_language: str = "ar") -> List[str]:
        """
        Translates a batch of texts to Arabic.
        """
        if not texts:
            return []

        # 1. Use official Google Cloud Translation API if configured
        if self.google_client:
            try:
                results = self.google_client.translate(
                    texts,
                    target_language=target_language,
                    source_language="en",
                    format_="text"
                )
                if isinstance(results, dict):
                    return [results["translatedText"]]
                return [r["translatedText"] for r in results]
            except Exception as e:
                print(f"[TranslationService] Google Cloud API error: {e}. Falling back to MyMemory engine.")

        # 2. Use MyMemoryTranslator with in-memory caching and bullet cleaning
        translated_results = []
        for text in texts:
            cleaned = text.strip()
            if not cleaned:
                translated_results.append("")
                continue

            if cleaned in self._memory_cache:
                translated_results.append(self._memory_cache[cleaned])
                continue

            # Strip leading bullets (•, -, *, etc.) before translating
            text_for_trans = re.sub(r"^[\u2022\u25E6\u25AA\u2023\-*■●◆]\s*", "", cleaned).strip()

            try:
                trans = self.mymemory.translate(text_for_trans)
                if trans and not trans.lower().startswith("mymemory warning"):
                    self._memory_cache[cleaned] = trans
                    translated_results.append(trans)
                else:
                    self._memory_cache[cleaned] = cleaned
                    translated_results.append(cleaned)
            except Exception as e:
                print(f"[TranslationService] MyMemory error on '{text_for_trans[:30]}...': {e}")
                self._memory_cache[cleaned] = cleaned
                translated_results.append(cleaned)

        return translated_results
