# Intégration Frontend Angular - Pause IA

## Vue d'ensemble

Cette documentation couvre l'intégration complète du système d'alertes IA de pauses réglementaires dans le frontend Angular. Le système enrichit le composant existant `BreakNotificationComponent` et ajoute un dashboard analytique complet.

## Architecture Frontend

```
SSE Event PAUSE_AI_ALERT
    ↓
PauseAIService (publish alert)
    ↓
BreakNotificationComponent (enrichi)
    ↓ Actions utilisateur
Backend API (marquer effectuée, ignorer)
```

## Fichiers Créés

### 1. Modèles TypeScript

**`frontend/src/app/models/pause-ai.models.ts`**

Définit tous les types TypeScript pour l'intégration IA :
- `TypeAlerteIA` - Enum (AUCUNE, RECOMMANDEE, URGENTE)
- `PauseAIPrediction` - Prédiction IA complète
- `PauseAIEvaluationRequest` - Requête d'évaluation manuelle
- `POIInfo` - Informations sur un point d'intérêt
- `PauseAIAlertEvent` - Événement SSE d'alerte
- `ChauffeurStats` - Statistiques par chauffeur
- `HeatmapPoint` - Point sur la carte de chaleur
- `PauseAIDashboard` - Données complètes du dashboard
- `PauseAIFilterOptions` - Options de filtrage

### 2. Service Angular

**`frontend/src/app/core/services/pause-ai.service.ts`**

Service principal pour :
- Communication HTTP avec l'API backend
- Gestion des alertes IA via Observable (`alert$`)
- Méthodes utilitaires :
  - `evaluerPause()` - Évaluation manuelle
  - `getHistoriquePredictions()` - Historique trajet
  - `getDashboardStats()` - Statistiques dashboard
  - `publishAlert()` - Publication d'alerte depuis SSE
  - `getScoreColor()` - Couleur selon score
  - `getScoreLabel()` - Label selon score
  - `formatHoursDriving()` - Formatage temps conduite
  - `formatDistance()` - Formatage distance

### 3. Composant Enrichi

**`frontend/src/app/features/map/components/break-notification/break-notification.component.ts`** (modifié)

Améliorations :
- **Nouveaux @Input** :
  - `typeAlerteIA` - Type d'alerte IA
  - `hoursDriving` - Temps de conduite
  - `poiInfo` - Informations POI
  - `estimatedArrivalTime` - Heure d'arrivée estimée
  - `distanceToPoiM` - Distance au POI

- **Nouveaux @Output** :
  - `viewOnMap` - Voir POI sur carte
  - `markCompleted` - Marquer pause effectuée
  - `ignore` - Ignorer alerte (15 min)

- **Propriétés calculées** :
  - `isUrgent` - Alerte urgente si score ≥ 85 ou hours_driving ≥ 4.5h
  - `isRecommended` - Alerte recommandée si score ≥ 70

- **Méthodes** :
  - `getFormattedHoursDriving()` - Format HhMM
  - `getFormattedDistance()` - Format m ou km
  - `hasEquipment()` - Vérifier équipement POI

**`frontend/src/app/features/map/components/break-notification/break-notification.component.html`** (modifié)

Nouveau template avec :
- **Jauge circulaire de score IA** (0-100)
  - Couleur dynamique (vert/orange/rouge)
  - Label de criticité

- **Informations POI enrichies** :
  - Nom du lieu
  - Distance en mètres/km
  - Heure d'arrivée estimée
  - Équipements disponibles (icônes)

- **Raisonnement IA** :
  - Explication textuelle du score

- **Actions enrichies** :
  - "Marquer comme effectuée"
  - "Voir sur la carte"
  - "Ignorer (15 min)" - uniquement si score < 85

- **Deux modes d'affichage** :
  - **Popup non bloquante** (score 70-85) - bas-droite, fond orange
  - **Popup bloquante** (score ≥ 85) - centrée, fond rouge, pas de bouton ignorer

**`frontend/src/app/features/map/components/break-notification/break-notification.component.css`** (enrichi)

Nouveaux styles :
- `.ai-score-section` - Section score IA
- `.score-gauge-container` - Conteneur jauge
- `.score-gauge` - Jauge circulaire avec mat-progress-spinner
- `.poi-details` - Détails POI
- `.poi-amenities` - Badges équipements
- `.ai-reasoning` - Raisonnement IA
- `.ai-actions` - Boutons d'action enrichis
- Positionnement conditionnel (bas-droite vs centré)
- Animations d'entrée (slideInRight, fadeInCenter)

