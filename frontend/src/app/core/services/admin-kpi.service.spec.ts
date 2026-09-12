import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { AdminKpiService } from './admin-kpi.service';

describe('AdminKpiService', () => {
  let service: AdminKpiService;
  let httpMock: HttpTestingController;
  const apiBase = 'http://localhost:8080/api/admin/kpi/overview';

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        AdminKpiService
      ]
    });
    service = TestBed.inject(AdminKpiService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  // ─── getOverview() ────────────────────────────────────────────
  it('getOverview() should call GET /api/admin/kpi/overview without params by default', () => {
    const mockOverview = {
      totalVehicules: 25,
      totalChauffeurs: 40,
      tauxDisponibilite: 0.82,
      alertesOuvertes: 3
    };

    service.getOverview().subscribe(res => {
      expect(res).toEqual(mockOverview);
    });

    const req = httpMock.expectOne(apiBase);
    expect(req.request.method).toBe('GET');
    expect(req.request.params.keys().length).toBe(0);
    req.flush(mockOverview);
  });

  it('getOverview() should forward custom params as query string', () => {
    service.getOverview({ domaine: 'vehicules', periode: 'mois' }).subscribe();

    const req = httpMock.expectOne(r => r.url === apiBase);
    expect(req.request.method).toBe('GET');
    expect(req.request.params.get('domaine')).toBe('vehicules');
    expect(req.request.params.get('periode')).toBe('mois');
    req.flush({});
  });

  it('getOverview() should propagate HTTP errors to the caller', () => {
    let errorCaught = false;

    service.getOverview().subscribe({
      next: () => fail('should have failed'),
      error: () => errorCaught = true
    });

    httpMock.expectOne(apiBase).flush('error', { status: 500, statusText: 'Server Error' });
    expect(errorCaught).toBeTrue();
  });
});
