# Rapport Général de Tests — Plateforme LogiWay

**Projet :** LogiWay — Plateforme de Gestion Logistique Intelligente  
**Stack testée :** Spring Boot 3.2.2 · Angular 19 · Flask · FastAPI · MySQL 8.0 · Keycloak 24  
**Date d'exécution :** 07 septembre 2026  
**Environnement :** Windows 11 · Intel Core i7 · 16 Go RAM

---

## Résumé Exécutif

| Niveau de test | Framework | Nb. tests | Couverture | Statut |
|---|---|---|---|---|
| Unitaire Backend — Java | JUnit 5 + Mockito + JaCoCo | 10 | 97,7% lignes | ✅ PASSÉ |
| Unitaire IA/ML — Python | pytest + coverage.py | 15 | 99% | ✅ PASSÉ |
| Unitaire Frontend — Angular | Jest + Istanbul | 20+ | 100% | ✅ PASSÉ |
| Performance | k6 v2.2.0 | 4 scénarios | p(95) = 38ms | ✅ PASSÉ |
| End-to-End | Playwright 1.63.0 | 15 | — | ✅ PASSÉ |
| **Total** | | **60+ tests** | | **✅ Tous passés** |

---

## Pyramide des Tests LogiWay

```
              /\
             /E2E\            15 tests  |  Playwright     |  ~2 min
            /──────\
           /Perfor. \          4 scénar  |  k6             |  ~2 min
          /──────────\
         /  Unitaires \       45+ tests  |  JUnit/Jest/pytest  |  < 60s
        /──────────────\
```

La pyramide des tests s'appuie sur trois niveaux complémentaires :
- **Base large — Tests Unitaires :** rapides, isolés, nombreux, couvrent la logique métier
- **Niveau intermédiaire — Performance :** mesurent la résistance du système sous charge
- **Sommet — E2E :** lents mais complets, valident les scénarios utilisateur réels

---

## Cartographie des modules testés

```
LogiWay
│
├── Backend Spring Boot (port 8080)
│   ├── Module Authentification      → Tests unitaires : login, rôles RBAC, sessions
│   ├── Module Réclamations          → Tests unitaires : création, résolution, notification
│   ├── Module Pauses Réglementaires → Tests unitaires : règle CE 561/2006, seuils 3h/4h30
│   ├── Module Trajets               → Tests de performance : charge, temps de réponse
│   └── Module Notifications SSE     → Tests de performance : débit, latence
│
├── Services Python IA/ML
│   ├── Service Réclamation IA       → Tests unitaires : toxicité, sémantique, API
│   └── Service ML Pauses            → Tests unitaires : modèle RandomForest
│
├── Frontend Angular (port 4200)
│   ├── Composant Authentification   → Tests unitaires : formulaire, erreurs, redirections
│   ├── Guards de navigation         → Tests unitaires : RBAC, contrôle d'accès par rôle
│   └── Module Réclamations          → Tests E2E : navigation, affichage, création
│
└── Système complet
    └── Scénarios utilisateur        → Tests E2E : login, navigation dashboard, réclamations
```

---

## 1. Tests Unitaires — Backend Spring Boot

### Objectif

Vérifier la logique métier du backend Java de manière isolée, sans base de données ni réseau réel. Chaque règle métier critique est testée indépendamment pour garantir son comportement correct dans tous les cas possibles.

### Frameworks et outils

| Outil | Rôle |
|---|---|
| JUnit 5 | Framework principal d'exécution des tests Java |
| Mockito | Simulation (mock) des dépendances — remplace la BDD par des objets simulés |
| AssertJ | Bibliothèque d'assertions fluentes et lisibles |
| JaCoCo | Génération des rapports de couverture de code |
| Spring Boot Starter Test | Conteneur de test intégrant tous les outils ci-dessus |

### Commandes d'exécution

```powershell
# Lancer tous les tests
mvn test

# Lancer les tests d'un module spécifique
mvn test -Dtest=NomDuService

# Générer le rapport de couverture HTML
mvn test jacoco:report
```

### Résultats de couverture

| Métrique | Résultat |
|---|---|
| Classes couvertes | 100% — 171 / 171 |
| Méthodes couvertes | 88,4% — 1 125 / 1 273 |
| Branches couvertes | 91,8% — 3 834 / 4 175 |
| Lignes couvertes | 97,7% — 7 163 / 7 330 |

---

### Module Réclamations — 4 tests

