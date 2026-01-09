# PowerShell script to start BMW - Better Mental Wellness app
Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "🌟 BMW - Better Mental Wellness" -ForegroundColor Yellow
Write-Host "Starting Application..." -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Check if Node.js is installed
try {
    $nodeVersion = node --version
    Write-Host "✅ Node.js version: $nodeVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ ERROR: Node.js is not installed or not in PATH" -ForegroundColor Red
    Write-Host "Please install Node.js from https://nodejs.org/" -ForegroundColor Yellow
    exit 1
}

Write-Host ""

# Check if node_modules exists
if (-not (Test-Path "node_modules")) {
    Write-Host "📦 Installing dependencies..." -ForegroundColor Yellow
    npm install
    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ ERROR: Failed to install dependencies" -ForegroundColor Red
        exit 1
    }
    Write-Host ""
}

# Check if database exists
if (-not (Test-Path "bmw.db")) {
    Write-Host "📊 Database will be created on first run..." -ForegroundColor Yellow
    Write-Host ""
}

Write-Host "🚀 Starting BMW application..." -ForegroundColor Green
Write-Host ""
Write-Host "Access the app at: http://localhost:3000" -ForegroundColor Cyan
Write-Host "Press Ctrl+C to stop the server" -ForegroundColor Yellow
Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Start the application
node server.js

