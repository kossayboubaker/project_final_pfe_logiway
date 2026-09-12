import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { FleetService, Trip, Vehicle } from '../../../core/services/fleet.service';
import { SecteurService } from '../../../core/services/secteur.service';
import { AuthService } from '../../../core/auth.service';
import { ProfileService } from '../../../core/services/profile.service';
import { UserService, UserListItem } from '../../../core/services/user.service';

import { catchError, takeUntil } from 'rxjs/operators';
import { of, Subject } from 'rxjs';
import { RouterModule } from '@angular/router';
import { LeaveService } from '../../../core/services/leave.service';
import { ReclamationService } from '../../../core/services/reclamation.service';
import { MessengerService } from '../../../core/services/messenger.service';
import { forkJoin } from 'rxjs';
import { NotificationService } from '../../../core/services/notification.service';

interface SectorStats {
    id: number;
    nom: string;
    zoneGeographique: string;
    managersCount: number;
    driversCount: number;
    trajetsCount: number;
}

@Component({
    selector: 'app-manager-dashboard',
    standalone: true,
    imports: [
        CommonModule,
        MatCardModule,
        MatIconModule,
        MatButtonModule,
        RouterModule
    ],
    templateUrl: './manager-dashboard.component.html',
    styleUrls: ['./manager-dashboard.component.css']
})
export class ManagerDashboardComponent implements OnInit, OnDestroy {

    // ── Pointage ──────────────────────────────────────────────────────
    pointage = {
        clockedIn: false,
        startTime: 0 as number,
        todayTotal: 0 as number,
        sessionElapsed: '00:00:00',
        timerId: null as any
    };
    private readonly POINTAGE_KEY = 'logiway_pointage_manager';
    private readonly POINTAGE_LOG_KEY = 'logiway_pointage_manager_log';

    currentTime = new Date();
    private timeTimerId: any = null;

    activeTripCount = 0;
    vehicleCount = 0;
    recentTrips: Trip[] = [];
    allTrips: Trip[] = [];         // tous les trajets bruts
    sectorStats: SectorStats | null = null;
    isLoading = false;

    // ── Filtre Chauffeur ──────────────────────────────────────────────
    drivers: UserListItem[] = [];
    selectedDriverId: number | null = null;
    isDriversLoading = false;

    get selectedDriver(): UserListItem | undefined {
        return this.drivers.find(d => d.id === this.selectedDriverId);
    }

    // ── KPIs calculés depuis données réelles ──────────────────────────
    kpiTotalDistance = 0;       // km total
    kpiCompletedTrips = 0;      // missions terminées
    kpiOnTimeRate = 100;        // % ponctualité
    kpiAvgDelay = 0;            // minutes de retard moyen
    kpiTotalTrips = 0;          // total trajets

    // ── Nouveaux KPIs Manager ──────────────────────────────────────────
    kpiLeavesCount = 0;         // nombre de congés
    kpiComplaintsCount = 0;     // nombre de réclamations
    kpiMessagesCount = 0;       // nombre de messages
    kpiSectorsCount = 0;        // nombre de secteurs
    kpiTotalUsersCount = 0;     // nombre total d'utilisateurs
    kpiMissionsCount = 0;       // alias pour total trajets ou missions spécifiques

    // ── Synchronisation temps réel ────────────────────────────────────
    private readonly destroy$ = new Subject<void>();


    constructor(
        private fleetService: FleetService,
        private secteurService: SecteurService,
        private authService: AuthService,
        private profileService: ProfileService,
        private userService: UserService,
        private leaveService: LeaveService,
        private reclamationService: ReclamationService,
        private messengerService: MessengerService,
        private notificationService: NotificationService,
        private cdr: ChangeDetectorRef
    ) { }

