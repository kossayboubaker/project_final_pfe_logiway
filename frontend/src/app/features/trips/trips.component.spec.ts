import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { provideRouter } from '@angular/router';
import { of, Subject, BehaviorSubject, throwError } from 'rxjs';
import { TripsComponent } from './trips.component';
import { FleetService, Trip } from '../../core/services/fleet.service';
import { AuthService } from '../../core/auth.service';
import { NotificationService, AppNotification } from '../../core/services/notification.service';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { ConfirmDeleteDialogComponent } from '../../shared/components/confirm-delete-dialog/confirm-delete-dialog.component';
import {
  Chart,
  BarController, BarElement,
  CategoryScale, LinearScale,
  LineController, LineElement, PointElement,
  Tooltip, Legend, Filler
} from 'chart.js';

jest.mock('leaflet', () => {
  const makeMarker = (ll: any) => ({
    addTo: jest.fn().mockReturnThis(),
    getLatLng: jest.fn(() => ll)
  });
  return {
    __esModule: true,
    map: jest.fn(() => ({
      on: jest.fn(),
      remove: jest.fn(),
      removeLayer: jest.fn(),
      invalidateSize: jest.fn(),
      fitBounds: jest.fn()
    })),
    tileLayer: jest.fn(() => ({ addTo: jest.fn() })),
    marker: jest.fn((ll: any) => makeMarker(ll)),
    polyline: jest.fn((pts: any[]) => ({ addTo: jest.fn().mockReturnThis(), getLatLng: jest.fn(() => pts[0]) })),
    divIcon: jest.fn((opts: any) => opts),
    latLng: jest.fn((a: number, b: number) => ({ lat: a, lng: b })),
    latLngBounds: jest.fn(() => ({ pad: jest.fn(() => ({})) }))
  };
});

Chart.register(
  BarController, BarElement,
  LineController, LineElement, PointElement,
  CategoryScale, LinearScale,
  Tooltip, Legend, Filler
);

