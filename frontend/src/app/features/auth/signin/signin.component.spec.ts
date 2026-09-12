import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { of, throwError } from 'rxjs';
import { Router } from '@angular/router';
import { MatDialogModule } from '@angular/material/dialog';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { SignInComponent } from './signin.component';
import { AuthService } from '../../../core/auth.service';
import { NotificationService } from '../../../core/services/notification.service';

describe('SignInComponent', () => {
  let component: SignInComponent;
  let fixture: ComponentFixture<SignInComponent>;
  let authServiceMock: jasmine.SpyObj<AuthService>;
  let notificationServiceMock: jasmine.SpyObj<NotificationService>;
  let snackBarSpy: jasmine.SpyObj<MatSnackBar>;
  let router: Router;

  beforeEach(async () => {
    authServiceMock = jasmine.createSpyObj('AuthService', [
      'login', 'isAuthenticated', 'getUser', 'hasCompany', 'isCompanyActive', 'getCompanyStatus'
    ]);
    authServiceMock.isAuthenticated.and.returnValue(false);
    authServiceMock.getUser.and.returnValue(null);

    notificationServiceMock = jasmine.createSpyObj('NotificationService', [
      'loadNotifications', 'connectRealtime', 'disconnectRealtime'
    ]);
    notificationServiceMock.loadNotifications.and.returnValue(of([]));

    snackBarSpy = jasmine.createSpyObj('MatSnackBar', ['openFromComponent']);

    await TestBed.configureTestingModule({
      imports: [SignInComponent],
      providers: [
        provideRouter([]),
        provideHttpClient(),
        provideAnimationsAsync(),
        { provide: AuthService, useValue: authServiceMock },
        { provide: NotificationService, useValue: notificationServiceMock },
        { provide: MatSnackBar, useValue: snackBarSpy }
      ]
    })
      .overrideComponent(SignInComponent, { remove: { imports: [MatSnackBarModule] } })
      .compileComponents();

    fixture = TestBed.createComponent(SignInComponent);
    component = fixture.componentInstance;
    router = TestBed.inject(Router);
    spyOn(router, 'navigate');
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should have email and password fields initialized to empty strings', () => {
    expect(component.email).toBe('');
    expect(component.password).toBe('');
  });

  it('errorMessage should be null initially', () => {
    expect(component.errorMessage).toBeNull();
  });

  it('isSubmitting should be false initially', () => {
    expect(component.isSubmitting).toBeFalse();
  });

  // ─── onSignIn() ──────────────────────────────────────────────
  it('onSignIn() should not submit when isSubmitting is already true', () => {
    component.isSubmitting = true;
    component.onSignIn();
    expect(authServiceMock.login).not.toHaveBeenCalled();
  });

  it('onSignIn() should call authService.login with email and password', () => {
    authServiceMock.login.and.returnValue(of({
      role: 'SUPERADMIN' as const,
      prenom: 'Jean',
      nom: 'Test',
      firstLogin: false,
      hasCompany: true
    }));
    authServiceMock.getUser.and.returnValue({ role: 'SUPERADMIN', hasCompany: true });

    component.email = 'admin@test.com';
    component.password = 'password123';
    component.onSignIn();

    expect(authServiceMock.login).toHaveBeenCalledWith({
      email: 'admin@test.com',
      password: 'password123'
    });
  });

  it('onSignIn() should set errorMessage on 401 error', () => {
    authServiceMock.login.and.returnValue(throwError(() => ({
      status: 401,
      error: { message: 'Invalid credentials' }
    })));

    component.email = 'wrong@test.com';
    component.password = 'wrongpass';
    component.onSignIn();

    expect(component.errorMessage).toBeTruthy();
    expect(component.isSubmitting).toBeFalse();
  });

  it('onSignIn() should set errorMessage on 403 (rejected account) error', () => {
    authServiceMock.login.and.returnValue(throwError(() => ({
      status: 403,
      error: { message: 'compte rejeté par l\'administrateur' }
    })));

    component.email = 'rejected@test.com';
    component.password = 'pass';
    component.onSignIn();

    expect(component.errorMessage).toBeTruthy();
    expect(component.isSubmitting).toBeFalse();
  });

  it('onSignIn() should reset isSubmitting to false after error', () => {
    authServiceMock.login.and.returnValue(throwError(() => ({ status: 500 })));
    component.email = 'test@test.com';
    component.password = 'pass';
    component.onSignIn();
    expect(component.isSubmitting).toBeFalse();
  });

  it('onSignIn() should reset isSubmitting to false after success', () => {
    authServiceMock.login.and.returnValue(of({
      role: 'MANAGER' as const,
      prenom: 'Ali',
      nom: 'Test',
      firstLogin: false,
      hasCompany: true
    }));
    authServiceMock.getUser.and.returnValue({ role: 'MANAGER', hasCompany: true });
    authServiceMock.hasCompany.and.returnValue(true);

    component.email = 'manager@test.com';
    component.password = 'pass';
    component.onSignIn();

    expect(component.isSubmitting).toBeFalse();
  });

  // ─── Navigation selon rôle ────────────────────────────────────
  it('SUPERADMIN → /dashboard/superadmin', () => {
    authServiceMock.login.and.returnValue(of({} as any));
    authServiceMock.getUser.and.returnValue({ role: 'SUPERADMIN' });

    component.onSignIn();

    expect(router.navigate).toHaveBeenCalledWith(['/dashboard/superadmin']);
  });

  it('MANAGER sans société → /dashboard/company-profile', () => {
    authServiceMock.login.and.returnValue(of({} as any));
    authServiceMock.getUser.and.returnValue({ role: 'MANAGER' });
    authServiceMock.hasCompany.and.returnValue(false);

    component.onSignIn();

    expect(router.navigate).toHaveBeenCalledWith(['/dashboard/company-profile']);
  });

  it('MANAGER avec société → /dashboard/manager', () => {
    authServiceMock.login.and.returnValue(of({} as any));
    authServiceMock.getUser.and.returnValue({ role: 'MANAGER' });
    authServiceMock.hasCompany.and.returnValue(true);

    component.onSignIn();

    expect(router.navigate).toHaveBeenCalledWith(['/dashboard/manager']);
  });

  it('autre rôle (DRIVER) → /dashboard/driver', () => {
    authServiceMock.login.and.returnValue(of({} as any));
    authServiceMock.getUser.and.returnValue({ role: 'CHAUFFEUR' });

    component.onSignIn();

    expect(router.navigate).toHaveBeenCalledWith(['/dashboard/driver']);
  });

  it('utilisateur null après login : aucune navigation', () => {
    authServiceMock.login.and.returnValue(of({} as any));
    authServiceMock.getUser.and.returnValue(null);

    component.onSignIn();

    expect(router.navigate).not.toHaveBeenCalled();
  });

  // ─── Erreurs détaillées ───────────────────────────────────────
  const loginError = (err: any) => {
    authServiceMock.login.and.returnValue(throwError(() => err));
    component.email = 'a@b.c';
    component.password = 'x';
    component.onSignIn();
  };

  it('message « compte rejeté » sans statut 403 → snack rejeté', () => {
    loginError({ status: 400, error: { message: 'Votre compte rejeté par l\'admin' } });

    expect(component.errorMessage).toBe('Votre compte rejeté par l\'admin');
    expect(snackBarSpy.openFromComponent).toHaveBeenCalledTimes(1);
    const config = snackBarSpy.openFromComponent.calls.mostRecent().args[1] as any;
    expect(config.data.title).toBe('Compte rejeté');
    expect(config.duration).toBe(6000);
  });

  it('403 sans message backend → message par défaut', () => {
    loginError({ status: 403, error: {} });

    expect(component.errorMessage).toBe('Compte rejeté par l\'administrateur');
    expect(snackBarSpy.openFromComponent).toHaveBeenCalled();
  });

  it('401 avec message inconnu → Invalid credentials normalisé', () => {
    loginError({ status: 401, error: { message: 'HTTP failure response for /auth/login' } });

    expect(component.errorMessage).toBe('Invalid credentials');
    const config = snackBarSpy.openFromComponent.calls.mostRecent().args[1] as any;
    expect(config.data.title).toBe('Connexion refusée');
    expect(config.duration).toBe(5000);
  });

  it('401 sans erreur → Invalid credentials', () => {
    loginError({ status: 401 });

    expect(component.errorMessage).toBe('Invalid credentials');
  });

  it('401 avec autre message → transmis tel quel', () => {
    loginError({ status: 401, error: { message: 'Compte en attente de validation' } });

    expect(component.errorMessage).toBe('Compte en attente de validation');
  });

  it('503 sans backendMessage → message d\'indisponibilité', () => {
    loginError({ status: 503, error: {} });

    expect(component.errorMessage).toBe('Service d\'authentification temporairement indisponible. Réessayez dans un instant.');
  });

  it('503 avec backendMessage → transmis', () => {
    loginError({ status: 503, error: { message: 'Maintenance en cours' } });

    expect(component.errorMessage).toBe('Maintenance en cours');
  });

  it('erreur générique sans backendMessage → fallback', () => {
    loginError({ status: 500, error: {} });

    expect(component.errorMessage).toBe('Invalid credentials');
    expect(snackBarSpy.openFromComponent).not.toHaveBeenCalled();
  });

  // ─── extractBackendMessage ────────────────────────────────────
  it('payload string JSON parsé → champ message', () => {
    loginError({ status: 500, error: '{"message":"Erreur métier"}' });

    expect(component.errorMessage).toBe('Erreur métier');
  });

  it('payload string JSON → champ error en secours', () => {
    loginError({ status: 500, error: '{"error":"Problème serveur"}' });

    expect(component.errorMessage).toBe('Problème serveur');
  });

  it('payload string JSON sans champs → chaîne brute', () => {
    loginError({ status: 500, error: '"texte simple"' });

    expect(component.errorMessage).toBe('"texte simple"');
  });

  it('payload string non JSON transport → null puis fallback', () => {
    loginError({ status: 500, error: 'HTTP failure response for /api/auth/login' });

    expect(component.errorMessage).toBe('Invalid credentials');
  });

  it('payload string non JSON non transport → brut', () => {
    loginError({ status: 500, error: 'Boom!' });

    expect(component.errorMessage).toBe('Boom!');
  });

  it('payload objet champ error uniquement', () => {
    loginError({ status: 500, error: { error: 'Seulement error' } });

    expect(component.errorMessage).toBe('Seulement error');
  });

  it('erreur undefined → message null puis fallback', () => {
    authServiceMock.login.and.returnValue(throwError(() => undefined));
    component.email = 'a@b.c';
    component.onSignIn();

    expect(component.errorMessage).toBe('Invalid credentials');
  });
});
