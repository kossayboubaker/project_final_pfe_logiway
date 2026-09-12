import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { AffectationService } from './affectation.service';

describe('AffectationService', () => {
  let service: AffectationService;
  let httpMock: HttpTestingController;
  const apiBase = 'http://localhost:8080/api/vehicules';

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        AffectationService
      ]
    });
    service = TestBed.inject(AffectationService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  // ─── assignerChauffeurVehicule() ──────────────────────────────
  it('assignerChauffeurVehicule() should PUT /api/vehicules/:id/driver with chauffeurId payload', () => {
    service.assignerChauffeurVehicule(2, 7, 42).subscribe(res => {
      expect(res.message).toBe('Chauffeur affecté');
    });

    const req = httpMock.expectOne(`${apiBase}/42/driver`);
    expect(req.request.method).toBe('PUT');
    expect(req.request.body).toEqual({ chauffeurId: 7 });
    req.flush({ message: 'Chauffeur affecté' });
  });

  it('assignerChauffeurVehicule() should build correct URL for different ids', () => {
    service.assignerChauffeurVehicule(99, 123, 555).subscribe();

    const req = httpMock.expectOne(`${apiBase}/555/driver`);
    expect(req.request.body).toEqual({ chauffeurId: 123 });
    req.flush({});
  });

  it('assignerChauffeurVehicule() should ignore secteurId in the request', () => {
    service.assignerChauffeurVehicule(1, 5, 9).subscribe();

    const req = httpMock.expectOne(`${apiBase}/9/driver`);
    expect(Object.keys(req.request.body)).not.toContain('secteurId');
    req.flush({});
  });

  it('assignerChauffeurVehicule() should propagate HTTP errors', () => {
    let errorCaught = false;

    service.assignerChauffeurVehicule(1, 5, 9).subscribe({
      next: () => fail('should have failed'),
      error: () => errorCaught = true
    });

    httpMock.expectOne(`${apiBase}/9/driver`).flush('conflict', { status: 409, statusText: 'Conflict' });
    expect(errorCaught).toBeTrue();
  });
});
