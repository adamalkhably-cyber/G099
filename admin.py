from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required
from extensions import db
from models.user import User
from models.role import Role
from decorators import admin_required

admin_bp = Blueprint("admin", __name__)


@admin_bp.route("/users", methods=["GET"])
@admin_required
def list_users():
    """
    GET /api/admin/users
    Query params: page, per_page, role, is_active, search
    Admin only.
    """
    page     = request.args.get("page",     1,    type=int)
    per_page = request.args.get("per_page", 20,   type=int)
    role     = request.args.get("role",     None)
    active   = request.args.get("is_active", None)
    search   = request.args.get("search",   None)

    per_page = min(per_page, 100)  # cap at 100

    query = User.query.join(Role, isouter=True)

    if role:
        query = query.filter(Role.name == role)
    if active is not None:
        query = query.filter(User.is_active == (active.lower() == "true"))
    if search:
        like = f"%{search}%"
        query = query.filter(
            db.or_(
                User.username.ilike(like),
                User.email.ilike(like),
                User.first_name.ilike(like),
                User.last_name.ilike(like),
            )
        )

    pagination = query.order_by(User.created_at.desc()).paginate(
        page=page, per_page=per_page, error_out=False
    )

    return jsonify({
        "users":    [u.to_dict() for u in pagination.items],
        "total":    pagination.total,
        "page":     pagination.page,
        "pages":    pagination.pages,
        "per_page": pagination.per_page,
    }), 200


@admin_bp.route("/users/<int:user_id>", methods=["GET"])
@admin_required
def get_user(user_id):
    """GET /api/admin/users/<id> — Get a specific user's details."""
    user = User.query.get_or_404(user_id)
    return jsonify({"user": user.to_dict()}), 200


@admin_bp.route("/users/<int:user_id>/role", methods=["PUT"])
@admin_required
def assign_role(user_id):
    """
    PUT /api/admin/users/<id>/role
    Body: { role_name }
    Assign or change a user's role.
    """
    user = User.query.get_or_404(user_id)
    data = request.get_json(silent=True) or {}
    role_name = (data.get("role_name") or "").strip().lower()

    if not role_name:
        return jsonify({"error": "role_name is required."}), 422

    role = Role.query.filter_by(name=role_name).first()
    if not role:
        return jsonify({"error": f"Role '{role_name}' does not exist."}), 404

    old_role   = user.role.name if user.role else None
    user.role  = role
    db.session.commit()

    return jsonify({
        "message":  f"Role updated from '{old_role}' to '{role.name}'.",
        "user":     user.to_dict(),
    }), 200


@admin_bp.route("/users/<int:user_id>/activate", methods=["PATCH"])
@admin_required
def toggle_active(user_id):
    """
    PATCH /api/admin/users/<id>/activate
    Body: { is_active: true|false }
    Activate or deactivate a user.
    """
    user = User.query.get_or_404(user_id)
    data = request.get_json(silent=True) or {}

    if "is_active" not in data:
        return jsonify({"error": "is_active (boolean) is required."}), 422

    user.is_active = bool(data["is_active"])
    db.session.commit()

    state = "activated" if user.is_active else "deactivated"
    return jsonify({
        "message": f"User {state}.",
        "user":    user.to_dict(),
    }), 200


@admin_bp.route("/users/<int:user_id>", methods=["DELETE"])
@admin_required
def delete_user(user_id):
    """DELETE /api/admin/users/<id> — Permanently delete a user."""
    from flask_jwt_extended import get_jwt_identity
    current_id = get_jwt_identity()

    if user_id == current_id:
        return jsonify({"error": "You cannot delete your own account via admin panel."}), 403

    user = User.query.get_or_404(user_id)
    db.session.delete(user)
    db.session.commit()
    return jsonify({"message": f"User '{user.username}' permanently deleted."}), 200


@admin_bp.route("/stats", methods=["GET"])
@admin_required
def stats():
    """GET /api/admin/stats — Dashboard statistics."""
    total_users  = User.query.count()
    active_users = User.query.filter_by(is_active=True).count()
    roles        = Role.query.all()

    role_breakdown = {
        r.name: r.users.count() for r in roles
    }

    return jsonify({
        "total_users":    total_users,
        "active_users":   active_users,
        "inactive_users": total_users - active_users,
        "role_breakdown": role_breakdown,
    }), 200
