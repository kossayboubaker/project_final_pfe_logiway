# 🔧 Troubleshooting Angular - Erreurs Courantes

## Erreur : "Failed to fetch dynamically imported module"

### Symptôme
```
ERROR TypeError: Failed to fetch dynamically imported module: 
http://localhost:4200/delivery-chart.component-XXXXX.js
```

### Causes Possibles
1. **Cache Angular corrompu** - Le plus fréquent
2. **Build incomplet** - Fichiers générés manquants
3. **Modules non importés** - Dépendances manquantes
4. **Port déjà utilisé** - Conflit de serveur

### Solutions

#### Solution 1 : Nettoyer le cache (Recommandé) ✅

**PowerShell :**
```powershell
cd frontend
.\fix-angular-build.ps1
ng serve --o
```

**Manuellement :**
```powershell
# Supprimer les caches
Remove-Item -Recurse -Force .angular/cache
Remove-Item -Recurse -Force node_modules/.cache
Remove-Item -Recurse -Force dist

# Relancer le serveur
ng serve --o
```

#### Solution 2 : Rebuild complet

```powershell
# Arrêter le serveur (Ctrl+C)
cd frontend

# Nettoyer
npm run clean  # ou les commandes manuelles ci-dessus

# Rebuild
ng build --configuration development

# Relancer
ng serve --o
```

#### Solution 3 : Réinstaller les dépendances

```powershell
cd frontend

# Supprimer node_modules
Remove-Item -Recurse -Force node_modules

# Réinstaller
npm install

# Relancer
ng serve --o
```

#### Solution 4 : Vérifier le port

```powershell
# Vérifier si le port 4200 est utilisé
netstat -ano | findstr :4200

# Si occupé, tuer le processus
taskkill /PID <PID> /F

# Ou utiliser un autre port
ng serve --port 4201 --open
```

## Erreur : "Cannot find module" ou imports manquants

### Symptôme
```
ERROR NG8001: 'mat-button-toggle' is not a known element
```

### Solution
Vérifier que le module est importé dans le composant :

```typescript
import { MatButtonToggleModule } from '@angular/material/button-toggle';

@Component({
  imports: [
    // ... autres imports
    MatButtonToggleModule  // ← Ajouter ici
  ]
})
```

## Erreur : "Cannot find module '../../../environments/environment'"

### Solution
Utiliser l'URL directe au lieu de environment :

```typescript
// ❌ Ne fonctionne pas si environment n'existe pas
import { environment } from '../../../environments/environment';
private apiUrl = `${environment.apiUrl}/pauseai`;

// ✅ Utiliser URL directe
private apiUrl = 'http://localhost:8080/api/pauseai';
```

## Erreur : Composants ne se chargent pas après modifications

### Solution : Recharger le navigateur

1. **Hard Refresh** : `Ctrl + Shift + R` ou `Ctrl + F5`
2. **Vider le cache navigateur** : F12 → Network → "Disable cache" (coché)
3. **Vider complètement** : F12 → Application → Clear storage

## Erreur : "Module build failed" lors de ng serve

### Solution

```powershell
# 1. Vérifier la version Node.js
node --version  # Doit être >= 18

# 2. Vérifier la version Angular CLI
ng version

# 3. Si nécessaire, mettre à jour
npm install -g @angular/cli@latest

# 4. Mettre à jour les dépendances du projet
cd frontend
npm update
```

## Commandes Utiles

### Nettoyage rapide
```powershell
cd frontend
Remove-Item -Recurse -Force .angular/cache, node_modules/.cache, dist
ng serve --o
```

### Rebuild depuis zéro
```powershell
cd frontend
Remove-Item -Recurse -Force node_modules, .angular, dist
npm install
ng serve --o
```

### Vérifier les erreurs de compilation
```powershell
ng build --configuration development
```

### Mode production (optimisé)
```powershell
ng build --configuration production
```

## Logs et Debugging

### Activer les logs détaillés
```powershell
ng serve --verbose
```

### Voir les chunks générés
```powershell
ng build --stats-json
```

### Analyser le bundle
```powershell
npm install -g webpack-bundle-analyzer
ng build --stats-json
webpack-bundle-analyzer dist/stats.json
```

## Problèmes Spécifiques au Projet

### Dashboard Pause IA ne charge pas

**Vérifier :**
1. Le composant est bien créé : `frontend/src/app/features/pause-analytics/`
2. Les imports Material sont présents : `MatButtonToggleModule`, etc.
3. Le service est accessible : Vérifier la console (F12)

**Solution :**
```powershell
cd frontend
.\fix-angular-build.ps1
ng serve --o
```

### Notifications de pause ne s'affichent pas

**Vérifier :**
1. SSE connecté : Network tab → Voir `sse` dans les connexions
2. Service PauseAI injecté : Console → Pas d'erreur d'injection
3. Alert$ subscription active : Logs `[PauseAIService]`

### Icônes Material ne s'affichent pas

**Solution :**
Vérifier que Material Icons est chargé dans `index.html` :

```html
<link href="https://fonts.googleapis.com/icon?family=Material+Icons" rel="stylesheet">
```

## Prévention

### Bonnes Pratiques

1. **Toujours arrêter le serveur** avant de supprimer des fichiers
2. **Commiter régulièrement** pour pouvoir revenir en arrière
3. **Ne pas modifier** `node_modules/` manuellement
4. **Utiliser le cache désactivé** pendant le développement (F12 → Network)
5. **Tester dans un navigateur propre** (mode incognito) si doutes

### Avant de commiter

```powershell
# Vérifier que tout compile
ng build --configuration production

# Vérifier les tests (si présents)
ng test --watch=false

# Vérifier le linting
ng lint
```

## Aide Supplémentaire

### Documentation Officielle
- Angular : https://angular.dev
- Angular Material : https://material.angular.io
- Angular CLI : https://angular.io/cli

### Si le problème persiste

1. **Vérifier les logs** : `frontend/logs/` (si configurés)
2. **Vérifier la console navigateur** : F12 → Console
3. **Vérifier Network** : F12 → Network → Voir les requêtes échouées
4. **Vérifier le terminal** : Erreurs de compilation

### Réinitialisation complète (dernier recours)

```powershell
cd frontend

# Sauvegarder vos modifications
git status
git add .
git commit -m "WIP: avant réinitialisation"

# Nettoyer complètement
Remove-Item -Recurse -Force node_modules, .angular, dist, package-lock.json

# Réinstaller
npm install

# Relancer
ng serve --o
```

---

**Note** : La plupart des problèmes se résolvent avec un simple nettoyage du cache Angular. 
Le script `fix-angular-build.ps1` fait cela automatiquement.
