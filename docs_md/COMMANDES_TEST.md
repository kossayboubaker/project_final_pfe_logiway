# Commandes de test - Affichage des pauses sur la carte

## 🚀 Démarrage des services

### 1. Service Flask (Modèle IA)
```bash
cd pause-ai-service
python app.py
```
**Attendu** :
```
 * Running on http://0.0.0.0:5000
 * Restarting with stat
```

**Test de santé** :
```bash
curl http://localhost:5000/api/health
```
**Réponse attendue** :
```json
{
  "status": "ok",
  "model_trained": true,
  "model_version": "v3.0-ml"
}
```

---

### 2. Backend Spring Boot
```bash
cd backend
# Avec Maven wrapper
./mvnw spring-boot:run

# OU directement avec Java
java -jar target/logiway-backend.jar
```
**Attendu** :
```
Started LogiwayApplication in X.XXX seconds
```

**Test de santé** :
```bash
curl http://localhost:8080/actuator/health
```
**Réponse attendue** :
```json
{
  "status": "UP"
}
```

---

### 3. Frontend Angular
```bash
cd frontend
ng serve --port 4200
```
**Attendu** :
```
✔ Browser application bundle generation complete.
Initial chunk files | Names         |  Raw size
chunk-XXXXX.js      | -             |   1.19 MB
...
✔ Compiled successfully.
```

**Test d'accès** :
```
Ouvrir http://localhost:4200 dans le navigateur
```

---

## 🧪 Tests de l'API

### Test 1 : Endpoint Flask direct
```bash
curl -X POST "http://localhost:5000/api/predict" \
  -H "Content-Type: application/json" \
  -d '{
    "startLat": 48.8566,
    "startLon": 2.3522,
    "endLat": 45.7640,
    "endLon": 4.8357,
    "trip_id": 1,
    "trip_duration_minutes": 300
  }'
```

**Réponse attendue** :
```json
{
  "stops": [
    {
      "id": "uuid-...",
      "type": "WARNING_ALERT",
      "lat": 48.75,
      "lon": 2.40,
      "nomLieu": "Alerte de conduite - 3h",
      "aiScore": 100,
      ...
    },
    {
      "id": "uuid-...",
      "type": "STATION_SERVICE",
      "lat": 48.70,
      "lon": 2.35,
      "nomLieu": "Total Access",
      "aiScore": 78,
      ...
    },
    ...
  ],
  "meta": {
    "num_stops": 8,
    "route_distance_m": 450000,
    ...
  }
}
```

**Vérifications** :
- ✅ `stops` contient au moins 5 éléments
- ✅ Types variés : WARNING_ALERT, MANDATORY_REST, STATION_SERVICE, REST_AREA, CAFE, etc.
- ✅ Chaque stop a `lat`, `lon`, `type`, `nomLieu`, `aiScore`

---

### Test 2 : Nouvel endpoint backend
```bash
# Remplacer {trajetId} et {JWT_TOKEN}
curl -X GET "http://localhost:8080/api/pauseai/trajets/{trajetId}/pauses-completes" \
  -H "Authorization: Bearer {JWT_TOKEN}" \
  -H "Content-Type: application/json"
```

**Réponse attendue** :
```json
{
  "stops": [
    {
      "id": "uuid-...",
      "type": "WARNING_ALERT",
      "latitude": 48.75,      // ← Notez "latitude" au lieu de "lat"
      "longitude": 2.40,      // ← Notez "longitude" au lieu de "lon"
      "lat": 48.75,           // ← Conservé pour rétrocompatibilité
      "lon": 2.40,
      "nomLieu": "Alerte de conduite - 3h",
      "aiScore": 100,
      ...
    },
    ...
  ],
  "meta": { ... }
}
```

**Vérifications** :
- ✅ Champs `latitude` ET `lat` présents
- ✅ Champs `longitude` ET `lon` présents
- ✅ Même nombre de stops que dans la réponse Flask

---

### Test 3 : Ancien endpoint (pour comparaison)
```bash
# Remplacer {trajetId} et {JWT_TOKEN}
curl -X GET "http://localhost:8080/api/trajets/{trajetId}/pauses" \
  -H "Authorization: Bearer {JWT_TOKEN}" \
  -H "Content-Type: application/json"
```

