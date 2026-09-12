import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute } from '@angular/router';
import { PageEvent } from '@angular/material/paginator';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { provideCharts, withDefaultRegisterables } from 'ng2-charts';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { BehaviorSubject, of, Subject, throwError } from 'rxjs';
import { AuthService } from '../../../../core/auth.service';
import { FleetService, Trip } from '../../../../core/services/fleet.service';
import { ProfileService } from '../../../../core/services/profile.service';
import { NotificationService } from '../../../../core/services/notification.service';
import { UserService, UserListItem } from '../../../../core/services/user.service';
import { SecteurService } from '../../../../core/services/secteur.service';
import { TripHistoryComponent } from './trip-history.component';

/* ─── Fixtures ─────────────────────────────────────────────────── */
let seq = 0;

/** Ligne API brute telle qu'attendue en sortie de mapping */
const mkApiTrip = (over: Record<string, unknown> = {}): Record<string, unknown> => ({
  id: ++seq,
  pointDepart: 'Tunis',
  destination: 'Sfax',
  distanceKm: 120.456,
  dureeEstimeeMinutes: 100,
  dureeReelleMinutes: 90,
  retardMinutes: 0,
  statutPerformance: 'BON',
  statut: 'COMPLETE',
  dateDepart: '2024-06-11T08:00:00', // mardi
  dateArriveeReelle: '2024-06-11T09:30:00',
  vehiculeMatricule: '123 TU 4567',
  vehiculeCouleur: null,
  chauffeurNom: 'Ali Ben',
  chauffeurId: '7',
  ...over
});

/** Trajet au format FleetService (branche Manager / SuperAdmin) */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const mkFleetTrip = (over: any = {}): Trip => ({
  id: `${++seq}`,
  date: '2024-06-11',
  vehicle: 'Véhicule X',
  from: 'Tunis',
  to: 'Sfax',
  driver: 'Ali Ben',
  driverId: '7',
  managerId: '1',
  status: 'Terminé',
  ...over
});

const mkDriver = (over: Partial<UserListItem> = {}): UserListItem => ({
  id: 7,
  prenom: 'Ali',
  nom: 'Ben',
  email: 'ali@test.com',
  role: 'CHAUFFEUR',
  ...over
});

