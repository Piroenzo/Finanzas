from flask import Blueprint, request, jsonify
from flask_jwt_extended import create_access_token
from .extensions import db
from .models import User

bp = Blueprint("auth", __name__, url_prefix="/auth")

@bp.post("/register")
def register():
    data = request.get_json() or {}
    email = (data.get("email") or "").strip().lower()
    password = data.get("password") or ""

    if not email or not password:
        return jsonify(error="email y password son obligatorios"), 400

    if User.query.filter_by(email=email).first():
        return jsonify(error="email ya registrado"), 409

    user = User(email=email)
    user.set_password(password)
    db.session.add(user)
    db.session.commit()

    token = create_access_token(identity=str(user.id))
    return jsonify(message="ok", access_token=token), 201

@bp.post("/login")
def login():
    data = request.get_json() or {}
    email = (data.get("email") or "").strip().lower()
    password = data.get("password") or ""

    user = User.query.filter_by(email=email).first()
    if not user or not user.check_password(password):
        return jsonify(error="credenciales inválidas"), 401

    token = create_access_token(identity=str(user.id))
    return jsonify(message="ok", access_token=token), 200
