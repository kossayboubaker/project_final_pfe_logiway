@echo off
echo ========================================
echo   OUVERTURE DU RAPPORT DE TESTS
echo ========================================
echo.

REM Chercher le rapport HTML de couverture dans IntelliJ
set "RAPPORT_HTML=backend\target\site\jacoco\index.html"

if exist "%RAPPORT_HTML%" (
    echo ✅ Rapport trouve: %RAPPORT_HTML%
    echo.
    echo 🌐 Ouverture dans le navigateur...
    start "" "%RAPPORT_HTML%"
    echo.
    echo ✅ Le rapport s'ouvre dans votre navigateur par defaut
) else (
    echo ❌ ERREUR: Rapport non trouve!
    echo.
    echo Le rapport devrait etre ici: %RAPPORT_HTML%
    echo.
    echo 💡 SOLUTION:
    echo    1. Dans IntelliJ, clic droit sur le fichier de test
    echo    2. Cliquer sur "Run with Coverage"
    echo    3. Attendre la fin de l'execution
    echo    4. Relancer ce fichier BAT
)

echo.
echo ========================================
pause
