@echo off
echo ====================================
echo   Service IA - Validation Reclamations
echo ====================================
echo.

REM Vérifier si Python est installé
python --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Python n'est pas installé ou pas dans le PATH
    echo Installez Python depuis https://www.python.org/downloads/
    pause
    exit /b 1
)

echo ✅ Python détecté

REM Créer l'environnement virtuel s'il n'existe pas
if not exist "venv" (
    echo 📦 Création de l'environnement virtuel...
    python -m venv venv
    if %errorlevel% neq 0 (
        echo ❌ Impossible de créer l'environnement virtuel
        pause
        exit /b 1
    )
    echo ✅ Environnement virtuel créé
)

REM Activer l'environnement virtuel
echo 🔧 Activation de l'environnement virtuel...
call venv\Scripts\activate.bat
if %errorlevel% neq 0 (
    echo ❌ Impossible d'activer l'environnement virtuel
    pause
    exit /b 1
)

REM Installer les dépendances
echo 📥 Installation des dépendances...
pip install -r requirements.txt
if %errorlevel% neq 0 (
    echo ❌ Erreur lors de l'installation des dépendances
    pause
    exit /b 1
)

echo.
echo 🚀 Démarrage du service IA...
echo ⚠️  Premier démarrage : téléchargement des modèles (~500 MB)
echo.

REM Démarrer l'application Flask
python app.py

pause