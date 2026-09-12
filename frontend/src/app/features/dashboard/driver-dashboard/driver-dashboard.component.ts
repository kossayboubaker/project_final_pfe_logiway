import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { RouterLink } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { AuthService } from '../../../core/auth.service';
import { FleetService, Trip, Vehicle } from '../../../core/services/fleet.service';
import { Company, CompanyService } from '../../../core/services/company.service';
import { DriverDashboardResponse, ProfileService } from '../../../core/services/profile.service';
import { NotificationService } from '../../../core/services/notification.service';
import { catchError, finalize, of, Subject, takeUntil } from 'rxjs';

interface DriverSectorApi {
    id: number;
    nom: string;
    description?: string;
    zoneGeographique?: string;
    codesPostaux?: string;
    managers?: Array<{ id: number }>;
    chauffeurs?: Array<{ id: number; managerId?: number | null }>;
}

interface DriverSectorView {
    id: number;
    nom: string;
    description: string;
    zoneGeographique: string;
    codesPostaux: string;
}

interface DriverTripSummary {
    total: number;
    active: number;
    completed: number;
    delayed: number;
    incidents: number;
    today: number;
    distanceKm: number;
    plannedMinutes: number;
    actualMinutes: number;
}

@Component({
    selector: 'app-driver-dashboard',
    standalone: true,
    imports: [CommonModule, RouterLink, MatCardModule, MatIconModule, MatButtonModule, MatProgressBarModule],
    templateUrl: './driver-dashboard.component.html',
    styleUrls: ['./driver-dashboard.component.css']
})
export class DriverDashboardComponent implements OnInit, OnDestroy {

    // ── Pointage ──────────────────────────────────────────────────────
    pointage = {
        clockedIn: false,
        startTime: 0 as number,
        todayTotal: 0 as number,
        sessionElapsed: '00:00:00',
        timerId: null as any
    };

    currentTime = new Date();
    private timeTimerId: any = null;
    private readonly POINTAGE_KEY = 'logiway_pointage_driver';
    private readonly POINTAGE_LOG_KEY = 'logiway_pointage_driver_log';

    currentUser = this.authService.getUser();
    currentUserName = this.buildDriverName();
    driverInitials = this.buildInitials(this.currentUserName);
    currentTrip: Trip | null = null;
    myTrips: Trip[] = [];
    assignedVehicle: Vehicle | null = null;
    assignedCompany: Company | null = null;
    assignedSector: DriverSectorView | null = null;
    directManagerName: string | null = null;
    todaysTrips: Trip[] = [];
    activeTrips: Trip[] = [];
    completedTrips: Trip[] = [];
    delayedTrips: Trip[] = [];
    incidentTrips: Trip[] = [];
    tripSummary: DriverTripSummary = {
        total: 0,
        active: 0,
        completed: 0,
        delayed: 0,
        incidents: 0,
        today: 0,
        distanceKm: 0,
        plannedMinutes: 0,
        actualMinutes: 0
    };
    isVehicleLoading = true;
    isCompanyLoading = true;
    isSectorLoading = true;
    vehicleError: string | null = null;
    companyError: string | null = null;
    sectorError: string | null = null;
    drivingTimeToday = 0; // minutes conduite réelles aujourd'hui
    driverCompanyId: string | null = null;
    driverCompanyName: string | null = null;

    // ── Pagination Historique complet ───────────────────────────────
    histPageIndex = 0;
    histPageSize = 8;
    /** Données brutes du backend (fallback si pas de trajets locaux) */
    private _backendStats: { safetyScore: number; fuelEfficiency: number; totalDistance: number; restRequiredIn: string } | null = null;

    private trips: Trip[] = [];
    private vehicles: Vehicle[] = [];
    private companies: Company[] = [];
    private sectors: DriverSectorApi[] = [];
    private currentDriverId: string | null = null;
    private currentDriverManagerId: string | null = null;
    private readonly destroy$ = new Subject<void>();
    private readonly sectorsApiUrl = 'http://localhost:8080/api/secteurs';

    constructor(
        private authService: AuthService,
        private http: HttpClient,
        private fleetService: FleetService,
        private companyService: CompanyService,
        private profileService: ProfileService,
        private notificationService: NotificationService,
        private cdr: ChangeDetectorRef
    ) { }

