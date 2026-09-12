# 📊 GUIDE COMPLET - RAPPORT DE COUVERTURE HTML

**Objectif:** Générer un rapport HTML de couverture de tests et l'ouvrir dans le navigateur

---

## 📋 MÉTHODE 1: AVEC INTELLIJ IDEA (RAPIDE)

### ÉTAPE 1: Exécuter les tests avec couverture

1. **Ouvrir le fichier de test** dans IntelliJ:
   ```
   backend/src/test/java/com/logiway/services/ReclamationServiceTest.java
   ```

2. **Clic droit** sur le fichier

3. **Cliquer sur:** "Run 'ReclamationServiceTest' with Coverage"
   - Icône avec un bouclier vert 🛡️

4. **Attendre** que les tests se terminent

### ÉTAPE 2: Voir le rapport dans IntelliJ

Une fois terminé, vous verrez:
- ✅ Pourcentages de couverture à droite de chaque classe
- ✅ Lignes vertes = testées
- ✅ Lignes rouges = non testées

### ÉTAPE 3: Générer le rapport HTML

1. Dans IntelliJ, cliquer sur **"Coverage"** en bas (onglet à côté de "Run")

2. Clic droit sur **"com.logiway.services"** dans la fenêtre Coverage

3. Cliquer sur **"Generate Coverage Report"**

4. Une boîte de dialogue s'ouvre:
   - **Format:** HTML
   - **Destination:** Laisser par défaut ou choisir `backend/target/site/jacoco`
   - Cliquer **"OK"**

5. IntelliJ génère le rapport et affiche un message de confirmation

### ÉTAPE 4: Ouvrir le rapport HTML

**OPTION A: Double-clic sur le fichier .bat**
```
Double-cliquer sur: OUVRIR_RAPPORT_TESTS.bat
```
Le rapport s'ouvre automatiquement dans votre navigateur par défaut.

**OPTION B: Manuellement**
1. Aller dans le dossier:
   ```
   backend/target/site/jacoco/
   ```

2. Double-cliquer sur **`index.html`**

3. Le rapport s'ouvre dans votre navigateur par défaut (Chrome, Edge, Firefox)

---

## 📋 MÉTHODE 2: AVEC MAVEN (LIGNE DE COMMANDE)

### ÉTAPE 1: Ouvrir PowerShell

1. **Windows + R**
2. Taper: `powershell`
3. Appuyer sur **Entrée**

### ÉTAPE 2: Aller dans le dossier backend

```powershell
cd "C:\Users\kossa\OneDrive\Desktop\essais\backend"
```

### ÉTAPE 3: Générer le rapport avec Maven

```powershell
mvn clean test jacoco:report
```

**Note:** Cela prend 1-2 minutes selon votre machine.

### ÉTAPE 4: Ouvrir le rapport

Le rapport est généré ici:
```
backend/target/site/jacoco/index.html
```

**Double-cliquer** sur `index.html` pour l'ouvrir.

---

## 🌐 CE QUE VOUS VERREZ DANS LE NAVIGATEUR

### Page d'accueil (index.html)

| Package | Class, % | Method, % | Line, % | Branch, % |
|---------|----------|-----------|---------|-----------|
| com.logiway.services | 6% | 3% | 3% | 2% |
| com.logiway.services.impl | 6% | 4% | 4% | 2% |

### Navigation:
1. **Cliquer sur un package** → Voir les classes
2. **Cliquer sur une classe** → Voir les méthodes
3. **Cliquer sur une méthode** → Voir le code source avec:
   - ✅ **Vert** = Ligne testée
   - ❌ **Rouge** = Ligne non testée
   - 🟡 **Jaune** = Partiellement testée

### Statistiques importantes:
- **Class %** → Pourcentage de classes testées
- **Method %** → Pourcentage de méthodes testées
- **Line %** → Pourcentage de lignes testées
- **Branch %** → Pourcentage de branches conditionnelles testées

---

## 📸 CAPTURES D'ÉCRAN POUR VOTRE PFE

### Capture 1: Vue d'ensemble
- Prendre une capture de la page d'accueil avec les statistiques globales

### Capture 2: Détail d'une classe
- Cliquer sur `ReclamationServiceImpl`
- Prendre une capture montrant les méthodes testées (en vert)

### Capture 3: Code source coloré
- Cliquer sur une méthode testée
- Prendre une capture montrant le code avec les lignes vertes

---

## 🎯 EXEMPLE DE RÉSULTAT

```
Rapport de Couverture - LogiWay Backend

📊 Statistiques Globales:
- Classes testées: 3/45 (6%)
- Méthodes testées: 22/571 (3%)
- Lignes testées: 216/5931 (3%)

📦 Packages:
✅ com.logiway.services.impl
   - ReclamationServiceImpl: 80% (10 tests)
   - UserServiceImpl: 60% (8 tests)
   - TrajetServiceImpl: 50% (8 tests)
```

---

## 🔧 FICHIERS CRÉÉS

1. ✅ **OUVRIR_RAPPORT_TESTS.bat** → Double-clic pour ouvrir le rapport
2. ✅ **GUIDE_RAPPORT_COVERAGE_HTML.md** → Ce guide

---

## ❓ PROBLÈMES FRÉQUENTS

### "Le fichier index.html n'existe pas"

**Solution:**
1. Exécutez d'abord les tests avec couverture dans IntelliJ
2. Générez le rapport HTML (voir ÉTAPE 3)
3. Relancez le fichier .bat

### "Le navigateur n'ouvre rien"

**Solution:**
1. Ouvrez manuellement le fichier:
   ```
   backend/target/site/jacoco/index.html
   ```
2. Faites un clic droit → "Ouvrir avec" → Choisir votre navigateur

### "Maven n'est pas reconnu"

**Solution:**
- Utilisez la MÉTHODE 1 avec IntelliJ (pas besoin de Maven)

---

## 💡 ASTUCE PRO

Pour avoir un rapport complet de TOUS les tests:

1. Exécuter **ReclamationServiceTest** with Coverage
2. Dans l'onglet Coverage, cliquer sur l'icône **"+"**
3. Exécuter **UserServiceTest** with Coverage
4. Cliquer encore sur **"+"**
5. Exécuter **TrajetServiceTest** with Coverage
6. Générer le rapport HTML → Vous aurez la couverture des 3 fichiers de test !

---

## ✅ RÉSUMÉ RAPIDE

1. **IntelliJ:** Run with Coverage
2. **Coverage tab:** Generate Coverage Report
3. **Double-clic:** OUVRIR_RAPPORT_TESTS.bat
4. **Voir:** Le rapport dans votre navigateur 🌐

**Temps total:** 2-3 minutes
