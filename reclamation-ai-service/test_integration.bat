@echo off
echo ===============================================
echo TEST D'INTEGRATION SERVICE IA RECLAMATION
echo ===============================================
echo.
echo 1. Test sante du service...
curl -s http://localhost:5001/health
echo.
echo.
echo 2. Test contenu valide flotte...
curl -s -X POST http://localhost:5001/validate -H "Content-Type: application/json" -d "{\"text\":\"Le vehicule a une panne moteur sur le trajet\",\"field\":\"sujet\"}"
echo.
echo.
echo 3. Test contenu toxique...  
curl -s -X POST http://localhost:5001/validate -H "Content-Type: application/json" -d "{\"text\":\"fuck you\",\"field\":\"sujet\"}"
echo.
echo.
echo 4. Test contenu hors sujet...
curl -s -X POST http://localhost:5001/validate -H "Content-Type: application/json" -d "{\"text\":\"Je veux apprendre a cuisiner\",\"field\":\"sujet\"}"
echo.
echo.
echo ===============================================
pause