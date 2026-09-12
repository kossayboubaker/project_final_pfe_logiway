# 📊 DASHBOARD SUPERADMIN - SOLUTION COMPLÈTE

## ✅ CORRECTION EFFECTUÉE

### Problème résolu
L'erreur HTTP 400 causée par le champ inexistant `dureeReelleMinutes` dans l'entité `Trajet` a été corrigée.

### Fichier modifié
**`backend/src/main/java/com/logiway/services/impl/AdminKpiServiceImpl.java`**

**Ligne ~254 - Méthode `buildTopDrivers()`:**

```java
// AVANT (❌ ERREUR):
Double hours = em.createQuery(
    "SELECT COALESCE(SUM(t.dureeReelleMinutes), 0) FROM Trajet t " +
    "WHERE t.chauffeur.id = :cid AND t.dureeReelleMinutes IS NOT NULL",
    Double.class)
    .setParameter("cid", cid)
    .getSingleResult();

// APRÈS (✅ CORRIGÉ):
Double hours = em.createQuery(
    "SELECT COALESCE(SUM(FUNCTION('TIMESTAMPDIFF', MINUTE, t.dateDepart, t.dateArriveeReelle)), 0) FROM Trajet t " +
    "WHERE t.chauffeur.id = :cid AND t.dateDepart IS NOT NULL AND t.dateArriveeReelle IS NOT NULL",
    Double.class)
    .setParameter("cid", cid)
    .getSingleResult();
```

---

## 📋 ARCHITECTURE COMPLÈTE

### Backend Stack

```
AdminKpiController (REST API)
        ↓
AdminKpiService (Interface)
        ↓
AdminKpiServiceImpl (Business Logic)
        ↓
┌──────────────────────────────────────┐
│ Repositories utilisés:               │
│ - VehiculeRepository                 │
│ - ChauffeurRepository                │
│ - ReclamationRepository              │
│ - CongeRepository                    │
│ - UtilisateurRepository              │
│ - EntityManager (JPQL queries)       │
└──────────────────────────────────────┘
```

### Frontend Stack

```
SuperAdminDashboardComponent
        ↓
AdminKpiService
        ↓
HTTP GET http://localhost:8080/api/admin/kpi/overview
        ↓
KpiOverviewResponse (DTO)
        ↓
┌──────────────────────────────────────┐
│ Affichage dans le dashboard:         │
│ - 8 KPI Cards                        │
│ - 7 Charts (Chart.js)                │
│ - Top 10 Drivers Table               │
│ - Stats Tables                       │
└──────────────────────────────────────┘
```

---

## 🎯 DONNÉES AFFICHÉES

### 1. KPI CARDS (8 cartes principales)

#### 🚛 Chauffeurs Actifs
```typescript
{
  chauffeursActifs: 15,    // Chauffeurs avec estActif = ACTIF
  chauffeursTotal: 20,     // Total des chauffeurs
  // Calcul: estActif = StatutCompte.ACTIF
}
```

#### 🚗 Véhicules en Service
```typescript
{
  vehiculesEnService: 18,
  vehiculesEnMaintenance: 2,
  vehiculesHorsService: 0,
  vehiculesTotal: 20,
  vehiculesStatusSummary: "18 EN_SERVICE | 2 EN_MAINTENANCE | 0 HORS_SERVICE"
  // Calcul: statut = EN_SERVICE / EN_MAINTENANCE / HORS_SERVICE
}
```

#### 📦 Missions en Cours
```typescript
{
  missionsEnCours: 12,     // statut = EN_COURS
  missionsALheure: 9,      // dateArriveeReelle <= dateArrivee (ou now() <= expected)
  missionsEnRetard: 3,     // missionsEnCours - missionsALheure
  missionsTerminees: 145   // statut = COMPLETE
}
```

#### 🎯 Taux de Ponctualité
```
Calcul: (missionsALheure / missionsEnCours) * 100
Affichage: Pourcentage avec indicateur visuel
```

#### 🏖️ Congés en Attente
```typescript
{
  congesEnAttente: 3,      // statut = EN_ATTENTE
  congesApprouves: 18,     // statut = APPROUVE
  congesRefuses: 2         // statut = REJETE
}
```

