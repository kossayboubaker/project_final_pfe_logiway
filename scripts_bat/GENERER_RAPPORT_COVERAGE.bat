@echo off
echo ================================================================
echo GENERATION DU RAPPORT DE COUVERTURE DE CODE
echo ================================================================
echo.
echo Etape 1/3 : Nettoyage...
cd backend
call mvn clean

echo.
echo Etape 2/3 : Execution des tests avec Jacoco...
call mvn test jacoco:report

echo.
echo Etape 3/3 : Ouverture du rapport HTML...
start target\site\jacoco\index.html

echo.
echo ================================================================
echo TERMINE - Le rapport s'ouvre dans votre navigateur
echo ================================================================
pause
