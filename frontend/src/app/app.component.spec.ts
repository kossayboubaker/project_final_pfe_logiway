import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AppComponent } from './app.component';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { AuthService } from './core/auth.service';
import { SessionHeartbeatService } from './core/services/session-heartbeat.service';
import { NotificationService } from './core/services/notification.service';
import { of, Subject } from 'rxjs';

describe('AppComponent', () => {
  let component: AppComponent;
  let fixture: ComponentFixture<AppComponent>;
  let authServiceMock: any;
  let notificationServiceMock: any;
  let heartbeatServiceMock: jasmine.SpyObj<SessionHeartbeatService>;
  let currentUserSubject: Subject<any>;

  beforeEach(async () => {
    currentUserSubject = new Subject<any>();
    authServiceMock = {
      getUser: jasmine.createSpy('getUser').and.returnValue(null),
      isAuthenticated: jasmine.createSpy('isAuthenticated').and.returnValue(false),
      ensureSession: jasmine.createSpy('ensureSession').and.returnValue(of(null)),
      currentUser: currentUserSubject.asObservable()
    };
    heartbeatServiceMock = jasmine.createSpyObj('SessionHeartbeatService', ['startHeartbeat', 'stopHeartbeat']);

    notificationServiceMock = {
      loadNotifications: jasmine.createSpy('loadNotifications').and.returnValue(of([])),
      connectRealtime: jasmine.createSpy('connectRealtime'),
      disconnectRealtime: jasmine.createSpy('disconnectRealtime'),
      notifications$: of([]),
      unreadCount$: of(0)
    };

    await TestBed.configureTestingModule({
      imports: [AppComponent],
      providers: [
        provideRouter([]),
        provideHttpClient(),
        provideHttpClientTesting(),
        provideAnimationsAsync(),
        { provide: AuthService, useValue: authServiceMock },
        { provide: SessionHeartbeatService, useValue: heartbeatServiceMock },
        { provide: NotificationService, useValue: notificationServiceMock }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(AppComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('utilisateur connecté démarre le heartbeat, déconnecté l\'arrête', () => {
    heartbeatServiceMock.startHeartbeat.calls.reset();
    heartbeatServiceMock.stopHeartbeat.calls.reset();

    currentUserSubject.next({ id: '1' });
    expect(heartbeatServiceMock.startHeartbeat).toHaveBeenCalledTimes(1);

    currentUserSubject.next({ id: '2' });
    expect(heartbeatServiceMock.startHeartbeat).toHaveBeenCalledTimes(2);

    currentUserSubject.next(null);
    expect(heartbeatServiceMock.stopHeartbeat).toHaveBeenCalled();

    currentUserSubject.next(undefined);
    expect(heartbeatServiceMock.stopHeartbeat).toHaveBeenCalledTimes(2);
  });

  it('ngOnDestroy termine le flux et arrête le heartbeat', () => {
    heartbeatServiceMock.stopHeartbeat.calls.reset();

    component.ngOnDestroy();

    expect(heartbeatServiceMock.stopHeartbeat).toHaveBeenCalled();
  });
});
