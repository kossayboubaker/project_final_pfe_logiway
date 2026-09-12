# 🚀 GUIDE DE DÉPLOIEMENT RAPIDE - LOGIWAY v3.1

## ⚡ DÉMARRAGE RAPIDE (5 minutes)

### Prérequis
```bash
✅ Java 17+
✅ Node.js 18+
✅ MySQL 8+
✅ Python 3.9+
```

### 1. Base de données
```bash
# Créer la base de données
mysql -u root -p
CREATE DATABASE logiway_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
exit;
```

### 2. Backend
```bash
cd backend

# Configuration (backend/.env)
DB_URL=jdbc:mysql://localhost:3306/logiway_db
DB_USERNAME=root
DB_PASSWORD=your_password
PAUSE_AI_URL=http://localhost:5000

# Démarrer
./mvnw spring-boot:run

# Vérifier
curl http://localhost:8080/actuator/health
# Réponse: {"status":"UP"}
```

### 3. Service ML Python
```bash
cd pause-ai-service

# Installer dépendances
pip install -r requirements.txt

# Démarrer
python app.py

# Vérifier
curl http://localhost:5000/health
# Réponse: {"status":"healthy"}
```

### 4. Frontend
```bash
cd frontend

# Installer dépendances
npm install

# Démarrer
ng serve

# Ouvrir navigateur
http://localhost:4200
```

---

## 🧪 TEST RAPIDE

### Test Backend
```bash
# 1. Login SuperAdmin
curl -X POST http://localhost:8080/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"superadmin@logiway.com","password":"Password123!"}'

# 2. Copier le token JWT

# 3. Test KPI Dashboard
curl -X GET http://localhost:8080/api/admin/kpi/overview \
  -H "Authorization: Bearer <TOKEN>"

# Réponse: JSON avec cards, punctualityLast12Months, topDrivers, etc.
```

### Test Frontend
```
1. Ouvrir http://localhost:4200
2. Login: superadmin@logiway.com / Password123!
3. Naviguer vers SuperAdmin Dashboard
4. Vérifier que les KPI cards affichent des données
5. Vérifier que les 7 graphiques s'affichent
6. Vérifier la table Top Drivers
```

---

## 📊 ENDPOINTS DISPONIBLES

### Authentification
```
POST   /api/auth/login
POST   /api/auth/register
POST   /api/auth/refresh
GET    /api/auth/me
```

### Pause IA
```
POST   /api/pauseai/evaluer/{trajetId}
GET    /api/pauseai/historique/{chauffeurId}
GET    /api/pauseai/dashboard
GET    /api/pauseai/trajets/{trajetId}/pauses-completes
```

### Admin KPI
```
GET    /api/admin/kpi/overview
```

### Trajets
```
GET    /api/trajets
POST   /api/trajets
PUT    /api/trajets/{id}
DELETE /api/trajets/{id}
GET    /api/trajets/{id}
```

### Véhicules
```
GET    /api/vehicules
POST   /api/vehicules
PUT    /api/vehicules/{id}
DELETE /api/vehicules/{id}
```

### Chauffeurs
```
GET    /api/chauffeurs
POST   /api/chauffeurs
PUT    /api/chauffeurs/{id}
DELETE /api/chauffeurs/{id}
```

### Réclamations
```
GET    /api/reclamations
POST   /api/reclamations
PUT    /api/reclamations/{id}
DELETE /api/reclamations/{id}
```

### Congés
```
GET    /api/conges
POST   /api/conges
PUT    /api/conges/{id}
DELETE /api/conges/{id}
PATCH  /api/conges/{id}/statut
```

---

## 🔧 CONFIGURATION

### Backend (application.yml)
```yaml
server:
  port: 8080

spring:
  datasource:
    url: ${DB_URL}
    username: ${DB_USERNAME}
    password: ${DB_PASSWORD}
  jpa:
    hibernate:
      ddl-auto: validate
    show-sql: false

pause:
  ai:
    url: ${PAUSE_AI_URL:http://localhost:5000}
    scheduler:
      enabled: true
      interval: 120000  # 2 minutes

jwt:
  secret: ${JWT_SECRET:your-secret-key-min-32-chars}
  expiration: 86400000  # 24h
```

