import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NavbarComponent } from './navbar.component';
import { provideRouter, Router } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { AuthService } from '../../auth.service';
import { NotificationService } from '../../services/notification.service';
import { of, Subject, BehaviorSubject, throwError } from 'rxjs';
import { MessengerService } from '../../services/messenger.service';
import { LeaveService } from '../../services/leave.service';

describe('NavbarComponent', () => {
  let component: NavbarComponent;
  let fixture: ComponentFixture<NavbarComponent>;
  let authServiceMock: any;
  let notificationServiceMock: any;
  let messengerServiceMock: any;
  let leaveServiceMock: any;
  let snackBarMock: any;
  let realtimeSubject: Subject<any>;
  let currentUserSubject: BehaviorSubject<any>;
  let notificationsState$: BehaviorSubject<any[]>;
  let unreadCountSubject: BehaviorSubject<number>;
  let messengerUnreadSubject: BehaviorSubject<number>;
  let notifStore: any[];

  const makeNotif = (overrides: Partial<any> = {}): any => ({
    id: '1',
    title: 'Titre',
    message: 'Message',
    type: 'INFO',
    category: 'NOTIF_TRAJET',
    time: 'Maintenant',
    date: new Date(),
    isRead: false,
    dismissed: false,
    tone: 'INFO',
    ...overrides
  });

  beforeEach(async () => {
    jest.useRealTimers();
    notifStore = [];
    realtimeSubject = new Subject<any>();
    currentUserSubject = new BehaviorSubject<any>(null);
    notificationsState$ = new BehaviorSubject<any[]>([]);
    unreadCountSubject = new BehaviorSubject<number>(0);
    messengerUnreadSubject = new BehaviorSubject<number>(0);

    authServiceMock = {
      getUser: jasmine.createSpy('getUser').and.returnValue({ id: '1', role: 'MANAGER', username: 'Test User' }),
      isAuthenticated: jasmine.createSpy('isAuthenticated').and.returnValue(true),
      logout: jasmine.createSpy('logout'),
      getStatus: jasmine.createSpy('getStatus').and.returnValue('online'),
      currentUser: currentUserSubject.asObservable()
    };

    notificationServiceMock = {
      notifications$: notificationsState$.asObservable(),
      unreadCount$: unreadCountSubject.asObservable(),
      realtimeNotification$: realtimeSubject.asObservable(),
      loadNotifications: jasmine.createSpy('loadNotifications').and.callFake(() => {
        notificationsState$.next(notifStore);
        return of(notifStore);
      }),
      getNotifications: jasmine.createSpy('getNotifications').and.callFake(() => notifStore),
      markAsRead: jasmine.createSpy('markAsRead').and.callFake((id: string) => {
        const n = notifStore.find(x => x.id === id);
        if (n) { n.isRead = true; }
      }),
      removeNotification: jasmine.createSpy('removeNotification').and.callFake((id: string) => {
        notifStore = notifStore.filter(x => x.id !== id);
      }),
      markLeaveNotificationHandled: jasmine.createSpy('markLeaveNotificationHandled'),
      getLeaveRequestId: jasmine.createSpy('getLeaveRequestId').and.returnValue(null)
    };

    messengerServiceMock = {
      unreadCount$: messengerUnreadSubject.asObservable(),
      loadConversations: jasmine.createSpy('loadConversations').and.returnValue(of([])),
      connectRealtime: jasmine.createSpy('connectRealtime'),
      disconnectRealtime: jasmine.createSpy('disconnectRealtime')
    };

    leaveServiceMock = {
      approveLeave: jasmine.createSpy('approveLeave').and.returnValue(of({})),
      rejectLeave: jasmine.createSpy('rejectLeave').and.returnValue(of({}))
    };

    snackBarMock = {
      openFromComponent: jasmine.createSpy('openFromComponent')
    };

    await TestBed.configureTestingModule({
      imports: [NavbarComponent],
      providers: [
        provideRouter([]),
        provideHttpClient(),
        provideHttpClientTesting(),
        provideAnimationsAsync(),
        { provide: AuthService, useValue: authServiceMock },
        { provide: NotificationService, useValue: notificationServiceMock },
        { provide: MessengerService, useValue: messengerServiceMock },
        { provide: LeaveService, useValue: leaveServiceMock }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(NavbarComponent);
    component = fixture.componentInstance;
    // MatSnackBarModule est importe par le composant : l'override DI est ignore -> mutation du champ prive.
    (component as any).snackBar = snackBarMock;
    fixture.detectChanges();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  // --- Init / souscriptions -------------------------------------------------

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should start with unreadBadge = 0 and empty notifications', () => {
    expect(component.unreadBadge).toBe(0);
    expect(component.notifications).toEqual([]);
    expect(component.messengerUnreadCount).toBe(0);
  });

  it('should sync messengerUnreadCount and cap unreadBadge at 99+', () => {
    messengerUnreadSubject.next(3);
    expect(component.messengerUnreadCount).toBe(3);

    unreadCountSubject.next(150);
    expect(component.unreadBadge).toBe('99+');

    unreadCountSubject.next(7);
    expect(component.unreadBadge).toBe(7);

    unreadCountSubject.next(0);
    expect(component.unreadBadge).toBe(0);
  });

  it('should load notifications, conversations and realtime on user login', () => {
    notifStore = [makeNotif(), makeNotif({ id: '2', isRead: true })];
    currentUserSubject.next({ id: '1', role: 'MANAGER', firstLogin: false });

    expect(component.user).toBeTruthy();
    expect(notificationServiceMock.loadNotifications).toHaveBeenCalled();
    expect(messengerServiceMock.loadConversations).toHaveBeenCalled();
    expect(messengerServiceMock.connectRealtime).toHaveBeenCalled();
    expect(component.notifications.length).toBe(2);
    expect(component.unreadBadge).toBe(1);
  });

  it('should stop notifications refresh when user logs out (null user)', () => {
    (component as any).startNotificationsRefresh();
    expect((component as any).notificationsRefreshSub).toBeTruthy();

    currentUserSubject.next(null);

    expect((component as any).notificationsRefreshSub).toBeUndefined();
  });

  it('should compute 99+ badge from loaded notifications when more than 99 unread', () => {
    notifStore = Array.from({ length: 150 }, (_, i) => makeNotif({ id: String(i) }));
    component.loadNotifications();

    expect(component.unreadBadge).toBe('99+');
    expect(component.notifications.length).toBe(150);
  });

  it('should poll loadNotifications every 20s while refresh is active', async () => {
    jest.useFakeTimers();
    try {
      const spy = notificationServiceMock.loadNotifications as any;
      const before = spy.calls.count();

      (component as any).startNotificationsRefresh();
      (component as any).startNotificationsRefresh(); // guard : pas de double souscription

      await jest.advanceTimersByTimeAsync(20000);
      expect(spy.calls.count()).toBeGreaterThan(before);

      (component as any).stopNotificationsRefresh();
      const afterStop = spy.calls.count();
      await jest.advanceTimersByTimeAsync(60000);
      expect(spy.calls.count()).toBe(afterStop);
    } finally {
      (component as any).stopNotificationsRefresh();
      jest.useRealTimers();
    }
  });

  it('should unsubscribe everything on destroy', () => {
    expect((component as any).notificationsStateSub).toBeTruthy();

    fixture.destroy();

    expect(() => notificationsState$.next([makeNotif()])).not.toThrow();
    expect(component.notifications).toEqual([]);
  });

  // --- Snackbars temps reel ---------------------------------------------------

  it('should map realtime notification types to snackbar types', () => {
    realtimeSubject.next({ title: 'A', message: 'm', type: 'DANGER', category: 'NOTIF_ACCIDENT' });
    expect(snackBarMock.openFromComponent).toHaveBeenCalled();
    let data = snackBarMock.openFromComponent.calls.mostRecent().args[1].data;
    expect(data.type).toBe('error');
    expect(data.title).toBe('A');

    realtimeSubject.next({ title: 'B', message: 'm', type: 'WARNING', category: 'NOTIF_WEATHER' });
    data = snackBarMock.openFromComponent.calls.mostRecent().args[1].data;
    expect(data.type).toBe('warning');

    realtimeSubject.next({ title: 'C', message: 'm', type: 'ACTION', category: 'NOTIF_CONGE' });
    data = snackBarMock.openFromComponent.calls.mostRecent().args[1].data;
    expect(data.type).toBe('warning');

    realtimeSubject.next({ title: 'D', message: 'm', type: 'INFO', category: 'NOTIF_MESSAGE' });
    data = snackBarMock.openFromComponent.calls.mostRecent().args[1].data;
    expect(data.type).toBe('info');
  });

  // --- Getter alerts ------------------------------------------------------------

  it('should expose notifications copy through alerts when no first-login user', () => {
    notifStore = [makeNotif()];
    component.notifications = notifStore;

    expect(component.alerts).toEqual(notifStore);
    expect(component.alerts).not.toBe(notifStore);
  });

  it('should prepend first login reminder alert until dismissed', () => {
    component.notifications = [];
    component.user = { firstLogin: true };
    component.hideFirstLoginReminder = false;

    const alerts = component.alerts;
    expect(alerts.length).toBe(1);
    expect(alerts[0].id).toBe('__first_login_activation__');
    expect(alerts[0].category).toBe('NOTIF_COMPTE');

    component.hideFirstLoginReminder = true;
    expect(component.alerts).toEqual([]);
  });

  it('should expose userStatus from auth service', () => {
    expect(component.userStatus).toBe('online');
    expect(authServiceMock.getStatus).toHaveBeenCalled();
  });

  // --- Actions basiques ---------------------------------------------------------

  it('should emit toggleSidenav', () => {
    let emitted = 0;
    const sub = component.toggleSidenav.subscribe(() => emitted++);
    component.onToggleSidenav();
    sub.unsubscribe();
    expect(emitted).toBe(1);
  });

  it('should logout, disconnect realtime and navigate to signin', () => {
    const router = TestBed.inject(Router);
    spyOn(router, 'navigate').and.callFake(() => Promise.resolve(true));

    component.onLogout();

    expect(messengerServiceMock.disconnectRealtime).toHaveBeenCalled();
    expect(authServiceMock.logout).toHaveBeenCalled();
    expect(router.navigate).toHaveBeenCalledWith(['/auth/signin']);
  });

  // --- handleAction ---------------------------------------------------------------

  it('should warn when handling action on a non-leave notification', () => {
    component.handleAction(makeNotif({ category: 'NOTIF_TRAJET' }), 'ACCEPT');

    expect(leaveServiceMock.approveLeave).not.toHaveBeenCalled();
    expect(snackBarMock.openFromComponent).toHaveBeenCalled();
    const cfg = snackBarMock.openFromComponent.calls.mostRecent().args[1];
    expect(cfg.data.title).toBe('Action non prise en charge');
    expect(cfg.data.type).toBe('warning');
  });

  it('should warn when leave request id cannot be extracted', () => {
    component.handleAction(makeNotif({ category: 'NOTIF_CONGE' }), 'ACCEPT');

    expect(leaveServiceMock.approveLeave).not.toHaveBeenCalled();
    const cfg = snackBarMock.openFromComponent.calls.mostRecent().args[1];
    expect(cfg.data.title).toBe('Action impossible');
    expect(cfg.data.type).toBe('error');
  });

  it('should approve a leave and refresh state on ACCEPT success', () => {
    (notificationServiceMock.getLeaveRequestId as any).and.returnValue('77');
    const notif = makeNotif({ id: '42', category: 'NOTIF_CONGE', title: 'Conge ete' });
    notifStore = [notif];

    component.handleAction(notif, 'ACCEPT');

    const [reqId, reqBody] = (leaveServiceMock.approveLeave as any).calls.mostRecent().args;
    expect(reqId).toBe('77');
    expect(reqBody).toEqual({ commentaire: '', notificationId: 42 });
    expect(notificationServiceMock.markLeaveNotificationHandled).toHaveBeenCalledWith('42', 'ACCEPT');
    expect(component.notifications).toBe(notifStore);
    const cfg = snackBarMock.openFromComponent.calls.mostRecent().args[1];
    expect(cfg.data.title).toBe('Demande Accept\u00e9e');
    expect(cfg.data.message).toContain('Conge ete');
    expect(cfg.data.type).toBe('success');
  });

  it('should reject a leave on REJECT success', () => {
    (notificationServiceMock.getLeaveRequestId as any).and.returnValue('77');
    const notif = makeNotif({ id: '42', category: 'NOTIF_CONGE', title: 'Conge hiver' });

    component.handleAction(notif, 'REJECT');

    expect(leaveServiceMock.rejectLeave).toHaveBeenCalledWith('77', { commentaire: '', notificationId: 42 });
    expect(notificationServiceMock.markLeaveNotificationHandled).toHaveBeenCalledWith('42', 'REJECT');
    const cfg = snackBarMock.openFromComponent.calls.mostRecent().args[1];
    expect(cfg.data.title).toBe('Demande Refus\u00e9e');
    expect(cfg.data.type).toBe('error');
  });

  it('should show an error snackbar when the decision fails', () => {
    (notificationServiceMock.getLeaveRequestId as any).and.returnValue('77');
    (leaveServiceMock.approveLeave as any).and.returnValue(throwError(() => new Error('boom')));
    const notif = makeNotif({ id: '42', category: 'NOTIF_CONGE' });

    component.handleAction(notif, 'ACCEPT');

    const cfg = snackBarMock.openFromComponent.calls.mostRecent().args[1];
    expect(cfg.data.title).toBe('Erreur');
    expect(cfg.data.type).toBe('error');
  });

  // --- Clic / dismissal notifications ---------------------------------------------

  it('should navigate to profile on first login notification click only', () => {
    const router = TestBed.inject(Router);
    spyOn(router, 'navigate').and.callFake(() => Promise.resolve(true));

    component.onNotificationClick(makeNotif({ id: 'autre' }));
    expect(router.navigate).not.toHaveBeenCalled();

    component.onNotificationClick(makeNotif({ id: '__first_login_activation__' }));
    expect(router.navigate).toHaveBeenCalledWith(['/dashboard/profile']);
  });

  it('should dismiss notifications and stop propagation', () => {
    const event = { stopPropagation: jasmine.createSpy('stopPropagation') };
    notifStore = [makeNotif({ id: '9' })];

    component.dismissNotification('9', event as any);

    expect(event.stopPropagation).toHaveBeenCalled();
    expect(notificationServiceMock.removeNotification).toHaveBeenCalledWith('9');
    expect(component.notifications).toEqual([]);

    component.dismissNotification('__first_login_activation__', event as any);
    expect(component.hideFirstLoginReminder).toBeTrue();
    expect(notificationServiceMock.removeNotification).not.toHaveBeenCalledWith('__first_login_activation__');
  });

  it('should toggle showAll and reset scroll when closing', () => {
    const event = { stopPropagation: jasmine.createSpy('stopPropagation') };
    const fakeRef = { nativeElement: { scrollTop: 120 } };
    (component as any).notificationListRef = fakeRef;

    component.toggleShowAll(event as any);
    expect(component.showAllNotifications).toBeTrue();
    expect(fakeRef.nativeElement.scrollTop).toBe(120);

    component.toggleShowAll(event as any);
    expect(component.showAllNotifications).toBeFalse();
    expect(fakeRef.nativeElement.scrollTop).toBe(0);
  });

  it('should tolerate missing scroll ref when resetting', () => {
    (component as any).notificationListRef = undefined;
    expect(() => (component as any).resetNotificationsScroll()).not.toThrow();
  });

  it('should mark visible notifications as read when the menu opens', () => {
    notifStore = [
      makeNotif({ id: 'a', isRead: false }),
      makeNotif({ id: 'b', isRead: true })
    ];

    component.onNotificationsMenuOpened();

    expect(component.showAllNotifications).toBeFalse();
    expect(notificationServiceMock.markAsRead).toHaveBeenCalledTimes(1);
    expect(notificationServiceMock.markAsRead).toHaveBeenCalledWith('a');
    expect(notifStore[0].isRead).toBeTrue();
    expect(component.unreadBadge).toBe(0);
  });

  // --- Helpers icones / labels / couleurs --------------------------------------------

  it('should map every notification category to an icon', () => {
    const categories = [
      'NOTIF_COMPTE', 'NOTIF_TRAJET', 'NOTIF_CONGE', 'NOTIF_RECLAMATION',
      'NOTIF_MESSAGE', 'NOTIF_ENTREPRISE', 'NOTIF_VEHICULE', 'SECTEUR',
      'NOTIF_DETECTION', 'NOTIF_WEATHER', 'NOTIF_INFRA', 'NOTIF_ACCIDENT'
    ];
    const expected = [
      'manage_accounts', 'local_shipping', 'event_busy', 'report_problem',
      'chat_bubble', 'domain', 'commute', 'map',
      'security', 'wb_sunny', 'construction', 'report'
    ];

    categories.forEach((cat, i) => {
      expect(component.getNotifIcon(cat as any)).toBe(expected[i]);
    });
    expect(component.getNotifIcon('INCONNU' as any)).toBe('notifications');
  });

  it('should map every notification category to a label', () => {
    const categories = [
      'NOTIF_COMPTE', 'NOTIF_TRAJET', 'NOTIF_CONGE', 'NOTIF_RECLAMATION',
      'NOTIF_MESSAGE', 'NOTIF_ENTREPRISE', 'NOTIF_VEHICULE', 'SECTEUR',
      'NOTIF_DETECTION', 'NOTIF_WEATHER', 'NOTIF_INFRA', 'NOTIF_ACCIDENT'
    ];
    const expected = [
      'Compte', 'Trajet', 'Conge', 'Reclamation',
      'Message', 'Entreprise', 'Vehicule', 'Secteur',
      'Detection', 'Meteo', 'Infrastructure', 'Accident'
    ];

    categories.forEach((cat, i) => {
      if (expected[i] === 'Conge') {
        expect(component.getNotifLabel(cat as any)).toBe('Cong\u00e9');
      } else if (expected[i] === 'Reclamation') {
        expect(component.getNotifLabel(cat as any)).toBe('R\u00e9clamation');
      } else if (expected[i] === 'Vehicule') {
        expect(component.getNotifLabel(cat as any)).toBe('V\u00e9hicule');
      } else if (expected[i] === 'Detection') {
        expect(component.getNotifLabel(cat as any)).toBe('D\u00e9tection');
      } else if (expected[i] === 'Meteo') {
        expect(component.getNotifLabel(cat as any)).toBe('M\u00e9t\u00e9o');
      } else {
        expect(component.getNotifLabel(cat as any)).toBe(expected[i]);
      }
    });
    expect(component.getNotifLabel('INCONNU' as any)).toBe('Info');
  });

  it('should resolve color classes for account, enterprise and vehicle tones', () => {
    const compte = (tone: any) =>
      component.getNotifColorClass(makeNotif({ category: 'NOTIF_COMPTE', tone })) as any;

    expect(compte('SUCCESS')).toBe('notif-success');
    expect(compte('DANGER')).toBe('notif-danger');
    expect(compte('WARNING')).toBe('notif-warning');
    expect(compte('INFO')).toBe('notif-info');
    expect(compte(undefined)).toBe('notif-info');

    const entreprise = (tone: any) =>
      component.getNotifColorClass(makeNotif({ category: 'NOTIF_ENTREPRISE', tone })) as any;

    expect(entreprise('SUCCESS')).toBe('notif-success');
    expect(entreprise('DANGER')).toBe('notif-danger');
    expect(entreprise('WARNING')).toBe('notif-warning');
    expect(entreprise('INFO')).toBe('notif-info');
    expect(entreprise(undefined)).toBe('notif-info');

    const vehicule = (tone: any) =>
      component.getNotifColorClass(makeNotif({ category: 'NOTIF_VEHICULE', tone })) as any;

    expect(vehicule('SUCCESS')).toBe('notif-success');
    expect(vehicule('DANGER')).toBe('notif-danger');
    expect(vehicule('WARNING')).toBe('notif-warning');
    expect(vehicule('INFO')).toBe('notif-info');
    expect(vehicule(undefined)).toBe('notif-info');
  });

  it('should resolve color classes for leave, detection-family and default categories', () => {
    const leave = (tone: any) =>
      component.getNotifColorClass(makeNotif({ category: 'NOTIF_CONGE', tone })) as any;

    expect(leave('DANGER')).toBe('notif-danger');
    expect(leave('SUCCESS')).toBe('notif-success');
    expect(leave('WARNING')).toBe('notif-warning');
    expect(leave('INFO')).toBe('notif-leave');

    expect(component.getNotifColorClass(makeNotif({ category: 'NOTIF_TRAJET' }))).toBe('notif-trip');
    expect(component.getNotifColorClass(makeNotif({ category: 'NOTIF_RECLAMATION' }))).toBe('notif-report');
    expect(component.getNotifColorClass(makeNotif({ category: 'NOTIF_MESSAGE' }))).toBe('notif-msg-bubble');
    expect(component.getNotifColorClass(makeNotif({ category: 'NOTIF_ACCIDENT' }))).toBe('notif-danger');
    expect(component.getNotifColorClass(makeNotif({ category: 'SECTEUR' }))).toBe('notif-info');

    const detection = (category: string, tone: string) =>
      component.getNotifColorClass(makeNotif({ category, tone })) as any;

    expect(detection('NOTIF_DETECTION', 'DANGER')).toBe('notif-danger');
    expect(detection('NOTIF_DETECTION', 'WARNING')).toBe('notif-warning');
    expect(detection('NOTIF_DETECTION', 'INFO')).toBe('notif-info');
    expect(detection('NOTIF_WEATHER', 'WARNING')).toBe('notif-warning');
    expect(detection('NOTIF_WEATHER', 'INFO')).toBe('notif-info');
    expect(detection('NOTIF_INFRA', 'INFO')).toBe('notif-info');

    expect(component.getNotifColorClass(makeNotif({ category: 'INCONNU' }))).toBe('notif-default');
  });
});
