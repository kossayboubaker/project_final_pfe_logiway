# ⚡ COMMANDES ESSENTIELLES - LOGIWAY v3.1

## 🚀 DÉMARRAGE

### Backend
```bash
cd backend
./mvnw spring-boot:run
```

### ML Service
```bash
cd pause-ai-service
python app.py
```

### Frontend
```bash
cd frontend
ng serve
```

---

## 🧪 TESTS

### Test Login SuperAdmin
```bash
curl -X POST http://localhost:8080/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"superadmin@logiway.com","password":"Password123!"}'
```

### Test Dashboard KPI
```bash
curl -X GET http://localhost:8080/api/admin/kpi/overview \
  -H "Authorization: Bearer <TOKEN>"
```

### Test Endpoint Pause IA
```bash
curl -X POST http://localhost:8080/api/pauseai/evaluer/1 \
  -H "Authorization: Bearer <TOKEN>"
```

### Test ML Service
```bash
curl http://localhost:5000/health
```

---

## 🔧 BUILD

### Backend (JAR)
```bash
cd backend
./mvnw clean package -DskipTests
# JAR: target/logiway-backend-v3.1.jar
```

### Frontend (Production)
```bash
cd frontend
ng build --configuration production
# Output: dist/frontend/
```

---

## 🐳 DOCKER

### Build Images
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

### Lancer Stack
```bash
docker-compose up -d
```

---

## 📊 HEALTHCHECKS

```bash
# Backend
curl http://localhost:8080/actuator/health

# ML Service
curl http://localhost:5000/health

# Frontend
curl http://localhost:4200
```

---

## 🗄️ BASE DE DONNÉES

### Créer DB
```sql
CREATE DATABASE logiway_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

### Vérifier Données
```sql
SELECT COUNT(*) FROM trajets;
SELECT COUNT(*) FROM chauffeurs;
SELECT COUNT(*) FROM vehicules;
SELECT COUNT(*) FROM reclamations;
```

---

## 📝 LOGS

```bash
# Backend
tail -f backend/logs/application.log

# ML Service
tail -f pause-ai-service/logs/ml.log

# Nginx
tail -f /var/log/nginx/access.log
```

---

## 🔄 REDÉMARRAGE

```bash
# Backend
cd backend
./mvnw spring-boot:stop
./mvnw spring-boot:run

# Frontend
# Ctrl+C puis
ng serve

# ML Service
# Ctrl+C puis
python app.py
```

---

**Version:** v3.1  
**Date:** 2026-07-09
