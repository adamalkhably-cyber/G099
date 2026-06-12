# backend-settings.py
from flask import Flask, request, jsonify, send_from_directory, render_template_string, abort
from werkzeug.utils import secure_filename
import os
import json
from pathlib import Path

APP_DIR = Path(__file__).parent.resolve()
STATIC_DIR = APP_DIR  # settings.html is in same folder; adjust if different
SETTINGS_FILE = APP_DIR / "user_settings.json"

app = Flask(__name__, static_folder=str(STATIC_DIR))
app.config['MAX_CONTENT_LENGTH'] = 2 * 1024 * 1024  # 2MB limit for uploads if any

# Default settings structure
DEFAULT_SETTINGS = {
    "username": "",
    "theme": "default",
    "notifications": {
        "email": False,
        "push": False
    },
    "plan": "Pro Plan"
}

def load_settings():
    if SETTINGS_FILE.exists():
        try:
            with open(SETTINGS_FILE, "r", encoding="utf-8") as f:
                data = json.load(f)
                # Ensure keys exist
                merged = DEFAULT_SETTINGS.copy()
                merged.update({k: v for k, v in data.items() if k in merged})
                # Merge notifications
                merged["notifications"] = DEFAULT_SETTINGS["notifications"].copy()
                merged["notifications"].update(data.get("notifications", {}))
                return merged
        except Exception:
            return DEFAULT_SETTINGS.copy()
    return DEFAULT_SETTINGS.copy()

def save_settings(data: dict):
    # Basic sanitization
    safe = {
        "username": str(data.get("username", "")).strip()[:100],
        "theme": data.get("theme", "default") if data.get("theme") in ("default", "light", "dark") else "default",
        "notifications": {
            "email": bool(data.get("notifications", {}).get("email", data.get("emailNotif", False))),
            "push": bool(data.get("notifications", {}).get("push", data.get("pushNotif", False)))
        },
        "plan": data.get("plan", "Pro Plan")
    }
    with open(SETTINGS_FILE, "w", encoding="utf-8") as f:
        json.dump(safe, f, indent=2)
    return safe

# Serve the static settings.html file
@app.route("/settings", methods=["GET"])
def settings_page():
    # Serve the file directly so the HTML/CSS remain unchanged
    try:
        return send_from_directory(directory=str(STATIC_DIR), filename="settings.html")
    except Exception:
        abort(404)

# API: get current settings
@app.route("/api/settings", methods=["GET"])
def api_get_settings():
    settings = load_settings()
    return jsonify({"ok": True, "settings": settings})

# API: update settings (accepts form-encoded or JSON)
@app.route("/api/settings", methods=["POST"])
def api_save_settings():
    # Accept JSON or form data
    if request.is_json:
        payload = request.get_json()
    else:
        # Convert form fields into expected structure
        form = request.form
        payload = {
            "username": form.get("username", "").strip(),
            "theme": form.get("theme", "default"),
            "notifications": {
                "email": bool(form.get("emailNotif")),
                "push": bool(form.get("pushNotif"))
            }
        }
    # Basic validation
    username = payload.get("username", "")
    if len(username) > 100:
        return jsonify({"ok": False, "error": "Display name too long"}), 400

    saved = save_settings(payload)
    return jsonify({"ok": True, "settings": saved})

# API: manage subscription (placeholder)
@app.route("/api/manage-subscription", methods=["POST"])
def api_manage_subscription():
    # In a real app, redirect to billing portal or call billing API
    # Here we simulate toggling plan or returning a billing URL
    settings = load_settings()
    # Example: return a simulated billing URL or action
    return jsonify({
        "ok": True,
        "message": "Manage subscription endpoint reached. Integrate with your billing provider here.",
        "billing_url": "https://billing.example.com/portal"
    })

# Optional: simple health check
@app.route("/health", methods=["GET"])
def health():
    return jsonify({"ok": True, "status": "healthy"})

if __name__ == "__main__":
    # Ensure settings file exists
    if not SETTINGS_FILE.exists():
        save_settings(DEFAULT_SETTINGS)
    app.run(host="0.0.0.0", port=5000, debug=True)
