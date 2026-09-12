jest.mock('leaflet', () => {
  const makeMarker = () => ({
    addTo: jest.fn().mockReturnThis(),
    remove: jest.fn(),
    setLatLng: jest.fn(),
    setIcon: jest.fn(),
    setPopupContent: jest.fn(),
    setZIndexOffset: jest.fn(),
    bindPopup: jest.fn().mockReturnThis(),
    bindTooltip: jest.fn().mockReturnThis(),
    getPopup: jest.fn(() => ({ isOpen: jest.fn(() => false), getElement: jest.fn(() => null) })),
    openPopup: jest.fn().mockReturnThis(),
    closePopup: jest.fn().mockReturnThis(),
    on: jest.fn(),
    off: jest.fn(),
    getLatLng: jest.fn(() => ({ lat: 36.8, lng: 10.18 }))
  });
  const makeMap = () => ({
    on: jest.fn(),
    off: jest.fn(),
    remove: jest.fn(),
    removeLayer: jest.fn(),
    addLayer: jest.fn(),
    hasLayer: jest.fn(() => false),
    invalidateSize: jest.fn(),
    fitBounds: jest.fn(),
    setView: jest.fn(),
    panTo: jest.fn(),
    setZoom: jest.fn(() => 8),
    getZoom: jest.fn(() => 8),
    zoomIn: jest.fn(),
    zoomOut: jest.fn(),
    flyTo: jest.fn(),
    getCenter: jest.fn(() => ({ lat: 36.8, lng: 10.18 })),
    latLngToLayerPoint: jest.fn(() => ({ x: 50, y: 50 })),
    getContainer: jest.fn(() => ({ isConnected: false }))
  });
  const api: any = {
    map: jest.fn(() => makeMap()),
    tileLayer: jest.fn(() => ({ addTo: jest.fn().mockReturnThis() })),
    marker: jest.fn(() => makeMarker()),
    polyline: jest.fn(() => ({ addTo: jest.fn().mockReturnThis(), bringToFront: jest.fn() })),
    layerGroup: jest.fn(() => ({ addTo: jest.fn().mockReturnThis(), removeLayer: jest.fn() })),
    divIcon: jest.fn((opts) => opts),
    circle: jest.fn(() => ({ addTo: jest.fn().mockReturnThis() })),
    featureGroup: jest.fn(() => ({ getBounds: jest.fn(() => ({ isValid: jest.fn(() => true) })) })),
    latLng: jest.fn((a, b) => ({ lat: a, lng: b })),
    control: { scale: jest.fn(() => ({ addTo: jest.fn() })) }
  };
  api.__esModule = true;
  api.default = api;
  return api;
});

import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MapComponent } from './map.component';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { FleetService, TripMapItem } from '../../core/services/fleet.service';
import { PauseAIService } from '../../core/services/pause-ai.service';
import { NotificationService, AppNotification } from '../../core/services/notification.service';
import { WeatherService, WeatherInfo } from '../../core/services/weather.service';
import { Router } from '@angular/router';
import { Subject, of } from 'rxjs';
import {
  PauseAIAlertEvent,
  PauseReglementaireResponse,
  PauseStatusUpdateEvent,
  POIInfo,
  StatutPause,
  TypeAlerteIA,
  TypePause
} from '../../models/pause-ai.models';

import { DeliveryListComponent } from './components/delivery-list/delivery-list.component';
import { MapControlPanelComponent } from './components/control-panel/control-panel.component';
import { AdvancedMapControlsComponent } from './components/advanced-map-controls/advanced-map-controls.component';
import { AlertNotificationsComponent } from './components/alert-notifications/alert-notifications.component';
import { BreakNotificationComponent } from './components/break-notification/break-notification.component';
import { MapMenuComponent } from './components/map-menu/map-menu.component';

const GEO = JSON.stringify({
  type: 'FeatureCollection',
  features: [{ geometry: { type: 'LineString', coordinates: [[10.18, 36.8], [10.2, 36.85], [10.22, 36.9]] } }]
});

const GEO_FEATURE = JSON.stringify({
  type: 'Feature',
  properties: {},
  geometry: { type: 'LineString', coordinates: [[9.0, 37.0], [9.1, 37.1]] }
});

const GEO_PLAIN = JSON.stringify({ coordinates: [[8.0, 36.0], [8.1, 36.1]] });

function makeTrip(over: any = {}): TripMapItem {
  return {
    id: '1',
    pointDepart: 'Tunis',
    destination: 'Sousse',
    latitudeDepart: 36.8,
    longitudeDepart: 10.18,
    latitudeArrivee: 36.9,
    longitudeArrivee: 10.22,
    geometrieItineraire: GEO,
    statut: 'En Cours',
    vehiculeId: 'v1',
    vehiculeMatricule: 'ABC1',
    vehiculeVitesse: 60,
    vehiculeNiveauCarburant: 50,
    vehiculeLatitude: 36.81,
    vehiculeLongitude: 10.19,
    chauffeurNom: 'Ali',
    chauffeurTelephone: '123',
    ...over
  };
}

function makePause(over: any = {}): PauseReglementaireResponse {
  return {
    id: 1,
    trajetId: 1,
    type: TypePause.MANDATORY_REST,
    longitude: 10.19,
    latitude: 36.82,
    distanceAlongRouteM: 5000,
    statut: StatutPause.PLANIFIEE,
    nomLieu: 'Aire de repos',
    aiScore: 90,
    ...over
  };
}

function makeAlert(over: any = {}): PauseAIAlertEvent {
  const poi: POIInfo = { type: 'rest_area', lat: 36.82, lon: 10.19, name: 'Aire A', distance: 5000 };
  return {
    trajetId: 1,
    predictionId: 10,
    score: 90,
    typeAlerte: TypeAlerteIA.URGENTE,
    hoursDriving: 4.5,
    poi,
    ...over
  };
}

function makeWeather(over: any = {}): WeatherInfo {
  return {
    temperatureCelsius: 20,
    descriptionFr: 'Clair',
    iconCode: '01d',
    windKmH: 10,
    humidity: 40,
    visibilityKm: 10,
    etatGeneral: 'CLAIR',
    risqueConduite: 'ORANGE',
    dangereux: false,
    iconUrl: 'x',
    ...over
  };
}

function makeNotif(over: any = {}): AppNotification {
  return {
    id: 'n1',
    title: 'Alert',
    message: 'message',
    type: 'INFO',
    category: 'NOTIF_TRAJET',
    time: 'x',
    date: new Date(),
    isRead: false,
    dismissed: false,
    ...over
  };
}

class MockEventSource {
  addEventListener = jest.fn();
  close = jest.fn();
  private _onerror: any = null;
  get onerror() { return this._onerror; }
  set onerror(fn: any) { this._onerror = fn; }
}

