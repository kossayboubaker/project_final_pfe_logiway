# Guide de test rapide - Affichage des pauses sur la carte

## 🚀 Démarrage rapide

### 1. Démarrer les services (dans l'ordre)

```bash
# Terminal 1 - Flask (Modèle IA)
cd pause-ai-service
python app.py
# Attendre: "Running on http://0.0.0.0:5000"

# Terminal 2 - Backend Spring Boot
cd backend
./mvnw spring-boot:run
# OU: java -jar target/logiway-backend.jar
# Attendre: "Started LogiwayApplication"

# Terminal 3 - Frontend Angular
cd frontend
ng serve --port 4200
# Attendre: "Compiled successfully"
```

### 2. Vérifier que tout fonctionne

```bash
# Flask
curl http://localhost:5000/api/health
# Attendu: {"status":"ok","model_trained":true}

# Backend
curl http://localhost:8080/actuator/health
# Attendu: {"status":"UP"}

# Frontend
# Ouvrir: http://localhost:4200
```

---

## 🧪 Test de l'affichage des pauses

### Étape 1 : Se connecter
1. Aller sur `http://localhost:4200`
2. Se connecter avec un compte **CHAUFFEUR** ou **MANAGER**

### Étape 2 : Accéder à la carte
1. Cliquer sur le menu **"Carte"** (ou **"Map"**)
2. La carte Leaflet doit s'afficher

### Étape 3 : Sélectionner un trajet
1. Dans la liste des trajets (sidebar gauche), cliquer sur un trajet **EN_COURS** ou **PLANIFIÉ**
2. La carte doit automatiquement centrer sur le trajet

### Étape 4 : Vérifier les markers
1. **Ouvrir la console développeur** (F12)
2. Chercher les logs suivants :

```
[PauseMap] 🔄 Chargement des pauses complètes pour trajet X
[PauseMap] 📍 Stops reçus: { total: 8, types: [...], ... }
[PauseMap] ✅ Pauses mappées: { total: 8, types: [...] }
```

3. Sur la carte, vous devriez voir des **markers colorés** avec des emojis :
   - ⏰ Jaune : Alerte 3h (WARNING_ALERT)
   - ⏸️ Orange : Pause obligatoire 4h30 (MANDATORY_REST)
   - ⛽ Bleu : Station-service (STATION_SERVICE)
   - 🌿 Vert : Aire de repos (REST_AREA)
   - ☕ Marron clair : Café (CAFE)
   - 🍽️ Marron : Restaurant/Kiosque (KIOSK)
   - 🅿️ Bleu foncé : Parking PL (PARKING)

### Étape 5 : Tester les interactions
1. **Survoler un marker** → Un tooltip doit apparaître ("Station-service", "Aire de repos", etc.)
2. **Cliquer sur un marker** → Un popup doit s'ouvrir avec :
   - Nom du lieu
   - Type de pause
   - Score IA (si applicable)
   - Distance depuis le départ
   - Heure d'arrivée estimée
   - Boutons d'action ("Marquer effectuée", "Ignorer")

---

## 🔍 Que faire si ça ne marche pas ?

### Problème : Aucun marker ne s'affiche

#### Vérification 1 : Logs console
Ouvrir F12 et chercher :
```
[PauseMap] 📍 Stops reçus: { total: 0, ... }
```
ou
```
[PauseMap] ❌ Erreur chargement pauses complètes
```

**Si `total: 0`** → Le trajet n'a pas de pauses générées
- **Solution** : Cliquer sur "Régénérer les pauses" dans le popup du trajet

**Si erreur réseau** → Vérifier les services backend
```bash
# Tester l'endpoint directement
curl -X GET "http://localhost:8080/api/pauseai/trajets/1/pauses-completes" \
  -H "Authorization: Bearer VOTRE_TOKEN_JWT"
```

#### Vérification 2 : Flask répond-il ?
```bash
# Tester Flask directement
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

**Réponse attendue** : JSON avec `"stops": [...]` contenant plusieurs éléments

**Si erreur** → Démarrer Flask : `cd pause-ai-service && python app.py`

#### Vérification 3 : Le trajet a-t-il des coordonnées ?
Vérifier en base de données :
```sql
SELECT id, latitude_depart, longitude_depart, latitude_arrivee, longitude_arrivee
FROM trajets
WHERE id = 1;
```

**Si NULL** → Le trajet n'a pas de coordonnées GPS valides

---

### Problème : Les markers ont tous la même icône

**Cause** : Les types retournés par Flask ne correspondent pas à l'enum TypePause

**Vérification** :
Chercher dans les logs :
```
[PauseMap] 📍 Stops reçus: { ..., types: ["UNKNOWN", "UNKNOWN"], ... }
```

**Solution** :
1. Vérifier la réponse Flask : les types doivent être :
   - `WARNING_ALERT`
   - `MANDATORY_REST`
   - `STATION_SERVICE`
   - `REST_AREA`
   - `CAFE`
   - `KIOSK`
   - `PARKING`
   - `POI`

2. Si les types sont différents, modifier `pause-ai-service/app.py` fonction `map_poi_type()`

---

### Problème : Erreur 500 au backend

**Logs à vérifier** :
```
[PAUSE-AI] ❌ Erreur lors de l'appel Flask pour trajet X: Connection refused
```

**Cause** : Flask n'est pas démarré ou inaccessible

**Solution** :
1. Démarrer Flask : `cd pause-ai-service && python app.py`
2. Vérifier la configuration dans `backend/src/main/resources/application.yml` :
   ```yaml
   pause:
     ai:
       url: http://localhost:5000  # Doit correspondre au port Flask
   ```

---

## 📊 Test du Dashboard Analytics

### Accès au dashboard
1. Se connecter avec un compte **MANAGER** ou **SUPERADMIN**
2. Dans la sidebar, aller dans **Analytique** → **Pauses IA**
3. Ou directement : `http://localhost:4200/dashboard/analytics/pauses`

