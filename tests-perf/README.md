# Tests de Performance — Plateforme LogiWay

> **Outil utilisé : k6 v2.2.0** (Grafana Labs — open source)  
> **Backend testé : Spring Boot — `http://localhost:8080`**  
> **Répertoire de travail : `C:\Users\kossa\OneDrive\Desktop\essais`**

---

## Qu'est-ce qu'un test de performance ?

Un test de performance **simule plusieurs utilisateurs qui utilisent l'application en même temps** pour répondre à la question :

> *"Mon API LogiWay tient-elle si 50 chauffeurs et managers se connectent simultanément ?"*

Contrairement aux tests unitaires qui vérifient la logique du code, les tests de performance mesurent la **résistance sous charge** : temps de réponse, taux d'erreur, comportement à l'échelle.

---

## Concepts clés

### VU — Virtual User (Utilisateur Virtuel)
Un VU simule un utilisateur réel qui envoie des requêtes en continu.

- **1 VU** = 1 utilisateur qui navigue sur l'appli
- **50 VUs** = 50 utilisateurs simultanés
- Les VUs montent progressivement (ramp up) puis descendent (ramp down) pour simuler l'arrivée naturelle des utilisateurs

```
Utilisateurs
     50 |          ████████████████
        |        ██                ██
     10 |      ██                    ██
      1 |    ██                        ██
        └──────────────────────────────────→ temps
          0s   30s        1min30s      2min
               ↑               ↑
           10 users         descente
```

### Percentile — p(90), p(95), p(99)
Le percentile mesure les temps de réponse **en ignorant les pics extrêmes**.

- **p(95) = 38ms** → 95% des utilisateurs ont reçu une réponse en moins de 38ms
- **p(90) = 30ms** → 90% des utilisateurs ont reçu une réponse en moins de 30ms

On utilise le percentile et non la moyenne car une seule requête lente à 5000ms ne doit pas masquer que 99% des requêtes sont rapides.

### Seuil (Threshold)
Critère de réussite ou d'échec du test. Exemple :  
`p(95) < 2000ms` → si 95% des requêtes répondent en moins de 2 secondes, le test **passe** ✅  
Sinon le test **échoue** ❌ et une optimisation est nécessaire.

---

## Les 4 scénarios de test

| # | Type | Objectif | Durée | VUs max |
|---|---|---|---|---|
| 1 | **Smoke** | Vérifier que l'API répond au minimum | 30s | 1 |
| 2 | **Load** | Simuler la charge normale (50 utilisateurs) | 2min | 50 |
| 3 | **Stress** | Trouver le point de rupture du système | 6min | 300 |
| 4 | **Soak** | Détecter les fuites mémoire sur la durée | 14min | 20 |

### Endpoints testés dans chaque scénario

| Endpoint | Rôle métier | Seuil |
|---|---|---|
| `GET /api/trajets` | Liste des trajets de l'entreprise | p(90) < 1500ms |
| `GET /api/trajets/{id}/pauses` | Pauses réglementaires CE 561/2006 | p(90) < 5000ms |
| `GET /api/notifications` | Notifications temps réel | p(90) < 1500ms |

---

## Installation (une seule fois)

### 1. Installer k6

```powershell
winget install k6
```

Fermer et rouvrir le terminal après installation.

### 2. Vérifier l'installation

```powershell
& "C:\Program Files\k6\k6.exe" version
```

Résultat attendu : `k6 v2.2.0 (windows/amd64)`

> ⚠️ Sur ce poste, k6 ne répond pas à la commande courte `k6`.  
> Utiliser toujours le chemin complet : `& "C:\Program Files\k6\k6.exe"`

---

## Prérequis avant chaque test

Ces deux services doivent être démarrés :

| Service | URL | Rôle |
|---|---|---|
| Backend Spring Boot | `http://localhost:8080` | API testée |
| Keycloak | `http://localhost:8180` | Authentification automatique |

> Le login Keycloak est **entièrement automatique** — k6 récupère un token JWT  
> au démarrage du test sans aucune action manuelle.

---

## Exécution des tests — commandes complètes

> 📁 **Se placer dans :** `C:\Users\kossa\OneDrive\Desktop\essais`

---

### Test 1 — Smoke (vérification rapide, 30 secondes)

```powershell
& "C:\Program Files\k6\k6.exe" run tests-perf\logiway_smoke_test.js
```

Valide que les 3 endpoints principaux répondent avant de lancer les tests lourds.  
Résultat attendu : 4 checks `✓` verts, aucune erreur.

---

