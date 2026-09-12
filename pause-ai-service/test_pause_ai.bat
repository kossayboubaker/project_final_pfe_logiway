@echo off
REM ========================================
REM   PAUSE AI SERVICE - TESTS
REM   Verification du fonctionnement
REM ========================================

echo.
echo ========================================
echo   TESTS PAUSE AI SERVICE
echo ========================================
echo.

REM Vérifier que curl est installé
curl --version >nul 2>&1
if errorlevel 1 (
    echo [ERREUR] curl n'est pas installe
    echo.
    echo Veuillez installer curl ou utiliser un navigateur pour tester :
    echo   http://localhost:5000/health
    echo.
    pause
    exit /b 1
)

echo [TEST 1/4] Health Check...
curl -s http://localhost:5000/health
if errorlevel 1 (
    echo [ECHEC] Le service ne repond pas
    echo.
    echo Verifiez que le service est demarre avec : start_pause_ai.bat
    pause
    exit /b 1
)
echo.
echo [OK] Service actif
echo.
timeout /t 2 >nul

echo [TEST 2/4] Entrainement du modele ML...
echo (Cela peut prendre 30 secondes...)
curl -s -X POST http://localhost:5000/api/train > train_result.txt
if errorlevel 1 (
    echo [ECHEC] Erreur lors de l'entrainement
) else (
    echo [OK] Modele entraine avec succes
    echo.
    echo Resultats :
    type train_result.txt
    del train_result.txt
)
echo.
timeout /t 2 >nul

echo [TEST 3/4] Test de prediction...
curl -s -X POST http://localhost:5000/api/predict ^
  -H "Content-Type: application/json" ^
  -d "{\"startLat\": 48.8566, \"startLon\": 2.3522, \"endLat\": 45.764, \"endLon\": 4.8357, \"trip_id\": 1}" > prediction_result.txt

if errorlevel 1 (
    echo [ECHEC] Erreur lors de la prediction
) else (
    echo [OK] Prediction effectuee
    echo.
    echo Resultats (extrait) :
    findstr /C:"stops" prediction_result.txt
    del prediction_result.txt
)
echo.
timeout /t 2 >nul

echo [TEST 4/4] Verification des endpoints...
echo - Health: http://localhost:5000/health
echo - Train: POST http://localhost:5000/api/train
echo - Predict: POST http://localhost:5000/api/predict
echo.

echo ========================================
echo   TESTS TERMINES
echo ========================================
echo.
echo Pour voir les logs en temps reel :
echo   docker logs -f logiway-pause-ai
echo.
echo Pour acceder au service dans le navigateur :
echo   http://localhost:5000/health
echo.

pause