describe('TripsComponent', () => {
  let component: TripsComponent;
  let fixture: ComponentFixture<TripsComponent>;
  let fleetServiceMock: jasmine.SpyObj<FleetService>;
  let authServiceMock: jasmine.SpyObj<AuthService>;
  let notificationServiceMock: jasmine.SpyObj<NotificationService>;
  let snackBarMock: any;
  let dialogMock: any;
  let realtimeSubject: Subject<AppNotification>;
  let currentUserSubject: BehaviorSubject<any>;
  let consoleErrorSpy: jest.SpyInstance;

  const mockTrips: Trip[] = [
    {
      id: '1', date: '01/06/2025 08:00', from: 'Tunis', to: 'Sousse',
      driver: 'Ali Ben', driverId: '5', managerId: '3',
      vehicle: 'TN-001', vehicleId: '1', status: 'Terminé'
    },
    {
      id: '2', date: '02/06/2025 09:00', from: 'Sfax', to: 'Bizerte',
      driver: 'Sara Kamel', driverId: '6', managerId: '3',
      vehicle: 'TN-002', vehicleId: '2', status: 'En Cours'
    }
  ];

  function mkVehicle(over: any = {}): any {
    return Object.assign({
      id: '1', plate: 'TN-001', marque: 'Volvo', modele: 'FH',
      driverId: '5', driverName: 'Ali Ben'
    }, over);
  }

  beforeAll(() => {
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterAll(() => {
    consoleErrorSpy.mockRestore();
  });

  beforeEach(async () => {
    realtimeSubject = new Subject<AppNotification>();
    currentUserSubject = new BehaviorSubject({ id: '3', role: 'MANAGER', username: 'Jean Test' });

    fleetServiceMock = jasmine.createSpyObj('FleetService', [
      'getTrips', 'getTripStats', 'addTrip', 'updateTrip', 'deleteTrip',
      'getVehicles', 'getDriversList', 'getVehiclesList', 'getVehicleDetails'
    ]);
    fleetServiceMock.getTrips.and.returnValue(of(mockTrips));
    fleetServiceMock.getTripStats.and.returnValue(of({
      Lundi: 1, Mardi: 0, Mercredi: 2, Jeudi: 0, Vendredi: 1, Samedi: 0, Dimanche: 0
    }));
    fleetServiceMock.getVehicles.and.returnValue(of([mkVehicle()]));
    fleetServiceMock.getDriversList.and.returnValue(of([{ id: '5', name: 'Ali Ben' }]));
    fleetServiceMock.getVehiclesList.and.returnValue(of([{ id: '1', plate: 'TN-001' }]));
    fleetServiceMock.getVehicleDetails.and.returnValue(of(mkVehicle()));
    fleetServiceMock.addTrip.and.returnValue(of(mockTrips[0]));
    fleetServiceMock.updateTrip.and.returnValue(of(mockTrips[0]));
    fleetServiceMock.deleteTrip.and.returnValue(of(undefined));

    authServiceMock = jasmine.createSpyObj('AuthService', ['getUser', 'isAuthenticated']);
    authServiceMock.getUser.and.returnValue({ id: '3', role: 'MANAGER', username: 'Jean Test' });
    authServiceMock.isAuthenticated.and.returnValue(true);
    Object.defineProperty(authServiceMock, 'currentUser', { get: () => currentUserSubject.asObservable() });

    notificationServiceMock = jasmine.createSpyObj('NotificationService', ['connectRealtime']);
    Object.defineProperty(notificationServiceMock, 'realtimeNotification$', {
      get: () => realtimeSubject.asObservable()
    });

    snackBarMock = { openFromComponent: jasmine.createSpy('openFromComponent'), open: jasmine.createSpy('open') };
    dialogMock = { open: jasmine.createSpy('open') };

    await TestBed.configureTestingModule({
      imports: [TripsComponent],
      providers: [
        provideRouter([]),
        provideHttpClient(),
        provideHttpClientTesting(),
        provideAnimationsAsync(),
        { provide: FleetService, useValue: fleetServiceMock },
        { provide: AuthService, useValue: authServiceMock },
        { provide: NotificationService, useValue: notificationServiceMock },
        { provide: MatSnackBar, useValue: snackBarMock },
        { provide: MatDialog, useValue: dialogMock }
      ]
    })
      .overrideComponent(TripsComponent, { remove: { imports: [MatSnackBarModule, MatDialogModule] } })
      .compileComponents();

    fixture = TestBed.createComponent(TripsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should call getTrips() on init', () => {
    expect(fleetServiceMock.getTrips).toHaveBeenCalled();
  });

  it('should load trips into dataSource', () => {
    expect(component.dataSource.data.length).toBe(2);
  });

  it('should set isManager true for MANAGER role', () => {
    expect(component.isManager).toBeTrue();
  });

  it('should set isManager false for CHAUFFEUR role', () => {
    currentUserSubject.next({ id: '9', role: 'CHAUFFEUR', username: 'Ali' });
    component.ngOnDestroy();
    fixture.detectChanges();
    expect(component.isManager).toBeFalse();
  });

  it('should not load trips when no user', () => {
    currentUserSubject.next(null);
    component.ngOnDestroy();
    fixture.detectChanges();
    expect(component.currentUser).toBeNull();
  });

  it('should load drivers and vehicles into select data', () => {
    expect(component.drivers.length).toBe(1);
    expect(component.vehiclePlates.length).toBe(1);
    expect(component.vehicleOptions.length).toBe(1);
  });

  // ─── Counts ───────────────────────────────────────────────────
  it('getCompletedCount() should count Terminé/Complété trips', () => {
    expect(component.getCompletedCount()).toBe(1);
  });

  it('getInProgressCount() should count En Cours trips', () => {
    expect(component.getInProgressCount()).toBe(1);
  });

  it('getActiveCount() should count Actif trips', () => {
    expect(component.getActiveCount()).toBe(0);
  });

  // ─── Filter ───────────────────────────────────────────────────
  it('applyFilter() should update dataSource.filter', () => {
    const event = { target: { value: 'Tunis' } } as any;
    component.applyFilter(event);
    expect(component.dataSource.filter).toBe('tunis');
  });

  it('applyFilter() should trim whitespace', () => {
    const event = { target: { value: '  Sfax  ' } } as any;
    component.applyFilter(event);
    expect(component.dataSource.filter).toBe('sfax');
  });

  it('applyFilter() should reset paginator to first page', () => {
    component.dataSource.paginator = { firstPage: jasmine.createSpy('firstPage') } as any;
    component.applyFilter({ target: { value: 'x' } } as any);
    expect(component.dataSource.paginator!.firstPage).toHaveBeenCalled();
  });

  // ─── Status class ─────────────────────────────────────────────
  it('getStatusClass() should convert status to CSS class', () => {
    expect(component.getStatusClass('En Cours')).toBe('en-cours');
    expect(component.getStatusClass('Terminé')).toBe('terminé');
    expect(component.getStatusClass('Complété')).toBe('complété');
    expect(component.getStatusClass('Actif')).toBe('actif');
    expect(component.getStatusClass('')).toBe('');
    expect(component.getStatusClass('Planifié')).toBe('planifié');
  });

  // ─── Modal ────────────────────────────────────────────────────
  it('openCreate() should set showModal to true and reset map state', () => {
    component.openCreate();
    expect(component.showModal).toBeTrue();
    expect(component.isEditMode).toBeFalse();
    expect(component.editingTripId).toBeNull();
    expect((component as any).mapClickCount).toBe(0);
    expect(component.mapInstruction).toBe('Cliquez pour définir le départ, puis la destination');
  });

  it('closeModal() should set showModal to false', () => {
    component.showModal = true;
    component.closeModal();
    expect(component.showModal).toBeFalse();
  });

  it('closeModal() should reset form and destroy map', () => {
    component.openCreate();
    component.trajetForm.patchValue({ pointDepart: 'Tunis' });
    const destroySpy = spyOn(component as any, 'destroyMiniMap');
    component.closeModal();
    expect(component.trajetForm.get('pointDepart')?.value).toBeNull();
    expect(destroySpy).toHaveBeenCalled();
  });

  it('openEdit() should populate the form from the trip', () => {
    const trip: Trip = {
      id: '5', date: '2025-06-01T08:00:00', dateDepartIso: '2025-06-01T08:00:00',
      dateArriveeIso: '2025-06-01T18:00:00',
      from: 'Tunis', to: 'Sousse', driver: 'Ali', driverId: '7',
      vehicle: 'TN-009', vehicleId: '9', status: 'Actif', managerId: '3'
    };
    component.openEdit(trip);
    expect(component.isEditMode).toBeTrue();
    expect(component.editingTripId).toBe('5');
    expect(component.trajetForm.get('pointDepart')?.value).toEqual('Tunis');
    expect(component.trajetForm.get('statut')?.value).toBe('Actif');
  });

  it('openEdit() formats non-ISO dates', () => {
    const trip: Trip = {
      id: '6', date: '01/06/2025', from: 'Gafsa', to: 'Tunis',
      driver: 'Z', driverId: '8', vehicle: 'X', vehicleId: '10',
      status: 'Terminé', managerId: '3'
    };
    component.openEdit(trip);
    expect(component.trajetForm.get('pointDepart')?.value).toEqual('Gafsa');
  });

  // ─── Form validation ──────────────────────────────────────────
  it('form should be invalid when empty', () => {
    expect(component.trajetForm.valid).toBeFalse();
  });

  it('form should be valid with all required fields filled', () => {
    component.trajetForm.patchValue({
      pointDepart: 'Tunis',
      destination: 'Sousse',
      dateDepart: new Date(2025, 5, 1),
      heureDepart: '08:00',
      dateArrivee: new Date(2025, 5, 1),
      heureArrivee: '14:00',
      statut: 'Actif',
      IDChauffeur: '5',
      IDVehicule: '1'
    });
    expect(component.trajetForm.get('pointDepart')?.valid).toBeTrue();
    expect(component.trajetForm.get('destination')?.valid).toBeTrue();
  });

  // ─── Static validator ─────────────────────────────────────────
  it('dateRangeValidator() should return null when end > start', () => {
    const group = component.trajetForm;
    group.patchValue({
      dateDepart: new Date(2025, 5, 1),
      heureDepart: '08:00',
      dateArrivee: new Date(2025, 5, 1),
      heureArrivee: '18:00'
    });
    expect(TripsComponent.dateRangeValidator(group)).toBeNull();
  });

  it('dateRangeValidator() should return error when end <= start', () => {
    const group = component.trajetForm;
    group.patchValue({
      dateDepart: new Date(2025, 5, 1),
      heureDepart: '18:00',
      dateArrivee: new Date(2025, 5, 1),
      heureArrivee: '08:00'
    });
    expect(TripsComponent.dateRangeValidator(group)).toEqual({ dateRange: true });
  });

  it('dateRangeValidator() with missing end should return null', () => {
    const group = component.trajetForm;
    group.patchValue({ dateDepart: new Date(2025, 5, 1) });
    expect(TripsComponent.dateRangeValidator(group)).toBeNull();
  });

  // ─── Realtime ─────────────────────────────────────────────────
  it('should reload trips on NOTIF_TRAJET realtime event', () => {
    const initialCount = fleetServiceMock.getTrips.calls.count();
    realtimeSubject.next({
      id: '99', title: 'Trajet', message: 'Mise à jour',
      type: 'INFO', category: 'NOTIF_TRAJET',
      time: 'now', date: new Date(), isRead: false, dismissed: false
    });
    expect(fleetServiceMock.getTrips.calls.count()).toBeGreaterThan(initialCount);
  });

  it('should reload trips on NOTIF_VEHICULE realtime event', () => {
    const initialCount = fleetServiceMock.getTrips.calls.count();
    realtimeSubject.next({
      id: '98', title: 'Véhicule', message: 'Màj',
      type: 'INFO', category: 'NOTIF_VEHICULE',
      time: 'now', date: new Date(), isRead: false, dismissed: false
    });
    expect(fleetServiceMock.getTrips.calls.count()).toBeGreaterThan(initialCount);
  });

  it('should ignore other realtime categories', () => {
    const initialCount = fleetServiceMock.getTrips.calls.count();
    realtimeSubject.next({
      id: '97', title: 'Autre', message: 'x',
      type: 'INFO', category: 'AUTRE' as any,
      time: 'now', date: new Date(), isRead: false, dismissed: false
    });
    expect(fleetServiceMock.getTrips.calls.count()).toBe(initialCount);
  });

  // ─── Submit ───────────────────────────────────────────────────
  function fillValidForm(): void {
    component.trajetForm.patchValue({
      pointDepart: 'Tunis',
      destination: 'Sousse',
      dateDepart: new Date(Date.now() + 24 * 3600 * 1000),
      heureDepart: '08:00',
      dateArrivee: new Date(Date.now() + 48 * 3600 * 1000),
      heureArrivee: '18:00',
      statut: 'Actif',
      IDChauffeur: '5',
      IDVehicule: '1'
    });
  }

  it('onSubmit() invalid form does nothing', () => {
    component.trajetForm.patchValue({ pointDepart: '' });
    component.onSubmit();
    expect(fleetServiceMock.addTrip).not.toHaveBeenCalled();
    expect(fleetServiceMock.updateTrip).not.toHaveBeenCalled();
  });

  it('onSubmit() creates a new trip', () => {
    fillValidForm();
    component.onSubmit();
    expect(fleetServiceMock.addTrip).toHaveBeenCalled();
    expect(snackBarMock.openFromComponent).toHaveBeenCalled();
    expect(component.showModal).toBeFalse();
  });

  it('onSubmit() with selectedVehicle driver name', () => {
    fillValidForm();
    (component as any).selectedVehicle = mkVehicle();
    component.onSubmit();
    expect(fleetServiceMock.addTrip).toHaveBeenCalledWith(
      jasmine.objectContaining({ driver: 'Ali Ben' })
    );
  });

  it('onSubmit() updates an existing trip', () => {
    component.isEditMode = true;
    component.editingTripId = '1';
    component.dataSource.data = [...mockTrips];
    fillValidForm();
    component.onSubmit();
    expect(fleetServiceMock.updateTrip).toHaveBeenCalledWith('1', jasmine.anything());
    expect(snackBarMock.openFromComponent).toHaveBeenCalled();
    expect(component.showModal).toBeFalse();
  });

  // ─── Vehicle selection ────────────────────────────────────────
  it('onVehicleSelected with empty vehicle clears fields', () => {
    component.onVehicleSelected('');
    expect(component.selectedVehicle).toBeNull();
    expect(component.drivers).toEqual([]);
    expect(component.trajetForm.get('IDChauffeur')?.value).toBe('');
  });

  it('onVehicleSelected with vehicle without driver', () => {
    fleetServiceMock.getVehicleDetails.and.returnValue(of(mkVehicle({ driverId: null, driverName: null })));
    component.onVehicleSelected('1');
    expect(component.drivers).toEqual([]);
    expect(component.selectedVehicleDriverNote).toContain('pas encore de chauffeur');
  });

  it('onVehicleSelected with vehicle and driver fills the driver', () => {
    component.onVehicleSelected('1');
    expect(component.selectedVehicle?.id).toBe('1');
    expect(component.drivers).toEqual([{ id: '5', name: 'Ali Ben' }]);
    expect(component.trajetForm.get('IDChauffeur')?.value).toBe('5');
    expect(component.selectedVehicleDriverNote).toContain('Ali Ben');
  });

  it('resolveVehicleSelectionId maps plate to id', () => {
    expect((component as any).resolveVehicleSelectionId('TN-001')).toBe('1');
    expect((component as any).resolveVehicleSelectionId('1')).toBe('1');
    expect((component as any).resolveVehicleSelectionId('')).toBe('');
    expect((component as any).resolveVehicleSelectionId(null)).toBe('');
  });

  // ─── Delete ───────────────────────────────────────────────────
  it('deleteTrip() with confirm removes the trip', () => {
    const afterClosed = new Subject<boolean>();
    dialogMock.open.and.callFake((c: unknown, config: any) => {
      expect(c).toBe(ConfirmDeleteDialogComponent);
      return { afterClosed: () => afterClosed.asObservable() };
    });
    component.dataSource.data = [...mockTrips];
    component.deleteTrip(mockTrips[0]);
    afterClosed.next(true);
    expect(fleetServiceMock.deleteTrip).toHaveBeenCalledWith('1');
    expect(component.dataSource.data.length).toBe(1);
    expect(snackBarMock.openFromComponent).toHaveBeenCalled();
  });

  it('deleteTrip() with cancel does not delete', () => {
    const afterClosed = new Subject<boolean>();
    dialogMock.open.and.callFake(() => ({ afterClosed: () => afterClosed.asObservable() }));
    component.deleteTrip(mockTrips[0]);
    afterClosed.next(false);
    expect(fleetServiceMock.deleteTrip).not.toHaveBeenCalled();
  });

  // ─── Chart gradient ───────────────────────────────────────────
  it('chart backgroundColor handles missing chartArea', () => {
    const cb = (component.barChartData.datasets[0] as any).backgroundColor;
    expect(cb({ chart: {} })).toBe('#3b82f6');
  });

  it('chart backgroundColor builds gradient when chartArea present', () => {
    const addColorStop = jasmine.createSpy('addColorStop');
    const ctx = { createLinearGradient: jasmine.createSpy('createLinearGradient').and.returnValue({ addColorStop }) };
    const cb = (component.barChartData.datasets[0] as any).backgroundColor;
    const result = cb({ chart: { ctx, chartArea: { top: 0, bottom: 100 } } });
    expect(result).toBeTruthy();
    expect(addColorStop).toHaveBeenCalled();
  });

  // ─── Helpers ──────────────────────────────────────────────────
  it('parseDateStr handles various formats', () => {
    const p = (component as any).parseDateStr;
    expect(p('')).toBeNull();
    expect(p('2025-06-01T10:00:00')).toBeInstanceOf(Date);
    expect(p('01/06/2025')).toBeInstanceOf(Date);
    expect(p('1 juin 2025')).toBeInstanceOf(Date);
    expect(p('1 janv 2025')).toBeInstanceOf(Date);
    expect(p('1 fév 2025')).toBeInstanceOf(Date);
    expect(p('nimporte quoi')).toBeNull();
  });

  it('extractTime returns null for invalid values', () => {
    const e = (component as any).extractTime;
    expect(e('')).toBeNull();
    expect(e('not-a-date')).toBeNull();
    expect(e('2025-06-01T08:30:00')).toBe('08:30');
  });

  it('combineDateAndTime combines date and time', () => {
    const out = (component as any).combineDateAndTime(new Date(2025, 5, 1), '08:15');
    expect(out).toContain('2025-06-01');
    const out2 = (component as any).combineDateAndTime(new Date(2025, 5, 1), '');
    expect(out2).toContain('T00:00:00');
  });

  it('openCreate triggers initMiniMap via timeout', () => {
    jest.useFakeTimers();
    const initSpy = jest.spyOn(component as any, 'initMiniMap').mockImplementation(() => {});
    component.openCreate();
    jest.runAllTimers();
    expect(initSpy).toHaveBeenCalled();
    jest.useRealTimers();
  });

  it('showSnackbar opens snackbar via openFromComponent', () => {
    (component as any).showSnackbar('T', 'M', 'success');
    expect(snackBarMock.openFromComponent).toHaveBeenCalled();
  });

  // ─── Mini map ─────────────────────────────────────────────────
  function fakeMiniMap(): any {
    const mockMapLib = jest.requireMock('leaflet');
    const map = mockMapLib.map();
    map.removeLayer = jest.fn();
    map.remove = jest.fn();
    return map;
  }

  it('initMiniMap with no element does nothing', () => {
    const map = fakeMiniMap();
    (component as any).miniMap = null;
    (component as any).initMiniMap();
    expect(map.remove).not.toHaveBeenCalled();
  });

  it('changeTileMode without map does nothing', () => {
    (component as any).miniMap = null;
    component.changeTileMode('satellite');
    expect(component.mapTileMode).toBe('standard');
  });

  it('changeTileMode switches layer and mode', () => {
    const map = fakeMiniMap();
    const addTo = jest.fn();
    const tile = { addTo };
    (component as any).miniMap = map;
    (component as any).miniMapTiles = { standard: tile, satellite: { addTo }, terrain: { addTo } };
    component.changeTileMode('satellite');
    expect(component.mapTileMode).toBe('satellite');
    expect(map.removeLayer).toHaveBeenCalled();
  });

  it('handleMapClick with no map does nothing', () => {
    (component as any).miniMap = null;
    (component as any).handleMapClick({ latlng: { lat: 36, lng: 10 } });
    expect(component.trajetForm.get('pointDepart')?.value).toBeFalsy();
  });

  it('handleMapClick first click sets depart point', () => {
    (component as any).miniMap = fakeMiniMap();
    (component as any).mapClickCount = 0;
    (component as any).handleMapClick({ latlng: { lat: 36.8065, lng: 10.1815 } as any });
    expect(component.trajetForm.get('pointDepart')?.value).toContain('36.80650');
    expect(component.mapInstruction).toBe('Cliquez pour définir la destination');
    expect((component as any).mapClickCount).toBe(1);
  });

  it('handleMapClick second click sets destination and route', () => {
    (component as any).miniMap = fakeMiniMap();
    (component as any).departMarker = {
      getLatLng: () => ({ lat: 36, lng: 10 })
    };
    (component as any).mapClickCount = 1;
    (component as any).handleMapClick({ latlng: { lat: 35.8, lng: 10.6 } as any });
    expect(component.trajetForm.get('destination')?.value).toContain('35.80000');
    expect((component as any).routeLine).toBeTruthy();
    expect((component as any).mapClickCount).toBe(2);
  });

  it('handleMapClick third click resets pins', () => {
    (component as any).miniMap = fakeMiniMap();
    (component as any).mapClickCount = 2;
    (component as any).departMarker = { getLatLng: () => ({}) };
    (component as any).handleMapClick({ latlng: { lat: 1, lng: 1 } as any });
    expect((component as any).mapClickCount).toBe(0);
    expect(component.trajetForm.get('pointDepart')?.value).toBe('');
  });

  it('tryPlacePinsFromText without map does nothing', () => {
    (component as any).miniMap = null;
    expect(() => (component as any).tryPlacePinsFromText('36.8, 10.1', '35.8, 10.6')).not.toThrow();
  });

  it('tryPlacePinsFromText places pins for coordinate text', () => {
    (component as any).miniMap = fakeMiniMap();
    (component as any).tryPlacePinsFromText('36.8, 10.1', '35.8, 10.6');
    expect((component as any).mapClickCount).toBe(2);
    expect((component as any).routeLine).toBeTruthy();
  });

  it('tryPlacePinsFromText handles non-coordinate text', () => {
    (component as any).miniMap = fakeMiniMap();
    (component as any).tryPlacePinsFromText('Tunis', 'Sousse');
    expect((component as any).mapClickCount).toBe(0);
  });

  it('pinIcon builds a divIcon', () => {
    const icon = (component as any).pinIcon('Départ', '#10b981');
    expect(icon).toBeTruthy();
    expect(icon.className).toBe('trajet-pin-wrapper');
  });

  it('destroyMiniMap clears map and tiles', () => {
    const map = fakeMiniMap();
    (component as any).miniMap = map;
    (component as any).miniMapTiles = { standard: { addTo: jest.fn() } };
    (component as any).destroyMiniMap();
    expect((component as any).miniMap).toBeNull();
    expect((component as any).miniMapTiles).toEqual({});
  });

  it('openEdit executes the deferred map/vehicle setup', () => {
    jest.useFakeTimers();
    const trip: Trip = {
      id: '5', date: '2025-06-01T08:00:00', from: 'Tunis', to: 'Sousse',
      driver: 'Ali', driverId: '7', vehicle: 'TN-001', vehicleId: '1',
      status: 'Actif', managerId: '3'
    };
    component.openEdit(trip);
    jest.runAllTimers();
    expect(fleetServiceMock.getVehicleDetails).toHaveBeenCalled();
    jest.useRealTimers();
  });

  it('initMiniMap creates a map when the element exists and wires clicks', () => {
    const el = document.createElement('div');
    el.id = 'trajet-mini-map';
    document.body.appendChild(el);
    const mockLib = jest.requireMock('leaflet');
    let clickHandler: any = null;
    mockLib.map.mockImplementationOnce(() => ({
      on: jest.fn((name: string, cb: any) => { if (name === 'click') clickHandler = cb; }),
      remove: jest.fn(),
      removeLayer: jest.fn(),
      fitBounds: jest.fn(),
      invalidateSize: jest.fn()
    }));
    (component as any).initMiniMap();
    expect((component as any).miniMap).toBeTruthy();
    expect((component as any).miniMapTiles.standard).toBeTruthy();
    const map = (component as any).miniMap;
    expect(map.on).toHaveBeenCalled();
    if (clickHandler) {
      clickHandler({ latlng: { lat: 36.8, lng: 10.1 } } as any);
      expect(component.trajetForm.get('pointDepart')?.value).toContain('36.80000');
    }
    document.body.removeChild(el);
  });

  it('clearMapPins removes layers when markers exist', () => {
    const map = fakeMiniMap();
    (component as any).miniMap = map;
    (component as any).departMarker = {};
    (component as any).arriveeMarker = {};
    (component as any).routeLine = {};
    (component as any).clearMapPins();
    expect(map.removeLayer).toHaveBeenCalledTimes(3);
    expect((component as any).departMarker).toBeNull();
    expect((component as any).arriveeMarker).toBeNull();
    expect((component as any).routeLine).toBeNull();
  });

  it('ngOnDestroy cleans up', () => {
    const destroySpy = spyOn(component as any, 'destroyMiniMap');
    component.ngOnDestroy();
    expect(destroySpy).toHaveBeenCalled();
  });
});