### 4. Dashboard Analytique

**`frontend/src/app/features/pause-analytics/pause-analytics-dashboard.component.ts`**

Composant standalone complet avec :
- **Gestion des filtres** :
  - Période (aujourd'hui, semaine, mois, personnalisé)
  - Chauffeur (optionnel)
  - Type d'alerte
  - Statut (effectuées/ignorées)

- **Chargement des données** :
  - Appel API `getDashboardStats()`
  - Gestion du loading state
  - Gestion des erreurs

- **Méthodes** :
  - `onPeriodChange()` - Changement période
  - `loadDashboard()` - Rechargement données
  - `getFilteredHeatmapPoints()` - Filtrage points carte
  - `getHeatmapColor()` - Couleur selon type
  - `getScoreColor()` - Couleur selon score
  - `getConformiteColor()` - Couleur taux conformité
  - `exportToCSV()` - Export statistiques CSV
  - `onChauffeurClick()` - Clic sur chauffeur

**`frontend/src/app/features/pause-analytics/pause-analytics-dashboard.component.html`**

Template avec 4 sections :

1. **Vue Globale** - 5 cartes statistiques :
   - Total pauses recommandées
   - Pauses effectuées
   - Pauses ignorées
   - Taux de conformité (%)
   - Score moyen de fatigue

2. **Analyse par Chauffeur** - Tableau Material :
   - Nom chauffeur
   - Nombre missions
   - Score fatigue moyen (badge coloré)
   - Alertes urgentes (badge rouge)
   - Pauses ignorées (badge orange)
   - Taux conformité (barre de progression)
   - Lignes cliquables pour détail

3. **Carte de Chaleur** - Liste de points :
   - Filtrage par type
   - Légende colorée
   - Liste scrollable de points
   - Icône et couleur selon type
   - Coordonnées GPS
   - Score associé

4. **Note d'intégration Leaflet** :
   - Message informatif pour future intégration carte interactive

**`frontend/src/app/features/pause-analytics/pause-analytics-dashboard.component.css`**

Styles professionnels :
- Layout responsive (grid)
- Cartes avec hover effect
- Tableau Material stylisé
- Badges colorés
- Barres de progression
- Points de chaleur avec icônes
- Empty states
- Loading spinner
- Media queries mobile

## Intégration avec le Flux SSE Existant

### Modification du Service SSE

Le service de gestion SSE existant doit être modifié pour gérer le nouvel événement `PAUSE_AI_ALERT`.

**Exemple d'intégration dans le service de notification temps réel :**

```typescript
// Dans votre service SSE existant (ex: notification-realtime.service.ts)
import { PauseAIService } from './pause-ai.service';
import { PauseAIAlertEvent } from '../../models/pause-ai.models';

constructor(
  private pauseAIService: PauseAIService,
  // ... autres dépendances
) {}

private handleSSEEvent(event: any) {
  switch(event.eventType) {
    case 'PAUSE_AI_ALERT':
      const alertData: PauseAIAlertEvent = event.data;
      this.pauseAIService.publishAlert(alertData);
      break;
    // ... autres événements
  }
}
```

### Utilisation dans un Composant de Carte

**Exemple d'écoute des alertes dans un composant de carte :**

```typescript
import { PauseAIService } from '../../../core/services/pause-ai.service';
import { PauseAIAlertEvent, TypeAlerteIA } from '../../../models/pause-ai.models';

export class MapComponent implements OnInit, OnDestroy {
  private alertSubscription?: Subscription;
  showBreakNotification = false;
  breakNotificationData: any = {};

  constructor(private pauseAIService: PauseAIService) {}

  ngOnInit() {
    // Écouter les alertes IA
    this.alertSubscription = this.pauseAIService.alert$.subscribe(alert => {
      if (alert) {
        this.handlePauseAIAlert(alert);
      }
    });
  }

  ngOnDestroy() {
    this.alertSubscription?.unsubscribe();
  }

  handlePauseAIAlert(alert: PauseAIAlertEvent) {
    console.log('[Map] Alerte IA reçue:', alert);

    this.breakNotificationData = {
      truckId: `Trajet #${alert.trajetId}`,
      message: this.getAlertMessage(alert),
      severity: alert.typeAlerte === TypeAlerteIA.URGENTE ? 'critical' : 'warning',
      canClosePausePopup: alert.typeAlerte !== TypeAlerteIA.URGENTE,
      
      // Données IA enrichies
      aiScore: alert.score,
      typeAlerteIA: alert.typeAlerte,
      hoursDriving: alert.hoursDriving,
      poiInfo: alert.poi,
      distanceToPoiM: alert.poi.distance,
      
      reasoning: this.getReasoningText(alert)
    };

    this.showBreakNotification = true;
  }

  getAlertMessage(alert: PauseAIAlertEvent): string {
    if (alert.typeAlerte === TypeAlerteIA.URGENTE) {
      return `Pause obligatoire - Limite réglementaire atteinte. 
              Arrêtez-vous au prochain point de repos.`;
    } else {
      return `Pause recommandée - Score de fatigue élevé. 
              Un arrêt est suggéré dans ${this.formatDistance(alert.poi.distance)}.`;
    }
  }

  getReasoningText(alert: PauseAIAlertEvent): string {
    const hours = Math.floor(alert.hoursDriving);
    const minutes = Math.round((alert.hoursDriving - hours) * 60);
    return `Après ${hours}h${minutes}min de conduite, le modèle IA recommande une pause.`;
  }

  onMarkCompleted() {
    // Appel à l'API pour marquer la pause comme effectuée
    // PUT /api/trajets/{id}/pauses/{pauseId}/statut
    console.log('[Map] Pause marquée comme effectuée');
    this.showBreakNotification = false;
  }

  onViewOnMap(poi: any) {
    // Centrer la carte sur le POI
    console.log('[Map] Centrer sur POI:', poi);
    this.centerMapOnPOI(poi.lat, poi.lon);
  }

  onIgnore() {
    // Snooze 15 minutes - programmer une nouvelle vérification
    console.log('[Map] Alerte ignorée - snooze 15 min');
    this.showBreakNotification = false;
  }
}
```

**Template du composant de carte :**

```html
<!-- Dans votre map.component.html -->
<app-break-notification
  *ngIf="showBreakNotification"
  [truckId]="breakNotificationData.truckId"
  [message]="breakNotificationData.message"
  [severity]="breakNotificationData.severity"
  [canClosePausePopup]="breakNotificationData.canClosePausePopup"
  [aiScore]="breakNotificationData.aiScore"
  [typeAlerteIA]="breakNotificationData.typeAlerteIA"
  [hoursDriving]="breakNotificationData.hoursDriving"
  [poiInfo]="breakNotificationData.poiInfo"
  [distanceToPoiM]="breakNotificationData.distanceToPoiM"
  [reasoning]="breakNotificationData.reasoning"
  (close)="showBreakNotification = false"
  (markCompleted)="onMarkCompleted()"
  (viewOnMap)="onViewOnMap($event)"
  (ignore)="onIgnore()">