### Frontend (environment.ts)
```typescript
export const environment = {
  production: false,
  apiUrl: 'http://localhost:8080/api'
};
```

### Python ML (app.py)
```python
app.config['MODEL_PATH'] = 'models/pause_model_rf_v3.pkl'
app.config['SCALER_PATH'] = 'models/pause_scaler_v3.pkl'
app.config['HOST'] = '0.0.0.0'
app.config['PORT'] = 5000
```

---

## 🐳 DÉPLOIEMENT DOCKER

### Créer les images
```bash
# Backend
cd backend
docker build -t logiway-backend:v3.1 .

# Frontend
cd frontend
docker build -t logiway-frontend:v3.1 .

# ML Service
cd pause-ai-service
docker build -t logiway-ml:v3.1 .
```

### Lancer avec docker-compose
```yaml
# docker-compose.yml
version: '3.8'

services:
  mysql:
    image: mysql:8.0
    environment:
      MYSQL_DATABASE: logiway_db
      MYSQL_ROOT_PASSWORD: root_password
    ports:
      - "3306:3306"
    volumes:
      - mysql_data:/var/lib/mysql

  backend:
    image: logiway-backend:v3.1
    environment:
      DB_URL: jdbc:mysql://mysql:3306/logiway_db
      DB_USERNAME: root
      DB_PASSWORD: root_password
      PAUSE_AI_URL: http://ml-service:5000
    ports:
      - "8080:8080"
    depends_on:
      - mysql
      - ml-service

  ml-service:
    image: logiway-ml:v3.1
    ports:
      - "5000:5000"
    volumes:
      - ./models:/app/models

  frontend:
    image: logiway-frontend:v3.1
    ports:
      - "80:80"
    depends_on:
      - backend

volumes:
  mysql_data:
```

```bash
# Lancer tous les services
docker-compose up -d

# Vérifier les logs
docker-compose logs -f

# Arrêter
docker-compose down
```

---

## 📦 BUILD PRODUCTION

### Backend
```bash
cd backend

# Build JAR
./mvnw clean package -DskipTests

# JAR créé: target/logiway-backend-v3.1.jar

# Lancer en production
java -jar target/logiway-backend-v3.1.jar \
  --spring.profiles.active=prod \
  --server.port=8080
```

### Frontend
```bash
cd frontend

# Build optimisé
ng build --configuration production

# Fichiers créés: dist/frontend/

# Servir avec nginx
sudo cp -r dist/frontend/* /var/www/html/
```

### ML Service
```bash
cd pause-ai-service

# Créer requirements.txt
pip freeze > requirements.txt

# Build avec gunicorn (production)
gunicorn -w 4 -b 0.0.0.0:5000 app:app

# Ou avec Docker
docker build -t logiway-ml:v3.1 .
docker run -p 5000:5000 logiway-ml:v3.1
```

---

## 🔒 SÉCURITÉ PRODUCTION

### Backend
```yaml
# application-prod.yml
spring:
  datasource:
    url: ${DB_URL}  # Ne jamais hardcoder
    username: ${DB_USERNAME}
    password: ${DB_PASSWORD}
  jpa:
    show-sql: false  # Désactiver en prod
    hibernate:
      ddl-auto: validate  # Jamais create/update en prod

server:
  ssl:
    enabled: true
    key-store: classpath:keystore.p12
    key-store-password: ${KEYSTORE_PASSWORD}

logging:
  level:
    root: INFO
    com.logiway: INFO

jwt:
  secret: ${JWT_SECRET}  # Min 32 caractères
  expiration: 3600000  # 1h en prod (24h en dev)
```

### Frontend
```typescript
// environment.prod.ts
export const environment = {
  production: true,
  apiUrl: 'https://api.logiway.com/api'  // HTTPS obligatoire
};
```

