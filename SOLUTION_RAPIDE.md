# 🚀 Solution Rapide - Démarrer LogiWay

## ❌ Problème Rencontré

L'erreur `exec: "gunicorn": executable file not found` indique que les images sur GitHub Container Registry sont obsolètes.

## ✅ Solution : Build Local + Démarrage

### Étape 1: Build les Images Localement

```powershell
# Build tous les services
docker-compose build

# OU build service par service
docker-compose build backend
docker-compose build frontend
docker-compose build pause-ai
docker-compose build reclamation-ai
docker-compose build rag-service
```

### Étape 2: Démarrer les Services

```powershell
# Démarrer tout
docker-compose up -d

# Vérifier les logs
docker-compose logs -f
```

### Étape 3: Vérifier que Tout Fonctionne

```powershell
# Voir les services
docker-compose ps

# Tester les endpoints
curl http://localhost:4200  # Frontend
curl http://localhost:8080/actuator/health  # Backend
curl http://localhost:5000/health  # Pause AI
curl http://localhost:5001/health  # Reclamation AI
curl http://localhost:8001/health  # RAG Service
```

---

## 🔧 Alternative : Fichier docker-compose.override.yml

Si tu veux forcer le build local sans modifier `docker-compose.yml`, crée ce fichier :

**Fichier : `docker-compose.override.yml`**
```yaml
version: "3.8"

services:
  backend:
    build:
      context: ./backend
      dockerfile: Dockerfile
    image: logiway-backend:latest
  
  frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile
    image: logiway-frontend:latest
  
  pause-ai:
    build:
      context: ./pause-ai-service
      dockerfile: Dockerfile
    image: logiway-pause-ai:latest
  
  reclamation-ai:
    build:
      context: ./reclamation-ai-service
      dockerfile: Dockerfile
    image: logiway-reclamation-ai:latest
  
  rag-service:
    build:
      context: ./rag-service
      dockerfile: Dockerfile
    image: logiway-rag-service:latest
```

Puis :
```powershell
docker-compose build
docker-compose up -d
```

---

## 📊 Vérification Complète

```powershell
# 1. Vérifier les conteneurs
docker-compose ps

# 2. Vérifier les logs de chaque service
docker-compose logs backend
docker-compose logs frontend
docker-compose logs pause-ai
docker-compose logs reclamation-ai
docker-compose logs rag-service

# 3. Vérifier les healthchecks
docker ps --format "table {{.Names}}\t{{.Status}}"
```

---

## 🎯 Commande Complète (Une Ligne)

```powershell
docker-compose down ; docker-compose build ; docker-compose up -d ; docker-compose logs -f
```

---

## ⚠️ Si le Build Échoue

### Pour pause-ai ou reclamation-ai :
```powershell
# Vérifier si gunicorn est dans requirements
cat pause-ai-service/requirements.txt | Select-String gunicorn
cat reclamation-ai-service/requirements_simple.txt | Select-String gunicorn

# Rebuild avec no-cache
docker-compose build --no-cache pause-ai
docker-compose build --no-cache reclamation-ai
```

### Pour RAG service :
```powershell
# Vérifier les requirements
cat rag-service/requirements.txt

# Rebuild
docker-compose build --no-cache rag-service
```

---

## ✅ Une Fois Tout Fonctionnel

Après que tous les services démarrent correctement :

### Publier sur Docker Hub

```powershell
# Tagger et pusher
.\publish-dockerhub.ps1 -Username "kossay"
```

### Publier sur GitHub

```bash
# Commit et push
git add .
git commit -m "fix: update Docker images with gunicorn"
git push origin main

# GitHub Actions va rebuild automatiquement
```

---

## 🏁 Résumé des Commandes

```powershell
# 1. Arrêter tout
docker-compose down

# 2. Build local
docker-compose build

# 3. Démarrer
docker-compose up -d

# 4. Vérifier
docker-compose ps
docker-compose logs -f

# 5. Tester l'application
# http://localhost:4200
```

**Temps estimé** : 10-15 minutes pour le premier build, puis 2-3 minutes pour les builds suivants.

---

## 💡 Astuce Pro

Créer un script `start.ps1` :

```powershell
Write-Host "🚀 Démarrage de LogiWay Platform..." -ForegroundColor Cyan

docker-compose down
docker-compose build
docker-compose up -d

Write-Host "`n✅ Vérification des services..." -ForegroundColor Green
Start-Sleep -Seconds 10
docker-compose ps

Write-Host "`n🌐 Application disponible sur:" -ForegroundColor Cyan
Write-Host "   Frontend: http://localhost:4200" -ForegroundColor White
Write-Host "   Backend:  http://localhost:8080" -ForegroundColor White
```

Puis lancer avec : `.\start.ps1`
