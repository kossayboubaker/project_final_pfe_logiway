# 🧪 GUIDE DE TEST - CORRECTION ERREUR 500

## 🎯 OBJECTIF
Vérifier que la correction de l'erreur 500 fonctionne correctement

---

## ✅ PRÉREQUIS

- [x] Code corrigé dans `pause-ai-service/app.py` (lignes 410-411)
- [x] Modèle ML ré-entraîné avec scikit-learn 1.9.0
- [ ] Service Flask actuel arrêté (ou prêt à être redémarré)
- [ ] Backend Java Spring Boot en cours d'exécution (port 8080)
- [ ] Frontend Angular en cours d'exécution (port 4200)

---

## 📋 PROCÉDURE DE TEST (5 MINUTES)

### Étape 1: Redémarrer le service Pause AI (1 min)

**Option A - Script automatique (recommandé):**
```powershell
cd C:\Users\kossa\OneDrive\Desktop\essais\pause-ai-service
.\RESTART_SERVICE.bat
```

**Option B - Manuel:**
```powershell
cd C:\Users\kossa\OneDrive\Desktop\essais\pause-ai-service

# Si un service tourne déjà, appuyer sur CTRL+C pour l'arrêter

python app.py
```

**✅ Résultat attendu dans la console:**
```
* Serving Flask app 'app'
* Debug mode: on
WARNING: This is a development server...
* Running on http://127.0.0.1:5000
* Running on http://192.168.1.116:5000
```

🔴 **Si erreur à cette étape:**
- Vérifier que Python est installé: `python --version`
- Vérifier que les dépendances sont installées: `pip list | findstr flask`
- Vérifier que le port 5000 est libre: `netstat -ano | findstr :5000`

---

### Étape 2: Test API direct (30 sec)

**Dans un NOUVEAU terminal PowerShell:**
```powershell
# Test 1: Health Check
curl http://localhost:5000/api/health
```

**✅ Résultat attendu:**
```json
{
  "status": "ok",
  "model_trained": true,
  "model_version": "v3.0-ml"
}
```

**Test 2: Prédiction courte (< 3h)**
```powershell
curl -X POST http://localhost:5000/api/predict `
  -H "Content-Type: application/json" `
  -d '{
    "startLat": 48.8566,
    "startLon": 2.3522,
    "endLat": 48.9,
    "endLon": 2.4,
    "trip_id": 80,
    "trip_duration_minutes": 57
  }'
```

**✅ Résultat attendu:**
```json
{
  "stops": [],
  "meta": {
    "break_alert_applicable": false,
    "trip_duration_minutes": 57,
    ...
  }
}
```

**Console Flask attendue:**
```
127.0.0.1 - - [27/Jul/2026 17:40:00] "GET /api/health HTTP/1.1" 200 -
127.0.0.1 - - [27/Jul/2026 17:40:10] "POST /api/predict HTTP/1.1" 200 -
```

🔴 **Si code 500 à cette étape:**
- Le traceback Python s'affiche maintenant (debug=True)
- Copier l'erreur complète et analyser
- Vérifier que les modifications lignes 410-411 sont présentes

---

### Étape 3: Test via Backend Java (1 min)

**Dans le terminal Backend Java, observer les logs:**
```
2026-07-27 17:40:15 INFO  PauseAIServiceImpl - Appel Pause AI pour trajet 80
2026-07-27 17:40:16 INFO  PauseAIServiceImpl - Pause AI réponse: 200 OK
```

**Tester via API Backend:**
```powershell
curl http://localhost:8080/api/pauseai/trajets/80/pauses-completes
```

**✅ Résultat attendu:**
```json
{
  "pausesRecommandees": [...],
  "meta": {
    "trajet_id": 80,
    "duree_trajet_minutes": 57,
    ...
  }
}
```

🔴 **Si erreur 500 du Backend:**
- Vérifier que le service Pause AI est bien accessible depuis Java
- Vérifier l'URL dans `application.yml`: `pause-ai.service.url=http://localhost:5000`
- Consulter `backend/logs/application.log`

---

### Étape 4: Test Frontend Angular (2 min)

1. **Ouvrir l'application dans le navigateur:**
   ```
   http://localhost:4200
   ```

2. **Se connecter** (si nécessaire)

3. **Aller sur la carte** (menu Map / Carte)

4. **Sélectionner le trajet 80** dans la liste des trajets

5. **Ouvrir la console du navigateur** (F12)

**✅ Résultat attendu dans la console:**
```javascript
[PauseMap] 🔄 Chargement des pauses complètes pour trajet 80
[PauseAIService] 🗺️ Récupération des pauses complètes pour trajet 80
[PauseMap] ✅ Pauses chargées: X arrêts recommandés
```

**✅ Résultat attendu sur la carte:**
- Le trajet 80 s'affiche en bleu sur la carte
- Des markers de pause apparaissent le long du trajet
- Aucune erreur "Cannot read properties of undefined"

