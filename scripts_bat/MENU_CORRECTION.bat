@echo off
:menu
cls
echo ================================================================
echo        MENU - CORRECTION ERREUR 500 PAUSE AI
echo ================================================================
echo.
echo 1. Voir le resume rapide (TXT)
echo 2. Ouvrir la documentation technique (MD)
echo 3. Voir l'historique du debug (MD)
echo 4. Ouvrir le guide de test (MD)
echo 5. Voir la synthese complete (MD)
echo 6. Redemarrer le service Pause AI
echo 7. Quitter
echo.
echo ================================================================
set /p choix="Votre choix (1-7): "

if "%choix%"=="1" (
    cls
    type SOLUTION_FINALE_PAUSE_AI.txt
    pause
    goto menu
)
if "%choix%"=="2" (
    start notepad CORRECTION_ERREUR_500_FINALE.md
    goto menu
)
if "%choix%"=="3" (
    start notepad HISTORIQUE_DEBUG_ERREUR_500.md
    goto menu
)
if "%choix%"=="4" (
    start notepad COMMENT_TESTER_CORRECTION.md
    goto menu
)
if "%choix%"=="5" (
    start notepad SYNTHESE_COMPLETE_CORRECTION.md
    goto menu
)
if "%choix%"=="6" (
    echo.
    echo Redemarrage du service Pause AI...
    cd pause-ai-service
    call RESTART_SERVICE.bat
    cd ..
    goto menu
)
if "%choix%"=="7" (
    exit
)

echo Choix invalide. Appuyez sur une touche pour continuer...
pause > nul
goto menu
