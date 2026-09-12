import { ComponentFixture, TestBed } from '@angular/core/testing';
import { TripsMapComponent } from './trips-map.component';
import { provideRouter } from '@angular/router';
import { FleetService, TripMapItem } from '../../core/services/fleet.service';
import { of } from 'rxjs';

// ─── Mock complet du module leaflet (jsdom ne rend pas de cartes) ──
jest.mock('leaflet', () => {
  const store: any = { maps: [], tileLayers: [], markers: [], polylines: [], icons: [] };
  (globalThis as any).__LEAFLET_STORE__ = store;

  const makeLayer = (kind: string) => {
    const layer: any = { __kind: kind, __handlers: {} };
    layer.addTo = jest.fn(() => layer);
    layer.remove = jest.fn();
    layer.on = jest.fn((event: string, cb: any) => {
      layer.__handlers[event] = cb;
      return layer;
    });
    layer.off = jest.fn(() => layer);
    layer.bindPopup = jest.fn(() => layer);
    layer.openPopup = jest.fn();
    layer.closePopup = jest.fn();
    return layer;
  };

  const makeMap = () => {
    const map: any = { __kind: 'map' };
    map.removeLayer = jest.fn();
    map.fitBounds = jest.fn();
    map.invalidateSize = jest.fn();
    map.remove = jest.fn();
    store.maps.push(map);
    return map;
  };

  return {
    map: jest.fn((id: string, options: any) => {
      const map = makeMap();
      map.__id = id;
      map.__options = options;
      return map;
    }),
    tileLayer: jest.fn((url: string, options: any) => {
      const layer = makeLayer('tile');
      layer.__url = url;
      layer.__options = options;
      store.tileLayers.push(layer);
      return layer;
    }),
    marker: jest.fn((coords: any, options: any) => {
      const layer = makeLayer('marker');
      layer.__coords = coords;
      layer.__options = options;
      store.markers.push(layer);
      return layer;
    }),
    polyline: jest.fn((coords: any, options: any) => {
      const layer = makeLayer('polyline');
      layer.__coords = coords;
      layer.__options = options;
      store.polylines.push(layer);
      return layer;
    }),
    divIcon: jest.fn((options: any) => {
      store.icons.push(options);
      return options;
    })
  };
});

