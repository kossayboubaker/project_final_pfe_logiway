# 🐳 LogiWay Platform - Docker Guide

## 📦 Architecture des Services

```
logiway-platform/
├── backend/              → Spring Boot (Java)     Port 8080
├── frontend/             → Angular 19             Port 4200
├── pause-ai-service/     → ML RandomForest        Port 5000
├── reclamation-ai-service/ → Rule-based AI       Port 5001
├── rag-service/          → Chatbot Gemini        Port 8001
└── docker-compose.yml    → Orchestration complète
```

---

## 🚀 Quick Start

### Développement Local

```powershell
# 1. Build toutes les images
.\build-local.ps1

# 2. Démarrer l'application
docker-compose up -d

# 3. Accéder à l'application
# → Frontend: http://localhost:4200
# → Backend:  http://localhost:8080
```

### Publication sur Docker Hub

```powershell
# 1. Build local
.\build-local.ps1

# 2. Login Docker Hub
docker login

# 3. Publish (remplacer par votre username)
.\publish-dockerhub.ps1 -Username "kossay"
```

---

## 📚 Documentation

| Document | Description |
|----------|-------------|
| [DOCKER_QUICK_START.md](./DOCKER_QUICK_START.md) | ⚡ Commandes rapides |
| [GUIDE_DOCKER_BUILD_PUBLISH.md](./GUIDE_DOCKER_BUILD_PUBLISH.md) | 📖 Guide complet détaillé |

---

## 🛠️ Scripts Disponibles

| Script | Commande | Description |
|--------|----------|-------------|
| **Build Local** | `.\build-local.ps1` | Build toutes les images localement |
| **Publish Docker Hub** | `.\publish-dockerhub.ps1 -Username "xxx"` | Publier sur Docker Hub |
| **Publish GitHub** | `.\publish-github.ps1 -Username "xxx" -Token "xxx"` | Publier sur GitHub Container Registry |

---

## 🏗️ Images Docker

### Images Locales
```
logiway-backend:latest
logiway-frontend:latest
logiway-pause-ai:latest
logiway-reclamation-ai:latest
logiway-rag-service:latest
```

### Docker Hub (après publication)
```
kossay/logiway-backend:latest
kossay/logiway-frontend:latest
kossay/logiway-pause-ai:latest
kossay/logiway-reclamation-ai:latest
kossay/logiway-rag-service:latest
```

### GitHub Container Registry (après publication)
```
ghcr.io/kossay/logiway-backend:latest
ghcr.io/kossay/logiway-frontend:latest
ghcr.io/kossay/logiway-pause-ai:latest
ghcr.io/kossay/logiway-reclamation-ai:latest
ghcr.io/kossay/logiway-rag-service:latest
```

---

## 🔧 Commandes Utiles

### Gestion des Services

```powershell
# Démarrer
docker-compose up -d

# Arrêter
docker-compose down

# Voir les logs
docker-compose logs -f

# Redémarrer un service
docker-compose restart backend

# Rebuild un service
docker-compose build backend
docker-compose up -d backend
```

### Gestion des Images

```powershell
# Lister les images
docker images | Select-String "logiway"

# Supprimer une image
docker rmi logiway-backend:latest

# Build une image
docker build -t logiway-backend:latest ./backend
```

### Gestion des Conteneurs

```powershell
# Voir les conteneurs actifs
docker ps

# Voir tous les conteneurs
docker ps -a

# Logs d'un conteneur
docker logs logiway-backend

# Entrer dans un conteneur
docker exec -it logiway-backend bash
```

### Nettoyage

```powershell
# Nettoyer les images non utilisées
docker system prune -a

# Nettoyer tout (ATTENTION: supprime les données)
docker-compose down -v
docker system prune -a --volumes
```

---

## 🌐 Accès aux Services

| Service | URL Local | Healthcheck |
|---------|-----------|-------------|
| **Frontend** | http://localhost:4200 | http://localhost:4200 |
| **Backend** | http://localhost:8080 | http://localhost:8080/actuator/health |
| **Pause AI** | http://localhost:5000 | http://localhost:5000/health |
| **Reclamation AI** | http://localhost:5001 | http://localhost:5001/health |
| **RAG Service** | http://localhost:8001 | http://localhost:8001/health |
| **MySQL** | localhost:3306 | - |

