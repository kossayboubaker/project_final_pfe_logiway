@echo off
chcp 65001 > nul
cls
echo.
echo ═══════════════════════════════════════════════════════════════
echo   📋 INSTRUCTIONS POUR EXÉCUTER LES TESTS
echo ═══════════════════════════════════════════════════════════════
echo.
echo Ouverture des instructions...
echo.
timeout /t 2 > nul

notepad EXECUTER_TESTS_MAINTENANT.txt

cls
echo.
echo ═══════════════════════════════════════════════════════════════
echo   ✅ FICHIERS DISPONIBLES
echo ═══════════════════════════════════════════════════════════════
echo.
echo 1. EXECUTER_TESTS_MAINTENANT.txt       (Instructions rapides)
echo 2. TESTS_JOUR_1_COMPLETS.md            (Guide détaillé)
echo 3. CORRECTION_TESTS_COMPLETE.txt       (Résumé corrections)
echo.
echo ═══════════════════════════════════════════════════════════════
echo.
pause
