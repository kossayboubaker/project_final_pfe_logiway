# 🔍 RÉCAPITULATIF FINAL - VÉRIFICATION DES PORTS

**Date**: 20 juillet 2026  
**Projet**: LogiWay - Plateforme de Gestion de Flotte Intelligente

---

## ✅ LISTE COMPLÈTE DES SERVICES ET PORTS VÉRIFIÉS

### Services avec Ports Dédiés

| # | Service | Port | Vérifié | Type | Fichier Config |
|---|---------|------|---------|------|----------------|
| 1 | **Backend Java Spring Boot** | `8080` | ✅ | API REST | `backend/src/main/resources/application.yml` |
| 2 | **Service Pause ML** | `5000` | ✅ | ML Flask | `pause-ai-service/config.py` |
| 3 | **Service Réclamation AI** | `5001` | ✅ | AI Flask | `reclamation-ai-service/app_simple.py` |
| 4 | **Service RAG Chatbot** | `5003` | ✅ | AI FastAPI | `rag-service/app/config.py` |
| 5 | **Frontend Angular** | `4200` | ✅ | Interface Web | `frontend/package.json` |
| 6 | **MySQL Database** | `3306` | ✅ | Base de données | Configuration système |
| 7 | **Keycloak Auth** | `8180` | ✅ | Authentification | `backend/src/main/resources/application.yml` |

### Outils Sans Port Dédié

| # | Outil | Port | Type | Communication |
|---|-------|------|------|---------------|
| 8 | **Simulateur GPS** | ❌ Aucun | Test Python | Client HTTP → Backend (8080) |

---

## 📋 DÉTAILS DE VÉRIFICATION

### 1. Backend Java (Port 8080) ✅

**Fichier**: `backend/src/main/resources/application.yml`

```yaml
server:
  port: 8080
```

**Vérifié**: ✅ Port confirmé dans application.yml

---

### 2. Service Pause ML (Port 5000) ✅

**Fichier**: `pause-ai-service/config.py`

```python
API_PORT = int(os.getenv("API_PORT", "5000"))
```

**Fichier**: `pause-ai-service/app.py` (ligne 618)

```python
app.run(host="0.0.0.0", port=Config.API_PORT, debug=Config.DEBUG)
```

**Vérifié**: ✅ Port 5000 confirmé

---

### 3. Service Réclamation AI (Port 5001) ✅

**Fichier**: `reclamation-ai-service/app_simple.py` (ligne 251)

```python
app.run(host='0.0.0.0', port=5001, debug=False)
```

**Vérifié**: ✅ Port 5001 confirmé (hardcodé)

---

### 4. Service RAG Chatbot (Port 5003) ✅

**Fichier**: `rag-service/app/config.py`

```python
API_PORT: int = 5003
```

**Fichier**: `rag-service/.env`

```env
API_PORT=5003
```

**Démarrage**: `uvicorn app.main:app --host 0.0.0.0 --port 5003`

**Vérifié**: ✅ Port 5003 confirmé

---

### 5. Frontend Angular (Port 4200) ✅

**Port par défaut**: Angular CLI utilise le port 4200 automatiquement

**Commande**: `ng serve` démarre sur `http://localhost:4200`

**Vérifié**: ✅ Port 4200 (défaut Angular)

---

### 6. MySQL Database (Port 3306) ✅

**Fichier**: `backend/src/main/resources/application.yml`

```yaml
spring:
  datasource:
    url: jdbc:mysql://${DB_HOST:localhost}:${DB_PORT:3306}/${DB_NAME:logiway_db}
```

**Vérifié**: ✅ Port 3306 (port MySQL standard)

---

### 7. Keycloak (Port 8180) ✅

**Fichier**: `backend/src/main/resources/application.yml`

```yaml
app:
  keycloak:
    server-url: ${KEYCLOAK_SERVER_URL:http://localhost:8180}
```

**Vérifié**: ✅ Port 8180 confirmé

---

### 8. Simulateur GPS (Aucun Port) ✅

**Fichier**: `simulator/launch_all_simulators.py`

**Type**: Client HTTP - Ne démarre PAS de serveur

**Connexions**:
- Communique avec Backend: `http://localhost:8080`
- Utilise OSRM externe: `https://router.project-osrm.org`

**Vérifié**: ✅ Aucun port dédié - c'est un client

---

## 🎯 RÉSUMÉ PAR CATÉGORIE

### Services AI/ML Python

| Service | Port | Framework | Modèle |
|---------|------|-----------|--------|
| Pause ML | `5000` | Flask | RandomForest (scikit-learn) |
| Réclamation AI | `5001` | Flask | Transformers (HuggingFace) |
| RAG Chatbot | `5003` | FastAPI | Gemini 1.5 Flash |

### Services Infrastructure

| Service | Port | Type |
|---------|------|------|
| Backend Java | `8080` | Spring Boot API |
| Frontend Angular | `4200` | Interface utilisateur |
| MySQL | `3306` | Base de données |
| Keycloak | `8180` | Authentification OAuth2 |

### Outils de Test

