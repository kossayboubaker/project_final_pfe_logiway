@echo off
echo ========================================
echo   REDEMARRAGE SERVICE PAUSE AI
echo ========================================
echo.
echo [INFO] Arret du service existant...
echo [INFO] Appuyez sur CTRL+C si un service tourne deja
echo.
timeout /t 3 /nobreak > nul

echo [INFO] Demarrage du service Flask avec debug=True
echo [INFO] Port: 5000
echo.

python app.py

pause
