# Plateful App Setup Script
# This script helps you set up your Plateful app for local development

param(
    [switch]$SkipDeps = $false,
    [switch]$SkipTypeCheck = $false
)

Write-Host "rocketship Plateful App Setup" -ForegroundColor Cyan
Write-Host "============================" -ForegroundColor Cyan
Write-Host ""

# Step 1: Check prerequisites
Write-Host "Step 1: Checking Prerequisites..." -ForegroundColor Yellow

try {
    $nodeVersion = & node --version
    Write-Host "checkmark Node.js: $nodeVersion" -ForegroundColor Green
} catch {
    Write-Host "x Node.js not found. Please install Node.js 18+ from https://nodejs.org/" -ForegroundColor Red
    exit 1
}

try {
    $pnpmVersion = & pnpm --version
    Write-Host "checkmark pnpm: $pnpmVersion" -ForegroundColor Green
} catch {
    Write-Host "x pnpm not found. Install with: npm install -g pnpm" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "checkmark All prerequisites met!" -ForegroundColor Green
Write-Host ""

# Step 2: Install dependencies
if (-not $SkipDeps) {
    Write-Host "Step 2: Installing Dependencies..." -ForegroundColor Yellow
    & pnpm install
    if ($LASTEXITCODE -ne 0) {
        Write-Host "x Failed to install dependencies" -ForegroundColor Red
        exit 1
    }
    Write-Host "checkmark Dependencies installed!" -ForegroundColor Green
    Write-Host ""
}

# Step 3: TypeScript check
if (-not $SkipTypeCheck) {
    Write-Host "Step 3: TypeScript Type Check..." -ForegroundColor Yellow
    & pnpm type-check
    if ($LASTEXITCODE -ne 0) {
        Write-Host "x TypeScript errors found" -ForegroundColor Red
        exit 1
    }
    Write-Host "checkmark All TypeScript checks passed!" -ForegroundColor Green
    Write-Host ""
}

# Step 4: Firebase setup
Write-Host "Step 4: Firebase Configuration" -ForegroundColor Yellow
Write-Host ""
Write-Host "Before continuing, you need to:" -ForegroundColor Cyan
Write-Host "1. Create a Firebase project at https://console.firebase.google.com"
Write-Host "2. Enable Authentication (Email/Password)"
Write-Host "3. Create Firestore Database (us-central1)"
Write-Host "4. Create Cloud Storage bucket (us-central1)"
Write-Host "5. Copy your Firebase config"
Write-Host ""

# Step 5: Create .env file
Write-Host "Step 5: Environment Variables" -ForegroundColor Yellow

$envPath = "apps/mobile/.env"

if (Test-Path $envPath) {
    Write-Host "Note: .env file already exists at $envPath" -ForegroundColor Cyan
} else {
    Write-Host ""
    Write-Host "Creating .env file..." -ForegroundColor Cyan
    
    # Create the .env file with placeholders
    $envContent = @"
# Firebase Configuration (replace with your values from Firebase Console)
EXPO_PUBLIC_FIREBASE_API_KEY=YOUR_API_KEY_HERE
EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=YOUR_AUTH_DOMAIN.firebaseapp.com
EXPO_PUBLIC_FIREBASE_PROJECT_ID=YOUR_PROJECT_ID
EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=YOUR_STORAGE_BUCKET.appspot.com
EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=YOUR_MESSAGING_SENDER_ID
EXPO_PUBLIC_FIREBASE_APP_ID=YOUR_APP_ID

# Google OAuth (optional, can leave as placeholders)
EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID=YOUR_GOOGLE_WEB_CLIENT_ID
EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID=YOUR_GOOGLE_IOS_CLIENT_ID
EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID=YOUR_GOOGLE_ANDROID_CLIENT_ID
"@

    # Write to file using PowerShell UTF-8 encoding
    $envContent | Out-File -FilePath $envPath -Encoding UTF8 -NoNewline
    
    Write-Host "checkmark .env file created at $envPath" -ForegroundColor Green
    Write-Host ""
    Write-Host "NEXT STEP: Edit $envPath and add your Firebase credentials" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "To open the file for editing, run:" -ForegroundColor Cyan
    Write-Host "code apps/mobile/.env" -ForegroundColor White
}

# Final instructions
Write-Host ""
Write-Host "============================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Setup Steps Complete!" -ForegroundColor Green
Write-Host ""

Write-Host "Next Steps:" -ForegroundColor Yellow
Write-Host "1. Edit apps/mobile/.env and add your Firebase configuration"
Write-Host "2. Run: firebase login"
Write-Host "3. Run: firebase deploy --only firestore:rules,storage:rules"
Write-Host "4. Start the app with one of these commands:"
Write-Host ""
Write-Host "   Option A (Web - easiest): cd apps/mobile && pnpm web"
Write-Host "   Option B (All services): pnpm dev"
Write-Host "   Option C (Android): cd apps/mobile && pnpm android"
Write-Host ""
Write-Host "For more help, see SETUP_QUICK_START.md" -ForegroundColor Cyan
Write-Host ""
Write-Host "Happy coding!" -ForegroundColor Green
