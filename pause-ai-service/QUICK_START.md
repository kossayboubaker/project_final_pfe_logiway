# ⚡ PAUSE AI - QUICK START (1 MINUTE)

**Port** : 5000 | **Type** : Machine Learning Service

---

## 🚀 DÉMARRAGE RAPIDE

### Option 1 : Windows (Scripts Batch) - RECOMMANDÉ

```bash
# 1. Installation (première fois uniquement - 3 minutes)
setup_pause_ai.bat

# 2. Démarrage (chaque fois - 5 secondes)
start_pause_ai.bat

# 3. Tests (optionnel)
test_pause_ai.bat
```

### Option 2 : Ligne de Commande

```bash
# 1. Installation
cd pause-ai-service
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt

# 2. Démarrage
venv\Scripts\activate
python app.py
```

### Option 3 : Docker (Le plus simple)

```bash
# Depuis la racine du projet
docker-compose up -d pause-ai

# Voir les logs
docker-compose logs -f pause-ai
```

---

## ✅ VÉRIFICATION

```bash
# Test rapide
curl http://localhost:5000/health

# Résultat attendu :
# {"status": "healthy", "service": "pause-ai-ml", "model_loaded": true}
```

**Ou dans le navigateur** : http://localhost:5000/health

---

## 🎯 ENDPOINTS PRINCIPAUX

| Endpoint | Méthode | Description |
|----------|---------|-------------|
| `/health` | GET | Statut du service |
| `/api/train` | POST | Entraîner le modèle ML |
| `/api/predict` | POST | Prédiction pauses pour un trajet |

---

## 🛑 ARRÊT

```bash
# Dans le terminal du service :
Ctrl + C

# Docker :
docker-compose stop pause-ai
```

---

## 📞 AIDE

**Problème de port** :
```bash
netstat -ano | findstr :5000
taskkill /PID <PID> /F
```

**Documentation complète** : `GUIDE_DEMARRAGE_PAUSE_AI.md`

---

**Temps total** : 5 minutes (installation) + 10 secondes (démarrage)