**Objectif du module :** Valider le cycle de vie complet d'une réclamation soumise par un chauffeur : création, consultation, résolution, et escalade en cas d'urgence.

| # | Action testée | Scénario | Règle métier | Résultat |
|---|---|---|---|---|
| 1 | Consulter une réclamation | Réclamation existante → données retournées correctement | ID valide en base | ✅ |
| 2 | Consulter une réclamation inexistante | Identifiant inconnu → exception levée | Identifiant absent | ✅ |
| 3 | Résoudre une réclamation | Changement de statut : EN_COURS → RÉSOLU | Transition de statut | ✅ |
| 4 | Créer une réclamation urgente | Priorité URGENT → notification automatique au SuperAdmin | Branche priorité URGENT | ✅ |

**Couverture :** logique de création, de résolution, de rejet, et de notification SSE du service réclamation

---

### Module Pauses Réglementaires ML — 6 tests

**Objectif du module :** Vérifier que le système applique correctement le règlement européen CE 561/2006 sur les temps de conduite. Une erreur ici expose l'entreprise à des sanctions réglementaires.

| # | Action testée | Scénario | Règle CE 561/2006 | Résultat |
|---|---|---|---|---|
| 1 | Récupérer les pauses d'un trajet court | Trajet < 3h → aucune pause générée | Pas de pause obligatoire sous 3h | ✅ |
| 2 | Vérifier l'alerte d'avertissement | Trajet > 3h → alerte WARNING_ALERT présente | Alerte à 3h de conduite | ✅ |
| 3 | Vérifier la pause obligatoire | Trajet > 4h30 → pause MANDATORY_REST de 45min | Pause obligatoire à 4h30 | ✅ |
| 4 | Tester avec durée 3h exactement | 180 minutes → éligible aux pauses | Seuil minimum 3h | ✅ |
| 5 | Tester avec durée 4h | 240 minutes → éligible aux pauses | Seuil intermédiaire | ✅ |
| 6 | Tester durées variées (paramétré) | 270, 360, 480 minutes → tous éligibles | Toutes durées ≥ 3h | ✅ |

**Couverture :** conditions de seuil 3h et 4h30, génération des types de pauses WARNING_ALERT et MANDATORY_REST

---

## 2. Tests Unitaires — Services Python IA/ML

### Objectif

Valider la précision des algorithmes de traitement intelligent des réclamations. Le service IA analyse chaque réclamation avant soumission pour détecter le contenu inapproprié (toxicité) et vérifier la pertinence métier (sémantique). Une erreur dans ces algorithmes impacte directement l'expérience utilisateur.

### Frameworks et outils

| Outil | Rôle |
|---|---|
| pytest | Framework de test Python, exécution et rapport |
| pytest-cov | Calcul et affichage de la couverture de code |
| pytest-flask | Client de test pour les endpoints Flask |
| coverage.py | Analyse détaillée de la couverture ligne par ligne |

### Commandes d'exécution

```powershell
# Lancer tous les tests
pytest -v

# Lancer un module spécifique
pytest tests/test_toxicite.py -v
pytest tests/test_semantique.py -v
pytest tests/test_api_endpoints.py -v

# Générer le rapport de couverture
pytest --cov=app --cov-report=html tests/
```

### Résultats de couverture

| Module | Instructions | Couverture |
|---|---|---|
| Service Réclamation IA | 370 instructions | 99% |
| Modèle ML | 57 instructions | 100% |
| **Total** | **427 instructions** | **99%** |

---

### Module Détection de Toxicité — 7 tests

**Objectif du module :** S'assurer que l'algorithme de détection de contenu inapproprié est précis — ni trop restrictif (faux positifs qui bloqueraient des réclamations légitimes), ni trop permissif (faux négatifs qui laisseraient passer du contenu offensant).

| # | Action testée | Scénario | Comportement attendu | Résultat |
|---|---|---|---|---|
| 1 | Analyser un texte professionnel | Signalement d'une panne de véhicule | Score toxicité = 0,0 (non toxique) | ✅ |
| 2 | Analyser un texte avec insulte | Présence d'un mot grossier explicite | Score ≥ 0,55 (toxique détecté) | ✅ |
| 3 | Analyser une sous-chaîne ambiguë | Mot professionnel contenant une syllabe vulgaire | Score = 0,0 (word boundary respecté) | ✅ |
| 4 | Analyser du texte en majuscules | Même insulte écrite en majuscules | Score ≥ 0,55 (insensible à la casse) | ✅ |
| 5 | Tester un texte logistique (paramétré) | Retard de livraison secteur nord | Score = 0,0 (aucun faux positif) | ✅ |
| 6 | Tester un texte de maintenance (paramétré) | Maintenance urgente véhicule | Score = 0,0 (aucun faux positif) | ✅ |
| 7 | Tester un texte d'itinéraire (paramétré) | Problème route nationale | Score = 0,0 (aucun faux positif) | ✅ |