### Points à vérifier
1. **Section "Vue globale"** :
   - Total pauses recommandées
   - Pauses effectuées
   - Pauses ignorées
   - Taux de conformité (%)
   - Score moyen fatigue

2. **Carte de chaleur** :
   - Des points colorés doivent apparaître sur la carte
   - Légende : Rouge (urgent ignoré), Vert (recommandé effectué), Orange (recommandé ignoré)

3. **Filtres** :
   - Période : Semaine / Mois / Personnalisé
   - Chauffeur : Tous / Sélection spécifique
   - Type : Tous / Urgentes ignorées / Recommandées effectuées / Recommandées ignorées

4. **Tableau des chauffeurs** :
   - Nom
   - Missions
   - Score fatigue moyen
   - Alertes urgentes
   - Pauses ignorées
   - Taux conformité

### Logs à surveiller
Ouvrir F12 et chercher :
```
[PauseAIService] 🔄 Requête dashboard: { ... }
[PauseAIService] ✅ Dashboard reçu: { totalPoints: 45, ... }
[PauseAIService] 📍 Premiers points de carte: [...]
```

**Si `totalPoints: 0`** :
- Aucune pause n'a été déclenchée dans la période sélectionnée
- **Solution** : Changer la période (ex: dernier mois) ou créer des trajets avec alertes IA

---

## ✅ Checklist complète

### Backend
- [ ] Flask démarré sur port 5000
- [ ] Spring Boot démarré sur port 8080
- [ ] `/api/health` répond `200 OK`
- [ ] `/api/pauseai/trajets/{id}/pauses-completes` accessible
- [ ] Logs montrent `[PAUSE-AI] ✅ X points de pause retournés`

### Frontend - Carte
- [ ] Application accessible sur `http://localhost:4200`
- [ ] Connexion réussie
- [ ] Page Map affiche la carte Leaflet
- [ ] Sélection d'un trajet affiche la route
- [ ] Logs console montrent `[PauseMap] ✅ Pauses mappées: { total: X }`
- [ ] Markers visibles sur la carte
- [ ] Au moins 2 types de markers différents (couleurs/emojis)
- [ ] Tooltip s'affiche au survol
- [ ] Popup s'ouvre au clic
- [ ] Actions "Marquer effectuée" et "Ignorer" présentes

### Frontend - Dashboard
- [ ] Page dashboard accessible
- [ ] Section "Vue globale" affiche des chiffres
- [ ] Carte de chaleur affiche des points
- [ ] Filtres sont fonctionnels
- [ ] Tableau des chauffeurs contient des données
- [ ] Export CSV fonctionne

---

## 🎯 Résultat attendu

### Sur la carte
Pour un trajet de 300 km et 4-5 heures, vous devriez voir environ **8 à 12 markers** :
- 1 alerte WARNING_ALERT (⏰ jaune) vers 3h
- 1 pause MANDATORY_REST (⏸️ orange) vers 4h30
- 3-5 STATION_SERVICE (⛽ bleu)
- 2-3 REST_AREA (🌿 vert)
- 1-2 CAFE (☕)
- 0-1 PARKING (🅿️)

### Sur le dashboard
- **Taux de conformité** : 70-90% (selon le comportement des chauffeurs)
- **Score moyen fatigue** : 40-60 (normal) ou > 70 (alerte)
- **Carte de chaleur** : Points concentrés sur les axes autoroutiers

---

## 📞 Support

Si le problème persiste après ces vérifications :

1. **Capturer les logs** :
   ```bash
   # Backend
   tail -f backend/logs/application.log | grep PAUSE-AI
   
   # Frontend (console navigateur F12)
   # Copier tous les logs [PauseMap] et [PauseAIService]
   ```

2. **Tester l'API manuellement** :
   ```bash
   # Remplacer {trajetId} et {token}
   curl -X GET "http://localhost:8080/api/pauseai/trajets/{trajetId}/pauses-completes" \
     -H "Authorization: Bearer {token}" \
     -o response.json
   
   # Vérifier le contenu
   cat response.json | jq .
   ```

3. **Vérifier la base de données** :
   ```sql
   -- Vérifier qu'il y a des trajets
   SELECT COUNT(*) FROM trajets WHERE statut = 'EN_COURS';
   
   -- Vérifier les prédictions IA
   SELECT COUNT(*) FROM pause_ai_predictions WHERE alerte_declenchee = true;
   ```

---

**Date** : 4 juillet 2026  
**Version** : 1.0
