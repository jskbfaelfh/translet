import uuid
from datetime import datetime, timezone
from app.extensions import db

class File(db.Model):
    __tablename__ = "files"

    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    file_hash = db.Column(db.String(64), unique=True, nullable=False, index=True)
    page_count = db.Column(db.Integer, default=0)
    status = db.Column(db.String(20), default="queued")  # queued, processing, ready, failed
    error_message = db.Column(db.Text, nullable=True)
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))

    # Relationships
    pages = db.relationship("Page", back_populates="file", cascade="all, delete-orphan", order_by="Page.page_number")
    user_documents = db.relationship("UserDocument", back_populates="file")

    def to_dict(self):
        return {
            "id": self.id,
            "file_hash": self.file_hash,
            "page_count": self.page_count,
            "status": self.status,
            "error_message": self.error_message,
            "created_at": self.created_at.isoformat() if self.created_at else None
        }


class UserDocument(db.Model):
    __tablename__ = "user_documents"

    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = db.Column(db.String(36), db.ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    file_id = db.Column(db.String(36), db.ForeignKey("files.id", ondelete="CASCADE"), nullable=False, index=True)
    custom_title = db.Column(db.String(255), nullable=False)
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))

    # Relationships
    user = db.relationship("User", back_populates="documents")
    file = db.relationship("File", back_populates="user_documents")

    def to_dict(self):
        return {
            "id": self.id,
            "user_id": self.user_id,
            "file_id": self.file_id,
            "custom_title": self.custom_title,
            "status": self.file.status if self.file else "unknown",
            "page_count": self.file.page_count if self.file else 0,
            "created_at": self.created_at.isoformat() if self.created_at else None
        }


class Page(db.Model):
    __tablename__ = "pages"

    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    file_id = db.Column(db.String(36), db.ForeignKey("files.id", ondelete="CASCADE"), nullable=False, index=True)
    page_number = db.Column(db.Integer, nullable=False)
    image_url = db.Column(db.Text, nullable=False)
    width = db.Column(db.Float, default=0.0)
    height = db.Column(db.Float, default=0.0)

    # Relationships
    file = db.relationship("File", back_populates="pages")
    sentences = db.relationship("Sentence", back_populates="page", cascade="all, delete-orphan", order_by="Sentence.order_index")

    def to_dict(self):
        return {
            "id": self.id,
            "file_id": self.file_id,
            "page_number": self.page_number,
            "image_url": self.image_url,
            "width": self.width,
            "height": self.height,
            "sentences": [s.to_dict() for s in self.sentences]
        }


class Sentence(db.Model):
    __tablename__ = "sentences"

    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    page_id = db.Column(db.String(36), db.ForeignKey("pages.id", ondelete="CASCADE"), nullable=False, index=True)
    original_text = db.Column(db.Text, nullable=False)
    # bboxes: list of [{x, y, w, h}]
    bboxes = db.Column(db.JSON, nullable=False)
    order_index = db.Column(db.Integer, nullable=False)

    # Relationships
    page = db.relationship("Page", back_populates="sentences")
    translation = db.relationship("Translation", back_populates="sentence", uselist=False, cascade="all, delete-orphan")

    def to_dict(self):
        return {
            "id": self.id,
            "order_index": self.order_index,
            "original_text": self.original_text,
            "bboxes": self.bboxes,
            "translation": self.translation.translated_text if self.translation else ""
        }


class Translation(db.Model):
    __tablename__ = "translations"

    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    sentence_id = db.Column(db.String(36), db.ForeignKey("sentences.id", ondelete="CASCADE"), unique=True, nullable=False, index=True)
    translated_text = db.Column(db.Text, nullable=False)

    # Relationships
    sentence = db.relationship("Sentence", back_populates="translation")

    def to_dict(self):
        return {
            "id": self.id,
            "sentence_id": self.sentence_id,
            "translated_text": self.translated_text
        }