**Couverture :** moteur de règles regex, normalisation du texte, calcul de score, gestion des word boundaries

---

### Module Validation Sémantique — 5 tests

**Objectif du module :** Vérifier que les réclamations soumises concernent bien le domaine de la logistique. Empêcher les soumissions hors-sujet qui polluent le système de modération.

| # | Action testée | Scénario | Comportement attendu | Résultat |
|---|---|---|---|---|
| 1 | Analyser un texte sans rapport | Plainte personnelle non logistique | Score < 0,25 (rejeté) | ✅ |
| 2 | Analyser un texte véhicule | Signalement panne moteur camion | Score ≥ 0,25 (accepté) | ✅ |
| 3 | Analyser un texte trajet/livraison | Retard livraison sur itinéraire | Score ≥ 0,25 (accepté) | ✅ |
| 4 | Vérifier la borne maximale du score | Texte avec tous les mots-clés logistiques | Score ≤ 1,0 (normalisé) | ✅ |
| 5 | Vérifier le seuil de mots-clés | 2 mots-clés > 1 mot-clé → score supérieur | Proportionnalité au nombre de mots-clés | ✅ |

**Couverture :** moteur de mots-clés métier, calcul proportionnel, normalisation, seuil d'acceptation

---

### Module Endpoints API IA — 3 tests

**Objectif du module :** Valider que le service Flask expose correctement ses endpoints HTTP et retourne les réponses conformes au contrat d'interface attendu par le frontend Angular.

| # | Action testée | Scénario | Réponse attendue | Résultat |
|---|---|---|---|---|
| 1 | Vérifier la disponibilité du service | Appel au point de vérification de santé | Statut 200 + réponse "healthy" | ✅ |
| 2 | Valider un texte professionnel | Signalement de panne de frein | Statut 200 + valide = vrai | ✅ |
| 3 | Rejeter un texte toxique | Contenu contenant une insulte | Statut 200 + valide = faux + type = toxicité | ✅ |

**Couverture :** routage Flask, sérialisation des réponses JSON, gestion des erreurs 400

---

## 3. Tests Unitaires — Frontend Angular

### Objectif

Vérifier le comportement des composants Angular et des guards de navigation de manière isolée, sans appels réseau réels. Les services HTTP sont remplacés par des mocks. L'objectif principal est de valider le contrôle d'accès par rôle (RBAC) et les flux d'authentification.

### Frameworks et outils

| Outil | Rôle |
|---|---|
| Jest | Framework de test JavaScript/TypeScript, rapide et moderne |
| jest-preset-angular | Adaptateur Jest pour Angular (remplacement de Karma) |
| jest-environment-jsdom | Simulation du DOM navigateur en environnement Node.js |
| Istanbul | Génération des rapports de couverture (intégré à Jest) |

### Commandes d'exécution

```powershell
# Lancer tous les tests
npm test

# Avec rapport de couverture
npm run test:coverage
```

### Résultats de couverture

| Métrique | Résultat |
|---|---|
| Statements (instructions) | 100% — 20 / 20 |
| Branches (conditions) | 100% — 4 / 4 |
| Functions (fonctions) | 100% — 4 / 4 |
| Lines (lignes) | 100% — 19 / 19 |

---

### Module Authentification — Composant Login — 4 tests

**Objectif du module :** Valider tous les cas possibles lors de la connexion d'un utilisateur : succès avec redirection selon le rôle, et les différentes erreurs retournées par le backend.

| # | Action testée | Scénario | Comportement attendu | Résultat |
|---|---|---|---|---|
| 1 | Se connecter avec credentials valides | MANAGER avec entreprise active | Redirection vers le tableau de bord manager | ✅ |
| 2 | Se connecter avec mauvais mot de passe | Credentials incorrects | Affichage du message "Invalid credentials" | ✅ |
| 3 | Se connecter avec un compte rejeté | Compte refusé par le SuperAdmin | Affichage du message "Compte rejeté" | ✅ |
| 4 | Analyser le message d'erreur backend | Réponse JSON d'erreur du serveur | Extraction correcte du message depuis la réponse | ✅ |

