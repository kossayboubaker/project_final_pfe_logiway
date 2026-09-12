import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { BaseChartDirective } from 'ng2-charts';
import { ChartConfiguration, ChartType } from 'chart.js';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { Subject, forkJoin, takeUntil } from 'rxjs';
import { FleetService, Vehicle, Trip } from '../../../../core/services/fleet.service';

/* ════ Interfaces ════════════════════════════════════════════════ */


interface BrandStat {
    brand: string;
    count: number;
    totalCapacity: number;
    avgCapacity: number;
    percentage: number;
}

interface VehicleRow {
    id: string;
    plate: string;
    model: string;
    brand: string;
    status: string;
    statusClass: string;
    driverName: string;
    mileage: number;
    capacity: number;
    totalDistanceKm: number;
}

interface BrandReliability {
    brand: string;
    score: number;            // 0-10
    maintenanceRate: number;  // % véhicules en Maintenance/Hors Service
    avgMileage: number;
    vehicleCount: number;
    confidence: 'low' | 'medium' | 'high';
}

interface ProximityResult {
    score: number;        // 0-5
    distanceKm: number | null;
    nearestSectorName: string | null;
}

interface WaterfallStep {
    label: string;
    value: number;
    cumulative: number;
    maxValue: number;
    colorClass: string;
}

interface TopMileageVehicle {
    id: string;
    plate: string;
    model: string;
    brand: string;
    driverName: string;
    status: string;
    totalKm: number;
    percentage: number;
    tripCount: number;
}

interface DrillDownMonth {
    monthLabel: string;
    monthIndex: number;
    totalKm: number;
    tripCount: number;
    avgKmPerTrip: number;
    trips: DrillTrip[];
    vehicleCount: number;
}

interface DrillTrip {
    id: string;
    vehiclePlate: string;
    driverName: string;
    from: string;
    to: string;
    distanceKm: number;
    status: string;
    statusLabel: string;
    date: string;
}

interface DrillDownStatus {
    statusLabel: string;
    statusIcon: string;
    statusClass: string;
    vehicles: DrillVehicle[];
    count: number;
    percentage: number;
}

interface DrillVehicle {
    id: string;
    plate: string;
    model: string;
    brand: string;
    driverName: string;
    mileage: number;
    capacity: number;
}

interface DrillDownBrand {
    brand: string;
    vehicles: DrillVehicle[];
    count: number;
    totalCapacity: number;
    avgCapacity: number;
}

interface DrillDownVehicle {
    vehicle: DrillVehicle;
    trips: DrillTrip[];
    totalKm: number;
    tripCount: number;
    status: string;
    statusClass: string;
}

@Component({
    selector: 'app-fleet-chart',
    standalone: true,
    imports: [
        CommonModule,
        FormsModule,
        BaseChartDirective,
        MatIconModule,
        MatTableModule,
        MatPaginatorModule
    ],
    templateUrl: './fleet-chart.component.html',
    styleUrls: ['./fleet-chart.component.css']
})
export class FleetChartComponent implements OnInit, OnDestroy {
    private readonly destroy$ = new Subject<void>();

    /* ─── Raw Data ─────────────────────────────────── */
    allVehicles: Vehicle[] = [];
    allTrips: Trip[] = [];

    /* ─── KPIs ─────────────────────────────────────── */
    kpiTotal = 0;
    kpiActive = 0;
    kpiMaintenance = 0;
    kpiInactive = 0;
    kpiAvailabilityRate = 0;
    kpiTotalDistanceKm = 0;
    kpiAvgSpeedKmh = 0;
    kpiTotalTrips = 0;
    kpiAvgMileage = 0;
    kpiUnassigned = 0;
    kpiTotalCapacity = 0;
    kpiAvgCapacity = 0;

    /* ─── Availability Score Details ────────────────── */
    availabilityOperational = 0;
    availabilityFuel = 0;
    availabilityFuelPct = 0;
    availabilityMaintenance = 0;
    availabilityRepos = 0;
    availabilityReliability = 0;
    availabilityProximity = 0;

    /* ─── Gauge ────────────────────────────────────── */
    gaugeRotation = 0;
    gaugeColor = '#4ade80';

    /* ─── Trends ───────────────────────────────────── */
    trendTotal = 0;
    trendActive = 0;
    trendMaintenance = 0;
    trendInactive = 0;

    /* ─── Brand Stats ──────────────────────────────── */
    brandStats: BrandStat[] = [];

    /* ─── Intelligent Reliability (dynamic, no static brand list) ──── */
    brandReliabilityMap: Map<string, BrandReliability> = new Map();
    private readonly DEFAULT_RELIABILITY_SCORE = 7;
    private readonly MIN_SAMPLE_FOR_CONFIDENCE = 3;

    /* ─── Intelligent Proximity (GPS-based) ──────────────────────── */
    private sectors: { id: string; name: string; lat: number; lng: number; hasActiveDemand?: boolean }[] = [];

    /* ─── Waterfall decomposition ───────────────────────────────── */
    waterfallSteps: WaterfallStep[] = [];
    waterfallTotal = 0;

    /* ─── Top Mileage Vehicles ─────────────────────── */
    topMileageVehicles: TopMileageVehicle[] = [];

    /* ─── Filters ──────────────────────────────────── */
    filterStatus = '';
    filterBrand = '';
    filterVehicle = '';
    brands: string[] = [];
    vehicles: Vehicle[] = [];

    /* ─── KPI highlight state ──────────────────────── */
    selectedKpiType: 'total' | 'active' | 'maintenance' | 'inactive' | '' = '';

    readonly statusOptions = [
        { value: '', label: 'Tous les statuts' },
        { value: 'En Service', label: 'En Service' },
        { value: 'Maintenance', label: 'Maintenance' },
        { value: 'Hors Service', label: 'Hors Service' }
    ];

    /* ─── Table ────────────────────────────────────── */
    displayedColumns = ['plate', 'model', 'status', 'driver', 'mileage', 'capacity', 'distance'];
    dataSource: VehicleRow[] = [];
    pageIndex = 0;
    pageSize = 10;
    totalElements = 0;

    /* ─── Chart Types ──────────────────────────────── */
    readonly donutType: ChartType = 'doughnut';
    readonly brandType: ChartType = 'bar';
    readonly lineType: ChartType = 'line';
    readonly scatterType: ChartType = 'scatter';
    readonly barType: ChartType = 'bar';

    /* ─── Status Donut ─────────────────────────────── */
    donutOptions: any = {};
    donutData: any = { labels: [], datasets: [{ data: [] }] };

    /* ─── Brand Horizontal Bar ─────────────────────── */
    brandOptions: ChartConfiguration['options'] = {};
    brandChartData: ChartConfiguration['data'] = { labels: [], datasets: [] };

    /* ─── Distance Line Chart ──────────────────────── */
    lineOptions: ChartConfiguration['options'] = {};
    lineChartData: ChartConfiguration['data'] = { labels: [], datasets: [] };

    /* ─── Scatter: Capacity vs Mileage ─────────────── */
    scatterOptions: any = {};
    scatterData: any = { datasets: [] };

    /* ─── Trip Status Stacked Bar ──────────────────── */
    tripBarOptions: ChartConfiguration['options'] = {};
    tripBarData: ChartConfiguration['data'] = { labels: [], datasets: [] };

    /* ─── Monthly stored data for drill-down ───────── */
    private monthNames = ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin', 'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'];
    private monthNamesShort = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin', 'Juil', 'Août', 'Sep', 'Oct', 'Nov', 'Déc'];

    /* ─── DRILL-DOWN state ─────────────────────────── */
    drillDownOpen = false;
    drillDownType: 'month' | 'status' | 'brand' | 'vehicle' = 'month';
    drillMonth: DrillDownMonth | null = null;
    drillStatus: DrillDownStatus | null = null;
    drillBrand: DrillDownBrand | null = null;
    drillVehicle: DrillDownVehicle | null = null;

    /* ─── Breakdown Risk Gauge ─────────────────────── */
    kpiBreakdownRiskRate = 0;
    riskGaugeRotation = 0;
    riskGaugeColor = '#10b981';

    /* ─── Radar Chart ──────────────────────────────── */
    readonly radarType: ChartType = 'radar';
    radarOptions: ChartConfiguration['options'] = {};
    radarChartData: ChartConfiguration['data'] = { labels: [], datasets: [] };