    ngOnInit() {
        this.restorePointage();
        this.authService.currentUser.pipe(takeUntil(this.destroy$)).subscribe(user => { if (!user && this.pointage.clockedIn) this.savePointageOnExit(); });
        window.addEventListener('beforeunload', this.onBeforeUnload);
        this.timeTimerId = setInterval(() => { this.currentTime = new Date(); this.cdr.detectChanges(); }, 30000);

        this.profileService.getCurrentProfile().pipe(
            catchError(() => of(null))
        ).subscribe(profile => {
            this.currentDriverId = profile?.id != null ? String(profile.id) : null;
            this.currentDriverManagerId = profile?.managerId != null ? String(profile.managerId) : null;
            this.driverCompanyId = profile?.entrepriseId != null ? String(profile.entrepriseId) : null;
            this.driverCompanyName = profile?.entrepriseNom || null;
            // Store direct manager name from profile
            if (profile?.managerPrenom && profile?.managerNom) {
                this.directManagerName = `${profile.managerPrenom} ${profile.managerNom}`.trim();
            } else {
                this.directManagerName = null;
            }
            this.refreshDashboardState();
        });

        this.loadDriverDashboard();

        this.fleetService.getVehicles().pipe(
            catchError(() => {
                this.vehicleError = 'Impossible de charger les informations du vehicule assigne.';
                return of([]);
            }),
            finalize(() => {
                this.isVehicleLoading = false;
            })
        ).subscribe(vehicles => {
            this.vehicles = vehicles;
            this.refreshDashboardState();
        });

        this.companyService.getCompanies().pipe(
            catchError(() => {
                this.companyError = 'Impossible de charger les informations de l\'entreprise.';
                return of([]);
            }),
            finalize(() => {
                this.isCompanyLoading = false;
            })
        ).subscribe(companies => {
            this.companies = companies;
            this.refreshDashboardState();
        });

        this.http.get<DriverSectorApi[]>(this.sectorsApiUrl).pipe(
            catchError(() => {
                this.sectorError = 'Impossible de charger les informations du secteur.';
                return of([]);
            }),
            finalize(() => {
                this.isSectorLoading = false;
            })
        ).subscribe(sectors => {
            this.sectors = sectors;
            this.refreshDashboardState();
        });

        this.notificationService.connectRealtime();
        this.notificationService.realtimeNotification$
            .pipe(takeUntil(this.destroy$))
            .subscribe(() => {
                this.loadDriverDashboard(false);
                this.companyService.getCompanies().pipe(catchError(() => of([]))).subscribe(companies => {
                    this.companies = companies;
                    this.refreshDashboardState();
                });
                this.http.get<DriverSectorApi[]>(this.sectorsApiUrl).pipe(catchError(() => of([]))).subscribe(sectors => {
                    this.sectors = sectors;
                    this.refreshDashboardState();
                });
            });
    }

    ngOnDestroy(): void {
        this.destroy$.next();
        this.destroy$.complete();
        window.removeEventListener('beforeunload', this.onBeforeUnload);
        if (this.pointage.timerId) clearInterval(this.pointage.timerId);
        if (this.timeTimerId) clearInterval(this.timeTimerId);
    }

    private onBeforeUnload = (): void => { if (this.pointage.clockedIn) this.savePointageOnExit(); };

    private savePointageOnExit(): void {
        const elapsed = Date.now() - this.pointage.startTime;
        const log = localStorage.getItem(this.POINTAGE_LOG_KEY);
        const entries = log ? JSON.parse(log) : [];
        entries.push({ date: new Date().toISOString(), duration: elapsed });
        localStorage.setItem(this.POINTAGE_LOG_KEY, JSON.stringify(entries));
        localStorage.removeItem(this.POINTAGE_KEY);
        this.pointage.clockedIn = false;
        this.pointage.startTime = 0;
    }

    // ── Pointage ──────────────────────────────────────────────────────
    restorePointage(): void {
        const saved = localStorage.getItem(this.POINTAGE_KEY);
        if (saved) {
            try {
                const data = JSON.parse(saved);
                this.pointage.clockedIn = data.clockedIn;
                this.pointage.startTime = data.startTime;
                if (this.pointage.clockedIn && this.pointage.startTime > 0) {
                    this.startPointageTimer();
                }
            } catch { /* ignore */ }
        }
        const log = localStorage.getItem(this.POINTAGE_LOG_KEY);
        if (log) {
            try {
                const entries = JSON.parse(log);
                const today = new Date().toDateString();
                this.pointage.todayTotal = entries
                    .filter((e: any) => new Date(e.date).toDateString() === today)
                    .reduce((s: number, e: any) => s + (e.duration || 0), 0);
            } catch { /* ignore */ }
        }
    }

