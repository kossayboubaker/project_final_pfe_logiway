@echo off
echo ====================================
echo   Tests du Service IA
echo ====================================
echo.

REM Test de santé
echo 1️⃣  Test de santé du service...
curl -s http://localhost:5001/health
if %errorlevel% neq 0 (
    echo ❌ Service non accessible sur http://localhost:5001
    echo Vérifiez que le service est démarré avec start.bat
    pause
    exit /b 1
)
echo.
echo ✅ Service accessible

echo.
echo 2️⃣  Test validation texte valide...
curl -X POST http://localhost:5001/validate ^
  -H "Content-Type: application/json" ^
  -d "{\"text\":\"Le camion ne démarre plus\",\"field\":\"sujet\"}"
echo.

echo.
echo 3️⃣  Test validation texte toxique...
curl -X POST http://localhost:5001/validate ^
  -H "Content-Type: application/json" ^
  -d "{\"text\":\"fuck you\",\"field\":\"sujet\"}"
echo.

echo.
echo 4️⃣  Test validation texte hors sujet...
curl -X POST http://localhost:5001/validate ^
  -H "Content-Type: application/json" ^
  -d "{\"text\":\"recette de cuisine\",\"field\":\"description\"}"
echo.

echo.
echo ✅ Tests terminés
pause