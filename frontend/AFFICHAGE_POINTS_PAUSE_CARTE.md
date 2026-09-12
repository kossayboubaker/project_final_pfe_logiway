# 📍 Affichage des Points de Pause sur la Carte Leaflet

## Vue d'ensemble

Ce guide explique comment afficher les points de pause prédits par l'IA sur votre carte Leaflet existante.

## Prérequis

- Carte Leaflet déjà initialisée dans votre composant Map
- Service PauseAI disponible
- Material Icons chargé

## Étape 1 : Ajouter le Service et les Imports

Dans votre composant de carte (ex: `map.component.ts` ou `trips-map.component.ts`) :

```typescript
import { PauseAIService } from '../../core/services/pause-ai.service';
import { PauseAIPrediction } from '../../models/pause-ai.models';
import * as L from 'leaflet';

export class MapComponent implements OnInit {
  private map!: L.Map;
  private pauseMarkers: L.Marker[] = [];
  
  constructor(
    private pauseAIService: PauseAIService,
    // ... autres services
  ) {}
}
```

## Étape 2 : Charger et Afficher les Points de Pause

```typescript
loadPausePoints(trajetId: number) {
  console.log('[Map] 🔄 Chargement des points de pause pour trajet:', trajetId);
  
  // Nettoyer les markers existants
  this.clearPauseMarkers();
  
  // Charger l'historique des prédictions
  this.pauseAIService.getHistoriquePredictions(trajetId).subscribe({
    next: (predictions) => {
      console.log('[Map] ✅ Points de pause reçus:', predictions.length);
      
      predictions.forEach((pred, index) => {
        if (pred.latitudePoi && pred.longitudePoi && pred.alerteDeclenchee) {
          console.log(`[Map] 📍 Ajout marker ${index + 1}:`, {
            nom: pred.nomPoi,
            score: pred.score,
            coords: [pred.latitudePoi, pred.longitudePoi]
          });
          
          this.addPauseMarker(pred);
        }
      });
      
      // Ajuster la vue de la carte pour voir tous les markers
      if (this.pauseMarkers.length > 0) {
        const group = L.featureGroup(this.pauseMarkers);
        this.map.fitBounds(group.getBounds().pad(0.1));
      }
    },
    error: (error) => {
      console.error('[Map] ❌ Erreur chargement points pause:', error);
    }
  });
}

clearPauseMarkers() {
  this.pauseMarkers.forEach(marker => this.map.removeLayer(marker));
  this.pauseMarkers = [];
}
```

## Étape 3 : Créer les Markers Personnalisés

```typescript
addPauseMarker(prediction: PauseAIPrediction) {
  // Déterminer la couleur selon le score
  const color = this.getPauseMarkerColor(prediction.score);
  const icon = this.getPauseMarkerIcon(prediction.poiType || '');
  const iconColor = this.getPOIIconColor(prediction.poiType || '');
  
  // Créer un marker HTML personnalisé
  const customIcon = L.divIcon({
    className: 'pause-ai-marker',
    html: `
      <div class="pause-marker-container">
        <!-- Cercle de statut principal -->
        <div class="pause-marker-status" style="background-color: ${color}">
          <i class="material-icons">${this.getStatusIcon(prediction.typeAlerte)}</i>
        </div>
        
        <!-- Badge POI en bas à droite -->
        <div class="pause-marker-poi-badge" style="background-color: ${iconColor}">
          <i class="material-icons">${icon}</i>
        </div>
        
        <!-- Score en bas -->
        <div class="pause-marker-score">${prediction.score}</div>
      </div>
    `,
    iconSize: [50, 65],
    iconAnchor: [25, 65],
    popupAnchor: [0, -65]
  });
  
  // Créer le marker
  const marker = L.marker(
    [prediction.latitudePoi!, prediction.longitudePoi!],
    { 
      icon: customIcon,
      title: prediction.nomPoi || 'Point de pause'
    }
  );
  
  // Ajouter la popup
  marker.bindPopup(this.createPausePopupContent(prediction), {
    maxWidth: 300,
    className: 'pause-ai-popup'
  });
  
  // Ajouter à la carte
  marker.addTo(this.map);
  this.pauseMarkers.push(marker);
}
```

## Étape 4 : Méthodes Utilitaires

