"""
tests/test_auth.py — pytest suite for Digital Closet auth & role APIs.
Run: pytest tests/ -v
"""
import pytest
from app import create_app
from config import TestingConfig
from extensions import db as _db
from models import User, Role


# ─────────────────────────── fixtures ────────────────────────────────────

@pytest.fixture(scope="session")
def app():
    app = create_app(TestingConfig)
    with app.app_context():
        _db.create_all()
        yield app
        _db.drop_all()


@pytest.fixture(scope="function")
def client(app):
    with app.test_client() as c:
        yield c


@pytest.fixture(scope="function", autouse=True)
def clean_tables(app):
    """Wipe user & refresh_token tables between tests."""
    with app.app_context():
        from models.refresh_token import RefreshToken
        RefreshToken.query.delete()
        User.query.delete()
        _db.session.commit()
    yield


def _register(client, username="closet_user", email="user@closet.com",
               password="Secret123"):
    return client.post("/api/auth/register", json={
        "username": username, "email": email, "password": password,
    })


def _login(client, identifier="user@closet.com", password="Secret123"):
    return client.post("/api/auth/login",
                       json={"identifier": identifier, "password": password})


def _auth_header(token):
    return {"Authorization": f"Bearer {token}"}


# ─────────────────────────── auth tests ──────────────────────────────────

class TestRegister:
    def test_success(self, client):
        r = _register(client)
        assert r.status_code == 201
        data = r.get_json()
        assert "access_token"  in data
        assert "refresh_token" in data
        assert data["user"]["username"] == "closet_user"
        assert data["user"]["role"]["name"] == "user"

    def test_duplicate_email(self, client):
        _register(client)
        r = _register(client, username="other")
        assert r.status_code == 409

    def test_duplicate_username(self, client):
        _register(client)
        r = _register(client, email="other@closet.com")
        assert r.status_code == 409

    def test_weak_password(self, client):
        r = _register(client, password="weak")
        assert r.status_code == 422

    def test_invalid_email(self, client):
        r = _register(client, email="not-an-email")
        assert r.status_code == 422


class TestLogin:
    def test_login_by_email(self, client):
        _register(client)
        r = _login(client)
        assert r.status_code == 200
        assert "access_token" in r.get_json()

    def test_login_by_username(self, client):
        _register(client)
        r = _login(client, identifier="closet_user")
        assert r.status_code == 200

    def test_wrong_password(self, client):
        _register(client)
        r = _login(client, password="WrongPass1")
        assert r.status_code == 401

    def test_unknown_user(self, client):
        r = _login(client, identifier="ghost@closet.com")
        assert r.status_code == 401


class TestRefreshAndLogout:
    def test_refresh_token(self, client):
        _register(client)
        login_data = _login(client).get_json()
        r = client.post("/api/auth/refresh",
                        headers=_auth_header(login_data["refresh_token"]))
        assert r.status_code == 200
        assert "access_token" in r.get_json()

    def test_logout_invalidates_refresh(self, client):
        _register(client)
        login_data = _login(client).get_json()
        rt = login_data["refresh_token"]
        client.delete("/api/auth/logout", headers=_auth_header(rt))
        # Second refresh attempt should fail
        r = client.post("/api/auth/refresh", headers=_auth_header(rt))
        assert r.status_code == 401


class TestMe:
    def test_get_profile(self, client):
        _register(client)
        at = _login(client).get_json()["access_token"]
        r  = client.get("/api/auth/me", headers=_auth_header(at))
        assert r.status_code == 200
        assert r.get_json()["user"]["email"] == "user@closet.com"

    def test_no_token(self, client):
        r = client.get("/api/auth/me")
        assert r.status_code == 401


# ──────────────────────── role / admin tests ──────────────────────────────

class TestRoles:
    def _make_admin(self, app, client):
        """Register a user and promote them to admin."""
        _register(client, username="admin_user", email="admin@closet.com")
        at = _login(client, identifier="admin@closet.com").get_json()["access_token"]
        with app.app_context():
            user = User.query.filter_by(username="admin_user").first()
            user.role = Role.query.filter_by(name="admin").first()
            _db.session.commit()
        # Re-login to get fresh token reflecting role (JWT stores user_id, role is DB-checked)
        return at

    def test_list_roles(self, app, client):
        _register(client)
        at = _login(client).get_json()["access_token"]
        r  = client.get("/api/roles/", headers=_auth_header(at))
        assert r.status_code == 200
        names = [ro["name"] for ro in r.get_json()["roles"]]
        assert "user" in names and "admin" in names

    def test_create_role_requires_admin(self, client):
        _register(client)
        at = _login(client).get_json()["access_token"]
        r  = client.post("/api/roles/", json={"name": "stylist"},
                         headers=_auth_header(at))
        assert r.status_code == 403

    def test_create_role_as_admin(self, app, client):
        at = self._make_admin(app, client)
        r  = client.post("/api/roles/",
                         json={"name": "stylist", "description": "Fashion expert"},
                         headers=_auth_header(at))
        assert r.status_code == 201
        assert r.get_json()["role"]["name"] == "stylist"

    def test_delete_protected_role(self, app, client):
        at = self._make_admin(app, client)
        with app.app_context():
            admin_role = Role.query.filter_by(name="admin").first()
            rid = admin_role.id
        r = client.delete(f"/api/roles/{rid}", headers=_auth_header(at))
        assert r.status_code == 403


class TestAdminUserManagement:
    def _setup(self, app, client):
        _register(client, username="admin_user", email="admin@closet.com")
        at = _login(client, identifier="admin@closet.com").get_json()["access_token"]
        with app.app_context():
            user = User.query.filter_by(username="admin_user").first()
            user.role = Role.query.filter_by(name="admin").first()
            _db.session.commit()
        return at

    def test_list_users(self, app, client):
        at = self._setup(app, client)
        r  = client.get("/api/admin/users", headers=_auth_header(at))
        assert r.status_code == 200
        assert r.get_json()["total"] >= 1

    def test_assign_role(self, app, client):
        at = self._setup(app, client)
        _register(client, username="plain", email="plain@closet.com",
                  password="Secret123")
        with app.app_context():
            uid = User.query.filter_by(username="plain").first().id
        r = client.put(f"/api/admin/users/{uid}/role",
                       json={"role_name": "premium"},
                       headers=_auth_header(at))
        assert r.status_code == 200
        assert r.get_json()["user"]["role"]["name"] == "premium"

    def test_deactivate_user(self, app, client):
        at = self._setup(app, client)
        _register(client, username="target", email="target@closet.com",
                  password="Secret123")
        with app.app_context():
            uid = User.query.filter_by(username="target").first().id
        r = client.patch(f"/api/admin/users/{uid}/activate",
                         json={"is_active": False},
                         headers=_auth_header(at))
        assert r.status_code == 200
        assert r.get_json()["user"]["is_active"] is False

    def test_stats_endpoint(self, app, client):
        at = self._setup(app, client)
        r  = client.get("/api/admin/stats", headers=_auth_header(at))
        assert r.status_code == 200
        body = r.get_json()
        assert "total_users" in body
        assert "role_breakdown" in body
