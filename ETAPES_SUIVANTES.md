# 🎯 ÉTAPES SUIVANTES — Après le Premier Démarrage Docker

## ✅ État Actuel (Ce qui est FAIT)

- ✅ Docker Compose lancé avec succès
- ✅ MySQL fonctionne (healthy)
- ✅ Services IA fonctionnent :
  - ✅ Pause AI (port 5000) - healthy
  - ✅ Réclamation AI (port 5001) - healthy
  - ✅ RAG Service/Chatbot (port 8001) - healthy
- ✅ Backend démarré (port 8080) - en cours de santé
- ✅ Frontend démarré (port 4200) - en cours de santé
- ⚠️ Keycloak démarré mais healthcheck échoue (problème mineur)

---

## 🔴 CE QUI RESTE À FAIRE (IMPORTANT)

### 1️⃣ **Configurer Keycloak** (OBLIGATOIRE pour l'authentification)

Keycloak est démarré mais PAS configuré. Sans cette étape, l'authentification ne fonctionnera pas.

#### Option A : Configuration Manuelle (Rapide)

1. **Ouvrir Keycloak** :
   ```
   http://localhost:8180
   ```

2. **Se connecter** :
   - Username: `admin`
   - Password: `admin` (voir `.env` si modifié)

3. **Créer le Realm "logiway"** :
   - Cliquer sur le menu déroulant en haut à gauche (Master)
   - Cliquer "Create Realm"
   - Name: `logiway`
   - Enabled: ON
   - Cliquer "Create"

4. **Créer le Client "logiway"** :
   - Dans le realm "logiway", aller dans "Clients"
   - Cliquer "Create client"
   - Client ID: `logiway`
   - Client Protocol: `openid-connect`
   - Cliquer "Next"
   - Client authentication: OFF (public client)
   - Cliquer "Save"

5. **Configurer les URLs du client** :
   - Dans l'onglet "Settings" du client :
     - Valid redirect URIs: `http://localhost:4200/*`
     - Web origins: `http://localhost:4200`
   - Cliquer "Save"

#### Option B : Script Automatique (Si disponible)

```powershell
cd backend
.\kc_setup.ps1
```

⚠️ Si le script n'existe pas ou échoue, utiliser l'Option A.

---

### 2️⃣ **Ajouter les API Keys Manquantes** (OBLIGATOIRE pour les fonctions IA)

Certaines fonctionnalités nécessitent des clés API externes.

#### Éditer le fichier `.env` :

```bash
# API Google Gemini (pour le chatbot RAG et les rapports IA)
GEMINI_API_KEY=votre_cle_google_gemini

# API OpenWeather (pour les données météo dans les trajets)
OPENWEATHER_API_KEY=votre_cle_openweather

# Optionnel : HuggingFace (pour certains modèles ML)
HF_API_TOKEN=votre_token_huggingface
```

#### Où obtenir ces clés ?

1. **Google Gemini API** :
   - Aller sur https://makersuite.google.com/app/apikey
   - Créer un nouveau projet si nécessaire
   - Générer une clé API

2. **OpenWeather API** :
   - Aller sur https://openweathermap.org/api
   - S'inscrire (plan gratuit disponible)
   - Copier la clé API

3. **HuggingFace Token** (optionnel) :
   - Aller sur https://huggingface.co/settings/tokens
   - Créer un token de lecture

#### Redémarrer les services après modification :

```powershell
docker-compose restart backend rag-service
```

---

### 3️⃣ **Corriger le Healthcheck Keycloak** (Optionnel mais recommandé)

Keycloak fonctionne mais est marqué "unhealthy". Pour corriger :

#### Solution 1 : Désactiver le healthcheck (simple)

Dans `docker-compose.yml`, commenter ou supprimer le bloc healthcheck de keycloak :

```yaml
keycloak:
  # ...
  # healthcheck:
  #   test: ["CMD-SHELL", "exec 3<>/dev/tcp/localhost/8080 ..."]
```

#### Solution 2 : Installer curl dans Keycloak (avancé)

Modifier le service keycloak pour installer curl au démarrage.

---

### 4️⃣ **Corriger le Simulator** (Optionnel)

Le simulator a échoué car `gunicorn` est manquant. Deux options :

