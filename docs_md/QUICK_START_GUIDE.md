# 🚀 Guide de Démarrage Rapide - Système de Pause IA

**Date**: 4 juillet 2026  
**Version**: 1.0  
**Temps estimé**: 5 minutes

---

## 🎯 Objectif

Ce guide vous permet de démarrer et tester le système de pauses réglementaires IA en moins de 5 minutes.

---

## ✅ Prérequis

Vérifiez que vous avez :
- ✅ Java 17+
- ✅ Node.js 18+
- ✅ Python 3.9+
- ✅ PostgreSQL (déjà configuré)
- ✅ Maven
- ✅ npm/pnpm

---

## 🚦 Démarrage en 3 étapes

### Étape 1 : Démarrer le modèle IA Python

```bash
# Terminal 1 : Service IA Flask
cd pause-ai-service
python app.py

# ✅ Vous devriez voir :
# * Running on http://127.0.0.1:5000
# * Model loaded successfully (R²=0.90)
```

**Vérification** :
```bash
curl http://localhost:5000/health
# Réponse attendue: {"status": "healthy", "model": "loaded"}
```

---

### Étape 2 : Démarrer le backend Spring Boot

```bash
# Terminal 2 : Backend Java
cd backend
mvn spring-boot:run

# ✅ Vous devriez voir :
# Started LogiwayApplication in X.XXX seconds
# Flyway migration V9 applied successfully
```

**Vérification** :
```bash
curl http://localhost:8080/api/health
# Réponse attendue: {"status": "UP"}
```

---

### Étape 3 : Démarrer le frontend Angular

```bash
# Terminal 3 : Frontend Angular
cd frontend
npm start

# ✅ Vous devriez voir :
# ** Angular Live Development Server is listening on localhost:4200
# ✔ Compiled successfully
```

**Accès** : Ouvrez votre navigateur sur http://localhost:4200

---

## 🧪 Test Rapide (2 minutes)

### Test 1 : Vérifier l'affichage des markers

1. **Connectez-vous** à l'application
2. **Allez sur la carte** (menu latéral → Carte)
3. **Vérifiez** :
   - ✅ Les véhicules sont visibles
   - ✅ Les markers de pause (⏰, ⛽, 🌿, ☕) sont affichés
   - ✅ Les markers sont de taille réduite (ne cachent pas les véhicules)
   - ✅ Les markers ne clignotent PAS

### Test 2 : Vérifier le popup enrichi

