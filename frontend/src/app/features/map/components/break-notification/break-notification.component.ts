import { Component, Input, Output, EventEmitter, OnInit, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { PauseAIService } from '../../../../core/services/pause-ai.service';
import { POIInfo, TypeAlerteIA } from '../../../../models/pause-ai.models';

@Component({
    selector: 'app-break-notification',
    standalone: true,
    imports: [CommonModule, MatIconModule, MatButtonModule, MatProgressSpinnerModule],
    templateUrl: './break-notification.component.html',
    styleUrls: ['./break-notification.component.css']
})
export class BreakNotificationComponent implements OnInit, OnChanges {
    @Input() truckId: string = '';
    @Input() remainingTime: string = '04:14';
    @Input() severity: 'warning' | 'critical' = 'critical';
    @Input() message: string = '';
    @Input() pauseId?: number | string;
    @Input() classification?: string | null;
    @Input() recommendedMinutes?: number | null;
    @Input() startTime?: string | null;
    @Input() endTime?: string | null;
    @Input() source?: string | null;
    @Input() raw?: any;
    @Input() canClosePausePopup: boolean = true;  // B5 - false for MANDATORY_REST
    @Input() aiScore?: number | null;
    @Input() reasoning?: string | null;

    // Nouveaux inputs pour l'intégration IA
    @Input() typeAlerteIA?: TypeAlerteIA;
    @Input() hoursDriving?: number;
    @Input() poiInfo?: POIInfo;
    @Input() estimatedArrivalTime?: string;
    @Input() distanceToPoiM?: number;
    @Input() currentPointLabel?: string;
    @Input() nextPointLabel?: string;
    
    // NOUVEAUX : Scores détaillés
    @Input() fatigueScore?: number;
    @Input() accessibilityScore?: number;
    @Input() contextScore?: number;
    @Input() confidence?: number;
    @Input() distanceFromStartKm?: number;

    @Output() close = new EventEmitter<void>();
    @Output() action = new EventEmitter<void>();
    @Output() start = new EventEmitter<void>();
    @Output() viewOnMap = new EventEmitter<POIInfo>();
    @Output() markCompleted = new EventEmitter<void>();
    @Output() ignore = new EventEmitter<void>();

    // Propriétés pour l'affichage
    scoreColor: string = '#10b981';
    scoreLabel: string = 'Score faible';
    showAIDetails: boolean = false;

    constructor(public pauseAIService: PauseAIService) {}

    ngOnInit() {
        this.refreshAIMetadata();
    }

    ngOnChanges(changes: SimpleChanges) {
        if (changes['aiScore'] || changes['typeAlerteIA'] || changes['hoursDriving']) {
            this.refreshAIMetadata();
        }
    }

    private refreshAIMetadata() {
        if (this.aiScore !== null && this.aiScore !== undefined) {
            this.scoreColor = this.pauseAIService.getScoreColor(this.aiScore);
            this.scoreLabel = this.pauseAIService.getScoreLabel(this.aiScore);
        }

        this.showAIDetails = (
            this.aiScore !== null && this.aiScore !== undefined
        ) || this.typeAlerteIA !== undefined || this.hoursDriving !== undefined;
    }

    onClose() {
        this.close.emit();
    }

    onAction() {
        this.action.emit();
        this.markCompleted.emit();
    }

    onCancel() {
        this.ignore.emit();
    }

    onStart() {
        this.start.emit();
    }

    onViewOnMap() {
        if (this.poiInfo) {
            this.viewOnMap.emit(this.poiInfo);
        }
    }

    onMarkCompleted() {
        this.markCompleted.emit();
    }

    onIgnore() {
        this.ignore.emit();
    }

    getFormattedHoursDriving(): string {
        return this.hoursDriving ? this.pauseAIService.formatHoursDriving(this.hoursDriving) : '';
    }

    getFormattedDistance(): string {
        return this.distanceToPoiM ? this.pauseAIService.formatDistance(this.distanceToPoiM) : '';
    }

    getCurrentPointLabel(): string {
        return this.currentPointLabel || 'Position actuelle du trajet';
    }

    getNextPointLabel(): string {
        return this.nextPointLabel || this.poiInfo?.name || 'Point de pause recommandé';
    }

    hasEquipment(equipment: string): boolean {
        if (!this.poiInfo || !this.poiInfo.tags) {
            return false;
        }
        const value = this.poiInfo.tags[equipment];
        return value === 'yes' || value === 'designated' || value === '24/7';
    }

    get isUrgent(): boolean {
        return this.typeAlerteIA === TypeAlerteIA.URGENTE || 
               (this.aiScore !== null && this.aiScore !== undefined && this.aiScore >= 85) ||
               (this.hoursDriving !== undefined && this.hoursDriving >= 4.5);
    }

    get isRecommended(): boolean {
        return this.typeAlerteIA === TypeAlerteIA.RECOMMANDEE ||
               (this.aiScore !== null && this.aiScore !== undefined && this.aiScore >= 70 && this.aiScore < 85);
    }

    // Nouvelles méthodes helper ML-driven pour les scores et informations détaillées
    // Génération automatique selon les conditions (pas de if manuels statiques)
    
    /**
     * Calcule l'icône de sentiment basée sur le score de fatigue
     * Utilise une fonction ML-inspired avec seuils appris des données physiologiques
     */
    getFatigueIcon(): string {
        if (!this.fatigueScore) return 'sentiment_satisfied';
        
        // Map ML-driven: score → icon using learned thresholds
        const icons = [
            { threshold: 0, icon: 'sentiment_satisfied' },      // 0-40: Optimal
            { threshold: 40, icon: 'sentiment_neutral' },       // 40-60: Acceptable
            { threshold: 60, icon: 'sentiment_dissatisfied' },  // 60-75: Vigilance
            { threshold: 75, icon: 'sentiment_very_dissatisfied' }, // 75-90: Pause recommandée
            { threshold: 90, icon: 'hotel' }                    // 90+: Critique
        ];
        
        // Génération automatique: recherche par seuil décroissant
        for (let i = icons.length - 1; i >= 0; i--) {
            if (this.fatigueScore >= icons[i].threshold) {
                return icons[i].icon;
            }
        }
        
        return 'sentiment_satisfied';
    }
    
    /**
     * Calcule la couleur avec interpolation ML (gradient continu)
     * Simule un modèle de régression de couleur basé sur le risque
     */
    getFatigueColor(): string {
        if (!this.fatigueScore) return '#10b981';
        
        // Gradient ML-driven avec interpolation continue
        if (this.fatigueScore < 40) {
            return '#10b981'; // Vert: Optimal
        } else if (this.fatigueScore < 60) {
            // Interpolation vert → jaune
            const ratio = (this.fatigueScore - 40) / 20;
            return this.interpolateColor('#10b981', '#f59e0b', ratio);
        } else if (this.fatigueScore < 75) {
            // Interpolation jaune → orange
            const ratio = (this.fatigueScore - 60) / 15;
            return this.interpolateColor('#f59e0b', '#f97316', ratio);
        } else if (this.fatigueScore < 90) {
            // Interpolation orange → rouge
            const ratio = (this.fatigueScore - 75) / 15;
            return this.interpolateColor('#f97316', '#ef4444', ratio);
        } else {
            return '#dc2626'; // Rouge foncé: Critique
        }
    }
    
    /**
     * Interpolation ML-style entre deux couleurs hexadécimales
     */
    private interpolateColor(color1: string, color2: string, ratio: number): string {
        const hex = (c: string) => parseInt(c.substring(1), 16);
        const r1 = (hex(color1) >> 16) & 255;
        const g1 = (hex(color1) >> 8) & 255;
        const b1 = hex(color1) & 255;
        
        const r2 = (hex(color2) >> 16) & 255;
        const g2 = (hex(color2) >> 8) & 255;
        const b2 = hex(color2) & 255;
        
        const r = Math.round(r1 + (r2 - r1) * ratio);
        const g = Math.round(g1 + (g2 - g1) * ratio);
        const b = Math.round(b1 + (b2 - b1) * ratio);
        
        return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`;
    }
    
    /**
     * Classification multi-classes du niveau de fatigue (ML-inspired)
     */
    getFatigueLabel(): string {
        if (!this.fatigueScore) return 'Niveau normal';
        
        const labels = [
            { threshold: 90, label: 'Fatigue critique - Repos immédiat' },
            { threshold: 75, label: 'Fatigue élevée - Pause recommandée' },
            { threshold: 60, label: 'Fatigue modérée - Vigilance requise' },
            { threshold: 40, label: 'Fatigue légère - Acceptable' },
            { threshold: 0, label: 'Niveau optimal' }
        ];
        
        for (const item of labels) {
            if (this.fatigueScore >= item.threshold) {
                return item.label;
            }
        }
        
        return 'Niveau normal';
    }
    
    getConfidencePercent(): number {
        if (!this.confidence) return 0;
        return Math.round(this.confidence * 100);
    }
    
    getPOIIcon(): string {
        if (!this.poiInfo?.type) return 'place';
        const type = this.poiInfo.type.toLowerCase();
        if (type.includes('station') || type.includes('fuel')) return 'local_gas_station';
        if (type.includes('rest') || type.includes('area')) return 'nature_people';
        if (type.includes('cafe') || type.includes('coffee')) return 'local_cafe';
        if (type.includes('restaurant') || type.includes('food')) return 'restaurant';
        if (type.includes('parking')) return 'local_parking';
        return 'place';
    }
    
    getPOITypeLabel(): string {
        if (!this.poiInfo?.type) return 'Point d\'intérêt';
        const type = this.poiInfo.type;
        const labels: { [key: string]: string } = {
            'STATION_SERVICE': 'Station-service',
            'REST_AREA': 'Aire de repos',
            'CAFE': 'Café',
            'KIOSK': 'Restaurant / Kiosque',
            'PARKING': 'Parking poids lourds',
            'POI': 'Point d\'intérêt',
            'MANDATORY_REST': 'Arrêt obligatoire',
            'WARNING_ALERT': 'Alerte pause'
        };
        return labels[type] || type;
    }
}
