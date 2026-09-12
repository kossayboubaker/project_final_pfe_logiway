# 📝 COMMANDES PAUSE AI - RÉCAPITULATIF

**Service** : Pause AI Machine Learning  
**Port** : 5000  
**Localisation** : `pause-ai-service/`

---

## 🎯 COMMANDES ESSENTIELLES

### Installation (Première Fois)

```bash
# Naviguer vers le dossier
cd C:\Users\kossa\OneDrive\Desktop\essais\pause-ai-service

# Option 1 : Script automatique (RECOMMANDÉ)
setup_pause_ai.bat

# Option 2 : Manuel
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
```

---

### Démarrage du Service

```bash
# Option 1 : Script automatique (RECOMMANDÉ)
start_pause_ai.bat

# Option 2 : Manuel
venv\Scripts\activate
python app.py

# Option 3 : Docker (depuis la racine)
cd ..
docker-compose up -d pause-ai
```

---

### Tests et Vérification

```bash
# Tests automatiques
test_pause_ai.bat

# Health check manuel
curl http://localhost:5000/health

# Entraînement du modèle
curl -X POST http://localhost:5000/api/train

# Test de prédiction
curl -X POST http://localhost:5000/api/predict -H "Content-Type: application/json" -d "{\"startLat\": 48.8566, \"startLon\": 2.3522, \"endLat\": 45.764, \"endLon\": 4.8357, \"trip_id\": 1}"
```

---

### Arrêt du Service

```bash
# Service local
Ctrl + C (dans le terminal)

# Docker
docker-compose stop pause-ai

# Tuer le processus (si nécessaire)
netstat -ano | findstr :5000
taskkill /PID <PID> /F
```

---

## 🔍 COMMANDES DE DIAGNOSTIC

### Vérifier l'État

```bash
# Statut du service
curl http://localhost:5000/health

# Logs Docker
docker logs -f pause-ai

# Processus Python actifs
tasklist | findstr python

# Port 5000 utilisé par qui ?
netstat -ano | findstr :5000
```

### Debug et Logs

```bash
# Activer mode debug (dans app.py)
# app.run(host='0.0.0.0', port=5000, debug=True)

# Logs détaillés Python
python app.py --verbose

# Docker logs (100 dernières lignes)
docker logs --tail=100 pause-ai

# Docker stats (CPU, RAM)
docker stats pause-ai
```

---

## 🐳 COMMANDES DOCKER

### Build et Gestion

```bash
# Build image
docker build -t logiway-pause-ai pause-ai-service/

# Run conteneur
docker run -d -p 5000:5000 --name pause-ai logiway-pause-ai

# Logs en temps réel
docker logs -f pause-ai

# Arrêt et suppression
docker stop pause-ai
docker rm pause-ai

# Rebuild sans cache
docker build --no-cache -t logiway-pause-ai pause-ai-service/
```

### Docker Compose

```bash
# Depuis la racine du projet
cd C:\Users\kossa\OneDrive\Desktop\essais

# Démarrer uniquement Pause AI
docker-compose up -d pause-ai

# Voir les logs
docker-compose logs -f pause-ai

# Redémarrer
docker-compose restart pause-ai

# Arrêter
docker-compose stop pause-ai

# Rebuild et redémarrer
docker-compose up -d --build pause-ai

# Vérifier le statut
docker-compose ps
```

---

## 🧪 COMMANDES DE TEST

### Tests API avec curl

```bash
# Test 1 : Health Check
curl http://localhost:5000/health

# Test 2 : Entraînement du modèle (30 secondes)
curl -X POST http://localhost:5000/api/train

# Test 3 : Prédiction Paris → Lyon
curl -X POST http://localhost:5000/api/predict ^
  -H "Content-Type: application/json" ^
  -d "{\"startLat\": 48.8566, \"startLon\": 2.3522, \"endLat\": 45.764, \"endLon\": 4.8357, \"trip_id\": 1}"

# Test 4 : Prédiction Marseille → Bordeaux
curl -X POST http://localhost:5000/api/predict ^
  -H "Content-Type: application/json" ^
  -d "{\"startLat\": 43.2965, \"startLon\": 5.3698, \"endLat\": 44.8378, \"endLon\": -0.5792, \"trip_id\": 2}"
```

### Tests avec PowerShell

```powershell
# Health Check
Invoke-RestMethod -Uri http://localhost:5000/health -Method Get

# Entraînement
Invoke-RestMethod -Uri http://localhost:5000/api/train -Method Post

# Prédiction
$body = @{
    startLat = 48.8566
    startLon = 2.3522
    endLat = 45.764
    endLon = 4.8357
    trip_id = 1
} | ConvertTo-Json

Invoke-RestMethod -Uri http://localhost:5000/api/predict -Method Post -Body $body -ContentType "application/json"
```

---

## 🔧 COMMANDES DE MAINTENANCE

### Nettoyer l'Environnement

```bash
# Désactiver venv
deactivate

# Supprimer venv
rmdir /s /q venv

# Recréer venv
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
```

### Mettre à Jour les Dépendances

