import uuid
from datetime import datetime, timezone
import bcrypt
from app.extensions import db

class User(db.Model):
    __tablename__ = "users"

    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    phone_or_email = db.Column(db.String(120), unique=True, nullable=False, index=True)
    password_hash = db.Column(db.String(255), nullable=False)
    role = db.Column(db.String(20), default="student")  # 'student', 'admin'
    free_pages_used = db.Column(db.Integer, default=0)
    subscription_status = db.Column(db.String(20), default="none")  # 'none', 'active', 'expired'
    subscription_expires_at = db.Column(db.DateTime, nullable=True)
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))

    # Relationships
    documents = db.relationship("UserDocument", back_populates="user", cascade="all, delete-orphan")
    payments = db.relationship("Payment", back_populates="user", cascade="all, delete-orphan")

    def set_password(self, password: str):
        salt = bcrypt.gensalt()
        self.password_hash = bcrypt.hashpw(password.encode("utf-8"), salt).decode("utf-8")

    def check_password(self, password: str) -> bool:
        return bcrypt.checkpw(password.encode("utf-8"), self.password_hash.encode("utf-8"))

    @property
    def is_subscribed(self) -> bool:
        if self.role == "admin":
            return True
        if self.subscription_status == "active":
            if self.subscription_expires_at:
                exp = self.subscription_expires_at
                now = datetime.now(timezone.utc)
                if exp.tzinfo is None:
                    exp = exp.replace(tzinfo=timezone.utc)
                return exp > now
            return True
        return False

    def can_process_pages(self, requested_pages: int, free_limit: int = 15) -> bool:
        if self.is_subscribed or self.role == "admin":
            return True
        return (self.free_pages_used + requested_pages) <= free_limit

    def to_dict(self):
        return {
            "id": self.id,
            "phone_or_email": self.phone_or_email,
            "role": self.role,
            "free_pages_used": self.free_pages_used,
            "subscription_status": self.subscription_status,
            "is_subscribed": self.is_subscribed,
            "subscription_expires_at": self.subscription_expires_at.isoformat() if self.subscription_expires_at else None,
            "created_at": self.created_at.isoformat() if self.created_at else None
        }
