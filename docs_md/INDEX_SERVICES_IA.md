# 📚 INDEX COMPLET - SERVICES IA LOGIWAY

## 🎯 DÉMARRAGE RAPIDE

### Option 1 : Fichier BAT automatique ⚡
Double-clique sur : **`DEMARRER_TOUS_SERVICES.bat`**

### Option 2 : Commandes manuelles 🖥️

**Fenêtre CMD #1 - Pause AI :**
```cmd
cd C:\Users\kossa\OneDrive\Desktop\essais\pause-ai-service
start_pause_ai.bat
```

**Fenêtre CMD #2 - Réclamation AI :**
```cmd
cd C:\Users\kossa\OneDrive\Desktop\essais\reclamation-ai-service
start_simple.bat
```

**Fenêtre CMD #3 - RAG Chatbot :**
```cmd
cd C:\Users\kossa\OneDrive\Desktop\essais\rag-service
START_SIMPLE.bat
```

---

## 📂 STRUCTURE DES DOSSIERS

```
C:\Users\kossa\OneDrive\Desktop\essais\
│
├── pause-ai-service\              ← Service ML prédiction pauses (Port 5000)
│   ├── app.py                     ← Code principal
│   ├── start_pause_ai.bat         ← Démarrage
│   └── model.py                   ← Modèle ML
│
├── reclamation-ai-service\        ← Service validation réclamations (Port 5001)
│   ├── app_simple.py              ← Code principal
│   ├── start_simple.bat           ← Démarrage
│   └── requirements_simple.txt    ← Dépendances
│
├── rag-service\                   ← Service chatbot RAG (Port 8000)
│   ├── app\
│   │   └── main.py                ← Code principal
│   ├── START_SIMPLE.bat           ← Démarrage
│   └── requirements.txt           ← Dépendances
│
├── backend\                       ← Backend Java Spring Boot (Port 8080)
│   └── src\
│       ├── main\java\com\logiway\
│       └── test\java\com\logiway\
│
└── frontend\                      ← Frontend Angular (Port 4200)
```

---

## 🚀 FICHIERS UTILES

### Démarrage
| Fichier | Description |
|---------|-------------|
| **DEMARRER_TOUS_SERVICES.bat** | ⚡ Démarre les 3 services IA automatiquement |
| **VOIR_GUIDE_SERVICES.bat** | 📖 Affiche le guide interactif |
| **GUIDE_SIMPLE_SERVICES.txt** | 📄 Guide ultra-simple format texte |
| **DEMARRER_TOUS_LES_SERVICES_IA.md** | 📘 Guide complet détaillé |
| **CHEMINS_SERVICES_IA.txt** | 🗺️ Tous les chemins et ports |

### Tests
| Fichier | Description |
|---------|-------------|
| **TESTS_CORRIGES_EXECUTER.md** | ✅ Guide pour exécuter les tests unitaires |
| **GUIDE_TESTS_SIMPLE.md** | 📝 Guide simple des tests |
| **OUVRIR_RAPPORT_TESTS.bat** | 📊 Ouvre le rapport de coverage HTML |

### Documentation
| Fichier | Description |
|---------|-------------|
| **RAG_CHATBOT_ARCHITECTURE.md** | 🏗️ Architecture du chatbot RAG |
| **PAUSE_AI_RESUME_1PAGE.md** | 🤖 Résumé Pause AI ML |
| **ANALYSE_RECLAMATION_STATUS_FINAL.md** | 📋 Module réclamation IA |
| **PORTS_SERVICES_AI_ML_RECAP.md** | 🔌 Récap de tous les ports |

---

## 🌐 PORTS DES SERVICES

| Service | Port | URL | Health Check |
|---------|------|-----|--------------|
| Frontend Angular | 4200 | http://localhost:4200 | - |
| **Pause AI** | **5000** | http://localhost:5000 | /health |
| **Réclamation AI** | **5001** | http://localhost:5001 | /health |
| **RAG Chatbot** | **8000** | http://localhost:8000 | /health |
| Backend Java | 8080 | http://localhost:8080 | /actuator/health |
| MySQL Database | 3306 | localhost:3306 | - |

---

## ✅ VÉRIFICATION RAPIDE