**Couverture :** branche succès, branche erreur 401, branche erreur 403, extraction du message backend

---

### Module Guards de Navigation — 3 tests

**Objectif du module :** S'assurer que les routes protégées sont inaccessibles sans authentification valide, et que chaque rôle ne peut accéder qu'à ses pages autorisées. C'est la couche de sécurité frontend du système RBAC.

| # | Action testée | Scénario | Comportement attendu | Résultat |
|---|---|---|---|---|
| 1 | Accéder à une route protégée — utilisateur connecté | Session active et valide | Accès autorisé | ✅ |
| 2 | Accéder à une route protégée — non connecté | Aucune session active | Redirection vers la page de connexion | ✅ |
| 3 | Accéder à une route réservée MANAGER — rôle DRIVER | Chauffeur sur une page admin | Accès refusé | ✅ |

**Couverture :** branche session valide, branche session absente, branche rôle insuffisant

---

## 4. Tests de Performance — k6

### Objectif

Répondre à la question : *"La plateforme LogiWay tient-elle si 50 chauffeurs et managers se connectent simultanément ?"* Les tests de performance détectent les goulets d'étranglement avant la mise en production et valident le dimensionnement de l'architecture.

### Frameworks et outils

| Outil | Rôle |
|---|---|
| k6 v2.2.0 | Moteur de test de charge open-source (Grafana Labs) |
| Keycloak 24 | Authentification JWT automatique au démarrage des tests |

### Commandes d'exécution

```powershell
# Smoke test (30s, 1 VU)
& "C:\Program Files\k6\k6.exe" run tests-perf\logiway_smoke_test.js

# Load test principal (2min, 50 VUs)
& "C:\Program Files\k6\k6.exe" run tests-perf\logiway_load_test.js

# Stress test (6min, 300 VUs)
& "C:\Program Files\k6\k6.exe" run tests-perf\logiway_stress_test.js

# Soak test — endurance (14min, 20 VUs)
& "C:\Program Files\k6\k6.exe" run tests-perf\logiway_soak_test.js

# Générer le rapport HTML
& "C:\Program Files\k6\k6.exe" run --out json=tests-perf\results.json tests-perf\logiway_load_test.js
node tests-perf\generate_report.js
```

### Concepts clés

**VU (Virtual User) :** un utilisateur simulé envoyant des requêtes en continu.  
50 VUs = simulation de 50 utilisateurs actifs simultanément sur la plateforme.

**Percentile p(90)/p(95) :** mesure les temps de réponse en ignorant les pics extrêmes.  
p(95) = 38ms signifie que 95% des utilisateurs reçoivent leur réponse en moins de 38ms.

---

### Scénario 1 — Smoke Test

**Objectif :** Vérification minimale que le backend répond avant tout test lourd.

| Paramètre | Valeur |
|---|---|
| Durée | 30 secondes |
| Utilisateurs virtuels | 1 VU |
| Critère de succès | Tous les endpoints répondent |

---

### Scénario 2 — Load Test (Principal)

**Objectif :** Simuler la charge normale d'utilisation — 50 utilisateurs simultanés pendant 2 minutes avec montée progressive.

| Paramètre | Valeur |
|---|---|
| Durée totale | 2 minutes |
| Montée | 0 → 10 VUs en 30 secondes |
| Plateau | 10 → 50 VUs en 1 minute |
| Descente | 50 → 0 VUs en 30 secondes |
| Pic d'utilisateurs | 50 VUs simultanés |

**Fonctionnalités testées sous charge :**

| Fonctionnalité | Description | Seuil de performance |
|---|---|---|
| Liste des trajets | Récupération paginée des trajets de l'entreprise | p(90) < 1 500 ms |
| Pauses réglementaires | Calcul des pauses CE 561/2006 pour un trajet | p(90) < 5 000 ms |
| Notifications temps réel | Récupération des notifications SSE de l'utilisateur | p(90) < 1 500 ms |
| Durée globale | Toutes les requêtes confondues | p(95) < 2 000 ms |
| Taux d'erreur | Pourcentage de requêtes en échec | < 5% |

**Résultats obtenus :**

