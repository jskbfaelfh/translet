from flask import Flask, jsonify
from app.config import Config
from app.extensions import db, cors

def create_app(config_class=Config):
    app = Flask(__name__)
    app.config.from_object(config_class)

    # Initialize extensions
    db.init_app(app)
    # CORS: allow dev localhost + production frontend domain
    frontend_url = os.environ.get("FRONTEND_URL", "")
    allowed_origins = ["http://localhost:5173", "http://localhost:3000"]
    if frontend_url:
        allowed_origins.append(frontend_url)
    cors.init_app(app, resources={r"/api/*": {"origins": allowed_origins}})


    # Register blueprints
    from app.routes.auth import auth_bp
    from app.routes.documents import documents_bp
    from app.routes.payments import payments_bp
    from app.routes.storage import storage_bp

    app.register_blueprint(auth_bp)
    app.register_blueprint(documents_bp)
    app.register_blueprint(payments_bp)
    app.register_blueprint(storage_bp)

    @app.route("/api/health", methods=["GET"])
    def health():
        return jsonify({"status": "healthy", "version": "2.0.0"}), 200

    # Auto-create tables for development
    with app.app_context():
        db.create_all()

    return app
