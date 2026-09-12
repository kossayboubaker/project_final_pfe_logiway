import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { AuthService } from '../../core/auth.service';
import { NotificationService } from '../../core/services/notification.service';
import { LeaveService } from '../../core/services/leave.service';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { of, Subject, throwError } from 'rxjs';
import { AlertsComponent } from './alerts.component';

describe('AlertsComponent', () => {
  let component: AlertsComponent;
  let fixture: ComponentFixture<AlertsComponent>;
  let authServiceMock: jasmine.SpyObj<AuthService>;
  let notificationServiceMock: jasmine.SpyObj<NotificationService>;
  let leaveServiceMock: jasmine.SpyObj<LeaveService>;
  let snackBarSpy: jasmine.SpyObj<MatSnackBar>;
  let router: Router;
  let notificationsSubject: Subject<any[]>;

  const notif = (over: Record<string, unknown> = {}): any => ({
    id: '1', title: 'Titre', message: 'Message', category: 'NOTIF_CONGE', tone: 'INFO', ...over
  });

  beforeEach(async () => {
    authServiceMock = jasmine.createSpyObj('AuthService', ['getUser']);
    authServiceMock.getUser.and.returnValue({ id: '1', role: 'MANAGER' });

    notificationsSubject = new Subject<any[]>();
    notificationServiceMock = jasmine.createSpyObj('NotificationService', [
      'loadNotifications', 'clearAllNotifications', 'markAsRead',
      'getLeaveRequestId', 'markLeaveNotificationHandled'
    ]);
    notificationServiceMock.loadNotifications.and.returnValue(of([]));
    Object.defineProperty(notificationServiceMock, 'notifications$', { value: notificationsSubject.asObservable() });

    leaveServiceMock = jasmine.createSpyObj('LeaveService', ['approveLeave', 'rejectLeave']);
    snackBarSpy = jasmine.createSpyObj('MatSnackBar', ['openFromComponent']);

    await TestBed.configureTestingModule({
      imports: [AlertsComponent],
      providers: [
        provideRouter([]),
        provideAnimationsAsync(),
        { provide: AuthService, useValue: authServiceMock },
        { provide: NotificationService, useValue: notificationServiceMock },
        { provide: LeaveService, useValue: leaveServiceMock },
        { provide: MatSnackBar, useValue: snackBarSpy }
      ]
    })
      .overrideComponent(AlertsComponent, { remove: { imports: [MatSnackBarModule] } })
      .compileComponents();

    fixture = TestBed.createComponent(AlertsComponent);
    component = fixture.componentInstance;
    router = TestBed.inject(Router);
    spyOn(router, 'navigate');
    fixture.detectChanges();
  });

  it('should create et s\'abonner aux notifications', () => {
    expect(component).toBeTruthy();
    expect(notificationServiceMock.loadNotifications).toHaveBeenCalled();

    notificationsSubject.next([notif({ id: '9' })]);
    expect(component.notifications.length).toBe(1);
    expect(component.alerts[0].id).toBe('9');
  });

  // ─── getIcon ──────────────────────────────────────────────────
  it('getIcon mappe toutes les catégories', () => {
    const expected: [string, string][] = [
      ['NOTIF_CONGE', 'event_note'],
      ['NOTIF_TRAJET', 'directions_bus'],
      ['NOTIF_RECLAMATION', 'report_problem'],
      ['NOTIF_MESSAGE', 'chat'],
      ['NOTIF_COMPTE', 'account_circle'],
      ['NOTIF_ENTREPRISE', 'domain'],
      ['NOTIF_VEHICULE', 'local_shipping'],
      ['SECTEUR', 'map'],
      ['NOTIF_DETECTION', 'security'],
      ['NOTIF_WEATHER', 'wb_sunny'],
      ['NOTIF_INFRA', 'construction'],
      ['NOTIF_ACCIDENT', 'report'],
      ['INCONNU', 'notifications']
    ];

    expected.forEach(([category, icon]) => expect(component.getIcon(category)).toBe(icon));
  });

  // ─── getColorClass ────────────────────────────────────────────
  it('getColorClass NOTIF_COMPTE suit le ton', () => {
    const base = { category: 'NOTIF_COMPTE' };
    expect(component.getColorClass(notif({ ...base, tone: 'SUCCESS' }))).toBe('notif-success');
    expect(component.getColorClass(notif({ ...base, tone: 'DANGER' }))).toBe('notif-danger');
    expect(component.getColorClass(notif({ ...base, tone: 'WARNING' }))).toBe('notif-warning');
    expect(component.getColorClass(notif({ ...base, tone: 'INFO' }))).toBe('notif-info');
    expect(component.getColorClass(notif({ ...base, tone: undefined }))).toBe('notif-info');
  });

  it('getColorClass catégories simples', () => {
    expect(component.getColorClass(notif({ category: 'NOTIF_TRAJET' }))).toBe('notif-trip');
    expect(component.getColorClass(notif({ category: 'NOTIF_RECLAMATION' }))).toBe('notif-report');
    expect(component.getColorClass(notif({ category: 'NOTIF_MESSAGE' }))).toBe('notif-msg-bubble');
    expect(component.getColorClass(notif({ category: 'SECTEUR' }))).toBe('notif-info');
    expect(component.getColorClass(notif({ category: 'AUTRE' }))).toBe('notif-default');
  });

  it('getColorClass NOTIF_CONGE suit le ton', () => {
    const base = { category: 'NOTIF_CONGE' };
    expect(component.getColorClass(notif({ ...base, tone: 'DANGER' }))).toBe('notif-danger');
    expect(component.getColorClass(notif({ ...base, tone: 'SUCCESS' }))).toBe('notif-success');
    expect(component.getColorClass(notif({ ...base, tone: 'WARNING' }))).toBe('notif-warning');
    expect(component.getColorClass(notif({ ...base, tone: 'INFO' }))).toBe('notif-leave');
  });

  it('getColorClass entreprise/véhicule suivent le ton', () => {
    ['NOTIF_ENTREPRISE', 'NOTIF_VEHICULE'].forEach(category => {
      const base = { category };
      expect(component.getColorClass(notif({ ...base, tone: 'SUCCESS' }))).toBe('notif-success');
      expect(component.getColorClass(notif({ ...base, tone: 'DANGER' }))).toBe('notif-danger');
      expect(component.getColorClass(notif({ ...base, tone: 'WARNING' }))).toBe('notif-warning');
      expect(component.getColorClass(notif({ ...base, tone: 'INFO' }))).toBe('notif-info');
      expect(component.getColorClass(notif({ ...base, tone: undefined }))).toBe('notif-info');
    });
  });

  // ─── markAllAsRead ────────────────────────────────────────────
  it('markAllAsRead vide les notifications', () => {
    component.markAllAsRead();
    expect(notificationServiceMock.clearAllNotifications).toHaveBeenCalled();
  });

  // ─── viewDetails ──────────────────────────────────────────────
  it('viewDetails navigue selon la catégorie', () => {
    component.viewDetails(notif({ category: 'NOTIF_CONGE' }));
    expect(router.navigate).toHaveBeenCalledWith(['/dashboard/leave']);

    component.viewDetails(notif({ category: 'NOTIF_TRAJET' }));
    expect(router.navigate).toHaveBeenCalledWith(['/dashboard/trips']);

    component.viewDetails(notif({ category: 'NOTIF_VEHICULE' }));
    expect(router.navigate).toHaveBeenCalledWith(['/dashboard/fleet']);

    component.viewDetails(notif({ category: 'AUTRE' }));
    expect(router.navigate).toHaveBeenCalledWith(['/dashboard']);

    expect(notificationServiceMock.markAsRead).toHaveBeenCalledTimes(4);
  });

  it('viewDetails NOTIF_ENTREPRISE dépend du rôle', () => {
    component.viewDetails(notif({ category: 'NOTIF_ENTREPRISE' }));
    expect(router.navigate).toHaveBeenCalledWith(['/dashboard/company-profile']);

    authServiceMock.getUser.and.returnValue({ id: '1', role: 'SUPERADMIN' });
    component.viewDetails(notif({ category: 'NOTIF_ENTREPRISE' }));
    expect(router.navigate).toHaveBeenCalledWith(['/dashboard/companies']);
  });

  // ─── handleAction ─────────────────────────────────────────────
  it('handleAction refuse les non-congés', () => {
    component.handleAction(notif({ category: 'NOTIF_TRAJET' }), 'ACCEPT');

    expect(snackBarSpy.openFromComponent).toHaveBeenCalledTimes(1);
    const config = snackBarSpy.openFromComponent.calls.mostRecent().args[1] as any;
    expect(config.data.title).toBe('Action non prise en charge');
    expect(config.data.type).toBe('warning');
    expect(leaveServiceMock.approveLeave).not.toHaveBeenCalled();
  });

  it('handleAction sans identifiant de congé', () => {
    notificationServiceMock.getLeaveRequestId.and.returnValue(null);

    component.handleAction(notif(), 'ACCEPT');

    const config = snackBarSpy.openFromComponent.calls.mostRecent().args[1] as any;
    expect(config.data.title).toBe('Action impossible');
    expect(config.data.type).toBe('error');
  });

  it('handleAction ACCEPT approuve et notifie', () => {
    notificationServiceMock.getLeaveRequestId.and.returnValue('42');
    leaveServiceMock.approveLeave.and.returnValue(of({} as any));

    component.handleAction(notif(), 'ACCEPT');

    expect(leaveServiceMock.approveLeave).toHaveBeenCalledWith('42', { commentaire: '', notificationId: 1 });
    expect(notificationServiceMock.markLeaveNotificationHandled).toHaveBeenCalledWith('1', 'ACCEPT');

    const config = snackBarSpy.openFromComponent.calls.mostRecent().args[1] as any;
    expect(config.data.title).toBe('Demande Acceptée');
    expect(config.data.type).toBe('success');
  });

  it('handleAction REJECT refuse et notifie', () => {
    notificationServiceMock.getLeaveRequestId.and.returnValue('42');
    leaveServiceMock.rejectLeave.and.returnValue(of({} as any));

    component.handleAction(notif(), 'REJECT');

    expect(leaveServiceMock.rejectLeave).toHaveBeenCalledWith('42', { commentaire: '', notificationId: 1 });
    expect(notificationServiceMock.markLeaveNotificationHandled).toHaveBeenCalledWith('1', 'REJECT');

    const config = snackBarSpy.openFromComponent.calls.mostRecent().args[1] as any;
    expect(config.data.title).toBe('Demande Refusée');
    expect(config.data.type).toBe('error');
  });

  it('handleAction notifie une erreur de traitement', () => {
    notificationServiceMock.getLeaveRequestId.and.returnValue('42');
    leaveServiceMock.approveLeave.and.returnValue(throwError(() => new Error('ko')));

    component.handleAction(notif(), 'ACCEPT');

    const config = snackBarSpy.openFromComponent.calls.mostRecent().args[1] as any;
    expect(config.data.title).toBe('Erreur');
    expect(config.data.message).toBe('Impossible de traiter la demande de congé.');
  });
});