describe('TripHistoryComponent', () => {
  let component: TripHistoryComponent;
  let fixture: ComponentFixture<TripHistoryComponent>;
  let authServiceMock: any;
  let fleetServiceMock: any;
  let profileServiceMock: any;
  let userServiceMock: any;
  let secteurServiceMock: any;
  let notificationServiceMock: any;
  let cdrMock: any;
  let queryParamsSubject: BehaviorSubject<Record<string, string>>;
  let realtimeSubject: Subject<unknown>;

  /** Initialise le composant pour un rôle donné */
  const initWithRole = (role: 'SUPERADMIN' | 'MANAGER' | 'DRIVER'): void => {
    authServiceMock.getUser.and.returnValue({ id: '1', role, secteurId: 3 });
    component.ngOnInit();
  };

  beforeEach(async () => {
    seq = 0;
    authServiceMock = {
      getUser: jasmine.createSpy('getUser').and.returnValue({ id: '1', role: 'SUPERADMIN', secteurId: 3 })
    };
    fleetServiceMock = {
      getVehicles: jasmine.createSpy('getVehicles').and.returnValue(of([{ id: 'v1' }, { id: 'v2' }])),
      getTrips: jasmine.createSpy('getTrips').and.returnValue(of([]))
    };
    profileServiceMock = {
      getCurrentProfile: jasmine.createSpy('getCurrentProfile').and.returnValue(of(null)),
      getDriverTrips: jasmine.createSpy('getDriverTrips').and.returnValue(of({ content: [] }))
    };
    userServiceMock = {
      list: jasmine.createSpy('list').and.returnValue(of([mkDriver()]))
    };
    secteurServiceMock = {
      getSectorById: jasmine.createSpy('getSectorById').and.returnValue(of({ id: 3 }))
    };
    queryParamsSubject = new BehaviorSubject<Record<string, string>>({});
    realtimeSubject = new Subject<unknown>();
    notificationServiceMock = {
      connectRealtime: jasmine.createSpy('connectRealtime'),
      realtimeNotification$: realtimeSubject.asObservable()
    };
    cdrMock = {
      detectChanges: jasmine.createSpy('detectChanges'),
      markForCheck: jasmine.createSpy('markForCheck')
    };

    await TestBed.configureTestingModule({
      imports: [TripHistoryComponent],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideAnimationsAsync(),
        provideCharts(withDefaultRegisterables()),
        { provide: AuthService, useValue: authServiceMock },
        { provide: FleetService, useValue: fleetServiceMock },
        { provide: ProfileService, useValue: profileServiceMock },
        { provide: UserService, useValue: userServiceMock },
        { provide: SecteurService, useValue: secteurServiceMock },
        { provide: NotificationService, useValue: notificationServiceMock },
        { provide: ActivatedRoute, useValue: { queryParams: queryParamsSubject.asObservable() } }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(TripHistoryComponent);
    component = fixture.componentInstance;
    // Ivy ignore l'override DI de ChangeDetectorRef : on stub la propriété d'instance
    Object.defineProperty(component, 'cdr', { value: cdrMock, configurable: true, writable: true });
    // Pas de fixture.detectChanges() : aucun rendu réel du template / canvas
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  /* ─── Colonnes selon le rôle ──────────────────────────────────── */
  it('should include the chauffeur column for managers/admins only', () => {
    initWithRole('SUPERADMIN');
    expect(component.displayedColumns).toContain('chauffeur');

    initWithRole('DRIVER');
    expect(component.displayedColumns).not.toContain('chauffeur');
  });

  /* ─── Chargement par rôle ─────────────────────────────────────── */
  it('MANAGER should load drivers and keep only CHAUFFEUR users', () => {
    userServiceMock.list.and.returnValue(of([
      mkDriver({ id: 1, prenom: 'Ali', nom: 'Ben' }),
      mkDriver({ id: 2, role: 'MANAGER', prenom: 'Mgr', nom: 'X' })
    ]));
    initWithRole('MANAGER');
    expect(userServiceMock.list).toHaveBeenCalled();
    expect(component.drivers.length).toBe(1);
    expect(component.drivers[0].role).toBe('CHAUFFEUR');
    expect(component.isDriversLoading).toBeFalse();
  });

  it('should stop the drivers loading flag on service error', () => {
    userServiceMock.list.and.returnValue(throwError(() => new Error('boom')));
    initWithRole('MANAGER');
    expect(component.isDriversLoading).toBeFalse();
  });

  it('DRIVER should use the personal endpoint and skip global loading', () => {
    initWithRole('DRIVER');
    expect(profileServiceMock.getDriverTrips).toHaveBeenCalledWith(0, 200, undefined);
    expect(fleetServiceMock.getTrips).not.toHaveBeenCalled();
    expect(userServiceMock.list).not.toHaveBeenCalled();
    expect(fleetServiceMock.getVehicles).not.toHaveBeenCalled();
    expect(secteurServiceMock.getSectorById).not.toHaveBeenCalled();
  });

  it('DRIVER should map page content and stringify chauffeur ids', () => {
    profileServiceMock.getDriverTrips.and.returnValue(of({
      content: [
        { id: 1, chauffeurId: 5 },
        { id: 2, chauffeurId: null, chauffeur: { id: 9 }, vehiculeCouleur: 'Blanc' },
        { id: 3, chauffeurId: null, chauffeur: null }
      ]
    }));
    initWithRole('DRIVER');
    const trips = component.allApiTrips;
    expect(trips.length).toBe(3);
    expect(trips[0].chauffeurId).toBe('5');
    expect(trips[1].chauffeurId).toBe('9');
    expect(trips[2].chauffeurId).toBeNull();
    expect(trips[1].vehiculeCouleur).toBe('Blanc');
    expect(component.totalElements).toBe(3);
  });

  it('SUPERADMIN should map FleetService trips to API rows', () => {
    fleetServiceMock.getTrips.and.returnValue(of([
      mkFleetTrip({ id: '10', status: 'En cours', dateDepartIso: '2024-06-11T08:00:00', distanceKm: 42 }),
      mkFleetTrip({ id: '11', status: 'Trajet actif', dateDepartIso: undefined }),
      mkFleetTrip({ id: '12', status: 'Annulé', chauffeurNom: undefined, vehiculeMatricule: undefined }),
      mkFleetTrip({ id: '13', status: 'terminé', driverId: '' })
    ]));
    initWithRole('SUPERADMIN');
    const trips = component.allApiTrips;
    expect(trips.length).toBe(4);
    expect(trips[0].statut).toBe('EN_COURS');
    expect(trips[0].distanceKm).toBe(42);
    expect(trips[1].statut).toBe('ACTIF');
    expect(trips[1].dateDepart).toBe('2024-06-11'); // fallback sur t.date
    expect(trips[2].statut).toBe('Annulé');          // statut inconnu -> tel quel
    expect(trips[2].chauffeurNom).toBe('Ali Ben');   // fallback sur t.driver
    expect(trips[2].vehiculeMatricule).toBe('Véhicule X'); // fallback sur t.vehicle
    expect(trips[3].statut).toBe('COMPLETE');
    expect(trips[3].chauffeurId).toBeNull();         // driverId vide -> null
    expect(component.totalElements).toBe(4);
  });

  it('should reset state when the trips endpoint fails', () => {
    fleetServiceMock.getTrips.and.returnValue(throwError(() => new Error('boom')));
    initWithRole('SUPERADMIN');
    expect(component.allApiTrips).toEqual([]);
    expect(component.dataSource).toEqual([]);
    expect(component.totalElements).toBe(0);
    expect((component.barChartData.datasets[0].data as number[]).every(v => v === 0)).toBeTrue();
  });

  it('should reset state when the personal endpoint fails', () => {
    profileServiceMock.getDriverTrips.and.returnValue(throwError(() => new Error('boom')));
    initWithRole('DRIVER');
    expect(component.allApiTrips).toEqual([]);
    expect(component.totalElements).toBe(0);
  });

  /* ─── KPIs ────────────────────────────────────────────────────── */
  const kpiDataset = (): Trip[] => [
    mkFleetTrip({ id: 'a', status: 'Terminé', dateDepartIso: '2024-06-11T08:00:00', distanceKm: 120.4, retardMinutes: 10 }),   // mar
    mkFleetTrip({ id: 'b', status: 'En cours', dateDepartIso: '2024-06-12T08:00:00', distanceKm: 80.6, retardMinutes: 0 }),    // mer
    mkFleetTrip({ id: 'c', status: 'Trajet actif', dateDepartIso: '2024-06-13T08:00:00', distanceKm: 50, retardMinutes: null }),// jeu
    mkFleetTrip({ id: 'd', status: 'Terminé', dateDepartIso: '2024-06-14T08:00:00', distanceKm: 30, retardMinutes: 30 })       // ven
  ];

  it('should compute mini KPIs on the filtered set', () => {
    fleetServiceMock.getTrips.and.returnValue(of(kpiDataset()));
    initWithRole('SUPERADMIN');
    expect(component.kpiTotalTrips).toBe(4);
    expect(component.kpiActiveCount).toBe(2);
    expect(component.kpiCompletedCount).toBe(2);
    expect(component.kpiCompleted).toBe(2);
    expect(component.kpiTotalDistance).toBe(281);
    expect(component.kpiAvgDelay).toBe(20);
    expect(component.kpiOnTimeRate).toBe(50);
  });

  it('should keep a 100% on-time rate for an empty dataset', () => {
    fleetServiceMock.getTrips.and.returnValue(of([]));
    initWithRole('SUPERADMIN');
    expect(component.kpiOnTimeRate).toBe(100);
    expect(component.kpiAvgDelay).toBe(0);
  });

  /* ─── Formatage des lignes ────────────────────────────────────── */
  it('should format durations, delays, statuses and vehicles', () => {
    fleetServiceMock.getTrips.and.returnValue(of([
      mkFleetTrip({ id: 'r1', dureeReelleMinutes: 90, retardMinutes: 15, statut: 'Terminé', statutPerformance: null, vehiculeMatricule: '123 TU 4567' }),
      mkFleetTrip({ id: 'r2', dureeReelleMinutes: 45, retardMinutes: -5, status: 'Annulé', vehiculeMatricule: undefined, vehicle: '' }),
      mkFleetTrip({ id: 'r3', dureeReelleMinutes: null, retardMinutes: null, dateDepartIso: 'not-a-date', status: 'Statut bizarre' })
    ]));
    initWithRole('SUPERADMIN');
    const rows = component.dataSource;
    expect(rows[0].duration).toBe('1h 30m');
    expect(rows[0].delay).toBe('+15 min');
    expect(rows[0].status).toBe('Terminé');
    expect(rows[0].statusClass).toBe('completed');
    expect(rows[0].performance).toBe('Non calculé');
    expect(rows[0].vehicle).toBe('123 TU 4567');

    expect(rows[1].duration).toBe('45 min');
    expect(rows[1].delay).toBe('-5 min');
    expect(rows[1].status).toBe('Annulé');     // statut inconnu -> brut
    expect(rows[1].statusClass).toBe('unknown');
    expect(rows[1].vehicle).toBe('-');

    expect(rows[2].duration).toBe('0 min');
    expect(rows[2].delay).toBe('0 min');
    expect(rows[2].statusClass).toBe('unknown');
    expect(rows[2].date).toBe('not-a-date');   // date invalide conservée brute
  });

  it('should render "-" for missing origin, destination and dates', () => {
    fleetServiceMock.getTrips.and.returnValue(of([
      mkFleetTrip({ id: 'n1', from: '', to: '', dateDepartIso: undefined, date: undefined })
    ]));
    initWithRole('SUPERADMIN');
    const row = component.dataSource[0];
    expect(row.origin).toBe('-');
    expect(row.destination).toBe('-');
    expect(row.date).toBe('-');
    expect(row.rawDate).toBeNull();
    expect(row.rawDistanceKm).toBe(0);
    expect(row.rawDelay).toBe(0);
  });

  /* ─── Graphiques ──────────────────────────────────────────────── */
  it('bar chart should count missions per weekday skipping bad dates', () => {
    fleetServiceMock.getTrips.and.returnValue(of([
      mkFleetTrip({ id: 'g1', dateDepartIso: '2024-06-11T08:00:00' }), // mardi
      mkFleetTrip({ id: 'g2', dateDepartIso: '2024-06-13T08:00:00' }), // jeudi
      mkFleetTrip({ id: 'g3', dateDepartIso: 'not-a-date' }),
      mkFleetTrip({ id: 'g4', dateDepartIso: undefined })
    ]));
    initWithRole('SUPERADMIN');
    const data = component.barChartData.datasets[0].data as number[];
    // g4 sans dateDepartIso retombe sur t.date (2024-06-11, mardi) -> 2 mardis
    expect(data).toEqual([0, 2, 0, 1, 0, 0, 0]);
    expect(component.barChartData.labels).toEqual(['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim']);
  });

  it('line chart should sum rounded daily distances', () => {
    fleetServiceMock.getTrips.and.returnValue(of([
      mkFleetTrip({ id: 'l1', dateDepartIso: '2024-06-11T08:00:00', distanceKm: 120.456 }),
      mkFleetTrip({ id: 'l2', dateDepartIso: '2024-06-11T18:00:00', distanceKm: 30.2 }),
      mkFleetTrip({ id: 'l3', dateDepartIso: 'not-a-date', distanceKm: 999 })
    ]));
    initWithRole('SUPERADMIN');
    const data = component.lineChartData.datasets[0].data as number[];
    expect(data[1]).toBe(151); // mardi : round(120.456) + round(30.2)
    expect(data.reduce((s, v) => s + v, 0)).toBe(151);
  });

  it('doughnut chart should classify statuses including "others"', () => {
    fleetServiceMock.getTrips.and.returnValue(of([
      mkFleetTrip({ id: 'd1', status: 'Terminé' }),
      mkFleetTrip({ id: 'd2', status: 'Terminé' }),
      mkFleetTrip({ id: 'd3', status: 'En cours' }),
      mkFleetTrip({ id: 'd4', status: 'Trajet actif' }),
      mkFleetTrip({ id: 'd5', status: 'Annulé' })
    ]));
    initWithRole('SUPERADMIN');
    expect(component.doughnutChartData.labels).toEqual(['Terminés', 'En cours', 'Actifs', 'Autres']);
    expect(component.doughnutChartData.datasets[0].data).toEqual([2, 1, 1, 1]);
  });

  /* ─── Filtres ─────────────────────────────────────────────────── */
  beforeEach(() => {
    // dataset commun aux tests de filtre : mardi/mercredi/jeudi/vendredi
    fleetServiceMock.getTrips.and.returnValue(of(kpiDataset()));
  });

  it('onStatusChange() should filter by status and reset pagination', () => {
    initWithRole('SUPERADMIN');
    component.pageIndex = 2;
    component.onStatusChange('COMPLETE');
    expect(component.pageIndex).toBe(0);
    expect(component.totalElements).toBe(2);
  });

  it('onDayChange() should filter by weekday code', () => {
    initWithRole('SUPERADMIN');
    component.onDayChange('2'); // mardi
    expect(component.totalElements).toBe(1);
    expect(component.dataSource[0].rawDate!.getDay()).toBe(2);
  });

  it('onDateFromChange()/onDateToChange() should bound the period', () => {
    initWithRole('SUPERADMIN');
    component.onDateFromChange('2024-06-13');
    expect(component.totalElements).toBe(2);
    component.onDateToChange('2024-06-13');
    expect(component.totalElements).toBe(1);
  });

  it('onDriverChange()/onDriverSelect() should filter by chauffeur', () => {
    initWithRole('SUPERADMIN');
    component.onDriverChange('7');
    expect(component.selectedDriverId).toBe(7);
    expect(component.totalElements).toBe(4);

    component.onDriverSelect(null);
    expect(component.selectedDriverId).toBeNull();

    component.onDriverChange('');
    expect(component.selectedDriverId).toBeNull();

    // un second chauffeur est exclu
    component.allApiTrips.push(mkApiTrip({ id: 99, chauffeurId: '8' }) as any);
    component.applyFiltersAndPaginate();
    expect(component.totalElements).toBe(5);
    component.onDriverSelect(8);
    expect(component.totalElements).toBe(1);
    expect(component.dataSource[0].chauffeur).toBe('Ali Ben');
  });

  it('query params should pre-select driver and status', () => {
    initWithRole('SUPERADMIN');
    queryParamsSubject.next({ driverId: '5', status: 'COMPLETE' });
    expect(component.selectedDriverId).toBe(5);
    expect(component.selectedStatus).toBe('COMPLETE');
    expect(component.hasActiveFilters).toBeTrue();
  });

  it('clearFilters() should reset every filter', () => {
    initWithRole('SUPERADMIN');
    component.onStatusChange('COMPLETE');
    component.onDayChange('2');
    component.clearFilters();
    expect(component.selectedStatus).toBe('');
    expect(component.selectedDay).toBe('');
    expect(component.filterDateFrom).toBe('');
    expect(component.filterDateTo).toBe('');
    expect(component.selectedDriverId).toBeNull();
    expect(component.pageIndex).toBe(0);
    expect(component.hasActiveFilters).toBeFalse();
    expect(component.activeFilterCount).toBe(0);
  });

  it('activeFilterCount should count every active filter', () => {
    component.selectedStatus = 'COMPLETE';
    component.selectedDay = '2';
    component.filterDateFrom = '2024-06-01';
    component.selectedDriverId = 7;
    expect(component.activeFilterCount).toBe(4);
  });

  /* ─── Pagination ──────────────────────────────────────────────── */
  it('onPageChange() should paginate the table', () => {
    fleetServiceMock.getTrips.and.returnValue(of(
      Array.from({ length: 12 }, (_, i) => mkFleetTrip({ id: `p${i}`, dateDepartIso: '2024-06-11T08:00:00' }))
    ));
    initWithRole('SUPERADMIN');
    expect(component.totalElements).toBe(12);
    expect(component.dataSource.length).toBe(10);

    const ev: PageEvent = { pageIndex: 1, pageSize: 10, previousPageIndex: 0, length: 12 };
    component.onPageChange(ev);
    expect(component.pageIndex).toBe(1);
    expect(component.dataSource.length).toBe(2);
  });

  /* ─── Helpers chauffeurs ──────────────────────────────────────── */
  it('getDriverInitials() should build initials with fallback', () => {
    expect(component.getDriverInitials(mkDriver({ prenom: 'ali', nom: 'ben' }))).toBe('AB');
    expect(component.getDriverInitials(mkDriver({ prenom: '', nom: '' }))).toBe('CH');
  });

  it('getDriverStatusClass() should cover all statuses', () => {
    expect(component.getDriverStatusClass(mkDriver({ statutConducteur: 'EN_SERVICE' }))).toBe('drv-status--active');
    expect(component.getDriverStatusClass(mkDriver({ statutConducteur: 'LIBRE' }))).toBe('drv-status--libre');
    expect(component.getDriverStatusClass(mkDriver({ statutConducteur: null }))).toBe('drv-status--unknown');
  });

  it('getDriverStatusLabel() should cover all statuses', () => {
    expect(component.getDriverStatusLabel(mkDriver({ statutConducteur: 'EN_SERVICE' }))).toBe('En service');
    expect(component.getDriverStatusLabel(mkDriver({ statutConducteur: 'LIBRE' }))).toBe('Libre');
    expect(component.getDriverStatusLabel(mkDriver({ statutConducteur: null }))).toBe('Inconnu');
  });

  it('setActiveChart() should switch the visible chart tab', () => {
    component.setActiveChart('line');
    expect(component.activeChart).toBe('line');
    component.setActiveChart('doughnut');
    expect(component.activeChart).toBe('doughnut');
    component.setActiveChart('bar');
    expect(component.activeChart).toBe('bar');
  });

  /* ─── Véhicules & secteur ─────────────────────────────────────── */
  it('should count vehicles for non-driver roles', () => {
    initWithRole('MANAGER');
    expect(component.vehicleCount).toBe(2);
  });

  it('should fall back to 0 vehicles on error', () => {
    fleetServiceMock.getVehicles.and.returnValue(throwError(() => new Error('boom')));
    initWithRole('MANAGER');
    expect(component.vehicleCount).toBe(0);
  });

  it('MANAGER should load sector stats with fallbacks', () => {
    secteurServiceMock.getSectorById.and.returnValue(of({ id: 3 }));
    initWithRole('MANAGER');
    expect(secteurServiceMock.getSectorById).toHaveBeenCalledWith(3);
    expect(component.sectorStats).toEqual({
      id: 3,
      nom: 'Secteur Ouest',
      zoneGeographique: 'barcelona',
      managersCount: 1,
      driversCount: 0,
      trajetsCount: 0
    });
  });

  it('should map complete sector payloads as-is', () => {
    secteurServiceMock.getSectorById.and.returnValue(of({
      id: 3,
      nom: 'Nord',
      zoneGeographique: 'tunis',
      managers: [{}, {}],
      chauffeurs: [{}],
      trajetsCount: 9
    }));
    initWithRole('MANAGER');
    expect(component.sectorStats).toEqual({
      id: 3, nom: 'Nord', zoneGeographique: 'tunis', managersCount: 2, driversCount: 1, trajetsCount: 9
    });
  });

  it('should null out sector stats on error or missing secteurId', () => {
    secteurServiceMock.getSectorById.and.returnValue(throwError(() => new Error('boom')));
    initWithRole('MANAGER');
    expect(component.sectorStats).toBeNull();

    authServiceMock.getUser.and.returnValue({ id: '1', role: 'MANAGER', secteurId: null });
    secteurServiceMock.getSectorById.calls.reset();
    component.ngOnInit();
    expect(secteurServiceMock.getSectorById).not.toHaveBeenCalled();
    expect(component.sectorStats).toBeNull();
  });

  it('userRole getter should fallback to DRIVER without user', () => {
    authServiceMock.getUser.and.returnValue(null);
    expect(component.userRole).toBe('DRIVER');
  });

  /* ─── Temps réel & destruction ────────────────────────────────── */
  it('realtime notifications should reload the history', () => {
    initWithRole('SUPERADMIN');
    expect(fleetServiceMock.getTrips).toHaveBeenCalledTimes(1);
    realtimeSubject.next({ id: 'x' });
    expect(fleetServiceMock.getTrips).toHaveBeenCalledTimes(2);
    expect(notificationServiceMock.connectRealtime).toHaveBeenCalled();
  });

  it('ngOnDestroy() should detach the realtime subscription', () => {
    initWithRole('SUPERADMIN');
    component.ngOnDestroy();
    realtimeSubject.next({ id: 'y' });
    expect(fleetServiceMock.getTrips).toHaveBeenCalledTimes(1); // pas de rechargement
  });
});