### Test 2 — Load (test principal, 2 minutes, 50 VUs)

```powershell
& "C:\Program Files\k6\k6.exe" run tests-perf\logiway_load_test.js
```

Simule 50 utilisateurs simultanés avec montée progressive.  
Le login Keycloak est automatique (credentials configurés dans le fichier).

Pour utiliser un autre compte :
```powershell
& "C:\Program Files\k6\k6.exe" run -e KC_USER="email@domaine.com" -e KC_PASS="MotDePasse" tests-perf\logiway_load_test.js
```

---

### Test 3 — Stress (optionnel, 6 minutes, jusqu'à 300 VUs)

```powershell
& "C:\Program Files\k6\k6.exe" run tests-perf\logiway_stress_test.js
```

Pousse le système au-delà de sa limite pour identifier le point de saturation.  
⚠️ À exécuter uniquement sur environnement de test, jamais en production.

---

### Test 4 — Soak / Endurance (optionnel, 14 minutes, 20 VUs)

```powershell
& "C:\Program Files\k6\k6.exe" run tests-perf\logiway_soak_test.js
```

Maintient une charge modérée pendant longtemps pour détecter les fuites mémoire  
et la dégradation progressive des performances.

---

## Générer le rapport HTML

### Étape 1 — Relancer le test avec export JSON

```powershell
& "C:\Program Files\k6\k6.exe" run --out json=tests-perf\results.json tests-perf\logiway_load_test.js
```

Produit : `tests-perf\results.json`

### Étape 2 — Générer le rapport HTML

```powershell
node tests-perf\generate_report.js
```

Produit : `tests-perf\rapport_performance.html`

### Étape 3 — Ouvrir le rapport dans le navigateur

```powershell
Invoke-Item tests-perf\rapport_performance.html
```

---

## Résultats obtenus — LogiWay v1.0

Tests exécutés le **07 septembre 2026** sur environnement local.

### Conditions du test
- **Machine :** Windows 11, Intel Core i7, 16 Go RAM
- **Backend :** Spring Boot 3.2.2, MySQL 8.0, Keycloak 24
- **Scénario :** Load test — 50 VUs simultanés pendant 2 minutes
- **Utilisateur simulé :** Manager avec rôles CHAUFFEUR + MANAGER

### Résultats des seuils

| Métrique | Seuil fixé | Résultat mesuré | Statut |
|---|---|---|---|
| Durée globale p(95) | < 2000 ms | **38 ms** | ✅ PASSÉ |
| Trajets p(90) | < 1500 ms | **30 ms** | ✅ PASSÉ |
| Pauses CE 561/2006 p(90) | < 5000 ms | **9 ms** | ✅ PASSÉ |
| Notifications p(90) | < 1500 ms | **39 ms** | ✅ PASSÉ |
| Taux d'erreur | < 5 % | **0 %** | ✅ PASSÉ |

### Chiffres clés

| Indicateur | Valeur |
|---|---|
| Requêtes totales envoyées | ~2050 en 2 minutes |
| Débit moyen | ~17 requêtes/seconde |
| Temps de réponse moyen | 22 ms |
| Temps de réponse minimum | 4.5 ms |
| Temps de réponse maximum | 246 ms |
| VUs simultanés au pic | 50 |
| Données reçues | 296 MB |

### Interprétation

Le backend LogiWay absorbe **50 utilisateurs simultanés sans dégradation de performance**.  
Le p(95) à 38ms est **52 fois inférieur** au seuil de 2000ms fixé dans le guide.  
Le taux d'erreur est de **0%** — aucune requête n'a échoué sous charge.

Ces résultats confirment que l'architecture Spring Boot + MySQL est dimensionnée  
correctement pour un usage réel de la plateforme LogiWay.

---

## Structure des fichiers

```
C:\Users\kossa\OneDrive\Desktop\essais\tests-perf\
│
├── logiway_smoke_test.js       ← Test 1 : smoke (30s, 1 VU)
├── logiway_load_test.js        ← Test 2 : load (2min, 50 VUs) ★ principal
├── logiway_stress_test.js      ← Test 3 : stress (6min, 300 VUs)
├── logiway_soak_test.js        ← Test 4 : soak/endurance (14min, 20 VUs)
├── logiway_scenarios_test.js   ← Test 5 : simulation par rôle
│
├── generate_report.js          ← Script Node.js : génère le rapport HTML
│
├── results.json                ← Données brutes k6 (généré après --out json)
├── rapport_performance.html    ← Rapport final consultable dans le navigateur
│
└── README.md                   ← Ce fichier
```