### Nginx (Reverse Proxy)
```nginx
# /etc/nginx/sites-available/logiway
server {
    listen 80;
    server_name logiway.com www.logiway.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name logiway.com www.logiway.com;

    ssl_certificate /etc/letsencrypt/live/logiway.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/logiway.com/privkey.pem;

    # Frontend
    location / {
        root /var/www/html;
        try_files $uri $uri/ /index.html;
    }

    # Backend API
    location /api/ {
        proxy_pass http://localhost:8080/api/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }

    # ML Service
    location /ml/ {
        proxy_pass http://localhost:5000/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

---

## 📈 MONITORING

### Health Checks
```bash
# Backend
curl http://localhost:8080/actuator/health

# ML Service
curl http://localhost:5000/health

# Frontend
curl http://localhost:4200
```

### Logs
```bash
# Backend
tail -f backend/logs/application.log

# ML Service
tail -f pause-ai-service/logs/ml.log

# Nginx
tail -f /var/log/nginx/access.log
tail -f /var/log/nginx/error.log
```

### Métriques
```bash
# Backend actuator endpoints
curl http://localhost:8080/actuator/metrics
curl http://localhost:8080/actuator/metrics/jvm.memory.used
curl http://localhost:8080/actuator/metrics/http.server.requests
```

---

## 🐛 TROUBLESHOOTING

### Backend ne démarre pas
```bash
# Vérifier Java version
java -version  # Doit être 17+

# Vérifier MySQL
mysql -u root -p -e "SHOW DATABASES;"

# Vérifier port 8080 libre
netstat -an | grep 8080

# Vérifier logs
tail -f backend/logs/application.log
```

### Frontend erreur CORS
```java
// Backend: SecurityConfig.java
@Bean
public CorsConfigurationSource corsConfigurationSource() {
    CorsConfiguration configuration = new CorsConfiguration();
    configuration.setAllowedOrigins(Arrays.asList("http://localhost:4200"));
    configuration.setAllowedMethods(Arrays.asList("GET","POST","PUT","DELETE","PATCH"));
    configuration.setAllowedHeaders(Arrays.asList("*"));
    configuration.setAllowCredentials(true);
    UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
    source.registerCorsConfiguration("/api/**", configuration);
    return source;
}
```

### ML Service erreur modèle
```bash
# Vérifier que les fichiers modèle existent
ls -la pause-ai-service/models/
# Doit contenir:
# - pause_model_rf_v3.pkl
# - pause_scaler_v3.pkl

# Réentraîner si nécessaire
cd pause-ai-service
python train_model.py
```

### Dashboard affiche zéros
```bash
# 1. Vérifier données en base
mysql -u root -p logiway_db -e "
SELECT COUNT(*) as trajets FROM trajets;
SELECT COUNT(*) as chauffeurs FROM chauffeurs;
SELECT COUNT(*) as vehicules FROM vehicules;
"

# 2. Vérifier endpoint backend
curl -X GET http://localhost:8080/api/admin/kpi/overview \
  -H "Authorization: Bearer <TOKEN>"

# 3. Vérifier console frontend (F12)
# Pas d'erreurs HTTP 400/500
```

---

## 📞 SUPPORT

### Logs détaillés
```bash
# Backend (DEBUG mode)
# application.yml
logging:
  level:
    com.logiway: DEBUG
    org.hibernate.SQL: DEBUG

# Frontend (console)
# Ouvrir DevTools (F12) > Console
# Vérifier Network tab pour requêtes HTTP
```

### Contact
```
Email: support@logiway.com
Docs: https://docs.logiway.com
GitHub: https://github.com/logiway/logiway
```

---

## ✅ CHECKLIST DÉPLOIEMENT

### Avant déploiement
- [ ] Tests unitaires passent (backend + frontend)
- [ ] Tests d'intégration OK
- [ ] Configuration prod validée
- [ ] Secrets/passwords sécurisés (pas de hardcode)
- [ ] SSL configuré (HTTPS)
- [ ] Backup base de données
- [ ] Monitoring configuré

### Après déploiement
- [ ] Health checks OK
- [ ] Logs sans erreurs
- [ ] Login fonctionnel
- [ ] Dashboard SuperAdmin OK
- [ ] Carte avec markers OK
- [ ] Performance acceptable (< 2s page load)

---

**Version:** v3.1  
**Date:** 2026-07-09  
**Status:** 🚀 **PRÊT POUR PRODUCTION**
