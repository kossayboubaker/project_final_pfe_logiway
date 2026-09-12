@echo off
echo ==================================================
echo 🚀 Démarrage du service RAG Chatbot Gemini
echo ==================================================
echo.
echo Service RAG pour Logiway - Powered by Google Gemini
echo Port: 5003
echo API: http://localhost:5003
echo Documentation: http://localhost:5003/docs
echo.
echo [CTRL+C] pour arrêter
echo ==================================================

cd /d "%~dp0"

echo Vérification des dépendances...
python -c "import google.generativeai, fastapi, sqlalchemy; print('✓ Toutes les dépendances sont installées')" || (
    echo Installation des dépendances...
    pip install -r requirements.txt
)

echo Démarrage du service...
python -m uvicorn app.main:app --host localhost --port 5003 --reload

pause