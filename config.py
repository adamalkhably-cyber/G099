import os
from datetime import timedelta

class Config:
    """Base configuration"""
    # Updated with secure 32+ byte fallback keys
    SECRET_KEY = os.getenv('SECRET_KEY', '6b7f31fa8d3920c8a30d5b3d6f7e81a2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8')
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    JWT_SECRET_KEY = os.getenv('JWT_SECRET_KEY', 'a1b2c3d4e5f67890f1e2d3c4b5a697858d3920c8a30d5b3d6f7e81a2c3d4e5f6')
    JWT_ACCESS_TOKEN_EXPIRES = timedelta(hours=1)

    # Email configuration
    MAIL_SERVER = os.getenv('MAIL_SERVER', 'smtp.gmail.com')
    MAIL_PORT = int(os.getenv('MAIL_PORT', 587))
    MAIL_USE_TLS = os.getenv('MAIL_USE_TLS', True)
<<<<<<<<< Temporary merge branch 1
    MAIL_USERNAME = os.getenv('MAIL_USERNAME')
    MAIL_PASSWORD = os.getenv('MAIL_PASSWORD')
=========
    MAIL_USERNAME = os.getenv('sick35739@gmail.com')
    MAIL_PASSWORD = os.getenv('pwapwa')
>>>>>>>>> Temporary merge branch 2
    MAIL_DEFAULT_SENDER = os.getenv('MAIL_DEFAULT_SENDER', 'noreply@myapp.com')

class DevelopmentConfig(Config):
    """Development configuration"""
    DEBUG = True
    SQLALCHEMY_DATABASE_URI = os.getenv('DEV_DATABASE_URL', 'sqlite:///dev.db')

class ProductionConfig(Config):
    """Production configuration"""
    DEBUG = False
    SQLALCHEMY_DATABASE_URI = os.getenv('DATABASE_URL')

class TestingConfig(Config):
    """Testing configuration"""
    TESTING = True
    SQLALCHEMY_DATABASE_URI = 'sqlite:///:memory:'

config = {
    'development': DevelopmentConfig,
    'production': ProductionConfig,
    'testing': TestingConfig,
    'default': DevelopmentConfig
}
