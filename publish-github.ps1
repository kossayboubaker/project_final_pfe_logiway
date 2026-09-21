# ===========================================
# Publish Images sur GitHub Container Registry
# ===========================================

param(
    [Parameter(Mandatory=$true, HelpMessage="Votre username GitHub")]
    [string]$Username,
    
    [Parameter(Mandatory=$true, HelpMessage="GitHub Personal Access Token (PAT)")]
    [string]$Token,
    
    [Parameter(Mandatory=$false, HelpMessage="Tag de version (ex: v1.0.0)")]
    [string]$Version = "latest"
)

Write-Host "`n📤 Publishing to GitHub Container Registry..." -ForegroundColor Cyan
Write-Host "============================================" -ForegroundColor Cyan
Write-Host "Username: $Username" -ForegroundColor White
Write-Host "Registry: ghcr.io" -ForegroundColor White
Write-Host "Version : $Version`n" -ForegroundColor White

# Login à GitHub Container Registry
Write-Host "🔐 Logging in to ghcr.io..." -ForegroundColor Yellow
echo $Token | docker login ghcr.io -u $Username --password-stdin

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ GitHub Container Registry login failed." -ForegroundColor Red
    Write-Host "   Vérifiez votre token et username.`n" -ForegroundColor Red
    exit 1
}

Write-Host "✅ Login successful!`n" -ForegroundColor Green

$services = @("backend", "frontend", "pause-ai", "reclamation-ai", "rag-service")
$pushFailed = $false
$successCount = 0

foreach ($service in $services) {
    Write-Host "`n🏷️  Processing logiway-$service..." -ForegroundColor Yellow
    
    # Tag l'image
    $localImage = "logiway-${service}:latest"
    $remoteImage = "ghcr.io/${Username}/logiway-${service}:${Version}"
    
    Write-Host "   Tagging: $localImage -> $remoteImage" -ForegroundColor Gray
    docker tag $localImage $remoteImage
    
    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ Failed to tag $service" -ForegroundColor Red
        $pushFailed = $true
        continue
    }
    
    # Si version != latest, tag aussi avec latest
    if ($Version -ne "latest") {
        $latestImage = "ghcr.io/${Username}/logiway-${service}:latest"
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
            docker push "ghcr.io/${Username}/logiway-${service}:latest"
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
    Write-Host "   https://github.com/$Username?tab=packages`n" -ForegroundColor White
    Write-Host "⚠️  N'oubliez pas de rendre les packages publics si nécessaire:" -ForegroundColor Yellow
    Write-Host "   Package Settings > Change visibility > Public`n" -ForegroundColor Gray
    exit 0
}