1. **Cliquez sur un marker de pause** (n'importe lequel)
2. **Vérifiez** que le popup affiche :
   - ✅ Score global (/100)
   - ✅ **Grille de 4 scores détaillés** :
     - 😴 Fatigue
     - ♿ Accessibilité
     - 🧠 Contexte
     - ✓ Confiance IA
   - ✅ **Distance depuis le départ** (ex: "Depuis départ: 120 km")
   - ✅ **Type POI en français** (ex: "Station-service" au lieu de "STATION_SERVICE")
   - ✅ **6 badges d'équipements** (PL, Douches, Toilettes, 24h, Restaurant, Carburant)
   - ✅ **Icône dynamique** selon le type de POI (⛽, 🌿, ☕, etc.)

### Test 3 : Vérifier l'API directe

```bash
# Test endpoint complet
curl http://localhost:8080/api/pauseai/trajets/1/pauses-completes

# ✅ Vous devriez recevoir un JSON avec :
# - Liste de stops
# - Chaque stop avec : latitude, longitude, type, name, score
# - Scores détaillés : fatigueScore, accessibilityScore, contextScore, confidence
# - Distance : distanceFromStartKm
# - Équipements : equipment { hgv, shower, toilets, restaurant, fuel, ... }
```

---

## 🔍 Vérification des Logs

### Backend (Spring Boot)

```bash
# Voir les logs en temps réel
tail -f backend/logs/application.log

# Filtrer les logs IA
tail -f backend/logs/application.log | grep "PauseAI"
```

**Messages attendus** :
```
INFO  PauseAIScheduler - Évaluation automatique : 3 trajets EN_COURS détectés
INFO  PauseAIServiceImpl - Évaluation trajet 123 : score=78, type=WARNING_ALERT
INFO  PauseAIServiceImpl - getPausesCompletes appelé pour trajet 123
```

### Frontend (Console navigateur)

1. Ouvrez la console navigateur (F12)
2. Filtrez par "pauseai" ou "pause"
3. **Messages attendus** :
```
[PauseAIService] getPausesCompletes(123) appelé
[PauseAIService] Reçu 5 points de pause
[MapComponent] Markers chargés pour trajet 123 : 5 markers
[MapComponent] Skip rechargement trajet 123 (déjà chargé)
```

---

## 📊 Dashboard IA (Optionnel)

### Accès au dashboard

**Prérequis** : Vous devez être connecté comme SUPERADMIN ou MANAGER

1. Menu latéral → **Analytics IA Pauses**
2. **Vérifiez** les statistiques :
   - Total recommandations
   - Pauses effectuées
   - Taux de conformité
   - Graphiques de scores

### Test API Dashboard

```bash
# Pour tous les trajets (SUPERADMIN/MANAGER)
curl -H "Authorization: Bearer YOUR_TOKEN" \
  "http://localhost:8080/api/pauseai/dashboard?startDate=2026-07-01&endDate=2026-07-04"

# Pour un chauffeur spécifique
curl -H "Authorization: Bearer YOUR_TOKEN" \
  "http://localhost:8080/api/pauseai/dashboard?startDate=2026-07-01&endDate=2026-07-04&chauffeurId=1"
```

---

## 🐛 Résolution de Problèmes Courants

### Problème 1 : Markers ne s'affichent pas

**Causes possibles** :
1. Service Flask non démarré
2. Backend ne peut pas joindre Flask
3. Pas de trajets actifs

**Solution** :
```bash
# 1. Vérifier Flask
curl http://localhost:5000/health

# 2. Vérifier configuration backend
grep "pause.ai.url" backend/src/main/resources/application.yml
# Doit être : pause.ai.url: http://localhost:5000

# 3. Vérifier trajets actifs
curl http://localhost:8080/api/trajets | grep EN_COURS
```

### Problème 2 : Markers clignotent

**Cause** : Ancienne version du code (normalement corrigé)

**Vérification** :
```typescript
// Dans frontend/src/app/features/map/map.component.ts
// La méthode refreshPauseMarkersForTrips doit contenir :
if (this.pauseMarkersByTrip.has(trip.id)) {
  return; // Skip si déjà chargé
}
```

### Problème 3 : Scores détaillés non affichés

**Cause** : Les données du backend ne contiennent pas les scores

**Vérification** :
```bash
# Vérifier la réponse API
curl http://localhost:8080/api/pauseai/trajets/1/pauses-completes | jq '.[0]'

# Doit contenir :
# - fatigueScore
# - accessibilityScore
# - contextScore
# - confidence
```

**Solution** : Assurez-vous que le modèle Flask retourne ces champs

### Problème 4 : Erreur "lat/lon not found"

**Cause** : Le modèle Flask retourne `lat`/`lon`, pas `latitude`/`longitude`

**Solution** : Le mapping est fait automatiquement dans `PauseAIServiceImpl.java` :
```java
mapped.put("latitude", stop.getDouble("lat"));
mapped.put("longitude", stop.getDouble("lon"));
```

Vérifiez que cette ligne existe dans la méthode `getPausesCompletes()`.

### Problème 5 : Build Maven échoue

**Erreur** : Erreurs de compilation

**Solution** :
```bash
cd backend
mvn clean compile

# Si erreurs persistent, vérifier :
# 1. Java version (doit être 17+)
java -version

# 2. Dépendances
mvn dependency:resolve

# 3. Recompiler
mvn clean install -DskipTests
```

### Problème 6 : Build Angular échoue

**Erreur** : Cannot find module

**Solution** :
```bash
cd frontend

# Nettoyer et réinstaller
rm -rf node_modules package-lock.json
npm install

# Rebuild
npm run build
```

---

## 📱 Interface Mobile (Responsive)

Le système est responsive et fonctionne sur mobile/tablette :

**Tests recommandés** :
1. Ouvrez sur mobile (F12 → Mode responsive)
2. Vérifiez que :
   - La carte s'affiche correctement
   - Le popup est lisible (grille de scores en 1 colonne au lieu de 2)
   - Les boutons sont cliquables

---

## 🎓 Commandes Utiles

### Backend

```bash
# Démarrer
mvn spring-boot:run

# Compiler seulement
mvn clean compile

# Tests
mvn test

# Package JAR
mvn clean package

# Logs en temps réel
tail -f logs/application.log
```

### Frontend

```bash
# Démarrer dev
npm start

# Build production
npm run build

# Lint
npm run lint

# Tests (si configurés)
npm test
```

### Python (Modèle IA)

```bash
# Démarrer Flask
python app.py

# Avec debug
python app.py --debug

# Tester endpoint
curl http://localhost:5000/api/predict?trajet_id=1
```

---

## 📚 Documentation Complète

Pour aller plus loin :

1. **[README_PAUSE_IA_COMPLETE.md](README_PAUSE_IA_COMPLETE.md)** - Guide de navigation
2. **[INTEGRATION_FINALE_COMPLETE.md](INTEGRATION_FINALE_COMPLETE.md)** - Détails techniques complets
3. **[AMELIORATIONS_PAUSE_IA.md](AMELIORATIONS_PAUSE_IA.md)** - Fonctionnalités innovantes (35 pages)
4. **[TEST_QUICK_GUIDE.md](TEST_QUICK_GUIDE.md)** - Guide de tests détaillé
5. **[COMMANDES_TEST.md](COMMANDES_TEST.md)** - Toutes les commandes utiles
6. **[FIX_CLIGNOTEMENT_MARKERS.md](FIX_CLIGNOTEMENT_MARKERS.md)** - Diagnostic et solution
7. **[SOLUTION_AFFICHAGE_PAUSES_CARTE.md](SOLUTION_AFFICHAGE_PAUSES_CARTE.md)** - Architecture complète

---

## ✅ Checklist de Vérification

Avant de considérer que tout fonctionne, vérifiez :

### Services
- [ ] Flask démarre sans erreur (port 5000)
- [ ] Backend démarre sans erreur (port 8080)
- [ ] Frontend démarre sans erreur (port 4200)
- [ ] PostgreSQL est accessible

### Endpoints
- [ ] `GET http://localhost:5000/health` → 200 OK
- [ ] `GET http://localhost:8080/api/health` → 200 OK
- [ ] `GET http://localhost:8080/api/pauseai/trajets/1/pauses-completes` → 200 OK

### Interface
- [ ] Carte s'affiche avec véhicules
- [ ] Markers de pause visibles (8 types)
- [ ] Markers ne clignotent pas
- [ ] Markers taille réduite (bien voir véhicules)
- [ ] Popup s'ouvre au clic

### Popup Enrichi
- [ ] Score global affiché
- [ ] Grille 4 scores (Fatigue, Accessibilité, Contexte, Confiance)
- [ ] Distance depuis départ visible
- [ ] Type POI en français
- [ ] 6 badges équipements (dont Restaurant et Carburant)
- [ ] Icône POI dynamique (pas "local_parking" partout)

### Performance
- [ ] Pas de rechargement inutile (vérifier console)
- [ ] Temps de réponse API < 1s
- [ ] Pas d'erreur dans les logs

---

## 🎯 Prochaines Étapes

Une fois que tout fonctionne :

1. **Tests avec données réelles** : Créez des trajets en cours et observez les recommandations
2. **Ajustement des seuils** : Modifiez les seuils de scoring selon vos besoins
3. **Formation utilisateurs** : Formez les chauffeurs et managers
4. **Monitoring** : Surveillez les logs et métriques
5. **Évolutions** : Consultez [AMELIORATIONS_PAUSE_IA.md](AMELIORATIONS_PAUSE_IA.md) pour les fonctionnalités futures

---

## 📞 Support

En cas de problème non résolu :

1. **Vérifier les logs** (backend, frontend, Flask)
2. **Consulter la documentation** (9 fichiers .md disponibles)
3. **Tester les endpoints** manuellement avec curl
4. **Vérifier la configuration** (application.yml, environment.ts)

---

**Bon démarrage ! 🚀**

---

**Auteur** : Kiro AI Assistant  
**Version** : 1.0  
**Dernière mise à jour** : 4 juillet 2026