    /* ─── GPS Proximity Helper (Haversine Formula) ──── */
    private getHaversineDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
        const R = 6371; // Earth's radius in km
        const dLat = (lat2 - lat1) * Math.PI / 180;
        const dLon = (lon2 - lon1) * Math.PI / 180;
        const a =
            Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLon / 2) * Math.sin(dLon / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return R * c; // Distance in km
    }

    /* ─── Getters ──────────────────────────────────── */
    get hasActiveFilters(): boolean {
        return !!(this.filterStatus || this.filterBrand || this.filterVehicle);
    }

    get activeFilterCount(): number {
        return (this.filterStatus ? 1 : 0) + (this.filterBrand ? 1 : 0) + (this.filterVehicle ? 1 : 0);
    }

    /* ─── Constructor ──────────────────────────────── */
    constructor(
        private readonly fleetService: FleetService,
        private readonly cdr: ChangeDetectorRef
    ) { }

    /* ─── Lifecycle ────────────────────────────────── */
    ngOnInit(): void {
        this.loadSectorsIfAvailable();
        this.loadData();
    }

    ngOnDestroy(): void {
        this.destroy$.next();
        this.destroy$.complete();
    }

    /* ═══════════════════════════════════════════════════
       DATA LOADING
       ═══════════════════════════════════════════════════ */
    private loadData(): void {
        forkJoin({
            vehicles: this.fleetService.getVehicles(),
            trips: this.fleetService.getTrips()
        })
            .pipe(takeUntil(this.destroy$))
            .subscribe({
                next: ({ vehicles, trips }) => {
                    this.allVehicles = vehicles;
                    this.allTrips = trips;
                    this.extractBrands();
                    this.refreshAll();
                },
                error: () => {
                    this.allVehicles = [];
                    this.allTrips = [];
                    this.cdr.detectChanges();
                }
            });
    }

    /** Refresh all KPIs, charts, table from current filter state */
    refreshAll(): void {
        this.computeBrandReliability();
        this.computeKpis();
        this.buildWaterfall();
        this.computeTrends();
        this.computeBrandStats();
        this.computeTopMileage();
        this.buildCharts();
        this.applyFiltersAndPaginate();
        this.cdr.detectChanges();
    }

    private extractBrands(): void {
        const set = new Set<string>();
        this.allVehicles.forEach(v => { if (v.brand) set.add(v.brand); });
        this.brands = Array.from(set).sort();

        // Préparer liste véhicules pour le dropdown
        this.vehicles = [...this.allVehicles].sort((a, b) => a.plate.localeCompare(b.plate));
    }

    /* ═══════════════════════════════════════════════════
       KPIs COMPUTATION
       ═══════════════════════════════════════════════════ */
    getVehicleAvailabilityDetails(v: Vehicle): {
        operational: number;
        fuel: number;
        fuelLevel: number;
        maintenance: number;
        repos: number;
        reliability: number;
        proximity: number;
    } {
        // A. État Opérationnel (Max 40 or 45 based on weights)
        let operational = 0;
        const vTrips = this.allTrips.filter(t => this.isTripForVehicle(t, v));
        const hasActiveTrip = vTrips.some(t => t.status === 'En Cours' || t.status === 'Actif');

        if (hasActiveTrip) {
            operational = 15; // IN_TRIP
        } else if (v.status === 'En Service') {
            operational = 40; // FREE
        } else if (v.status === 'Maintenance') {
            operational = 10; // MAINTENANCE
        } else {
            operational = 0; // HORS_SERVICE
        }

        // B. Niveau de Carburant (Max 15 or 10)
        // Estimation basée sur la consommation moyenne réelle du modèle et la distance
        let consumptionPer100km = 12; // par défaut
        const brandLower = (v.brand || '').toLowerCase();
        const modelLower = (v.model || '').toLowerCase();

        if (brandLower.includes('scania') || brandLower.includes('volvo') || modelLower.includes('actros')) {
            consumptionPer100km = 32; // Camion lourd
        } else if (brandLower.includes('iveco') || brandLower.includes('renault')) {
            consumptionPer100km = 18; // Fourgon moyen
        } else if (brandLower.includes('berlingo') || brandLower.includes('ford')) {
            consumptionPer100km = 8; // Utilitaire léger
        }

        // Simuler la distance parcourue depuis le dernier ravitaillement basé sur l'historique
        const totalDistance = vTrips.reduce((sum, t) => sum + (t.distanceKm || 0), 0);
        const numericId = parseInt(v.id.replace(/\D/g, '')) || 7;
        const distanceSinceRefuel = Math.round((totalDistance * 17 + numericId * 31) % 450);

        // Estimer le niveau de carburant restant (réservoir standard de 80L pour utilitaires, 400L pour camions)
        const tankCapacity = consumptionPer100km > 25 ? 400 : 80;
        const fuelUsed = (distanceSinceRefuel * consumptionPer100km) / 100;
        const fuelLevel = Math.max(10, Math.min(100, Math.round(100 - (fuelUsed / tankCapacity) * 100)));

        let fuel = 0;
        if (fuelLevel >= 50) {
            fuel = 15;
        } else if (fuelLevel >= 15) {
            fuel = 10;
        } else {
            fuel = 0;
        }

        // C. Maintenance & Usure (Max 20)
        let maintenance = 20;
        if (v.status === 'Maintenance') {
            maintenance = 0;
        } else {
            const mileage = v.mileage ?? 0;
            if (mileage > 200000) {
                maintenance = 5;
            } else if (mileage > 120000) {
                maintenance = 12;
            } else if (mileage > 60000) {
                maintenance = 17;
            }
        }

        // D. Temps de repos Conducteur (Max 10)
        let repos = 10;
        if (hasActiveTrip) {
            repos = 0;
        } else if (vTrips.length > 0) {
            const sortedTrips = [...vTrips].sort((a, b) => {
                const dateA = a.dateDepartIso ? new Date(a.dateDepartIso).getTime() : 0;
                const dateB = b.dateDepartIso ? new Date(b.dateDepartIso).getTime() : 0;
                return dateB - dateA;
            });
            const lastTrip = sortedTrips[0];
            if (lastTrip && lastTrip.status === 'Terminé') {
                repos = 10;
            } else {
                repos = 5;
            }
        }

        // E. Fiabilité Constructeur (Max 10) — désormais dynamique
        const reliability = this.getReliabilityScore(v.brand);

        // F. Proximité (Max 5) — désormais basée sur GPS réel + secteurs
        const proximity = this.computeProximity(v).score;

        return {
            operational,
            fuel,
            fuelLevel,
            maintenance,
            repos,
            reliability,
            proximity
        };
    }

    private computeAvailability(): void {
        const vehicles = this.getFilteredVehicles();
        if (vehicles.length === 0) {
            this.kpiAvailabilityRate = 0;
            this.kpiBreakdownRiskRate = 0;
            this.availabilityOperational = 0;
            this.availabilityFuel = 0;
            this.availabilityFuelPct = 0;
            this.availabilityMaintenance = 0;
            this.availabilityRepos = 0;
            this.availabilityReliability = 0;
            this.availabilityProximity = 0;
            return;
        }

        // 1. PONDÉRATION ADAPTATIVE (Coefficients dynamiques selon le contexte de demande de la flotte)
        const activeTripsCount = this.allTrips.filter(t => t.status === 'En Cours' || t.status === 'Actif').length;
        const fleetSize = this.allVehicles.length || 1;
        const demandRatio = activeTripsCount / fleetSize;
        const isHighDemand = demandRatio > 0.25; // Plus de 25% de la flotte en mission

        // Poids normaux : Opérationnel 40%, Carburant 15%, Maintenance 20%, Repos 10%, Fiabilité 10%, Proximité 5%
        // Poids haute demande : Opérationnel 45%, Carburant 10%, Maintenance 20%, Repos 10%, Fiabilité 5%, Proximité 10%
        const wOperational = isHighDemand ? 45 : 40;
        const wFuel = isHighDemand ? 10 : 15;
        const wMaintenance = 20;
        const wRepos = 10;
        const wReliability = isHighDemand ? 5 : 10;
        const wProximity = isHighDemand ? 10 : 5;

        let totalOp = 0;
        let totalFuel = 0;
        let totalFuelPct = 0;
        let totalMaint = 0;
        let totalRepos = 0;
        let totalReliability = 0;
        let totalProximity = 0;

        vehicles.forEach(v => {
            const details = this.getVehicleAvailabilityDetails(v);

            // Adapter les scores opérationnel, carburant, fiabilité et proximité aux nouveaux coefficients contextuels
            const scaleOp = (details.operational / 40) * wOperational;
            const scaleFuel = (details.fuel / 15) * wFuel;
            const scaleMaint = (details.maintenance / 20) * wMaintenance;
            const scaleRepos = (details.repos / 10) * wRepos;
            const scaleReliability = (details.reliability / 10) * wReliability;
            const scaleProximity = (details.proximity / 5) * wProximity;

            totalOp += scaleOp;
            totalFuel += scaleFuel;
            totalFuelPct += details.fuelLevel;
            totalMaint += scaleMaint;
            totalRepos += scaleRepos;
            totalReliability += scaleReliability;
            totalProximity += scaleProximity;
        });

        const count = vehicles.length;
        this.availabilityOperational = Math.round((totalOp / count) * (40 / wOperational)); // ramener sur base standard pour affichage
        this.availabilityFuel = Math.round((totalFuel / count) * (15 / wFuel));
        this.availabilityFuelPct = Math.round(totalFuelPct / count);
        this.availabilityMaintenance = Math.round((totalMaint / count) * (20 / wMaintenance));
        this.availabilityRepos = Math.round((totalRepos / count) * (10 / wRepos));
        this.availabilityReliability = Math.round((totalReliability / count) * (10 / wReliability));
        this.availabilityProximity = Math.round((totalProximity / count) * (5 / wProximity));

        // Score total final pondéré (sur 100)
        let weightedScore = (totalOp + totalFuel + totalMaint + totalRepos + totalReliability + totalProximity) / count;
        this.kpiAvailabilityRate = Math.min(100, Math.max(0, Math.round(weightedScore)));

        this.gaugeRotation = (this.kpiAvailabilityRate / 100) * 180;
        this.gaugeColor = this.kpiAvailabilityRate >= 80 ? '#4ade80'
            : this.kpiAvailabilityRate >= 50 ? '#fbbf24' : '#f87171';

        // 2. JAUGE DE RISQUE DE PANNE SUPPLÉMENTAIRE (Score de risque sur 100)
        // Risque élevé si la fiabilité constructeur moyenne est basse et si le kilométrage est élevé.
        const avgReliabilityVal = totalReliability / count; // score pondéré fiabilité
        const avgReliabilityPct = (avgReliabilityVal / wReliability) * 100;

        // Risque = 100 - Fiabilité
        this.kpiBreakdownRiskRate = Math.round(100 - avgReliabilityPct);
        this.riskGaugeRotation = (this.kpiBreakdownRiskRate / 100) * 180;
        this.riskGaugeColor = this.kpiBreakdownRiskRate >= 50 ? '#f87171' // Rouge si risque élevé
            : this.kpiBreakdownRiskRate >= 25 ? '#fbbf24' : '#4ade80'; // Vert si risque faible
    }

    private computeKpis(): void {
        const vehicles = this.getFilteredVehicles();
        const trips = this.getFilteredTrips();

        this.kpiTotal = vehicles.length;
        this.kpiActive = vehicles.filter(x => x.status === 'En Service').length;
        this.kpiMaintenance = vehicles.filter(x => x.status === 'Maintenance').length;
        this.kpiInactive = vehicles.filter(x => x.status === 'Hors Service').length;

        // Calculateur intelligent de disponibilité
        this.computeAvailability();

        // Distance totale
        const distances = trips
            .filter(t => t.distanceKm != null && t.distanceKm > 0)
            .map(t => t.distanceKm as number);
        this.kpiTotalDistanceKm = Math.round(distances.reduce((s, d) => s + d, 0));
        this.kpiTotalTrips = trips.length;

        // Vitesse moyenne
        const validTrips = trips.filter(
            t => t.distanceKm && t.dureeReelleMinutes && t.dureeReelleMinutes > 0
        );
        if (validTrips.length > 0) {
            const totalSpeed = validTrips.reduce((sum, t) => {
                const hours = (t.dureeReelleMinutes as number) / 60;
                return sum + (t.distanceKm as number) / hours;
            }, 0);
            this.kpiAvgSpeedKmh = Math.round(totalSpeed / validTrips.length);
        } else {
            this.kpiAvgSpeedKmh = 0;
        }

        // Kilométrage moyen du parc
        const vehiclesWithMileage = vehicles.filter(v => v.mileage && v.mileage > 0);
        this.kpiAvgMileage = vehiclesWithMileage.length > 0
            ? Math.round(vehiclesWithMileage.reduce((s, v) => s + (v.mileage ?? 0), 0) / vehiclesWithMileage.length) : 0;

        // Véhicules non affectés
        this.kpiUnassigned = vehicles.filter(v => !v.driverName || v.driverName.trim() === '').length;

        // Capacité totale et moyenne
        const vehiclesWithCap = vehicles.filter(v => v.capacity && v.capacity > 0);
        this.kpiTotalCapacity = vehiclesWithCap.reduce((s, v) => s + (v.capacity ?? 0), 0);
        this.kpiAvgCapacity = vehiclesWithCap.length > 0
            ? Math.round(this.kpiTotalCapacity / vehiclesWithCap.length) : 0;
    }

    /* ═══════════════════════════════════════════════════
       FILTERED DATA GETTERS
       ═══════════════════════════════════════════════════ */
    isTripForVehicle(t: Trip, v: Vehicle): boolean {
        if (t.vehicleId && t.vehicleId === v.id) return true;

        const tripPlate = (t.vehiculeMatricule || t.vehicle || '').trim().toLowerCase();
        const vehiclePlate = (v.plate || '').trim().toLowerCase();

        return !!(tripPlate && vehiclePlate && tripPlate === vehiclePlate);
    }

    private getFilteredVehicles(): Vehicle[] {
        return this.allVehicles.filter(v => {
            if (this.filterStatus && v.status !== this.filterStatus) return false;
            if (this.filterBrand && (v.brand ?? '') !== this.filterBrand) return false;
            if (this.filterVehicle && v.id !== this.filterVehicle) return false;
            return true;
        });
    }

    private getFilteredTrips(): Trip[] {
        const filteredVehicles = this.getFilteredVehicles();
        if (!this.filterStatus && !this.filterBrand && !this.filterVehicle) return this.allTrips;
        return this.allTrips.filter(t => filteredVehicles.some(v => this.isTripForVehicle(t, v)));
    }

    /* ═══════════════════════════════════════════════════
       TRENDS
       ═══════════════════════════════════════════════════ */
    private computeTrends(): void {
        const half = Math.floor(this.allVehicles.length / 2);
        const first = this.allVehicles.slice(0, half);
        const second = this.allVehicles.slice(half);

        const calc = (arr: Vehicle[], status: string) =>
            arr.filter(v => v.status === status).length;

        const safeTrend = (cur: number, prev: number) => {
            if (prev === 0) return cur > 0 ? 100 : 0;
            return Math.round(((cur - prev) / prev) * 100);
        };

        this.trendActive = safeTrend(calc(second, 'En Service'), calc(first, 'En Service'));
        this.trendMaintenance = safeTrend(calc(second, 'Maintenance'), calc(first, 'Maintenance'));
        this.trendInactive = safeTrend(calc(second, 'Hors Service'), calc(first, 'Hors Service'));
        this.trendTotal = safeTrend(second.length, first.length);
    }

    /* ═══════════════════════════════════════════════════
       BRAND STATS
       ═══════════════════════════════════════════════════ */
    private computeBrandStats(): void {
        const map = new Map<string, { count: number; totalCap: number }>();
        const vehicles = this.getFilteredVehicles();
        vehicles.forEach(v => {
            const key = v.brand || 'Inconnu';
            const existing = map.get(key);
            if (existing) {
                existing.count++;
                existing.totalCap += v.capacity ?? 0;
            } else {
                map.set(key, { count: 1, totalCap: v.capacity ?? 0 });
            }
        });

        const total = vehicles.length || 1;
        this.brandStats = Array.from(map, ([brand, s]) => ({
            brand,
            count: s.count,
            totalCapacity: s.totalCap,
            avgCapacity: s.count > 0 ? Math.round(s.totalCap / s.count) : 0,
            percentage: Math.round((s.count / total) * 100)
        })).sort((a, b) => b.count - a.count);
    }

    /* ═══════════════════════════════════════════════════
       TOP MILEAGE
       ═══════════════════════════════════════════════════ */
    private computeTopMileage(): void {
        const distMap = new Map<string, { km: number; count: number }>();

        // 1. Group and sum trip distances, and count all trips
        this.allTrips.forEach(t => {
            const matchedVehicle = this.allVehicles.find(v => this.isTripForVehicle(t, v));
            const vid = matchedVehicle?.id || t.vehicleId;
            if (vid) {
                const existing = distMap.get(vid);
                const d = t.distanceKm || 0;
                if (existing) {
                    existing.km += d;
                    existing.count++;
                } else {
                    distMap.set(vid, { km: d, count: 1 });
                }
            }
        });

        // 2. Add initial vehicle mileage to each vehicle's trip distance sum
        this.allVehicles.forEach(v => {
            const existing = distMap.get(v.id);
            const initialMileage = v.mileage ?? 0;
            if (existing) {
                existing.km += initialMileage;
            } else {
                distMap.set(v.id, { km: initialMileage, count: 0 });
            }
        });

        const maxKm = Math.max(...Array.from(distMap.values()).map(d => d.km), 1);

        // Apply filters
        const filteredIds = new Set(this.getFilteredVehicles().map(v => v.id));

        this.topMileageVehicles = Array.from(distMap, ([vid, data]) => {
            const vehicle = this.allVehicles.find(v => v.id === vid);
            return {
                id: vid,
                plate: vehicle?.plate ?? vid,
                model: vehicle?.model ?? '',
                brand: vehicle?.brand ?? '',
                driverName: vehicle?.driverName ?? '',
                status: vehicle?.status ?? '',
                totalKm: Math.round(data.km),
                percentage: Math.round((data.km / maxKm) * 100),
                tripCount: data.count
            };
        })
            .filter(v => filteredIds.has(v.id))
            .sort((a, b) => b.totalKm - a.totalKm)
            .slice(0, 8);
    }

    /* ═══════════════════════════════════════════════════
       BUILD ALL CHARTS
       ═══════════════════════════════════════════════════ */
    private buildCharts(): void {
        this.buildDonut();
        this.buildBrandChart();
        this.buildLineChart();
        this.buildScatterChart();
        this.buildTripBarChart();
        this.buildRadarChart();
    }

    /* ── Radar Chart ───────────────────────────────── */
    private buildRadarChart(): void {
        const topBrands = this.brandStats.slice(0, 3).map(b => b.brand);
        if (topBrands.length === 0) {
            this.radarChartData = { labels: [], datasets: [] };
            return;
        }

        const dimensions = [
            'État Opérationnel',
            'Niveau Carburant',
            'Maintenance & Usure',
            'Repos Conducteur',
            'Fiabilité Constructeur',
            'Proximité Logistique'
        ];

        const datasets = topBrands.map((brand, i) => {
            const brandVehicles = this.allVehicles.filter(v => v.brand === brand);
            let sumOp = 0, sumFuel = 0, sumMaint = 0, sumRepos = 0, sumReliability = 0, sumProximity = 0;

            brandVehicles.forEach(v => {
                const details = this.getVehicleAvailabilityDetails(v);
                sumOp += (details.operational / 40) * 100;
                sumFuel += details.fuelLevel;
                sumMaint += (details.maintenance / 20) * 100;
                sumRepos += (details.repos / 10) * 100;
                sumReliability += (details.reliability / 10) * 100;
                sumProximity += (details.proximity / 5) * 100;
            });

            const count = brandVehicles.length || 1;
            const data = [
                Math.round(sumOp / count),
                Math.round(sumFuel / count),
                Math.round(sumMaint / count),
                Math.round(sumRepos / count),
                Math.round(sumReliability / count),
                Math.round(sumProximity / count)
            ];

            const color = this.getBrandColor(i);

            return {
                data,
                label: brand,
                borderColor: color,
                backgroundColor: `${color}25`,
                pointBackgroundColor: color,
                pointBorderColor: '#fff',
                pointHoverBackgroundColor: '#fff',
                pointHoverBorderColor: color
            };
        });

        this.radarChartData = {
            labels: dimensions,
            datasets
        };

        this.radarOptions = {
            responsive: true,
            maintainAspectRatio: false,
            animation: { duration: 900, easing: 'easeOutQuart' },
            plugins: {
                legend: {
                    display: true,
                    position: 'bottom',
                    labels: { color: '#94a3b8', font: { size: 10 } }
                },
                tooltip: {
                    backgroundColor: 'rgba(15,23,42,0.95)',
                    titleColor: '#e2e8f0',
                    bodyColor: '#94a3b8',
                    padding: 12,
                    cornerRadius: 10
                }
            },
            scales: {
                r: {
                    angleLines: { color: 'rgba(255, 255, 255, 0.08)' },
                    grid: { color: 'rgba(255, 255, 255, 0.08)' },
                    pointLabels: { color: '#94a3b8', font: { size: 9, weight: 'bold' } },
                    ticks: {
                        color: '#64748b',
                        backdropColor: 'transparent',
                        font: { size: 8 },
                        stepSize: 20
                    },
                    suggestedMin: 0,
                    suggestedMax: 100
                }
            }
        };
    }

    /* ── Donut ──────────────────────────────────────── */
    private buildDonut(): void {
        this.donutData = {
            labels: ['En Service', 'Maintenance', 'Hors Service'],
            datasets: [{
                data: [this.kpiActive, this.kpiMaintenance, this.kpiInactive],
                backgroundColor: ['rgba(16,185,129,0.8)', 'rgba(245,158,11,0.8)', 'rgba(239,68,68,0.75)'],
                hoverBackgroundColor: ['#10b981', '#f59e0b', '#ef4444'],
                borderWidth: 0,
                hoverOffset: 10
            }]
        };

        this.donutOptions = {
            responsive: true,
            maintainAspectRatio: false,
            cutout: '72%',
            animation: { duration: 900, easing: 'easeOutQuart' },
            plugins: {
                legend: { display: true, position: 'bottom', labels: { color: '#94a3b8', padding: 16, usePointStyle: true, font: { size: 11 } } },
                tooltip: { backgroundColor: 'rgba(15,23,42,0.95)', titleColor: '#e2e8f0', bodyColor: '#94a3b8', borderColor: 'rgba(255,255,255,0.08)', borderWidth: 1, padding: 14, cornerRadius: 12 }
            },
            onClick: (_event: any, activeElements: any[]) => {
                if (activeElements.length > 0) {
                    const idx = activeElements[0].index;
                    const statuses = ['En Service', 'Maintenance', 'Hors Service'];
                    this.openStatusDrillDown(statuses[idx]);
                }
            }
        };
    }

    /* ── Brand Bar ──────────────────────────────────── */
    private buildBrandChart(): void {
        const top = this.brandStats.slice(0, 8);
        const colors = [
            'rgba(99,102,241,0.75)', 'rgba(139,92,246,0.75)',
            'rgba(16,185,129,0.75)', 'rgba(245,158,11,0.75)',
            'rgba(236,72,153,0.75)', 'rgba(59,130,246,0.75)',
            'rgba(239,68,68,0.75)', 'rgba(20,184,166,0.75)'
        ];
        this.brandChartData = {
            labels: top.map(b => b.brand),
            datasets: [{
                data: top.map(b => b.count),
                label: 'Véhicules',
                backgroundColor: top.map((_, i) => colors[i % colors.length]),
                hoverBackgroundColor: top.map((_, i) => colors[i % colors.length].replace('0.75', '0.95')),
                borderRadius: 8,
                barThickness: 26,
                borderWidth: 0
            }]
        };

        this.brandOptions = {
            responsive: true,
            maintainAspectRatio: false,
            indexAxis: 'y',
            animation: { duration: 900, easing: 'easeOutQuart' },
            plugins: {
                legend: { display: false },
                tooltip: { backgroundColor: 'rgba(15,23,42,0.95)', titleColor: '#e2e8f0', bodyColor: '#94a3b8', padding: 14, cornerRadius: 12, callbacks: { label: (ctx: any) => ` ${ctx.parsed.x} véhicule(s)` } }
            },
            scales: {
                x: { beginAtZero: true, grid: { color: 'rgba(99,102,241,0.06)' }, ticks: { color: '#64748b', font: { size: 11 } }, border: { display: false } },
                y: { grid: { display: false }, ticks: { color: '#94a3b8', font: { size: 12, weight: 'bold' } }, border: { display: false } }
            },
            onClick: (_event: any, activeElements: any[]) => {
                if (activeElements.length > 0) {
                    const idx = activeElements[0].index;
                    this.openBrandDrillDown(top[idx].brand);
                }
            }
        };
    }

    /* ── Monthly Line ──────────────────────────────── */
    private buildLineChart(): void {
        const trips = this.getFilteredTrips();
        const vehicles = this.getFilteredVehicles();

        let datasets: any[] = [];

        if (this.filterBrand || this.filterVehicle) {
            // Detailed per-vehicle display for the selected brand or vehicle
            vehicles.forEach((v, index) => {
                const vTrips = trips.filter(t => this.isTripForVehicle(t, v));
                const vMonthKm: number[] = new Array(12).fill(0);
                const vMonthTrips: number[] = new Array(12).fill(0);

                vTrips.forEach(t => {
                    if (t.dateDepartIso && t.distanceKm) {
                        const m = new Date(t.dateDepartIso).getMonth();
                        vMonthKm[m] += t.distanceKm;
                        vMonthTrips[m]++;
                    }
                });

                const color = this.getBrandColor(index);

                // Distance dataset for this vehicle
                datasets.push({
                    data: vMonthKm.map(val => Math.round(val * 10) / 10),
                    label: `${v.plate} - Distance (km)`,
                    borderColor: color,
                    backgroundColor: `${color}12`, // 7% opacity
                    borderWidth: 2.5,
                    tension: 0.45,
                    fill: true,
                    pointBackgroundColor: color,
                    pointBorderColor: '#1e1b4b',
                    pointBorderWidth: 2,
                    pointRadius: 5,
                    pointHoverRadius: 9
                });

                // Trips dataset for this vehicle
                datasets.push({
                    data: vMonthTrips,
                    label: `${v.plate} - Trajets`,
                    borderColor: '#ec4899',
                    backgroundColor: 'transparent',
                    borderWidth: 1.5,
                    borderDash: [4, 4],
                    tension: 0.45,
                    fill: false,
                    pointBackgroundColor: '#ec4899',
                    pointBorderColor: '#1e1b4b',
                    pointBorderWidth: 1.5,
                    pointRadius: 3.5,
                    pointHoverRadius: 7,
                    yAxisID: 'y1'
                });
            });
        } else {
            // Original code: Global aggregate display for all vehicles
            const monthKm: number[] = new Array(12).fill(0);
            const monthTrips: number[] = new Array(12).fill(0);

            trips.forEach(t => {
                if (t.dateDepartIso && t.distanceKm) {
                    const m = new Date(t.dateDepartIso).getMonth();
                    monthKm[m] += t.distanceKm;
                    monthTrips[m]++;
                }
            });

            datasets = [
                {
                    data: monthKm.map(v => Math.round(v * 10) / 10),
                    label: 'Distance (km)',
                    borderColor: '#6366f1',
                    backgroundColor: 'rgba(99,102,241,0.12)',
                    borderWidth: 2.5,
                    tension: 0.45,
                    fill: true,
                    pointBackgroundColor: '#6366f1',
                    pointBorderColor: '#1e1b4b',
                    pointBorderWidth: 2,
                    pointRadius: 5,
                    pointHoverRadius: 9
                },
                {
                    data: monthTrips,
                    label: 'Trajets',
                    borderColor: '#ec4899',
                    backgroundColor: 'rgba(236,72,153,0.08)',
                    borderWidth: 2,
                    tension: 0.45,
                    fill: false,
                    pointBackgroundColor: '#ec4899',
                    pointBorderColor: '#1e1b4b',
                    pointBorderWidth: 2,
                    pointRadius: 4,
                    pointHoverRadius: 8,
                    yAxisID: 'y1'
                }
            ];
        }

        this.lineChartData = {
            labels: this.monthNamesShort,
            datasets: datasets
        };

        this.lineOptions = {
            responsive: true,
            maintainAspectRatio: false,
            interaction: { mode: 'index', intersect: false },
            animation: { duration: 900, easing: 'easeOutQuart' },
            plugins: {
                legend: { display: true, position: 'top', labels: { color: '#94a3b8', usePointStyle: true, padding: 20, font: { size: 11 } } },
                tooltip: { backgroundColor: 'rgba(15,23,42,0.95)', titleColor: '#e2e8f0', bodyColor: '#94a3b8', borderColor: 'rgba(99,102,241,0.3)', borderWidth: 1, padding: 14, cornerRadius: 12 }
            },
            scales: {
                y: { beginAtZero: true, grid: { color: 'rgba(99,102,241,0.06)' }, ticks: { color: '#64748b', font: { size: 11 } }, border: { display: false }, title: { display: true, text: 'km', color: '#475569', font: { size: 10 } } },
                y1: { beginAtZero: true, position: 'right', grid: { display: false }, ticks: { color: '#ec4899', font: { size: 11 } }, border: { display: false }, title: { display: true, text: 'Trajets', color: '#ec4899', font: { size: 10 } } },
                x: { grid: { display: false }, ticks: { color: '#94a3b8', font: { size: 11 } }, border: { display: false } }
            },
            onClick: (_event: any, activeElements: any[]) => {
                if (activeElements.length > 0) {
                    const idx = activeElements[0].index;
                    this.openMonthDrillDown(idx);
                }
            }
        };
    }

    /* ── Scatter: Capacity vs Mileage ──────────────── */
    private buildScatterChart(): void {
        const vehicles = this.getFilteredVehicles();

        // Couleurs et formes par statut
        const statusConfig: Record<string, { bg: string; border: string; shape: 'circle' | 'rect' | 'triangle' | 'rectRot' }> = {
            'En Service': {
                bg: 'rgba(16, 185, 129, 0.7)',
                border: '#10b981',
                shape: 'circle'
            },
            'Maintenance': {
                bg: 'rgba(245, 158, 11, 0.7)',
                border: '#f59e0b',
                shape: 'triangle'
            },
            'Hors Service': {
                bg: 'rgba(239, 68, 68, 0.7)',
                border: '#ef4444',
                shape: 'rect'
            }
        };
        const defaultConfig = { bg: 'rgba(99, 102, 241, 0.6)', border: '#6366f1', shape: 'circle' as const };

        // Calcul des capacités min/max pour ajuster la taille des points
        const capacities = vehicles.map(v => v.capacity ?? 0).filter(c => c > 0);
        const maxCap = capacities.length > 0 ? Math.max(...capacities) : 1;

        // Regroupement par statut
        const grouped = new Map<string, { x: number; y: number; label: string; model: string }[]>();
        vehicles.forEach(v => {
            if (v.mileage && v.capacity) {
                const key = v.status || 'Inconnu';
                if (!grouped.has(key)) grouped.set(key, []);
                grouped.get(key)!.push({
                    x: v.capacity,
                    y: v.mileage,
                    label: v.plate,
                    model: v.model
                });
            }
        });

        // Construction des datasets
        this.scatterData = {
            datasets: Array.from(grouped, ([status, points]) => {
                const cfg = statusConfig[status] || defaultConfig;
                // Taille des points proportionnelle à la capacité (entre 4 et 14)
                const pointRadius = (p: { x: number; y: number }) => {
                    const cap = p.x;
                    return Math.max(4, Math.min(14, 4 + (cap / maxCap) * 10));
                };

                return {
                    label: status,
                    data: points.map(p => ({
                        x: p.x,
                        y: p.y,
                        // Métadonnées pour le tooltip
                        vehiclePlate: p.label,
                        vehicleModel: p.model,
                        status: status
                    })),
                    backgroundColor: cfg.bg,
                    borderColor: cfg.border,
                    borderWidth: 1.5,
                    pointStyle: cfg.shape,
                    pointRadius: (ctx: any) => {
                        const raw = ctx.raw;
                        return raw ? pointRadius(raw) : 6;
                    },
                    pointHoverRadius: 12,
                    pointHoverBorderWidth: 3,
                    pointHoverBorderColor: '#fff',
                    // Ombre portée (via plugin option, mais pas nécessaire)
                    shadowOffsetX: 0,
                    shadowOffsetY: 4,
                    shadowBlur: 8,
                    shadowColor: 'rgba(0,0,0,0.3)'
                };
            })
        };

        // Calcul des médianes pour les lignes de référence
        const allX = vehicles.map(v => v.capacity ?? 0).filter(c => c > 0);
        const allY = vehicles.map(v => v.mileage ?? 0).filter(m => m > 0);
        const medianX = allX.length > 0 ? allX.sort((a, b) => a - b)[Math.floor(allX.length / 2)] : 0;
        const medianY = allY.length > 0 ? allY.sort((a, b) => a - b)[Math.floor(allY.length / 2)] : 0;

        // Ajout des lignes de référence (médianes) via des datasets de type 'line'
        // Ils ne seront pas affichés dans la légende
        const xMin = Math.min(...allX, 0);
        const xMax = Math.max(...allX, 100);
        const yMin = Math.min(...allY, 0);
        const yMax = Math.max(...allY, 1000);

        // Ligne verticale (médiane capacité)
        this.scatterData.datasets.push({
            label: 'Médiane Capacité',
            data: [{ x: medianX, y: yMin }, { x: medianX, y: yMax }],
            type: 'line',
            borderColor: 'rgba(99, 102, 241, 0.4)',
            borderWidth: 1.5,
            borderDash: [6, 4],
            pointRadius: 0,
            pointHoverRadius: 0,
            fill: false,
            showLine: true,
            backgroundColor: 'transparent',
            order: 2, // affiché derrière les points
            legend: { display: false }
        } as any);

        // Ligne horizontale (médiane kilométrage)
        this.scatterData.datasets.push({
            label: 'Médiane Kilométrage',
            data: [{ x: xMin, y: medianY }, { x: xMax, y: medianY }],
            type: 'line',
            borderColor: 'rgba(236, 72, 153, 0.4)',
            borderWidth: 1.5,
            borderDash: [6, 4],
            pointRadius: 0,
            pointHoverRadius: 0,
            fill: false,
            showLine: true,
            backgroundColor: 'transparent',
            order: 2,
            legend: { display: false }
        } as any);

        // Mise à jour des options du scatter
        this.scatterOptions = {
            responsive: true,
            maintainAspectRatio: false,
            animation: { duration: 700, easing: 'easeOutQuad' },
            plugins: {
                legend: {
                    display: true,
                    position: 'top',
                    labels: {
                        color: '#94a3b8',
                        usePointStyle: true,
                        padding: 16,
                        font: { size: 11, weight: '600' },
                        pointStyle: 'circle'
                    }
                },
                tooltip: {
                    backgroundColor: 'rgba(15, 23, 42, 0.92)',
                    titleColor: '#e2e8f0',
                    bodyColor: '#cbd5e1',
                    borderColor: 'rgba(99, 102, 241, 0.3)',
                    borderWidth: 1,
                    padding: 14,
                    cornerRadius: 12,
                    callbacks: {
                        title: (items: any[]) => {
                            if (!items.length) return '';
                            const raw = items[0].raw;
                            return `🚛 ${raw.vehiclePlate || 'N/A'}`;
                        },
                        label: (ctx: any) => {
                            const raw = ctx.raw;
                            return [
                                `Modèle : ${raw.vehicleModel || '—'}`,
                                `Statut : ${raw.status || '—'}`,
                                `Capacité : ${raw.x} t`,
                                `Kilométrage : ${raw.y} km`
                            ];
                        },
                        afterLabel: (ctx: any) => {
                            // Ajout du ratio capacité/km
                            const ratio = ctx.raw.y > 0 ? (ctx.raw.x / ctx.raw.y * 1000).toFixed(1) : '—';
                            return `Ratio (t/1000km) : ${ratio}`;
                        }
                    }
                }
            },
            scales: {
                x: {
                    title: {
                        display: true,
                        text: 'Capacité (tonnes)',
                        color: '#475569',
                        font: { size: 11, weight: '700' }
                    },
                    grid: {
                        color: 'rgba(99, 102, 241, 0.06)',
                        drawTicks: false
                    },
                    ticks: {
                        color: '#64748b',
                        font: { size: 10 },
                        callback: (value: any) => value + ' t'
                    },
                    border: { display: false },
                    min: 0,
                    suggestedMax: Math.max(...allX, 10) * 1.15
                },
                y: {
                    title: {
                        display: true,
                        text: 'Kilométrage (km)',
                        color: '#475569',
                        font: { size: 11, weight: '700' }
                    },
                    grid: {
                        color: 'rgba(99, 102, 241, 0.06)',
                        drawTicks: false
                    },
                    ticks: {
                        color: '#64748b',
                        font: { size: 10 },
                        callback: (value: any) => value >= 1000 ? (value / 1000) + 'k' : value
                    },
                    border: { display: false },
                    min: 0,
                    suggestedMax: Math.max(...allY, 1000) * 1.15
                }
            },
            // Désactiver les hover sur les lignes de référence
            hover: {
                mode: 'nearest',
                intersect: true
            },
            onClick: (event: any, elements: any[]) => {
                // Optionnel : drill-down sur un point (exemple)
                if (elements.length > 0) {
                    const datasetIndex = elements[0].datasetIndex;
                    const index = elements[0].index;
                    const dataset = this.scatterData.datasets[datasetIndex];
                    if (dataset && dataset.data && dataset.data[index]) {
                        const point = dataset.data[index] as any;
                        // Ouvrir un drill-down véhicule (fonction existante)
                        // On peut récupérer le véhicule par plaque
                        const plate = point.vehiclePlate;
                        if (plate) {
                            const vehicle = this.allVehicles.find(v => v.plate === plate);
                            if (vehicle) {
                                // Reuse openVehicleDrillDown avec l'ID
                                const top = this.topMileageVehicles.find(t => t.id === vehicle.id);
                                if (top) this.openVehicleDrillDown(top);
                                else {
                                    // fallback : créer un objet minimal
                                    this.openVehicleDrillDown({
                                        id: vehicle.id,
                                        plate: vehicle.plate,
                                        model: vehicle.model,
                                        brand: vehicle.brand || '',
                                        driverName: vehicle.driverName || '',
                                        status: vehicle.status || '',
                                        totalKm: point.y,
                                        percentage: 0,
                                        tripCount: 0
                                    });
                                }
                            }
                        }
                    }
                }
            }
        };
    }

    /* ── Helper pour le footer Scatter ─────────────────────────── */
    getScatterPointCount(): number {
        let count = 0;
        if (this.scatterData && this.scatterData.datasets) {
            this.scatterData.datasets.forEach((ds: any) => {
                if (ds.data && ds.data.length) {
                    count += ds.data.length;
                }
            });
        }
        return count;
    }

    /* ── Helper pour le footer Stacked Bar ────────────────────── */
    getTripBarMonthCount(): number {
        return this.tripBarData?.labels?.length || 0;
    }

    getTripBarTotalTrips(): number {
        let total = 0;
        if (this.tripBarData && this.tripBarData.datasets) {
            this.tripBarData.datasets.forEach((ds: any) => {
                if (ds.data && ds.data.length) {
                    total += ds.data.reduce((a: number, b: number) => a + b, 0);
                }
            });
        }
        return total;
    }

    /* ── Trip Status Stacked Bar ────────────────────── */
    private buildTripBarChart(): void {
        const trips = this.getFilteredTrips();
        const monthStatusMap: Record<string, Record<string, number>> = {};

        this.monthNamesShort.forEach(m => { monthStatusMap[m] = {}; });

        trips.forEach(t => {
            if (t.dateDepartIso) {
                const mIdx = new Date(t.dateDepartIso).getMonth();
                const key = this.monthNamesShort[mIdx];
                const status = t.status || 'Autre';
                monthStatusMap[key][status] = (monthStatusMap[key][status] ?? 0) + 1;
            }
        });

        const allStatuses = new Set<string>();
        Object.values(monthStatusMap).forEach(s => Object.keys(s).forEach(k => allStatuses.add(k)));

        const statusColors: Record<string, string> = {
            'Actif': 'rgba(16,185,129,0.75)',
            'En Cours': 'rgba(99,102,241,0.75)',
            'Terminé': 'rgba(59,130,246,0.7)',
            'Planifié': 'rgba(139,92,246,0.7)',
            'Annulé': 'rgba(239,68,68,0.65)'
        };

        this.tripBarData = {
            labels: this.monthNamesShort,
            datasets: Array.from(allStatuses).map(status => ({
                label: status,
                data: this.monthNamesShort.map(m => monthStatusMap[m][status] ?? 0),
                backgroundColor: statusColors[status] ?? 'rgba(148,163,184,0.5)',
                borderRadius: 4,
                borderWidth: 0
            }))
        };

        this.tripBarOptions = {
            responsive: true,
            maintainAspectRatio: false,
            animation: { duration: 800 },
            plugins: {
                legend: { display: true, position: 'top', labels: { color: '#94a3b8', usePointStyle: true, padding: 14, font: { size: 10 } } },
                tooltip: { backgroundColor: 'rgba(15,23,42,0.95)', titleColor: '#e2e8f0', bodyColor: '#94a3b8', padding: 12, cornerRadius: 12, mode: 'index' }
            },
            scales: {
                x: { stacked: true, grid: { display: false }, ticks: { color: '#94a3b8', font: { size: 11 } }, border: { display: false } },
                y: { stacked: true, beginAtZero: true, grid: { color: 'rgba(99,102,241,0.06)' }, ticks: { color: '#64748b', font: { size: 11 } }, border: { display: false } }
            }
        };
    }

    /* ═══════════════════════════════════════════════════
       DRILL-DOWN OPENERS
       ═══════════════════════════════════════════════════ */
    openMonthDrillDown(monthIndex: number): void {
        const trips = this.getFilteredTrips().filter(t => {
            if (!t.dateDepartIso) return false;
            return new Date(t.dateDepartIso).getMonth() === monthIndex;
        });

        const totalKm = trips.reduce((s, t) => s + (t.distanceKm ?? 0), 0);
        const vehicleIds = new Set<string>();
        trips.forEach(t => {
            const matchedVehicle = this.allVehicles.find(v => this.isTripForVehicle(t, v));
            const vid = matchedVehicle?.id || t.vehicleId;
            if (vid) {
                vehicleIds.add(vid);
            }
        });

        this.drillMonth = {
            monthLabel: this.monthNames[monthIndex],
            monthIndex,
            totalKm: Math.round(totalKm),
            tripCount: trips.length,
            avgKmPerTrip: trips.length > 0 ? Math.round(totalKm / trips.length) : 0,
            vehicleCount: vehicleIds.size,
            trips: trips.map(t => ({
                id: t.id,
                vehiclePlate: t.vehicle ?? t.vehiculeMatricule ?? '-',
                driverName: t.driver ?? t.chauffeurNom ?? '-',
                from: t.from,
                to: t.to,
                distanceKm: Math.round(t.distanceKm ?? 0),
                status: t.status,
                statusLabel: t.status,
                date: t.date
            }))
        };

        this.drillDownType = 'month';
        this.drillDownOpen = true;
        this.cdr.detectChanges();
    }

    openStatusDrillDown(status: string): void {
        const vehicles = this.getFilteredVehicles().filter(v => v.status === status);

        this.drillStatus = {
            statusLabel: status,
            statusIcon: this.getStatusIcon(status),
            statusClass: this.getStatusClass(status),
            count: vehicles.length,
            percentage: this.kpiTotal > 0 ? Math.round((vehicles.length / this.kpiTotal) * 100) : 0,
            vehicles: vehicles.map(v => ({
                id: v.id,
                plate: v.plate,
                model: v.model,
                brand: v.brand ?? '-',
                driverName: v.driverName ?? 'Non affecté',
                mileage: v.mileage ?? 0,
                capacity: v.capacity ?? 0
            }))
        };

        this.drillDownType = 'status';
        this.drillDownOpen = true;
        this.cdr.detectChanges();
    }

    openBrandDrillDown(brand: string): void {
        const vehicles = this.getFilteredVehicles().filter(v => (v.brand ?? 'Inconnu') === brand);

        this.drillBrand = {
            brand,
            count: vehicles.length,
            totalCapacity: vehicles.reduce((s, v) => s + (v.capacity ?? 0), 0),
            avgCapacity: vehicles.length > 0 ? Math.round(vehicles.reduce((s, v) => s + (v.capacity ?? 0), 0) / vehicles.length) : 0,
            vehicles: vehicles.map(v => ({
                id: v.id,
                plate: v.plate,
                model: v.model,
                brand: v.brand ?? '-',
                driverName: v.driverName ?? 'Non affecté',
                mileage: v.mileage ?? 0,
                capacity: v.capacity ?? 0
            }))
        };

        this.drillDownType = 'brand';
        this.drillDownOpen = true;
        this.cdr.detectChanges();
    }

    openVehicleDrillDown(vehicle: TopMileageVehicle): void {
        const v = this.allVehicles.find(x => x.id === vehicle.id);
        if (!v) return;

        const trips = this.allTrips.filter(t => this.isTripForVehicle(t, v));

        this.drillVehicle = {
            vehicle: {
                id: v.id,
                plate: v.plate,
                model: v.model,
                brand: v.brand ?? '-',
                driverName: v.driverName ?? 'Non affecté',
                mileage: v.mileage ?? 0,
                capacity: v.capacity ?? 0
            },
            trips: trips.map(t => ({
                id: t.id,
                vehiclePlate: t.vehicle ?? '-',
                driverName: t.driver ?? '-',
                from: t.from,
                to: t.to,
                distanceKm: Math.round(t.distanceKm ?? 0),
                status: t.status,
                statusLabel: t.status,
                date: t.date
            })),
            totalKm: vehicle.totalKm,
            tripCount: trips.length,
            status: v.status,
            statusClass: this.getStatusClass(v.status)
        };

        this.drillDownType = 'vehicle';
        this.drillDownOpen = true;
        this.cdr.detectChanges();
    }

    closeDrillDown(): void {
        this.drillDownOpen = false;
        this.cdr.detectChanges();
    }

    /* ═══════════════════════════════════════════════════
       TABLE FILTERING & PAGINATION
       ═══════════════════════════════════════════════════ */
    applyFiltersAndPaginate(): void {
        const filtered = this.getFilteredVehicles();
        const rows = filtered.map(v => this.mapVehicleRow(v));
        this.totalElements = rows.length;
        const start = this.pageIndex * this.pageSize;
        this.dataSource = rows.slice(start, start + this.pageSize);
    }

    private mapVehicleRow(v: Vehicle): VehicleRow {
        const tripKm = this.allTrips
            .filter(t => this.isTripForVehicle(t, v) && t.distanceKm)
            .reduce((s, t) => s + (t.distanceKm ?? 0), 0);
        return {
            id: v.id,
            plate: v.plate,
            model: v.model,
            brand: v.brand ?? '-',
            status: v.status,
            statusClass: this.getStatusClass(v.status),
            driverName: v.driverName ?? '-',
            mileage: v.mileage ?? 0,
            capacity: v.capacity ?? 0,
            totalDistanceKm: Math.round((v.mileage ?? 0) + tripKm)
        };
    }

    getStatusClass(status: string): string {
        switch (status) {
            case 'En Service': return 'active';
            case 'Maintenance': return 'maintenance';
            case 'Hors Service': return 'inactive';
            default: return 'unknown';
        }
    }

    /* ═══════════════════════════════════════════════════
       UI HANDLERS
       ═══════════════════════════════════════════════════ */
    onPageChange(event: PageEvent): void {
        this.pageIndex = event.pageIndex;
        this.pageSize = event.pageSize;
        this.applyFiltersAndPaginate();
        this.cdr.detectChanges();
    }

    onStatusChange(value: string): void {
        this.filterStatus = value;
        this.pageIndex = 0;
        this.refreshAll();
    }

    onBrandChange(value: string): void {
        this.filterBrand = value;
        this.pageIndex = 0;
        this.refreshAll();
    }

    onVehicleChange(value: string): void {
        this.filterVehicle = value;
        this.pageIndex = 0;
        this.refreshAll();
    }

    clearFilters(): void {
        this.filterStatus = '';
        this.filterBrand = '';
        this.filterVehicle = '';
        this.pageIndex = 0;
        this.refreshAll();
    }

    onKpiClick(kpiType: 'total' | 'active' | 'maintenance' | 'inactive'): void {
        this.selectedKpiType = kpiType;

        if (kpiType === 'total') {
            // Total = clear status filter, show all
            this.filterStatus = '';
        } else {
            const statusMap: Record<string, string> = {
                'active': 'En Service',
                'maintenance': 'Maintenance',
                'inactive': 'Hors Service'
            };
            this.filterStatus = statusMap[kpiType];
        }

        this.pageIndex = 0;
        this.refreshAll();

        // Scroll vers le tableau avec animation
        setTimeout(() => {
            const tableEl = document.querySelector('.fc-table-section');
            if (tableEl) {
                tableEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
        }, 150);
    }

    /** KPI color class for table header highlight */
    get kpiHighlightClass(): string {
        switch (this.selectedKpiType) {
            case 'active': return 'fc-table-section--active';
            case 'maintenance': return 'fc-table-section--maintenance';
            case 'inactive': return 'fc-table-section--inactive';
            case 'total': return 'fc-table-section--total';
            default: return '';
        }
    }

    /** Get selected vehicle info for header display */
    get selectedVehicleInfo(): Vehicle | null {
        if (!this.filterVehicle) return null;
        return this.allVehicles.find(v => v.id === this.filterVehicle) ?? null;
    }

    getStatusIcon(status: string): string {
        switch (status) {
            case 'En Service': return 'check_circle';
            case 'Maintenance': return 'build';
            case 'Hors Service': return 'cancel';
            default: return 'help_outline';
        }
    }

    getTripStatusIcon(status: string): string {
        switch (status) {
            case 'Actif': case 'En Cours': return 'play_circle';
            case 'Terminé': return 'check_circle';
            case 'Planifié': return 'schedule';
            case 'Annulé': return 'cancel';
            default: return 'info';
        }
    }

    getTripStatusClass(status: string): string {
        switch (status) {
            case 'Actif': case 'En Cours': return 'dd-status--active';
            case 'Terminé': return 'dd-status--done';
            case 'Planifié': return 'dd-status--planned';
            case 'Annulé': return 'dd-status--cancelled';
            default: return 'dd-status--default';
        }
    }

    formatKm(km: number): string {
        if (km >= 1000) return `${(km / 1000).toFixed(1)}k km`;
        return `${km} km`;
    }

    getBrandColor(index: number): string {
        const palette = ['#6366f1', '#8b5cf6', '#10b981', '#f59e0b', '#ec4899', '#3b82f6', '#ef4444', '#14b8a6', '#f97316', '#84cc16'];
        return palette[index % palette.length];
    }

    getVehiclesByBrand(brand: string): Vehicle[] {
        return this.allVehicles
            .filter(v => v.brand === brand)
            .sort((a, b) => a.plate.localeCompare(b.plate));
    }

    /* ═══════════════════════════════════════════════════
       INTELLIGENT RELIABILITY CALCULATION
       ═══════════════════════════════════════════════════ */
    /**
     * Calcule la fiabilité de chaque marque dynamiquement à partir
     * des données RÉELLES du parc actuel (pas de liste figée).
     * Proxy : taux de Maintenance/Hors Service par marque, pondéré
     * par le kilométrage moyen.
     */
    private computeBrandReliability(): void {
        const map = new Map<string, { total: number; downCount: number; mileageSum: number }>();

        this.allVehicles.forEach(v => {
            const brand = (v.brand || 'Inconnu').trim();
            const entry = map.get(brand) ?? { total: 0, downCount: 0, mileageSum: 0 };
            entry.total++;
            if (v.status === 'Maintenance' || v.status === 'Hors Service') {
                entry.downCount++;
            }
            entry.mileageSum += v.mileage ?? 0;
            map.set(brand, entry);
        });

        this.brandReliabilityMap.clear();
        map.forEach((stats, brand) => {
            const maintenanceRate = stats.total > 0 ? stats.downCount / stats.total : 0;
            const avgMileage = stats.total > 0 ? stats.mileageSum / stats.total : 0;

            // Pénalité de base : taux de panne (0% panne => 10, 100% panne => 0)
            let score = 10 * (1 - maintenanceRate);

            // Ajustement par le kilométrage : si la marque tombe en panne
            // mais avec un kilométrage élevé, on atténue la pénalité
            if (maintenanceRate > 0 && avgMileage > 0) {
                const enduranceBonus = Math.min(avgMileage / 200000, 1) * 1.5;
                score = Math.min(10, score + enduranceBonus);
            }

            // Échantillon trop faible => on tire vers la valeur neutre
            const confidence: 'low' | 'medium' | 'high' =
                stats.total >= this.MIN_SAMPLE_FOR_CONFIDENCE * 2 ? 'high'
                    : stats.total >= this.MIN_SAMPLE_FOR_CONFIDENCE ? 'medium'
                        : 'low';

            if (confidence === 'low') {
                const weight = stats.total / this.MIN_SAMPLE_FOR_CONFIDENCE;
                score = score * weight + this.DEFAULT_RELIABILITY_SCORE * (1 - weight);
            }

            this.brandReliabilityMap.set(brand, {
                brand,
                score: Math.round(score * 10) / 10,
                maintenanceRate: Math.round(maintenanceRate * 100),
                avgMileage: Math.round(avgMileage),
                vehicleCount: stats.total,
                confidence
            });
        });
    }

    /** Score de fiabilité pour une marque donnée */
    private getReliabilityScore(brand: string | undefined): number {
        if (!brand) return this.DEFAULT_RELIABILITY_SCORE;
        const entry = this.brandReliabilityMap.get(brand.trim());
        return entry ? entry.score : this.DEFAULT_RELIABILITY_SCORE;
    }

    /* ═══════════════════════════════════════════════════
       INTELLIGENT PROXIMITY CALCULATION
       ═══════════════════════════════════════════════════ */
    /**
     * Calcule la proximité logistique réelle entre la position GPS
     * du véhicule et le secteur le plus proche ayant une demande active.
     */
    private computeProximity(v: Vehicle): ProximityResult {
        const vAny = v as any;
        const vLat = vAny.latitude ?? vAny.lat ?? vAny.coordinates?.[0];
        const vLng = vAny.longitude ?? vAny.lng ?? vAny.coordinates?.[1];

        if (vLat == null || vLng == null || this.sectors.length === 0) {
            return { score: 4, distanceKm: null, nearestSectorName: null };
        }

        const activeSectors = this.sectors.filter(s => s.hasActiveDemand !== false);
        const candidates = activeSectors.length > 0 ? activeSectors : this.sectors;

        let nearest: { name: string; distKm: number } | null = null;
        candidates.forEach(s => {
            const distKm = this.haversineKm(vLat, vLng, s.lat, s.lng);
            if (!nearest || distKm < nearest.distKm) {
                nearest = { name: s.name, distKm };
            }
        });

        if (!nearest) {
            return { score: 4, distanceKm: null, nearestSectorName: null };
        }

        // < 10km => 5pts | 10-30km => 4pts | 30-60km => 3pts | 60-120km => 2pts | >120km => 1pt
        const nearestDist = (nearest as { name: string; distKm: number }).distKm;
        const nearestName = (nearest as { name: string; distKm: number }).name;
        let score = 1;
        if (nearestDist < 10) score = 5;
        else if (nearestDist < 30) score = 4;
        else if (nearestDist < 60) score = 3;
        else if (nearestDist < 120) score = 2;

        return { score, distanceKm: Math.round(nearestDist), nearestSectorName: nearestName };
    }

    private haversineKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
        const R = 6371;
        const dLat = (lat2 - lat1) * Math.PI / 180;
        const dLon = (lon2 - lon1) * Math.PI / 180;
        const a = Math.sin(dLat / 2) ** 2 +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLon / 2) ** 2;
        return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    }

    /** Charge les secteurs si le service les expose */
    private loadSectorsIfAvailable(): void {
        const svc = this.fleetService as any;
        if (typeof svc.getSecteurs === 'function') {
            svc.getSecteurs().pipe(takeUntil(this.destroy$)).subscribe({
                next: (data: any[]) => {
                    this.sectors = (data || []).filter(s => s.latitude != null && s.longitude != null).map(s => ({
                        id: s.id,
                        name: s.nom || s.name || 'Secteur',
                        lat: s.latitude,
                        lng: s.longitude,
                        hasActiveDemand: s.hasActiveDemand
                    }));
                },
                error: () => { this.sectors = []; }
            });
        }
    }

    /* ═══════════════════════════════════════════════════
       WATERFALL DECOMPOSITION
       ═══════════════════════════════════════════════════ */
    /**
     * Décompose le score de disponibilité moyen de la flotte filtrée
     * en contribution successive de chaque facteur.
     */
    private buildWaterfall(): void {
        const factors: { label: string; value: number; max: number; colorClass: string }[] = [
            { label: 'Opérationnel', value: this.availabilityOperational, max: 40, colorClass: 'wf-operational' },
            { label: 'Carburant', value: this.availabilityFuel, max: 15, colorClass: 'wf-fuel' },
            { label: 'Maintenance', value: this.availabilityMaintenance, max: 20, colorClass: 'wf-maintenance' },
            { label: 'Repos', value: this.availabilityRepos, max: 10, colorClass: 'wf-repos' },
            { label: 'Fiabilité', value: this.availabilityReliability, max: 10, colorClass: 'wf-reliability' },
            { label: 'Proximité', value: this.availabilityProximity, max: 5, colorClass: 'wf-proximity' }
        ];

        let cumulative = 0;
        this.waterfallSteps = factors.map(f => {
            cumulative += f.value;
            return {
                label: f.label,
                value: f.value,
                cumulative: Math.min(cumulative, 100),
                maxValue: f.max,
                colorClass: f.colorClass
            };
        });
        this.waterfallTotal = Math.min(cumulative, 100);
    }

    /* ═══════════════════════════════════════════════════
       HELPER METHODS FOR TEMPLATE
       ═══════════════════════════════════════════════════ */
    getReliabilityEntry(brand: string): BrandReliability | null {
        return this.brandReliabilityMap.get(brand.trim()) ?? null;
    }

    getConfidenceLabel(confidence: 'low' | 'medium' | 'high'): string {
        switch (confidence) {
            case 'high': return 'Fiable';
            case 'medium': return 'Indicatif';
            default: return 'Peu de données';
        }
    }

    trackById(_i: number, item: { id: string }): string {
        return item.id;
    }
}
