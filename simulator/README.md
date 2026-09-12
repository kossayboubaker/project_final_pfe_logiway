# LogiWay — Simulateur GPS (simulator)

Ce dossier contient des utilitaires pour simuler le déplacement d'un véhicule le long d'un itinéraire réel calculé par OSRM et poster les positions au backend LogiWay.

Prérequis
- Python 3.9+
- Un backend LogiWay démarré (par défaut `http://localhost:8080`).
- Optionnel : OSRM local (port `5000`) ou utilisation du service OSRM public `router.project-osrm.org`.
- Virtualenv recommandé : `.venv` à la racine du projet.

Installation rapide
```powershell
# activer le virtualenv (PowerShell)
.\.venv\Scripts\Activate.ps1
pip install -r simulator\requirements.txt
```

Commandes utiles
- Simulateur principal (auto-détecte un trajet actif) :
```powershell
python simulator\run_simulation.py
```
- Créer un trajet test puis simuler (ex : Tunis → Sousse) :
```powershell
python simulator\run_simulation.py --create --from "Tunis" --to "Sousse"
```
- Simuler un trajet existant par ID :
```powershell
python simulator\run_simulation.py --trip-id 123
```
- Forcer OSRM local :
```powershell
python simulator\run_simulation.py --create --osrm "http://localhost:5000"
```

Scripts PowerShell fournis
- `start-osrm-local.ps1` : tente de démarrer le service OSRM via `docker compose` ou `docker run`.
- `run-simulation-local.ps1` : active le virtualenv local et exécute `run_simulation.py` en transmettant les arguments.

Dépannage rapide
- Si le véhicule ne bouge pas : vérifiez que `POST /api/trajets/{id}/position` renvoie 200 et que le backend met à jour la position et émet l’événement SSE `gps-position`.
- Pour vérifier OSRM :
```powershell
curl "http://localhost:5000/route/v1/driving/10.1815,36.8065;10.6360,35.8256?overview=full&geometries=geojson"
```
La réponse doit contenir `routes[0].geometry.coordinates`.

Notes
- Les scripts utilisent par défaut le service OSRM public si vous ne fournissez pas `--osrm`.
- Le simulateur essaie d'utiliser la géométrie `geometrieItineraire` renvoyée par le backend ; si absente, il calcule l'itinéraire via OSRM.

---
Pour toute modification ou si vous souhaitez que j'automatise d'autres éléments (tests unitaires, checks supplémentaires, etc.), dites-le et je m'en occupe.
# Simulateur LogiWay — Guide d'utilisation

Ce dossier contient des scripts Python permettant de simuler le déplacement d'un véhicule le long d'un itinéraire OSRM et d'envoyer les positions au backend LogiWay.

## Prérequis
- Python 3.10+ (venv recommandé)
- Docker Desktop (optionnel pour OSRM local) ou connexion internet pour utiliser OSRM public (`router.project-osrm.org`)
- Backend LogiWay démarré sur `http://localhost:8080` (ou adaptez l'URL)

## Installer les dépendances Python
Activez votre virtualenv, puis :

```powershell
# depuis la racine du projet
.\.venv\Scripts\Activate.ps1
pip install -r simulator\requirements.txt
```

## Lancer OSRM
Vous avez deux options : utiliser le service public OSRM (par défaut) ou démarrer OSRM local.

### Option 1 — OSRM public
Aucune action nécessaire. Les scripts utilisent `http://router.project-osrm.org` par défaut.

### Option 2 — OSRM local (avec Docker)
Placez vos fichiers `.osrm` dans `./osrm-data` (ou utilisez les données fournies).

Utilisez le script PowerShell `start-osrm-local.ps1` fourni pour tenter de démarrer le service OSRM :

```powershell
cd C:\Users\kossa\OneDrive\Desktop\projet_pfe_routier
simulator\start-osrm-local.ps1
```

Ce script tente `docker compose up -d osrm` puis tombe en fallback vers `docker run` si nécessaire.

Tester l'API OSRM :

```powershell
curl "http://localhost:5000/route/v1/driving/10.1815,36.8065;10.6360,35.8256?overview=full&geometries=geojson"
```

La réponse doit contenir `routes[0].geometry.coordinates`.

## Lancer le simulateur
Les scripts principaux sont :
- `run_simulation.py` : script interactif/CLI principal
- `truck_simulator_fixed.py` : wrapper lisant un JSON depuis stdin

Exemples :

```powershell
# Auto-détecte un trajet EN_COURS sur le backend
python simulator\run_simulation.py

# Crée un trajet test et le simule (OSRM public par défaut)
python simulator\run_simulation.py --create

# Forcer OSRM local
python simulator\run_simulation.py --create --osrm "http://localhost:5000"

# Simuler un trajet existant par ID
python simulator\run_simulation.py --trip-id 123 --osrm "http://localhost:5000"
```

## Test rapide (PowerShell)
Un script `run_test_simulation.ps1` est fourni pour exécuter une simulation de test (crée un trajet et le simule contre `http://localhost:5000`).

```powershell
simulator\run_test_simulation.ps1
```

## Comportement attendu
- Le simulateur obtient l'itinéraire OSRM (depuis le backend ou en appelant OSRM), puis poste les positions au backend via `POST /api/trajets/{id}/position` pour chaque point de la géométrie.
- Le backend doit mettre à jour la position du véhicule et émettre les événements SSE (ex: `gps-position`).
- Ouvrez l'interface Angular (ex: `http://localhost:4200/dashboard/trips-map`) pour visualiser le véhicule en mouvement.

## Dépannage rapide
- `docker compose` introuvable : essayez `docker compose` (sans tiret) ou installez Docker Desktop.
- Si l'OSRM local ne démarre pas, utilisez l'API `router.project-osrm.org` publique.
- Vérifiez que `GET /api/trajets/carte` renvoie bien des trajets et que `POST /api/trajets/{id}/position` accepte les updates.

---
Si vous voulez, je peux :
- ajouter des vérifications supplémentaires dans les scripts pour mieux logguer les erreurs OSRM/backend,
- automatiser la création d'un trajet de test avec des paramètres précis (ex : Tunis → Sousse),
- placer un raccourci VS Code / tâche pour lancer la simulation.
