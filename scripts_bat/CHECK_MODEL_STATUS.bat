@echo off
chcp 65001 >nul
cls
echo ═══════════════════════════════════════════════════════════════════════════
echo                     VÉRIFICATION MODÈLE PAUSE AI
echo ═══════════════════════════════════════════════════════════════════════════
echo.

cd /d "%~dp0\pause-ai-service"

echo [1/4] Vérification Python...
python --version
if %ERRORLEVEL% NEQ 0 (
    echo ❌ Python non trouvé
    pause
    exit /b 1
)
echo.

echo [2/4] Vérification scikit-learn...
python -c "import sklearn; print(f'Version: {sklearn.__version__}')"
if %ERRORLEVEL% NEQ 0 (
    echo ❌ scikit-learn non installé
    pause
    exit /b 1
)
echo.

echo [3/4] Vérification du modèle...
python -c "from model import PauseAIModel; m = PauseAIModel(); print(f'Modèle entraîné: {m.is_trained()}')"
if %ERRORLEVEL% NEQ 0 (
    echo ❌ Erreur lors du chargement du modèle
    echo.
    echo SOLUTION: Exécuter fix_model_version.bat
    pause
    exit /b 1
)
echo.

echo [4/4] Test API Health Check...
powershell -Command "try { $r = Invoke-WebRequest -Uri http://localhost:5000/api/health -UseBasicParsing -ErrorAction Stop; Write-Host 'Status:' $r.StatusCode; Write-Host 'Content:' $r.Content } catch { Write-Host '❌ Serveur Flask non accessible (lancez python app.py)' }"
echo.

echo ═══════════════════════════════════════════════════════════════════════════
echo DIAGNOSTIC TERMINÉ
echo ═══════════════════════════════════════════════════════════════════════════
echo.
echo Si vous voyez des erreurs de version:
echo   → Exécuter: pause-ai-service\fix_model_version.bat
echo.
pause
