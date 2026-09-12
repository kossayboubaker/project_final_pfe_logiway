import { Component, OnInit, ChangeDetectorRef, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { BaseChartDirective } from 'ng2-charts';
import { ChartConfiguration, ChartType } from 'chart.js';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatTableModule } from '@angular/material/table';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { Subject, takeUntil } from 'rxjs';
import { ProfileService } from '../../../../core/services/profile.service';
import { NotificationService } from '../../../../core/services/notification.service';
import { AuthService } from '../../../../core/auth.service';
import { FleetService } from '../../../../core/services/fleet.service';
import { ActivatedRoute } from '@angular/router';
import { UserService, UserListItem } from '../../../../core/services/user.service';
import { SecteurService } from '../../../../core/services/secteur.service';

/* ─── Interfaces ─────────────────────────────────────────────── */
interface TripHistoryApiRow {
    id: number;
    pointDepart: string | null;
    destination: string | null;
    distanceKm: number | null;
    dureeEstimeeMinutes: number | null;
    dureeReelleMinutes: number | null;
    retardMinutes: number | null;
    statutPerformance: string | null;
    statut: string | null;
    dateDepart: string | null;
    dateArriveeReelle: string | null;
    vehiculeMatricule: string | null;
    vehiculeCouleur: string | null;
    chauffeurNom: string | null;
    chauffeurId: string | null;
}

export interface TripHistoryRow {
    date: string;
    origin: string;
    destination: string;
    distance: string;
    duration: string;
    delay: string;
    performance: string;
    status: string;
    statusClass: string;
    vehicle: string;
    chauffeur: string;
    rawDate: Date | null;
    rawDistanceKm: number;
    rawDelay: number;
}

@Component({
    selector: 'app-trip-history',
    standalone: true,
    imports: [
        CommonModule,
        FormsModule,
        BaseChartDirective,
        MatTableModule,
        MatIconModule,
        MatPaginatorModule,
        MatCardModule,
    ],
    templateUrl: './trip-history.component.html',
    styleUrls: ['./trip-history.component.css']
})
export class TripHistoryComponent implements OnInit {

    /* ─── Table ──────────────────────────────────────────────── */
    displayedColumns: string[] = [];
    dataSource: TripHistoryRow[] = [];
    pageIndex = 0;
    pageSize = 10;
    totalElements = 0;

    /* ─── Filters ────────────────────────────────────────────── */
    selectedStatus = '';
    readonly statusOptions = [
        { value: '', label: 'Tous les statuts' },
        { value: 'EN_COURS', label: 'En cours' },
        { value: 'ACTIF', label: 'Actif' },
        { value: 'COMPLETE', label: 'Terminés' }
    ];

    selectedDay = '';
    readonly dayOptions = [
        { value: '', label: 'Tous les jours' },
        { value: '1', label: 'Lundi' },
        { value: '2', label: 'Mardi' },
        { value: '3', label: 'Mercredi' },
        { value: '4', label: 'Jeudi' },
        { value: '5', label: 'Vendredi' },
        { value: '6', label: 'Samedi' },
        { value: '0', label: 'Dimanche' }
    ];

    filterDateFrom = '';
    filterDateTo = '';

    selectedDriverId: number | null = null;
    drivers: UserListItem[] = [];
    isDriversLoading = false;

    // ── Mini KPIs (Filtrés) ──
    kpiTotalTrips = 0;
    kpiActiveCount = 0;
    kpiCompletedCount = 0;
    kpiCompleted = 0;
    kpiTotalDistance = 0;
    kpiOnTimeRate = 100;
    kpiAvgDelay = 0;
    vehicleCount = 0;

    /* ─── Sector Stats ───────────────────────────────────────── */
    sectorStats: any = null;

    /* ─── Active chart tab ───────────────────────────────────── */
    activeChart: 'bar' | 'line' | 'doughnut' = 'bar';

    /* ─── Chart types (literal) ──────────────────────────────── */
    readonly barChartType: ChartType = 'bar';
    readonly lineChartType: ChartType = 'line';
    readonly doughnutChartType: ChartType = 'doughnut';

