import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ChangeDetectorRef } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { provideCharts, withDefaultRegisterables } from 'ng2-charts';
import { PageEvent } from '@angular/material/paginator';
import { of, throwError } from 'rxjs';
import * as L from 'leaflet';
import { DeliveryChartComponent } from './delivery-chart.component';
import { FleetService, Trip, Vehicle } from '../../../../core/services/fleet.service';

/* Leaflet entièrement mocké : jsdom ne peut pas créer de vraie carte */
jest.mock('leaflet', () => {
  const mkLayer = () => {
    const layer: any = {};
    layer.addTo = jest.fn(() => layer);
    layer.bindPopup = jest.fn(() => layer);
    layer.remove = jest.fn();
    return layer;
  };
  const fakeMap = {
    removeLayer: jest.fn(),
    remove: jest.fn(),
    invalidateSize: jest.fn(),
    fitBounds: jest.fn()
  };
  return {
    map: jest.fn(() => fakeMap),
    tileLayer: jest.fn(mkLayer),
    polyline: jest.fn(mkLayer),
    circleMarker: jest.fn(mkLayer)
  };
});

describe('DeliveryChartComponent', () => {
  let component: DeliveryChartComponent;
  let fixture: ComponentFixture<DeliveryChartComponent>;
  let fleetMock: any;

  const NOW = new Date();
  const isoDaysAgo = (d: number) => new Date(NOW.getTime() - d * 86400000).toISOString();

  const mkTrip = (o: Partial<Trip> = {}): Trip =>
    ({
      id: '1',
      date: isoDaysAgo(1),
      dateDepartIso: isoDaysAgo(1),
      vehicle: 'AA-100-AA',
      vehicleId: 'v1',
      from: 'Tunis',
      to: 'Sfax',
      driver: 'Ali',
      driverId: 'd1',
      managerId: 'm1',
      status: 'Terminé',
      distanceKm: 100,
      dureeReelleMinutes: 90,
      retardMinutes: 0,
      ...o
    } as Trip);

  const mkVehicle = (o: Partial<Vehicle> = {}): Vehicle =>
    ({ id: 'v1', plate: 'AA-100-AA', model: 'Master', status: 'En Service', nextCheck: '2026-01-01', ...o } as Vehicle);

  beforeEach(async () => {
    jest.clearAllMocks();

    fleetMock = {
      getTrips: jasmine.createSpy('getTrips').and.returnValue(of([])),
      getVehicles: jasmine.createSpy('getVehicles').and.returnValue(of([]))
    };

    await TestBed.configureTestingModule({
      imports: [DeliveryChartComponent],
      providers: [
        provideRouter([]),
        provideHttpClient(),
        provideHttpClientTesting(),
        provideAnimationsAsync(),
        provideCharts(withDefaultRegisterables()),
        { provide: ChangeDetectorRef, useValue: { detectChanges: jasmine.createSpy('detectChanges'), markForCheck: jasmine.createSpy('markForCheck') } },
        { provide: FleetService, useValue: fleetMock }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(DeliveryChartComponent);
    component = fixture.componentInstance;
    /* Ivy ignore le provider ChangeDetectorRef : on remplace l'instance privée
       pour rendre tout cdr.detectChanges() inert (pas de re-rendu des canvas). */
    (component as any).cdr = {
      detectChanges: jasmine.createSpy('cdrDetectChanges'),
      markForCheck: jasmine.createSpy('cdrMarkForCheck')
    };
    /* Pas de fixture.detectChanges() : contrainte chart.js/leaflet en jsdom */
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  // ─── Cycle de vie ─────────────────────────────────────────────
  it('ngOnInit() charge les trajets et véhicules puis rafraîchit tout', () => {
    fleetMock.getTrips.and.returnValue(of([mkTrip(), mkTrip({ id: '2', vehicleId: 'v1' })]));
    fleetMock.getVehicles.and.returnValue(of([mkVehicle({ brand: 'Renault' })]));
    component.ngOnInit();
    expect(component.allTrips.length).toBe(2);
    expect(component.allVehicles.length).toBe(1);
    expect(component.kpiTotalTrips).toBe(2);
    expect(fleetMock.getTrips).toHaveBeenCalled();
  });

  it('ngOnInit() gère les erreurs du service (branche error)', () => {
    fleetMock.getTrips.and.returnValue(throwError(() => new Error('boom')));
    fleetMock.getVehicles.and.returnValue(throwError(() => new Error('boom')));
    component.ngOnInit();
    expect(component.allTrips).toEqual([]);
    expect(component.allVehicles).toEqual([]);
    expect(component.kpiTotalTrips).toBe(0);
  });

  it('ngOnInit() tolère des données nulles du service', () => {
    fleetMock.getTrips.and.returnValue(of(null as any));
    fleetMock.getVehicles.and.returnValue(of(null as any));
    component.ngOnInit();
    expect(component.allTrips).toEqual([]);
    expect(component.allVehicles).toEqual([]);
  });

  it('ngOnDestroy() nettoie la carte sans erreur même si elle est nulle', () => {
    expect(() => component.ngOnDestroy()).not.toThrow();
  });

  // ─── Getters & état initial ───────────────────────────────────
  it('avgGlobalDistance vaut 0 sans destinations', () => {
    expect(component.avgGlobalDistance).toBe(0);
  });

  it('healthScore retourne le fallback avant tout calcul', () => {
    const hs = component.healthScore;
    expect(hs.score).toBe(0);
    expect(hs.label).toBe('N/A');
    expect(hs.breakdown.length).toBe(5);
  });

  // ─── KPIs ─────────────────────────────────────────────────────
  it('refreshAll() calcule les KPIs principaux', () => {
    component.allTrips = [
      mkTrip({ status: 'Terminé', retardMinutes: 0, distanceKm: 100, dureeReelleMinutes: 60 }),
      mkTrip({ id: '2', status: 'Terminé', retardMinutes: 30, distanceKm: 50, dureeReelleMinutes: 120 }),
      mkTrip({ id: '3', status: 'En Cours', distanceKm: 30 })
    ];
    component.refreshAll();
    expect(component.kpiTotalTrips).toBe(3);
    expect(component.kpiTotalDistance).toBe(180);
    expect(component.kpiAvgDuration).toBe(90);
    expect(component.kpiOnTimeRate).toBe(50);
    expect(component.kpiCompletionRate).toBe(67);
    expect(component.kpiActiveRate).toBe(33);
  });

  it('calcule la durée depuis les dates ISO quand dureeReelleMinutes est absent', () => {
    component.allTrips = [
      mkTrip({
        dureeReelleMinutes: undefined,
        dateDepartIso: '2026-01-01T08:00:00Z',
        dateArriveeIso: '2026-01-01T09:30:00Z'
      })
    ];
    component.refreshAll();
    expect(component.kpiAvgDuration).toBe(90);
  });

  it('kpiOnTimeRate à 100 quand retardMinutes est null sur les trajets terminés', () => {
    component.allTrips = [mkTrip({ retardMinutes: undefined }), mkTrip({ id: '2', retardMinutes: undefined })];
    component.refreshAll();
    expect(component.kpiOnTimeRate).toBe(100);
  });

  it('kpiAvgDuration à 0 si aucune durée exploitable', () => {
    component.allTrips = [mkTrip({ dureeReelleMinutes: undefined, dateDepartIso: undefined })];
    component.refreshAll();
    expect(component.kpiAvgDuration).toBe(0);
  });

  // ─── Tendances ────────────────────────────────────────────────
  it('tendances à 0 avec moins de 2 trajets', () => {
    component.allTrips = [mkTrip()];
    component.refreshAll();
    expect(component.trendTotal).toBe(0);
    expect(component.trendDistance).toBe(0);
    expect(component.trendDuration).toBe(0);
    expect(component.trendOnTime).toBe(0);
  });

  it('tendance distance : précédente nulle => 100', () => {
    component.allTrips = [
      mkTrip({ id: '1', distanceKm: undefined }),
      mkTrip({ id: '2', distanceKm: 200 })
    ];
    component.refreshAll();
    expect(component.trendDistance).toBe(100);
  });

  it('tendance durée en baisse', () => {
    component.allTrips = [
      mkTrip({ id: '1', dureeReelleMinutes: 100 }),
      mkTrip({ id: '2', dureeReelleMinutes: 50 })
    ];
    component.refreshAll();
    expect(component.trendDuration).toBe(-50);
  });

  // ─── Sous-stats & extrêmes ────────────────────────────────────
  it('identifie les trajets extrêmes (court/long/rapide/retardé)', () => {
    component.allTrips = [
      mkTrip({ id: '1', distanceKm: 10, dureeReelleMinutes: 30 }),
      mkTrip({ id: '2', distanceKm: 500, dureeReelleMinutes: 300, retardMinutes: 45 }),
      mkTrip({ id: '3', distanceKm: 100, dureeReelleMinutes: 60 })
    ];
    component.refreshAll();
    expect(component.shortestTrip?.id).toBe('1');
    expect(component.longestTrip?.id).toBe('2');
    expect(component.fastestTrip?.id).toBe('1');
    expect(component.mostDelayedTrip?.id).toBe('2');
  });

  it('extremes à null sans données valides', () => {
    component.allTrips = [];
    component.refreshAll();
    expect(component.shortestTrip).toBeNull();
    expect(component.longestTrip).toBeNull();
    expect(component.fastestTrip).toBeNull();
    expect(component.mostDelayedTrip).toBeNull();
  });

  it('optStats calcule compteurs et moyennes par type', () => {
    component.allTrips = [
      mkTrip({ id: '1', distanceKm: 100, dureeReelleMinutes: 60 }),
      mkTrip({ id: '2', distanceKm: 200, dureeReelleMinutes: 120, retardMinutes: 10 })
    ];
    component.refreshAll();
    expect(component.optStats.length).toBe(3);
    const rapide = component.optStats.find(o => o.type === 'Rapide')!;
    expect(rapide.count).toBe(1);
    expect(rapide.avgDist).toBe(100);
  });

  // ─── Chauffeurs & véhicules ───────────────────────────────────
  it('driverStats agrège par chauffeur et désigne le top performer', () => {
    component.allTrips = [
      mkTrip({ driverId: 'd1', chauffeurNom: 'Ali Ben', status: 'Terminé', retardMinutes: 0 }),
      mkTrip({ id: '2', driverId: 'd1', chauffeurNom: 'Ali Ben', status: 'Terminé', retardMinutes: 0 }),
      mkTrip({ id: '3', driverId: 'd2', status: 'Annulé' })
    ];
    component.refreshAll();
    expect(component.driverStats.length).toBe(2);
    expect(component.driverStats[0].isTopPerformer).toBeTrue();
    expect(component.driverStats[0].count).toBe(2);
    expect(component.driverStats[0].name).toBe('Ali Ben');
  });

  it('vehicleStats enrichit via le LUT construit au chargement', () => {
    fleetMock.getTrips.and.returnValue(
      of([
        mkTrip({ vehicleId: 'v1', vehicle: 'AA-100-AA', distanceKm: 100 }),
        mkTrip({ id: '2', vehicleId: 'v1', vehicle: 'AA-100-AA', distanceKm: 50 }),
        mkTrip({ id: '3', vehicle: 'CC-300-CC', vehicleId: undefined, distanceKm: 10 })
      ])
    );
    fleetMock.getVehicles.and.returnValue(
      of([mkVehicle({ brand: 'Renault', model: 'Master' }), mkVehicle({ id: 'v2', plate: 'BB-200-BB' })])
    );
    component.ngOnInit();
    const v1 = component.vehicleStats.find(v => v.id === 'v1')!;
    expect(v1.count).toBe(2);
    expect(v1.isMostUsed).toBeTrue();
    expect(v1.model).toBe('Master');
    expect(v1.brand).toBe('Renault');
    const orphan = component.vehicleStats.find(v => v.id === 'CC-300-CC')!;
    expect(orphan.isMostUsed).toBeFalse();
    expect(orphan.model).toBeUndefined();
  });

  // ─── Retards ──────────────────────────────────────────────────
  it('delayBuckets répartit les trajets dans 4 seaux', () => {
    component.allTrips = [
      mkTrip({ retardMinutes: 0 }),
      mkTrip({ id: '2', retardMinutes: 10 }),
      mkTrip({ id: '3', retardMinutes: 30 }),
      mkTrip({ id: '4', retardMinutes: 90 })
    ];
    component.refreshAll();
    expect(component.delayBuckets.map(b => b.value)).toEqual([1, 1, 1, 1]);
  });

  // ─── Destinations ─────────────────────────────────────────────
  it('destinationStats trie et expose top/least avec fallback Inconnue', () => {
    component.allTrips = [
      mkTrip({ to: 'Sfax' }),
      mkTrip({ id: '2', to: 'Sfax' }),
      mkTrip({ id: '3', to: '' })
    ];
    component.refreshAll();
    expect(component.topDestination).toBe('Sfax');
    expect(component.leastDestination).toBe('Inconnue');
    expect(component.avgGlobalDistance).toBeGreaterThan(0);
  });

  it('top/least destination valent — sans trajets', () => {
    component.allTrips = [];
    component.refreshAll();
    expect(component.topDestination).toBe('—');
    expect(component.leastDestination).toBe('—');
  });

  // ─── Alertes intelligentes ────────────────────────────────────
  it('déclenche les 5 alertes sur un jeu de données dégradé', () => {
    component.allTrips = [
      mkTrip({ id: '1', to: 'Sfax', status: 'Terminé', retardMinutes: 0 }),
      mkTrip({ id: '2', to: 'Sfax', status: 'Terminé', retardMinutes: 0 }),
      mkTrip({ id: '3', to: 'Sfax', status: 'Terminé', retardMinutes: 30 }),
      mkTrip({ id: '4', to: 'Sfax', status: 'Terminé', retardMinutes: 30 }),
      mkTrip({ id: '5', to: 'Bizerte', status: 'Terminé', retardMinutes: 30, vehicleId: 'v2', vehicle: 'BB-200-BB' }),
      mkTrip({ id: '6', to: 'Bizerte', status: 'Terminé', retardMinutes: 30 })
    ];
    component.refreshAll();
    const messages = component.smartAlerts.map(a => a.message).join(' | ');
    expect(messages).toContain('ponctualité');
    expect(messages).toContain('augmentation');
    expect(messages).toContain('saturée');
    expect(messages).toContain('taux de retard anormal');
    expect(messages).toContain('sous-utilisé');
  });

  it('aucune alerte sur une flotte saine', () => {
    component.allVehicles = [mkVehicle(), mkVehicle({ id: 'v2', plate: 'BB-200-BB' })];
    component.allTrips = [
      mkTrip({ to: 'Sfax' }),
      mkTrip({ id: '2', to: 'Bizerte', vehicleId: 'v2', vehicle: 'BB-200-BB', driverId: 'd2' }),
      mkTrip({ id: '3', to: 'Sousse' }),
      mkTrip({ id: '4', to: 'Nabeul', vehicleId: 'v2', vehicle: 'BB-200-BB', driverId: 'd2' })
    ];
    component.refreshAll();
    expect(component.smartAlerts.length).toBe(0);
  });

  // ─── Prédictions ──────────────────────────────────────────────
  it('predictions null avec moins de 5 trajets', () => {
    component.allTrips = [mkTrip(), mkTrip({ id: '2' })];
    component.refreshAll();
    expect(component.predictions).toBeNull();
  });

  it('predictions null si moins de 3 trajets récents', () => {
    component.allTrips = [
      mkTrip({ dateDepartIso: isoDaysAgo(60), date: isoDaysAgo(60) }),
      mkTrip({ id: '2', dateDepartIso: isoDaysAgo(61), date: isoDaysAgo(61) }),
      mkTrip({ id: '3', dateDepartIso: isoDaysAgo(62), date: isoDaysAgo(62) }),
      mkTrip({ id: '4', dateDepartIso: isoDaysAgo(63), date: isoDaysAgo(63) }),
      mkTrip({ id: '5', dateDepartIso: isoDaysAgo(64), date: isoDaysAgo(64) })
    ];
    component.refreshAll();
    expect(component.predictions).toBeNull();
  });

  it('predictions complètes avec risque faible', () => {
    component.allTrips = Array.from({ length: 6 }, (_, i) =>
      mkTrip({
        id: String(i + 1),
        dateDepartIso: isoDaysAgo(i % 3),
        date: isoDaysAgo(i % 3),
        status: 'Terminé',
        retardMinutes: 0,
        to: i < 3 ? 'Sfax' : 'Bizerte'
      })
    );
    component.refreshAll();
    expect(component.predictions).not.toBeNull();
    expect(component.predictions!.delayRisk).toBe('Faible');
    expect(component.predictions!.topDestinations.length).toBeGreaterThan(0);
    expect(component.predictions!.nextWeekTrips).toBeGreaterThan(0);
  });

  it('risque moyen quand le taux récent est entre 60 et 80', () => {
    component.allTrips = [
      mkTrip({ id: '1', status: 'Terminé', retardMinutes: 0 }),
      mkTrip({ id: '2', status: 'Terminé', retardMinutes: 0 }),
      mkTrip({ id: '3', status: 'Terminé', retardMinutes: 0 }),
      mkTrip({ id: '4', status: 'Terminé', retardMinutes: 30 }),
      mkTrip({ id: '5', status: 'Terminé', retardMinutes: 30 }),
      mkTrip({ id: '6', status: 'En Cours' })
    ];
    component.refreshAll();
    expect(component.predictions!.delayRisk).toBe('Moyen');
  });

  it('risque élevé sous 60% de ponctualité récente', () => {
    component.allTrips = [
      mkTrip({ id: '1', status: 'Terminé', retardMinutes: 60 }),
      mkTrip({ id: '2', status: 'Terminé', retardMinutes: 60 }),
      mkTrip({ id: '3', status: 'Terminé', retardMinutes: 0 }),
      mkTrip({ id: '4', status: 'Terminé', retardMinutes: 60 }),
      mkTrip({ id: '5', status: 'Terminé', retardMinutes: 60 })
    ];
    component.refreshAll();
    expect(component.predictions!.delayRisk).toBe('Élevé');
  });

  // ─── Health score ─────────────────────────────────────────────
  it('healthScore Excellent sur des données parfaites', () => {
    component.allTrips = [
      mkTrip({ status: 'Terminé', retardMinutes: 0 }),
      mkTrip({ id: '2', status: 'Terminé', retardMinutes: 0 })
    ];
    component.refreshAll();
    expect(component.healthScore.label).toBe('Excellent');
    expect(component.kpiScoreGlobal).toBeGreaterThanOrEqual(80);
  });

  it('healthScore Critique sur des données très dégradées', () => {
    component.allTrips = [
      mkTrip({ status: 'Terminé', retardMinutes: 90 }),
      mkTrip({ id: '2', status: 'Actif', retardMinutes: 90 }),
      mkTrip({ id: '3', status: 'Annulé' }),
      mkTrip({ id: '4', status: 'Planifié' })
    ];
    component.refreshAll();
    expect(component.healthScore.label).toBe('Critique');
  });

  it('healthScore reste cohérent entre les deux extrêmes', () => {
    component.allTrips = [
      mkTrip({ status: 'Terminé', retardMinutes: 0 }),
      mkTrip({ id: '2', status: 'Terminé', retardMinutes: 0 }),
      mkTrip({ id: '3', status: 'Annulé' }),
      mkTrip({ id: '4', status: 'Annulé' })
    ];
    component.refreshAll();
    expect(['Moyen', 'Excellent']).toContain(component.healthScore.label);
    expect(component.healthScore.breakdown.length).toBe(5);
  });

  // ─── Graphiques ───────────────────────────────────────────────
  it('buildEvolutionChart agrège les trajets des 8 dernières semaines', () => {
    component.allTrips = [
      mkTrip({ dateDepartIso: isoDaysAgo(0), status: 'Terminé', retardMinutes: 0, distanceKm: 120.45 }),
      mkTrip({ id: '2', dateDepartIso: isoDaysAgo(400) }),
      mkTrip({ id: '3', dateDepartIso: 'date-invalide' }),
      mkTrip({ id: '4', dateDepartIso: isoDaysAgo(-2) }),
      mkTrip({ id: '5', dateDepartIso: undefined, date: '' })
    ];
    component.refreshAll();
    expect(component.evolutionData.labels!.length).toBe(8);
    const tripsDs: number[] = component.evolutionData.datasets[0].data as number[];
    expect(tripsDs.reduce((a, b) => a + b, 0)).toBe(1);
    const distDs: number[] = component.evolutionData.datasets[1].data as number[];
    expect(distDs.reduce((a, b) => a + b, 0)).toBe(120.5);
  });

  it('buildDonutChart compte les trajets par type (fallback modulo id)', () => {
    component.allTrips = [mkTrip({ id: '3' }), mkTrip({ id: '1' }), mkTrip({ id: '2' })];
    component.refreshAll();
    expect(component.donutData.labels).toEqual(['Rapide', 'Économique', 'Écologique']);
    expect(component.donutData.datasets[0].data).toEqual([1, 1, 1]);
  });

  it('buildDelayChart calcule les pourcentages et le callback tooltip', () => {
    component.allTrips = [mkTrip({ retardMinutes: 0 }), mkTrip({ id: '2', retardMinutes: 20 })];
    component.refreshAll();
    expect(String(component.delayData.labels![0])).toContain('50%');
    const labelFn = (component.delayOptions as any).plugins.tooltip.callbacks.label;
    expect(labelFn({ parsed: 7 })).toBe(' 7 trajet(s)');
  });

  it('onGranularityChange reconstruit le graphique temporel (jour/mois/semaine)', () => {
    component.onGranularityChange('day');
    expect(component.temporalData.labels!.length).toBe(14);
    expect(component.temporalGranularity).toBe('day');
    component.onGranularityChange('month');
    expect(component.temporalData.labels!.length).toBe(12);
    component.onGranularityChange('week');
    expect(component.temporalData.labels!.length).toBe(8);
  });

  it('le graphique temporel place les trajets dans le bon bucket hebdo', () => {
    component.allTrips = [
      mkTrip({ dateDepartIso: isoDaysAgo(0) }),
      mkTrip({ id: '2', dateDepartIso: isoDaysAgo(8) })
    ];
    component.refreshAll();
    const counts: number[] = component.temporalData.datasets[0].data as number[];
    expect(counts.reduce((a, b) => a + b, 0)).toBe(2);
  });

  it('callbacks onHover des options de graphiques', () => {
    component.allTrips = [mkTrip()];
    component.refreshAll();
    const evo = component.evolutionOptions as any;
    const tgt1: any = { style: {} };
    evo.onHover({ native: { target: tgt1 } }, [{}]);
    expect(tgt1.style.cursor).toBe('pointer');
    const tgt2: any = { style: {} };
    evo.onHover({ native: { target: tgt2 } }, []);
    expect(tgt2.style.cursor).toBe('default');
    const tgt3: any = { style: {} };
    evo.onHover({ target: tgt3 }, [{}]);
    expect(tgt3.style.cursor).toBe('pointer');

    const donut = component.donutOptions as any;
    const tgt4: any = { style: {} };
    donut.onHover({ native: { target: tgt4 } }, [{}]);
    expect(tgt4.style.cursor).toBe('pointer');

    const delay = component.delayOptions as any;
    const tgt5: any = { style: {} };
    delay.onHover({ native: { target: tgt5 } }, []);
    expect(tgt5.style.cursor).toBe('default');

    const temp = component.temporalOptions as any;
    const tgt6: any = { style: {} };
    temp.onHover({ native: { target: tgt6 } }, [{}]);
    expect(tgt6.style.cursor).toBe('pointer');
  });

  // ─── Pagination ───────────────────────────────────────────────
  it('onPageChange pagine les trajets', () => {
    component.allTrips = Array.from({ length: 7 }, (_, i) => mkTrip({ id: String(i + 1) }));
    component.refreshAll();
    expect(component.paginatedTrips.length).toBe(5);
    component.onPageChange({ pageIndex: 1, pageSize: 5, length: 7 } as PageEvent);
    expect(component.paginatedTrips.length).toBe(2);
    expect(component.tripPageIndex).toBe(1);
  });

  // ─── Filtres ──────────────────────────────────────────────────
  it('la recherche filtre sur from/to/véhicule/chauffeur', () => {
    component.allTrips = [
      mkTrip({ from: 'Tunis', to: 'Sfax', vehicle: 'AA-100-AA', driver: 'Ali' }),
      mkTrip({ id: '2', from: 'Bizerte', to: 'Sousse', vehicle: 'ZZ-900-ZZ', driver: 'Mondher' })
    ];
    component.filterSearch = 'tunis';
    component.refreshAll();
    expect(component.filteredTrips.length).toBe(1);
    component.filterSearch = 'mondher';
    component.refreshAll();
    expect(component.filteredTrips.length).toBe(1);
    component.filterSearch = 'inexistant';
    component.refreshAll();
    expect(component.filteredTrips.length).toBe(0);
  });

  it('les filtres statut et dates combinés ; date invalide ignore la plage', () => {
    component.allTrips = [
      mkTrip({ status: 'Terminé', dateDepartIso: '2026-03-10T10:00:00Z' }),
      mkTrip({ id: '2', status: 'Annulé', dateDepartIso: '2026-03-11T10:00:00Z' }),
      mkTrip({ id: '3', status: 'Terminé', dateDepartIso: 'date-invalide' })
    ];
    component.filterStatus = 'Terminé';
    component.filterDateFrom = '2026-03-10';
    component.filterDateTo = '2026-03-10';
    component.refreshAll();
    expect(component.filteredTrips.length).toBe(2);
  });

  it('les gestionnaires de filtres réinitialisent la pagination', () => {
    component.allTrips = [mkTrip()];
    component.tripPageIndex = 3;
    component.onSearchChange();
    expect(component.tripPageIndex).toBe(0);
    component.tripPageIndex = 3;
    component.onOptTypeChange('Rapide');
    expect(component.filterOptType).toBe('Rapide');
    component.tripPageIndex = 3;
    component.onStatusChange('Terminé');
    expect(component.filterStatus).toBe('Terminé');
    component.tripPageIndex = 3;
    component.onDateFromChange('2026-01-01');
    expect(component.filterDateFrom).toBe('2026-01-01');
    component.tripPageIndex = 3;
    component.onDateToChange('2026-12-31');
    expect(component.filterDateTo).toBe('2026-12-31');
    component.refreshAll();
    /* le trajet par défaut satisfait tous ces filtres */
    expect(component.filteredTrips.length).toBe(1);
  });

  it('clearFilters() remet tous les filtres à zéro', () => {
    component.filterSearch = 'x';
    component.filterOptType = 'Rapide';
    component.filterStatus = 'Terminé';
    component.filterDateFrom = '2026-01-01';
    component.filterDateTo = '2026-12-31';
    component.clearFilters();
    expect(component.filterSearch).toBe('');
    expect(component.filterOptType).toBe('');
    expect(component.filterStatus).toBe('');
    expect(component.filterDateFrom).toBe('');
    expect(component.filterDateTo).toBe('');
    expect(component.tripPageIndex).toBe(0);
  });

  it('clearChartFilter() supprime le filtre de graphique', () => {
    component.allTrips = [mkTrip()];
    component.refreshAll();
    component.onChartClick({ active: [{ index: 0 }] }, 'optimization');
    expect(component.chartFilter).not.toBeNull();
    component.clearChartFilter();
    expect(component.chartFilter).toBeNull();
    expect(component.filterOptType).toBe('');
  });

  // ─── onChartClick ─────────────────────────────────────────────
  it('onChartClick ignore les événements sans élément actif ou index null', () => {
    component.refreshAll();
    component.onChartClick({} as any, 'delay');
    expect(component.chartFilter).toBeNull();
    component.onChartClick({ active: [{ index: null }] } as any, 'delay');
    expect(component.chartFilter).toBeNull();
  });

  it('onChartClick optimization sélectionne puis bascule (toggle)', () => {
    component.allTrips = [mkTrip({ id: '1' })];
    component.refreshAll();
    component.onChartClick({ active: [{ index: 0 }] }, 'optimization');
    expect(component.chartFilter?.type).toBe('optimization');
    expect(component.chartFilter?.value).toBe('Rapide');
    expect(component.chartFilter!.predicate(mkTrip({ id: '4' }))).toBeTrue();
    expect(component.chartFilter!.predicate(mkTrip({ id: '5' }))).toBeFalse();
    component.onChartClick({ active: [{ index: 0 }] }, 'optimization');
    expect(component.chartFilter).toBeNull();
  });

  it('onChartClick optimization ignore un label invalide', () => {
    component.refreshAll();
    component.donutData = { labels: ['Inconnu'] } as any;
    component.onChartClick({ active: [{ index: 0 }] }, 'optimization');
    expect(component.chartFilter).toBeNull();
  });

  it('onChartClick delay couvre les 4 seaux et le toggle', () => {
    component.allTrips = [
      mkTrip({ id: '1', retardMinutes: 0 }),
      mkTrip({ id: '2', retardMinutes: 10 }),
      mkTrip({ id: '3', retardMinutes: 30 }),
      mkTrip({ id: '4', retardMinutes: 90 })
    ];
    component.refreshAll();
    component.onChartClick({ active: [{ index: 1 }] }, 'delay');
    expect(component.chartFilter?.type).toBe('delay');
    expect(component.filteredTrips.every(t => (t.retardMinutes ?? 0) > 5 && (t.retardMinutes ?? 0) <= 15)).toBeTrue();
    component.onChartClick({ active: [{ index: 1 }] }, 'delay');
    expect(component.chartFilter).toBeNull();

    component.onChartClick({ active: [{ index: 0 }] }, 'delay');
    expect(component.filteredTrips.every(t => (t.retardMinutes ?? 0) <= 5)).toBeTrue();
    component.clearChartFilter();
    component.onChartClick({ active: [{ index: 2 }] }, 'delay');
    expect(component.filteredTrips.every(t => (t.retardMinutes ?? 0) > 15 && (t.retardMinutes ?? 0) <= 60)).toBeTrue();
    component.clearChartFilter();
    component.onChartClick({ active: [{ index: 3 }] }, 'delay');
    expect(component.filteredTrips.every(t => (t.retardMinutes ?? 0) > 60)).toBeTrue();
    component.clearChartFilter();
    component.onChartClick({ active: [{ index: 99 }] }, 'delay');
    expect(component.chartFilter).toBeNull();
  });

  it('onChartClick evolution filtre par semaine ; toggle via valeur identique', () => {
    /* idx=6 => fenêtre [now-7j, now) : déterministe (idx=7 = semaine en cours démarrant à new Date()) */
    component.allTrips = [mkTrip({ dateDepartIso: isoDaysAgo(3), date: isoDaysAgo(3) })];
    component.refreshAll();
    component.onChartClick({ active: [{ index: 6 }] }, 'evolution');
    expect(component.chartFilter?.type).toBe('evolution');
    expect(component.chartFilter!.predicate(mkTrip({ dateDepartIso: isoDaysAgo(3), date: isoDaysAgo(3) }))).toBeTrue();
    expect(component.chartFilter!.predicate(mkTrip({ id: '2', dateDepartIso: isoDaysAgo(-2), date: isoDaysAgo(-2) }))).toBeFalse();
    expect(component.chartFilter!.predicate(mkTrip({ id: '3', dateDepartIso: isoDaysAgo(60), date: isoDaysAgo(60) }))).toBeFalse();
    /* le toggle compare la valeur à String(idx) */
    component.chartFilter!.value = '6';
    component.onChartClick({ active: [{ index: 6 }] }, 'evolution');
    expect(component.chartFilter).toBeNull();
  });

  it('onChartClick evolution utilise un label de secours si absent', () => {
    component.refreshAll();
    component.evolutionData = {} as any;
    component.onChartClick({ active: [{ index: 2 }] }, 'evolution');
    expect(component.chartFilter?.value).toBe('Semaine 3');
  });

  it('onChartClick temporal couvre semaine/jour/mois et le toggle', () => {
    component.allTrips = [mkTrip({ dateDepartIso: isoDaysAgo(3), date: isoDaysAgo(3) })];
    component.refreshAll();
    /* idx=6 => fenêtre [now-7j, now) : déterministe */
    component.onChartClick({ active: [{ index: 6 }] }, 'temporal');
    expect(component.chartFilter?.type).toBe('temporal');
    expect(component.chartFilter!.predicate(mkTrip({ dateDepartIso: isoDaysAgo(3), date: isoDaysAgo(3) }))).toBeTrue();
    expect(component.chartFilter!.predicate(mkTrip({ id: '2', dateDepartIso: isoDaysAgo(-2), date: isoDaysAgo(-2) }))).toBeFalse();
    component.chartFilter!.value = '6';
    component.onChartClick({ active: [{ index: 6 }] }, 'temporal');
    expect(component.chartFilter).toBeNull();

    component.temporalGranularity = 'day';
    component.onChartClick({ active: [{ index: 13 }] }, 'temporal');
    expect(component.chartFilter?.type).toBe('temporal');
    component.clearChartFilter();
    component.temporalGranularity = 'month';
    component.onChartClick({ active: [{ index: 11 }] }, 'temporal');
    expect(component.chartFilter?.type).toBe('temporal');
  });

  it('onDriverClick filtre puis bascule', () => {
    component.allTrips = [
      mkTrip({ driverId: 'd1' }),
      mkTrip({ id: '2', driverId: 'd2' })
    ];
    component.refreshAll();
    component.onDriverClick('d1');
    expect(component.chartFilter?.type).toBe('driver');
    expect(component.filteredTrips.length).toBe(1);
    component.onDriverClick('d1');
    expect(component.chartFilter).toBeNull();
  });

  // ─── Carte Leaflet (mockée) ───────────────────────────────────
  it('initMap crée la carte et renderMap trace les couches', () => {
    component.allTrips = [
      mkTrip({ from: 'Tunis', to: 'Sfax' }),
      mkTrip({
        id: '2',
        from: 'ZoneIndustrielle',
        to: 'PortX',
        latitudeDepart: 36.8,
        longitudeDepart: 10.18,
        latitudeArrivee: 34.74,
        longitudeArrivee: 10.76
      })
    ];
    component.refreshAll();
    expect(L.map).not.toHaveBeenCalled();
    (component as any).initMap();
    expect(L.map).toHaveBeenCalledWith('delivery-destinations-map', jasmine.any(Object));
    expect(L.tileLayer).toHaveBeenCalled();
    (component as any).renderMap();
    expect(L.polyline).toHaveBeenCalled();
    expect(L.circleMarker).toHaveBeenCalled();
    const anyLayer: any = (L.polyline as jest.Mock).mock.results[0].value;
    expect(anyLayer.addTo).toHaveBeenCalled();
    expect(anyLayer.bindPopup).toHaveBeenCalled();
    expect((component as any).map.fitBounds).toHaveBeenCalled();
    expect((component as any).mapLayers.length).toBeGreaterThan(0);
  });

  it('toggleMapMode reconstruit les couches selon la source', () => {
    component.allTrips = [mkTrip(), mkTrip({ id: '2' })];
    (component as any).initMap();
    component.toggleMapMode(true);
    const callsAll = (L.polyline as jest.Mock).mock.calls.length;
    component.toggleMapMode(false);
    expect(component.mapShowAllDestinations).toBeFalse();
    expect((L.polyline as jest.Mock).mock.calls.length).toBeGreaterThanOrEqual(callsAll);
  });

  it('renderMap ne fait rien sans carte ni trajets filtrés', () => {
    component.refreshAll();
    expect(L.polyline).not.toHaveBeenCalled();
    const fake = { removeLayer: jest.fn(), remove: jest.fn(), invalidateSize: jest.fn(), fitBounds: jest.fn() };
    (component as any).map = fake;
    component.filteredTrips = [];
    component.mapShowAllDestinations = false;
    (component as any).renderMap();
    expect((component as any).mapLayers.length).toBe(0);
  });

  it('ngOnDestroy détruit la carte et ses couches', () => {
    component.allTrips = [mkTrip()];
    (component as any).initMap();
    (component as any).renderMap();
    const fakeMap = (component as any).map;
    component.ngOnDestroy();
    expect(fakeMap.remove).toHaveBeenCalled();
    expect((component as any).map).toBeNull();
  });

  // ─── Helpers de formatage ─────────────────────────────────────
  it('formatDuration gère N/A, minutes et heures', () => {
    expect(component.formatDuration(0)).toBe('N/A');
    expect(component.formatDuration(-5)).toBe('N/A');
    expect(component.formatDuration(45)).toBe('45 min');
    expect(component.formatDuration(90)).toBe('1h 30m');
  });

  it('formatDate gère undefined, invalide et valide', () => {
    expect(component.formatDate(undefined)).toBe('-');
    expect(component.formatDate('pas-une-date')).toBe('pas-une-date');
    expect(component.formatDate('2026-03-15T10:00:00Z')).toMatch(/\d{2}\/\d{2}\/\d{4}/);
  });

  it('getPerformanceLabel couvre tous les statuts', () => {
    const base = { dureeReelleMinutes: 60, dureeEstimeeMinutes: 60, distanceKm: 200 };
    expect(component.getPerformanceLabel(mkTrip({ status: 'Annulé' }))).toBe('Annulé');
    expect(component.getPerformanceLabel(mkTrip({ status: 'Planifié' }))).toBe('Planifié');
    expect(component.getPerformanceLabel(mkTrip({ status: 'En Cours', ...base, retardMinutes: 0 }))).toBe('En bonne voie');
    expect(
      component.getPerformanceLabel(
        mkTrip({ status: 'Actif', retardMinutes: 90, distanceKm: 5, dureeReelleMinutes: 120, dureeEstimeeMinutes: 10 })
      )
    ).toBe('À surveiller');
    expect(component.getPerformanceLabel(mkTrip({ status: 'Expédiée' }))).toBe('N/A');
    expect(component.getPerformanceLabel(mkTrip({ status: 'Terminé', ...base, retardMinutes: 0 }))).toContain('Excellent');
    expect(component.getPerformanceLabel(mkTrip({ status: 'Terminé', ...base, retardMinutes: 10 }))).toContain('Bon');
    /* score = 18(retard≤30) + 12(sans durées) + 2(dist<10) + 7.5(conso neutre) + 10(Terminé) = 50 => Moyen */
    expect(
      component.getPerformanceLabel(
        mkTrip({ status: 'Terminé', retardMinutes: 20, distanceKm: 3, dureeReelleMinutes: undefined })
      )
    ).toContain('Moyen');
    expect(
      component.getPerformanceLabel(mkTrip({ status: 'Terminé', retardMinutes: 90, distanceKm: 5, dureeReelleMinutes: undefined }))
    ).toContain('Faible');
  });

  it('getPerformanceClass mappe chaque libellé', () => {
    expect(component.getPerformanceClass('Excellent · x')).toBe('perf--ontime');
    expect(component.getPerformanceClass('Bon y')).toBe('perf--advance');
    expect(component.getPerformanceClass('Moyen z')).toBe('perf--slight');
    expect(component.getPerformanceClass('À surveiller')).toBe('perf--slight');
    expect(component.getPerformanceClass('Faible q')).toBe('perf--delayed');
    expect(component.getPerformanceClass('Annulé')).toBe('perf--delayed');
    expect(component.getPerformanceClass('Planifié')).toBe('perf--none');
    expect(component.getPerformanceClass('En bonne voie')).toBe('perf--none');
    expect(component.getPerformanceClass('autre')).toBe('perf--none');
  });

  it('getScorePerformance intègre la consommation du véhicule', () => {
    component.allVehicles = [mkVehicle({ id: 'v1', fuelConsumption: 30 })];
    component.allTrips = [];
    const efficient = mkTrip({
      vehicleId: 'v1',
      status: 'Terminé',
      retardMinutes: 0,
      distanceKm: 200,
      dureeReelleMinutes: 120,
      dureeEstimeeMinutes: 120
    });
    const inefficient = mkTrip({
      id: '2',
      vehicleId: 'v1',
      status: 'Terminé',
      retardMinutes: 90,
      distanceKm: 5,
      dureeReelleMinutes: 60,
      dureeEstimeeMinutes: 20
    });
    const noConso = mkTrip({ id: '3', vehicleId: 'vx', status: 'Terminé', retardMinutes: 0 });
    const sEff = component.getScorePerformance(efficient);
    const sIneff = component.getScorePerformance(inefficient);
    expect(sEff).toBeGreaterThan(0);
    expect(sIneff).toBeLessThan(sEff);
    expect(component.getScorePerformance(noConso)).toBeGreaterThan(0);
  });

  it('getScorePerformance gère les trajets sans durée ni distance', () => {
    const t = mkTrip({ status: 'En Cours', distanceKm: undefined, dureeReelleMinutes: undefined });
    const score = component.getScorePerformance(t);
    expect(score).toBeGreaterThanOrEqual(0);
    expect(score).toBeLessThanOrEqual(100);
  });

  it('getScoreBadgeClass et getScoreLabel respectent les seuils', () => {
    expect(component.getScoreBadgeClass(90)).toBe('score--excellent');
    expect(component.getScoreBadgeClass(85)).toBe('score--excellent');
    expect(component.getScoreBadgeClass(84)).toBe('score--good');
    expect(component.getScoreBadgeClass(65)).toBe('score--good');
    expect(component.getScoreBadgeClass(64)).toBe('score--average');
    expect(component.getScoreBadgeClass(40)).toBe('score--average');
    expect(component.getScoreBadgeClass(39)).toBe('score--weak');
    expect(component.getScoreLabel(85)).toBe('Excellent');
    expect(component.getScoreLabel(65)).toBe('Bon');
    expect(component.getScoreLabel(40)).toBe('Moyen');
    expect(component.getScoreLabel(10)).toBe('Faible');
  });

  it('getStatusClass couvre tous les statuts', () => {
    expect(component.getStatusClass('Terminé')).toBe('status--finished');
    expect(component.getStatusClass('En Cours')).toBe('status--active');
    expect(component.getStatusClass('Actif')).toBe('status--active');
    expect(component.getStatusClass('Planifié')).toBe('status--planned');
    expect(component.getStatusClass('Annulé')).toBe('status--cancelled');
    expect(component.getStatusClass('zzz')).toBe('');
  });

  it('getSeverityIcon et getAlertIcon retournent les icônes attendues', () => {
    expect(component.getSeverityIcon('danger')).toBe('error');
    expect(component.getSeverityIcon('warning')).toBe('warning');
    expect(component.getSeverityIcon('info')).toBe('info');
    expect(component.getSeverityIcon('autre')).toBe('info');
    expect(component.getAlertIcon('location_on')).toBe('location_on');
  });

  it('bestOptimization classe selon durée, ponctualité et rentabilité', () => {
    component.optStats = [
      { type: 'Rapide', count: 2, avgDist: 100, avgDelay: 10, avgDureeReelle: 60, onTimeRate: 90 },
      { type: 'Économique', count: 1, avgDist: 100, avgDelay: 5, avgDureeReelle: 120, onTimeRate: 95 },
      { type: 'Écologique', count: 0, avgDist: 0, avgDelay: 0, avgDureeReelle: 0, onTimeRate: 0 }
    ];
    expect(component.bestOptimization('plusRapide')).toBe('Rapide');
    expect(component.bestOptimization('plusPonctuel')).toBe('Économique');
    expect(component.bestOptimization('plusRentable')).toBe('Économique');
    expect(component.bestOptimization('inconnu')).toBe('—');
  });

  it('bestOptimization renvoie — sans statistiques', () => {
    component.optStats = [];
    expect(component.bestOptimization('plusRapide')).toBe('—');
    expect(component.bestOptimization('plusPonctuel')).toBe('—');
    expect(component.bestOptimization('plusRentable')).toBe('—');
  });

  it('getOptBadgeClass mappe les types', () => {
    expect(component.getOptBadgeClass('Rapide')).toBe('dc-opt-badge rapide');
    expect(component.getOptBadgeClass('Économique')).toBe('dc-opt-badge économique');
    expect(component.getOptBadgeClass('Écologique')).toBe('dc-opt-badge écologique');
    expect(component.getOptBadgeClass('X')).toBe('dc-opt-badge');
  });

  it('getTripOptimizationType reconnaît les mots-clés puis retombe sur modulo', () => {
    expect(component.getTripOptimizationType({ typeOptimisation: 'RAPIDE' } as any)).toBe('Rapide');
    expect(component.getTripOptimizationType({ routePreference: 'fast-route' } as any)).toBe('Rapide');
    expect(component.getTripOptimizationType({ routePreference: 'SPEED' } as any)).toBe('Rapide');
    expect(component.getTripOptimizationType({ typeOptimisation: 'eco' } as any)).toBe('Écologique');
    expect(component.getTripOptimizationType({ routePreference: 'green' } as any)).toBe('Écologique');
    expect(component.getTripOptimizationType({ typeOptimisation: 'vert' } as any)).toBe('Écologique');
    expect(component.getTripOptimizationType({ routePreference: 'shortest' } as any)).toBe('Économique');
    expect(component.getTripOptimizationType({ routePreference: 'tarif-min' } as any)).toBe('Économique');
    expect(component.getTripOptimizationType(mkTrip({ id: '3' }))).toBe('Écologique');
    expect(component.getTripOptimizationType(mkTrip({ id: '1' }))).toBe('Rapide');
    expect(component.getTripOptimizationType(mkTrip({ id: '2' }))).toBe('Économique');
  });
});