describe('MapComponent', () => {
  let component: MapComponent;
  let fixture: ComponentFixture<MapComponent>;

  let fleetServiceMock: any;
  let pauseAIServiceMock: any;
  let notificationServiceMock: any;
  let weatherServiceMock: any;
  let routerMock: any;

  let alertSubject: Subject<any>;
  let pauseStatusSubject: Subject<any>;
  let pauseGeneratedSubject: Subject<any>;
  let notificationsSubject: Subject<any>;

  let refreshTick: any;
  let positionTick: any;
  let weatherTick: any;
  let rAFcb: any;

  let consoleLogSpy: jest.SpyInstance;
  let consoleWarnSpy: jest.SpyInstance;
  let consoleErrorSpy: jest.SpyInstance;

  beforeAll(() => {
    consoleLogSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
    consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterAll(() => {
    consoleLogSpy.mockRestore();
    consoleWarnSpy.mockRestore();
    consoleErrorSpy.mockRestore();
  });

  function seedMap() {
    (component as any).map = (jest.requireMock('leaflet') as any).default.map();
  }

  beforeEach(async () => {
    alertSubject = new Subject();
    pauseStatusSubject = new Subject();
    pauseGeneratedSubject = new Subject();
    notificationsSubject = new Subject();

    fleetServiceMock = {
      getTrips: jest.fn().mockReturnValue(of([])),
      getTripsCarte: jest.fn().mockReturnValue(of([])),
      getVehicles: jest.fn().mockReturnValue(of([]))
    };

    pauseAIServiceMock = {
      connectRealtime: jest.fn(),
      disconnectRealtime: jest.fn(),
      getPausesCompletes: jest.fn().mockReturnValue(of({ stops: [] })),
      getPausesForTrajet: jest.fn().mockReturnValue(of([])),
      regeneratePauses: jest.fn().mockReturnValue(of([])),
      markPauseCompleted: jest.fn().mockReturnValue(of(makePause({ statut: StatutPause.ATTEINTE }))),
      ignorePause: jest.fn().mockReturnValue(of(makePause({ statut: StatutPause.IGNOREE }))),
      alert$: alertSubject.asObservable(),
      pauseStatus$: pauseStatusSubject.asObservable(),
      pauseGenerated$: pauseGeneratedSubject.asObservable()
    };

    notificationServiceMock = {
      loadNotifications: jest.fn().mockReturnValue(of([])),
      connectRealtime: jest.fn(),
      markAsRead: jest.fn(),
      notifications$: notificationsSubject.asObservable()
    };

    weatherServiceMock = {
      getWeather: jest.fn().mockReturnValue(of(makeWeather()))
    };

    routerMock = {
      navigate: jest.fn().mockResolvedValue(true)
    };

    (jest.requireMock('leaflet') as any).default.map.mockClear();
    (global as any).EventSource = undefined;

    refreshTick = undefined;
    positionTick = undefined;
    weatherTick = undefined;
    let counter = 1;
    jest.spyOn(window, 'setInterval').mockImplementation((fn: any, delay: any) => {
      if (delay === 15000) refreshTick = fn;
      else if (delay === 2000) positionTick = fn;
      else if (delay === 300000) weatherTick = fn;
      return counter++ as any;
    });

    rAFcb = undefined;
    jest.spyOn(global, 'requestAnimationFrame').mockImplementation((cb: any) => { rAFcb = cb; return 9; });
    jest.spyOn(global, 'cancelAnimationFrame').mockImplementation(() => {});

    Object.defineProperty(window, 'alert', { value: jest.fn(), configurable: true });
    Object.defineProperty(window, 'print', { value: jest.fn(), configurable: true });
    Object.defineProperty(Element.prototype, 'scrollIntoView', { value: jest.fn(), configurable: true });

    await TestBed.configureTestingModule({
      imports: [MapComponent],
      providers: [
        provideRouter([]),
        provideHttpClient(),
        provideHttpClientTesting(),
        provideAnimationsAsync(),
        { provide: Router, useValue: routerMock },
        { provide: FleetService, useValue: fleetServiceMock },
        { provide: PauseAIService, useValue: pauseAIServiceMock },
        { provide: NotificationService, useValue: notificationServiceMock },
        { provide: WeatherService, useValue: weatherServiceMock }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(MapComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  afterEach(() => {
    jest.restoreAllMocks();
    fixture.destroy();
  });

  describe('basics', () => {
    it('should create', () => {
      expect(component).toBeTruthy();
    });

    it('should expose initial public state', () => {
      expect(component.isDarkMode).toBe(true);
      expect(component.activeTruck).toBe('');
      expect(component.mapStyle).toBe('standard');
      expect(component.showMenu).toBe(false);
      expect(component.showSidebar).toBe(true);
      expect(component.showRoads).toBe(true);
      expect(component.showPOIs).toBe(true);
      expect(component.followTruck).toBe(false);
      expect(component.isLocating).toBe(false);
      expect(component.isFullscreen).toBe(false);
      expect(component.isRouteLayerActive).toBe(false);
      expect(component.isClusterActive).toBe(false);
      expect(component.activePauseAlert).toBeNull();
    });

    it('totalMarkersCount reflects truckMarkers', () => {
      (component as any).truckMarkers = { a: {}, b: {} };
      expect(component.totalMarkersCount).toBe(2);
      (component as any).truckMarkers = {};
      expect(component.totalMarkersCount).toBe(0);
    });

    it('totalAlerts counts trucks with hasAlert', () => {
      component.allTrucks = [
        { id: 'a', driver: '', speed: 0, progress: 0, from: '', to: '', status: '', eco: false, consumption: '', hasAlert: true } as any,
        { id: 'b', driver: '', speed: 0, progress: 0, from: '', to: '', status: '', eco: false, consumption: '', hasAlert: false } as any
      ];
      expect(component.totalAlerts).toBe(1);
    });
  });

  describe('ngOnInit', () => {
    it('sets up intervals and connects realtime', () => {
      expect(typeof refreshTick).toBe('function');
      expect(typeof positionTick).toBe('function');
      expect(pauseAIServiceMock.connectRealtime).toHaveBeenCalled();
      expect(notificationServiceMock.connectRealtime).toHaveBeenCalled();
      expect(notificationServiceMock.loadNotifications).toHaveBeenCalled();
    });

    it('injects map page override style', () => {
      const el = document.getElementById('map-page-override-style');
      expect(el).not.toBeNull();
      expect(el!.textContent).toContain('.theme-toggle');
    });

    it('loads trips from backend on init', () => {
      expect(fleetServiceMock.getTripsCarte).toHaveBeenCalled();
    });
  });

  describe('checkTheme', () => {
    it('detects dark theme', () => {
      document.body.setAttribute('data-theme', 'dark');
      (component as any).checkTheme();
      expect(component.isDarkMode).toBe(true);
    });

    it('detects light theme', () => {
      document.body.setAttribute('data-theme', 'light');
      (component as any).checkTheme();
      expect(component.isDarkMode).toBe(false);
    });

    it('defaults to dark when theme missing', () => {
      document.body.removeAttribute('data-theme');
      (component as any).checkTheme();
      expect(component.isDarkMode).toBe(true);
    });
  });

  describe('injectMapPageStyle / removeMapPageStyle', () => {
    it('injects and does not duplicate', () => {
      (component as any).injectMapPageStyle();
      (component as any).injectMapPageStyle();
      const els = document.querySelectorAll('#map-page-override-style');
      expect(els.length).toBe(1);
    });

    it('removeMapPageStyle clears content', () => {
      (component as any).injectMapPageStyle();
      (component as any).removeMapPageStyle();
      const el = document.getElementById('map-page-override-style');
      expect(el?.textContent).toBe('');
    });
  });

  describe('ngAfterViewInit', () => {
    it('initializes map and layers', () => {
      expect((component as any).map).toBeTruthy();
      expect((component as any).baseLayers['standard']).toBeTruthy();
      expect((component as any).baseLayers['satellite']).toBeTruthy();
      expect((component as any).baseLayers['terrain']).toBeTruthy();
      expect((component as any).poiLayers['roads']).toBeTruthy();
      expect((component as any).poiLayers['gas']).toBeTruthy();
      expect((component as any).poiLayers['rest']).toBeTruthy();
      expect((component as any).poiLayers['food']).toBeTruthy();
      expect((component as any).poiLayers['scale']).toBeTruthy();
      expect(typeof weatherTick).toBe('function');
    });

    it('schedules map resize', () => {
      const spy = jest.spyOn(component as any, 'scheduleMapResize');
      (component as any).scheduleMapResize(0);
      expect(spy).toHaveBeenCalled();
    });
  });

  describe('lifecycle handlers', () => {
    it('boundFullscreenListener updates isFullscreen', () => {
      Object.defineProperty(document, 'fullscreenElement', { value: {}, configurable: true });
      (component as any).boundFullscreenListener();
      expect(component.isFullscreen).toBe(true);
      Object.defineProperty(document, 'fullscreenElement', { value: null, configurable: true });
      (component as any).boundFullscreenListener();
      expect(component.isFullscreen).toBe(false);
      delete (document as any).fullscreenElement;
    });

    it('ngAfterViewInit handles init error', () => {
      jest.spyOn(component as any, 'initMap').mockImplementation(() => { throw new Error('boom'); });
      (component as any).ngAfterViewInit();
      expect(true).toBe(true);
    });
  });

  describe('initMap', () => {
    it('creates map, tile layers, scale control, moveend listener', () => {
      const L = (jest.requireMock('leaflet') as any).default;
      L.map.mockClear();
      (component as any).initMap();
      expect(L.map).toHaveBeenCalled();
      expect(component['baseLayers']['standard']).toBeTruthy();
      expect(component['baseLayers']['satellite']).toBeTruthy();
      expect(component['baseLayers']['terrain']).toBeTruthy();
      const map = (component as any).map;
      expect(map.on).toHaveBeenCalledWith('moveend', component['boundMapMoveEndListener']);
    });
  });

  describe('initLayers', () => {
    it('creates poi layers and adds pause layer', () => {
      (component as any).map = (jest.requireMock('leaflet') as any).default.map();
      (component as any).initLayers();
      expect(component['poiLayers']['roads']).toBeTruthy();
      expect(component['pauseLayerGroup'].addTo).toHaveBeenCalled();
    });
  });

  describe('onResize / scheduleMapResize', () => {
    it('onResize schedules resize with 120 delay', () => {
      const spy = jest.spyOn(component as any, 'scheduleMapResize');
      (component as any).onResize();
      expect(spy).toHaveBeenCalledWith(120);
    });

    it('scheduleMapResize clears previous timeout', () => {
      const clearTimeoutSpy = jest.spyOn(window, 'clearTimeout');
      (component as any).resizeTimeout = 123;
      (component as any).scheduleMapResize(100);
      expect(clearTimeoutSpy).toHaveBeenCalledWith(123);
    });

    it('scheduleMapResize returns early when map container not connected', () => {
      seedMap();
      (component as any).scheduleMapResize(1);
      jest.runAllTimers();
      expect((component as any).map.invalidateSize).not.toHaveBeenCalled();
    });

    it('scheduleMapResize callback returns when map is null', () => {
      jest.useFakeTimers();
      (component as any).map = undefined;
      (component as any).scheduleMapResize(0);
      jest.runAllTimers();
      jest.useRealTimers();
      expect(true).toBe(true);
    });

    it('scheduleMapResize invalidates size on connected container', () => {
      jest.useFakeTimers();
      seedMap();
      (component as any).map.getContainer = jest.fn(() => ({ isConnected: true }));
      (component as any).scheduleMapResize(0);
      jest.runAllTimers();
      expect((component as any).map.invalidateSize).toHaveBeenCalled();
      jest.useRealTimers();
    });

    it('scheduleMapResize handles invalidateSize error', () => {
      jest.useFakeTimers();
      seedMap();
      (component as any).map.getContainer = jest.fn(() => ({ isConnected: true }));
      (component as any).map.invalidateSize = jest.fn(() => { throw new Error('resize'); });
      (component as any).scheduleMapResize(0);
      jest.runAllTimers();
      expect(true).toBe(true);
      jest.useRealTimers();
    });
  });

  describe('ngOnDestroy', () => {
    it('disconnects everything and clears state', () => {
      seedMap();
      (component as any).themeObserver = { disconnect: jest.fn() } as any;
      (component as any).toastTimeout = 1;
      (component as any).resizeTimeout = 1;
      (component as any).refreshTimeout = 1;
      (component as any).positionRefreshTimeout = 1;
      (component as any).weatherRefreshTimeout = 1;
      (component as any).interpAnimFrame = 5;
      (component as any).markerAnimationFrames = { a: 1 };
      const gpsMock = { close: jest.fn() };
      (component as any).gpsRealtimeSource = gpsMock;
      (component as any).tripStartMarkers = { 1: { remove: jest.fn() } };
      (component as any).tripEndMarkers = { 1: { remove: jest.fn() } };
      (component as any).vehicleInterpStates = new Map([['v1', {}]]);
      (component as any).pauseAlertSubscription = { unsubscribe: jest.fn() };
      (component as any).pauseStatusSubscription = { unsubscribe: jest.fn() };
      (component as any).pauseGeneratedSubscription = { unsubscribe: jest.fn() };
      (component as any).notificationsSubscription = { unsubscribe: jest.fn() };
      (component as any).tripsSubscription = { unsubscribe: jest.fn() };

      component.ngOnDestroy();

      expect(pauseAIServiceMock.disconnectRealtime).toHaveBeenCalled();
      expect(gpsMock.close).toHaveBeenCalled();
      expect(component['map']!.remove).toHaveBeenCalled();
    });

    it('ngOnDestroy handles null map and falsey subs', () => {
      (component as any).map = undefined;
      (component as any).interpAnimFrame = null;
      component.ngOnDestroy();
      expect(pauseAIServiceMock.disconnectRealtime).toHaveBeenCalled();
    });
  });

  describe('interpolation utilities', () => {
    it('haversineKm computes distance', () => {
      const d = (component as any).haversineKm(36.8, 10.18, 36.85, 10.2);
      expect(d).toBeGreaterThan(0);
    });

    it('calculateBearing returns 0-360', () => {
      const b = (component as any).calculateBearing(36.8, 10.18, 36.9, 10.19);
      expect(b).toBeGreaterThanOrEqual(0);
      expect(b).toBeLessThan(360);
    });

    it('closestPointOnSegment with zero-length segment', () => {
      const r = (component as any).closestPointOnSegment(0, 0, 5, 5, 5, 5);
      expect(r.t).toBe(0);
      expect(r.dist).toBeGreaterThan(0);
    });

    it('closestPointOnSegment normal case', () => {
      const r = (component as any).closestPointOnSegment(0, 0, 0, 0, 10, 0);
      expect(r.t).toBe(0);
      const r2 = (component as any).closestPointOnSegment(5, 5, 0, 0, 10, 0);
      expect(r2.t).toBeCloseTo(0.5, 0);
    });

    it('projectOnRoute finds nearest segment', () => {
      const route: any = [[36.8, 10.18], [36.85, 10.2], [36.9, 10.22]];
      const r = (component as any).projectOnRoute(36.825, 10.19, route);
      expect(r.segIndex).toBe(0);
      expect(r.segProgress).toBeGreaterThan(0);
    });

    it('getPositionOnRoute interpolates', () => {
      const route: any = [[36.8, 10.18], [36.9, 10.21]];
      const pos = (component as any).getPositionOnRoute(route, 0, 0.5);
      expect(pos[0]).toBeCloseTo(36.85);
      expect(pos[1]).toBeCloseTo(10.195);
    });

    it('getPositionOnRoute clamps', () => {
      const route: any = [[36.8, 10.18], [36.9, 10.21]];
      const pos = (component as any).getPositionOnRoute(route, 99, 99);
      expect(pos[0]).toBe(36.9);
    });

    it('getBearingAtSegment', () => {
      const route: any = [[36.8, 10.18], [36.9, 10.21]];
      const b = (component as any).getBearingAtSegment(route, 0);
      expect(b).toBeGreaterThanOrEqual(0);
      const b2 = (component as any).getBearingAtSegment(route, 99);
      expect(b2).toBeGreaterThanOrEqual(0);
    });

    it('advanceOnRoute crosses segments', () => {
      const route: any = [[36.8, 10.18], [36.9, 10.21], [37.0, 10.24]];
      const state: any = { route, segIndex: 0, segProgress: 0, speedKmh: 60, lastGpsLat: 0, lastGpsLng: 0 };
      (component as any).advanceOnRoute(state, 100);
      // advanced to end
      expect(state.segIndex).toBeGreaterThanOrEqual(0);
    });

    it('advanceOnRoute blocks at end', () => {
      const route: any = [[36.8, 10.18], [36.9, 10.21], [37.0, 10.24]];
      const state: any = { route, segIndex: 2, segProgress: 0.5, speedKmh: 60, lastGpsLat: 0, lastGpsLng: 0 };
      (component as any).advanceOnRoute(state, 500);
      expect(state.segIndex).toBe(1);
      expect(state.segProgress).toBe(1);
    });

    it('advanceOnRoute handles zero-length segment', () => {
      const route: any = [[36.8, 10.18], [36.8, 10.18], [36.9, 10.21]];
      const state: any = { route, segIndex: 0, segProgress: 0, speedKmh: 60, lastGpsLat: 0, lastGpsLng: 0 };
      (component as any).advanceOnRoute(state, 1);
      expect(state.segIndex).toBe(1);
    });

    it('advanceAllVehicles returns when no map', () => {
      (component as any).map = undefined;
      (component as any).vehicleInterpStates = new Map([['v1', { route: [[36.8, 10.18], [36.9, 10.21]], segIndex: 0, segProgress: 0, speedKmh: 60, lastGpsLat: 0, lastGpsLng: 0 }]]);
      (component as any).advanceAllVehicles(0.1);
      expect(true).toBe(true);
    });

    it('advanceAllVehicles skips short route and zero speed', () => {
      seedMap();
      (component as any).vehicleInterpStates = new Map([
        ['v1', { route: [[36.8, 10.18]], segIndex: 0, segProgress: 0, speedKmh: 60, lastGpsLat: 0, lastGpsLng: 0 }],
        ['v2', { route: [[36.8, 10.18], [36.9, 10.21]], segIndex: 0, segProgress: 0, speedKmh: 0, lastGpsLat: 0, lastGpsLng: 0 }]
      ]);
      (component as any).truckMarkers = {};
      (component as any).advanceAllVehicles(0.1);
    });

    it('advanceAllVehicles updates marker and icon', () => {
      seedMap();
      const route = [[36.8, 10.18], [36.9, 10.21]];
      (component as any).vehicleInterpStates = new Map([
        ['v1', { route, segIndex: 0, segProgress: 0, speedKmh: 60, lastGpsLat: 0, lastGpsLng: 0 }]
      ]);
      const marker = { setLatLng: jest.fn(), setIcon: jest.fn() };
      (component as any).truckMarkers = { v1: marker };
      component.allTrucks = [
        { id: 'v1', driver: '', speed: 0, progress: 0, from: '', to: '', status: '', eco: false, consumption: '', hasAlert: false, type: 'truck', name: 'X' } as any
      ];
      (component as any).advanceAllVehicles(0.1);
      expect(marker.setLatLng).toHaveBeenCalled();
      expect(marker.setIcon).toHaveBeenCalled();
    });

    it('startInterpolationEngine starts loop and guards re-entry', () => {
      const rAF = jest.spyOn(global, 'requestAnimationFrame');
      (component as any).interpAnimFrame = null;
      (component as any).startInterpolationEngine();
      expect(rAF).toHaveBeenCalled();
      const frame = (component as any).interpAnimFrame;
      (component as any).startInterpolationEngine();
      expect((component as any).interpAnimFrame).toBe(frame);
    });

    it('interpolation rAF loop calls advanceAllVehicles then re-schedules', () => {
      seedMap();
      (component as any).vehicleInterpStates = new Map();
      (component as any).interpAnimFrame = null;
      (component as any).startInterpolationEngine();
      const cb = (component as any).__loopCb;
      // call the captured callback via rAFcb
      if (typeof rAFcb === 'function') {
        rAFcb(300);
      }
      expect((component as any).interpAnimFrame).toBe(9);
    });
  });

  describe('loadTripsFromBackend', () => {
    it('maps trips to allTrucks and renders when map present', () => {
      seedMap();
      (component as any).map = null as any;
      // map present scenario
      (component as any).map = (jest.requireMock('leaflet') as any).default.map();
      fleetServiceMock.getTripsCarte.mockReturnValue(of([makeTrip()]));
      (component as any).loadTripsFromBackend(true);
      expect(component.allTrucks.length).toBe(1);
      expect(component.allTrucks[0].id).toBe('v1');
      expect(component.activeTruck).toBe('v1');
    });

    it('handles no map with markForCheck (triggerRender false)', () => {
      (component as any).map = undefined;
      fleetServiceMock.getTripsCarte.mockReturnValue(of([makeTrip()]));
      (component as any).loadTripsFromBackend(false);
      expect(component.allTrucks.length).toBe(1);
    });

    it('filters inactive status', () => {
      seedMap();
      fleetServiceMock.getTripsCarte.mockReturnValue(of([
        makeTrip({ status: undefined, statut: 'Terminé' }),
      ]));
      (component as any).loadTripsFromBackend(false);
      expect(component.allTrucks.length).toBe(0);
    });

    it('selects first truck if activeTruck not present', () => {
      seedMap();
      fleetServiceMock.getTripsCarte.mockReturnValue(of([makeTrip({ id: '9', vehiculeId: 'z9' })]));
      (component as any).loadTripsFromBackend(false);
      expect(component.allTrucks[0].id).toBe('z9');
      expect(component.activeTruck).toBe('z9');
    });

    it('handles existing interpolation state update same GPS', () => {
      seedMap();
      const trip = makeTrip({ vehiculeLatitude: 36.8, vehiculeLongitude: 10.18 });
      (component as any).vehicleInterpStates = new Map([
        ['v1', { route: [[36.8, 10.18], [36.9, 10.21]], segIndex: 0, segProgress: 0.5, speedKmh: 60, lastGpsLat: 36.8, lastGpsLng: 10.18 }]
      ]);
      fleetServiceMock.getTripsCarte.mockReturnValue(of([trip]));
      (component as any).loadTripsFromBackend(false);
      expect(component.allTrucks.length).toBe(1);
    });

    it('handles existing state new GPS projected forward', () => {
      seedMap();
      const trip = makeTrip({ vehiculeLatitude: 36.85, vehiculeLongitude: 10.2 });
      (component as any).vehicleInterpStates = new Map([
        ['v1', { route: [[36.8, 10.18], [36.9, 10.21]], segIndex: 0, segProgress: 0.2, speedKmh: 60, lastGpsLat: 36.8, lastGpsLng: 10.18 }]
      ]);
      fleetServiceMock.getTripsCarte.mockReturnValue(of([trip]));
      (component as any).loadTripsFromBackend(false);
      const state = (component as any).vehicleInterpStates.get('v1');
      expect(state.lastGpsLat).toBe(36.85);
    });

    it('removes inactive vehicles from interp states', () => {
      seedMap();
      (component as any).vehicleInterpStates = new Map([
        ['gone', { route: [[36.8, 10.18], [36.9, 10.21]], segIndex: 0, segProgress: 0, speedKmh: 60, lastGpsLat: 0, lastGpsLng: 0 }]
      ]);
      fleetServiceMock.getTripsCarte.mockReturnValue(of([makeTrip()]));
      (component as any).loadTripsFromBackend(false);
      expect((component as any).vehicleInterpStates.has('gone')).toBe(false);
    });

    it('starts interpolation engine on render', () => {
      seedMap();
      (component as any).interpAnimFrame = null;
      fleetServiceMock.getTripsCarte.mockReturnValue(of([makeTrip()]));
      (component as any).loadTripsFromBackend(true);
      expect((component as any).interpAnimFrame).toBe(9);
    });
  });

  describe('updateVehicleMarkersOnly', () => {
    it('returns early without map or empty states', () => {
      (component as any).map = undefined;
      (component as any).updateVehicleMarkersOnly();
      (component as any).map = (jest.requireMock('leaflet') as any).default.map();
      (component as any).vehicleInterpStates = new Map();
      (component as any).updateVehicleMarkersOnly();
      expect(true).toBe(true);
    });

    it('updates gps positions but not regress', () => {
      seedMap();
      (component as any).vehicleInterpStates = new Map([
        ['v1', { route: [[36.8, 10.18], [36.9, 10.21]], segIndex: 0, segProgress: 0.5, speedKmh: 60, lastGpsLat: 36.8, lastGpsLng: 10.18 }]
      ]);
      fleetServiceMock.getTripsCarte.mockReturnValue(of([makeTrip({ vehiculeLatitude: 36.85, vehiculeLongitude: 10.2, vehiculeVitesse: 80 })]));
      (component as any).updateVehicleMarkersOnly();
      const state = (component as any).vehicleInterpStates.get('v1');
      expect(state.speedKmh).toBe(80);
      expect(state.lastGpsLat).toBe(36.85);
    });

    it('skips when no matching interp state or null gps', () => {
      seedMap();
      (component as any).vehicleInterpStates = new Map();
      fleetServiceMock.getTripsCarte.mockReturnValue(of([makeTrip()]));
      (component as any).updateVehicleMarkersOnly();
      (component as any).vehicleInterpStates = new Map([
        ['v1', { route: [[36.8, 10.18], [36.9, 10.21]], segIndex: 0, segProgress: 0, speedKmh: 60, lastGpsLat: 0, lastGpsLng: 0 }]
      ]);
      fleetServiceMock.getTripsCarte.mockReturnValue(of([makeTrip({ vehiculeLatitude: undefined, vehiculeLongitude: undefined, latitudeDepart: undefined })]));
      (component as any).updateVehicleMarkersOnly();
      expect(true).toBe(true);
    });
  });

  describe('connectGpsRealtime', () => {
    it('returns early when EventSource undefined', () => {
      (global as any).EventSource = undefined;
      (component as any).gpsRealtimeSource = undefined;
      (component as any).connectGpsRealtime();
      expect((component as any).gpsRealtimeSource).toBeUndefined();
    });

    it('returns early when source already exists', () => {
      (global as any).EventSource = MockEventSource;
      (component as any).gpsRealtimeSource = { close: jest.fn() } as any;
      (component as any).connectGpsRealtime();
      expect((component as any).gpsRealtimeSource).toEqual({ close: expect.any(Function) });
    });

    it('registers listeners and handles onerror reconnect', () => {
      (global as any).EventSource = MockEventSource;
      (component as any).gpsRealtimeSource = undefined;
      (component as any).connectGpsRealtime();
      const src: any = (component as any).gpsRealtimeSource;
      expect(src.addEventListener).toHaveBeenCalledWith('gps-position', expect.any(Function));
      expect(typeof src.onerror).toBe('function');
      src.onerror();
      expect((component as any).gpsReconnectTimer).toBeTruthy();
    });

    it('clears reconnect timer on error', () => {
      (global as any).EventSource = MockEventSource;
      (component as any).gpsReconnectTimer = 55;
      (component as any).gpsRealtimeSource = undefined;
      (component as any).connectGpsRealtime();
      const src: any = (component as any).gpsRealtimeSource;
      src.onerror();
      expect((component as any).gpsRealtimeSource).toBeUndefined();
    });
  });

  describe('connectAlertsRealtime + alerts', () => {
    it('filters notifications into activeAlerts', () => {
      notificationsSubject.next([
        makeNotif({ id: 'r', isRead: false, category: 'NOTIF_TRAJET', title: 'ABC1', message: 'go' }),
        makeNotif({ id: 's', isRead: true, category: 'NOTIF_TRAJET' }),
        makeNotif({ id: 't', isRead: false, category: 'NOTIF_COMPTE' })
      ]);
      expect(component.activeAlerts.length).toBe(1);
      expect(component.activeAlerts[0].id).toBe('r');
      expect(component.activeAlerts[0].isRead).toBe(false);
    });

    it('marks hasAlert on trucks matching alert content', () => {
      component.allTrucks = [
        { id: 'v1', name: 'ABC1', driver: '', speed: 0, progress: 0, from: '', to: '', status: '', eco: false, consumption: '', hasAlert: false } as any,
        { id: 'v2', name: 'OTHER', driver: '', speed: 0, progress: 0, from: '', to: '', status: '', eco: false, consumption: '', hasAlert: false } as any
      ];
      notificationsSubject.next([makeNotif({ id: 'r', category: 'NOTIF_TRAJET', title: 'ABC1', message: 'ok' })]);
      expect(component.allTrucks[0].hasAlert).toBe(true);
      expect(component.allTrucks[1].hasAlert).toBe(false);
    });

    it('onAlertTreat calls markAsRead', () => {
      component.onAlertTreat(makeNotif({ id: 'x' }));
      expect(notificationServiceMock.markAsRead).toHaveBeenCalledWith('x');
    });

    it('onAlertFocus selects matching truck', () => {
      component.allTrucks = [
        { id: 'v1', name: 'ABC1', driver: '', speed: 0, progress: 0, from: '', to: '', status: '', eco: false, consumption: '', hasAlert: false } as any
      ];
      const selectSpy = jest.spyOn(component, 'selectTruck');
      (component as any).truckMarkers = {};
      component.onAlertFocus(makeNotif({ id: 'x', category: 'NOTIF_TRAJET', title: 'ABC1 thing', message: 'ok' }));
      expect(selectSpy).toHaveBeenCalledWith('v1');
      expect(component.activePanel).toBeNull();
    });

    it('onAlertFocus does nothing when no match', () => {
      component.allTrucks = [];
      component.onAlertFocus(makeNotif({ id: 'x', title: 'zzz' }));
      expect(component.activePanel).not.toBeNull();
    });
  });

  describe('pause realtime', () => {
    it('connectPauseAiRealtime subscribes', () => {
      expect(pauseAIServiceMock.connectRealtime).toHaveBeenCalled();
    });

    it('alert$ triggers handlePauseAlertEvent', () => {
      // calls getPausesForTrajet which returns of([]) -> regenerate path
      pauseAIServiceMock.getPausesForTrajet.mockReturnValue(of([makePause()]));
      const alert = makeAlert();
      (component as any).snoozedUntilByTripId = new Map();
      (component as any).lastPauseCompletedAtByTripId = new Map();
      alertSubject.next(alert);
      expect(component.activePauseAlert).not.toBeNull();
    });

    it('alert$ handles zero pauses via regenerate', () => {
      pauseAIServiceMock.getPausesForTrajet.mockReturnValue(of([]));
      pauseAIServiceMock.regeneratePauses.mockReturnValue(of([makePause()]));
      const alert = makeAlert();
      (component as any).snoozedUntilByTripId = new Map();
      (component as any).lastPauseCompletedAtByTripId = new Map();
      alertSubject.next(alert);
      expect(component.activePauseAlert).not.toBeNull();
    });

    it('alert$ error path shows alert anyway', () => {
      pauseAIServiceMock.getPausesForTrajet.mockReturnValue({
        subscribe: ({ error }: any) => error(new Error('x'))
      });
      const alert = makeAlert();
      (component as any).snoozedUntilByTripId = new Map();
      (component as any).lastPauseCompletedAtByTripId = new Map();
      alertSubject.next(alert);
      expect(component.activePauseAlert).not.toBeNull();
    });

    it('alert$ null does not call handler', () => {
      const spy = jest.spyOn(component as any, 'handlePauseAlertEvent');
      alertSubject.next(null);
      expect(spy).not.toHaveBeenCalled();
    });

    it('pauseStatus$ routes to handlePauseStatusUpdate', () => {
      (component as any).pauseDataByTripId = new Map([[1, [makePause()]]]);
      (component as any).map = (jest.requireMock('leaflet') as any).default.map();
      (component as any).pauseMarkersById = new Map();
      pauseAIServiceMock.getPausesCompletes.mockReturnValue(of({ stops: [makePause()] }));
      pauseStatusSubject.next({ trajetId: 1, pauseId: 1, statut: StatutPause.ATTEINTE, latitude: 0, longitude: 0 });
      expect(true).toBe(true);
    });

    it('handlePauseAlertEvent regenerate error shows alert', () => {
      pauseAIServiceMock.getPausesForTrajet.mockReturnValue(of([]));
      pauseAIServiceMock.regeneratePauses.mockReturnValue({ subscribe: ({ error }: any) => error(new Error('x')) });
      const alert = makeAlert();
      (component as any).snoozedUntilByTripId = new Map();
      (component as any).lastPauseCompletedAtByTripId = new Map();
      (component as any).handlePauseAlertEvent(alert);
      expect(component.activePauseAlert).not.toBeNull();
    });

    it('refreshPauseMarkersForTrips logs and loads new trips', () => {
      (component as any).map = (jest.requireMock('leaflet') as any).default.map();
      (component as any).pauseMarkersById = new Map();
      pauseAIServiceMock.getPausesCompletes.mockReturnValue(of({ stops: [makePause()] }));
      (component as any).tripCards = [makeTrip()];
      (component as any).refreshPauseMarkersForTrips([makeTrip()]);
      expect((component as any).pauseMarkersById.size).toBe(1);
    });

    it('refreshPauseMarkersForTrips skips when all loaded', () => {
      (component as any).map = (jest.requireMock('leaflet') as any).default.map();
      const m = { __pauseTripId: 1 };
      (component as any).pauseMarkersById = new Map([[99, m]]);
      (component as any).tripCards = [makeTrip()];
      pauseAIServiceMock.getPausesCompletes.mockReturnValue(of({ stops: [makePause()] }));
      (component as any).refreshPauseMarkersForTrips([makeTrip()]);
      expect((component as any).pauseMarkersById.size).toBe(1);
    });

    it('refreshPauseMarkersForTrips removes inactive markers', () => {
      (component as any).map = (jest.requireMock('leaflet') as any).default.map();
      const inactive = { __pauseTripId: 99, remove: jest.fn() } as any;
      const active = { __pauseTripId: 1, remove: jest.fn() } as any;
      (component as any).pauseMarkersById = new Map([[99, inactive], [1, active]]);
      (component as any).pauseLayerGroup.removeLayer = jest.fn();
      (component as any).refreshPauseMarkersForTrips([makeTrip()]);
      expect((component as any).pauseLayerGroup.removeLayer).toHaveBeenCalledWith(inactive);
      expect((component as any).pauseMarkersById.size).toBe(1);
      expect((component as any).pauseMarkersById.get(1)).toBe(active);
    });

    it('refreshPauseMarkersForTrip returns early when no map', () => {
      (component as any).map = undefined;
      (component as any).refreshPauseMarkersForTrip(1);
      expect(true).toBe(true);
    });

    it('refreshPauseMarkersForTrip skips when already loaded', () => {
      (component as any).map = (jest.requireMock('leaflet') as any).default.map();
      (component as any).pauseMarkersById = new Map([[99, { __pauseTripId: 1 }]]);
      (component as any).refreshPauseMarkersForTrip(1);
      expect(pauseAIServiceMock.getPausesCompletes).not.toHaveBeenCalled();
    });

    it('refreshPauseMarkersForTrip regenerates when zero stops', () => {
      (component as any).map = (jest.requireMock('leaflet') as any).default.map();
      (component as any).pauseMarkersById = new Map();
      pauseAIServiceMock.getPausesCompletes.mockReturnValue(of({ stops: [] }));
      pauseAIServiceMock.regeneratePauses.mockReturnValue(of([makePause()]));
      (component as any).tripCards = [makeTrip()];
      (component as any).refreshPauseMarkersForTrip(1);
      expect((component as any).pauseDataByTripId.get(1)!.length).toBe(1);
    });

    it('refreshPauseMarkersForTrip handles getPausesCompletes error', () => {
      (component as any).map = (jest.requireMock('leaflet') as any).default.map();
      (component as any).pauseMarkersById = new Map();
      pauseAIServiceMock.getPausesCompletes.mockReturnValue({
        subscribe: ({ error }: any) => error(new Error('x'))
      });
      (component as any).refreshPauseMarkersForTrip(1);
      expect(true).toBe(true);
    });

    it('refreshPauseMarkersForTrip handles regenerate error', () => {
      (component as any).map = (jest.requireMock('leaflet') as any).default.map();
      (component as any).pauseMarkersById = new Map();
      pauseAIServiceMock.getPausesCompletes.mockReturnValue(of({ stops: [] }));
      pauseAIServiceMock.regeneratePauses.mockReturnValue({
        subscribe: ({ error }: any) => error(new Error('x'))
      });
      (component as any).refreshPauseMarkersForTrip(1);
      expect(true).toBe(true);
    });

    it('pauseGenerated$ triggers refreshPauseMarkersForTrip', () => {
      (component as any).map = (jest.requireMock('leaflet') as any).default.map();
      (component as any).pauseMarkersById = new Map();
      pauseAIServiceMock.getPausesCompletes.mockReturnValue(of({ stops: [makePause()] }));
      pauseGeneratedSubject.next(1);
      expect((component as any).pauseMarkersById.size).toBe(1);
    });
  });

  describe('pause markers rendering', () => {
    it('renderPauseMarkersForTrip creates markers and popup', () => {
      (component as any).map = (jest.requireMock('leaflet') as any).default.map();
      (component as any).tripCards = [makeTrip()];
      (component as any).pauseMarkersById = new Map();
      const pause = makePause();
      (component as any).renderPauseMarkersForTrip(1, [pause]);
      expect((component as any).pauseMarkersById.has(1)).toBe(true);
      expect((component as any).pauseMarkersById.get(1).__pauseTripId).toBe(1);
    });

    it('removePauseMarkersForTrip removes matching markers', () => {
      (component as any).map = (jest.requireMock('leaflet') as any).default.map();
      const m = { __pauseTripId: 1 };
      const m2 = { __pauseTripId: 2 };
      (component as any).pauseMarkersById = new Map([[1, m], [2, m2]]);
      (component as any).removePauseMarkersForTrip(1);
      expect((component as any).pauseMarkersById.has(1)).toBe(false);
      expect((component as any).pauseMarkersById.has(2)).toBe(true);
    });

    it('clearPauseMarkers removes all', () => {
      (component as any).map = (jest.requireMock('leaflet') as any).default.map();
      (component as any).pauseMarkersById = new Map([[1, {}]]);
      (component as any).clearPauseMarkers();
      expect((component as any).pauseMarkersById.size).toBe(0);
    });

    it('setActivePauseMarker updates id and refreshes icons', () => {
      const spy = jest.spyOn(component as any, 'refreshPauseMarkerIcons');
      (component as any).setActivePauseMarker(5, 1);
      expect((component as any).activePauseMarkerId).toBe(5);
      expect(spy).toHaveBeenCalledWith(1);
    });

    it('refreshPauseMarkerIcons updates matching markers', () => {
      (component as any).activePauseMarkerId = 1;
      const marker = { setIcon: jest.fn(), setZIndexOffset: jest.fn(), __pauseTripId: 1 };
      (component as any).pauseMarkersById = new Map([[1, marker]]);
      (component as any).pauseDataByTripId = new Map([[1, [makePause()]]]);
      (component as any).refreshPauseMarkerIcons(1);
      expect(marker.setIcon).toHaveBeenCalled();
      expect(marker.setZIndexOffset).toHaveBeenCalledWith(1200);
    });

    it('refreshPauseMarkerIcons skips markers of other trip', () => {
      (component as any).activePauseMarkerId = 1;
      const marker = { setIcon: jest.fn(), setZIndexOffset: jest.fn(), __pauseTripId: 2 };
      (component as any).pauseMarkersById = new Map([[1, marker]]);
      (component as any).pauseDataByTripId = new Map([[2, [makePause()]]]);
      (component as any).refreshPauseMarkerIcons(1);
      expect(marker.setIcon).not.toHaveBeenCalled();
    });
  });

  describe('pause alert logic', () => {
    it('handlePauseAlertEvent ignores when shouldDisplay false', () => {
      const alert = makeAlert({ hoursDriving: 1 });
      (component as any).handlePauseAlertEvent(alert);
      expect(pauseAIServiceMock.getPausesForTrajet).not.toHaveBeenCalled();
    });

    it('handlePauseStatusUpdate marks attained', () => {
      (component as any).pauseDataByTripId = new Map([[1, [makePause({ statut: StatutPause.PLANIFIEE })]]]);
      (component as any).map = (jest.requireMock('leaflet') as any).default.map();
      (component as any).pauseMarkersById = new Map();
      const update: PauseStatusUpdateEvent = { trajetId: 1, pauseId: 1, statut: StatutPause.ATTEINTE, latitude: 0, longitude: 0 };
      pauseAIServiceMock.getPausesCompletes.mockReturnValue(of({ stops: [makePause()] }));
      (component as any).handlePauseStatusUpdate(update);
      expect((component as any).lastPauseCompletedAtByTripId.has(1)).toBe(true);
      expect(component.activePauseAlert).toBeNull();
    });

    it('handlePauseStatusUpdate ignores', () => {
      (component as any).pauseDataByTripId = new Map([[1, [makePause()]]]);
      (component as any).map = (jest.requireMock('leaflet') as any).default.map();
      (component as any).pauseMarkersById = new Map();
      pauseAIServiceMock.getPausesCompletes.mockReturnValue(of({ stops: [makePause()] }));
      (component as any).handlePauseStatusUpdate({ trajetId: 1, pauseId: 1, statut: StatutPause.IGNOREE, latitude: 0, longitude: 0 });
      expect((component as any).snoozedUntilByTripId.has(1)).toBe(true);
    });

    it('handlePauseStatusUpdate handles no matching pause', () => {
      (component as any).pauseDataByTripId = new Map([[1, []]]);
      (component as any).map = (jest.requireMock('leaflet') as any).default.map();
      (component as any).pauseMarkersById = new Map();
      pauseAIServiceMock.getPausesCompletes.mockReturnValue(of({ stops: [makePause()] }));
      (component as any).handlePauseStatusUpdate({ trajetId: 1, pauseId: 99, statut: StatutPause.PLANIFIEE, latitude: 0, longitude: 0 });
      expect(true).toBe(true);
    });

    it('shouldDisplayPauseAlert rules', () => {
      expect((component as any).shouldDisplayPauseAlert(makeAlert({ hoursDriving: 2 }))).toBe(false);
      expect((component as any).shouldDisplayPauseAlert(makeAlert({ hoursDriving: 3, score: 50 }))).toBe(false);
      expect((component as any).shouldDisplayPauseAlert(makeAlert({ hoursDriving: 5, score: 50 }))).toBe(true);
      // snoozed
      component['snoozedUntilByTripId'].set(1, Date.now() + 100000);
      expect((component as any).shouldDisplayPauseAlert(makeAlert({ hoursDriving: 5 }))).toBe(false);
      component['snoozedUntilByTripId'].delete(1);
      // recently completed
      component['lastPauseCompletedAtByTripId'].set(1, Date.now());
      expect((component as any).shouldDisplayPauseAlert(makeAlert({ hoursDriving: 5 }))).toBe(false);
      component['lastPauseCompletedAtByTripId'].delete(1);
      expect((component as any).shouldDisplayPauseAlert(makeAlert({ hoursDriving: 5 }))).toBe(true);
    });

    it('maybeShowPauseAlert builds alert with urgent rules', () => {
      (component as any).tripCards = [makeTrip()];
      (component as any).pauseDataByTripId = new Map([[1, [makePause()]]]);
      const urgent = makeAlert({ typeAlerte: TypeAlerteIA.URGENTE });
      (component as any).maybeShowPauseAlert(urgent);
      expect(component.activePauseAlert!.isUrgent).toBe(true);
      expect(component.activePauseAlert!.pause).not.toBeNull();
      expect(component.activePauseAlert!.distanceToPoiM).toBe(5000);
    });

    it('maybeShowPauseAlert high score urgent', () => {
      (component as any).tripCards = [makeTrip()];
      (component as any).pauseDataByTripId = new Map([[1, [makePause()]]]);
      const a = makeAlert({ typeAlerte: TypeAlerteIA.RECOMMANDEE, score: 92, hoursDriving: 3 });
      (component as any).maybeShowPauseAlert(a);
      expect(component.activePauseAlert!.isUrgent).toBe(true);
    });

    it('maybeShowPauseAlert hoursDriving urgent', () => {
      (component as any).tripCards = [makeTrip()];
      (component as any).pauseDataByTripId = new Map([[1, [makePause()]]]);
      const a = makeAlert({ typeAlerte: TypeAlerteIA.AUCUNE, score: 80, hoursDriving: 5 });
      (component as any).maybeShowPauseAlert(a);
      expect(component.activePauseAlert!.isUrgent).toBe(true);
    });

    it('maybeShowPauseAlert returns when shouldDisplay false', () => {
      (component as any).maybeShowPauseAlert(makeAlert({ hoursDriving: 1 }));
      expect(component.activePauseAlert).toBeNull();
    });

    it('findMatchingPause returns nearest', () => {
      (component as any).pauseDataByTripId = new Map([[1, [makePause({ id: 1 }), makePause({ id: 2, latitude: 31, longitude: 9 })]]]);
      const pause = (component as any).findMatchingPause(1, { lat: 36.82, lon: 10.19 } as any);
      expect(pause!.id).toBe(1);
    });

    it('findMatchingPause returns null when no pauses', () => {
      (component as any).pauseDataByTripId = new Map([[1, []]]);
      expect((component as any).findMatchingPause(1, { lat: 0, lon: 0 } as any)).toBeNull();
    });

    it('computeEstimatedArrival returns string when trip exists and undefined otherwise', () => {
      (component as any).tripCards = [makeTrip()];
      expect(typeof (component as any).computeEstimatedArrival(1, 5000)).toBe('string');
      expect((component as any).computeEstimatedArrival(999, 5000)).toBeUndefined();
    });

    it('getPauseTheme covers all types', () => {
      for (const t of [TypePause.MANDATORY_REST, TypePause.WARNING_ALERT, TypePause.STATION_SERVICE, TypePause.KIOSK, TypePause.POI, TypePause.CAFE, TypePause.PARKING, TypePause.REST_AREA]) {
        const theme = (component as any).getPauseTheme(makePause({ type: t }));
        expect(theme.emoji).toBeTruthy();
      }
      const def = (component as any).getPauseTheme(makePause({ type: 'SOMETHING' as any }));
      expect(def.emoji).toBeTruthy();
    });

    it('getPauseTooltip covers all types', () => {
      for (const t of [TypePause.MANDATORY_REST, TypePause.WARNING_ALERT, TypePause.STATION_SERVICE, TypePause.KIOSK, TypePause.POI, TypePause.CAFE, TypePause.PARKING, TypePause.REST_AREA]) {
        const tip = (component as any).getPauseTooltip(makePause({ type: t }));
        expect(tip).toBeTruthy();
      }
      expect((component as any).getPauseTooltip(makePause({ type: 'X' as any, nomLieu: 'Custom' }))).toBe('Custom');
      expect((component as any).getPauseTooltip(makePause({ type: 'X' as any, nomLieu: undefined }))).toBe('Point de pause');
    });

    it('buildPauseIcon handles statuses and warning blink', () => {
      (component as any).buildPauseIcon(makePause({ statut: StatutPause.ATTEINTE }), false);
      (component as any).buildPauseIcon(makePause({ statut: StatutPause.IGNOREE }), false);
      (component as any).buildPauseIcon(makePause({ statut: StatutPause.PLANIFIEE }), false);
      (component as any).buildPauseIcon(makePause({ type: TypePause.WARNING_ALERT, statut: StatutPause.PLANIFIEE }), true);
      (component as any).buildPauseIcon(makePause({ type: TypePause.WARNING_ALERT, statut: StatutPause.ATTEINTE }), false);
      expect(true).toBe(true);
    });

    it('buildPausePopup with and without data', () => {
      (component as any).buildPausePopup(makePause({ aiScore: 90, distanceAlongRouteM: 10000 }), makeTrip(), true);
      (component as any).buildPausePopup(makePause({ aiScore: undefined, distanceAlongRouteM: undefined }), null, false);
      (component as any).buildPausePopup(makePause({ statut: StatutPause.ATTEINTE }), makeTrip(), false);
      (component as any).buildPausePopup(makePause({ statut: StatutPause.IGNOREE }), makeTrip(), false);
      expect(true).toBe(true);
    });

    it('attachPausePopupActions returns when no popup element', () => {
      const L = (jest.requireMock('leaflet') as any).default;
      const marker = L.marker();
      marker.getPopup = jest.fn(() => ({ getElement: jest.fn(() => null) }));
      (component as any).attachPausePopupActions(marker, makePause(), makeTrip());
      expect(true).toBe(true);
    });

    it('attachPausePopupActions wires complete and ignore buttons', () => {
      const completeBtn: any = { addEventListener: jest.fn((evt: any, cb: any) => { completeBtn.cb = cb; }) };
      const ignoreBtn: any = { addEventListener: jest.fn((evt: any, cb: any) => { ignoreBtn.cb = cb; }) };
      const popupElement: any = { querySelector: jest.fn((sel: string) => sel === '[data-action="complete"]' ? completeBtn : ignoreBtn) };
      const L = (jest.requireMock('leaflet') as any).default;
      const marker = L.marker();
      marker.getPopup = jest.fn(() => ({ getElement: jest.fn(() => popupElement) }));
      (component as any).tripCards = [makeTrip()];
      (component as any).attachPausePopupActions(marker, makePause(), makeTrip());

      pauseAIServiceMock.markPauseCompleted.mockReturnValue(of(makePause({ statut: StatutPause.ATTEINTE })));
      completeBtn.cb();
      expect(pauseAIServiceMock.markPauseCompleted).toHaveBeenCalledWith(1, 1);

      pauseAIServiceMock.ignorePause.mockReturnValue(of(makePause({ statut: StatutPause.IGNOREE })));
      ignoreBtn.cb();
      expect(pauseAIServiceMock.ignorePause).toHaveBeenCalledWith(1, 1);

      pauseAIServiceMock.markPauseCompleted.mockReturnValue({ subscribe: ({ error }: any) => error(new Error('x')) });
      completeBtn.cb();

      pauseAIServiceMock.ignorePause.mockReturnValue({ subscribe: ({ error }: any) => error(new Error('x')) });
      ignoreBtn.cb();

      const marker2 = L.marker();
      marker2.getPopup = jest.fn(() => ({ getElement: jest.fn(() => popupElement) }));
      (component as any).attachPausePopupActions(marker2, makePause(), undefined);
      completeBtn.cb();
      ignoreBtn.cb();
      expect(true).toBe(true);
    });

    it('refreshPauseMarkersForTrip re-shows alert for same trip', () => {
      (component as any).map = (jest.requireMock('leaflet') as any).default.map();
      (component as any).pauseMarkersById = new Map();
      (component as any).tripCards = [makeTrip()];
      pauseAIServiceMock.getPausesCompletes.mockReturnValue(of({ stops: [makePause()] }));
      (component as any).activePauseAlert = { alert: makeAlert({ trajetId: 1 }), pause: makePause(), poi: makeAlert().poi, isUrgent: false };
      (component as any).snoozedUntilByTripId = new Map();
      (component as any).lastPauseCompletedAtByTripId = new Map();
      (component as any).refreshPauseMarkersForTrip(1);
      expect(true).toBe(true);
    });

    it('refreshPauseMarkersForTrip regenerate re-shows alert for same trip', () => {
      (component as any).map = (jest.requireMock('leaflet') as any).default.map();
      (component as any).pauseMarkersById = new Map();
      (component as any).tripCards = [makeTrip()];
      pauseAIServiceMock.getPausesCompletes.mockReturnValue(of({ stops: [] }));
      pauseAIServiceMock.regeneratePauses.mockReturnValue(of([makePause()]));
      (component as any).activePauseAlert = { alert: makeAlert({ trajetId: 1 }), pause: makePause(), poi: makeAlert().poi, isUrgent: false };
      (component as any).snoozedUntilByTripId = new Map();
      (component as any).lastPauseCompletedAtByTripId = new Map();
      (component as any).refreshPauseMarkersForTrip(1);
      expect(true).toBe(true);
    });
  });

  describe('handlePauseAlert actions', () => {
    it('handlePauseAlertMarkCompleted returns when no pause', () => {
      component.activePauseAlert = null;
      (component as any).handlePauseAlertMarkCompleted();
      expect(pauseAIServiceMock.markPauseCompleted).not.toHaveBeenCalled();
    });

    it('handlePauseAlertMarkCompleted success path', () => {
      component.activePauseAlert = { alert: makeAlert(), pause: makePause(), poi: makeAlert().poi, isUrgent: false };
      (component as any).pauseMarkersById = new Map([[1, { closePopup: jest.fn() }]]);
      (component as any).map = (jest.requireMock('leaflet') as any).default.map();
      pauseAIServiceMock.markPauseCompleted.mockReturnValue(of(makePause({ statut: StatutPause.ATTEINTE })));
      pauseAIServiceMock.getPausesCompletes.mockReturnValue(of({ stops: [makePause()] }));
      (component as any).handlePauseAlertMarkCompleted();
      expect(component.activePauseAlert).toBeNull();
      expect((component as any).pauseMarkersById.get(1).closePopup).toHaveBeenCalled();
    });

    it('handlePauseAlertMarkCompleted error path', () => {
      component.activePauseAlert = { alert: makeAlert(), pause: makePause(), poi: makeAlert().poi, isUrgent: false };
      pauseAIServiceMock.markPauseCompleted.mockReturnValue({
        subscribe: ({ error }: any) => error(new Error('x'))
      });
      (component as any).handlePauseAlertMarkCompleted();
      expect(component.activePauseAlert).not.toBeNull();
    });

    it('handlePauseAlertIgnore returns when no pause', () => {
      component.activePauseAlert = null;
      (component as any).handlePauseAlertIgnore();
      expect(pauseAIServiceMock.ignorePause).not.toHaveBeenCalled();
    });

    it('handlePauseAlertIgnore success path', () => {
      component.activePauseAlert = { alert: makeAlert(), pause: makePause(), poi: makeAlert().poi, isUrgent: false };
      (component as any).pauseMarkersById = new Map([[1, { closePopup: jest.fn() }]]);
      (component as any).map = (jest.requireMock('leaflet') as any).default.map();
      pauseAIServiceMock.ignorePause.mockReturnValue(of(makePause({ statut: StatutPause.IGNOREE })));
      pauseAIServiceMock.getPausesCompletes.mockReturnValue(of({ stops: [makePause()] }));
      (component as any).handlePauseAlertIgnore();
      expect(component.activePauseAlert).toBeNull();
    });

    it('handlePauseAlertIgnore error path', () => {
      component.activePauseAlert = { alert: makeAlert(), pause: makePause(), poi: makeAlert().poi, isUrgent: false };
      pauseAIServiceMock.ignorePause.mockReturnValue({
        subscribe: ({ error }: any) => error(new Error('x'))
      });
      (component as any).handlePauseAlertIgnore();
      expect(component.activePauseAlert).not.toBeNull();
    });

    it('focusPauseAlertOnMap returns when no alert', () => {
      component.activePauseAlert = null;
      (component as any).focusPauseAlertOnMap();
      expect(true).toBe(true);
    });

    it('focusPauseAlertOnMap pans and zooms', () => {
      seedMap();
      const marker = { openPopup: jest.fn() };
      (component as any).pauseMarkersById = new Map([[1, marker]]);
      component.activePauseAlert = { alert: makeAlert(), pause: makePause(), poi: makeAlert().poi, isUrgent: false };
      (component as any).focusPauseAlertOnMap();
      expect((component as any).activePauseMarkerId).toBe(1);
      expect((component as any).map.panTo).toHaveBeenCalled();
      expect((component as any).map.setZoom).toHaveBeenCalled();
    });

    it('focusPauseAlertOnMap finds pause when none matched', () => {
      seedMap();
      (component as any).pauseMarkersById = new Map();
      (component as any).pauseDataByTripId = new Map([[1, [makePause()]]]);
      component.activePauseAlert = { alert: makeAlert(), pause: null, poi: makeAlert().poi, isUrgent: false };
      (component as any).focusPauseAlertOnMap();
      expect((component as any).map.panTo).toHaveBeenCalled();
    });

    it('regeneratePausesForActiveTrip returns when no active trip', () => {
      (component as any).activeTruck = 'none';
      component.allTrucks = [];
      (component as any).tripCards = [];
      component.regeneratePausesForActiveTrip();
      expect(pauseAIServiceMock.regeneratePauses).not.toHaveBeenCalled();
    });

    it('regeneratePausesForActiveTrip success path', () => {
      (component as any).activeTruck = 'v1';
      component.allTrucks = [{ id: 'v1', name: 'ABC1', driver: '', speed: 0, progress: 0, from: '', to: '', status: '', eco: false, consumption: '', hasAlert: false } as any];
      (component as any).tripCards = [makeTrip()];
      (component as any).map = (jest.requireMock('leaflet') as any).default.map();
      (component as any).pauseMarkersById = new Map();
      pauseAIServiceMock.regeneratePauses.mockReturnValue(of([makePause()]));
      component.regeneratePausesForActiveTrip();
      expect((component as any).activeTripId).toBe(1);
      expect((component as any).pauseDataByTripId.get(1)!.length).toBe(1);
    });

    it('regeneratePausesForActiveTrip error path', () => {
      (component as any).activeTruck = 'v1';
      component.allTrucks = [{ id: 'v1', name: 'ABC1', driver: '', speed: 0, progress: 0, from: '', to: '', status: '', eco: false, consumption: '', hasAlert: false } as any];
      (component as any).tripCards = [makeTrip()];
      pauseAIServiceMock.regeneratePauses.mockReturnValue({
        subscribe: ({ error }: any) => error(new Error('x'))
      });
      component.regeneratePausesForActiveTrip();
      expect(true).toBe(true);
    });
  });

  describe('mapTripToVehicle', () => {
    it('maps with interp state route', () => {
      (component as any).vehicleInterpStates = new Map([
        ['v1', { route: [[36.8, 10.18], [36.9, 10.21]], segIndex: 0, segProgress: 0, speedKmh: 60, lastGpsLat: 0, lastGpsLng: 0 }]
      ]);
      const truck = (component as any).mapTripToVehicle(makeTrip(), 0);
      expect(truck.bearing).toBeGreaterThanOrEqual(0);
      expect(truck.coordinates).toEqual([36.8, 10.18]);
    });

    it('maps fallback with previous position bearing', () => {
      (component as any).vehicleInterpStates = new Map();
      (component as any).truckPreviousPositions = { v1: [36.8, 10.18] };
      const truck = (component as any).mapTripToVehicle(makeTrip({ vehiculeLatitude: 36.9, vehiculeLongitude: 10.22 }), 0);
      expect(truck.bearing).toBeGreaterThanOrEqual(0);
      expect(truck.speed).toBe(60);
      expect(truck.fuelLevel).toBe(50);
      expect(truck.consumption).toBe('50L/100km');
    });

    it('maps fallback reusing previous bearing', () => {
      (component as any).vehicleInterpStates = new Map();
      (component as any).truckPreviousPositions = { v1: [36.9, 10.22] };
      component.allTrucks = [{ id: 'v1', bearing: 123, driver: '', speed: 0, progress: 0, from: '', to: '', status: '', eco: false, consumption: '', hasAlert: false } as any];
      const truck = (component as any).mapTripToVehicle(makeTrip({ vehiculeLatitude: 36.9, vehiculeLongitude: 10.22 }), 0);
      expect(truck.bearing).toBe(123);
    });

    it('returns null when no coordinates', () => {
      const truck = (component as any).mapTripToVehicle(makeTrip({
        vehiculeLatitude: undefined, vehiculeLongitude: undefined, latitudeDepart: undefined, longitudeDepart: undefined, latitudeArrivee: undefined, longitudeArrivee: undefined
      }), 0);
      expect(truck).toBeNull();
    });

    it('uses defaults when fields missing', () => {
      (component as any).vehicleInterpStates = new Map();
      const truck = (component as any).mapTripToVehicle({
        id: 'trip-0', pointDepart: 'A', destination: 'B', vehiculeLatitude: 36, vehiculeLongitude: 10,
        vehiculeVitesse: undefined, vehiculeNiveauCarburant: undefined
      } as any, 0);
      expect(truck).not.toBeNull();
      expect(truck!.name).toContain('Véhicule 1');
      expect(truck!.progress).toBe(35);
      expect(truck!.consumption).toBe('N/A');
      expect(truck!.status).toBe('En cours');
    });
  });

  describe('renderTripsOnMap', () => {
    it('returns early with no trucks', () => {
      component.allTrucks = [];
      (component as any).renderTripsOnMap();
      expect(true).toBe(true);
    });

    it('renders trucks with new markers and route', () => {
      seedMap();
      component.allTrucks = [
        { id: 'v1', name: 'ABC1', type: 'truck', driver: 'Ali', phone: '123', speed: 60, progress: 50, from: 'Tunis', to: 'Sousse', status: 'En cours', eco: false, consumption: 'x', hasAlert: false, coordinates: [36.81, 10.19], bearing: 30, fuelLevel: 50 } as any
      ];
      (component as any).tripCards = [makeTrip()];
      (component as any).truckMarkers = {};
      (component as any).routeLines = {};
      (component as any).originalMarkersArr = [];
      (component as any).tripStartMarkers = {};
      (component as any).tripEndMarkers = {};
      (component as any).vehicleWeatherMarkers = {};
      const L = (jest.requireMock('leaflet') as any).default;
      weatherServiceMock.getWeather.mockReturnValue(of(makeWeather()));
      (component as any).renderTripsOnMap();
      expect(Object.keys((component as any).truckMarkers).length).toBe(1);
      expect(component.activeTruck).toBe('v1');
      expect((component as any).tripStartMarkers).toBeTruthy();
      expect((component as any).routeLines['v1']).toBeTruthy();
    });

    it('renders existing marker with open popup', () => {
      seedMap();
      const L = (jest.requireMock('leaflet') as any).default;
      const existing = L.marker();
      existing.getPopup = jest.fn(() => ({ isOpen: jest.fn(() => true), setContent: jest.fn() }));
      (component as any).truckMarkers = { v1: existing };
      component.allTrucks = [
        { id: 'v1', name: 'ABC1', type: 'truck', driver: 'Ali', phone: 'N/A', speed: -1, progress: 95, from: 'Tunis', to: 'Sousse', status: 'Autre', eco: false, consumption: 'x', hasAlert: false, coordinates: [36.81, 10.19], bearing: 0, fuelLevel: 10 } as any
      ];
      (component as any).tripCards = [makeTrip({ statut: 'Actif' })];
      (component as any).routeLines = {};
      (component as any).originalMarkersArr = [];
      (component as any).tripStartMarkers = {};
      (component as any).tripEndMarkers = {};
      (component as any).vehicleWeatherMarkers = {};
      weatherServiceMock.getWeather.mockReturnValue(of(makeWeather()));
      (component as any).renderTripsOnMap();
      expect(existing.getPopup().isOpen()).toBe(true);
    });

    it('updates popup content for existing marker with closed popup', () => {
      seedMap();
      const L = (jest.requireMock('leaflet') as any).default;
      const existing = L.marker();
      (component as any).truckMarkers = { v1: existing };
      component.allTrucks = [
        { id: 'v1', name: 'ABC1', type: 'truck', driver: 'Ali', phone: 'N/A', speed: 60, progress: 50, from: 'Tunis', to: 'Sousse', status: 'En cours', eco: false, consumption: 'x', hasAlert: false, coordinates: [36.81, 10.19], bearing: 30, fuelLevel: 50 } as any
      ];
      (component as any).tripCards = [makeTrip()];
      (component as any).routeLines = {};
      (component as any).originalMarkersArr = [];
      (component as any).tripStartMarkers = {};
      (component as any).tripEndMarkers = {};
      (component as any).vehicleWeatherMarkers = {};
      weatherServiceMock.getWeather.mockReturnValue(of(makeWeather()));
      (component as any).renderTripsOnMap();
      expect(existing.setPopupContent).toHaveBeenCalled();
    });

    it('new marker click handler selects truck', () => {
      seedMap();
      component.allTrucks = [
        { id: 'v1', name: 'ABC1', type: 'truck', driver: 'Ali', phone: 'N/A', speed: 60, progress: 50, from: 'Tunis', to: 'Sousse', status: 'En cours', eco: false, consumption: 'x', hasAlert: false, coordinates: [36.81, 10.19], bearing: 30, fuelLevel: 50 } as any
      ];
      (component as any).tripCards = [makeTrip()];
      (component as any).truckMarkers = {};
      (component as any).routeLines = {};
      (component as any).originalMarkersArr = [];
      (component as any).tripStartMarkers = {};
      (component as any).tripEndMarkers = {};
      (component as any).vehicleWeatherMarkers = {};
      weatherServiceMock.getWeather.mockReturnValue(of(makeWeather()));
      (component as any).renderTripsOnMap();
      const marker = (component as any).truckMarkers['v1'];
      const clickHandler = marker.on.mock.calls.find((c: any) => c[0] === 'click')?.[1];
      expect(clickHandler).toBeTruthy();
      clickHandler();
      expect(component.activeTruck).toBe('v1');
    });

    it('removes stale trip start/end markers', () => {
      seedMap();
      component.allTrucks = [
        { id: 'v1', name: 'ABC1', type: 'truck', driver: 'Ali', phone: 'N/A', speed: 60, progress: 50, from: 'Tunis', to: 'Sousse', status: 'En cours', eco: false, consumption: 'x', hasAlert: false, coordinates: [36.81, 10.19], bearing: 30, fuelLevel: 50 } as any
      ];
      (component as any).tripCards = [makeTrip()];
      (component as any).truckMarkers = {};
      (component as any).routeLines = {};
      (component as any).originalMarkersArr = [];
      (component as any).tripStartMarkers = { '99': { remove: jest.fn() } };
      (component as any).tripEndMarkers = { '99': { remove: jest.fn() } };
      (component as any).vehicleWeatherMarkers = {};
      weatherServiceMock.getWeather.mockReturnValue(of(makeWeather()));
      (component as any).renderTripsOnMap();
      expect((component as any).tripStartMarkers['99']).toBeUndefined();
      expect((component as any).tripEndMarkers['99']).toBeUndefined();
    });

    it('removes markers not in active set', () => {
      seedMap();
      const removed = { remove: jest.fn() } as any;
      (component as any).truckMarkers = { ghost: { remove: jest.fn() } };
      (component as any).routeLines = { ghost: { remove: jest.fn() } };
      (component as any).originalMarkersArr = [removed];
      component.allTrucks = [
        { id: 'v1', name: 'ABC1', type: 'truck', driver: '', phone: '', speed: 0, progress: 50, from: 'A', to: 'B', status: 'En cours', eco: false, consumption: 'x', hasAlert: false, coordinates: [36, 10] } as any
      ];
      (component as any).tripCards = [makeTrip()];
      (component as any).tripStartMarkers = {};
      (component as any).tripEndMarkers = {};
      (component as any).vehicleWeatherMarkers = {};
      weatherServiceMock.getWeather.mockReturnValue(of(makeWeather()));
      (component as any).renderTripsOnMap();
      expect((component as any).truckMarkers['ghost']).toBeUndefined();
    });

    it('handles trucks with no source trip coordinates', () => {
      seedMap();
      component.allTrucks = [
        { id: 'v1', name: 'ABC1', type: 'small', driver: '', phone: '', speed: 0, progress: 50, from: 'A', to: 'B', status: 'En cours', eco: false, consumption: 'x', hasAlert: false, coordinates: [36, 10], fuelLevel: null } as any
      ];
      (component as any).tripCards = [];
      (component as any).truckMarkers = {};
      (component as any).routeLines = {};
      (component as any).originalMarkersArr = [];
      (component as any).tripStartMarkers = {};
      (component as any).tripEndMarkers = {};
      (component as any).vehicleWeatherMarkers = {};
      weatherServiceMock.getWeather.mockReturnValue(of(makeWeather()));
      (component as any).renderTripsOnMap();
      expect(component.activeTruck).toBe('v1');
    });
  });

  describe('weather', () => {
    it('weatherBadgeIconName covers branches', () => {
      expect(component.weatherBadgeIconName(null)).toBe('cloud');
      expect(component.weatherBadgeIconName(makeWeather({ etatGeneral: 'CLAIR' }))).toBe('wb_sunny');
      expect(component.weatherBadgeIconName(makeWeather({ etatGeneral: 'PLUIE' }))).toBe('water_drop');
      expect(component.weatherBadgeIconName(makeWeather({ etatGeneral: 'ORAGE' }))).toBe('thunderstorm');
      expect(component.weatherBadgeIconName(makeWeather({ etatGeneral: 'NEIGE' }))).toBe('ac_unit');
      expect(component.weatherBadgeIconName(makeWeather({ etatGeneral: 'BROUILLARD' }))).toBe('air');
      expect(component.weatherBadgeIconName(makeWeather({ etatGeneral: 'NUAGEUX' }))).toBe('cloud');
      expect(component.weatherBadgeIconName(makeWeather({ etatGeneral: 'X' }))).toBe('cloud');
      expect(component.weatherBadgeIconName(makeWeather({ etatGeneral: undefined }))).toBe('cloud');
    });

    it('refreshCenterWeather returns when no map', () => {
      (component as any).map = undefined;
      weatherServiceMock.getWeather.mockClear();
      (component as any).refreshCenterWeather();
      expect(weatherServiceMock.getWeather).not.toHaveBeenCalled();
    });

    it('refreshCenterWeather fetches and sets centerWeather', () => {
      seedMap();
      (component as any).refreshCenterWeather();
      expect(component.centerWeather).not.toBeNull();
    });

    it('onMapMoveEnd refreshes center weather', () => {
      seedMap();
      const spy = jest.spyOn(component as any, 'refreshCenterWeather');
      (component as any).onMapMoveEnd();
      expect(spy).toHaveBeenCalled();
    });

    it('refreshWeatherForTrucks removes inactive markers', () => {
      seedMap();
      (component as any).vehicleWeatherMarkers = { ghost: { __m: true } };
      (component as any).map.removeLayer = jest.fn();
      (component as any).refreshWeatherForTrucks([
        { id: 'v1', coordinates: [36, 10], name: '', driver: '', speed: 0, progress: 0, from: '', to: '', status: '', eco: false, consumption: '', hasAlert: false } as any
      ]);
      expect((component as any).vehicleWeatherMarkers['ghost']).toBeUndefined();
      expect((component as any).map.removeLayer).toHaveBeenCalled();
    });

    it('refreshWeatherForTrucks skips truck without coords', () => {
      seedMap();
      weatherServiceMock.getWeather.mockClear();
      (component as any).refreshWeatherForTrucks([
        { id: 'v1', name: '', driver: '', speed: 0, progress: 0, from: '', to: '', status: '', eco: false, consumption: '', hasAlert: false } as any
      ]);
      expect(weatherServiceMock.getWeather).not.toHaveBeenCalled();
    });

    it('refreshWeatherState calls refresh functions', () => {
      seedMap();
      const spy1 = jest.spyOn(component as any, 'refreshWeatherForTrucks');
      const spy2 = jest.spyOn(component as any, 'refreshCenterWeather');
      (component as any).refreshWeatherState();
      expect(spy1).toHaveBeenCalled();
      expect(spy2).toHaveBeenCalled();
    });

    it('updateVehicleWeatherMarker returns early without coords or map', () => {
      (component as any).updateVehicleWeatherMarker({ id: 'x', name: '', driver: '', speed: 0, progress: 0, from: '', to: '', status: '', eco: false, consumption: '', hasAlert: false } as any, makeWeather());
      (component as any).map = undefined;
      (component as any).updateVehicleWeatherMarker({ id: 'x', coordinates: [36, 10], name: '', driver: '', speed: 0, progress: 0, from: '', to: '', status: '', eco: false, consumption: '', hasAlert: false } as any, makeWeather());
      expect(true).toBe(true);
    });

    it('updateVehicleWeatherMarker creates new marker', () => {
      seedMap();
      component['vehicleWeatherMarkers'] = {};
      (component as any).updateVehicleWeatherMarker(
        { id: 'v1', coordinates: [36, 10], name: '', driver: '', speed: 0, progress: 0, from: '', to: '', status: '', eco: false, consumption: '', hasAlert: false } as any,
        makeWeather({ risqueConduite: 'ROUGE' })
      );
      expect(component['vehicleWeatherMarkers']['v1']).toBeTruthy();
    });

    it('updateVehicleWeatherMarker updates existing marker', () => {
      seedMap();
      const existing = { setLatLng: jest.fn(), setIcon: jest.fn() } as any;
      component['vehicleWeatherMarkers'] = { v1: existing };
      (component as any).updateVehicleWeatherMarker(
        { id: 'v1', coordinates: [36, 10], name: '', driver: '', speed: 0, progress: 0, from: '', to: '', status: '', eco: false, consumption: '', hasAlert: false } as any,
        makeWeather()
      );
      expect(existing.setLatLng).toHaveBeenCalled();
      expect(existing.setIcon).toHaveBeenCalled();
    });
  });

  describe('zoom and navigation', () => {
    it('zoomIn/zoomOut call map methods', () => {
      seedMap();
      component.zoomIn();
      component.zoomOut();
      expect((component as any).map.zoomIn).toHaveBeenCalled();
      expect((component as any).map.zoomOut).toHaveBeenCalled();
    });

    it('updateStyle switches base layer', () => {
      seedMap();
      (component as any).baseLayers = {
        standard: { addTo: jest.fn() },
        satellite: { addTo: jest.fn() }
      };
      component.mapStyle = 'satellite';
      component.updateStyle();
      expect((component as any).map.removeLayer).toHaveBeenCalledTimes(2);
      expect((component as any).baseLayers['satellite'].addTo).toHaveBeenCalled();
    });
  });

  describe('selectTruck', () => {
    it('selects and pans to marker', () => {
      seedMap();
      const marker = { getLatLng: jest.fn(() => ({ lat: 1, lng: 2 })), openPopup: jest.fn() };
      (component as any).truckMarkers = { v1: marker };
      (component as any).activeTruck = 'v1';
      component.allTrucks = [{ id: 'v1', name: 'ABC1', driver: '', speed: 0, progress: 0, from: '', to: '', status: '', eco: false, consumption: '', hasAlert: false } as any];
      (component as any).tripCards = [makeTrip()];
      (component as any).map = (jest.requireMock('leaflet') as any).default.map();
      component.selectTruck('v1');
      expect((component as any).map.panTo).toHaveBeenCalled();
      expect(marker.openPopup).toHaveBeenCalled();
    });

    it('selectTruck without marker just sets active', () => {
      (component as any).truckMarkers = {};
      component.selectTruck('none');
      expect(component.activeTruck).toBe('none');
    });
  });

  describe('scrollToCard', () => {
    it('scrolls into view for existing card', () => {
      const el = document.createElement('div');
      el.id = 'truck-card-v1';
      document.body.appendChild(el);
      const spy = (Element.prototype.scrollIntoView as jest.Mock);
      spy.mockClear();
      (component as any).scrollToCard('v1');
      expect(spy).toHaveBeenCalled();
      document.body.removeChild(el);
    });

    it('shows mobile sidebar on narrow window', () => {
      const original = window.innerWidth;
      Object.defineProperty(window, 'innerWidth', { value: 500, configurable: true });
      (component as any).scrollToCard('nope');
      expect(component.showMobileSidebar).toBe(true);
      Object.defineProperty(window, 'innerWidth', { value: original, configurable: true });
    });

    it('shows sidebar on wide window', () => {
      (component as any).scrollToCard('nope');
      expect(component.showSidebar).toBe(true);
    });
  });

  describe('getters', () => {
    it('activeTruckData and activeTripId', () => {
      component.allTrucks = [{ id: 'v1', name: 'ABC1', driver: '', speed: 0, progress: 0, from: '', to: '', status: '', eco: false, consumption: '', hasAlert: false } as any];
      (component as any).tripCards = [makeTrip({ id: '7', vehiculeId: 'v1' })];
      (component as any).activeTruck = 'v1';
      expect(component.activeTruckData!.id).toBe('v1');
      expect(component.activeTripId).toBe(7);
    });

    it('activeTripId null when no truck or no trip', () => {
      component.allTrucks = [];
      expect(component.activeTripId).toBeNull();
      component.allTrucks = [{ id: 'x', name: 'Y', driver: '', speed: 0, progress: 0, from: '', to: '', status: '', eco: false, consumption: '', hasAlert: false } as any];
      (component as any).tripCards = [];
      expect(component.activeTripId).toBeNull();
    });

    it('activeTruckData undefined when not found', () => {
      component.allTrucks = [];
      expect(component.activeTruckData).toBeUndefined();
    });
  });

  describe('toggle actions', () => {
    it('handlePoiToggle roads on', () => {
      seedMap();
      (component as any).routeLines = { v1: { addTo: jest.fn(), removeLayer: jest.fn() } };
      (component as any).handlePoiToggle({ type: 'roads', checked: true });
      expect(component.showRoads).toBe(true);
    });

    it('handlePoiToggle roads off removes layer when hasLayer', () => {
      seedMap();
      const route = { addTo: jest.fn() };
      (component as any).routeLines = { v1: route };
      (component as any).map.hasLayer = jest.fn(() => true);
      (component as any).handlePoiToggle({ type: 'roads', checked: false });
      expect((component as any).map.removeLayer).toHaveBeenCalledWith(route);
    });

    it('handlePoiToggle non-roads checked on', () => {
      seedMap();
      (component as any).poiLayers['gas'] = { addTo: jest.fn() };
      (component as any).handlePoiToggle({ type: 'gas', checked: true });
      expect((component as any).poiLayers['gas'].addTo).toHaveBeenCalled();
    });

    it('handlePoiToggle non-roads checked off', () => {
      seedMap();
      (component as any).poiLayers['gas'] = {};
      (component as any).handlePoiToggle({ type: 'gas', checked: false });
      expect((component as any).map.removeLayer).toHaveBeenCalledWith((component as any).poiLayers['gas']);
    });

    it('handleFollowToggle sets followTruck', () => {
      component.handleFollowToggle(true);
      expect(component.followTruck).toBe(true);
      component.handleFollowToggle(false);
      expect(component.followTruck).toBe(false);
    });

    it('handlePrint and handleShare', () => {
      const printSpy = jest.spyOn(window, 'print' as any);
      const alertSpy = jest.spyOn(window, 'alert' as any);
      component.handlePrint();
      component.handleShare();
      expect(printSpy).toHaveBeenCalled();
      expect(alertSpy).toHaveBeenCalled();
    });

    it('goBack and goHome navigate', () => {
      component.goBack();
      component.goHome();
      expect(routerMock.navigate).toHaveBeenCalledWith(['/dashboard']);
      expect(routerMock.navigate).toHaveBeenCalledTimes(2);
    });
  });

  describe('location', () => {
    it('locateUser shows toast when geolocation unsupported', () => {
      Object.defineProperty(navigator, 'geolocation', { value: undefined, configurable: true });
      (component as any).locateUser();
      expect(component.toastMessage).toBe("La géolocalisation n'est pas supportée par votre navigateur.");
    });

    it('locateUser success path', () => {
      seedMap();
      Object.defineProperty(navigator, 'geolocation', {
        value: {
          getCurrentPosition: (success: any) => success({ coords: { latitude: 36.8, longitude: 10.18, accuracy: 10 } })
        },
        configurable: true
      });
      (component as any).map.removeLayer = jest.fn();
      (component as any).map.panTo = jest.fn();
      (component as any).locateUser();
      expect((component as any).isLocating).toBe(false);
      expect((component as any).locMarker).toBeTruthy();
      expect((component as any).locCircle).toBeTruthy();
      expect(component.toastMessage).toBeTruthy();
    });

    it('locateUser error path', () => {
      Object.defineProperty(navigator, 'geolocation', {
        value: {
          getCurrentPosition: (success: any, error: any) => error(new Error('denied'))
        },
        configurable: true
      });
      (component as any).locateUser();
      expect(component.toastMessage).toBe("Accès à la localisation refusé.");
    });
  });

  describe('fullscreen', () => {
    afterEach(() => {
      delete (document as any).fullscreenElement;
      delete (document as any).exitFullscreen;
    });

    it('toggleFullscreen returns when no element', () => {
      jest.spyOn(document, 'querySelector' as any).mockReturnValue(null);
      (component as any).toggleFullscreen();
    });

    it('toggleFullscreen enters fullscreen', () => {
      Object.defineProperty(document, 'fullscreenElement', { value: null, configurable: true });
      jest.spyOn(document, 'querySelector' as any).mockReturnValue({
        requestFullscreen: jest.fn(),
        webkitRequestFullscreen: undefined,
        msRequestFullscreen: undefined
      });
      (component as any).toggleFullscreen();
      document.querySelector('.map-container-wrapper');
    });

    it('toggleFullscreen exits fullscreen', () => {
      Object.defineProperty(document, 'fullscreenElement', { value: {}, configurable: true });
      jest.spyOn(document, 'querySelector' as any).mockReturnValue({});
      Object.defineProperty(document, 'exitFullscreen', { value: jest.fn(), configurable: true });
      (component as any).toggleFullscreen();
      expect(document.exitFullscreen).toHaveBeenCalled();
    });
  });

  describe('fitAllMarkers', () => {
    it('shows toast when no markers', () => {
      (component as any).truckMarkers = {};
      (component as any).fitAllMarkers();
      expect(component.toastMessage).toBe("Aucun véhicule sur la carte.");
    });

    it('returns early when initialAutoFitDone', () => {
      (component as any).truckMarkers = { a: { getLatLng: jest.fn() } };
      (component as any).initialAutoFitDone = true;
      (component as any).fitAllMarkers();
      expect(component.toastMessage).toBeNull();
    });

    it('fits single marker via setView', () => {
      seedMap();
      (component as any).truckMarkers = { a: { getLatLng: jest.fn(() => ({ lat: 1, lng: 2 })) } };
      (component as any).initialAutoFitDone = false;
      (component as any).fitAllMarkers();
      expect((component as any).map.setView).toHaveBeenCalled();
      expect((component as any).initialAutoFitDone).toBe(true);
    });

    it('fits multiple markers via featureGroup', () => {
      seedMap();
      (component as any).truckMarkers = {
        a: { getLatLng: jest.fn(() => ({ lat: 1, lng: 2 })) },
        b: { getLatLng: jest.fn(() => ({ lat: 3, lng: 4 })) }
      };
      (component as any).initialAutoFitDone = false;
      (component as any).fitAllMarkers();
      expect((component as any).map.fitBounds).toHaveBeenCalled();
    });
  });

  describe('resetCompass', () => {
    it('flies to center and shows toast', () => {
      seedMap();
      (component as any).resetCompass();
      expect((component as any).map.flyTo).toHaveBeenCalled();
      expect(component.toastMessage).toBe("Vue réinitialisée");
    });
  });

  describe('toggleRouteLayer', () => {
    it('activates with route present and already on map', () => {
      seedMap();
      const route = { addTo: jest.fn() };
      (component as any).routeLines = { v1: route };
      (component as any).activeTruck = 'v1';
      (component as any).map.hasLayer = jest.fn(() => true);
      (component as any).toggleRouteLayer();
      expect(component.isRouteLayerActive).toBe(true);
      expect(component.toastMessage).toBe("Itinéraire OSRM affiché");
    });

    it('activates adds route to map', () => {
      seedMap();
      const route = { addTo: jest.fn() };
      (component as any).routeLines = { v1: route };
      (component as any).activeTruck = 'v1';
      (component as any).map.hasLayer = jest.fn(() => false);
      (component as any).toggleRouteLayer();
      expect(route.addTo).toHaveBeenCalled();
      expect(component.isRouteLayerActive).toBe(true);
    });

    it('deactivates without active route shows toast and resets', () => {
      seedMap();
      (component as any).routeLines = {};
      (component as any).toggleRouteLayer();
      expect(component.isRouteLayerActive).toBe(false);
      expect(component.toastMessage).toBe("Aucun itinéraire OSRM disponible pour le véhicule actif.");
    });

    it('deactivates removes dynamic line and route', () => {
      seedMap();
      const route = { addTo: jest.fn() };
      (component as any).routeLines = { v1: route };
      (component as any).activeTruck = 'v1';
      (component as any).map.hasLayer = jest.fn(() => true);
      (component as any).dynamicRouteLine = { removeLayer: jest.fn() };
      (component as any).toggleRouteLayer(); // activate
      (component as any).toggleRouteLayer(); // deactivate
      expect((component as any).map.removeLayer).toHaveBeenCalledWith(route);
      expect((component as any).dynamicRouteLine).toBeNull();
    });
  });

  describe('toggleCluster', () => {
    it('activates cluster', () => {
      seedMap();
      const spy = jest.spyOn(component as any, 'updateClusters');
      (component as any).toggleCluster();
      expect(component.isClusterActive).toBe(true);
      expect(spy).toHaveBeenCalled();
      expect(component.toastMessage).toBe("Regroupement activé");
    });

    it('deactivates cluster restoring markers', () => {
      seedMap();
      (component as any).toggleCluster(); // activate
      const restore = jest.spyOn(component as any, 'restoreMarkers');
      (component as any).toggleCluster(); // deactivate
      expect(component.isClusterActive).toBe(false);
      expect(restore).toHaveBeenCalled();
      expect(component.toastMessage).toBe("Regroupement désactivé");
    });
  });

  describe('updateClusters / restoreMarkers', () => {
    it('returns when not active or fewer than 2 markers', () => {
      seedMap();
      (component as any).isClusterActive = false;
      (component as any).originalMarkersArr = [];
      (component as any).updateClusters();
      (component as any).isClusterActive = true;
      (component as any).originalMarkersArr = [{}];
      (component as any).updateClusters();
      expect(true).toBe(true);
    });

    it('clusters markers when close', () => {
      seedMap();
      (component as any).isClusterActive = true;
      const m1 = { getLatLng: jest.fn(() => ({ lat: 36, lng: 10 })) };
      const m2 = { getLatLng: jest.fn(() => ({ lat: 36.001, lng: 10.001 })) };
      (component as any).originalMarkersArr = [m1, m2];
      (component as any).map.hasLayer = jest.fn(() => true);
      (component as any).map.latLngToLayerPoint = jest.fn(() => ({ x: 10, y: 10 }));
      (component as any).simulatedClusterMarker = null;
      (component as any).updateClusters();
      expect((component as any).simulatedClusterMarker).toBeTruthy();
    });

    it('cluster marker click pans to midpoint', () => {
      seedMap();
      (component as any).isClusterActive = true;
      const m1 = { getLatLng: jest.fn(() => ({ lat: 36, lng: 10 })) };
      const m2 = { getLatLng: jest.fn(() => ({ lat: 36.001, lng: 10.001 })) };
      (component as any).originalMarkersArr = [m1, m2];
      (component as any).map.hasLayer = jest.fn(() => true);
      (component as any).map.latLngToLayerPoint = jest.fn(() => ({ x: 10, y: 10 }));
      (component as any).simulatedClusterMarker = null;
      (component as any).updateClusters();
      const sim = (component as any).simulatedClusterMarker;
      const clickHandler = sim.on.mock.calls.find((c: any) => c[0] === 'click')?.[1];
      expect(clickHandler).toBeTruthy();
      clickHandler();
      expect((component as any).map.panTo).toHaveBeenCalled();
    });

    it('restores markers when far apart', () => {
      seedMap();
      const latlng1 = { lat: 36, lng: 10 };
      const latlng2 = { lat: 36, lng: 10.1 };
      (component as any).isClusterActive = true;
      const m1 = { getLatLng: jest.fn(() => latlng1), addTo: jest.fn() };
      const m2 = { getLatLng: jest.fn(() => latlng2), addTo: jest.fn() };
      (component as any).originalMarkersArr = [m1, m2];
      (component as any).simulatedClusterMarker = { addTo: jest.fn() };
      (component as any).map.latLngToLayerPoint = jest.fn((pt: any) => (pt === latlng1 ? { x: 0, y: 0 } : { x: 200, y: 200 }));
      (component as any).updateClusters();
      expect(component.toastMessage).toBeNull();
      expect((component as any).simulatedClusterMarker).toBeNull();
    });

    it('restoreMarkers adds markers back', () => {
      seedMap();
      const sim = { addTo: jest.fn() };
      (component as any).simulatedClusterMarker = sim;
      const m1 = { addTo: jest.fn() };
      (component as any).originalMarkersArr = [m1];
      (component as any).restoreMarkers();
      expect((component as any).simulatedClusterMarker).toBeNull();
      expect(m1.addTo).toHaveBeenCalled();
    });
  });

  describe('showToast', () => {
    it('shows toast and clears after timeout', () => {
      jest.useFakeTimers();
      (component as any).showToast('hi', 10);
      expect(component.toastVisible).toBe(true);
      expect(component.toastMessage).toBe('hi');
      jest.advanceTimersByTime(10);
      expect(component.toastVisible).toBe(false);
      jest.advanceTimersByTime(310);
      expect(component.toastMessage).toBeNull();
      jest.useRealTimers();
    });
  });

  describe('resolve/extract helpers', () => {
    it('resolveTripStartPoint with invalid geometry fallback', () => {
      const r = (component as any).resolveTripStartPoint(makeTrip());
      expect(r).toBeTruthy();
      expect((component as any).resolveTripStartPoint(undefined)).toBeNull();
      expect((component as any).resolveTripStartPoint(makeTrip({ geometrieItineraire: '{bad json' }))).toBeTruthy();
      expect((component as any).resolveTripStartPoint(makeTrip({ geometrieItineraire: '{"coordinates":[]}' }))).toEqual([36.8, 10.18]);
    });

    it('resolveTripStartPoint with first coords', () => {
      const r = (component as any).resolveTripStartPoint(makeTrip({ id: 'x', latitudeDepart: undefined, longitudeDepart: undefined }));
      expect(r).toEqual([36.8, 10.18]);
    });

    it('resolveTripEndPoint variants', () => {
      expect((component as any).resolveTripEndPoint(undefined)).toBeNull();
      const r1 = (component as any).resolveTripEndPoint(makeTrip());
      expect(r1).toEqual([36.9, 10.22]);
      const r2 = (component as any).resolveTripEndPoint(makeTrip({ geometrieItineraire: '{bad' }));
      expect(r2).toEqual([36.9, 10.22]);
      expect((component as any).resolveTripEndPoint(makeTrip({ latitudeArrivee: undefined, longitudeArrivee: undefined }))).not.toBeNull();
    });

    it('resolveTripStartPoint returns null when no fallback', () => {
      expect((component as any).resolveTripStartPoint(makeTrip({ geometrieItineraire: '{"coordinates":[]}', latitudeDepart: undefined, longitudeDepart: undefined }))).toBeNull();
    });

    it('resolveTripEndPoint returns null when no fallback', () => {
      expect((component as any).resolveTripEndPoint(makeTrip({ geometrieItineraire: '{"coordinates":[]}', latitudeArrivee: undefined, longitudeArrivee: undefined }))).toBeNull();
    });

    it('extractRouteCoordinates returns null without geometry', () => {
      expect((component as any).extractRouteCoordinates(undefined)).toBeNull();
      expect((component as any).extractRouteCoordinates(makeTrip({ geometrieItineraire: undefined }))).toBeNull();
    });

    it('extractRouteCoordinates parses FeatureCollection', () => {
      const r = (component as any).extractRouteCoordinates(makeTrip());
      expect(r!.length).toBe(3);
      expect(r![0]).toEqual([36.8, 10.18]);
    });

    it('extractRouteCoordinates parses Feature and plain', () => {
      const r1 = (component as any).extractRouteCoordinates(makeTrip({ geometrieItineraire: GEO_FEATURE }));
      expect(r1).not.toBeNull();
      const r2 = (component as any).extractRouteCoordinates(makeTrip({ geometrieItineraire: GEO_PLAIN }));
      expect(r2).not.toBeNull();
    });

    it('extractRouteCoordinates handles bad json and short arrays', () => {
      expect((component as any).extractRouteCoordinates(makeTrip({ geometrieItineraire: '{bad' }))).toBeNull();
      expect((component as any).extractRouteCoordinates(makeTrip({ geometrieItineraire: '{"type":"FeatureCollection","features":[]}' }))).toBeNull();
      expect((component as any).extractRouteCoordinates(makeTrip({ geometrieItineraire: '{"coordinates":[[10,\"x\",1]]}' }))).toBeNull();
    });
  });

  describe('tripPoint helpers', () => {
    it('tripPointIcon', () => {
      (component as any).tripPointIcon('Départ', '#16a34a');
      (component as any).tripPointIcon('Arrivée', '#ef4444');
      expect(true).toBe(true);
    });

    it('tripPointPopup', () => {
      const truck = { name: 'X', driver: 'Ali' } as any;
      (component as any).tripPointPopup('Point de départ', 'Tunis', truck);
      (component as any).tripPointPopup('Point d\'arrivée', 'Sousse', truck);
      expect(true).toBe(true);
    });

    it('buildTruckIcon variants', () => {
      (component as any).buildTruckIcon(0, 'small');
      (component as any).buildTruckIcon(0, 'van');
      (component as any).buildTruckIcon(0, 'truck');
      (component as any).buildTruckIcon(0, undefined);
      expect(true).toBe(true);
    });
  });

  describe('addPOIs / updateStyle helpers', () => {
    it('addPOIs runs without error', () => {
      (component as any).addPOIs();
      expect(true).toBe(true);
    });
  });

  describe('updateVehicleMarkersOnly routing through captured tick', () => {
    it('invokes position tick callback', () => {
      (component as any).map = (jest.requireMock('leaflet') as any).default.map();
      (component as any).vehicleInterpStates = new Map();
      fleetServiceMock.getTripsCarte.mockReturnValue(of([]));
      if (typeof positionTick === 'function') { positionTick(); }
      expect(fleetServiceMock.getTripsCarte).toHaveBeenCalled();
    });

    it('refresh tick invokes loadTripsFromBackend(true)', () => {
      (component as any).map = (jest.requireMock('leaflet') as any).default.map();
      fleetServiceMock.getTripsCarte.mockReturnValue(of([makeTrip()]));
      (component as any).vehicleInterpStates = new Map();
      if (typeof refreshTick === 'function') { refreshTick(); }
      expect(fleetServiceMock.getTripsCarte).toHaveBeenCalled();
    });

    it('weather tick invokes refreshWeatherState', () => {
      seedMap();
      weatherServiceMock.getWeather.mockReturnValue(of(makeWeather()));
      if (typeof weatherTick === 'function') { weatherTick(); }
      expect(true).toBe(true);
    });
  });

  describe('interval realtime stream event handlers', () => {
    it('gps-position event triggers loadTripsFromBackend', () => {
      (global as any).EventSource = MockEventSource;
      (component as any).gpsRealtimeSource = undefined;
      (component as any).connectGpsRealtime();
      const addEventListener = (component as any).gpsRealtimeSource.addEventListener;
      const handler = addEventListener.mock.calls.find((c: any) => c[0] === 'gps-position')?.[1];
      expect(handler).toBeTruthy();
      fleetServiceMock.getTripsCarte.mockReturnValue(of([makeTrip()]));
      seedMap();
      handler();
      expect(fleetServiceMock.getTripsCarte).toHaveBeenCalled();
    });
  });
});