    /* ─── Bar chart ──────────────────────────────────────────── */
    barChartOptions: ChartConfiguration['options'] = {
        responsive: true,
        maintainAspectRatio: false,
        animation: { duration: 900 },
        plugins: {
            legend: { display: false },
            tooltip: {
                backgroundColor: 'rgba(15,23,42,0.95)',
                titleColor: '#e2e8f0',
                bodyColor: '#94a3b8',
                borderColor: 'rgba(99,102,241,0.4)',
                borderWidth: 1,
                padding: 14,
                cornerRadius: 10
            }
        },
        scales: {
            y: {
                beginAtZero: true,
                grid: { color: 'rgba(99,102,241,0.08)' },
                ticks: { color: '#64748b' }
            },
            x: {
                grid: { display: false },
                ticks: { color: '#94a3b8' }
            }
        }
    };
    barChartData: ChartConfiguration['data'] = { labels: [], datasets: [] };

    barMiniOptions: ChartConfiguration['options'] = {
        responsive: true, maintainAspectRatio: false,
        animation: false,
        plugins: { legend: { display: false }, tooltip: { enabled: false } },
        scales: { x: { display: false }, y: { display: false } }
    };

    /* ─── Line chart ─────────────────────────────────────────── */
    lineChartOptions: ChartConfiguration['options'] = {
        responsive: true,
        maintainAspectRatio: false,
        animation: { duration: 900 },
        plugins: {
            legend: { display: false },
            tooltip: {
                backgroundColor: 'rgba(15,23,42,0.95)',
                titleColor: '#e2e8f0',
                bodyColor: '#94a3b8',
                borderColor: 'rgba(16,185,129,0.4)',
                borderWidth: 1,
                padding: 14,
                cornerRadius: 10
            }
        },
        scales: {
            y: {
                beginAtZero: true,
                grid: { color: 'rgba(16,185,129,0.06)' },
                ticks: { color: '#64748b' }
            },
            x: {
                grid: { display: false },
                ticks: { color: '#94a3b8' }
            }
        }
    };
    lineChartData: ChartConfiguration['data'] = { labels: [], datasets: [] };

    lineMiniOptions: ChartConfiguration['options'] = {
        responsive: true, maintainAspectRatio: false,
        animation: false,
        plugins: { legend: { display: false }, tooltip: { enabled: false } },
        scales: { x: { display: false }, y: { display: false } }
    };

    /* ─── Doughnut chart — use generic 'any' for data to avoid
           ng2-charts strict template type conflict ───────────── */
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    doughnutChartOptions: any = {
        responsive: true,
        maintainAspectRatio: false,
        animation: { duration: 900 },
        cutout: '68%',
        plugins: {
            legend: {
                display: true,
                position: 'bottom',
                labels: { color: '#94a3b8', padding: 16, usePointStyle: true, pointStyleWidth: 8 }
            },
            tooltip: {
                backgroundColor: 'rgba(15,23,42,0.95)',
                titleColor: '#e2e8f0',
                bodyColor: '#94a3b8',
                borderColor: 'rgba(255,255,255,0.1)',
                borderWidth: 1,
                padding: 14,
                cornerRadius: 10
            }
        }
    };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    doughnutMiniOptions: any = {
        responsive: true, maintainAspectRatio: false,
        animation: false,
        cutout: '60%',
        plugins: { legend: { display: false }, tooltip: { enabled: false } }
    };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    doughnutChartData: any = { labels: [], datasets: [{ data: [] }] };

    /* ─── KPIs ───────────────────────────────────────────────── */
    public allApiTrips: TripHistoryApiRow[] = [];
    private readonly destroy$ = new Subject<void>();

    get hasActiveFilters(): boolean {
        return !!(this.selectedStatus || this.selectedDay || this.filterDateFrom || this.filterDateTo || this.selectedDriverId);
    }

    get activeFilterCount(): number {
        return (this.selectedStatus ? 1 : 0) + (this.selectedDay ? 1 : 0)
            + (this.filterDateFrom ? 1 : 0) + (this.filterDateTo ? 1 : 0)
            + (this.selectedDriverId ? 1 : 0);
    }

    /* ─── Role detection ─────────────────────────────────────── */
    get userRole(): string {
        return this.authService.getUser()?.role ?? 'DRIVER';
    }

