from functools import wraps
from flask import jsonify
from flask_jwt_extended import get_jwt_identity, verify_jwt_in_request
from models.user import User


def roles_required(*role_names):
    """Decorator: user must have one of the listed roles."""
    def decorator(fn):
        @wraps(fn)
        def wrapper(*args, **kwargs):
            verify_jwt_in_request()
            user_id = get_jwt_identity()
            user = User.query.get(user_id)

            if not user or not user.is_active:
                return jsonify({"error": "Account not found or inactive."}), 403

            if user.role is None or user.role.name not in role_names:
                return jsonify({
                    "error": "Insufficient permissions.",
                    "required_roles": list(role_names),
                    "your_role": user.role.name if user.role else None,
                }), 403

            return fn(*args, **kwargs)
        return wrapper
    return decorator


def admin_required(fn):
    """Shortcut decorator for admin-only endpoints."""
    return roles_required("admin")(fn)


def active_required(fn):
    """Decorator: user must be active."""
    @wraps(fn)
    def wrapper(*args, **kwargs):
        verify_jwt_in_request()
        user_id = get_jwt_identity()
        user = User.query.get(user_id)
        if not user or not user.is_active:
            return jsonify({"error": "Account is inactive or does not exist."}), 403
        return fn(*args, **kwargs)
    return wrapper
