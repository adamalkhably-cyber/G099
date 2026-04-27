from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required
from extensions import db
from models.role import Role
from decorators import admin_required

roles_bp = Blueprint("roles", __name__)


@roles_bp.route("/", methods=["GET"])
@jwt_required()
def list_roles():
    """GET /api/roles/ — List all roles (any authenticated user)."""
    roles = Role.query.order_by(Role.id).all()
    return jsonify({"roles": [r.to_dict() for r in roles]}), 200


@roles_bp.route("/", methods=["POST"])
@admin_required
def create_role():
    """
    POST /api/roles/
    Body: { name, description? }
    Admin only.
    """
    data = request.get_json(silent=True) or {}
    name = (data.get("name") or "").strip().lower()
    desc = (data.get("description") or "").strip()

    if not name:
        return jsonify({"error": "Role name is required."}), 422
    if Role.query.filter_by(name=name).first():
        return jsonify({"error": f"Role '{name}' already exists."}), 409

    role = Role(name=name, description=desc or None)
    db.session.add(role)
    db.session.commit()
    return jsonify({"message": "Role created.", "role": role.to_dict()}), 201


@roles_bp.route("/<int:role_id>", methods=["GET"])
@jwt_required()
def get_role(role_id):
    """GET /api/roles/<id> — Get role details and user count."""
    role = Role.query.get_or_404(role_id)
    data = role.to_dict()
    data["user_count"] = role.users.count()
    return jsonify({"role": data}), 200


@roles_bp.route("/<int:role_id>", methods=["PUT"])
@admin_required
def update_role(role_id):
    """
    PUT /api/roles/<id>
    Body: { description? }
    Admin only. (Name is immutable to protect seeded roles.)
    """
    role = Role.query.get_or_404(role_id)
    data = request.get_json(silent=True) or {}

    if "description" in data:
        role.description = (data["description"] or "").strip() or None

    db.session.commit()
    return jsonify({"message": "Role updated.", "role": role.to_dict()}), 200


@roles_bp.route("/<int:role_id>", methods=["DELETE"])
@admin_required
def delete_role(role_id):
    """
    DELETE /api/roles/<id>
    Admin only. Protected roles (admin, user) cannot be deleted.
    """
    role = Role.query.get_or_404(role_id)
    protected = {"admin", "user"}
    if role.name in protected:
        return jsonify({"error": f"Role '{role.name}' is protected and cannot be deleted."}), 403
    if role.users.count() > 0:
        return jsonify({
            "error": "Cannot delete a role that is assigned to users.",
            "user_count": role.users.count(),
        }), 409

    db.session.delete(role)
    db.session.commit()
    return jsonify({"message": f"Role '{role.name}' deleted."}), 200