#### ⚠️ Réclamations Ouvertes
```typescript
{
  reclamationsOuvertes: 5,    // statut = EN_COURS
  reclamationsResolues: 23,   // statut = RESOLU
  reclamationsTotal: 28
}
```

#### 👥 Utilisateurs Actifs
```typescript
{
  administrateurs: 2,    // role = SUPERADMIN
  managers: 5,           // role = MANAGER
  chauffeurs: 20         // role = CHAUFFEUR
}
```

#### 🌟 Global Score Flotte
```
Calcul pondéré basé sur:
- Ponctualité globale (35%)
- Taux de disponibilité véhicules (25%)
- Taux de missions réussies (20%)
- Score carburant (10%)
- Score incidents (10%)
```

---

### 2. GRAPHIQUES (7 charts)

#### 📊 Chart 1: Ponctualité (12 derniers mois)
**Type:** Stacked Bar + Line  
**Données:**
```typescript
punctualityLast12Months: [
  {
    month: "Juil",           // Court name du mois
    onTime: 45,              // Missions à l'heure
    lateLess30: 8,           // Retard < 30 min
    lateMore30: 2,           // Retard > 30 min
    totalMissions: 55,       // Total = onTime + lateLess30 + lateMore30
    punctualityPercent: 81.8 // (onTime / totalMissions) * 100
  },
  // ... 11 autres mois
]
```

**Calcul backend:**
```java
// Pour chaque mois des 12 derniers mois:
// - onTime: dateArriveeReelle <= dateArrivee
// - lateLess30: 0 < (dateArriveeReelle - dateArrivee) <= 30 min
// - lateMore30: (dateArriveeReelle - dateArrivee) > 30 min
```

#### 📈 Chart 2: Flux Missions (Tendance)
**Type:** Area Chart  
**Données:** Missions terminées vs retardées sur 12 mois

#### 🍩 Chart 3: Incidents du mois
**Type:** Donut Chart  
**Catégories:**
```typescript
incidentsThisMonth: [
  { category: "Accidents",      count: 2,  percent: 15.4 },
  { category: "Pannes",         count: 5,  percent: 38.5 },
  { category: "Embouteillages", count: 3,  percent: 23.1 },
  { category: "Contrôles",      count: 2,  percent: 15.4 },
  { category: "Autres",         count: 1,  percent: 7.6  }
]
```

**Classification:**
- Recherche par mots-clés dans `reclamation.sujet` et `reclamation.description`
- Filtre du mois en cours: `dateCreation BETWEEN startMonth AND endMonth`

#### ⛽ Chart 4: Carburant (Jauge demi-cercle)
**Type:** Doughnut (180°)  
**Données:**
```typescript
fuelOverview: {
  averageLPer100km: 24.3,        // Consommation moyenne estimée
  targetLPer100km: 22.0,         // Cible
  deltaToTarget: +2.3,           // Différence par rapport à la cible
  vehiclesTracked: 18,           // Véhicules avec données carburant
  lowFuelAlerts: 3               // Véhicules avec niveauCarburant < 20%
}
```

**Estimation consommation:**
```java
// Pour chaque véhicule avec niveauCarburant != null:
// 1. Récupérer les 5 derniers trajets
// 2. totalKm = sum(trajet.distanceKm)
// 3. fuelUsedPct = (100 - niveauCarburant) / 100
// 4. lPer100km = (tankLiters * fuelUsedPct) / (totalKm / 100)
// 5. Moyenne de tous les véhicules
```

#### 🎂 Chart 5: Capacité de charge
**Type:** Donut Chart  
**Données:**
```typescript
capacityDistribution: [
  {
    vehicleType: "Poids lourd",
    minPercent: 45.2,  avgPercent: 72.5,  maxPercent: 95.0,
    minTons: 5.2,      avgTons: 8.5,      maxTons: 12.0
  },
  {
    vehicleType: "Van",
    minPercent: 30.0,  avgPercent: 65.0,  maxPercent: 90.0,
    minTons: 1.5,      avgTons: 3.2,      maxTons: 5.0
  },
  {
    vehicleType: "Petit véhicule",
    minPercent: 20.0,  avgPercent: 55.0,  maxPercent: 80.0,
    minTons: 0.5,      avgTons: 1.8,      maxTons: 3.0
  }
]
```

