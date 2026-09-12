@echo off
echo ========================================
echo   Test du Service RAG
echo ========================================
echo.

cd /d "%~dp0"

:: Test healthcheck
echo [1/3] Test healthcheck...
curl -s http://localhost:5003/health
echo.
echo.

:: Test question simple
echo [2/3] Test question: Combien de vehicules disponibles?
curl -X POST http://localhost:5003/api/rag/question ^
  -H "Content-Type: application/json" ^
  -d "{\"question\": \"Combien de vehicules sont disponibles?\"}"
echo.
echo.

:: Test question chauffeurs
echo [3/3] Test question: Liste des chauffeurs
curl -X POST http://localhost:5003/api/rag/question ^
  -H "Content-Type: application/json" ^
  -d "{\"question\": \"Liste les chauffeurs disponibles\"}"
echo.
echo.

echo ========================================
echo   Tests termines
echo ========================================
pause
