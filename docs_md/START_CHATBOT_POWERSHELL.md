# 🚀 Démarrage Chatbot LogiWay - Guide PowerShell

## ⚠️ Important PowerShell

Dans PowerShell, les fichiers `.bat` nécessitent `.\` ou `cmd /c` devant le nom.

---

## 📋 Démarrage en 3 Terminaux

### Terminal 1: Service RAG Gemini

```powershell
cd C:\Users\kossa\OneDrive\Desktop\essais\rag-service
.\start_gemini.bat
```

**✅ Attendez le message**: `✓ Service RAG prêt avec Gemini!`

**Si erreur de module**:
```powershell
# Installer les dépendances
pip install -r requirements.txt
```

---

### Terminal 2: Backend Spring Boot

```powershell
cd C:\Users\kossa\OneDrive\Desktop\essais\backend
mvn spring-boot:run
```

**✅ Attendez**: `Tomcat started on port(s): 8080`

---

### Terminal 3: Frontend Angular

```powershell
cd C:\Users\kossa\OneDrive\Desktop\essais\frontend
npm start
```

**✅ Attendez**: `Compiled successfully`

---

## 🧪 Test

### Option 1: Test Automatique
```powershell
cd C:\Users\kossa\OneDrive\Desktop\essais
.\TEST_CHATBOT_INTEGRATION.bat
```

### Option 2: Test Manuel
1. Ouvrez http://localhost:4200
2. Connectez-vous
3. Cliquez sur l'icône 🤖 (bas à droite)
4. Posez: `"Combien de chauffeurs ?"`

---

## 🔧 Alternatives PowerShell

### Méthode 1: Avec `.\`
```powershell
.\start_gemini.bat
```

### Méthode 2: Avec `cmd /c`
```powershell
cmd /c start_gemini.bat
```

### Méthode 3: Passer en CMD
```powershell
cmd
# Puis dans CMD:
start_gemini.bat
```

---

## 📊 Vérification des Services

```powershell
# Service RAG (Port 5003)
curl http://localhost:5003/health

# Backend (Port 8080)
curl http://localhost:8080/actuator/health

# Frontend (Port 4200)
curl http://localhost:4200
```

---

## 🆘 Problèmes Courants

### "start_gemini.bat n'est pas reconnu"
**Solution**: Utilisez `.\start_gemini.bat`

### "Python n'est pas installé"
**Solution**: 
```powershell
# Téléchargez Python 3.11+ depuis python.org
# Puis installez les dépendances:
cd rag-service
pip install -r requirements.txt
```

### "mvn n'est pas reconnu"
**Solution**: Installez Maven depuis maven.apache.org

### "npm n'est pas reconnu"
**Solution**: Installez Node.js depuis nodejs.org

---

## 🎯 Ordre de Démarrage

1. **Service RAG Gemini** (obligatoire)
2. **Backend Spring Boot** (obligatoire)
3. **Frontend Angular** (obligatoire)

**Chaque service dans son propre terminal!**

---

## ✅ Status Final

Une fois les 3 services démarrés:
- ✅ RAG: http://localhost:5003/health
- ✅ Backend: http://localhost:8080/actuator/health
- ✅ Frontend: http://localhost:4200
- ✅ Chatbot: Icône 🤖 en bas à droite

---

**Date**: 2026-07-17  
**Version**: 1.0  
**Système**: Windows + PowerShell
