# GUIDE DE LANCEMENT DES SERVEURS — LOGIWAY

## Récapitulatif des ports

| Service               | Port   | Technologie     |
|-----------------------|--------|-----------------|
| Backend Spring Boot   | 8080   | Java / Maven    |
| Keycloak (Auth)       | 8180   | Keycloak        |
| Pause AI (ML)         | 5000   | Python / Flask  |
| Réclamation AI        | 5001   | Python / Flask  |
| RAG Chatbot           | 5003   | Python / FastAPI|
| Frontend Angular      | 4200   | Angular / Node  |
| MySQL                 | 3306   | MySQL           |

---

## 1. Backend Spring Boot (port 8080)

**Répertoire :** `c:\Users\kossa\OneDrive\Desktop\essais\backend`

```cmd
cd c:\Users\kossa\OneDrive\Desktop\essais\backend
mvn spring-boot:run
```

**Vérification :** http://localhost:8080/swagger-ui.html

> Prérequis : MySQL doit tourner sur le port 3306 avec la base `logiway_db`

---

## 2. Pause AI Service — ML (port 5000)

**Répertoire :** `c:\Users\kossa\OneDrive\Desktop\essais\pause-ai-service`

### ✅ Commande qui fonctionne (PowerShell)
```powershell
cd c:\Users\kossa\OneDrive\Desktop\essais\pause-ai-service
venv\Scripts\activate
python app.py
```

**Vérification :** http://localhost:5000/api/health

**Entraîner le modèle (1ère fois ou après redémarrage) :**
```
POST http://localhost:5000/api/train
```

---

## 3. Réclamation AI Service (port 5001)

**Répertoire :** `c:\Users\kossa\OneDrive\Desktop\essais\reclamation-ai-service`

### ✅ Commande qui fonctionne (PowerShell)
```powershell
cd c:\Users\kossa\OneDrive\Desktop\essais\reclamation-ai-service
python app_simple.py
```

**Vérification :** http://localhost:5001/health

---

## 4. RAG Chatbot Service — Gemini (port 5003)

**Répertoire :** `c:\Users\kossa\OneDrive\Desktop\essais\rag-service`

### 1ère fois — installer les dépendances
```powershell
cd c:\Users\kossa\OneDrive\Desktop\essais\rag-service
venv\Scripts\activate
pip install -r requirements.txt
pip install pydantic-settings
```

### ✅ Commande qui fonctionne (PowerShell)
```powershell
cd c:\Users\kossa\OneDrive\Desktop\essais\rag-service
python -m uvicorn app.main:app --host 0.0.0.0 --port 5003 --reload
```

**Vérification :** http://localhost:5003/health  
**Documentation API :** http://localhost:5003/docs

---

## 5. Frontend Angular (port 4200)

**Répertoire :** `c:\Users\kossa\OneDrive\Desktop\essais\frontend`

```cmd
cd c:\Users\kossa\OneDrive\Desktop\essais\frontend
npm install
ng serve
```

ou si `ng` n'est pas dans le PATH :
```cmd
npx ng serve
```

**Accès :** http://localhost:4200

---

## Ordre de démarrage recommandé

```
1. MySQL          (doit déjà tourner)
2. Keycloak       → port 8180
3. Backend        → port 8080
4. Pause AI       → port 5000
5. Réclamation AI → port 5001
6. RAG Chatbot    → port 5003
7. Frontend       → port 4200
```

---

## Endpoints utiles

| URL                                        | Description                        |
|--------------------------------------------|------------------------------------|
| http://localhost:8080/swagger-ui.html      | API Backend (doc Swagger)          |
| http://localhost:5000/api/health           | Santé Pause AI                     |
| http://localhost:5000/api/train            | Entraîner modèle ML (POST)         |
| http://localhost:5001/health               | Santé Réclamation AI               |
| http://localhost:5003/health               | Santé RAG Chatbot                  |
| http://localhost:5003/docs                 | API RAG (doc Swagger)              |
| http://localhost:4200                      | Application frontend               |

---

## Dépannage rapide

**Port déjà occupé :**
```cmd
netstat -ano | findstr :<PORT>
taskkill /PID <PID> /F
```

**Venv n'existe pas (Python) :**
```cmd
cd c:\Users\kossa\OneDrive\Desktop\essais\pause-ai-service
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
```

**Modèle Pause AI non entraîné (erreur 400) :**
```
Appeler POST http://localhost:5000/api/train
```