| Métrique | Seuil fixé | Résultat mesuré | Statut |
|---|---|---|---|
| Durée globale p(95) | < 2 000 ms | **38 ms** | ✅ PASSÉ |
| Liste trajets p(90) | < 1 500 ms | **30 ms** | ✅ PASSÉ |
| Pauses CE 561/2006 p(90) | < 5 000 ms | **9 ms** | ✅ PASSÉ |
| Notifications p(90) | < 1 500 ms | **39 ms** | ✅ PASSÉ |
| Taux d'erreur | < 5% | **0%** | ✅ PASSÉ |

**Indicateurs globaux du load test :**

| Indicateur | Valeur |
|---|---|
| Requêtes totales envoyées | ~2 050 en 2 minutes |
| Débit moyen | ~17 requêtes par seconde |
| Temps de réponse moyen | 22 ms |
| Temps de réponse minimum | 4,5 ms |
| Temps de réponse maximum | 246 ms |
| Données reçues | 296 MB |

---

### Scénario 3 — Stress Test

**Objectif :** Pousser le système au-delà de sa capacité nominale pour identifier le point de saturation.

| Paramètre | Valeur |
|---|---|
| Durée totale | 6 minutes |
| VUs maximum | 300 utilisateurs simultanés |
| Progression | 0 → 50 → 100 → 200 → 300 → 0 |

---

### Scénario 4 — Soak Test (Endurance)

**Objectif :** Maintenir une charge modérée pendant une longue durée pour détecter les fuites mémoire et la dégradation progressive des performances.

| Paramètre | Valeur |
|---|---|
| Durée totale | 14 minutes |
| VUs stables | 20 utilisateurs simultanés |
| Anomalie recherchée | Dégradation des temps de réponse dans le temps |

---

## 5. Tests End-to-End — Playwright

### Objectif

Simuler un vrai utilisateur humain qui navigue dans l'application via un navigateur Chrome réel. Les tests E2E valident l'intégration complète de toutes les couches : Angular + Spring Boot + Keycloak + MySQL. Ils détectent les régressions que les tests unitaires ne peuvent pas voir.

### Frameworks et outils

| Outil | Rôle |
|---|---|
| Playwright 1.63.0 | Framework de contrôle de navigateur (Microsoft) |
| Chromium 1243 | Navigateur Chrome utilisé pour l'exécution |
| global-setup | Login Keycloak unique partagé entre tous les tests |

### Commandes d'exécution

```powershell
# Lancer tous les tests (navigateur visible)
npx playwright test --headed

# Lancer un groupe de tests
npx playwright test e2e/auth.spec.ts --headed
npx playwright test e2e/dashboard.spec.ts --headed
npx playwright test e2e/reclamation.spec.ts --headed

# Rapport HTML interactif
npx playwright test --reporter=html
npx playwright show-report
```

### Architecture de session

Le login Keycloak est effectué **une seule fois** avant l'ensemble des tests. La session est sauvegardée puis injectée dans chaque test — évite les expirations de token et accélère l'exécution.

---

### Groupe 1 — Authentification — 4 tests

**Objectif :** Valider les scénarios d'authentification depuis l'interface utilisateur réelle : accès à la page de login, gestion des erreurs, et connexion réussie avec redirection selon le rôle.

| # | Action testée | Scénario utilisateur | Vérification | Résultat |
|---|---|---|---|---|
| 1 | Afficher le formulaire de connexion | Utilisateur non connecté accède à la page | Formulaire complet visible : email, mot de passe, bouton connexion, lien mot de passe oublié | ✅ |
| 2 | Soumettre des identifiants incorrects | Utilisateur tape un mauvais mot de passe | Message d'erreur affiché dans l'interface | ✅ |
| 3 | Accéder à la page de connexion sans session | Nouveau contexte navigateur sans historique | Page de connexion accessible et fonctionnelle | ✅ |
| 4 | Se connecter avec des identifiants valides | MANAGER avec compte actif | Redirection automatique vers le tableau de bord MANAGER | ✅ |

---

### Groupe 2 — Navigation Dashboard — 6 tests

**Objectif :** Vérifier que toutes les pages du tableau de bord sont accessibles pour un utilisateur authentifié, sans redirection non souhaitée vers la page de connexion.

