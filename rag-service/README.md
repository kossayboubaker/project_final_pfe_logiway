# 🤖 Service RAG Chatbot - Logiway

Service autonome de Question-Réponse intelligent basé sur RAG (Retrieval-Augmented Generation) pour la plateforme Logiway.

## 📋 Description

Service Python indépendant qui répond aux questions sur le système Logiway en interrogeant directement la base de données MySQL via un pipeline RAG optimisé.

**Port**: 5003 (indépendant du backend Spring Boot)

## 🏗️ Architecture

```
rag-service/
├── app/
│   ├── main.py           # API FastAPI
│   ├── config.py         # Configuration
│   ├── database.py       # Connexion MySQL
│   ├── embeddings.py     # Modèles embeddings
│   ├── llm.py            # Ollama LLM
│   ├── retriever.py      # Retrieval hybride
│   ├── rag_chain.py      # Chaîne RAG LangChain
│   └── models.py         # Modèles Pydantic
├── scripts/
│   ├── ingest_data.py    # Extraction MySQL → Documents
│   ├── create_vectorstore.py  # Documents → Embeddings
│   └── test_ollama.py    # Test Ollama
├── data/
│   ├── vectorstore/      # Vector store Chroma
│   └── documents/        # Cache JSON
├── .env                  # Configuration
├── requirements.txt
├── setup.bat             # Installation automatique
├── start.bat             # Démarrage service
└── test_service.bat      # Tests API
```

## 🔧 Stack Technique

| Composant | Technologie |
|-----------|-------------|
| **API** | FastAPI + Uvicorn |
| **RAG Framework** | LangChain |
| **LLM** | Ollama (qwen2.5:3b) |
| **Embeddings** | sentence-transformers/all-MiniLM-L6-v2 |
| **Vector Store** | Chroma |
| **Database** | MySQL via SQLAlchemy |
| **Validation** | Pydantic |

## 🚀 Installation

### Prérequis

1. **Python 3.10+** installé
2. **XAMPP** avec MySQL démarré (port 3306)
3. **Ollama** installé et démarré
4. Base de données `logiway_db` existante

### Installation Automatique

```bash
cd rag-service
setup.bat
```

Le script `setup.bat` va:
- ✅ Créer l'environnement virtuel Python
- ✅ Installer toutes les dépendances
- ✅ Tester la connexion Ollama
- ✅ Extraire les données MySQL
- ✅ Créer le vector store avec embeddings

**Durée**: ~10-15 minutes (selon vitesse réseau)

### Installation Manuelle (si setup.bat échoue)

```bash
# 1. Créer environnement virtuel
python -m venv venv
venv\Scripts\activate

# 2. Installer dépendances
pip install -r requirements.txt

# 3. Vérifier Ollama
python scripts\test_ollama.py

# 4. Installer modèle Ollama (si nécessaire)
ollama pull qwen2.5:3b

# 5. Extraire données MySQL
python scripts\ingest_data.py

# 6. Créer vector store
python scripts\create_vectorstore.py
```

## 🎮 Utilisation

### Démarrage du Service

```bash
start.bat
```

Le service démarre sur **http://localhost:5003**

### Endpoints Disponibles

#### 1. Healthcheck
```bash
GET http://localhost:5003/health
```

Réponse:
```json
{
  "status": "healthy",
  "database_connected": true,
  "ollama_connected": true,
  "vectorstore_ready": true,
  "timestamp": "2026-07-16T10:30:00"
}
```

#### 2. Poser une Question
```bash
POST http://localhost:5003/api/rag/question
Content-Type: application/json

{
  "question": "Combien de véhicules sont disponibles?",
  "user_id": 1,
  "entreprise_id": 1
}
```

Réponse:
```json
{
  "reponse": "Il y a actuellement 15 véhicules disponibles dans la flotte...",
  "sources": [
    {
      "content": "Véhicule ABC123: Marque: Renault, Statut: DISPONIBLE...",
      "table": "vehicules",
      "score": 0.89
    }
  ],
  "temps_reponse_ms": 1250,
  "model_used": "qwen2.5:3b",
  "retrieval_method": "hybrid"
}
```

#### 3. Statistiques
```bash
GET http://localhost:5003/api/rag/stats
```

### Documentation Interactive

Accédez à la documentation Swagger:
```
http://localhost:5003/docs
```

## 🧪 Tests

### Test Complet du Service
```bash
test_service.bat
```

### Tests Individuels

```bash
# Test Ollama
python scripts\test_ollama.py

# Test connexion DB
python -c "from app.database import test_connection; test_connection()"

# Test embeddings
python -c "from app.embeddings import test_embeddings; test_embeddings()"
```

### Exemples de Questions