#### Option A : Ignorer le simulator (simple)

Le simulator n'est pas critique pour tester l'application. Vous pouvez :

```powershell
# Démarrer sans le simulator
docker-compose up -d backend frontend mysql keycloak pause-ai reclamation-ai rag-service
```

#### Option B : Corriger le Dockerfile du simulator

Ajouter `gunicorn` dans `simulator/requirements.txt` :

```txt
gunicorn==21.2.0
```

Puis rebuild :

```powershell
docker-compose build simulator
docker-compose up -d simulator
```

---

## 🧪 **TESTER L'APPLICATION**

### 1. Vérifier que tous les services sont UP :

```powershell
docker-compose ps
```

Résultat attendu :
- ✅ mysql: Up (healthy)
- ✅ keycloak: Up
- ✅ backend: Up (healthy)
- ✅ frontend: Up (healthy)
- ✅ pause-ai: Up (healthy)
- ✅ reclamation-ai: Up (healthy)
- ✅ rag-service: Up (healthy)

### 2. Tester le Frontend :

Ouvrir dans un navigateur :
```
http://localhost:4200
```

Vous devriez voir l'interface de connexion.

### 3. Tester le Backend :

```powershell
curl http://localhost:8080/actuator/health
```

Résultat attendu :
```json
{"status":"UP"}
```

### 4. Tester Keycloak :

Ouvrir :
```
http://localhost:8180
```

Vous devriez voir la page d'administration Keycloak.

### 5. Tester les Services IA :

```powershell
# Pause AI
curl http://localhost:5000/health

# Reclamation AI
curl http://localhost:5001/health

# RAG Service
curl http://localhost:8001/health
```

Tous devraient retourner `{"status":"healthy"}` ou similaire.

---

## 🚀 **PUBLIER LES IMAGES (Après Tests)**

Une fois que tout fonctionne localement, vous pouvez publier vos images.

### Option 1 : GitHub Container Registry (Recommandé)

```powershell
# 1. Créer un token sur GitHub
# https://github.com/settings/tokens
# Permissions : write:packages, read:packages, delete:packages

# 2. Publier
.\publish-github.ps1
```

### Option 2 : Docker Hub

```powershell
# 1. Se connecter
docker login

# 2. Publier
.\publish-dockerhub.ps1
```

---

## 📋 **CHECKLIST COMPLÈTE**

### Configuration de Base
- [ ] Keycloak configuré (realm + client)
- [ ] API keys ajoutées dans `.env`
- [ ] Services redémarrés après configuration
- [ ] Tous les services sont "healthy" ou "Up"

### Tests
- [ ] Frontend accessible (http://localhost:4200)
- [ ] Backend répond (http://localhost:8080/actuator/health)
- [ ] Keycloak accessible (http://localhost:8180)
- [ ] Services IA répondent (ports 5000, 5001, 8001)

### Optionnel
- [ ] Healthcheck Keycloak corrigé
- [ ] Simulator corrigé ou désactivé
- [ ] Images publiées sur Docker Hub ou GHCR
- [ ] GitHub Actions configuré (automatisation)

---

## 🆘 **PROBLÈMES FRÉQUENTS**

### "Backend ne démarre pas"
→ Vérifier les logs : `docker-compose logs backend`
→ Vérifier que MySQL est healthy : `docker-compose ps`

### "Keycloak est inaccessible"
→ Attendre 1-2 minutes (premier démarrage lent)
→ Vérifier le port : http://localhost:8180

### "Frontend affiche une erreur 502"
→ Vérifier que le backend est démarré
→ Vérifier les logs : `docker-compose logs frontend`

### "Les services IA ne répondent pas"
→ Vérifier les API keys dans `.env`
→ Redémarrer : `docker-compose restart rag-service`

---

## 📞 **PROCHAINES ACTIONS**

1. ⭐ **Configurer Keycloak** (étape 1)
2. ⭐ **Ajouter les API keys** (étape 2)
3. 🧪 **Tester l'application complète**
4. 🚀 **Publier les images** (si tout fonctionne)
5. 📚 **Documenter votre configuration spécifique**

---

**Bon courage ! 🎉**

Si vous rencontrez des problèmes, consultez les logs avec :
```powershell
docker-compose logs -f <nom-du-service>
```
