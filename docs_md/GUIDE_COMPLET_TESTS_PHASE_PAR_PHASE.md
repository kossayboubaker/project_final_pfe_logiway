# 📘 GUIDE COMPLET DES TESTS - PHASE PAR PHASE (DÉBUTANT)

**Date:** 27 juillet 2026  
**Pour:** Quelqu'un sans expérience en testing  
**Objectif:** Créer et exécuter tous les tests LogiWay pas à pas

---

## 🎯 VUE D'ENSEMBLE

Nous allons faire **3 grandes phases**:
1. **PHASE 1:** Tests Backend Java (2-3 heures)
2. **PHASE 2:** Tests Python Flask (1-2 heures)
3. **PHASE 3:** Tests Frontend Angular (1-2 heures)

**À chaque étape, je vous dirai:**
- ✅ Quelle commande taper exactement
- ✅ Quoi créer (fichier par fichier)
- ✅ Quel résultat attendre
- ✅ Quelle capture d'écran prendre

---

# 📦 PHASE 1: TESTS BACKEND JAVA (SPRING BOOT)

## Durée: 2-3 heures | Difficulté: ⭐⭐⭐

---

## ÉTAPE 1.1: VÉRIFIER QUE TOUT EST PRÊT (5 minutes)

### Action 1.1.1: Ouvrir PowerShell

1. Appuyez sur **Windows + R**
2. Tapez: `powershell`
3. Appuyez sur **Entrée**

### Action 1.1.2: Aller dans le dossier backend

```powershell
cd C:\Users\kossa\OneDrive\Desktop\essais\backend
```

### Action 1.1.3: Vérifier que Maven fonctionne

```powershell
mvn --version
```

**Résultat attendu:**
```
Apache Maven 3.x.x
Java version: 17.x.x
```

✅ **SI ÇA MARCHE:** Passez à l'étape suivante  
❌ **SI ERREUR:** Maven n'est pas installé - dites-moi et je vous aide

### Action 1.1.4: Tester la compilation

```powershell
mvn clean compile
```

**Résultat attendu:**
```
[INFO] BUILD SUCCESS
[INFO] Total time: 30-60 seconds
```

📸 **CAPTURE 1:** Prenez une capture d'écran de la console avec "BUILD SUCCESS"

---

## ÉTAPE 1.2: CRÉER LE PREMIER TEST (30 minutes)

### Quel test créer?

Nous allons tester **ReclamationService** - le service qui gère les réclamations.

### Action 1.2.1: Créer le dossier services dans test

```powershell
# Créer le dossier si n'existe pas
New-Item -ItemType Directory -Path "src\test\java\com\logiway\services" -Force
```

### Action 1.2.2: Lire le service existant

Avant de créer le test, regardons ce que fait le service:

```powershell
# Ouvrir le fichier dans VS Code ou notepad
code src\main\java\com\logiway\services\impl\ReclamationServiceImpl.java
```

**Ou avec notepad:**
```powershell
notepad src\main\java\com\logiway\services\impl\ReclamationServiceImpl.java
```

### Action 1.2.3: Identifier ce qu'on va tester

Cherchez dans le fichier les **méthodes publiques**. Par exemple:
- `createReclamation(...)` → Créer une réclamation
- `getReclamation(Long id)` → Récupérer une réclamation
- `updateReclamation(...)` → Modifier une réclamation
- `deleteReclamation(Long id)` → Supprimer une réclamation

### Action 1.2.4: Créer le fichier de test

Je vais créer ce fichier pour vous. **Attendez que je le crée...**

---

## ÉTAPE 1.3: CRÉER ReclamationServiceTest.java (JE LE FAIS MAINTENANT)

Je vais créer un test SIMPLE pour commencer. Attendez...

---

## ÉTAPE 1.4: EXÉCUTER LE PREMIER TEST (10 minutes)

Une fois le test créé, vous allez:

### Action 1.4.1: Exécuter le test

```powershell
mvn test -Dtest=ReclamationServiceTest
```

### Action 1.4.2: Lire les résultats

**Si SUCCÈS:**
```
[INFO] Tests run: 1, Failures: 0, Errors: 0, Skipped: 0
[INFO] BUILD SUCCESS
```

📸 **CAPTURE 2:** Console avec "Tests run: 1, Failures: 0"

**Si ÉCHEC:**
```
[ERROR] Tests run: 1, Failures: 1, Errors: 0, Skipped: 0
```

→ Lisez le message d'erreur et dites-moi ce qui est marqué

---

## ÉTAPE 1.5: VOIR LE RAPPORT DE COUVERTURE (15 minutes)

### Action 1.5.1: Générer le rapport Jacoco

```powershell
mvn test jacoco:report
```

**Durée:** 1-2 minutes

### Action 1.5.2: Ouvrir le rapport HTML

```powershell
# Ouvrir le rapport dans le navigateur
start target\site\jacoco\index.html
```

