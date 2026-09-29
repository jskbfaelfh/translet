import os
from pathlib import Path
from dotenv import load_dotenv

BASE_DIR = Path(__file__).resolve().parent.parent
load_dotenv(BASE_DIR / ".env")

class Config:
    SECRET_KEY = os.getenv("SECRET_KEY", "default-secret-key")
    JWT_SECRET_KEY = os.getenv("JWT_SECRET_KEY", "default-jwt-secret-key")
    
    # DB configuration
    db_url = os.getenv("DATABASE_URL", "sqlite:///lith_dev.db")
    if db_url.startswith("postgres://"):
        db_url = db_url.replace("postgres://", "postgresql+psycopg2://", 1)
    elif db_url.startswith("postgresql://") and not db_url.startswith("postgresql+"):
        db_url = db_url.replace("postgresql://", "postgresql+psycopg2://", 1)
    SQLALCHEMY_DATABASE_URI = db_url
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    
    # Redis configuration
    REDIS_URL = os.getenv("REDIS_URL", "redis://localhost:6379/0")
    
    # Upload and static folders
    UPLOAD_FOLDER = os.path.join(BASE_DIR, os.getenv("UPLOAD_FOLDER", "uploads"))
    PAGE_IMAGES_FOLDER = os.path.join(BASE_DIR, os.getenv("PAGE_IMAGES_FOLDER", "page_images"))
    
    # Cloudflare R2 / S3
    R2_ACCOUNT_ID = os.getenv("R2_ACCOUNT_ID")
    R2_ACCESS_KEY_ID = os.getenv("R2_ACCESS_KEY_ID")
    R2_SECRET_ACCESS_KEY = os.getenv("R2_SECRET_ACCESS_KEY")
    R2_BUCKET_NAME = os.getenv("R2_BUCKET_NAME", "lecture-slides")
    R2_PUBLIC_DOMAIN = os.getenv("R2_PUBLIC_DOMAIN")
    
    # Fallback flags
    USE_LOCAL_STORAGE = os.getenv("USE_LOCAL_STORAGE", "True").lower() in ("true", "1", "yes")
    USE_MOCK_TRANSLATION_FALLBACK = os.getenv("USE_MOCK_TRANSLATION_FALLBACK", "True").lower() in ("true", "1", "yes")
    
    # Limits
    FREE_PAGES_LIMIT = int(os.getenv("FREE_PAGES_LIMIT", "15"))
    MAX_CONTENT_LENGTH = 30 * 1024 * 1024  # 30 MB max upload
