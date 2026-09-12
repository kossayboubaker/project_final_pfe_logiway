@echo off
chcp 65001 > nul
echo =========================================
echo Demarrage RAG Service - Sans Venv
echo =========================================
echo.

REM Tester Python
python --version > nul 2>&1
if %errorlevel% neq 0 (
    echo [ERREUR] Python n'est pas installe
    echo Installez Python 3.11+ depuis python.org
    pause
    exit /b 1
)

REM Verifier les dependances
echo Test des dependances...
python -c "import fastapi" > nul 2>&1
if %errorlevel% neq 0 (
    echo Installation des dependances...
    pip install -r requirements.txt
)

echo.
echo Verification .env...
if not exist .env (
    echo [AVERTISSEMENT] Fichier .env manquant
    echo Assurez-vous d'avoir GEMINI_API_KEY configuree
    pause
)

echo.
echo =========================================
echo Demarrage du service RAG...
echo =========================================
echo.

REM Demarrer le service
python -m uvicorn app.main:app --host 0.0.0.0 --port 5003 --reload

pause
