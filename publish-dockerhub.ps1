# ===========================================
# Publish Images sur Docker Hub
# ===========================================

param(
    [Parameter(Mandatory=$true, HelpMessage="Votre username Docker Hub")]
    [string]$Username,
    
    [Parameter(Mandatory=$false, HelpMessage="Tag de version (ex: v1.0.0)")]
    [string]$Version = "latest"
)

Write-Host "`n📤 Publishing to Docker Hub..." -ForegroundColor Cyan
Write-Host "============================================" -ForegroundColor Cyan
Write-Host "Username: $Username" -ForegroundColor White
Write-Host "Version : $Version`n" -ForegroundColor White

# Vérifier la connexion Docker Hub
Write-Host "🔐 Checking Docker Hub login..." -ForegroundColor Yellow
docker login

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Docker Hub login failed. Please login first." -ForegroundColor Red
    exit 1
}

$services = @("backend", "frontend", "pause-ai", "reclamation-ai", "rag-service")
$pushFailed = $false
$successCount = 0

foreach ($service in $services) {
    Write-Host "`n🏷️  Processing logiway-$service..." -ForegroundColor Yellow
    
    # Tag l'image
    $localImage = "logiway-${service}:latest"
    $remoteImage = "${Username}/logiway-${service}:${Version}"
    
    Write-Host "   Tagging: $localImage -> $remoteImage" -ForegroundColor Gray
    docker tag $localImage $remoteImage
    
    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ Failed to tag $service" -ForegroundColor Red
        $pushFailed = $true
        continue
    }
    
    # Si version != latest, tag aussi avec latest
    if ($Version -ne "latest") {
        $latestImage = "${Username}/logiway-${service}:latest"
        Write-Host "   Tagging: $localImage -> $latestImage" -ForegroundColor Gray
        docker tag $localImage $latestImage
    }
    
    # Push l'image
    Write-Host "📤 Pushing $remoteImage..." -ForegroundColor Cyan
    docker push $remoteImage
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ $service pushed successfully!" -ForegroundColor Green
        $successCount++
        
        # Push latest si version spécifique
        if ($Version -ne "latest") {
            docker push "${Username}/logiway-${service}:latest"
        }
    } else {
        Write-Host "❌ Failed to push $service" -ForegroundColor Red
        $pushFailed = $true
    }
}

Write-Host "`n============================================" -ForegroundColor Cyan

if ($pushFailed) {
    Write-Host "⚠️  Some pushes failed." -ForegroundColor Red
    Write-Host "   $successCount/$($services.Count) services pushed successfully.`n" -ForegroundColor Yellow
    exit 1
} else {
    Write-Host "🎉 All $($services.Count) images published successfully!`n" -ForegroundColor Green
    Write-Host "🌐 Vos images sont disponibles sur:" -ForegroundColor Cyan
    foreach ($service in $services) {
        $url = "https://hub.docker.com/r/$Username/logiway-$service"
        Write-Host "   $url" -ForegroundColor White
    }
    Write-Host ""
    exit 0
}
