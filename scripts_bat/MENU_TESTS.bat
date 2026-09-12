@echo off
color 0A
title Menu Tests Unitaires - Logiway

:MENU
cls
echo ╔═══════════════════════════════════════════════════════════════╗
echo ║                                                               ║
echo ║           MENU TESTS UNITAIRES - LOGIWAY                      ║
echo ║                                                               ║
echo ╚═══════════════════════════════════════════════════════════════╝
echo.
echo   [INFO] 58 tests unitaires disponibles pour 5 services
echo.
echo ┌───────────────────────────────────────────────────────────────┐
echo │  📋 DOCUMENTATION                                             │
echo └───────────────────────────────────────────────────────────────┘
echo.
echo   1. Voir le résumé rapide (ASCII)
echo   2. Ouvrir l'index complet
echo   3. Ouvrir la synthèse 1 page
echo   4. Ouvrir le guide complet
echo.
echo ┌───────────────────────────────────────────────────────────────┐
echo │  ▶️ EXÉCUTION                                                 │
echo └───────────────────────────────────────────────────────────────┘
echo.
echo   5. Exécuter TOUS les tests (58 tests)
echo   6. Exécuter tests par service (menu)
echo.
echo ┌───────────────────────────────────────────────────────────────┐
echo │  📊 RAPPORTS                                                  │
echo └───────────────────────────────────────────────────────────────┘
echo.
echo   7. Ouvrir le rapport de couverture HTML
echo   8. Générer un nouveau rapport de couverture
echo.
echo ┌───────────────────────────────────────────────────────────────┐
echo │  📂 FICHIERS                                                  │
echo └───────────────────────────────────────────────────────────────┘
echo.
echo   9. Ouvrir le dossier des tests
echo.
echo   0. Quitter
echo.
echo ═══════════════════════════════════════════════════════════════
set /p choice="Votre choix (0-9) : "

if "%choice%"=="1" goto RESUME
if "%choice%"=="2" goto INDEX
if "%choice%"=="3" goto SYNTHESE
if "%choice%"=="4" goto GUIDE
if "%choice%"=="5" goto EXECUTE_ALL
if "%choice%"=="6" goto EXECUTE_SERVICE
if "%choice%"=="7" goto RAPPORT
if "%choice%"=="8" goto GENERER_RAPPORT
if "%choice%"=="9" goto FICHIERS
if "%choice%"=="0" goto FIN
goto MENU

:RESUME
cls
type TESTS_READY.txt
echo.
pause
goto MENU

:INDEX
start INDEX_TESTS_UNITAIRES.md
goto MENU

:SYNTHESE
start TESTS_SYNTHESE_1_PAGE.md
goto MENU

:GUIDE
start TESTS_UNITAIRES_COMPLETS.md
goto MENU

:EXECUTE_ALL
cls
echo ════════════════════════════════════════════════════════════════
echo   EXÉCUTION DE TOUS LES TESTS
echo ════════════════════════════════════════════════════════════════
echo.
cd backend
call mvn test
echo.
echo ════════════════════════════════════════════════════════════════
echo   TESTS TERMINÉS
echo ════════════════════════════════════════════════════════════════
pause
goto MENU

:EXECUTE_SERVICE
cls
echo ════════════════════════════════════════════════════════════════
echo   MENU - TESTS PAR SERVICE
echo ════════════════════════════════════════════════════════════════
echo.
echo   1. ReclamationService (10 tests)
echo   2. CongeService (10 tests)
echo   3. TrajetService (12 tests)
echo   4. UserService (14 tests)
echo   5. VehiculeService (12 tests)
echo.
echo   0. Retour au menu principal
echo.
set /p svchoice="Votre choix (0-5) : "

cd backend

if "%svchoice%"=="1" (
    cls
    echo Exécution des tests ReclamationService...
    call mvn test -Dtest=ReclamationServiceTest
    pause
    goto EXECUTE_SERVICE
)
if "%svchoice%"=="2" (
    cls
    echo Exécution des tests CongeService...
    call mvn test -Dtest=CongeServiceTest
    pause
    goto EXECUTE_SERVICE
)
if "%svchoice%"=="3" (
    cls
    echo Exécution des tests TrajetService...
    call mvn test -Dtest=TrajetServiceTest
    pause
    goto EXECUTE_SERVICE
)
if "%svchoice%"=="4" (
    cls
    echo Exécution des tests UserService...
    call mvn test -Dtest=UserServiceTest
    pause
    goto EXECUTE_SERVICE
)
if "%svchoice%"=="5" (
    cls
    echo Exécution des tests VehiculeService...
    call mvn test -Dtest=VehiculeServiceTest
    pause
    goto EXECUTE_SERVICE
)
if "%svchoice%"=="0" goto MENU
goto EXECUTE_SERVICE

:RAPPORT
if exist "backend\htmlReport\index.html" (
    start backend\htmlReport\index.html
) else (
    echo.
    echo ⚠️  Le rapport n'existe pas encore.
    echo.
    echo Voulez-vous le générer maintenant ? (O/N)
    set /p generer=""
    if /i "%generer%"=="O" goto GENERER_RAPPORT
)
goto MENU

:GENERER_RAPPORT
cls
echo ════════════════════════════════════════════════════════════════
echo   GÉNÉRATION DU RAPPORT DE COUVERTURE
echo ════════════════════════════════════════════════════════════════
echo.
cd backend
call mvn clean test jacoco:report
echo.
echo ════════════════════════════════════════════════════════════════
echo   RAPPORT GÉNÉRÉ
echo ════════════════════════════════════════════════════════════════
echo.
echo Voulez-vous l'ouvrir maintenant ? (O/N)
set /p ouvrir=""
if /i "%ouvrir%"=="O" start htmlReport\index.html
pause
goto MENU

:FICHIERS
start explorer backend\src\test\java\com\logiway\services
goto MENU

:FIN
cls
echo.
echo ══════════════════════════════════════════════════════════════
echo.
echo         Merci d'avoir utilisé le Menu Tests Unitaires !
echo.
echo ══════════════════════════════════════════════════════════════
echo.
timeout /t 2 >nul
exit
