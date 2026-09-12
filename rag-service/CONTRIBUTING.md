# 🤝 Guide de Contribution - Service RAG Chatbot

Guide pour les développeurs souhaitant contribuer au projet.

---

## 📋 Table des Matières

1. [Prérequis Développeur](#prérequis-développeur)
2. [Setup Environnement](#setup-environnement)
3. [Architecture du Code](#architecture-du-code)
4. [Standards de Code](#standards-de-code)
5. [Tests](#tests)
6. [Pull Requests](#pull-requests)
7. [Roadmap](#roadmap)

---

## 🛠️ Prérequis Développeur

### Outils Requis
- Python 3.10+
- Git
- VSCode (recommandé) ou PyCharm
- MySQL Workbench (recommandé)
- Postman ou Insomnia (pour tests API)

### Extensions VSCode Recommandées
```json
{
  "recommendations": [
    "ms-python.python",
    "ms-python.vscode-pylance",
    "ms-python.black-formatter",
    "charliermarsh.ruff",
    "tamasfe.even-better-toml"
  ]
}
```

---

## 🚀 Setup Environnement

### 1. Cloner et Setup
```bash
cd rag-service

# Créer environnement virtuel
python -m venv venv

# Activer
venv\Scripts\activate  # Windows
source venv/bin/activate  # Linux/Mac

# Installer dépendances
pip install -r requirements.txt

# Installer dépendances dev (à créer)
pip install -r requirements-dev.txt
```

### 2. Configuration Locale
Copier `.env` vers `.env.local` et ajuster:
```env
# .env.local (non committé)
DB_HOST=localhost
DB_NAME=logiway_db_dev  # Base de dev séparée
OLLAMA_MODEL=phi3.5      # Modèle plus rapide pour dev
```

### 3. Initialiser Data
```bash
# Extraire données
python scripts/ingest_data.py

# Créer vector store
python scripts/create_vectorstore.py

# Tester
python scripts/test_ollama.py
```

---

## 🏗️ Architecture du Code

### Structure Modulaire

```
app/
├── main.py           # API FastAPI (endpoints, startup)
├── config.py         # Configuration centralisée
├── database.py       # MySQL connexion + queries
├── embeddings.py     # Modèles embeddings
├── llm.py            # Ollama LLM wrapper
├── retriever.py      # Hybrid retrieval logic
├── rag_chain.py      # LangChain RAG pipeline
└── models.py         # Pydantic models validation
```

### Principes de Design

1. **Séparation des Responsabilités**
   - Chaque module a une responsabilité unique
   - `database.py` = DB uniquement
   - `llm.py` = LLM uniquement
   - etc.

2. **Configuration Centralisée**
   - Toute config dans `config.py`
   - Variables d'env via `.env`
   - Pydantic Settings pour validation

3. **Type Hints Partout**
   ```python
   def extract_table_data(
       table_name: str, 
       limit: int = 5000
   ) -> List[Dict]:
       ...
   ```

4. **Logging Structuré**
   ```python
   logger.info(f"✓ Extracted {len(rows)} rows from {table_name}")
   logger.error(f"✗ Error: {e}")
   ```

---

## 📝 Standards de Code

### Python Style Guide

**Suivre PEP 8** avec quelques ajouts:

```python
# Imports: stdlib → tiers → local
import os
import logging
from typing import List, Dict

from fastapi import FastAPI
from langchain.schema import Document

from app.config import settings
from app.database import extract_table_data


# Docstrings: Google Style
def create_vectorstore(documents: List[Document]) -> Chroma:
    """
    Crée un vector store Chroma avec les documents fournis.
    
    Args:
        documents: Liste de documents LangChain
    
    Returns:
        Instance Chroma configurée
    
    Raises:
        ValueError: Si documents vide
        RuntimeError: Si création échoue
    """
    if not documents:
        raise ValueError("Liste de documents vide")
    
    # Implementation...
    return vectorstore


# Constants: UPPER_CASE
DEFAULT_TOP_K = 3
MAX_RESPONSE_TOKENS = 200

# Classes: PascalCase
class HybridRetriever:
    def __init__(self):
        pass

# Fonctions/Variables: snake_case
def get_llm():
    pass

user_question = "..."
```

### Type Hints

**Toujours utiliser**:
```python
from typing import List, Dict, Optional, Union, Tuple

def process_query(
    question: str,
    user_id: Optional[int] = None
) -> Dict[str, Any]:
    ...
```

### Error Handling

```python
# ✓ BIEN: Spécifique et informatif
try:
    result = execute_sql_query(query)
except SQLAlchemyError as e:
    logger.error(f"SQL error on query {query[:50]}: {e}")
    raise HTTPException(
        status_code=500,
        detail=f"Database error: {str(e)}"
    )

# ✗ MAL: Générique et silencieux
try:
    result = execute_sql_query(query)
except:
    pass
```

### Logging

```python
# ✓ Utiliser les niveaux appropriés
logger.debug("Detailed debug info")
logger.info("✓ Operation successful")
logger.warning("⚠ Non-critical issue")
logger.error("✗ Error occurred")

# ✓ Inclure contexte
logger.info(f"Processing question: {question[:50]}")

# ✗ MAL: print()
print("Something happened")  # N'utilisez jamais print()
```

---

## 🧪 Tests

### Structure des Tests

```
tests/
├── __init__.py
├── conftest.py              # Fixtures pytest
├── test_database.py
├── test_retriever.py
├── test_llm.py
├── test_rag_chain.py
└── test_api.py
```

### Exemple Test Unitaire

```python
# tests/test_database.py
import pytest
from app.database import extract_table_data, test_connection


def test_connection():
    """Test connexion MySQL"""
    assert test_connection() is True


def test_extract_table_data():
    """Test extraction données"""
    rows = extract_table_data("vehicules", limit=10)
    
    assert len(rows) <= 10
    assert all(isinstance(row, dict) for row in rows)
    assert all("id" in row for row in rows)


@pytest.mark.parametrize("table,expected_columns", [
    ("vehicules", ["id", "matricule", "marque"]),
    ("chauffeurs", ["id", "prenom", "nom"]),
])
def test_table_schema(table, expected_columns):
    """Test schéma tables"""
    rows = extract_table_data(table, limit=1)
    if rows:
        for col in expected_columns:
            assert col in rows[0]
```

### Exemple Test API

```python
# tests/test_api.py
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)


def test_health_endpoint():
    """Test endpoint health"""
    response = client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert "status" in data
    assert "database_connected" in data


def test_question_endpoint():
    """Test endpoint question"""
    response = client.post(
        "/api/rag/question",
        json={"question": "Combien de véhicules?"}
    )
    assert response.status_code == 200
    data = response.json()
    assert "reponse" in data
    assert "sources" in data
    assert "temps_reponse_ms" in data


def test_question_validation():
    """Test validation input"""
    # Question vide
    response = client.post(
        "/api/rag/question",
        json={"question": ""}
    )
    assert response.status_code == 422
```

### Exécuter Tests

```bash
# Tous les tests
pytest

# Avec coverage
pytest --cov=app --cov-report=html

# Tests spécifiques
pytest tests/test_api.py

# Mode verbose
pytest -v

# Arrêter au premier échec
pytest -x
```

---

## 🔄 Pull Requests

### Workflow Git

```bash
# 1. Créer branche
git checkout -b feature/nouvelle-fonctionnalite

# 2. Développer + commiter
git add .
git commit -m "feat: ajoute support streaming responses"

# 3. Tester
pytest
python scripts/test_ollama.py

# 4. Push
git push origin feature/nouvelle-fonctionnalite

# 5. Créer PR sur GitHub/GitLab
```

### Convention Commits

Suivre [Conventional Commits](https://www.conventionalcommits.org/):

```
<type>(<scope>): <description>

[optional body]

[optional footer]
```

**Types**:
- `feat`: Nouvelle fonctionnalité
- `fix`: Correction de bug
- `docs`: Documentation uniquement
- `style`: Formatage (sans changement de code)
- `refactor`: Refactoring (ni feat ni fix)
- `perf`: Amélioration performance
- `test`: Ajout/modification tests
- `chore`: Maintenance (deps, build, etc.)

**Exemples**:
```bash
feat(retriever): ajoute support filtrage par entreprise
fix(database): corrige timeout connexion MySQL
docs(readme): met à jour section installation
perf(llm): réduit latence génération de 30%
test(api): ajoute tests endpoint stats
```

### Checklist PR

Avant de soumettre une PR:

- [ ] Code suit les standards (PEP 8)
- [ ] Type hints ajoutés partout
- [ ] Docstrings ajoutées
- [ ] Tests écrits (coverage >80%)
- [ ] Tests passent (`pytest`)
- [ ] Documentation mise à jour
- [ ] CHANGELOG.md mis à jour
- [ ] Pas de secrets/credentials dans le code
- [ ] `.env.local` pas committé

### Review Process

1. **Auto-review**: Relire son propre code
2. **CI/CD**: Tests automatiques passent
3. **Peer review**: 1+ développeur approuve
4. **Merge**: Squash commits si nécessaire

---

## 🚀 Roadmap

### Priorité Haute

#### 1. Streaming Responses (v1.1.0)
```python
# Objectif: Réponses en temps réel via SSE
from fastapi.responses import StreamingResponse

@app.post("/api/rag/question/stream")
async def question_stream(request: QuestionRequest):
    async def generate():
        # Stream chunks LLM
        for chunk in llm.stream(prompt):
            yield f"data: {chunk}\n\n"
    
    return StreamingResponse(
        generate(),
        media_type="text/event-stream"
    )
```

#### 2. Cache Redis (v1.1.0)
```python
# Objectif: Cache partagé pour performance
import redis
from functools import wraps

redis_client = redis.Redis(host='localhost', port=6379)

def cache_response(ttl=3600):
    def decorator(func):
        @wraps(func)
        def wrapper(question: str):
            key = f"rag:{hash(question)}"
            cached = redis_client.get(key)
            if cached:
                return json.loads(cached)
            
            result = func(question)
            redis_client.setex(key, ttl, json.dumps(result))
            return result
        return wrapper
    return decorator
```

#### 3. Authentification JWT (v1.2.0)
```python
# Objectif: Sécuriser l'API
from fastapi import Depends, HTTPException
from fastapi.security import HTTPBearer

security = HTTPBearer()

def verify_token(credentials = Depends(security)):
    token = credentials.credentials
    # Vérifier avec Keycloak
    if not is_valid_token(token):
        raise HTTPException(401, "Invalid token")
    return decode_token(token)

@app.post("/api/rag/question")
async def question(
    request: QuestionRequest,
    user = Depends(verify_token)
):
    # user contient infos JWT
    ...
```

### Priorité Moyenne

- Logs structurés (JSON)
- Métriques Prometheus
- Rate limiting
- Support GPU pour LLM
- Historique conversations

### Priorité Basse

- Multi-langue
- Export conversations
- RAG avancé (ReAct)
- Fine-tuning modèle
- Multi-modal

---

## 📊 Métriques de Qualité

### Objectifs

| Métrique | Objectif | Actuel |
|----------|----------|--------|
| Test Coverage | >80% | 60% |
| Type Hints | 100% | 95% |
| Docstrings | 100% | 100% |
| Linting (Ruff) | 0 erreurs | 0 |
| Response Time | <3s | 1-3s |

### Outils

```bash
# Linting
ruff check app/

# Formatage
black app/

# Type checking
mypy app/

# Coverage
pytest --cov=app --cov-report=term-missing
```

---

## 🎓 Ressources

### Documentation Externe

- [FastAPI Best Practices](https://fastapi.tiangolo.com/tutorial/)
- [LangChain Docs](https://python.langchain.com/)
- [Pydantic V2](https://docs.pydantic.dev/latest/)
- [Pytest Guide](https://docs.pytest.org/)

### Code Examples

Voir `/examples` (à créer):
- `example_custom_retriever.py`
- `example_custom_prompt.py`
- `example_new_table.py`

---

## 📞 Support Contributeurs

### Questions?

- Lire documentation complète (`README.md`, `RAG_CHATBOT_ARCHITECTURE.md`)
- Vérifier issues existantes
- Créer nouvelle issue avec template

### Besoin d'aide?

- Rejoindre canal #rag-chatbot (Slack/Teams)
- Demander review code
- Consulter mainteneurs

---

## ✅ Checklist Contributeur

### Avant de commencer
- [ ] Lire `CONTRIBUTING.md` (ce fichier)
- [ ] Lire `README.md`
- [ ] Setup environnement dev
- [ ] Exécuter tests existants

### Pendant développement
- [ ] Créer branche feature
- [ ] Écrire code + tests
- [ ] Suivre standards
- [ ] Commiter régulièrement

### Avant PR
- [ ] Tests passent localement
- [ ] Code formaté (black)
- [ ] Linting OK (ruff)
- [ ] Documentation à jour
- [ ] CHANGELOG.md mis à jour

---

**Merci de contribuer au projet! 🎉**

_Dernière mise à jour: 16 Juillet 2026_
