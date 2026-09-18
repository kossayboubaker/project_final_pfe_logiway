import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, BehaviorSubject, Subject } from 'rxjs';
import { tap } from 'rxjs/operators';
import {
  PauseAIPrediction,
  PauseAIEvaluationRequest,
  PauseAIDashboard,
  PauseAIFilterOptions,
  PauseAIAlertEvent,
  PauseReglementaireResponse,
  PauseStatusUpdateEvent
} from '../../models/pause-ai.models';
import { AppConfigService } from './app-config.service';

@Injectable({
  providedIn: 'root'
})
export class PauseAIService {
  private get apiUrl(): string { return `${this.appConfig.apiUrl}/pauseai`; }
  private get tripsApiUrl(): string { return `${this.appConfig.apiUrl}/trajets`; }
  
  // Subject pour notifier les composants des nouvelles alertes IA
  private alertSubject = new BehaviorSubject<PauseAIAlertEvent | null>(null);
  public alert$ = this.alertSubject.asObservable();
  private pauseStatusSubject = new Subject<PauseStatusUpdateEvent>();
  public pauseStatus$ = this.pauseStatusSubject.asObservable();
  private pauseGeneratedSubject = new Subject<number>();
  public pauseGenerated$ = this.pauseGeneratedSubject.asObservable();
  private realtimeSource?: EventSource;
  private realtimeReconnectTimer?: number;

  constructor(private http: HttpClient, private appConfig: AppConfigService) {}

  connectRealtime(): void {
    if (this.realtimeSource || typeof EventSource === 'undefined') {
      return;
    }

    console.log('[PauseAIService] Connexion au flux SSE Pause AI');
    this.realtimeSource = new EventSource(`${this.appConfig.apiUrl}/notifications/stream`, { withCredentials: true });

    this.realtimeSource.addEventListener('PAUSE_AI_ALERT', (event: MessageEvent) => {
      try {
        const payload = JSON.parse(event.data) as PauseAIAlertEvent;
        console.log('[PauseAIService] Alerte IA reçue:', payload);
        this.publishAlert(payload);
      } catch (error) {
        console.error('[PauseAIService] Impossible de parser PAUSE_AI_ALERT', error, event.data);
      }
    });

    this.realtimeSource.addEventListener('PAUSE_STATUS_UPDATED', (event: MessageEvent) => {
      try {
        const payload = JSON.parse(event.data) as PauseStatusUpdateEvent;
        console.log('[PauseAIService] Statut de pause mis à jour:', payload);
        this.pauseStatusSubject.next(payload);
      } catch (error) {
        console.error('[PauseAIService] Impossible de parser PAUSE_STATUS_UPDATED', error, event.data);
      }
    });

    this.realtimeSource.addEventListener('PAUSES_GENEREES', (event: MessageEvent) => {
      try {
        const trajetId = Number(event.data);
        if (!Number.isNaN(trajetId)) {
          console.log('[PauseAIService] Pauses générées pour trajet:', trajetId);
          this.pauseGeneratedSubject.next(trajetId);
        }
      } catch (error) {
        console.error('[PauseAIService] Impossible de parser PAUSES_GENEREES', error, event.data);
      }
    });

    this.realtimeSource.onerror = () => {
      console.warn('[PauseAIService] Flux SSE indisponible, reconnexion dans 5s');
      this.disconnectRealtime();
      this.realtimeReconnectTimer = window.setTimeout(() => this.connectRealtime(), 5000);
    };
  }

  disconnectRealtime(): void {
    if (this.realtimeReconnectTimer) {
      window.clearTimeout(this.realtimeReconnectTimer);
      this.realtimeReconnectTimer = undefined;
    }

    this.realtimeSource?.close();
    this.realtimeSource = undefined;
  }

  /**
   * Évaluer la nécessité d'une pause pour un trajet
   */
  evaluerPause(trajetId: number, request: PauseAIEvaluationRequest): Observable<PauseAIPrediction> {
    return this.http.post<PauseAIPrediction>(
      `${this.apiUrl}/evaluer/${trajetId}`,
      request
    );
  }

  getPausesForTrajet(trajetId: number): Observable<PauseReglementaireResponse[]> {
    console.log('[PauseAIService] Chargement des pauses réglementaires pour le trajet', trajetId);
    return this.http.get<PauseReglementaireResponse[]>(`${this.tripsApiUrl}/${trajetId}/pauses`);
  }

  markPauseCompleted(trajetId: number, pauseId: number): Observable<PauseReglementaireResponse> {
    console.log('[PauseAIService] Marquage pause effectuée', { trajetId, pauseId });
    return this.http.post<PauseReglementaireResponse>(`${this.tripsApiUrl}/${trajetId}/pauses/${pauseId}/effectuee`, {});
  }

  ignorePause(trajetId: number, pauseId: number): Observable<PauseReglementaireResponse> {
    console.log('[PauseAIService] Pause ignorée', { trajetId, pauseId });
    return this.http.post<PauseReglementaireResponse>(`${this.tripsApiUrl}/${trajetId}/pauses/${pauseId}/ignorer`, {});
  }

