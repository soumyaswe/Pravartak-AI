# Quick Backend Starter
# This script starts the backend server with proper error handling

$backendPath = "c:\Users\bsubh\OneDrive\Desktop\VS Code\Pravartak\backend"
Set-Location $backendPath

Write-Host "🚀 Starting Backend Server..." -ForegroundColor Cyan
Write-Host ""

# Check if Python is available
try {
    $pythonVersion = & python --version 2>&1
    Write-Host "✅ Python: $pythonVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ Python not found. Please install Python 3.8+" -ForegroundColor Red
    exit 1
}

# Check if virtual environment exists
if (-Not (Test-Path ".\venv\Scripts\python.exe")) {
    Write-Host "📦 Creating virtual environment..." -ForegroundColor Yellow
    python -m venv venv
    Write-Host "✅ Virtual environment created" -ForegroundColor Green
}

# Activate and check for packages
Write-Host "🔍 Checking installed packages..." -ForegroundColor Yellow
$pythonExe = ".\venv\Scripts\python.exe"
$installedPackages = & $pythonExe -m pip list 2>&1

$requiredPackages = @("Flask", "flask-cors", "Flask-SocketIO", "eventlet")
$missingPackages = @()

foreach ($pkg in $requiredPackages) {
    if ($installedPackages -notmatch $pkg) {
        $missingPackages += $pkg
    }
}

if ($missingPackages.Count -gt 0) {
    Write-Host "📥 Installing missing packages: $($missingPackages -join ', ')" -ForegroundColor Yellow
    Write-Host "This may take 2-3 minutes..." -ForegroundColor Yellow
    Write-Host ""
    
    & $pythonExe -m pip install --upgrade pip --quiet
    & $pythonExe -m pip install Flask flask-cors Flask-SocketIO eventlet google-cloud-texttospeech google-cloud-speech google-cloud-aiplatform google-generativeai python-dotenv --quiet
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Packages installed successfully" -ForegroundColor Green
    } else {
        Write-Host "⚠️  Some packages may have installation warnings, but attempting to continue..." -ForegroundColor Yellow
    }
}

# Check for .env file
if (-Not (Test-Path ".\.env")) {
    Write-Host "⚠️  .env file not found, creating from example..." -ForegroundColor Yellow
    if (Test-Path ".\.env.example") {
        Copy-Item ".\.env.example" ".\.env"
        Write-Host "✅ .env file created" -ForegroundColor Green
    }
}

# Check for GCP credentials
if (-Not (Test-Path ".\gcp-credentials.json")) {
    Write-Host "⚠️  GCP credentials not found!" -ForegroundColor Yellow
    if (Test-Path "..\flash-precept-471409-u3-0a2cc0ca3940.json") {
        Copy-Item "..\flash-precept-471409-u3-0a2cc0ca3940.json" ".\gcp-credentials.json"
        Write-Host "✅ GCP credentials copied" -ForegroundColor Green
    } else {
        Write-Host "❌ Cannot find GCP credentials file" -ForegroundColor Red
    }
}

# Create audio_files directory
if (-Not (Test-Path ".\audio_files")) {
    New-Item -ItemType Directory -Path ".\audio_files" | Out-Null
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "   🎭 STARTING BACKEND SERVER" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Server URL: http://127.0.0.1:5000" -ForegroundColor Green
Write-Host "Press Ctrl+C to stop" -ForegroundColor Yellow
Write-Host ""

# Start the server
& $pythonExe server_ai_interviewer.py
