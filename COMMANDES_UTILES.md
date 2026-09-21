# 🔧 COMMANDES UTILES - LOGIWAY PLATFORM

Guide rapide des commandes les plus fréquentes pour gérer la plateforme Logiway.

---

## 🚀 DÉMARRAGE / ARRÊT

```powershell
# Démarrer tous les services
docker-compose up -d

# Arrêter tous les services
docker-compose down

# Arrêter et supprimer les volumes (⚠️ perte de données)
docker-compose down -v

# Redémarrer tous les services
docker-compose restart

# Redémarrer un service spécifique
docker-compose restart backend
docker-compose restart frontend
```

---

## 📊 MONITORING / ÉTAT

```powershell
# Voir l'état de tous les services
docker-compose ps

# Voir les statistiques en temps réel
docker stats

# Voir l'utilisation disque
docker system df

# Test automatique de tous les services
.\test-services.ps1

# Vérifier la santé d'un service
docker inspect logiway-backend --format='{{.State.Health.Status}}'
```

---

## 📝 LOGS

```powershell
# Voir tous les logs
docker-compose logs

# Logs en temps réel (tous services)
docker-compose logs -f

# Logs d'un service spécifique
docker-compose logs backend
docker-compose logs frontend
docker-compose logs keycloak
docker-compose logs pause-ai
docker-compose logs reclamation-ai
docker-compose logs rag-service
docker-compose logs mysql

# Logs en temps réel d'un service
docker-compose logs -f backend

# Dernières 100 lignes
docker-compose logs --tail=100

# Logs avec timestamp
docker-compose logs -t

# Logs depuis une date
docker-compose logs --since 2026-09-21
docker-compose logs --since 30m  # Dernières 30 minutes
```

---

## 🔄 MISE À JOUR

```powershell
# Télécharger les dernières images
docker-compose pull

# Recréer et redémarrer avec les nouvelles images
docker-compose up -d --force-recreate

# Rebuild et redémarrer un service spécifique
docker-compose up -d --build backend

# Pull d'une image spécifique depuis Docker Hub
docker pull kossaybr/logiway-backend:latest
docker pull kossaybr/logiway-frontend:latest
docker pull kossaybr/logiway-pause-ai:latest
docker pull kossaybr/logiway-reclamation-ai:latest
docker pull kossaybr/logiway-rag-service:latest
```

---

## 🧪 TESTS

```powershell
# Test automatique complet
.\test-services.ps1

# Test backend
curl -UseBasicParsing http://localhost:8080/actuator/health

# Test services IA
curl -UseBasicParsing http://localhost:5000/health
curl -UseBasicParsing http://localhost:5001/health
curl -UseBasicParsing http://localhost:8001/health

# Test Keycloak
curl -UseBasicParsing http://localhost:8180

# Ouvrir le frontend dans le navigateur
start http://localhost:4200
```

---

## 🗄️ BASE DE DONNÉES

```powershell
# Accéder à MySQL en ligne de commande
docker exec -it logiway-mysql mysql -u logiway_user -plogiway_pass logiway

# Backup de la base de données
docker exec logiway-mysql mysqldump -u logiway_user -plogiway_pass logiway > backup_$(Get-Date -Format 'yyyyMMdd_HHmmss').sql

# Restaurer un backup
Get-Content backup.sql | docker exec -i logiway-mysql mysql -u logiway_user -plogiway_pass logiway

# Voir les tables
docker exec logiway-mysql mysql -u logiway_user -plogiway_pass -e "USE logiway; SHOW TABLES;"

# Exporter une table spécifique
docker exec logiway-mysql mysqldump -u logiway_user -plogiway_pass logiway ma_table > ma_table.sql
```

---

## 🔐 KEYCLOAK

```powershell
# Configuration automatique
cd backend
.\kc_setup.ps1
cd ..

# Ouvrir l'admin console
start http://localhost:8180

# Voir les logs Keycloak
docker-compose logs -f keycloak

# Redémarrer Keycloak
docker-compose restart keycloak
```

---

## 🧹 NETTOYAGE

```powershell
# Supprimer les conteneurs arrêtés
docker container prune

# Supprimer les images inutilisées
docker image prune

# Supprimer les images inutilisées (aggressive)
docker image prune -a

# Supprimer les volumes non utilisés
docker volume prune

# Supprimer les réseaux non utilisés
docker network prune

# Nettoyage complet (⚠️ attention)
docker system prune -a --volumes

# Voir l'espace libéré potentiel
docker system df
```

---

## 🔍 INSPECTION

```powershell
# Voir les détails d'un conteneur
docker inspect logiway-backend

# Voir les variables d'environnement d'un conteneur
docker exec logiway-backend env

# Voir les processus dans un conteneur
docker top logiway-backend

# Voir les ports exposés
docker port logiway-backend

# Entrer dans un conteneur (shell)
docker exec -it logiway-backend sh
docker exec -it logiway-mysql bash

# Voir la configuration réseau
docker network inspect kossay_pfe_files_logiway-network

# Voir les volumes
docker volume ls
docker volume inspect kossay_pfe_files_mysql-data
```

---

## 📦 IMAGES

```powershell
# Lister les images
docker images

# Lister les images Logiway
docker images | Select-String "logiway"

# Supprimer une image
docker rmi logiway-backend:latest

# Forcer la suppression
docker rmi -f logiway-backend:latest

# Build d'une image
docker build -t logiway-backend:latest ./backend

# Tag d'une image
docker tag logiway-backend:latest kossaybr/logiway-backend:latest

# Push vers Docker Hub
docker push kossaybr/logiway-backend:latest

# Pull depuis Docker Hub
docker pull kossaybr/logiway-backend:latest
```

