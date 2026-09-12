# 🤖 Service RAG Chatbot - Architecture & Plan d'Implémentation

## 📋 Résumé Exécutif

**Objectif**: Créer un microservice Python autonome (RAG) qui répond aux questions sur le projet Logiway en interrogeant directement la base de données MySQL, sans perturber le chatbot Spring Boot existant.

**Port**: 5003 (5000 et 5001 déjà utilisés)  
**Stack**: Python + FastAPI + LangChain + Ollama + MySQL  
**Mode**: 100% self-hosted, gratuit, local

---

## 🔍 Analyse du Système Existant

### Chatbot Spring Boot (À NE PAS TOUCHER)
- **Localisation**: `backend/src/main/java/com/logiway/controllers/ChatbotController.java`
- **Service**: `ChatbotMCPService.java`
- **Port**: 8080 (via Spring Boot)
- **LLM**: Ollama qwen3:4b (http://localhost:11434)
- **Fonctionnement**: 
  - Pipeline MCP (Model Context Protocol)
  - Détection d'entités + exécution d'outils Java
  - Génération SQL dynamique via Ollama
  - Réponse enrichie avec données système

### Base de Données MySQL (XAMPP:3306)
**Tables principales identifiées**:
```sql
-- Utilisateurs & Entreprises
- utilisateurs (id, prenom, nom, email, role, est_actif, entreprise_id)
- chauffeurs (hérite de utilisateurs + statut_conducteur, secteur_id, vehicule_actuel_id)
- managers (hérite de utilisateurs)
- super_administrateurs (hérite de utilisateurs)
- entreprises (id, nom, adresse, secteur_activite, nombre_employes)

-- Flotte & Trajets
- vehicules (id, matricule, marque, modele, annee, kilometrage, statut, date_achat, entreprise_id)
- trajets (id, chauffeur_id, vehicule_id, point_depart, destination, date_depart, date_arrivee, statut, distance_km)
- secteurs (id, nom, description)

-- Gestion RH
- conges (id, chauffeur_id, date_debut, date_fin, type, motif, statut, periode, manager_id)
- pauses_reglementaires (id, trajet_id, heure_debut, heure_fin, latitude, longitude, conformite)
- pause_ai_predictions (id, trajet_id, latitude_predite, longitude_predite, heure_predite_debut, score_confiance)

-- Réclamations & Notifications
- reclamations (id, utilisateur_id, sujet, description, priorite, statut, date_creation)
- notifications (id, utilisateur_id, titre, message, type, est_lu, date_creation)
- messenger_messages (id, sender_id, receiver_id, message, date_envoi, est_lu)
```

**Connexion DB** (depuis application.yml):
```yaml
spring:
  datasource:
    url: jdbc:mysql://localhost:3306/logiway_db
    username: root
    password: (vide)
```

---

## 🏗️ Architecture du Nouveau Service RAG

### Structure des Dossiers
```
essais/
├── rag-service/                    # Nouveau dossier (NE TOUCHE PAS aux autres)
│   ├── app/
│   │   ├── __init__.py
│   │   ├── main.py                 # API FastAPI (port 5003)
│   │   ├── config.py               # Configuration DB, Ollama, etc.
│   │   ├── database.py             # Connexion MySQL
│   │   ├── embeddings.py           # Génération des embeddings
│   │   ├── retriever.py            # Retrieval hybride (vector + SQL)
│   │   ├── rag_chain.py            # Chaîne LangChain RAG
│   │   └── models.py               # Modèles Pydantic
│   ├── data/
│   │   ├── vectorstore/            # Chroma/FAISS
│   │   └── documents/              # Cache JSON des données DB
│   ├── scripts/
│   │   ├── ingest_data.py          # Extraction MySQL → Documents
│   │   ├── create_vectorstore.py   # Documents → Embeddings → VectorStore
│   │   └── test_ollama.py          # Test connexion Ollama
│   ├── requirements.txt
│   ├── .env                        # Config locale
│   ├── start.bat                   # Démarrage Windows
│   ├── README.md
│   └── setup.bat                   # Installation automatique
```

---

## 🔧 Stack Technique Détaillée

### 1. API REST - FastAPI
```python
# main.py
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
import uvicorn

app = FastAPI(title="Logiway RAG Chatbot", version="1.0.0")

class QuestionRequest(BaseModel):
    question: str
    user_id: int = None
    entreprise_id: int = None

class QuestionResponse(BaseModel):
    reponse: str
    sources: list[str] = []
    temps_reponse_ms: int

@app.post("/api/rag/question", response_model=QuestionResponse)
async def poser_question(request: QuestionRequest):
    # Logique RAG ici
    pass

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=5003)
```

### 2. Connexion MySQL
```python
# database.py
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker
import os

DATABASE_URL = "mysql+pymysql://root:@localhost:3306/logiway_db"

engine = create_engine(DATABASE_URL, pool_pre_ping=True)
SessionLocal = sessionmaker(bind=engine)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def extract_table_data(table_name: str, limit: int = 1000) -> list[dict]:
    """Extrait les données d'une table MySQL"""
    with engine.connect() as conn:
        result = conn.execute(text(f"SELECT * FROM {table_name} LIMIT {limit}"))
        return [dict(row._mapping) for row in result]
```

### 3. Modèle LLM - Ollama
**Recommandation**: `qwen2.5:3b` (plus rapide que qwen3:4b)

Alternatives légères:
- `phi3.5` (ultra-rapide, CPU-friendly)
- `llama3.2:3b`
- `gemma2:2b` (encore plus léger)

```python
# config.py
from langchain_ollama import OllamaLLM

OLLAMA_BASE_URL = "http://localhost:11434"
OLLAMA_MODEL = "qwen2.5:3b"  # ou phi3.5

def get_llm():
    return OllamaLLM(
        model=OLLAMA_MODEL,
        base_url=OLLAMA_BASE_URL,
        temperature=0.2,  # Réponses déterministes
        num_predict=200   # Limite longueur réponse (rapidité)
    )
```

### 4. Embeddings - Modèle Local
```python
# embeddings.py
from langchain_community.embeddings import HuggingFaceEmbeddings

def get_embeddings():
    """Modèle léger pour embeddings"""
    return HuggingFaceEmbeddings(
        model_name="sentence-transformers/all-MiniLM-L6-v2",  # 80MB, rapide
        model_kwargs={'device': 'cpu'},
        encode_kwargs={'normalize_embeddings': True}
    )
```

Alternative avec Ollama (plus cohérent):
```python
from langchain_community.embeddings import OllamaEmbeddings

def get_embeddings():
    return OllamaEmbeddings(
        model="nomic-embed-text",  # Pull: ollama pull nomic-embed-text
        base_url="http://localhost:11434"
    )
```

### 5. Vector Store - Chroma (recommandé) ou FAISS
```python
# retriever.py
from langchain_community.vectorstores import Chroma
from langchain.text_splitter import RecursiveCharacterTextSplitter

def create_vectorstore(documents: list, embeddings):
    """Crée un vector store Chroma persistant"""
    vectorstore = Chroma.from_documents(
        documents=documents,
        embedding=embeddings,
        persist_directory="./data/vectorstore",
        collection_name="logiway_docs"
    )
    return vectorstore

def get_retriever(vectorstore, k=3):
    """Retriever configuré pour rapidité"""
    return vectorstore.as_retriever(
        search_type="similarity",
        search_kwargs={"k": k}  # Top 3 documents seulement
    )
```

### 6. Chaîne RAG - LangChain
```python
# rag_chain.py
from langchain.chains import RetrievalQA
from langchain.prompts import PromptTemplate

PROMPT_TEMPLATE = """Tu es LogiWay Assistant, un expert en gestion de flotte automobile.

Contexte fourni:
{context}

Question de l'utilisateur: {question}

Instructions:
- Réponds UNIQUEMENT avec les informations du contexte fourni
- Sois concis (max 5 lignes)
- Si le contexte ne contient pas l'info, dis "Je n'ai pas cette information dans ma base de connaissances actuelles"
- Réponds en français naturel

Réponse:"""

def create_rag_chain(retriever, llm):
    """Crée la chaîne RAG optimisée"""
    prompt = PromptTemplate(
        template=PROMPT_TEMPLATE,
        input_variables=["context", "question"]
    )
    
    return RetrievalQA.from_chain_type(
        llm=llm,
        chain_type="stuff",  # Simple, rapide
        retriever=retriever,
        return_source_documents=True,
        chain_type_kwargs={"prompt": prompt}
    )
```

---

## 🚀 Pipeline d'Ingestion des Données

### Script d'Extraction MySQL → Documents
```python
# scripts/ingest_data.py
from app.database import extract_table_data
from langchain.docstore.document import Document
import json

def ingest_all_data():
    """Extrait toutes les tables pertinentes"""
    
    tables_config = {
        "vehicules": "Véhicules de la flotte",
        "chauffeurs": "Chauffeurs et conducteurs",
        "trajets": "Trajets et livraisons",
        "conges": "Congés et absences",
        "reclamations": "Réclamations clients",
        "utilisateurs": "Utilisateurs du système",
        "entreprises": "Entreprises clientes",
        "secteurs": "Secteurs géographiques",
        "pauses_reglementaires": "Pauses réglementaires",
        "notifications": "Notifications système"
    }
    
    documents = []
    
    for table_name, description in tables_config.items():
        print(f"Extraction de {table_name}...")
        rows = extract_table_data(table_name, limit=5000)
        
        for row in rows:
            # Conversion en texte structuré
            doc_text = f"{description}: {json.dumps(row, default=str, ensure_ascii=False)}"
            metadata = {
                "source": table_name,
                "id": row.get("id"),
                "type": "database_record"
            }
            documents.append(Document(page_content=doc_text, metadata=metadata))
    
    print(f"Total: {len(documents)} documents créés")
    
    # Sauvegarde cache JSON
    with open("./data/documents/cache.json", "w", encoding="utf-8") as f:
        json.dump([{"content": doc.page_content, "metadata": doc.metadata} for doc in documents], f, ensure_ascii=False, indent=2)
    
    return documents
```

---

## ⚡ Optimisations pour Temps de Réponse Court

### 1. Retrieval Hybride (Recommandé)
```python
# retriever.py (version avancée)
from sqlalchemy import text

class HybridRetriever:
    def __init__(self, vectorstore, db_engine):
        self.vector_retriever = vectorstore.as_retriever(search_kwargs={"k": 3})
        self.db_engine = db_engine
    
    def retrieve(self, question: str) -> list:
        # Détection du type de question
        if self._is_realtime_query(question):
            # Requête SQL directe (plus rapide pour données live)
            return self._sql_retrieval(question)
        else:
            # Vector search (pour questions générales)
            return self.vector_retriever.get_relevant_documents(question)
    
    def _is_realtime_query(self, question: str) -> bool:
        keywords = ["combien", "maintenant", "actuellement", "disponible", "en cours"]
        return any(kw in question.lower() for kw in keywords)
    
    def _sql_retrieval(self, question: str) -> list:
        # Mapping question → table
        if "véhicule" in question.lower():
            query = "SELECT * FROM vehicules WHERE statut = 'DISPONIBLE' LIMIT 10"
        elif "chauffeur" in question.lower():
            query = "SELECT * FROM chauffeurs WHERE statut_conducteur = 'DISPONIBLE' LIMIT 10"
        # ... autres mappings
        
        with self.db_engine.connect() as conn:
            result = conn.execute(text(query))
            return [Document(page_content=str(dict(row._mapping))) for row in result]
```

### 2. Caching Intelligent
```python
from functools import lru_cache
import hashlib

@lru_cache(maxsize=100)
def cached_llm_call(question_hash: str, context_hash: str):
    """Cache les réponses LLM identiques"""
    pass

def get_response(question: str, context: str):
    q_hash = hashlib.md5(question.encode()).hexdigest()
    c_hash = hashlib.md5(context.encode()).hexdigest()
    return cached_llm_call(q_hash, c_hash)
```

### 3. Paramètres Ollama Optimisés
```python
llm = OllamaLLM(
    model="phi3.5",           # Modèle ultra-rapide
    temperature=0.1,          # Déterministe
    num_predict=150,          # Max 150 tokens (réponses courtes)
    top_k=10,                 # Réduit l'espace de recherche
    top_p=0.9,
    num_ctx=2048,             # Contexte réduit (plus rapide)
    repeat_penalty=1.1
)
```

---

## 📦 Fichiers de Configuration

### requirements.txt
```txt
fastapi==0.109.0
uvicorn[standard]==0.27.0
pydantic==2.5.3
pydantic-settings==2.1.0

# Database
sqlalchemy==2.0.25
pymysql==1.1.0
mysqlclient==2.2.1

# LangChain
langchain==0.1.4
langchain-community==0.0.16
langchain-ollama==0.0.1

# Embeddings
sentence-transformers==2.3.1
# OU pour Ollama embeddings:
# ollama==0.1.6

# Vector Store
chromadb==0.4.22
# OU pour FAISS:
# faiss-cpu==1.7.4

# Utilités
python-dotenv==1.0.0
requests==2.31.0
```

### .env
```env
# Database
DB_HOST=localhost
DB_PORT=3306
DB_NAME=logiway_db
DB_USER=root
DB_PASSWORD=

# Ollama
OLLAMA_BASE_URL=http://localhost:11434
OLLAMA_MODEL=qwen2.5:3b

# Embedding Model
EMBEDDING_MODEL=sentence-transformers/all-MiniLM-L6-v2
# OU: EMBEDDING_MODEL=nomic-embed-text (Ollama)

# API
API_PORT=5003
API_HOST=0.0.0.0

# RAG Config
VECTOR_STORE_TYPE=chroma
TOP_K_RESULTS=3
MAX_RESPONSE_TOKENS=200
```

### start.bat
```batch
@echo off
echo ========================================
echo   Démarrage RAG Chatbot Service
echo   Port: 5003
echo ========================================

cd /d "%~dp0"

:: Activation environnement virtuel
if exist "venv" (
    call venv\Scripts\activate
) else (
    echo ERREUR: Environnement virtuel non trouvé
    echo Exécutez setup.bat d'abord
    pause
    exit /b 1
)

:: Vérification Ollama
echo Vérification Ollama...
python scripts\test_ollama.py
if errorlevel 1 (
    echo ERREUR: Ollama non accessible
    echo Démarrez Ollama: ollama serve
    pause
    exit /b 1
)

:: Démarrage service
echo Démarrage API FastAPI sur port 5003...
python -m uvicorn app.main:app --host 0.0.0.0 --port 5003 --reload

pause
```

### setup.bat
```batch
@echo off
echo ========================================
echo   Installation RAG Chatbot Service
echo ========================================

cd /d "%~dp0"

:: Création environnement virtuel
if not exist "venv" (
    echo Création environnement virtuel Python...
    python -m venv venv
)

:: Activation
call venv\Scripts\activate

:: Installation dépendances
echo Installation des dépendances...
pip install --upgrade pip
pip install -r requirements.txt

:: Création dossiers
echo Création structure...
if not exist "data\vectorstore" mkdir data\vectorstore
if not exist "data\documents" mkdir data\documents

:: Test Ollama
echo Test connexion Ollama...
python scripts\test_ollama.py

:: Ingestion données
echo Extraction données MySQL...
python scripts\ingest_data.py

:: Création vector store
echo Création vector store...
python scripts\create_vectorstore.py

echo.
echo ========================================
echo   Installation terminée !
echo   Démarrage: start.bat
echo ========================================
pause
```

---

## 🧪 Tests & Validation

### Test de Base
```bash
# 1. Installation
cd rag-service
setup.bat

# 2. Démarrage
start.bat

# 3. Test API
curl -X POST http://localhost:5003/api/rag/question \
  -H "Content-Type: application/json" \
  -d "{\"question\": \"Combien de véhicules sont disponibles?\"}"
```

### Questions de Test
```json
[
  {"question": "Combien de véhicules sont en maintenance?"},
  {"question": "Liste les chauffeurs disponibles actuellement"},
  {"question": "Quels sont les trajets en cours aujourd'hui?"},
  {"question": "Récapitulatif des réclamations ouvertes"},
  {"question": "Taux d'absence des chauffeurs ce mois-ci"}
]
```

---

## 📊 Métriques de Performance Attendues

| Métrique | Objectif |
|----------|----------|
| Temps réponse total | < 3 secondes |
| Retrieval (vector) | < 500ms |
| Génération LLM | < 2 secondes |
| Ingestion complète DB | < 2 minutes |
| Taille vector store | ~50-100 MB |

---

## 🔗 Intégration avec Frontend Angular

### Service TypeScript
```typescript
// src/app/services/rag-chatbot.service.ts
@Injectable({ providedIn: 'root' })
export class RagChatbotService {
  private apiUrl = 'http://localhost:5003/api/rag';

  constructor(private http: HttpClient) {}

  poserQuestion(question: string): Observable<QuestionResponse> {
    return this.http.post<QuestionResponse>(`${this.apiUrl}/question`, {
      question,
      user_id: this.getUserId(),
      entreprise_id: this.getEntrepriseId()
    });
  }
}
```

---

## ⚠️ Points d'Attention

### ✅ À FAIRE
1. Créer UNIQUEMENT le dossier `rag-service/`
2. Ne pas modifier le backend Spring Boot
3. Ne pas modifier le frontend Angular (sauf ajout composant chat)
4. Ne pas toucher aux services sur ports 5000 et 5001
5. Installer Ollama si pas déjà fait: `ollama pull qwen2.5:3b`

### ❌ À NE PAS FAIRE
- Modifier `ChatbotController.java` ou `ChatbotMCPService.java`
- Toucher au port 8080 (Spring Boot)
- Modifier la base de données (lecture seule)
- Installer des dépendances système globales

---

## 📅 Plan d'Exécution (Étapes)

1. **Phase 1: Setup Environnement** (15 min)
   - Créer dossier `rag-service/`
   - Installer Python virtualenv
   - Installer dépendances `requirements.txt`

2. **Phase 2: Connexion DB** (10 min)
   - Configurer SQLAlchemy
   - Tester extraction tables
   - Script `ingest_data.py`

3. **Phase 3: Vector Store** (20 min)
   - Configurer embeddings (HuggingFace ou Ollama)
   - Créer vector store Chroma
   - Tester retrieval

4. **Phase 4: RAG Chain** (30 min)
   - Configurer LangChain
   - Créer prompt template
   - Tester chaîne complète

5. **Phase 5: API FastAPI** (20 min)
   - Créer endpoint `/api/rag/question`
   - Ajouter validation Pydantic
   - Tester avec curl

6. **Phase 6: Optimisations** (30 min)
   - Implémenter hybrid retrieval
   - Ajouter caching
   - Tuning paramètres Ollama

7. **Phase 7: Tests & Documentation** (20 min)
   - Tests end-to-end
   - Documentation README
   - Scripts batch

**Temps total estimé**: ~2h30

---

## 🎯 Livrables

- ✅ Dossier `rag-service/` complet et fonctionnel
- ✅ API REST sur port 5003
- ✅ Vector store persistant
- ✅ Scripts d'installation automatisés
- ✅ Documentation README
- ✅ Tests de validation
- ✅ Temps de réponse < 3 secondes

---

**Statut**: 📋 Architecture définie - Prêt pour implémentation

**Prochaine étape**: Confirmer l'approche et démarrer Phase 1 (Setup Environnement)