    togglePointage(): void {
        if (this.pointage.clockedIn) {
            this.clockOut();
        } else {
            this.clockIn();
        }
    }

    clockIn(): void {
        this.pointage.clockedIn = true;
        this.pointage.startTime = Date.now();
        localStorage.setItem(this.POINTAGE_KEY, JSON.stringify({
            clockedIn: true,
            startTime: this.pointage.startTime
        }));
        this.startPointageTimer();
    }

    clockOut(): void {
        const elapsed = Date.now() - this.pointage.startTime;
        this.pointage.clockedIn = false;
        if (this.pointage.timerId) {
            clearInterval(this.pointage.timerId);
            this.pointage.timerId = null;
        }
        const log = localStorage.getItem(this.POINTAGE_LOG_KEY);
        const entries = log ? JSON.parse(log) : [];
        entries.push({ date: new Date().toISOString(), duration: elapsed });
        localStorage.setItem(this.POINTAGE_LOG_KEY, JSON.stringify(entries));

        const today = new Date().toDateString();
        this.pointage.todayTotal = entries
            .filter((e: any) => new Date(e.date).toDateString() === today)
            .reduce((s: number, e: any) => s + (e.duration || 0), 0);

        localStorage.removeItem(this.POINTAGE_KEY);
        this.pointage.startTime = 0;
        this.pointage.sessionElapsed = '00:00:00';
    }

