from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from .extensions import db
from .models import Category

bp = Blueprint("categories", __name__, url_prefix="/categories")

@bp.get("")
@jwt_required()
def list_categories():
    user_id = int(get_jwt_identity())
    rows = Category.query.filter_by(user_id=user_id).order_by(Category.type, Category.name).all()
    return jsonify([
        {"id": c.id, "name": c.name, "type": c.type}
        for c in rows
    ])

@bp.post("")
@jwt_required()
def create_category():
    user_id = int(get_jwt_identity())
    data = request.get_json() or {}
    name = (data.get("name") or "").strip()
    ctype = (data.get("type") or "").strip().lower()

    if not name or ctype not in ("income", "expense"):
        return jsonify(error="name y type (income|expense) son obligatorios"), 400

    cat = Category(user_id=user_id, name=name, type=ctype)
    db.session.add(cat)
    try:
        db.session.commit()
    except Exception:
        db.session.rollback()
        return jsonify(error="categoría duplicada o inválida"), 409

    return jsonify({"id": cat.id, "name": cat.name, "type": cat.type}), 201
