@echo off
chcp 65001 > nul
echo ╔══════════════════════════════════════════════════════════════════╗
echo ║     EXÉCUTION TESTS UNITAIRES - COVERAGE 99-100%%                ║
echo ╚══════════════════════════════════════════════════════════════════╝
echo.
echo [1/3] Compilation du projet...
cd backend
call mvn clean compile -DskipTests
echo.
echo [2/3] Exécution des tests unitaires...
call mvn test jacoco:report
echo.
echo [3/3] Génération du rapport de coverage...
echo.
echo ╔══════════════════════════════════════════════════════════════════╗
echo ║                    RAPPORT DE COVERAGE                            ║
echo ╚══════════════════════════════════════════════════════════════════╝
echo.
echo Ouvrir le rapport HTML: backend\target\site\jacoco\index.html
echo.
start "" "target\site\jacoco\index.html"
echo.
pause
