# Restart Development Servers Script
# This script helps restart your API and Mobile dev servers

Write-Host "🔄 Restarting Plateful Development Servers..." -ForegroundColor Cyan
Write-Host ""

# Step 1: Rebuild shared package (types may have changed)
Write-Host "📦 Rebuilding shared package..." -ForegroundColor Yellow
Set-Location packages\shared
npm run build
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Failed to build shared package" -ForegroundColor Red
    exit 1
}
Set-Location ..\..
Write-Host "✅ Shared package rebuilt" -ForegroundColor Green
Write-Host ""

# Step 2: Instructions for restarting servers
Write-Host "📋 Next Steps:" -ForegroundColor Cyan
Write-Host ""
Write-Host "To restart the API server:" -ForegroundColor Yellow
Write-Host "  1. Open a new terminal"
Write-Host "  2. Run: cd apps\api"
Write-Host "  3. Run: npm run dev"
Write-Host ""
Write-Host "To restart the Mobile app:" -ForegroundColor Yellow
Write-Host "  1. Open another new terminal"
Write-Host "  2. Run: cd apps\mobile"
Write-Host "  3. Run: npm run dev"
Write-Host ""
Write-Host "Or use the root scripts:" -ForegroundColor Yellow
Write-Host "  - npm run api    (for API server)"
Write-Host "  - npm run mobile (for Mobile app)"
Write-Host ""


