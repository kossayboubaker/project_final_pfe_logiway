# Tests E2E LogiWay — Playwright

> **Outil : Playwright** — teste l'interface complète dans un vrai navigateur Chrome  
> **Répertoire de travail : `C:\Users\kossa\OneDrive\Desktop\essais\frontend`**

---

## Qu'est-ce qu'un test E2E ?

Un test **End-to-End** simule un vrai utilisateur qui navigue dans l'application :  
ouverture du navigateur → login → navigation → actions → vérification du résultat.

Contrairement aux tests unitaires qui testent une fonction isolée, les tests E2E testent  
**l'intégration complète** : Angular + Spring Boot + Keycloak + MySQL ensemble.

---

## Prérequis

Ces 3 services doivent être démarrés :

| Service | URL |
|---|---|
| Frontend Angular | `http://localhost:4200` |
| Backend Spring Boot | `http://localhost:8080` |
| Keycloak | `http://localhost:8180` |

---

## Installation (une seule fois)

Depuis `C:\Users\kossa\OneDrive\Desktop\essais\frontend` :

```powershell
# 1. Installer Playwright
npm install --save-dev @playwright/test

# 2. Télécharger le navigateur Chrome
npx playwright install chromium
```

### Configurer les credentials de test

Ouvrir `e2e\helpers\auth.helper.ts` et remplacer `METS_TON_MOT_DE_PASSE_ICI`  
par le vrai mot de passe du compte manager de test.

---

## Fichiers de tests

```
frontend\e2e\
├── helpers\
│   └── auth.helper.ts        ← Login réutilisable (credentials + fonction login())
├── auth.spec.ts              ← Tests authentification (login, erreurs, guards)
├── dashboard.spec.ts         ← Tests navigation dashboard et accès par rôle
├── reclamation.spec.ts       ← Tests module réclamations
└── README.md                 ← Ce fichier
```

---

## Scénarios testés

### auth.spec.ts — Authentification (4 tests)
| Test | Scénario |
|---|---|
| 1 | Page login affiche formulaire complet |
| 2 | Login invalide → message d'erreur |
| 3 | Accès dashboard sans auth → redirection login |
| 4 | Login valide → accès dashboard |

### dashboard.spec.ts — Navigation (6 tests)
| Test | Scénario |
|---|---|
| 1 | Dashboard accessible après login |
| 2 | Navigation `/dashboard/trips` |
| 3 | Navigation `/dashboard/fleet` |
| 4 | Navigation `/dashboard/reclamations` |
| 5 | Profil utilisateur accessible |
| 6 | MANAGER bloqué sur route SUPERADMIN |

### reclamation.spec.ts — Module Réclamations (5 tests)
| Test | Scénario |
|---|---|
| 1 | Navigation vers la page réclamations |
| 2 | 4 blocs de stats affichés |
| 3 | Tableau des réclamations visible |
| 4 | Bouton "Nouvelle réclamation" visible |
| 5 | Clic bouton → dialog s'ouvre |

---

## Commandes d'exécution

Depuis `C:\Users\kossa\OneDrive\Desktop\essais\frontend` :

### Lancer tous les tests E2E
```powershell
npx playwright test
```

### Avec navigateur visible (mode debug)
```powershell
npx playwright test --headed
```

### Un seul fichier
```powershell
npx playwright test e2e\auth.spec.ts
npx playwright test e2e\reclamation.spec.ts
npx playwright test e2e\dashboard.spec.ts
```

### Générer le rapport HTML interactif
```powershell
npx playwright test --reporter=html
```
Puis ouvrir :
```powershell
npx playwright show-report
```

### Enregistrer un nouveau test automatiquement
```powershell
npx playwright codegen http://localhost:4200
```
Ouvre le navigateur et enregistre tes actions → génère le code du test automatiquement.

---

## Rapport HTML

Après chaque exécution, le rapport est disponible dans :
```
frontend\playwright-report\index.html
```

Il contient pour chaque test :
- ✅ / ❌ résultat
- Capture d'écran en cas d'échec
- Vidéo du test en cas d'échec
- Trace complète pour debug
