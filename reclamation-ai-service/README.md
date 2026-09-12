# Service IA Local - Validation Réclamations

Service Python Flask qui valide les réclamations via des modèles NLP ou des règles simples (version de fallback).

## ⚡ **DÉMARRAGE RAPIDE** (Version Simplifiée)

**Si vous avez des problèmes avec les modèles PyTorch/Transformers :**

```bash
# Version simplifiée (recommandée pour test rapide)
cd reclamation-ai-service
.\start_simple.bat
```

Cette version utilise uniquement Flask + règles par mots-clés, sans dépendances lourdes.

---

## 🚀 Installation Version Complète

```bash
# 1. Créer un environnement virtuel
python -m venv venv

# 2. Activer l'environnement
# Windows:
venv\Scripts\activate
# Linux/Mac:
source venv/bin/activate

# 3. Installer les dépendances complètes
pip install -r requirements.txt
```

**⚠️ Attention** : Les modèles PyTorch peuvent poser problème sur certaines versions de Windows. En cas d'échec, utilisez la version simplifiée.

## ▶️ Démarrage

### Version Simplifiée (Recommandée)
```bash
.\start_simple.bat
```

### Version Complète avec Modèles NLP
```bash
# Activer l'environnement (si pas déjà fait)
venv\Scripts\activate

# Lancer le service complet
python app.py
```

Le service démarre sur `http://localhost:5001`

**⚠️ Premier démarrage version complète** : Les modèles seront téléchargés automatiquement (~500 MB). Cela peut prendre quelques minutes. Ensuite, le service fonctionnera hors-ligne.

## 📡 API Endpoints

### GET /health
Vérifie l'état du service

**Réponse:**
```json
{
  "status": "healthy",
  "service": "reclamation-ai-validation",
  "models_loaded": true
}
```

### POST /validate
Valide un texte (toxicité + pertinence sémantique)

**Requête:**
```json
{
  "text": "Le camion est en panne",
  "field": "sujet"
}
```

**Réponse (texte valide):**
```json
{
  "valide": true,
  "typeErreur": null,
  "message": null,
  "scores": {
    "toxicite": 0.05,
    "semantique": 0.82
  }
}
```

**Réponse (texte toxique):**
```json
{
  "valide": false,
  "typeErreur": "toxicite",
  "message": "Votre sujet contient un langage inapproprié...",
  "scores": {
    "toxicite": 0.95,
    "semantique": null
  }
}
```

**Réponse (hors sujet):**
```json
{
  "valide": false,
  "typeErreur": "hors_sujet",
  "message": "Votre sujet ne correspond pas au domaine de la gestion de flotte...",
  "scores": {
    "toxicite": 0.02,
    "semantique": 0.12
  }
}
```

## 🔧 Configuration

Modèles utilisés :
- **Toxicité**: `unitary/toxic-bert`
- **Sémantique**: `sentence-transformers/all-MiniLM-L6-v2`

Seuils (modifiables dans `app.py`) :
- `TOXICITY_THRESHOLD = 0.55`
- `SEMANTIC_THRESHOLD = 0.25`

## 🧪 Tests

### Test Automatique Complet
```bash
.\test_integration.bat
```

### Tests Manuels
```bash
# Test de santé
curl http://localhost:5001/health

# Test validation texte valide (gestion de flotte)
curl -X POST http://localhost:5001/validate \
  -H "Content-Type: application/json" \
  -d "{\"text\":\"Le camion ne démarre plus\",\"field\":\"sujet\"}"

# Test validation texte toxique
curl -X POST http://localhost:5001/validate \
  -H "Content-Type: application/json" \
  -d "{\"text\":\"fuck you\",\"field\":\"sujet\"}"

# Test validation hors sujet
curl -X POST http://localhost:5001/validate \
  -H "Content-Type: application/json" \
  -d "{\"text\":\"recette de cuisine\",\"field\":\"description\"}"
```

### Résultats Attendus
- ✅ **Texte flotte valide** : `{"valide": true}`
- ❌ **Texte toxique** : `{"valide": false, "typeErreur": "toxicite"}`  
- ❌ **Texte hors sujet** : `{"valide": false, "typeErreur": "hors_sujet"}`

## 📊 Logs

Le service log toutes les analyses :
```
[TOXICITY] Analyse: "Le camion est en panne"
[TOXICITY] Score: 0.05 | Seuil: 0.55 | Décision: PASS
[SEMANTIC] Analyse: "Le camion est en panne"
[SEMANTIC] Score: 0.82 | Seuil: 0.25 | Décision: PASS
[VALIDATE] ✅ Validation réussie pour le champ 'sujet'
```

## 🔄 Intégration avec le Backend Java

Le backend Spring Boot doit être configuré pour appeler ce service au lieu de l'API HF.

Dans `application.yml`:
```yaml
reclamation:
  ai:
    local-service-url: http://localhost:5001
```