---

## 🔐 Variables d'Environnement

Les variables sensibles sont dans :
- `.env` (racine) - Variables globales
- `backend/.env` - Variables backend

**Fichiers ignorés par Git** (sécurité) :
- ✅ `.env`
- ✅ `.env.example`
- ✅ `backend/.env`
- ✅ Tous les fichiers `.bat`
- ✅ `kc_setup.ps1`

---

## 📊 Ports Utilisés

| Service | Port | Protocole |
|---------|------|-----------|
| Frontend | 4200 | HTTP |
| Backend | 8080 | HTTP |
| MySQL | 3306 | TCP |
| Pause AI | 5000 | HTTP |
| Reclamation AI | 5001 | HTTP |
| RAG Service | 8001 | HTTP |

---

## 🐛 Dépannage

### Docker Desktop ne démarre pas
1. Redémarrer Windows
2. Vérifier WSL2 est installé
3. Désactiver/Réactiver Hyper-V

### Build échoue
```powershell
# Voir les logs détaillés
docker build --progress=plain -t logiway-backend:latest ./backend

# Build sans cache
docker build --no-cache -t logiway-backend:latest ./backend
```

### Conteneur crash au démarrage
```powershell
# Voir les logs
docker-compose logs backend

# Vérifier les variables d'environnement
docker-compose config
```

### Port déjà utilisé
```powershell
# Trouver le processus qui utilise le port 8080
netstat -ano | findstr :8080

# Tuer le processus (remplacer PID)
taskkill /PID 1234 /F
```

---

## 🎯 Workflows Recommandés

### Développement Local
```powershell
# 1. Build
.\build-local.ps1

# 2. Start
docker-compose up -d

# 3. Develop
# ... faire des modifications ...

# 4. Rebuild si nécessaire
docker-compose build backend
docker-compose up -d backend

# 5. Stop
docker-compose down
```

### Publication Production
```powershell
# 1. Test local
.\build-local.ps1
docker-compose up -d
# ... tester l'application ...

# 2. Publish
.\publish-dockerhub.ps1 -Username "kossay" -Version "v1.0.0"

# 3. Vérifier sur hub.docker.com
```

### CI/CD avec GitHub Actions
```bash
# Push vers GitHub
git add .
git commit -m "feat: nouvelle fonctionnalité"
git push origin main

# GitHub Actions build automatiquement
# Images disponibles sur ghcr.io
```

---

## 📝 Notes Importantes

1. **Docker Desktop** doit être lancé avant toute commande Docker
2. **Variables d'environnement** : Créer `.env` à partir de `.env.example`
3. **Première exécution** : Le build peut prendre 10-15 minutes
4. **Builds suivants** : Cache Docker accélère le build (2-5 minutes)
5. **Espace disque** : Prévoir ~10 GB pour toutes les images

---

## 🆘 Support

### Documentation Officielle
- [Docker Documentation](https://docs.docker.com/)
- [Docker Compose](https://docs.docker.com/compose/)
- [Docker Hub](https://hub.docker.com)

### Fichiers du Projet
- [Guide Complet](./GUIDE_DOCKER_BUILD_PUBLISH.md)
- [Quick Start](./DOCKER_QUICK_START.md)
- [docker-compose.yml](./docker-compose.yml)

---

## ✅ Checklist Mise en Production

### Avant le déploiement
- [ ] Toutes les images buildent sans erreur
- [ ] Tests locaux passent
- [ ] Variables d'environnement configurées
- [ ] Secrets non inclus dans les images
- [ ] Healthchecks fonctionnent
- [ ] Logs configurés correctement

### Publication
- [ ] Images taguées avec version
- [ ] Images pushées sur registre
- [ ] Images publiques/privées selon besoin
- [ ] Documentation à jour

### Après déploiement
- [ ] Tous les services démarrent
- [ ] Healthchecks passent
- [ ] Application accessible
- [ ] Logs vérifiés
- [ ] Monitoring en place

---

**🎉 Prêt à déployer ! Good luck ! 🚀**