```json
{
  "question": "Combien de véhicules sont en maintenance?"
}

{
  "question": "Liste les chauffeurs disponibles actuellement"
}

{
  "question": "Quels sont les trajets en cours aujourd'hui?"
}

{
  "question": "Récapitulatif des réclamations ouvertes"
}

{
  "question": "Taux d'absence des chauffeurs ce mois"
}

{
  "question": "Statistiques globales de la flotte"
}
```

## ⚙️ Configuration

Fichier `.env`:

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

# RAG
TOP_K_RESULTS=3
MAX_RESPONSE_TOKENS=200
USE_HYBRID_RETRIEVAL=true

# API
API_PORT=5003
```

### Modèles LLM Alternatifs

Pour changer de modèle, modifiez `.env`:

```env
# Ultra-rapide (recommandé)
OLLAMA_MODEL=phi3.5

# Alternative léger
OLLAMA_MODEL=llama3.2:3b

# Plus puissant (plus lent)
OLLAMA_MODEL=qwen2.5:7b
```

Puis:
```bash
ollama pull <nouveau_modele>
```

## 🔍 Retrieval Hybride

Le service utilise un retrieval hybride intelligent:

### Vector Similarity Search
- Questions générales
- Recherches sémantiques
- Exemples: "Qu'est-ce qu'un trajet?", "Explique les congés"

### SQL Direct
- Questions temps réel
- Comptages et statistiques
- Exemples: "Combien de véhicules disponibles?", "Liste des chauffeurs"

Le système détecte automatiquement le meilleur mode selon la question.

## 📊 Performance

| Métrique | Valeur Typique |
|----------|---------------|
| Temps de réponse total | 1-3 secondes |
| Retrieval (vector) | < 500ms |
| Génération LLM | 1-2 secondes |
| Taille vector store | ~50-100 MB |
| Documents indexés | ~5000-15000 |

## 🔧 Maintenance

### Mise à Jour des Données

```bash
# Ré-extraire les données MySQL
python scripts\ingest_data.py

# Recréer le vector store
python scripts\create_vectorstore.py
```

### Nettoyage

```bash
# Supprimer vector store
rmdir /s /q data\vectorstore

# Recréer
python scripts\create_vectorstore.py
```

## 🐛 Dépannage

### Erreur: "Ollama non accessible"

**Solution**:
```bash
# Démarrer Ollama
ollama serve

# Dans un autre terminal, installer le modèle
ollama pull qwen2.5:3b
```

### Erreur: "Connexion MySQL échouée"

**Solutions**:
1. Vérifier que XAMPP MySQL est démarré
2. Vérifier `.env`: DB_NAME, DB_USER, DB_PASSWORD
3. Tester manuellement:
   ```bash
   mysql -u root -p
   USE logiway_db;
   ```

### Erreur: "Vector store non trouvé"

**Solution**:
```bash
python scripts\ingest_data.py
python scripts\create_vectorstore.py
```

### Erreur: "ModuleNotFoundError"

**Solution**:
```bash
venv\Scripts\activate
pip install -r requirements.txt
```

### Service très lent

**Solutions**:
1. Utiliser un modèle plus léger:
   ```env
   OLLAMA_MODEL=phi3.5
   ```

2. Réduire TOP_K:
   ```env
   TOP_K_RESULTS=2
   MAX_RESPONSE_TOKENS=150
   ```

3. Vérifier CPU/RAM disponible

## 🔒 Sécurité

- ✅ Requêtes SQL en lecture seule (SELECT uniquement)
- ✅ Validation Pydantic sur tous les inputs
- ✅ Pas d'exécution de code arbitraire
- ✅ CORS configuré pour localhost uniquement

## 📝 Logs

Les logs sont affichés en console lors du démarrage:

```
2026-07-16 10:30:00 - INFO - ✓ Connexion MySQL réussie
2026-07-16 10:30:01 - INFO - ✓ Ollama connecté
2026-07-16 10:30:02 - INFO - ✓ Vector store chargé: 5423 documents
2026-07-16 10:30:03 - INFO - ✓ Service RAG prêt!
```

## 🤝 Intégration Frontend Angular

Créer un service TypeScript:

```typescript
// src/app/services/rag-chatbot.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class RagChatbotService {
  private apiUrl = 'http://localhost:5003/api/rag';

  constructor(private http: HttpClient) {}

  poserQuestion(question: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/question`, { question });
  }

  getHealth(): Observable<any> {
    return this.http.get('http://localhost:5003/health');
  }
}
```

## 📚 Documentation Complémentaire

- [Architecture RAG](../RAG_CHATBOT_ARCHITECTURE.md)
- [LangChain Docs](https://python.langchain.com/)
- [Ollama Models](https://ollama.com/library)
- [FastAPI Docs](https://fastapi.tiangolo.com/)

## 📄 Licence

Propriétaire - Logiway 2026

---

**Version**: 1.0.0  
**Port**: 5003  
**Status**: ✅ Production Ready
