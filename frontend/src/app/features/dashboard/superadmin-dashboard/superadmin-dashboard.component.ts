import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatTabsModule } from '@angular/material/tabs';
import { MatTableModule } from '@angular/material/table';
import { MatMenuModule } from '@angular/material/menu';
import { MatDividerModule } from '@angular/material/divider';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatSortModule } from '@angular/material/sort';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { forkJoin, of, interval, Subscription } from 'rxjs';
import { catchError, startWith } from 'rxjs/operators';
import { BaseChartDirective } from 'ng2-charts';
import { ChartConfiguration, ChartOptions } from 'chart.js';
import { CompanyService } from '../../../core/services/company.service';
import { FleetService } from '../../../core/services/fleet.service';
import { NotificationService } from '../../../core/services/notification.service';
import { LeaveService } from '../../../core/services/leave.service';
import { ReclamationService } from '../../../core/services/reclamation.service';
import { AdminKpiService } from '../../../core/services/admin-kpi.service';
import { UserService } from '../../../core/services/user.service';
import { SecteurService } from '../../../core/services/secteur.service';

@Component({
  selector: 'app-superadmin-dashboard',
  standalone: true,
  imports: [
    CommonModule, MatCardModule, MatIconModule, MatButtonModule,
    MatSlideToggleModule, MatTooltipModule, MatTabsModule, MatTableModule,
    MatMenuModule, MatDividerModule, MatPaginatorModule, MatSortModule,
    MatFormFieldModule, MatInputModule, MatSelectModule, MatSnackBarModule,
    MatCheckboxModule, MatDatepickerModule, MatNativeDateModule,
    MatProgressBarModule, FormsModule, RouterModule, BaseChartDirective
  ],
  templateUrl: './superadmin-dashboard.component.html',
  styleUrls: ['./superadmin-dashboard.component.css']
})
export class SuperAdminDashboardComponent implements OnInit, OnDestroy {

  isLoading = true;
  currentTime = new Date();
  private clockSub?: Subscription;

  // ── Raw KPI data ──────────────────────────────────────────────────
  kpiData: any = null;

  stats = {
    activeDrivers: { count: 0, total: 0 },
    activeVehicles: { count: 0, total: 0, maintenance: 0, horsService: 0 },
    ongoingMissions: { count: 0, onTime: 0, delayed: 0, terminated: 0 },
    pendingLeaves: { count: 0, approved: 0, rejected: 0 },
    reclamations: { open: 0, resolved: 0, total: 0 },
    users: { admins: 0, managers: 0, drivers: 0 },
  };

  topDrivers: any[] = [];
  usersBreakdown: any[] = [];
  reclamationsStats: any[] = [];
  congesStats: any[] = [];
  capacityBreakdown: any[] = [];
  fleetPerformanceScore = 0;
  fuelValue: number | null = null;
  fuelTrend: number | null = null;
  lowFuelAlerts = 0;

  // ── Filters ───────────────────────────────────────────────────────
  filters = { period: 'Mois', companyId: 'ALL' };
  periods = ['Jour', 'Semaine', 'Mois', 'Trimestre', 'Année'];
  companies: any[] = [];
  selectedChauffeurId: number | null = null;
  selectedChauffeurName: string = '';
  activeChartFilter: string = '';