    /* ─── Constructor ────────────────────────────────────────── */
    constructor(
        private readonly profileService: ProfileService,
        private readonly notificationService: NotificationService,
        private readonly cdr: ChangeDetectorRef,
        private readonly authService: AuthService,
        private readonly fleetService: FleetService,
        private readonly userService: UserService,
        private readonly secteurService: SecteurService,
        private readonly route: ActivatedRoute
    ) { }

    /* ─── Lifecycle ──────────────────────────────────────────── */
    ngOnInit(): void {
        this.initColumns();
        this.loadDriversIfManager();
        this.checkQueryParams();
        this.loadHistory();
        if (this.userRole !== 'DRIVER') {
            this.loadVehiclesCount();
            if (this.userRole === 'MANAGER') {
                this.loadSectorInfo();
            }
        }
        this.notificationService.connectRealtime();
        this.notificationService.realtimeNotification$
            .pipe(takeUntil(this.destroy$))
            .subscribe(() => this.loadHistory());
    }

    private loadVehiclesCount(): void {
        this.fleetService.getVehicles().subscribe({
            next: (vehicles) => { this.vehicleCount = vehicles.length; },
            error: () => { this.vehicleCount = 0; }
        });
    }

    private loadSectorInfo(): void {
        const user = this.authService.getUser();
        if (!user?.secteurId) return;

        this.secteurService.getSectorById(user.secteurId).subscribe({
            next: (sector: any) => {
                if (sector?.id) {
                    this.sectorStats = {
                        id: sector.id,
                        nom: sector.nom || 'Secteur Ouest',
                        zoneGeographique: sector.zoneGeographique || 'barcelona',
                        managersCount: sector.managers?.length ?? 1,
                        driversCount: sector.chauffeurs?.length ?? 0,
                        trajetsCount: sector.trajetsCount ?? 0
                    };
                }
            },
            error: () => { this.sectorStats = null; }
        });
    }

    private loadDriversIfManager(): void {
        if (this.userRole !== 'DRIVER') {
            this.isDriversLoading = true;
            this.userService.list()
                .pipe(takeUntil(this.destroy$))
                .subscribe({
                    next: users => {
                        this.drivers = users.filter(u => u.role === 'CHAUFFEUR');
                        this.isDriversLoading = false;
                        this.cdr.detectChanges();
                    },
                    error: () => this.isDriversLoading = false
                });
        }
    }

    private checkQueryParams(): void {
        this.route.queryParams
            .pipe(takeUntil(this.destroy$))
            .subscribe(params => {
                if (params['driverId']) {
                    this.selectedDriverId = Number(params['driverId']);
                }
                if (params['status']) {
                    this.selectedStatus = params['status'];
                }
            });
    }

    ngOnDestroy(): void {
        this.destroy$.next();
        this.destroy$.complete();
    }

    private initColumns(): void {
        const role = this.userRole;
        this.displayedColumns = [
            'date', 'origin', 'destination', 'vehicle'
        ];

        // Ajouter chauffeur si Manager ou SuperAdmin
        if (role !== 'DRIVER') {
            this.displayedColumns.push('chauffeur');
        }

        this.displayedColumns.push('distance', 'duration', 'delay', 'performance', 'status');
    }

    /* ─── Public handlers ────────────────────────────────────── */
    onPageChange(event: PageEvent): void {
        this.pageIndex = event.pageIndex;
        this.pageSize = event.pageSize;
        this.applyFiltersAndPaginate();
    }

    onStatusChange(value: string): void {
        this.selectedStatus = value;
        this.pageIndex = 0;
        this.applyFiltersAndPaginate();
        this.updateCharts();
    }

    onDayChange(value: string): void {
        this.selectedDay = value;
        this.pageIndex = 0;
        this.applyFiltersAndPaginate();
        this.updateCharts();
    }

    onDateFromChange(value: string): void {
        this.filterDateFrom = value;
        this.pageIndex = 0;
        this.applyFiltersAndPaginate();
        this.updateCharts();
    }

    onDateToChange(value: string): void {
        this.filterDateTo = value;
        this.pageIndex = 0;
        this.applyFiltersAndPaginate();
        this.updateCharts();
    }

    onDriverChange(value: string | number | null): void {
        this.selectedDriverId = value ? Number(value) : null;
        this.pageIndex = 0;
        this.applyFiltersAndPaginate();
        this.updateCharts();
    }

    onDriverSelect(driverId: number | null): void {
        this.onDriverChange(driverId);
    }

