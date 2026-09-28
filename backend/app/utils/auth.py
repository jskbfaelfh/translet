from functools import wraps
from datetime import datetime, timedelta, timezone
import jwt
from flask import request, jsonify, current_app
from app.models.user import User

def generate_token(user: User, expires_in_days: int = 30) -> str:
    payload = {
        "sub": user.id,
        "role": user.role,
        "phone_or_email": user.phone_or_email,
        "exp": datetime.now(timezone.utc) + timedelta(days=expires_in_days)
    }
    return jwt.encode(payload, current_app.config["JWT_SECRET_KEY"], algorithm="HS256")


def decode_token(token: str):
    try:
        return jwt.decode(token, current_app.config["JWT_SECRET_KEY"], algorithms=["HS256"])
    except jwt.ExpiredSignatureError:
        return None
    except jwt.InvalidTokenError:
        return None


def token_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        auth_header = request.headers.get("Authorization")
        if not auth_header or not auth_header.startswith("Bearer "):
            return jsonify({"error": "Missing or invalid authorization header"}), 401

        token = auth_header.split(" ")[1]
        payload = decode_token(token)
        if not payload:
            return jsonify({"error": "Token is invalid or expired"}), 401

        current_user = User.query.get(payload["sub"])
        if not current_user:
            return jsonify({"error": "User not found"}), 401

        return f(current_user, *args, **kwargs)
    return decorated


def admin_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        auth_header = request.headers.get("Authorization")
        if not auth_header or not auth_header.startswith("Bearer "):
            return jsonify({"error": "Missing authorization header"}), 401

        token = auth_header.split(" ")[1]
        payload = decode_token(token)
        if not payload or payload.get("role") != "admin":
            return jsonify({"error": "Admin privileges required"}), 403

        current_user = User.query.get(payload["sub"])
        if not current_user or current_user.role != "admin":
            return jsonify({"error": "Admin access forbidden"}), 403

        return f(current_user, *args, **kwargs)
    return decorated