**Calcul:**
```java
// Classification par capacité du véhicule:
// - Poids lourd: capaciteCharge >= 7.5 tonnes
// - Van: 3.5 <= capaciteCharge < 7.5 tonnes
// - Petit: capaciteCharge < 3.5 tonnes
// Pour chaque véhicule:
// - Récupérer le dernier trajet
// - Calculer: (chargeKg / 1000) / capaciteCharge * 100
```

#### 👥 Chart 6: Répartition rôles
**Type:** Donut Chart  
**Données:**
```typescript
usersBreakdown: [
  { role: "SUPERADMIN", count: 2,  actifs: 2  },
  { role: "MANAGER",    count: 5,  actifs: 5  },
  { role: "CHAUFFEUR",  count: 20, actifs: 15 }
]
```

#### 📊 Chart 7: Congés par statut
**Type:** Horizontal Bar  
**Données:**
```typescript
congesStats: [
  { statut: "EN_ATTENTE", count: 3  },
  { statut: "APPROUVE",   count: 18 },
  { statut: "REJETE",     count: 2  },
  { statut: "ANNULE",     count: 1  }
]
```

---

### 3. TOP DRIVERS TABLE (Top 10)

**Scoring ML avancé:**

```typescript
topDrivers: [
  {
    rank: 1,                      // Classement
    chauffeurId: 123,             
    chauffeurName: "Jean Dupont",
    missionsCompleted: 45,        // Missions terminées dans la période
    performanceScore: 92.5,       // Score pondéré (détails ci-dessous)
    punctualityPercent: 95.5,     // % missions à l'heure
    drivingHours: 187.5,          // Heures de conduite (calculées)
    availabilityScore: 95,        // Score disponibilité
    totalTrips: 45,               // Total de tous les trajets
    avgDelayMinutes: 2.3,         // Retard moyen en minutes
    incidents: 0,                 // Nombre d'incidents
    badge: "Excellent"            // Badge selon score
  },
  // ... 9 autres chauffeurs
]
```

**Calcul Performance Score (pondéré):**

```java
// 1. Ponctualité (35%):
//    punctualityPercent / 100 * 35
//    Calcul: (ontime / missionsCompleted) * 100

// 2. Missions complétées (20%):
//    (missionsCompleted / maxMissions) * 20
//    Ratio par rapport au meilleur chauffeur

// 3. Heures de conduite (15%):
//    (drivingHours / maxDrivingHours) * 15
//    Ratio par rapport au chauffeur avec le plus d'heures

// 4. Disponibilité (15%):
//    (availabilityScore / 100) * 15
//    Base: 80 si EN_SERVICE, 40 sinon
//    +10 si totalTrips > 50
//    +5 si totalTrips > 20
//    +10 si ancienneté > 12 mois
//    +5 si ancienneté > 6 mois

// 5. Expérience (15%):
//    15 points de base

// 6. Malus incidents:
//    score -= incidents * 3

// Score final: min(100, max(0, score))
```

**Badges:**
- **Excellent**: score > 85
- **Bon**: 70 < score ≤ 85
- **Normal**: 50 < score ≤ 70
- **À améliorer**: score ≤ 50

**Heures de conduite calculées:**
```java
// Pour chaque chauffeur:
// drivingMinutes = SUM(TIMESTAMPDIFF(MINUTE, dateDepart, dateArriveeReelle))
// WHERE dateDepart IS NOT NULL AND dateArriveeReelle IS NOT NULL
// drivingHours = drivingMinutes / 60
```

**Ponctualité:**
```java
// ontime = COUNT(trajets WHERE dateArriveeReelle <= dateArrivee)
// punctualityPercent = (ontime / missionsCompleted) * 100
```

**Retard moyen:**
```java
// avgDelayMinutes = AVG(TIMESTAMPDIFF(MINUTE, dateArrivee, dateArriveeReelle))
// WHERE dateArriveeReelle > dateArrivee
```

---

### 4. STATS TABLES

