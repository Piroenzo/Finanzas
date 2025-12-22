from datetime import datetime
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from .extensions import db
from .models import Transaction, Category

bp = Blueprint("transactions", __name__, url_prefix="/transactions")

def parse_month(month_str: str):
    # formato "YYYY-MM"
    dt = datetime.strptime(month_str, "%Y-%m")
    start = dt.replace(day=1).date()
    if dt.month == 12:
        end = dt.replace(year=dt.year + 1, month=1, day=1).date()
    else:
        end = dt.replace(month=dt.month + 1, day=1).date()
    return start, end

@bp.get("")
@jwt_required()
def list_transactions():
    user_id = int(get_jwt_identity())
    month = request.args.get("month")  # "2025-12"
    q = Transaction.query.filter_by(user_id=user_id).order_by(Transaction.date.desc(), Transaction.id.desc())

    if month:
        start, end = parse_month(month)
        q = q.filter(Transaction.date >= start, Transaction.date < end)

    rows = q.all()
    return jsonify([
        {
            "id": t.id,
            "type": t.type,
            "amount": float(t.amount),
            "date": t.date.isoformat(),
            "note": t.note,
            "category_id": t.category_id,
        }
        for t in rows
    ])

@bp.post("")
@jwt_required()
def create_transaction():
    user_id = int(get_jwt_identity())
    data = request.get_json() or {}

    ttype = (data.get("type") or "").strip().lower()
    amount = data.get("amount")
    date_str = data.get("date")  # "YYYY-MM-DD"
    note = (data.get("note") or "").strip() or None
    category_id = data.get("category_id")

    if ttype not in ("income", "expense"):
        return jsonify(error="type debe ser income|expense"), 400
    if amount is None:
        return jsonify(error="amount es obligatorio"), 400
    try:
        amount = float(amount)
        if amount <= 0:
            raise ValueError()
    except Exception:
        return jsonify(error="amount debe ser número > 0"), 400

    try:
        tdate = datetime.strptime(date_str, "%Y-%m-%d").date() if date_str else datetime.utcnow().date()
    except Exception:
        return jsonify(error="date inválida (YYYY-MM-DD)"), 400

    if category_id is not None:
        cat = Category.query.filter_by(id=category_id, user_id=user_id).first()
        if not cat:
            return jsonify(error="category_id inválido"), 400

    tx = Transaction(
        user_id=user_id,
        type=ttype,
        amount=amount,
        date=tdate,
        note=note,
        category_id=category_id
    )
    db.session.add(tx)
    db.session.commit()

    return jsonify({"id": tx.id}), 201

@bp.delete("/<int:tx_id>")
@jwt_required()
def delete_transaction(tx_id: int):
    user_id = int(get_jwt_identity())
    tx = Transaction.query.filter_by(id=tx_id, user_id=user_id).first()
    if not tx:
        return jsonify(error="no encontrado"), 404
    db.session.delete(tx)
    db.session.commit()
    return jsonify(message="ok")
