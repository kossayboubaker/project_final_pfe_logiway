# 🚀 GUIDE DE DÉMARRAGE - SERVICE PAUSE AI

**Service** : Pause AI - Prédiction Machine Learning  
**Port** : 5000  
**Type** : RandomForest avec 15 features contextuelles

---

## 📋 TABLE DES MATIÈRES

1. [Prérequis](#prérequis)
2. [Installation - Première Fois](#installation---première-fois)
3. [Démarrage du Service](#démarrage-du-service)
4. [Tests et Vérification](#tests-et-vérification)
5. [Arrêt du Service](#arrêt-du-service)
6. [Troubleshooting](#troubleshooting)
7. [Démarrage avec Docker](#démarrage-avec-docker)

---

## ✅ PRÉREQUIS

### Logiciels Requis

```bash
# Python 3.11 ou supérieur
python --version
# Résultat attendu : Python 3.11.x ou 3.12.x

# pip (gestionnaire de packages Python)
pip --version
```

**Si Python n'est pas installé** :
- Télécharger : https://www.python.org/downloads/
- ✅ Cocher "Add Python to PATH" pendant l'installation

---

## 🔧 INSTALLATION - PREMIÈRE FOIS

### Étape 1 : Ouvrir le Terminal

```bash
# Ouvrir PowerShell ou CMD
# Naviguer vers le dossier pause-ai-service

cd C:\Users\kossa\OneDrive\Desktop\essais\pause-ai-service
```

### Étape 2 : Créer un Environnement Virtuel Python

```bash
# Créer l'environnement virtuel
python -m venv venv

# Activer l'environnement virtuel (Windows)
venv\Scripts\activate

# Vous devriez voir (venv) au début de votre ligne de commande
```

### Étape 3 : Installer les Dépendances

```bash
# Mettre à jour pip
python -m pip install --upgrade pip

# Installer toutes les dépendances
pip install -r requirements.txt

# Attendre 2-3 minutes (installation de scikit-learn, numpy, pandas, etc.)
```

**Vérification de l'installation** :
```bash
# Tester que tout est installé
python -c "import sklearn; import numpy; import pandas; import flask; print('✅ Tous les packages installés')"
```

---

## 🚀 DÉMARRAGE DU SERVICE

### Option 1 : Démarrage Simple (Développement)

```bash
# S'assurer que l'environnement virtuel est activé
# (vous devez voir (venv) au début de la ligne)

# Si pas activé, exécuter :
venv\Scripts\activate

# Lancer le service
python app.py
```

**Résultat attendu** :
```
 * Serving Flask app 'app'
 * Debug mode: on
 * Running on http://0.0.0.0:5000
```

### Option 2 : Démarrage Production (Gunicorn)

```bash
# Activer l'environnement virtuel
venv\Scripts\activate

# Lancer avec Gunicorn (serveur production)
gunicorn --bind 0.0.0.0:5000 --workers 2 --timeout 120 app:app
```

### Option 3 : Utiliser le Script Batch (Windows)

**Créer un fichier `start_pause_ai.bat`** :

```batch
@echo off
echo ========================================
echo   DEMARRAGE PAUSE AI SERVICE
echo ========================================
echo.

REM Aller dans le bon répertoire
cd /d "%~dp0"

REM Activer l'environnement virtuel
call venv\Scripts\activate.bat

REM Lancer le service
echo Lancement du service sur le port 5000...
python app.py

pause
```

**Lancer le service** :
```bash
# Double-cliquer sur start_pause_ai.bat
# OU dans le terminal :
start_pause_ai.bat
```

---

## ✅ TESTS ET VÉRIFICATION

### Test 1 : Vérifier que le Service Fonctionne

**Ouvrir un NOUVEAU terminal (sans fermer celui du service)** :

```bash
# Test du health check
curl http://localhost:5000/health

# Résultat attendu :
# {"status": "healthy", "service": "pause-ai-ml", "model_loaded": true}
```

**Ou dans le navigateur** :
- Ouvrir : http://localhost:5000/health

### Test 2 : Tester l'Entraînement du Modèle

```bash
# POST pour entraîner le modèle
curl -X POST http://localhost:5000/api/train

# Résultat attendu (après ~30 secondes) :
# {
#   "status": "success",
#   "message": "Model trained successfully",
#   "metrics": {
#     "r2_score": 0.90,
#     "mae": 8.5
#   }
# }
```

### Test 3 : Tester une Prédiction

```bash
# Prédiction pour un trajet
curl -X POST http://localhost:5000/api/predict ^
  -H "Content-Type: application/json" ^
  -d "{\"startLat\": 48.8566, \"startLon\": 2.3522, \"endLat\": 45.764, \"endLon\": 4.8357, \"trip_id\": 1}"

# Résultat attendu :
# {
#   "stops": [
#     {
#       "lat": 48.95,
#       "lon": 2.40,
#       "score": 78,
#       "type": "fuel",
#       "name": "Station Total",
#       ...
#     }
#   ],
#   "meta": {
#     "total_distance_km": 450.2,
#     "trip_id": 1
#   }
# }
```

### Test 4 : Vérifier les Logs

**Dans le terminal où le service tourne, vous devriez voir** :
```
INFO: Model loaded successfully
INFO: Prediction request received for trip_id=1
INFO: Found 12 POI candidates
INFO: Returning 3 top-scored stops
```

---

## 🛑 ARRÊT DU SERVICE

### Méthode 1 : Arrêt Propre (Terminal)

```bash
# Dans le terminal où le service tourne :
# Appuyer sur Ctrl + C

# Résultat :
# Service stopped gracefully
```

### Méthode 2 : Arrêt via Process (Windows)

```bash
# Trouver le processus Python
tasklist | findstr python

# Tuer le processus (remplacer <PID> par le numéro)
taskkill /PID <PID> /F
```

---

## 🔍 TROUBLESHOOTING

### Problème 1 : Port 5000 déjà utilisé

**Erreur** :
```
OSError: [WinError 10048] Only one usage of each socket address is normally permitted
```

**Solution 1** : Trouver et tuer le processus
```bash
# Trouver qui utilise le port 5000
netstat -ano | findstr :5000

# Exemple de résultat :
# TCP    0.0.0.0:5000    0.0.0.0:0    LISTENING    1234

# Tuer le processus (remplacer 1234 par le PID réel)
taskkill /PID 1234 /F
```

**Solution 2** : Changer le port
```bash
# Dans app.py, modifier :
# app.run(host='0.0.0.0', port=5001)  # Utiliser 5001 au lieu de 5000
```

### Problème 2 : Module non trouvé

**Erreur** :
```
ModuleNotFoundError: No module named 'sklearn'
```

**Solution** :
```bash
# Vérifier que l'environnement virtuel est activé
venv\Scripts\activate

# Réinstaller les dépendances
pip install -r requirements.txt

# Vérifier l'installation
pip list
```

### Problème 3 : Erreur scikit-learn

**Erreur** :
```
ImportError: DLL load failed while importing _arpack
```

**Solution** :
```bash
# Réinstaller scipy et numpy avec versions compatibles
pip uninstall scipy numpy scikit-learn -y
pip install numpy==1.24.3 scipy==1.11.4 scikit-learn==1.3.2
```

### Problème 4 : Timeout sur les prédictions

**Erreur** :
```
Request timeout after 120 seconds
```

**Solution** :
```bash
# Augmenter le timeout dans gunicorn
gunicorn --bind 0.0.0.0:5000 --workers 2 --timeout 300 app:app
```

### Problème 5 : Mémoire insuffisante

**Erreur** :
```
MemoryError: Unable to allocate array
```

**Solution** :
- Fermer les autres applications
- Réduire le nombre de workers Gunicorn :
```bash
gunicorn --bind 0.0.0.0:5000 --workers 1 --timeout 120 app:app
```

---

## 🐳 DÉMARRAGE AVEC DOCKER

### Option A : Docker seul

```bash
# Aller dans le dossier pause-ai-service
cd C:\Users\kossa\OneDrive\Desktop\essais\pause-ai-service

# Build de l'image Docker
docker build -t logiway-pause-ai .

# Lancer le conteneur
docker run -d -p 5000:5000 --name pause-ai logiway-pause-ai

# Vérifier les logs
docker logs -f pause-ai

# Arrêter le conteneur
docker stop pause-ai
docker rm pause-ai
```

### Option B : Docker Compose (Recommandé)

```bash
# Aller à la racine du projet
cd C:\Users\kossa\OneDrive\Desktop\essais

# Lancer uniquement le service Pause AI
docker-compose up -d pause-ai

# Voir les logs
docker-compose logs -f pause-ai

# Vérifier le statut
docker-compose ps

# Arrêter le service
docker-compose stop pause-ai

# Redémarrer le service
docker-compose restart pause-ai
```

### Option C : Plateforme Complète avec Docker

```bash
# Lancer toute la plateforme (MySQL + Backend + Frontend + Services IA)
docker-compose up -d

# Vérifier que tous les services sont UP
docker-compose ps

# Logs de tous les services
docker-compose logs -f

# Arrêt de la plateforme
docker-compose down
```

---

## 📊 COMMANDES UTILES

### Vérifier l'État du Service

```bash
# Health check
curl http://localhost:5000/health

# Statistiques du modèle (si endpoint existe)
curl http://localhost:5000/api/stats
```

### Logs et Monitoring

```bash
# Logs en temps réel (si configurés)
tail -f logs/app.log

# Logs Docker
docker logs -f pause-ai

# Statistiques CPU/RAM (Docker)
docker stats pause-ai
```

### Nettoyer l'Environnement

```bash
# Désactiver l'environnement virtuel
deactivate

# Supprimer l'environnement virtuel (si besoin de réinstaller)
rmdir /s /q venv

# Recréer l'environnement
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
```

---

## 🎯 CHECKLIST RAPIDE

### Avant de Démarrer
- [ ] Python 3.11+ installé
- [ ] Environnement virtuel créé (`venv`)
- [ ] Dépendances installées (`pip install -r requirements.txt`)
- [ ] Port 5000 libre

### Démarrage
- [ ] Environnement virtuel activé (`venv\Scripts\activate`)
- [ ] Service lancé (`python app.py`)
- [ ] Health check OK (`curl http://localhost:5000/health`)

### Tests
- [ ] Entraînement du modèle OK (`POST /api/train`)
- [ ] Prédiction test OK (`POST /api/predict`)
- [ ] Logs sans erreur

---

## 📞 INTÉGRATION AVEC BACKEND

Le backend Java Spring Boot appelle le service Pause AI via :

```java
// URL configurée dans application.yml
pause-ai:
  service:
    url: http://localhost:5000
    
// Appel depuis PauseAIServiceImpl.java
String url = pauseAiServiceUrl + "/api/predict";
ResponseEntity<PauseAIPredictionResponse> response = 
    restTemplate.postForEntity(url, request, PauseAIPredictionResponse.class);
```

**Pour tester l'intégration complète** :

1. **Lancer le service Pause AI** (port 5000)
2. **Lancer MySQL** (port 3306)
3. **Lancer le Backend** (port 8080)
4. **Lancer le Frontend** (port 4200)
5. **Créer un trajet dans l'interface web**
6. **Vérifier que les marqueurs de pause apparaissent sur la carte**

---

## 🎓 RESSOURCES

### Fichiers Importants

- `app.py` : Point d'entrée principal
- `requirements.txt` : Liste des dépendances Python
- `Dockerfile` : Configuration Docker
- `data/` : Dossier des données d'entraînement et modèle

### Documentation Technique

- **scikit-learn** : https://scikit-learn.org/
- **Flask** : https://flask.palletsprojects.com/
- **OSRM** : http://project-osrm.org/
- **Overpass API** : https://overpass-api.de/

### Logs et Debug

```python
# Dans app.py, activer le mode debug :
app.run(host='0.0.0.0', port=5000, debug=True)

# Logs détaillés :
import logging
logging.basicConfig(level=logging.DEBUG)
```

---

## ✨ COMMANDES RÉSUMÉES

```bash
# INSTALLATION (une seule fois)
cd pause-ai-service
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt

# DÉMARRAGE (chaque fois)
venv\Scripts\activate
python app.py

# TEST
curl http://localhost:5000/health
curl -X POST http://localhost:5000/api/train

# ARRÊT
Ctrl + C (dans le terminal du service)

# DOCKER (alternative)
docker-compose up -d pause-ai
docker-compose logs -f pause-ai
docker-compose stop pause-ai
```

---

**Version du guide** : 1.0.0  
**Dernière mise à jour** : 21 juillet 2026  
**Statut** : ✅ Service opérationnel et testé  
**Port** : 5000
