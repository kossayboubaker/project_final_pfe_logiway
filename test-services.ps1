# Script de test des services Logiway
# Vérifie que tous les services sont opérationnels

$ErrorActionPreference = 'SilentlyContinue'

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "   TEST DES SERVICES LOGIWAY" -ForegroundColor Cyan
Write-Host "========================================`n" -ForegroundColor Cyan

$services = @(
    @{Name="MySQL"; Cmd="docker ps --filter name=logiway-mysql --filter health=healthy --quiet"; Type="docker"},
    @{Name="Keycloak"; Cmd="docker ps --filter name=logiway-keycloak --filter health=healthy --quiet"; Type="docker"},
    @{Name="Backend"; Cmd="docker ps --filter name=logiway-backend --filter health=healthy --quiet"; Type="docker"},
    @{Name="Frontend"; Cmd="docker ps --filter name=logiway-frontend --filter health=healthy --quiet"; Type="docker"},
    @{Name="Pause AI"; Url="http://localhost:5000/health"; Type="http"},
    @{Name="Reclamation AI"; Url="http://localhost:5001/health"; Type="http"},
    @{Name="RAG Service"; Url="http://localhost:5003/health"; Type="http"}
)

$successCount = 0
$totalCount = $services.Count

foreach ($service in $services) {
    Write-Host "Vérification: " -NoNewline
    Write-Host $service.Name -ForegroundColor Yellow -NoNewline
    Write-Host " ... " -NoNewline
    
    if ($service.Type -eq "docker") {
        $result = Invoke-Expression $service.Cmd
        if ($result) {
            Write-Host "✅ OK" -ForegroundColor Green
            $successCount++
        } else {
            Write-Host "❌ FAIL" -ForegroundColor Red
        }
    } elseif ($service.Type -eq "http") {
        try {
            $response = Invoke-WebRequest -Uri $service.Url -UseBasicParsing -TimeoutSec 5
            if ($response.StatusCode -eq 200) {
                Write-Host "✅ OK" -ForegroundColor Green
                $successCount++
            } else {
                Write-Host "❌ FAIL (Status: $($response.StatusCode))" -ForegroundColor Red
            }
        } catch {
            Write-Host "❌ FAIL (Inaccessible)" -ForegroundColor Red
        }
    }
}

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "   RÉSULTAT: $successCount / $totalCount services OK" -ForegroundColor $(if ($successCount -eq $totalCount) {"Green"} else {"Yellow"})
Write-Host "========================================`n" -ForegroundColor Cyan

# Test des URLs publiques
Write-Host "`nURLs d'accès:" -ForegroundColor Cyan
Write-Host "  Frontend:         http://localhost:4200" -ForegroundColor White
Write-Host "  Keycloak Admin:   http://localhost:8180" -ForegroundColor White
Write-Host "  Backend API:      http://localhost:8080" -ForegroundColor White
Write-Host "  Pause AI:         http://localhost:5000/health" -ForegroundColor White
Write-Host "  Reclamation AI:   http://localhost:5001/health" -ForegroundColor White
Write-Host "  RAG Service:      http://localhost:5003/health" -ForegroundColor White

Write-Host "`nIdentifiants:" -ForegroundColor Cyan
Write-Host "  Keycloak Admin:   admin / admin" -ForegroundColor White
Write-Host "  User App:         logiAdmin@logiway.com / logiwayadmin" -ForegroundColor White

if ($successCount -eq $totalCount) {
    Write-Host "`n🎉 Tous les services sont opérationnels!" -ForegroundColor Green
} else {
    Write-Host "`n⚠️  Certains services ne répondent pas. Vérifiez les logs:" -ForegroundColor Yellow
    Write-Host "    docker-compose logs <nom-du-service>" -ForegroundColor Gray
}
