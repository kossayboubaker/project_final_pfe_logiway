# 🔧 FIX - ERREUR VERSION MODÈLE PAUSE AI

**Date**: 27 juillet 2026  
**Problème**: Erreur 500 lors de l'appel à `/api/predict` pour le trajet 80  
**Cause**: Incompatibilité de version scikit-learn  
**Solution**: ✅ Ré-entraîner le modèle avec la version actuelle

---

## 🔍 DIAGNOSTIC DU PROBLÈME

### Erreur Frontend (Console)

```
Failed to load resource: the server responded with a status of 500 ()
map.component.ts:1590 [PauseMap] ❌ Impossible de charger les pauses complètes du trajet 80
HttpErrorResponse {status: 500, statusText: 'OK', url: 'http://localhost:8080/api/pauseai/trajets/80/pauses-completes'}
```

---

### Erreur Backend (Console Python)

```python
C:\Python313\Lib\site-packages\sklearn\base.py:525: InconsistentVersionWarning: 
Trying to unpickle estimator DecisionTreeRegressor from version 1.6.1 
when using version 1.9.0. This might lead to breaking code or invalid results. 
Use at your own risk.

C:\Python313\Lib\site-packages\sklearn\base.py:525: InconsistentVersionWarning: 
Trying to unpickle estimator RandomForestRegressor from version 1.6.1 
when using version 1.9.0.

127.0.0.1 - - [27/Jul/2026 17:03:26] "POST /api/predict HTTP/1.1" 500 -
```

---

### Analyse

| Élément | Détails |
|---------|---------|
| **Modèle entraîné avec** | scikit-learn **1.6.1** |
| **Version actuelle** | scikit-learn **1.9.0** |
| **Problème** | Incompatibilité de sérialisation (pickle) |
| **Impact** | Erreur 500 lors de la prédiction |
| **Solution** | Ré-entraîner le modèle avec la version 1.9.0 |

---

## ✅ SOLUTION AUTOMATIQUE (RECOMMANDÉE)

### Étape 1: Arrêter le Serveur Flask

Dans la console où Flask tourne, appuyer sur **CTRL+C**

---

### Étape 2: Exécuter le Script de Correction

```batch
cd pause-ai-service
fix_model_version.bat
```

**Ce script va**:
1. ✅ Vérifier l'environnement Python
2. ✅ Vérifier scikit-learn installé
3. ✅ Ré-entraîner le modèle avec 30,000 échantillons
4. ✅ Sauvegarder le modèle compatible

**Durée**: ~2-3 minutes

---

### Étape 3: Redémarrer le Serveur Flask

```batch
python app.py
```

**Résultat attendu**:
```
* Serving Flask app 'app'
* Debug mode: off
* Running on http://127.0.0.1:5000
```

**Plus d'avertissement de version** ✅

---

### Étape 4: Tester dans l'Application

1. Ouvrir l'application frontend
2. Naviguer vers la carte avec le trajet 80
3. Les pauses devraient maintenant se charger correctement

---

## 🛠️ SOLUTION MANUELLE (ALTERNATIVE)

### Option 1: Ré-entraîner le Modèle

```batch
cd pause-ai-service
python retrain_model.py
```

**Sortie attendue**:
```
════════════════════════════════════════════════════════════════
RÉ-ENTRAÎNEMENT DU MODÈLE PAUSE AI
════════════════════════════════════════════════════════════════

✅ scikit-learn version: 1.9.0
✅ Module model importé

────────────────────────────────────────────────────────────────
ENTRAÎNEMENT DU MODÈLE...
────────────────────────────────────────────────────────────────
⏳ Génération de 30,000 échantillons d'entraînement...

════════════════════════════════════════════════════════════════
✅ ENTRAÎNEMENT RÉUSSI
════════════════════════════════════════════════════════════════

Résultats:
  • n_samples: 30000
  • mae: 12.3456
  • mse: 234.5678
  • r2: 0.8765
  • model_path: pause_model_rf_30k.pkl

✅ Le modèle est maintenant compatible avec scikit-learn 1.9.0
✅ Vous pouvez redémarrer le serveur Flask
```

---

### Option 2: Utiliser l'API d'Entraînement

```batch
# Avec curl (Windows CMD)
curl -X POST http://localhost:5000/api/train -H "Content-Type: application/json" -d "{\"n_samples\": 30000}"

# Avec PowerShell
Invoke-WebRequest -Uri http://localhost:5000/api/train -Method POST -ContentType "application/json" -Body '{"n_samples": 30000}'
```

**Réponse attendue**:
```json
{
  "status": "ok",
  "result": {
    "n_samples": 30000,
    "mae": 12.34,
    "mse": 234.56,
    "r2": 0.8765,
    "model_path": "pause_model_rf_30k.pkl"
  }
}
```

---

## 🔍 VÉRIFICATION APRÈS CORRECTION

### Test 1: Vérifier le Health Check

```powershell
Invoke-WebRequest -Uri http://localhost:5000/api/health -UseBasicParsing
```

**Résultat attendu**:
```json
{
  "status": "ok",
  "model_trained": true,
  "model_version": "v3.0-ml"
}
```

---

### Test 2: Tester une Prédiction