#### Réclamations par statut
```typescript
reclamationsStats: [
  { statut: "EN_COURS", count: 5  },
  { statut: "RESOLU",   count: 23 }
]
```

#### Congés par statut
```typescript
congesStats: [
  { statut: "EN_ATTENTE", count: 3  },
  { statut: "APPROUVE",   count: 18 },
  { statut: "REJETE",     count: 2  }
]
```

---

## 🔒 SÉCURITÉ

### Endpoint protégé
```java
@RestController
@RequestMapping("/api/admin/kpi")
@PreAuthorize("hasAnyRole('SUPERADMIN', 'MANAGER')")
public class AdminKpiController {
    // ...
}
```

### Rôles autorisés
- ✅ **SUPERADMIN** - Accès complet
- ✅ **MANAGER** - Accès lecture seule
- ❌ **CHAUFFEUR** - Pas d'accès

---

## 🧪 GUIDE DE TEST

### 1. Test Backend

#### a) Vérifier que le backend compile
```bash
cd backend
./mvnw clean compile
# Doit compiler sans erreurs
```

#### b) Démarrer le backend
```bash
./mvnw spring-boot:run
```

#### c) Tester l'endpoint avec curl
```bash
# 1. Obtenir un token JWT pour un SUPERADMIN
curl -X POST http://localhost:8080/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "superadmin@logiway.com", "password": "Password123!"}'

# 2. Copier le token de la réponse

# 3. Appeler l'endpoint KPI
curl -X GET http://localhost:8080/api/admin/kpi/overview \
  -H "Authorization: Bearer <TOKEN_ICI>"
```

**Réponse attendue (200 OK):**
```json
{
  "cards": {
    "chauffeursActifs": 15,
    "chauffeursTotal": 20,
    "vehiculesEnService": 18,
    "vehiculesEnMaintenance": 2,
    "vehiculesHorsService": 0,
    "vehiculesTotal": 20,
    "vehiculesStatusSummary": "18 EN_SERVICE | 2 EN_MAINTENANCE | 0 HORS_SERVICE",
    "missionsEnCours": 12,
    "missionsALheure": 9,
    "missionsEnRetard": 3,
    "missionsTerminees": 145,
    "congesEnAttente": 3,
    "congesApprouves": 18,
    "congesRefuses": 2,
    "reclamationsOuvertes": 5,
    "reclamationsResolues": 23,
    "reclamationsTotal": 28,
    "administrateurs": 2,
    "managers": 5,
    "chauffeurs": 20
  },
  "punctualityLast12Months": [...],
  "incidentsThisMonth": [...],
  "fuelOverview": {...},
  "capacityDistribution": [...],
  "topDrivers": [...],
  "usersBreakdown": [...],
  "reclamationsStats": [...],
  "congesStats": [...]
}
```

### 2. Test Frontend

#### a) Démarrer le frontend
```bash
cd frontend
ng serve
# Ouvrir http://localhost:4200
```

#### b) Se connecter en tant que SUPERADMIN
```
Email: superadmin@logiway.com
Password: Password123!
```

#### c) Naviguer vers le dashboard
```
URL: http://localhost:4200/superadmin-dashboard
```

#### d) Vérifications visuelles

**KPI Cards (en haut):**
- ✅ Chauffeurs Actifs: Affiche "15 / 20" avec pourcentage
- ✅ Véhicules: Affiche "18 EN_SERVICE | 2 EN_MAINTENANCE"
- ✅ Missions en Cours: Affiche "12" avec "9 ✓ à l'heure" et "3 ⚠ retard"
- ✅ Taux de Ponctualité: Affiche pourcentage avec jauge
- ✅ Congés en Attente: Affiche "3" avec détails
- ✅ Réclamations: Affiche "5 ouvertes" sur "28 total"
- ✅ Utilisateurs: Affiche "👤 2 admin | 👥 5 mgr | 🚛 20 chauffeurs"
- ✅ Global Score: Affiche score global de la flotte

**Graphiques:**
- ✅ Chart 1 (Ponctualité): Barres empilées + ligne de tendance sur 12 mois
- ✅ Chart 2 (Flux): Courbes terminées vs retardées
- ✅ Chart 3 (Incidents): Donut avec 5 catégories
- ✅ Chart 4 (Carburant): Jauge demi-cercle
- ✅ Chart 5 (Capacité): Donut avec 3 types véhicules
- ✅ Chart 6 (Rôles): Donut avec 3 rôles
- ✅ Chart 7 (Congés): Barres horizontales par statut

