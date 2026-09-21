# 🐳 Guide d'Utilisation des Images Docker Hub

## 📦 Images Disponibles sur Docker Hub

Toutes les images Logiway sont publiques et accessibles sur Docker Hub :

```
kossaybr/logiway-backend:latest          (542 MB)
kossaybr/logiway-frontend:latest         (87 MB)
kossaybr/logiway-pause-ai:latest         (1.32 GB)
kossaybr/logiway-reclamation-ai:latest   (243 MB)
kossaybr/logiway-rag-service:latest      (957 MB)
```

**Total**: ~3.5 GB

**Lien Docker Hub**: https://hub.docker.com/u/kossaybr

---

## 🚀 Déploiement Rapide (1 Minute)

### Prérequis

- Docker installé
- Docker Compose installé
- Port 3306, 4200, 5000, 5001, 8001, 8080, 8180 disponibles

### Étapes

1. **Créer un dossier de travail** :
   ```powershell
   mkdir logiway-deploy
   cd logiway-deploy
   ```

2. **Télécharger le docker-compose.yml** :
   
   Créer le fichier `docker-compose.yml` avec le contenu complet (voir section ci-dessous)

3. **Créer le fichier .env** :
   ```powershell
   # Copier le contenu de .env.example
   # Ou utiliser les valeurs par défaut
   ```

4. **Lancer l'application** :
   ```powershell
   docker-compose pull
   docker-compose up -d
   ```

5. **Vérifier** :
   ```powershell
   docker-compose ps
   ```

6. **Accéder à l'application** :
   - Frontend: http://localhost:4200
   - Keycloak: http://localhost:8180

---

## 📋 Fichier docker-compose.yml Minimal

Voici le fichier minimal pour déployer Logiway depuis Docker Hub :

