import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FleetChartComponent } from './fleet-chart.component';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { provideCharts, withDefaultRegisterables } from 'ng2-charts';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { AuthService } from '../../../../core/auth.service';
import { FleetService } from '../../../../core/services/fleet.service';
import { of, throwError } from 'rxjs';

describe('FleetChartComponent', () => {
  let component: FleetChartComponent;
  let fixture: ComponentFixture<FleetChartComponent>;
  let fleetServiceMock: any;
  let vehiclesFixture: any[];
  let tripsFixture: any[];
  let sectorsFixture: any[];

  const mkVehicle = (overrides: Partial<any> = {}): any => ({
    id: '1',
    plate: 'AA-111-AA',
    model: 'R450',
    brand: 'Scania',
    status: 'En Service',
    nextCheck: '2026-01-01',
    mileage: 100000,
    capacity: 10,
    driverName: 'Ali',
    ...overrides
  });

  const mkTrip = (overrides: Partial<any> = {}): any => ({
    id: 't1',
    date: '15/08/2026',
    dateDepartIso: '2026-08-15T08:00:00Z',
    vehicle: 'AA-111-AA',
    vehicleId: '1',
    driver: 'Ali',
    chauffeurNom: undefined,
    from: 'Tunis',
    to: 'Sousse',
    distanceKm: 120,
    status: 'En Cours',
    dureeReelleMinutes: 90,
    ...overrides
  });

  const baseVehicles = (): any[] => [
    mkVehicle({ mileage: 250000, capacity: 20 }),
    mkVehicle({
      id: '2', plate: 'BB-222-BB', model: 'Master', brand: 'Renault',
      status: 'Maintenance', mileage: 130000, capacity: 10, driverName: undefined
    }),
    mkVehicle({
      id: '3', plate: 'CC-333-CC', model: 'Berlingo', brand: 'Ford',
      status: 'Hors Service', mileage: 50000, capacity: 2, driverName: 'Sam'
    }),
    mkVehicle({
      id: '4', plate: 'DD-444-DD', model: 'FH', brand: 'Volvo',
      status: 'En Service', mileage: 90000, capacity: 15, driverName: 'Leila'
    }),
    mkVehicle({
      id: '5', plate: 'EE-555-EE', model: 'Daily', brand: 'Iveco',
      status: 'En Service', mileage: 30000, capacity: 8, driverName: 'Karim'
    })
  ];

  const baseTrips = (): any[] => [
    mkTrip(),
    mkTrip({
      id: 't2', vehicleId: undefined, vehicle: 'BB-222-BB', driver: 'Karim',
      dateDepartIso: '2026-02-10T09:00:00Z', date: '10/02/2026',
      distanceKm: 200, status: 'Terminé', dureeReelleMinutes: 150,
      from: 'Sfax', to: 'Tunis'
    }),
    mkTrip({
      id: 't3', vehicleId: 'GHOST', vehicle: 'XX-999-XX', driver: 'Zed',
      dateDepartIso: '2026-03-05T07:00:00Z', date: '05/03/2026',
      distanceKm: 50, status: 'Planifié', dureeReelleMinutes: undefined
    }),
    mkTrip({
      id: 't4', dateDepartIso: undefined, date: '-', distanceKm: null,
      status: 'Annulé', dureeReelleMinutes: undefined
    })
  ];

  const baseSectors = (): any[] => [
    { id: 's1', nom: 'Tunis', latitude: 36.9, longitude: 10.15, hasActiveDemand: true },
    { id: 's2', name: 'Bizerte', latitude: 37.27, longitude: 9.87, hasActiveDemand: false },
    { id: 's3', nom: 'Sans GPS', latitude: null, longitude: null }
  ];

  beforeEach(async () => {
    vehiclesFixture = [];
    tripsFixture = [];
    sectorsFixture = [];

    const authServiceMock = {
      getUser: jasmine.createSpy('getUser').and.returnValue({ id: '1', role: 'SUPERADMIN' })
    };
    fleetServiceMock = {
      getVehicles: jasmine.createSpy('getVehicles').and.callFake(() => of(vehiclesFixture)),
      getTrips: jasmine.createSpy('getTrips').and.callFake(() => of(tripsFixture)),
      getSecteurs: jasmine.createSpy('getSecteurs').and.callFake(() => of(sectorsFixture))
    };

    await TestBed.configureTestingModule({
      imports: [FleetChartComponent],
      providers: [
        provideRouter([]),
        provideHttpClient(),
        provideHttpClientTesting(),
        provideAnimationsAsync(),
        provideCharts(withDefaultRegisterables()),
        { provide: AuthService, useValue: authServiceMock },
        { provide: FleetService, useValue: fleetServiceMock }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(FleetChartComponent);
    component = fixture.componentInstance;
    // Neutraliser le ChangeDetectorRef : les re-rendus chart.js crashent sous jsdom.
    (component as any).cdr = {
      detectChanges: jasmine.createSpy('detectChanges'),
      markForCheck: jasmine.createSpy('markForCheck')
    };
    // jsdom n'implémente pas scrollIntoView (utilisé par onKpiClick).
    Element.prototype.scrollIntoView = jasmine.createSpy('scrollIntoView');
    fixture.detectChanges();
  });

  /** Charge un jeu de données et rafraîchit tout sans re-render du template. */
  function loadWith(v: any[], t: any[]): void {
    component.allVehicles = v;
    component.allTrips = t;
    (component as any).extractBrands();
    component.refreshAll();
  }

  function loadBase(): void {
    loadWith(baseVehicles(), baseTrips());
  }

  // ─── Création / cycle de vie ───────────────────────────────────

  it('should create and load data on init', () => {
    expect(component).toBeTruthy();
    expect(fleetServiceMock.getVehicles).toHaveBeenCalled();
    expect(fleetServiceMock.getTrips).toHaveBeenCalled();
    expect(fleetServiceMock.getSecteurs).toHaveBeenCalled();
  });

  it('should reset data on load error', () => {
    (fleetServiceMock.getVehicles as any).and.returnValue(throwError(() => new Error('ko')));
    (component as any).loadData();
    expect(component.allVehicles).toEqual([]);
    expect(component.allTrips).toEqual([]);
  });

  it('should map sectors, drop those without GPS and expose them', () => {
    sectorsFixture = baseSectors();
    (component as any).loadSectorsIfAvailable();

    const sectors = (component as any).sectors;
    expect(sectors.length).toBe(2);
    expect(sectors[0]).toEqual(jasmine.objectContaining({ id: 's1', name: 'Tunis', lat: 36.9 }));
    expect(sectors[1].name).toBe('Bizerte');
  });

  it('should tolerate getSecteurs failure and missing getSecteurs method', () => {
    (fleetServiceMock.getSecteurs as any).and.returnValue(throwError(() => new Error('ko')));
    (component as any).loadSectorsIfAvailable();
    expect((component as any).sectors).toEqual([]);

    const svc = fleetServiceMock as any;
    delete svc.getSecteurs;
    expect(() => (component as any).loadSectorsIfAvailable()).not.toThrow();
  });

  it('should complete destroy$ on ngOnDestroy', () => {
    expect(() => component.ngOnDestroy()).not.toThrow();
  });

  // ─── KPIs ──────────────────────────────────────────────────────

  it('should compute KPIs from loaded fleet', () => {
    loadBase();

    expect(component.kpiTotal).toBe(5);
    expect(component.kpiActive).toBe(3);
    expect(component.kpiMaintenance).toBe(1);
    expect(component.kpiInactive).toBe(1);
    expect(component.kpiUnassigned).toBe(1);
    expect(component.kpiAvgMileage).toBe(110000);
    expect(component.kpiTotalCapacity).toBe(55);
    expect(component.kpiAvgCapacity).toBe(11);
    expect(component.kpiTotalDistanceKm).toBe(370);
    expect(component.kpiTotalTrips).toBe(4);
    expect(component.kpiAvgSpeedKmh).toBe(80);
  });

  it('should handle zero-speed and zero-mileage edge cases', () => {
    loadWith(
      [mkVehicle({ mileage: 0, capacity: 0 }), mkVehicle({ id: '2', plate: 'B', brand: 'Renault', mileage: 0 })],
      [mkTrip({ distanceKm: 100, dureeReelleMinutes: 0 })]
    );

    expect(component.kpiAvgSpeedKmh).toBe(0);
    expect(component.kpiAvgMileage).toBe(0);
    expect(component.kpiTotalCapacity).toBe(10);
    expect(component.kpiAvgCapacity).toBe(10);
  });

  it('should reset availability gauges when fleet is empty', () => {
    loadWith([], []);

    expect(component.kpiAvailabilityRate).toBe(0);
    expect(component.kpiBreakdownRiskRate).toBe(0);
    expect(component.availabilityOperational).toBe(0);
    expect(component.availabilityFuel).toBe(0);
    expect(component.availabilityFuelPct).toBe(0);
    expect(component.availabilityMaintenance).toBe(0);
    expect(component.availabilityRepos).toBe(0);
    expect(component.availabilityReliability).toBe(0);
    expect(component.availabilityProximity).toBe(0);
    expect(component.radarChartData.datasets).toEqual([]);
  });

  // ─── Détails de disponibilité par véhicule ─────────────────────

  it('should score operational state per status (trip / free / maintenance / down)', () => {
    loadBase();

    const v1 = component.allVehicles[0];
    expect(component.getVehicleAvailabilityDetails(v1).operational).toBe(15); // trajet actif

    const v2 = component.allVehicles[1];
    expect(component.getVehicleAvailabilityDetails(v2).operational).toBe(10); // maintenance

    const v3 = component.allVehicles[2];
    expect(component.getVehicleAvailabilityDetails(v3).operational).toBe(0); // hors service

    const v4 = component.allVehicles[3];
    expect(component.getVehicleAvailabilityDetails(v4).operational).toBe(40); // libre
  });

  it('should estimate fuel per brand consumption profile', () => {
    loadBase();

    const d = (i: number) => component.getVehicleAvailabilityDetails(component.allVehicles[i]);

    expect(d(0).fuelLevel).toBe(78);   // Scania : 32L/100, réservoir 400L
    expect(d(1).fuel).toBe(10);        // Renault : niveau moyen -> 10 pts
    expect(d(2).fuelLevel).toBe(91);   // Ford/Berlingo : 8L/100
    expect(d(3).fuelLevel).toBe(90);   // Volvo -> profil lourd
    expect(d(4).fuelLevel).toBe(65);   // Iveco : 18L/100
  });

  it('should score maintenance wear by mileage thresholds', () => {
    loadBase();

    const det = (mileage: number | undefined, status = 'En Service') =>
      component.getVehicleAvailabilityDetails(mkVehicle({ mileage, status })).maintenance;

    expect(det(undefined)).toBe(20);
    expect(det(210000)).toBe(5);
    expect(det(150000)).toBe(12);
    expect(det(80000)).toBe(17);
    expect(det(10000)).toBe(20);
    expect(det(100000, 'Maintenance')).toBe(0);
  });

  it('should score driver rest according to trip history', () => {
    loadBase();

    const active = component.getVehicleAvailabilityDetails(component.allVehicles[0]);
    expect(active.repos).toBe(0);

    const doneLast = component.getVehicleAvailabilityDetails(component.allVehicles[1]);
    expect(doneLast.repos).toBe(10);

    const cancelledLast = component.getVehicleAvailabilityDetails(
      mkVehicle({ id: '9', plate: 'ZZ-999-ZZ', brand: 'Renault' })
    );
    expect(cancelledLast.repos).toBe(10);
    component.allTrips.push(
      mkTrip({ id: 'tc1', vehicleId: '9', status: 'Annul\u00e9', dateDepartIso: '2026-01-05T08:00:00Z' }),
      mkTrip({ id: 'tc2', vehicleId: '9', status: 'Planifi\u00e9', dateDepartIso: '2026-01-20T08:00:00Z' })
    );
    expect(component.getVehicleAvailabilityDetails(mkVehicle({ id: '9', plate: 'ZZ-999-ZZ' })).repos).toBe(5);

    const noTrips = component.getVehicleAvailabilityDetails(component.allVehicles[3]);
    expect(noTrips.repos).toBe(10);
  });

  it('should fall back to default reliability for unknown or missing brands', () => {
    loadBase();

    const unknown = component.getVehicleAvailabilityDetails(mkVehicle({ id: '77', brand: 'Mystere' }));
    expect(unknown.reliability).toBe(7);

    const noBrand = component.getVehicleAvailabilityDetails(mkVehicle({ id: '88', brand: undefined }));
    expect(noBrand.reliability).toBe(7);
  });

  it('should score proximity via GPS and active sectors', () => {
    sectorsFixture = baseSectors();
    (component as any).loadSectorsIfAvailable();
    loadBase();

    const near = (component as any).computeProximity(
      mkVehicle({ latitude: 36.85, longitude: 10.18 })
    );
    expect(near.score).toBe(5);
    expect(near.nearestSectorName).toBe('Tunis');

    const mid = (component as any).computeProximity(
      mkVehicle({ latitude: 36.45, longitude: 10.7 })
    );
    expect(mid.score).toBeGreaterThan(0);
    expect(mid.score).toBeLessThan(5);
  });

  it('should return neutral proximity without coordinates, sectors or candidates', () => {
    loadBase();

    const noCoords = (component as any).computeProximity(mkVehicle());
    expect(noCoords).toEqual({ score: 4, distanceKm: null, nearestSectorName: null });

    (component as any).sectors = [];
    const noSectors = (component as any).computeProximity(
      mkVehicle({ latitude: 36.85, longitude: 10.18 })
    );
    expect(noSectors.score).toBe(4);
  });

  it('should use all sectors when none has active demand', () => {
    (component as any).sectors = [
      { id: 's2', name: 'Bizerte', lat: 37.27, lng: 9.87, hasActiveDemand: false }
    ];
    const res = (component as any).computeProximity(
      mkVehicle({ latitude: 37.27, longitude: 9.87 })
    );
    expect(res.score).toBe(5);
    expect(res.nearestSectorName).toBe('Bizerte');
  });

  it('should compute haversine distances deterministically', () => {
    const d = (component as any).getHaversineDistance(36.85, 10.18, 36.85, 10.18);
    expect(d).toBe(0);

    const d2 = (component as any).getHaversineDistance(0, 0, 0, 1);
    expect(Math.round(d2)).toBe(111);
  });

  // ─── Jauges disponibilité / risque ─────────────────────────────

  it('should show a green gauge for a healthy fleet', () => {
    loadWith(
      [1, 2, 3, 4].map(i => mkVehicle({ id: String(i), plate: `P-${i}`, mileage: 5000 })),
      []
    );

    expect(component.kpiAvailabilityRate).toBeGreaterThanOrEqual(80);
    expect(component.gaugeColor).toBe('#4ade80');
    expect(component.gaugeRotation).toBeCloseTo((component.kpiAvailabilityRate / 100) * 180, 5);
  });

  it('should show an amber gauge for a middling fleet', () => {
    loadWith(
      [mkVehicle({ status: 'Hors Service', mileage: 30000 })],
      []
    );

    expect(component.kpiAvailabilityRate).toBeGreaterThanOrEqual(50);
    expect(component.kpiAvailabilityRate).toBeLessThan(80);
    expect(component.gaugeColor).toBe('#fbbf24');
  });

  it('should show a red gauge for a worn-out fleet', () => {
    loadWith(
      [mkVehicle({ status: 'Hors Service', mileage: 300000 })],
      []
    );

    expect(component.kpiAvailabilityRate).toBeLessThan(50);
    expect(component.gaugeColor).toBe('#f87171');
  });

  it('should weight reliability contextually under high demand', () => {
    loadWith(
      [mkVehicle(), mkVehicle({ id: '2', plate: 'B', brand: 'Renault', status: 'En Service' })],
      [mkTrip(), mkTrip({ id: 't9', vehicleId: '2' })]
    );

    expect(component.kpiAvailabilityRate).toBeGreaterThanOrEqual(0);
    expect(component.kpiAvailabilityRate).toBeLessThanOrEqual(100);
    expect(component.riskGaugeRotation).toBeCloseTo((component.kpiBreakdownRiskRate / 100) * 180, 5);
  });

  it('should color the breakdown-risk gauge from green to red', () => {
    loadWith(
      Array.from({ length: 6 }, (_, i) =>
        mkVehicle({ id: String(i), plate: `P-${i}`, brand: 'Solide', status: 'En Service', mileage: 5000 })),
      []
    );
    expect(component.kpiBreakdownRiskRate).toBeLessThan(25);
    expect(component.riskGaugeColor).toBe('#4ade80');

    loadWith(
      [mkVehicle({ brand: 'Risqué', status: 'Maintenance', mileage: 150000 }),
       mkVehicle({ id: '2', plate: 'Q', brand: 'Risqué', status: 'Hors Service', mileage: 150000 })],
      []
    );
    expect(component.kpiBreakdownRiskRate).toBeGreaterThanOrEqual(50);
    expect(component.riskGaugeColor).toBe('#f87171');
  });

  it('should decompose availability into waterfall steps', () => {
    loadBase();

    expect(component.waterfallSteps.length).toBe(6);
    expect(component.waterfallSteps[0].label).toBe('Opérationnel');
    expect(component.waterfallSteps[0].maxValue).toBe(40);
    expect(component.waterfallSteps[5].label).toBe('Proximité');
    expect(component.waterfallSteps[5].cumulative).toBe(component.waterfallTotal);
    expect(component.waterfallTotal).toBeLessThanOrEqual(100);
  });

  // ─── Tendances / marques / top kilométrage ─────────────────────

  it('should compute trends with safe division', () => {
    loadBase();

    expect(component.trendActive).toBe(100);
    expect(component.trendMaintenance).toBe(-100);
    expect(component.trendInactive).toBe(100);
    expect(component.trendTotal).toBe(50);
  });

  it('should aggregate brand stats with percentages', () => {
    loadWith(
      [...baseVehicles(), mkVehicle({ id: '6', plate: 'FF-666-FF', brand: undefined, capacity: 3 })],
      []
    );

    const scania = component.brandStats.find(b => b.brand === 'Scania')!;
    expect(scania.count).toBe(1);
    expect(scania.percentage).toBe(17);
    expect(scania.avgCapacity).toBe(20);

    const unknown = component.brandStats.find(b => b.brand === 'Inconnu')!;
    expect(unknown.count).toBe(1);
    expect(unknown.totalCapacity).toBe(3);
  });

  it('should rank top mileage vehicles including ghost trip ids', () => {
    loadBase();

    expect(component.topMileageVehicles.length).toBe(5);
    expect(component.topMileageVehicles[0].id).toBe('1');
    expect(component.topMileageVehicles[0].totalKm).toBe(250120);
    expect(component.topMileageVehicles[0].percentage).toBe(100);
    expect(component.topMileageVehicles[0].tripCount).toBe(2);
    expect(component.topMileageVehicles.map(v => v.id)).not.toContain('GHOST');
  });

  it('should restrict top mileage to filtered vehicles', () => {
    loadBase();
    component.filterVehicle = '2';
    component.refreshAll();

    expect(component.topMileageVehicles.length).toBe(1);
    expect(component.topMileageVehicles[0].id).toBe('2');
  });

  // ─── Charts ────────────────────────────────────────────────────

  it('should build the status donut and its drill-down click handler', () => {
    loadBase();

    expect(component.donutData.labels).toEqual(['En Service', 'Maintenance', 'Hors Service']);
    expect(component.donutData.datasets[0].data).toEqual([3, 1, 1]);

    component.donutOptions.onClick(null, []);
    expect(component.drillDownOpen).toBeFalse();

    component.donutOptions.onClick(null, [{ index: 1 }]);
    expect(component.drillDownOpen).toBeTrue();
    expect(component.drillDownType).toBe('status');
    expect(component.drillStatus!.statusLabel).toBe('Maintenance');
  });

  it('should build the brand bar chart and its drill-down click handler', () => {
    loadBase();

    expect(component.brandChartData.labels).toEqual([
      'Scania', 'Renault', 'Ford', 'Volvo', 'Iveco'
    ]);
    expect((component.brandChartData.datasets![0] as any).data).toEqual([1, 1, 1, 1, 1]);

    (component.brandOptions as any).onClick(null, [{ index: 0 }]);
    expect(component.drillDownType).toBe('brand');
    expect(component.drillBrand!.brand).toBe('Scania');

    const brandTooltip = (component.brandOptions as any).plugins.tooltip.callbacks.label;
    expect(brandTooltip({ parsed: { x: 3 } })).toBe(' 3 v\u00e9hicule(s)');
  });

  it('should build the global monthly line chart and its click handler', () => {
    loadBase();

    expect(component.lineChartData.labels!.length).toBe(12);
    expect(component.lineChartData.datasets!.length).toBe(2);
    const distanceDs = component.lineChartData.datasets![0] as any;
    const tripsDs = component.lineChartData.datasets![1] as any;
    expect(distanceDs.label).toBe('Distance (km)');
    expect(distanceDs.data[7]).toBe(120);
    expect(tripsDs.data[1]).toBe(1);

    (component.lineOptions as any).onClick(null, [{ index: 7 }]);
    expect(component.drillMonth!.monthIndex).toBe(7);
    expect(component.drillMonth!.monthLabel).toContain('Ao');
  });

  it('should switch the line chart to per-vehicle mode under brand filter', () => {
    loadBase();
    component.filterBrand = 'Scania';
    component.refreshAll();

    expect(component.lineChartData.datasets!.length).toBe(2);
    expect((component.lineChartData.datasets![0] as any).label).toContain('AA-111-AA');
    expect((component.lineChartData.datasets![1] as any).yAxisID).toBe('y1');
  });

  it('should build the scatter chart with median reference lines', () => {
    loadBase();

    expect(component.scatterData.datasets.length).toBe(5);
    const statusGroups = component.scatterData.datasets.slice(0, 3);
    expect(statusGroups.map((g: any) => g.label).sort()).toEqual(
      ['En Service', 'Hors Service', 'Maintenance'].sort()
    );
    const enService = statusGroups.find((g: any) => g.label === 'En Service');
    expect(enService.data.length).toBe(3);
    expect(enService.data[0].vehiclePlate).toBeDefined();

    expect(component.scatterData.datasets[3].label).toBe('Médiane Capacité');
    expect(component.scatterData.datasets[4].label).toBe('Médiane Kilométrage');

    expect(enService.pointRadius({ raw: { x: 20 } })).toBe(14);
    expect(enService.pointRadius({ raw: null })).toBe(6);
    expect(component.getScatterPointCount()).toBe(9);
  });

  it('should format scatter tooltips and axis ticks', () => {
    loadBase();

    const cb = (component.scatterOptions as any).plugins.tooltip.callbacks;
    expect(cb.title([])).toBe('');
    expect(cb.title([{ raw: {} }])).toContain('N/A');
    expect(cb.title([{ raw: { vehiclePlate: 'AA-111-AA' } }])).toContain('AA-111-AA');

    expect(cb.label({ raw: { x: 5, y: 100, vehicleModel: 'R450', status: 'En Service' } })).toEqual([
      'Mod\u00e8le : R450',
      'Statut : En Service',
      'Capacit\u00e9 : 5 t',
      'Kilom\u00e9trage : 100 km'
    ]);

    expect(cb.afterLabel({ raw: { x: 1, y: 4 } })).toBe('Ratio (t/1000km) : 250.0');
    expect(cb.afterLabel({ raw: { x: 1, y: 0 } })).toBe('Ratio (t/1000km) : \u2014');

    const tickX = (component.scatterOptions as any).scales.x.ticks.callback;
    const tickY = (component.scatterOptions as any).scales.y.ticks.callback;
    expect(tickX(5)).toBe('5 t');
    expect(tickY(42)).toBe(42);
    expect(tickY(1500)).toBe('1.5k');
  });

  it('should drill into a vehicle from a scatter point click', () => {
    loadBase();

    const enServiceIdx = component.scatterData.datasets.findIndex(
      (d: any) => d.label === 'En Service'
    );
    component.scatterOptions.onClick(null, [{ datasetIndex: enServiceIdx, index: 0 }]);
    expect(component.drillDownType).toBe('vehicle');
    expect(component.drillVehicle!.vehicle.plate).toBe('AA-111-AA');
  });

  it('should guard scatter clicks without data and use fallback object', () => {
    loadBase();

    component.scatterOptions.onClick(null, []);
    expect(component.drillDownOpen).toBeFalse();

    component.scatterOptions.onClick(null, [{ datasetIndex: 99, index: 0 }]);
    expect(component.drillDownOpen).toBeFalse();

    component.topMileageVehicles = [];
    const ddIdx = component.scatterData.datasets.findIndex(
      (d: any) => d.label === 'Hors Service'
    );
    component.scatterOptions.onClick(null, [{ datasetIndex: ddIdx, index: 0 }]);
    expect(component.drillVehicle!.vehicle.plate).toBe('CC-333-CC');
    expect(component.drillVehicle!.totalKm).toBe(50000);
  });

  it('should build the radar chart over the top 3 brands', () => {
    loadBase();

    expect(component.radarChartData.labels!.length).toBe(6);
    expect(component.radarChartData.datasets!.length).toBe(3);
    const ds = component.radarChartData.datasets![0] as any;
    expect(ds.data.length).toBe(6);
    expect(ds.borderColor).toBe(component.getBrandColor(0));
    expect(ds.backgroundColor).toContain('#6366f1');
  });

  it('should build the stacked trips bar and footer helpers', () => {
    loadBase();

    expect(component.tripBarData.labels!.length).toBe(12);
    const labels = component.tripBarData.datasets!.map((d: any) => d.label);
    expect(labels.sort()).toEqual(['En Cours', 'Planifi\u00e9', 'Termin\u00e9'].sort());
    expect(component.getTripBarMonthCount()).toBe(12);
    expect(component.getTripBarTotalTrips()).toBe(3);
  });

  // ─── Drill-downs directs ───────────────────────────────────────

  it('should open a month drill-down with aggregated stats', () => {
    loadBase();
    component.openMonthDrillDown(7);

    expect(component.drillDownOpen).toBeTrue();
    expect(component.drillMonth!.monthLabel).toBe('Ao\u00fbt');
    expect(component.drillMonth!.totalKm).toBe(120);
    expect(component.drillMonth!.tripCount).toBe(1);
    expect(component.drillMonth!.avgKmPerTrip).toBe(120);
    expect(component.drillMonth!.vehicleCount).toBe(1);
    expect(component.drillMonth!.trips[0].driverName).toBe('Ali');
  });

  it('should open a status drill-down with defaults for missing fields', () => {
    loadBase();
    component.openStatusDrillDown('Maintenance');

    expect(component.drillStatus!.count).toBe(1);
    expect(component.drillStatus!.percentage).toBe(20);
    expect(component.drillStatus!.statusIcon).toBe('build');
    expect(component.drillStatus!.vehicles[0].driverName).toBe('Non affect\u00e9');
    expect(component.drillStatus!.vehicles[0].brand).toBe('Renault');

    component.openStatusDrillDown('Inconnu');
    expect(component.drillStatus!.count).toBe(0);
    expect(component.drillStatus!.percentage).toBe(0);
    expect(component.drillStatus!.statusIcon).toBe('help_outline');
  });

  it('should open a brand drill-down including unknown brands', () => {
    loadWith(
      [...baseVehicles(), mkVehicle({ id: '6', plate: 'FF-666-FF', brand: undefined, capacity: 3 })],
      []
    );
    component.openBrandDrillDown('Inconnu');

    expect(component.drillBrand!.count).toBe(1);
    expect(component.drillBrand!.totalCapacity).toBe(3);
    expect(component.drillBrand!.avgCapacity).toBe(3);
    expect(component.drillBrand!.vehicles[0].brand).toBe('-');
  });

  it('should open a vehicle drill-down and ignore unknown ids', () => {
    loadBase();

    component.openVehicleDrillDown({
      id: 'inconnu', plate: '', model: '', brand: '', driverName: '',
      status: '', totalKm: 0, percentage: 0, tripCount: 0
    });
    expect(component.drillVehicle).toBeNull();

    const top = component.topMileageVehicles[0];
    component.openVehicleDrillDown(top);
    expect(component.drillVehicle!.vehicle.plate).toBe('AA-111-AA');
    expect(component.drillVehicle!.totalKm).toBe(250120);
    expect(component.drillVehicle!.trips.length).toBe(2);
    expect(component.drillVehicle!.statusClass).toBe('active');
  });

  it('should close the drill-down panel', () => {
    loadBase();
    component.openMonthDrillDown(7);
    component.closeDrillDown();
    expect(component.drillDownOpen).toBeFalse();
  });

  // ─── Filtres / table / pagination ──────────────────────────────

  it('should paginate the vehicle table', () => {
    loadBase();

    expect(component.dataSource.length).toBe(5);
    expect(component.totalElements).toBe(5);
    expect(component.dataSource[0].plate).toBe('AA-111-AA');
    expect(component.dataSource[0].totalDistanceKm).toBe(250120);
    expect(component.dataSource[1].statusClass).toBe('maintenance');

    component.onPageChange({ pageIndex: 1, pageSize: 2 } as any);
    expect(component.pageIndex).toBe(1);
    expect(component.pageSize).toBe(2);
    expect(component.dataSource.length).toBe(2);
    expect(component.dataSource[0].plate).toBe('CC-333-CC');
  });

  it('should apply status, brand and vehicle filters', () => {
    loadBase();

    component.onStatusChange('En Service');
    expect(component.hasActiveFilters).toBeTrue();
    expect(component.activeFilterCount).toBe(1);
    expect(component.kpiTotal).toBe(3);
    expect(component.kpiTotalTrips).toBe(2);

    component.onBrandChange('Scania');
    expect(component.kpiTotal).toBe(1);

    component.onVehicleChange('1');
    expect(component.kpiTotal).toBe(1);
    expect(component.selectedVehicleInfo!.id).toBe('1');

    component.clearFilters();
    expect(component.hasActiveFilters).toBeFalse();
    expect(component.kpiTotal).toBe(5);
    expect(component.selectedVehicleInfo).toBeNull();
  });

  it('should highlight KPI selection, filter and scroll on click', () => {
    loadBase();
    let timeoutCb: (() => void) | null = null;
    spyOn(window, 'setTimeout').and.callFake(((cb: () => void) => {
      timeoutCb = cb;
      return 1;
    }) as any);

    component.onKpiClick('maintenance');

    expect(component.selectedKpiType).toBe('maintenance');
    expect(component.kpiHighlightClass).toBe('fc-table-section--maintenance');
    expect(component.filterStatus).toBe('Maintenance');
    expect(timeoutCb).not.toBeNull();
    (timeoutCb as (() => void) | null)?.();
    expect(Element.prototype.scrollIntoView).toHaveBeenCalled();

    component.onKpiClick('total');
    expect(component.filterStatus).toBe('');
    expect(component.kpiHighlightClass).toBe('fc-table-section--total');

    component.onKpiClick('active');
    expect(component.filterStatus).toBe('En Service');
    expect(component.kpiHighlightClass).toBe('fc-table-section--active');

    component.clearFilters();
    component.selectedKpiType = '';
    expect(component.kpiHighlightClass).toBe('');

    component.onKpiClick('inactive');
    expect(component.filterStatus).toBe('Hors Service');
    expect(component.kpiHighlightClass).toBe('fc-table-section--inactive');
  });

  // ─── Helpers template ──────────────────────────────────────────

  it('should map statuses and trip statuses to icons and classes', () => {
    expect(component.getStatusIcon('En Service')).toBe('check_circle');
    expect(component.getStatusIcon('Maintenance')).toBe('build');
    expect(component.getStatusIcon('Hors Service')).toBe('cancel');
    expect(component.getStatusIcon('?')).toBe('help_outline');

    expect(component.getStatusClass('En Service')).toBe('active');
    expect(component.getStatusClass('Maintenance')).toBe('maintenance');
    expect(component.getStatusClass('Hors Service')).toBe('inactive');
    expect(component.getStatusClass('?')).toBe('unknown');

    expect(component.getTripStatusIcon('Actif')).toBe('play_circle');
    expect(component.getTripStatusIcon('En Cours')).toBe('play_circle');
    expect(component.getTripStatusIcon('Termin\u00e9')).toBe('check_circle');
    expect(component.getTripStatusIcon('Planifi\u00e9')).toBe('schedule');
    expect(component.getTripStatusIcon('Annul\u00e9')).toBe('cancel');
    expect(component.getTripStatusIcon('?')).toBe('info');

    expect(component.getTripStatusClass('Actif')).toBe('dd-status--active');
    expect(component.getTripStatusClass('Termin\u00e9')).toBe('dd-status--done');
    expect(component.getTripStatusClass('Planifi\u00e9')).toBe('dd-status--planned');
    expect(component.getTripStatusClass('Annul\u00e9')).toBe('dd-status--cancelled');
    expect(component.getTripStatusClass('?')).toBe('dd-status--default');
  });

  it('should format distances, palette colors and group vehicles by brand', () => {
    loadWith(
      [...baseVehicles(), mkVehicle({ id: '6', plate: 'AB-000-AB', brand: 'Scania' })],
      []
    );

    expect(component.formatKm(1500)).toBe('1.5k km');
    expect(component.formatKm(42)).toBe('42 km');
    expect(component.getBrandColor(0)).toBe('#6366f1');
    expect(component.getBrandColor(11)).toBe(component.getBrandColor(1));

    const scania = component.getVehiclesByBrand('Scania');
    expect(scania.length).toBe(2);
    expect(scania[0].plate).toBe('AA-111-AA');
    expect(scania[1].plate).toBe('AB-000-AB');
  });

  it('should expose reliability entries and confidence labels', () => {
    loadBase();

    const entry = component.getReliabilityEntry('Scania');
    expect(entry).not.toBeNull();
    expect(entry!.vehicleCount).toBe(1);
    expect(entry!.confidence).toBe('low');
    expect(component.getConfidenceLabel(entry!.confidence)).toBe('Peu de donn\u00e9es');

    expect(component.getReliabilityEntry('Inexistant')).toBeNull();
    expect(component.getConfidenceLabel('high')).toBe('Fiable');
    expect(component.getConfidenceLabel('medium')).toBe('Indicatif');
  });

  it('should boost reliability score for durable brands with enough samples', () => {
    loadWith(
      Array.from({ length: 6 }, (_, i) =>
        mkVehicle({ id: String(i), plate: `P-${i}`, brand: 'Endurance', mileage: 190000 })),
      []
    );

    const entry = component.getReliabilityEntry('Endurance')!;
    expect(entry.confidence).toBe('high');
    expect(entry.maintenanceRate).toBe(0);
    expect(entry.score).toBe(10);
    expect(component.getConfidenceLabel('high')).toBe('Fiable');
  });

  it('should identify trips by vehicle id or matching plate', () => {
    loadBase();

    const v = component.allVehicles[0];
    expect(component.isTripForVehicle(mkTrip({ vehicleId: '1' }), v)).toBeTrue();
    expect(component.isTripForVehicle(mkTrip({ vehicleId: undefined, vehicle: 'aa-111-aa' }), v)).toBeTrue();
    expect(component.isTripForVehicle(mkTrip({ vehicleId: undefined, vehicle: 'zz-zzz-zz' }), v)).toBeFalse();
    expect(component.isTripForVehicle(mkTrip({ vehicleId: undefined, vehicle: '' }), v)).toBeFalse();
    expect(component.trackById(0, { id: 'x' })).toBe('x');
  });

  it('should sort extracted brands and dropdown vehicles', () => {
    loadBase();

    expect(component.brands).toEqual(['Ford', 'Iveco', 'Renault', 'Scania', 'Volvo']);
    expect(component.vehicles.map(v => v.plate)).toEqual([
      'AA-111-AA', 'BB-222-BB', 'CC-333-CC', 'DD-444-DD', 'EE-555-EE'
    ]);
  });
});
