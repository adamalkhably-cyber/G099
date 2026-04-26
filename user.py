from extensions import db, bcrypt
from datetime import datetime, timezone


class User(db.Model):
    __tablename__ = "users"

    id              = db.Column(db.Integer, primary_key=True)
    username        = db.Column(db.String(80),  unique=True, nullable=False, index=True)
    email           = db.Column(db.String(120), unique=True, nullable=False, index=True)
    password_hash   = db.Column(db.String(255), nullable=False)
    first_name      = db.Column(db.String(50),  nullable=True)
    last_name       = db.Column(db.String(50),  nullable=True)
    is_active       = db.Column(db.Boolean, default=True, nullable=False)
    is_verified     = db.Column(db.Boolean, default=False, nullable=False)
    role_id         = db.Column(db.Integer, db.ForeignKey("roles.id"), nullable=True)
    created_at      = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at      = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc),
                                onupdate=lambda: datetime.now(timezone.utc))
    last_login_at   = db.Column(db.DateTime, nullable=True)

    # Relationships
    role            = db.relationship("Role", back_populates="users")
    refresh_tokens  = db.relationship("RefreshToken", back_populates="user",
                                      cascade="all, delete-orphan")

    # ---------- password helpers ----------
    @property
    def password(self):
        raise AttributeError("Password is not readable.")

    @password.setter
    def password(self, plain_text: str):
        self.password_hash = bcrypt.generate_password_hash(plain_text).decode("utf-8")

    def verify_password(self, plain_text: str) -> bool:
        return bcrypt.check_password_hash(self.password_hash, plain_text)

    # ---------- role helpers ----------
    def has_role(self, role_name: str) -> bool:
        return self.role is not None and self.role.name == role_name

    def is_admin(self) -> bool:
        return self.has_role("admin")

    # ---------- serialisation ----------
    def to_dict(self, include_role=True):
        data = {
            "id":           self.id,
            "username":     self.username,
            "email":        self.email,
            "first_name":   self.first_name,
            "last_name":    self.last_name,
            "is_active":    self.is_active,
            "is_verified":  self.is_verified,
            "created_at":   self.created_at.isoformat(),
            "updated_at":   self.updated_at.isoformat(),
            "last_login_at": self.last_login_at.isoformat() if self.last_login_at else None,
        }
        if include_role:
            data["role"] = self.role.to_dict() if self.role else None
        return data

    def __repr__(self):
        return f"<User {self.username}>"
