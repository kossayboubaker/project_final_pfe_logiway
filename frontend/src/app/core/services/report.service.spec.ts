import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ReportService } from './report.service';

describe('ReportService', () => {
  let service: ReportService;
  let httpMock: HttpTestingController;
  const apiBase = 'http://localhost:8080/api/reports';

  const mockReportMetadata = {
    reportId: 'rpt-001',
    titre: 'Rapport Véhicules Juin 2025',
    domaine: 'vehicules',
    format: 'PDF',
    tailleFichierKo: 512,
    dateCreation: '2025-06-01T10:00:00',
    tempsGenerationMs: 2500,
    nombreLignes: 150
  };

  const mockGenerateResponse = {
    reportId: 'rpt-001',
    message: 'Rapport généré avec succès',
    contenu: 'Contenu du rapport...',
    metadata: mockReportMetadata
  };

  const mockListResponse = {
    rapports: [mockReportMetadata],
    total: 1
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        ReportService
      ]
    });
    service = TestBed.inject(ReportService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  // ─── genererRapport() ─────────────────────────────────────────
  it('genererRapport() should call POST /api/reports/generate', () => {
    const request: import('../../models/report.models').GenerateReportRequest = {
      requeteNaturelle: 'Donnez-moi un rapport des véhicules',
      formatPrefere: 'PDF'
    };
    service.genererRapport(request).subscribe(res => {
      expect(res.reportId).toBe('rpt-001');
      expect(res.metadata).toBeTruthy();
      expect(res.metadata!.dateCreation instanceof Date).toBeTrue();
    });
    const req = httpMock.expectOne(`${apiBase}/generate`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(request);
    req.flush(mockGenerateResponse);
  });

  // ─── listerRapports() ─────────────────────────────────────────
  it('listerRapports() should call GET /api/reports?limit=50', () => {
    service.listerRapports().subscribe(res => {
      expect(res.rapports.length).toBe(1);
      expect(res.rapports[0].dateCreation instanceof Date).toBeTrue();
    });
    const req = httpMock.expectOne(`${apiBase}?limit=50`);
    expect(req.request.method).toBe('GET');
    req.flush(mockListResponse);
  });

  it('listerRapports() should include domaine param when provided', () => {
    service.listerRapports('vehicules').subscribe();
    const req = httpMock.expectOne(`${apiBase}?limit=50&domaine=vehicules`);
    req.flush(mockListResponse);
  });

  it('listerRapports() should use custom limit', () => {
    service.listerRapports(undefined, 10).subscribe();
    const req = httpMock.expectOne(`${apiBase}?limit=10`);
    req.flush(mockListResponse);
  });

  // ─── getMetadataRapport() ─────────────────────────────────────
  it('getMetadataRapport() should call GET /api/reports/:id', () => {
    service.getMetadataRapport('rpt-001').subscribe(meta => {
      expect(meta.reportId).toBe('rpt-001');
      expect(meta.dateCreation instanceof Date).toBeTrue();
    });
    const req = httpMock.expectOne(`${apiBase}/rpt-001`);
    expect(req.request.method).toBe('GET');
    req.flush(mockReportMetadata);
  });

  // ─── telechargerRapport() ─────────────────────────────────────
  it('telechargerRapport() should call GET /api/reports/download/:id with blob responseType', () => {
    service.telechargerRapport('rpt-001').subscribe(blob => {
      expect(blob).toBeTruthy();
    });
    const req = httpMock.expectOne(`${apiBase}/download/rpt-001`);
    expect(req.request.method).toBe('GET');
    expect(req.request.responseType).toBe('blob');
    req.flush(new Blob(['content'], { type: 'application/pdf' }));
  });

  // ─── supprimerRapport() ───────────────────────────────────────
  it('supprimerRapport() should call DELETE /api/reports/:id', () => {
    service.supprimerRapport('rpt-001').subscribe();
    const req = httpMock.expectOne(`${apiBase}/rpt-001`);
    expect(req.request.method).toBe('DELETE');
    req.flush(null);
  });

  // ─── formatFileSize() ─────────────────────────────────────────
  it('formatFileSize() should return "X Ko" for sizes < 1024', () => {
    expect(service.formatFileSize(512)).toBe('512 Ko');
    expect(service.formatFileSize(1)).toBe('1 Ko');
    expect(service.formatFileSize(1023)).toBe('1023 Ko');
  });

  it('formatFileSize() should return "X.XX Mo" for sizes >= 1024', () => {
    expect(service.formatFileSize(1024)).toBe('1.00 Mo');
    expect(service.formatFileSize(2048)).toBe('2.00 Mo');
    expect(service.formatFileSize(1536)).toBe('1.50 Mo');
  });

  // ─── formatGenerationTime() ───────────────────────────────────
  it('formatGenerationTime() should return "X ms" for < 1000ms', () => {
    expect(service.formatGenerationTime(500)).toBe('500 ms');
    expect(service.formatGenerationTime(999)).toBe('999 ms');
  });

  it('formatGenerationTime() should return "X.XX s" for >= 1000ms', () => {
    expect(service.formatGenerationTime(1000)).toBe('1.00 s');
    expect(service.formatGenerationTime(2500)).toBe('2.50 s');
  });

  // ═══════════════ COMPLÉMENTS (couverture ~100%) ═══════════════

  // ─── genererRapport() : conversion des dates optionnelles ─────
  it('genererRapport() should convert optional metadata dates when present', () => {
    const request = { requeteNaturelle: 'Rapport chauffeurs', formatPrefere: 'PDF' as const };
    service.genererRapport(request).subscribe(res => {
      expect(res.metadata!.dateCreation instanceof Date).toBeTrue();
      expect(res.metadata!.dateDebutDonnees instanceof Date).toBeTrue();
      expect(res.metadata!.dateDebutDonnees!.getMonth()).toBe(5); // juin
      expect(res.metadata!.dateFinDonnees instanceof Date).toBeTrue();
    });
    httpMock.expectOne(`${apiBase}/generate`).flush({
      reportId: 'rpt-002',
      message: 'OK',
      contenu: '',
      metadata: {
        ...mockReportMetadata,
        dateDebutDonnees: '2025-06-01T00:00:00',
        dateFinDonnees: '2025-06-30T23:59:59'
      }
    });
  });

  it('genererRapport() should pass through responses without metadata', () => {
    const request = { requeteNaturelle: 'test' };
    service.genererRapport(request).subscribe(res => {
      expect(res.metadata).toBeUndefined();
      expect(res.reportId).toBe('rpt-999');
    });
    httpMock.expectOne(`${apiBase}/generate`).flush({
      reportId: 'rpt-999',
      message: 'Généré sans métadonnées',
      contenu: 'contenu brut'
    });
  });

  // ─── listerRapports() : dates optionnelles ────────────────────
  it('listerRapports() should convert optional dates when present', () => {
    service.listerRapports().subscribe(res => {
      const r = res.rapports[0];
      expect(r.dateDebutDonnees instanceof Date).toBeTrue();
      expect(r.dateFinDonnees instanceof Date).toBeTrue();
    });
    httpMock.expectOne(`${apiBase}?limit=50`).flush({
      rapports: [{
        ...mockReportMetadata,
        dateDebutDonnees: '2025-06-01T00:00:00',
        dateFinDonnees: '2025-06-30T00:00:00'
      }],
      total: 1
    });
  });

  it('listerRapports() should leave optional dates undefined when absent', () => {
    service.listerRapports().subscribe(res => {
      const r = res.rapports[0];
      expect(r.dateDebutDonnees).toBeUndefined();
      expect(r.dateFinDonnees).toBeUndefined();
      expect(r.dateCreation instanceof Date).toBeTrue();
    });
    httpMock.expectOne(`${apiBase}?limit=50`).flush({ rapports: [mockReportMetadata], total: 1 });
  });

  // ─── getMetadataRapport() : dates optionnelles ────────────────
  it('getMetadataRapport() should convert optional dates when present', () => {
    service.getMetadataRapport('rpt-001').subscribe(meta => {
      expect(meta.dateDebutDonnees instanceof Date).toBeTrue();
      expect(meta.dateFinDonnees instanceof Date).toBeTrue();
    });
    httpMock.expectOne(`${apiBase}/rpt-001`).flush({
      ...mockReportMetadata,
      dateDebutDonnees: '2025-06-01T00:00:00',
      dateFinDonnees: '2025-06-30T00:00:00'
    });
  });

  it('getMetadataRapport() should leave optional dates undefined when absent', () => {
    service.getMetadataRapport('rpt-001').subscribe(meta => {
      expect(meta.dateDebutDonnees).toBeUndefined();
      expect(meta.dateFinDonnees).toBeUndefined();
    });
    httpMock.expectOne(`${apiBase}/rpt-001`).flush(mockReportMetadata);
  });

  // ─── downloadAndSave() ────────────────────────────────────────
  it('downloadAndSave() should create a temporary blob link, click and revoke it', () => {
    const clickSpy = jest.fn();
    const createElementSpy = jest.spyOn(document, 'createElement')
      .mockReturnValue({ click: clickSpy } as unknown as HTMLAnchorElement);
    // jsdom n'expose pas URL.createObjectURL → assignation manuelle
    const origCreate = (window.URL as any).createObjectURL;
    const origRevoke = (window.URL as any).revokeObjectURL;
    const createObjectURLSpy = jest.fn().mockReturnValue('blob:mock-url');
    const revokeObjectURLSpy = jest.fn();
    (window.URL as any).createObjectURL = createObjectURLSpy;
    (window.URL as any).revokeObjectURL = revokeObjectURLSpy;
    const errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

    const blob = new Blob(['pdf-content'], { type: 'application/pdf' });
    service.downloadAndSave('rpt-001', 'rapport-juin.pdf');

    httpMock.expectOne(`${apiBase}/download/rpt-001`).flush(blob);

    expect(clickSpy).toHaveBeenCalledTimes(1);
    expect(createObjectURLSpy).toHaveBeenCalledWith(blob);
    expect(revokeObjectURLSpy).toHaveBeenCalledWith('blob:mock-url');
    expect(errorSpy).not.toHaveBeenCalled();

    createElementSpy.mockRestore();
    (window.URL as any).createObjectURL = origCreate;
    (window.URL as any).revokeObjectURL = origRevoke;
    errorSpy.mockRestore();
  });

  it('downloadAndSave() should log an error without throwing when the download fails', () => {
    const errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

    service.downloadAndSave('rpt-404', 'missing.pdf');

    httpMock.expectOne(`${apiBase}/download/rpt-404`)
      .error(new ProgressEvent('network error'), { status: 404, statusText: 'Not Found' });

    expect(errorSpy).toHaveBeenCalled();

    errorSpy.mockRestore();
  });
});
