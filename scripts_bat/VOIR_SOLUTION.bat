@echo off
title SOLUTION - ERREUR PowerShell
color 0C
cls
type "%~dp0SOLUTION_ERREUR_POWERSHELL.txt"
echo.
echo ================================================================
echo   Veux-tu installer et demarrer les services maintenant ?
echo ================================================================
echo.
set /p choix="Taper O pour installer et demarrer, N pour annuler : "
if /i "%choix%"=="O" (
    cls
    echo.
    echo Lancement de l'installation...
    echo.
    start "" "%~dp0INSTALLER_ET_DEMARRER_SERVICES.bat"
)
pause
