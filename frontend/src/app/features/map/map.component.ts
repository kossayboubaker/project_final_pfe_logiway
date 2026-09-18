import { Component, OnInit, OnDestroy, AfterViewInit, ChangeDetectionStrategy, ChangeDetectorRef, NgZone, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatBadgeModule } from '@angular/material/badge';
import { FormsModule } from '@angular/forms';
import * as L from 'leaflet';
import { FleetService, TripMapItem } from '../../core/services/fleet.service';
import { PauseAIService } from '../../core/services/pause-ai.service';
import { BreakNotificationComponent } from './components/break-notification/break-notification.component';
import {
    PauseAIAlertEvent,
    PauseReglementaireResponse,
    PauseStatusUpdateEvent,
    POIInfo,
    StatutPause,
    TypeAlerteIA,
    TypePause
} from '../../models/pause-ai.models';

import { DeliveryListComponent } from './components/delivery-list/delivery-list.component';
import { MapControlPanelComponent } from './components/control-panel/control-panel.component';
import { AdvancedMapControlsComponent } from './components/advanced-map-controls/advanced-map-controls.component';
import { AlertNotificationsComponent } from './components/alert-notifications/alert-notifications.component';
import { MapMenuComponent } from './components/map-menu/map-menu.component';
import { NotificationService, AppNotification } from '../../core/services/notification.service';
import { WeatherInfo, WeatherService } from '../../core/services/weather.service';
import { AppConfigService } from '../../core/services/app-config.service';

export interface Vehicle {
    id: string;
    name: string;
    type?: string;
    driver: string;
    phone: string;
    speed: number;
    progress: number;
    from: string;
    to: string;
    status: string;
    eco: boolean;
    consumption: string;
    hasAlert: boolean;
    lastUpdate?: string;
    zone?: string;
    bearing?: number;
    fuelLevel?: number;
    coordinates?: [number, number];
}

