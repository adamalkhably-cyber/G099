from flask_sqlalchemy import SQLAlchemy
from flask_bcrypt import Bcrypt
from datetime import datetime

db = SQLAlchemy()
bcrypt = Bcrypt()

class User(db.Model):
    """User model for authentication"""
    __tablename__ = 'users'
    
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(80), unique=True, nullable=False, index=True)
    email = db.Column(db.String(120), unique=True, nullable=False, index=True)
    password = db.Column(db.String(255), nullable=False)
    reset_token = db.Column(db.String(255), nullable=True)
    reset_token_expiry = db.Column(db.DateTime, nullable=True)
    is_admin = db.Column(db.Boolean, default=False)
    is_active = db.Column(db.Boolean, default=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    last_login = db.Column(db.DateTime, nullable=True)
    
    # Relationships
    wardrobe_items = db.relationship('ClothingItem', backref='user', lazy=True, cascade='all, delete-orphan')
    outfits = db.relationship('Outfit', backref='user', lazy=True, cascade='all, delete-orphan')
    planned_outfits = db.relationship('PlannedOutfit', backref='user', lazy=True, cascade='all, delete-orphan')
    favorites = db.relationship('Favorite', backref='user', lazy=True, cascade='all, delete-orphan')
    
    def set_password(self, password):
        """Hash and set password"""
        self.password = bcrypt.generate_password_hash(password).decode('utf-8')
    
    def check_password(self, password):
        """Verify password"""
        return bcrypt.check_password_hash(self.password, password)
    
    def to_dict(self):
        """Convert user to dictionary"""
        return {
            'id': self.id,
            'username': self.username,
            'email': self.email,
            'is_admin': self.is_admin,
            'is_active': self.is_active,
            'created_at': self.created_at.isoformat(),
            'updated_at': self.updated_at.isoformat() if self.updated_at else None
        }
    
    def __repr__(self):
        return f'<User {self.username}>'


# Association table for outfit items (many-to-many)
outfit_items = db.Table(
    'outfit_items',
    db.Column('outfit_id', db.Integer, db.ForeignKey('outfit.id'), primary_key=True),
    db.Column('clothing_item_id', db.Integer, db.ForeignKey('clothing_item.id'), primary_key=True)
)


class ClothingItem(db.Model):
    """Wardrobe item model"""
    __tablename__ = 'clothing_item'
    
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False, index=True)
    name = db.Column(db.String(100), nullable=False)
    category = db.Column(db.String(50), nullable=False)  # shirt, pants, dress, jacket, etc.
    brand = db.Column(db.String(100))
    color = db.Column(db.String(50))
    size = db.Column(db.String(10))
    image_path = db.Column(db.String(255))
    description = db.Column(db.Text)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    def to_dict(self):
        return {
            'id': self.id,
            'name': self.name,
            'category': self.category,
            'brand': self.brand,
            'color': self.color,
            'size': self.size,
            'image_path': self.image_path,
            'description': self.description,
            'created_at': self.created_at.isoformat(),
            'updated_at': self.updated_at.isoformat() if self.updated_at else None
        }
    
    def __repr__(self):
        return f'<ClothingItem {self.name}>'


class Outfit(db.Model):
    """Outfit model - combination of clothing items"""
    __tablename__ = 'outfit'
    
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False, index=True)
    name = db.Column(db.String(100), nullable=False)
    description = db.Column(db.Text)
    items = db.relationship('ClothingItem', secondary=outfit_items, lazy='joined')
    is_flagged = db.Column(db.Boolean, default=False)
    flagged_reason = db.Column(db.Text, nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    def to_dict(self):
        return {
            'id': self.id,
            'name': self.name,
            'description': self.description,
            'items': [item.to_dict() for item in self.items],
            'is_flagged': self.is_flagged,
            'flagged_reason': self.flagged_reason,
            'created_at': self.created_at.isoformat(),
            'updated_at': self.updated_at.isoformat() if self.updated_at else None
        }
    
    def __repr__(self):
        return f'<Outfit {self.name}>'


class PlannedOutfit(db.Model):
    """Calendar - planned outfits for specific dates"""
    __tablename__ = 'planned_outfit'
    
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False, index=True)
    outfit_id = db.Column(db.Integer, db.ForeignKey('outfit.id'), nullable=True)
    date = db.Column(db.Date, nullable=False)
    notes = db.Column(db.Text)
    outfit = db.relationship('Outfit')
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    def to_dict(self):
        return {
            'id': self.id,
            'outfit': self.outfit.to_dict() if self.outfit else None,
            'date': self.date.isoformat(),
            'notes': self.notes,
            'created_at': self.created_at.isoformat()
        }
    
    def __repr__(self):
        return f'<PlannedOutfit {self.date}>'


class Favorite(db.Model):
    """Favorite outfits with rating"""
    __tablename__ = 'favorite'
    
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False, index=True)
    outfit_id = db.Column(db.Integer, db.ForeignKey('outfit.id'), nullable=False, index=True)
    rating = db.Column(db.Integer, default=5)  # 1-5 stars
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    outfit = db.relationship('Outfit')
    
    def to_dict(self):
        return {
            'id': self.id,
            'outfit': self.outfit.to_dict() if self.outfit else None,
            'rating': self.rating,
            'created_at': self.created_at.isoformat()
        }
    
    def __repr__(self):
        return f'<Favorite {self.outfit_id}>'
