# 🔌 PORTS DES SERVICES AI/ML - LOGIWAY

## 📋 RÉSUMÉ DES PORTS

| Service | Port | Type | Path |
|---------|------|------|------|
| **Pause AI Service** | 5000 | ML (Prédiction) | `c:\Users\kossa\OneDrive\Desktop\essais\pause-ai-service` |
| **Réclamation AI Service** | 5001 | ML (Validation) | `c:\Users\kossa\OneDrive\Desktop\essais\reclamation-ai-service` |
| **RAG Chatbot Service** | 5003 | AI (Assistant) | `c:\Users\kossa\OneDrive\Desktop\essais\rag-service` |
| **OSRM (Routing)** | 5000 (externe) | Service | `http://router.project-osrm.org` (ou localhost:5000 si local) |
| **Simulator** | N/A | Script Python | `c:\Users\kossa\OneDrive\Desktop\essais\simulator` |

---

## 🚀 COMMANDES DE LANCEMENT

### 1️⃣ **Pause AI Service** (Port 5000)
**Type:** Machine Learning - Prédiction des pauses intelligentes
**Modèle:** RandomForest (scikit-learn)

```bash
# Accéder au répertoire
cd c:\Users\kossa\OneDrive\Desktop\essais\pause-ai-service

# Activer l'environnement virtuel (si nécessaire)
venv\Scripts\activate

# Lancer le service
python app.py
```

**Endpoints principaux:**
- `GET http://localhost:5000/api/health` - Vérifier l'état du service
- `POST http://localhost:5000/api/train` - Entraîner le modèle
- `POST http://localhost:5000/api/predict` - Prédire les pauses

---

### 2️⃣ **Réclamation AI Service** (Port 5001)
**Type:** Machine Learning - Validation toxicité & pertinence
**Modèles:** toxic-bert + sentence-transformers

```bash
# Accéder au répertoire
cd c:\Users\kossa\OneDrive\Desktop\essais\reclamation-ai-service

# Activer l'environnement virtuel
venv-reclamation\Scripts\activate

# Lancer le service
python app.py
```

**Endpoints principaux:**
- `GET http://localhost:5001/health` - Vérifier l'état du service
- `POST http://localhost:5001/validate` - Valider un texte

---

### 3️⃣ **RAG Chatbot Service** (Port 5003)
**Type:** AI Assistant - Chatbot intelligent avec RAG
**Modèle:** Google Gemini (gemini-3.1-flash-lite)

```bash
# Accéder au répertoire
cd c:\Users\kossa\OneDrive\Desktop\essais\rag-service

# Activer l'environnement virtuel
venv\Scripts\activate

# Lancer le service
python -m uvicorn app.main:app --host 0.0.0.0 --port 5003
```

**Endpoints principaux:**
- `GET http://localhost:5003/health` - Vérifier l'état du service
- `POST http://localhost:5003/chat` - Dialoguer avec l'assistant
- `GET http://localhost:5003/docs` - Documentation Swagger

---

### 4️⃣ **OSRM Routing Service**
**Type:** Service de calcul d'itinéraires
**Port:** Service externe (pas de port local par défaut)

**Configuration:**
- **Serveur externe:** `http://router.project-osrm.org` (par défaut)
- **Serveur local (si déployé):** `http://localhost:5000`

**Utilisation:**
OSRM est utilisé par le Pause AI Service et le Simulator pour calculer les itinéraires.

**Pour déployer OSRM localement:**
```bash
# Avec Docker
docker run -t -i -p 5000:5000 -v "${PWD}:/data" ghcr.io/project-osrm/osrm-backend osrm-routed --algorithm mld /data/map.osrm
```

**Variable d'environnement:**
```bash
set OSRM_URL=http://localhost:5000
```

---

### 5️⃣ **Simulator** (Pas de port - Script CLI)
**Type:** Simulateur GPS pour trajets
**Fonction:** Simule les déplacements de camions en temps réel

```bash
# Accéder au répertoire
cd c:\Users\kossa\OneDrive\Desktop\essais\simulator

# Lancer tous les simulateurs pour les trajets EN_COURS
python launch_all_simulators.py

# Avec options
python launch_all_simulators.py --step 2.0
python launch_all_simulators.py --backend http://localhost:8080
python launch_all_simulators.py --trip-id 5
python launch_all_simulators.py --loop
```

**Dépendances:**
- Backend Spring Boot (port 8080)
- OSRM (pour calcul d'itinéraires)

---

## 🔍 VÉRIFICATION DES PORTS

### Vérifier qu'un port est libre:
```bash
netstat -ano | findstr :5000
netstat -ano | findstr :5001
netstat -ano | findstr :5003
```

### Tester les services:
```bash
# Pause AI
curl http://localhost:5000/api/health

# Réclamation AI
curl http://localhost:5001/health

# RAG Chatbot
curl http://localhost:5003/health
```

---

## 📦 BACKEND & FRONTEND

### Backend Spring Boot (port 8080)
```bash
cd c:\Users\kossa\OneDrive\Desktop\essais\backend
# Lancer avec Maven ou IDE
```

### Frontend Angular (port 4200)
```bash
cd c:\Users\kossa\OneDrive\Desktop\essais\frontend
npm start
```

---

## 🧠 DÉTAILS TECHNIQUES DES MODÈLES

### **Pause AI Service**
- **Modèle:** RandomForest (200 estimateurs)
- **Framework:** scikit-learn
- **Features:** 15 variables (distance, heure, type POI, équipements)
- **Prédiction:** Score de pertinence pour pauses suggérées

### **Réclamation AI Service**
- **Modèles:**
  - `unitary/toxic-bert` - Détection de toxicité
  - `sentence-transformers/all-MiniLM-L6-v2` - Embeddings sémantiques
- **Framework:** Transformers (HuggingFace)
- **Validation:** Toxicité + Pertinence métier

### **RAG Chatbot Service**
- **Modèle:** Google Gemini (gemini-3.1-flash-lite)
- **Architecture:** RAG (Retrieval-Augmented Generation)
- **Base de données:** MySQL + Vector Store
- **Features:** Recherche sémantique + Génération contextuelle

---

## 🔄 ORDRE DE DÉMARRAGE RECOMMANDÉ

1. **Backend Spring Boot** (port 8080)
2. **OSRM** (si local, port 5000)
3. **Pause AI Service** (port 5000 - si OSRM externe)
4. **Réclamation AI Service** (port 5001)
5. **RAG Chatbot Service** (port 5003)
6. **Frontend Angular** (port 4200)
7. **Simulator** (script Python - optionnel)

---

## 📝 NOTES IMPORTANTES

- **Conflit de ports:** Si OSRM local est sur le port 5000, changer le port du Pause AI Service via la variable `API_PORT`
- **Dépendances:** Le Simulator nécessite que le Backend et OSRM soient actifs
- **Environnements virtuels:** Chaque service Python a son propre venv
- **Configuration:** Les ports sont configurables via variables d'environnement ou fichiers config.py

---

**Date de création:** 2026-07-21
**Version:** 1.0
