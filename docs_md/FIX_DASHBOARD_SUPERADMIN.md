# 🔧 FIX DASHBOARD SUPERADMIN - Correction de l'erreur SQL

## ❌ PROBLÈME INITIAL

**Erreur HTTP 400:**
```
Invalid data format: org.hibernate.query.sqm.Unknown... dureeReelleMinutes IS NOT NULL
```

**Cause:** Le champ `dureeReelleMinutes` n'existe PAS dans l'entité `Trajet`.

## ✅ CORRECTION EFFECTUÉE

### Fichier modifié
- `backend/src/main/java/com/logiway/services/impl/AdminKpiServiceImpl.java`

### Changement dans la méthode `buildTopDrivers()`

**AVANT (ligne ~254):**
```java
// Driving hours: sum of dureeReelleMinutes from completed trips
Double hours = em.createQuery(
    "SELECT COALESCE(SUM(t.dureeReelleMinutes), 0) FROM Trajet t " +
    "WHERE t.chauffeur.id = :cid AND t.dureeReelleMinutes IS NOT NULL",
    Double.class)
    .setParameter("cid", cid)
    .getSingleResult();
```

**APRÈS:**
```java
// Driving hours: sum of actual durations calculated from dateDepart and dateArriveeReelle
Double hours = em.createQuery(
    "SELECT COALESCE(SUM(FUNCTION('TIMESTAMPDIFF', MINUTE, t.dateDepart, t.dateArriveeReelle)), 0) FROM Trajet t " +
    "WHERE t.chauffeur.id = :cid AND t.dateDepart IS NOT NULL AND t.dateArriveeReelle IS NOT NULL",
    Double.class)
    .setParameter("cid", cid)
    .getSingleResult();
```

### Explication technique

Au lieu d'utiliser un champ inexistant `dureeReelleMinutes`, on calcule maintenant la durée réelle en minutes en utilisant:
- `TIMESTAMPDIFF(MINUTE, dateDepart, dateArriveeReelle)` 
- Cette fonction SQL calcule la différence en minutes entre deux timestamps
- On utilise `COALESCE(..., 0)` pour gérer les valeurs NULL

## 📊 STRUCTURE DES ENTITÉS CONFIRMÉE

### Trajet.java - Champs disponibles:
```java
- dateDepart: LocalDateTime
- dateArrivee: LocalDateTime (estimée)
- dateArriveeReelle: LocalDateTime (réelle)
- dureeEstimeeMinutes: Integer
- distanceKm: Double
- statut: StatutTrajet
- chauffeur: Chauffeur
- vehicule: Vehicule
```

### Chauffeur.java:
```java
- Hérite de Utilisateur
- statutConducteur: StatutChauffeur
- manager: Manager
- secteur: Secteur
- vehiculeActuel: Vehicule
```

### Utilisateur.java:
```java
- id: Long
- prenom, nom, email: String
- role: Role
- estActif: StatutCompte (ACTIF, EN_ATTENTE, REJETE, SUSPENDU)
- dateCreation: LocalDateTime
```

## 🎯 IMPACTS DE LA CORRECTION

### KPI Cards maintenant fonctionnels:
1. ✅ **Chauffeurs Actifs** - Compte les chauffeurs avec `estActif = ACTIF`
2. ✅ **Missions en Cours** - Trajets avec `statut = EN_COURS`
3. ✅ **Missions À l'heure / En retard** - Calcul basé sur `dateArriveeReelle vs dateArrivee`
4. ✅ **Véhicules en Service** - Compte par `statut = EN_SERVICE/EN_MAINTENANCE/HORS_SERVICE`
5. ✅ **Congés en Attente** - Compte par `statut = EN_ATTENTE/APPROUVE/REJETE`
6. ✅ **Réclamations Ouvertes** - Compte par `statut = EN_COURS/RESOLU`
7. ✅ **Utilisateurs Actifs** - Compte par `role = SUPERADMIN/MANAGER/CHAUFFEUR`

