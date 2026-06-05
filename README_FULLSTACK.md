# G099 - Fashion Wardrobe Management System

A full-stack application for managing outfits, wardrobe items, and fashion planning.

## Tech Stack

- **Backend**: Flask + SQLAlchemy + Flask-JWT-Extended
- **Frontend**: React 19 + Vite + React Router + Tailwind CSS
- **Database**: SQLite (development) / PostgreSQL (production ready)
- **Authentication**: JWT (JSON Web Tokens)

## Quick Start

### Option 1: Automated Setup (Recommended)

**Windows:**
```bash
setup.bat
```

**Mac/Linux:**
```bash
bash setup.sh
```

### Option 2: Manual Setup

#### Backend Setup
```bash
cd backend
pip install -r requirements.txt
python app.py
```

#### Frontend Setup
```bash
cd G099-Mika
npm install
npm run dev
```

Then open: **http://localhost:5173**

## Features

### Authentication
- ✅ User registration with validation
- ✅ User login with JWT tokens
- ✅ Protected routes (dashboard, calendar, outfits, etc.)
- ✅ Password reset functionality
- ✅ Automatic token refresh and logout on expiry

### Frontend Pages
- 📝 Login Page - Beautiful glassmorphism UI
- 📝 Register Page - User account creation
- 📊 Dashboard - Main application hub (protected)
- 📅 Calendar - Plan outfit for each day (protected)
- 👔 Outfit Selection - Browse saved outfits (protected)
- ✨ Customize Outfit - Create new outfits (protected)
- 🔄 Forgot Password - Password recovery

### API Endpoints
- `POST /api/auth/register` - Create new account
- `POST /api/auth/login` - User login
- `GET /api/auth/me` - Get current user info (requires token)
- `POST /api/auth/forgot-password` - Request password reset
- `POST /api/auth/reset-password` - Reset password with token
- `GET /api/health` - Server health check

## Project Structure

```
G099/
├── backend/
│   ├── app.py                 # Flask application factory
│   ├── config.py              # Configuration management
│   ├── models.py              # Database models (User, etc.)
│   ├── routes/
│   │   └── auth.py            # Authentication routes
│   ├── instance/               # SQLite database (dev)
│   ├── requirements.txt        # Python dependencies
│   └── .env                    # Environment variables (create from .env.example)
│
├── G099-Mika/
│   ├── src/
│   │   ├── app.jsx            # Main app with routing
│   │   ├── main.jsx           # React entry point
│   │   ├── index.css          # Global styles
│   │   ├── services/
│   │   │   └── api.js         # Axios API client with interceptors
│   │   ├── context/
│   │   │   └── AuthContext.jsx    # Auth state management
│   │   ├── components/
│   │   │   └── ProtectedRoute.jsx # Route protection wrapper
│   │   └── pages/
│   │       ├── Login.jsx
│   │       ├── Register.jsx
│   │       ├── Dashboard.jsx
│   │       ├── Calendar.jsx
│   │       ├── CustomizeOutfit.jsx
│   │       ├── OutfitSelection.jsx
│   │       └── ForgotPassword.jsx
│   ├── vite.config.js         # Vite configuration with proxy
│   ├── package.json           # Dependencies: React, Router, Axios, Tailwind
│   └── eslint.config.js       # ESLint configuration
│
├── SETUP_GUIDE.md             # Detailed setup and architecture documentation
├── setup.bat                  # Windows setup script
├── setup.sh                   # Mac/Linux setup script
└── README.md                  # This file
```

## Environment Variables

### Backend (.env)
```env
FLASK_ENV=development
SECRET_KEY=your-secret-key-here
JWT_SECRET_KEY=your-jwt-secret-key-here
DEV_DATABASE_URL=sqlite:///dev.db
```

### Frontend
No configuration needed! Vite proxy automatically routes `/api` calls to the backend.

## How It Works

### Authentication Flow
1. User fills registration form on `/register`
2. Frontend sends POST to `/api/auth/register`
3. Backend creates user with hashed password
4. Backend returns JWT access token
5. Frontend stores token in localStorage
6. Token automatically sent with all API requests (via axios interceptor)
7. Protected pages check if token exists, redirect to login if not
8. On 401 error, token cleared and user redirected to login

### API Communication
- **Proxy**: In development, Vite proxies `/api/*` to `http://localhost:5000`
- **Interceptor**: Axios automatically adds `Authorization: Bearer {token}` to requests
- **Error Handling**: 401 errors trigger automatic logout

## Development

### Running Both Services

**Terminal 1 - Backend:**
```bash
cd backend
python app.py
```
Runs on: http://localhost:5000

**Terminal 2 - Frontend:**
```bash
cd G099-Mika
npm run dev
```
Runs on: http://localhost:5173

### Available Scripts

**Frontend:**
```bash
npm run dev      # Start development server
npm run build    # Build for production
npm run lint     # Run ESLint
npm run preview  # Preview production build
```

**Backend:**
```bash
python app.py    # Run development server
```

## Building for Production

### Backend
```bash
# Use a production WSGI server like Gunicorn
pip install gunicorn
gunicorn -w 4 -b 0.0.0.0:5000 "app:create_app()"
```

### Frontend
```bash
cd G099-Mika
npm run build
# Outputs to 'dist/' folder - deploy this to static hosting
```

## Key Dependencies

### Backend
- `Flask` - Web framework
- `Flask-SQLAlchemy` - ORM
- `Flask-JWT-Extended` - JWT authentication
- `Flask-Bcrypt` - Password hashing
- `Flask-CORS` - Cross-origin requests
- `Flask-Mail` - Email support

### Frontend
- `React` - UI library
- `React Router DOM` - Client-side routing
- `Axios` - HTTP client
- `Tailwind CSS` - Utility-first CSS framework
- `Vite` - Build tool

## Common Issues

### "Cannot find module 'axios'"
```bash
cd G099-Mika
npm install axios
```

### "Connection refused" on API calls
- Make sure backend is running: `python app.py`
- Check it's on port 5000: http://localhost:5000/api/health
- Verify vite proxy in `vite.config.js`

### 401 Unauthorized errors
- Token might be expired (expires in 1 hour)
- Clear localStorage and login again
- Check browser DevTools Network tab for token

### Database not found
```bash
cd backend
python -c "from app import create_app; app = create_app(); app.app_context().push()"
```

## Testing

### Test Registration
1. Go to http://localhost:5173/register
2. Fill in form with unique email
3. Should see error if email exists or redirect to dashboard on success

### Test Login
1. Go to http://localhost:5173
2. Enter registered email and password
3. Should redirect to dashboard on success

### Test Protected Routes
1. Try accessing http://localhost:5173/dashboard without logging in
2. Should redirect to login page

## Future Enhancements

- [ ] Add wardrobe item CRUD operations
- [ ] Implement outfit creation and management
- [ ] Build calendar integration
- [ ] Add photo uploads for wardrobe items
- [ ] Implement search and filter functionality
- [ ] Add user preferences and settings
- [ ] Social sharing features
- [ ] Mobile app version

## Contributing

When adding new features:
1. Create API endpoints in `backend/routes/`
2. Add corresponding API calls in `frontend/src/services/api.js`
3. Create React components in `frontend/src/pages/` or `frontend/src/components/`
4. Use `useAuth()` hook for authentication context
5. Wrap protected routes with `<ProtectedRoute>`

## License

This project is part of the G099 assignment.

## Support

See `SETUP_GUIDE.md` for detailed troubleshooting and architecture information.