@Component({
    selector: 'app-map',
    standalone: true,
    imports: [
        CommonModule,
        MatButtonModule,
        MatIconModule,
        MatCardModule,
        MatSelectModule,
        MatFormFieldModule,
        MatCheckboxModule,
        MatBadgeModule,
        FormsModule,
        DeliveryListComponent,
        MapControlPanelComponent,
        AdvancedMapControlsComponent,
        AlertNotificationsComponent,
        BreakNotificationComponent,
        MapMenuComponent
    ],
    templateUrl: './map.component.html',
    styleUrls: ['./map.component.css'],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class MapComponent implements OnInit, AfterViewInit, OnDestroy {
    @ViewChild(DeliveryListComponent) deliveryListComp!: DeliveryListComponent;

    private map!: L.Map;
    private baseLayers: { [key: string]: L.TileLayer } = {};
    private poiLayers: { [key: string]: L.LayerGroup } = {};
    private themeObserver!: MutationObserver;

    isDarkMode: boolean = true;
    activeTruck: string = 'truck_001';
    activePanel: string | null = 'settings';
    mapStyle: string = 'standard';
    showMenu: boolean = false;
    showSidebar: boolean = true;
    showMobileSidebar: boolean = false; // Controls mobile bottom sheet

    // Filters & States
    showRoads: boolean = true;
    showPOIs: boolean = true;
    followTruck: boolean = false;

    private truckMarkers: { [key: string]: L.Marker } = {};
    private routeLines: { [key: string]: L.Layer } = {};

    // New Feature States
    isLocating: boolean = false;
    isFullscreen: boolean = false;
    isRouteLayerActive: boolean = false;
    isClusterActive: boolean = false;
    toastMessage: string | null = null;
    toastVisible: boolean = false;
    private toastTimeout: any;
    private resizeTimeout: any;
    private refreshTimeout: any;
    private positionRefreshTimeout: any;  // refresh léger GPS toutes les 2s
    private gpsRealtimeSource?: EventSource;
    private gpsReconnectTimer?: number;
    private tripsSubscription?: Subscription;
    private notificationsSubscription?: Subscription;
    private readonly boundResizeListener = () => this.onResize();

    // Feature Objects
    private tripStartMarkers: { [tripId: string]: L.Marker } = {};
    private tripEndMarkers: { [tripId: string]: L.Marker } = {};
    private locMarker: L.Marker | null = null;
    private locCircle: L.Circle | null = null;
    private dynamicRouteLine: L.Polyline | null = null;
    private distanceTooltip: L.Marker | null = null;
    private simulatedClusterMarker: L.Marker | null = null;
    private originalMarkersArr: L.Marker[] = [];
    private pauseLayerGroup: L.LayerGroup = L.layerGroup();
    private pauseMarkersById: Map<number, L.Marker> = new Map();
    private pauseDataByTripId: Map<number, PauseReglementaireResponse[]> = new Map();
    private pauseAlertSubscription?: Subscription;
    private pauseStatusSubscription?: Subscription;
    private pauseGeneratedSubscription?: Subscription;
    private snoozedUntilByTripId: Map<number, number> = new Map();
    private lastPauseCompletedAtByTripId: Map<number, number> = new Map();
    private activePauseMarkerId: number | null = null;
    activePauseAlert: {
        alert: PauseAIAlertEvent;
        pause: PauseReglementaireResponse | null;
        poi: POIInfo;
        isUrgent: boolean;
        estimatedArrivalTime?: string;
        distanceToPoiM?: number;
        currentPointLabel?: string;
        nextPointLabel?: string;
    } | null = null;
    activeAlerts: AppNotification[] = [];

    // Fullscreen listener
    private boundFullscreenListener: any;

    // ─── Interpolation engine (Problèmes 1-6) ───────────────────────────────
    // Un état d'interpolation par véhicule identifié par vehicleId
    private vehicleInterpStates: Map<string, {
        route: L.LatLngTuple[];          // polyligne décodée [lat,lng][]
        segIndex: number;                // indice du segment courant
        segProgress: number;             // 0..1 progression sur le segment courant
        speedKmh: number;                // vitesse courante km/h
        lastGpsLat: number;              // dernière lat GPS reçue du backend
        lastGpsLng: number;              // dernière lng GPS reçue du backend
    }> = new Map();
    private interpAnimFrame: number | null = null;  // requestAnimationFrame global
    private interpLastTs: number = 0;               // timestamp de la dernière frame
    // ────────────────────────────────────────────────────────────────────────

    get totalMarkersCount(): number {
        return Object.keys(this.truckMarkers).length;
    }

    // Typed Data
    allTrucks: Vehicle[] = [];
    private tripCards: TripMapItem[] = [];
    private truckPreviousPositions: { [id: string]: [number, number] } = {};
    private markerAnimationFrames: { [id: string]: number } = {};
    private initialAutoFitDone: boolean = false;
    private weatherRefreshTimeout: any;
    private readonly boundMapMoveEndListener = () => this.onMapMoveEnd();
    private vehicleWeatherMarkers: { [id: string]: L.Marker } = {};
    centerWeather: WeatherInfo | null = null;

    // ─── Moteur d'interpolation — utilitaires ────────────────────────────────

    /**
     * Démarre la boucle rAF globale qui déplace tous les véhicules
     * de manière fluide et indépendante (Problèmes 2, 3, 5).
     */
    private startInterpolationEngine(): void {
        if (this.interpAnimFrame != null) return; // déjà lancé
        this.interpLastTs = performance.now();
        const loop = (ts: number) => {
            const dtSeconds = Math.min((ts - this.interpLastTs) / 1000, 0.5); // max 0.5s
            this.interpLastTs = ts;
            this.advanceAllVehicles(dtSeconds);
            this.interpAnimFrame = requestAnimationFrame(loop);
        };
        this.interpAnimFrame = requestAnimationFrame(loop);
    }

    /**
     * Avance chaque véhicule de dtSeconds secondes selon sa vitesse (Problème 3).
     * Met à jour le marker Leaflet directement sans passer par Angular
     * pour maximiser les performances.
     */
    private advanceAllVehicles(dtSeconds: number): void {
        if (!this.map) return;
        this.vehicleInterpStates.forEach((state, vehicleId) => {
            const { route, speedKmh } = state;
            if (!route || route.length < 2 || speedKmh <= 0) return;

            // Distance à parcourir cette frame (en km)
            const distKm = (speedKmh / 3600) * dtSeconds;
            this.advanceOnRoute(state, distKm);

            // Position courante projetée sur la polyligne
            const pos = this.getPositionOnRoute(route, state.segIndex, state.segProgress);
            const bearing = this.getBearingAtSegment(route, state.segIndex);

            // Mettre à jour le marker Leaflet directement (Problème 2 : chaque véhicule indépendant)
            const marker = this.truckMarkers[vehicleId];
            if (marker) {
                marker.setLatLng(pos);
                // Mettre à jour l'icône pour le bearing (Problème 6)
                const truck = this.allTrucks.find(t => t.id === vehicleId);
                if (truck) {
                    truck.coordinates = [pos[0], pos[1]];
                    truck.bearing = bearing;
                    const newIcon = this.buildTruckIcon(bearing, truck.type);
                    marker.setIcon(newIcon);
                }
            }
        });
    }

    /**
     * Avance l'état d'interpolation d'un véhicule de distKm km sur sa polyligne.
     */
    private advanceOnRoute(state: { route: L.LatLngTuple[]; segIndex: number; segProgress: number; speedKmh: number; lastGpsLat: number; lastGpsLng: number }, distKm: number): void {
        const { route } = state;
        let remaining = distKm;

        while (remaining > 0 && state.segIndex < route.length - 1) {
            const segLen = this.haversineKm(
                route[state.segIndex][0], route[state.segIndex][1],
                route[state.segIndex + 1][0], route[state.segIndex + 1][1]
            );
            if (segLen <= 0) { state.segIndex++; state.segProgress = 0; continue; }

            const remainingOnSeg = segLen * (1 - state.segProgress);
            if (remaining >= remainingOnSeg) {
                remaining -= remainingOnSeg;
                state.segIndex = Math.min(state.segIndex + 1, route.length - 2);
                state.segProgress = 0;
            } else {
                state.segProgress += remaining / segLen;
                remaining = 0;
            }
        }

        // Bloquer à la fin de la polyligne
        if (state.segIndex >= route.length - 1) {
            state.segIndex = route.length - 2;
            state.segProgress = 1;
        }
    }

    /**
     * Retourne la position interpolée [lat, lng] sur la polyligne
     * pour un segIndex et un segProgress donnés.
     */
    private getPositionOnRoute(route: L.LatLngTuple[], segIndex: number, segProgress: number): L.LatLngTuple {
        const idx = Math.max(0, Math.min(segIndex, route.length - 2));
        const t = Math.max(0, Math.min(segProgress, 1));
        const a = route[idx];
        const b = route[idx + 1];
        return [
            a[0] + (b[0] - a[0]) * t,
            a[1] + (b[1] - a[1]) * t
        ];
    }

    /**
     * Bearing du segment de route courant (Problème 6).
     */
    private getBearingAtSegment(route: L.LatLngTuple[], segIndex: number): number {
        const idx = Math.max(0, Math.min(segIndex, route.length - 2));
        return this.calculateBearing(route[idx][0], route[idx][1], route[idx + 1][0], route[idx + 1][1]);
    }

    /**
     * Projette un point GPS brut sur la polyligne et retourne
     * le segIndex + segProgress les plus proches (Problème 1).
     */
    private projectOnRoute(lat: number, lng: number, route: L.LatLngTuple[]): { segIndex: number; segProgress: number } {
        let bestDist = Infinity;
        let bestSeg = 0;
        let bestT = 0;

        for (let i = 0; i < route.length - 1; i++) {
            const a = route[i];
            const b = route[i + 1];
            const { t, dist } = this.closestPointOnSegment(lat, lng, a[0], a[1], b[0], b[1]);
            if (dist < bestDist) {
                bestDist = dist;
                bestSeg = i;
                bestT = t;
            }
        }
        return { segIndex: bestSeg, segProgress: bestT };
    }

    /**
     * Calcule le point le plus proche sur un segment [a→b] depuis un point p.
     * Retourne t (0..1) et la distance approximative en degrés.
     */
    private closestPointOnSegment(pLat: number, pLng: number, aLat: number, aLng: number, bLat: number, bLng: number): { t: number; dist: number } {
        const abLat = bLat - aLat;
        const abLng = bLng - aLng;
        const ab2 = abLat * abLat + abLng * abLng;
        if (ab2 === 0) {
            const d = Math.hypot(pLat - aLat, pLng - aLng);
            return { t: 0, dist: d };
        }
        let t = ((pLat - aLat) * abLat + (pLng - aLng) * abLng) / ab2;
        t = Math.max(0, Math.min(1, t));
        const closestLat = aLat + t * abLat;
        const closestLng = aLng + t * abLng;
        const dist = Math.hypot(pLat - closestLat, pLng - closestLng);
        return { t, dist };
    }

    /**
     * Distance haversine entre deux points en km.
     */
    private haversineKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
        const R = 6371;
        const dLat = (lat2 - lat1) * Math.PI / 180;
        const dLng = (lng2 - lng1) * Math.PI / 180;
        const a = Math.sin(dLat / 2) ** 2 +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLng / 2) ** 2;
        return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    }

    /**
     * Construit l'icône du camion avec le bearing courant.
     */
    private buildTruckIcon(bearing: number, type?: string): L.DivIcon {
        return L.divIcon({
            html: `
<div class="vehicle-icon" style="transform: rotate(${bearing}deg); transform-origin: center center;">
    <span style="font-size:36px;line-height:1;display:block;filter:drop-shadow(0 2px 4px rgba(0,0,0,0.5));">
        ${type === 'small' ? '🚚' : type === 'van' ? '🚐' : '🚛'}
    </span>
</div>`,
            className: 'empty-leaflet-div',
            iconSize: [52, 52],
            iconAnchor: [26, 26],
            popupAnchor: [0, -24]
        });
    }

    // ────────────────────────────────────────────────────────────────────────

    private calculateBearing(startLat: number, startLng: number, destLat: number, destLng: number): number {
        const startLatRad = startLat * Math.PI / 180;
        const startLngRad = startLng * Math.PI / 180;
        const destLatRad = destLat * Math.PI / 180;
        const destLngRad = destLng * Math.PI / 180;

        const y = Math.sin(destLngRad - startLngRad) * Math.cos(destLatRad);
        const x = Math.cos(startLatRad) * Math.sin(destLatRad) -
            Math.sin(startLatRad) * Math.cos(destLatRad) * Math.cos(destLngRad - startLngRad);
        let brng = Math.atan2(y, x);
        brng = brng * 180 / Math.PI;
        return (brng + 360) % 360;
    }

    constructor(
        private router: Router,
        private cdr: ChangeDetectorRef,
        private ngZone: NgZone,
        private fleetService: FleetService,
        private pauseAIService: PauseAIService,
        private notificationService: NotificationService,
        private weatherService: WeatherService,
        private appConfig: AppConfigService
    ) { }

    ngOnInit() {
        this.checkTheme();
        this.themeObserver = new MutationObserver(() => {
            this.checkTheme();
        });
        this.themeObserver.observe(document.body, { attributes: true, attributeFilter: ['data-theme'] });

        // Hide the global particles.js theme button on map page only
        this.injectMapPageStyle();

        this.boundFullscreenListener = () => {
            this.ngZone.run(() => {
                this.isFullscreen = !!document.fullscreenElement;
                this.cdr.markForCheck();
            });
        };
        document.addEventListener('fullscreenchange', this.boundFullscreenListener);

        this.loadTripsFromBackend();
        // Refresh complet toutes les 15s (trajets, routes, marqueurs DÉPART/ARRIVÉE)
        this.refreshTimeout = window.setInterval(() => this.loadTripsFromBackend(true), 15000);
        // Refresh léger des positions GPS toutes les 2s pour navigation fluide (Problème 4)
        this.positionRefreshTimeout = window.setInterval(() => this.updateVehicleMarkersOnly(), 2000);
        this.connectGpsRealtime();
        this.connectAlertsRealtime();
        this.connectPauseAiRealtime();
    }

    private injectMapPageStyle() {
        let styleEl = document.getElementById('map-page-override-style');
        if (!styleEl) {
            styleEl = document.createElement('style');
            styleEl.id = 'map-page-override-style';
            document.head.appendChild(styleEl);
        }
        styleEl.textContent = '.theme-toggle { display: none !important; }';
    }

    private removeMapPageStyle() {
        const styleEl = document.getElementById('map-page-override-style');
        if (styleEl) { styleEl.textContent = ''; }
    }

    private checkTheme() {
        const theme = document.body.getAttribute('data-theme');
        this.isDarkMode = theme === 'dark' || !theme; // Default to dark silently if not set
        this.cdr.markForCheck();
    }

    ngAfterViewInit() {
        this.ngZone.runOutsideAngular(() => {
            try {
                this.initMap();
                this.initLayers();
                this.renderTripsOnMap();
                this.refreshPauseMarkersForTrips(this.tripCards);
                this.addPOIs();
            } catch (e) {
                console.warn("Map initialization encountered an issue:", e);
                const mapEl = document.getElementById('map');
                if (mapEl) {
                    mapEl.innerHTML = `<div style="display: flex; height: 100%; align-items: center; justify-content: center; color: var(--text-primary); font-family: sans-serif;">Map could not be loaded</div>`;
                }
            }
        });

        this.refreshWeatherState();
        this.weatherRefreshTimeout = window.setInterval(() => this.refreshWeatherState(), 5 * 60 * 1000);

        this.scheduleMapResize(300);

        window.addEventListener('resize', this.boundResizeListener);
    }

    private onResize() {
        this.scheduleMapResize(120);
    }

    private scheduleMapResize(delay: number = 0) {
        if (this.resizeTimeout) {
            clearTimeout(this.resizeTimeout);
        }

        this.resizeTimeout = setTimeout(() => {
            const map = this.map;
            const container = map?.getContainer?.();

            if (!map || !container || !container.isConnected) {
                return;
            }

            this.ngZone.runOutsideAngular(() => {
                try {
                    map.invalidateSize({ animate: false, pan: false });
                } catch (error) {
                    console.warn('Leaflet resize skipped:', error);
                }
            });
        }, delay);
    }

    zoomIn() { this.ngZone.runOutsideAngular(() => this.map.zoomIn()); }
    zoomOut() { this.ngZone.runOutsideAngular(() => this.map.zoomOut()); }

    ngOnDestroy() {
        if (this.themeObserver) this.themeObserver.disconnect();
        this.removeMapPageStyle(); // Restore global theme button
        if (this.toastTimeout) clearTimeout(this.toastTimeout);
        if (this.resizeTimeout) clearTimeout(this.resizeTimeout);
        if (this.refreshTimeout) clearInterval(this.refreshTimeout);
        if (this.positionRefreshTimeout) clearInterval(this.positionRefreshTimeout);
        if (this.weatherRefreshTimeout) clearInterval(this.weatherRefreshTimeout);
        if (this.gpsReconnectTimer) clearTimeout(this.gpsReconnectTimer);
        this.pauseAlertSubscription?.unsubscribe();
        this.pauseStatusSubscription?.unsubscribe();
        this.pauseGeneratedSubscription?.unsubscribe();
        this.pauseAIService.disconnectRealtime();
        Object.values(this.markerAnimationFrames).forEach(frameId => cancelAnimationFrame(frameId));
        this.markerAnimationFrames = {};
        // Nettoyer les markers DÉPART/ARRIVÉE persistés
        Object.values(this.tripStartMarkers).forEach(m => m.remove());
        this.tripStartMarkers = {};
        Object.values(this.tripEndMarkers).forEach(m => m.remove());
        this.tripEndMarkers = {};
        // Arrêter le moteur d'interpolation
        if (this.interpAnimFrame != null) {
            cancelAnimationFrame(this.interpAnimFrame);
            this.interpAnimFrame = null;
        }
        this.vehicleInterpStates.clear();
        this.map?.off('moveend', this.boundMapMoveEndListener);
        this.notificationsSubscription?.unsubscribe();
        this.gpsRealtimeSource?.close();
        this.tripsSubscription?.unsubscribe(); if (this.map) {
            this.ngZone.runOutsideAngular(() => {
                this.map.remove();
            });
        }
        window.removeEventListener('resize', this.boundResizeListener);
        document.removeEventListener('fullscreenchange', this.boundFullscreenListener);
    }

    private initMap() {
        this.map = L.map('map', {
            center: [36.8065, 10.1815], // Tunis bounds fallback
            zoom: 8,
            minZoom: 6,
            maxZoom: 17,
            zoomControl: false,
            attributionControl: true
        });

        // The 3 sacred modes, untouched
        this.baseLayers['standard'] = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '&copy; OpenStreetMap contributors',

            detectRetina: true,
            minZoom: 5,
            maxZoom: 17,
        });
        this.baseLayers['satellite'] = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
            attribution: 'Tiles &copy; Esri &mdash; Source: Esri',
            detectRetina: true,
            minZoom: 5,
            maxZoom: 17,
        });
        this.baseLayers['terrain'] = L.tileLayer('https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png', {
            attribution: 'Map data: &copy; OSM contributors',
            detectRetina: true,
            minZoom: 5,
            maxZoom: 17,
        });

        this.baseLayers['standard'].addTo(this.map);

        // Feature 5: Scale bar
        L.control.scale({ imperial: false, metric: true, position: 'bottomleft' }).addTo(this.map);

        this.map.on('moveend', this.boundMapMoveEndListener);
    }

    private initLayers() {
        this.poiLayers['roads'] = L.layerGroup();
        this.poiLayers['gas'] = L.layerGroup();
        this.poiLayers['rest'] = L.layerGroup();
        this.poiLayers['food'] = L.layerGroup();
        this.poiLayers['scale'] = L.layerGroup();
        this.pauseLayerGroup.addTo(this.map);

        Object.values(this.poiLayers).forEach(layer => layer.addTo(this.map));
    }

    private loadTripsFromBackend(triggerRender: boolean = true) {
        this.tripsSubscription?.unsubscribe();
        this.tripsSubscription = this.fleetService.getTripsCarte().subscribe(trips => {
            this.tripCards = trips.filter(trip =>
                trip.statut === 'En Cours' || trip.statut === 'Actif' ||
                trip.statut === 'ACTIF' || trip.statut === 'En cours'
            );

            // Recaler les états d'interpolation avec les nouvelles positions GPS
            this.tripCards.forEach(trip => {
                const vehicleId = String(trip.vehiculeId ?? trip.id ?? '');
                if (!vehicleId) return;

                const route = this.extractRouteCoordinates(trip);
                if (!route || route.length < 2) return;

                const rawLat = trip.vehiculeLatitude ?? trip.latitudeDepart;
                const rawLng = trip.vehiculeLongitude ?? trip.longitudeDepart;
                if (rawLat == null || rawLng == null) return;

                const existing = this.vehicleInterpStates.get(vehicleId);

                if (!existing) {
                    // Premier chargement : initialiser l'état depuis la position GPS réelle
                    const projected = this.projectOnRoute(rawLat, rawLng, route);
                    this.vehicleInterpStates.set(vehicleId, {
                        route,
                        segIndex: projected.segIndex,
                        segProgress: projected.segProgress,
                        speedKmh: trip.vehiculeVitesse ?? 30,
                        lastGpsLat: rawLat,
                        lastGpsLng: rawLng
                    });
                } else {
                    // Mise à jour GPS : ne jamais regresser la position sur la polyligne.
                    // On compare la distance parcourue (segIndex + segProgress) entre
                    // l'état actuel et la nouvelle projection GPS. On garde le maximum.
                    const isSameGps = (
                        Math.abs(rawLat - existing.lastGpsLat) < 0.00001 &&
                        Math.abs(rawLng - existing.lastGpsLng) < 0.00001
                    );

                    // Toujours mettre à jour la route et la vitesse
                    existing.route = route;
                    existing.speedKmh = (trip.vehiculeVitesse != null && trip.vehiculeVitesse > 0)
                        ? trip.vehiculeVitesse
                        : existing.speedKmh;

                    if (!isSameGps) {
                        // Nouvelle position GPS reçue : projeter sur la polyligne
                        const projected = this.projectOnRoute(rawLat, rawLng, route);
                        // Calculer la progression linéaire pour comparer
                        const currentLinear = existing.segIndex + existing.segProgress;
                        const projectedLinear = projected.segIndex + projected.segProgress;

                        // Ne jamais reculer : garder la position la plus avancée
                        if (projectedLinear > currentLinear) {
                            existing.segIndex = projected.segIndex;
                            existing.segProgress = projected.segProgress;
                        }
                        existing.lastGpsLat = rawLat;
                        existing.lastGpsLng = rawLng;
                    }
                    // Si même GPS → on ne touche pas segIndex/segProgress
                    // → le moteur rAF continue d'avancer normalement
                }
            });

            // Supprimer les états des véhicules qui ne sont plus actifs
            const activeVehicleIds = new Set(this.tripCards.map(t => String(t.vehiculeId ?? t.id ?? '')));
            this.vehicleInterpStates.forEach((_, id) => {
                if (!activeVehicleIds.has(id)) this.vehicleInterpStates.delete(id);
            });

            this.allTrucks = this.tripCards
                .map((trip, index) => this.mapTripToVehicle(trip, index))
                .filter((truck): truck is Vehicle => !!truck);

            if (!this.allTrucks.some(truck => truck.id === this.activeTruck)) {
                this.activeTruck = this.allTrucks[0]?.id || '';
            }

            if (triggerRender && this.map) {
                this.renderTripsOnMap();
                this.refreshPauseMarkersForTrips(this.tripCards);
                // Démarrer le moteur d'interpolation si pas encore lancé
                this.startInterpolationEngine();
            } else {
                this.cdr.markForCheck();
            }
        });
    }

    /**
     * Rafraîchissement léger des positions uniquement, sans redessiner les routes.
     * Appelé toutes les 2 secondes pour une navigation fluide (Problème 4).
     */
    private updateVehicleMarkersOnly(): void {
        if (!this.map || this.vehicleInterpStates.size === 0) return;
        this.fleetService.getTripsCarte().subscribe(trips => {
            const activeTripCards = trips.filter(trip =>
                trip.statut === 'En Cours' || trip.statut === 'Actif' ||
                trip.statut === 'ACTIF' || trip.statut === 'En cours'
            );
            activeTripCards.forEach(trip => {
                const vehicleId = String(trip.vehiculeId ?? trip.id ?? '');
                const existing = this.vehicleInterpStates.get(vehicleId);
                if (!existing) return;

                const rawLat = trip.vehiculeLatitude ?? trip.latitudeDepart;
                const rawLng = trip.vehiculeLongitude ?? trip.longitudeDepart;
                if (rawLat == null || rawLng == null) return;

                const isSameGps = (
                    Math.abs(rawLat - existing.lastGpsLat) < 0.00001 &&
                    Math.abs(rawLng - existing.lastGpsLng) < 0.00001
                );

                if (!isSameGps) {
                    const projected = this.projectOnRoute(rawLat, rawLng, existing.route);
                    const currentLinear = existing.segIndex + existing.segProgress;
                    const projectedLinear = projected.segIndex + projected.segProgress;
                    if (projectedLinear > currentLinear) {
                        existing.segIndex = projected.segIndex;
                        existing.segProgress = projected.segProgress;
                    }
                    existing.lastGpsLat = rawLat;
                    existing.lastGpsLng = rawLng;
                    if (trip.vehiculeVitesse != null && trip.vehiculeVitesse > 0) {
                        existing.speedKmh = trip.vehiculeVitesse;
                    }
                }
            });
        });
    }

    private connectGpsRealtime() {
        if (typeof EventSource === 'undefined' || this.gpsRealtimeSource) {
            return;
        }

        this.gpsRealtimeSource = new EventSource(`${this.appConfig.apiUrl}/notifications/stream`, { withCredentials: true });
        this.gpsRealtimeSource.addEventListener('gps-position', () => {
            this.ngZone.run(() => {
                this.loadTripsFromBackend(true);
            });
        });

        this.gpsRealtimeSource.onerror = () => {
            this.gpsRealtimeSource?.close();
            this.gpsRealtimeSource = undefined;
            if (this.gpsReconnectTimer) {
                window.clearTimeout(this.gpsReconnectTimer);
            }
            this.gpsReconnectTimer = window.setTimeout(() => this.connectGpsRealtime(), 5000);
        };
    }

    private connectAlertsRealtime() {
        this.notificationsSubscription?.unsubscribe();
        this.notificationService.loadNotifications().subscribe();
        this.notificationService.connectRealtime();
        this.notificationsSubscription = this.notificationService.notifications$.subscribe(notifications => {
            this.activeAlerts = notifications.filter(notification => !notification.isRead && (
                notification.category === 'NOTIF_TRAJET' ||
                notification.category === 'NOTIF_VEHICULE'
            ));

            this.allTrucks = this.allTrucks.map(truck => ({
                ...truck,
                hasAlert: this.activeAlerts.some(alert => {
                    const content = `${alert.title} ${alert.message}`.toLowerCase();
                    return content.includes(truck.name.toLowerCase()) || content.includes(truck.id.toLowerCase());
                })
            }));

            this.cdr.markForCheck();
        });
    }

    onAlertTreat(alert: AppNotification) {
        this.notificationService.markAsRead(alert.id);
    }

    onAlertFocus(alert: AppNotification) {
        const source = `${alert.title} ${alert.message}`.toLowerCase();
        const target = this.allTrucks.find(truck => source.includes(truck.name.toLowerCase()) || source.includes(truck.id.toLowerCase()));
        if (target) {
            this.selectTruck(target.id);
            this.activePanel = null;
        }
    }

    private mapTripToVehicle(trip: TripMapItem, index: number): Vehicle | null {
        const vehicleId = String(trip.vehiculeId ?? trip.id ?? `trip-${index}`);

        // Utiliser la position interpolée sur la polyligne si disponible (Problème 1)
        const interpState = this.vehicleInterpStates.get(vehicleId);
        let latitude: number | undefined;
        let longitude: number | undefined;
        let bearing = 0;

        if (interpState && interpState.route.length > 1) {
            const pos = this.getPositionOnRoute(interpState.route, interpState.segIndex, interpState.segProgress);
            latitude = pos[0];
            longitude = pos[1];
            // Bearing selon la direction du segment courant (Problème 6)
            bearing = this.getBearingAtSegment(interpState.route, interpState.segIndex);
        } else {
            // Fallback sur position GPS brute
            latitude = trip.vehiculeLatitude ?? trip.latitudeDepart ?? trip.latitudeArrivee;
            longitude = trip.vehiculeLongitude ?? trip.longitudeDepart ?? trip.longitudeArrivee;
            const lastPos = this.truckPreviousPositions[vehicleId];
            if (latitude != null && longitude != null && lastPos &&
                (lastPos[0] !== latitude || lastPos[1] !== longitude)) {
                bearing = this.calculateBearing(lastPos[0], lastPos[1], latitude, longitude);
            } else if (lastPos) {
                const prevTruck = this.allTrucks.find(t => t.id === vehicleId);
                bearing = prevTruck?.bearing ?? 0;
            }
        }

        if (latitude == null || longitude == null) return null;

        this.truckPreviousPositions[vehicleId] = [latitude, longitude];

        return {
            id: vehicleId,
            name: trip.vehiculeMatricule || `Véhicule ${index + 1}`,
            type: 'truck',
            driver: trip.chauffeurNom || 'Chauffeur non renseigné',
            phone: trip.chauffeurTelephone || 'N/A',
            speed: trip.vehiculeVitesse ?? 0,
            progress: trip.vehiculeVitesse != null ? Math.min(100, Math.max(10, Math.round(trip.vehiculeVitesse * 1.5))) : 35,
            from: trip.pointDepart || 'Départ non renseigné',
            to: trip.destination || 'Destination non renseignée',
            status: trip.statut || 'En cours',
            eco: false,
            consumption: trip.vehiculeNiveauCarburant != null ? `${Math.round(trip.vehiculeNiveauCarburant)}L/100km` : 'N/A',
            fuelLevel: trip.vehiculeNiveauCarburant ?? undefined,
            hasAlert: false,
            coordinates: [latitude, longitude],
            bearing,
            lastUpdate: 'Temps réel',
            zone: trip.destination || trip.pointDepart || ''
        };
    }

    private renderTripsOnMap() {
        const trucks = this.allTrucks.filter(truck => truck.coordinates);
        if (trucks.length === 0) {
            this.cdr.markForCheck();
            return;
        }

        if (!trucks.some(truck => truck.id === this.activeTruck)) {
            this.activeTruck = trucks[0].id;
        }

        const activeIds = new Set(trucks.map(t => t.id));
        Object.keys(this.truckMarkers).forEach(id => {
            if (!activeIds.has(id)) {
                this.truckMarkers[id].remove();
                delete this.truckMarkers[id];
            }
        });

        Object.values(this.routeLines).forEach(route => route.remove());
        this.routeLines = {};

        this.originalMarkersArr.forEach(m => {
            if (!Object.values(this.truckMarkers).includes(m)) {
                m.remove();
            }
        });
        this.originalMarkersArr = [];

        // Nettoyer les markers DÉPART/ARRIVÉE des trajets qui ne sont plus actifs
        const activeTripIds = new Set(trucks.map(t => {
            const sourceTrip = this.tripCards.find(trip => String(trip.vehiculeId ?? '') === t.id || trip.vehiculeMatricule === t.name);
            return sourceTrip ? String(sourceTrip.id) : null;
        }).filter(Boolean) as string[]);

        Object.keys(this.tripStartMarkers).forEach(tripId => {
            if (!activeTripIds.has(tripId)) {
                this.tripStartMarkers[tripId].remove();
                delete this.tripStartMarkers[tripId];
            }
        });
        Object.keys(this.tripEndMarkers).forEach(tripId => {
            if (!activeTripIds.has(tripId)) {
                this.tripEndMarkers[tripId].remove();
                delete this.tripEndMarkers[tripId];
            }
        });

        const truckSvg = ``;
        const vanSvg = ``;

        // Le moteur d'interpolation (rAF) gère le déplacement fluide de chaque véhicule.
        // animateMarkerTo n'est plus utilisé — supprimé pour éviter les conflits.

        trucks.forEach((truck, index) => {
            const position = truck.coordinates as [number, number];
            const sourceTrip = this.tripCards.find(trip => String(trip.vehiculeId ?? '') === truck.id || trip.vehiculeMatricule === truck.name);
            const statusClass = truck.status.toLowerCase().includes('cours') ? 'en-cours' : 'other';

            // Utilise buildTruckIcon pour que le bearing soit géré par le moteur d'interpolation
            const dynamicIcon = this.buildTruckIcon(truck.bearing ?? 0, truck.type);

            const progressColor = truck.progress < 70 ? '#10b981' : (truck.progress < 90 ? '#f59e0b' : '#ef4444');
            const fuelValue = truck.fuelLevel;
            const fuelColor = fuelValue == null ? '#cad8ecff' : (fuelValue > 50 ? '#10b981' : (fuelValue > 20 ? '#f59e0b' : '#ef4444'));
            const fuelBlink = fuelValue != null && fuelValue <= 20 ? 'animation: blink 1s infinite alternate;' : '';
            const emoji = truck.type === 'small' ? '🚚' : truck.type === 'van' ? '🚐' : '🚛';
            const iconBg = truck.type === 'small' ? '#ecfdf5' : truck.type === 'van' ? '#fff7ed' : '#eff6ff';
            const iconBorder = truck.type === 'small' ? '#a7f3d0' : truck.type === 'van' ? '#fed7aa' : '#bfdbfe';
            const accentBar = truck.type === 'small'
                ? 'linear-gradient(90deg,#10b981,#06b6d4,#3b82f6)'
                : truck.type === 'van'
                    ? 'linear-gradient(90deg,#f59e0b,#ef4444,#f97316)'
                    : 'linear-gradient(90deg,#3b82f6,#6366f1,#8b5cf6)';

            const popupHtml = `
<div class="rich-popup">
  <div class="rp-accent-bar" style="background:${accentBar};"></div>
  <div class="rp-body">

    <div class="rp-header">
      <div class="rp-vehicle-info">
        <div class="rp-icon-box" style="background:${iconBg}; border-color:${iconBorder};">
          ${emoji}
        </div>
        <div class="rp-title">
          <strong>${truck.name}</strong>
          <small>${truck.type === 'small' ? 'Petit véhicule' : truck.type === 'van' ? 'Véhicule utilitaire' : 'Poids lourd'}</small>
        </div>
      </div>
      <span class="rp-status-badge ${statusClass}">
        ${statusClass === 'en-cours' ? '<span class="pulse-dot"></span>' : ''} ${truck.status}
      </span>
    </div>

    <div class="rp-divider"></div>

    <div class="rp-driver">
      <div class="driver-avatar">${truck.driver.substring(0, 2).toUpperCase()}</div>
      <div>
        <div class="driver-name">${truck.driver}</div>
        ${truck.phone && truck.phone !== 'N/A'
                    ? `<a href="tel:${truck.phone}" class="driver-phone">
               <i class="material-icons" style="font-size:11px;">phone</i>
               ${truck.phone}
             </a>`
                    : `<span class="no-phone">Téléphone non renseigné</span>`
                }
      </div>
    </div>

    <div class="rp-route">
      <div class="route-line">
        <div class="route-row">
          <span class="route-dot-start"></span>
          <span class="route-text">${truck.from}</span>
        </div>
        <div class="route-connector">
          <div class="route-dashes"></div>
        </div>
        <div class="route-row">
          <span class="route-dot-end"></span>
          <span class="route-text">${truck.to}</span>
        </div>
      </div>
      <div class="rp-progress">
        <div class="prog-header">
          <span>Progression</span>
          <span style="color:${progressColor}; font-weight:700;">${truck.progress}%</span>
        </div>
        <div class="prog-track">
          <div class="prog-fill" style="width:${truck.progress}%; background:${progressColor};"></div>
        </div>
      </div>
    </div>

    <div class="rp-stats">
      <div class="stat-card">
        <div class="stat-icon">⚡</div>
        <span class="stat-label">Vitesse</span>
        <span class="stat-value" style="color:${truck.speed > 0 ? '#3b82f6' : 'var(--text-muted)'};">
          ${truck.speed}<span style="font-size:.6rem;font-weight:600;color:var(--text-muted)">km/h</span>
        </span>
      </div>
      <div class="stat-card">
        <div class="stat-icon">⛽</div>
        <span class="stat-label">Carburant</span>
        <span class="stat-value" style="color:${fuelColor};">
          ${fuelValue == null ? 'N/A' : `${fuelValue}%`}
        </span>
        <div class="fuel-mini-bar">
          <div class="fuel-mini-fill" style="width:${fuelValue ?? 0}%; background:${fuelColor};"></div>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon">📊</div>
        <span class="stat-label">Conso.</span>
        <span class="stat-value">${truck.consumption}</span>
      </div>
    </div>

  </div>
  <div class="rp-footer">
    <span class="rp-footer-icon">🅿️</span>
    <span>Prochaine pause recommandée dans <strong>45 min</strong></span>
  </div>
</div>`;

            let marker = this.truckMarkers[truck.id];
            if (marker) {
                // Le moteur rAF met à jour setLatLng et setIcon en continu.
                // Ici on met juste à jour le popup si besoin.
                const popup = marker.getPopup();
                if (popup && popup.isOpen()) {
                    popup.setContent(popupHtml);
                } else {
                    marker.setPopupContent(popupHtml);
                }
            } else {
                marker = L.marker(position, { icon: dynamicIcon }).addTo(this.map);
                marker.bindPopup(popupHtml, { closeButton: true, maxWidth: 300, minWidth: 280, className: 'custom-rich-popup-wrapper' });
                marker.on('mouseover', () => marker.openPopup());
                marker.on('mouseout', () => marker.closePopup());

                marker.on('click', () => {
                    this.ngZone.run(() => {
                        this.activeTruck = truck.id;
                        this.scrollToCard(truck.id);
                        this.cdr.markForCheck();
                    });
                });
                this.truckMarkers[truck.id] = marker;
            }
            this.originalMarkersArr.push(marker);

            const tripId = sourceTrip ? String(sourceTrip.id) : null;
            const startCoords = this.resolveTripStartPoint(sourceTrip);
            const endCoords = this.resolveTripEndPoint(sourceTrip);

            // Markers DEPOT/ARRIVEE persistes par tripId pour eviter le double marker
            // et le clignotement lors des refreshs GPS toutes les 15 secondes
            if (tripId && startCoords) {
                if (!this.tripStartMarkers[tripId]) {
                    const startMarker = L.marker(startCoords, { icon: this.tripPointIcon('Départ', '#16a34a') }).addTo(this.map);
                    startMarker.bindPopup(this.tripPointPopup('Point de départ', sourceTrip?.pointDepart || 'Départ', truck));
                    this.tripStartMarkers[tripId] = startMarker;
                }
            }

            if (tripId && endCoords) {
                if (!this.tripEndMarkers[tripId]) {
                    const endMarker = L.marker(endCoords, { icon: this.tripPointIcon('Arrivée', '#ef4444') }).addTo(this.map);
                    endMarker.bindPopup(this.tripPointPopup('Point d\'arrivée', sourceTrip?.destination || 'Arrivée', truck));
                    this.tripEndMarkers[tripId] = endMarker;
                }
            }

            const routeCoordinates = this.extractRouteCoordinates(sourceTrip);
            if (routeCoordinates && routeCoordinates.length > 1) {
                const shadowRoute = L.polyline(routeCoordinates, {
                    color: '#93c5fd',
                    weight: 10,
                    opacity: 0.45,
                    lineJoin: 'round',
                    lineCap: 'round'
                });

                const activeRoute = L.polyline(routeCoordinates, {
                    color: '#2563eb',
                    weight: 6,
                    opacity: 0.95,
                    lineJoin: 'round',
                    lineCap: 'round'
                });

                const routeLayer = L.layerGroup([shadowRoute, activeRoute]).addTo(this.map);
                shadowRoute.bringToFront();
                activeRoute.bringToFront();
                this.routeLines[truck.id] = routeLayer;
            }
        });

        this.fitAllMarkers();
        this.refreshWeatherForTrucks(trucks);

        this.cdr.markForCheck();
    }

    private refreshWeatherState() {
        const trucks = this.allTrucks.filter(truck => truck.coordinates);
        this.refreshWeatherForTrucks(trucks);
        this.refreshCenterWeather();
    }

    private refreshCenterWeather() {
        if (!this.map) {
            return;
        }

        const center = this.map.getCenter();
        const key = `center:${center.lat.toFixed(2)}:${center.lng.toFixed(2)}`;
        this.weatherService.getWeather(center.lat, center.lng, key).subscribe(weather => {
            this.centerWeather = weather;
            this.cdr.markForCheck();
        });
    }

    private onMapMoveEnd() {
        this.refreshCenterWeather();
    }

    private refreshWeatherForTrucks(trucks: Vehicle[]) {
        const activeIds = new Set(trucks.map(truck => truck.id));

        Object.keys(this.vehicleWeatherMarkers).forEach(vehicleId => {
            if (!activeIds.has(vehicleId)) {
                this.map?.removeLayer(this.vehicleWeatherMarkers[vehicleId]);
                delete this.vehicleWeatherMarkers[vehicleId];
            }
        });

        trucks.forEach(truck => {
            if (!truck.coordinates) {
                return;
            }

            const [lat, lng] = truck.coordinates;
            this.weatherService.getWeather(lat, lng, `vehicle:${truck.id}`).subscribe(weather => {
                this.updateVehicleWeatherMarker(truck, weather);
            });
        });
    }

    private updateVehicleWeatherMarker(truck: Vehicle, weather: WeatherInfo) {
        if (!truck.coordinates || !this.map) {
            return;
        }

        const [lat, lng] = truck.coordinates;
        const isDangerous = weather.risqueConduite === 'ROUGE';
        const weatherIcon = L.divIcon({
            className: 'empty-leaflet-div',

            iconSize: [24, 24],
            iconAnchor: [12, 12]
        });

        const weatherLatLng = [lat, lng] as L.LatLngExpression;
        let weatherMarker = this.vehicleWeatherMarkers[truck.id];
        if (weatherMarker) {
            weatherMarker.setLatLng(weatherLatLng);
            weatherMarker.setIcon(weatherIcon);
        } else {
            weatherMarker = L.marker(weatherLatLng, { icon: weatherIcon, interactive: false }).addTo(this.map);
            this.vehicleWeatherMarkers[truck.id] = weatherMarker;
        }
    }

    weatherBadgeIconName(weather: WeatherInfo | null): string {
        if (!weather) {
            return 'cloud';
        }

        switch ((weather.etatGeneral || '').toUpperCase()) {
            case 'CLAIR':
                return 'wb_sunny';
            case 'PLUIE':
                return 'water_drop';
            case 'ORAGE':
                return 'thunderstorm';
            case 'NEIGE':
                return 'ac_unit';
            case 'BROUILLARD':
                return 'air';
            case 'NUAGEUX':
            default:
                return 'cloud';
        }
    }
    private tripPointIcon(label: string, color: string): L.DivIcon {
        const isDepart = label === 'Départ';
        const icon = isDepart ? '🟢' : '🔴';
        const pulse = isDepart ? '#16a34a' : '#dc2626';
        const bg = isDepart
            ? 'linear-gradient(135deg, #166534, #16a34a)'
            : 'linear-gradient(135deg, #991b1b, #dc2626)';

        return L.divIcon({
            html: `
<div style="
    position: relative;
    display: flex;
    flex-direction: column;
    align-items: center;
    filter: drop-shadow(0 4px 12px rgba(0,0,0,0.4));
">
  <!-- PIN HEAD -->
  <div style="
      background: ${bg};
      border: 3px solid white;
      border-radius: 50% 50% 50% 0;
      transform: rotate(-45deg);
     width: 36px;
height: 36px;
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 4px 15px rgba(0,0,0,0.35), inset 0 1px 0 rgba(255,255,255,0.2);
      position: relative;
  ">
    <!-- INNER ICON (counter-rotate) -->
    <div style="
        transform: rotate(45deg);
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 14px;
        line-height: 1;
    ">${isDepart ? '🚀' : '🏁'}</div>

    <!-- PULSE RING -->
    <div style="
        position: absolute;
       width: 36px;
       height: 36px;
        border-radius: 50%;
        border: 2px solid ${pulse};
        animation: pinPulse 2s ease-out infinite;
        top: -2px;
        left: -2px;
    "></div>
  </div>

  <!-- LABEL BADGE -->
  <div style="
      background: ${bg};
      color: white;
      font-size: 10px;
      font-weight: 800;
      letter-spacing: 0.5px;
      padding: 2px 8px;
      border-radius: 10px;
      border: 2px solid white;
      margin-top: 3px;
      white-space: nowrap;
      box-shadow: 0 2px 8px rgba(0,0,0,0.3);
      text-transform: uppercase;
  ">${label}</div>
</div>

<style>
@keyframes pinPulse {
    0%   { transform: scale(1);   opacity: 0.8; }
    70%  { transform: scale(1.8); opacity: 0;   }
    100% { transform: scale(1.8); opacity: 0;   }
}
</style>
        `,
            className: 'always-visible-marker',
            iconSize: [52, 62],
            iconAnchor: [26, 58],
            popupAnchor: [0, -60]
        });
    }

    private tripPointPopup(title: string, value: string, truck: Vehicle): string {
        const isDepart = title.includes('départ');
        const accent = isDepart
            ? 'linear-gradient(135deg, #166534, #16a34a)'
            : 'linear-gradient(135deg, #991b1b, #dc2626)';
        const emoji = isDepart ? '🚀' : '🏁';
        const badgeBg = isDepart ? '#dcfce7' : '#fee2e2';
        const badgeColor = isDepart ? '#166534' : '#991b1b';

        return `
<div style="
    font-family: 'Segoe UI', sans-serif;
    min-width: 180px;
    border-radius: 12px;
    overflow: hidden;
    box-shadow: 0 8px 24px rgba(0,0,0,0.15);
">
  <!-- HEADER -->
  <div style="
      background: ${accent};
      padding: 8px 12px;
      display: flex;
      align-items: center;
      gap: 8px;
  ">
    <span style="font-size:20px;">${emoji}</span>
    <div>
      <div style="color:white; font-weight:800; font-size:13px; letter-spacing:0.3px;">${title}</div>
      <div style="color:rgba(255,255,255,0.75); font-size:10px;">${truck.name}</div>
    </div>
  </div>

  <!-- BODY -->
  <div style="padding: 10px 14px; background: white;">

    <!-- Localisation -->
    <div style="
        display:flex; align-items:flex-start; gap:8px;
        padding: 6px 0;
        border-bottom: 1px solid #f1f5f9;
    ">
      <span style="font-size:14px; margin-top:1px;">📍</span>
      <div>
        <div style="font-size:10px; color:#94a3b8; font-weight:600; text-transform:uppercase; letter-spacing:0.4px;">Localisation</div>
        <div style="font-size:12px; color:#1e293b; font-weight:600; margin-top:2px;">${value}</div>
      </div>
    </div>

    <!-- Chauffeur -->
    <div style="
        display:flex; align-items:center; gap:8px;
        padding: 6px 0;
    ">
      <span style="font-size:14px;">👤</span>
      <div>
        <div style="font-size:10px; color:#94a3b8; font-weight:600; text-transform:uppercase; letter-spacing:0.4px;">Chauffeur</div>
        <div style="font-size:12px; color:#1e293b; font-weight:600; margin-top:2px;">${truck.driver || 'N/A'}</div>
      </div>
    </div>

    <!-- Badge statut -->
    <div style="
        display: inline-flex;
        align-items: center;
        gap: 4px;
        background: ${badgeBg};
        color: ${badgeColor};
        font-size: 10px;
        font-weight: 700;
        padding: 3px 10px;
        border-radius: 20px;
        margin-top: 4px;
        text-transform: uppercase;
        letter-spacing: 0.4px;
    ">
      <span style="width:6px;height:6px;border-radius:50%;background:${badgeColor};display:inline-block;"></span>
      ${isDepart ? 'Point de départ' : 'Point d\'arrivée'}
    </div>

  </div>
</div>
    `;
    }
    private resolveTripStartPoint(trip?: TripMapItem | null): L.LatLngExpression | null {
        if (!trip) {
            return null;
        }

        // Priorité à la géométrie OSRM : le premier point de la ligne bleue
        // garantit que le marker DÉPART est exactement au début du tracé.
        if (trip.geometrieItineraire) {
            try {
                const parsed = JSON.parse(trip.geometrieItineraire);
                const geometry = parsed?.type === 'FeatureCollection'
                    ? parsed?.features?.[0]?.geometry
                    : parsed?.type === 'Feature'
                        ? parsed?.geometry
                        : parsed?.geometry ?? parsed;
                const coords = geometry?.coordinates ?? parsed?.coordinates;
                if (Array.isArray(coords) && coords.length > 0) {
                    const first = coords[0];
                    if (Array.isArray(first) && first.length >= 2) {
                        return [Number(first[1]), Number(first[0])]; // GeoJSON: [lng, lat] → [lat, lng]
                    }
                }
            } catch {
                // fallback ci-dessous
            }
        }

        // Fallback : coordonnées stockées en DB
        if (trip.latitudeDepart != null && trip.longitudeDepart != null) {
            return [trip.latitudeDepart, trip.longitudeDepart];
        }

        return null;
    }

    private resolveTripEndPoint(trip?: TripMapItem | null): L.LatLngExpression | null {
        if (!trip) {
            return null;
        }

        // Priorité à la géométrie OSRM : le dernier point de la ligne bleue
        // garantit que le marker ARRIVÉE est exactement à la fin du tracé.
        if (trip.geometrieItineraire) {
            try {
                const parsed = JSON.parse(trip.geometrieItineraire);
                const geometry = parsed?.type === 'FeatureCollection'
                    ? parsed?.features?.[0]?.geometry
                    : parsed?.type === 'Feature'
                        ? parsed?.geometry
                        : parsed?.geometry ?? parsed;
                const coords = geometry?.coordinates ?? parsed?.coordinates;
                if (Array.isArray(coords) && coords.length > 0) {
                    const last = coords[coords.length - 1];
                    if (Array.isArray(last) && last.length >= 2) {
                        return [Number(last[1]), Number(last[0])]; // GeoJSON: [lng, lat] → [lat, lng]
                    }
                }
            } catch {
                // fallback ci-dessous
            }
        }

        // Fallback : coordonnées stockées en DB
        if (trip.latitudeArrivee != null && trip.longitudeArrivee != null) {
            return [trip.latitudeArrivee, trip.longitudeArrivee];
        }

        return null;
    }

    private extractRouteCoordinates(trip?: TripMapItem | null): L.LatLngTuple[] | null {
        if (!trip?.geometrieItineraire) {
            return null;
        }

        try {
            const parsed = JSON.parse(trip.geometrieItineraire);
            const geometry = parsed?.type === 'FeatureCollection'
                ? parsed?.features?.[0]?.geometry
                : parsed?.type === 'Feature'
                    ? parsed?.geometry
                    : parsed?.geometry ?? parsed;

            const coordinates = geometry?.coordinates ?? parsed?.coordinates;
            if (!Array.isArray(coordinates) || coordinates.length < 2) {
                return null;
            }

            const route = coordinates
                .filter((pair: any) => Array.isArray(pair) && pair.length >= 2)
                .map((pair: any) => [Number(pair[1]), Number(pair[0])] as L.LatLngTuple)
                .filter((pair: L.LatLngTuple) => Number.isFinite(pair[0]) && Number.isFinite(pair[1]));

            return route.length >= 2 ? route : null;
        } catch {
            return null;
        }
    }

    private connectPauseAiRealtime() {
        this.pauseAIService.connectRealtime();

        this.pauseAlertSubscription?.unsubscribe();
        this.pauseAlertSubscription = this.pauseAIService.alert$.subscribe(alert => {
            if (!alert) {
                return;
            }
            this.ngZone.run(() => this.handlePauseAlertEvent(alert));
        });

        this.pauseStatusSubscription?.unsubscribe();
        this.pauseStatusSubscription = this.pauseAIService.pauseStatus$.subscribe(update => {
            this.ngZone.run(() => this.handlePauseStatusUpdate(update));
        });

        this.pauseGeneratedSubscription?.unsubscribe();
        this.pauseGeneratedSubscription = this.pauseAIService.pauseGenerated$.subscribe(trajetId => {
            this.ngZone.run(() => this.refreshPauseMarkersForTrip(trajetId));
        });
    }

    private refreshPauseMarkersForTrips(trips: TripMapItem[]) {
        console.log('[PauseMap] 🔄 Refresh global des pauses pour', trips.length, 'trajets');
        
        // Ne pas effacer tous les markers, au lieu charger seulement ceux manquants
        const activeTripIds = new Set(
            trips
                .filter(trip => trip.id != null && (
                    trip.statut === 'En Cours' ||
                    trip.statut === 'Actif' ||
                    trip.statut === 'ACTIF' ||
                    trip.statut === 'En cours'
                ))
                .map(trip => Number(trip.id))
        );
        
        console.log('[PauseMap] 📍 Trajets actifs:', Array.from(activeTripIds));
        
        // Supprimer les markers des trajets qui ne sont plus actifs
        const markersToRemove: number[] = [];
        this.pauseMarkersById.forEach((marker, pauseId) => {
            const trajetId = Number((marker as any).__pauseTripId);
            if (!activeTripIds.has(trajetId)) {
                markersToRemove.push(pauseId);
            }
        });
        
        markersToRemove.forEach(pauseId => {
            const marker = this.pauseMarkersById.get(pauseId);
            if (marker) {
                this.pauseLayerGroup.removeLayer(marker);
            }
            this.pauseMarkersById.delete(pauseId);
        });
        
        if (markersToRemove.length > 0) {
            console.log('[PauseMap] 🗑️ Supprimé', markersToRemove.length, 'markers de trajets inactifs');
        }
        
        // Charger les pauses pour les trajets actifs qui n'ont pas encore de markers
        const loadedTripIds = new Set<number>();
        this.pauseMarkersById.forEach((marker) => {
            const trajetId = Number((marker as any).__pauseTripId);
            loadedTripIds.add(trajetId);
        });
        
        const tripsToLoad = Array.from(activeTripIds).filter(id => !loadedTripIds.has(id));
        
        if (tripsToLoad.length > 0) {
            console.log('[PauseMap] ⬇️ Chargement des pauses pour', tripsToLoad.length, 'nouveaux trajets:', tripsToLoad);
            tripsToLoad.forEach(trajetId => this.refreshPauseMarkersForTrip(trajetId));
        } else {
            console.log('[PauseMap] ✅ Tous les trajets actifs ont déjà leurs markers');
        }
    }

    private refreshPauseMarkersForTrip(trajetId: number) {
        if (!trajetId || !this.map) {
            return;
        }

        // Vérifier si ce trajet a déjà des markers chargés
        const existingMarkers = Array.from(this.pauseMarkersById.entries())
            .filter(([, marker]) => Number((marker as any).__pauseTripId) === trajetId);
        
        if (existingMarkers.length > 0) {
            console.log('[PauseMap] ⏭️ Trajet', trajetId, 'a déjà', existingMarkers.length, 'markers, skip reload');
            return;
        }

        console.log('[PauseMap] 🔄 Chargement des pauses complètes pour trajet', trajetId);

        // Utiliser le nouvel endpoint qui retourne TOUS les points de pause
        this.pauseAIService.getPausesCompletes(trajetId).subscribe({
            next: response => {
                const stops = response.stops || [];
                console.log('[PauseMap] 📍 Stops reçus:', {
                    total: stops.length,
                    types: stops.map((s: any) => s.type).filter((t: string, i: number, arr: string[]) => arr.indexOf(t) === i),
                    sample: stops.slice(0, 3).map((s: any) => ({ type: s.type, nom: s.nomLieu }))
                });

                if (stops.length === 0) {
                    console.warn('[PauseMap] ⚠️ Aucun stop retourné, tentative de régénération');
                    this.pauseAIService.regeneratePauses(trajetId).subscribe({
                        next: regeneratedPauses => {
                            this.pauseDataByTripId.set(trajetId, regeneratedPauses);
                            this.renderPauseMarkersForTrip(trajetId, regeneratedPauses);
                            if (this.activePauseAlert?.alert.trajetId === trajetId) {
                                this.maybeShowPauseAlert(this.activePauseAlert.alert);
                            }
                        },
                        error: error => {
                            console.error('[PauseMap] ❌ Impossible de régénérer les pauses du trajet', trajetId, error);
                        }
                    });
                    return;
                }

                // Convertir les stops Flask vers le format PauseReglementaireResponse
                const pausesMapped: PauseReglementaireResponse[] = stops.map((stop: any) => ({
                    id: stop.id || Math.random(), // Générer un ID temporaire si absent
                    trajetId: trajetId,
                    latitude: stop.latitude || stop.lat,
                    longitude: stop.longitude || stop.lon,
                    type: stop.type,
                    heureArriveePlanifiee: stop.arrivalTime,
                    heureDepartPlanifiee: stop.resumeTime,
                    statut: 'PLANIFIEE',
                    nomLieu: stop.nomLieu || 'Point de pause',
                    distanceMeters: stop.distanceAlongRouteM,
                    aiScore: stop.aiScore,
                    fatigueScore: stop.fatigueScore,
                    accessibilityScore: stop.accessibilityScore,
                    contextScore: stop.contextScore,
                    reasoning: stop.reasoning,
                    confidence: stop.confidence,
                    durationSeconds: stop.durationSec
                }));

                console.log('[PauseMap] ✅ Pauses mappées:', {
                    total: pausesMapped.length,
                    types: pausesMapped.map(p => p.type).filter((t, i, arr) => arr.indexOf(t) === i)
                });

                this.pauseDataByTripId.set(trajetId, pausesMapped);
                this.renderPauseMarkersForTrip(trajetId, pausesMapped);

                if (this.activePauseAlert?.alert.trajetId === trajetId) {
                    this.maybeShowPauseAlert(this.activePauseAlert.alert);
                }
            },
            error: error => {
                console.error('[PauseMap] ❌ Impossible de charger les pauses complètes du trajet', trajetId, error);
                console.error('[PauseMap] Détail erreur:', error);
            }
        });
    }

    private renderPauseMarkersForTrip(trajetId: number, pauses: PauseReglementaireResponse[]) {
        this.removePauseMarkersForTrip(trajetId);

        pauses.forEach(pause => {
            const marker = L.marker([pause.latitude, pause.longitude], {
                icon: this.buildPauseIcon(pause, this.activePauseMarkerId === pause.id)
            }).addTo(this.pauseLayerGroup);

            (marker as any).__pauseTripId = trajetId;
            (marker as any).__pauseId = pause.id;

            const trip = this.tripCards.find(item => Number(item.id) === trajetId) || null;
            marker.bindPopup(this.buildPausePopup(pause, trip, this.activePauseMarkerId === pause.id), { closeButton: true, maxWidth: 360, minWidth: 320 });
            marker.bindTooltip(this.getPauseTooltip(pause), { direction: 'top', sticky: true });

            marker.on('popupopen', () => this.attachPausePopupActions(marker, pause, trip));
            this.pauseMarkersById.set(pause.id, marker);
        });
    }

    private removePauseMarkersForTrip(trajetId: number) {
        const pauseIdsToRemove = Array.from(this.pauseMarkersById.entries())
            .filter(([, marker]) => Number((marker as any).__pauseTripId) === trajetId)
            .map(([pauseId]) => pauseId);

        pauseIdsToRemove.forEach(pauseId => {
            const marker = this.pauseMarkersById.get(pauseId);
            if (marker) {
                this.pauseLayerGroup.removeLayer(marker);
            }
            this.pauseMarkersById.delete(pauseId);
        });
    }

    private clearPauseMarkers() {
        this.pauseMarkersById.forEach(marker => this.pauseLayerGroup.removeLayer(marker));
        this.pauseMarkersById.clear();
    }

    private setActivePauseMarker(pauseId: number | null, trajetId?: number) {
        this.activePauseMarkerId = pauseId;
        this.refreshPauseMarkerIcons(trajetId);
    }

    private refreshPauseMarkerIcons(trajetId?: number) {
        this.pauseMarkersById.forEach((marker, pauseId) => {
            if (trajetId != null && Number((marker as any).__pauseTripId) !== trajetId) {
                return;
            }

            const pause = this.pauseDataByTripId
                .get(Number((marker as any).__pauseTripId))
                ?.find(item => item.id === pauseId);

            if (pause) {
                marker.setIcon(this.buildPauseIcon(pause, this.activePauseMarkerId === pause.id));
                marker.setZIndexOffset(this.activePauseMarkerId === pause.id ? 1200 : 0);
            }
        });
    }

    private handlePauseAlertEvent(alert: PauseAIAlertEvent) {
        if (!this.shouldDisplayPauseAlert(alert)) {
            console.log('[PauseMap] Alerte IA ignorée par les règles de visibilité', alert);
            return;
        }

        this.pauseAIService.getPausesForTrajet(alert.trajetId).subscribe({
            next: pauses => {
                if (pauses.length === 0) {
                    this.pauseAIService.regeneratePauses(alert.trajetId).subscribe({
                        next: regeneratedPauses => {
                            this.pauseDataByTripId.set(alert.trajetId, regeneratedPauses);
                            this.renderPauseMarkersForTrip(alert.trajetId, regeneratedPauses);
                            this.maybeShowPauseAlert(alert);
                        },
                        error: error => {
                            console.error('[PauseMap] Impossible de régénérer les pauses avant alerte', error);
                            this.maybeShowPauseAlert(alert);
                        }
                    });
                    return;
                }

                this.pauseDataByTripId.set(alert.trajetId, pauses);
                this.renderPauseMarkersForTrip(alert.trajetId, pauses);
                this.maybeShowPauseAlert(alert);
            },
            error: error => {
                console.error('[PauseMap] Impossible de synchroniser les pauses avant l\'alerte', error);
                this.maybeShowPauseAlert(alert);
            }
        });
    }

    private handlePauseStatusUpdate(update: PauseStatusUpdateEvent) {
        console.log('[PauseMap] Statut de pause mis à jour', update);
        const pauses = this.pauseDataByTripId.get(update.trajetId) || [];
        const pause = pauses.find(item => item.id === update.pauseId);

        if (pause) {
            pause.statut = update.statut;
        }

        if (update.statut === StatutPause.ATTEINTE) {
            this.lastPauseCompletedAtByTripId.set(update.trajetId, Date.now());
            this.activePauseAlert = null;
        }

        if (update.statut === StatutPause.IGNOREE) {
            this.snoozedUntilByTripId.set(update.trajetId, Date.now() + 15 * 60 * 1000);
            this.activePauseAlert = null;
        }

        this.refreshPauseMarkersForTrip(update.trajetId);
    }

    private maybeShowPauseAlert(alert: PauseAIAlertEvent) {
        if (!this.shouldDisplayPauseAlert(alert)) {
            return;
        }

        const trip = this.tripCards.find(item => Number(item.id) === alert.trajetId) || null;

        const pause = this.findMatchingPause(alert.trajetId, alert.poi);
        const estimatedArrivalTime = this.computeEstimatedArrival(alert.trajetId, alert.poi.distance);

        console.log('[PauseMap] Affichage alerte IA', {
            trajetId: alert.trajetId,
            score: alert.score,
            typeAlerte: alert.typeAlerte,
            hoursDriving: alert.hoursDriving,
            poi: alert.poi,
            pauseCount: (this.pauseDataByTripId.get(alert.trajetId) || []).length
        });

        this.activePauseAlert = {
            alert,
            pause,
            poi: alert.poi,
            isUrgent: alert.typeAlerte === TypeAlerteIA.URGENTE || alert.score >= 85 || alert.hoursDriving >= 4.5,
            estimatedArrivalTime,
            distanceToPoiM: alert.poi.distance,
            currentPointLabel: trip?.pointDepart || 'Position actuelle',
            nextPointLabel: trip?.destination || alert.poi.name
        };
        this.cdr.markForCheck();
    }

    focusPauseAlertOnMap() {
        if (!this.activePauseAlert) {
            return;
        }

        const poi = this.activePauseAlert.poi;
        const pauseId = this.activePauseAlert.pause?.id ?? this.findMatchingPause(this.activePauseAlert.alert.trajetId, poi)?.id ?? null;
        if (pauseId != null) {
            this.setActivePauseMarker(pauseId, this.activePauseAlert.alert.trajetId);
            this.pauseMarkersById.get(pauseId)?.openPopup();
        }

        this.ngZone.runOutsideAngular(() => {
            this.map.panTo([poi.lat, poi.lon], { animate: true, duration: 0.8 });
            this.map.setZoom(Math.max(this.map.getZoom(), 13));
        });
    }

    handlePauseAlertMarkCompleted() {
        if (!this.activePauseAlert?.pause) {
            return;
        }

        const trajetId = this.activePauseAlert.alert.trajetId;
        this.pauseAIService.markPauseCompleted(trajetId, this.activePauseAlert.pause.id).subscribe({
            next: updated => {
                this.lastPauseCompletedAtByTripId.set(trajetId, Date.now());
                this.activePauseAlert = null;
                this.setActivePauseMarker(null, trajetId);
                this.refreshPauseMarkersForTrip(trajetId);
                const marker = this.pauseMarkersById.get(updated.id);
                marker?.closePopup();
            },
            error: error => console.error('[PauseMap] Impossible de marquer la pause comme effectuée', error)
        });
    }

    handlePauseAlertIgnore() {
        if (!this.activePauseAlert?.pause) {
            return;
        }

        const trajetId = this.activePauseAlert.alert.trajetId;
        this.pauseAIService.ignorePause(trajetId, this.activePauseAlert.pause.id).subscribe({
            next: updated => {
                this.snoozedUntilByTripId.set(trajetId, Date.now() + 15 * 60 * 1000);
                this.activePauseAlert = null;
                this.setActivePauseMarker(null, trajetId);
                this.refreshPauseMarkersForTrip(trajetId);
                const marker = this.pauseMarkersById.get(updated.id);
                marker?.closePopup();
            },
            error: error => console.error('[PauseMap] Impossible d\'ignorer la pause', error)
        });
    }

    regeneratePausesForActiveTrip() {
        const trajetId = this.activeTripId;
        if (!trajetId) {
            console.warn('[PauseMap] Aucun trajet actif pour régénérer les pauses');
            return;
        }
        this.pauseAIService.regeneratePauses(trajetId).subscribe({
            next: pauses => {
                this.pauseDataByTripId.set(trajetId, pauses);
                this.renderPauseMarkersForTrip(trajetId, pauses);
                console.log(`[PauseMap] ${pauses.length} pauses régénérées pour le trajet ${trajetId}`);
            },
            error: error => console.error('[PauseMap] Erreur régénération pauses', error)
        });
    }

    private shouldDisplayPauseAlert(alert: PauseAIAlertEvent): boolean {
        if (alert.hoursDriving < 3) {
            return false;
        }

        if (alert.score < 70 && alert.hoursDriving < 4.5) {
            return false;
        }

        const snoozedUntil = this.snoozedUntilByTripId.get(alert.trajetId);
        if (snoozedUntil && snoozedUntil > Date.now()) {
            return false;
        }

        const lastCompleted = this.lastPauseCompletedAtByTripId.get(alert.trajetId);
        if (lastCompleted && Date.now() - lastCompleted < 15 * 60 * 1000) {
            return false;
        }

        return true;
    }

    private findMatchingPause(trajetId: number, poi: POIInfo): PauseReglementaireResponse | null {
        const pauses = this.pauseDataByTripId.get(trajetId) || [];
        if (pauses.length === 0) {
            return null;
        }

        const targetLat = poi.lat;
        const targetLng = poi.lon;
        let bestPause: PauseReglementaireResponse | null = null;
        let bestDistance = Number.POSITIVE_INFINITY;

        pauses.forEach(pause => {
            const distance = this.haversineKm(pause.latitude, pause.longitude, targetLat, targetLng) * 1000;
            if (distance < bestDistance) {
                bestDistance = distance;
                bestPause = pause;
            }
        });

        return bestPause;
    }

    private computeEstimatedArrival(trajetId: number, distanceMeters: number): string | undefined {
        const trip = this.tripCards.find(item => Number(item.id) === trajetId);
        if (!trip) {
            return undefined;
        }

        const speedKmh = trip.vehiculeVitesse && trip.vehiculeVitesse > 0 ? trip.vehiculeVitesse : 60;
        const hours = (distanceMeters / 1000) / speedKmh;
        const eta = new Date(Date.now() + hours * 60 * 60 * 1000);
        return eta.toLocaleString('fr-FR', { hour: '2-digit', minute: '2-digit' });
    }

    private buildPauseIcon(pause: PauseReglementaireResponse, isActive: boolean = false): L.DivIcon {
        const theme = this.getPauseTheme(pause);
        const statusClass = pause.statut === StatutPause.ATTEINTE
            ? 'pause-status-done'
            : pause.statut === StatutPause.IGNOREE
                ? 'pause-status-ignored'
                : 'pause-status-planned';
        const activeClass = isActive ? 'pause-marker-shell--active' : '';
        const blinkClass = pause.type === TypePause.WARNING_ALERT && pause.statut === StatutPause.PLANIFIEE ? 'pause-warning-blink' : '';

        // Taille réduite pour mieux voir les véhicules
        const emojiSize = isActive ? '20px' : '16px';
        const iconSize = isActive ? [40, 40] : [32, 32];
        const iconAnchor = isActive ? [20, 20] : [16, 16];
        const popupAnchor = isActive ? -20 : -16;

        return L.divIcon({
            html: `
            <div class="pause-marker-shell ${statusClass} ${blinkClass} ${activeClass}" 
                 style="--pause-color:${theme.color}; border-color: ${theme.color};">
                <span class="pause-marker-emoji" style="font-size: ${emojiSize}; line-height: 1;">
                    ${theme.emoji}
                </span>
            </div>
        `,
            className: 'empty-leaflet-div',
            iconSize: iconSize as [number, number],
            iconAnchor: iconAnchor as [number, number],
            popupAnchor: [0, popupAnchor]
        });
    }
    private getPauseTheme(pause: PauseReglementaireResponse): { color: string; background: string; foreground: string; emoji: string } {
        switch (pause.type) {
            case TypePause.MANDATORY_REST:
                return { color: '#f97316', background: 'rgba(249, 115, 22, 0.28)', foreground: '#fff', emoji: '⏸️' };
            case TypePause.WARNING_ALERT:
                return { color: '#facc15', background: 'rgba(250, 204, 21, 0.28)', foreground: '#1f2937', emoji: '⏰' };
            case TypePause.STATION_SERVICE:
                return { color: '#2563eb', background: 'rgba(37, 99, 235, 0.26)', foreground: '#fff', emoji: '⛽' };
            case TypePause.KIOSK:
            case TypePause.POI:
                return { color: '#8b5e34', background: 'rgba(139, 94, 52, 0.28)', foreground: '#fff', emoji: '🍽️' };
            case TypePause.CAFE:
                return { color: '#c08457', background: 'rgba(192, 132, 87, 0.3)', foreground: '#fff', emoji: '☕' };
            case TypePause.PARKING:
                return { color: '#1d4ed8', background: 'rgba(29, 78, 216, 0.28)', foreground: '#fff', emoji: '🅿️' };
            case TypePause.REST_AREA:
            default:
                return { color: '#16a34a', background: 'rgba(22, 163, 74, 0.26)', foreground: '#fff', emoji: '🌿' };
        }
    }

    private getPauseTooltip(pause: PauseReglementaireResponse): string {
        switch (pause.type) {
            case TypePause.MANDATORY_REST: return 'Pause obligatoire';
            case TypePause.WARNING_ALERT: return 'Alerte pause dans X min';
            case TypePause.STATION_SERVICE: return 'Station-service';
            case TypePause.KIOSK:
            case TypePause.POI:
                return 'Restaurant / Café';
            case TypePause.CAFE: return 'Café';
            case TypePause.PARKING: return 'Parking poids lourds';
            case TypePause.REST_AREA: return 'Aire de repos';
            default: return pause.nomLieu || 'Point de pause';
        }
    }

    private buildPausePopup(pause: PauseReglementaireResponse, trip: TripMapItem | null, isActive: boolean = false): string {
        const name = pause.nomLieu || 'Point de pause recommandé';
        const score = Math.max(0, Math.min(100, pause.aiScore ?? 0));
        const progressColor = score >= 85 ? '#dc2626' : score >= 70 ? '#f59e0b' : '#16a34a';
        const distanceKm = pause.distanceAlongRouteM != null ? (pause.distanceAlongRouteM / 1000).toFixed(1) : 'N/A';
        const speedKmh = trip?.vehiculeVitesse && trip.vehiculeVitesse > 0 ? trip.vehiculeVitesse : 60;
        const etaMinutes = pause.distanceAlongRouteM != null ? Math.round(((pause.distanceAlongRouteM / 1000) / speedKmh) * 60) : null;
        const etaText = etaMinutes != null ? `${etaMinutes} min` : 'N/A';
        const statusText = pause.statut === StatutPause.ATTEINTE ? 'Effectuée' : pause.statut === StatutPause.IGNOREE ? 'Ignorée' : 'Planifiée';

        return `
            <div class="pause-popup-card" data-pause-id="${pause.id}" data-pause-active="${isActive}">
                <div class="pause-popup-head">
                    <strong>${name}</strong>
                    <span>${this.getPauseTooltip(pause)}</span>
                </div>
                <div class="pause-popup-meta">Statut: ${statusText}</div>
                <div class="pause-popup-meta">Distance: ${distanceKm} km</div>
                <div class="pause-popup-score">
                    <div class="pause-popup-score-bar"><div class="pause-popup-score-fill" style="width:${score}%;background:${progressColor};"></div></div>
                    <div class="pause-popup-score-value">Score IA ${score}/100</div>
                </div>
                <div class="pause-popup-amenities">
                    <span title="Accès poids lourds">🚚 ${pause.type === TypePause.PARKING || pause.type === TypePause.STATION_SERVICE ? '✅' : '❌'}</span>
                    <span title="Douche">🚿 ${pause.type === TypePause.REST_AREA || pause.type === TypePause.STATION_SERVICE ? '✅' : '❌'}</span>
                    <span title="Sanitaires">🚻 ${pause.type !== TypePause.PARKING ? '✅' : '❌'}</span>
                    <span title="Ouvert 24h">🕛 ${pause.type === TypePause.STATION_SERVICE || pause.type === TypePause.PARKING ? '✅' : '❌'}</span>
                    <span title="Carburant">⛽ ${pause.type === TypePause.STATION_SERVICE ? '✅' : '❌'}</span>
                </div>
                <div class="pause-popup-meta">Arrivée estimée: ${etaText}</div>
                <div class="pause-popup-actions">
                    <button type="button" class="pause-popup-btn pause-popup-primary" data-action="complete">Marquer comme effectuée</button>
                    <button type="button" class="pause-popup-btn pause-popup-secondary" data-action="ignore">Ignorer ce point</button>
                </div>
            </div>
        `;
    }

    private attachPausePopupActions(marker: L.Marker, pause: PauseReglementaireResponse, trip: TripMapItem | null) {
        const popupElement = marker.getPopup()?.getElement();
        if (!popupElement) {
            return;
        }

        const completeButton = popupElement.querySelector('[data-action="complete"]');
        const ignoreButton = popupElement.querySelector('[data-action="ignore"]');

        completeButton?.addEventListener('click', () => {
            if (!trip?.id) {
                return;
            }
            this.pauseAIService.markPauseCompleted(Number(trip.id), pause.id).subscribe({
                next: updated => {
                    this.lastPauseCompletedAtByTripId.set(Number(trip.id), Date.now());
                    this.activePauseAlert = null;
                    marker.setIcon(this.buildPauseIcon(updated));
                    marker.setPopupContent(this.buildPausePopup(updated, trip, this.activePauseMarkerId === updated.id));
                    marker.closePopup();
                },
                error: error => console.error('[PauseMap] Erreur marquage pause effectuée', error)
            });
        });

        ignoreButton?.addEventListener('click', () => {
            if (!trip?.id) {
                return;
            }
            this.pauseAIService.ignorePause(Number(trip.id), pause.id).subscribe({
                next: updated => {
                    this.snoozedUntilByTripId.set(Number(trip.id), Date.now() + 15 * 60 * 1000);
                    this.activePauseAlert = null;
                    marker.setIcon(this.buildPauseIcon(updated));
                    marker.setPopupContent(this.buildPausePopup(updated, trip, this.activePauseMarkerId === updated.id));
                    marker.closePopup();
                },
                error: error => console.error('[PauseMap] Erreur ignorée pause', error)
            });
        });
    }

    // Removed straight mock lines

    private addPOIs() {
        const createPoiIcon = (icon: string, color: string) => L.divIcon({
            html: `<div class="poi-marker" style="background: ${color}; color: white; display: flex; align-items: center; justify-content: center; width: 30px; height: 30px; border-radius: 50%; box-shadow: 0 2px 8px rgba(0,0,0,0.3);">
              <i class="material-icons" style="font-size: 16px;">${icon}</i>
            </div>`,
            className: 'empty-leaflet-div',
            iconSize: [30, 30],
            iconAnchor: [15, 15]
        });

        // const gasIcon = createPoiIcon('local_gas_station', '#3b82f6');
        // const restIcon = createPoiIcon('local_parking', '#10b981');
        // const foodIcon = createPoiIcon('restaurant', '#f59e0b');
        // const scaleIcon = createPoiIcon('balance', '#8b5cf6');

        // L.marker([36.8120, 10.1750], { icon: gasIcon }).addTo(this.poiLayers['gas']);
        // L.marker([36.4500, 10.7300], { icon: restIcon }).addTo(this.poiLayers['rest']);
        // L.marker([35.8200, 10.6400], { icon: foodIcon }).addTo(this.poiLayers['food']);
        // L.marker([34.7400, 10.7600], { icon: scaleIcon }).addTo(this.poiLayers['scale']);
    }

    updateStyle() {
        this.ngZone.runOutsideAngular(() => {
            Object.values(this.baseLayers).forEach(layer => this.map.removeLayer(layer));
            this.baseLayers[this.mapStyle].addTo(this.map);
        });
    }


    selectTruck(id: string) {
        this.activeTruck = id;
        this.cdr.markForCheck();

        const marker = this.truckMarkers[id];
        if (marker) {
            this.ngZone.runOutsideAngular(() => {
                this.map.panTo(marker.getLatLng(), { animate: true, duration: 0.8 });
                marker.openPopup();
            });
        }

        const trajetId = this.activeTripId;
        if (trajetId) {
            this.refreshPauseMarkersForTrip(trajetId);
        }
    }

    private scrollToCard(id: string) {
        if (typeof document !== 'undefined') {
            const cardEl = document.getElementById(`truck-card-${id}`);
            if (cardEl) {
                cardEl.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
            }
        }

        // Ensure sidebar is open if clicking a marker
        if (window.innerWidth < 768) {
            this.showMobileSidebar = true;
        } else {
            this.showSidebar = true;
        }
        this.cdr.markForCheck();
    }

    get totalAlerts() {
        return this.allTrucks.filter(t => t.hasAlert).length;
    }

    handlePoiToggle(event: { type: string, checked: boolean }) {
        this.ngZone.runOutsideAngular(() => {
            if (event.type === 'roads') {
                this.showRoads = event.checked;
                Object.values(this.routeLines).forEach(route => {
                    if (event.checked) {
                        route.addTo(this.map);
                    } else if (this.map.hasLayer(route)) {
                        this.map.removeLayer(route);
                    }
                });
                this.cdr.markForCheck();
                return;
            }

            if (event.checked) {
                this.poiLayers[event.type]?.addTo(this.map);
            } else {
                this.map.removeLayer(this.poiLayers[event.type]);
            }
        });
    }

    handleFollowToggle(checked: boolean) {
        this.followTruck = checked;
        this.cdr.markForCheck();
    }

    get activeTruckData() {
        return this.allTrucks.find(t => t.id === this.activeTruck);
    }

    get activeTripId(): number | null {
        const truck = this.activeTruckData;
        if (!truck) return null;
        const trip = this.tripCards.find(t =>
            String(t.vehiculeId ?? '') === truck.id || t.vehiculeMatricule === truck.name
        );
        return trip ? Number(trip.id) : null;
    }

    handlePrint() { window.print(); }
    handleShare() { alert("Lien de partage copié dans le presse-papier !"); }
    goBack() { this.router.navigate(['/dashboard']); }
    goHome() { this.router.navigate(['/dashboard']); }

    // --- REUSABLE TOAST SYSTEM ---
    private showToast(message: string, duration: number = 3000) {
        this.ngZone.run(() => {
            this.toastMessage = message;
            this.toastVisible = true;
            this.cdr.markForCheck();
            if (this.toastTimeout) clearTimeout(this.toastTimeout);
            this.toastTimeout = setTimeout(() => {
                this.toastVisible = false;
                this.cdr.markForCheck();
                setTimeout(() => {
                    if (!this.toastVisible) this.toastMessage = null;
                    this.cdr.markForCheck();
                }, 300);
            }, duration);
        });
    }

    // --- FEATURE 1: MY LOCATION ---
    locateUser() {
        if (!navigator.geolocation) {
            this.showToast("La géolocalisation n'est pas supportée par votre navigateur.");
            return;
        }
        this.isLocating = true;
        this.cdr.markForCheck();
        navigator.geolocation.getCurrentPosition(
            (position) => {
                this.ngZone.run(() => {
                    this.isLocating = false;
                    this.cdr.markForCheck();
                    const lat = position.coords.latitude;
                    const lng = position.coords.longitude;
                    this.map.panTo([lat, lng], { animate: true, duration: 1.2 });
                    if (this.locMarker) this.map.removeLayer(this.locMarker);
                    if (this.locCircle) this.map.removeLayer(this.locCircle);
                    const pulseIcon = L.divIcon({
                        className: 'empty-leaflet-div',
                        html: `<div class="pulse-marker"></div>`,
                        iconSize: [20, 20],
                        iconAnchor: [10, 10]
                    });
                    this.locMarker = L.marker([lat, lng], { icon: pulseIcon }).addTo(this.map);
                    this.locCircle = L.circle([lat, lng], { radius: position.coords.accuracy, color: '#3b82f6', fillColor: '#3b82f6', fillOpacity: 0.15, weight: 1 }).addTo(this.map);
                    this.showToast("Localisation réussie ✓");
                });
            },
            () => {
                this.ngZone.run(() => {
                    this.isLocating = false;
                    this.showToast("Accès à la localisation refusé.");
                    this.cdr.markForCheck();
                });
            },
            { enableHighAccuracy: true }
        );
    }

    // --- FEATURE 2: FULLSCREEN ---
    toggleFullscreen() {
        const elem = document.querySelector('.map-container-wrapper') as any;
        if (!elem) return;
        if (!document.fullscreenElement) {
            (elem.requestFullscreen || elem.webkitRequestFullscreen || elem.msRequestFullscreen || (() => { })).call(elem);
        } else {
            (document.exitFullscreen || (document as any).webkitExitFullscreen || (document as any).msExitFullscreen || (() => { })).call(document);
        }
    }

    // --- FEATURE 3: ZOOM TO FIT ---
    fitAllMarkers() {
        const markers = Object.values(this.truckMarkers);
        if (markers.length === 0) { this.showToast("Aucun véhicule sur la carte."); return; }
        if (this.initialAutoFitDone) {
            return;
        }

        if (markers.length === 1) {
            this.map.setView(markers[0].getLatLng(), this.map.getZoom(), { animate: true });
        } else {
            const bounds = L.featureGroup(markers).getBounds();
            if (bounds?.isValid?.()) {
                this.map.fitBounds(bounds, { padding: [40, 40], animate: true, maxZoom: this.map.getZoom() });
            }
        }
        this.initialAutoFitDone = true;
    }

    // --- FEATURE 4: COMPASS RESET ---
    resetCompass() {
        this.map.flyTo(this.map.getCenter(), this.map.getZoom(), { animate: true });
        this.showToast("Vue réinitialisée");
    }

    // --- FEATURE 6 & 7: TRAFFIC ROUTE & DISTANCE ---
    toggleRouteLayer() {
        this.isRouteLayerActive = !this.isRouteLayerActive;
        this.cdr.markForCheck();
        if (this.isRouteLayerActive) {
            const activeRoute = this.routeLines[this.activeTruck] as any;
            if (!activeRoute) {
                this.showToast("Aucun itinéraire OSRM disponible pour le véhicule actif.");
                this.isRouteLayerActive = false;
                this.cdr.markForCheck();
                return;
            }

            if (!this.map.hasLayer(activeRoute)) {
                activeRoute.addTo(this.map);
            }
            this.showToast("Itinéraire OSRM affiché");
        } else {
            if (this.dynamicRouteLine) { this.map.removeLayer(this.dynamicRouteLine); this.dynamicRouteLine = null; }
            if (this.distanceTooltip) { this.map.removeLayer(this.distanceTooltip); this.distanceTooltip = null; }

            const activeRoute = this.routeLines[this.activeTruck] as any;
            if (activeRoute && this.map.hasLayer(activeRoute)) {
                this.map.removeLayer(activeRoute);
            }
        }
    }

    // --- FEATURE 8: CLUSTER SIMULATION ---
    toggleCluster() {
        this.isClusterActive = !this.isClusterActive;
        this.cdr.markForCheck();
        if (this.isClusterActive) {
            this.updateClusters();
            this.map.on('moveend zoomend', this.updateClusters, this);
            this.showToast("Regroupement activé");
        } else {
            this.map.off('moveend zoomend', this.updateClusters, this);
            this.restoreMarkers();
            this.showToast("Regroupement désactivé");
        }
    }

    private updateClusters() {
        if (!this.isClusterActive || this.originalMarkersArr.length < 2) return;
        const [m1, m2] = this.originalMarkersArr;
        const p1 = this.map.latLngToLayerPoint(m1.getLatLng());
        const p2 = this.map.latLngToLayerPoint(m2.getLatLng());
        const distPx = Math.hypot(p1.x - p2.x, p1.y - p2.y);
        if (distPx < 60) {
            if (this.map.hasLayer(m1)) this.map.removeLayer(m1);
            if (this.map.hasLayer(m2)) this.map.removeLayer(m2);
            if (!this.simulatedClusterMarker) {
                const mid = L.latLng((m1.getLatLng().lat + m2.getLatLng().lat) / 2, (m1.getLatLng().lng + m2.getLatLng().lng) / 2);
                this.simulatedClusterMarker = L.marker(mid, {
                    icon: L.divIcon({
                        className: 'empty-leaflet-div',
                        html: `<div class="simulate-cluster-badge">2</div>`,
                        iconSize: [40, 40], iconAnchor: [20, 20]
                    })
                }).addTo(this.map);
                this.simulatedClusterMarker.on('click', () => {
                    this.map.panTo(mid, { animate: true });
                });
            }
        } else {
            this.restoreMarkers();
        }
    }

    private restoreMarkers() {
        if (this.simulatedClusterMarker) { this.map.removeLayer(this.simulatedClusterMarker); this.simulatedClusterMarker = null; }
        this.originalMarkersArr.forEach(m => { if (!this.map.hasLayer(m)) m.addTo(this.map); });
    }
}