  regeneratePauses(trajetId: number): Observable<PauseReglementaireResponse[]> {
    console.log('[PauseAIService] Régénération des pauses réglementaires', { trajetId });
    return this.http.post<PauseReglementaireResponse[]>(`${this.tripsApiUrl}/${trajetId}/pauses/regenerer`, {});
  }

  /**
   * Récupérer l'historique des prédictions IA pour un trajet
   */
  getHistoriquePredictions(trajetId: number): Observable<PauseAIPrediction[]> {
    return this.http.get<PauseAIPrediction[]>(
      `${this.apiUrl}/trajets/${trajetId}/historique`
    );
  }

  /**
   * Récupérer les statistiques du dashboard avec filtres
   */
  getDashboardStats(filters: PauseAIFilterOptions): Observable<PauseAIDashboard> {
    let params = new HttpParams()
      .set('startDate', filters.startDate.toISOString())
      .set('endDate', filters.endDate.toISOString());

    if (filters.chauffeurId) {
      params = params.set('chauffeurId', filters.chauffeurId.toString());
    }

    console.log('[PauseAIService] 🔄 Requête dashboard:', {
      url: `${this.apiUrl}/dashboard`,
      params: {
        startDate: filters.startDate.toISOString(),
        endDate: filters.endDate.toISOString(),
        chauffeurId: filters.chauffeurId
      }
    });

    return this.http.get<PauseAIDashboard>(
      `${this.apiUrl}/dashboard`,
      { params }
    ).pipe(
      tap(data => {
        console.log('[PauseAIService] ✅ Dashboard reçu:', {
          totalPoints: data.heatmapPoints?.length || 0,
          totalChauffeurs: data.chauffeurStats?.length || 0,
          stats: {
            recommandees: data.totalPausesRecommandees,
            effectuees: data.pausesEffectuees,
            ignorees: data.pausesIgnorees
          }
        });
        
        if (data.heatmapPoints && data.heatmapPoints.length > 0) {
          console.log('[PauseAIService] 📍 Premiers points de carte:', 
            data.heatmapPoints.slice(0, 3).map(p => ({
              nom: p.nomLieu,
              type: p.type,
              score: p.score,
              coords: [p.latitude, p.longitude]
            }))
          );
        } else {
          console.warn('[PauseAIService] ⚠️ Aucun point de carte dans la réponse');
        }
      })
    );
  }

  /**
   * Récupérer TOUS les points de pause (réglementaires + POI IA) pour un trajet
   */
  getPausesCompletes(trajetId: number): Observable<any> {
    console.log('[PauseAIService] 🗺️ Récupération des pauses complètes pour trajet', trajetId);
    return this.http.get<any>(
      `${this.apiUrl}/trajets/${trajetId}/pauses-completes`
    ).pipe(
      tap(data => {
        console.log('[PauseAIService] ✅ Pauses complètes reçues:', {
          totalStops: data.stops?.length || 0,
          types: data.stops?.map((s: any) => s.type).filter((t: string, i: number, arr: string[]) => arr.indexOf(t) === i),
          meta: data.meta
        });
        
        if (data.stops && data.stops.length > 0) {
          console.log('[PauseAIService] 📍 Premiers stops:', 
            data.stops.slice(0, 5).map((s: any) => ({
              type: s.type,
              nom: s.nomLieu,
              score: s.aiScore,
              coords: [s.latitude || s.lat, s.longitude || s.lon]
            }))
          );
        } else {
          console.warn('[PauseAIService] ⚠️ Aucun stop dans la réponse');
        }
      })
    );
  }

  /**
   * Publier une nouvelle alerte IA (appelé par le gestionnaire SSE)
   */
  publishAlert(alert: PauseAIAlertEvent): void {
    console.log('[PauseAIService] Publishing alert:', alert);
    this.alertSubject.next(alert);
  }

  /**
   * Effacer l'alerte actuelle
   */
  clearAlert(): void {
    this.alertSubject.next(null);
  }

  /**
   * Calculer la couleur selon le score IA
   */
  getScoreColor(score: number): string {
    if (score >= 85) {
      return '#ef4444'; // Rouge
    } else if (score >= 70) {
      return '#f59e0b'; // Orange
    } else {
      return '#10b981'; // Vert
    }
  }

  /**
   * Calculer le label selon le score IA
   */
  getScoreLabel(score: number): string {
    if (score >= 85) {
      return 'Score critique';
    } else if (score >= 70) {
      return 'Score élevé';
    } else if (score >= 50) {
      return 'Score modéré';
    } else {
      return 'Score faible';
    }
  }

  /**
   * Formater le temps de conduite en heures et minutes
   */
  formatHoursDriving(hours: number): string {
    const h = Math.floor(hours);
    const m = Math.round((hours - h) * 60);
    return `${h}h${m.toString().padStart(2, '0')}`;
  }

  /**
   * Formater la distance en mètres ou kilomètres
   */
  formatDistance(meters: number): string {
    if (meters >= 1000) {
      return `${(meters / 1000).toFixed(1)} km`;
    }
    return `${Math.round(meters)} m`;
  }
}
