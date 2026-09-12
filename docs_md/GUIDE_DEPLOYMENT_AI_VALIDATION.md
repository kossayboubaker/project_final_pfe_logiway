# 🚀 Guide de Déploiement - Module IA Réclamations

## 🎯 Objectif

Ce guide vous permet de déployer le **système de validation IA stricte** pour le module Réclamations. Le système bloque totalement les réclamations toxiques ou hors contexte.

## 📋 Vue d'Ensemble

### Architecture
```
Frontend Angular  →  Backend Spring Boot  →  Service Python Local
    (Interface)         (Validation API)        (Modèles IA)
```

### Fonctionnement
1. **Validation temps réel** : L'utilisateur tape → Analyse IA après 600ms
2. **Blocage strict** : Bouton désactivé si contenu invalide
3. **Messages spécifiques** : Erreurs distinctes par type (toxicité/hors sujet)
4. **Double validation** : Frontend (UX) + Backend (sécurité)

---

## 🛠️ Étape 1 : Démarrage du Service Python IA

### 1.1 Prérequis
- **Python 3.8+** installé : https://www.python.org/downloads/
- **Connexion Internet** pour le premier téléchargement des modèles

### 1.2 Démarrage Automatique
```bash
# 1. Aller dans le dossier du service
cd reclamation-ai-service

# 2. Lancer le script de démarrage (Windows)
start.bat

# OU manuellement :
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
python app.py
```

### 1.3 Vérification du Service
Le service démarre sur `http://localhost:5001`

**Test de santé :**
```bash
curl http://localhost:5001/health
```

**Réponse attendue :**
```json
{
  "status": "healthy",
  "service": "reclamation-ai-validation", 
  "models_loaded": true
}
```

**⚠️ Premier démarrage** : Les modèles IA (~500 MB) seront téléchargés automatiquement. Cela peut prendre 5-10 minutes selon la connexion.

---

## 🖥️ Étape 2 : Configuration du Backend Spring Boot

### 2.1 Configuration `application.yml`
Le fichier est déjà configuré :
```yaml
reclamation:
  ai:
    local-service-url: http://localhost:5001
```

### 2.2 Redémarrer le Backend
```bash
# Arrêter le backend s'il tourne
# Redémarrer via votre IDE ou :
mvn spring-boot:run
```

### 2.3 Vérification des Logs
Au démarrage, vous devriez voir :
```
[RECLAMATION-AI] ═══════════════════════════════════════
[RECLAMATION-AI] Pipeline IA Réclamations — Diagnostic
[RECLAMATION-AI] Service local = http://localhost:5001
[RECLAMATION-AI] Seuil toxicité = 0.55
[RECLAMATION-AI] Seuil sémantique = 0.25
[RECLAMATION-AI] ═══════════════════════════════════════
```

---

## 🌐 Étape 3 : Frontend (Déjà Configuré)

Le frontend Angular est déjà configuré avec :
- ✅ Validation temps réel (debounce 600ms)
- ✅ Messages d'erreur dynamiques
- ✅ Blocage strict du bouton
- ✅ Affichage "ANALYSE IA..." pendant validation

Aucune action requise côté frontend.

---

## 🧪 Étape 4 : Tests de Validation

### 4.1 Test Automatique du Service
```bash
cd reclamation-ai-service
test_service.bat
```

### 4.2 Tests Frontend Manuel

#### Test 1 : Texte Valide ✅
```
Sujet: "Panne camion livraison"
Description: "Le véhicule ne démarre plus, problème moteur"
```
**Résultat attendu** : Bouton activé, soumission réussie

#### Test 2 : Texte Toxique ❌
```
Sujet: "fuck you"
Description: "connard de chauffeur"
```
**Résultat attendu** : 
- Bouton désactivé
- Message rouge : "⚠️ Votre sujet contient un langage inapproprié..."

#### Test 3 : Texte Hors Sujet ❌
```
Sujet: "recette de cuisine"
Description: "mélanger les œufs avec la farine"
```
**Résultat attendu** :
- Bouton désactivé  
- Message rouge : "⚠️ Votre sujet ne correspond pas au domaine de la gestion de flotte..."

---

## 🔧 Configuration Avancée

### Ajuster les Seuils
Dans `reclamation-ai-service/app.py` :
```python
TOXICITY_THRESHOLD = 0.55    # Plus bas = plus strict
SEMANTIC_THRESHOLD = 0.25    # Plus haut = plus strict
```

### Ajouter des Mots-Clés Domaine
Modifier la liste `DOMAIN_KEYWORDS` dans le service Python pour améliorer la détection contextuelle.

---

## 🚨 Résolution de Problèmes

### Problème : "Service de validation IA temporairement indisponible"

**Causes possibles :**
1. Service Python non démarré
2. Port 5001 utilisé par autre application
3. Modèles IA non téléchargés

**Solutions :**
1. Vérifier que `http://localhost:5001/health` répond
2. Redémarrer le service Python : `start.bat`
3. Vérifier les logs du service Python

### Problème : Modèles ne se téléchargent pas

**Causes possibles :**
1. Pas de connexion Internet
2. Proxy/Firewall qui bloque Hugging Face
3. Espace disque insuffisant

**Solutions :**
1. Vérifier connexion Internet
2. Configurer proxy si nécessaire
3. Libérer ~1 GB d'espace disque

### Problème : Backend n'appelle pas le service local

**Vérifier :**
1. Configuration `application.yml`
2. Logs backend au démarrage
3. URL service dans logs : `[LOCAL-AI] Appel service local`

---

## 📊 Monitoring et Logs

### Logs Backend
```
[LOCAL-AI] Appel service local pour validation du champ SUJET
[LOCAL-AI] SUJET - Score toxicité = 0.15 | Score sémantique = 0.78 | Décision = PASS
[RECLAMATION-VALIDATE] Résultat sujet = VALIDE
```

### Logs Service Python
```
[TOXICITY] Analyse: "Le camion est en panne"
[TOXICITY] Score: 0.05 | Seuil: 0.55 | Décision: PASS
[SEMANTIC] Analyse: "Le camion est en panne"  
[SEMANTIC] Score: 0.82 | Seuil: 0.25 | Décision: PASS
[VALIDATE] ✅ Validation réussie pour le champ 'sujet'
```

---

## ✅ Checklist de Déploiement

- [ ] Python 3.8+ installé
- [ ] Service IA démarré : `start.bat`  
- [ ] Test santé OK : `curl http://localhost:5001/health`
- [ ] Backend redémarré avec nouvelle config
- [ ] Logs backend montrent service local configuré
- [ ] Test texte valide ✅ → bouton activé
- [ ] Test texte toxique ❌ → bouton bloqué + message rouge
- [ ] Test texte hors sujet ❌ → bouton bloqué + message rouge
- [ ] Double validation backend fonctionne (même avec outil externe)

---

## 🎉 Déploiement Réussi !

Une fois tous les tests passés, le module Réclamations dispose d'un **système de validation IA stricte et robuste** qui :

✅ **Bloque efficacement** les contenus toxiques et hors contexte  
✅ **Fonctionne hors-ligne** après installation  
✅ **Offre une UX fluide** avec validation temps réel  
✅ **Garantit la sécurité** avec double validation  
✅ **Fournit des messages clairs** pour guider l'utilisateur  

Le système est maintenant **prêt pour la production** ! 🚀