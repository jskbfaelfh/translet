from flask import Blueprint, request, jsonify
from app.extensions import db
from app.models.user import User
from app.utils.auth import generate_token, token_required

auth_bp = Blueprint("auth", __name__, url_prefix="/api/auth")

@auth_bp.route("/register", methods=["POST"])
def register():
    data = request.get_json() or {}
    identifier = data.get("phone_or_email", "").strip()
    password = data.get("password", "").strip()

    if not identifier or not password:
        return jsonify({"error": "Phone/Email and password are required"}), 400

    if len(password) < 6:
        return jsonify({"error": "Password must be at least 6 characters"}), 400

    existing_user = User.query.filter_by(phone_or_email=identifier).first()
    if existing_user:
        return jsonify({"error": "An account with this phone/email already exists"}), 409

    # Determine role: first registered user or admin email can be admin
    is_first_user = User.query.count() == 0
    role = "admin" if is_first_user else "student"

    new_user = User(phone_or_email=identifier, role=role)
    new_user.set_password(password)
    db.session.add(new_user)
    db.session.commit()

    token = generate_token(new_user)
    return jsonify({
        "message": "User registered successfully",
        "token": token,
        "user": new_user.to_dict()
    }), 201


@auth_bp.route("/login", methods=["POST"])
def login():
    data = request.get_json() or {}
    identifier = data.get("phone_or_email", "").strip()
    password = data.get("password", "").strip()

    if not identifier or not password:
        return jsonify({"error": "Phone/Email and password are required"}), 400

    user = User.query.filter_by(phone_or_email=identifier).first()
    if not user or not user.check_password(password):
        return jsonify({"error": "Invalid credentials"}), 401

    token = generate_token(user)
    return jsonify({
        "message": "Login successful",
        "token": token,
        "user": user.to_dict()
    }), 200


@auth_bp.route("/me", methods=["GET"])
@token_required
def get_current_user(current_user: User):
    return jsonify({"user": current_user.to_dict()}), 200