describe('TripsMapComponent', () => {
  let component: TripsMapComponent;
  let fixture: ComponentFixture<TripsMapComponent>;
  let store: any;

  let tripsResponse: TripMapItem[];
  let getTripsCarteSpy: any;

  let intervalCallbacks: Array<() => void>;
  let timeoutCallbacks: Array<() => void>;

  /* Les mocks leaflet sont des jest.fn bruts : API .mock, pas .calls jasmine */
  const lastArgs = (fn: any): any[] => ((fn && fn.mock && fn.mock.calls) || []).slice(-1)[0] ?? [];
  const popupHtml = (layer: any): string => lastArgs(layer.bindPopup)[0] ?? '';

  const baseTrip: TripMapItem = {
    id: 't1',
    pointDepart: 'Tunis',
    destination: 'Sousse',
    latitudeDepart: 36.8,
    longitudeDepart: 10.18,
    latitudeArrivee: 35.82,
    longitudeArrivee: 10.64,
    distanceKm: 120.56,
    statut: 'En Cours',
    vehiculeId: 'v1',
    vehiculeMatricule: '123-TN-11',
    vehiculeCouleur: '#ff0000',
    vehiculeLatitude: 36.4,
    vehiculeLongitude: 10.5,
    vehiculeVitesse: 80,
    chauffeurNom: 'Ali Ben Salah',
    geometrieItineraire: JSON.stringify({
      type: 'FeatureCollection',
      features: [{
        type: 'Feature',
        geometry: { type: 'LineString', coordinates: [[10.18, 36.8], [10.4, 36.6], [10.64, 35.82]] }
      }]
    })
  };

  const resetLeafletStore = () => {
    store.maps.length = 0;
    store.tileLayers.length = 0;
    store.markers.length = 0;
    store.polylines.length = 0;
    store.icons.length = 0;
  };

  beforeEach(async () => {
    store = (globalThis as any).__LEAFLET_STORE__;
    resetLeafletStore();

    intervalCallbacks = [];
    timeoutCallbacks = [];
    // Bloque les vrais timers : les callbacks sont stockés et déclenchés à la main
    spyOn(window, 'setInterval').and.callFake(((cb: () => void) => {
      intervalCallbacks.push(cb);
      return 123 as any;
    }) as any);
    spyOn(window, 'clearInterval').and.stub();
    spyOn(window, 'setTimeout').and.callFake(((cb: () => void) => {
      timeoutCallbacks.push(cb);
      return 456 as any;
    }) as any);

    tripsResponse = [
      { ...baseTrip },
      { ...baseTrip, id: 't2', statut: 'Actif' },
      { ...baseTrip, id: 't3', statut: 'ACTIF' },
      { ...baseTrip, id: 't4', statut: 'Termine' }
    ];

    getTripsCarteSpy = jasmine.createSpy('getTripsCarte').and.callFake(() => of(tripsResponse));

    await TestBed.configureTestingModule({
      imports: [TripsMapComponent],
      providers: [
        provideRouter([]),
        { provide: FleetService, useValue: { getTripsCarte: getTripsCarteSpy } }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(TripsMapComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  afterEach(() => {
    timeoutCallbacks.forEach(cb => cb());
    timeoutCallbacks = [];
    intervalCallbacks = [];
    try {
      fixture.destroy();
    } catch {
      /* déjà détruite par un test */
    }
  });

  it('should create, init the Leaflet map and schedule a 10s refresh timer', () => {
    expect(component).toBeTruthy();

    // Carte initialisée sur le conteneur avec centre/zoom
    expect(store.maps.length).toBe(1);
    expect(store.maps[0].__id).toBe('trips-live-map');
    expect(store.maps[0].__options.center).toEqual([36.8065, 10.1815]);
    expect(store.maps[0].__options.zoom).toBe(7);

    // Tuiles OSM ajoutées à la carte
    expect(store.tileLayers.length).toBe(1);
    expect(store.tileLayers[0].__url).toContain('openstreetmap.org');
    expect(store.tileLayers[0].addTo).toHaveBeenCalledWith(store.maps[0]);

    // Timer de rafraîchissement
    expect(intervalCallbacks.length).toBe(1);
    expect((window.setInterval as any).calls.mostRecent().args[1]).toBe(10000);
  });

  it('should keep only active trips (En Cours / Actif / ACTIF)', () => {
    expect(component.trips.length).toBe(3);
    expect(component.activeTrips).toBe(component.trips);
    expect(component.trips.map(t => t.id)).toEqual(['t1', 't2', 't3']);
  });

  it('should render routes, point markers, vehicle markers and fit bounds', () => {
    // 3 trajets actifs : 1 polyline + marqueur départ + arrivée + véhicule chacun
    expect(store.polylines.length).toBe(3);
    expect(store.markers.length).toBe(9);

    // Coordonnées inversées [lat, lon] depuis la géométrie GeoJSON
    expect(store.polylines[0].__coords).toEqual([[36.8, 10.18], [36.6, 10.4], [35.82, 10.64]]);
    expect(store.polylines[0].__options).toEqual({ color: '#ff0000', weight: 5, opacity: 0.8 });
    expect(store.polylines[0].addTo).toHaveBeenCalledWith(store.maps[0]);

    // Bounds ajustés avec padding (plus d'un point)
    expect(store.maps[0].fitBounds).toHaveBeenCalled();
    const fitArgs = lastArgs(store.maps[0].fitBounds);
    expect(fitArgs[1]).toEqual({ padding: [24, 24] });
  });

  it('should build div icons and popups with trip details', () => {
    const pinIcon = store.icons.find((i: any) => i.className === 'trip-map-pin');
    expect(pinIcon.html).toContain('#ff0000');
    expect(pinIcon.html).toContain('123-TN-11');

    const pointIcon = store.icons.find((i: any) => i.className === 'trip-map-point');
    expect(pointIcon.html).toContain('Départ');

    // Marqueur départ : popup "Point de départ"
    const startMarker = store.markers.find(
      (m: any) => m.__coords[0] === 36.8 && m.__coords[1] === 10.18
    );
    expect(popupHtml(startMarker)).toContain('Point de départ');
    expect(popupHtml(startMarker)).toContain('Tunis');

    // Marqueur arrivée
    const endMarker = store.markers.find(
      (m: any) => m.__coords[0] === 35.82 && m.__coords[1] === 10.64
    );
    expect(popupHtml(endMarker)).toContain('arrivée');

    // Marqueur véhicule : popup détaillée + interactions survol
    const vehicleMarker = store.markers.find(
      (m: any) => m.__coords[0] === 36.4 && m.__coords[1] === 10.5
    );
    const html = popupHtml(vehicleMarker);
    expect(html).toContain('123-TN-11');
    expect(html).toContain('Ali Ben Salah');
    expect(html).toContain('En Cours');
    expect(html).toContain('80 km/h');
    expect(html).toContain('120.6 km');

    vehicleMarker.__handlers['mouseover']();
    expect(vehicleMarker.openPopup).toHaveBeenCalled();
    vehicleMarker.__handlers['mouseout']();
    expect(vehicleMarker.closePopup).toHaveBeenCalled();
  });

  it('should show N/A in popup when speed and distance are missing', () => {
    resetLeafletStore();
    (component as any).trips = [{
      ...baseTrip,
      distanceKm: undefined,
      vehiculeVitesse: undefined,
      chauffeurNom: undefined,
      vehiculeMatricule: undefined
    }];
    (component as any).renderTrips();

    const vehicleMarker = store.markers.find((m: any) => m.__kind === 'marker' && m.__options.icon.className === 'trip-map-pin');
    const html = popupHtml(vehicleMarker);
    expect(html).toContain('Véhicule');
    expect(html).toContain('Chauffeur non renseigné');
    expect(html).toContain('N/A');
  });

  it('should not fit bounds when fewer than two points are available', () => {
    (store.maps[0].fitBounds as any).mockClear();
    /* Aucune coordonnée exploitable : aucun point n'alimente les bounds */
    (component as any).trips = [{
      ...baseTrip,
      geometrieItineraire: undefined,
      latitudeDepart: undefined,
      longitudeDepart: undefined,
      latitudeArrivee: undefined,
      longitudeArrivee: undefined,
      vehiculeLatitude: undefined,
      vehiculeLongitude: undefined,
      vehiculeVitesse: 90
    }];
    (component as any).renderTrips();

    expect(store.maps[0].fitBounds).not.toHaveBeenCalled();
  });

  // ─── buildRouteLayer : variantes GeoJSON ──────────────────────
  it('should parse Feature geometry and raw coordinate payloads', () => {
    // Variante "Feature"
    resetLeafletStore();
    (component as any).trips = [{
      ...baseTrip,
      id: 'f1',
      geometrieItineraire: JSON.stringify({ type: 'Feature', geometry: { coordinates: [[1, 2], [3, 4]] } })
    }];
    (component as any).renderTrips();
    expect(store.polylines.some((p: any) =>
      JSON.stringify(p.__coords) === '[[2,1],[4,3]]')).toBeTrue();

    // Variante payload brut avec coordinates directement
    resetLeafletStore();
    (component as any).trips = [{
      ...baseTrip,
      id: 'f2',
      geometrieItineraire: JSON.stringify({ coordinates: [[7, 8], [9, 10]] })
    }];
    (component as any).renderTrips();
    expect(store.polylines.some((p: any) =>
      JSON.stringify(p.__coords) === '[[8,7],[10,9]]')).toBeTrue();
  });

  it('should skip routes with less than two coordinates', () => {
    resetLeafletStore();
    (component as any).trips = [{
      ...baseTrip,
      geometrieItineraire: JSON.stringify({ geometry: { coordinates: [[5, 6]] } })
    }];
    (component as any).renderTrips();

    expect(store.polylines.length).toBe(0);
  });

  it('should tolerate malformed geometry JSON without crashing', () => {
    resetLeafletStore();
    (component as any).trips = [{
      ...baseTrip,
      id: 'broken',
      geometrieItineraire: '{not json'
    }];
    (component as any).renderTrips();

    expect(store.polylines.length).toBe(0);
    // Pas de route, mais départ/arrivée/véhicule résolus via les champs explicites
    expect(store.markers.filter((m: any) => m.__kind === 'marker').length).toBe(3);
  });

  // ─── resolveVehiclePoint : priorités de positionnement ────────
  it('should place stopped vehicles (vitesse 0) at their arrival point', () => {
    resetLeafletStore();
    (component as any).trips = [{ ...baseTrip, vehiculeLatitude: undefined, vehiculeLongitude: undefined, vehiculeVitesse: 0 }];
    (component as any).renderTrips();

    const vehicleMarker = store.markers.find((m: any) => m.__options.icon.className === 'trip-map-pin');
    expect(vehicleMarker.__coords).toEqual([35.82, 10.64]);
  });

  it('should fall back to departure point when vehicle has no GPS data', () => {
    resetLeafletStore();
    (component as any).trips = [{
      ...baseTrip,
      vehiculeLatitude: undefined,
      vehiculeLongitude: undefined,
      vehiculeVitesse: undefined
    }];
    (component as any).renderTrips();

    const vehicleMarker = store.markers.find((m: any) => m.__options.icon.className === 'trip-map-pin');
    expect(vehicleMarker.__coords).toEqual([36.8, 10.18]);
  });

  // ─── timers et cycle de vie ───────────────────────────────────
  it('refresh timer should reload trips periodically', () => {
    expect(getTripsCarteSpy).toHaveBeenCalledTimes(1); // appel initial du ngOnInit

    intervalCallbacks.forEach(cb => cb());

    expect(getTripsCarteSpy).toHaveBeenCalledTimes(2);
  });

  it('ngOnDestroy should clear interval, remove layers/markers and destroy the map', () => {
    fixture.destroy();

    expect(window.clearInterval).toHaveBeenCalledWith(123);
    store.markers.forEach((m: any) => expect(m.remove).toHaveBeenCalled());
    // Chaque couche enregistrée a été retirée de la carte (tuiles + routes + marqueurs)
    expect(store.maps[0].removeLayer.mock.calls.length).toBeGreaterThanOrEqual(3);
    expect(store.maps[0].remove).toHaveBeenCalled();
  });

  it('initMap should be idempotent and renderTrips should exit safely without map', () => {
    (component as any).initMap();
    expect(store.maps.length).toBe(1); // pas de deuxième L.map()

    (component as any).map = null;
    (component as any).renderTrips();
    expect(store.markers.length).toBe(9); // inchangé : sortie anticipée
  });

  // ─── Branches manquantes ──────────────────────────────────────

  it('should use default color #3b82f6 when vehiculeCouleur is not set', () => {
    resetLeafletStore();
    (component as any).trips = [{ ...baseTrip, vehiculeCouleur: undefined }];
    (component as any).renderTrips();
    expect(store.polylines.length).toBe(1);
    expect(store.polylines[0].__options.color).toBe('#3b82f6');
    // L'icône du véhicule doit aussi utiliser la couleur par défaut
    const pinIcon = store.icons.find((i: any) => i.className === 'trip-map-pin');
    expect(pinIcon.html).toContain('#2563eb');
  });

  it('should return null from resolveStartPoint when geometry JSON is malformed', () => {
    // Supprime les coords explicites pour forcer l'utilisation de la géométrie
    const trip = { ...baseTrip, latitudeDepart: undefined, longitudeDepart: undefined, geometrieItineraire: '{bad json' };
    const result = (component as any).resolveStartPoint(trip);
    expect(result).toBeNull();
  });

  it('should return null from resolveEndPoint when geometry JSON is malformed', () => {
    const trip = { ...baseTrip, latitudeArrivee: undefined, longitudeArrivee: undefined, geometrieItineraire: '{bad json' };
    const result = (component as any).resolveEndPoint(trip);
    expect(result).toBeNull();
  });

  it('should use startCoords as fallback in resolveVehiclePoint when vehiculeVitesse is 0 but no endCoords', () => {
    // vitesse 0 → endCoords || startCoords
    const trip = { ...baseTrip, latitudeArrivee: undefined, longitudeArrivee: undefined, geometrieItineraire: undefined, vehiculeLatitude: undefined, vehiculeLongitude: undefined, vehiculeVitesse: 0 };
    const startCoords: L.LatLngExpression = [36.8, 10.18];
    const result = (component as any).resolveVehiclePoint(trip, startCoords, null);
    expect(result).toEqual([36.8, 10.18]);
  });

  it('ngOnDestroy should handle null refreshTimer gracefully', () => {
    (component as any).refreshTimer = null;
    (window.clearInterval as any).calls.reset();
    expect(() => component.ngOnDestroy()).not.toThrow();
    expect(window.clearInterval).not.toHaveBeenCalled();
  });
});
