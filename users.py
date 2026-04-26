from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from extensions import db
from models.user import User
from decorators import active_required

users_bp = Blueprint("users", __name__)


@users_bp.route("/profile", methods=["GET"])
@jwt_required()
@active_required
def get_profile():
    """GET /api/users/profile — Get current user's full profile."""
    user = User.query.get(get_jwt_identity())
    return jsonify({"user": user.to_dict()}), 200


@users_bp.route("/profile", methods=["PUT"])
@jwt_required()
@active_required
def update_profile():
    """
    PUT /api/users/profile
    Body: { first_name?, last_name?, username? }
    """
    user = User.query.get(get_jwt_identity())
    data = request.get_json(silent=True) or {}

    if "first_name" in data:
        user.first_name = (data["first_name"] or "").strip() or None
    if "last_name" in data:
        user.last_name  = (data["last_name"]  or "").strip() or None
    if "username" in data:
        new_username = (data["username"] or "").strip()
        if len(new_username) < 3:
            return jsonify({"error": "Username must be at least 3 characters."}), 422
        existing = User.query.filter_by(username=new_username).first()
        if existing and existing.id != user.id:
            return jsonify({"error": "Username already taken."}), 409
        user.username = new_username

    db.session.commit()
    return jsonify({"message": "Profile updated.", "user": user.to_dict()}), 200


@users_bp.route("/deactivate", methods=["DELETE"])
@jwt_required()
@active_required
def deactivate_account():
    """DELETE /api/users/deactivate — Self-deactivate account."""
    user = User.query.get(get_jwt_identity())
    user.is_active = False
    db.session.commit()
    return jsonify({"message": "Account deactivated."}), 200