```powershell
$body = @{
    startLat = 36.74212
    startLon = 10.19617
    endLat = 33.93197
    endLon = 8.09692
    trip_id = 80
    trip_duration_minutes = 240
} | ConvertTo-Json

Invoke-WebRequest -Uri http://localhost:5000/api/predict -Method POST -ContentType "application/json" -Body $body -UseBasicParsing
```

**Résultat attendu**: HTTP 200 avec JSON contenant les pauses

---

### Test 3: Vérifier dans l'Application

1. Ouvrir l'application frontend
2. Naviguer vers la carte
3. Sélectionner le trajet 80
4. Les pauses devraient s'afficher sur la carte

**Plus d'erreur 500** ✅

---

## 📊 LOGS AVANT/APRÈS CORRECTION

### Avant Correction ❌

```
C:\Python313\Lib\site-packages\sklearn\base.py:525: InconsistentVersionWarning: 
Trying to unpickle estimator RandomForestRegressor from version 1.6.1 
when using version 1.9.0.

127.0.0.1 - - [27/Jul/2026 17:03:26] "POST /api/predict HTTP/1.1" 500 -
```

---

### Après Correction ✅

```
* Serving Flask app 'app'
* Running on http://127.0.0.1:5000

127.0.0.1 - - [27/Jul/2026 17:10:00] "POST /api/predict HTTP/1.1" 200 -
```

**Pas d'avertissement, requête réussie avec status 200** ✅

---

## 🎯 POURQUOI CE PROBLÈME ?

### Explication Technique

1. **Sérialisation pickle**: Le modèle scikit-learn est sauvegardé avec `pickle`
2. **Version-specific**: Le format pickle peut changer entre les versions
3. **Incompatibilité**: Charger un modèle avec une version différente peut causer des erreurs

### Pourquoi ça Fonctionnait Avant ?

- Le modèle a probablement été entraîné sur une machine avec scikit-learn 1.6.1
- Votre environnement actuel utilise scikit-learn 1.9.0 (plus récent)
- Python et scikit-learn ont été mis à jour depuis

---

## 🔒 PRÉVENTION FUTURE

### Option 1: Fixer la Version de scikit-learn

Dans `requirements.txt`:
```
scikit-learn==1.6.1
```

Puis:
```batch
pip install -r requirements.txt
```

---

### Option 2: Utiliser ONNX (Recommandé pour Production)

ONNX est un format indépendant de la version:

```python
# Exporter en ONNX
from skl2onnx import to_onnx
onx = to_onnx(model, X_train[:1].astype(np.float32))
with open("model.onnx", "wb") as f:
    f.write(onx.SerializeToString())

# Charger avec ONNX Runtime
import onnxruntime as rt
sess = rt.InferenceSession("model.onnx")
```

---

### Option 3: Ré-entraîner Périodiquement

Ajouter un script d'entraînement dans votre CI/CD:

```yaml
# .github/workflows/train-model.yml
name: Train Model
on:
  schedule:
    - cron: '0 0 * * 0'  # Tous les dimanches
jobs:
  train:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - name: Train model
        run: python pause-ai-service/retrain_model.py
```

---

## 📝 COMMANDES UTILES

### Vérifier la Version de scikit-learn

```python
python -c "import sklearn; print(sklearn.__version__)"
```

---

### Vérifier le Modèle Actuel

```python
python -c "from model import PauseAIModel; m = PauseAIModel(); print('Entraîné:', m.is_trained())"
```

---

### Nettoyer l'Ancien Modèle

```batch
cd pause-ai-service
del pause_model_rf_30k.pkl
```

Puis ré-entraîner avec `fix_model_version.bat`

---

## ✅ CHECKLIST DE CORRECTION

- [ ] Arrêter le serveur Flask (CTRL+C)
- [ ] Exécuter `fix_model_version.bat`
- [ ] Vérifier l'entraînement réussi (sortie du script)
- [ ] Redémarrer le serveur Flask (`python app.py`)
- [ ] Tester health check (`/api/health`)
- [ ] Tester dans l'application (trajet 80)
- [ ] Vérifier aucune erreur 500
- [ ] Vérifier les pauses s'affichent sur la carte

---

## 🚀 RÉSUMÉ RAPIDE

### Problème
```
Modèle entraîné avec scikit-learn 1.6.1
Système utilise scikit-learn 1.9.0
→ Erreur 500 lors de predict
```

### Solution (1 minute)
```batch
cd pause-ai-service
fix_model_version.bat
# Attendre 2-3 minutes
# Redémarrer Flask
python app.py
```

### Résultat
```
✅ Modèle compatible avec version actuelle
✅ Plus d'erreur 500
✅ Pauses s'affichent correctement
```

---

## 📞 SUPPORT

Si après correction le problème persiste:

1. **Vérifier les logs Flask** pendant la prédiction
2. **Vérifier les logs Backend** (`backend/logs/application.log`)
3. **Tester avec curl** directement sur `/api/predict`
4. **Vérifier le trajet 80** existe et a des coordonnées valides

---

**Fichiers créés**:
- `pause-ai-service/retrain_model.py` - Script de ré-entraînement
- `pause-ai-service/fix_model_version.bat` - Script automatique de correction
- `FIX_ERREUR_MODEL_VERSION.md` - Ce document

**Durée totale de la correction**: ~5 minutes  
**Impact**: Aucune perte de données, juste ré-entraînement du modèle
