@echo off
REM ========================================
REM   PAUSE AI SERVICE - DEMARRAGE
REM   Port: 5000
REM   Type: Machine Learning - RandomForest
REM ========================================

echo.
echo ========================================
echo   LOGIWAY - PAUSE AI SERVICE
echo ========================================
echo   Port: 5000
echo   Mode: Development
echo ========================================
echo.

REM Aller dans le bon répertoire
cd /d "%~dp0"

REM Vérifier si l'environnement virtuel existe
if not exist "venv\Scripts\activate.bat" (
    echo [ERREUR] Environnement virtuel non trouve
    echo.
    echo Veuillez d'abord executer : setup_pause_ai.bat
    echo.
    pause
    exit /b 1
)

REM Activer l'environnement virtuel
echo [1/3] Activation environnement virtuel Python...
call venv\Scripts\activate.bat

REM Vérifier que Flask est installé
python -c "import flask" 2>nul
if errorlevel 1 (
    echo [ERREUR] Flask non installe
    echo.
    echo Veuillez d'abord executer : setup_pause_ai.bat
    echo.
    pause
    exit /b 1
)

REM Vérifier si le port 5000 est libre
echo [2/3] Verification port 5000...
netstat -an | findstr ":5000" >nul
if not errorlevel 1 (
    echo [ATTENTION] Le port 5000 est deja utilise
    echo.
    echo Voulez-vous arreter le processus existant ? (O/N)
    set /p choice=Choix: 
    if /i "%choice%"=="O" (
        for /f "tokens=5" %%a in ('netstat -ano ^| findstr ":5000"') do (
            echo Arret du processus %%a...
            taskkill /PID %%a /F >nul 2>&1
        )
        timeout /t 2 >nul
    ) else (
        echo Demarrage annule.
        pause
        exit /b 1
    )
)

REM Lancer le service
echo [3/3] Demarrage du service Pause AI...
echo.
echo ========================================
echo   SERVICE DEMARRE
echo   URL: http://localhost:5000
echo   Health: http://localhost:5000/health
echo ========================================
echo.
echo Appuyez sur Ctrl+C pour arreter
echo.

python app.py

pause
