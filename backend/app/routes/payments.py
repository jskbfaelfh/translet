from datetime import datetime, timedelta, timezone
from flask import Blueprint, request, jsonify
from app.extensions import db
from app.models.user import User
from app.models.payment import Payment
from app.utils.auth import token_required, admin_required

payments_bp = Blueprint("payments", __name__, url_prefix="/api/payments")

@payments_bp.route("/submit", methods=["POST"])
@token_required
def submit_payment(current_user: User):
    data = request.get_json() or {}
    method = data.get("method", "zaincash")
    amount = float(data.get("amount", 10000.0))
    reference_number = data.get("reference_number", "").strip()
    receipt_image_url = data.get("receipt_image_url")

    if not reference_number:
        return jsonify({"error": "Reference number / transaction ID is required"}), 400

    payment = Payment(
        user_id=current_user.id,
        method=method,
        amount=amount,
        reference_number=reference_number,
        receipt_image_url=receipt_image_url,
        status="pending"
    )
    db.session.add(payment)
    db.session.commit()

    return jsonify({
        "message": "Payment receipt submitted successfully and is awaiting admin verification",
        "payment": payment.to_dict()
    }), 201


@payments_bp.route("/my-payments", methods=["GET"])
@token_required
def get_user_payments(current_user: User):
    payments = Payment.query.filter_by(user_id=current_user.id).order_by(Payment.created_at.desc()).all()
    return jsonify({"payments": [p.to_dict() for p in payments]}), 200


@payments_bp.route("/admin/pending", methods=["GET"])
@admin_required
def get_admin_pending_payments(current_user: User):
    pending = Payment.query.filter_by(status="pending").order_by(Payment.created_at.asc()).all()
    return jsonify({"pending_payments": [p.to_dict() for p in pending]}), 200


@payments_bp.route("/admin/<payment_id>/action", methods=["POST"])
@admin_required
def verify_payment(current_user: User, payment_id: str):
    data = request.get_json() or {}
    action = data.get("action")  # 'approve' or 'reject'

    if action not in ("approve", "reject"):
        return jsonify({"error": "Action must be 'approve' or 'reject'"}), 400

    payment = Payment.query.get(payment_id)
    if not payment:
        return jsonify({"error": "Payment not found"}), 404

    target_user = User.query.get(payment.user_id)
    if not target_user:
        return jsonify({"error": "User for this payment no longer exists"}), 404

    now = datetime.now(timezone.utc)
    payment.verified_by = current_user.id
    payment.verified_at = now

    if action == "approve":
        payment.status = "verified"
        target_user.subscription_status = "active"

        # Extend subscription
        existing_exp = target_user.subscription_expires_at
        if existing_exp and existing_exp.tzinfo is None:
            existing_exp = existing_exp.replace(tzinfo=timezone.utc)

        if existing_exp and existing_exp > now:
            target_user.subscription_expires_at = existing_exp + timedelta(days=payment.days_granted)
        else:
            target_user.subscription_expires_at = now + timedelta(days=payment.days_granted)

        # Reset free counter so student has clean slate
        target_user.free_pages_used = 0
    else:
        payment.status = "rejected"

    db.session.commit()

    return jsonify({
        "message": f"Payment successfully {payment.status}",
        "payment": payment.to_dict(),
        "user": target_user.to_dict()
    }), 200
