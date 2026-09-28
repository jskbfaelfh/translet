import os
import uuid
from flask import Blueprint, request, jsonify, current_app, send_from_directory, send_file
from werkzeug.utils import secure_filename
from app.extensions import db
from app.models.user import User
from app.models.document import File, UserDocument, Page
from app.utils.auth import token_required
from app.services.pdf_service import PDFService
from app.services.pdf_export_service import PDFExportService
from app.tasks.worker import enqueue_pdf_processing

documents_bp = Blueprint("documents", __name__, url_prefix="/api/documents")

@documents_bp.route("/upload", methods=["POST"])
@token_required
def upload_document(current_user: User):
    if "file" not in request.files:
        return jsonify({"error": "No file part in the request"}), 400

    file_obj = request.files["file"]
    if file_obj.filename == "":
        return jsonify({"error": "No selected file"}), 400

    if not file_obj.filename.lower().endswith(".pdf"):
        return jsonify({"error": "Only PDF files are supported"}), 400

    filename = secure_filename(file_obj.filename)
    custom_title = request.form.get("title", filename.rsplit(".", 1)[0])

    # Save to temp path
    upload_folder = current_app.config["UPLOAD_FOLDER"]
    os.makedirs(upload_folder, exist_ok=True)
    temp_save_path = os.path.join(upload_folder, f"{uuid.uuid4()}_{filename}")
    file_obj.save(temp_save_path)

    try:
        # 1. Compute SHA-256 Hash
        file_hash = PDFService.calculate_file_hash(temp_save_path)

        # 2. Check if already processed and cached
        existing_file = File.query.filter_by(file_hash=file_hash).first()

        if existing_file and existing_file.status == "ready":
            # Document already processed and ready in cache! Instant reuse!
            user_doc = UserDocument(
                user_id=current_user.id,
                file_id=existing_file.id,
                custom_title=custom_title
            )
            db.session.add(user_doc)
            db.session.commit()

            # Clean up uploaded duplicate file
            if os.path.exists(temp_save_path):
                os.remove(temp_save_path)

            return jsonify({
                "message": "File matched existing cache and is ready immediately!",
                "cached": True,
                "document": user_doc.to_dict(),
                "file": existing_file.to_dict()
            }), 200

        # Check quota for new file
        inspect_data = PDFService.inspect_pdf(temp_save_path)
        page_count = inspect_data["page_count"]

        if not current_user.can_process_pages(page_count, current_app.config["FREE_PAGES_LIMIT"]):
            if os.path.exists(temp_save_path):
                os.remove(temp_save_path)
            return jsonify({
                "error": f"This document has {page_count} pages, which exceeds your remaining free quota ({current_app.config['FREE_PAGES_LIMIT'] - current_user.free_pages_used} pages). Please upgrade your subscription.",
                "page_count": page_count,
                "free_pages_used": current_user.free_pages_used,
                "limit": current_app.config["FREE_PAGES_LIMIT"]
            }), 403

        # 3. Create File record & UserDocument
        if not existing_file:
            new_file = File(
                file_hash=file_hash,
                page_count=page_count,
                status="queued"
            )
            db.session.add(new_file)
            db.session.flush()
            target_file_id = new_file.id
        else:
            target_file_id = existing_file.id

        user_doc = UserDocument(
            user_id=current_user.id,
            file_id=target_file_id,
            custom_title=custom_title
        )
        db.session.add(user_doc)

        # Increment free quota used if student is not subscribed
        if not current_user.is_subscribed and current_user.role != "admin":
            current_user.free_pages_used += page_count

        db.session.commit()

        # 4. Enqueue background processing
        enqueue_pdf_processing(
            current_app._get_current_object(),
            target_file_id,
            temp_save_path
        )

        return jsonify({
            "message": "File uploaded and background processing started",
            "cached": False,
            "document": user_doc.to_dict(),
            "file_id": target_file_id
        }), 202

    except Exception as e:
        if os.path.exists(temp_save_path):
            os.remove(temp_save_path)
        raise e


@documents_bp.route("", methods=["GET"])
@token_required
def get_user_documents(current_user: User):
    docs = UserDocument.query.filter_by(user_id=current_user.id).order_by(UserDocument.created_at.desc()).all()
    return jsonify({"documents": [d.to_dict() for d in docs]}), 200


@documents_bp.route("/<doc_id>", methods=["GET"])
@token_required
def get_document_status(current_user: User, doc_id: str):
    user_doc = UserDocument.query.filter_by(id=doc_id, user_id=current_user.id).first()
    if not user_doc:
        return jsonify({"error": "Document not found"}), 404

    return jsonify({
        "document": user_doc.to_dict(),
        "file": user_doc.file.to_dict() if user_doc.file else None
    }), 200


@documents_bp.route("/<doc_id>/pages/<int:page_number>", methods=["GET"])
@token_required
def get_document_page(current_user: User, doc_id: str, page_number: int):
    user_doc = UserDocument.query.filter_by(id=doc_id, user_id=current_user.id).first()
    if not user_doc:
        return jsonify({"error": "Document not found"}), 404

    page = Page.query.filter_by(file_id=user_doc.file_id, page_number=page_number).first()
    if not page:
        return jsonify({"error": f"Page {page_number} not found or still processing"}), 404

    return jsonify({
        "page": page.to_dict(),
        "total_pages": user_doc.file.page_count
    }), 200


@documents_bp.route("/<doc_id>", methods=["DELETE"])
@token_required
def delete_document(current_user: User, doc_id: str):
    user_doc = UserDocument.query.filter_by(id=doc_id, user_id=current_user.id).first()
    if not user_doc:
        return jsonify({"error": "Document not found"}), 404

    db.session.delete(user_doc)
    db.session.commit()
    return jsonify({"message": "Document removed from your library"}), 200


@documents_bp.route("/<doc_id>/export-pdf", methods=["GET"])
@token_required
def export_document_pdf(current_user: User, doc_id: str):
    user_doc = UserDocument.query.filter_by(id=doc_id, user_id=current_user.id).first()
    if not user_doc:
        return jsonify({"error": "Document not found"}), 404

    if not user_doc.file or user_doc.file.status != "ready":
        return jsonify({"error": "Document is still processing"}), 400

    mode = request.args.get("mode", "bilingual") # 'bilingual' or 'translation_only'

    exports_dir = os.path.join(current_app.root_path, "..", "exports")
    os.makedirs(exports_dir, exist_ok=True)
    out_pdf_path = os.path.join(exports_dir, f"{user_doc.id}_{mode}.pdf")

    clean_filename = secure_filename(user_doc.custom_title) or "lecture"

    if mode == "translation_only":
        PDFExportService.generate_translation_only_pdf(user_doc, out_pdf_path)
        dl_name = f"{clean_filename}_الترجمة_فقط.pdf"
    else:
        PDFExportService.generate_bilingual_slides_pdf(user_doc, out_pdf_path)
        dl_name = f"{clean_filename}_السلايد_المدمج.pdf"

    return send_file(
        out_pdf_path,
        as_attachment=True,
        download_name=dl_name,
        mimetype="application/pdf"
    )


