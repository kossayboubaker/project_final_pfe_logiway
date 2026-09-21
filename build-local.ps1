# ===========================================
# Build Local de tous les services Docker
# ===========================================

Write-Host "`n🏗️  Building all Docker images..." -ForegroundColor Cyan
Write-Host "============================================`n" -ForegroundColor Cyan

$services = @(
    @{Name="backend"; Path="./backend"},
    @{Name="frontend"; Path="./frontend"},
    @{Name="pause-ai"; Path="./pause-ai-service"},
    @{Name="reclamation-ai"; Path="./reclamation-ai-service"},
    @{Name="rag-service"; Path="./rag-service"}
)

$buildFailed = $false
$successCount = 0

foreach ($service in $services) {
    Write-Host "🔨 Building $($service.Name)..." -ForegroundColor Yellow
    
    docker build -t "logiway-$($service.Name):latest" $service.Path
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ $($service.Name) built successfully!`n" -ForegroundColor Green
        $successCount++
    } else {
        Write-Host "❌ $($service.Name) build failed!`n" -ForegroundColor Red
        $buildFailed = $true
    }
}

Write-Host "============================================" -ForegroundColor Cyan

if ($buildFailed) {
    Write-Host "⚠️  Some builds failed. Check errors above." -ForegroundColor Red
    Write-Host "   $successCount/$($services.Count) services built successfully.`n" -ForegroundColor Yellow
    exit 1
} else {
    Write-Host "🎉 All $($services.Count) images built successfully!`n" -ForegroundColor Green
    Write-Host "📦 Images créées:" -ForegroundColor Cyan
    docker images | Select-String "logiway"
    Write-Host "`n✨ Vous pouvez maintenant lancer: docker-compose up -d`n" -ForegroundColor Green
    exit 0
}
