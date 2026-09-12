Write-Host "== Run LogiWay simulation (local) =="

if (Test-Path -Path ".\\.venv\\Scripts\\Activate.ps1") {
    Write-Host "Activation du virtualenv .venv..."
    & .\\.venv\\Scripts\\Activate.ps1
} else {
    Write-Host "Aucun .venv trouvé. Assurez-vous d'activer votre environnement Python manuellement." -ForegroundColor Yellow
}

$argsLine = $args -join ' '
if (-not $argsLine) {
    Write-Host "Lancement du simulateur en mode auto-détection (utilise /api/trajets/carte)..."
    python simulator\run_simulation.py
} else {
    Write-Host "Lancement du simulateur avec : $argsLine"
    python simulator\run_simulation.py $argsLine
}