**Vous allez voir:**
- Une page HTML avec des statistiques
- Pourcentage de code couvert
- Liste des packages et classes

📸 **CAPTURE 3:** Page d'accueil du rapport Jacoco

### Action 1.5.3: Explorer le détail

1. Dans le rapport, cliquez sur `com.logiway.services`
2. Cliquez sur `ReclamationServiceImpl`
3. Vous verrez le code source avec:
   - **Vert** = ligne testée
   - **Rouge** = ligne NON testée
   - **Jaune** = partiellement testée

📸 **CAPTURE 4:** Détail de ReclamationServiceImpl avec couleurs

---

## ÉTAPE 1.6: AJOUTER PLUS DE TESTS (1 heure)

Maintenant qu'on sait que ça marche, on va ajouter 3 autres tests:

### Test 2: Tester qu'on peut récupérer une réclamation

```java
@Test
void getReclamation_whenExists_returnsReclamation() {
    // On va créer ça ensemble
}
```

### Test 3: Tester qu'on a une erreur si la réclamation n'existe pas

### Test 4: Tester la notification en cas d'urgence

**Je vais vous guider test par test.**

---

## ÉTAPE 1.7: CRÉER LE DEUXIÈME TEST - PauseReglementaireServiceTest (1 heure)

Après ReclamationService, on va tester **PauseReglementaireService** - le service des pauses obligatoires.

### Ce qu'on va tester:

1. **Règle CE 561/2006:** Si trajet < 3h → Pas de pause
2. **Règle CE 561/2006:** Si trajet > 3h → Au moins 1 pause WARNING
3. **Règle CE 561/2006:** Si trajet > 4h30 → Pause MANDATORY

### Commande pour ce test:

```powershell
mvn test -Dtest=PauseReglementaireServiceTest
```

---

## ÉTAPE 1.8: RAPPORT FINAL BACKEND (10 minutes)

### Action 1.8.1: Exécuter TOUS les tests

```powershell
mvn test
```

**Résultat attendu:**
```
Tests run: 10, Failures: 0, Errors: 0, Skipped: 0
BUILD SUCCESS
```

📸 **CAPTURE 5:** Console avec tous les tests PASSED

### Action 1.8.2: Rapport final

```powershell
mvn test jacoco:report
start target\site\jacoco\index.html
```

📸 **CAPTURE 6:** Rapport final avec % couverture global

**Objectif de couverture:**
- ✅ Services: ≥ 70%
- ✅ Global: ≥ 60%

---

# 🐍 PHASE 2: TESTS PYTHON FLASK (SERVICE RÉCLAMATION IA)

## Durée: 1-2 heures | Difficulté: ⭐⭐

---

## ÉTAPE 2.1: PRÉPARATION PYTHON (10 minutes)

### Action 2.1.1: Aller dans le dossier Python

```powershell
cd C:\Users\kossa\OneDrive\Desktop\essais\reclamation-ai-service
```

### Action 2.1.2: Vérifier Python

```powershell
python --version
```

**Résultat attendu:**
```
Python 3.10.x ou 3.11.x
```

### Action 2.1.3: Installer pytest

```powershell
pip install pytest pytest-cov pytest-flask
```

**Durée:** 1-2 minutes

### Action 2.1.4: Vérifier l'installation

```powershell
pytest --version
```

**Résultat attendu:**
```
pytest 7.x.x
```

---

## ÉTAPE 2.2: CRÉER LA STRUCTURE DE TEST (5 minutes)

### Action 2.2.1: Créer le dossier tests

```powershell
New-Item -ItemType Directory -Path "tests" -Force
```

### Action 2.2.2: Créer __init__.py

```powershell
New-Item -ItemType File -Path "tests\__init__.py" -Force
```

**Ce fichier peut rester vide** - il dit à Python que "tests" est un package.

---

## ÉTAPE 2.3: CRÉER LE PREMIER TEST PYTHON (30 minutes)

### Test: Détection de toxicité

On va tester que le service détecte les mots grossiers.

### Action 2.3.1: Je crée le fichier test_toxicite.py

**Attendez que je le crée...**

---

## ÉTAPE 2.4: EXÉCUTER LES TESTS PYTHON (10 minutes)

### Action 2.4.1: Exécuter pytest

```powershell
pytest tests/test_toxicite.py -v
```

**Résultat attendu:**
```
tests/test_toxicite.py::test_texte_professionnel_non_toxique PASSED
tests/test_toxicite.py::test_mot_grossier_detect PASSED
======================== 2 passed in 0.15s ========================
```

📸 **CAPTURE 7:** Console pytest avec tests PASSED

### Action 2.4.2: Rapport de couverture Python

```powershell
pytest --cov=app_simple --cov-report=html tests/
```

### Action 2.4.3: Ouvrir le rapport

```powershell
start htmlcov\index.html
```

