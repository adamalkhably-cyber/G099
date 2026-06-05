@echo off
REM Quick start script for the application

echo.
echo ====== G099 App Setup ======
echo.

REM Check if Python is installed
python --version >nul 2>&1
if errorlevel 1 (
    echo Error: Python is not installed or not in PATH
    pause
    exit /b 1
)

REM Check if Node.js is installed
node --version >nul 2>&1
if errorlevel 1 (
    echo Error: Node.js is not installed or not in PATH
    pause
    exit /b 1
)

echo Python and Node.js found!
echo.

REM Install backend dependencies
echo Installing backend dependencies...
cd backend
pip install -r requirements.txt
if errorlevel 1 (
    echo Error installing backend dependencies
    pause
    exit /b 1
)
cd ..

echo.
echo Installing frontend dependencies...
cd G099-Mika
call npm install
if errorlevel 1 (
    echo Error installing frontend dependencies
    pause
    exit /b 1
)
cd ..

echo.
echo ====== Setup Complete! ======
echo.
echo To start the application:
echo.
echo 1. Terminal 1 - Backend:
echo    cd backend
echo    python app.py
echo.
echo 2. Terminal 2 - Frontend:
echo    cd G099-Mika
echo    npm run dev
echo.
echo Then open: http://localhost:5173
echo.
pause