    getDriverInitials(driver: UserListItem): string {
        const p = (driver.prenom || '').charAt(0).toUpperCase();
        const n = (driver.nom || '').charAt(0).toUpperCase();
        return p + n || 'CH';
    }

    getDriverStatusClass(driver: UserListItem): string {
        if (driver.statutConducteur === 'EN_SERVICE') return 'drv-status--active';
        if (driver.statutConducteur === 'LIBRE') return 'drv-status--libre';
        return 'drv-status--unknown';
    }

    getDriverStatusLabel(driver: UserListItem): string {
        if (driver.statutConducteur === 'EN_SERVICE') return 'En service';
        if (driver.statutConducteur === 'LIBRE') return 'Libre';
        return 'Inconnu';
    }

    clearFilters(): void {
        this.selectedStatus = '';
        this.selectedDay = '';
        this.filterDateFrom = '';
        this.filterDateTo = '';
        this.selectedDriverId = null;
        this.pageIndex = 0;
        this.applyFiltersAndPaginate();
        this.updateCharts();
    }

    setActiveChart(type: 'bar' | 'line' | 'doughnut'): void {
        this.activeChart = type;
    }

    /* ─── Data loading — adapté par rôle ────────────────────── */
    private loadHistory(): void {
        const role = this.userRole;

        if (role === 'DRIVER') {
            // ── CHAUFFEUR : endpoint personnel /profile/me/trajets ──
            this.profileService.getDriverTrips(0, 200, undefined)
                .pipe(takeUntil(this.destroy$))
                .subscribe({
                    next: page => {
                        this.allApiTrips = (page.content ?? []).map((t: any) => ({
                            ...t,
                            chauffeurId: t.chauffeurId ? String(t.chauffeurId) : (t.chauffeur?.id ? String(t.chauffeur.id) : null)
                        })) as TripHistoryApiRow[];
                        this.applyFiltersAndPaginate();
                        this.updateCharts();
                        this.cdr.detectChanges();
                    },
                    error: () => this.handleLoadError()
                });
        } else {
            // ── MANAGER / SUPERADMIN : endpoint global /api/trajets ──
            // FleetService.getTrips() filtre déjà côté backend par rôle :
            //   SUPERADMIN → tous les trajets
            //   MANAGER    → trajets de ses chauffeurs
            this.fleetService.getTrips()
                .pipe(takeUntil(this.destroy$))
                .subscribe({
                    next: trips => {
                        // Mapper Trip (FleetService) → TripHistoryApiRow
                        // Tous les champs sont maintenant disponibles depuis FleetService enrichi
                        this.allApiTrips = trips.map(t => ({
                            id: Number(t.id) || 0,
                            pointDepart: t.from || null,
                            destination: t.to || null,
                            distanceKm: t.distanceKm ?? null,
                            dureeEstimeeMinutes: t.dureeEstimeeMinutes ?? null,
                            dureeReelleMinutes: t.dureeReelleMinutes ?? null,
                            retardMinutes: t.retardMinutes ?? null,
                            statutPerformance: t.statutPerformance ?? null,
                            statut: this.mapTripStatusToApi(t.status),
                            dateDepart: t.dateDepartIso ?? t.date ?? null,
                            dateArriveeReelle: t.dateArriveeIso ?? t.dateArrivee ?? null,
                            vehiculeMatricule: (t.vehiculeMatricule ?? t.vehicle) || null,
                            vehiculeCouleur: null,
                            chauffeurNom: t.chauffeurNom ?? t.driver ?? null,
                            chauffeurId: t.driverId ? String(t.driverId) : null
                        } as TripHistoryApiRow));
                        this.applyFiltersAndPaginate();
                        this.updateCharts();
                        this.cdr.detectChanges();
                    },
                    error: () => this.handleLoadError()
                });
        }
    }

    /** Convertit les statuts UI → codes API cohérents avec les filtres */
    private mapTripStatusToApi(status: string): string {
        const s = (status ?? '').toLowerCase();
        if (s.includes('cours')) return 'EN_COURS';
        if (s.includes('termin') || s.includes('complet')) return 'COMPLETE';
        if (s.includes('actif')) return 'ACTIF';
        return status;
    }