📸 **CAPTURE 8:** Rapport coverage Python

---

## ÉTAPE 2.5: AJOUTER TEST API ENDPOINTS (30 minutes)

On va tester que les endpoints HTTP fonctionnent.

### Test: POST /validate

**Je vais créer test_api_endpoints.py**

### Exécution:

```powershell
pytest tests/test_api_endpoints.py -v
```

---

## ÉTAPE 2.6: RAPPORT FINAL PYTHON (5 minutes)

```powershell
pytest --cov=app_simple --cov-report=html tests/
start htmlcov\index.html
```

📸 **CAPTURE 9:** Rapport final Python avec % couverture

**Objectif:** ≥ 85%

---

# 🅰️ PHASE 3: TESTS FRONTEND ANGULAR

## Durée: 1-2 heures | Difficulté: ⭐⭐

---

## ÉTAPE 3.1: PRÉPARATION ANGULAR (10 minutes)

### Action 3.1.1: Aller dans frontend

```powershell
cd C:\Users\kossa\OneDrive\Desktop\essais\frontend
```

### Action 3.1.2: Vérifier Node.js

```powershell
node --version
npm --version
```

### Action 3.1.3: Installer les dépendances (si pas déjà fait)

```powershell
npm install
```

---

## ÉTAPE 3.2: EXÉCUTER LES TESTS EXISTANTS (10 minutes)

Angular vient avec des tests par défaut.

### Action 3.2.1: Lancer Karma

```powershell
npm test
```

**Un navigateur va s'ouvrir** avec les résultats.

📸 **CAPTURE 10:** Navigateur Karma avec résultats

### Action 3.2.2: Arrêter les tests

Appuyez sur **CTRL+C** dans PowerShell

---

## ÉTAPE 3.3: CRÉER UN TEST POUR RECLAMATION COMPONENT (40 minutes)

### Action 3.3.1: Trouver le fichier de test

```powershell
code src\app\features\reclamation\reclamation-create-dialog.component.spec.ts
```

**SI LE FICHIER N'EXISTE PAS:** Je vais le créer pour vous.

### Action 3.3.2: Ajouter des tests

**Je vais vous guider pour ajouter:**
1. Test que le composant se crée
2. Test que le formulaire est invalide si vide
3. Test d'appel API

---

## ÉTAPE 3.4: RAPPORT DE COUVERTURE ANGULAR (10 minutes)

### Action 3.4.1: Tests avec couverture

```powershell
ng test --code-coverage --watch=false
```

**Durée:** 2-3 minutes

### Action 3.4.2: Ouvrir le rapport

```powershell
start coverage\logiway\index.html
```

📸 **CAPTURE 11:** Rapport coverage Angular

**Objectif:** ≥ 70%

---

# 📊 RÉCAPITULATIF FINAL - TOUTES LES CAPTURES

## Captures Backend Java (6)
1. ✅ Console Maven "BUILD SUCCESS" (compilation)
2. ✅ Console test ReclamationService (1 test PASSED)
3. ✅ Rapport Jacoco - Page d'accueil
4. ✅ Rapport Jacoco - Détail ReclamationServiceImpl
5. ✅ Console Maven tous les tests (10 tests PASSED)
6. ✅ Rapport Jacoco final (% global)

## Captures Python Flask (3)
7. ✅ Console pytest test_toxicite (PASSED)
8. ✅ Rapport coverage Python - Page principale
9. ✅ Rapport coverage Python final

## Captures Frontend Angular (2)
10. ✅ Navigateur Karma avec résultats
11. ✅ Rapport coverage Angular

**TOTAL: 11 captures d'écran minimum**

---

# 🚀 PAR OÙ COMMENCER MAINTENANT?

## OPTION A: Je crée tout pour vous maintenant

Je vais créer:
1. ReclamationServiceTest.java (Backend)
2. test_toxicite.py (Python)
3. Fichier spec Angular

**Vous n'aurez qu'à:**
- Exécuter les commandes
- Prendre les captures
- Me montrer les résultats

## OPTION B: On fait étape par étape ensemble

1. Je crée UN fichier
2. Vous testez
3. Vous prenez capture
4. On passe au suivant

## OPTION C: Vous voulez d'abord comprendre

Je vous explique:
- Comment marche un test JUnit
- Comment marche pytest
- Comment marche Jest/Karma

---

# ❓ RÉPONDEZ MAINTENANT

**Tapez:**
- **"A"** → Je crée tout, vous testez après
- **"B"** → On fait fichier par fichier ensemble
- **"C"** → Expliquez-moi d'abord comment ça marche

**OU:**

- **"démarre backend"** → On commence par PHASE 1 maintenant
- **"démarre python"** → On commence par PHASE 2 maintenant
- **"démarre angular"** → On commence par PHASE 3 maintenant

---

**Je suis prêt à vous guider, dites-moi par où vous voulez commencer! 🎯**