</app-break-notification>
```

## Ajout de la Route Dashboard

**Dans `app.routes.ts` :**

```typescript
import { PauseAnalyticsDashboardComponent } from './features/pause-analytics/pause-analytics-dashboard.component';

export const routes: Routes = [
  // ... autres routes
  {
    path: 'analytics/pauses',
    component: PauseAnalyticsDashboardComponent,
    canActivate: [AuthGuard],
    data: { roles: ['MANAGER', 'SUPERADMIN'] }
  }
];
```

## Configuration Environment

**`frontend/src/environments/environment.ts` :**

```typescript
export const environment = {
  production: false,
  apiUrl: 'http://localhost:8080/api',
  // ... autres configs
};
```

## Dépendances Angular Material

Le projet utilise les modules Material suivants (déjà présents normalement) :
- `MatCardModule`
- `MatButtonModule`
- `MatIconModule`
- `MatSelectModule`
- `MatDatepickerModule`
- `MatInputModule`
- `MatTableModule`
- `MatProgressSpinnerModule`
- `MatNativeDateModule`
- `MatTooltipModule`
- `MatButtonToggleModule`

## Tests

### Test du Service

```typescript
import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { PauseAIService } from './pause-ai.service';

describe('PauseAIService', () => {
  let service: PauseAIService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [PauseAIService]
    });
    service = TestBed.inject(PauseAIService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should get score color correctly', () => {
    expect(service.getScoreColor(90)).toBe('#ef4444'); // Rouge
    expect(service.getScoreColor(75)).toBe('#f59e0b'); // Orange
    expect(service.getScoreColor(60)).toBe('#10b981'); // Vert
  });

  it('should format hours correctly', () => {
    expect(service.formatHoursDriving(3.5)).toBe('3h30');
    expect(service.formatHoursDriving(4.75)).toBe('4h45');
  });

  it('should format distance correctly', () => {
    expect(service.formatDistance(500)).toBe('500 m');
    expect(service.formatDistance(1500)).toBe('1.5 km');
  });
});
```

### Test du Composant Dashboard

```typescript
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { PauseAnalyticsDashboardComponent } from './pause-analytics-dashboard.component';

