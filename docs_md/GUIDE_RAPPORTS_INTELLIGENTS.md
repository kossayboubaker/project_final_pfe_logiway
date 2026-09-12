# 📊 Guide - Module de Génération de Rapports Intelligents

## 🎯 Vue d'ensemble

Le module de génération de rapports intelligents permet de créer des rapports professionnels (PDF, CSV, TXT) à partir de requêtes en **langage naturel français**, sans écrire de code SQL.

### ✨ Exemple d'utilisation

```
Utilisateur: "Génère un rapport PDF des véhicules en maintenance cette semaine"
           ↓
    Analyse NLU par Gemini
           ↓
    Extraction SQL automatique
           ↓
    Génération PDF professionnelle
           ↓
    Téléchargement + archivage
```

---

## 🚀 Démarrage Rapide

### 1. Installation des dépendances

```powershell
# Dans le dossier rag-service
cd rag-service
pip install reportlab==4.0.7
```

### 2. Démarrer les services

**Terminal 1 - RAG Service (Python):**
```powershell
cd rag-service
cmd /c START_SIMPLE.bat
# Service disponible sur http://localhost:5003
```

**Terminal 2 - Backend Java:**
```powershell
cd backend
mvn spring-boot:run
# Service disponible sur http://localhost:8080
```

**Terminal 3 - Frontend Angular:**
```powershell
cd frontend
npm start
# Interface disponible sur http://localhost:4200
```

### 3. Accéder à l'interface

1. Ouvrir http://localhost:4200
2. Se connecter avec un compte **SUPERADMIN** ou **MANAGER**
3. Menu: **Statistiques & Analytique** > **Générer Rapports**

---

## 📋 Guide d'utilisation

### Vue Génération

1. **Saisir une requête en français naturel**
   - Exemple: `"Rapport PDF des congés validés cette semaine"`
   - Ou cliquer sur un exemple pré-défini

2. **Choisir le format**
   - PDF: Rapport professionnel avec tableaux et graphiques
   - CSV: Export tabulaire pour Excel
   - TXT: Résumé structuré lisible

3. **Cliquer sur "Générer le Rapport"**
   - Génération en cours (< 10 secondes)
   - Téléchargement automatique
   - Archivage dans la liste

### Vue Liste des Rapports

- **Filtrer** par domaine (véhicules, chauffeurs, etc.)
- **Télécharger** un rapport existant
- **Supprimer** un rapport
- **Actualiser** la liste

---

## 💡 Exemples de Requêtes

### Véhicules
```
"Rapport PDF de tous les véhicules"
"Liste CSV des véhicules en maintenance"
"Véhicules disponibles avec leur kilométrage"
```

### Chauffeurs
```
"Liste CSV des chauffeurs actifs"
"Rapport des chauffeurs avec plus de 50 trajets"
"Chauffeurs disponibles cette semaine"
```

### Trajets
```
"Statistiques TXT des trajets ce mois"
"Rapport PDF des trajets par secteur"
"Trajets de plus de 100km cette semaine"
```

### Congés
```
"Rapport des congés validés cette semaine"
"Liste CSV des demandes de congés en attente"
"Congés du mois dernier par chauffeur"
```

### Réclamations
```
"Réclamations ouvertes en priorité haute"
"Rapport PDF des réclamations résolues"
"Statistiques des réclamations par type"
```

### Rapport Global
```
"Rapport global de la flotte"
"Bilan complet de la plateforme"
"Statistiques générales cette semaine"
```

---

## 🔧 Test du Module

### Test Python (Backend RAG)

```powershell
cd rag-service
python test_reports.py
```

**Résultats attendus:**
- ✓ Service health check OK
- ✓ Génération d'un rapport PDF
- ✓ Téléchargement du fichier
- ✓ Listage des rapports

### Test Manuel

1. Accéder à http://localhost:4200/dashboard/statistics/rapports
2. Cliquer sur un exemple: `"Rapport PDF de tous les véhicules"`
3. Cliquer sur "Générer le Rapport"
4. Vérifier:
   - Message de succès affiché
   - Fichier téléchargé automatiquement
   - Rapport visible dans la liste

---

## 📁 Structure des Fichiers

### Backend Python (rag-service/)
```
app/
├── models.py                 # Modèles Pydantic
├── report_analyzer.py        # Analyse NLU (Gemini)
├── report_extractor.py       # Extraction SQL
├── report_storage.py         # Stockage + métadonnées
├── generators/
│   ├── pdf_generator.py      # Génération PDF
│   ├── csv_generator.py      # Génération CSV
│   └── txt_generator.py      # Génération TXT
└── main.py                   # Endpoints API

reports/                      # Dossier des rapports générés
test_reports.py               # Script de test
```

### Backend Java (backend/)
```
src/main/java/com/logiway/
├── dto/
│   ├── request/GenerateReportRequest.java
│   └── response/
│       ├── GenerateReportResponse.java
│       ├── ReportMetadataResponse.java
│       └── ReportListResponse.java
├── services/ReportGenerationService.java
└── controllers/ReportGenerationController.java
```

### Frontend Angular (frontend/)
```
src/app/
├── models/report.models.ts
├── core/services/report.service.ts
└── features/analytics/generate-rapport/
    ├── generate-rapport.component.ts
    ├── generate-rapport.component.html
    └── generate-rapport.component.css
```

