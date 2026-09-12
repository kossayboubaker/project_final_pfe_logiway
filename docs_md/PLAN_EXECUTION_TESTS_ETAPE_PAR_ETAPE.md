# 🧪 PLAN D'EXÉCUTION DES TESTS - LOGIWAY (ÉTAPE PAR ÉTAPE)

**Date:** 27 juillet 2026  
**Objectif:** Implémenter et exécuter les tests selon le guide LogiWay_Testing_Guide.md  
**Méthode:** Étape par étape avec validation et captures d'écran

---

## 📋 VUE D'ENSEMBLE DES TESTS

Basé sur la pyramide des tests du guide:

```
        /\
       /E2E\          ← Étape 6 (5% - lents)
      /──────\
     /Intégrat.\      ← Étape 4 (20% - moyens)
    /────────────\
   /Tests Unitaires\  ← Étapes 1-3 (75% - rapides)
  /──────────────────\
```

### Ordre d'exécution recommandé par le guide:

1. **Tests Unitaires Backend** (Spring Boot + JUnit 5)
2. **Tests Unitaires Python** (Flask + pytest)  
3. **Tests Unitaires Frontend** (Angular + Jest)
4. **Tests d'Intégration Backend** (Testcontainers)
5. **Tests de Performance** (Gatling/k6) - OPTIONNEL
6. **Tests E2E** (Playwright) - OPTIONNEL

---

## 🎯 ÉTAPE 1: TESTS UNITAIRES BACKEND (SPRING BOOT + JUNIT 5)

### 1.1 Préparation

**Actions:**
1. Vérifier les dépendances Maven
2. Créer la structure de répertoires de test
3. Identifier les services prioritaires à tester

**Commandes:**
```bash
cd backend
```

**Fichiers à vérifier:**
- [ ] `pom.xml` - Vérifier dépendances test
- [ ] `src/test/java/com/logiway/` - Créer si n'existe pas

---

### 1.2 Test Prioritaire #1: Service Réclamation

**Objectif:** Tester le workflow de création et résolution de réclamation

**Fichier à créer:** `src/test/java/com/logiway/services/ReclamationServiceTest.java`

**Tests à implémenter:**
- ✅ `getReclamation_whenExists_returnsReclamation()`
- ✅ `getReclamation_whenNotFound_throwsException()`
- ✅ `resolveReclamation_changesStatusToResolved()`
- ✅ `createReclamation_whenUrgent_notifiesSuperAdmins()`

**Commande d'exécution:**
```bash
mvn test -Dtest=ReclamationServiceTest
```

**Capture à prendre:**
- [ ] Console Maven avec résultats
- [ ] Rapport `target/surefire-reports/`

**Critères de succès:**
```
Tests run: 4, Failures: 0, Errors: 0, Skipped: 0
BUILD SUCCESS
```

---

### 1.3 Test Prioritaire #2: Service Pause Réglementaire

**Objectif:** Valider la règle CE 561/2006 (3h/4h30)

**Fichier à créer:** `src/test/java/com/logiway/services/PauseServiceTest.java`

**Tests à implémenter:**
- ✅ `getPauses_whenTripUnder3h_returnsEmpty()`
- ✅ `getPauses_whenTripOver3h_hasWarningAlert()`
- ✅ Tests paramétrés pour différentes durées

**Commande d'exécution:**
```bash
mvn test -Dtest=PauseServiceTest
```

**Capture à prendre:**
- [ ] Console Maven avec résultats détaillés

**Critères de succès:**
```
Tests run: 6, Failures: 0, Errors: 0, Skipped: 0
```

---

### 1.4 Rapport de Couverture Backend

**Commande:**
```bash
mvn test jacoco:report
```

**Fichier généré:** `target/site/jacoco/index.html`

**Captures à prendre:**
- [ ] Page d'accueil du rapport Jacoco
- [ ] Couverture par package
- [ ] Détail d'une classe testée (ex: ReclamationServiceImpl)

**Objectif de couverture:**
- Global: ≥ 70%
- Services critiques: ≥ 85%

---

## 🎯 ÉTAPE 2: TESTS UNITAIRES PYTHON (FLASK + PYTEST)

### 2.1 Préparation Service Réclamation IA

**Répertoire:** `reclamation-ai-service/`

**Installation:**
```bash
cd reclamation-ai-service
pip install pytest pytest-cov pytest-flask httpx
```

**Structure à créer:**
```
reclamation-ai-service/
└── tests/
    ├── __init__.py
    ├── test_toxicite.py
    ├── test_semantique.py
    └── test_api_endpoints.py
```

---

### 2.2 Test Prioritaire #1: Détection de Toxicité

**Fichier:** `tests/test_toxicite.py`

**Tests à implémenter:**
- ✅ `test_texte_professionnel_non_toxique()`
- ✅ `test_mot_grossier_detect()`
- ✅ `test_sous_chaine_ignoree()` - "reconnaître" ne doit pas détecter "con"
- ✅ `test_cas_insensible()`
- ✅ Tests paramétrés pour textes métier

**Commande:**
```bash
pytest tests/test_toxicite.py -v
```

**Capture à prendre:**
- [ ] Console pytest avec tous les tests PASSED

**Critères de succès:**
```
======================== 8 passed in 0.45s ========================
```

---

### 2.3 Test Prioritaire #2: Validation Sémantique

**Fichier:** `tests/test_semantique.py`