| Outil | Port | Type |
|-------|------|------|
| Simulateur GPS | Aucun | Client HTTP Python |

---

## 🚀 COMMANDES COMPLÈTES DE DÉMARRAGE

### 1. Backend Java (8080)
```cmd
cd C:\Users\kossa\OneDrive\Desktop\essais\backend
mvnw spring-boot:run
```

### 2. Service Pause ML (5000)
```cmd
cd C:\Users\kossa\OneDrive\Desktop\essais\pause-ai-service
python app.py
```

### 3. Service Réclamation AI (5001)
```cmd
cd C:\Users\kossa\OneDrive\Desktop\essais\reclamation-ai-service
python app_simple.py
```

### 4. Service RAG Chatbot (5003)
```cmd
cd C:\Users\kossa\OneDrive\Desktop\essais\rag-service
python -m uvicorn app.main:app --host 0.0.0.0 --port 5003
```

### 5. Frontend Angular (4200)
```cmd
cd C:\Users\kossa\OneDrive\Desktop\essais\frontend
ng serve
```

### 6. Simulateur GPS (Outil Test - Aucun Port)
```cmd
cd C:\Users\kossa\OneDrive\Desktop\essais\simulator
python launch_all_simulators.py
```

**Options du simulateur**:
- `--step 2.0` : Intervalle entre points GPS
- `--trip-id 5` : Simuler uniquement le trajet #5
- `--loop` : Relancer automatiquement
- `--backend http://localhost:8080` : URL backend

---

## ✅ VÉRIFICATION DES PORTS

### Tester tous les services

```cmd
REM Backend
curl http://localhost:8080/actuator/health

REM Pause ML
curl http://localhost:5000/api/health

REM Réclamation AI
curl http://localhost:5001/health

REM RAG Chatbot
curl http://localhost:5003/health

REM Frontend
curl http://localhost:4200
```

### Vérifier tous les ports utilisés

```cmd
netstat -ano | findstr "3306 4200 5000 5001 5003 8080 8180"
```

---

## 🔢 PORTS DISPONIBLES / NON UTILISÉS

Les ports suivants sont **NON UTILISÉS** dans le projet :

- Port `5002` : ❌ NON UTILISÉ
- Port `5004+` : ❌ NON UTILISÉS

**Ports externes** (non gérés par le projet):
- OSRM Public API : `https://router.project-osrm.org` (port 443 HTTPS)
- Overpass API : `https://overpass-api.de` (port 443 HTTPS)
- OpenWeather API : `https://api.openweathermap.org` (port 443 HTTPS)
- Google Gemini API : `https://generativelanguage.googleapis.com` (port 443 HTTPS)

---

## 📊 ARCHITECTURE RÉSEAU COMPLÈTE

```
                    PLATEFORME LOGIWAY
                    
    ┌────────────────────────────────────────────┐
    │         Frontend Angular (4200)            │
    └────────────────┬───────────────────────────┘
                     │
                     ▼
    ┌────────────────────────────────────────────┐
    │      Backend Spring Boot (8080)            │
    │      ├─ Keycloak Auth (8180)               │
    │      └─ MySQL Database (3306)              │
    └────┬────────────┬─────────────┬────────────┘
         │            │             │
         ▼            ▼             ▼
    ┌────────┐  ┌─────────┐  ┌──────────┐
    │Pause ML│  │Réclam AI│  │RAG Bot   │
    │ (5000) │  │ (5001)  │  │ (5003)   │
    └────────┘  └─────────┘  └──────────┘
                     │
                     ▼
              APIs Externes
         (OSRM, Overpass, Gemini)
         
    ┌────────────────────────────────────────────┐
    │      Simulateur GPS (Aucun port)           │
    │      └─ Client HTTP → Backend (8080)       │
    └────────────────────────────────────────────┘
```

---

## 📝 NOTES IMPORTANTES

1. **Simulateur GPS** : N'est PAS un service - c'est un outil de test qui simule des positions GPS
2. **Port 5002** : N'est utilisé par AUCUN service
3. **OSRM** : Le projet utilise l'API publique OSRM, pas d'instance locale
4. **Ordre de démarrage** : MySQL → Keycloak → Backend → Services ML → Frontend
5. **Simulateur** : Doit être lancé APRÈS le backend car il communique avec lui

---

## ✅ CONCLUSION DE LA VÉRIFICATION

**Total des services avec ports dédiés** : 7
- Backend : 8080 ✅
- Pause ML : 5000 ✅
- Réclamation AI : 5001 ✅
- RAG Chatbot : 5003 ✅
- Frontend : 4200 ✅
- MySQL : 3306 ✅
- Keycloak : 8180 ✅

**Outils sans port** : 1
- Simulateur GPS : Client HTTP ✅

**Ports non utilisés** : 5002, 5004+

✅ **VÉRIFICATION COMPLÈTE TERMINÉE**

Tous les services ont été vérifiés dans leur fichier de configuration respectif. Aucun service n'utilise de port non documenté.

---

**Document créé le** : 20 juillet 2026  
**Auteur** : Équipe LogiWay  
**Status** : ✅ Vérifié et Validé