### Dans le navigateur
```
http://localhost:5000/health  → {"status":"healthy"}
http://localhost:5001/health  → {"status":"ok"}
http://localhost:8000/health  → {"status":"healthy"}
```

### Dans CMD
```cmd
curl http://localhost:5000/health
curl http://localhost:5001/health
curl http://localhost:8000/health
```

---

## 🛠️ DÉPANNAGE

### Problème : Port déjà utilisé

```cmd
netstat -ano | findstr :5000
netstat -ano | findstr :5001
netstat -ano | findstr :8000
```

Tuer le processus (remplace `PID` par le numéro) :
```cmd
taskkill /PID <numero> /F
```

### Problème : Module Python manquant

**Pause AI :**
```cmd
cd pause-ai-service
pip install flask flask-cors scikit-learn pandas numpy joblib
```

**Réclamation AI :**
```cmd
cd reclamation-ai-service
pip install -r requirements_simple.txt
```

**RAG Chatbot :**
```cmd
cd rag-service
pip install -r requirements.txt
```

---

## 🎯 WORKFLOW DE DÉVELOPPEMENT

### 1. Démarrer les services IA
```cmd
Double-clic sur DEMARRER_TOUS_SERVICES.bat
```

### 2. Démarrer le backend Java
Dans IntelliJ IDEA :
- Ouvrir `backend/src/main/java/com/logiway/LogiwayApplication.java`
- Clic droit → Run 'LogiwayApplication'

### 3. Démarrer le frontend Angular
```cmd
cd frontend
npm start
```

### 4. Accéder à l'application
Ouvrir le navigateur : http://localhost:4200

---

## 🧪 TESTS UNITAIRES

### Sans services IA (Recommandé)
Les tests utilisent des **mocks** et n'ont pas besoin des services IA.

Dans IntelliJ IDEA :
1. Clic droit sur `backend/src/test/java/com/logiway/services/`
2. Run 'Tests in services'

### Avec services IA (Tests d'intégration)
1. Démarrer les 3 services IA avec `DEMARRER_TOUS_SERVICES.bat`
2. Lancer les tests dans IntelliJ

---

## 📊 STATISTIQUES DU PROJET

### Services IA
- **3 services Python** (Flask + FastAPI)
- **5 endpoints ML/IA** en production
- **Ports : 5000, 5001, 8000**

### Backend Java
- **Spring Boot 3.x**
- **61 tests unitaires** (coverage ~18-22%)
- **Port : 8080**

### Frontend Angular
- **Angular 18**
- **Port : 4200**

---

## 🆘 BESOIN D'AIDE ?

### Guides disponibles
1. **GUIDE_SIMPLE_SERVICES.txt** - Pour démarrer rapidement
2. **DEMARRER_TOUS_LES_SERVICES_IA.md** - Guide complet
3. **CHEMINS_SERVICES_IA.txt** - Tous les chemins
4. **TESTS_CORRIGES_EXECUTER.md** - Pour les tests

### Fichiers interactifs
- **VOIR_GUIDE_SERVICES.bat** - Guide interactif
- **DEMARRER_TOUS_SERVICES.bat** - Démarrage auto

---

## 📝 NOTES IMPORTANTES

- ⚠️ **Ne ferme pas les fenêtres CMD** où les services IA tournent
- ⚠️ **Les services doivent rester actifs** pendant le développement
- ✅ **Les tests unitaires n'ont pas besoin des services IA** (avec mocks)
- ✅ **Si tu redémarres l'ordinateur**, relance `DEMARRER_TOUS_SERVICES.bat`

---

## ✨ PROCHAINES ÉTAPES

1. ✅ **Démarrer les services** : Double-clic sur `DEMARRER_TOUS_SERVICES.bat`
2. ✅ **Vérifier qu'ils tournent** : Ouvrir les URLs /health dans le navigateur
3. ✅ **Lancer les tests** : Dans IntelliJ, Run 'Tests in services'
4. ✅ **Voir le coverage** : Double-clic sur `OUVRIR_RAPPORT_TESTS.bat`

---

*Dernière mise à jour : Aujourd'hui*
*Guide créé pour le PFE Logiway*
