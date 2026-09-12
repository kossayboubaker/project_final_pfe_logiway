# 🔌 PORTS DES SERVICES AI/ML - RÉCAPITULATIF

## 📋 Tableau des Ports

| Service | Port | Technologie | Description |
|---------|------|-------------|-------------|
| **Backend Principal** | `8080` | Spring Boot | API REST principale |
| **Réclamation AI** | `5001` | Flask + Python | Validation IA des réclamations (toxicité + sémantique) |
| **Pause AI** | `5000` | Flask + Python | Prédiction ML des pauses optimales (RandomForest) |
| **RAG Chatbot** | `5003` | FastAPI + Python + Gemini | Assistant intelligent avec génération de rapports |
| **OSRM** | *(externe)* | Service en ligne | Calcul d'itinéraires (https://router.project-osrm.org) |
| **Simulator** | *(aucun)* | Python Scripts | Scripts de simulation (pas de serveur web) |

---

## 🚀 COMMANDES DE DÉMARRAGE

### 1️⃣ Service Réclamation AI (Port 5001)
```bash
# Accès au répertoire
cd c:\Users\kossa\OneDrive\Desktop\essais\reclamation-ai-service

# Démarrage
python app_simple.py
# ou
start_simple.bat
```

**Test:**
```bash
curl http://localhost:5001/health
```

---

### 2️⃣ Service Pause AI (Port 5000)
```bash
# Accès au répertoire
cd c:\Users\kossa\OneDrive\Desktop\essais\pause-ai-service

# Démarrage
python app.py
```

**Test:**
```bash
curl http://localhost:5000/api/health
```

---

### 3️⃣ Service RAG Chatbot (Port 5003)
```bash
# Accès au répertoire
cd c:\Users\kossa\OneDrive\Desktop\essais\rag-service

# Démarrage
uvicorn app.main:app --host 0.0.0.0 --port 5003 --reload
# ou
start_gemini.bat
```

**Test:**
```bash
curl http://localhost:5003/health
```

**Interface Swagger:**
```
http://localhost:5003/docs
```

---

### 4️⃣ Backend Principal (Port 8080)
```bash
# Accès au répertoire
cd c:\Users\kossa\OneDrive\Desktop\essais\backend

# Démarrage
mvn spring-boot:run
```

**Test:**
```bash
curl http://localhost:8080/api/health
```

---

### 5️⃣ OSRM (Service Externe)
**URL:** `https://router.project-osrm.org`

OSRM est utilisé en ligne, pas de serveur local à démarrer.

**Test:**
```bash
curl "https://router.project-osrm.org/route/v1/driving/10.391,36.835;9.561,33.889?overview=false"
```

---

### 6️⃣ Simulator Python (Aucun Port)
```bash
# Accès au répertoire
cd c:\Users\kossa\OneDrive\Desktop\essais\simulator

# Lancement des simulateurs (pas de serveur web)
python launch_all_simulators.py
```

⚠️ **Note:** Le simulator n'est PAS un serveur web. Il s'agit de scripts Python qui envoient des requêtes HTTP au backend (port 8080).

---

## 🧪 VÉRIFICATION RAPIDE DE TOUS LES SERVICES

```bash
# Test Réclamation AI
curl http://localhost:5001/health

# Test Pause AI
curl http://localhost:5000/api/health

# Test RAG Chatbot
curl http://localhost:5003/health

# Test Backend
curl http://localhost:8080/api/health

# Test OSRM
curl "https://router.project-osrm.org/route/v1/driving/10.391,36.835;9.561,33.889?overview=false"
```

---

## 📊 DÉTAILS DES MODÈLES AI/ML

### 🤖 Réclamation AI (Port 5001)
- **Modèle:** Validation basée sur règles (Simple)
- **Technologie:** Flask
- **Validation:**
  - **Toxicité:** Détection de mots toxiques
  - **Sémantique:** Correspondance avec domaine flotte

### 🛑 Pause AI (Port 5000)
- **Modèle:** RandomForest (200 estimateurs)
- **Technologie:** Flask + scikit-learn
- **Prédiction:**
  - Recommandation de pauses optimales
  - Analyse de fatigue et accessibilité
  - Intégration POIs (Overpass API)

### 💬 RAG Chatbot (Port 5003)
- **Modèle:** Google Gemini 1.5 Flash
- **Technologie:** FastAPI + LangChain
- **Fonctionnalités:**
  - Q&A sur données Logiway
  - Génération de rapports (PDF, CSV, TXT)
  - Retrieval Augmented Generation (RAG)

---

## 🔧 CONFIGURATION (application.yml)

```yaml
# Backend (8080)
server:
  port: 8080

# Réclamation AI (5001)
reclamation:
  ai:
    local-service-url: ${RECLAMATION_AI_URL:http://localhost:5001}

# Pause AI (5000)
pause:
  ai:
    url: ${PAUSE_AI_URL:http://localhost:5000}

# RAG Chatbot (5003)
rag:
  service:
    url: ${RAG_SERVICE_URL:http://localhost:5003}

# OSRM (Externe)
osrm:
  base-url: ${OSRM_BASE_URL:http://router.project-osrm.org/route/v1/driving/}
```

---

## ⚡ ORDRE DE DÉMARRAGE RECOMMANDÉ

1. **Backend** (Port 8080) - Base de données + API principale
2. **Réclamation AI** (Port 5001) - Validation des réclamations
3. **Pause AI** (Port 5000) - Prédiction des pauses
4. **RAG Chatbot** (Port 5003) - Assistant + Rapports
5. **Simulator** - Scripts de test (optionnel)

---

## 📝 NOTES IMPORTANTES

1. **OSRM** ne nécessite pas de serveur local (service en ligne)
2. **Simulator** n'est pas un serveur mais un ensemble de scripts Python
3. Tous les services ML/AI sont indépendants du backend
4. Le backend peut fonctionner même si les services ML sont arrêtés (avec gestion d'erreur)

---

**Date de création:** 21 juillet 2026
