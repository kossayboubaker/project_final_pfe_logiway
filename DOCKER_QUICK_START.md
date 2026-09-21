# 🚀 Docker Quick Start - LogiWay Platform

## ⚡ Commandes Rapides

### 1️⃣ Build Local (Développement)

```powershell
# Option 1: Build avec docker-compose (RECOMMANDÉ)
docker-compose build

# Option 2: Build avec le script automatisé
.\build-local.ps1

# Option 3: Build manuel d'un service
docker build -t logiway-backend:latest ./backend
```

---

### 2️⃣ Démarrer l'Application Complète

```powershell
# Démarrer tous les services
docker-compose up -d

# Voir les logs en temps réel
docker-compose logs -f

# Vérifier que tout fonctionne
docker ps
```

**Accès aux services** :
- Frontend: http://localhost:4200
- Backend: http://localhost:8080
- Pause AI: http://localhost:5000
- Reclamation AI: http://localhost:5001
- RAG Service: http://localhost:8001

---

### 3️⃣ Publier sur Docker Hub

```powershell
# 1. Se connecter à Docker Hub
docker login

# 2. Publier avec le script (remplacer 'kossay' par votre username)
.\publish-dockerhub.ps1 -Username "kossay"

# OU avec une version spécifique
.\publish-dockerhub.ps1 -Username "kossay" -Version "v1.0.0"
```

---

### 4️⃣ Publier sur GitHub Container Registry

```powershell
# 1. Créer un token sur github.com/settings/tokens

# 2. Publier avec le script
.\publish-github.ps1 -Username "votre_username" -Token "ghp_VotreTOKEN" -Version "v1.0.0"
```

---

## 🛠️ Commandes Utiles

### Voir les images
```powershell
docker images | Select-String "logiway"
```

### Voir les conteneurs
```powershell
docker ps
```

### Arrêter tout
```powershell
docker-compose down
```

### Nettoyer
```powershell
# Supprimer les images inutilisées
docker system prune -a

# Supprimer tous les conteneurs et volumes
docker-compose down -v
```

---

## 📋 Checklist Rapide

### Pour le Développement Local
- [ ] Docker Desktop est lancé
- [ ] `docker-compose build` réussi
- [ ] `docker-compose up -d` réussi
- [ ] Tous les services accessibles (vérifier avec `docker ps`)
- [ ] Frontend charge sur http://localhost:4200

### Pour la Production (Docker Hub)
- [ ] Compte Docker Hub créé sur hub.docker.com
- [ ] `docker login` réussi
- [ ] `.\build-local.ps1` réussi
- [ ] `.\publish-dockerhub.ps1 -Username "votre_username"` réussi
- [ ] Images visibles sur hub.docker.com/u/votre_username

### Pour la Production (GitHub)
- [ ] Token GitHub créé (Settings > Developer settings > Tokens)
- [ ] Token a les permissions `write:packages`
- [ ] `.\publish-github.ps1` réussi
- [ ] Images visibles sur github.com/votre_username?tab=packages
- [ ] Packages rendus publics si nécessaire

---

## 🆘 Problèmes Fréquents

### "docker: command not found"
→ Démarrer Docker Desktop

### Build échoue
→ Vérifier les logs: `docker build --progress=plain`

### "permission denied"
→ Relancer `docker login`

### "no space left"
→ Nettoyer: `docker system prune -a`

---

## 📚 Documentation Complète

Pour plus de détails, voir [GUIDE_DOCKER_BUILD_PUBLISH.md](./GUIDE_DOCKER_BUILD_PUBLISH.md)

---

**🎯 Pour commencer maintenant:**

```powershell
# 1. Build
.\build-local.ps1

# 2. Test
docker-compose up -d

# 3. Publish (optionnel)
.\publish-dockerhub.ps1 -Username "votre_username"
```

**C'est tout ! 🎉**
