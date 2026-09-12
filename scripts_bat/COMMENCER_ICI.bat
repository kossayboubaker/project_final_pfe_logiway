@echo off
color 0A
cls
type START_HERE_TESTS.txt
echo.
echo ═══════════════════════════════════════════════════════════════
echo.
echo   Que souhaitez-vous faire ?
echo.
echo   1. Ouvrir le MENU INTERACTIF (recommandé)
echo   2. Voir le résumé ASCII
echo   3. Exécuter les tests maintenant
echo   4. Voir la documentation
echo   0. Quitter
echo.
echo ═══════════════════════════════════════════════════════════════
echo.
set /p choice="Votre choix (0-4) : "

if "%choice%"=="1" (
    start MENU_TESTS.bat
    exit
)
if "%choice%"=="2" (
    call VOIR_TESTS_READY.bat
    exit
)
if "%choice%"=="3" (
    call EXECUTER_TESTS_UNITAIRES.bat
    exit
)
if "%choice%"=="4" (
    start INDEX_TESTS_UNITAIRES.md
    exit
)
if "%choice%"=="0" exit

pause
