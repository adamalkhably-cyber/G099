# Full Stack Setup Guide

This guide will help you run the complete application with the connected frontend and backend.

## Backend Setup

### 1. Install Dependencies
```bash
cd backend
pip install -r requirements.txt
```

### 2. Create Environment File
```bash
cd backend
cp .env.example .env
```

Edit `.env` and update these values:
- `SECRET_KEY` - Change to a random secure string
- `JWT_SECRET_KEY` - Change to a random secure string
- Database connection string (if not using SQLite)

### 3. Initialize Database
```bash
python -c "from app import create_app; app = create_app(); app.app_context().push()"
```

### 4. Run Backend Server
```bash
python app.py
```

The backend will run on `http://localhost:5000`

## Frontend Setup

### 1. Install Dependencies
```bash
cd G099-Mika
npm install
```

### 2. Run Development Server
```bash
npm run dev
```

The frontend will run on `http://localhost:5173`

## How It Works

### Architecture
- **Backend**: Flask REST API on port 5000
- **Frontend**: React + Vite on port 5173
- **Proxy**: Vite proxies `/api` requests to backend during development
- **Authentication**: JWT tokens stored in localStorage

### API Endpoints

#### Auth Routes
- `POST /api/auth/register` - Register new user
  ```json
  {
    "username": "john",
    "email": "john@example.com",
    "password": "securepassword"
  }
  ```

- `POST /api/auth/login` - Login user
  ```json
  {
    "email": "john@example.com",
    "password": "securepassword"
  }
  ```

- `GET /api/auth/me` - Get current user (requires JWT token)

- `POST /api/auth/forgot-password` - Request password reset
- `POST /api/auth/reset-password` - Reset password with token

### Authentication Flow

1. User registers or logs in via the frontend
2. Backend validates credentials and returns JWT token
3. Token is stored in localStorage
4. Token is automatically sent with all API requests via axios interceptor
5. Protected routes redirect unauthenticated users to login
6. If token expires (401 error), user is logged out automatically

### File Structure

**Backend:**
```
backend/
├── app.py              # Flask application factory
├── config.py           # Configuration settings
├── models.py           # Database models
├── routes/
│   └── auth.py         # Authentication endpoints
└── requirements.txt    # Python dependencies
```

**Frontend:**
```
G099-Mika/
├── src/
│   ├── app.jsx                    # Main app with routing
│   ├── main.jsx                   # Entry point
│   ├── index.css                  # Global styles
│   ├── services/
│   │   └── api.js                 # API client with axios
│   ├── context/
│   │   └── AuthContext.jsx        # Auth state management
│   ├── components/
│   │   └── ProtectedRoute.jsx     # Route protection
│   └── pages/
│       ├── Login.jsx              # Login page (connected)
│       ├── Register.jsx           # Register page (connected)
│       ├── Dashboard.jsx
│       ├── Calendar.jsx
│       └── ...
├── vite.config.js                 # Vite config with proxy
└── package.json
```

## Testing the Connection

### 1. Start Backend
```bash
cd backend
python app.py
```

### 2. Start Frontend
```bash
cd G099-Mika
npm run dev
```

### 3. Test Registration
- Go to `http://localhost:5173`
- Click "Register"
- Enter: username, email, password
- Should redirect to dashboard on success

### 4. Test Login
- Log out (if on dashboard)
- Go to login page
- Enter your registered email and password
- Should redirect to dashboard on success

## Troubleshooting

### "Cannot POST /api/auth/login"
- Make sure backend is running on port 5000
- Check that vite.config.js has the proxy configuration
- Check browser console for CORS errors

### "401 Unauthorized" on protected routes
- Check that token is stored in localStorage
- Check that token hasn't expired (expires in 1 hour by default)
- Try logging in again

### Database errors
- Make sure you've initialized the database
- Check that dev.db file exists in backend/instance directory

### "npm ERR! missing axios"
- Run `npm install` in G099-Mika directory

## Production Deployment

For production, you'll need to:

1. **Backend**:
   - Use a production database (PostgreSQL, MySQL, etc.)
   - Set DEBUG=False
   - Use a production server (Gunicorn, uWSGI)
   - Configure CORS to allow specific frontend domain

2. **Frontend**:
   - Update API base URL from relative proxy to absolute backend URL
   - Build: `npm run build`
   - Deploy dist folder to static hosting

3. **Environment Variables**:
   - Set all SECRET_KEY and JWT_SECRET_KEY to strong random values
   - Update MAIL_* settings with real email credentials

## Next Steps

- Add database models for wardrobe, outfits, calendar events
- Create endpoints for CRUD operations
- Build dashboard and related pages
- Add user profile management
- Implement file uploads for wardrobe items
