# PowerShell helper to run a quick simulator test (create a trip and simulate it)
param(
    [string]$Backend = "http://localhost:8080",
    [string]$Osrm = "http://localhost:5000",
    [int]$StepSeconds = 2
)

Write-Host "Activation du venv (si présent) et lancement d'une simulation test..."

if (Test-Path "..\.venv\Scripts\Activate.ps1") {
    Write-Host "Activation de .venv"
    . "..\.venv\Scripts\Activate.ps1"
}

# Installer dépendances si nécessaire
Write-Host "Installation des dépendances (requests)..."
pip install -r .\requirements.txt

# Lancer la simulation en créant un trajet test
python .\run_simulation.py --create --backend $Backend --osrm $Osrm --speed $StepSeconds
