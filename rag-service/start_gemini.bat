@echo off
echo =========================================
echo Démarrage RAG Service Chatbot - Gemini
echo =========================================

echo Activation environnement virtuel...
call venv\Scripts\activate

echo Test des dépendances...
python scripts\test_gemini.py

if %ERRORLEVEL% NEQ 0 (
    echo Erreur lors des tests préliminaires
    pause
    exit /b 1
)

echo Démarrage du service RAG sur le port 5003...
python -m uvicorn app.main:app --host localhost --port 5003 --reload

pause