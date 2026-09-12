@echo off
echo ========================================
echo   Demarrage RAG Chatbot Service
echo   Port: 5003
echo ========================================
echo.

cd /d "%~dp0"

:: Vérifier environnement virtuel
if not exist "venv" (
    echo ERREUR: Environnement virtuel non trouve
    echo Executez: setup.bat
    pause
    exit /b 1
)

:: Activation environnement
call venv\Scripts\activate

:: Vérifier Ollama
echo Verification Ollama...
python scripts\test_ollama.py >nul 2>&1
if errorlevel 1 (
    echo.
    echo AVERTISSEMENT: Ollama non accessible
    echo Demarrez Ollama dans un autre terminal: ollama serve
    echo.
    echo Continuer quand meme? (O/N)
    set /p continue=
    if /i not "%continue%"=="O" exit /b 1
)

echo.
echo ========================================
echo   Service RAG en cours de demarrage...
echo ========================================
echo.
echo   API:          http://localhost:5003
echo   Documentation: http://localhost:5003/docs
echo   Health:        http://localhost:5003/health
echo.
echo Appuyez sur CTRL+C pour arreter
echo ========================================
echo.

:: Démarrage FastAPI avec uvicorn
python -m uvicorn app.main:app --host 0.0.0.0 --port 5003 --reload

pause
