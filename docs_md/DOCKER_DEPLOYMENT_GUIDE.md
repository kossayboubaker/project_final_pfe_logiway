# 🐳 GUIDE DE DÉPLOIEMENT DOCKER - LOGIWAY PLATFORM

**Date** : 21 juillet 2026  
**Version** : 3.0 - Architecture Microservices Complète

---

## 📋 TABLE DES MATIÈRES

1. [Vue d'Ensemble](#vue-densemble)
2. [Prérequis](#prérequis)
3. [Architecture Docker](#architecture-docker)
4. [Installation et Configuration](#installation-et-configuration)
5. [Démarrage de la Plateforme](#démarrage-de-la-plateforme)
6. [Vérification et Tests](#vérification-et-tests)
7. [Gestion des Services](#gestion-des-services)
8. [Monitoring et Logs](#monitoring-et-logs)
9. [Troubleshooting](#troubleshooting)
10. [Commandes Utiles](#commandes-utiles)

---

## 🎯 VUE D'ENSEMBLE

La plateforme LogiWay est conteneurisée avec Docker pour faciliter le déploiement et la scalabilité. L'architecture comprend :

### Services Déployés

| Service | Port | Type | Description |
|---------|------|------|-------------|
| **MySQL** | 3306 | Base de données | MySQL 8.0 avec données persistantes |
| **Backend** | 8080 | API REST | Spring Boot 3.2.2 (Java 17) |
| **Frontend** | 4200 | Web UI | Angular 19 + Nginx |
| **Pause AI** | 5000 | ML Service | RandomForest - Prédiction pauses |
| **Réclamation AI** | 5001 | IA Service | Validation bicouche (toxicité + sémantique) |
| **RAG Service** | 8001 | IA Service | Chatbot + Génération rapports (Gemini) |

### Améliorations Apportées

✅ **Sécurité** : Utilisateurs non-root dans tous les conteneurs  
✅ **Performance** : Build multi-stage pour images optimisées  
✅ **Monitoring** : Health checks configurés pour tous les services  
✅ **Persistance** : Volumes Docker pour données, logs, rapports  
✅ **Réseau** : Network bridge isolé pour communication inter-services  
✅ **Configuration** : Variables d'environnement externalisées  

---

## 🔧 PRÉREQUIS

### Logiciels Requis

```bash
# Docker Desktop (Windows)
Version: 24.0+ avec Docker Compose v2

# Vérification installation
docker --version
docker-compose --version
```

**Installation Docker Desktop** :
- Télécharger : https://www.docker.com/products/docker-desktop/
- Activer WSL 2 (Windows Subsystem for Linux)
- Allouer ressources : 4 GB RAM minimum, 2 CPU cores

### Clé API Google Gemini

Le service RAG nécessite une clé API Gemini :

1. Créer un compte : https://makersuite.google.com/
2. Générer une clé API : https://makersuite.google.com/app/apikey
3. Conserver la clé pour configuration `.env`

---

## 🏗️ ARCHITECTURE DOCKER

### Diagramme de Déploiement

```
┌─────────────────────────────────────────────────────────────┐
│                    HOST MACHINE (Windows)                   │
│                                                             │
│  ┌───────────────────────────────────────────────────────┐ │
│  │          Docker Network: logiway-network              │ │
│  │                (172.20.0.0/16)                        │ │
│  │                                                       │ │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐          │ │
│  │  │  MySQL   │  │ Backend  │  │ Frontend │          │ │
│  │  │  :3306   │←─│  :8080   │←─│  :4200   │          │ │
│  │  └──────────┘  └────┬─────┘  └──────────┘          │ │
│  │                     │                                │ │
│  │       ┌─────────────┴─────────────┐                 │ │
│  │       │                           │                 │ │
│  │  ┌────▼─────┐  ┌────▼──────┐  ┌──▼─────────┐      │ │
│  │  │ Pause AI │  │ Réclam. AI│  │ RAG Service│      │ │
│  │  │  :5000   │  │   :5001   │  │   :8001    │      │ │
│  │  └──────────┘  └───────────┘  └────────────┘      │ │
│  │                                                       │ │
│  └───────────────────────────────────────────────────────┘ │
│                                                             │
│  Volumes Persistants:                                      │
│  - mysql-data, backend-logs, pause-ai-data,               │
│    rag-reports, rag-vectorstore, rag-logs                 │
└─────────────────────────────────────────────────────────────┘
```

### Dépendances entre Services

```
MySQL (démarre en premier)
  ↓
Pause AI, Réclamation AI, RAG Service (en parallèle)
  ↓
Backend (attend les 4 services précédents)
  ↓
Frontend (attend Backend)
```

---

## ⚙️ INSTALLATION ET CONFIGURATION

### Étape 1 : Cloner le Projet

```bash
# Si pas encore fait
git clone <repository-url>
cd essais
```

### Étape 2 : Créer le Fichier .env

```bash
# Copier le template
copy .env.example .env
```

**Éditer `.env` avec vos valeurs** :

```env
# Base de données
MYSQL_ROOT_PASSWORD=votre_mot_de_passe_secure
MYSQL_DATABASE=logiway
MYSQL_USER=logiway_user
MYSQL_PASSWORD=votre_mdp_user_secure

# Clé API Gemini (OBLIGATOIRE pour RAG Service)
GEMINI_API_KEY=AIzaSy...votre_cle_api_ici
```

### Étape 3 : Vérifier les Fichiers Docker

Assurez-vous que tous les Dockerfiles sont présents :

```
✅ backend/Dockerfile
✅ frontend/Dockerfile
✅ frontend/nginx.conf
✅ pause-ai-service/Dockerfile
✅ reclamation-ai-service/Dockerfile
✅ rag-service/Dockerfile
✅ docker-compose.yml
```

---

## 🚀 DÉMARRAGE DE LA PLATEFORME

### Option 1 : Démarrage Complet (Recommandé)

```bash
# Build et démarrage de tous les services
docker-compose up -d --build

# Le flag --build force la reconstruction des images
# Le flag -d exécute en arrière-plan (detached mode)
```

**Temps estimé** : 5-10 minutes (premier build)

### Option 2 : Démarrage Sélectif

```bash
# Démarrer uniquement certains services
docker-compose up -d mysql backend frontend

# Ajouter les services IA plus tard
docker-compose up -d pause-ai reclamation-ai rag-service
```

### Suivi du Démarrage en Temps Réel

```bash
# Voir les logs en direct
docker-compose logs -f

# Logs d'un service spécifique
docker-compose logs -f backend
docker-compose logs -f rag-service
```

---

## ✅ VÉRIFICATION ET TESTS

### 1. Vérifier l'État des Conteneurs

```bash
# Liste tous les conteneurs
docker-compose ps

# Résultat attendu : tous les services "Up" et "healthy"
```

**Exemple de sortie** :

```
NAME                   STATUS         PORTS
logiway-mysql          Up (healthy)   0.0.0.0:3306->3306/tcp
logiway-backend        Up (healthy)   0.0.0.0:8080->8080/tcp
logiway-frontend       Up (healthy)   0.0.0.0:4200->80/tcp
logiway-pause-ai       Up (healthy)   0.0.0.0:5000->5000/tcp
logiway-reclamation-ai Up (healthy)   0.0.0.0:5001->5001/tcp
logiway-rag-service    Up (healthy)   0.0.0.0:8001->8001/tcp
```

### 2. Tester les Health Checks

```bash
# MySQL
docker exec logiway-mysql mysqladmin ping -h localhost -u root -p<password>

# Backend
curl http://localhost:8080/actuator/health

# Frontend
curl http://localhost:4200/health

# Pause AI
curl http://localhost:5000/health

# Réclamation AI
curl http://localhost:5001/health

# RAG Service
curl http://localhost:8001/health
```

### 3. Tester les Endpoints Principaux

```bash
# Backend API (doit retourner 401 sans authentification)
curl http://localhost:8080/api/vehicules

# Frontend (doit retourner HTML)
curl http://localhost:4200/

# Pause AI - Prédiction
curl -X POST http://localhost:5000/api/predict \
  -H "Content-Type: application/json" \
  -d '{"trip_id": 1, "hours_driving": 3.5}'

# Réclamation AI - Validation
curl -X POST http://localhost:5001/validate \
  -H "Content-Type: application/json" \
  -d '{"text": "Le véhicule 15 a une panne de frein", "field": "description"}'

# RAG Service - Chat
curl -X POST http://localhost:8001/chat/query \
  -H "Content-Type: application/json" \
  -d '{"message": "Combien de véhicules disponibles ?", "user_id": 1}'
```

### 4. Accès Web

Ouvrir dans le navigateur :

- **Frontend** : http://localhost:4200
- **Backend Swagger** : http://localhost:8080/swagger-ui.html

---

## 🔄 GESTION DES SERVICES

### Arrêt des Services

```bash
# Arrêt propre de tous les services
docker-compose stop

# Arrêt d'un service spécifique
docker-compose stop backend

# Arrêt ET suppression des conteneurs
docker-compose down

# Arrêt + suppression + volumes (⚠️ perte de données)
docker-compose down -v
```

### Redémarrage des Services

```bash
# Redémarrage complet
docker-compose restart

# Redémarrage d'un service
docker-compose restart backend
```

### Rebuild d'un Service

```bash
# Rebuild sans cache (force mise à jour)
docker-compose build --no-cache backend

# Rebuild et redémarrage
docker-compose up -d --build backend
```

### Mise à l'Échelle (Scale)

```bash
# Augmenter le nombre d'instances (si nécessaire)
docker-compose up -d --scale rag-service=3
```

---

## 📊 MONITORING ET LOGS

### Consulter les Logs

```bash
# Tous les logs (temps réel)
docker-compose logs -f

# Logs d'un service avec timestamp
docker-compose logs -f --timestamps backend

# Dernières 100 lignes
docker-compose logs --tail=100 rag-service

# Logs depuis une date
docker-compose logs --since 2026-07-21T10:00:00 pause-ai
```

### Accès Shell dans un Conteneur

```bash
# Backend (Java)
docker exec -it logiway-backend sh

# Frontend (Nginx)
docker exec -it logiway-frontend sh

# Services Python
docker exec -it logiway-pause-ai sh
docker exec -it logiway-rag-service sh
```

### Inspecter les Volumes

```bash
# Liste des volumes
docker volume ls | grep logiway

# Inspecter un volume
docker volume inspect essais_mysql-data
docker volume inspect essais_rag-reports

# Emplacement des volumes sur Windows
# \\wsl$\docker-desktop-data\data\docker\volumes\
```

### Statistiques des Conteneurs

```bash
# CPU, RAM, réseau en temps réel
docker stats

# Stats d'un conteneur spécifique
docker stats logiway-backend
```

---

## 🛠️ TROUBLESHOOTING

### Problème 1 : Service ne démarre pas

**Symptôme** : Conteneur en état "Exit" ou "Unhealthy"

**Diagnostic** :
```bash
# Voir les logs d'erreur
docker-compose logs <service-name>

# Inspecter le conteneur
docker inspect logiway-<service-name>
```

**Solutions** :
- Vérifier les variables d'environnement dans `.env`
- Vérifier les dépendances (MySQL doit démarrer en premier)
- Vérifier les ports disponibles (pas de conflit)

### Problème 2 : Backend ne se connecte pas à MySQL

**Erreur** : `Connection refused` ou `Access denied`

**Solutions** :
```bash
# Vérifier que MySQL est bien démarré
docker-compose ps mysql

# Tester la connexion MySQL
docker exec -it logiway-mysql mysql -u root -p

# Vérifier les logs MySQL
docker-compose logs mysql
```

### Problème 3 : Service RAG échoue (Gemini API)

**Erreur** : `GEMINI_API_KEY not found` ou `API key invalid`

**Solutions** :
1. Vérifier que `GEMINI_API_KEY` est défini dans `.env`
2. Tester la clé API manuellement :
```bash
curl "https://generativelanguage.googleapis.com/v1/models?key=VOTRE_CLE"
```
3. Redémarrer le service RAG après modification :
```bash
docker-compose restart rag-service
```

### Problème 4 : Manque d'espace disque

**Symptôme** : `no space left on device`

**Solutions** :
```bash
# Nettoyer les images non utilisées
docker system prune -a

# Supprimer les volumes orphelins
docker volume prune

# Voir l'espace utilisé
docker system df
```

### Problème 5 : Port déjà utilisé

**Erreur** : `bind: address already in use`

**Solutions** :
```bash
# Windows - Trouver quel process utilise le port
netstat -ano | findstr :8080

# Tuer le process (remplacer PID)
taskkill /PID <PID> /F

# Ou changer le port dans docker-compose.yml
ports:
  - "8081:8080"  # Port host:container
```

---

## 📝 COMMANDES UTILES

### Build et Déploiement

```bash
# Build sans cache
docker-compose build --no-cache

# Build parallèle (plus rapide)
docker-compose build --parallel

# Pull des images de base
docker-compose pull

# Push vers registry (si configuré)
docker-compose push
```

### Nettoyage

```bash
# Supprimer tous les conteneurs arrêtés
docker container prune

# Supprimer toutes les images non utilisées
docker image prune -a

# Nettoyage complet du système
docker system prune -a --volumes

# Supprimer un volume spécifique
docker volume rm essais_rag-reports
```

### Backup et Restore

```bash
# Backup MySQL
docker exec logiway-mysql mysqldump -u root -p<password> logiway > backup.sql

# Restore MySQL
docker exec -i logiway-mysql mysql -u root -p<password> logiway < backup.sql

# Backup volume (rapports RAG)
docker run --rm -v essais_rag-reports:/data -v $(pwd):/backup alpine tar czf /backup/rag-reports-backup.tar.gz -C /data .

# Restore volume
docker run --rm -v essais_rag-reports:/data -v $(pwd):/backup alpine tar xzf /backup/rag-reports-backup.tar.gz -C /data
```

### Réseau

```bash
# Inspecter le réseau Docker
docker network inspect essais_logiway-network

# Lister les connexions réseau
docker network ls

# Tester la connectivité entre services
docker exec logiway-backend ping logiway-mysql
docker exec logiway-backend curl http://pause-ai:5000/health
```

---

## 🎯 CHECKLIST DE DÉPLOIEMENT

### Avant le Démarrage

- [ ] Docker Desktop installé et en cours d'exécution
- [ ] Fichier `.env` créé et configuré
- [ ] Clé API Gemini valide ajoutée
- [ ] Ports 3306, 4200, 5000, 5001, 8001, 8080 disponibles
- [ ] Au moins 4 GB RAM alloués à Docker

### Démarrage

- [ ] `docker-compose up -d --build` exécuté
- [ ] Tous les services en état "Up (healthy)"
- [ ] Health checks réussis pour tous les services
- [ ] Frontend accessible sur http://localhost:4200
- [ ] Backend Swagger accessible sur http://localhost:8080/swagger-ui.html

### Tests Post-Déploiement

- [ ] Connexion frontend → backend OK
- [ ] Backend → MySQL connexion OK
- [ ] Backend → Services IA communication OK
- [ ] RAG Service → MySQL connexion OK
- [ ] Génération rapport PDF test OK
- [ ] Chatbot RAG test OK
- [ ] Validation réclamation test OK
- [ ] Prédiction pause ML test OK

---

## 📞 SUPPORT

### Logs Complets pour Debug

```bash
# Exporter tous les logs dans un fichier
docker-compose logs > logiway-logs-$(date +%Y%m%d-%H%M%S).log
```

### Informations Système

```bash
# Versions Docker
docker version
docker-compose version

# Informations système
docker info

# État des services
docker-compose ps
docker stats --no-stream
```

---

## 🎓 RESSOURCES

- **Documentation Docker** : https://docs.docker.com/
- **Docker Compose Reference** : https://docs.docker.com/compose/compose-file/
- **Spring Boot Docker** : https://spring.io/guides/gs/spring-boot-docker/
- **Angular Docker** : https://angular.io/guide/deployment
- **Google Gemini API** : https://ai.google.dev/docs

---

**Version du guide** : 1.0.0  
**Dernière mise à jour** : 21 juillet 2026  
**Statut** : ✅ Prêt pour production