```typescript
getPauseMarkerColor(score: number): string {
  if (score >= 85) return '#ef4444'; // Rouge - Urgent
  if (score >= 70) return '#f59e0b'; // Orange - Recommandé
  return '#10b981'; // Vert - OK
}

getStatusIcon(typeAlerte?: string): string {
  switch (typeAlerte) {
    case 'URGENTE': return 'error';
    case 'RECOMMANDEE': return 'warning';
    default: return 'info';
  }
}

getPauseMarkerIcon(poiType: string): string {
  const type = poiType.toLowerCase();
  
  if (type.includes('fuel') || type.includes('station')) {
    return 'local_gas_station';
  }
  if (type.includes('restaurant') || type.includes('resto')) {
    return 'restaurant';
  }
  if (type.includes('rest') || type.includes('aire')) {
    return 'local_parking';
  }
  if (type.includes('service')) {
    return 'store';
  }
  return 'place';
}

getPOIIconColor(poiType: string): string {
  const icon = this.getPauseMarkerIcon(poiType);
  
  switch (icon) {
    case 'local_gas_station': return '#ef4444';
    case 'restaurant': return '#f59e0b';
    case 'local_parking': return '#3b82f6';
    case 'store': return '#8b5cf6';
    default: return '#6b7280';
  }
}

createPausePopupContent(prediction: PauseAIPrediction): string {
  const typeLabel = this.getTypeLabel(prediction.typeAlerte);
  const scoreColor = this.getPauseMarkerColor(prediction.score);
  
  return `
    <div class="pause-popup-content">
      <div class="pause-popup-header">
        <h4>${prediction.nomPoi || 'Point de pause'}</h4>
        <span class="pause-type-badge" style="background-color: ${scoreColor}">
          ${typeLabel}
        </span>
      </div>
      
      <div class="pause-popup-body">
        <div class="pause-popup-row">
          <i class="material-icons">psychology</i>
          <span>Score IA: <strong>${prediction.score}/100</strong></span>
        </div>
        
        <div class="pause-popup-row">
          <i class="material-icons">schedule</i>
          <span>Temps conduite: <strong>${prediction.hoursDriving.toFixed(1)}h</strong></span>
        </div>
        
        ${prediction.poiType ? `
          <div class="pause-popup-row">
            <i class="material-icons">${this.getPauseMarkerIcon(prediction.poiType)}</i>
            <span>Type: <strong>${prediction.poiType}</strong></span>
          </div>
        ` : ''}
        
        ${prediction.distancePoiM ? `
          <div class="pause-popup-row">
            <i class="material-icons">directions</i>
            <span>Distance: <strong>${this.formatDistance(prediction.distancePoiM)}</strong></span>
          </div>
        ` : ''}
        
        <div class="pause-popup-row">
          <i class="material-icons">access_time</i>
          <span>${new Date(prediction.timestamp).toLocaleString('fr-FR')}</span>
        </div>
      </div>
    </div>
  `;
}

getTypeLabel(typeAlerte?: string): string {
  switch (typeAlerte) {
    case 'URGENTE': return 'Urgent';
    case 'RECOMMANDEE': return 'Recommandé';
    default: return 'Info';
  }
}

formatDistance(meters: number): string {
  if (meters >= 1000) {
    return `${(meters / 1000).toFixed(1)} km`;
  }
  return `${Math.round(meters)} m`;
}
```

## Étape 5 : Ajouter les Styles CSS

Dans votre fichier CSS du composant :

```css
/* Marker de pause IA */
.pause-ai-marker {
  background: transparent;
  border: none;
}

.pause-marker-container {
  position: relative;
  width: 50px;
  height: 65px;
}

.pause-marker-status {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.3);
  border: 3px solid white;
  position: absolute;
  top: 0;
  left: 1px;
}

.pause-marker-status i {
  font-size: 24px;
}

.pause-marker-poi-badge {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  border: 2px solid white;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
  position: absolute;
  bottom: 12px;
  right: 0;
}

.pause-marker-poi-badge i {
  font-size: 14px;
}

.pause-marker-score {
  position: absolute;
  bottom: 0;
  left: 50%;
  transform: translateX(-50%);
  background: white;
  padding: 2px 8px;
  border-radius: 12px;
  font-size: 11px;
  font-weight: bold;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
  color: #374151;
}

/* Popup de pause */
.pause-ai-popup .leaflet-popup-content {
  margin: 0;
  padding: 0;
}

.pause-popup-content {
  min-width: 250px;
  max-width: 300px;
}

.pause-popup-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
}

.pause-popup-header h4 {
  margin: 0;
  font-size: 14px;
  font-weight: 600;
  flex: 1;
}

.pause-type-badge {
  padding: 4px 8px;
  border-radius: 12px;
  font-size: 11px;
  font-weight: bold;
  color: white;
}

.pause-popup-body {
  padding: 12px;
}

.pause-popup-row {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
  font-size: 13px;
  color: #374151;
}

.pause-popup-row:last-child {
  margin-bottom: 0;
}

.pause-popup-row i {
  font-size: 18px;
  color: #6b7280;
}

.pause-popup-row strong {
  color: #1f2937;
}
```

