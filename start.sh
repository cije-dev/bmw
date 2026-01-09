#!/bin/bash

echo ""
echo "========================================"
echo "🌟 BMW - Better Mental Wellness"
echo "Starting Application..."
echo "========================================"
echo ""

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ ERROR: Node.js is not installed"
    echo "Please install Node.js from https://nodejs.org/"
    exit 1
fi

# Display Node version
echo "✅ Node.js version: $(node --version)"
echo ""

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install
    if [ $? -ne 0 ]; then
        echo "❌ ERROR: Failed to install dependencies"
        exit 1
    fi
    echo ""
fi

# Check if database exists
if [ ! -f "bmw.db" ]; then
    echo "📊 Database will be created on first run..."
    echo ""
fi

echo "🚀 Starting BMW application..."
echo ""
echo "Access the app at: http://localhost:3000"
echo "Press Ctrl+C to stop the server"
echo ""
echo "========================================"
echo ""

# Start the application
node server.js