describe('PauseAnalyticsDashboardComponent', () => {
  let component: PauseAnalyticsDashboardComponent;
  let fixture: ComponentFixture<PauseAnalyticsDashboardComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        PauseAnalyticsDashboardComponent,
        HttpClientTestingModule,
        NoopAnimationsModule
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(PauseAnalyticsDashboardComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize with default filters', () => {
    expect(component.filters.startDate).toBeDefined();
    expect(component.filters.endDate).toBeDefined();
    expect(component.selectedPeriod).toBe('week');
  });

  it('should change period correctly', () => {
    component.onPeriodChange('today');
    expect(component.selectedPeriod).toBe('today');
    // Vérifier que les dates sont ajustées
  });
});
```

## Checklist d'Intégration

### Backend ✅
- [x] Entités JPA créées
- [x] Repositories créés
- [x] Services implémentés
- [x] Contrôleurs REST créés
- [x] Scheduler configuré
- [x] Migration SQL créée
- [x] Configuration application.yml

### Frontend ✅
- [x] Modèles TypeScript créés
- [x] Service Angular créé
- [x] Composant BreakNotification enrichi
- [x] Dashboard analytique créé
- [x] Styles CSS ajoutés

### À Faire ⏳
- [ ] Intégrer l'écoute SSE dans le service de notifications
- [ ] Ajouter la route du dashboard dans app.routes.ts
- [ ] Connecter le composant de carte avec le service PauseAI
- [ ] Implémenter l'appel API pour marquer pause effectuée
- [ ] Implémenter la logique de snooze (15 min)
- [ ] Ajouter l'intégration Leaflet pour la carte de chaleur interactive
- [ ] Implémenter la vue détail chauffeur (timeline)
- [ ] Ajouter des tests unitaires
- [ ] Ajouter des tests E2E

## Améliorations Futures

1. **Graphiques interactifs** :
   - Intégrer Chart.js ou ngx-charts
   - Graphique évolution score dans le temps
   - Graphique en barres pauses par chauffeur

2. **Carte Leaflet interactive** :
   - Remplacer la liste de points par une vraie carte
   - Markers cliquables
   - Clustering des points proches
   - Overlay itinéraire

3. **Timeline détaillée chauffeur** :
   - Modal ou page dédiée
   - Historique complet des prédictions
   - Graphique score dans le temps
   - Événements (pause effectuée, ignorée)

4. **Notifications push** :
   - Service Worker
   - Notifications navigateur
   - Notifications mobiles (si PWA)

5. **Mode offline** :
   - Cache des données dashboard
   - Synchronisation différée

6. **Export avancé** :
   - Export PDF avec graphiques
   - Export Excel avec plusieurs feuilles
   - Envoi par email programmé

7. **Filtres avancés** :
   - Par secteur
   - Par type de véhicule
   - Par itinéraire
   - Plages horaires

## Support et Maintenance

Pour toute question :
- Consulter `INTEGRATION_PAUSE_IA.md` pour le backend
- Consulter ce fichier pour le frontend
- Vérifier les types dans `pause-ai.models.ts`
- Examiner les logs console du navigateur
- Utiliser les Dev Tools d'Angular

## Conclusion

L'intégration frontend est complète et prête à être connectée au backend. Les composants sont modulaires, réutilisables et suivent les bonnes pratiques Angular. Le système est extensible et peut facilement accueillir de nouvelles fonctionnalités.
