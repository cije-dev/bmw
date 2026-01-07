@echo off
title BMW Windows Server 2022 Deployment
color 0A
echo.
echo ========================================
echo 🚀 BMW - Better Mental Wellness
echo Windows Server 2022 Deployment
echo ========================================
echo.

REM Check if Node.js is installed
node --version >nul 2>&1
if errorlevel 1 (
    echo Installing Node.js LTS...
    winget install OpenJS.NodeJS.LTS
    refreshenv
)

REM Display Node version
echo Node.js version:
node --version

REM Create project directory
if not exist "C:\bmw" mkdir C:\bmw
cd /d C:\bmw

echo.
echo Installing npm dependencies...
call npm install

echo.
echo Installing PM2 globally...
call npm install -g pm2

echo.
echo ========================================
echo ✅ Installation Complete!
echo ========================================
echo.
echo Next steps:
echo 1. Create .env file with your DB credentials (copy from .env.example)
echo 2. Install MariaDB if not already installed
echo 3. Create database: mysql -u root -p < setup.sql
echo 4. Start app: npm start
echo    OR with PM2: pm2 start ecosystem.config.js --env production
echo.
echo Access: http://localhost:3000
echo PM2 Status: pm2 status
echo PM2 Logs: pm2 logs bmw
echo.
echo Windows Firewall Rule:
echo netsh advfirewall firewall add rule name="BMW" dir=in action=allow protocol=TCP localport=3000
echo.
pause
