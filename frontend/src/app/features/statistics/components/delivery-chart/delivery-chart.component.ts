import { Component, OnInit, AfterViewInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { forkJoin } from 'rxjs';
import { BaseChartDirective } from 'ng2-charts';
import { ChartConfiguration, ChartType } from 'chart.js';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import * as L from 'leaflet';
import { FleetService, Trip, Vehicle } from '../../../../core/services/fleet.service';

/* ════ Interfaces Intelligentes ════════════════════════════════ */
interface OptStat {
    type: string;
    count: number;
    avgDist: number;
    avgDelay: number;
    avgDureeReelle: number;
    onTimeRate: number;
}

interface DriverStat {
    id: string;
    name: string;
    count: number;
    totalDist: number;
    avgDuration: number;
    onTimeRate: number;
    isTopPerformer: boolean;
}

interface VehicleStat {
    id: string;
    plate: string;
    model?: string;
    brand?: string;
    count: number;
    totalKm: number;
    totalCharge: number;
    avgDuration: number;
    isMostUsed: boolean;
}

interface DelayBucket {
    label: string;
    value: number;
    color: string;
}

interface DestinationStat {
    name: string;
    count: number;
    avgDist: number;
    avgDelay: number;
}

interface Prediction {
    nextWeekTrips: number;
    nextWeekDistance: number;
    topDestinations: string[];
    delayRisk: 'Faible' | 'Moyen' | 'Élevé';
}

interface SmartAlert {
    icon: string;
    message: string;
    severity: 'warning' | 'danger' | 'info';
}

interface LogisticsHealthScore {
    score: number;
    label: string;
    color: string;
    breakdown: { label: string; value: number; max: number }[];
}

@Component({
    selector: 'app-delivery-chart',
    standalone: true,
    imports: [
        CommonModule,
        FormsModule,
        BaseChartDirective,
        MatCardModule,
        MatIconModule,
        MatTableModule,
        MatPaginatorModule
    ],
    templateUrl: './delivery-chart.component.html',
    styleUrls: ['./delivery-chart.component.css']
})
export class DeliveryChartComponent implements OnInit, AfterViewInit, OnDestroy {
    /* ─── Raw & Filtered Data ────────────────────────── */
    allTrips: Trip[] = [];
    allVehicles: Vehicle[] = [];
    private vehicleLUT = new Map<string, Vehicle>();
    filteredTrips: Trip[] = [];
    paginatedTrips: Trip[] = [];

    /* ─── KPI Counters ───────────────────────────────── */
    kpiTotalTrips = 0;
    kpiTotalDistance = 0;
    kpiAvgDuration = 0;
    kpiOnTimeRate = 100;
    kpiCompletionRate = 100;
    kpiActiveRate = 0;
    kpiScoreGlobal = 0;

    /* ─── Trends (calculées depuis les données) ──────── */
    trendTotal = 0;
    trendDistance = 0;
    trendDuration = 0;
    trendOnTime = 0;

    /* ─── Filters ────────────────────────────────────── */
    filterSearch = '';
    filterOptType = '';
    filterStatus = '';
    filterDateFrom = '';
    filterDateTo = '';
    mapShowAllDestinations = true;
    temporalGranularity: 'day' | 'week' | 'month' = 'week';

    /* ─── Chart / Row click filter ──────────────────── */
    chartFilter: { type: string; value: string; predicate: (t: Trip) => boolean } | null = null;

    /* ─── Sub-stats & Indicators ────────────────────── */
    optStats: OptStat[] = [];
    driverStats: DriverStat[] = [];
    vehicleStats: VehicleStat[] = [];
    delayBuckets: DelayBucket[] = [];
    destinationStats: DestinationStat[] = [];
    topDestination = '';
    leastDestination = '';

    shortestTrip: Trip | null = null;
    longestTrip: Trip | null = null;
    fastestTrip: Trip | null = null;
    mostDelayedTrip: Trip | null = null;

    /* ─── Alertes & Prédictions ─────────────────────── */
    smartAlerts: SmartAlert[] = [];
    predictions: Prediction | null = null;

    /* ─── Paginator State ────────────────────────────── */
    tripPageIndex = 0;
    tripPageSize = 5;
    tripTotalElements = 0;
    displayedColumns: string[] = [
        'date', 'arrivee', 'arriveeReelle', 'origin', 'destination',
        'vehicle', 'driver', 'distance', 'optimization', 'status', 'performance', 'score'
    ];

    /* ─── Charts State ───────────────────────────────── */
    readonly evolutionType: ChartType = 'line';
    evolutionData: ChartConfiguration['data'] = { labels: [], datasets: [] };
    evolutionOptions: any = {};

    readonly donutType: ChartType = 'doughnut';
    donutData: ChartConfiguration['data'] = { labels: [], datasets: [] };
    donutOptions: any = {};

    readonly delayType: ChartType = 'doughnut';
    delayData: ChartConfiguration['data'] = { labels: [], datasets: [] };
    delayOptions: any = {};

    readonly areaType: ChartType = 'line';
    temporalData: ChartConfiguration['data'] = { labels: [], datasets: [] };
    temporalOptions: any = {};

    /* ─── Template helpers ──────────────────────────── */
    readonly Math = Math;

    get avgGlobalDistance(): number {
        if (this.destinationStats.length === 0) return 0;
        const total = this.destinationStats.reduce((s, d) => s + d.avgDist, 0);
        return Math.round(total / this.destinationStats.length);
    }

    /* ─── Leaflet Map State ──────────────────────────── */
    private map: L.Map | null = null;
    private mapLayers: L.Layer[] = [];

    constructor(
        private readonly fleetService: FleetService,
        private readonly cdr: ChangeDetectorRef
    ) { }

    ngOnInit(): void {
        this.loadTrips();
    }

    ngAfterViewInit(): void {
        setTimeout(() => this.initMap(), 300);
    }

    ngOnDestroy(): void {
        this.destroyMap();
    }

    /* ═══════════════════════════════════════════════════
       DATA LOADING & REFRESH
       ═══════════════════════════════════════════════════ */
    private loadTrips(): void {
        forkJoin({
            trips: this.fleetService.getTrips(),
            vehicles: this.fleetService.getVehicles()
        }).subscribe({
            next: ({ trips, vehicles }) => {
                this.allTrips = trips || [];
                this.allVehicles = vehicles || [];
                this.vehicleLUT.clear();
                for (const v of this.allVehicles) {
                    if (v.id) this.vehicleLUT.set(v.id, v);
                }
                this.refreshAll();
            },
            error: () => {
                this.allTrips = [];
                this.allVehicles = [];
                this.vehicleLUT.clear();
                this.refreshAll();
            }
        });
    }

    public refreshAll(): void {
        this.applyFilters();
        this.computeKpis();
        this.computeTrends();
        this.computeSubStats();
        this.computeDriverStats();
        this.computeVehicleStats();
        this.computeDelayBuckets();
        this.computeDestinationStats();
        this.computeSmartAlerts();
        this.computePredictions();
        this.computeHealthScore();
        this.buildCharts();
        this.renderMap();
        this.paginateTrips();
        this.cdr.detectChanges();
    }

    private applyFilters(): void {
        const search = this.filterSearch.toLowerCase().trim();
        this.filteredTrips = this.allTrips.filter(t => {
            if (search) {
                const termMatch = (t.from || '').toLowerCase().includes(search) ||
                    (t.to || '').toLowerCase().includes(search) ||
                    (t.vehicle || '').toLowerCase().includes(search) ||
                    (t.driver || '').toLowerCase().includes(search);
                if (!termMatch) return false;
            }
            if (this.filterOptType) {
                if (this.getTripOptimizationType(t) !== this.filterOptType) return false;
            }
            if (this.filterStatus) {
                if (t.status !== this.filterStatus) return false;
            }
            const dateStr = t.dateDepartIso || t.date;
            if (dateStr) {
                const dateVal = new Date(dateStr);
                if (!isNaN(dateVal.getTime())) {
                    if (this.filterDateFrom) {
                        const fromDate = new Date(this.filterDateFrom);
                        fromDate.setHours(0, 0, 0, 0);
                        if (dateVal < fromDate) return false;
                    }
                    if (this.filterDateTo) {
                        const toDate = new Date(this.filterDateTo);
                        toDate.setHours(23, 59, 59, 999);
                        if (dateVal > toDate) return false;
                    }
                }
            }
            if (this.chartFilter?.predicate) {
                if (!this.chartFilter.predicate(t)) return false;
            }
            return true;
        });
    }

    /* ═══════════════════════════════════════════════════
       KPIs INTELLIGENTS (100% data-driven)
       ═══════════════════════════════════════════════════ */
    private computeKpis(): void {
        this.kpiTotalTrips = this.filteredTrips.length;
        this.kpiTotalDistance = Math.round(this.filteredTrips.reduce((sum, t) => sum + (t.distanceKm || 0), 0) * 10) / 10;

        // Durée moyenne réelle
        let totalMinutes = 0;
        let countWithDuration = 0;
        this.filteredTrips.forEach(t => {
            let mins = t.dureeReelleMinutes;
            if (mins == null && t.dateDepartIso && t.dateArriveeIso) {
                const start = new Date(t.dateDepartIso).getTime();
                const end = new Date(t.dateArriveeIso).getTime();
                if (!isNaN(start) && !isNaN(end)) {
                    mins = Math.floor((end - start) / (1000 * 60));
                }
            }
            if (mins != null && mins > 0) {
                totalMinutes += mins;
                countWithDuration++;
            }
        });
        this.kpiAvgDuration = countWithDuration > 0 ? Math.round(totalMinutes / countWithDuration) : 0;

        // Taux de ponctualité : dateArriveeReelle <= dateArrivee
        const completed = this.filteredTrips.filter(t => t.status === 'Terminé');
        const onTime = completed.filter(t => {
            if (t.retardMinutes != null) return t.retardMinutes <= 5;
            return true;
        });
        this.kpiOnTimeRate = completed.length > 0 ? Math.round((onTime.length / completed.length) * 100) : 100;

        // Taux de complétion : COMPLETE / Total
        const completeCount = this.filteredTrips.filter(t =>
            t.status === 'Terminé' || t.status === 'Complété'
        ).length;
        this.kpiCompletionRate = this.kpiTotalTrips > 0
            ? Math.round((completeCount / this.kpiTotalTrips) * 100)
            : 100;

        // Taux de trajets actifs : (EN_COURS + ACTIF) / Total
        const activeCount = this.filteredTrips.filter(t =>
            t.status === 'En Cours' || t.status === 'Actif'
        ).length;
        this.kpiActiveRate = this.kpiTotalTrips > 0
            ? Math.round((activeCount / this.kpiTotalTrips) * 100)
            : 0;
    }

    /* ── Trends (comparaison moitié récente vs moitié ancienne) ── */
    private computeTrends(): void {
        const total = this.filteredTrips.length;
        if (total < 2) { this.trendTotal = 0; this.trendDistance = 0; this.trendDuration = 0; this.trendOnTime = 0; return; }

        const mid = Math.floor(total / 2);
        const firstHalf = this.filteredTrips.slice(0, mid);
        const secondHalf = this.filteredTrips.slice(mid);

        const safeTrend = (cur: number, prev: number) => {
            if (prev === 0) return cur > 0 ? 100 : 0;
            return Math.round(((cur - prev) / prev) * 100);
        };

        this.trendTotal = safeTrend(secondHalf.length, firstHalf.length);

        const d1 = firstHalf.reduce((s, t) => s + (t.distanceKm || 0), 0);
        const d2 = secondHalf.reduce((s, t) => s + (t.distanceKm || 0), 0);
        this.trendDistance = safeTrend(d2, d1);

        const avgDur = (arr: Trip[]) => {
            const valid = arr.filter(t => t.dureeReelleMinutes != null && t.dureeReelleMinutes > 0);
            return valid.length > 0 ? valid.reduce((s, t) => s + (t.dureeReelleMinutes || 0), 0) / valid.length : 0;
        };
        this.trendDuration = safeTrend(avgDur(secondHalf), avgDur(firstHalf));

        const onTimeRate = (arr: Trip[]) => {
            const comp = arr.filter(t => t.status === 'Terminé');
            const ot = comp.filter(t => (t.retardMinutes || 0) <= 5);
            return comp.length > 0 ? (ot.length / comp.length) * 100 : 100;
        };
        this.trendOnTime = safeTrend(onTimeRate(secondHalf), onTimeRate(firstHalf));
    }

    /* ═══════════════════════════════════════════════════
       SUB-STATS : Optimisations & Extrêmes
       ═══════════════════════════════════════════════════ */
    private computeSubStats(): void {
        const optTypes = ['Rapide', 'Économique', 'Écologique'];
        this.optStats = optTypes.map(type => {
            const tripsOfType = this.filteredTrips.filter(t => this.getTripOptimizationType(t) === type);
            const count = tripsOfType.length;
            const totalDist = tripsOfType.reduce((sum, t) => sum + (t.distanceKm || 0), 0);
            const avgDist = count > 0 ? Math.round((totalDist / count) * 10) / 10 : 0;
            const completed = tripsOfType.filter(t => t.status === 'Terminé');
            const totalDelay = completed.reduce((sum, t) => sum + (t.retardMinutes || 0), 0);
            const avgDelay = completed.length > 0 ? Math.round(totalDelay / completed.length) : 0;
            const totalDur = tripsOfType.reduce((sum, t) => sum + (t.dureeReelleMinutes || 0), 0);
            const avgDuree = count > 0 ? Math.round(totalDur / count) : 0;
            const onTimeCount = completed.filter(t => (t.retardMinutes || 0) <= 5).length;
            const onTimeRate = completed.length > 0 ? Math.round((onTimeCount / completed.length) * 100) : 0;

            return { type, count, avgDist, avgDelay, avgDureeReelle: avgDuree, onTimeRate };
        });

        // Identification automatique des meilleures optimisations
        // (accessible via les templates avec *ngIf)

        // Trajets extrêmes (distance)
        const validTrips = this.filteredTrips.filter(t => t.distanceKm && t.distanceKm > 0);
        if (validTrips.length > 0) {
            const sorted = [...validTrips].sort((a, b) => (a.distanceKm || 0) - (b.distanceKm || 0));
            this.shortestTrip = sorted[0];
            this.longestTrip = sorted[sorted.length - 1];
        } else {
            this.shortestTrip = null;
            this.longestTrip = null;
        }

        // Trajet le plus rapide (durée réelle la plus courte pour les Terminé)
        const completedWithDur = this.filteredTrips.filter(t =>
            t.status === 'Terminé' && t.dureeReelleMinutes != null && t.dureeReelleMinutes > 0
        );
        if (completedWithDur.length > 0) {
            const sortedDur = [...completedWithDur].sort((a, b) =>
                (a.dureeReelleMinutes || 0) - (b.dureeReelleMinutes || 0)
            );
            this.fastestTrip = sortedDur[0];
        } else {
            this.fastestTrip = null;
        }

        // Trajet le plus retardé
        const withDelay = this.filteredTrips.filter(t => t.retardMinutes != null && t.retardMinutes > 0);
        if (withDelay.length > 0) {
            const sortedDelay = [...withDelay].sort((a, b) => (b.retardMinutes || 0) - (a.retardMinutes || 0));
            this.mostDelayedTrip = sortedDelay[0];
        } else {
            this.mostDelayedTrip = null;
        }
    }

    /* ═══════════════════════════════════════════════════
       ANALYSE CHAUFFEURS (100% data-driven)
       ═══════════════════════════════════════════════════ */
    private computeDriverStats(): void {
        const driverMap = new Map<string, {
            name: string; count: number; totalDist: number; totalDur: number;
            completedCount: number; onTimeCount: number
        }>();

        this.filteredTrips.forEach(t => {
            const id = t.driverId || t.driver || 'Inconnu';
            const existing = driverMap.get(id);
            const displayName = t.chauffeurNom || t.driver || id;
            const isCompleted = t.status === 'Terminé';
            const isOnTime = isCompleted && (t.retardMinutes || 0) <= 5;

            if (existing) {
                existing.count++;
                existing.totalDist += t.distanceKm || 0;
                existing.totalDur += t.dureeReelleMinutes || 0;
                if (isCompleted) existing.completedCount++;
                if (isOnTime) existing.onTimeCount++;
            } else {
                driverMap.set(id, {
                    name: displayName,
                    count: 1,
                    totalDist: t.distanceKm || 0,
                    totalDur: t.dureeReelleMinutes || 0,
                    completedCount: isCompleted ? 1 : 0,
                    onTimeCount: isOnTime ? 1 : 0
                });
            }
        });

        const stats = Array.from(driverMap, ([id, s]) => ({
            id,
            name: s.name,
            count: s.count,
            totalDist: Math.round(s.totalDist),
            avgDuration: s.count > 0 ? Math.round(s.totalDur / s.count) : 0,
            onTimeRate: s.completedCount > 0 ? Math.round((s.onTimeCount / s.completedCount) * 100) : 0,
            isTopPerformer: false
        })).sort((a, b) => b.onTimeRate - a.onTimeRate || b.count - a.count);

        // Top performer badge
        if (stats.length > 0) stats[0].isTopPerformer = true;

        this.driverStats = stats;
    }

    /* ═══════════════════════════════════════════════════
       ANALYSE VÉHICULES (100% data-driven)
       ═══════════════════════════════════════════════════ */
    private computeVehicleStats(): void {
        const vehicleMap = new Map<string, {
            plate: string; model?: string; brand?: string; count: number; totalKm: number; totalDur: number
        }>();

        this.filteredTrips.forEach(t => {
            const id = t.vehicleId || t.vehicle || 'Inconnu';
            const existing = vehicleMap.get(id);
            let vehModel: string | undefined;
            let vehBrand: string | undefined;
            const veh = this.vehicleLUT.get(id);
            if (veh) { vehModel = veh.model; vehBrand = veh.brand; }
            if (existing) {
                existing.count++;
                existing.totalKm += t.distanceKm || 0;
                existing.totalDur += t.dureeReelleMinutes || 0;
            } else {
                vehicleMap.set(id, {
                    plate: t.vehicle || id,
                    model: vehModel,
                    brand: vehBrand,
                    count: 1,
                    totalKm: t.distanceKm || 0,
                    totalDur: t.dureeReelleMinutes || 0
                });
            }
        });

        const maxCount = Math.max(...Array.from(vehicleMap.values()).map(v => v.count), 1);

        const stats = Array.from(vehicleMap, ([id, s]) => ({
            id,
            plate: s.plate,
            model: s.model,
            brand: s.brand,
            count: s.count,
            totalKm: Math.round(s.totalKm),
            totalCharge: 0,
            avgDuration: s.count > 0 ? Math.round(s.totalDur / s.count) : 0,
            isMostUsed: s.count >= maxCount
        })).sort((a, b) => b.count - a.count);

        this.vehicleStats = stats;
    }

    /* ═══════════════════════════════════════════════════
       ANALYSE RETARDS
       ═══════════════════════════════════════════════════ */
    private computeDelayBuckets(): void {
        let onTime = 0;
        let slight = 0;
        let medium = 0;
        let critical = 0;

        this.filteredTrips.forEach(t => {
            const delay = t.retardMinutes ?? 0;
            if (delay <= 5) onTime++;
            else if (delay <= 15) slight++;
            else if (delay <= 60) medium++;
            else critical++;
        });

        this.delayBuckets = [
            { label: 'À l\'heure', value: onTime, color: 'rgba(16,185,129,0.8)' },
            { label: 'Retard léger', value: slight, color: 'rgba(245,158,11,0.8)' },
            { label: 'Retard moyen', value: medium, color: 'rgba(249,115,22,0.8)' },
            { label: 'Retard critique', value: critical, color: 'rgba(239,68,68,0.8)' }
        ];
    }

    /* ═══════════════════════════════════════════════════
       ANALYSE DESTINATIONS
       ═══════════════════════════════════════════════════ */
    private computeDestinationStats(): void {
        const destMap = new Map<string, { count: number; totalDist: number; totalDelay: number }>();

        this.filteredTrips.forEach(t => {
            const dest = t.to || 'Inconnue';
            const existing = destMap.get(dest);
            if (existing) {
                existing.count++;
                existing.totalDist += t.distanceKm || 0;
                existing.totalDelay += t.retardMinutes || 0;
            } else {
                destMap.set(dest, {
                    count: 1,
                    totalDist: t.distanceKm || 0,
                    totalDelay: t.retardMinutes || 0
                });
            }
        });

        const sorted = Array.from(destMap, ([name, s]) => ({
            name,
            count: s.count,
            avgDist: s.count > 0 ? Math.round(s.totalDist / s.count) : 0,
            avgDelay: s.count > 0 ? Math.round(s.totalDelay / s.count) : 0
        })).sort((a, b) => b.count - a.count);

        this.destinationStats = sorted;
        this.topDestination = sorted.length > 0 ? sorted[0].name : '—';
        this.leastDestination = sorted.length > 0 ? sorted[sorted.length - 1].name : '—';
    }

    /* ═══════════════════════════════════════════════════
       ALERTES INTELLIGENTES
       ═══════════════════════════════════════════════════ */
    private computeSmartAlerts(): void {
        const alerts: SmartAlert[] = [];

        // Ponctualité < 80%
        if (this.kpiOnTimeRate < 80 && this.filteredTrips.length > 5) {
            alerts.push({
                icon: 'warning',
                message: `Taux de ponctualité inférieur à 80% (${this.kpiOnTimeRate}%)`,
                severity: 'warning'
            });
        }

        // Retards en augmentation
        if (this.trendOnTime < -10) {
            alerts.push({
                icon: 'trending_up',
                message: 'Les retards sont en augmentation par rapport à la période précédente',
                severity: 'danger'
            });
        }

        // Destination saturée
        if (this.destinationStats.length > 0) {
            const top = this.destinationStats[0];
            const total = this.destinationStats.reduce((s, d) => s + d.count, 0);
            if (top.count / total > 0.4) {
                alerts.push({
                    icon: 'location_on',
                    message: `Destination "${top.name}" fortement saturée (${Math.round(top.count / total * 100)}% des trajets)`,
                    severity: 'warning'
                });
            }
        }

        // Chauffeur avec taux de retard anormal
        const highDelayDriver = this.driverStats
            .filter(d => d.count >= 3)
            .find(d => d.onTimeRate < 50);
        if (highDelayDriver) {
            alerts.push({
                icon: 'person_off',
                message: `Chauffeur "${highDelayDriver.name}" présente un taux de retard anormal (${highDelayDriver.onTimeRate}% ponctualité)`,
                severity: 'danger'
            });
        }

        // Véhicule sous-utilisé
        if (this.vehicleStats.length > 0) {
            const leastUsed = this.vehicleStats[this.vehicleStats.length - 1];
            if (leastUsed.count <= 1) {
                alerts.push({
                    icon: 'garage',
                    message: `Véhicule "${leastUsed.plate}" sous-utilisé (${leastUsed.count} trajet${leastUsed.count > 1 ? 's' : ''})`,
                    severity: 'info'
                });
            }
        }

        this.smartAlerts = alerts;
    }

    /* ═══════════════════════════════════════════════════
       PRÉDICTIONS (moyennes glissantes 30 jours)
       ═══════════════════════════════════════════════════ */
    private computePredictions(): void {
        if (this.allTrips.length < 5) {
            this.predictions = null;
            return;
        }

        const now = new Date();
        const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

        const recentTrips = this.allTrips.filter(t => {
            const d = new Date(t.dateDepartIso || t.date);
            return !isNaN(d.getTime()) && d >= thirtyDaysAgo;
        });

        if (recentTrips.length < 3) {
            this.predictions = null;
            return;
        }

        const daysSpan = 30;
        const dailyAvg = recentTrips.length / daysSpan;
        const weeklyAvg = dailyAvg * 7;

        const totalDist30 = recentTrips.reduce((s, t) => s + (t.distanceKm || 0), 0);
        const weeklyDist = (totalDist30 / daysSpan) * 7;

        // Destinations les plus probables
        const destFreq = new Map<string, number>();
        recentTrips.forEach(t => {
            const d = t.to || 'Inconnue';
            destFreq.set(d, (destFreq.get(d) || 0) + 1);
        });
        const topDests = Array.from(destFreq)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 3)
            .map(([name]) => name);

        // Risque de retard basé sur la tendance récente
        const recentCompleted = recentTrips.filter(t => t.status === 'Terminé');
        const recentOnTime = recentCompleted.filter(t => (t.retardMinutes || 0) <= 5);
        const recentRate = recentCompleted.length > 0
            ? (recentOnTime.length / recentCompleted.length) * 100
            : 100;

        let delayRisk: 'Faible' | 'Moyen' | 'Élevé' = 'Faible';
        if (recentRate < 60) delayRisk = 'Élevé';
        else if (recentRate < 80) delayRisk = 'Moyen';

        this.predictions = {
            nextWeekTrips: Math.round(weeklyAvg),
            nextWeekDistance: Math.round(weeklyDist),
            topDestinations: topDests,
            delayRisk
        };
    }

    /* ═══════════════════════════════════════════════════
       LOGISTICS HEALTH SCORE (0-100)
       ═══════════════════════════════════════════════════ */
    private computeHealthScore(): void {
        const scorePunctualite = this.kpiOnTimeRate * 0.30;
        const scoreVolume = Math.min(this.kpiTotalTrips / (this.allTrips.length || 1), 1) * 25;
        const scoreCompletion = this.kpiCompletionRate * 0.15;
        const scoreDrivers = this.driverStats.length > 0
            ? (this.driverStats.filter(d => d.onTimeRate >= 80).length / this.driverStats.length) * 15
            : 10;
        const scoreVehicles = this.vehicleStats.length > 0
            ? (this.vehicleStats.filter(v => v.count >= 2).length / this.vehicleStats.length) * 15
            : 10;

        const raw = scorePunctualite + scoreVolume + scoreCompletion + scoreDrivers + scoreVehicles;
        const score = Math.round(Math.min(raw, 100));

        let label: string;
        let color: string;
        if (score >= 80) { label = 'Excellent'; color = '#4ade80'; }
        else if (score >= 50) { label = 'Moyen'; color = '#fbbf24'; }
        else { label = 'Critique'; color = '#f87171'; }

        this.kpiScoreGlobal = score;

        // Pour le tooltip ou détail, stocké temporairement
        (this as any)._healthScoreObj = {
            score,
            label,
            color,
            breakdown: [
                { label: 'Ponctualité', value: Math.round(scorePunctualite), max: 30 },
                { label: 'Volume trajets', value: Math.round(scoreVolume), max: 25 },
                { label: 'Taux complétion', value: Math.round(scoreCompletion), max: 15 },
                { label: 'Activité chauffeurs', value: Math.round(scoreDrivers), max: 15 },
                { label: 'Activité véhicules', value: Math.round(scoreVehicles), max: 15 }
            ]
        } as LogisticsHealthScore;
    }

    get healthScore(): LogisticsHealthScore {
        return (this as any)._healthScoreObj || {
            score: 0, label: 'N/A', color: '#64748b',
            breakdown: [
                { label: 'Ponctualité', value: 0, max: 30 },
                { label: 'Volume trajets', value: 0, max: 25 },
                { label: 'Taux complétion', value: 0, max: 15 },
                { label: 'Activité chauffeurs', value: 0, max: 15 },
                { label: 'Activité véhicules', value: 0, max: 15 }
            ]
        };
    }

    /* ═══════════════════════════════════════════════════
       CHART BUILDERS
       ═══════════════════════════════════════════════════ */
    private buildCharts(): void {
        this.buildEvolutionChart();
        this.buildDonutChart();
        this.buildDelayChart();
        this.buildTemporalChart();
    }

    private buildEvolutionChart(): void {
        const now = new Date();
        const weeksCount = 8;
        const labels: string[] = [];
        const tripCounts: number[] = new Array(weeksCount).fill(0);
        const distanceSums: number[] = new Array(weeksCount).fill(0);
        const onTimeRates: number[] = new Array(weeksCount).fill(0);
        const completedCounts: number[] = new Array(weeksCount).fill(0);
        const onTimeCounts: number[] = new Array(weeksCount).fill(0);

        for (let i = weeksCount - 1; i >= 0; i--) {
            const d = new Date(now.getTime() - i * 7 * 24 * 60 * 60 * 1000);
            labels.push(d.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' }));
        }

        const msInWeek = 7 * 24 * 60 * 60 * 1000;
        this.filteredTrips.forEach(t => {
            const dateStr = t.dateDepartIso || t.date;
            if (!dateStr) return;
            const date = new Date(dateStr);
            if (isNaN(date.getTime())) return;
            const diffMs = now.getTime() - date.getTime();
            const weekOffset = Math.floor(diffMs / msInWeek);
            if (weekOffset >= 0 && weekOffset < weeksCount) {
                const index = (weeksCount - 1) - weekOffset;
                tripCounts[index]++;
                distanceSums[index] += t.distanceKm || 0;
                if (t.status === 'Terminé') {
                    completedCounts[index]++;
                    if ((t.retardMinutes || 0) <= 5) onTimeCounts[index]++;
                }
            }
        });

        for (let i = 0; i < weeksCount; i++) {
            onTimeRates[i] = completedCounts[i] > 0
                ? Math.round((onTimeCounts[i] / completedCounts[i]) * 100)
                : 100;
        }

        const roundedDistances = distanceSums.map(d => Math.round(d * 10) / 10);

        this.evolutionData = {
            labels,
            datasets: [
                {
                    data: tripCounts,
                    label: 'Nombre de trajets',
                    borderColor: '#818cf8',
                    backgroundColor: 'rgba(129, 140, 248, 0.25)',
                    borderWidth: 3,
                    fill: true,
                    tension: 0.4,
                    pointBackgroundColor: '#818cf8',
                    pointHoverRadius: 7,
                    yAxisID: 'yTrips'
                },
                {
                    data: roundedDistances,
                    label: 'Distance (km)',
                    borderColor: '#34d399',
                    backgroundColor: 'rgba(52, 211, 153, 0.15)',
                    borderWidth: 3,
                    fill: true,
                    tension: 0.4,
                    pointBackgroundColor: '#34d399',
                    pointHoverRadius: 7,
                    yAxisID: 'yDistance'
                },
                {
                    data: onTimeRates,
                    label: 'Ponctualité (%)',
                    borderColor: '#fbbf24',
                    backgroundColor: 'rgba(251, 191, 36, 0.1)',
                    borderWidth: 2,
                    borderDash: [5, 5],
                    fill: false,
                    tension: 0.4,
                    pointBackgroundColor: '#fbbf24',
                    pointRadius: 3,
                    pointHoverRadius: 6,
                    yAxisID: 'yOnTime'
                }
            ]
        };

        this.evolutionOptions = {
            responsive: true,
            maintainAspectRatio: false,
            onHover: (event: any, elements: any[]) => {
                const target = event?.native?.target || event?.target;
                if (target) target.style.cursor = elements.length > 0 ? 'pointer' : 'default';
            },
            plugins: {
                legend: {
                    display: true, position: 'top',
                    labels: { color: '#94a3b8', boxWidth: 12, usePointStyle: true, font: { size: 11 } }
                },
                tooltip: {
                    backgroundColor: 'rgba(15, 23, 42, 0.95)',
                    titleColor: '#e2e8f0', bodyColor: '#94a3b8',
                    padding: 12, cornerRadius: 10, mode: 'index', intersect: false
                }
            },
            scales: {
                x: { grid: { display: false }, ticks: { color: '#64748b', font: { size: 10 } }, border: { display: false } },
                yTrips: {
                    type: 'linear', position: 'left', beginAtZero: true,
                    grid: { color: 'rgba(255, 255, 255, 0.04)' },
                    ticks: { color: '#818cf8', font: { size: 10 } },
                    border: { display: false },
                    title: { display: true, text: 'Trajets', color: '#818cf8', font: { size: 10, weight: 'bold' } }
                },
                yDistance: {
                    type: 'linear', position: 'right', beginAtZero: true,
                    grid: { display: false },
                    ticks: { color: '#34d399', font: { size: 10 } },
                    border: { display: false },
                    title: { display: true, text: 'Distance (km)', color: '#34d399', font: { size: 10, weight: 'bold' } }
                },
                yOnTime: {
                    type: 'linear', position: 'right', beginAtZero: true, max: 100,
                    grid: { display: false },
                    ticks: { color: '#fbbf24', font: { size: 10 } },
                    border: { display: false },
                    title: { display: true, text: 'Ponctualité (%)', color: '#fbbf24', font: { size: 10, weight: 'bold' } }
                }
            }
        };
    }

    private buildDonutChart(): void {
        const counts: Record<string, number> = { 'Rapide': 0, 'Économique': 0, 'Écologique': 0 };
        this.filteredTrips.forEach(t => {
            const opt = this.getTripOptimizationType(t);
            counts[opt as keyof typeof counts]++;
        });

        this.donutData = {
            labels: Object.keys(counts),
            datasets: [{
                data: Object.values(counts),
                backgroundColor: ['#ec4899', '#3b82f6', '#10b981'],
                hoverBackgroundColor: ['#f472b6', '#60a5fa', '#34d399'],
                borderWidth: 0, hoverOffset: 10
            }]
        };

        this.donutOptions = {
            responsive: true, maintainAspectRatio: false, cutout: '72%',
            onHover: (event: any, elements: any[]) => {
                const target = event?.native?.target || event?.target;
                if (target) target.style.cursor = elements.length > 0 ? 'pointer' : 'default';
            },
            plugins: {
                legend: {
                    display: true, position: 'bottom',
                    labels: { color: '#94a3b8', padding: 12, usePointStyle: true, font: { size: 11 } }
                },
                tooltip: {
                    backgroundColor: 'rgba(15, 23, 42, 0.95)',
                    titleColor: '#e2e8f0', bodyColor: '#94a3b8',
                    padding: 12, cornerRadius: 10
                }
            }
        };
    }

    private buildDelayChart(): void {
        const total = this.delayBuckets.reduce((s, b) => s + b.value, 0) || 1;
        this.delayData = {
            labels: this.delayBuckets.map(b => `${b.label} (${Math.round((b.value / total) * 100)}%)`),
            datasets: [{
                data: this.delayBuckets.map(b => b.value),
                backgroundColor: this.delayBuckets.map(b => b.color),
                borderWidth: 0, hoverOffset: 10
            }]
        };

        this.delayOptions = {
            responsive: true, maintainAspectRatio: false, cutout: '60%',
            onHover: (event: any, elements: any[]) => {
                const target = event?.native?.target || event?.target;
                if (target) target.style.cursor = elements.length > 0 ? 'pointer' : 'default';
            },
            plugins: {
                legend: {
                    display: true, position: 'bottom',
                    labels: { color: '#94a3b8', padding: 10, usePointStyle: true, font: { size: 10 } }
                },
                tooltip: {
                    backgroundColor: 'rgba(15, 23, 42, 0.95)',
                    titleColor: '#e2e8f0', bodyColor: '#94a3b8',
                    padding: 10, cornerRadius: 10,
                    callbacks: {
                        label: (ctx: any) => ` ${ctx.parsed} trajet(s)`
                    }
                }
            }
        };
    }

    private buildTemporalChart(): void {
        const granularity = this.temporalGranularity;
        const now = new Date();
        let points: number;
        let labelFn: (i: number) => string;
        let dateFilter: (t: Trip) => number | null;

        if (granularity === 'day') {
            points = 14;
            labelFn = (i: number) => {
                const d = new Date(now.getTime() - (points - 1 - i) * 24 * 60 * 60 * 1000);
                return d.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' });
            };
            dateFilter = (t: Trip) => {
                const d = new Date(t.dateDepartIso || t.date);
                if (isNaN(d.getTime())) return null;
                const offset = Math.floor((now.getTime() - d.getTime()) / (24 * 60 * 60 * 1000));
                return (offset >= 0 && offset < points) ? (points - 1 - offset) : null;
            };
        } else if (granularity === 'month') {
            points = 12;
            labelFn = (i: number) => {
                const d = new Date(now.getFullYear(), now.getMonth() - (points - 1 - i), 1);
                return d.toLocaleDateString('fr-FR', { month: 'short', year: '2-digit' });
            };
            dateFilter = (t: Trip) => {
                const d = new Date(t.dateDepartIso || t.date);
                if (isNaN(d.getTime())) return null;
                const diffMonths = (now.getFullYear() - d.getFullYear()) * 12 + (now.getMonth() - d.getMonth());
                return (diffMonths >= 0 && diffMonths < points) ? (points - 1 - diffMonths) : null;
            };
        } else {
            points = 8;
            labelFn = (i: number) => {
                const d = new Date(now.getTime() - (points - 1 - i) * 7 * 24 * 60 * 60 * 1000);
                return d.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' });
            };
            dateFilter = (t: Trip) => {
                const d = new Date(t.dateDepartIso || t.date);
                if (isNaN(d.getTime())) return null;
                const offset = Math.floor((now.getTime() - d.getTime()) / (7 * 24 * 60 * 60 * 1000));
                return (offset >= 0 && offset < points) ? (points - 1 - offset) : null;
            };
        }

        const labels: string[] = [];
        for (let i = 0; i < points; i++) labels.push(labelFn(i));

        const counts = new Array(points).fill(0);
        const distances = new Array(points).fill(0);
        const durations: number[][] = Array.from({ length: points }, () => []);
        const completedCounts = new Array(points).fill(0);
        const onTimeCounts = new Array(points).fill(0);

        this.filteredTrips.forEach(t => {
            const idx = dateFilter(t);
            if (idx === null) return;
            counts[idx]++;
            distances[idx] += t.distanceKm || 0;
            if (t.dureeReelleMinutes != null && t.dureeReelleMinutes > 0) {
                durations[idx].push(t.dureeReelleMinutes);
            }
            if (t.status === 'Terminé') {
                completedCounts[idx]++;
                if ((t.retardMinutes || 0) <= 5) onTimeCounts[idx]++;
            }
        });

        const avgDurations = durations.map(d => {
            const total = d.reduce((s, v) => s + v, 0);
            return d.length > 0 ? Math.round(total / d.length) : 0;
        });
        const onTimeRates = completedCounts.map((c, i) =>
            c > 0 ? Math.round((onTimeCounts[i] / c) * 100) : 100
        );

        this.temporalData = {
            labels,
            datasets: [
                {
                    data: counts, label: 'Trajets',
                    borderColor: '#6366f1', backgroundColor: 'rgba(99,102,241,0.2)',
                    fill: true, tension: 0.4, borderWidth: 2,
                    pointBackgroundColor: '#6366f1', pointHoverRadius: 6,
                    yAxisID: 'y'
                },
                {
                    data: distances.map(d => Math.round(d * 10) / 10), label: 'Distance (km)',
                    borderColor: '#10b981', backgroundColor: 'rgba(16,185,129,0.15)',
                    fill: true, tension: 0.4, borderWidth: 2,
                    pointBackgroundColor: '#10b981', pointHoverRadius: 6,
                    yAxisID: 'y'
                },
                {
                    data: onTimeRates, label: 'Ponctualité (%)',
                    borderColor: '#f59e0b', backgroundColor: 'rgba(245,158,11,0.1)',
                    fill: true, tension: 0.4, borderWidth: 2, borderDash: [4, 4],
                    pointBackgroundColor: '#f59e0b', pointRadius: 3, pointHoverRadius: 5,
                    yAxisID: 'y1'
                }
            ]
        };

        this.temporalOptions = {
            responsive: true, maintainAspectRatio: false,
            onHover: (event: any, elements: any[]) => {
                const target = event?.native?.target || event?.target;
                if (target) target.style.cursor = elements.length > 0 ? 'pointer' : 'default';
            },
            plugins: {
                legend: { display: true, position: 'top', labels: { color: '#94a3b8', usePointStyle: true, font: { size: 10 } } },
                tooltip: { backgroundColor: 'rgba(15,23,42,0.95)', titleColor: '#e2e8f0', bodyColor: '#94a3b8', padding: 10, cornerRadius: 10, mode: 'index', intersect: false }
            },
            scales: {
                x: { grid: { display: false }, ticks: { color: '#64748b', font: { size: 9 } }, border: { display: false } },
                y: { type: 'linear', position: 'left', beginAtZero: true, grid: { color: 'rgba(255,255,255,0.04)' }, ticks: { color: '#6366f1', font: { size: 9 } }, border: { display: false } },
                y1: { type: 'linear', position: 'right', beginAtZero: true, max: 100, grid: { display: false }, ticks: { color: '#f59e0b', font: { size: 9 } }, border: { display: false } }
            }
        };
    }

    /* ═══════════════════════════════════════════════════
       CARTE GÉOGRAPHIQUE INTELLIGENTE (type Google Ads)
       ═══════════════════════════════════════════════════ */
    private initMap(): void {
        if (this.map) return;
        this.map = L.map('delivery-destinations-map', {
            center: [35.8256, 10.6369],
            zoom: 7,
            zoomControl: true,
            attributionControl: true
        });
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '&copy; OpenStreetMap contributors'
        }).addTo(this.map);
        setTimeout(() => this.map?.invalidateSize(true), 300);
    }

    private renderMap(): void {
        if (!this.map) return;
        this.mapLayers.forEach(l => this.map?.removeLayer(l));
        this.mapLayers = [];
        const sourceTrips = this.mapShowAllDestinations ? this.allTrips : this.filteredTrips;

        if (sourceTrips.length === 0) return;

        const bounds: L.LatLngExpression[] = [];

        // ── 1. Départs (bleu) ──
        const departMap = new Map<string, { count: number; lat: number; lng: number; vehicles: Set<string>; totalDist: number }>();
        // ── 2. Destinations (vert) ──
        const destMap = new Map<string, { count: number; lat: number; lng: number; totalDist: number; totalDur: number }>();
        // ── 3. Liaisons ──
        const routeMap = new Map<string, { count: number; totalDelay: number; fromLat: number; fromLng: number; toLat: number; toLng: number }>();

        sourceTrips.forEach(t => {
            const from = t.from || 'Inconnu';
            const to = t.to || 'Inconnue';
            const key = `${from}→${to}`;

            // Coordonnées avec fallback
            const fromCoord = this.resolveCoords(t.latitudeDepart, t.longitudeDepart, from);
            const toCoord = this.resolveCoords(t.latitudeArrivee, t.longitudeArrivee, to);

            // Départs
            if (!departMap.has(from)) {
                departMap.set(from, { count: 0, lat: fromCoord[0], lng: fromCoord[1], vehicles: new Set(), totalDist: 0 });
            }
            const d = departMap.get(from)!;
            d.count++;
            if (t.vehicle) d.vehicles.add(t.vehicle);
            d.totalDist += t.distanceKm || 0;

            // Destinations
            if (!destMap.has(to)) {
                destMap.set(to, { count: 0, lat: toCoord[0], lng: toCoord[1], totalDist: 0, totalDur: 0 });
            }
            const dst = destMap.get(to)!;
            dst.count++;
            dst.totalDist += t.distanceKm || 0;
            if (t.dureeReelleMinutes) dst.totalDur += t.dureeReelleMinutes;

            // Liaisons
            if (!routeMap.has(key)) {
                routeMap.set(key, { count: 0, totalDelay: 0, fromLat: fromCoord[0], fromLng: fromCoord[1], toLat: toCoord[0], toLng: toCoord[1] });
            }
            const r = routeMap.get(key)!;
            r.count++;
            r.totalDelay += t.retardMinutes || 0;
        });

        const maxRouteCount = Math.max(...Array.from(routeMap.values()).map(r => r.count), 1);

        // ── Tracer les liaisons (en premier pour être sous les points) ──
        routeMap.forEach((r, routeKey) => {
            const avgDelay = Math.round(r.totalDelay / r.count);
            // Couleur selon performance
            let color: string;
            if (avgDelay <= 5) color = '#10b981';
            else if (avgDelay <= 15) color = '#f59e0b';
            else color = '#ef4444';

            const weight = Math.max(1.5, Math.min(6, (r.count / maxRouteCount) * 5));
            const opacity = Math.max(0.2, Math.min(0.7, r.count / maxRouteCount));

            const polyline = L.polyline(
                [[r.fromLat, r.fromLng], [r.toLat, r.toLng]],
                { color, weight, opacity, dashArray: '6 4' }
            ).addTo(this.map!);

            polyline.bindPopup(`
                <div style="font-family:'Inter',sans-serif;line-height:1.4;min-width:160px;color:#1e293b;">
                    <strong style="font-size:12px;">${routeKey}</strong><br>
                    <span style="font-size:11px;">Fréquence: <b>${r.count} trajet(s)</b></span><br>
                    <span style="font-size:11px;">Retard moyen: <b>${avgDelay} min</b></span><br>
                    <span style="font-size:10px;color:#64748b;">Performance: ${avgDelay <= 5 ? '✅ Bon' : avgDelay <= 15 ? '⚠️ Moyen' : '❌ Critique'}</span>
                </div>
            `);

            this.mapLayers.push(polyline);
        });

        // ── Points de départ (bleu) ──
        departMap.forEach((data, name) => {
            const radius = Math.min(22, Math.max(6, data.count * 3));
            const circle = L.circleMarker([data.lat, data.lng], {
                radius, color: '#3b82f6', fillColor: '#60a5fa', fillOpacity: 0.6, weight: 2
            }).addTo(this.map!);

            circle.bindPopup(`
                <div style="font-family:'Inter',sans-serif;line-height:1.4;min-width:170px;color:#1e293b;">
                    <strong style="font-size:13px;color:#2563eb;">📌 ${name}</strong><br>
                    <span style="font-size:11px;">Départs: <b>${data.count}</b></span><br>
                    <span style="font-size:11px;">Véhicules: <b>${data.vehicles.size}</b></span><br>
                    <span style="font-size:11px;">Distance moy.: <b>${data.count > 0 ? Math.round(data.totalDist / data.count) : 0} km</b></span>
                </div>
            `);

            this.mapLayers.push(circle);
            bounds.push([data.lat, data.lng]);
        });

        // ── Points de destination (vert) ──
        destMap.forEach((data, name) => {
            const radius = Math.min(24, Math.max(7, data.count * 3));
            const circle = L.circleMarker([data.lat, data.lng], {
                radius, color: '#10b981', fillColor: '#34d399', fillOpacity: 0.6, weight: 2
            }).addTo(this.map!);

            circle.bindPopup(`
                <div style="font-family:'Inter',sans-serif;line-height:1.4;min-width:170px;color:#1e293b;">
                    <strong style="font-size:13px;color:#059669;">📍 ${name}</strong><br>
                    <span style="font-size:11px;">Arrivées: <b>${data.count}</b></span><br>
                    <span style="font-size:11px;">Distance moy.: <b>${data.count > 0 ? Math.round(data.totalDist / data.count) : 0} km</b></span><br>
                    <span style="font-size:11px;">Temps moy.: <b>${data.count > 0 ? this.formatDuration(Math.round(data.totalDur / data.count)) : 'N/A'}</b></span>
                </div>
            `);

            this.mapLayers.push(circle);
            bounds.push([data.lat, data.lng]);
        });

        if (bounds.length > 0 && this.map) {
            this.map.fitBounds(bounds as L.LatLngBoundsExpression, { padding: [50, 50] });
        }
        setTimeout(() => this.map?.invalidateSize(), 150);
    }

    private resolveCoords(lat: number | undefined | null, lng: number | undefined | null, name: string): [number, number] {
        if (lat != null && lng != null) return [lat, lng];
        const defaultCoords: Record<string, [number, number]> = {
            'tunis': [36.8065, 10.1815], 'sfax': [34.7406, 10.7603],
            'sousse': [35.8256, 10.6369], 'bizerte': [37.2744, 9.8739],
            'gabes': [33.8815, 10.0982], 'gafsa': [34.4250, 8.7842],
            'kairouan': [35.6781, 10.0963], 'monastir': [35.7750, 10.8260],
            'nabeul': [36.4564, 10.7375], 'béja': [36.7255, 9.1850],
            'jendouba': [36.5011, 8.7800], 'kasserine': [35.1667, 8.8333],
            'médenine': [33.3500, 10.5000], 'tataouine': [32.9333, 10.4500],
            'tozeur': [33.9191, 8.1335], 'kébili': [33.7033, 8.9650],
            'siliana': [36.0833, 9.3667], 'zaghouan': [36.4000, 10.1500],
            'ariana': [36.8667, 10.2000], 'ben arous': [36.7500, 10.2167],
            'manouba': [36.8000, 10.1000], 'mahdia': [35.5000, 11.0667]
        };
        const lower = name.toLowerCase();
        for (const [key, coord] of Object.entries(defaultCoords)) {
            if (lower.includes(key)) return coord;
        }
        const seed = name.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
        return [34.5 + ((seed % 100) / 100) * 2.5, 9.0 + ((seed % 75) / 75) * 1.5];
    }

    private destroyMap(): void {
        this.mapLayers.forEach(l => l.remove());
        this.mapLayers = [];
        if (this.map) { this.map.remove(); this.map = null; }
    }

    /* ═══════════════════════════════════════════════════
       PAGINATION & INTERACTIONS
       ═══════════════════════════════════════════════════ */
    private paginateTrips(): void {
        this.tripTotalElements = this.filteredTrips.length;
        const start = this.tripPageIndex * this.tripPageSize;
        this.paginatedTrips = this.filteredTrips.slice(start, start + this.tripPageSize);
    }

    onPageChange(event: PageEvent): void {
        this.tripPageIndex = event.pageIndex;
        this.tripPageSize = event.pageSize;
        this.paginateTrips();
    }

    onSearchChange(): void { this.tripPageIndex = 0; this.refreshAll(); }
    onOptTypeChange(val: string): void { this.filterOptType = val; this.tripPageIndex = 0; this.refreshAll(); }
    onStatusChange(val: string): void { this.filterStatus = val; this.tripPageIndex = 0; this.refreshAll(); }
    onDateFromChange(val: string): void { this.filterDateFrom = val; this.tripPageIndex = 0; this.refreshAll(); }
    onDateToChange(val: string): void { this.filterDateTo = val; this.tripPageIndex = 0; this.refreshAll(); }
    onGranularityChange(val: string): void { this.temporalGranularity = val as any; this.buildTemporalChart(); this.cdr.detectChanges(); }

    toggleMapMode(showAll: boolean): void {
        this.mapShowAllDestinations = showAll;
        this.renderMap();
    }

    clearFilters(): void {
        this.filterSearch = '';
        this.filterOptType = '';
        this.filterStatus = '';
        this.filterDateFrom = '';
        this.filterDateTo = '';
        this.tripPageIndex = 0;
        this.refreshAll();
    }

    /* ═══════════════════════════════════════════════════
       HELPERS & FORMATTING
       ═══════════════════════════════════════════════════ */
    getTripOptimizationType(trip: Trip): string {
        const raw = (trip as any).typeOptimisation || (trip as any).routePreference;
        if (raw) {
            const lower = raw.toLowerCase();
            if (lower.includes('rapide') || lower.includes('fast') || lower.includes('speed')) return 'Rapide';
            if (lower.includes('eco') || lower.includes('green') || lower.includes('vert')) return 'Écologique';
            if (lower.includes('short') || lower.includes('econom') || lower.includes('tarif')) return 'Économique';
        }
        const numId = Number(trip.id) || 0;
        return numId % 3 === 0 ? 'Écologique' : (numId % 3 === 1 ? 'Rapide' : 'Économique');
    }

    formatDuration(minutes: number): string {
        if (!minutes || minutes <= 0) return 'N/A';
        const hours = Math.floor(minutes / 60);
        const mins = minutes % 60;
        return hours > 0 ? `${hours}h ${mins}m` : `${mins} min`;
    }

    formatDate(isoStr: string | undefined): string {
        if (!isoStr) return '-';
        const d = new Date(isoStr);
        if (isNaN(d.getTime())) return isoStr;
        return d.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' });
    }

    getPerformanceLabel(trip: Trip): string {
        const score = this.getScorePerformance(trip);
        if (trip.status === 'Annulé') return 'Annulé';
        if (trip.status === 'Planifié') return 'Planifié';
        if (trip.status === 'En Cours' || trip.status === 'Actif') {
            return score >= 50 ? 'En bonne voie' : 'À surveiller';
        }
        if (trip.status !== 'Terminé') return 'N/A';
        const delay = trip.retardMinutes ?? 0;
        const prefix = score >= 85 ? 'Excellent' : score >= 65 ? 'Bon' : score >= 40 ? 'Moyen' : 'Faible';
        if (delay <= 5) return `${prefix} · À l'heure`;
        if (delay <= 15) return `${prefix} · Retard léger`;
        return `${prefix} · Retard important`;
    }

    getPerformanceClass(label: string): string {
        if (label.startsWith('Excellent')) return 'perf--ontime';
        if (label.startsWith('Bon')) return 'perf--advance';
        if (label.startsWith('Moyen') || label.startsWith('À surveiller')) return 'perf--slight';
        if (label.startsWith('Faible') || label.startsWith('Annulé')) return 'perf--delayed';
        if (label.startsWith('Planifié') || label.startsWith('En bonne voie')) return 'perf--none';
        return 'perf--none';
    }

    clearChartFilter(): void {
        this.chartFilter = null;
        this.filterOptType = '';
        this.refreshAll();
    }

    onChartClick(event: any, chartName: string): void {
        const active = event?.active;
        if (!active || active.length === 0) return;
        const idx = active[0].index;
        if (idx == null) return;

        switch (chartName) {
            case 'optimization': {
                const labels = this.donutData?.labels as string[] | undefined;
                const label = labels?.[idx];
                if (label && (label === 'Rapide' || label === 'Économique' || label === 'Écologique')) {
                    if (this.chartFilter?.type === 'optimization' && this.chartFilter?.value === label) {
                        this.clearChartFilter();
                        return;
                    }
                    this.filterOptType = '';
                    this.chartFilter = {
                        type: 'optimization', value: label,
                        predicate: (t) => this.getTripOptimizationType(t) === label
                    };
                    this.refreshAll();
                }
                break;
            }
            case 'delay': {
                const bucket = this.delayBuckets[idx];
                if (!bucket) return;
                if (this.chartFilter?.type === 'delay' && this.chartFilter?.value === bucket.label) {
                    this.clearChartFilter();
                    return;
                }
                let predicate: (t: Trip) => boolean;
                if (idx === 0) predicate = (t) => (t.retardMinutes ?? 0) <= 5;
                else if (idx === 1) predicate = (t) => { const d = t.retardMinutes ?? 0; return d > 5 && d <= 15; };
                else if (idx === 2) predicate = (t) => { const d = t.retardMinutes ?? 0; return d > 15 && d <= 60; };
                else predicate = (t) => (t.retardMinutes ?? 0) > 60;
                this.chartFilter = { type: 'delay', value: bucket.label, predicate };
                this.refreshAll();
                break;
            }
            case 'evolution': {
                if (this.chartFilter?.type === 'evolution' && this.chartFilter?.value === String(idx)) {
                    this.clearChartFilter();
                    return;
                }
                const now = new Date();
                const weeksCount = 8;
                const weekOffset = (weeksCount - 1) - idx;
                const msInWeek = 7 * 24 * 60 * 60 * 1000;
                const weekStart = new Date(now.getTime() - weekOffset * msInWeek);
                const weekEnd = new Date(weekStart.getTime() + msInWeek);
                const label = (this.evolutionData?.labels as string[])?.[idx] || `Semaine ${idx + 1}`;
                this.chartFilter = {
                    type: 'evolution', value: label,
                    predicate: (t) => {
                        const d = new Date(t.dateDepartIso || t.date);
                        return d >= weekStart && d < weekEnd;
                    }
                };
                this.refreshAll();
                break;
            }
            case 'temporal': {
                if (this.chartFilter?.type === 'temporal' && this.chartFilter?.value === String(idx)) {
                    this.clearChartFilter();
                    return;
                }
                const now = new Date();
                let msInPeriod: number;
                let points: number;
                if (this.temporalGranularity === 'day') { msInPeriod = 24 * 60 * 60 * 1000; points = 14; }
                else if (this.temporalGranularity === 'month') { msInPeriod = 30 * 24 * 60 * 60 * 1000; points = 12; }
                else { msInPeriod = 7 * 24 * 60 * 60 * 1000; points = 8; }
                const periodOffset = (points - 1) - idx;
                const periodStart = new Date(now.getTime() - periodOffset * msInPeriod);
                const periodEnd = new Date(periodStart.getTime() + msInPeriod);
                const label = (this.temporalData?.labels as string[])?.[idx] || `Période ${idx + 1}`;
                this.chartFilter = {
                    type: 'temporal', value: label,
                    predicate: (t) => {
                        const d = new Date(t.dateDepartIso || t.date);
                        return d >= periodStart && d < periodEnd;
                    }
                };
                this.refreshAll();
                break;
            }
        }
    }

    onDriverClick(driverId: string): void {
        if (this.chartFilter?.type === 'driver' && this.chartFilter?.value === driverId) {
            this.clearChartFilter();
            return;
        }
        this.chartFilter = {
            type: 'driver', value: driverId,
            predicate: (t) => (t.driverId || t.driver) === driverId
        };
        this.refreshAll();
    }

    private getVehicleForTrip(trip: Trip): Vehicle | undefined {
        if (trip.vehicleId) return this.vehicleLUT.get(trip.vehicleId);
        const plate = trip.vehicle || trip.vehiculeMatricule;
        if (plate) {
            for (const v of this.allVehicles) {
                if (v.plate === plate) return v;
            }
        }
        return undefined;
    }

    private getFuelEfficiencyScore(trip: Trip): number {
        const distance = trip.distanceKm || 0;
        if (distance <= 0) return 50;
        const veh = this.getVehicleForTrip(trip);
        const conso = veh?.fuelConsumption ?? 0;
        if (conso <= 0) {
            return 50; // neutre si pas de donnée conso
        }
        const expectedFuel = distance * conso / 100;
        const dureeReelle = trip.dureeReelleMinutes ?? 0;
        const dureeEstimee = trip.dureeEstimeeMinutes ?? dureeReelle;
        let penalty = 0;
        if (distance < 10 && dureeReelle > 0) {
            penalty += 15; // trajets courts = moteur froid => surconsommation
        }
        if (dureeEstimee > 0 && dureeReelle > 0) {
            const ratioDur = dureeReelle / dureeEstimee;
            if (ratioDur > 1.5) penalty += 15; // bouchons => conso plus élevée
            else if (ratioDur > 1.2) penalty += 8;
        }
        const speed = dureeReelle > 0 ? distance / (dureeReelle / 60) : 0;
        if (speed > 0 && (speed < 15 || speed > 120)) penalty += 10; // conso inefficace
        return Math.max(0, 100 - penalty);
    }

    getScorePerformance(trip: Trip): number {
        let score = 0;

        const delay = trip.retardMinutes ?? 0;
        if (trip.status === 'Terminé') {
            score += delay <= 5 ? 35 : delay <= 15 ? 25 : delay <= 30 ? 18 : delay <= 60 ? 8 : 0;
        } else {
            score += delay <= 5 ? 25 : delay <= 15 ? 18 : 10;
        }

        const dureeReelle = trip.dureeReelleMinutes ?? 0;
        const dureeEstimee = trip.dureeEstimeeMinutes ?? dureeReelle;
        if (dureeEstimee > 0 && dureeReelle > 0) {
            const ratio = dureeReelle / dureeEstimee;
            score += ratio <= 1.0 ? 25 : ratio <= 1.1 ? 20 : ratio <= 1.2 ? 15 : ratio <= 1.5 ? 8 : 3;
        } else {
            score += 12;
        }

        const dist = trip.distanceKm || 0;
        score += dist >= 150 ? 15 : dist >= 80 ? 12 : dist >= 30 ? 8 : dist >= 10 ? 5 : 2;

        score += this.getFuelEfficiencyScore(trip) * 0.15;

        switch (trip.status) {
            case 'Terminé': score += 10; break;
            case 'En Cours': case 'Actif': score += 5; break;
            case 'Planifié': score += 3; break;
            case 'Annulé': score += 0; break;
            default: score += 0;
        }

        return Math.min(Math.max(Math.round(score), 0), 100);
    }

    getScoreBadgeClass(score: number): string {
        if (score >= 85) return 'score--excellent';
        if (score >= 65) return 'score--good';
        if (score >= 40) return 'score--average';
        return 'score--weak';
    }

    getScoreLabel(score: number): string {
        if (score >= 85) return 'Excellent';
        if (score >= 65) return 'Bon';
        if (score >= 40) return 'Moyen';
        return 'Faible';
    }

    getStatusClass(status: string): string {
        switch (status) {
            case 'Terminé': return 'status--finished';
            case 'En Cours': case 'Actif': return 'status--active';
            case 'Planifié': return 'status--planned';
            case 'Annulé': return 'status--cancelled';
            default: return '';
        }
    }

    getSeverityIcon(severity: string): string {
        switch (severity) {
            case 'danger': return 'error';
            case 'warning': return 'warning';
            default: return 'info';
        }
    }

    getAlertIcon(icon: string): string {
        return icon;
    }

    bestOptimization(type: string): string {
        const bestRapide = this.optStats.find(o => o.type === 'Rapide');
        const bestEco = this.optStats.find(o => o.type === 'Économique');
        const bestEcologique = this.optStats.find(o => o.type === 'Écologique');

        switch (type) {
            case 'plusRapide': {
                const sorted = [...this.optStats].filter(o => o.count > 0).sort((a, b) => a.avgDureeReelle - b.avgDureeReelle);
                return sorted.length > 0 ? sorted[0].type : '—';
            }
            case 'plusPonctuel': {
                const sorted = [...this.optStats].filter(o => o.count > 0).sort((a, b) => b.onTimeRate - a.onTimeRate);
                return sorted.length > 0 ? sorted[0].type : '—';
            }
            case 'plusRentable': {
                const sorted = [...this.optStats].filter(o => o.count > 0).sort((a, b) =>
                    (b.onTimeRate - b.avgDelay) - (a.onTimeRate - a.avgDelay)
                );
                return sorted.length > 0 ? sorted[0].type : '—';
            }
            default: return '—';
        }
    }

    getOptBadgeClass(type: string): string {
        switch (type.toLowerCase()) {
            case 'rapide': return 'dc-opt-badge rapide';
            case 'économique': return 'dc-opt-badge économique';
            case 'écologique': return 'dc-opt-badge écologique';
            default: return 'dc-opt-badge';
        }
    }
}
