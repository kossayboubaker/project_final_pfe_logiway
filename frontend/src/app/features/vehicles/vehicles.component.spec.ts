import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { of, Subject } from 'rxjs';
import { VehiclesComponent } from './vehicles.component';
import { FleetService } from '../../core/services/fleet.service';
import { NotificationService, AppNotification } from '../../core/services/notification.service';

describe('VehiclesComponent', () => {
  let component: VehiclesComponent;
  let fixture: ComponentFixture<VehiclesComponent>;
  let fleetServiceMock: jasmine.SpyObj<FleetService>;
  let notificationServiceMock: jasmine.SpyObj<NotificationService>;
  let realtimeSubject: Subject<AppNotification>;

  const mockVehicles = [
    { id: '1', plate: 'TN-001', model: 'Mercedes Actros', status: 'En Service', nextCheck: '50000 km' },
    { id: '2', plate: 'TN-002', model: 'Volvo FH', status: 'Maintenance', nextCheck: '80000 km' }
  ];

  beforeEach(async () => {
    realtimeSubject = new Subject<AppNotification>();

    fleetServiceMock = jasmine.createSpyObj('FleetService', ['getVehicles']);
    fleetServiceMock.getVehicles.and.returnValue(of(mockVehicles));

    notificationServiceMock = jasmine.createSpyObj('NotificationService', ['connectRealtime']);
    Object.defineProperty(notificationServiceMock, 'realtimeNotification$', {
      get: () => realtimeSubject.asObservable()
    });

    await TestBed.configureTestingModule({
      imports: [VehiclesComponent],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideAnimationsAsync(),
        { provide: FleetService, useValue: fleetServiceMock },
        { provide: NotificationService, useValue: notificationServiceMock }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(VehiclesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should call getVehicles() on init', () => {
    expect(fleetServiceMock.getVehicles).toHaveBeenCalled();
  });

  it('should load vehicles into dataSource', () => {
    expect(component.dataSource.data.length).toBe(2);
    expect(component.dataSource.data[0].plate).toBe('TN-001');
    expect(component.dataSource.data[1].plate).toBe('TN-002');
  });

  it('should connect to realtime notifications on init', () => {
    expect(notificationServiceMock.connectRealtime).toHaveBeenCalled();
  });

  it('should reload vehicles when NOTIF_VEHICULE realtime event arrives', () => {
    const initialCallCount = fleetServiceMock.getVehicles.calls.count();

    realtimeSubject.next({
      id: '99', title: 'Véhicule', message: 'Mise à jour',
      type: 'INFO', category: 'NOTIF_VEHICULE',
      time: 'now', date: new Date(), isRead: false, dismissed: false
    });

    expect(fleetServiceMock.getVehicles.calls.count()).toBeGreaterThan(initialCallCount);
  });

  it('should reload vehicles when NOTIF_TRAJET realtime event arrives', () => {
    const initialCallCount = fleetServiceMock.getVehicles.calls.count();

    realtimeSubject.next({
      id: '100', title: 'Trajet', message: 'Nouveau trajet',
      type: 'INFO', category: 'NOTIF_TRAJET',
      time: 'now', date: new Date(), isRead: false, dismissed: false
    });

    expect(fleetServiceMock.getVehicles.calls.count()).toBeGreaterThan(initialCallCount);
  });

  it('should NOT reload for unrelated notification categories', () => {
    const initialCallCount = fleetServiceMock.getVehicles.calls.count();

    realtimeSubject.next({
      id: '101', title: 'Message', message: 'Hello',
      type: 'INFO', category: 'NOTIF_MESSAGE',
      time: 'now', date: new Date(), isRead: false, dismissed: false
    });

    expect(fleetServiceMock.getVehicles.calls.count()).toBe(initialCallCount);
  });

  it('applyFilter() should filter dataSource', () => {
    const event = { target: { value: 'TN-001' } } as any;
    component.applyFilter(event);
    expect(component.dataSource.filter).toBe('tn-001');
  });

  it('applyFilter() should trim whitespace from filter value', () => {
    const event = { target: { value: '  TN-002  ' } } as any;
    component.applyFilter(event);
    expect(component.dataSource.filter).toBe('tn-002');
  });

  it('should clean up subscriptions on destroy', () => {
    expect(() => component.ngOnDestroy()).not.toThrow();
  });
});
