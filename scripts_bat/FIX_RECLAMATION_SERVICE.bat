@echo off
title INSTALLATION RECLAMATION AI SERVICE
color 0E

echo ================================================================
echo   INSTALLATION RECLAMATION AI SERVICE
echo ================================================================
echo.
echo [1/2] Installation des dependances Python...
echo.

cd /d "%~dp0reclamation-ai-service"

pip install flask flask-cors transformers torch --no-warn-script-location

if %ERRORLEVEL% NEQ 0 (
    echo.
    echo ================================================================
    echo   ERREUR: Installation echouee
    echo ================================================================
    echo.
    echo Essaye avec Python directement:
    echo   python -m pip install flask flask-cors transformers torch
    echo.
    pause
    exit /b 1
)

echo.
echo ================================================================
echo   [2/2] Demarrage du service...
echo ================================================================
echo.

python app_simple.py

pause
