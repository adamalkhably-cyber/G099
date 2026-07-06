from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from models import db, UserSettings, User

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
    data = settings.to_dict()

    # The "username" shown in Settings should always match the real login
    # username - display_name was originally meant to be separate, but that
    # split just confused things (Users table, live activity feed, etc. all
    # read User.username directly and never agreed with display_name).
    user = User.query.get(user_id)
    if user:
        data["username"] = user.username

    return jsonify({"ok": True, "settings": data})


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
            "theme": form.get("theme", "light"),
            "avatar": form.get("avatar"),
            "notifications": {
                "email": bool(form.get("emailNotif")),
                "push": bool(form.get("pushNotif"))
            }
        }

    username = str(payload.get("username", "")).strip()
    if len(username) > 100:
        return jsonify({"ok": False, "error": "Username too long"}), 400

    theme = payload.get("theme", "light")
    if theme not in ("light", "dark"):
        theme = "light"

    notifications = payload.get("notifications", {}) or {}
    avatar = payload.get("avatar")

    user = User.query.get(user_id)
    if not user:
        return jsonify({"ok": False, "error": "User not found"}), 404

    # Actually rename the real login username (not just a cosmetic copy),
    # since this app authenticates by email - renaming is safe and doesn't
    # affect login. Guard against the unique constraint on User.username.
    if username and username != user.username:
        existing = User.query.filter(User.username == username, User.id != user_id).first()
        if existing:
            return jsonify({"ok": False, "error": "That username is already taken"}), 400
        user.username = username

    settings = get_or_create_settings(user_id)
    settings.display_name = username[:100]
    settings.theme = theme
    settings.email_notifications = bool(notifications.get("email", False))
    settings.push_notifications = bool(notifications.get("push", False))

    # Only overwrite the stored avatar if a new one was actually sent -
    # an empty/missing value here just means "nothing changed", not "clear it"
    if avatar:
        settings.avatar = avatar

    db.session.commit()

    data = settings.to_dict()
    data["username"] = user.username
    return jsonify({"ok": True, "settings": data})