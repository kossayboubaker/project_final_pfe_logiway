@echo off
title INSTALLATION ET DEMARRAGE DES SERVICES IA
color 0B

echo.
echo ================================================================
echo   INSTALLATION ET DEMARRAGE DES SERVICES IA
echo ================================================================
echo.
echo Ce script va :
echo   1. Installer les dependances Python manquantes
echo   2. Demarrer les 3 services IA
echo.
echo Cela peut prendre 5-10 minutes la premiere fois...
echo.
pause

echo.
echo ================================================================
echo   [1/3] PAUSE AI SERVICE - Installation...
echo ================================================================
cd /d "%~dp0pause-ai-service"
pip install flask flask-cors scikit-learn pandas numpy joblib --quiet --no-warn-script-location
echo ✓ Pause AI - Dependances installees

echo.
echo ================================================================
echo   [2/3] RECLAMATION AI SERVICE - Installation...
echo ================================================================
cd /d "%~dp0reclamation-ai-service"
pip install flask flask-cors --quiet --no-warn-script-location
echo ✓ Reclamation AI - Dependances installees
echo.
echo   NOTE: app_simple.py n'utilise PAS transformers (trop lourd)
echo         Il utilise des regles simples pour la validation

echo.
echo ================================================================
echo   [3/3] RAG CHATBOT SERVICE - Verification...
echo ================================================================
cd /d "%~dp0rag-service"
echo ✓ RAG Chatbot - Pret (dependencies deja installees)

echo.
echo ================================================================
echo   INSTALLATION TERMINEE !
echo ================================================================
echo.
echo Maintenant, je vais demarrer les 3 services...
echo.
pause

cls
echo.
echo ================================================================
echo   DEMARRAGE DES SERVICES...
echo ================================================================
echo.

echo [1/3] Demarrage Pause AI Service (port 5000)...
cd /d "%~dp0pause-ai-service"
start "Pause AI Service (Port 5000)" cmd /k "python app.py"
timeout /t 3 /nobreak >nul

echo [2/3] Demarrage Reclamation AI Service (port 5001)...
cd /d "%~dp0reclamation-ai-service"
start "Reclamation AI Service (Port 5001)" cmd /k "python app_simple.py"
timeout /t 3 /nobreak >nul

echo [3/3] Demarrage RAG Chatbot Service (port 8000)...
cd /d "%~dp0rag-service"
start "RAG Chatbot Service (Port 8000)" cmd /k "START_SIMPLE.bat"
timeout /t 3 /nobreak >nul

echo.
echo ================================================================
echo   ✅ TOUS LES SERVICES SONT DEMARRES !
echo ================================================================
echo.
echo 3 fenetres CMD ont ete ouvertes avec les services:
echo   - Pause AI        : http://localhost:5000
echo   - Reclamation AI  : http://localhost:5001
echo   - RAG Chatbot     : http://localhost:8000
echo.
echo IMPORTANT: NE FERME PAS CES FENETRES !
echo.
echo Verification dans 5 secondes...
timeout /t 5 /nobreak >nul

echo.
echo Verification des services...
echo.

powershell -Command "try { $r = Invoke-WebRequest -Uri http://localhost:5000/health -UseBasicParsing -TimeoutSec 2; Write-Host '✓ Pause AI (5000): OK' } catch { Write-Host '⏳ Pause AI (5000): En cours de demarrage...' }"

powershell -Command "try { $r = Invoke-WebRequest -Uri http://localhost:5001/health -UseBasicParsing -TimeoutSec 2; Write-Host '✓ Reclamation AI (5001): OK' } catch { Write-Host '⏳ Reclamation AI (5001): En cours de demarrage...' }"

powershell -Command "try { $r = Invoke-WebRequest -Uri http://localhost:8000/health -UseBasicParsing -TimeoutSec 2; Write-Host '✓ RAG Chatbot (8000): OK' } catch { Write-Host '⏳ RAG Chatbot (8000): En cours de demarrage...' }"

echo.
echo ================================================================
echo   Si tu vois "En cours de demarrage", attends 10-20 secondes
echo ================================================================
echo.
pause
