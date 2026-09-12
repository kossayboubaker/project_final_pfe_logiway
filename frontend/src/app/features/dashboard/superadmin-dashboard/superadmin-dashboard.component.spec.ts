import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { provideRouter } from '@angular/router';
import { SuperAdminDashboardComponent } from './superadmin-dashboard.component';
import { AuthService } from '../../../core/auth.service';
import { of, Subject, throwError } from 'rxjs';
import { AdminKpiService } from '../../../core/services/admin-kpi.service';
import { CompanyService } from '../../../core/services/company.service';
import { NotificationService } from '../../../core/services/notification.service';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { ActivatedRoute } from '@angular/router';
import { provideCharts, withDefaultRegisterables } from 'ng2-charts';

describe('SuperAdminDashboardComponent', () => {
  let component: SuperAdminDashboardComponent;
  let fixture: ComponentFixture<SuperAdminDashboardComponent>;

  const authServiceMock: any = {
    getUser: jasmine.createSpy('getUser').and.returnValue({ id: '1', role: 'SUPERADMIN' }),
    isAuthenticated: jasmine.createSpy('isAuthenticated').and.returnValue(true),
    currentUser: of({ id: '1', role: 'SUPERADMIN' })
  };
  const adminKpiServiceMock: any = {
    getOverview: jasmine.createSpy('getOverview').and.returnValue(of(null))
  };
  const companyServiceMock: any = {
    getCompanies: jasmine.createSpy('getCompanies').and.returnValue(of([]))
  };
  const notificationServiceMock: any = {
    loadNotifications: jasmine.createSpy('loadNotifications').and.returnValue(of([])),
    connectRealtime: jasmine.createSpy('connectRealtime'),
    disconnectRealtime: jasmine.createSpy('disconnectRealtime')
  };
  const snackBarSpy: any = jasmine.createSpyObj('MatSnackBar', ['open']);
  const fragment$: Subject<string | null> = new Subject<string | null>();
  const activatedRouteMock: any = {
    fragment: fragment$.asObservable(),
    snapshot: { params: {}, queryParams: {}, data: {}, fragment: null, url: [] },
    params: of({}),
    queryParams: of({}),
    data: of({}),
    url: of([]),
    paramMap: of({ get: () => null, has: () => false }),
    queryParamMap: of({ get: () => null, has: () => false }),
    routeConfig: null,
    parent: null,
    children: [],
    firstChild: null
  };

  let scrollSpy: jasmine.Spy;
  let originalScrollIntoView: any;

  beforeAll(() => {
    originalScrollIntoView = (Element.prototype as any).scrollIntoView;
    scrollSpy = jasmine.createSpy('scrollIntoView');
    (Element.prototype as any).scrollIntoView = scrollSpy;
    const section = document.createElement('div');
    section.id = 'rules-section';
    document.body.appendChild(section);
  });

  afterAll(() => {
    (Element.prototype as any).scrollIntoView = originalScrollIntoView;
    const section = document.getElementById('rules-section');
    if (section) section.remove();
  });

  function kpiPayload(over: any = {}): any {
    return Object.assign(
      {
        cards: {
          chauffeursActifs: 8,
          chauffeursTotal: 10,
          vehiculesEnService: 6,
          vehiculesTotal: 12,
          vehiculesEnMaintenance: 2,
          vehiculesHorsService: 4,
          missionsEnCours: 20,
          missionsALheure: 15,
          missionsEnRetard: 5,
          missionsTerminees: 100,
          congesEnAttente: 4,
          congesApprouves: 8,
          congesRefuses: 2,
          reclamationsOuvertes: 3,
          reclamationsResolues: 7,
          reclamationsTotal: 10,
          administrateurs: 1,
          managers: 3,
          chauffeurs: 10
        },
        punctualityLast12Months: [
          { month: 'Jan', onTime: 10, lateLess30: 2, lateMore30: 1, punctualityPercent: 76 },
          { month: 'Fév', onTime: 12, lateLess30: 1, lateMore30: 0, punctualityPercent: undefined }
        ],
        incidentsThisMonth: [
          { category: 'Panne', count: 2 },
          { category: null, count: 1 }
        ],
        fuelOverview: {
          averageLPer100km: 24.5,
          targetLPer100km: 22,
          deltaToTarget: 2.5,
          lowFuelAlerts: 3
        },
        capacityDistribution: [
          { vehicleType: 'Poids Lourd', avgPercent: 70.4, minPercent: 50.2, maxPercent: 90.6, avgTons: 7, minTons: 2, maxTons: 10 },
          { vehicleType: 'Van', avgPercent: 40, minPercent: 20, maxPercent: 60, avgTons: 3, minTons: 0, maxTons: 0 },
          { vehicleType: null, avgPercent: undefined, minPercent: undefined, maxPercent: undefined, avgTons: undefined, minTons: undefined, maxTons: undefined }
        ],
        topDrivers: [
          {
            chauffeurId: 1, rank: 1, chauffeurName: 'Ali', missionsCompleted: 12,
            performanceScore: 92.4, punctualityPercent: 95.5, incidents: 0,
            drivingHours: 12.34, availabilityScore: 88.8, avgDelayMinutes: 4.6, badge: 'Excellent'
          },
          {
            chauffeurId: 2, rank: 2, chauffeurName: null, missionsCompleted: 3,
            performanceScore: 50, punctualityPercent: undefined, incidents: 2,
            drivingHours: null, availabilityScore: undefined, avgDelayMinutes: null, badge: null
          }
        ],
        usersBreakdown: [
          { role: 'SUPERADMIN', count: 1 },
          { role: 'MANAGER', count: 3, actifs: 2 },
          { role: 'CHAUFFEUR', count: 10 }
        ],
        congesStats: [
          { statut: 'EN_ATTENTE', count: 4 },
          { statut: 'INCONNU', count: 1 }
        ],
        reclamationsStats: [{ statut: 'RESOLU', count: 7 }]
      },
      over
    );
  }

  async function setup(opts?: {
    kpi?: any;
    companies?: any[];
    failKpi?: boolean;
    failCompanies?: boolean;
  }): Promise<void> {
    if (opts?.failKpi) {
      adminKpiServiceMock.getOverview.and.returnValue(throwError(() => new Error('boom')));
    } else {
      adminKpiServiceMock.getOverview.and.returnValue(of(opts?.kpi ?? kpiPayload()));
    }
    if (opts?.failCompanies) {
      companyServiceMock.getCompanies.and.returnValue(throwError(() => new Error('network')));
    } else {
      companyServiceMock.getCompanies.and.returnValue(of(opts?.companies ?? []));
    }

    await TestBed.configureTestingModule({
      imports: [SuperAdminDashboardComponent],
      providers: [
        provideRouter([]),
        provideHttpClient(),
        provideHttpClientTesting(),
        provideAnimationsAsync(),
        provideCharts(withDefaultRegisterables()),
        { provide: AuthService, useValue: authServiceMock },
        { provide: AdminKpiService, useValue: adminKpiServiceMock },
        { provide: CompanyService, useValue: companyServiceMock },
        { provide: NotificationService, useValue: notificationServiceMock },
        { provide: MatSnackBar, useValue: snackBarSpy },
        { provide: ActivatedRoute, useValue: activatedRouteMock }
      ]
    })
      .overrideComponent(SuperAdminDashboardComponent, { remove: { imports: [MatSnackBarModule] } })
      .compileComponents();

    fixture = TestBed.createComponent(SuperAdminDashboardComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }

  beforeEach(() => {
    adminKpiServiceMock.getOverview.calls.reset();
    companyServiceMock.getCompanies.calls.reset();
    snackBarSpy.open.calls.reset();
  });

  it('crée le composant et applique un payload KPI complet', async () => {
    await setup();

    expect(component.isLoading).toBeFalse();
    expect(component.kpiData).toBeTruthy();
    expect(component.stats.activeDrivers).toEqual({ count: 8, total: 10 });
    expect(component.stats.activeVehicles).toEqual({ count: 6, total: 12, maintenance: 2, horsService: 4 });
    expect(component.stats.ongoingMissions).toEqual({ count: 20, onTime: 15, delayed: 5, terminated: 100 });
    expect(component.stats.pendingLeaves).toEqual({ count: 4, approved: 8, rejected: 2 });
    expect(component.stats.reclamations).toEqual({ open: 3, resolved: 7, total: 10 });
    expect(component.stats.users).toEqual({ admins: 1, managers: 3, drivers: 10 });

    expect(component.ponctualiteChartData.labels).toEqual(['Jan', 'Fév']);
    expect(component.ponctualiteChartData.datasets[0].data).toEqual([10, 12]);
    expect(component.ponctualiteChartData.datasets[1].data).toEqual([2, 1]);
    expect(component.ponctualiteChartData.datasets[2].data).toEqual([1, 0]);
    expect(component.ponctualiteChartData.datasets[3].data).toEqual([76, 0]);

    expect(component.fluxChartData.datasets[0].data).toEqual([10, 12]);
    expect(component.fluxChartData.datasets[1].data).toEqual([3, 1]);

    expect(component.incidentsChartData.labels![0]).toBe('Panne');
    expect(component.incidentsChartData.datasets[0].data).toEqual([2, 1]);

    expect(component.fuelValue).toBe(24.5);
    expect(component.fuelTrend).toBe(2.5);
    expect(component.lowFuelAlerts).toBe(3);
    expect(component.fuelChartData.datasets[0].data).toEqual([22, 2.5, 0, 0]);

    expect(component.capacityBreakdown.length).toBe(3);
    expect(component.capacityBreakdown[0]).toEqual(jasmine.objectContaining({ label: 'Poids Lourd', usage: 70, min: 50, max: 91, color: '#38bdf8' }));
    expect(component.capacityBreakdown[1].color).toBe('#6366f1');
    expect(component.capacityBreakdown[2]).toEqual(jasmine.objectContaining({ label: 'Autres', color: '#818cf8' }));
    expect(component.chargeChartData.datasets[0].data).toEqual([20, 100]);

    expect(component.topDrivers[0]).toEqual(
      jasmine.objectContaining({
        id: 1, rank: 1, name: 'Ali', missions: 12, score: 92,
        ponctuality: 96, incidents: 0, drivingHours: 12.3, availability: 89, avgDelay: 5, badge: 'Excellent'
      })
    );
    expect(component.topDrivers[1]).toEqual(
      jasmine.objectContaining({ name: 'N/A', score: 50, ponctuality: 0, drivingHours: null, avgDelay: null, availability: 0, badge: 'Normal' })
    );
    expect(component.fleetPerformanceScore).toBe(71);

    expect(component.rolesChartData.datasets[0].data).toEqual([1, 3, 10]);
    expect(component.totalUsersActive).toBe(2);
    expect(component.totalUsers).toBe(14);

    expect(component.congesChartData.labels).toEqual(['En attente', 'INCONNU']);
    expect(component.congesChartData.datasets[0].data).toEqual([4, 1]);
    expect(component.reclamationsChartData.labels).toEqual(['Résolues']);
    expect(component.currentPunctualityRate).toBe(0);
  });

  it('payload minimal sans blocs optionnels garde des valeurs neutres', async () => {
    const p = kpiPayload();
    p.punctualityLast12Months = [];
    p.incidentsThisMonth = [];
    delete p.fuelOverview;
    p.capacityDistribution = [];
    p.topDrivers = [];
    p.usersBreakdown = undefined;
    p.congesStats = [];
    p.reclamationsStats = [];
    await setup({ kpi: p });

    expect(component.currentPunctualityRate).toBe(0);
    expect(component.topDrivers).toEqual([]);
    expect(component.fleetPerformanceScore).toBe(0);
    expect(component.usersBreakdown).toEqual([]);
    expect(component.rolesChartData.datasets[0].data).toEqual([0, 0, 0]);
    expect(component.congesStats).toEqual([]);
    expect(component.reclamationsStats).toEqual([]);
    expect(component.capacityBreakdown).toEqual([]);
    expect(component.chargeChartData.datasets[0].data).toEqual([100, 0]);
    expect(component.capacityUsedPercent).toBe(0);
    expect(component.driversActivePercent).toBe(80);
  });

  it('carburant non numérique est ignoré (NaN, null, chaîne)', async () => {
    await setup({ kpi: kpiPayload({ fuelOverview: { averageLPer100km: NaN, targetLPer100km: undefined, deltaToTarget: undefined, lowFuelAlerts: undefined } }) });
    expect(component.fuelValue).toBeNull();
    expect(component.fuelTrend).toBeNull();
    expect(component.lowFuelAlerts).toBe(0);
    expect(component.fuelChartData.datasets[0].data).toEqual([0, 0, 0, 0]);
  });

  it('carburant fourni comme chaîne invalide est ignoré', async () => {
    await setup({ kpi: kpiPayload({ fuelOverview: { averageLPer100km: 'NaN', targetLPer100km: undefined, deltaToTarget: 'NaN', lowFuelAlerts: undefined } }) });
    expect(component.safeFuelValue).toBeNull();
    expect(component.safeFuelTrend).toBeNull();
    expect(component.fuelDisplayValue).toBe('—');
    expect(component.fuelDisplayUnit).toBe('N/A');
    expect(component.fuelTrendDisplay).toBe('0.0');
    expect(component.isFuelTrendPositive).toBeFalse();
  });

  it('carburant null reste null', async () => {
    await setup({ kpi: kpiPayload({ fuelOverview: { averageLPer100km: null, targetLPer100km: undefined, deltaToTarget: null, lowFuelAlerts: undefined } }) });
    expect(component.fuelValue).toBeNull();
    expect(component.fuelTrend).toBeNull();
  });

  it('erreur du service KPI termine le chargement sans données', async () => {
    await setup({ failKpi: true });

    expect(component.isLoading).toBeFalse();
    expect(component.kpiData).toBeNull();
  });

  it('paramètres vides quand aucun filtre actif', async () => {
    await setup();
    component.filters.period = '';
    component.loadStats();

    expect(adminKpiServiceMock.getOverview.calls.mostRecent().args[0]).toEqual({});
  });

  it('applyFilter construit les paramètres et réinitialise la sélection', async () => {
    await setup();

    component.applyFilter('period', 'Semaine');
    component.applyFilter('companyId', '42');

    expect(component.filters.period).toBe('Semaine');
    expect(component.selectedChauffeurId).toBeNull();
    expect(component.selectedChauffeurName).toBe('');
    expect(component.selectedIncidentCategory).toBeNull();
    expect(component.activeChartFilter).toBe('');

    component.topDrivers = [{ id: 7, name: 'Sam' }];
    component.onTableRowClick({ id: 7, name: 'Sam' });

    expect(component.selectedChauffeurId).toBe(7);
    expect(component.selectedChauffeurName).toBe('Sam');
    expect(component.activeChartFilter).toBe('chauffeur');
    expect(adminKpiServiceMock.getOverview.calls.mostRecent().args[0]).toEqual({
      period: 'Semaine',
      entrepriseId: '42',
      chauffeurId: 7
    });
  });

  it('re-clic sur la même ligne désélectionne le chauffeur', async () => {
    await setup();

    component.onTableRowClick({ id: 7, name: 'Sam' });
    component.onTableRowClick({ id: 7, name: 'Sam' });

    expect(component.selectedChauffeurId).toBeNull();
    expect(component.selectedChauffeurName).toBe('');
    expect(component.activeChartFilter).toBe('');
    const last = adminKpiServiceMock.getOverview.calls.mostRecent().args[0];
    expect(last.chauffeurId).toBeUndefined();
  });

  it('clearChartFilter réinitialise la sélection chauffeur', async () => {
    await setup();

    component.onTableRowClick({ id: 3, name: 'Zoe' });
    component.clearChartFilter();

    expect(component.selectedChauffeurId).toBeNull();
    expect(component.activeChartFilter).toBe('');
  });

  it('selectIncidentCategory ignore les valeurs vides', async () => {
    await setup();
    const callsBefore = adminKpiServiceMock.getOverview.calls.count();

    component.selectIncidentCategory(null);

    expect(component.selectedIncidentCategory).toBeNull();
    expect(adminKpiServiceMock.getOverview.calls.count()).toBe(callsBefore);
  });

  it('selectIncidentCategory applique la catégorie', async () => {
    await setup();

    component.selectIncidentCategory('Panne');

    expect(component.selectedIncidentCategory).toBe('Panne');
    expect(component.activeChartFilter).toBe('incident');
  });

  it('onIncidentChartClick lit l’index actif', async () => {
    await setup();

    component.onIncidentChartClick({ active: [{ index: 0 }] });
    expect(component.selectedIncidentCategory).toBe('Panne');

    component.clearIncidentFilter();
    expect(component.selectedIncidentCategory).toBeNull();
    expect(component.activeChartFilter).toBe('');

    component.onIncidentChartClick({ active: [{ index: 9 }] });
    expect(component.selectedIncidentCategory).toBeNull();

    component.onIncidentChartClick({ active: [] });
    component.onIncidentChartClick({ active: null });
    expect(component.selectedIncidentCategory).toBeNull();
  });

  it('exportData affiche un message dans le snack bar', async () => {
    await setup();

    component.exportData();

    expect(snackBarSpy.open).toHaveBeenCalledWith('Export en cours...', 'OK', { duration: 3000 });
  });

  it('ngOnDestroy ferme l’horloge', async () => {
    await setup();

    component.ngOnDestroy();

    expect((component as any).clockSub.closed).toBeTrue();
  });

  it('le fragment #regle fait défiler vers la section règles', async () => {
    const p = kpiPayload();
    p.punctualityLast12Months = [];
    p.incidentsThisMonth = [];
    delete p.fuelOverview;
    p.capacityDistribution = [];
    p.topDrivers = [];
    p.usersBreakdown = undefined;
    p.congesStats = [];
    p.reclamationsStats = [];
    await setup({ kpi: p });

    let scheduledCb: any = null;
    const stSpy = spyOn(window, 'setTimeout').and.callFake((cb: any) => {
      scheduledCb = cb;
      return 0;
    });

    fragment$.next('regle');

    expect(stSpy).toHaveBeenCalled();
    scheduledCb();

    expect(scrollSpy).toHaveBeenCalledWith({ behavior: 'smooth' });
  });

  it('un autre fragment ne déclenche aucun défilement', async () => {
    const p = kpiPayload();
    p.punctualityLast12Months = [];
    p.incidentsThisMonth = [];
    delete p.fuelOverview;
    p.capacityDistribution = [];
    p.topDrivers = [];
    p.usersBreakdown = undefined;
    p.congesStats = [];
    p.reclamationsStats = [];
    await setup({ kpi: p });
    scrollSpy.calls.reset();

    fragment$.next('autre');
    await Promise.resolve();

    expect(scrollSpy).not.toHaveBeenCalled();
  });

  it('pourcentages à zéro quand totaux nuls', async () => {
    await setup({ kpi: kpiPayload() });

    component.stats.activeDrivers = { count: 0, total: 0 };
    component.stats.activeVehicles = { count: 0, total: 0, maintenance: 0, horsService: 0 };
    component.stats.ongoingMissions = { count: 0, onTime: 0, delayed: 0, terminated: 0 };
    component.stats.pendingLeaves = { count: 0, approved: 0, rejected: 0 };
    component.stats.reclamations = { open: 0, resolved: 0, total: 0 };

    expect(component.driversActivePercent).toBe(0);
    expect(component.vehiclesActivePercent).toBe(0);
    expect(component.missionsOnTimePercent).toBe(0);
    expect(component.leavePendingPercent).toBe(0);
    expect(component.reclamationsOpenPercent).toBe(0);
  });

  it('pourcentages calculés correctement', async () => {
    await setup({ kpi: kpiPayload() });

    component.stats.activeVehicles = { count: 6, total: 12, maintenance: 0, horsService: 0 };
    component.stats.ongoingMissions = { count: 20, onTime: 15, delayed: 5, terminated: 0 };
    component.stats.pendingLeaves = { count: 5, approved: 10, rejected: 3 };
    component.stats.reclamations = { open: 3, resolved: 7, total: 10 };

    expect(component.vehiclesActivePercent).toBe(50);
    expect(component.missionsOnTimePercent).toBe(75);
    expect(component.leavesTotal).toBe(18);
    expect(component.leavePendingPercent).toBe(28);
    expect(component.reclamationsOpenPercent).toBe(30);
  });

  it('capacityUsedPercent gère les cas dégénérés', async () => {
    await setup({ kpi: kpiPayload() });

    component.chargeChartData = { ...component.chargeChartData, datasets: [{ ...(component.chargeChartData.datasets[0] as any), data: [5] }] };
    expect(component.capacityUsedPercent).toBe(0);

    component.chargeChartData = { ...component.chargeChartData, datasets: [{ ...(component.chargeChartData.datasets[0] as any), data: ['abc', 7] }] };
    expect(component.capacityUsedPercent).toBe(7);
  });

  it('currentPunctualityRate utilise la dernière entrée disponible', async () => {
    await setup({ kpi: kpiPayload() });

    component.kpiData = { punctualityLast12Months: [{ month: 'Mars', punctualityPercent: 88 }] };
    expect(component.currentPunctualityRate).toBe(88);
  });

  it('currentPunctualityRate vaut zéro quand la dernière entrée est absente', async () => {
    await setup({ kpi: kpiPayload() });

    component.kpiData = { punctualityLast12Months: [{ month: 'Avril', punctualityPercent: 70 }, null] };
    expect(component.currentPunctualityRate).toBe(0);
  });

  it('getKpiHealthClass respecte les seuils', async () => {
    await setup({ kpi: kpiPayload() });

    expect(component.getKpiHealthClass(80, 80, 60)).toBe('health-good');
    expect(component.getKpiHealthClass(60, 80, 60)).toBe('health-warn');
  });

  it('getBadgeClass couvre toutes les variantes', async () => {
    await setup({ kpi: kpiPayload() });

    expect(component.getBadgeClass('bon')).toBe('badge-bon');
    expect(component.getBadgeClass('normal')).toBe('badge-normal');
    expect(component.getBadgeClass(null as any)).toBe('badge-critique');
  });

  it('getScoreColor couvre les quatre paliers', async () => {
    await setup({ kpi: kpiPayload() });

    expect(component.getScoreColor(80)).toBe('#10b981');
    expect(component.getScoreColor(60)).toBe('#fbbf24');
    expect(component.getScoreColor(40)).toBe('#f59e0b');
    expect(component.getScoreColor(39.9)).toBe('#ef4444');
  });

  it('formatStatut couvre la table complète', async () => {
    await setup({ kpi: kpiPayload() });

    expect(component.formatStatut('APPROUVE')).toBe('Approuvés');
    expect(component.formatStatut('REJETE')).toBe('Rejetés');
    expect(component.formatStatut('ANNULE')).toBe('Annulés');
    expect(component.formatStatut('EN_COURS')).toBe('En cours');
  });

  it('fuelTrendDisplay formate tendance positive, négative et nulle', async () => {
    await setup({ kpi: kpiPayload() });

    (component as any).fuelTrend = 2.5;
    expect(component.fuelTrendDisplay).toBe('+2.5');
    expect(component.isFuelTrendPositive).toBeTrue();

    (component as any).fuelTrend = -1.04;
    expect(component.fuelTrendDisplay).toBe('-1.0');
    expect(component.isFuelTrendPositive).toBeFalse();

    (component as any).fuelTrend = 0;
    expect(component.fuelTrendDisplay).toBe('0.0');

    (component as any).fuelValue = 0;
    expect(component.fuelDisplayValue).toBe('—');
    expect(component.fuelDisplayUnit).toBe('N/A');
  });

  it('getFilteredDrivers filtre uniquement quand une catégorie est active', async () => {
    await setup({ kpi: kpiPayload() });

    component.topDrivers = [{ id: 1, incidents: 0 }, { id: 2, incidents: 2 }];
    component.selectedIncidentCategory = null;
    expect(component.getFilteredDrivers().length).toBe(2);

    component.selectedIncidentCategory = 'Panne';
    expect(component.getFilteredDrivers().length).toBe(1);
  });

  it('charge la liste des entreprises', async () => {
    await setup({ companies: [{ id: 1, nom: 'ACME' }] });

    expect(component.companies).toEqual([{ id: 1, nom: 'ACME' }]);
  });

  it('getMedalEmoji couvre les quatre rangs', async () => {
    await setup({ kpi: kpiPayload() });

    expect(component.getMedalEmoji(1)).toBe('🥇');
    expect(component.getMedalEmoji(2)).toBe('🥈');
    expect(component.getMedalEmoji(3)).toBe('🥉');
    expect(component.getMedalEmoji(9)).toBe('#9');
  });

  it('resetFilters restaure les valeurs par défaut et recharge', async () => {
    await setup({ kpi: kpiPayload() });

    component.applyFilter('period', 'Jour');
    component.selectIncidentCategory('Panne');
    const before = adminKpiServiceMock.getOverview.calls.count();

    component.resetFilters();

    expect(component.filters).toEqual({ period: 'Mois', companyId: 'ALL' });
    expect(component.selectedChauffeurId).toBeNull();
    expect(component.selectedChauffeurName).toBe('');
    expect(component.selectedIncidentCategory).toBeNull();
    expect(component.activeChartFilter).toBe('');
    expect(adminKpiServiceMock.getOverview.calls.count()).toBeGreaterThan(before);
  });

  it('payload dégénéré active tous les replis par défaut', async () => {
    const p: any = {
      cards: {
        chauffeursActifs: 8,
        chauffeursTotal: 10,
        vehiculesEnService: 6,
        vehiculesTotal: 12,
        missionsEnCours: 20,
        missionsALheure: 15,
        missionsEnRetard: 5,
        congesEnAttente: 4
      },
      punctualityLast12Months: [
        { month: 'Jan', onTime: 10, lateLess30: null, lateMore30: null, punctualityPercent: null },
        { month: 'Fév', onTime: 2 }
      ],
      capacityDistribution: [{ vehicleType: 'Van', avgTons: null, minTons: null, maxTons: null }],
      topDrivers: [{ chauffeurId: 3, rank: 4 }],
      usersBreakdown: [{ role: 'AUTRE' }]
    };

    await setup({ kpi: p });

    expect(component.currentPunctualityRate).toBe(0);
    expect(component.ponctualiteChartData.datasets[3].data).toEqual([0, 0]);
    expect(component.fluxChartData.datasets[1].data).toEqual([0, 0]);
    expect(component.stats.activeVehicles.maintenance).toBe(0);
    expect(component.stats.activeVehicles.horsService).toBe(0);
    expect(component.stats.ongoingMissions.terminated).toBe(0);
    expect(component.stats.pendingLeaves.approved).toBe(0);
    expect(component.stats.pendingLeaves.rejected).toBe(0);
    expect(component.stats.reclamations).toEqual({ open: 0, resolved: 0, total: 0 });
    expect(component.stats.users).toEqual({ admins: 0, managers: 0, drivers: 0 });
    expect(component.totalUsersActive).toBe(0);
    expect(component.totalUsers).toBe(0);
    expect(component.rolesChartData.datasets[0].data).toEqual([0, 0, 0]);
    expect(component.chargeChartData.datasets[0].data).toEqual([100, 0]);
    expect(component.capacityUsedPercent).toBe(0);
    expect(component.topDrivers[0]).toEqual(
      jasmine.objectContaining({
        name: 'N/A', missions: 0, score: 0, ponctuality: 0, incidents: 0,
        drivingHours: null, availability: 0, avgDelay: null, badge: 'Normal'
      })
    );
    expect(component.fleetPerformanceScore).toBe(0);
    expect(component.congesStats).toEqual([]);
    expect(component.reclamationsStats).toEqual([]);
  });

  it("loadCompanies tolère l'erreur du service", async () => {
    const errSpy = spyOn(console, 'error').and.stub();

    await setup({ failCompanies: true });

    expect(component.companies).toEqual([]);
    expect(errSpy).toHaveBeenCalledWith('Erreur lors du chargement des entreprises:', jasmine.anything());
  });
});
