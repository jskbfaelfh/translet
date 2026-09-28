import os
import shutil
from typing import Optional
from app.config import Config

class StorageService:
    def __init__(self):
        self.use_local = Config.USE_LOCAL_STORAGE or not (
            Config.R2_ACCESS_KEY_ID and Config.R2_SECRET_ACCESS_KEY and Config.R2_ACCOUNT_ID
        )
        self.local_base_dir = Config.PAGE_IMAGES_FOLDER
        os.makedirs(self.local_base_dir, exist_ok=True)

        self.s3_client = None
        if not self.use_local:
            try:
                import boto3
                endpoint_url = f"https://{Config.R2_ACCOUNT_ID}.r2.cloudflarestorage.com"
                self.s3_client = boto3.client(
                    "s3",
                    endpoint_url=endpoint_url,
                    aws_access_key_id=Config.R2_ACCESS_KEY_ID,
                    aws_secret_access_key=Config.R2_SECRET_ACCESS_KEY,
                    region_name="auto"
                )
            except Exception as e:
                print(f"[StorageService] Failed to initialize R2 S3 client: {e}. Falling back to local storage.")
                self.use_local = True

    def save_page_image(self, file_id: str, page_number: int, source_image_path: str) -> str:
        """
        Saves the rendered page image to local storage or Cloudflare R2.
        Returns the accessible URL for the image.
        """
        filename = f"{file_id}_page_{page_number}.png"

        if self.use_local or not self.s3_client:
            dest_dir = os.path.join(self.local_base_dir, file_id)
            os.makedirs(dest_dir, exist_ok=True)
            dest_path = os.path.join(dest_dir, filename)
            if source_image_path != dest_path:
                shutil.copyfile(source_image_path, dest_path)
            # URL served by Flask API
            return f"/api/storage/{file_id}/{filename}"

        # Upload to Cloudflare R2
        object_key = f"pages/{file_id}/{filename}"
        with open(source_image_path, "rb") as f:
            self.s3_client.upload_fileobj(
                f,
                Config.R2_BUCKET_NAME,
                object_key,
                ExtraArgs={"ContentType": "image/png"}
            )

        if Config.R2_PUBLIC_DOMAIN:
            return f"{Config.R2_PUBLIC_DOMAIN.rstrip('/')}/{object_key}"
        return f"https://{Config.R2_ACCOUNT_ID}.r2.cloudflarestorage.com/{Config.R2_BUCKET_NAME}/{object_key}"
