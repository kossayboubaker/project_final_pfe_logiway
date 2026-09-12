import { Component, OnInit, OnDestroy, ChangeDetectorRef, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { BaseChartDirective } from 'ng2-charts';
import { ChartConfiguration, ChartType } from 'chart.js';
import { MatIconModule } from '@angular/material/icon';
import { MatDialog, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatTableModule } from '@angular/material/table';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { Subject, forkJoin, takeUntil } from 'rxjs';
import { FleetService, Vehicle, Trip } from '../../../../core/services/fleet.service';
import { LeaveService, LeaveRecord } from '../../../../core/services/leave.service';
import { DriverDetailDialogComponent, DetailDialogData } from './driver-detail-dialog/driver-detail-dialog.component';

interface DriverRow {
    id: string;
    name: string;
    email: string;
    vehiclePlate: string;
    vehicleModel: string;
    tripCount: number;
    totalDistanceKm: number;
    avgSpeedKmh: number;
    incidentCount: number;
    pauseComplianceRate: number;
    drivingScore: number;
    weeklyDrivingHours: number;
    warningNearLimit: boolean;
    seniorityMonths: number;
    ecoScore: number;
    pauseTaken: number;
    pauseMissed: number;
    status: string;
    statusClass: string;
}

interface DriverSummary {
    driverId: string;
    driverName: string;
    driverEmail: string;
    trips: Trip[];
    totalKm: number;
    avgSpeed: number;
    incidents: number;
    pausesOk: number;
    pausesMissed: number;
    totalDrivingMinutes: number;
    ecoScore: number;
    vehiclePlate: string;
    vehicleModel: string;
    seniorityMonths: number;
    status: string;
}

@Component({
    selector: 'app-driver-chart',
    standalone: true,
    imports: [
        CommonModule,
        FormsModule,
        BaseChartDirective,
        MatIconModule,
        MatDialogModule,
        MatTableModule,
        MatPaginatorModule
    ],
    templateUrl: './driver-chart.component.html',
    styleUrls: ['./driver-chart.component.css']
})
export class DriverChartComponent implements OnInit, OnDestroy {
    private readonly destroy$ = new Subject<void>();

    allVehicles: Vehicle[] = [];
    allTrips: Trip[] = [];
    allLeaves: LeaveRecord[] = [];
    driverSummaries: DriverSummary[] = [];

    kpiTotal = 0;
    kpiOnMission = 0;
    kpiAvailable = 0;
    kpiAvgScore = 0;
    kpiTotalTrips = 0;
    kpiTotalDistanceKm = 0;
    kpiAvgSpeed = 0;
    kpiPauseRate = 0;
    kpiTotalPausesOk = 0;
    kpiTotalPausesMissed = 0;

    displayedColumns = ['name', 'vehicle', 'trips', 'distance', 'speed', 'score', 'pauseTaken', 'pauseMissed', 'pauses', 'hours', 'status'];
    dataSource: DriverRow[] = [];
    pageIndex = 0;
    pageSize = 10;
    totalElements = 0;

    filterStatus = '';
    filterScore = '';
    statusOptions = [
        { value: '', label: 'Tous les statuts' },
        { value: 'EN_SERVICE', label: 'En mission' },
        { value: 'LIBRE', label: 'Disponible' }
    ];
    scoreOptions = [
        { value: '', label: 'Tous les scores' },
        { value: 'excellent', label: 'Excellent (≥ 80)' },
        { value: 'bon', label: 'Bon (≥ 60)' },
        { value: 'moyen', label: 'Moyen (≥ 40)' },
        { value: 'faible', label: 'Faible (< 40)' }
    ];

    sortColumn = '';
    sortDirection: 'asc' | 'desc' = 'asc';

    readonly lineType: ChartType = 'line';
    readonly barType: ChartType = 'bar';
    readonly donutType: ChartType = 'doughnut';
    readonly stackedBarType: ChartType = 'bar';

    weeklyHoursOptions: ChartConfiguration['options'] = {};
    weeklyHoursData: ChartConfiguration['data'] = { labels: [], datasets: [] };

    seniorityGrid: { label: string; count: number; pct: number; color: string }[] = [];

    ecoDonutOptions: any = {};
    ecoDonutData: any = { labels: [], datasets: [] };

    pauseOptions: ChartConfiguration['options'] = {};
    pauseData: ChartConfiguration['data'] = { labels: [], datasets: [] };

    private openDialogRef: MatDialogRef<DriverDetailDialogComponent> | null = null;
    private monthNamesShort = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin', 'Juil', 'Août', 'Sep', 'Oct', 'Nov', 'Déc'];

    constructor(
        private readonly fleetService: FleetService,
        private readonly leaveService: LeaveService,
        private readonly cdr: ChangeDetectorRef,
        private readonly dialog: MatDialog
    ) { }

    ngOnInit(): void {
        this.loadData();
    }

    ngOnDestroy(): void {
        this.destroy$.next();
        this.destroy$.complete();
    }

    private loadData(): void {
        forkJoin({
            vehicles: this.fleetService.getVehicles(),
            trips: this.fleetService.getTrips(),
            leaves: this.leaveService.getLeaves()
        })
            .pipe(takeUntil(this.destroy$))
            .subscribe({
                next: ({ vehicles, trips, leaves }) => {
                    this.allVehicles = vehicles;
                    this.allTrips = trips;
                    this.allLeaves = leaves;
                    this.computeDriverSummaries();
                    this.refreshAll();
                },
                error: () => {
                    this.allVehicles = [];
                    this.allTrips = [];
                    this.allLeaves = [];
                    this.cdr.detectChanges();
                }
            });
    }

    private computeDriverSummaries(): void {
        const driverMap = new Map<string, DriverSummary>();
        const earliestDateByDriver = new Map<string, Date>();

        this.allTrips.forEach(t => {
            if (!t.driverId && !t.chauffeurNom) return;
            const key = t.driverId || t.chauffeurNom || 'unknown';
            if (!driverMap.has(key)) {
                driverMap.set(key, {
                    driverId: key,
                    driverName: t.chauffeurNom || t.driver || 'Inconnu',
                    driverEmail: t.driverEmail || '',
                    trips: [],
                    totalKm: 0,
                    avgSpeed: 0,
                    incidents: 0,
                    pausesOk: 0,
                    pausesMissed: 0,
                    totalDrivingMinutes: 0,
                    ecoScore: 0,
                    vehiclePlate: '',
                    vehicleModel: '',
                    seniorityMonths: 0,
                    status: 'LIBRE'
                });
            }
            const s = driverMap.get(key)!;
            s.trips.push(t);
            s.totalKm += t.distanceKm || 0;
            if (t.dureeReelleMinutes) {
                s.totalDrivingMinutes += t.dureeReelleMinutes;
            }

            if (t.dateDepartIso) {
                const dt = new Date(t.dateDepartIso);
                if (!earliestDateByDriver.has(key) || dt < earliestDateByDriver.get(key)!) {
                    earliestDateByDriver.set(key, dt);
                }
            }

            if (t.retardMinutes && t.retardMinutes > 15) {
                s.incidents++;
            }
            if (t.statutPerformance === 'RETARD' || t.statutPerformance === 'INCIDENT') {
                s.incidents++;
            }
            if (!s.vehiclePlate && t.vehiculeMatricule) {
                s.vehiclePlate = t.vehiculeMatricule;
                const v = this.allVehicles.find(v => v.plate === t.vehiculeMatricule);
                if (v) {
                    s.vehicleModel = v.model;
                }
            }
        });

        this.allVehicles.forEach(v => {
            if (v.driverId || v.driverName) {
                const key = v.driverId || v.driverName || 'unknown';
                if (!driverMap.has(key)) {
                    driverMap.set(key, {
                        driverId: key,
                        driverName: v.driverName || 'Inconnu',
                        driverEmail: '',
                        trips: [],
                        totalKm: 0,
                        avgSpeed: 0,
                        incidents: 0,
                        pausesOk: 0,
                        pausesMissed: 0,
                        totalDrivingMinutes: 0,
                        ecoScore: 0,
                        vehiclePlate: v.plate,
                        vehicleModel: v.model,
                        seniorityMonths: 0,
                        status: 'LIBRE'
                    });
                }
                const s = driverMap.get(key)!;
                if (!s.vehiclePlate) {
                    s.vehiclePlate = v.plate;
                    s.vehicleModel = v.model;
                }
            }
        });

        driverMap.forEach((s, key) => {
            s.status = s.trips.some(t => t.status === 'En Cours' || t.status === 'Actif')
                ? 'EN_SERVICE' : 'LIBRE';

            const earliest = earliestDateByDriver.get(key);
            if (earliest) {
                s.seniorityMonths = Math.floor(
                    (new Date().getTime() - earliest.getTime()) / (1000 * 60 * 60 * 24 * 30.44)
                );
            } else {
                const tripCount = s.trips.length;
                s.seniorityMonths = Math.max(1, Math.round(tripCount * 1.7));
            }

            s.trips.forEach(t => {
                const duree = t.dureeReelleMinutes || t.dureeEstimeeMinutes || 0;
                if (duree <= 0) return;

                const SEUIL_4H30 = 270;
                const SEUIL_6H = 360;
                const aRetardSignificatif = t.retardMinutes != null && t.retardMinutes > 30;
                const estTermineOK = t.status === 'Terminé' || t.status === 'COMPLETE';

                if (duree >= SEUIL_6H) {
                    if (estTermineOK && !aRetardSignificatif) {
                        s.pausesOk += 2;
                    } else if (aRetardSignificatif) {
                        s.pausesMissed += 2;
                    } else {
                        s.pausesOk += 1;
                        s.pausesMissed += 1;
                    }
                } else if (duree >= SEUIL_4H30) {
                    if (estTermineOK && !aRetardSignificatif) {
                        s.pausesOk++;
                    } else {
                        s.pausesMissed++;
                    }
                } else if (duree > 150) {
                    if (aRetardSignificatif) {
                        s.pausesMissed++;
                    } else {
                        s.pausesOk++;
                    }
                }
            });

            const completionRate = s.trips.filter(t => t.status === 'Terminé').length / Math.max(s.trips.length, 1);
            const onTimeRate = s.trips.filter(t =>
                t.status === 'Terminé' && (!t.retardMinutes || t.retardMinutes <= 15)
            ).length / Math.max(s.trips.filter(t => t.status === 'Terminé').length, 1);
            const incidentPenalty = Math.min(s.incidents / Math.max(s.trips.length, 1), 0.5);
            const pauseScore = s.pausesOk / Math.max(s.pausesOk + s.pausesMissed, 1);
            let speedEfficiency = 0.7;
            if (s.totalDrivingMinutes > 60 && s.totalKm > 10) {
                const avgSpeed = s.totalKm / (s.totalDrivingMinutes / 60);
                speedEfficiency = Math.min(1, Math.max(0, 1 - Math.abs(avgSpeed - 60) / 80));
            }

            s.ecoScore = Math.min(100, Math.round(
                completionRate * 25 +
                onTimeRate * 20 +
                (1 - incidentPenalty) * 20 +
                pauseScore * 20 +
                speedEfficiency * 15
            ));

            const speedValid = s.trips.filter(t => t.distanceKm && t.dureeReelleMinutes && t.dureeReelleMinutes > 0);
            s.avgSpeed = speedValid.length > 0
                ? Math.round(speedValid.reduce((sum, t) => sum + (t.distanceKm! / (t.dureeReelleMinutes! / 60)), 0) / speedValid.length * 10) / 10
                : 0;
        });

        this.driverSummaries = Array.from(driverMap.values());
    }

    refreshAll(): void {
        const filtered = this.getFilteredSummaries();
        this.computeKpis(filtered);
        this.buildCharts(filtered);
        this.applyFiltersAndPaginate();
        this.cdr.detectChanges();
    }

    private computeKpis(filtered: DriverSummary[]): void {
        this.kpiTotal = filtered.length;
        this.kpiOnMission = filtered.filter(d => d.status === 'EN_SERVICE').length;
        this.kpiAvailable = filtered.filter(d => d.status === 'LIBRE').length;
        this.kpiTotalTrips = filtered.reduce((sum, d) => sum + d.trips.length, 0);
        this.kpiTotalDistanceKm = Math.round(filtered.reduce((sum, d) => sum + d.totalKm, 0));
        this.kpiAvgScore = filtered.length > 0
            ? Math.round(filtered.reduce((sum, d) => sum + d.ecoScore, 0) / filtered.length)
            : 0;

        const speedSums = filtered.filter(d => d.avgSpeed > 0);
        this.kpiAvgSpeed = speedSums.length > 0
            ? Math.round(speedSums.reduce((sum, d) => sum + d.avgSpeed, 0) / speedSums.length)
            : 0;

        const withTrips = filtered.filter(d => d.trips.length > 0);
        this.kpiTotalPausesOk = withTrips.reduce((sum, d) => sum + d.pausesOk, 0);
        const totalMissed = withTrips.reduce((sum, d) => sum + d.pausesMissed, 0);
        this.kpiTotalPausesMissed = totalMissed;
        const totalPauseTotal = this.kpiTotalPausesOk + totalMissed;
        this.kpiPauseRate = totalPauseTotal > 0 ? Math.round((this.kpiTotalPausesOk / totalPauseTotal) * 100) : 0;
    }

    private getFilteredSummaries(): DriverSummary[] {
        return this.driverSummaries.filter(d => {
            if (this.filterStatus && d.status !== this.filterStatus) return false;
            if (this.filterScore) {
                const score = d.ecoScore;
                if (this.filterScore === 'excellent' && score < 80) return false;
                if (this.filterScore === 'bon' && (score < 60 || score >= 80)) return false;
                if (this.filterScore === 'moyen' && (score < 40 || score >= 60)) return false;
                if (this.filterScore === 'faible' && score >= 40) return false;
            }
            return true;
        });
    }

    private buildCharts(filtered: DriverSummary[]): void {
        this.buildWeeklyHoursChart(filtered);
        this.buildSeniorityChart(filtered);
        this.buildEcoDonut(filtered);
        this.buildPauseChart(filtered);
    }

    private buildWeeklyHoursChart(filtered: DriverSummary[]): void {
        const days = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];
        const weeklyData = days.map((_, dayIdx) => {
            const dayTrips = filtered.reduce((sum, d) => {
                const dayTripsForDriver = d.trips.filter(t => {
                    if (!t.dateDepartIso) return false;
                    const dt = new Date(t.dateDepartIso);
                    return dt.getDay() === ((dayIdx + 1) % 7);
                });
                return sum + dayTripsForDriver.reduce((s, t) => s + ((t.dureeReelleMinutes || 60) / 60), 0);
            }, 0);
            return Math.round(dayTrips * 10) / 10;
        });
        const regLimit = 48;

        this.weeklyHoursData = {
            labels: days,
            datasets: [
                {
                    data: weeklyData,
                    label: 'Heures de conduite',
                    borderColor: '#6366f1',
                    backgroundColor: 'rgba(99,102,241,0.15)',
                    fill: true,
                    tension: 0.4,
                    pointBackgroundColor: '#6366f1',
                    pointBorderColor: '#1e1b4b',
                    pointBorderWidth: 2,
                    pointRadius: 5,
                    pointHoverRadius: 8,
                    borderWidth: 2.5
                },
                {
                    data: days.map(() => regLimit),
                    label: 'Limite réglementaire (48h)',
                    borderColor: '#ef4444',
                    backgroundColor: 'transparent',
                    borderDash: [6, 4],
                    borderWidth: 2,
                    pointRadius: 0,
                    pointHoverRadius: 0,
                    fill: false
                }
            ]
        };

        this.weeklyHoursOptions = {
            responsive: true,
            maintainAspectRatio: false,
            onHover: (event: any, elements: any[]) => {
                (event?.native?.target as HTMLElement)!.style.cursor = elements?.length ? 'pointer' : 'default';
            },
            plugins: {
                legend: {
                    display: true,
                    position: 'top',
                    labels: { color: '#94a3b8', usePointStyle: true, padding: 16, font: { size: 11 } }
                },
                tooltip: {
                    backgroundColor: 'rgba(15,23,42,0.95)',
                    titleColor: '#e2e8f0',
                    bodyColor: '#94a3b8',
                    padding: 12,
                    cornerRadius: 10,
                    callbacks: {
                        label: (ctx: any) => ` ${ctx.dataset.label} : ${ctx.parsed.y} heures`
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    grid: { color: 'rgba(99,102,241,0.06)' },
                    ticks: { color: '#64748b', font: { size: 11 } },
                    border: { display: false }
                },
                x: {
                    grid: { display: false },
                    ticks: { color: '#94a3b8', font: { size: 11 } },
                    border: { display: false }
                }
            }
        };
    }

    private buildSeniorityChart(filtered: DriverSummary[]): void {
        const ranges = [
            { label: '< 3 mois', min: 0, max: 3, color: '#6366f1' },
            { label: '3-6 mois', min: 3, max: 6, color: '#3b82f6' },
            { label: '6-12 mois', min: 6, max: 12, color: '#10b981' },
            { label: '1-2 ans', min: 12, max: 24, color: '#f59e0b' },
            { label: '2-5 ans', min: 24, max: 60, color: '#ec4899' },
            { label: '5+ ans', min: 60, max: Infinity, color: '#8b5cf6' }
        ];

        const total = filtered.length || 1;
        this.seniorityGrid = ranges.map(r => {
            const count = filtered.filter(d => d.seniorityMonths >= r.min && d.seniorityMonths < r.max).length;
            return { label: r.label, count, pct: Math.round((count / total) * 100), color: r.color };
        });
    }

    private buildEcoDonut(filtered: DriverSummary[]): void {
        const excellent = filtered.filter(d => d.ecoScore >= 80).length;
        const bon = filtered.filter(d => d.ecoScore >= 60 && d.ecoScore < 80).length;
        const moyen = filtered.filter(d => d.ecoScore >= 40 && d.ecoScore < 60).length;
        const faible = filtered.filter(d => d.ecoScore < 40).length;

        this.ecoDonutData = {
            labels: ['Excellent (≥80)', 'Bon (60-79)', 'Moyen (40-59)', 'Faible (<40)'],
            datasets: [{
                data: [excellent, bon, moyen, faible],
                backgroundColor: ['rgba(16,185,129,0.8)', 'rgba(59,130,246,0.8)', 'rgba(245,158,11,0.8)', 'rgba(239,68,68,0.75)'],
                hoverBackgroundColor: ['#10b981', '#3b82f6', '#f59e0b', '#ef4444'],
                borderWidth: 0,
                hoverOffset: 10
            }]
        };

        this.ecoDonutOptions = {
            responsive: true,
            maintainAspectRatio: false,
            cutout: '72%',
            onHover: (event: any, elements: any[]) => {
                (event?.native?.target as HTMLElement)!.style.cursor = elements?.length ? 'pointer' : 'default';
            },
            plugins: {
                legend: {
                    display: true,
                    position: 'bottom',
                    labels: { color: '#94a3b8', padding: 12, usePointStyle: true, font: { size: 11 } }
                },
                tooltip: {
                    backgroundColor: 'rgba(15,23,42,0.95)',
                    titleColor: '#e2e8f0',
                    bodyColor: '#94a3b8',
                    padding: 12,
                    cornerRadius: 10,
                    callbacks: {
                        label: (ctx: any) => ` ${ctx.label} : ${ctx.parsed} chauffeur(s)`
                    }
                }
            }
        };
    }

    private buildPauseChart(filtered: DriverSummary[]): void {
        const topDrivers = filtered
            .filter(d => d.trips.length > 0)
            .sort((a, b) => (b.pausesOk + b.pausesMissed) - (a.pausesOk + a.pausesMissed))
            .slice(0, 8);

        this.pauseData = {
            labels: topDrivers.map(d => d.driverName),
            datasets: [
                {
                    data: topDrivers.map(d => d.pausesOk),
                    label: 'Pauses prises',
                    backgroundColor: 'rgba(16,185,129,0.75)',
                    hoverBackgroundColor: '#10b981',
                    borderRadius: 4,
                    barThickness: 20
                },
                {
                    data: topDrivers.map(d => d.pausesMissed),
                    label: 'Pauses manquées',
                    backgroundColor: 'rgba(239,68,68,0.7)',
                    hoverBackgroundColor: '#ef4444',
                    borderRadius: 4,
                    barThickness: 20
                }
            ]
        };

        this.pauseOptions = {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: true,
                    position: 'top',
                    labels: { color: '#94a3b8', usePointStyle: true, padding: 16, font: { size: 11 } }
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
                x: {
                    stacked: true,
                    grid: { display: false },
                    ticks: { color: '#94a3b8', font: { size: 10 } },
                    border: { display: false }
                },
                y: {
                    stacked: true,
                    beginAtZero: true,
                    grid: { color: 'rgba(99,102,241,0.06)' },
                    ticks: { color: '#64748b', font: { size: 11 } },
                    border: { display: false }
                }
            }
        };
    }

    private applyFiltersAndPaginate(): void {
        const filtered = this.getFilteredSummaries();

        let rows: DriverRow[] = filtered.map(d => {
            const weeklyHours = d.totalDrivingMinutes / 60;
            const weeklyLimit = 56;
            return {
                id: d.driverId,
                name: d.driverName,
                email: d.driverEmail,
                vehiclePlate: d.vehiclePlate || '—',
                vehicleModel: d.vehicleModel || '—',
                tripCount: d.trips.length,
                totalDistanceKm: Math.round(d.totalKm),
                avgSpeedKmh: d.avgSpeed,
                incidentCount: d.incidents,
                pauseComplianceRate: (d.pausesOk + d.pausesMissed) > 0
                    ? Math.round((d.pausesOk / (d.pausesOk + d.pausesMissed)) * 100)
                    : 100,
                drivingScore: d.ecoScore,
                weeklyDrivingHours: Math.round(weeklyHours * 10) / 10,
                warningNearLimit: weeklyHours > weeklyLimit * 0.8,
                seniorityMonths: d.seniorityMonths,
                ecoScore: d.ecoScore,
                pauseTaken: d.pausesOk,
                pauseMissed: d.pausesMissed,
                status: d.status,
                statusClass: this.getStatusClass(d.status)
            };
        });

        if (this.sortColumn) {
            rows.sort((a, b) => {
                let cmp = 0;
                const aVal = (a as any)[this.sortColumn];
                const bVal = (b as any)[this.sortColumn];
                if (typeof aVal === 'string') {
                    cmp = (aVal || '').localeCompare(bVal || '');
                } else {
                    cmp = (aVal || 0) - (bVal || 0);
                }
                return this.sortDirection === 'asc' ? cmp : -cmp;
            });
        }

        this.totalElements = rows.length;
        const start = this.pageIndex * this.pageSize;
        this.dataSource = rows.slice(start, start + this.pageSize);
    }

    onSort(column: string): void {
        if (this.sortColumn === column) {
            this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
        } else {
            this.sortColumn = column;
            this.sortDirection = 'asc';
        }
        this.pageIndex = 0;
        this.applyFiltersAndPaginate();
    }

    getSortIcon(column: string): string {
        if (this.sortColumn !== column) return 'unfold_more';
        return this.sortDirection === 'asc' ? 'arrow_upward' : 'arrow_downward';
    }

    onFilterStatusChange(val: string): void {
        this.filterStatus = val;
        this.pageIndex = 0;
        this.refreshAll();
    }

    onFilterScoreChange(val: string): void {
        this.filterScore = val;
        this.pageIndex = 0;
        this.refreshAll();
    }

    clearFilters(): void {
        this.filterStatus = '';
        this.filterScore = '';
        this.pageIndex = 0;
        this.refreshAll();
    }

    onPageChange(event: PageEvent): void {
        this.pageIndex = event.pageIndex;
        this.pageSize = event.pageSize;
        this.applyFiltersAndPaginate();
    }

    get hasActiveFilters(): boolean {
        return !!(this.filterStatus || this.filterScore);
    }

    get activeFilterCount(): number {
        return (this.filterStatus ? 1 : 0) + (this.filterScore ? 1 : 0);
    }

    onChartClick(type: string, event: any): void {
        if (!event || !event.active || !event.active.length) return;
        const idx = event.active[0]._index;
        if (idx == null) return;

        let data: DetailDialogData;

        if (type === 'weeklyHours') {
            const days = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche'];
            const value = this.weeklyHoursData.datasets[0].data[idx] as number || 0;
            data = {
                type: 'chart-point',
                title: days[idx] || 'Jour',
                chartLabel: 'Heures de conduite',
                chartValue: Math.round(value * 10) / 10,
                details: [
                    { label: 'Statut', value: value > 48 ? 'Dépassement limite' : 'Conforme', icon: value > 48 ? 'warning' : 'check_circle', color: value > 48 ? '#f87171' : '#34d399' },
                    { label: 'Limite Hebdo', value: '48 heures', icon: 'access_time' },
                    { label: 'Écart', value: value > 48 ? `+${Math.round((value - 48) * 10) / 10}h` : 'Dans les normes', icon: 'trending_up', color: value > 48 ? '#f87171' : '#34d399' }
                ]
            };
        } else if (type === 'ecoDonut') {
            const labels = ['Excellent (≥80)', 'Bon (60-79)', 'Moyen (40-59)', 'Faible (<40)'];
            const counts = this.ecoDonutData.datasets[0].data;
            const total = counts.reduce((a: number, b: number) => a + b, 0) || 1;
            data = {
                type: 'chart-point',
                title: labels[idx] || 'Catégorie',
                chartLabel: 'Nombre de chauffeurs',
                chartValue: counts[idx],
                details: [
                    { label: 'Pourcentage', value: `${Math.round((counts[idx] / total) * 100)}%`, icon: 'pie_chart' },
                    { label: 'Score min', value: labels[idx].match(/[\d]+/g)?.[0] || '—', icon: 'lowest' },
                    { label: 'Score max', value: labels[idx].match(/[\d]+/g)?.[1] || '—', icon: 'highest' }
                ]
            };
        } else if (type === 'pauseChart') {
            const driver = this.getFilteredSummaries()
                .filter(d => d.trips.length > 0)
                .sort((a, b) => (b.pausesOk + b.pausesMissed) - (a.pausesOk + a.pausesMissed))
                .slice(0, 8)[idx];
            if (!driver) return;
            const rate = (driver.pausesOk + driver.pausesMissed) > 0
                ? Math.round((driver.pausesOk / (driver.pausesOk + driver.pausesMissed)) * 100)
                : 100;
            data = {
                type: 'chart-point',
                title: driver.driverName,
                chartLabel: 'Taux conformité',
                chartValue: `${rate}%`,
                details: [
                    { label: 'Pauses prises', value: `${driver.pausesOk}`, icon: 'check_circle', color: '#34d399' },
                    { label: 'Pauses manquées', value: `${driver.pausesMissed}`, icon: 'cancel', color: '#f87171' },
                    { label: 'Trajets', value: `${driver.trips.length}`, icon: 'map' },
                    { label: 'Véhicule', value: driver.vehiclePlate || '—', icon: 'directions_car' }
                ]
            };
        } else {
            return;
        }

        this.openDetailDialog(data);
    }

    onRowClick(row: DriverRow): void {
        const summary = this.driverSummaries.find(d => d.driverId === row.id);
        if (!summary) return;

        const completed = summary.trips.filter(t => t.status === 'COMPLETE').length;
        const rate = (summary.pausesOk + summary.pausesMissed) > 0
            ? Math.round((summary.pausesOk / (summary.pausesOk + summary.pausesMissed)) * 100)
            : 100;

        this.openDetailDialog({
            type: 'driver-row',
            title: row.name,
            details: [
                { label: 'Véhicule', value: `${row.vehiclePlate} (${row.vehicleModel})`, icon: 'directions_car' },
                { label: 'Statut', value: this.getStatusLabel(row.status), icon: this.getStatusIcon(row.status), color: row.status === 'EN_SERVICE' ? '#34d399' : '#60a5fa' },
                { label: 'Score Éco', value: `${row.ecoScore}/100`, icon: 'star', color: row.ecoScore >= 80 ? '#34d399' : row.ecoScore >= 60 ? '#60a5fa' : row.ecoScore >= 40 ? '#fbbf24' : '#f87171' },
                { label: 'Trajets', value: `${row.tripCount}`, icon: 'map' },
                { label: 'Distance totale', value: `${this.formatKm(row.totalDistanceKm)} km`, icon: 'route', color: '#34d399' },
                { label: 'Vitesse moyenne', value: `${row.avgSpeedKmh} km/h`, icon: 'speed', color: '#60a5fa' },
                { label: 'Pauses conformes', value: `${rate}% (${row.pauseTaken}/${row.pauseTaken + row.pauseMissed})`, icon: 'coffee', color: rate >= 80 ? '#34d399' : '#f87171' },
                { label: 'Ancienneté', value: this.formatSeniority(row.seniorityMonths), icon: 'history' },
                { label: 'Heures conduite/sem', value: `${row.weeklyDrivingHours}h`, icon: 'access_time', color: row.warningNearLimit ? '#fbbf24' : '#e2e8f0' }
            ]
        });
    }

    onSeniorityCardClick(item: { label: string; count: number; pct: number; color: string }): void {
        this.openDetailDialog({
            type: 'seniority-card',
            title: `Ancienneté : ${item.label}`,
            chartLabel: 'Chauffeurs',
            chartValue: item.count,
            details: [
                { label: 'Pourcentage', value: `${item.pct}%`, icon: 'pie_chart' },
                { label: 'Total chauffeurs', value: `${this.getFilteredSummaries().length}`, icon: 'group' }
            ]
        });
    }

    private openDetailDialog(data: DetailDialogData): void {
        if (this.openDialogRef) {
            this.openDialogRef.close();
        }
        this.openDialogRef = this.dialog.open(DriverDetailDialogComponent, {
            data,
            panelClass: 'driver-detail-panel',
            backdropClass: 'driver-detail-backdrop',
            width: '420px',
            maxWidth: '95vw',
            position: { top: '24px', right: '24px' },
            hasBackdrop: true,
            disableClose: true
        });
        this.openDialogRef.afterClosed().subscribe(() => {
            this.openDialogRef = null;
        });
    }

    private formatSeniority(months: number): string {
        if (months < 3) return '< 3 mois';
        if (months < 6) return `${months} mois`;
        if (months < 24) return `${months} mois`;
        const years = Math.floor(months / 12);
        const rem = months % 12;
        return rem > 0 ? `${years} ans ${rem} mois` : `${years} ans`;
    }

    getStatusClass(status: string): string {
        return status === 'EN_SERVICE' ? 'active' : 'available';
    }

    getStatusLabel(status: string): string {
        return status === 'EN_SERVICE' ? 'En mission' : 'Disponible';
    }

    getStatusIcon(status: string): string {
        return status === 'EN_SERVICE' ? 'directions_car' : 'person_outline';
    }

    getScoreClass(score: number): string {
        if (score >= 80) return 'score--excellent';
        if (score >= 60) return 'score--good';
        if (score >= 40) return 'score--average';
        return 'score--poor';
    }

    getScoreLabel(score: number): string {
        if (score >= 80) return 'Excellent';
        if (score >= 60) return 'Bon';
        if (score >= 40) return 'Moyen';
        return 'Faible';
    }

    formatKm(km: number): string {
        if (km >= 1000) return `${(km / 1000).toFixed(1)}k`;
        return km.toString();
    }
}