## Étape 6 : Appeler lors du Chargement d'un Trajet

Dans votre composant de carte, après avoir chargé un trajet :

```typescript
onTrajetSelected(trajet: any) {
  console.log('[Map] Trajet sélectionné:', trajet.id);
  
  // 1. Afficher l'itinéraire (code existant)
  this.displayRoute(trajet);
  
  // 2. Charger et afficher les points de pause IA
  this.loadPausePoints(trajet.id);
}
```

## Étape 7 : Activer/Désactiver l'Affichage (Optionnel)

Ajouter un toggle dans votre interface :

```typescript
// Dans le composant
showPausePoints = true;

togglePausePoints() {
  this.showPausePoints = !this.showPausePoints;
  
  if (this.showPausePoints) {
    this.loadPausePoints(this.currentTrajetId);
  } else {
    this.clearPauseMarkers();
  }
}
```

```html
<!-- Dans le template -->
<button mat-icon-button (click)="togglePausePoints()" 
        [color]="showPausePoints ? 'primary' : 'basic'"
        matTooltip="Afficher/Masquer les points de pause IA">
  <mat-icon>psychology</mat-icon>
</button>
```

## Exemple Complet d'Intégration

```typescript
export class TripsMapComponent implements OnInit {
  private map!: L.Map;
  private pauseMarkers: L.Marker[] = [];
  showPausePoints = true;
  currentTrajetId?: number;

  constructor(
    private pauseAIService: PauseAIService,
    // ... autres services
  ) {}

  ngOnInit() {
    this.initMap();
  }

  onTrajetLoaded(trajet: any) {
    this.currentTrajetId = trajet.id;
    
    // Afficher l'itinéraire
    this.displayRoute(trajet);
    
    // Charger les points de pause
    if (this.showPausePoints) {
      this.loadPausePoints(trajet.id);
    }
  }

  loadPausePoints(trajetId: number) {
    console.log('[Map] 🔄 Chargement points de pause pour trajet:', trajetId);
    
    this.clearPauseMarkers();
    
    this.pauseAIService.getHistoriquePredictions(trajetId).subscribe({
      next: (predictions) => {
        console.log('[Map] ✅ Points reçus:', predictions.length);
        
        const alertes = predictions.filter(p => 
          p.alerteDeclenchee && 
          p.latitudePoi && 
          p.longitudePoi
        );
        
        console.log('[Map] 📍 Alertes à afficher:', alertes.length);
        
        alertes.forEach(pred => this.addPauseMarker(pred));
        
        if (this.pauseMarkers.length > 0) {
          const group = L.featureGroup(this.pauseMarkers);
          this.map.fitBounds(group.getBounds().pad(0.1));
        }
      },
      error: (error) => {
        console.error('[Map] ❌ Erreur:', error);
      }
    });
  }

  addPauseMarker(prediction: PauseAIPrediction) {
    // ... (code complet ci-dessus)
  }

  clearPauseMarkers() {
    this.pauseMarkers.forEach(marker => this.map.removeLayer(marker));
    this.pauseMarkers = [];
    console.log('[Map] 🧹 Markers de pause supprimés');
  }
}
```

## Vérification

Pour vérifier que tout fonctionne :

1. **Ouvrez la console** (F12)
2. **Chargez un trajet** sur la carte
3. **Vérifiez les logs** :
   ```
   [Map] 🔄 Chargement points de pause pour trajet: 42
   [Map] ✅ Points reçus: 5
   [Map] 📍 Alertes à afficher: 3
   [Map] 📍 Ajout marker 1: { nom: "...", score: 75, coords: [...] }
   ```
4. **Vérifiez visuellement** : Les markers doivent apparaître sur la carte
5. **Cliquez sur un marker** : La popup doit s'afficher avec les détails

## Troubleshooting

### Les markers n'apparaissent pas

**Vérifiez dans la console** :
- Y a-t-il des prédictions retournées ?
- Les coordonnées GPS sont-elles présentes ?
- `alerteDeclenchee` est-il `true` ?

**Solution** : Filtrer correctement les prédictions

### Les icônes Material ne s'affichent pas

**Vérifiez dans `index.html`** :
```html
<link href="https://fonts.googleapis.com/icon?family=Material+Icons" rel="stylesheet">
```

### Les markers sont mal positionnés

**Vérifiez** :
- L'ordre des coordonnées : Leaflet utilise `[lat, lon]`
- Les valeurs ne sont pas null ou undefined

## Résumé

✅ Service PauseAI intégré
✅ Markers personnalisés avec double icône
✅ Popups détaillées
✅ Couleurs selon le score
✅ Logs de debugging
✅ Toggle d'affichage optionnel

Les points de pause IA sont maintenant visibles sur votre carte Leaflet ! 🎉
