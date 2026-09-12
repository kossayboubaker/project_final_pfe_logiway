@echo off
echo ===========================================
echo SERVICE IA RECLAMATION - VERSION SIMPLIFIEE
echo ===========================================
echo.
echo Installation des dependances simplifiees...
pip install -r requirements_simple.txt
echo.
echo Demarrage du service AI sur le port 5001...
echo.
python app_simple.py
pause