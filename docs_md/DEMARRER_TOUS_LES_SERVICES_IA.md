# 🚀 GUIDE COMPLET - DÉMARRER TOUS LES SERVICES IA

## 📋 Vue d'ensemble

Votre projet utilise **3 services IA Python** qui doivent être démarrés AVANT les tests unitaires :

| Service | Port | Fonction |
|---------|------|----------|
| **Pause AI Service** | 5000 | Prédiction des pauses intelligentes ML |
| **Réclamation AI Service** | 5001 | Validation toxicité/sémantique des réclamations |
| **RAG Chatbot Service** | 8000 | Chatbot intelligent avec génération de rapports |

---

## ⚡ DÉMARRAGE RAPIDE (3 fenêtres CMD)

### Fenêtre CMD #1 : Pause AI Service

```cmd
cd C:\Users\kossa\OneDrive\Desktop\essais\pause-ai-service
start_pause_ai.bat
```

**Succès quand tu vois** :
```
 * Running on http://127.0.0.1:5000
✅ Pause AI Service démarré avec succès!
```

---

### Fenêtre CMD #2 : Réclamation AI Service

```cmd
cd C:\Users\kossa\OneDrive\Desktop\essais\reclamation-ai-service
start_simple.bat
```

**Succès quand tu vois** :
```
 * Running on http://127.0.0.1:5001
✅ Service IA de validation démarré avec succès!
```

---

### Fenêtre CMD #3 : RAG Chatbot Service

```cmd
cd C:\Users\kossa\OneDrive\Desktop\essais\rag-service
START_SIMPLE.bat
```

**Succès quand tu vois** :
```
INFO:     Uvicorn running on http://127.0.0.1:8000
✅ RAG Service démarré avec succès!
```

---

## ✅ VÉRIFIER QUE TOUS LES SERVICES FONCTIONNENT

### Vérification rapide (dans une 4e fenêtre CMD) :

```cmd
curl http://localhost:5000/health
curl http://localhost:5001/health
curl http://localhost:8000/health
```

**Résultat attendu** :
```json
{"status":"healthy"}
{"status":"ok"}
{"status":"healthy"}
```

---

## 📁 CHEMINS COMPLETS DES FICHIERS .BAT

| Service | Chemin complet |
|---------|----------------|
| Pause AI | `C:\Users\kossa\OneDrive\Desktop\essais\pause-ai-service\start_pause_ai.bat` |
| Réclamation AI | `C:\Users\kossa\OneDrive\Desktop\essais\reclamation-ai-service\start_simple.bat` |
| RAG Chatbot | `C:\Users\kossa\OneDrive\Desktop\essais\rag-service\START_SIMPLE.bat` |

---

## 🔧 SI UN SERVICE NE DÉMARRE PAS

### Problème 1 : "Python n'est pas reconnu"

```cmd
where python
```

Si vide, installe Python 3.11+ depuis : https://www.python.org/downloads/

### Problème 2 : "Module not found"

**Pour Pause AI :**
```cmd
cd C:\Users\kossa\OneDrive\Desktop\essais\pause-ai-service
pip install flask flask-cors scikit-learn pandas numpy joblib
```

**Pour Réclamation AI :**
```cmd
cd C:\Users\kossa\OneDrive\Desktop\essais\reclamation-ai-service
pip install -r requirements_simple.txt
```

**Pour RAG Chatbot :**
```cmd
cd C:\Users\kossa\OneDrive\Desktop\essais\rag-service
pip install -r requirements.txt
```

### Problème 3 : Port déjà utilisé

**Tuer les anciens processus :**
```cmd
netstat -ano | findstr :5000
netstat -ano | findstr :5001
netstat -ano | findstr :8000
```

Ensuite tue le processus (remplace `PID` par le numéro affiché) :
```cmd
taskkill /PID <numero_pid> /F
```

---

## 📊 ORDRE DE DÉMARRAGE RECOMMANDÉ

### Pour le DÉVELOPPEMENT NORMAL :

1. **Pause AI Service** (port 5000) - Toujours en premier
2. **Réclamation AI Service** (port 5001) - Pour les réclamations
3. **RAG Chatbot Service** (port 8000) - Pour le chatbot
4. **Backend Java** (port 8080) - Spring Boot
5. **Frontend Angular** (port 4200) - Interface utilisateur

### Pour les TESTS UNITAIRES :

**IMPORTANT** : Pour les tests unitaires, tu as **2 CHOIX** :

#### 🎯 OPTION 1 : Démarrer les services (Recommandé pour tests d'intégration)

```cmd
cd C:\Users\kossa\OneDrive\Desktop\essais\pause-ai-service
start start_pause_ai.bat

cd C:\Users\kossa\OneDrive\Desktop\essais\reclamation-ai-service
start start_simple.bat

cd C:\Users\kossa\OneDrive\Desktop\essais\rag-service
start START_SIMPLE.bat
```

Ensuite lance les tests dans IntelliJ.

#### 🎯 OPTION 2 : Mocker les appels (Je vais corriger pour toi)

Je vais ajouter des **mocks** dans `ReclamationServiceTest.java` pour que les tests n'aient **pas besoin** des services IA.

**Avantage** : Tests plus rapides, pas besoin de démarrer les services
**Inconvénient** : Ne teste pas la vraie intégration avec l'IA

---

## 🎯 QUE FAIRE MAINTENANT ?

### Pour EXÉCUTER les TESTS UNITAIRES :

**Je recommande OPTION 2** : Je vais corriger `ReclamationServiceTest.java` pour mocker l'appel au service IA.

Tu veux que je :

1. ✅ **Corrige le test avec des mocks** (pas besoin de démarrer les services IA)
2. ❌ **Te guide pour démarrer tous les services avant les tests**

Réponds juste : **"1"** ou **"2"**

---

## 📝 NOTES IMPORTANTES

- **Les services IA doivent rester actifs** pendant toute la session de développement
- **Ne ferme pas les fenêtres CMD** où les services tournent
- **Si tu redémarres l'ordinateur**, il faudra relancer les 3 services
- **Les tests Java peuvent être lancés** même si les services IA ne sont pas démarrés (après correction avec mocks)

---

## 🆘 BESOIN D'AIDE ?

Si un service plante, vérifie les logs dans la fenêtre CMD correspondante.

Les logs sont aussi disponibles ici :
- Pause AI : `pause-ai-service/logs/` (si existe)
- Réclamation AI : Affichage direct dans CMD
- RAG Chatbot : Affichage direct dans CMD
- Backend Java : `backend/logs/application.log`

---

## ✅ CHECKLIST AVANT TESTS

- [ ] Pause AI Service démarré (port 5000)
- [ ] Réclamation AI Service démarré (port 5001)  
- [ ] RAG Chatbot Service démarré (port 8000)
- [ ] Backend Java compile sans erreur
- [ ] Base de données MySQL active (si nécessaire)

**OU (recommandé pour tests unitaires)** :

- [ ] Mocks ajoutés dans ReclamationServiceTest.java
- [ ] Aucun service IA requis
- [ ] Tests s'exécutent rapidement
