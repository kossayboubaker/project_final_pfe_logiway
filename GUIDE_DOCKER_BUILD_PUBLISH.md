# 🐳 Guide Complet Docker - Build et Publish

## 📋 Table des Matières
1. [Vérification Installation Docker](#1-vérification-installation-docker)
2. [Build des Images Localement](#2-build-des-images-localement)
3. [Tester les Images Localement](#3-tester-les-images-localement)
4. [Publier sur Docker Hub](#4-publier-sur-docker-hub)
5. [Publier sur GitHub Container Registry](#5-publier-sur-github-container-registry)
6. [Scripts Automatisés](#6-scripts-automatisés)
7. [Dépannage](#7-dépannage)

---

## 1. Vérification Installation Docker

### ✅ Vérifier que Docker est installé et fonctionne

```powershell
# Vérifier la version de Docker
docker --version

# Vérifier que Docker Desktop est en cours d'exécution
docker ps

# Afficher les informations système Docker
docker info
```

**Résultat attendu** :
```
Docker version 24.x.x, build xxxxx
```

---

## 2. Build des Images Localement

### 🏗️ Builder TOUS les services à la fois

```powershell
# Depuis la racine du projet
cd C:\Users\kossa\OneDrive\Desktop\kossay_pfe_files

# Build de tous les services avec docker-compose
docker-compose build
```

### 🔨 Builder les services UN PAR UN

#### Backend (Spring Boot)
```powershell
docker build -t logiway-backend:latest ./backend
```

#### Frontend (Angular)
```powershell
docker build -t logiway-frontend:latest ./frontend
```

#### Pause AI Service
```powershell
docker build -t logiway-pause-ai:latest ./pause-ai-service
```

#### Reclamation AI Service
```powershell
docker build -t logiway-reclamation-ai:latest ./reclamation-ai-service
```

#### RAG Service (Chatbot)
```powershell
docker build -t logiway-rag-service:latest ./rag-service
```

### 📊 Vérifier les images créées

```powershell
# Lister toutes les images Docker locales
docker images | Select-String "logiway"

# Voir les détails d'une image
docker inspect logiway-backend:latest
```

---

## 3. Tester les Images Localement

### 🚀 Démarrer TOUS les services

```powershell
# Démarrer tous les services avec docker-compose
docker-compose up -d

# Voir les logs de tous les services
docker-compose logs -f

# Voir les logs d'un service spécifique
docker-compose logs -f backend
```

### 🔍 Vérifier que les services fonctionnent

```powershell
# Lister les conteneurs en cours d'exécution
docker ps

# Vérifier les healthchecks
docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"

# Tester les endpoints
curl http://localhost:8080/actuator/health  # Backend
curl http://localhost:4200                  # Frontend
curl http://localhost:5000/health           # Pause AI
curl http://localhost:5001/health           # Reclamation AI
curl http://localhost:8001/health           # RAG Service
```

### 🛑 Arrêter les services

```powershell
# Arrêter tous les services
docker-compose down

# Arrêter et supprimer les volumes
docker-compose down -v
```

---

## 4. Publier sur Docker Hub

### 📝 Étape 1 : Créer un compte Docker Hub

1. Aller sur [hub.docker.com](https://hub.docker.com)
2. Créer un compte gratuit
3. Noter votre **username** (exemple: `kossay`)

### 🔐 Étape 2 : Se connecter à Docker Hub

```powershell
# Se connecter à Docker Hub
docker login

# Entrer votre username et password
# Username: votre_username
# Password: votre_password
```

**Alternative** : Utiliser un Access Token (plus sécurisé)
```powershell
# Créer un token sur hub.docker.com/settings/security
# Puis se connecter avec le token
docker login -u votre_username
# Password: coller_votre_token
```

### 🏷️ Étape 3 : Tagguer les images

```powershell
# Format: docker tag IMAGE_LOCAL USERNAME/IMAGE_NAME:TAG

# Backend
docker tag logiway-backend:latest votre_username/logiway-backend:latest
docker tag logiway-backend:latest votre_username/logiway-backend:v1.0.0

# Frontend
docker tag logiway-frontend:latest votre_username/logiway-frontend:latest

# Pause AI
docker tag logiway-pause-ai:latest votre_username/logiway-pause-ai:latest

# Reclamation AI
docker tag logiway-reclamation-ai:latest votre_username/logiway-reclamation-ai:latest

# RAG Service
docker tag logiway-rag-service:latest votre_username/logiway-rag-service:latest
```

### 📤 Étape 4 : Pusher les images sur Docker Hub

```powershell
# Pusher toutes les images
docker push votre_username/logiway-backend:latest
docker push votre_username/logiway-frontend:latest
docker push votre_username/logiway-pause-ai:latest
docker push votre_username/logiway-reclamation-ai:latest
docker push votre_username/logiway-rag-service:latest

# Pusher avec un tag de version
docker push votre_username/logiway-backend:v1.0.0
```

### ✅ Étape 5 : Vérifier sur Docker Hub

Aller sur `https://hub.docker.com/u/votre_username/` pour voir vos images publiées.

---

## 5. Publier sur GitHub Container Registry

### 🔐 Étape 1 : Créer un Personal Access Token GitHub

1. Aller sur GitHub → Settings → Developer settings → Personal access tokens
2. Cliquer sur "Generate new token (classic)"
3. Cocher les permissions :
   - `write:packages`
   - `read:packages`
   - `delete:packages`
4. Copier le token généré

### 🔑 Étape 2 : Se connecter à GitHub Container Registry

```powershell
# Sauvegarder le token dans une variable
$env:CR_PAT = "ghp_VotreTOKENici"

# Se connecter à ghcr.io
echo $env:CR_PAT | docker login ghcr.io -u votre_username_github --password-stdin
```

### 🏷️ Étape 3 : Tagguer pour GitHub

```powershell
# Format: ghcr.io/USERNAME/IMAGE_NAME:TAG

docker tag logiway-backend:latest ghcr.io/votre_username/logiway-backend:latest
docker tag logiway-frontend:latest ghcr.io/votre_username/logiway-frontend:latest
docker tag logiway-pause-ai:latest ghcr.io/votre_username/logiway-pause-ai:latest
docker tag logiway-reclamation-ai:latest ghcr.io/votre_username/logiway-reclamation-ai:latest
docker tag logiway-rag-service:latest ghcr.io/votre_username/logiway-rag-service:latest
```

### 📤 Étape 4 : Pusher sur GitHub

```powershell
docker push ghcr.io/votre_username/logiway-backend:latest
docker push ghcr.io/votre_username/logiway-frontend:latest
docker push ghcr.io/votre_username/logiway-pause-ai:latest
docker push ghcr.io/votre_username/logiway-reclamation-ai:latest
docker push ghcr.io/votre_username/logiway-rag-service:latest
```

### ✅ Étape 5 : Rendre les images publiques

1. Aller sur GitHub → Packages
2. Cliquer sur chaque package
3. Package settings → Change visibility → Public

---

## 6. Scripts Automatisés

### 📄 Script PowerShell : Build Local

Créer `build-local.ps1` :

```powershell
# Build Local de tous les services
Write-Host "🏗️  Building all Docker images..." -ForegroundColor Cyan

$services = @(
    @{Name="backend"; Path="./backend"},
    @{Name="frontend"; Path="./frontend"},
    @{Name="pause-ai"; Path="./pause-ai-service"},
    @{Name="reclamation-ai"; Path="./reclamation-ai-service"},
    @{Name="rag-service"; Path="./rag-service"}
)

foreach ($service in $services) {
    Write-Host "`n🔨 Building $($service.Name)..." -ForegroundColor Yellow
    docker build -t "logiway-$($service.Name):latest" $service.Path
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ $($service.Name) built successfully!" -ForegroundColor Green
    } else {
        Write-Host "❌ $($service.Name) build failed!" -ForegroundColor Red
        exit 1
    }
}

Write-Host "`n🎉 All images built successfully!" -ForegroundColor Green
```

### 📄 Script PowerShell : Publish Docker Hub

Créer `publish-dockerhub.ps1` :

```powershell
param(
    [Parameter(Mandatory=$true)]
    [string]$Username
)

Write-Host "📤 Publishing to Docker Hub..." -ForegroundColor Cyan

# Login
docker login

$services = @("backend", "frontend", "pause-ai", "reclamation-ai", "rag-service")

foreach ($service in $services) {
    Write-Host "`n🏷️  Tagging logiway-$service..." -ForegroundColor Yellow
    docker tag "logiway-$service:latest" "$Username/logiway-$service:latest"
    
    Write-Host "📤 Pushing $Username/logiway-$service:latest..." -ForegroundColor Yellow
    docker push "$Username/logiway-$service:latest"
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ $service pushed successfully!" -ForegroundColor Green
    } else {
        Write-Host "❌ $service push failed!" -ForegroundColor Red
    }
}

Write-Host "`n🎉 All images published!" -ForegroundColor Green
```

### 🚀 Utilisation des scripts

```powershell
# Build local
.\build-local.ps1

# Publish sur Docker Hub (remplacer 'kossay' par votre username)
.\publish-dockerhub.ps1 -Username "kossay"
```

---

## 7. Dépannage

### ❌ Erreur : "docker: command not found"

**Solution** :
- Vérifier que Docker Desktop est démarré
- Redémarrer Docker Desktop
- Vérifier les variables d'environnement PATH

### ❌ Erreur : "permission denied"

**Solution** :
```powershell
# Se reconnecter à Docker Hub
docker logout
docker login
```

### ❌ Erreur : "no space left on device"

**Solution** :
```powershell
# Nettoyer les images inutilisées
docker system prune -a

# Supprimer les volumes non utilisés
docker volume prune
```

### ❌ Build échoue avec "npm ci failed"

**Solution** :
```powershell
# Supprimer node_modules et package-lock.json
Remove-Item -Recurse -Force frontend/node_modules
Remove-Item frontend/package-lock.json

# Rebuild
docker build --no-cache -t logiway-frontend:latest ./frontend
```

### 🔍 Voir les logs d'un build qui échoue

```powershell
# Build avec logs détaillés
docker build --progress=plain -t logiway-backend:latest ./backend
```

---

## 📚 Commandes Utiles

### Gestion des Images

```powershell
# Lister toutes les images
docker images

# Supprimer une image
docker rmi logiway-backend:latest

# Supprimer toutes les images Logiway
docker images | Select-String "logiway" | ForEach-Object { docker rmi $_.Line.Split()[0]:$_.Line.Split()[1] }

# Voir la taille des images
docker images --format "table {{.Repository}}\t{{.Tag}}\t{{.Size}}"
```

### Gestion des Conteneurs

```powershell
# Lister les conteneurs en cours
docker ps

# Lister tous les conteneurs (même arrêtés)
docker ps -a

# Arrêter tous les conteneurs
docker stop $(docker ps -q)

# Supprimer tous les conteneurs
docker rm $(docker ps -aq)
```

### Nettoyage Complet

```powershell
# Nettoyer tout (images, conteneurs, volumes, cache)
docker system prune -a --volumes

# Voir l'espace utilisé
docker system df
```

---

## 🎯 Workflow Recommandé

### Pour le développement local :

```powershell
# 1. Build des images
docker-compose build

# 2. Démarrer les services
docker-compose up -d

# 3. Voir les logs
docker-compose logs -f

# 4. Tester l'application
# http://localhost:4200 (Frontend)
# http://localhost:8080 (Backend)

# 5. Arrêter
docker-compose down
```

### Pour la production (Docker Hub) :

```powershell
# 1. Build local
.\build-local.ps1

# 2. Tester localement
docker-compose up -d

# 3. Si OK, publier
.\publish-dockerhub.ps1 -Username "votre_username"

# 4. Vérifier sur hub.docker.com
```

### Pour la production (GitHub Actions) :

```bash
# 1. Commit et push
git add .
git commit -m "feat: new feature"
git push origin main

# 2. GitHub Actions build automatiquement
# 3. Vérifier sur GitHub Actions tab
# 4. Images disponibles sur ghcr.io
```

---

## 📞 Support

### Documentation Docker
- [Docker Documentation](https://docs.docker.com/)
- [Docker Hub](https://hub.docker.com)
- [GitHub Container Registry](https://docs.github.com/en/packages/working-with-a-github-packages-registry/working-with-the-container-registry)

### Logs de débogage
```powershell
# Logs backend
docker-compose logs -f backend

# Entrer dans un conteneur
docker exec -it logiway-backend bash

# Inspecter un conteneur
docker inspect logiway-backend
```

---

## ✅ Checklist Avant Publication

- [ ] Toutes les images buildent sans erreur
- [ ] Tests locaux avec `docker-compose up` réussis
- [ ] Variables d'environnement configurées (`.env`)
- [ ] Secrets non inclus dans les images (vérifier `.dockerignore`)
- [ ] Connecté à Docker Hub ou GitHub Container Registry
- [ ] Tags de version correctement appliqués
- [ ] Images taguées et pushées
- [ ] Images visibles sur le registre (public/private)

---

**🎉 Félicitations ! Vous savez maintenant builder et publier vos images Docker !**