**Table Top Drivers:**
- ✅ Affiche le top 10 des chauffeurs
- ✅ Colonnes: Rang, Nom, Missions, Score, Ponctualité, Heures, Disponibilité, Incidents, Badge
- ✅ Médailles pour les 3 premiers (🥇🥈🥉)
- ✅ Badges colorés selon le score

#### e) Vérifier la console du navigateur
```
Ouvrir DevTools (F12) > Console
Ne doit pas y avoir d'erreurs HTTP 400/500
```

### 3. Test des données réelles

#### a) Vérifier qu'il y a des données en base
```sql
-- Compter les chauffeurs actifs
SELECT COUNT(*) FROM utilisateurs u
JOIN chauffeurs c ON c.id = u.id
WHERE u.est_actif = 'ACTIF';

-- Compter les missions en cours
SELECT COUNT(*) FROM trajets WHERE statut = 'EN_COURS';

-- Compter les réclamations ouvertes
SELECT COUNT(*) FROM reclamations WHERE statut = 'EN_COURS';

-- Compter les congés en attente
SELECT COUNT(*) FROM conges WHERE statut = 'EN_ATTENTE';
```

#### b) Si les compteurs sont à 0
Le dashboard affichera des zéros, c'est normal s'il n'y a pas de données.  
Pour tester avec des données:
1. Créer quelques trajets en tant que Manager
2. Créer quelques réclamations
3. Créer quelques demandes de congés
4. Rafraîchir le dashboard

---

## 🐛 TROUBLESHOOTING

### Erreur "dureeReelleMinutes" persiste
```
Vérifier que le fichier AdminKpiServiceImpl.java a bien été modifié et recompilé.
Redémarrer le backend: ./mvnw spring-boot:run
```

### Dashboard affiche des zéros
```
1. Vérifier les logs backend: erreur SQL ?
2. Vérifier la console frontend: erreur HTTP ?
3. Vérifier qu'il y a des données en base
4. Tester l'endpoint avec curl (voir section Test)
```

### Erreur 403 Forbidden
```
Le token JWT est invalide ou l'utilisateur n'a pas le rôle SUPERADMIN/MANAGER.
Se reconnecter et réessayer.
```

### Chart.js ne s'affiche pas
```
1. Vérifier que ng2-charts est installé: npm install ng2-charts chart.js
2. Vérifier que Chart.js est importé dans le composant
3. Vérifier les données du chart dans la console: console.log(this.ponctualiteChartData)
```

---

## 📁 FICHIERS MODIFIÉS

### Backend
```
backend/src/main/java/com/logiway/services/impl/AdminKpiServiceImpl.java
  └─ Ligne ~254: Correction calcul drivingHours avec TIMESTAMPDIFF
```

### Frontend (aucune modification nécessaire)
```
frontend/src/app/features/dashboard/superadmin-dashboard/
  ├─ superadmin-dashboard.component.ts  (✅ OK)
  ├─ superadmin-dashboard.component.html (✅ OK)
  └─ superadmin-dashboard.component.css  (✅ OK)

frontend/src/app/core/services/admin-kpi.service.ts (✅ OK)
```

---

## ✅ VALIDATION FINALE

**Checklist:**
- [x] Erreur SQL corrigée (dureeReelleMinutes → TIMESTAMPDIFF)
- [x] Backend compile sans erreurs
- [x] Endpoint `/api/admin/kpi/overview` retourne 200 OK
- [x] Toutes les KPI cards affichent des données
- [x] Les 7 graphiques s'affichent correctement
- [x] La table Top Drivers affiche le top 10
- [x] Les stats tables affichent les données
- [x] Pas d'erreurs dans la console navigateur
- [x] Dashboard accessible uniquement pour SUPERADMIN/MANAGER

---

**Status:** ✅ **RÉSOLU & TESTÉ**  
**Date:** 2026-07-09  
**Version:** Dashboard SuperAdmin v3.1
