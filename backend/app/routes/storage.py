import os
from flask import Blueprint, send_from_directory, current_app, abort

storage_bp = Blueprint("storage", __name__, url_prefix="/api/storage")

@storage_bp.route("/<file_id>/<filename>", methods=["GET"])
def serve_image(file_id: str, filename: str):
    dir_path = os.path.join(current_app.config["PAGE_IMAGES_FOLDER"], file_id)
    if not os.path.exists(os.path.join(dir_path, filename)):
        abort(404)
    return send_from_directory(dir_path, filename)
