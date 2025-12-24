from flask import Flask
from flask_cors import CORS
import os

def create_app():
    app = Flask(__name__)

    allowed = os.getenv("CORS_ORIGIN", "http://localhost:5173")
    CORS(app, resources={r"/*": {"origins": allowed}}, supports_credentials=True)

    # TODO: registrar blueprints / rutas
    # from .routes.auth import auth_bp
    # app.register_blueprint(auth_bp, url_prefix="/auth")

    return app

# 👇 ESTA LÍNEA ES LA CLAVE PARA GUNICORN
app = create_app()