**Réponse attendue** :
```json
[
  {
    "id": 123,
    "trajetId": 1,
    "type": "WARNING_ALERT",
    "latitude": 48.75,
    "longitude": 2.40,
    "statut": "PLANIFIEE",
    ...
  },
  {
    "id": 124,
    "trajetId": 1,
    "type": "MANDATORY_REST",
    "latitude": 48.52,
    "longitude": 2.55,
    "statut": "PLANIFIEE",
    ...
  }
]
```

**Vérifications** :
- ❌ Seulement 2 types : WARNING_ALERT et MANDATORY_REST
- ❌ Aucun STATION_SERVICE, REST_AREA, CAFE, etc.
- → C'est normal, cet endpoint filtre les POI IA

---

## 🎯 Tests fonctionnels frontend

### Test 1 : Console logs
1. Ouvrir `http://localhost:4200`
2. Ouvrir la console développeur (F12)
3. Se connecter avec un compte CHAUFFEUR ou MANAGER
4. Aller sur la page "Carte" (Map)
5. Sélectionner un trajet EN_COURS

**Logs attendus** :
```
[PauseAIService] 🗺️ Récupération des pauses complètes pour trajet 1
[PauseAIService] ✅ Pauses complètes reçues: {totalStops: 8, types: Array(5), meta: {...}}
[PauseAIService] 📍 Premiers stops: Array(5) [{type: "WARNING_ALERT", ...}, {...}, ...]

[PauseMap] 🔄 Chargement des pauses complètes pour trajet 1
[PauseMap] 📍 Stops reçus: {total: 8, types: Array(5), sample: Array(3)}
[PauseMap] ✅ Pauses mappées: {total: 8, types: Array(5)}
```

**Si erreur** :
```
[PauseMap] ❌ Erreur chargement pauses complètes
```
→ Vérifier que Flask et Spring Boot sont démarrés

---

### Test 2 : Markers sur la carte
**Actions** :
1. Sélectionner un trajet
2. Observer la carte

**Attendu** :
- ✅ 8-12 markers visibles
- ✅ Couleurs variées (bleu, vert, orange, jaune, marron)
- ✅ Emojis différents (⏰, ⏸️, ⛽, 🌿, ☕, 🍽️, 🅿️)

**Comptage par type attendu** (pour un trajet de 300 km) :
- 1x ⏰ Alerte 3h (WARNING_ALERT)
- 1x ⏸️ Pause obligatoire 4h30 (MANDATORY_REST)
- 3-5x ⛽ Stations-service (STATION_SERVICE)
- 2-3x 🌿 Aires de repos (REST_AREA)
- 1-2x ☕ Cafés (CAFE)
- 0-1x 🅿️ Parkings (PARKING)

---

### Test 3 : Interactions
**Actions** :
1. **Survoler un marker** → Tooltip doit apparaître ("Station-service", "Aire de repos", etc.)
2. **Cliquer sur un marker** → Popup doit s'ouvrir avec :
   - Nom du lieu
   - Type de pause
   - Score IA (si applicable)
   - Distance depuis le départ
   - Heure d'arrivée estimée
   - Boutons "Marquer effectuée" et "Ignorer"
3. **Cliquer sur "Marquer effectuée"** → Le marker devient vert avec opacité réduite
4. **Cliquer sur "Ignorer"** → Le marker devient rouge avec opacité réduite

---

### Test 4 : Dashboard Analytics
**Accès** :
1. Se connecter avec un compte MANAGER ou SUPERADMIN
2. Menu : Analytique → Pauses IA
3. Ou directement : `http://localhost:4200/dashboard/analytics/pauses`

**Logs console attendus** :
```
[PauseAIService] 🔄 Requête dashboard: {url: "...", params: {...}}
[PauseAIService] ✅ Dashboard reçu: {totalPoints: 45, totalChauffeurs: 12, stats: {...}}
[PauseAIService] 📍 Premiers points de carte: Array(3) [{nom: "...", type: "...", ...}, ...]
```

**Éléments visuels attendus** :
- ✅ Section "Vue globale" avec 5 KPI
- ✅ Carte de chaleur avec points colorés
- ✅ Tableau "Statistiques par chauffeur"
- ✅ Filtres : Période, Chauffeur, Type