    ngOnInit() {
        this.restorePointage();
        this.authService.currentUser.pipe(takeUntil(this.destroy$)).subscribe(user => { if (!user && this.pointage.clockedIn) this.savePointageOnExit(); });
        window.addEventListener('beforeunload', this.onBeforeUnload);
        this.timeTimerId = setInterval(() => { this.currentTime = new Date(); this.cdr.detectChanges(); }, 30000);
        this.isLoading = true;

        // ── Charger les chauffeurs pour le filtre ─────────────────────
        this.isDriversLoading = true;
        this.userService.list().pipe(
            catchError(() => of([]))
        ).subscribe(users => {
            this.drivers = users.filter(u => u.role === 'CHAUFFEUR');
            this.kpiTotalUsersCount = users.length;
            this.isDriversLoading = false;
            this.cdr.detectChanges();
        });

        // ── Charger et computeŕ depuis les trajets réels ──────────────
        this.fleetService.getTrips().subscribe({
            next: (trips) => {
                this.allTrips = trips;
                this.applyDriverFilter();
                this.isLoading = false;
                this.cdr.detectChanges();
            },
            error: () => {
                this.allTrips = [];
                this.recentTrips = [];
                this.activeTripCount = 0;
                this.isLoading = false;
            }
        });

        // ── Secteur ───────────────────────────────────────────────────
        this.profileService.getCurrentProfile().subscribe({
            next: (profile) => {
                const sectorId = profile?.secteurId ?? this.authService.getUser()?.secteurId;
                if (!sectorId) return;

                this.secteurService.getSectorById(sectorId).subscribe({
                    next: (sector: any) => {
                        if (sector?.id) {
                            this.sectorStats = {
                                id: sector.id,
                                nom: sector.nom || 'Secteur',
                                zoneGeographique: sector.zoneGeographique || 'N/A',
                                managersCount: sector.managers?.length ?? 1,
                                driversCount: sector.chauffeurs?.length ?? 0,
                                trajetsCount: sector.trajetsCount ?? 0
                            };
                            if (!sector.trajetsCount && sector.id) {
                                this.fleetService.getTrajetsCountBySecteur(sector.id).subscribe({
                                    next: (count) => { if (this.sectorStats) this.sectorStats.trajetsCount = count; }
                                });
                            }
                        }
                    },
                    error: () => { this.sectorStats = null; }
                });
            },
            error: () => {
                const user = this.authService.getUser();
                if (user?.secteurId) {
                    this.secteurService.getSectorById(user.secteurId).subscribe({
                        next: (sector: any) => {
                            if (sector?.id) {
                                this.sectorStats = {
                                    id: sector.id,
                                    nom: sector.nom || 'Secteur',
                                    zoneGeographique: sector.zoneGeographique || 'N/A',
                                    managersCount: sector.managers?.length ?? 1,
                                    driversCount: sector.chauffeurs?.length ?? 0,
                                    trajetsCount: sector.trajetsCount ?? 0
                                };
                            }
                        },
                        error: () => { this.sectorStats = null; }
                    });
                }
            }
        });

        this.fleetService.getVehicles().subscribe({
            next: (vehicles) => { this.vehicleCount = vehicles.length; },
            error: () => { this.vehicleCount = 0; }
        });

        // ── Charger les nouveaux KPIs Manager (Congés, Réclamations, etc.) ──
        this.leaveService.getLeaves().subscribe(leaves => this.kpiLeavesCount = leaves.length);
        this.reclamationService.list().subscribe(recls => this.kpiComplaintsCount = recls.length);
        this.messengerService.loadConversations().subscribe(convs => this.kpiMessagesCount = convs.length);
        this.secteurService.getAllSecteurs().subscribe(sectors => this.kpiSectorsCount = sectors.length);

        // ── Synchronisation temps réel via SSE ────────────────────────
        this.notificationService.connectRealtime();
        this.notificationService.realtimeNotification$
            .pipe(takeUntil(this.destroy$))
            .subscribe(notification => {
                const cat = notification?.category;
                if (cat === 'NOTIF_TRAJET' || cat === 'NOTIF_VEHICULE') {
                    this.fleetService.getTrips().subscribe(trips => {
                        this.allTrips = trips;
                        this.applyDriverFilter();
                        this.cdr.detectChanges();
                    });
                    this.fleetService.getVehicles().subscribe(vehicles => {
                        this.vehicleCount = vehicles.length;
                        this.cdr.detectChanges();
                    });
                }
                if (cat === 'NOTIF_COMPTE' || cat === 'SECTEUR') {
                    this.userService.list().pipe(catchError(() => of([]))).subscribe(users => {
                        this.drivers = users.filter(u => u.role === 'CHAUFFEUR');
                        this.kpiTotalUsersCount = users.length;
                        this.cdr.detectChanges();
                    });
                }
            });
    }

