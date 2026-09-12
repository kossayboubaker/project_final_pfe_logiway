@echo off
chcp 65001 >nul
cls
echo ═══════════════════════════════════════════════════════════════════════════
echo              FIX ERREUR VERSION MODÈLE PAUSE AI
echo ═══════════════════════════════════════════════════════════════════════════
echo.
echo 🔍 PROBLÈME DÉTECTÉ:
echo    Le modèle a été entraîné avec scikit-learn 1.6.1
echo    mais votre système utilise scikit-learn 1.9.0
echo.
echo 🔧 SOLUTION:
echo    Ré-entraîner le modèle avec la version actuelle
echo.
echo ─────────────────────────────────────────────────────────────────────────
echo.

cd /d "%~dp0"

echo [1/3] Vérification de l'environnement Python...
python --version
if %ERRORLEVEL% NEQ 0 (
    echo ❌ Python n'est pas installé ou pas dans le PATH
    pause
    exit /b 1
)
echo.

echo [2/3] Vérification des dépendances...
python -c "import sklearn; print(f'✅ scikit-learn {sklearn.__version__}')" 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo ❌ scikit-learn n'est pas installé
    echo    Installation: pip install scikit-learn
    pause
    exit /b 1
)
echo.

echo [3/3] Ré-entraînement du modèle...
echo ─────────────────────────────────────────────────────────────────────────
python retrain_model.py
if %ERRORLEVEL% NEQ 0 (
    echo.
    echo ❌ Erreur lors du ré-entraînement
    pause
    exit /b 1
)

echo.
echo ═══════════════════════════════════════════════════════════════════════════
echo ✅ CORRECTION TERMINÉE AVEC SUCCÈS
echo ═══════════════════════════════════════════════════════════════════════════
echo.
echo PROCHAINES ÉTAPES:
echo 1. Arrêter le serveur Flask (CTRL+C dans la console)
echo 2. Redémarrer le serveur: python app.py
echo 3. Tester à nouveau dans l'application
echo.
pause
