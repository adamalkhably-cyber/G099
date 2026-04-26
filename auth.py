from flask import Blueprint, request, jsonify
from flask_jwt_extended import (
    create_access_token, create_refresh_token,
    jwt_required, get_jwt_identity, get_jwt,
)
from extensions import db
from models.user import User
from models.role import Role
from models.refresh_token import RefreshToken
from datetime import datetime, timezone
from config import Config
import re

auth_bp = Blueprint("auth", __name__)


# ─────────────────────────────── helpers ────────────────────────────────

def _valid_email(email: str) -> bool:
    return bool(re.match(r"^[\w.+-]+@[\w-]+\.[a-zA-Z]{2,}$", email))

def _valid_password(pw: str) -> bool:
    """Min 8 chars, at least one upper, one lower, one digit."""
    return (
        len(pw) >= 8
        and any(c.isupper() for c in pw)
        and any(c.islower() for c in pw)
        and any(c.isdigit() for c in pw)
    )

def _store_refresh_token(jti: str, user_id: int):
    expires = datetime.now(timezone.utc) + Config.JWT_REFRESH_TOKEN_EXPIRES
    token = RefreshToken(jti=jti, user_id=user_id, expires_at=expires)
    db.session.add(token)
    db.session.commit()


# ─────────────────────────────── routes ─────────────────────────────────

@auth_bp.route("/register", methods=["POST"])
def register():
    """
    POST /api/auth/register
    Register a new user account.
    Body: { username, email, password, first_name?, last_name? }
    """
    data = request.get_json(silent=True) or {}
    errors = {}

    username   = (data.get("username")   or "").strip()
    email      = (data.get("email")      or "").strip().lower()
    password   = data.get("password",  "")
    first_name = (data.get("first_name") or "").strip()
    last_name  = (data.get("last_name")  or "").strip()

    if not username or len(username) < 3:
        errors["username"] = "Username must be at least 3 characters."
    if not _valid_email(email):
        errors["email"] = "Invalid email address."
    if not _valid_password(password):
        errors["password"] = (
            "Password must be at least 8 characters and include "
            "uppercase, lowercase, and a digit."
        )
    if errors:
        return jsonify({"errors": errors}), 422

    if User.query.filter_by(username=username).first():
        return jsonify({"error": "Username already taken."}), 409
    if User.query.filter_by(email=email).first():
        return jsonify({"error": "Email already registered."}), 409

    default_role = Role.query.filter_by(name="user").first()

    user = User(
        username=username,
        email=email,
        first_name=first_name or None,
        last_name=last_name  or None,
        role=default_role,
    )
    user.password = password
    db.session.add(user)
    db.session.commit()

    access_token  = create_access_token(identity=user.id)
    refresh_token = create_refresh_token(identity=user.id)
    jti = get_jwt()  # won't work here — parse manually
    # Store refresh jti
    from flask_jwt_extended.utils import decode_token
    decoded = decode_token(refresh_token)
    _store_refresh_token(decoded["jti"], user.id)

    return jsonify({
        "message":       "Account created successfully.",
        "user":          user.to_dict(),
        "access_token":  access_token,
        "refresh_token": refresh_token,
    }), 201


@auth_bp.route("/login", methods=["POST"])
def login():
    """
    POST /api/auth/login
    Authenticate with email/username + password.
    Body: { identifier, password }   (identifier = email OR username)
    """
    data       = request.get_json(silent=True) or {}
    identifier = (data.get("identifier") or "").strip().lower()
    password   = data.get("password", "")

    if not identifier or not password:
        return jsonify({"error": "identifier and password are required."}), 400

    # Try email first, then username
    user = (
        User.query.filter_by(email=identifier).first()
        or User.query.filter(
            db.func.lower(User.username) == identifier
        ).first()
    )

    if not user or not user.verify_password(password):
        return jsonify({"error": "Invalid credentials."}), 401

    if not user.is_active:
        return jsonify({"error": "Account is deactivated. Contact support."}), 403

    # Update last login
    user.last_login_at = datetime.now(timezone.utc)
    db.session.commit()

    access_token  = create_access_token(identity=user.id)
    refresh_token = create_refresh_token(identity=user.id)

    from flask_jwt_extended.utils import decode_token
    decoded = decode_token(refresh_token)
    _store_refresh_token(decoded["jti"], user.id)

    return jsonify({
        "message":       "Login successful.",
        "user":          user.to_dict(),
        "access_token":  access_token,
        "refresh_token": refresh_token,
    }), 200


@auth_bp.route("/refresh", methods=["POST"])
@jwt_required(refresh=True)
def refresh():
    """
    POST /api/auth/refresh
    Issue a new access token using a valid refresh token.
    """
    jti     = get_jwt()["jti"]
    user_id = get_jwt_identity()

    stored = RefreshToken.query.filter_by(jti=jti).first()
    if not stored or not stored.is_valid():
        return jsonify({"error": "Refresh token is invalid or expired."}), 401

    new_access = create_access_token(identity=user_id)
    return jsonify({"access_token": new_access}), 200


@auth_bp.route("/logout", methods=["DELETE"])
@jwt_required(refresh=True)
def logout():
    """
    DELETE /api/auth/logout
    Revoke the current refresh token (logout current device).
    """
    jti    = get_jwt()["jti"]
    stored = RefreshToken.query.filter_by(jti=jti).first()
    if stored:
        stored.revoked = True
        db.session.commit()
    return jsonify({"message": "Logged out successfully."}), 200


@auth_bp.route("/logout-all", methods=["DELETE"])
@jwt_required()
def logout_all():
    """
    DELETE /api/auth/logout-all
    Revoke ALL refresh tokens for the current user (logout all devices).
    """
    user_id = get_jwt_identity()
    RefreshToken.query.filter_by(user_id=user_id, revoked=False).update(
        {"revoked": True}
    )
    db.session.commit()
    return jsonify({"message": "Logged out from all devices."}), 200


@auth_bp.route("/me", methods=["GET"])
@jwt_required()
def me():
    """
    GET /api/auth/me
    Return the currently authenticated user's profile.
    """
    user_id = get_jwt_identity()
    user    = User.query.get(user_id)
    if not user:
        return jsonify({"error": "User not found."}), 404
    return jsonify({"user": user.to_dict()}), 200


@auth_bp.route("/change-password", methods=["PUT"])
@jwt_required()
def change_password():
    """
    PUT /api/auth/change-password
    Body: { current_password, new_password }
    """
    user_id = get_jwt_identity()
    user    = User.query.get(user_id)
    if not user:
        return jsonify({"error": "User not found."}), 404

    data             = request.get_json(silent=True) or {}
    current_password = data.get("current_password", "")
    new_password     = data.get("new_password", "")

    if not user.verify_password(current_password):
        return jsonify({"error": "Current password is incorrect."}), 401

    if not _valid_password(new_password):
        return jsonify({
            "error": "New password must be at least 8 characters with uppercase, lowercase, and digit."
        }), 422

    user.password = new_password
    # Revoke all refresh tokens to force re-login on other devices
    RefreshToken.query.filter_by(user_id=user.id, revoked=False).update({"revoked": True})
    db.session.commit()

    return jsonify({"message": "Password changed. Please log in again."}), 200
