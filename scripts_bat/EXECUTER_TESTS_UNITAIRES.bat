@echo off
echo ============================================
echo EXECUTION DES TESTS UNITAIRES - LOGIWAY
echo ============================================
echo.

cd backend

echo [1/5] Tests Réclamation...
call mvn test -Dtest=ReclamationServiceTest

echo.
echo [2/5] Tests Congé...
call mvn test -Dtest=CongeServiceTest

echo.
echo [3/5] Tests Trajet...
call mvn test -Dtest=TrajetServiceTest

echo.
echo [4/5] Tests User...
call mvn test -Dtest=UserServiceTest

echo.
echo [5/5] Tests Véhicule...
call mvn test -Dtest=VehiculeServiceTest

echo.
echo ============================================
echo TESTS TERMINÉS
echo ============================================
echo Pour voir le rapport HTML complet, exécutez:
echo    OUVRIR_RAPPORT_TESTS.bat
echo.
pause
