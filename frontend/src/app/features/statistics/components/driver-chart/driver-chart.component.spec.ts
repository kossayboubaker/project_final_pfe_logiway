import { ComponentFixture, TestBed } from '@angular/core/testing';
import { DriverChartComponent } from './driver-chart.component';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { provideCharts, withDefaultRegisterables } from 'ng2-charts';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { AuthService } from '../../../../core/auth.service';
import { UserService } from '../../../../core/services/user.service';
import { FleetService } from '../../../../core/services/fleet.service';
import { LeaveService } from '../../../../core/services/leave.service';
import { MatDialog } from '@angular/material/dialog';
import { Subject, of, throwError } from 'rxjs';

describe('DriverChartComponent', () => {
  let component: DriverChartComponent;
  let fixture: ComponentFixture<DriverChartComponent>;
  let fleetServiceMock: any;
  let leaveServiceMock: any;
  let dialogOpenSpy: jasmine.Spy;
  let dialogRefCloseSpy: jasmine.Spy;
  let pendingCloses: Subject<void>[];

  const daysAgoIso = (days: number): string =>
    new Date(Date.now() - days * 86400000).toISOString();

  const baseVehicles = (): any[] => [
    { id: 'v1', plate: '123 TU 4567', model: 'Scania R450', status: 'Actif', driverId: 'd1', driverName: 'Ali Ben', mileage: 120000 },
    { id: 'v2', plate: '999 TZ 1111', model: 'Renault T', status: 'Actif', driverId: 'd2', driverName: 'Mondher Trabelsi', mileage: 80000 }
  ];

  /**
   * d1 Ali     : 9 trajets couvrant tous les buckets de pauses, incidents et statuts.
   * d2 Mondher : v\u00e9hicule seul (aucun trajet) -> fallback anciennet\u00e9 + score minimal.
   * d3 Sami    : plaque inconnue -> mod\u00e8le non r\u00e9solu ; score parfait 100.
   * d4 Foulen  : nom r\u00e9solu via t.driver ; score 80.
   */
  const baseTrips = (): any[] => [
    { id: 't1', driverId: 'd1', chauffeurNom: 'Ali Ben', driverEmail: 'ali@x.tn', distanceKm: 380, dureeReelleMinutes: 380, dateDepartIso: daysAgoIso(400), retardMinutes: 0, statutPerformance: 'A_L_HEURE', status: 'Termin\u00e9', vehiculeMatricule: '123 TU 4567' },
    { id: 't2', driverId: 'd1', chauffeurNom: 'Ali Ben', distanceKm: 380, dureeReelleMinutes: 380, dateDepartIso: daysAgoIso(100), retardMinutes: 45, statutPerformance: 'A_L_HEURE', status: 'En Cours', vehiculeMatricule: '123 TU 4567' },
    { id: 't3', driverId: 'd1', chauffeurNom: 'Ali Ben', distanceKm: 370, dureeReelleMinutes: 370, dateDepartIso: daysAgoIso(200), retardMinutes: 10, statutPerformance: 'RETARD', status: 'En Cours', vehiculeMatricule: '123 TU 4567' },
    { id: 't4', driverId: 'd1', chauffeurNom: 'Ali Ben', distanceKm: 300, dureeReelleMinutes: 300, dateDepartIso: daysAgoIso(300), retardMinutes: 0, statutPerformance: 'A_L_HEURE', status: 'Termin\u00e9', vehiculeMatricule: '123 TU 4567' },
    { id: 't5', driverId: 'd1', chauffeurNom: 'Ali Ben', distanceKm: 280, dureeReelleMinutes: 280, dateDepartIso: daysAgoIso(50), retardMinutes: 60, statutPerformance: 'A_L_HEURE', status: 'Termin\u00e9', vehiculeMatricule: '123 TU 4567' },
    { id: 't6', driverId: 'd1', chauffeurNom: 'Ali Ben', distanceKm: 200, dureeReelleMinutes: 200, dateDepartIso: daysAgoIso(20), retardMinutes: 40, statutPerformance: 'A_L_HEURE', status: 'Termin\u00e9', vehiculeMatricule: '123 TU 4567' },
    { id: 't7', driverId: 'd1', chauffeurNom: 'Ali Ben', distanceKm: 180, dureeReelleMinutes: 180, dateDepartIso: daysAgoIso(10), retardMinutes: 0, statutPerformance: 'A_L_HEURE', status: 'Termin\u00e9', vehiculeMatricule: '123 TU 4567' },
    { id: 't8', driverId: 'd1', chauffeurNom: 'Ali Ben', distanceKm: 50, dateDepartIso: daysAgoIso(5), retardMinutes: 0, status: 'Annul\u00e9' },
    { id: 't9', driverId: 'd1', chauffeurNom: 'Ali Ben', distanceKm: 160, dureeEstimeeMinutes: 160, dateDepartIso: daysAgoIso(3), status: 'Termin\u00e9' },
    { id: 't10', driverId: 'd3', chauffeurNom: 'Sami Mejri', driverEmail: 'sami@x.tn', distanceKm: 160, dureeReelleMinutes: 160, dateDepartIso: daysAgoIso(30), retardMinutes: null, statutPerformance: 'A_L_HEURE', status: 'Termin\u00e9', vehiculeMatricule: 'ZZZ 9999' },
    { id: 't11', driverId: 'd4', driver: 'Foulen Ali', distanceKm: 100, dureeReelleMinutes: 100, dateDepartIso: daysAgoIso(15), retardMinutes: 0, status: 'Termin\u00e9' }
  ];

  beforeEach(async () => {
    pendingCloses = [];

    const authServiceMock = {
      getUser: jasmine.createSpy('getUser').and.returnValue({ id: '1', role: 'SUPERADMIN' })
    };
    const userServiceMock = {
      list: jasmine.createSpy('list').and.returnValue(of([]))
    };
    fleetServiceMock = {
      getVehicles: jasmine.createSpy('getVehicles').and.returnValue(of([])),
      getTrips: jasmine.createSpy('getTrips').and.returnValue(of([]))
    };
    leaveServiceMock = {
      getLeaves: jasmine.createSpy('getLeaves').and.returnValue(of([]))
    };
    dialogRefCloseSpy = jasmine.createSpy('dialogRefClose');
    dialogOpenSpy = jasmine.createSpy('open').and.callFake(() => {
      const subj = new Subject<void>();
      pendingCloses.push(subj);
      return { close: dialogRefCloseSpy, afterClosed: () => subj.asObservable() };
    });

    await TestBed.configureTestingModule({
      imports: [DriverChartComponent],
      providers: [
        provideRouter([]),
        provideHttpClient(),
        provideHttpClientTesting(),
        provideAnimationsAsync(),
        provideCharts(withDefaultRegisterables()),
        { provide: AuthService, useValue: authServiceMock },
        { provide: UserService, useValue: userServiceMock },
        { provide: FleetService, useValue: fleetServiceMock },
        { provide: LeaveService, useValue: leaveServiceMock },
        { provide: MatDialog, useValue: { open: dialogOpenSpy } }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(DriverChartComponent);
    component = fixture.componentInstance;
    (component as any).cdr = {
      detectChanges: jasmine.createSpy('detectChanges'),
      markForCheck: jasmine.createSpy('markForCheck')
    };
    // L'override TestBed de MatDialog est ignor\u00e9 (import standalone) : mutation directe
    (component as any).dialog = { open: dialogOpenSpy };
    fixture.detectChanges();
  });

  function loadWith(vehicles: any[], trips: any[], leaves: any[]): void {
    (fleetServiceMock.getVehicles as jasmine.Spy).and.returnValue(of(vehicles));
    (fleetServiceMock.getTrips as jasmine.Spy).and.returnValue(of(trips));
    (leaveServiceMock.getLeaves as jasmine.Spy).and.returnValue(of(leaves));
    (component as any).loadData();
  }

  const lastDialogData = (): any => dialogOpenSpy.calls.mostRecent().args[1].data;

  // ─── Chargement ────────────────────────────────────────────────

  it('should create and reset everything when services fail', () => {
    expect(component).toBeTruthy();

    (fleetServiceMock.getTrips as jasmine.Spy).and.returnValue(
      throwError(() => new Error('ko'))
    );
    (component as any).loadData();

    expect(component.allVehicles).toEqual([]);
    expect(component.allTrips).toEqual([]);
    expect(component.allLeaves).toEqual([]);
  });

  it('should aggregate drivers, vehicles and KPIs from trips', () => {
    loadWith(baseVehicles(), baseTrips(), [{ id: 'l1' }]);

    expect(component.allLeaves).toEqual([{ id: 'l1' }]);
    expect(component.driverSummaries.length).toBe(4);

    const ali = component.driverSummaries.find(d => d.driverId === 'd1')!;
    expect(ali.driverName).toBe('Ali Ben');
    expect(ali.driverEmail).toBe('ali@x.tn');
    expect(ali.trips.length).toBe(9);
    expect(ali.totalKm).toBe(2300);
    // t2 (retard 45), t5 (60), t6 (40) d\u00e9passent 15 min + t3 statutPerformance RETARD
    expect(ali.incidents).toBe(4);
    expect(ali.pausesOk).toBe(6);
    expect(ali.pausesMissed).toBe(5);
    expect(ali.status).toBe('EN_SERVICE');
    expect(ali.vehiclePlate).toBe('123 TU 4567');
    expect(ali.vehicleModel).toBe('Scania R450');
    expect(ali.seniorityMonths).toBe(Math.floor(400 / 30.44));
    expect(ali.avgSpeed).toBe(60);
    expect(ali.ecoScore).toBe(66);

    const mondher = component.driverSummaries.find(d => d.driverId === 'd2')!;
    expect(mondher.trips.length).toBe(0);
    expect(mondher.seniorityMonths).toBe(1);
    expect(mondher.status).toBe('LIBRE');
    expect(mondher.avgSpeed).toBe(0);
    expect(mondher.ecoScore).toBe(31);

    const sami = component.driverSummaries.find(d => d.driverId === 'd3')!;
    expect(sami.vehiclePlate).toBe('ZZZ 9999');
    expect(sami.vehicleModel).toBe('');
    expect(sami.ecoScore).toBe(100);

    const foulen = component.driverSummaries.find(d => d.driverId === 'd4')!;
    expect(foulen.driverName).toBe('Foulen Ali');
    expect(foulen.ecoScore).toBe(80);
  });

  it('should compute KPIs over the whole crew', () => {
    loadWith(baseVehicles(), baseTrips(), []);

    expect(component.kpiTotal).toBe(4);
    expect(component.kpiOnMission).toBe(1);
    expect(component.kpiAvailable).toBe(3);
    expect(component.kpiTotalTrips).toBe(11);
    expect(component.kpiTotalDistanceKm).toBe(2560);
    expect(component.kpiAvgScore).toBe(69);
    expect(component.kpiAvgSpeed).toBe(60);
    expect(component.kpiTotalPausesOk).toBe(7);
    expect(component.kpiTotalPausesMissed).toBe(5);
    expect(component.kpiPauseRate).toBe(58);
  });

  it('should skip trips without any driver identity', () => {
    loadWith([], [
      { id: 'tx', distanceKm: 10, status: 'Termin\u00e9', dateDepartIso: daysAgoIso(1) }
    ], []);

    expect(component.driverSummaries).toEqual([]);
    expect(component.kpiTotal).toBe(0);
    expect(component.kpiAvgScore).toBe(0);
    expect(component.kpiAvgSpeed).toBe(0);
    expect(component.kpiPauseRate).toBe(0);
  });

  it('should flag drivers crossing the weekly hour limit', () => {
    loadWith([], [
      { id: 'th', driverId: 'd5', chauffeurNom: 'Heavy Louati', distanceKm: 3000, dureeReelleMinutes: 3000, dateDepartIso: daysAgoIso(1), retardMinutes: 0, status: 'En Cours' }
    ], []);

    const row = component.dataSource.find(r => r.id === 'd5')!;
    expect(row.weeklyDrivingHours).toBe(50);
    expect(row.warningNearLimit).toBeTrue();
    expect(row.pauseComplianceRate).toBe(50);
  });

  it('should fill the plate of a trip-driver from its assigned vehicle', () => {
    loadWith(
      [{ id: 'v9', plate: '555 TU 0000', model: 'Iveco Daily', status: 'Actif', driverId: 'd9', driverName: 'Nizar Haddad', mileage: 5000 }],
      [{ id: 'tn', driverId: 'd9', chauffeurNom: 'Nizar Haddad', distanceKm: 80, dureeReelleMinutes: 80, dateDepartIso: daysAgoIso(7), retardMinutes: 0, status: 'Termin\u00e9' }],
      []
    );

    const nizar = component.driverSummaries.find(d => d.driverId === 'd9')!;
    expect(nizar.trips.length).toBe(1);
    expect(nizar.vehiclePlate).toBe('555 TU 0000');
    expect(nizar.vehicleModel).toBe('Iveco Daily');
  });

  it('should tolerate trips without distance or departure date', () => {
    loadWith([], [
      { id: 'tz', driverId: 'dz', chauffeurNom: 'Zed Zero', dureeReelleMinutes: 45, status: 'Termin\u00e9', retardMinutes: 0 }
    ], []);

    const zed = component.driverSummaries.find(d => d.driverId === 'dz')!;
    expect(zed.trips.length).toBe(1);
    expect(zed.totalKm).toBe(0);
    expect(zed.ecoScore).toBe(76);
    expect((component.weeklyHoursData.datasets![0] as any).data.every((v: number) => v === 0))
      .toBeTrue();
  });

  // ─── Graphiques ────────────────────────────────────────────────

  it('should build the weekly hours chart with the regulatory limit', () => {
    loadWith(baseVehicles(), baseTrips(), []);

    const trips = component.allTrips;
    const expected = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'].map((_, dayIdx) => {
      const minutes = trips
        .filter(t => t.dateDepartIso && new Date(t.dateDepartIso).getDay() === ((dayIdx + 1) % 7))
        .reduce((s, t) => s + ((t.dureeReelleMinutes || 60) / 60), 0);
      return Math.round(minutes * 10) / 10;
    });

    expect(component.weeklyHoursData.labels).toEqual(['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim']);
    expect((component.weeklyHoursData.datasets![0] as any).data).toEqual(expected);
    expect((component.weeklyHoursData.datasets![1] as any).data.every((v: number) => v === 48)).toBeTrue();

    const ev: any = { native: { target: { style: {} } } };
    (component.weeklyHoursOptions as any).onHover(ev, [{ x: 1 }]);
    expect(ev.native.target.style.cursor).toBe('pointer');
    (component.weeklyHoursOptions as any).onHover(ev, []);
    expect(ev.native.target.style.cursor).toBe('default');

    const tooltip = (component.weeklyHoursOptions as any).plugins.tooltip.callbacks.label;
    expect(tooltip({ dataset: { label: 'Heures de conduite' }, parsed: { y: 42 } }))
      .toBe(' Heures de conduite : 42 heures');
  });

  it('should distribute the crew across seniority ranges', () => {
    loadWith(baseVehicles(), baseTrips(), []);

    expect(component.seniorityGrid.map(g => g.count)).toEqual([3, 0, 0, 1, 0, 0]);
    expect(component.seniorityGrid.map(g => g.pct)).toEqual([75, 0, 0, 25, 0, 0]);
    expect(component.seniorityGrid.map(g => g.label)).toEqual([
      '< 3 mois', '3-6 mois', '6-12 mois', '1-2 ans', '2-5 ans', '5+ ans'
    ]);
  });

  it('should build the eco donut with hover and tooltip callbacks', () => {
    loadWith(baseVehicles(), baseTrips(), []);

    expect(component.ecoDonutData.labels).toEqual([
      'Excellent (\u226580)', 'Bon (60-79)', 'Moyen (40-59)', 'Faible (<40)'
    ]);
    expect(component.ecoDonutData.datasets[0].data).toEqual([2, 1, 0, 1]);

    const ev: any = { native: { target: { style: {} } } };
    (component.ecoDonutOptions as any).onHover(ev, [{}]);
    expect(ev.native.target.style.cursor).toBe('pointer');
    (component.ecoDonutOptions as any).onHover(ev, []);
    expect(ev.native.target.style.cursor).toBe('default');

    const tooltip = component.ecoDonutOptions.plugins.tooltip.callbacks.label;
    expect(tooltip({ label: 'Bon (60-79)', parsed: 1 })).toBe(' Bon (60-79) : 1 chauffeur(s)');
  });

  it('should rank drivers by pause activity in the stacked bar', () => {
    loadWith(baseVehicles(), baseTrips(), []);

    // Foulen a des trajets mais aucune pause : il figure quand m\u00eame dans le top
    expect(component.pauseData.labels).toEqual(['Ali Ben', 'Sami Mejri', 'Foulen Ali']);
    expect((component.pauseData.datasets![0] as any).data).toEqual([6, 1, 0]);
    expect((component.pauseData.datasets![1] as any).data).toEqual([5, 0, 0]);
  });

  // ─── Filtres, tri et pagination ────────────────────────────────

  it('should filter by status and reset pagination', () => {
    loadWith(baseVehicles(), baseTrips(), []);

    component.pageIndex = 3;
    component.onFilterStatusChange('EN_SERVICE');
    expect(component.kpiTotal).toBe(1);
    expect(component.pageIndex).toBe(0);
    expect(component.hasActiveFilters).toBeTrue();
    expect(component.activeFilterCount).toBe(1);

    component.onFilterStatusChange('LIBRE');
    expect(component.kpiTotal).toBe(3);

    component.clearFilters();
    expect(component.kpiTotal).toBe(4);
    expect(component.hasActiveFilters).toBeFalse();
  });

  it('should cover every eco score band through filters', () => {
    loadWith(baseVehicles(), baseTrips(), []);

    component.onFilterScoreChange('excellent');
    expect(component.kpiTotal).toBe(2);

    component.onFilterScoreChange('bon');
    expect(component.kpiTotal).toBe(1);

    component.onFilterScoreChange('moyen');
    expect(component.kpiTotal).toBe(0);
    expect(component.kpiAvgScore).toBe(0);
    expect(component.kpiAvgSpeed).toBe(0);
    expect(component.kpiPauseRate).toBe(0);

    component.onFilterScoreChange('faible');
    expect(component.kpiTotal).toBe(1);
    expect(component.activeFilterCount).toBe(1);

    component.onFilterScoreChange('');
    expect(component.kpiTotal).toBe(4);
  });

  it('should sort rows by string and numeric columns', () => {
    loadWith(baseVehicles(), baseTrips(), []);

    component.onSort('name');
    expect(component.sortColumn).toBe('name');
    expect(component.sortDirection).toBe('asc');
    expect(component.dataSource.map(r => r.name)).toEqual([
      'Ali Ben', 'Foulen Ali', 'Mondher Trabelsi', 'Sami Mejri'
    ]);

    component.onSort('name');
    expect(component.sortDirection).toBe('desc');
    expect(component.dataSource.map(r => r.name)[0]).toBe('Sami Mejri');

    component.onSort('ecoScore');
    expect(component.sortDirection).toBe('asc');
    expect(component.dataSource.map(r => r.ecoScore)).toEqual([31, 66, 80, 100]);
  });

  it('should paginate rows on page events', () => {
    loadWith(baseVehicles(), baseTrips(), []);

    expect(component.totalElements).toBe(4);
    component.onPageChange({ pageIndex: 1, pageSize: 3 } as any);
    expect(component.pageIndex).toBe(1);
    expect(component.pageSize).toBe(3);
    expect(component.dataSource.length).toBe(1);
  });

  // ─── Drill-downs et dialogs ────────────────────────────────────

  it('should ignore malformed chart click events', () => {
    loadWith(baseVehicles(), baseTrips(), []);

    (component as any).onChartClick('weeklyHours', null);
    (component as any).onChartClick('weeklyHours', { active: [] });
    (component as any).onChartClick('weeklyHours', { active: [{ _index: null }] });
    (component as any).onChartClick('unknownType', { active: [{ _index: 0 }] });

    expect(dialogOpenSpy).not.toHaveBeenCalled();
  });

  it('should open a dialog for weekly hour points on both sides of the limit', () => {
    loadWith(baseVehicles(), baseTrips(), []);

    (component.weeklyHoursData.datasets![0] as any).data[0] = 55;
    (component as any).onChartClick('weeklyHours', { active: [{ _index: 0 }] });

    let data = lastDialogData();
    expect(data.type).toBe('chart-point');
    expect(data.chartValue).toBe(55);
    expect(data.details[0].value).toBe('D\u00e9passement limite');
    expect(data.details[0].color).toBe('#f87171');
    expect(data.details[2].value).toBe('+7h');

    (component.weeklyHoursData.datasets![0] as any).data[0] = 10;
    (component as any).onChartClick('weeklyHours', { active: [{ _index: 0 }] });
    data = lastDialogData();
    expect(data.details[0].value).toBe('Conforme');
    expect(data.details[2].value).toBe('Dans les normes');
  });

  it('should open a dialog for eco donut points with percentage and bounds', () => {
    loadWith(baseVehicles(), baseTrips(), []);

    (component as any).onChartClick('ecoDonut', { active: [{ _index: 0 }] });

    const data = lastDialogData();
    expect(data.title).toBe('Excellent (\u226580)');
    expect(data.chartValue).toBe(2);
    expect(data.details[0].value).toBe('50%');
    expect(data.details[1].value).toBe('80');
    expect(data.details[2].value).toBe('\u2014');
  });

  it('should open a dialog for pause chart points and ignore out-of-range indexes', () => {
    loadWith(baseVehicles(), baseTrips(), []);
    const opensBefore = dialogOpenSpy.calls.count();

    (component as any).onChartClick('pauseChart', { active: [{ _index: 0 }] });

    const data = lastDialogData();
    expect(data.title).toBe('Ali Ben');
    expect(data.chartValue).toBe('55%');
    expect(data.details[0].value).toBe('6');
    expect(data.details[3].value).toBe('123 TU 4567');

    (component as any).onChartClick('pauseChart', { active: [{ _index: 8 }] });
    expect(dialogOpenSpy.calls.count()).toBe(opensBefore + 1);
  });

  it('should open a driver row dialog and ignore unknown rows', () => {
    loadWith(baseVehicles(), baseTrips(), []);

    component.onRowClick({ id: 'ghost' } as any);
    expect(dialogOpenSpy).not.toHaveBeenCalled();

    component.onRowClick(component.dataSource[0]);

    const data = lastDialogData();
    expect(data.type).toBe('driver-row');
    expect(data.title).toBe('Ali Ben');
    expect(data.details.length).toBe(9);
    expect(data.details[0].value).toBe('123 TU 4567 (Scania R450)');
    expect(data.details[1].value).toBe('En mission');
    expect(data.details[2].color).toBe('#60a5fa');
    expect(data.details[4].value).toBe('2.3k km');
    expect(data.details[7].value).toBe('13 mois');
    expect(dialogRefCloseSpy).not.toHaveBeenCalled();
  });

  it('should open a seniority card dialog', () => {
    loadWith(baseVehicles(), baseTrips(), []);

    component.onSeniorityCardClick(component.seniorityGrid[3]);

    const data = lastDialogData();
    expect(data.type).toBe('seniority-card');
    expect(data.title).toBe('Anciennet\u00e9 : 1-2 ans');
    expect(data.chartValue).toBe(1);
    expect(data.details[0].value).toBe('25%');
    expect(data.details[1].value).toBe('4');
  });

  it('should close the previous dialog when opening a new one', () => {
    loadWith(baseVehicles(), baseTrips(), []);

    (component as any).onChartClick('ecoDonut', { active: [{ _index: 0 }] });
    (component as any).onChartClick('ecoDonut', { active: [{ _index: 1 }] });

    expect(dialogOpenSpy.calls.count()).toBe(2);
    expect(dialogRefCloseSpy).toHaveBeenCalledTimes(1);
  });

  it('should clear the dialog reference after it closes', () => {
    loadWith(baseVehicles(), baseTrips(), []);

    (component as any).onChartClick('ecoDonut', { active: [{ _index: 0 }] });
    pendingCloses[pendingCloses.length - 1].next();
    pendingCloses[pendingCloses.length - 1].complete();

    expect(pendingCloses.length).toBeGreaterThan(0);
  });

  it('should complete destroy subjects on ngOnDestroy', () => {
    expect(() => component.ngOnDestroy()).not.toThrow();
  });

  // ─── Helpers UI ────────────────────────────────────────────────

  it('getSortIcon() should reflect the current sort state', () => {
    component.sortColumn = '';
    expect(component.getSortIcon('name')).toBe('unfold_more');
    component.sortColumn = 'name';
    component.sortDirection = 'asc';
    expect(component.getSortIcon('name')).toBe('arrow_upward');
    component.sortDirection = 'desc';
    expect(component.getSortIcon('name')).toBe('arrow_downward');
    expect(component.getSortIcon('ecoScore')).toBe('unfold_more');
  });

  it('status helpers should map EN_SERVICE and LIBRE', () => {
    expect(component.getStatusClass('EN_SERVICE')).toBe('active');
    expect(component.getStatusClass('LIBRE')).toBe('available');
    expect(component.getStatusLabel('EN_SERVICE')).toBe('En mission');
    expect(component.getStatusLabel('LIBRE')).toBe('Disponible');
    expect(component.getStatusIcon('EN_SERVICE')).toBe('directions_car');
    expect(component.getStatusIcon('LIBRE')).toBe('person_outline');
  });

  it('score helpers should cover every band', () => {
    expect(component.getScoreClass(85)).toBe('score--excellent');
    expect(component.getScoreClass(65)).toBe('score--good');
    expect(component.getScoreClass(45)).toBe('score--average');
    expect(component.getScoreClass(20)).toBe('score--poor');
    expect(component.getScoreLabel(85)).toBe('Excellent');
    expect(component.getScoreLabel(65)).toBe('Bon');
    expect(component.getScoreLabel(45)).toBe('Moyen');
    expect(component.getScoreLabel(20)).toBe('Faible');
  });

  it('format helpers should handle every seniority and distance range', () => {
    expect((component as any).formatSeniority(2)).toBe('< 3 mois');
    expect((component as any).formatSeniority(4)).toBe('4 mois');
    expect((component as any).formatSeniority(13)).toBe('13 mois');
    expect((component as any).formatSeniority(30)).toBe('2 ans 6 mois');
    expect((component as any).formatSeniority(24)).toBe('2 ans');
    expect(component.formatKm(1234)).toBe('1.2k');
    expect(component.formatKm(500)).toBe('500');
  });
});
