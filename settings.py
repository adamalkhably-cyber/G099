from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from models import db, UserSettings

settings_bp = Blueprint("settings_bp", __name__)


def get_or_create_settings(user_id):
    """Fetch this user's settings row, creating a default one on first use."""
    settings = UserSettings.query.filter_by(user_id=user_id).first()
    if not settings:
        settings = UserSettings(user_id=user_id)
        db.session.add(settings)
        db.session.commit()
    return settings


@settings_bp.route("", methods=["GET"])
@settings_bp.route("/", methods=["GET"])
@jwt_required()
def api_get_settings():
    """Get settings for the authenticated user only."""
    user_id = int(get_jwt_identity())
    settings = get_or_create_settings(user_id)
    return jsonify({"ok": True, "settings": settings.to_dict()})


@settings_bp.route("", methods=["POST"])
@settings_bp.route("/", methods=["POST"])
@jwt_required()
def api_save_settings():
    """Save settings for the authenticated user only."""
    user_id = int(get_jwt_identity())

    if request.is_json:
        payload = request.get_json(silent=True) or {}
    else:
        form = request.form
        payload = {
            "username": form.get("username", "").strip(),
            "theme": form.get("theme", "default"),
            "notifications": {
                "email": bool(form.get("emailNotif")),
                "push": bool(form.get("pushNotif"))
            }
        }

    username = str(payload.get("username", ""))
    if len(username) > 100:
        return jsonify({"ok": False, "error": "Display name too long"}), 400

    theme = payload.get("theme", "default")
    if theme not in ("default", "light", "dark"):
        theme = "default"

    notifications = payload.get("notifications", {}) or {}

    settings = get_or_create_settings(user_id)
    settings.display_name = username.strip()[:100]
    settings.theme = theme
    settings.email_notifications = bool(notifications.get("email", False))
    settings.push_notifications = bool(notifications.get("push", False))
    db.session.commit()

    return jsonify({"ok": True, "settings": settings.to_dict()})