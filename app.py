from flask import Flask
from flask_cors import CORS
from flask_mail import Mail
import os
from dotenv import load_dotenv

from config import config
from models import db, bcrypt
from routes.auth import auth_bp, init_mail

# Load environment variables
load_dotenv()

def create_app(config_name=None):
    """Application factory"""
    if config_name is None:
        config_name = os.getenv('FLASK_ENV', 'development')
    
    app = Flask(__name__)
    app.config.from_object(config[config_name])
    
    # Initialize extensions
    db.init_app(app)
    bcrypt.init_app(app)
    CORS(app)
    
    # Initialize mail
    Mail(app)
    init_mail(app)
    
    # Register blueprints
    app.register_blueprint(auth_bp)
    
    # Create database tables
    with app.app_context():
        db.create_all()
    
    # Health check route
    @app.route('/api/health', methods=['GET'])
    def health():
        return {'status': 'ok'}, 200
    
    # Error handlers
    @app.errorhandler(404)
    def not_found(error):
        return {'error': 'Resource not found'}, 404
    
    @app.errorhandler(500)
    def internal_error(error):
        db.session.rollback()
        return {'error': 'Internal server error'}, 500
    
    return app

if __name__ == '__main__':
    app = create_app()
    app.run(debug=True, host='0.0.0.0', port=5000)
