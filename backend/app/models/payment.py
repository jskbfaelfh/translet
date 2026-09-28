import uuid
from datetime import datetime, timezone
from app.extensions import db

class Payment(db.Model):
    __tablename__ = "payments"

    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = db.Column(db.String(36), db.ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    method = db.Column(db.String(30), nullable=False)  # zaincash, asiahawala, fib
    amount = db.Column(db.Float, nullable=False)
    reference_number = db.Column(db.String(100), nullable=False)
    receipt_image_url = db.Column(db.Text, nullable=True)
    status = db.Column(db.String(20), default="pending")  # pending, verified, rejected
    verified_by = db.Column(db.String(36), nullable=True)
    days_granted = db.Column(db.Integer, default=30)
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))
    verified_at = db.Column(db.DateTime, nullable=True)

    # Relationships
    user = db.relationship("User", back_populates="payments")

    def to_dict(self):
        return {
            "id": self.id,
            "user_id": self.user_id,
            "user_identifier": self.user.phone_or_email if self.user else "Unknown",
            "method": self.method,
            "amount": self.amount,
            "reference_number": self.reference_number,
            "receipt_image_url": self.receipt_image_url,
            "status": self.status,
            "days_granted": self.days_granted,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "verified_at": self.verified_at.isoformat() if self.verified_at else None
        }