    private startPointageTimer(): void {
        if (this.pointage.timerId) clearInterval(this.pointage.timerId);
        this.pointage.timerId = setInterval(() => {
            if (this.pointage.startTime > 0) {
                const diff = Date.now() - this.pointage.startTime;
                const h = Math.floor(diff / 3600000);
                const m = Math.floor((diff % 3600000) / 60000);
                const s = Math.floor((diff % 60000) / 1000);
                this.pointage.sessionElapsed =
                    `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
                this.cdr.detectChanges();
            }
        }, 1000);
    }

    get pointageTodayLabel(): string {
        const h = Math.floor(this.pointage.todayTotal / 3600000);
        const m = Math.floor((this.pointage.todayTotal % 3600000) / 60000);
        return `${h}h ${m.toString().padStart(2, '0')}m`;
    }

    get pointageStatusLabel(): string {
        return this.pointage.clockedIn ? 'En service' : 'Hors service';
    }

    get availabilityLabel(): string {
        if (this.currentTrip) {
            return 'En service';
        }
        if (this.assignedVehicle) {
            return 'Affecté';
        }
        return 'Libre';
    }

    get availabilityTone(): 'success' | 'warning' | 'info' {
        if (this.currentTrip) { return 'success'; }
        return this.assignedVehicle ? 'warning' : 'info';
    }

    get availabilityProgress(): number {
        if (this.currentTrip) { return 100; }
        return this.assignedVehicle ? 65 : 8;
    }

    get companyManagerLabel(): string {
        if (this.directManagerName) { return this.directManagerName; }
        return this.assignedCompany?.managerOwnerName?.trim() || 'Manager non renseigné';
    }

    get companySectorLabel(): string {
        return this.assignedCompany?.sector?.trim() || 'Secteur non précisé';
    }

    get vehicleStatusLabel(): string {
        return this.assignedVehicle?.status?.trim() || 'Véhicule non attribué';
    }

    get vehicleSubtitle(): string {
        if (!this.assignedVehicle) { return 'Aucun véhicule assigné'; }
        return [this.assignedVehicle.plate, this.assignedVehicle.model].filter(Boolean).join(' • ');
    }

    get companyLabel(): string {
        return this.assignedCompany?.name?.trim() || this.assignedVehicle?.companyName?.trim() || 'Entreprise non renseignée';
    }

    get tripStatusLabel(): string {
        return this.currentTrip?.status || 'Aucune mission active';
    }

    get tripRouteLabel(): string {
        if (!this.currentTrip) { return 'Aucune mission en cours'; }
        return `${this.currentTrip.from} vers ${this.currentTrip.to}`;
    }

    get tripVehicleLabel(): string {
        return this.currentTrip ? this.resolveTripVehicleLabel(this.currentTrip) : this.vehicleSubtitle;
    }

    private refreshDashboardState(): void {
        const resolvedVehicle = this.resolveAssignedVehicle();
        if (resolvedVehicle) {
            this.assignedVehicle = resolvedVehicle;
        }

        const resolvedTrip = this.resolveCurrentTrip();
        if (resolvedTrip) {
            this.currentTrip = resolvedTrip;
        }

        const resolvedCompany = this.resolveAssignedCompany();
        if (resolvedCompany) {
            this.assignedCompany = resolvedCompany;
        }

        const resolvedSector = this.resolveAssignedSector();
        if (resolvedSector) {
            this.assignedSector = resolvedSector;
        }

        const resolvedTrips = this.resolveMyTrips();
        if (resolvedTrips.length > 0) {
            this.myTrips = resolvedTrips;
        }
        this.refreshTripHistoryViews();
        this.cdr.detectChanges();
    }

    private refreshTripHistoryViews(): void {
        const sortedTrips = [...this.myTrips].sort((left, right) => this.tripSortValue(right) - this.tripSortValue(left));
        this.myTrips = sortedTrips;
        this.todaysTrips = sortedTrips.filter(trip => this.isToday(trip));
        this.activeTrips = sortedTrips.filter(trip => this.isTripActive(trip));
        this.completedTrips = sortedTrips.filter(trip => this.isTripCompleted(trip));
        this.delayedTrips = sortedTrips.filter(trip => this.isTripDelayed(trip));
        this.incidentTrips = sortedTrips.filter(trip => this.isTripIncident(trip));

        const distanceKm = sortedTrips.reduce((total, trip) => total + (trip.distanceKm ?? 0), 0);
        const plannedMinutes = sortedTrips.reduce((total, trip) => total + (trip.dureeEstimeeMinutes ?? 0), 0);
        const actualMinutes = sortedTrips.reduce((total, trip) => total + this.getTripActualMinutes(trip), 0);

        this.tripSummary = {
            total: sortedTrips.length,
            active: this.activeTrips.length,
            completed: this.completedTrips.length,
            delayed: this.delayedTrips.length,
            incidents: this.incidentTrips.length,
            today: this.todaysTrips.length,
            distanceKm,
            plannedMinutes,
            actualMinutes
        };
    }

    // ── Indicateurs conduite intelligents ────────────────────────────
    // Algorithme basé sur les données réelles des trajets du chauffeur
    get drivingStats() {
        const trips = this.myTrips;
        const total = trips.length;

        // Score sécurité : pénalité pour retards et incidents
        const delayPenalty = total > 0 ? Math.round((this.tripSummary.delayed / total) * 30) : 0;
        const incidentPenalty = total > 0 ? Math.round((this.tripSummary.incidents / total) * 40) : 0;
        const safetyScore = Math.max(0, Math.min(100, 100 - delayPenalty - incidentPenalty));

        // Consommation estimée : ~8 L/100km de base, +0.5 si beaucoup de retards
        const baseConsumption = 8.0;
        const delayFactor = total > 0 ? (this.tripSummary.delayed / total) * 2 : 0;
        const fuelEfficiency = Math.round((baseConsumption + delayFactor) * 10) / 10;

        // Distance totale réelle
        const totalDistance = Math.round(this.tripSummary.distanceKm);

        // Temps de conduite aujourd'hui (en minutes réelles)
        const todayMinutes = this.todaysTrips.reduce((sum, t) => sum + this.getTripActualMinutes(t), 0);
        const todayH = Math.floor(todayMinutes / 60);
        const todayM = todayMinutes % 60;
        const drivingTimeToday = todayH > 0 ? `${todayH}h ${todayM.toString().padStart(2, '0')}m` : `${todayM} min`;

        // Repos requis : règlementation 4h30 max en conduite continue
        const MAX_DRIVE_MINUTES = 270; // 4h30
        const remaining = Math.max(0, MAX_DRIVE_MINUTES - todayMinutes);
        const remH = Math.floor(remaining / 60);
        const remM = remaining % 60;
        const restRequiredIn = remaining <= 0 ? 'Pause requise !' : `${remH}h ${remM.toString().padStart(2, '0')}m`;
        const needsRest = remaining <= 30; // alerte 30 min avant

        // Taux ponctualité
        const punctuality = this.punctualityRate;

        return { safetyScore, fuelEfficiency, totalDistance, drivingTimeToday, restRequiredIn, needsRest, punctuality };
    }

    /** Tous les trajets triés (pour KPIs totaux) */
    get historyTrips(): Trip[] {
        return [...this.myTrips].sort((a, b) => this.tripSortValue(b) - this.tripSortValue(a));
    }

    /** Page courante pour l'affichage paginé */
    get historyTripsPage(): Trip[] {
        const start = this.histPageIndex * this.histPageSize;
        return this.historyTrips.slice(start, start + this.histPageSize);
    }

    get histTotalPages(): number {
        return Math.max(1, Math.ceil(this.historyTrips.length / this.histPageSize));
    }

    get histPageNumbers(): number[] {
        return Array.from({ length: this.histTotalPages }, (_, i) => i);
    }

    prevHistPage(): void {
        if (this.histPageIndex > 0) { this.histPageIndex--; }
    }

    nextHistPage(): void {
        if (this.histPageIndex < this.histTotalPages - 1) { this.histPageIndex++; }
    }

    goHistPage(page: number): void {
        this.histPageIndex = page;
    }

    get missionDuJour(): Trip | null {
        return this.currentTrip;
    }

    get delayRate(): number {
        if (this.tripSummary.completed === 0) {
            return 0;
        }

        return Math.round((this.tripSummary.delayed / this.tripSummary.completed) * 100);
    }

    get punctualityRate(): number {
        if (this.tripSummary.completed === 0) {
            return 100;
        }

        return Math.max(0, 100 - this.delayRate);
    }

    isToday(trip: Trip): boolean {
        const reference = this.parseTripDate(trip.dateDepartIso || trip.date);
        if (!reference) {
            return false;
        }

        const now = new Date();
        return reference.toDateString() === now.toDateString();
    }

    isTripActive(trip: Trip): boolean {
        const normalized = this.normalizeText(trip.status);
        return normalized.includes('cours') || normalized.includes('actif');
    }

    isTripCompleted(trip: Trip): boolean {
        const normalized = this.normalizeText(trip.status);
        return normalized.includes('termine') || normalized.includes('complete');
    }

    isTripDelayed(trip: Trip): boolean {
        if (!this.isTripCompleted(trip)) {
            return false;
        }

        const plannedMinutes = trip.dureeEstimeeMinutes ?? 0;
        const actualMinutes = this.getTripActualMinutes(trip);
        return plannedMinutes > 0 && actualMinutes > plannedMinutes + 5;
    }

    getTripActualMinutes(trip: Trip): number {
        const start = this.parseTripDate(trip.dateDepartIso || trip.date);
        const end = this.parseTripDate(trip.dateArriveeIso || trip.dateArrivee || '');
        if (!start) {
            return 0;
        }

        const finish = end || (this.isTripActive(trip) ? new Date() : null);
        if (!finish) {
            return 0;
        }

        return Math.max(0, Math.round((finish.getTime() - start.getTime()) / 60000));
    }

    private tripSortValue(trip: Trip): number {
        const reference = this.parseTripDate(trip.dateArriveeIso || trip.dateDepartIso || trip.date);
        return reference ? reference.getTime() : 0;
    }

    private parseTripDate(value?: string): Date | null {
        if (!value) {
            return null;
        }

        const parsed = new Date(value);
        return Number.isNaN(parsed.getTime()) ? null : parsed;
    }

    isTripIncident(trip: Trip): boolean {
        const normalized = this.normalizeText(trip.status);
        return normalized.includes('incident') || normalized.includes('annul') || normalized.includes('panne');
    }

    private resolveCurrentTrip(): Trip | null {
        const activeTrips = this.trips.filter(trip => this.isTripActive(trip));
        const currentUserId = this.currentDriverId || (this.currentUser?.id != null ? String(this.currentUser.id) : '');
        const assignedVehicleId = this.assignedVehicle?.id ? String(this.assignedVehicle.id) : '';
        const assignedVehiclePlate = this.assignedVehicle?.plate ? this.normalizeText(this.assignedVehicle.plate) : '';

        const matchedTrips = activeTrips.filter(trip => {
            const tripVehicleId = trip.vehicleId ? String(trip.vehicleId) : '';
            const tripVehiclePlate = this.normalizeText(trip.vehicle || '');
            return (
                (!!currentUserId && trip.driverId === currentUserId) ||
                (!!assignedVehicleId && tripVehicleId === assignedVehicleId) ||
                (!!assignedVehiclePlate && tripVehiclePlate === assignedVehiclePlate) ||
                this.matchesCurrentDriver(trip.driver, trip.driverId)
            );
        });

        if (assignedVehicleId) {
            const vehicleTrip = matchedTrips.find(trip => String(trip.vehicleId ?? '') === assignedVehicleId || this.normalizeText(trip.vehicle || '') === assignedVehiclePlate);
            if (vehicleTrip) {
                return vehicleTrip;
            }
        }

        return matchedTrips[0] || null;
    }

    private resolveMyTrips(): Trip[] {
        const currentUserId = this.currentDriverId || (this.currentUser?.id != null ? String(this.currentUser.id) : '');
        const assignedVehicleId = this.assignedVehicle?.id ? String(this.assignedVehicle.id) : '';
        const assignedVehiclePlate = this.assignedVehicle?.plate ? this.normalizeText(this.assignedVehicle.plate) : '';

        return this.trips.filter(trip => {
            const tripVehicleId = trip.vehicleId ? String(trip.vehicleId) : '';
            const tripVehiclePlate = this.normalizeText(trip.vehicle || '');
            return (
                (!!currentUserId && trip.driverId === currentUserId) ||
                (!!assignedVehicleId && tripVehicleId === assignedVehicleId) ||
                (!!assignedVehiclePlate && tripVehiclePlate === assignedVehiclePlate) ||
                this.matchesCurrentDriver(trip.driver, trip.driverId)
            );
        });
    }

    private resolveAssignedVehicle(): Vehicle | null {
        if (this.assignedVehicle) {
            return this.assignedVehicle;
        }

        const currentUserId = this.currentDriverId || (this.currentUser?.id != null ? String(this.currentUser.id) : '');
        const matchedVehicles = this.vehicles.filter(vehicle => this.matchesCurrentDriver(vehicle.driverName, vehicle.driverId));
        if (matchedVehicles.length > 0) {
            return matchedVehicles[0];
        }

        if (currentUserId) {
            const fallback = this.vehicles.find(vehicle => String(vehicle.driverId ?? '') === currentUserId);
            if (fallback) {
                return fallback;
            }
        }

        return this.vehicles.length === 1 ? this.vehicles[0] : null;
    }

    private resolveAssignedCompany(): Company | null {
        // 1. Try using the chauffeur's direct company ID if available
        if (this.driverCompanyId) {
            const found = this.companies.find(company => String(company.id) === this.driverCompanyId);
            if (found) {
                return found;
            }
            if (this.driverCompanyName) {
                return {
                    id: this.driverCompanyId,
                    name: this.driverCompanyName,
                    address: '',
                    sector: '',
                    fleetSize: 0,
                    activeMissions: 0,
                    status: 'Actif',
                    joinDate: ''
                };
            }
        }

        // 2. Try using the vehicle's company ID
        const companyId = this.assignedVehicle?.companyId;
        if (!companyId) {
            if (this.currentDriverManagerId) {
                const byManager = this.companies.find(company => String(company.managerOwnerId ?? '') === this.currentDriverManagerId);
                if (byManager) {
                    return byManager;
                }
            }

            return null;
        }

        return this.companies.find(company => company.id === companyId) || null;
    }

    private resolveAssignedSector(): DriverSectorView | null {
        const currentUserId = this.currentDriverId != null ? Number(this.currentDriverId) : (this.currentUser?.id != null ? Number(this.currentUser.id) : null);
        const managerId = this.currentDriverManagerId != null ? Number(this.currentDriverManagerId) : null;

        let matched: DriverSectorApi | undefined;

        if (currentUserId != null) {
            matched = this.sectors.find(sector =>
                (sector.chauffeurs ?? []).some(chauffeur => Number(chauffeur.id) === currentUserId)
            );
        }

        if (!matched && managerId != null) {
            matched = this.sectors.find(sector =>
                (sector.managers ?? []).some(manager => Number(manager.id) === managerId)
            );
        }

        if (!matched) {
            return null;
        }

        return {
            id: matched.id,
            nom: (matched.nom || '').trim(),
            description: (matched.description || '').trim(),
            zoneGeographique: (matched.zoneGeographique || '').trim(),
            codesPostaux: (matched.codesPostaux || '').trim()
        };
    }

    private matchesCurrentDriver(candidateName?: string, candidateId?: string): boolean {
        const normalizedCurrentUser = this.normalizeText(this.currentUserName);
        const normalizedCandidate = this.normalizeText(candidateName || '');
        const currentUserId = this.currentDriverId || (this.currentUser?.id != null ? String(this.currentUser.id) : '');

        return (
            (normalizedCandidate !== '' && normalizedCandidate === normalizedCurrentUser) ||
            (!!candidateId && !!currentUserId && candidateId === currentUserId)
        );
    }

    private resolveTripVehicleLabel(trip: Trip): string {
        const vehicle = this.vehicles.find(currentVehicle => String(currentVehicle.id) === String(trip.vehicleId ?? '') || currentVehicle.plate === trip.vehicle);
        return vehicle ? `${vehicle.plate}${vehicle.model ? ` • ${vehicle.model}` : ''}` : trip.vehicle;
    }

    private buildDriverName(): string {
        const user = this.currentUser;
        const name = `${user?.firstName || ''} ${user?.lastName || ''}`.trim();

        if (name) {
            return name;
        }

        return user?.username || 'Chauffeur';
    }

    private buildInitials(value: string): string {
        const parts = value.split(/\s+/).filter(Boolean);

        if (parts.length === 0) {
            return 'CH';
        }

        return parts.slice(0, 2).map(part => part.charAt(0).toUpperCase()).join('');
    }

    private normalizeText(value: string): string {
        return value
            .toLowerCase()
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .replace(/[^a-z0-9]+/g, ' ')
            .trim();
    }

    private loadDriverDashboard(keepFallbackData = true): void {
        this.profileService.getDriverDashboard().pipe(
            catchError(() => of(null))
        ).subscribe(dashboard => {
            if (!dashboard) {
                if (!keepFallbackData) {
                    this.refreshDashboardState();
                }
                return;
            }

            this.applyDashboardResponse(dashboard);
            this.refreshDashboardState();
        });

        this.profileService.getDriverTrips(0, 200).pipe(
            catchError(() => of({ content: [] }))
        ).subscribe(page => {
            const trips = (page.content || []).map(trip => this.mapBackendTrip(trip));
            this.trips = trips;
            this.refreshDashboardState();
        });
    }

    private applyDashboardResponse(dashboard: DriverDashboardResponse): void {
        const chauffeur = dashboard.chauffeur;
        this.currentDriverId = chauffeur?.id != null ? String(chauffeur.id) : this.currentDriverId;
        this.currentDriverManagerId = dashboard.manager?.id != null ? String(dashboard.manager.id) : this.currentDriverManagerId;
        this.driverCompanyId = chauffeur?.entrepriseId != null ? String(chauffeur.entrepriseId) : this.driverCompanyId;
        this.driverCompanyName = chauffeur?.entrepriseNom || this.driverCompanyName;

        if (dashboard.manager?.prenom && dashboard.manager?.nom) {
            this.directManagerName = `${dashboard.manager.prenom} ${dashboard.manager.nom}`.trim();
        } else {
            this.directManagerName = null;
            this.currentDriverManagerId = null;
        }

        if (dashboard.vehiculeActuel) {
            this.assignedVehicle = {
                id: String(dashboard.vehiculeActuel.id),
                plate: dashboard.vehiculeActuel.matricule || '',
                model: dashboard.vehiculeActuel.modele || dashboard.vehiculeActuel.marque || '',
                brand: dashboard.vehiculeActuel.marque || '',
                status: this.formatVehicleStatus(dashboard.vehiculeActuel.statut),
                nextCheck: dashboard.vehiculeActuel.statut || 'HORS_SERVICE',
                companyId: dashboard.vehiculeActuel.entrepriseId != null ? String(dashboard.vehiculeActuel.entrepriseId) : undefined,
                companyName: dashboard.vehiculeActuel.entrepriseNom || undefined,
                mileage: dashboard.vehiculeActuel.kilometrage ?? undefined,
                capacity: dashboard.vehiculeActuel.capaciteCharge ?? undefined
            };
            this.vehicles = [this.assignedVehicle];
        }

        this.currentTrip = dashboard.missionActuelle ? this.mapBackendTrip(dashboard.missionActuelle) : this.currentTrip;
        this.trips = this.mergeTrips([
            ...this.trips,
            ...(dashboard.missionsDuJour || []).map(trip => this.mapBackendTrip(trip)),
            ...(dashboard.missionActuelle ? [this.mapBackendTrip(dashboard.missionActuelle)] : [])
        ]);

        if (dashboard.statistiques) {
            this._backendStats = {
                safetyScore: Math.round(dashboard.statistiques.ecoScoreMoyen ?? 0),
                fuelEfficiency: dashboard.statistiques.consommationMoyenneL100Km ?? 0,
                totalDistance: dashboard.statistiques.distanceTotaleKm ?? 0,
                restRequiredIn: this.formatRestAvailability(dashboard.disponibiliteProchaine)
            };
        }
    }

    private mapBackendTrip(trip: any): Trip {
        const status = this.formatTripStatus(trip.statut);
        const vehicleLabel = [trip.vehiculeMatricule, trip.vehiculeCouleur].filter(Boolean).join(' • ');
        return {
            id: String(trip.id),
            date: this.formatTripDisplayDate(trip.dateDepart),
            dateDepartIso: trip.dateDepart ?? undefined,
            dateArriveeIso: trip.dateArriveeReelle ?? trip.dateArrivee ?? undefined,
            dateArrivee: this.formatTripDisplayDate(trip.dateArriveeReelle || trip.dateArrivee),
            vehicle: vehicleLabel || trip.vehiculeMatricule || '-',
            vehicleId: trip.vehiculeId != null ? String(trip.vehiculeId) : undefined,
            from: trip.pointDepart || '-',
            to: trip.destination || '-',
            driver: trip.chauffeurNom || '-',
            driverId: trip.chauffeurId != null ? String(trip.chauffeurId) : '',
            managerId: trip.managerId != null ? String(trip.managerId) : '',
            status,
            latitudeDepart: trip.latitudeDepart ?? undefined,
            longitudeDepart: trip.longitudeDepart ?? undefined,
            latitudeArrivee: trip.latitudeArrivee ?? undefined,
            longitudeArrivee: trip.longitudeArrivee ?? undefined,
            distanceKm: trip.distanceKm ?? undefined,
            dureeEstimeeMinutes: trip.dureeEstimeeMinutes ?? undefined,
            geometrieItineraire: trip.geometrieItineraire ?? undefined,
            priority: trip.priorite ?? undefined,
            driverEmail: undefined
        };
    }

    private formatTripDisplayDate(value?: string): string {
        if (!value) {
            return '-';
        }

        const parsed = new Date(value);
        return Number.isNaN(parsed.getTime()) ? value : parsed.toLocaleString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
    }

    private formatTripStatus(status?: string): string {
        switch (status) {
            case 'COMPLETE':
                return 'Terminé';
            case 'EN_COURS':
                return 'En cours';
            case 'ACTIF':
                return 'Actif';
            default:
                return status || '-';
        }
    }

    private formatVehicleStatus(status?: string): string {
        switch (status) {
            case 'EN_SERVICE':
                return 'En service';
            case 'HORS_SERVICE':
                return 'Hors service';
            default:
                return status || 'Hors service';
        }
    }

    private mergeTrips(trips: Trip[]): Trip[] {
        const byId = new Map<string, Trip>();
        trips.forEach(trip => byId.set(trip.id, trip));
        return Array.from(byId.values());
    }

    private formatRestAvailability(availability?: { dateDisponibilite?: string; minutesRestantes?: number | null; disponible?: boolean | null } | null): string {
        if (!availability) {
            return '0h 00m';
        }

        if (availability.disponible) {
            return 'Disponible';
        }

        const minutes = Math.max(0, availability.minutesRestantes ?? 0);
        const hours = Math.floor(minutes / 60);
        const remainingMinutes = minutes % 60;
        return `Disponible dans ${hours}h ${remainingMinutes.toString().padStart(2, '0')}m`;
    }
}
