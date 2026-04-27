from extensions import db
from datetime import datetime, timezone


class RefreshToken(db.Model):
    __tablename__ = "refresh_tokens"

    id         = db.Column(db.Integer, primary_key=True)
    jti        = db.Column(db.String(36), unique=True, nullable=False, index=True)
    user_id    = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False)
    revoked    = db.Column(db.Boolean, default=False, nullable=False)
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))
    expires_at = db.Column(db.DateTime, nullable=False)

    user = db.relationship("User", back_populates="refresh_tokens")

    def is_expired(self) -> bool:
        return datetime.now(timezone.utc) > self.expires_at.replace(tzinfo=timezone.utc)

    def is_valid(self) -> bool:
        return not self.revoked and not self.is_expired()

    def to_dict(self):
        return {
            "jti":        self.jti,
            "user_id":    self.user_id,
            "revoked":    self.revoked,
            "created_at": self.created_at.isoformat(),
            "expires_at": self.expires_at.isoformat(),
        }
