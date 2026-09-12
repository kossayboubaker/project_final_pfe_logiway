param(
    [string]$OsrmDataPath = "$PWD\osrm-data",
    [string]$OsrmFile = "tunisia-latest.osrm"
)

Write-Host "== Start OSRM local helper =="

if (-not (Get-Command docker -ErrorAction SilentlyContinue)) {
    Write-Host "Docker n'est pas installé ou non trouvé dans PATH. Installez Docker Desktop et réessayez." -ForegroundColor Red
    exit 1
}

function Write-Err([string]$msg) { Write-Host "[ERROR] $msg" -ForegroundColor Red }
function Write-Ok([string]$msg) { Write-Host "[OK] $msg" -ForegroundColor Green }

# Try docker compose first (use 'docker compose' without call operator)
Write-Host "Tentative de démarrage via 'docker compose'..."
try {
    docker compose up -d osrm 2>$null
    if ($LASTEXITCODE -eq 0) {
        Write-Ok "Conteneur OSRM démarré (docker compose)."
        docker ps --filter "name=osrm"
        exit 0
    }
} catch {
    Write-Host "docker compose non disponible ou erreur, tentative fallback..."
}

# Fallback: docker run if osrm-data/*.osrm exists
$cwd = Get-Location
$osrmData = Join-Path $cwd "osrm-data"
$osrmFiles = @()
if (Test-Path $osrmData) { $osrmFiles = Get-ChildItem -Path $osrmData -Filter "*.osrm" -ErrorAction SilentlyContinue }

if ($osrmFiles.Count -gt 0) {
    $file = $osrmFiles[0].Name
    Write-Host "Démarrage via docker run en utilisant $file ..."
    docker run -d --name logiway-osrm -p 5000:5000 -v "${osrmData}:/data:ro" osrm/osrm-backend osrm-routed --algorithm mld /data/$file
    if ($LASTEXITCODE -eq 0) {
        Write-Ok "OSRM démarré en container 'logiway-osrm'"
        docker ps --filter "name=logiway-osrm"
        exit 0
    } else {
        Write-Err "Échec du docker run pour OSRM."
        exit 1
    }
} else {
    Write-Host "Aucun fichier .osrm trouvé dans ./osrm-data."
    Write-Host "Vous pouvez utiliser le service public OSRM (router.project-osrm.org) ou préparer un .osrm dans ./osrm-data."
    exit 2
}
