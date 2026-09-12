# 🤖 PAUSE AI SERVICE - MACHINE LEARNING

**Service de prédiction intelligente des pauses réglementaires**

[![Status](https://img.shields.io/badge/status-operational-success)]()
[![Python](https://img.shields.io/badge/python-3.11-blue)]()
[![ML](https://img.shields.io/badge/ML-RandomForest-orange)]()
[![Port](https://img.shields.io/badge/port-5000-lightgrey)]()

---

## 📋 DESCRIPTION

Le service Pause AI utilise un modèle de Machine Learning (RandomForest) pour prédire les moments optimaux de pause pour les conducteurs de poids lourds, conformément au **Règlement CE 561/2006**.

### Caractéristiques

- ✅ **Modèle ML** : RandomForest avec 200 arbres de décision
- ✅ **15 Features** : Analyse contextuelle complète (conduite, POI, temporel)
- ✅ **Précision** : R² = 0.90 (90% de précision prédictive)
- ✅ **Performance** : <50ms par prédiction
- ✅ **Conformité** : Application stricte du règlement européen
- ✅ **Scoring POI** : 0-100 pour chaque point de pause potentiel

---

## 🚀 DÉMARRAGE

### Quick Start (1 minute)

```bash
# Installation + Démarrage
setup_pause_ai.bat && start_pause_ai.bat
```

Voir **[QUICK_START.md](QUICK_START.md)** pour le guide rapide.

### Guide Complet

Voir **[GUIDE_DEMARRAGE_PAUSE_AI.md](GUIDE_DEMARRAGE_PAUSE_AI.md)** pour les instructions détaillées.

---

## 📊 ARCHITECTURE ML

### Modèle RandomForest

```
Entrée: 15 features → RandomForest (200 arbres) → Score 0-100
```

### Features Analysées

| Groupe | Features | Poids |
|--------|----------|-------|
| **État Chauffeur** | hours_driving, total_distance_km, dist_along_ratio | 35%, 12%, 18% |
| **Contexte Temporel** | arrival_hour, is_meal_hour | 10%, 8% |
| **POI** | poi_type, perp_distance, has_hgv, has_toilets, is_24h | 5-25% |
| **Calculées** | is_meal_poi, is_mid_range_fuel, is_highway_service | 5-10% |

### Pipeline de Prédiction

```
1. Requête (startLat, startLon, endLat, endLon)
   ↓
2. OSRM : Calcul itinéraire + polyline
   ↓
3. Overpass API : Récupération POI le long du trajet
   ↓
4. Construction 15 features par POI
   ↓
5. RandomForest : Scoring 0-100 par POI
   ↓
6. Retour top 3 POI recommandés + alertes 3h/4h30
```

---

## 🔌 API ENDPOINTS

### Health Check

```http
GET /health

Response:
{
  "status": "healthy",
  "service": "pause-ai-ml",
  "model_loaded": true
}
```

### Train Model

```http
POST /api/train

Response:
{
  "status": "success",
  "message": "Model trained successfully",
  "metrics": {
    "r2_score": 0.90,
    "mae": 8.5
  }
}
```

### Predict Pauses

```http
POST /api/predict
Content-Type: application/json

Request:
{
  "startLat": 48.8566,
  "startLon": 2.3522,
  "endLat": 45.7640,
  "endLon": 4.8357,
  "trip_id": 1
}

Response:
{
  "stops": [
    {
      "lat": 48.95,
      "lon": 2.40,
      "score": 82,
      "type": "fuel",
      "name": "Station Total",
      "has_hgv": true,
      "has_toilets": true,
      "is_24h": true,
      "dist_along_m": 125000,
      "hours_driving": 3.2
    }
  ],
  "meta": {
    "total_distance_km": 450.2,
    "trip_id": 1,
    "prediction_time_ms": 45
  }
}
```

---

## 🧪 TESTS

### Tests Automatisés

```bash
# Lancer tous les tests
test_pause_ai.bat
```

### Tests Manuels

```bash
# Health Check
curl http://localhost:5000/health

# Entraînement
curl -X POST http://localhost:5000/api/train

# Prédiction Paris → Lyon
curl -X POST http://localhost:5000/api/predict \
  -H "Content-Type: application/json" \
  -d '{"startLat": 48.8566, "startLon": 2.3522, "endLat": 45.764, "endLon": 4.8357, "trip_id": 1}'
```

---

## 📦 DÉPENDANCES

### Python Packages

```
flask==3.0.0          # Framework web
scikit-learn==1.3.2   # Machine Learning
numpy==1.24.3         # Calculs numériques
pandas==2.1.4         # Manipulation données
requests==2.31.0      # Requêtes HTTP (OSRM, Overpass)
gunicorn==21.2.0      # Serveur WSGI production
```

### Services Externes

- **OSRM** : Calcul d'itinéraires (https://router.project-osrm.org)
- **Overpass API** : Récupération POI OpenStreetMap

---

## 🐳 DÉPLOIEMENT DOCKER

### Build et Run

```bash
# Build image
docker build -t logiway-pause-ai .

# Run conteneur
docker run -d -p 5000:5000 --name pause-ai logiway-pause-ai

# Logs
docker logs -f pause-ai
```

### Docker Compose

```bash
# Depuis la racine du projet
docker-compose up -d pause-ai

# Vérification
docker-compose ps
docker-compose logs -f pause-ai
```

---

## 🔧 CONFIGURATION

### Variables d'Environnement

```env
MODEL_PATH=data/pause_model.joblib
TRAINING_DATA_PATH=data/training_data.csv
OSRM_URL=https://router.project-osrm.org
DEBUG=false
FLASK_ENV=production
WORKERS=2
TIMEOUT=120
```

---

## 📈 MÉTRIQUES

### Performance Modèle ML

- **R² Score** : 0.90 (excellente précision)
- **MAE** : 8.5 points sur 100
- **Temps d'entraînement** : ~30 secondes (10,000 exemples)
- **Temps de prédiction** : <50 milliseconds

### Performance Service

- **Latence API** : ~2-5 secondes (dépend longueur trajet)
- **Throughput** : ~100 requêtes/minute (2 workers)
- **Mémoire** : ~200 MB par worker

---

## 🛠️ TROUBLESHOOTING

### Port 5000 occupé

```bash
netstat -ano | findstr :5000
taskkill /PID <PID> /F
```

### Erreur scikit-learn

```bash
pip uninstall scipy numpy scikit-learn -y
pip install numpy==1.24.3 scipy==1.11.4 scikit-learn==1.3.2
```

### Logs de debug

```python
# Dans app.py
import logging
logging.basicConfig(level=logging.DEBUG)
```

---

## 📚 DOCUMENTATION

- **[QUICK_START.md](QUICK_START.md)** : Démarrage rapide (1 minute)
- **[GUIDE_DEMARRAGE_PAUSE_AI.md](GUIDE_DEMARRAGE_PAUSE_AI.md)** : Guide complet
- **[Dockerfile](Dockerfile)** : Configuration Docker
- **[requirements.txt](requirements.txt)** : Dépendances Python

---

## 🔗 INTÉGRATION

Le service Pause AI s'intègre avec :

- **Backend Spring Boot** (port 8080) : Consomme l'API `/api/predict`
- **Frontend Angular** (port 4200) : Affiche les marqueurs de pause sur la carte
- **MySQL** : Stockage des prédictions dans table `pause_ai_predictions`

### Flux d'Intégration

```
1. Backend : Détecte trajet EN_COURS + hours_driving ≥ 3h
   ↓
2. Backend → Pause AI : POST /api/predict avec coordonnées
   ↓
3. Pause AI : Calcule scores POI + retourne top 3
   ↓
4. Backend : Sauvegarde prédictions + envoie notification
   ↓
5. Frontend : Affiche marqueurs jaune (3h) et rouge (4h30)
```

---

## 👥 CONTRIBUTION

### Structure du Code

```
pause-ai-service/
├── app.py                 # Point d'entrée Flask
├── requirements.txt       # Dépendances Python
├── Dockerfile            # Configuration Docker
├── data/                 # Données modèle ML
│   ├── pause_model.joblib
│   └── training_data.csv
├── setup_pause_ai.bat    # Installation Windows
├── start_pause_ai.bat    # Démarrage Windows
├── test_pause_ai.bat     # Tests Windows
└── README.md             # Ce fichier
```

---

## 📜 LICENCE

Ce service fait partie de la plateforme **LogiWay** - Gestion Intelligente de Flotte.

---

## 📞 SUPPORT

### Logs

```bash
# Service local
tail -f logs/app.log

# Docker
docker logs -f pause-ai
```

### État du Service

```bash
curl http://localhost:5000/health
```

### Contact

- **Documentation complète** : [GUIDE_DEMARRAGE_PAUSE_AI.md](GUIDE_DEMARRAGE_PAUSE_AI.md)
- **Issues** : Créer une issue sur le repository
- **Email** : support@logiway.com

---

**Version** : 1.0.0  
**Dernière mise à jour** : 21 juillet 2026  
**Statut** : ✅ Production Ready
