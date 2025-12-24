from flask import Flask
from flask_cors import CORS
import os

def create_app():
    app = Flask(__name__)

    allowed = os.getenv("CORS_ORIGIN", "http://localhost:5173")
    CORS(app, resources={r"/*": {"origins": allowed}}, supports_credentials=True)

    # ... tus blueprints/routes
    return app