---

## 🔄 VOLUMES

```powershell
# Lister les volumes
docker volume ls

# Voir les détails d'un volume
docker volume inspect kossay_pfe_files_mysql-data

# Supprimer un volume
docker volume rm kossay_pfe_files_mysql-data

# Backup d'un volume
docker run --rm -v kossay_pfe_files_mysql-data:/data -v ${PWD}:/backup ubuntu tar czf /backup/mysql-backup.tar.gz -C /data .

# Restaurer un volume
docker run --rm -v kossay_pfe_files_mysql-data:/data -v ${PWD}:/backup ubuntu tar xzf /backup/mysql-backup.tar.gz -C /data
```

---

## 🌐 RÉSEAU

```powershell
# Lister les réseaux
docker network ls

# Voir les détails du réseau Logiway
docker network inspect kossay_pfe_files_logiway-network

# Voir les conteneurs sur le réseau
docker network inspect kossay_pfe_files_logiway-network --format='{{range .Containers}}{{.Name}} {{.IPv4Address}}{{println}}{{end}}'

# Tester la connectivité entre services
docker exec logiway-backend ping mysql
docker exec logiway-backend ping keycloak
```

---

## 🔧 CONFIGURATION

```powershell
# Éditer les variables d'environnement
notepad .env

# Valider le docker-compose.yml
docker-compose config

# Voir la configuration finale (avec substitutions)
docker-compose config

# Redémarrer après changement de config
docker-compose up -d --force-recreate
```

---

## 🚨 DÉPANNAGE

```powershell
# Service ne démarre pas - voir les logs
docker-compose logs <nom-service>

# Service crash en boucle - voir les événements
docker events --filter container=logiway-backend

# Vérifier les ports occupés
netstat -ano | findstr :8080
netstat -ano | findstr :4200

# Tester la connectivité réseau
docker exec logiway-backend curl http://mysql:3306
docker exec logiway-backend curl http://keycloak:8080

# Recréer un service problématique
docker-compose rm -f backend
docker-compose up -d backend

# Vérifier les ressources disponibles
docker stats --no-stream
```

---

## 🔐 SÉCURITÉ

```powershell
# Scanner les vulnérabilités d'une image
docker scan kossaybr/logiway-backend:latest

# Voir les secrets d'un conteneur (⚠️)
docker exec logiway-backend env | Select-String "PASSWORD"
docker exec logiway-backend env | Select-String "SECRET"

# Changer les mots de passe
# Éditer .env et redémarrer
notepad .env
docker-compose restart
```

---

## 📊 PERFORMANCE

```powershell
# Statistiques en temps réel
docker stats

# Statistiques d'un service spécifique
docker stats logiway-backend

# Limiter la mémoire d'un service (dans docker-compose.yml)
# services:
#   backend:
#     deploy:
#       resources:
#         limits:
#           memory: 1G

# Voir l'utilisation CPU/RAM d'un conteneur
docker stats --no-stream logiway-backend
```

---

## 🛠️ DÉVELOPPEMENT

```powershell
# Build local de toutes les images
.\build-local.ps1

# Build d'un service spécifique
docker-compose build backend

# Rebuild sans cache
docker-compose build --no-cache backend

# Mode développement (logs en temps réel)
docker-compose up

# Suivre les logs de plusieurs services
docker-compose logs -f backend frontend
```

---

## 🚀 PUBLICATION

```powershell
# Publier sur Docker Hub
.\publish-dockerhub-simple.ps1

# Publier sur GitHub Container Registry
.\publish-github.ps1

# Tag et push manuel
docker tag logiway-backend:latest kossaybr/logiway-backend:latest
docker push kossaybr/logiway-backend:latest
```

---

## 📱 ACCÈS RAPIDE

```powershell
# Ouvrir le frontend
start http://localhost:4200

# Ouvrir Keycloak admin
start http://localhost:8180

# Ouvrir la documentation API (si disponible)
start http://localhost:8080/swagger-ui.html

# Ouvrir l'actuator
start http://localhost:8080/actuator
```

---

## 🎯 COMMANDES LES PLUS UTILISÉES

Top 10 des commandes quotidiennes :

```powershell
# 1. Démarrer l'application
docker-compose up -d

# 2. Voir l'état
docker-compose ps

# 3. Voir les logs
docker-compose logs -f backend

# 4. Tester
.\test-services.ps1

# 5. Redémarrer un service
docker-compose restart backend

# 6. Voir les logs récents
docker-compose logs --tail=100 backend

# 7. Backup base de données
docker exec logiway-mysql mysqldump -u logiway_user -plogiway_pass logiway > backup.sql

# 8. Arrêter
docker-compose down

# 9. Mettre à jour
docker-compose pull && docker-compose up -d

# 10. Ouvrir l'application
start http://localhost:4200
```

---

## 📖 AIDE

```powershell
# Aide Docker
docker --help
docker-compose --help

# Aide sur une commande spécifique
docker logs --help
docker-compose up --help

# Version Docker
docker --version
docker-compose --version

# Information système Docker
docker info
docker version
```

---

## 🔗 LIENS UTILES

- **Application**: http://localhost:4200
- **Keycloak**: http://localhost:8180
- **Backend**: http://localhost:8080
- **Docker Hub**: https://hub.docker.com/u/kossaybr

---

**Ce fichier contient les commandes les plus utiles pour gérer la plateforme Logiway au quotidien.**

**Astuce**: Utilisez `Ctrl+F` pour rechercher une commande spécifique !
