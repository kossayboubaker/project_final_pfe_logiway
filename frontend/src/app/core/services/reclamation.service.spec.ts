import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { ReclamationService } from './reclamation.service';

describe('ReclamationService', () => {
  let service: ReclamationService;
  let httpMock: HttpTestingController;
  const apiBase = 'http://localhost:8080/api/reclamations';

  const mockApiReclamation = {
    id: 1,
    sujet: 'Panne de frein',
    description: 'Le camion 42 a un problème de frein',
    priorite: 'URGENT' as const,
    statut: 'EN_COURS' as const,
    commentaireResolution: null,
    utilisateurId: 5,
    utilisateurNom: 'Jean Dupont',
    utilisateurEmail: 'jean@test.com',
    dateCreation: '2025-01-01T10:00:00',
    dateMiseAJour: '2025-01-02T10:00:00'
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [ReclamationService]
    });
    service = TestBed.inject(ReclamationService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  // ─── list() ─────────────────────────────────────────────────
  it('list() should call GET and return mapped records', () => {
    service.list().subscribe(records => {
      expect(records.length).toBe(1);
      expect(records[0].id).toBe('1');
      expect(records[0].sujet).toBe('Panne de frein');
      expect(records[0].priorite).toBe('URGENT');
      expect(records[0].statut).toBe('EN_COURS');
    });
    const req = httpMock.expectOne(apiBase);
    expect(req.request.method).toBe('GET');
    req.flush([mockApiReclamation]);
  });

  it('list() should return empty array on HTTP error', () => {
    service.list().subscribe(records => {
      expect(records).toEqual([]);
    });
    const req = httpMock.expectOne(apiBase);
    req.flush('error', { status: 500, statusText: 'Server Error' });
  });

  // ─── create() ────────────────────────────────────────────────
  it('create() should call POST with payload', () => {
    const payload = { sujet: 'Test', description: 'Description test', priorite: 'NORMAL' as const };
    service.create(payload).subscribe(r => {
      expect(r.id).toBe('1');
    });
    const req = httpMock.expectOne(apiBase);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(payload);
    req.flush(mockApiReclamation);
  });

  // ─── update() ────────────────────────────────────────────────
  it('update() should call PUT with id and payload', () => {
    const payload = { sujet: 'Updated', description: 'Updated desc', priorite: 'NORMAL' as const };
    service.update('1', payload).subscribe(r => {
      expect(r.sujet).toBe('Panne de frein');
    });
    const req = httpMock.expectOne(`${apiBase}/1`);
    expect(req.request.method).toBe('PUT');
    req.flush(mockApiReclamation);
  });

  // ─── delete() ────────────────────────────────────────────────
  it('delete() should call DELETE with id', () => {
    service.delete('1').subscribe();
    const req = httpMock.expectOne(`${apiBase}/1`);
    expect(req.request.method).toBe('DELETE');
    req.flush(null);
  });

  // ─── resolve() ───────────────────────────────────────────────
  it('resolve() should call PUT /id/resolve with commentaire', () => {
    service.resolve('1', 'Problème résolu').subscribe(r => {
      expect(r.id).toBe('1');
    });
    const req = httpMock.expectOne(`${apiBase}/1/resolve`);
    expect(req.request.method).toBe('PUT');
    expect(req.request.body).toEqual({ commentaire: 'Problème résolu' });
    req.flush(mockApiReclamation);
  });

  // ─── reject() ────────────────────────────────────────────────
  it('reject() should call PUT /id/reject with commentaire', () => {
    service.reject('1', 'Hors scope').subscribe();
    const req = httpMock.expectOne(`${apiBase}/1/reject`);
    expect(req.request.method).toBe('PUT');
    expect(req.request.body).toEqual({ commentaire: 'Hors scope' });
    req.flush(mockApiReclamation);
  });

  // ─── validate() ──────────────────────────────────────────────
  it('validate() should call POST /validate', () => {
    const mockValidationResponse = {
      sujet: { valide: true, type_erreur: null, message: null },
      description: { valide: true, type_erreur: null, message: null }
    };
    service.validate('sujet test', 'description test').subscribe(res => {
      expect(res.sujet.valide).toBeTrue();
      expect(res.description.valide).toBeTrue();
    });
    const req = httpMock.expectOne(`${apiBase}/validate`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({ sujet: 'sujet test', description: 'description test' });
    req.flush(mockValidationResponse);
  });

  it('validate() should detect toxicity in validation response', () => {
    const mockToxicResponse = {
      sujet: { valide: false, type_erreur: 'toxicite', message: 'Contenu toxique détecté' },
      description: { valide: true, type_erreur: null, message: null }
    };
    service.validate('texte inapproprié', 'description ok').subscribe(res => {
      expect(res.sujet.valide).toBeFalse();
      expect(res.sujet.type_erreur).toBe('toxicite');
    });
    const req = httpMock.expectOne(`${apiBase}/validate`);
    req.flush(mockToxicResponse);
  });

  // ─── map() private method tested via list() ───────────────────
  it('list() should map id from number to string', () => {
    service.list().subscribe(records => {
      expect(typeof records[0].id).toBe('string');
      expect(records[0].id).toBe('1');
    });
    httpMock.expectOne(apiBase).flush([mockApiReclamation]);
  });

  it('list() should handle null commentaireResolution', () => {
    service.list().subscribe(records => {
      expect(records[0].commentaireResolution).toBeNull();
    });
    httpMock.expectOne(apiBase).flush([{ ...mockApiReclamation, commentaireResolution: null }]);
  });
});