**Tests clés:**
- Texte hors-sujet → score < 0.25
- Texte avec mots-clés véhicule → score ≥ 0.25
- Score normalisé max 1.0

**Commande:**
```bash
pytest tests/test_semantique.py -v
```

---

### 2.4 Test Prioritaire #3: Endpoints API Flask

**Fichier:** `tests/test_api_endpoints.py`

**Tests:**
- Health check retourne 200
- Validate endpoint avec texte valide
- Validate endpoint avec texte toxique
- Gestion erreurs (champ manquant)

**Commande:**
```bash
pytest tests/test_api_endpoints.py -v
```

---

### 2.5 Rapport de Couverture Python

**Commande:**
```bash
pytest --cov=app_simple --cov-report=html tests/
```

**Fichier généré:** `htmlcov/index.html`

**Captures à prendre:**
- [ ] Page principale du rapport coverage
- [ ] Détail du fichier `app_simple.py` avec lignes couvertes

**Objectif:** ≥ 85% de couverture

---

## 🎯 ÉTAPE 3: TESTS UNITAIRES FRONTEND (ANGULAR + JEST)

### 3.1 Préparation

**Répertoire:** `frontend/`

**Option A - Utiliser Karma (déjà intégré):**
```bash
cd frontend
ng test
```

**Option B - Migrer vers Jest (recommandé):**
```bash
npm install --save-dev jest jest-preset-angular @types/jest
```

---

### 3.2 Test Prioritaire #1: Composant Réclamation

**Fichier:** `src/app/features/reclamation/reclamation.component.spec.ts`

**Tests:**
- Component se crée correctement
- Formulaire invalide si vide
- Formulaire valide avec données
- Appel API au submit
- Gestion erreur API (texte toxique)

**Commande:**
```bash
ng test --watch=false
```

**Captures:**
- [ ] Résultats Karma/Jest dans le terminal
- [ ] Navigateur Karma si utilisé

---

### 3.3 Test Prioritaire #2: Auth Guard

**Fichier:** `src/app/core/guards/auth.guard.spec.ts`

**Tests:**
- Autorise utilisateurs authentifiés
- Redirige vers /login si non authentifié
- Bloque CHAUFFEUR des routes admin

---

### 3.4 Test Prioritaire #3: Service HTTP

**Fichier:** `src/app/core/services/fleet.service.spec.ts`

**Tests:**
- GET requests avec HttpTestingController
- POST avec données valides
- Gestion des erreurs HTTP

---

### 3.5 Rapport de Couverture Frontend

**Commande:**
```bash
ng test --code-coverage --watch=false
```

**Fichier généré:** `coverage/logiway/index.html`

**Captures:**
- [ ] Page principale coverage
- [ ] Détail d'un composant testé

**Objectif:** ≥ 70%

---

## 🎯 ÉTAPE 4: TESTS D'INTÉGRATION BACKEND (OPTIONNEL)

### 4.1 Préparation Testcontainers

**Prérequis:** Docker Desktop démarré

**Dépendances à ajouter dans `pom.xml`:**
```xml
<dependency>
    <groupId>org.testcontainers</groupId>
    <artifactId>mysql</artifactId>
    <scope>test</scope>
</dependency>
```

---

### 4.2 Test d'Intégration Trajet

**Fichier:** `src/test/java/com/logiway/integration/TrajetIntegrationTest.java`

**Test:** Persistance réelle dans MySQL conteneurisé

**Commande:**
```bash
mvn verify -Dtest=TrajetIntegrationTest
```

**Note:** Plus lent (2-5 secondes par test)

---

## 📊 RÉCAPITULATIF FINAL - CAPTURES NÉCESSAIRES

### Backend Java (Spring Boot)
1. [ ] Console Maven - Tous les tests unitaires
2. [ ] Rapport Jacoco - Page d'accueil
3. [ ] Rapport Jacoco - Détail ReclamationServiceImpl
4. [ ] Rapport Jacoco - Détail PauseServiceImpl
5. [ ] Console Maven - Tests d'intégration (si exécutés)

### Python (Flask)
6. [ ] Console pytest - Test toxicité (PASSED)
7. [ ] Console pytest - Test sémantique (PASSED)
8. [ ] Console pytest - Test API endpoints (PASSED)
9. [ ] Rapport coverage HTML - Page principale
10. [ ] Rapport coverage HTML - Détail app_simple.py

### Frontend (Angular)
11. [ ] Console Karma/Jest - Tous les tests
12. [ ] Rapport coverage - Page principale
13. [ ] Rapport coverage - Détail reclamation.component

---

## 🚀 PROCHAINE ACTION IMMÉDIATE

**COMMENCER PAR ÉTAPE 1.1:**

1. Ouvrir le terminal dans `backend/`
2. Exécuter: `mvn test` pour vérifier l'état actuel
3. Créer le premier fichier de test: `ReclamationServiceTest.java`

**Question pour vous:**
Êtes-vous prêt à commencer par l'**Étape 1.1 - Préparation Backend**?

Je vais:
1. Vérifier les dépendances Maven
2. Créer la structure de répertoires de test
3. Vous guider pour le premier test

**Répondez "oui" ou "démarre étape 1" pour continuer!**

---

**Durée estimée totale:** 4-6 heures
- Étapes 1-2 (Backend + Python): 2-3 heures
- Étape 3 (Frontend): 1-2 heures  
- Étape 4 (Intégration): 1 heure

---

**Note:** Nous allons avancer **test par test**, valider chaque résultat, et prendre une capture d'écran avant de passer au suivant.
