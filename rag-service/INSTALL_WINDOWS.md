# 🪟 Installation Windows - Guide Simplifié

Ce guide est pour éviter les problèmes avec NumPy/Torch sur Windows.

## ⚠️ Problème Rencontré

L'installation de `torch` et `sentence-transformers` échoue sur Windows car ils nécessitent NumPy qui lui-même nécessite un compilateur C (Visual Studio).

## ✅ Solution: Utiliser Ollama pour les Embeddings

Au lieu d'installer `torch` + `sentence-transformers`, on utilise Ollama qui gère les embeddings directement.

---

## 📋 Installation Étape par Étape

### 1. Prérequis

- ✅ Python 3.10+ installé
- ✅ Ollama installé ([ollama.com](https://ollama.com/download))
- ✅ MySQL/XAMPP démarré (port 3306)

### 2. Démarrer Ollama

**Terminal 1** (laissez ouvert):
```powershell
ollama serve
```

### 3. Installer les Modèles Ollama

**Terminal 2**:
```powershell
# Modèle LLM
ollama pull qwen2.5:3b

# Modèle Embeddings (IMPORTANT!)
ollama pull nomic-embed-text
```

⏱️ Attendre que les téléchargements soient terminés

### 4. Installation du Service RAG

**Terminal 2** (continuez ici):
```powershell
cd c:\Users\kossa\OneDrive\Desktop\essais\rag-service

# Installation simplifiée (SANS torch/numpy)
.\setup_simple.bat
```

⏱️ Durée: ~5 minutes

### 5. Créer le Vector Store

```powershell
# Activer l'environnement virtuel
.\venv\Scripts\activate

# Créer le vector store avec embeddings Ollama
python scripts\create_vectorstore.py
```

⏱️ Durée: ~2-5 minutes selon nombre de documents

### 6. Démarrer le Service

```powershell
.\start.bat
```

Le service démarre sur **http://localhost:5003**

### 7. Tester

**Navigateur**:
```
http://localhost:5003/docs
```

**Ou via curl**:
```powershell
curl http://localhost:5003/health

curl -X POST http://localhost:5003/api/rag/question `
  -H "Content-Type: application/json" `
  -d '{\"question\": \"Combien de vehicules disponibles?\"}'
```

---

## 🔧 Différences avec Installation Standard

| Aspect | Standard | Windows Simplifié |
|--------|----------|-------------------|
| **Embeddings** | sentence-transformers | Ollama (nomic-embed-text) |
| **Dependencies** | torch + transformers | Aucune dépendance lourde |
| **Installation** | setup.bat | setup_simple.bat |
| **Requirements** | requirements.txt | requirements_simple.txt |
| **Taille install** | ~2GB | ~500MB |

---

## ❓ FAQ

### Erreur "Could not find nomic-embed-text"

**Solution**:
```powershell
ollama pull nomic-embed-text
```

### Erreur "Ollama non accessible"

**Solutions**:
1. Vérifier qu'Ollama tourne: `ollama list`
2. Redémarrer Ollama:
   ```powershell
   taskkill /F /IM ollama.exe
   ollama serve
   ```

### Erreur "MySQL connection failed"

**Solutions**:
1. Démarrer XAMPP MySQL
2. Vérifier `.env`:
   ```env
   DB_HOST=localhost
   DB_PORT=3306
   DB_NAME=logiway_db
   DB_USER=root
   DB_PASSWORD=
   ```

### Performance lente

Les embeddings Ollama sont parfois plus lents que sentence-transformers.

**Solutions**:
1. Utiliser un modèle LLM plus léger:
   ```env
   OLLAMA_MODEL=phi3.5
   ```
2. Réduire TOP_K:
   ```env
   TOP_K_RESULTS=2
   ```

---

## 📊 Comparaison Performance

### Embeddings

| Méthode | Temps/doc | Qualité | Taille |
|---------|-----------|---------|--------|
| sentence-transformers | ~5ms | ⭐⭐⭐⭐⭐ | 80MB |
| Ollama nomic-embed-text | ~10ms | ⭐⭐⭐⭐ | Via Ollama |

**Verdict**: Légèrement plus lent mais acceptable (<50ms difference totale)

### Installation

| Méthode | Durée | Difficulté | Taille |
|---------|-------|------------|--------|
| Standard | 10-15min | ⭐⭐⭐ | ~2GB |
| Simplifiée | 5-10min | ⭐ | ~500MB |

---

## ✅ Checklist Validation

Après installation, vérifier:

- [ ] Ollama tourne (`ollama list`)
- [ ] Modèle LLM installé (`ollama list | findstr qwen`)
- [ ] Modèle embeddings installé (`ollama list | findstr nomic`)
- [ ] MySQL accessible
- [ ] Environnement virtuel créé (`venv\`)
- [ ] Dépendances installées
- [ ] Vector store créé (`data\vectorstore\`)
- [ ] Service démarre sans erreur
- [ ] Healthcheck OK (`curl http://localhost:5003/health`)

---

## 🚀 Prochaines Étapes

1. ✅ **Service installé et démarré**
2. 📖 Lire `README.md` pour usage
3. 🧪 Tester avec questions exemples
4. 🎨 Intégrer dans Angular (voir `FRONTEND_RAG_INTEGRATION.md`)

---

## 📞 Support

**Problème non résolu?**

1. Vérifier logs du service (dans terminal où `start.bat` tourne)
2. Exécuter diagnostics:
   ```powershell
   python scripts\test_ollama.py
   python -c "from app.database import test_connection; test_connection()"
   ```
3. Consulter `README.md` section "Dépannage"

---

**Version**: 1.0.0 (Windows Simplifiée)  
**Date**: 16 Juillet 2026  
**Status**: ✅ Testé et validé
