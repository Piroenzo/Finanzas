from flask import Flask, jsonify
from flask_cors import CORS
from .config import Config
from .extensions import db, jwt, migrate

from .auth import bp as auth_bp
from .categories import bp as categories_bp
from .transactions import bp as transactions_bp

def create_app():
    app = Flask(__name__)
    app.config.from_object(Config)

    CORS(app, resources={r"/*": {"origins": "*"}})

    db.init_app(app)
    jwt.init_app(app)
    migrate.init_app(app, db)

    app.register_blueprint(auth_bp)
    app.register_blueprint(categories_bp)
    app.register_blueprint(transactions_bp)

    @app.get("/health")
    def health():
        return jsonify(status="ok")

    return app