  // ────────────────────────────────────────────────────────────────
  //  CHART 1 — Ponctualité (Stacked Bar + Line)
  // ────────────────────────────────────────────────────────────────
  ponctualiteChartOptions: ChartOptions = {
    responsive: true, maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: { backgroundColor: 'rgba(15,23,42,0.95)', padding: 12, bodyColor: '#e2e8f0', titleColor: '#818cf8' }
    },
    scales: {
      y: { stacked: true, grid: { color: 'rgba(255,255,255,0.04)' }, ticks: { color: '#64748b', font: { size: 11 } } },
      y1: { type: 'linear', display: true, position: 'right', grid: { drawOnChartArea: false }, ticks: { color: '#818cf8', font: { size: 11 } }, min: 0, max: 100 },
      x: { stacked: true, grid: { display: false }, ticks: { color: '#64748b', font: { size: 11 } } }
    }
  };
  ponctualiteChartData: ChartConfiguration['data'] = {
    labels: [],
    datasets: [
      { data: [], label: 'À l\'heure', backgroundColor: 'rgba(16,185,129,0.8)', stack: 'a', type: 'bar', borderRadius: 3 },
      { data: [], label: 'Retard <30min', backgroundColor: 'rgba(245,158,11,0.8)', stack: 'a', type: 'bar', borderRadius: 3 },
      { data: [], label: 'Retard >30min', backgroundColor: 'rgba(239,68,68,0.8)', stack: 'a', type: 'bar', borderRadius: 3 },
      {
        data: [], label: 'Ponctualité %', borderColor: '#818cf8', borderWidth: 2.5, pointBackgroundColor: '#818cf8',
        pointRadius: 4, type: 'line', yAxisID: 'y1', tension: 0.4, fill: false
      }
    ]
  };

  // ────────────────────────────────────────────────────────────────
  //  CHART 2 — Flux Missions (Area)
  // ────────────────────────────────────────────────────────────────
  fluxChartOptions: ChartOptions = {
    responsive: true, maintainAspectRatio: false,
    elements: { line: { tension: 0.4 } },
    scales: {
      y: { grid: { color: 'rgba(255,255,255,0.04)' }, ticks: { color: '#64748b', font: { size: 11 } } },
      x: { grid: { display: false }, ticks: { color: '#64748b', font: { size: 11 } } }
    },
    plugins: {
      legend: { display: false },
      tooltip: { backgroundColor: 'rgba(15,23,42,0.95)', padding: 12 }
    }
  };
  fluxChartData: ChartConfiguration['data'] = {
    labels: [],
    datasets: [
      { data: [], label: 'Terminées', borderColor: '#10b981', backgroundColor: 'rgba(16,185,129,0.12)', fill: true, pointRadius: 3 },
      { data: [], label: 'Retardées', borderColor: '#ef4444', backgroundColor: 'rgba(239,68,68,0.10)', fill: true, pointRadius: 3 }
    ]
  };

  // ────────────────────────────────────────────────────────────────
  //  CHART 3 — Donut Incidents
  // ────────────────────────────────────────────────────────────────
  incidentsChartOptions: ChartOptions = {
    responsive: true, maintainAspectRatio: false, cutout: '72%',
    plugins: {
      legend: { display: false },
      tooltip: { backgroundColor: 'rgba(15,23,42,0.95)', padding: 12, bodyColor: '#e2e8f0' }
    }
  } as any;
  incidentsChartData: ChartConfiguration['data'] = {
    labels: [],
    datasets: [{ data: [], backgroundColor: ['#ef4444', '#f59e0b', '#fbbf24', '#38bdf8', '#94a3b8'], borderWidth: 0, hoverOffset: 8 }]
  };

  // ────────────────────────────────────────────────────────────────
  //  CHART 4 — Jauge Carburant (Doughnut demi-cercle)
  // ────────────────────────────────────────────────────────────────
  fuelChartOptions: ChartOptions = {
    responsive: true, maintainAspectRatio: false,
    circumference: 180, rotation: -90,
    cutout: '75%',
    plugins: { legend: { display: false }, tooltip: { enabled: false } }
  } as any;
  fuelChartData: ChartConfiguration['data'] = {
    labels: ['Optimale', 'Acceptable', 'Élevée', 'Anomalie'],
    datasets: [{ data: [0, 0, 0, 0], backgroundColor: ['#10b981', '#fbbf24', '#f59e0b', '#ef4444'], borderWidth: 0 }]
  };

  // ────────────────────────────────────────────────────────────────
  //  CHART 5 — Capacité Charge Donut
  // ────────────────────────────────────────────────────────────────
  chargeChartOptions: ChartOptions = {
    responsive: true, maintainAspectRatio: false, cutout: '68%',
    plugins: {
      legend: { position: 'bottom', labels: { color: '#94a3b8', font: { size: 11 } } },
      tooltip: { backgroundColor: 'rgba(15,23,42,0.95)' }
    }
  } as any;
  chargeChartData: ChartConfiguration['data'] = {
    labels: ['Disponible', 'Utilisée'],
    datasets: [{ data: [100, 0], backgroundColor: ['rgba(148,163,184,0.1)', '#6366f1'], borderWidth: 0 }]
  };

  // ────────────────────────────────────────────────────────────────
  //  CHART 6 — Répartition Rôles (Donut)
  // ────────────────────────────────────────────────────────────────
  rolesChartOptions: ChartOptions = {
    responsive: true, maintainAspectRatio: false, cutout: '65%',
    plugins: {
      legend: { display: false },
      tooltip: { backgroundColor: 'rgba(15,23,42,0.95)', padding: 10, bodyColor: '#e2e8f0' }
    }
  } as any;
  rolesChartData: ChartConfiguration['data'] = {
    labels: ['SuperAdmin', 'Manager', 'Chauffeur'],
    datasets: [{ data: [0, 0, 0], backgroundColor: ['#818cf8', '#34d399', '#fbbf24'], borderWidth: 0, hoverOffset: 6 }]
  };

  // ────────────────────────────────────────────────────────────────
  //  CHART 7 — Congés par statut (Bar horizontal)
  // ────────────────────────────────────────────────────────────────
  congesChartOptions: ChartOptions = {
    responsive: true, maintainAspectRatio: false,
    indexAxis: 'y' as const,
    plugins: {
      legend: { display: false },
      tooltip: { backgroundColor: 'rgba(15,23,42,0.95)', padding: 10 }
    },
    scales: {
      x: { grid: { color: 'rgba(255,255,255,0.04)' }, ticks: { color: '#64748b', font: { size: 11 } } },
      y: { grid: { display: false }, ticks: { color: '#94a3b8', font: { size: 11 } } }
    }
  };
  congesChartData: ChartConfiguration['data'] = {
    labels: [],
    datasets: [{
      data: [], label: 'Congés',
      backgroundColor: ['rgba(245,158,11,0.7)', 'rgba(16,185,129,0.7)', 'rgba(239,68,68,0.7)'],
      borderRadius: 4, borderWidth: 0
    }]
  };

  // ────────────────────────────────────────────────────────────────
  //  CHART 8 — Réclamations par statut (Bar)
  // ────────────────────────────────────────────────────────────────
  reclamationsChartOptions: ChartOptions = {
    responsive: true, maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: { backgroundColor: 'rgba(15,23,42,0.95)', padding: 10 }
    },
    scales: {
      y: { grid: { color: 'rgba(255,255,255,0.04)' }, ticks: { color: '#64748b', font: { size: 11 } } },
      x: { grid: { display: false }, ticks: { color: '#94a3b8', font: { size: 11 } } }
    }
  };
  reclamationsChartData: ChartConfiguration['data'] = {
    labels: [],
    datasets: [{
      data: [], label: 'Réclamations',
      backgroundColor: ['rgba(239,68,68,0.7)', 'rgba(245,158,11,0.7)', 'rgba(16,185,129,0.7)'],
      borderRadius: 4, borderWidth: 0
    }]
  };

  // ────────────────────────────────────────────────────────────────

  constructor(
    private route: ActivatedRoute,
    private snackBar: MatSnackBar,
    private userService: UserService,
    private companyService: CompanyService,
    private fleetService: FleetService,
    private secteurService: SecteurService,
    private notificationService: NotificationService,
    private leaveService: LeaveService,
    private reclamationService: ReclamationService,
    private adminKpiService: AdminKpiService,
    private cdr: ChangeDetectorRef
  ) {
    this.route.fragment.subscribe(f => {
      if (f === 'regle') {
        setTimeout(() => document.getElementById('rules-section')?.scrollIntoView({ behavior: 'smooth' }), 300);
      }
    });
  }

  ngOnInit() {
    this.clockSub = interval(60000).pipe(startWith(0)).subscribe(() => {
      this.currentTime = new Date();
      this.cdr.markForCheck();
    });
    this.loadCompanies();
    this.loadStats();
  }

  loadCompanies(): void {
    this.companyService.getCompanies().subscribe({
      next: (list) => {
        this.companies = list;
        this.cdr.markForCheck();
      },
      error: (err) => {
        console.error('Erreur lors du chargement des entreprises:', err);
      }
    });
  }

  ngOnDestroy() {
    this.clockSub?.unsubscribe();
  }

  // ── Getters calculés ─────────────────────────────────────────────

  get driversActivePercent(): number {
    return this.stats.activeDrivers.total > 0
      ? Math.round((this.stats.activeDrivers.count / this.stats.activeDrivers.total) * 100) : 0;
  }

  get vehiclesActivePercent(): number {
    return this.stats.activeVehicles.total > 0
      ? Math.round((this.stats.activeVehicles.count / this.stats.activeVehicles.total) * 100) : 0;
  }

  get missionsOnTimePercent(): number {
    const total = this.stats.ongoingMissions.count;
    return total > 0 ? Math.round((this.stats.ongoingMissions.onTime / total) * 100) : 0;
  }

  get currentPunctualityRate(): number {
    if (!this.kpiData?.punctualityLast12Months?.length) return 0;
    const last = this.kpiData.punctualityLast12Months[this.kpiData.punctualityLast12Months.length - 1];
    return last ? Math.round(last.punctualityPercent || 0) : 0;
  }

  get totalUsersActive(): number {
    return this.usersBreakdown.reduce((acc: number, u: any) => acc + (u.actifs || 0), 0);
  }

  get totalUsers(): number {
    return this.usersBreakdown.reduce((acc: number, u: any) => acc + (u.count || 0), 0);
  }

  get capacityUsedPercent(): number {
    const d = this.chargeChartData.datasets[0].data;
    return d && d.length > 1 ? Math.round(Number(d[1]) || 0) : 0;
  }

  get leavesTotal(): number {
    return this.stats.pendingLeaves.count + this.stats.pendingLeaves.approved + this.stats.pendingLeaves.rejected;
  }

  get leavePendingPercent(): number {
    return this.leavesTotal > 0 ? Math.round((this.stats.pendingLeaves.count / this.leavesTotal) * 100) : 0;
  }

  get reclamationsOpenPercent(): number {
    return this.stats.reclamations.total > 0
      ? Math.round((this.stats.reclamations.open / this.stats.reclamations.total) * 100) : 0;
  }

  getKpiHealthClass(value: number, thresholdGood: number, thresholdWarn: number): string {
    return value >= thresholdGood ? 'health-good' : value >= thresholdWarn ? 'health-warn' : 'health-bad';
  }

  getBadgeClass(badge: string): string {
    const b = (badge || '').toLowerCase();
    if (b === 'excellent') return 'badge-excellent';
    if (b === 'bon') return 'badge-bon';
    if (b === 'normal') return 'badge-normal';
    return 'badge-critique';
  }

  getScoreColor(score: number): string {
    if (score >= 80) return '#10b981';
    if (score >= 60) return '#fbbf24';
    if (score >= 40) return '#f59e0b';
    return '#ef4444';
  }

  getMedalEmoji(rank: number): string {
    if (rank === 1) return '🥇';
    if (rank === 2) return '🥈';
    if (rank === 3) return '🥉';
    return `#${rank}`;
  }

  formatStatut(s: string): string {
    const map: Record<string, string> = {
      EN_ATTENTE: 'En attente', APPROUVE: 'Approuvés', REJETE: 'Rejetés', ANNULE: 'Annulés',
      EN_COURS: 'En cours', RESOLU: 'Résolues'
    };
    return map[s] || s;
  }

  loadStats(): void {
    this.isLoading = true;

    const params: any = {};
    if (this.filters.period) {
      params.period = this.filters.period;
    }
    if (this.filters.companyId && this.filters.companyId !== 'ALL') {
      params.entrepriseId = this.filters.companyId;
    }
    if (this.selectedChauffeurId) {
      params.chauffeurId = this.selectedChauffeurId;
    }

    this.adminKpiService.getOverview(params).pipe(
      catchError(err => {
        console.error('Erreur lors du chargement des stats SuperAdmin:', err);
        return of(null);
      })
    ).subscribe(kpi => {
      if (!kpi) { this.isLoading = false; return; }
      this.kpiData = kpi;

      const c = kpi.cards;

      // ── Stats de base ──────────────────────────────────────────
      this.stats.activeDrivers = { count: c.chauffeursActifs, total: c.chauffeursTotal };
      this.stats.activeVehicles = { count: c.vehiculesEnService, total: c.vehiculesTotal, maintenance: c.vehiculesEnMaintenance || 0, horsService: c.vehiculesHorsService || 0 };
      this.stats.ongoingMissions = { count: c.missionsEnCours, onTime: c.missionsALheure, delayed: c.missionsEnRetard, terminated: c.missionsTerminees || 0 };
      this.stats.pendingLeaves = { count: c.congesEnAttente, approved: c.congesApprouves || 0, rejected: c.congesRefuses || 0 };
      this.stats.reclamations = { open: c.reclamationsOuvertes || 0, resolved: c.reclamationsResolues || 0, total: c.reclamationsTotal || 0 };
      this.stats.users = { admins: c.administrateurs || 0, managers: c.managers || 0, drivers: c.chauffeurs || 0 };

      // ── Ponctualité 12 mois ────────────────────────────────────
      if (kpi.punctualityLast12Months?.length) {
        const p = kpi.punctualityLast12Months;
        this.ponctualiteChartData = {
          ...this.ponctualiteChartData,
          labels: p.map((e: any) => e.month),
          datasets: [
            { ...this.ponctualiteChartData.datasets[0], data: p.map((e: any) => e.onTime) },
            { ...this.ponctualiteChartData.datasets[1], data: p.map((e: any) => e.lateLess30) },
            { ...this.ponctualiteChartData.datasets[2], data: p.map((e: any) => e.lateMore30) },
            { ...this.ponctualiteChartData.datasets[3], data: p.map((e: any) => Math.round(e.punctualityPercent || 0)) }
          ]
        };
        this.fluxChartData = {
          ...this.fluxChartData,
          labels: p.map((e: any) => e.month),
          datasets: [
            { ...this.fluxChartData.datasets[0], data: p.map((e: any) => e.onTime) },
            { ...this.fluxChartData.datasets[1], data: p.map((e: any) => (e.lateLess30 || 0) + (e.lateMore30 || 0)) }
          ]
        };
      }

      // ── Incidents ──────────────────────────────────────────────
      if (kpi.incidentsThisMonth?.length) {
        this.incidentsChartData = {
          ...this.incidentsChartData,
          labels: kpi.incidentsThisMonth.map((i: any) => i.category),
          datasets: [{ ...this.incidentsChartData.datasets[0], data: kpi.incidentsThisMonth.map((i: any) => i.count) }]
        };
      }

      // ── Carburant ──────────────────────────────────────────────
      if (kpi.fuelOverview) {
        const f = kpi.fuelOverview;
        const avg = f.averageLPer100km;
        const tgt = f.targetLPer100km || 22;
        this.fuelValue = (avg !== null && avg !== undefined && !isNaN(Number(avg)) && String(avg) !== 'NaN') ? Number(avg) : null;
        
        const delta = f.deltaToTarget;
        this.fuelTrend = (delta !== null && delta !== undefined && !isNaN(Number(delta)) && String(delta) !== 'NaN') ? Number(delta) : null;
        
        this.lowFuelAlerts = f.lowFuelAlerts || 0;
        if (this.fuelValue !== null && this.fuelValue > 0) {
          this.fuelChartData = {
            ...this.fuelChartData,
            datasets: [{
              ...this.fuelChartData.datasets[0], data: [
                Math.min(tgt, this.fuelValue),
                Math.max(0, Math.min(6, this.fuelValue - tgt)),
                Math.max(0, Math.min(7, this.fuelValue - tgt - 6)),
                Math.max(0, this.fuelValue - tgt - 13)
              ]
            }]
          };
        }
      }

      // ── Capacité charge ────────────────────────────────────────
      if (kpi.capacityDistribution?.length) {
        this.capacityBreakdown = kpi.capacityDistribution.map((cd: any) => ({
          label: cd.vehicleType || 'Autres',
          usage: Math.round(cd.avgPercent || 0),
          min: Math.round(cd.minPercent || 0),
          max: Math.round(cd.maxPercent || 0),
          color: cd.vehicleType?.toLowerCase().includes('lourd') ? '#38bdf8' : cd.vehicleType?.toLowerCase().includes('van') ? '#6366f1' : '#818cf8'
        }));

        const totalUsed = kpi.capacityDistribution.reduce((sum: number, cd: any) => sum + (cd.avgTons || 0), 0);
        const totalAvail = kpi.capacityDistribution.reduce((sum: number, cd: any) => sum + (cd.minTons || 0), 0);
        const totalCap = kpi.capacityDistribution.reduce((sum: number, cd: any) => sum + (cd.maxTons || 0), 0);

        const usedPercent = totalCap > 0 ? Math.round((totalUsed / totalCap) * 100) : 0;
        const availPercent = totalCap > 0 ? Math.round((totalAvail / totalCap) * 100) : 100;

        this.chargeChartData = {
          ...this.chargeChartData,
          datasets: [{ ...this.chargeChartData.datasets[0], data: [availPercent, usedPercent] }]
        };
      }

      // ── Top Chauffeurs ─────────────────────────────────────────
      if (kpi.topDrivers?.length) {
        this.topDrivers = kpi.topDrivers.map((d: any) => ({
          id: d.chauffeurId,
          rank: d.rank,
          name: d.chauffeurName || 'N/A',
          missions: d.missionsCompleted || 0,
          score: Math.round(d.performanceScore || 0),
          ponctuality: Math.round(d.punctualityPercent || 0),
          incidents: d.incidents || 0,
          drivingHours: d.drivingHours != null ? Math.round(d.drivingHours * 10) / 10 : null,
          availability: Math.round(d.availabilityScore || 0),
          avgDelay: d.avgDelayMinutes != null ? Math.round(d.avgDelayMinutes) : null,
          badge: d.badge || 'Normal'
        }));
        this.fleetPerformanceScore = Math.round(
          this.topDrivers.reduce((acc: number, d: any) => acc + d.score, 0) / (this.topDrivers.length || 1)
        );
      }

      // ── Breakdown utilisateurs ─────────────────────────────────
      this.usersBreakdown = kpi.usersBreakdown || [];
      const admins = this.usersBreakdown.find((u: any) => u.role === 'SUPERADMIN')?.count || 0;
      const managers = this.usersBreakdown.find((u: any) => u.role === 'MANAGER')?.count || 0;
      const drivers = this.usersBreakdown.find((u: any) => u.role === 'CHAUFFEUR')?.count || 0;
      this.rolesChartData = {
        ...this.rolesChartData,
        datasets: [{ ...this.rolesChartData.datasets[0], data: [admins, managers, drivers] }]
      };

      // ── Congés par statut ──────────────────────────────────────
      this.congesStats = kpi.congesStats || [];
      if (this.congesStats.length) {
        this.congesChartData = {
          ...this.congesChartData,
          labels: this.congesStats.map((cs: any) => this.formatStatut(cs.statut)),
          datasets: [{ ...this.congesChartData.datasets[0], data: this.congesStats.map((cs: any) => cs.count) }]
        };
      }

      // ── Réclamations par statut ────────────────────────────────
      this.reclamationsStats = kpi.reclamationsStats || [];
      if (this.reclamationsStats.length) {
        this.reclamationsChartData = {
          ...this.reclamationsChartData,
          labels: this.reclamationsStats.map((rs: any) => this.formatStatut(rs.statut)),
          datasets: [{ ...this.reclamationsChartData.datasets[0], data: this.reclamationsStats.map((rs: any) => rs.count) }]
        };
      }

      this.isLoading = false;
      this.cdr.detectChanges();
    });
  }

  applyFilter(type: string, value: any): void {
    (this.filters as any)[type] = value;
    this.selectedChauffeurId = null;
    this.selectedChauffeurName = '';
    this.selectedIncidentCategory = null;
    this.activeChartFilter = '';
    this.loadStats();
  }

  resetFilters(): void {
    this.filters = { period: 'Mois', companyId: 'ALL' };
    this.selectedChauffeurId = null;
    this.selectedChauffeurName = '';
    this.selectedIncidentCategory = null;
    this.activeChartFilter = '';
    this.loadStats();
  }

  get safeFuelValue(): number | null {
    return (this.fuelValue !== null && !isNaN(this.fuelValue)) ? this.fuelValue : null;
  }

  get safeFuelTrend(): number | null {
    return (this.fuelTrend !== null && !isNaN(this.fuelTrend)) ? this.fuelTrend : null;
  }

  get fuelDisplayValue(): string {
    return (this.safeFuelValue !== null && this.safeFuelValue > 0) ? this.safeFuelValue.toString() : '—';
  }

  get fuelDisplayUnit(): string {
    return (this.safeFuelValue !== null && this.safeFuelValue > 0) ? 'L/100km' : 'N/A';
  }

  get fuelTrendDisplay(): string {
    if (this.safeFuelTrend === null) return '0.0';
    const prefix = this.safeFuelTrend > 0 ? '+' : '';
    return `${prefix}${this.safeFuelTrend.toFixed(1)}`;
  }

  get isFuelTrendPositive(): boolean {
    return this.safeFuelTrend !== null && this.safeFuelTrend > 0;
  }

  onTableRowClick(driver: any): void {
    if (this.selectedChauffeurId === driver.id) {
      this.clearChartFilter();
      return;
    }
    this.selectedChauffeurId = driver.id;
    this.selectedChauffeurName = driver.name;
    this.activeChartFilter = 'chauffeur';
    this.loadStats();
  }

  clearChartFilter(): void {
    this.selectedChauffeurId = null;
    this.selectedChauffeurName = '';
    this.activeChartFilter = '';
    this.loadStats();
  }

  selectedIncidentCategory: string | null = null;

  onIncidentChartClick(event: any): void {
    const active = event.active;
    if (active && active.length > 0) {
      const idx = active[0].index;
      const label = this.incidentsChartData.labels?.[idx];
      if (label) {
        this.selectIncidentCategory(label);
      }
    }
  }

  selectIncidentCategory(category: any): void {
    if (category) {
      this.selectedIncidentCategory = String(category);
      this.activeChartFilter = 'incident';
      this.loadStats();
    }
  }

  clearIncidentFilter(): void {
    this.selectedIncidentCategory = null;
    this.activeChartFilter = '';
    this.loadStats();
  }

  getFilteredDrivers(): any[] {
    let list = this.topDrivers;
    if (this.selectedIncidentCategory) {
      list = list.filter(d => d.incidents > 0);
    }
    return list;
  }

  exportData(): void {
    this.snackBar.open('Export en cours...', 'OK', { duration: 3000 });
  }
}
