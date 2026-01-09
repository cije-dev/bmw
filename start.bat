@echo off
title BMW - Better Mental Wellness
color 0A
echo.
echo ========================================
echo 🌟 BMW - Better Mental Wellness
echo Starting Application...
echo ========================================
echo.

REM Check if Node.js is installed
node --version >nul 2>&1
if errorlevel 1 (
    echo ❌ ERROR: Node.js is not installed or not in PATH
    echo Please install Node.js from https://nodejs.org/
    pause
    exit /b 1
)

REM Display Node version
echo Node.js version:
node --version
echo.

REM Check if node_modules exists
if not exist "node_modules" (
    echo 📦 Installing dependencies...
    call npm install
    if errorlevel 1 (
        echo ❌ ERROR: Failed to install dependencies
        pause
        exit /b 1
    )
    echo.
)

REM Check if database exists, if not it will be created on first run
if not exist "bmw.db" (
    echo 📊 Database will be created on first run...
    echo.
)

echo 🚀 Starting BMW application...
echo.
echo Access the app at: http://localhost:3000
echo Press Ctrl+C to stop the server
echo.
echo ========================================
echo.

REM Start the application
node server.js

pause