---

## 🔌 API Endpoints

### Python (RAG Service - Port 5003)

| Méthode | Endpoint | Description |
|---------|----------|-------------|
| POST | `/api/reports/generate` | Génère un rapport |
| GET | `/api/reports` | Liste les rapports |
| GET | `/api/reports/{id}` | Métadonnées d'un rapport |
| GET | `/api/reports/download/{id}` | Télécharge un rapport |
| DELETE | `/api/reports/{id}` | Supprime un rapport |

### Java (Backend - Port 8080)

| Méthode | Endpoint | Description |
|---------|----------|-------------|
| POST | `/api/reports/generate` | Génère un rapport (proxy) |
| GET | `/api/reports` | Liste les rapports (proxy) |
| GET | `/api/reports/{id}` | Métadonnées (proxy) |
| GET | `/api/reports/download/{id}` | Télécharge (proxy) |
| DELETE | `/api/reports/{id}` | Supprime (proxy) |

---

## 🎨 Personnalisation

### Ajouter un nouveau domaine

**1. Backend Python (`report_analyzer.py`):**
```python
DOMAINES = {
    "vehicules": [...],
    "mon_nouveau_domaine": ["mot-clé1", "mot-clé2"]
}
```

**2. Backend Python (`report_extractor.py`):**
```python
DOMAINE_TABLES = {
    "mon_nouveau_domaine": {
        "table": "ma_table",
        "colonnes": ["col1", "col2"],
        "jointures": [...]
    }
}
```

### Personnaliser le design des rapports PDF

Modifier `rag-service/app/generators/pdf_generator.py`:
- Couleurs: `colors.HexColor('#1976D2')`
- Polices: `fontName='Helvetica-Bold'`
- Styles de tableaux: `TableStyle([...])`

---

## ⚠️ Dépannage

### Erreur: "ReportLab non installé"
```powershell
pip install reportlab==4.0.7
```

### Erreur: "Service RAG non disponible"
1. Vérifier que le RAG service tourne sur port 5003
2. Tester: `curl http://localhost:5003/health`

### Erreur: "Rapport non trouvé"
1. Vérifier que la table `rapports_metadata` existe
2. Vérifier que le dossier `rag-service/reports/` existe

### Rapports non téléchargés
1. Vérifier les permissions du dossier `reports/`
2. Vérifier les CORS sur les 3 services

---

## 📊 Base de Données

### Table: rapports_metadata

```sql
CREATE TABLE rapports_metadata (
    report_id VARCHAR(100) PRIMARY KEY,
    titre VARCHAR(255) NOT NULL,
    format VARCHAR(10) NOT NULL,
    domaine VARCHAR(50) NOT NULL,
    statut VARCHAR(20) DEFAULT 'COMPLETED',
    user_id VARCHAR(50) NOT NULL,
    entreprise_id VARCHAR(50),
    date_creation TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    date_debut_donnees DATE,
    date_fin_donnees DATE,
    taille_fichier_ko INT,
    fichier_path VARCHAR(500),
    nb_lignes INT,
    temps_generation_ms INT,
    erreur TEXT,
    INDEX idx_user (user_id),
    INDEX idx_date (date_creation),
    INDEX idx_domaine (domaine)
);
```

Cette table est créée automatiquement au démarrage du service RAG.

---

## 🎯 Bonnes Pratiques

### Rédaction des Requêtes

✅ **BON:**
- "Rapport PDF des véhicules en maintenance cette semaine"
- "Liste CSV des chauffeurs actifs avec plus de 10 trajets"
- "Statistiques des congés validés ce mois"

❌ **ÉVITER:**
- "donne moi les trucs" (trop vague)
- Requêtes trop longues (> 200 caractères)
- Requêtes avec fautes graves

### Performance

- Les rapports avec < 1000 lignes sont générés en < 5 secondes
- Les rapports avec > 5000 lignes peuvent prendre 10-15 secondes
- Limiter les requêtes globales aux périodes nécessaires

### Sécurité

- Seuls les SUPERADMIN et MANAGER peuvent générer des rapports
- Chaque rapport est lié à un utilisateur
- Les rapports sont stockés de façon sécurisée

---

## ✅ Checklist de Validation

- [ ] RAG Service opérationnel (port 5003)
- [ ] Backend Java opérationnel (port 8080)
- [ ] Frontend Angular opérationnel (port 4200)
- [ ] ReportLab installé
- [ ] Table `rapports_metadata` créée
- [ ] Dossier `reports/` créé
- [ ] Connexion avec compte SUPERADMIN/MANAGER
- [ ] Génération d'un rapport PDF test OK
- [ ] Téléchargement automatique OK
- [ ] Liste des rapports affichée
- [ ] Filtres fonctionnels

---

## 📞 Support

Pour toute question ou problème:
1. Consulter les logs du RAG service
2. Consulter les logs du backend Java
3. Vérifier la console du navigateur
4. Tester avec `test_reports.py`

**Logs importants:**
- RAG Service: Console du terminal
- Backend Java: `backend/logs/application.log`
- Frontend: Console navigateur (F12)

---

**Module créé avec ❤️ pour Logiway Platform**
