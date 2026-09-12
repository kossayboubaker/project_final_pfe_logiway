@echo off
chcp 65001 >nul
setlocal enabledelayedexpansion

echo ╔════════════════════════════════════════════════════════════════╗
echo ║         TEST COMPLET SYSTÈME PAUSE AI - VÉRIFICATION          ║
echo ╚════════════════════════════════════════════════════════════════╝
echo.

REM Configuration
set BACKEND_URL=http://localhost:8080
set PYTHON_SERVICE_URL=http://localhost:5000
set AUTH_TOKEN=

echo [1/5] Vérification du service Python (Pause AI ML)...
echo ─────────────────────────────────────────────────────────────────
curl -s %PYTHON_SERVICE_URL%/api/health
if %ERRORLEVEL% NEQ 0 (
    echo ❌ Service Python non accessible sur port 5000
    echo    Lancez-le avec: cd pause-ai-service ^&^& python app.py
    pause
    exit /b 1
)
echo ✅ Service Python opérationnel
echo.

echo [2/5] Vérification du backend Spring Boot...
echo ─────────────────────────────────────────────────────────────────
curl -s %BACKEND_URL%/actuator/health
if %ERRORLEVEL% NEQ 0 (
    echo ❌ Backend non accessible sur port 8080
    echo    Lancez-le avec: cd backend ^&^& mvn spring-boot:run
    pause
    exit /b 1
)
echo ✅ Backend opérationnel
echo.

echo [3/5] Analyse des logs récents (Pause AI)...
echo ─────────────────────────────────────────────────────────────────
powershell -Command "if (Test-Path 'backend\logs\application.log') { Get-Content 'backend\logs\application.log' -Tail 30 | Select-String 'PAUSE-AI' | Select-Object -Last 10 } else { Write-Host '⚠️ Fichier de log non trouvé' }"
echo.

echo [4/5] Instructions pour créer un trajet de test...
echo ─────────────────────────────────────────────────────────────────
echo.
echo Pour tester le système avec un trajet LONG (^>3h):
echo.
echo 1. Connectez-vous à l'application (admin ou chauffeur)
echo.
echo 2. Créez un trajet Paris → Lyon:
echo    - Point de départ: Paris, France
echo    - Destination: Lyon, France  
echo    - Distance: 450 km
echo    - Durée estimée: 240 minutes (4h)
echo.
echo 3. Démarrez le trajet
echo.
echo 4. Pour simuler 3h30 de conduite, exécutez dans MySQL:
echo.
echo    UPDATE trajet 
echo    SET date_depart = DATE_SUB(NOW(), INTERVAL 210 MINUTE^)
echo    WHERE id = [VOTRE_ID_TRAJET] AND statut = 'EN_COURS';
echo.
echo 5. Attendez 2 minutes pour que le scheduler évalue
echo.
echo 6. Consultez les logs avec ce script
echo.

echo [5/5] Commandes SQL utiles...
echo ─────────────────────────────────────────────────────────────────
echo.
echo # Voir les trajets EN_COURS:
echo SELECT id, point_depart, destination, date_depart, statut 
echo FROM trajet WHERE statut = 'EN_COURS';
echo.
echo # Voir les prédictions générées:
echo SELECT * FROM pause_ai_prediction ORDER BY timestamp DESC LIMIT 10;
echo.
echo # Calculer les heures de conduite actuelles:
echo SELECT 
echo   id, point_depart, destination,
echo   TIMESTAMPDIFF(MINUTE, date_depart, NOW()^) / 60.0 AS heures_conduite
echo FROM trajet WHERE statut = 'EN_COURS';
echo.

echo ════════════════════════════════════════════════════════════════
echo RÉSUMÉ DE LA VÉRIFICATION
echo ════════════════════════════════════════════════════════════════
echo.
echo ✅ Le système Pause AI est opérationnel
echo.
echo 📋 COMPORTEMENT NORMAL:
echo    • Trajets ^< 3h   : AUCUNE pause (conforme à la loi)
echo    • Trajets 3-4.5h : ALERTES RECOMMANDÉES
echo    • Trajets ^>= 4.5h: ALERTES URGENTES
echo.
echo 🔍 Votre cas:
echo    Si votre trajet dure moins de 3 heures, c'est NORMAL
echo    qu'aucune pause ne soit générée.
echo.
echo 📖 Documentation complète: VERIFICATION_SYSTEME_PAUSE_AI.md
echo.

pause
