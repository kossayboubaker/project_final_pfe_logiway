# 🚀 Démarrage Rapide Final - Chatbot LogiWay

## ✅ Service RAG Gemini - DÉMARRÉ!

Le service RAG est actuellement en cours d'exécution sur http://localhost:5003

---

## 📋 Prochaines Étapes

### 1. Backend Spring Boot (Terminal PowerShell  2)

```powershell
cd C:\Users\kossa\OneDrive\Desktop\essais\backend
mvn spring-boot:run
```

**✅ Attendez**: `Tomcat started on port(s): 8080`

---

### 2. Frontend Angular (Terminal PowerShell 3)

```powershell
cd C:\Users\kossa\OneDrive\Desktop\essais\frontend
npm start
```

**✅ Attendez**: `Compiled successfully`

---

## 🧪 Test du Chatbot

Une fois les 3 services démarrés:

1. Ouvrez: http://localhost:4200
2. Connectez-vous
3. Cliquez sur l'icône 🤖 en bas à droite
4. Posez une question: `"Combien de chauffeurs ?"`

---

## 📊 Vérification des Services

```powershell
# Service RAG (Port 5003)
curl http://localhost:5003/health

# Backend (Port 8080) - Après démarrage
curl http://localhost:8080/actuator/health

# Frontend (Port 4200) - Après démarrage
curl http://localhost:4200
```

---

## 🎯 Status Actuel

- ✅ **Service RAG Gemini**: http://localhost:5003 (ACTIF)
- ⏳ **Backend Spring Boot**: À démarrer (Port 8080)
- ⏳ **Frontend Angular**: À démarrer (Port 4200)

---

## 💡 Conseils PowerShell

### Pour démarrer un fichier .bat:
```powershell
# Méthode 1: Avec .\
.\nom_fichier.bat

# Méthode 2: Avec cmd /c
cmd /c nom_fichier.bat
```

### Pour le service RAG (utilise START_SIMPLE.bat):
```powershell
cd C:\Users\kossa\OneDrive\Desktop\essais\rag-service
cmd /c START_SIMPLE.bat
```

---

## 📝 Fichiers de Démarrage

| Service | Fichier | Commande PowerShell |
|---------|---------|---------------------|
| RAG Gemini | `START_SIMPLE.bat` | `cmd /c START_SIMPLE.bat` |
| Backend | Maven | `mvn spring-boot:run` |
| Frontend | NPM | `npm start` |

---

## 🔧 Scripts de Test

### Test Automatique
```powershell
cd C:\Users\kossa\OneDrive\Desktop\essais
cmd /c TEST_CHATBOT_INTEGRATION.bat
```

### Afficher Status
```powershell
cmd /c SHOW_CHATBOT_STATUS.bat
```

---

## 💬 Questions Exemples

Une fois tout démarré, testez avec ces questions:

**Simples:**
- Combien de chauffeurs ?
- Combien de véhicules ?
- Donne-moi un résumé

**Détaillées:**
- Quels chauffeurs sont disponibles ?
- Y a-t-il des véhicules en maintenance ?
- Congés en attente de validation ?

**Analytiques:**
- Quel est le taux d'absence des chauffeurs ?
- Statistiques des trajets ce mois

---

## 🆘 En Cas de Problème

### Service RAG ne démarre pas
```powershell
cd C:\Users\kossa\OneDrive\Desktop\essais\rag-service
pip install -r requirements.txt
cmd /c START_SIMPLE.bat
```

### Backend ne compile pas
```powershell
cd backend
mvn clean install
mvn spring-boot:run
```

### Frontend ne démarre pas
```powershell
cd frontend
npm install
npm start
```

---

## ✨ Documentation Complète

- **Guide PowerShell**: `START_CHATBOT_POWERSHELL.md`
- **Guide Complet**: `SYNTHESE_CHATBOT_FINAL.md`
- **Tests**: `GUIDE_TEST_CHATBOT.md`
- **Index**: `INDEX_CHATBOT.md`

---

**Date**: 2026-07-17  
**Status**: Service RAG ✅ ACTIF  
**À faire**: Démarrer Backend + Frontend
