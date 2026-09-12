@echo off
REM ========================================
REM   PAUSE AI SERVICE - INSTALLATION
REM   Configuration environnement Python
REM ========================================

echo.
echo ========================================
echo   PAUSE AI SERVICE - INSTALLATION
echo ========================================
echo.

REM Aller dans le bon répertoire
cd /d "%~dp0"

REM Vérifier que Python est installé
python --version >nul 2>&1
if errorlevel 1 (
    echo [ERREUR] Python n'est pas installe ou pas dans le PATH
    echo.
    echo Veuillez installer Python 3.11+ depuis :
    echo https://www.python.org/downloads/
    echo.
    echo IMPORTANT: Cocher "Add Python to PATH" pendant l'installation
    echo.
    pause
    exit /b 1
)

echo [1/4] Python detecte :
python --version
echo.

REM Créer l'environnement virtuel
if exist "venv\" (
    echo [2/4] Environnement virtuel deja existant
    echo Voulez-vous le supprimer et recreer ? (O/N)
    set /p choice=Choix: 
    if /i "%choice%"=="O" (
        echo Suppression de l'ancien environnement...
        rmdir /s /q venv
    ) else (
        goto :skip_venv_creation
    )
)

echo [2/4] Creation environnement virtuel...
python -m venv venv
if errorlevel 1 (
    echo [ERREUR] Echec creation environnement virtuel
    pause
    exit /b 1
)

:skip_venv_creation

REM Activer l'environnement virtuel
echo [3/4] Activation environnement virtuel...
call venv\Scripts\activate.bat

REM Mettre à jour pip
echo [INFO] Mise a jour de pip...
python -m pip install --upgrade pip --quiet

REM Installer les dépendances
echo [4/4] Installation des dependances Python...
echo (Cela peut prendre 2-3 minutes...)
echo.

pip install -r requirements.txt

if errorlevel 1 (
    echo.
    echo [ERREUR] Echec installation des dependances
    echo.
    echo Verifiez votre connexion Internet et reessayez.
    pause
    exit /b 1
)

REM Vérifier l'installation
echo.
echo ========================================
echo   VERIFICATION DE L'INSTALLATION
echo ========================================
echo.

python -c "import sklearn; print('[OK] scikit-learn:', sklearn.__version__)"
python -c "import numpy; print('[OK] numpy:', numpy.__version__)"
python -c "import pandas; print('[OK] pandas:', pandas.__version__)"
python -c "import flask; print('[OK] flask:', flask.__version__)"
python -c "import requests; print('[OK] requests:', requests.__version__)"

echo.
echo ========================================
echo   INSTALLATION TERMINEE !
echo ========================================
echo.
echo Pour demarrer le service, executez :
echo   start_pause_ai.bat
echo.
echo Pour tester le service :
echo   test_pause_ai.bat
echo.

pause