```bash
# Activer venv
venv\Scripts\activate

# Mettre à jour pip
python -m pip install --upgrade pip

# Mettre à jour toutes les dépendances
pip install -r requirements.txt --upgrade

# Voir les packages installés
pip list
```

### Nettoyer Docker

```bash
# Supprimer le conteneur
docker rm -f pause-ai

# Supprimer l'image
docker rmi logiway-pause-ai

# Nettoyer volumes (⚠️ perte de données)
docker volume rm essais_pause-ai-data

# Nettoyage complet système
docker system prune -a
```

---

## 📊 COMMANDES D'ANALYSE

### Vérifier les Packages Python

```bash
# Activer venv
venv\Scripts\activate

# Vérifier sklearn
python -c "import sklearn; print(sklearn.__version__)"

# Vérifier numpy
python -c "import numpy; print(numpy.__version__)"

# Vérifier pandas
python -c "import pandas; print(pandas.__version__)"

# Vérifier flask
python -c "import flask; print(flask.__version__)"

# Vérifier TOUT
python -c "import sklearn, numpy, pandas, flask, requests; print('✅ Tous les packages OK')"
```

### Tester les Fonctionnalités ML

```python
# Ouvrir Python interactif
python

# Tester le modèle
>>> from sklearn.ensemble import RandomForestRegressor
>>> model = RandomForestRegressor(n_estimators=200)
>>> print("✅ RandomForest disponible")

# Tester numpy
>>> import numpy as np
>>> arr = np.array([1, 2, 3])
>>> print(f"✅ NumPy : {arr.mean()}")

# Quitter
>>> exit()
```

---

## 🌐 COMMANDES D'INTÉGRATION

### Test avec Backend Java

```bash
# 1. Démarrer Pause AI
cd pause-ai-service
start_pause_ai.bat

# 2. Démarrer Backend (dans un nouveau terminal)
cd backend
mvn spring-boot:run

# 3. Tester l'intégration
curl http://localhost:8080/api/pause-ai/health
```

### Test Complet de la Chaîne

```bash
# Terminal 1 : MySQL
docker-compose up -d mysql

# Terminal 2 : Pause AI
cd pause-ai-service
start_pause_ai.bat

# Terminal 3 : Backend
cd backend
mvn spring-boot:run

# Terminal 4 : Frontend
cd frontend
npm start

# Navigateur : http://localhost:4200
# Créer un trajet et vérifier les marqueurs de pause
```

---

## 📁 FICHIERS IMPORTANTS

```
pause-ai-service/
├── app.py                      # ⭐ Code principal Flask
├── requirements.txt            # ⭐ Dépendances Python
├── Dockerfile                  # ⭐ Config Docker
├── README.md                   # Documentation complète
├── QUICK_START.md             # Démarrage rapide
├── GUIDE_DEMARRAGE_PAUSE_AI.md # Guide détaillé
├── setup_pause_ai.bat         # ⭐ Installation
├── start_pause_ai.bat         # ⭐ Démarrage
├── test_pause_ai.bat          # Tests
├── venv/                      # Environnement virtuel
└── data/                      # Données ML
    ├── pause_model.joblib     # Modèle entraîné
    └── training_data.csv      # Dataset
```

---

## 🎯 WORKFLOWS COURANTS

### Workflow 1 : Premier Démarrage

```bash
1. cd pause-ai-service
2. setup_pause_ai.bat          # Une seule fois
3. start_pause_ai.bat          # À chaque démarrage
4. test_pause_ai.bat           # Vérification
```

### Workflow 2 : Développement

```bash
1. cd pause-ai-service
2. venv\Scripts\activate
3. python app.py               # Mode debug
4. # Modifier app.py
5. Ctrl+C puis python app.py   # Redémarrer
```

### Workflow 3 : Production Docker

```bash
1. cd essais
2. docker-compose up -d pause-ai
3. docker-compose logs -f pause-ai
4. # Tests et monitoring
5. docker-compose stop pause-ai  # Arrêt propre
```

---

## 🆘 AIDE RAPIDE

### Le service ne démarre pas

```bash
# Vérifier Python
python --version

# Vérifier port
netstat -ano | findstr :5000

# Réinstaller
rmdir /s /q venv
setup_pause_ai.bat
```

### Erreur de packages

```bash
# Réinstaller proprement
venv\Scripts\activate
pip uninstall -r requirements.txt -y
pip install -r requirements.txt
```

### Docker ne fonctionne pas

```bash
# Vérifier Docker
docker --version
docker ps

# Rebuild
docker-compose build --no-cache pause-ai
docker-compose up -d pause-ai
```

---

## 📞 RESSOURCES

- **README** : `pause-ai-service/README.md`
- **Guide Complet** : `pause-ai-service/GUIDE_DEMARRAGE_PAUSE_AI.md`
- **Quick Start** : `pause-ai-service/QUICK_START.md`
- **Docker** : `DOCKER_DEPLOYMENT_GUIDE.md`

---

**Mise à jour** : 21 juillet 2026  
**Status** : ✅ Service opérationnel
