# Flask Backend - Authentication System

A complete Flask backend with user authentication including login, registration, and password reset functionality.

## Project Structure

```
backend/
├── app.py              # Main Flask application
├── config.py           # Configuration settings
├── models.py           # Database models (User)
├── routes/
│   └── auth.py        # Authentication routes
├── requirements.txt    # Python dependencies
├── .env.example       # Environment variables template
└── README.md          # This file
```

## Setup Instructions

### 1. Create Virtual Environment

```bash
python -m venv venv
# On Windows
venv\Scripts\activate
# On macOS/Linux
source venv/bin/activate
```

### 2. Install Dependencies

```bash
pip install -r requirements.txt
```

### 3. Configure Environment Variables

Copy `.env.example` to `.env` and update values:

```bash
cp .env.example .env
```

Edit `.env` with your settings:
- `SECRET_KEY`: Change to a secure random key
- `MAIL_USERNAME`: Your email address (for password reset)
- `MAIL_PASSWORD`: Your email app password

### 4. Run the Application

```bash
python app.py
```

The server will start at `http://localhost:5000`

## API Endpoints

### Register
- **POST** `/api/auth/register`
```json
{
  "username": "john_doe",
  "email": "john@example.com",
  "password": "securepassword123"
}
```

### Login
- **POST** `/api/auth/login`
```json
{
  "email": "john@example.com",
  "password": "securepassword123"
}
```

### Forgot Password
- **POST** `/api/auth/forgot-password`
```json
{
  "email": "john@example.com"
}
```

### Reset Password
- **POST** `/api/auth/reset-password`
```json
{
  "token": "reset_token_from_email",
  "new_password": "newpassword123"
}
```

### Get User Profile
- **GET** `/api/auth/user/<user_id>`

## Database

By default, uses SQLite (`dev.db`). To use PostgreSQL:

1. Install: `pip install psycopg2-binary`
2. Update `DATABASE_URL` in `.env`:
   ```
   DATABASE_URL=postgresql://username:password@localhost:5432/dbname
   ```

## Email Configuration (Gmail)

1. Enable 2-step verification on your Gmail account
2. Generate an App Password: https://myaccount.google.com/apppasswords
3. Add to `.env`:
   ```
   MAIL_USERNAME=your_email@gmail.com
   MAIL_PASSWORD=your_16_character_app_password
   ```

## Security Notes

- ✅ Passwords are hashed with bcrypt
- ✅ CORS enabled for frontend communication
- ✅ Reset tokens expire after 1 hour
- ✅ Environment variables for sensitive data
- ⚠️ In production, use HTTPS and secure secret keys
- ⚠️ Implement rate limiting for login attempts
- ⚠️ Add JWT tokens for session management

## Connecting to Frontend

Update your React/Vue frontend to call the API:

```javascript
const register = async (username, email, password) => {
  const response = await fetch('http://localhost:5000/api/auth/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, email, password })
  });
  return response.json();
};
```

## Development vs Production

- Change `FLASK_ENV` to `production` for production deployment
- Update `DATABASE_URL` to use a proper database
- Set secure `SECRET_KEY` and `JWT_SECRET_KEY`
- Enable HTTPS
- Consider using Gunicorn for production: `pip install gunicorn`
  ```bash
  gunicorn -w 4 -b 0.0.0.0:5000 app:app
  ```