```yaml
version: "3.8"

services:
  mysql:
    image: mysql:8.0
    container_name: logiway-mysql
    restart: unless-stopped
    ports:
      - "3306:3306"
    environment:
      MYSQL_ROOT_PASSWORD: logiway2024
      MYSQL_DATABASE: logiway
      MYSQL_USER: logiway_user
      MYSQL_PASSWORD: logiway_pass
    volumes:
      - mysql-data:/var/lib/mysql
    command: --default-authentication-plugin=mysql_native_password
    healthcheck:
      test: ["CMD", "mysqladmin", "ping", "-h", "localhost", "-u", "root", "-plogiway2024"]
      interval: 10s
      timeout: 5s
      retries: 5
    networks:
      - logiway-network

  keycloak:
    image: quay.io/keycloak/keycloak:24.0
    container_name: logiway-keycloak
    restart: unless-stopped
    ports:
      - "8180:8080"
    environment:
      KEYCLOAK_ADMIN: admin
      KEYCLOAK_ADMIN_PASSWORD: admin
      KC_DB: mysql
      KC_DB_URL: jdbc:mysql://mysql:3306/logiway
      KC_DB_USERNAME: logiway_user
      KC_DB_PASSWORD: logiway_pass
      KC_HOSTNAME_STRICT: false
      KC_HTTP_ENABLED: true
    command: start-dev
    depends_on:
      mysql:
        condition: service_healthy
    networks:
      - logiway-network

  pause-ai:
    image: kossaybr/logiway-pause-ai:latest
    container_name: logiway-pause-ai
    restart: unless-stopped
    ports:
      - "5000:5000"
    environment:
      OSRM_URL: https://router.project-osrm.org
      DEBUG: false
      FLASK_ENV: production
    networks:
      - logiway-network
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:5000/health"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 30s

  reclamation-ai:
    image: kossaybr/logiway-reclamation-ai:latest
    container_name: logiway-reclamation-ai
    restart: unless-stopped
    ports:
      - "5001:5001"
    environment:
      FLASK_ENV: production
      PORT: 5001
    networks:
      - logiway-network
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:5001/health"]
      interval: 30s
      timeout: 5s
      retries: 3

  rag-service:
    image: kossaybr/logiway-rag-service:latest
    container_name: logiway-rag-service
    restart: unless-stopped
    ports:
      - "8001:8001"
    environment:
      DB_HOST: mysql
      DB_PORT: 3306
      DB_NAME: logiway
      DB_USER: logiway_user
      DB_PASSWORD: logiway_pass
      PORT: 8001
    depends_on:
      mysql:
        condition: service_healthy
    networks:
      - logiway-network
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:8001/health"]
      interval: 30s
      timeout: 10s
      start_period: 60s

  backend:
    image: kossaybr/logiway-backend:latest
    container_name: logiway-backend
    restart: unless-stopped
    ports:
      - "8080:8080"
    environment:
      SPRING_DATASOURCE_URL: jdbc:mysql://mysql:3306/logiway?useSSL=false&serverTimezone=UTC
      SPRING_DATASOURCE_USERNAME: logiway_user
      SPRING_DATASOURCE_PASSWORD: logiway_pass
      KEYCLOAK_SERVER_URL: http://keycloak:8080
      KEYCLOAK_REALM: logiway
      KEYCLOAK_CLIENT_ID: logiway
      PAUSE_AI_SERVICE_URL: http://pause-ai:5000
      RECLAMATION_AI_SERVICE_URL: http://reclamation-ai:5001
      RAG_SERVICE_URL: http://rag-service:8001
      CORS_ALLOWED_ORIGINS: http://localhost:4200
    depends_on:
      mysql:
        condition: service_healthy
      pause-ai:
        condition: service_healthy
      reclamation-ai:
        condition: service_healthy
      rag-service:
        condition: service_healthy
    networks:
      - logiway-network

  frontend:
    image: kossaybr/logiway-frontend:latest
    container_name: logiway-frontend
    restart: unless-stopped
    ports:
      - "4200:80"
    environment:
      BACKEND_URL: http://localhost:8080
      KEYCLOAK_URL: http://localhost:8180
      KEYCLOAK_REALM: logiway
      KEYCLOAK_CLIENT_ID: logiway
    depends_on:
      - backend
    networks:
      - logiway-network

volumes:
  mysql-data:
    driver: local

networks:
  logiway-network:
    driver: bridge
```

---

## ⚙️ Configuration Keycloak (Obligatoire)

Après le premier démarrage, configurez Keycloak :

### Option 1: Configuration Manuelle

1. **Accéder à Keycloak** : http://localhost:8180
2. **Se connecter** : admin / admin
3. **Créer le realm** : `logiway`
4. **Créer le client** : `logiway` (public, direct access grants enabled)
5. **Configurer les URLs** :
   - Valid redirect URIs: `http://localhost:4200/*`
   - Web origins: `http://localhost:4200`

### Option 2: Script PowerShell

Télécharger et exécuter le script `kc_setup.ps1` :

```powershell
# Attendre que Keycloak soit démarré
Start-Sleep -Seconds 60

# Exécuter le script
.\kc_setup.ps1
```

Le script crée automatiquement :
- Realm `logiway`
- Client `logiway`
- Utilisateur admin: `logiAdmin@logiway.com` / `logiwayadmin`
- Rôle `SUPERADMIN`

---

## 🔑 API Keys (Optionnel)

Pour activer les fonctionnalités IA avancées, ajoutez les API keys dans le fichier `.env` :

```env
# Google Gemini (pour le chatbot RAG)
GEMINI_API_KEY=votre_cle_api

# OpenWeather (pour les données météo)
OPENWEATHER_API_KEY=votre_cle_api
```

Puis redémarrez :
```powershell
docker-compose restart backend rag-service
```

---

## 📊 Commandes Utiles

### Gestion de Base

```powershell
# Démarrer tous les services
docker-compose up -d

# Arrêter tous les services
docker-compose down

# Voir l'état des services
docker-compose ps

# Voir les logs
docker-compose logs -f

# Redémarrer un service
docker-compose restart backend
```