    private handleLoadError(): void {
        this.allApiTrips = [];
        this.dataSource = [];
        this.totalElements = 0;
        this.updateCharts();
        this.cdr.detectChanges();
    }

    /* ─── Filtering ──────────────────────────────────────────── */
    private getFiltered(): TripHistoryApiRow[] {
        return this.allApiTrips.filter(trip => {
            const date = trip.dateDepart ? new Date(trip.dateDepart) : null;

            if (this.selectedStatus && trip.statut !== this.selectedStatus) return false;

            if (this.selectedDay !== '' && date) {
                if (String(date.getDay()) !== this.selectedDay) return false;
            }

            if (this.filterDateFrom && date) {
                const from = new Date(this.filterDateFrom);
                from.setHours(0, 0, 0, 0);
                if (date < from) return false;
            }

            if (this.filterDateTo && date) {
                const to = new Date(this.filterDateTo);
                to.setHours(23, 59, 59, 999);
                if (date > to) return false;
            }

            // Nouveau filtre par chauffeur pour Manager/Admin
            if (this.selectedDriverId !== null) {
                // On compare driverId issu du mapping FleetService (toujours en string)
                if (String(trip.chauffeurId ?? '') !== String(this.selectedDriverId)) {
                    return false;
                }
            }

            return true;
        });
    }

    public applyFiltersAndPaginate(): void {
        const rawFiltered = this.getFiltered();
        
        // Calcul des Mini KPIs sur l'ensemble filtré (avant pagination)
        this.computeKpis(rawFiltered);

        const filteredRows = rawFiltered.map(t => this.mapTrip(t));
        this.totalElements = filteredRows.length;
        const start = this.pageIndex * this.pageSize;
        this.dataSource = filteredRows.slice(start, start + this.pageSize);
        this.cdr.detectChanges();
    }

    private computeKpis(trips: TripHistoryApiRow[]): void {
        this.kpiTotalTrips = trips.length;
        this.kpiActiveCount = trips.filter(t => t.statut === 'EN_COURS' || t.statut === 'ACTIF').length;
        this.kpiCompletedCount = trips.filter(t => t.statut === 'COMPLETE').length;
        this.kpiCompleted = this.kpiCompletedCount;
        this.kpiTotalDistance = Math.round(trips.reduce((s, t) => s + (t.distanceKm ?? 0), 0));

        const delayed = trips.filter(t => (t.retardMinutes ?? 0) > 0);
        this.kpiAvgDelay = delayed.length
            ? Math.round(delayed.reduce((s, t) => s + (t.retardMinutes ?? 0), 0) / delayed.length)
            : 0;

        const onTime = trips.length ? trips.filter(t => (t.retardMinutes ?? 0) <= 0).length : 0;
        this.kpiOnTimeRate = trips.length ? Math.round((onTime / trips.length) * 100) : 100;
    }

    /* ─── Charts ─────────────────────────────────────────────── */
    private updateCharts(): void {
        const trips = this.getFiltered();
        this.buildBarChart(trips);
        this.buildLineChart(trips);
        this.buildDoughnutChart(trips);
    }

    private buildBarChart(trips: TripHistoryApiRow[]): void {
        const counts = [0, 0, 0, 0, 0, 0, 0];
        trips.forEach(t => {
            if (t.dateDepart) {
                const d = new Date(t.dateDepart);
                if (!isNaN(d.getTime())) counts[d.getDay()]++;
            }
        });
        const labels = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];
        const data = [counts[1], counts[2], counts[3], counts[4], counts[5], counts[6], counts[0]];
        const colors = [
            'rgba(99,102,241,0.8)', 'rgba(139,92,246,0.8)', 'rgba(59,130,246,0.8)',
            'rgba(6,182,212,0.8)', 'rgba(16,185,129,0.8)', 'rgba(245,158,11,0.8)',
            'rgba(239,68,68,0.8)'
        ];
        const hoverColors = ['#6366f1', '#8b5cf6', '#3b82f6', '#06b6d4', '#10b981', '#f59e0b', '#ef4444'];