    // ── Filtre Chauffeur ──────────────────────────────────────────────
    onDriverSelect(driverId: number | null): void {
        this.selectedDriverId = driverId;
        this.applyDriverFilter();
        this.cdr.detectChanges();
    }

    private applyDriverFilter(): void {
        const filtered = this.selectedDriverId !== null
            ? this.allTrips.filter(t => t.driverId === String(this.selectedDriverId))
            : this.allTrips;
        this.recentTrips = filtered;
        this.computeKpis(filtered);
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

    // ── Calcul KPIs depuis données réelles ────────────────────────────
    private computeKpis(trips: Trip[]): void {
        this.kpiTotalTrips = trips.length;
        this.activeTripCount = trips.filter(t => this.isActive(t.status)).length;
        this.kpiCompletedTrips = trips.filter(t => this.isCompleted(t.status)).length;
        this.kpiTotalDistance = Math.round(trips.reduce((s, t) => s + (t.distanceKm ?? 0), 0));

        const delayed = trips.filter(t => (t.retardMinutes ?? 0) > 0);
        this.kpiAvgDelay = delayed.length
            ? Math.round(delayed.reduce((s, t) => s + (t.retardMinutes ?? 0), 0) / delayed.length)
            : 0;

        const onTime = trips.filter(t => (t.retardMinutes ?? 0) <= 0).length;
        this.kpiOnTimeRate = trips.length ? Math.round((onTime / trips.length) * 100) : 100;
    }


    // ── Helpers statut ─────────────────────────────────────────────────
    isActive(status: string): boolean {
        const s = (status ?? '').toLowerCase();
        return s.includes('cours') || s.includes('actif');
    }

    isCompleted(status: string): boolean {
        const s = (status ?? '').toLowerCase();
        return s.includes('termin') || s.includes('complet');
    }

    isDelayed(trip: Trip): boolean {
        return (trip.retardMinutes ?? 0) > 0;
    }

    getStatusClass(status: string): string {
        const s = (status ?? '').toLowerCase();
        if (s.includes('cours') || s.includes('actif')) return 'active';
        if (s.includes('termin') || s.includes('complet')) return 'completed';
        return 'unknown';
    }

    formatDuration(minutes: number | undefined): string {
        if (!minutes) return '-';
        const h = Math.floor(minutes / 60);
        const m = minutes % 60;
        return h > 0 ? `${h}h ${m.toString().padStart(2, '0')}m` : `${m} min`;
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
        // Save to daily log
        const log = localStorage.getItem(this.POINTAGE_LOG_KEY);
        const entries = log ? JSON.parse(log) : [];
        entries.push({ date: new Date().toISOString(), duration: elapsed });
        localStorage.setItem(this.POINTAGE_LOG_KEY, JSON.stringify(entries));

        // Update today's total
        const today = new Date().toDateString();
        this.pointage.todayTotal = entries
            .filter((e: any) => new Date(e.date).toDateString() === today)
            .reduce((s: number, e: any) => s + (e.duration || 0), 0);

        // Clear session
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

    get pointageStatusClass(): string {
        return this.pointage.clockedIn ? 'ptg--on' : 'ptg--off';
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
}
