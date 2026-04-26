# 👗 Digital Closet Planner — Auth & Role Management API

A production-ready Flask REST API providing **user authentication** and **role-based access control (RBAC)** for the Digital Closet Planner application.

---

## 🚀 Quick Start

```bash
# 1. Clone and enter the project
cd digital_closet

# 2. Create a virtual environment
python -m venv venv
source venv/bin/activate      # Windows: venv\Scripts\activate

# 3. Install dependencies
pip install -r requirements.txt

# 4. Configure environment
cp .env.example .env
# Edit .env with your secrets

# 5. Run the development server
python app.py
```

The API is now available at **http://localhost:5000/api/**

---

## 🏗 Project Structure

```
digital_closet/
├── app.py               # Application factory & entry point
├── config.py            # Config classes (Dev / Testing)
├── extensions.py        # Flask extension singletons
├── decorators.py        # RBAC decorators
├── requirements.txt
├── .env.example
├── models/
│   ├── user.py          # User model
│   ├── role.py          # Role model
│   └── refresh_token.py # JWT refresh token store
├── routes/
│   ├── auth.py          # /api/auth/*
│   ├── users.py         # /api/users/*
│   ├── roles.py         # /api/roles/*
│   └── admin.py         # /api/admin/*
└── tests/
    └── test_auth.py
```

---

## 🔑 Default Roles

| Role      | Description                           |
|-----------|---------------------------------------|
| `admin`   | Full system access                    |
| `premium` | Premium subscriber (extended features)|
| `user`    | Standard registered user (default)    |
| `guest`   | Read-only guest access                |

---

## 📡 API Reference

### Authentication — `/api/auth`

| Method   | Endpoint               | Auth          | Description                        |
|----------|------------------------|---------------|------------------------------------|
| `POST`   | `/register`            | —             | Register a new account             |
| `POST`   | `/login`               | —             | Login (email or username)          |
| `POST`   | `/refresh`             | Refresh JWT   | Get a new access token             |
| `DELETE` | `/logout`              | Refresh JWT   | Revoke current refresh token       |
| `DELETE` | `/logout-all`          | Access JWT    | Revoke all refresh tokens          |
| `GET`    | `/me`                  | Access JWT    | Get current user's profile         |
| `PUT`    | `/change-password`     | Access JWT    | Change password                    |

#### `POST /api/auth/register`
```json
// Request
{ "username": "alice", "email": "alice@example.com", "password": "Secret123",
  "first_name": "Alice", "last_name": "Chen" }

// Response 201
{ "message": "Account created successfully.",
  "user": { "id": 1, "username": "alice", "role": { "name": "user" }, ... },
  "access_token": "<JWT>", "refresh_token": "<JWT>" }
```

#### `POST /api/auth/login`
```json
// Request — identifier can be email OR username
{ "identifier": "alice@example.com", "password": "Secret123" }

// Response 200
{ "message": "Login successful.", "user": {...},
  "access_token": "<JWT>", "refresh_token": "<JWT>" }
```

---

### User Profile — `/api/users`

| Method   | Endpoint        | Auth       | Description           |
|----------|-----------------|------------|-----------------------|
| `GET`    | `/profile`      | Access JWT | Get own profile       |
| `PUT`    | `/profile`      | Access JWT | Update own profile    |
| `DELETE` | `/deactivate`   | Access JWT | Self-deactivate       |

---

### Roles — `/api/roles`

| Method   | Endpoint    | Auth           | Description        |
|----------|-------------|----------------|--------------------|
| `GET`    | `/`         | Access JWT     | List all roles     |
| `POST`   | `/`         | Admin JWT      | Create a role      |
| `GET`    | `/<id>`     | Access JWT     | Get role details   |
| `PUT`    | `/<id>`     | Admin JWT      | Update role        |
| `DELETE` | `/<id>`     | Admin JWT      | Delete role        |

---

### Admin — `/api/admin`

| Method   | Endpoint                      | Auth      | Description                |
|----------|-------------------------------|-----------|----------------------------|
| `GET`    | `/users`                      | Admin JWT | List users (paginated)     |
| `GET`    | `/users/<id>`                 | Admin JWT | Get specific user          |
| `PUT`    | `/users/<id>/role`            | Admin JWT | Assign role to user        |
| `PATCH`  | `/users/<id>/activate`        | Admin JWT | Activate / deactivate user |
| `DELETE` | `/users/<id>`                 | Admin JWT | Permanently delete user    |
| `GET`    | `/stats`                      | Admin JWT | Dashboard stats            |

#### Query Parameters for `GET /api/admin/users`
| Param      | Type    | Description                     |
|------------|---------|---------------------------------|
| `page`     | int     | Page number (default: 1)        |
| `per_page` | int     | Results per page (max: 100)     |
| `role`     | string  | Filter by role name             |
| `is_active`| boolean | Filter by active status         |
| `search`   | string  | Search username, email, name    |

---

## 🔐 Security Features

- **Password hashing** with bcrypt (12 rounds)
- **JWT access tokens** (1-hour expiry) + **refresh tokens** (30-day expiry)
- **Refresh token rotation** — tokens stored in DB, revocable per-device or globally
- **Role-based decorators**: `@admin_required`, `@roles_required("premium", "admin")`, `@active_required`
- **Protected roles** — `admin` and `user` roles cannot be deleted
- **Password policy** — min 8 chars, upper + lower + digit

---

## 🧪 Running Tests

```bash
pip install pytest
pytest tests/ -v
```

---

## 🌍 Environment Variables

| Variable        | Default                           | Description                  |
|-----------------|-----------------------------------|------------------------------|
| `SECRET_KEY`    | *(dev value)*                     | Flask secret key             |
| `DATABASE_URL`  | `sqlite:///digital_closet.db`     | SQLAlchemy connection string |
| `JWT_SECRET_KEY`| *(dev value)*                     | JWT signing key              |
| `DEBUG`         | `False`                           | Flask debug mode             |
