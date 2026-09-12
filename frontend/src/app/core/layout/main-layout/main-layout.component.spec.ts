import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Component } from '@angular/core';
import { MainLayoutComponent } from './main-layout.component';
import { provideRouter, Router } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { AuthService } from '../../auth.service';
import { NotificationService } from '../../services/notification.service';
import { MessengerService } from '../../services/messenger.service';
import { LeaveService } from '../../services/leave.service';
import { of, BehaviorSubject, Subject } from 'rxjs';
import { AppNotification } from '../../services/notification.service';

describe('MainLayoutComponent', () => {
  let component: MainLayoutComponent;
  let fixture: ComponentFixture<MainLayoutComponent>;
  let router: Router;
  let realtimeSubject: Subject<AppNotification>;
  let currentUserSubject: BehaviorSubject<any>;
  let consoleWarnSpy: jest.SpyInstance;

  beforeAll(() => {
    // Silencer les warnings matBadge aria-hidden (Angular Material / NavbarComponent en jsdom)
    consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
  });

  afterAll(() => {
    consoleWarnSpy.mockRestore();
  });

  beforeEach(async () => {
    realtimeSubject = new Subject<AppNotification>();
    currentUserSubject = new BehaviorSubject(null);

    const authServiceMock = {
      getUser: jasmine.createSpy('getUser').and.returnValue({ id: '1', role: 'MANAGER', username: 'Test' }),
      isAuthenticated: jasmine.createSpy('isAuthenticated').and.returnValue(true),
      isCompanyActive: jasmine.createSpy('isCompanyActive').and.returnValue(true),
      logout: jasmine.createSpy('logout'),
      getAlerts: jasmine.createSpy('getAlerts').and.returnValue([]),
      markAsRead: jasmine.createSpy('markAsRead'),
      removeNotification: jasmine.createSpy('removeNotification'),
      markAllAsReadAndDismiss: jasmine.createSpy('markAllAsReadAndDismiss'),
      currentUser: currentUserSubject.asObservable()
    };

    const notificationServiceMock = {
      loadNotifications: jasmine.createSpy('loadNotifications').and.returnValue(of([])),
      connectRealtime: jasmine.createSpy('connectRealtime'),
      disconnectRealtime: jasmine.createSpy('disconnectRealtime'),
      notifications$: of([]),
      unreadCount$: of(0),
      realtimeNotification$: realtimeSubject.asObservable(),
      markLeaveNotificationHandled: jasmine.createSpy('markLeaveNotificationHandled'),
      getLeaveRequestId: jasmine.createSpy('getLeaveRequestId').and.returnValue(null)
    };

    const messengerServiceMock = {
      unreadCount$: of(0),
      loadConversations: jasmine.createSpy('loadConversations').and.returnValue(of([])),
      connectRealtime: jasmine.createSpy('connectRealtime')
    };

    const leaveServiceMock = {
      approveLeave: jasmine.createSpy('approveLeave').and.returnValue(of({})),
      rejectLeave: jasmine.createSpy('rejectLeave').and.returnValue(of({}))
    };

    await TestBed.configureTestingModule({
      imports: [MainLayoutComponent, DummyComponent],
      providers: [
        provideRouter([{ path: '**', component: DummyComponent }]),
        provideHttpClient(),
        provideHttpClientTesting(),
        provideAnimationsAsync(),
        { provide: AuthService, useValue: authServiceMock },
        { provide: NotificationService, useValue: notificationServiceMock },
        { provide: MessengerService, useValue: messengerServiceMock },
        { provide: LeaveService, useValue: leaveServiceMock }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(MainLayoutComponent);
    component = fixture.componentInstance;
    router = TestBed.inject(Router);
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should have isMapRoute false initially', () => {
    expect(component.isMapRoute).toBeFalse();
  });

  it('NavigationEnd met à jour isMapRoute', async () => {
    await router.navigate(['/dashboard/map']);
    expect(component.isMapRoute).toBeTrue();

    await router.navigate(['/dashboard/manager']);
    expect(component.isMapRoute).toBeFalse();
  });
});

@Component({ template: '', standalone: true })
class DummyComponent { }
