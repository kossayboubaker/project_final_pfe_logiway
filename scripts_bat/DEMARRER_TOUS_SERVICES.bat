@echo off
title DEMARRAGE DE TOUS LES SERVICES IA
color 0A
echo.
echo ================================================================
echo       DEMARRAGE DES SERVICES IA - LOGIWAY
echo ================================================================
echo.
echo Ce script va demarrer les 3 services IA dans des fenetres separees
echo.
echo [1/3] Demarrage du Pause AI Service (port 5000)...
cd /d "%~dp0pause-ai-service"
start "Pause AI Service (Port 5000)" cmd /k "start_pause_ai.bat"
timeout /t 2 /nobreak >nul

echo [2/3] Demarrage du Reclamation AI Service (port 5001)...
cd /d "%~dp0reclamation-ai-service"
start "Reclamation AI Service (Port 5001)" cmd /k "start_simple.bat"
timeout /t 2 /nobreak >nul

echo [3/3] Demarrage du RAG Chatbot Service (port 8000)...
cd /d "%~dp0rag-service"
start "RAG Chatbot Service (Port 8000)" cmd /k "START_SIMPLE.bat"
timeout /t 2 /nobreak >nul

echo.
echo ================================================================
echo   TOUS LES SERVICES SONT EN COURS DE DEMARRAGE !
echo ================================================================
echo.
echo Verifie que chaque fenetre affiche "Running on http://..."
echo.
echo Services demandes:
echo   - Pause AI        : http://localhost:5000
echo   - Reclamation AI  : http://localhost:5001
echo   - RAG Chatbot     : http://localhost:8000
echo.
echo IMPORTANT: NE FERME PAS LES FENETRES CMD DES SERVICES !
echo.
echo Pour verifier que tout fonctionne, ouvre un navigateur:
echo   http://localhost:5000/health
echo   http://localhost:5001/health
echo   http://localhost:8000/health
echo.
pause
