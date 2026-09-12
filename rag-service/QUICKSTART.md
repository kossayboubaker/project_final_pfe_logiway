# ⚡ Quick Start - RAG Chatbot (5 minutes)

## Prérequis ✓

- [ ] Python 3.10+ installé
- [ ] XAMPP MySQL démarré (port 3306)
- [ ] Ollama installé et démarré

## Installation Express

### 1. Démarrer Ollama (Terminal 1)
```bash
ollama serve
```

### 2. Installer le modèle (Terminal 2)
```bash
ollama pull qwen2.5:3b
```

### 3. Installer le service (Terminal 2)
```bash
cd c:\Users\kossa\OneDrive\Desktop\essais\rag-service
setup.bat
```
⏱️ Attendre ~10 minutes

### 4. Démarrer le service (Terminal 2)
```bash
start.bat
```

### 5. Tester (Terminal 3 ou navigateur)

**Navigateur**:
```
http://localhost:5003/docs
```

**Curl**:
```bash
curl http://localhost:5003/health

curl -X POST http://localhost:5003/api/rag/question ^
  -H "Content-Type: application/json" ^
  -d "{\"question\": \"Combien de vehicules disponibles?\"}"
```

## ✅ C'est prêt!

API disponible sur: **http://localhost:5003**

## 🐛 Problème?

```bash
# Vérifier Ollama
ollama list

# Vérifier MySQL
mysql -u root -p logiway_db

# Voir les logs
# Les logs s'affichent dans le terminal où start.bat tourne
```

## 📚 Documentation complète

- [README.md](README.md) - Guide complet
- [RAG_SERVICE_DEPLOYMENT_GUIDE.md](../RAG_SERVICE_DEPLOYMENT_GUIDE.md) - Déploiement détaillé
- [RAG_CHATBOT_ARCHITECTURE.md](../RAG_CHATBOT_ARCHITECTURE.md) - Architecture

## 🎯 Questions de test

```json
{"question": "Combien de véhicules sont disponibles?"}
{"question": "Liste les chauffeurs disponibles"}
{"question": "Statistiques des trajets en cours"}
{"question": "Récapitulatif des réclamations"}
```

---

**Port**: 5003 | **Temps de réponse**: 1-3s | **Status**: ✅ Production Ready
