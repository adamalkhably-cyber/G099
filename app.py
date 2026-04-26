from flask import Flask
from flask_jwt_extended import JWTManager
from flask_cors import CORS
from config import Config
from extensions import db, bcrypt, migrate
from routes.auth import auth_bp
from routes.users import users_bp
from routes.roles import roles_bp
from routes.admin import admin_bp


def create_app(config_class=Config):
    app = Flask(__name__)
    app.config.from_object(config_class)

    # Initialize extensions
    db.init_app(app)
    bcrypt.init_app(app)
    migrate.init_app(app, db)
    JWTManager(app)
    CORS(app, resources={r"/api/*": {"origins": "*"}})

    # Register blueprints
    app.register_blueprint(auth_bp, url_prefix="/api/auth")
    app.register_blueprint(users_bp, url_prefix="/api/users")
    app.register_blueprint(roles_bp, url_prefix="/api/roles")
    app.register_blueprint(admin_bp, url_prefix="/api/admin")

    with app.app_context():
        db.create_all()
        _seed_roles()

    return app


def _seed_roles():
    """Seed default roles if they don't exist."""
    from models.role import Role
    defaults = [
        ("admin",   "Full system access"),
        ("premium", "Premium subscriber with extended wardrobe features"),
        ("user",    "Standard registered user"),
        ("guest",   "Read-only guest access"),
    ]
    for name, desc in defaults:
        if not Role.query.filter_by(name=name).first():
            db.session.add(Role(name=name, description=desc))
    db.session.commit()


if __name__ == "__main__":
    app = create_app()
    app.run(debug=True, port=5000)
