import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { DashboardComponent } from './dashboard.component';
import { AuthService } from '../../core/auth.service';

describe('DashboardComponent', () => {
  let component: DashboardComponent;
  let fixture: ComponentFixture<DashboardComponent>;
  let authServiceMock: jasmine.SpyObj<AuthService>;
  let httpMock: HttpTestingController;

  beforeEach(async () => {
    authServiceMock = jasmine.createSpyObj('AuthService', ['getUser', 'isAuthenticated']);

    await TestBed.configureTestingModule({
      imports: [DashboardComponent],
      providers: [
        provideRouter([]),
        provideHttpClient(),
        provideHttpClientTesting(),
        provideAnimationsAsync(),
        { provide: AuthService, useValue: authServiceMock }
      ]
    }).compileComponents();

    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  // ─── SUPERADMIN ───────────────────────────────────────────────
  describe('when user is SUPERADMIN', () => {
    beforeEach(() => {
      authServiceMock.getUser.and.returnValue({ id: '1', role: 'SUPERADMIN' });
      authServiceMock.isAuthenticated.and.returnValue(true);
      fixture = TestBed.createComponent(DashboardComponent);
      component = fixture.componentInstance;
      fixture.detectChanges();
    });

    it('should create', () => {
      expect(component).toBeTruthy();
    });

    it('isManager should be false for SUPERADMIN', () => {
      expect(component.isManager).toBeFalse();
    });

    it('should NOT call secteurs API for SUPERADMIN', () => {
      httpMock.expectNone('http://localhost:8080/api/secteurs');
    });
  });

  // ─── MANAGER ──────────────────────────────────────────────────
  describe('when user is MANAGER', () => {
    beforeEach(() => {
      authServiceMock.getUser.and.returnValue({ id: '2', role: 'MANAGER' });
      authServiceMock.isAuthenticated.and.returnValue(true);
      fixture = TestBed.createComponent(DashboardComponent);
      component = fixture.componentInstance;
    });

    afterEach(() => {
      // consume any pending requests to avoid verify() failure
      httpMock.match('http://localhost:8080/api/secteurs').forEach(r => {
        if (!r.cancelled) r.flush([]);
      });
    });

    it('should create', () => {
      fixture.detectChanges();
      expect(component).toBeTruthy();
    });

    it('isManager should be true for MANAGER', () => {
      fixture.detectChanges();
      expect(component.isManager).toBeTrue();
    });

    it('should call GET /api/secteurs for MANAGER', () => {
      fixture.detectChanges();
      const req = httpMock.expectOne('http://localhost:8080/api/secteurs');
      expect(req.request.method).toBe('GET');
      req.flush([{ id: 1 }, { id: 2 }]);
      expect(component.managerSectorCount).toBe(2);
    });

    it('should set managerSectorCount to 0 on API error', () => {
      fixture.detectChanges();
      httpMock.expectOne('http://localhost:8080/api/secteurs')
        .flush('error', { status: 500, statusText: 'Error' });
      expect(component.managerSectorCount).toBe(0);
    });

    it('should set managerSectorCount to 0 when API returns null', () => {
      fixture.detectChanges();
      httpMock.expectOne('http://localhost:8080/api/secteurs').flush(null);
      expect(component.managerSectorCount).toBe(0);
    });
  });

  // ─── NO USER ──────────────────────────────────────────────────
  describe('when no user is logged in', () => {
    beforeEach(() => {
      authServiceMock.getUser.and.returnValue(null);
      authServiceMock.isAuthenticated.and.returnValue(false);
      fixture = TestBed.createComponent(DashboardComponent);
      component = fixture.componentInstance;
      fixture.detectChanges();
    });

    it('should create', () => {
      expect(component).toBeTruthy();
    });

    it('isManager should be false when no user', () => {
      expect(component.isManager).toBeFalse();
    });

    it('managerSectorCount should be 0 initially', () => {
      expect(component.managerSectorCount).toBe(0);
    });
  });
});
