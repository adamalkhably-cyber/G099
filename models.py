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
    last_seen = db.Column(db.DateTime, nullable=True)  # heartbeat: updated on every authenticated request, used for real online/offline status
    theme = db.Column(db.String(20), default="light")
    
    # Relationships
    wardrobe_items = db.relationship('ClothingItem', backref='user', lazy=True, cascade='all, delete-orphan')
    outfits = db.relationship('Outfit', backref='user', lazy=True, cascade='all, delete-orphan')
    planned_outfits = db.relationship('PlannedOutfit', backref='user', lazy=True, cascade='all, delete-orphan')
    favorites = db.relationship('Favorite', backref='user', lazy=True, cascade='all, delete-orphan')
    settings = db.relationship('UserSettings', backref='user', uselist=False, cascade='all, delete-orphan')
    
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
            'created_at': self.created_at.isoformat() + 'Z' if self.created_at else None,
            'updated_at': self.updated_at.isoformat() + 'Z' if self.updated_at else None,
            'last_login': self.last_login.isoformat() + 'Z' if self.last_login else None,
            'last_seen': self.last_seen.isoformat() + 'Z' if self.last_seen else None
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
    image_path = db.Column(db.Text)  # widened from String(255) - base64 photo data needs far more room
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
    is_favorite = db.Column(db.Boolean, default=False)
    wear_count = db.Column(db.Integer, default=0)
    last_worn = db.Column(db.DateTime, nullable=True)
    
    def to_dict(self):
        return {
            'id': self.id,
            'name': self.name,
            'description': self.description,
            'items': [item.to_dict() for item in self.items],
            'is_flagged': self.is_flagged,
            'flagged_reason': self.flagged_reason,
            'created_at': self.created_at.isoformat() + 'Z' if self.created_at else None,
            'updated_at': self.updated_at.isoformat() + 'Z' if self.updated_at else None,
            'is_favorite': self.is_favorite,
            'wear_count': self.wear_count or 0,
            'last_worn': self.last_worn.isoformat() + 'Z' if self.last_worn else None
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


class UserSettings(db.Model):
    """Per-user app preferences (display name, theme, notifications).

    Previously this data lived in a single shared data/settings.json file
    with no user scoping at all, so any account's saved settings
    overwrote every other account's. This ties settings to a user_id FK
    like the rest of the schema (wardrobe, outfits, etc.) so each account
    has its own row.
    """
    __tablename__ = 'user_settings'

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False, unique=True, index=True)
    display_name = db.Column(db.String(100), default='')
    theme = db.Column(db.String(20), default='light')
    avatar = db.Column(db.Text, nullable=True)  # base64 image data, same pattern as ClothingItem.image_path
    email_notifications = db.Column(db.Boolean, default=False)
    push_notifications = db.Column(db.Boolean, default=False)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    def to_dict(self):
        return {
            'username': self.display_name or '',
            'theme': self.theme if self.theme in ('light', 'dark') else 'light',
            'avatar': self.avatar,
            'notifications': {
                'email': bool(self.email_notifications),
                'push': bool(self.push_notifications)
            }
        }

    def __repr__(self):
        return f'<UserSettings user_id={self.user_id}>'


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