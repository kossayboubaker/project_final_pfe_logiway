# Script de publication Docker Hub
param(
    [string]$Username = "kossaybr",
    [string]$Version = "latest"
)

Write-Host "Publishing to Docker Hub as $Username..." -ForegroundColor Cyan

# Login check
docker login
if ($LASTEXITCODE -ne 0) {
    Write-Host "Login failed!" -ForegroundColor Red
    exit 1
}

$services = @("backend", "frontend", "pause-ai", "reclamation-ai", "rag-service")
$successCount = 0

foreach ($service in $services) {
    Write-Host "`nProcessing logiway-$service..." -ForegroundColor Yellow
    
    $localImage = "logiway-${service}:latest"
    $remoteImage = "${Username}/logiway-${service}:${Version}"
    
    # Tag
    docker tag $localImage $remoteImage
    if ($LASTEXITCODE -ne 0) {
        Write-Host "Tag failed for $service" -ForegroundColor Red
        continue
    }
    
    # Push
    docker push $remoteImage
    if ($LASTEXITCODE -eq 0) {
        Write-Host "Success: $service" -ForegroundColor Green
        $successCount++
    } else {
        Write-Host "Push failed for $service" -ForegroundColor Red
    }
}

Write-Host "`n$successCount / $($services.Count) images published" -ForegroundColor Cyan