        this.barChartData = {
            labels,
            datasets: [{
                data,
                label: 'Missions',
                backgroundColor: colors,
                hoverBackgroundColor: hoverColors,
                borderRadius: 8,
                barThickness: 28
            }]
        };
    }

    private buildLineChart(trips: TripHistoryApiRow[]): void {
        const dist = [0, 0, 0, 0, 0, 0, 0];
        trips.forEach(t => {
            if (t.dateDepart) {
                const d = new Date(t.dateDepart);
                if (!isNaN(d.getTime())) dist[d.getDay()] += t.distanceKm ?? 0;
            }
        });
        const labels = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];
        const data = [dist[1], dist[2], dist[3], dist[4], dist[5], dist[6], dist[0]].map(Math.round);

        this.lineChartData = {
            labels,
            datasets: [{
                data,
                label: 'Distance (km)',
                borderColor: '#10b981',
                backgroundColor: 'rgba(16,185,129,0.12)',
                fill: true,
                tension: 0.45,
                pointBackgroundColor: '#10b981',
                pointBorderColor: '#fff',
                pointBorderWidth: 2,
                pointRadius: 5,
                pointHoverRadius: 8,
                borderWidth: 2.5
            }]
        };
    }

    private buildDoughnutChart(trips: TripHistoryApiRow[]): void {
        const completed = trips.filter(t => t.statut === 'COMPLETE').length;
        const inProgress = trips.filter(t => t.statut === 'EN_COURS').length;
        const active = trips.filter(t => t.statut === 'ACTIF').length;
        const other = Math.max(0, trips.length - completed - inProgress - active);

        this.doughnutChartData = {
            labels: ['Terminés', 'En cours', 'Actifs', 'Autres'],
            datasets: [{
                data: [completed, inProgress, active, other],
                backgroundColor: [
                    'rgba(16,185,129,0.85)', 'rgba(59,130,246,0.85)',
                    'rgba(245,158,11,0.85)', 'rgba(100,116,139,0.6)'
                ],
                hoverBackgroundColor: ['#10b981', '#3b82f6', '#f59e0b', '#64748b'],
                borderWidth: 0,
                hoverOffset: 8
            }]
        };
    }

    /* ─── Mapping helpers ────────────────────────────────────── */
    private mapTrip(t: TripHistoryApiRow): TripHistoryRow {
        return {
            date: this.fmtDate(t.dateDepart),
            origin: t.pointDepart || '-',
            destination: t.destination || '-',
            distance: `${this.fmtDist(t.distanceKm)} km`,
            duration: this.fmtDuration(t.dureeReelleMinutes),
            delay: this.fmtDelay(t.retardMinutes),
            performance: t.statutPerformance || 'Non calculé',
            status: this.fmtStatus(t.statut),
            statusClass: this.fmtStatusClass(t.statut),
            vehicle: t.vehiculeMatricule
                ? `${t.vehiculeMatricule}${t.vehiculeCouleur ? ` • ${t.vehiculeCouleur}` : ''}`
                : '-',
            chauffeur: t.chauffeurNom || '-',
            rawDate: t.dateDepart ? new Date(t.dateDepart) : null,
            rawDistanceKm: t.distanceKm ?? 0,
            rawDelay: t.retardMinutes ?? 0
        };
    }

    private fmtDate(v: string | null | undefined): string {
        if (!v) return '-';
        const d = new Date(v);
        return isNaN(d.getTime()) ? v : d.toLocaleDateString('fr-FR');
    }

    private fmtDist(v: number | null | undefined): string {
        return (Math.round((v ?? 0) * 100) / 100).toString();
    }

    private fmtStatus(v: string | null | undefined): string {
        switch (v) {
            case 'COMPLETE': return 'Terminé';
            case 'EN_COURS': return 'En cours';
            case 'ACTIF': return 'Actif';
            default: return v || '-';
        }
    }

    private fmtDuration(minutes: number | null | undefined): string {
        const total = Math.max(0, minutes ?? 0);
        const h = Math.floor(total / 60);
        const m = total % 60;
        return h === 0 ? `${m} min` : `${h}h ${m.toString().padStart(2, '0')}m`;
    }

    private fmtDelay(minutes: number | null | undefined): string {
        const v = minutes ?? 0;
        return `${v > 0 ? '+' : ''}${v} min`;
    }

    private fmtStatusClass(v: string | null | undefined): string {
        switch (v) {
            case 'COMPLETE': return 'completed';
            case 'EN_COURS': return 'in-progress';
            case 'ACTIF': return 'active';
            default: return 'unknown';
        }
    }
}
