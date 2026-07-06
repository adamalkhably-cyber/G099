from flask import Flask, send_from_directory
from flask_cors import CORS
from flask_jwt_extended import JWTManager
from config import config
from models import db, bcrypt, User
from routes.auth import auth_bp, init_mail
from routes.admin import admin_bp
from routes.wardrobe import wardrobe_bp
from routes.outfits import outfits_bp
from routes.settings import settings_bp
from routes.calendar_routes import calendar_bp


app = Flask(__name__, static_folder="static", static_url_path="/static")
app = Flask(__name__, template_folder="templates", static_folder="static")
CORS(app)
app.config.from_object(config["development"])

db.init_app(app)
bcrypt.init_app(app)
JWTManager(app)
init_mail(app)

with app.app_context():
    db.create_all()

    admin = User.query.filter_by(email="adamalkhably@gmail.com").first()

    if not admin:
        admin = User(
            username="Sick",
            email="adamalkhably@gmail.com",
            is_admin=True,
            is_active=True
        )
        admin.set_password("adam12adam")
        db.session.add(admin)
        db.session.commit()
        print("Default admin account created.")
    else:
        admin.is_admin = True
        db.session.commit()
        print("Admin account already exists.")

app.secret_key = app.config["SECRET_KEY"]


@app.route("/")
def home():

    return send_from_directory("static", "login.html")

    return send_from_directory("templates", "login.html")



@app.route("/dashboard")
def dashboard():

    return send_from_directory("static", "dashboard.html")

    return send_from_directory("templates", "dashboard.html")



@app.route("/wardrobe")
def wardrobe_page():

    return send_from_directory("static", "wardrobe.html")

    return send_from_directory("templates", "wardrobe.html")



@app.route("/calendar")
def calendar_page():

    return send_from_directory("static", "calendar.html")

    return send_from_directory("templates", "calendar.html")



@app.route("/outfits")
def outfits_page():

    return send_from_directory("static", "outfits.html")

    return send_from_directory("templates", "outfits.html")



@app.route("/favorites")
def favorites_page():

    return send_from_directory("static", "favorites.html")

    return send_from_directory("templates", "favorites.html")



@app.route("/settings")
def settings_page():

    return send_from_directory("static", "settings.html")

    return send_from_directory("templates", "settings.html")



@app.route("/admin")
def admin_page():

    return send_from_directory("static", "admin-dashboard.html")

    return send_from_directory("templates", "admin-dashboard.html")



@app.route("/forgot-password")
def forgot_password_page():

    return send_from_directory("static", "forgot-password.html")

@app.route("/register")
def register_page():
    return send_from_directory("static", "register.html")

@app.route("/reset-password")
def reset_password_page():
    return send_from_directory("static", "reset-password.html")

    return send_from_directory("templates", "forgot-password.html")


app.register_blueprint(auth_bp, url_prefix="/api/auth")
app.register_blueprint(admin_bp, url_prefix="/api/admin")
app.register_blueprint(wardrobe_bp, url_prefix="/api/wardrobe")
app.register_blueprint(outfits_bp, url_prefix="/api/outfits")
app.register_blueprint(settings_bp, url_prefix="/api/settings")
app.register_blueprint(calendar_bp, url_prefix="/api/calendar")


if __name__ == "__main__":
    app.run(debug=True)