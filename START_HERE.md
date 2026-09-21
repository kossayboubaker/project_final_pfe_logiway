# ⚡ DÉMARRAGE ULTRA-RAPIDE - LOGIWAY PLATFORM

## 🎯 EN 30 SECONDES

```powershell
# 1. Démarrer tous les services
docker-compose up -d

# 2. Attendre 2 minutes ⏱️

# 3. Configurer Keycloak (première fois uniquement)
cd backend
.\kc_setup.ps1
cd ..

# 4. Tester
.\test-services.ps1

# 5. Ouvrir l'application
start http://localhost:4200
```

## 🔑 IDENTIFIANTS

**Application**
- Email: `logiAdmin@logiway.com`
- Mot de passe: `logiwayadmin`

**Keycloak Admin**
- URL: http://localhost:8180
- Username: `admin`
- Mot de passe: `admin`

## 🌐 URLs RAPIDES

| Service | URL |
|---------|-----|
| 🌐 **Application** | http://localhost:4200 |
| 🔐 **Keycloak** | http://localhost:8180 |
| 🔧 **Backend API** | http://localhost:8080 |
| 🤖 **Pause AI** | http://localhost:5000/health |
| 🤖 **Reclamation AI** | http://localhost:5001/health |
| 🤖 **RAG Chatbot** | http://localhost:8001/health |

## ⚙️ COMMANDES ESSENTIELLES

```powershell
# État des services
docker-compose ps

# Test automatique
.\test-services.ps1

# Voir les logs
docker-compose logs -f

# Redémarrer
docker-compose restart

# Arrêter
docker-compose down
```

## 📊 STATUT ACTUEL

✅ **7/7 services opérationnels**
- ✅ MySQL (Base de données)
- ✅ Keycloak (Authentification)
- ✅ Backend (API Spring Boot)
- ✅ Frontend (Interface Angular)
- ✅ Pause AI (ML pauses)
- ✅ Reclamation AI (Validation)
- ✅ RAG Service (Chatbot)

## 🐳 IMAGES DOCKER HUB

Toutes les images sont publiques :

```
kossaybr/logiway-backend:latest
kossaybr/logiway-frontend:latest
kossaybr/logiway-pause-ai:latest
kossaybr/logiway-reclamation-ai:latest
kossaybr/logiway-rag-service:latest
```

## 📚 DOCUMENTATION COMPLÈTE

| Fichier | Description |
|---------|-------------|
| **START_HERE.md** | ⚡ Ce fichier (démarrage rapide) |
| **README_FINAL.md** | 📖 Documentation complète |
| **DEPLOIEMENT_COMPLET.md** | 📊 Rapport de déploiement |
| **GUIDE_DOCKERHUB_USAGE.md** | 🐳 Utilisation Docker Hub |
| **test-services.ps1** | 🧪 Script de test |

## 🚨 PROBLÈME ?

```powershell
# Voir les logs du service problématique
docker-compose logs <nom-service>

# Exemples
docker-compose logs backend
docker-compose logs frontend
docker-compose logs keycloak

# Redémarrer un service
docker-compose restart <nom-service>
```

## 🎉 C'EST TOUT !

L'application est **100% opérationnelle** et prête à être utilisée.

**Prochaine étape** : Ouvrir http://localhost:4200 et se connecter !

---

**Status**: ✅ PRODUCTION READY  
**Services**: 7/7 actifs  
**Images**: Publiées sur Docker Hub  
**Date**: 21 septembre 2026