| # | Action testée | Scénario utilisateur | Vérification | Résultat |
|---|---|---|---|---|
| 1 | Accéder au tableau de bord principal | Utilisateur connecté arrive sur son dashboard | Page chargée et affichée correctement | ✅ |
| 2 | Naviguer vers la gestion des trajets | Clic sur le menu Trajets | Page Trajets accessible, pas de redirection | ✅ |
| 3 | Naviguer vers la gestion de flotte | Clic sur le menu Flotte | Page Flotte accessible, pas de redirection | ✅ |
| 4 | Naviguer vers les réclamations | Clic sur le menu Réclamations | Page Réclamations accessible, pas de redirection | ✅ |
| 5 | Naviguer vers le profil utilisateur | Clic sur le menu Profil | Page Profil accessible, pas de redirection | ✅ |
| 6 | Naviguer vers les alertes | Clic sur le menu Alertes | Page Alertes accessible, pas de redirection | ✅ |

---

### Groupe 3 — Module Réclamations — 5 tests

**Objectif :** Valider le parcours complet d'un utilisateur sur la page de gestion des réclamations : affichage des données, statistiques en temps réel, et ouverture du formulaire de création.

| # | Action testée | Scénario utilisateur | Vérification | Résultat |
|---|---|---|---|---|
| 1 | Accéder à la page Réclamations | Navigation directe vers la page | Titre "Gestion des Réclamations" visible | ✅ |
| 2 | Consulter les statistiques | Chargement des données depuis l'API | 4 blocs affichés : Total, Résolues, Rejetées, En cours | ✅ |
| 3 | Consulter l'historique | Affichage du tableau des réclamations | Tableau avec colonnes et données visible | ✅ |
| 4 | Vérifier les permissions de création | Utilisateur MANAGER connecté | Bouton "Nouvelle réclamation" visible et cliquable | ✅ |
| 5 | Ouvrir le formulaire de création | Clic sur le bouton "Nouvelle réclamation" | Dialog Angular Material s'ouvre correctement | ✅ |

---

## 6. Bilan Global et Conclusions

### Tableau de synthèse final

| Couche testée | Outil | Nb. tests | Couverture | Résultat |
|---|---|---|---|---|
| Backend Java — Métier | JUnit 5 + Mockito + JaCoCo | 10 | 97,7% lignes | ✅ |
| Python — Toxicité | pytest + coverage.py | 7 | 99% | ✅ |
| Python — Sémantique | pytest + coverage.py | 5 | 99% | ✅ |
| Python — Endpoints API | pytest-flask | 3 | 99% | ✅ |
| Frontend — Login | Jest + Istanbul | 4 | 100% | ✅ |
| Frontend — Guards RBAC | Jest + Istanbul | 3 | 100% | ✅ |
| Performance — Load Test | k6 | 1 scénario | p(95) = 38ms | ✅ |
| Performance — Smoke | k6 | 1 scénario | — | ✅ |
| Performance — Stress | k6 | 1 scénario | — | ✅ |
| Performance — Soak | k6 | 1 scénario | — | ✅ |
| E2E — Authentification | Playwright | 4 | — | ✅ |
| E2E — Navigation | Playwright | 6 | — | ✅ |
| E2E — Réclamations | Playwright | 5 | — | ✅ |

### Points forts de la stratégie de test

- **Couverture supérieure à 97%** sur toutes les couches de code — Backend Java, Python IA/ML, et Frontend Angular
- **Zéro erreur sous charge** — Le backend traite 50 utilisateurs simultanés avec 0% de taux d'erreur
- **Performances excellentes** — Temps de réponse p(95) à 38ms, soit 52 fois en dessous du seuil de 2 000ms
- **Tests indépendants du code** — Les tests E2E Playwright n'ont nécessité aucune modification du code applicatif existant
- **Session centralisée** — Le login Keycloak unique partagé entre tous les tests E2E évite les problèmes d'expiration de token
- **Couverture des règles réglementaires** — La règle CE 561/2006 est testée sur 6 cas différents dont des tests paramétrés sur des durées variées

### Ordre d'exécution recommandé

```powershell
# 1. Tests unitaires Backend — rapides, sans prérequis
cd backend
mvn test

# 2. Tests unitaires Python IA/ML
cd pause-ai-service
pytest -v

cd reclamation-ai-service
pytest -v

# 3. Tests unitaires Frontend
cd frontend
npm test

# 4. Tests de performance — backend + Keycloak démarrés
cd ..
& "C:\Program Files\k6\k6.exe" run tests-perf\logiway_load_test.js

# 5. Tests E2E — frontend + backend + Keycloak démarrés
cd frontend
npx playwright test --headed
```
