import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { AuthService } from './auth.service';
import { NotificationService } from './services/notification.service';
import { of } from 'rxjs';

describe('AuthService', () => {
  let service: AuthService;
  let httpMock: HttpTestingController;
  let notificationServiceMock: jasmine.SpyObj<NotificationService>;
  let consoleLogSpy: jest.SpyInstance;
  let consoleErrorSpy: jest.SpyInstance;

  beforeAll(() => {
    // Silencer les console.log/error du code source (refreshToken, syncProfileAvatar, etc.)
    consoleLogSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterAll(() => {
    consoleLogSpy.mockRestore();
    consoleErrorSpy.mockRestore();
  });

  beforeEach(() => {
    notificationServiceMock = jasmine.createSpyObj('NotificationService', [
      'loadNotifications', 'connectRealtime', 'disconnectRealtime'
    ]);
    notificationServiceMock.loadNotifications.and.returnValue(of([]));

    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        AuthService,
        { provide: NotificationService, useValue: notificationServiceMock }
      ]
    });

    service = TestBed.inject(AuthService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
    localStorage.clear();
  });

  // ─── CRÉATION ────────────────────────────────────────────────
  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  // ─── ÉTAT INITIAL ─────────────────────────────────────────────
  it('should start with no authenticated user', () => {
    expect(service.getUser()).toBeNull();
  });

  it('isAuthenticated() should return false initially', () => {
    expect(service.isAuthenticated()).toBeFalse();
  });

  it('getAlerts() should return empty array when no user', () => {
    expect(service.getAlerts()).toEqual([]);
  });

  it('getHistory() should return empty array when no user', () => {
    expect(service.getHistory()).toEqual([]);
  });

  // ─── LOGIN ────────────────────────────────────────────────────
  it('login() should call POST /api/auth/login with credentials', () => {
    const credentials = { email: 'admin@test.com', password: 'password123' };
    const mockResponse = {
      role: 'SUPERADMIN' as const,
      prenom: 'Jean',
      nom: 'Dupont',
      firstLogin: false,
      hasCompany: true
    };

    service.login(credentials).subscribe(res => {
      expect(res.role).toBe('SUPERADMIN');
    });

    const req = httpMock.expectOne('http://localhost:8080/api/auth/login');
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(credentials);
    req.flush(mockResponse);

    const profileReqs = httpMock.match('http://localhost:8080/api/profile/me');
    profileReqs.forEach(r => r.flush({}));
  });

  it('login() should update currentUser after success', () => {
    const credentials = { email: 'manager@test.com', password: 'pass' };

    service.login(credentials).subscribe();
    httpMock.expectOne('http://localhost:8080/api/auth/login').flush({
      role: 'MANAGER',
      prenom: 'Marie',
      nom: 'Martin',
      firstLogin: false,
      hasCompany: true
    });
    httpMock.match('http://localhost:8080/api/profile/me').forEach(r => r.flush({}));

    const user = service.getUser();
    expect(user).not.toBeNull();
    expect(user.role).toBe('MANAGER');
    expect(user.firstName).toBe('Marie');
  });

  it('login() should map CHAUFFEUR role to DRIVER', () => {
    service.login({ email: 'driver@test.com', password: 'pass' }).subscribe();
    httpMock.expectOne('http://localhost:8080/api/auth/login').flush({
      role: 'CHAUFFEUR',
      prenom: 'Ali',
      nom: 'Jebali',
      firstLogin: false,
      hasCompany: true
    });
    httpMock.match('http://localhost:8080/api/profile/me').forEach(r => r.flush({}));

    expect(service.getUser()?.role).toBe('DRIVER');
  });

  // ─── LOGOUT ───────────────────────────────────────────────────
  it('logout() should clear user and call POST /api/auth/logout', () => {
    (service as any).currentUserSubject.next({ id: '1', role: 'MANAGER' });
    expect(service.isAuthenticated()).toBeTrue();

    service.logout();
    httpMock.expectOne('http://localhost:8080/api/auth/logout').flush({ message: 'OK' });

    expect(service.getUser()).toBeNull();
    expect(service.isAuthenticated()).toBeFalse();
  });

  it('logout() should clear user even on HTTP error', () => {
    (service as any).currentUserSubject.next({ id: '1', role: 'MANAGER' });
    service.logout();
    httpMock.expectOne('http://localhost:8080/api/auth/logout').flush(
      'error', { status: 500, statusText: 'Error' }
    );
    expect(service.getUser()).toBeNull();
  });

  // ─── COMPANY STATUS ───────────────────────────────────────────
  it('hasCompany() should return false when no user', () => {
    expect(service.hasCompany()).toBeFalse();
  });

  it('hasCompany() should return true when companyStatus is ACTIF', () => {
    (service as any).currentUserSubject.next({ id: '1', role: 'MANAGER', companyStatus: 'ACTIF' });
    expect(service.hasCompany()).toBeTrue();
  });

  it('hasCompany() should return false when companyStatus is NONE', () => {
    (service as any).currentUserSubject.next({ id: '1', role: 'MANAGER', companyStatus: 'NONE' });
    expect(service.hasCompany()).toBeFalse();
  });

  it('isCompanyActive() should return true only for ACTIF status', () => {
    (service as any).currentUserSubject.next({ id: '1', role: 'MANAGER', companyStatus: 'ACTIF' });
    expect(service.isCompanyActive()).toBeTrue();
  });

  it('isCompanyActive() should return false for EN_ATTENTE status', () => {
    (service as any).currentUserSubject.next({ id: '1', role: 'MANAGER', companyStatus: 'EN_ATTENTE' });
    expect(service.isCompanyActive()).toBeFalse();
  });

  it('setCompanyStatus() should update companyStatus', () => {
    (service as any).currentUserSubject.next({ id: '1', role: 'MANAGER', companyStatus: 'NONE' });
    service.setCompanyStatus('EN_ATTENTE');
    expect(service.getCompanyStatus()).toBe('EN_ATTENTE');
  });

  it('getCompanyStatus() should return NONE when no user', () => {
    expect(service.getCompanyStatus()).toBe('NONE');
  });

  // ─── NOTIFICATIONS ────────────────────────────────────────────
  it('markAsRead() should add userId to readBy of the notification', () => {
    (service as any).currentUserSubject.next({ id: 'u1', role: 'MANAGER' });
    service.markAsRead('1');
    const notifs = (service as any).notificationsSubject.value;
    expect(notifs.find((n: any) => n.id === '1').readBy).toContain('u1');
  });

  it('removeNotification() should add userId to dismissedBy', () => {
    (service as any).currentUserSubject.next({ id: 'u1', role: 'MANAGER' });
    service.removeNotification('2');
    const notifs = (service as any).notificationsSubject.value;
    expect(notifs.find((n: any) => n.id === '2').dismissedBy).toContain('u1');
  });

  it('markAllAsReadAndDismiss() should dismiss all notifications for the user', () => {
    (service as any).currentUserSubject.next({ id: 'u1', role: 'MANAGER' });
    service.markAllAsReadAndDismiss();
    const notifs = (service as any).notificationsSubject.value;
    notifs.forEach((n: any) => {
      expect(n.dismissedBy).toContain('u1');
      expect(n.readBy).toContain('u1');
    });
  });

  it('getAlerts() should filter dismissed notifications', () => {
    (service as any).currentUserSubject.next({ id: 'u1', role: 'MANAGER' });
    service.removeNotification('1');
    const alerts = service.getAlerts();
    expect(alerts.find((n: any) => n.id === '1')).toBeUndefined();
  });

  // ─── PASSWORD ─────────────────────────────────────────────────
  it('forgotPassword() should call POST /api/auth/forgot-password', () => {
    service.forgotPassword('test@test.com').subscribe();
    const req = httpMock.expectOne('http://localhost:8080/api/auth/forgot-password');
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({ email: 'test@test.com' });
    req.flush({ message: 'Email envoyé' });
  });

  it('resetPassword() should call POST /api/auth/reset-password', () => {
    service.resetPassword('code123', 'newPass!').subscribe();
    const req = httpMock.expectOne('http://localhost:8080/api/auth/reset-password');
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({ code: 'code123', newPassword: 'newPass!' });
    req.flush({ message: 'OK' });
  });

  // ─── TOKEN REFRESH ────────────────────────────────────────────
  it('refreshToken() should return true on success', () => {
    let result = false;
    service.refreshToken().subscribe(v => result = v);
    httpMock.expectOne('http://localhost:8080/api/auth/refresh').flush({});
    expect(result).toBeTrue();
  });

  it('refreshToken() should return false on HTTP error', () => {
    let result = true;
    service.refreshToken().subscribe(v => result = v);
    httpMock.expectOne('http://localhost:8080/api/auth/refresh')
      .flush('error', { status: 401, statusText: 'Unauthorized' });
    expect(result).toBeFalse();
  });

  // ─── UPDATE USER ──────────────────────────────────────────────
  it('updateUser() should update current user data', () => {
    const newUser = { id: '1', role: 'SUPERADMIN', firstName: 'Updated' };
    service.updateUser(newUser);
    expect(service.getUser()?.firstName).toBe('Updated');
  });

  it('updateStatus() should update status of current user', () => {
    (service as any).currentUserSubject.next({ id: '1', role: 'MANAGER', status: 'PENDING' });
    service.updateStatus('APPROVED');
    expect(service.getUser()?.status).toBe('APPROVED');
  });

  // ═══════════════ COMPLÉMENTS (couverture ~100%) ═══════════════

  const flushProfile = () =>
    httpMock.match('http://localhost:8080/api/profile/me').forEach(r => r.flush({}));

  // ─── init() ───────────────────────────────────────────────────
  it('init() should resolve to true', async () => {
    const result = await service.init();
    expect(result).toBeTrue();
  });

  // ─── getMe() ──────────────────────────────────────────────────
  it('getMe() should map the session and connect realtime', () => {
    let emitted: any;
    service.currentUser.subscribe(u => emitted = u);

    service.getMe().subscribe(user => {
      expect(user.role).toBe('DRIVER');
      expect(user.firstName).toBe('Ali');
      expect(user.status).toBe('APPROVED');
      expect(user.email).toBe('');
      expect(service.getUser()).not.toBeNull();
    });

    httpMock.expectOne('http://localhost:8080/api/auth/me').flush({
      role: 'CHAUFFEUR', prenom: 'Ali', nom: 'Jebali', firstLogin: true, hasCompany: true
    });
    flushProfile();

    expect(emitted?.role).toBe('DRIVER');
    expect(notificationServiceMock.connectRealtime).toHaveBeenCalled();
  });

  it('getMe() should keep the existing avatar', () => {
    (service as any).currentUserSubject.next({ email: 'm@test.com', avatar: 'data:image/png;base64,x' });

    service.getMe().subscribe();
    httpMock.expectOne('http://localhost:8080/api/auth/me').flush({
      role: 'MANAGER', prenom: 'Marie', nom: 'Martin', firstLogin: false
    });
    // le profil renvoie la même image → l'avatar est conservé
    httpMock.expectOne('http://localhost:8080/api/profile/me')
      .flush({ image: 'data:image/png;base64,x' });

    expect(service.getUser()?.avatar).toBe('data:image/png;base64,x');
  });

  // ─── ensureSession() ──────────────────────────────────────────
  it('ensureSession() should reuse the existing user without HTTP call', () => {
    const existing = { id: 'u9', role: 'MANAGER' };
    (service as any).currentUserSubject.next(existing);

    let result: any;
    service.ensureSession().subscribe(u => result = u);

    expect(result).toBe(existing);
    expect(notificationServiceMock.loadNotifications).toHaveBeenCalled();
    expect(notificationServiceMock.connectRealtime).toHaveBeenCalled();
  });

  it('ensureSession() should restore the session via getMe() when unknown', () => {
    service.ensureSession().subscribe(user => {
      expect(user.role).toBe('SUPERADMIN');
    });
    httpMock.expectOne('http://localhost:8080/api/auth/me').flush({
      role: 'SUPERADMIN', prenom: 'Root', nom: 'Admin', firstLogin: false, hasCompany: true
    });
    flushProfile();

    expect(notificationServiceMock.loadNotifications).toHaveBeenCalled();
    expect(notificationServiceMock.connectRealtime).toHaveBeenCalled();
  });

  it('ensureSession() should emit null when getMe() fails', () => {
    let result: any = 'not-called';
    service.ensureSession().subscribe(u => result = u);

    httpMock.expectOne('http://localhost:8080/api/auth/me')
      .flush('unauthorized', { status: 401, statusText: 'Unauthorized' });

    expect(result).toBeNull();
    expect(service.isAuthenticated()).toBeFalse();
  });

  // ─── logout() : déconnexion temps réel ────────────────────────
  it('logout() should disconnect the realtime stream', () => {
    (service as any).currentUserSubject.next({ id: '1' });
    service.logout();
    httpMock.expectOne('http://localhost:8080/api/auth/logout').flush({ message: 'OK' });
    expect(notificationServiceMock.disconnectRealtime).toHaveBeenCalled();
  });

  // ─── getRejectionReason() ─────────────────────────────────────
  it('getRejectionReason() should POST the email', () => {
    service.getRejectionReason('pending@test.com').subscribe(res => {
      expect(res.message).toContain('documents');
    });
    const req = httpMock.expectOne('http://localhost:8080/api/auth/rejection-reason');
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({ email: 'pending@test.com' });
    req.flush({ message: 'Documents invalides' });
  });

  // ─── getters simples ──────────────────────────────────────────
  it('getStatus() should default to PENDING then reflect the user status', () => {
    expect(service.getStatus()).toBe('PENDING');

    (service as any).currentUserSubject.next({ id: '1', status: 'REJECTED' });
    expect(service.getStatus()).toBe('REJECTED');
  });

  it('getToken() should always return null (cookie-based auth)', () => {
    expect(service.getToken()).toBeNull();
  });

  it('isApproved() should reflect the approved flag', () => {
    expect(service.isApproved()).toBeFalse();

    (service as any).currentUserSubject.next({ approved: true });
    expect(service.isApproved()).toBeTrue();

    (service as any).currentUserSubject.next({});
    expect(service.isApproved()).toBeFalse();
  });

  it('hasCompany() should handle string companyStatus other than NONE/ACTIF', () => {
    (service as any).currentUserSubject.next({ companyStatus: 'EN_ATTENTE' });
    expect(service.hasCompany()).toBeTrue();

    (service as any).currentUserSubject.next({ companyStatus: 'SUSPENDU' });
    expect(service.hasCompany()).toBeTrue();
  });

  it('hasCompany() should fall back to the boolean hasCompany flag', () => {
    (service as any).currentUserSubject.next({ hasCompany: true });
    expect(service.hasCompany()).toBeTrue();

    (service as any).currentUserSubject.next({ hasCompany: false });
    expect(service.hasCompany()).toBeFalse();

    (service as any).currentUserSubject.next({});
    expect(service.hasCompany()).toBeFalse();
  });

  // ─── setHasCompany() + persistance localStorage ───────────────
  it('setHasCompany(true) should persist "1" and set ACTIF status', () => {
    (service as any).currentUserSubject.next({ id: '1', email: 'Ali@Test.com' });

    service.setHasCompany(true);

    expect(localStorage.getItem('logiway.hasCompany.ali@test.com')).toBe('1');
    expect(service.getCompanyStatus()).toBe('ACTIF');
    expect(service.hasCompany()).toBeTrue();
  });

  it('setHasCompany(false) should persist "0" and set NONE status', () => {
    (service as any).currentUserSubject.next({ id: '1', email: 'ali@test.com', companyStatus: 'ACTIF' });

    service.setHasCompany(false);

    expect(localStorage.getItem('logiway.hasCompany.ali@test.com')).toBe('0');
    expect(service.getCompanyStatus()).toBe('NONE');
  });

  it('setHasCompany(true) should preserve an existing non-ACTIF status', () => {
    (service as any).currentUserSubject.next({ id: '1', email: 'ali@test.com', companyStatus: 'EN_ATTENTE' });

    service.setHasCompany(true);

    expect(service.getCompanyStatus()).toBe('EN_ATTENTE');
  });

  it('setHasCompany() should skip persistence when the user has no email', () => {
    (service as any).currentUserSubject.next({ id: '1' });

    expect(() => service.setHasCompany(true)).not.toThrow();
    expect(localStorage.length).toBe(0);
    expect(service.getCompanyStatus()).toBe('ACTIF');
  });

  it('resolveHasCompanyFlag() should read the stored flag for a MANAGER session', () => {
    localStorage.setItem('logiway.hasCompany.manager@test.com', '1');

    service.login({ email: 'manager@test.com', password: 'pass' }).subscribe();
    httpMock.expectOne('http://localhost:8080/api/auth/login').flush({
      role: 'MANAGER', prenom: 'M', nom: 'M', firstLogin: false, hasCompany: undefined as any
    });
    flushProfile();

    expect(service.getUser()?.hasCompany).toBeTrue();
    expect(service.getCompanyStatus()).toBe('ACTIF');
  });

  it('resolveHasCompanyFlag() should default managers without flag to false', () => {
    service.login({ email: 'manager2@test.com', password: 'pass' }).subscribe();
    httpMock.expectOne('http://localhost:8080/api/auth/login').flush({
      role: 'MANAGER', prenom: '', nom: '', firstLogin: false, hasCompany: undefined as any
    });
    flushProfile();

    const user = service.getUser();
    expect(user?.hasCompany).toBeFalse();
    expect(user?.username).toBe('manager2@test.com'); // fallback sur l'email
    expect(service.getCompanyStatus()).toBe('NONE');
  });

  // ─── alertes / historique pour un chauffeur ───────────────────
  it('getAlerts() should rewrite leave requests for drivers', () => {
    (service as any).currentUserSubject.next({ id: 'u1', role: 'DRIVER' });

    const conge = service.getAlerts().find(n => n.category === 'NOTIF_CONGE')!;
    expect(conge.message).toBe('Votre demande de congé pour le 20/03/2026 a été Approuvée.');
    expect(conge.type).toBe('INFO');
    expect(conge.actionType).toBeUndefined();
  });

  it('getHistory() should rewrite leave requests for drivers too', () => {
    (service as any).currentUserSubject.next({ id: 'u1', role: 'DRIVER' });

    const conge = service.getHistory().find(n => n.category === 'NOTIF_CONGE')!;
    expect(conge.type).toBe('INFO');
    expect(conge.actionType).toBeUndefined();

    // les autres notifications restent intactes
    const trajet = service.getHistory().find(n => n.category === 'NOTIF_TRAJET')!;
    expect(trajet.actionType).toBe('TRIP_ASSIGNMENT');
  });

  it('getAlerts() should mark read via readBy containing the user id', () => {
    (service as any).currentUserSubject.next({ id: 'u1', role: 'MANAGER' });
    service.markAsRead('1');   // ajoute u1 dans readBy

    const alert = service.getAlerts().find(n => n.id === '1')!;
    expect(alert.isRead).toBeTrue();
  });

  // ─── gardes "aucun utilisateur" ───────────────────────────────
  it('markAllAsReadAndDismiss() / markAsRead() / removeNotification() should be no-ops without user', () => {
    const before = (service as any).notificationsSubject.value;

    service.markAllAsReadAndDismiss();
    service.markAsRead('1');
    service.removeNotification('1');

    expect((service as any).notificationsSubject.value).toEqual(before);
    expect(before.every((n: any) => !n.readBy && !n.dismissedBy)).toBeTrue();
  });

  it('updateStatus() should do nothing without user', () => {
    service.updateStatus('APPROVED');
    expect(service.getUser()).toBeNull();
  });

  // ─── mappers privés ───────────────────────────────────────────
  it('mapApiUser() should map API users for every role/activity combination', () => {
    const driverActif = (service as any).mapApiUser(
      { id: 5, prenom: 'Ali', nom: 'Jebali', email: 'a@t.com', role: 'CHAUFFEUR', actif: true }
    );
    expect(driverActif.role).toBe('DRIVER');
    expect(driverActif.status).toBe('APPROVED');
    expect(driverActif.username).toBe('Ali Jebali');
    expect(driverActif.hasCompany).toBeTrue(); // non-manager → toujours true

    const chauffeurInactif = (service as any).mapApiUser(
      { id: 6, prenom: 'S', nom: 'K', email: 's@t.com', role: 'CHAUFFEUR', actif: false }
    );
    expect(chauffeurInactif.status).toBe('REJECTED');

    const superadmin = (service as any).mapApiUser(
      { id: 7, prenom: 'R', nom: 'A', email: 'r@t.com', role: 'SUPERADMIN', actif: true }
    );
    expect(superadmin.role).toBe('SUPERADMIN');

    const managerSansFlag = (service as any).mapApiUser(
      { id: 8, prenom: 'M', nom: 'N', email: 'm@t.com', role: 'MANAGER', actif: true }
    );
    expect(managerSansFlag.hasCompany).toBeFalse(); // pas de flag en localStorage
  });

  it('extractRoleFromJwtPayload() should decode realm roles with DRIVER fallback', () => {
    const fn = (service as any).extractRoleFromJwtPayload.bind(service);
    expect(fn(null)).toBe('DRIVER');
    expect(fn({})).toBe('DRIVER');
    expect(fn({ realm_access: { roles: ['ROLE_SUPERADMIN'] } })).toBe('SUPERADMIN');
    expect(fn({ realm_access: { roles: ['offline_access', 'ROLE_MANAGER'] } })).toBe('MANAGER');
    expect(fn({ realm_access: { roles: ['autre'] } })).toBe('DRIVER');
  });

  // ─── syncProfileAvatar() ──────────────────────────────────────
  it('login() should sync the avatar from GET /api/profile/me', () => {
    service.login({ email: 'a@t.com', password: 'p' }).subscribe();
    httpMock.expectOne('http://localhost:8080/api/auth/login').flush({
      role: 'MANAGER', prenom: 'A', nom: 'B', firstLogin: false, hasCompany: true
    });
    httpMock.expectOne('http://localhost:8080/api/profile/me').flush({ image: 'https://cdn/img.png' });

    expect(service.getUser()?.avatar).toBe('https://cdn/img.png');
  });

  it('profile image undefined should reset the avatar to null', () => {
    (service as any).currentUserSubject.next({ email: 'a@t.com', avatar: 'old.png' });

    service.getMe().subscribe();
    httpMock.expectOne('http://localhost:8080/api/auth/me').flush({
      role: 'MANAGER', prenom: 'A', nom: 'B', firstLogin: false, hasCompany: true
    });
    httpMock.expectOne('http://localhost:8080/api/profile/me').flush({});

    expect(service.getUser()?.avatar).toBeNull();
  });

  it('avatar sync failure should not break the flow and allow later retries', () => {
    service.login({ email: 'a@t.com', password: 'p' }).subscribe();
    httpMock.expectOne('http://localhost:8080/api/auth/login').flush({
      role: 'MANAGER', prenom: 'A', nom: 'B', firstLogin: false, hasCompany: true
    });
    httpMock.expectOne('http://localhost:8080/api/profile/me')
      .flush('oops', { status: 500, statusText: 'Error' });

    expect(service.isAuthenticated()).toBeTrue();

    // le flag profileSyncInProgress est réinitialisé par finalize → retry OK
    service.getMe().subscribe();
    httpMock.expectOne('http://localhost:8080/api/auth/me').flush({
      role: 'MANAGER', prenom: 'A', nom: 'B', firstLogin: false, hasCompany: true
    });
    httpMock.expectOne('http://localhost:8080/api/profile/me').flush({ image: 'retry.png' });

    expect(service.getUser()?.avatar).toBe('retry.png');
  });

  it('syncProfileAvatar() should not re-emit when the avatar is unchanged', () => {
    (service as any).currentUserSubject.next({ email: 'a@t.com', avatar: null });

    let emissions = 0;
    service.currentUser.subscribe(() => emissions++);
    emissions = 0;   // ignore l'émission initiale du BehaviorSubject

    service.getMe().subscribe();
    httpMock.expectOne('http://localhost:8080/api/auth/me').flush({
      role: 'MANAGER', prenom: 'A', nom: 'B', firstLogin: false, hasCompany: true
    });
    httpMock.expectOne('http://localhost:8080/api/profile/me').flush({});

    // 1 émission du getMe(), pas d'émission supplémentaire pour l'avatar identique
    expect(emissions).toBe(1);
    expect(service.getUser()?.avatar).toBeNull();
  });

  it('setCompanyStatus() should do nothing without user', () => {
    service.setCompanyStatus('ACTIF');
    expect(service.getCompanyStatus()).toBe('NONE');
  });

  it('resolveHasCompanyFlag() should keep an existing boolean without touching storage', () => {
    (service as any).currentUserSubject.next({ email: 'm@test.com', hasCompany: false });

    service.getMe().subscribe();
    httpMock.expectOne('http://localhost:8080/api/auth/me').flush({
      role: 'MANAGER', prenom: 'M', nom: 'M', firstLogin: false, hasCompany: undefined as any
    });
    flushProfile();

    expect(service.getUser()?.hasCompany).toBeFalse();
    expect(localStorage.getItem('logiway.hasCompany.m@test.com')).toBeNull(); // pas d'écriture
  });

  it('persistHasCompanyFlag() should swallow storage write failures', () => {
    const setItemSpy = jest.spyOn(Storage.prototype, 'setItem')
      .mockImplementation(() => { throw new Error('quota exceeded'); });

    (service as any).currentUserSubject.next({ id: '1', email: 'ali@test.com' });
    expect(() => service.setHasCompany(true)).not.toThrow();
    expect(service.hasCompany()).toBeTrue();

    setItemSpy.mockRestore();
  });

  it('readHasCompanyFlag() should fall back to false on storage read failures', () => {
    const getItemSpy = jest.spyOn(Storage.prototype, 'getItem')
      .mockImplementation(() => { throw new Error('storage blocked'); });

    service.login({ email: 'manager@test.com', password: 'pass' }).subscribe();
    httpMock.expectOne('http://localhost:8080/api/auth/login').flush({
      role: 'MANAGER', prenom: 'M', nom: 'M', firstLogin: false, hasCompany: undefined as any
    });
    flushProfile();

    expect(service.getUser()?.hasCompany).toBeFalse();

    getItemSpy.mockRestore();
  });

  it('syncProfileAvatar() should skip while a previous sync is still in flight', () => {
    // 1er login : la requête profile/me reste en attente → flag actif
    service.login({ email: 'a@t.com', password: 'p' }).subscribe();
    httpMock.expectOne('http://localhost:8080/api/auth/login').flush({
      role: 'MANAGER', prenom: 'A', nom: 'B', firstLogin: false, hasCompany: true
    });

    // 2e login pendant que le 1er sync est en cours → sync ignoré
    service.login({ email: 'a@t.com', password: 'p' }).subscribe();
    httpMock.expectOne('http://localhost:8080/api/auth/login').flush({
      role: 'MANAGER', prenom: 'A', nom: 'B', firstLogin: false, hasCompany: true
    });

    // une seule requête profile au total, et elle met l'avatar à jour
    httpMock.expectOne('http://localhost:8080/api/profile/me').flush({ image: 'inflight.png' });
    expect(service.getUser()?.avatar).toBe('inflight.png');
  });

  it('profile sync should ignore its response when the user logged out meanwhile', () => {
    service.login({ email: 'a@t.com', password: 'p' }).subscribe();
    httpMock.expectOne('http://localhost:8080/api/auth/login').flush({
      role: 'MANAGER', prenom: 'A', nom: 'B', firstLogin: false, hasCompany: true
    });

    // déconnexion avant que le profil ne réponde
    service.logout();
    httpMock.expectOne('http://localhost:8080/api/auth/logout').flush({ message: 'OK' });
    httpMock.expectOne('http://localhost:8080/api/profile/me').flush({ image: 'late.png' });

    expect(service.getUser()).toBeNull();   // pas de ré-émission utilisateur
    expect(service.isAuthenticated()).toBeFalse();
  });
});
