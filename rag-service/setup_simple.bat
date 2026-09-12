@echo off
echo ========================================
echo   Installation RAG Service (Simplifie)
echo   Sans torch/numpy (via Ollama)
echo ========================================
echo.

cd /d "%~dp0"

:: Vérifier Python
python --version >nul 2>&1
if errorlevel 1 (
    echo ERREUR: Python non installe
    pause
    exit /b 1
)
echo [1/8] Python OK
echo.

:: Créer venv si n'existe pas
if not exist "venv" (
    echo [2/8] Creation environnement virtuel...
    python -m venv venv
) else (
    echo [2/8] Environnement virtuel existe
)
echo.

:: Activer
echo [3/8] Activation environnement...
call venv\Scripts\activate
echo.

:: Upgrade pip
echo [4/8] Mise a jour pip...
python -m pip install --upgrade pip --quiet
echo.

:: Installation dépendances simplifiées
echo [5/8] Installation dependances (version simple)...
echo Cette version utilise Ollama pour les embeddings
echo (pas besoin de torch/numpy)
pip install -r requirements_simple.txt
if errorlevel 1 (
    echo ERREUR: Installation echouee
    pause
    exit /b 1
)
echo.

:: Création structure
echo [6/8] Creation dossiers...
if not exist "data" mkdir data
if not exist "data\vectorstore" mkdir data\vectorstore
if not exist "data\documents" mkdir data\documents
echo.

:: Test Ollama
echo [7/8] Test Ollama...
python scripts\test_ollama.py
if errorlevel 1 (
    echo.
    echo AVERTISSEMENT: Ollama non accessible
    echo.
    echo Actions requises:
    echo 1. Demarrez Ollama: ollama serve
    echo 2. Installez les modeles:
    echo    ollama pull qwen2.5:3b
    echo    ollama pull nomic-embed-text
    echo.
    echo Continuer quand meme? (O/N)
    set /p continue=
    if /i not "%continue%"=="O" exit /b 1
)
echo.

:: Ingestion données
echo [8/8] Extraction donnees MySQL...
python scripts\ingest_data.py
if errorlevel 1 (
    echo.
    echo ERREUR: Extraction echouee
    echo Verifiez:
    echo - XAMPP MySQL demarre
    echo - Base logiway_db existe
    pause
    exit /b 1
)
echo.

echo ========================================
echo   Installation TERMINEE !
echo ========================================
echo.
echo IMPORTANT: Avant de demarrer
echo 1. Installez le modele embeddings:
echo    ollama pull nomic-embed-text
echo.
echo 2. Creez le vector store:
echo    python scripts\create_vectorstore.py
echo.
echo 3. Demarrez le service:
echo    start.bat
echo.
pause
