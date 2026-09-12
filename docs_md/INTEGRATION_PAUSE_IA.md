# Intégration du Modèle IA de Pauses Réglementaires

## Vue d'ensemble

Cette intégration relie le backend Spring Boot avec le modèle Python de prédiction des pauses réglementaires via une API Flask. Le système évalue automatiquement la nécessité de pauses pendant les trajets en cours et envoie des alertes en temps réel via SSE.

## Architecture

```
GPS Position (simulateur) 
    ↓
Spring Boot - PauseAIService
    ↓ HTTP POST /api/predict/batch
Flask API Python (port 5000)
    ↓ RandomForest → score 0-100
Spring Boot - Décision pause + SSE
    ↓
BreakNotificationComponent (Angular)
```

## Prérequis

### 1. Backend Spring Boot
- Java 17+
- Maven
- MySQL en cours d'exécution
- Port 8080 disponible

### 2. API Python Flask
- Python 3.11+
- Port 5000 disponible
- Dépendances : Flask, scikit-learn, joblib, pandas, numpy

## Installation et Lancement

### Étape 1 : Préparer l'API Python

```bash
cd pause-ai-service

# Installer les dépendances
pip install -r requirements.txt

# Entraîner le modèle (obligatoire avant la première utilisation)
python train.py --samples 10000

# Vérifier que le fichier data/pause_model.joblib est créé
ls -l data/pause_model.joblib

# Lancer l'API Flask
python app.py
```

L'API Flask devrait démarrer sur `http://localhost:5000`

Tester la disponibilité :
```bash
curl http://localhost:5000/api/health
```

Réponse attendue :
```json
{
  "status": "ok",
  "model_trained": true,
  "model_version": "v3.0-ml"
}
```

### Étape 2 : Configurer le Backend Spring Boot

Dans `backend/.env` ou `backend/src/main/resources/application.yml`, s'assurer que :

```yaml
pause:
  ai:
    url: http://localhost:5000
```

### Étape 3 : Lancer le Backend Spring Boot

```bash
cd backend
mvn clean install
mvn spring-boot:run
```

Le backend démarre sur `http://localhost:8080`

### Étape 4 : Vérifier la migration de base de données

La table `pause_ai_predictions` est créée automatiquement par Flyway au démarrage.

Vérifier en SQL :
```sql
USE logiway_db;
SHOW TABLES LIKE 'pause_ai_predictions';
DESC pause_ai_predictions;
```

## Fonctionnement

### 1. Évaluation Automatique (Scheduler)

Le scheduler `PauseAIScheduler` s'exécute **toutes les 2 minutes** et :

1. Récupère tous les trajets avec statut `EN_COURS`
2. Pour chaque trajet :
   - Calcule `hours_driving` (temps de conduite effectif)
   - Si `hours_driving < 3.0h` → skip l'évaluation
   - Sinon, appelle `PauseAIService.evaluerPause()`

### 2. Service d'Évaluation (PauseAIService)

Pour chaque évaluation :

1. **Collecte des features** (15 features attendues par le modèle) :
   - `total_distance_km`, `dist_along_ratio`, `perp_distance_m`
   - `hours_driving`, `arrival_hour`, `poi_type_encoded`
   - Flags booléens : `is_meal_poi`, `is_meal_hour`, `is_mid_range_fuel`, etc.

2. **Recherche du meilleur POI** via Overpass API (rayon 500m) :
   - Priorisation : `highway=services` > `highway=rest_area` > `amenity=fuel` > autres
   - Si aucun POI trouvé → POI fictif "bas-côté" avec `perp_distance_m=800`

3. **Appel au modèle Python** :
   - POST `http://localhost:5000/api/predict/batch`
   - Reçoit un score 0-100

4. **Décision d'alerte** :
   - Score ≥ 85 **OU** `hours_driving ≥ 4.5h` → **ALERTE URGENTE**
   - Score ≥ 70 → **ALERTE RECOMMANDÉE**
   - Score < 70 → **Pas d'alerte** (mais score persisté pour analytics)

5. **Persistance** :
   - Sauvegarde dans `pause_ai_predictions`

6. **Notification SSE** :
   - Si alerte déclenchée → événement `PAUSE_AI_ALERT` envoyé au chauffeur, manager et superadmins

### 3. Fallback en cas d'erreur

Si l'API Flask est indisponible :
- Le service utilise une règle simple : alerte si `hours_driving >= 4.5h`
- Score forcé à 100 pour déclencher l'alerte urgente

## Endpoints API REST

### POST /api/pauseai/evaluer/{trajetId}

Évaluation manuelle d'un trajet.

**Request Body :**
```json
{
  "currentLatitude": 48.8566,
  "currentLongitude": 2.3522,
  "distanceParcourueKm": 120.5
}
```

