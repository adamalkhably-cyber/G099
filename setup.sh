#!/bin/bash

# Quick start script for the application

echo ""
echo "====== G099 App Setup ======"
echo ""

# Check if Python is installed
if ! command -v python3 &> /dev/null; then
    echo "Error: Python 3 is not installed"
    exit 1
fi

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "Error: Node.js is not installed"
    exit 1
fi

echo "Python and Node.js found!"
echo ""

# Install backend dependencies
echo "Installing backend dependencies..."
cd backend
pip3 install -r requirements.txt
if [ $? -ne 0 ]; then
    echo "Error installing backend dependencies"
    exit 1
fi
cd ..

echo ""
echo "Installing frontend dependencies..."
cd G099-Mika
npm install
if [ $? -ne 0 ]; then
    echo "Error installing frontend dependencies"
    exit 1
fi
cd ..

echo ""
echo "====== Setup Complete! ======"
echo ""
echo "To start the application:"
echo ""
echo "1. Terminal 1 - Backend:"
echo "   cd backend"
echo "   python3 app.py"
echo ""
echo "2. Terminal 2 - Frontend:"
echo "   cd G099-Mika"
echo "   npm run dev"
echo ""
echo "Then open: http://localhost:5173"
echo ""