**Si pas de données** :
```
[PauseAIService] ⚠️ Aucun point de carte dans la réponse
```
→ Créer des trajets avec alertes IA ou changer la période

---

## 🔍 Diagnostic des problèmes

### Problème : Aucun marker ne s'affiche

#### Vérification 1 : Logs console
```
Chercher dans F12 :
[PauseMap] 📍 Stops reçus: {total: 0, ...}
```
→ Flask n'a pas retourné de stops

**Solution** : Vérifier Flask
```bash
curl http://localhost:5000/api/health
```

---

#### Vérification 2 : Erreur réseau
```
Chercher dans F12 → Onglet "Réseau" :
GET /api/pauseai/trajets/1/pauses-completes → Status 500 ou 404
```
→ Backend indisponible ou endpoint incorrect

**Solution** : Vérifier Spring Boot
```bash
curl http://localhost:8080/actuator/health
```

---

#### Vérification 3 : Trajet sans coordonnées
```sql
SELECT id, latitude_depart, longitude_depart, latitude_arrivee, longitude_arrivee
FROM trajets
WHERE id = 1;
```
→ Si NULL, le trajet n'a pas de coordonnées GPS

**Solution** : Créer un trajet avec coordonnées valides

---

### Problème : Erreur 500 au backend

**Logs Spring Boot** :
```bash
# Windows
type backend\logs\application.log | findstr /C:"PAUSE-AI"

# Linux/Mac
tail -f backend/logs/application.log | grep PAUSE-AI
```

**Erreurs courantes** :
1. `Connection refused` → Flask n'est pas démarré
2. `Trajet introuvable` → L'ID du trajet n'existe pas
3. `Access denied` → Problème de droits JWT

---

### Problème : Dashboard vide

**Vérification** :
```sql
-- Compter les prédictions IA
SELECT COUNT(*) FROM pause_ai_predictions WHERE alerte_declenchee = true;

-- Vérifier la période
SELECT MIN(timestamp), MAX(timestamp) FROM pause_ai_predictions;
```

**Si 0 résultats** :
→ Aucune alerte IA n'a été déclenchée
→ Créer des trajets EN_COURS et attendre que le scheduler s'exécute (toutes les 2 minutes)

---

## 📋 Checklist finale

### Services
- [ ] Flask démarré (port 5000)
- [ ] Spring Boot démarré (port 8080)
- [ ] Angular démarré (port 4200)

### Tests API
- [ ] Flask `/api/health` → `200 OK`
- [ ] Backend `/actuator/health` → `200 OK`
- [ ] Flask `/api/predict` retourne des stops variés
- [ ] Backend `/api/pauseai/trajets/{id}/pauses-completes` retourne les mêmes stops

### Tests Frontend - Carte
- [ ] Console logs affichent `[PauseMap] ✅ Pauses mappées`
- [ ] Au moins 8 markers visibles sur la carte
- [ ] Au moins 3 types de markers différents
- [ ] Tooltips fonctionnent au survol
- [ ] Popups s'ouvrent au clic
- [ ] Actions "Marquer effectuée" et "Ignorer" fonctionnent

### Tests Frontend - Dashboard
- [ ] Page dashboard accessible
- [ ] Console logs affichent `[PauseAIService] ✅ Dashboard reçu`
- [ ] Section "Vue globale" affiche des chiffres
- [ ] Carte de chaleur affiche des points
- [ ] Filtres fonctionnent
- [ ] Tableau des chauffeurs contient des données
- [ ] Export CSV téléchargeable

---

## 🎉 Résultat final

**Attendu** : Pour un trajet de 300 km et 4-5 heures, vous devez voir :
- **8 à 12 markers** sur la carte
- **Types variés** : ⏰ Alerte 3h, ⏸️ Pause 4h30, ⛽ Stations, 🌿 Aires de repos, ☕ Cafés
- **Popups détaillés** avec scores IA et informations utiles
- **Dashboard fonctionnel** avec statistiques et carte de chaleur

**Si tout fonctionne** : ✅ L'intégration est réussie !

---

**Version** : 1.0  
**Date** : 4 juillet 2026