### Mise à Jour

```powershell
# Télécharger les dernières versions
docker-compose pull

# Redémarrer avec les nouvelles images
docker-compose up -d
```

### Nettoyage

```powershell
# Supprimer tous les conteneurs et volumes
docker-compose down -v

# Supprimer les images (pour libérer de l'espace)
docker rmi kossaybr/logiway-backend:latest
docker rmi kossaybr/logiway-frontend:latest
docker rmi kossaybr/logiway-pause-ai:latest
docker rmi kossaybr/logiway-reclamation-ai:latest
docker rmi kossaybr/logiway-rag-service:latest
```

---

## 🌐 Accès aux Services

Une fois déployé :

| Service | URL | Identifiants |
|---------|-----|--------------|
| **Frontend** | http://localhost:4200 | Via Keycloak |
| **Backend API** | http://localhost:8080 | JWT |
| **Keycloak** | http://localhost:8180 | admin / admin |
| **Pause AI** | http://localhost:5000/health | - |
| **Reclamation AI** | http://localhost:5001/health | - |
| **RAG Service** | http://localhost:8001/health | - |
| **MySQL** | localhost:3306 | logiway_user / logiway_pass |

---

## 🔍 Troubleshooting

### Les images ne se téléchargent pas

```powershell
# Vérifier la connexion Docker Hub
docker login

# Forcer le téléchargement
docker pull kossaybr/logiway-backend:latest
```

### Service ne démarre pas

```powershell
# Voir les logs du service
docker-compose logs <nom-du-service>

# Exemple
docker-compose logs backend
```

### Port déjà utilisé

```powershell
# Trouver le processus
netstat -ano | findstr :8080

# Changer le port dans docker-compose.yml
ports:
  - "8081:8080"  # Port hôte modifié
```

### Manque de mémoire

Les services IA nécessitent ~4 GB de RAM. Pour limiter :

```yaml
services:
  pause-ai:
    deploy:
      resources:
        limits:
          memory: 1G
```

---

## 📦 Versions des Images

### Dernière Version

```
backend:          latest (2026-09-21)
frontend:         latest (2026-09-21)
pause-ai:         latest (2026-09-21)
reclamation-ai:   latest (2026-09-21)
rag-service:      latest (2026-09-21)
```

### Changelog

**Version latest (2026-09-21)**
- ✅ Publication initiale sur Docker Hub
- ✅ Images optimisées et testées
- ✅ Support complet des fonctionnalités
- ✅ Configuration Docker Compose prête

---

## 🚀 Déploiement Production

Pour un déploiement en production :

1. **Changer tous les mots de passe** dans `.env`
2. **Activer HTTPS** (reverse proxy Nginx/Traefik)
3. **Configurer les backups** MySQL
4. **Ajouter le monitoring** (Prometheus/Grafana)
5. **Utiliser des secrets** Docker pour les credentials
6. **Configurer les health checks** avancés
7. **Ajouter un WAF** si exposition publique

---

## 📞 Support

- **Docker Hub**: https://hub.docker.com/u/kossaybr
- **Documentation**: Voir fichiers MD dans le projet
- **Issues**: Contacter l'équipe de développement

---

## ✅ Checklist de Déploiement

- [ ] Docker et Docker Compose installés
- [ ] Ports nécessaires disponibles
- [ ] Fichiers docker-compose.yml et .env créés
- [ ] Images téléchargées (`docker-compose pull`)
- [ ] Services démarrés (`docker-compose up -d`)
- [ ] Tous les services healthy (`docker-compose ps`)
- [ ] Keycloak configuré (realm + client)
- [ ] Frontend accessible (http://localhost:4200)
- [ ] Backend répond (http://localhost:8080/actuator/health)
- [ ] Connexion utilisateur testée

---

**Guide créé le**: 21 septembre 2026  
**Dernière mise à jour**: 21 septembre 2026  
**Version**: 1.0