**Response :**
```json
{
  "id": 1,
  "trajetId": 42,
  "timestamp": "2026-07-01T14:30:00",
  "hoursDriving": 3.5,
  "distAlongRatio": 0.45,
  "score": 75,
  "poiType": "services",
  "alerteDeclenchee": true,
  "typeAlerte": "RECOMMANDEE",
  "latitudePoi": 48.8570,
  "longitudePoi": 2.3530,
  "nomPoi": "Aire de repos A1",
  "distancePoiM": 350.0
}
```

### GET /api/pauseai/trajets/{trajetId}/historique

Récupère toutes les prédictions IA pour un trajet.

**Response :**
```json
[
  {
    "id": 1,
    "trajetId": 42,
    "timestamp": "2026-07-01T14:30:00",
    "score": 75,
    "alerteDeclenchee": true,
    ...
  },
  ...
]
```

### GET /api/pauseai/dashboard

Statistiques agrégées pour le dashboard analytique.

**Query Params :**
- `startDate` : Date de début (ISO 8601)
- `endDate` : Date de fin (ISO 8601)
- `chauffeurId` : (optionnel) Filtrer par chauffeur

**Response :**
```json
{
  "totalPausesRecommandees": 45,
  "pausesEffectuees": 38,
  "pausesIgnorees": 7,
  "tauxConformite": 84.44,
  "scoreMoyenFatigue": 68.25,
  "chauffeurStats": [
    {
      "chauffeurId": 10,
      "nomChauffeur": "Jean Dupont",
      "nombreMissions": 12,
      "scoreFatigueMoyen": 65.5,
      "alertesUrgentes": 3,
      "pausesIgnorees": 1,
      "tauxConformite": 91.67
    }
  ],
  "heatmapPoints": [
    {
      "latitude": 48.8566,
      "longitude": 2.3522,
      "type": "URGENTE_IGNOREE",
      "score": 92,
      "nomLieu": "Aire A1 Nord"
    }
  ]
}
```

## Règles Métier

### Règle des 3 heures
- Le modèle **n'est pas appelé** si `hours_driving < 3.0h`
- Conformément au règlement CE 561/2006

### Règle des 4.5 heures
- Si `hours_driving ≥ 4.5h` → **Alerte urgente automatique** (indépendamment du score IA)

### Intervalle d'évaluation
- Le scheduler évalue toutes les **2 minutes de conduite effective**
- La dernière évaluation est vérifiée pour éviter les évaluations trop rapprochées

### Calcul de `hours_driving`
```
hours_driving = (now - dateDepart - tempsCumuléPausesEffectuées) / 3600
```

### Seuils de décision
- Score ≥ 70 → Pause recommandée
- Score ≥ 85 → Pause urgente
- Score < 70 → Aucune alerte

## Intégration Frontend (Angular)

### Enrichissement du `BreakNotificationComponent`

Le composant existant doit écouter les événements SSE de type `PAUSE_AI_ALERT` et afficher :

1. **Score IA** : Jauge circulaire 0-100
   - Vert : < 70
   - Orange : 70-85
   - Rouge : > 85

2. **Informations POI** :
   - Nom du POI recommandé
   - Distance en mètres
   - Équipements (icônes : douche, sanitaires, PL, 24h, carburant)
   - Heure estimée d'arrivée