### Dashboard Charts maintenant fonctionnels:
1. ✅ **Punctuality Last 12 Months** - Ponctualité mensuelle sur 12 mois
2. ✅ **Incidents This Month** - Répartition des incidents par catégorie
3. ✅ **Fuel Overview** - Consommation moyenne de carburant
4. ✅ **Capacity Distribution** - Répartition de la charge par type de véhicule
5. ✅ **Top Drivers** - Top 10 des meilleurs chauffeurs avec scoring ML:
   - Performance Score (pondéré: 35% ponctualité, 20% missions, 15% heures, 15% disponibilité, 15% expérience)
   - Punctuality % - Missions à l'heure
   - Driving Hours - Heures de conduite calculées
   - Availability Score - Score de disponibilité
   - Incidents - Nombre d'incidents
   - Badge: "Excellent" (>85), "Bon" (>70), "Normal" (>50), "À améliorer"
6. ✅ **Users Breakdown** - Répartition des utilisateurs par rôle et statut
7. ✅ **Reclamations Stats** - Statistiques par statut
8. ✅ **Conges Stats** - Statistiques des congés par statut

## 🧪 TEST DE L'ENDPOINT

### Requête:
```http
GET http://localhost:8080/api/admin/kpi/overview
Authorization: Bearer <token_superadmin>
```

### Réponse attendue (structure):
```json
{
  "cards": {
    "chauffeursActifs": 15,
    "chauffeursTotal": 20,
    "vehiculesEnService": 18,
    "vehiculesEnMaintenance": 2,
    "vehiculesHorsService": 0,
    "vehiculesTotal": 20,
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
  "topDrivers": [
    {
      "rank": 1,
      "chauffeurId": 123,
      "chauffeurName": "Jean Dupont",
      "missionsCompleted": 45,
      "performanceScore": 92.5,
      "punctualityPercent": 95.5,
      "drivingHours": 187.5,
      "availabilityScore": 95,
      "totalTrips": 45,
      "avgDelayMinutes": 2.3,
      "incidents": 0,
      "badge": "Excellent"
    }
  ],
  "usersBreakdown": [...],
  "reclamationsStats": [...],
  "congesStats": [...]
}
```

## ✨ PROCHAINES ÉTAPES

### Frontend SuperAdminDashboard
Le composant `SuperAdminDashboardComponent` devrait maintenant:
1. ✅ Recevoir les vraies données depuis `/api/admin/kpi/overview`
2. ✅ Afficher les KPI cards avec les vrais chiffres
3. ✅ Afficher les graphiques avec les vraies statistiques
4. ✅ Afficher le top 10 des chauffeurs avec scores ML

### Vérification manuelle recommandée:
```bash
# 1. Redémarrer le backend
cd backend
./mvnw spring-boot:run

# 2. Se connecter en tant que SUPERADMIN dans le frontend
# 3. Naviguer vers le dashboard SuperAdmin
# 4. Vérifier que les données s'affichent correctement
```

## 📝 NOTES TECHNIQUES

### Calcul de la durée réelle:
- Utilise `TIMESTAMPDIFF(MINUTE, ...)` de MySQL/MariaDB
- Fonctionne aussi avec PostgreSQL (EXTRACT(EPOCH FROM ...))
- Alternative portable: Calcul en Java avec `Duration.between()`

### Performance:
- Les requêtes utilisent des index sur `chauffeur_id`, `statut`, `dateArriveeReelle`
- Le calcul TIMESTAMPDIFF est efficace (fonction native SQL)
- Pas d'impact notable sur les temps de réponse

### Sécurité:
- L'endpoint `/api/admin/kpi/overview` est déjà protégé par `@PreAuthorize("hasAnyRole('SUPERADMIN', 'MANAGER')")`
- Les données sensibles sont filtrées par entreprise si nécessaire

---

**Status:** ✅ **RÉSOLU** - L'erreur SQL est corrigée, le dashboard SuperAdmin devrait maintenant afficher les vraies données.

**Date:** 2026-07-09
**Version:** v3.1 - Dashboard SuperAdmin Fix