🔴 **Si erreur dans la console:**
```javascript
[PauseMap] ❌ Impossible de charger les pauses complètes du trajet 80
HttpErrorResponse {status: 500, ...}
```
→ Retour à l'Étape 2 pour debug API

---

### Étape 5: Test avec trajet long (> 3h) - BONUS (1 min)

**Tester avec un trajet réaliste:**
```powershell
curl -X POST http://localhost:5000/api/predict `
  -H "Content-Type: application/json" `
  -d '{
    "startLat": 48.8566,
    "startLon": 2.3522,
    "endLat": 43.6047,
    "endLon": 1.4442,
    "trip_duration_minutes": 420,
    "departure_time": "2026-07-27T08:00:00"
  }'
```

**✅ Résultat attendu:**
```json
{
  "stops": [
    {
      "type": "WARNING_ALERT",
      "lat": ...,
      "lon": ...,
      "nomLieu": "Alerte de conduite - 3h",
      ...
    },
    {
      "type": "STATION_SERVICE",
      "lat": ...,
      "lon": ...,
      ...
    },
    {
      "type": "MANDATORY_REST",
      "nomLieu": "Arrêt obligatoire - 4h30",
      ...
    }
  ],
  "meta": {
    "break_alert_applicable": true,
    "num_stops": 3 ou plus,
    ...
  }
}
```

---

## 📊 CHECKLIST DE VALIDATION

### Tests API (Service Pause AI)
- [ ] ✅ Health check retourne 200 OK
- [ ] ✅ Predict court (< 3h) retourne 200 avec stops=[]
- [ ] ✅ Predict long (> 3h) retourne 200 avec stops=[...]
- [ ] ✅ Console Flask affiche "200" (pas "500")
- [ ] ✅ Aucun traceback d'erreur Python

### Tests Backend (Spring Boot)
- [ ] ✅ Endpoint `/api/pauseai/trajets/{id}/pauses-completes` retourne 200
- [ ] ✅ Logs backend montrent "Pause AI réponse: 200 OK"
- [ ] ✅ Données JSON bien formées

### Tests Frontend (Angular)
- [ ] ✅ Trajet 80 sélectionné affiche la carte
- [ ] ✅ Markers de pause visibles sur la carte
- [ ] ✅ Console browser sans erreur 500
- [ ] ✅ Pas d'erreur "Cannot read properties of undefined"

---

## 🎯 RÉSULTAT FINAL ATTENDU

### ✅ SUCCÈS si:
1. Tous les tests API retournent code 200 ✅
2. Aucune erreur 500 dans Flask ✅
3. Aucune erreur 500 dans Backend Java ✅
4. Pauses visibles sur la carte Frontend ✅
5. Console browser sans erreur ✅

### ❌ ÉCHEC si:
- Erreur 500 persiste dans Flask
- Traceback Python `NameError: name 'amenity' is not defined`
- Erreur 500 dans le Frontend

---

## 🔧 DÉPANNAGE RAPIDE

### Problème: Erreur 500 persiste
**Solution:**
1. Vérifier que le fichier `app.py` contient bien:
   ```python
   amenity = tags.get("amenity", "")
   highway_type = tags.get("highway", "")
   ```
   aux lignes 410-411

2. Redémarrer complètement Flask (CTRL+C puis `python app.py`)

3. Vérifier la console Flask pour le traceback Python complet

### Problème: Service ne démarre pas
**Solution:**
```powershell
# Vérifier Python
python --version

# Vérifier dépendances
pip install -r requirements.txt

# Vérifier port libre
netstat -ano | findstr :5000
```

### Problème: Frontend ne reçoit pas les données
**Solution:**
1. Vérifier que le Backend Java est démarré (port 8080)
2. Tester l'API Backend directement avec curl
3. Vérifier les logs Backend: `backend/logs/application.log`

---

## 📖 DOCUMENTATION ASSOCIÉE

- **Résumé court:** `SOLUTION_FINALE_PAUSE_AI.txt`
- **Documentation technique:** `CORRECTION_ERREUR_500_FINALE.md`
- **Historique debug:** `HISTORIQUE_DEBUG_ERREUR_500.md`
- **Index complet:** `INDEX_CORRECTION_ERREUR_500.md`

---

## ⏱️ ESTIMATION TEMPS TOTAL

| Étape | Temps estimé |
|-------|--------------|
| 1. Redémarrer service | 1 min |
| 2. Test API direct | 30 sec |
| 3. Test Backend Java | 1 min |
| 4. Test Frontend | 2 min |
| 5. Test bonus trajet long | 1 min |
| **TOTAL** | **5 min 30** |

---

**Date:** 27 juillet 2026  
**Version:** v3.0-ml  
**Statut:** ✅ Prêt à tester

---

**COMMENCER LE TEST MAINTENANT** 🚀

```powershell
cd pause-ai-service
.\RESTART_SERVICE.bat
```
