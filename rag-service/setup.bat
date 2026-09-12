@echo off
echo ========================================
echo   Installation RAG Chatbot Service
echo   Logiway - Port 5003
echo ========================================
echo.

cd /d "%~dp0"

:: Vérifier Python
python --version >nul 2>&1
if errorlevel 1 (
    echo ERREUR: Python n'est pas installe ou pas dans le PATH
    echo Telechargez Python: https://www.python.org/downloads/
    pause
    exit /b 1
)

echo [1/7] Verification Python... OK
echo.

:: Création environnement virtuel
if not exist "venv" (
    echo [2/7] Creation environnement virtuel...
    python -m venv venv
    echo      OK
) else (
    echo [2/7] Environnement virtuel existe deja... OK
)
echo.

:: Activation environnement
echo [3/7] Activation environnement virtuel...
call venv\Scripts\activate
if errorlevel 1 (
    echo ERREUR: Impossible d'activer l'environnement virtuel
    pause
    exit /b 1
)
echo      OK
echo.

:: Installation dépendances
echo [4/7] Installation des dependances (peut prendre 5-10 min)...
python -m pip install --upgrade pip --quiet
pip install -r requirements.txt
if errorlevel 1 (
    echo ERREUR: Installation des dependances echouee
    pause
    exit /b 1
)
echo      OK
echo.

:: Création structure dossiers
echo [5/7] Creation structure de dossiers...
if not exist "data" mkdir data
if not exist "data\vectorstore" mkdir data\vectorstore
if not exist "data\documents" mkdir data\documents
echo      OK
echo.

:: Test Ollama
echo [6/7] Test connexion Ollama...
python scripts\test_ollama.py
if errorlevel 1 (
    echo.
    echo AVERTISSEMENT: Ollama non accessible
    echo Solutions:
    echo   1. Demarrez Ollama: ollama serve
    echo   2. Installez le modele: ollama pull qwen2.5:3b
    echo.
    echo Continuer quand meme? (O/N)
    set /p continue=
    if /i not "%continue%"=="O" exit /b 1
)
echo      OK
echo.

:: Ingestion données MySQL
echo [7/7] Extraction des donnees MySQL...
python scripts\ingest_data.py
if errorlevel 1 (
    echo.
    echo ERREUR: Extraction des donnees echouee
    echo Verifications:
    echo   - XAMPP MySQL demarre?
    echo   - Base logiway_db existe?
    echo   - Fichier .env configure correctement?
    pause
    exit /b 1
)
echo      OK
echo.

:: Création vector store
echo [BONUS] Creation du vector store...
python scripts\create_vectorstore.py
if errorlevel 1 (
    echo ERREUR: Creation vector store echouee
    pause
    exit /b 1
)
echo      OK
echo.

echo ========================================
echo   Installation terminee avec succes!
echo ========================================
echo.
echo Prochaines etapes:
echo   1. Demarrer le service: start.bat
echo   2. Tester l'API: http://localhost:5003/docs
echo   3. Healthcheck: http://localhost:5003/health
echo.
pause