3. **Deux niveaux de popup** :
   - **Score 70-85** : Popup non bloquante (bas-droite, fond orange, bouton "Ignorer")
   - **Score > 85 OU hours_driving > 4.5h** : Popup centrale bloquante (fond rouge, pas d'ignorance)

4. **Actions disponibles** :
   - "Marquer comme effectuée" → `PUT /api/trajets/{id}/pauses/{pauseId}/statut`
   - "Voir sur la carte" → Centre la carte Leaflet sur le POI
   - "Ignorer" (si score < 85) → Snooze 15 minutes

### Exemple d'événement SSE reçu

```json
{
  "eventType": "PAUSE_AI_ALERT",
  "data": {
    "trajetId": 42,
    "predictionId": 15,
    "score": 88,
    "typeAlerte": "URGENTE",
    "hoursDriving": 4.2,
    "poi": {
      "type": "services",
      "lat": 48.8570,
      "lon": 2.3530,
      "name": "Aire de l'Autoroute A1",
      "distance": 450.0,
      "tags": {
        "hgv": "yes",
        "shower": "yes",
        "toilets": "yes",
        "opening_hours": "24/7"
      }
    }
  }
}
```

## Dashboard Analytique (Angular)

Créer un nouveau composant `PauseAnalyticsDashboardComponent` accessible aux **MANAGER** et **SUPERADMIN**.

### Sections du dashboard

#### 1. Vue Globale
- Nombre total de pauses recommandées
- Nombre de pauses effectuées vs ignorées
- Taux de conformité (%)
- Score moyen de fatigue
- Graphique en barres : pauses par chauffeur

#### 2. Analyse par Chauffeur
Tableau avec colonnes :
- Nom
- Nombre de missions
- Score fatigue moyen
- Alertes urgentes
- Pauses ignorées
- Taux de conformité (%)

Cliquer sur un chauffeur → Timeline détaillée de ses pauses

#### 3. Carte de Chaleur
Mini-carte Leaflet avec points colorés :
- **Rouge** : Pause urgente ignorée
- **Orange** : Pause recommandée ignorée
- **Vert** : Pause effectuée

#### 4. Score IA dans le Temps
Graphique ligne montrant l'évolution du score pendant un trajet :
- Axe X : Progression du trajet (%)
- Axe Y : Score 0-100
- Zones rouges : Score > 85
- Points verts : Pauses effectuées

### Filtres disponibles
- Période : Aujourd'hui, Cette semaine, Ce mois, Personnalisé
- Chauffeur
- Type d'alerte : Toutes, Recommandées, Urgentes
- Statut : Effectuées, Ignorées, Toutes

## Tests

### Test manuel de l'évaluation

```bash
# 1. Démarrer un trajet en base de données avec statut EN_COURS
# 2. Attendre 2 minutes (scheduler)
# 3. Vérifier les logs

# Ou appeler manuellement l'endpoint :
curl -X POST http://localhost:8080/api/pauseai/evaluer/42 \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{
    "currentLatitude": 48.8566,
    "currentLongitude": 2.3522,
    "distanceParcourueKm": 120.5
  }'
```

### Test du dashboard

```bash
curl -X GET "http://localhost:8080/api/pauseai/dashboard?startDate=2026-07-01T00:00:00&endDate=2026-07-02T00:00:00" \
  -H "Authorization: Bearer <token>"
```

## Troubleshooting

### Le modèle IA retourne une erreur

**Symptôme** : `Model not trained. Call POST /api/train first.`

**Solution** :
```bash
cd pause-ai-service
python train.py --samples 10000
```

### L'API Flask n'est pas joignable

**Symptôme** : `Connection refused` ou timeout

**Vérifier** :
1. L'API Flask est démarrée : `curl http://localhost:5000/api/health`
2. Le port 5000 n'est pas bloqué par un firewall
3. La configuration `pause.ai.url` dans `application.yml`

**Fallback automatique** : Le système bascule sur la règle simple si l'API est indisponible

### Le scheduler n'évalue pas les trajets

**Vérifier** :
1. `@EnableScheduling` est présent dans `LogiwayApplication.java` ✓
2. Les trajets ont bien le statut `EN_COURS`
3. `hours_driving >= 3.0h` (sinon skip normal)
4. Les logs `[SCHEDULER]` dans `logs/application.log`

### Aucune notification SSE reçue

**Vérifier** :
1. Le score est ≥ 70 (ou hours_driving ≥ 4.5h)
2. Le frontend écoute le flux SSE `/api/realtime/sse`
3. L'utilisateur fait partie de l'audience (chauffeur, manager ou superadmin du trajet)

## Maintenance

### Réentraîner le modèle

Pour améliorer la précision avec plus de données :

```bash
cd pause-ai-service
python train.py --samples 50000
```

Le nouveau modèle remplace automatiquement `data/pause_model.joblib`

### Nettoyer les anciennes prédictions

```sql
-- Supprimer les prédictions de plus de 90 jours
DELETE FROM pause_ai_predictions 
WHERE timestamp < DATE_SUB(NOW(), INTERVAL 90 DAY);
```

## Sécurité

- Tous les endpoints nécessitent une authentification JWT
- Les filtres par entreprise sont appliqués automatiquement selon le rôle
- Les managers ne voient que les données de leur entreprise
- Les chauffeurs ne voient que leurs propres trajets

## Performances

- Le scheduler évalue les trajets toutes les 2 minutes (non bloquant)
- Les prédictions sont persistées de manière asynchrone
- L'appel au modèle Python prend environ 50-200ms
- La recherche Overpass peut prendre 1-3 secondes (mise en cache recommandée)

## Améliorations Futures

1. **Cache Overpass** : Mettre en cache les POIs pour réduire les appels API
2. **Position GPS réelle** : Intégrer avec le simulateur GPS pour avoir la position en temps réel
3. **Machine Learning en ligne** : Réentraîner le modèle périodiquement avec les données réelles
4. **Notification push** : Ajouter des notifications mobiles en complément du SSE
5. **Export des statistiques** : Permettre l'export CSV/Excel du dashboard

## Support

Pour toute question ou problème :
- Consulter les logs : `backend/logs/application.log`
- Vérifier la santé de l'API : `curl http://localhost:5000/api/health`
- Examiner la table `pause_ai_predictions` en base de données
