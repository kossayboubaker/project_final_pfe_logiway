import { TestBed } from '@angular/core/testing';
import { Router, UrlTree } from '@angular/router';
import { provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { authGuard } from './auth.guard';
import { AuthService } from '../auth.service';

describe('authGuard', () => {
  let authServiceMock: jasmine.SpyObj<AuthService>;
  let router: Router;

  beforeEach(() => {
    authServiceMock = jasmine.createSpyObj('AuthService', ['ensureSession', 'isAuthenticated']);

    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        { provide: AuthService, useValue: authServiceMock }
      ]
    });

    router = TestBed.inject(Router);
  });

  it('should allow access when user is authenticated', (done) => {
    authServiceMock.ensureSession.and.returnValue(of({ id: '1', role: 'MANAGER' }));

    TestBed.runInInjectionContext(() => {
      const result$ = authGuard({} as any, {} as any) as any;
      result$.subscribe((value: any) => {
        expect(value).toBeTrue();
        done();
      });
    });
  });

  it('should redirect to /auth/signin when user is not authenticated', (done) => {
    authServiceMock.ensureSession.and.returnValue(of(null));

    TestBed.runInInjectionContext(() => {
      const result$ = authGuard({} as any, {} as any) as any;
      result$.subscribe((value: any) => {
        expect(value instanceof UrlTree).toBeTrue();
        done();
      });
    });
  });

  it('should call ensureSession to verify authentication', () => {
    authServiceMock.ensureSession.and.returnValue(of({ id: '1', role: 'SUPERADMIN' }));

    TestBed.runInInjectionContext(() => {
      (authGuard({} as any, {} as any) as any).subscribe();
    });

    expect(authServiceMock.ensureSession).toHaveBeenCalled();
  });
});
