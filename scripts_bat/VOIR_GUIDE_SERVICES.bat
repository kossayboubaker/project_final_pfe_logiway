@echo off
title GUIDE DES SERVICES IA
color 0B
type "%~dp0GUIDE_SIMPLE_SERVICES.txt"
echo.
echo ================================================================
echo Appuie sur une touche pour voir les chemins complets...
echo ================================================================
pause >nul
cls
type "%~dp0CHEMINS_SERVICES_IA.txt"
echo.
echo ================================================================
echo Veux-tu demarrer tous les services maintenant ?
echo ================================================================
echo.
set /p choix="Taper O pour demarrer, N pour quitter : "
if /i "%choix%"=="O" (
    start "" "%~dp0DEMARRER_TOUS_SERVICES.bat"
)
pause
