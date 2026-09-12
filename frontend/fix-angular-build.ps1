# Script pour corriger les problèmes de build Angular

Write-Host "🧹 Nettoyage du cache Angular..." -ForegroundColor Yellow

# Supprimer le cache Angular
if (Test-Path ".angular/cache") {
    Remove-Item -Recurse -Force ".angular/cache"
    Write-Host "✅ Cache Angular supprimé" -ForegroundColor Green
}

# Supprimer node_modules/.cache
if (Test-Path "node_modules/.cache") {
    Remove-Item -Recurse -Force "node_modules/.cache"
    Write-Host "✅ Cache node_modules supprimé" -ForegroundColor Green
}

# Supprimer dist
if (Test-Path "dist") {
    Remove-Item -Recurse -Force "dist"
    Write-Host "✅ Dossier dist supprimé" -ForegroundColor Green
}

Write-Host ""
Write-Host "🔄 Redémarrage du serveur de développement..." -ForegroundColor Yellow
Write-Host ""
Write-Host "Exécutez maintenant: ng serve --o" -ForegroundColor Cyan
Write-Host ""
Write-Host "Si le problème persiste, essayez:" -ForegroundColor Yellow
Write-Host "  1. Ctrl+C pour arrêter le serveur" -ForegroundColor White
Write-Host "  2. npm install" -ForegroundColor White
Write-Host "  3. ng serve --o" -ForegroundColor White
