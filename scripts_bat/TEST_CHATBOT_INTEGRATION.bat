@echo off
echo ========================================
echo TEST D'INTEGRATION CHATBOT LOGIWAY
echo ========================================
echo.

REM Test 1: Verifier le service RAG
echo [1/4] Test du service RAG Gemini...
curl -s http://localhost:5003/health > nul 2>&1
if %errorlevel% equ 0 (
    echo   [OK] Service RAG Gemini est actif
) else (
    echo   [ERREUR] Service RAG Gemini n'est pas accessible
    echo   Lancez: cd rag-service ^&^& start_gemini.bat
)
echo.

REM Test 2: Verifier le backend Java
echo [2/4] Test du backend Java...
curl -s http://localhost:8080/actuator/health > nul 2>&1
if %errorlevel% equ 0 (
    echo   [OK] Backend Java est actif
) else (
    echo   [ERREUR] Backend Java n'est pas accessible
    echo   Lancez: cd backend ^&^& mvn spring-boot:run
)
echo.

REM Test 3: Verifier le frontend Angular
echo [3/4] Test du frontend Angular...
curl -s http://localhost:4200 > nul 2>&1
if %errorlevel% equ 0 (
    echo   [OK] Frontend Angular est actif
) else (
    echo   [ERREUR] Frontend Angular n'est pas accessible
    echo   Lancez: cd frontend ^&^& npm start
)
echo.

REM Test 4: Test question chatbot
echo [4/4] Test d'une question au chatbot...
curl -s -X POST http://localhost:8080/api/chat/message ^
  -H "Content-Type: application/json" ^
  -H "Authorization: Bearer YOUR_TOKEN_HERE" ^
  -d "{\"question\":\"Combien de vehicules?\"}" > test_response.json 2>nul

if %errorlevel% equ 0 (
    echo   [OK] Question envoyee au chatbot
    echo   Reponse enregistree dans test_response.json
) else (
    echo   [AVERTISSEMENT] Impossible de tester le chatbot
    echo   Verifiez que vous etes authentifie
)
echo.

echo ========================================
echo RESULTAT DU TEST
echo ========================================
echo.
echo Si tous les services sont [OK], le chatbot est operationnel!
echo.
echo Pour tester manuellement:
echo 1. Ouvrez http://localhost:4200
echo 2. Connectez-vous
echo 3. Cliquez sur l'icone du chatbot en bas a droite
echo 4. Posez une question (ex: "Combien de chauffeurs?")
echo.
pause
