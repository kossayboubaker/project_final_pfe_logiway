import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { LeaveService } from './leave.service';

describe('LeaveService', () => {
  let service: LeaveService;
  let httpMock: HttpTestingController;
  const apiBase = 'http://localhost:8080/api/conges';

  const mockLeaveApi = {
    id: 1,
    type: 'VACANCES' as const,
    dateDebut: '2025-07-01',
    dateFin: '2025-07-10',
    periode: 10,
    motif: 'Vacances d\'été',
    statut: 'EN_ATTENTE' as const,
    requesterId: 5,
    requesterNom: 'Ali Ben',
    requesterEmail: 'ali@test.com',
    requesterRole: 'CHAUFFEUR' as const,
    managerId: 3,
    managerNom: 'Jean Dupont',
    managerEmail: 'jean@test.com',
    commentaireValidation: null,
    dateCreation: '2025-06-01T10:00:00',
    dateMiseAJour: null
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        LeaveService
      ]
    });
    service = TestBed.inject(LeaveService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  // ─── getLeaves() ──────────────────────────────────────────────
  it('getLeaves() should call GET /api/conges', () => {
    service.getLeaves().subscribe(leaves => {
      expect(leaves.length).toBe(1);
      expect(leaves[0].id).toBe('1');
      expect(leaves[0].type).toBe('VACANCES');
      expect(leaves[0].typeLabel).toBe('Vacances');
      expect(leaves[0].status).toBe('EN_ATTENTE');
      expect(leaves[0].statusLabel).toBe('En attente');
      expect(leaves[0].requesterName).toBe('Ali Ben');
    });
    httpMock.expectOne(apiBase).flush([mockLeaveApi]);
  });

  it('getLeaves() should return empty array on error', () => {
    service.getLeaves().subscribe(leaves => expect(leaves).toEqual([]));
    httpMock.expectOne(apiBase).flush('error', { status: 500, statusText: 'Error' });
  });

  it('getLeaves() should map id from number to string', () => {
    service.getLeaves().subscribe(leaves => {
      expect(typeof leaves[0].id).toBe('string');
    });
    httpMock.expectOne(apiBase).flush([mockLeaveApi]);
  });

  // ─── getApprovedLeaves() ──────────────────────────────────────
  it('getApprovedLeaves() should return only APPROUVE leaves', () => {
    const approvedLeave = { ...mockLeaveApi, id: 2, statut: 'APPROUVE' as const };
    service.getApprovedLeaves().subscribe(leaves => {
      expect(leaves.length).toBe(1);
      expect(leaves[0].status).toBe('APPROUVE');
    });
    httpMock.expectOne(apiBase).flush([mockLeaveApi, approvedLeave]);
  });

  // ─── createLeave() ────────────────────────────────────────────
  it('createLeave() should call POST /api/conges with mapped payload', () => {
    const payload = {
      type: 'MALADIE' as const,
      startDate: new Date('2025-08-01'),
      endDate: new Date('2025-08-05'),
      reason: 'Grippe'
    };

    service.createLeave(payload).subscribe(leave => {
      expect(leave.id).toBe('1');
    });

    const req = httpMock.expectOne(apiBase);
    expect(req.request.method).toBe('POST');
    expect(req.request.body.type).toBe('MALADIE');
    expect(req.request.body.motif).toBe('Grippe');
    req.flush(mockLeaveApi);
  });

  // ─── updateLeave() ────────────────────────────────────────────
  it('updateLeave() should call PUT /api/conges/:id', () => {
    service.updateLeave('1', { reason: 'Updated reason' }).subscribe();
    const req = httpMock.expectOne(`${apiBase}/1`);
    expect(req.request.method).toBe('PUT');
    req.flush(mockLeaveApi);
  });

  // ─── approveLeave() ───────────────────────────────────────────
  it('approveLeave() should call PUT /api/conges/:id/approve', () => {
    service.approveLeave('1', { commentaire: 'Approuvé' }).subscribe(leave => {
      expect(leave.id).toBe('1');
    });
    const req = httpMock.expectOne(`${apiBase}/1/approve`);
    expect(req.request.method).toBe('PUT');
    expect(req.request.body).toEqual({ commentaire: 'Approuvé' });
    req.flush(mockLeaveApi);
  });

  it('approveLeave() should work without payload', () => {
    service.approveLeave('1').subscribe();
    httpMock.expectOne(`${apiBase}/1/approve`).flush(mockLeaveApi);
  });

  // ─── rejectLeave() ────────────────────────────────────────────
  it('rejectLeave() should call PUT /api/conges/:id/reject', () => {
    service.rejectLeave('1', { commentaire: 'Refusé' }).subscribe();
    const req = httpMock.expectOne(`${apiBase}/1/reject`);
    expect(req.request.method).toBe('PUT');
    expect(req.request.body).toEqual({ commentaire: 'Refusé' });
    req.flush(mockLeaveApi);
  });

  // ─── deleteLeave() ────────────────────────────────────────────
  it('deleteLeave() should call DELETE /api/conges/:id', () => {
    service.deleteLeave('1').subscribe();
    const req = httpMock.expectOne(`${apiBase}/1`);
    expect(req.request.method).toBe('DELETE');
    req.flush({ message: 'Deleted' });
  });

  // ─── type/status labels ───────────────────────────────────────
  it('should map MALADIE typeLabel to "Maladie"', () => {
    service.getLeaves().subscribe(leaves => expect(leaves[0].typeLabel).toBe('Vacances'));
    httpMock.expectOne(apiBase).flush([mockLeaveApi]);
  });

  it('should map APPROUVE statusLabel to "Approuvé"', () => {
    service.getLeaves().subscribe(leaves => expect(leaves[0].statusLabel).toBe('Approuvé'));
    httpMock.expectOne(apiBase).flush([{ ...mockLeaveApi, statut: 'APPROUVE' }]);
  });

  it('should map REJETE statusLabel to "Refusé"', () => {
    service.getLeaves().subscribe(leaves => expect(leaves[0].statusLabel).toBe('Refusé'));
    httpMock.expectOne(apiBase).flush([{ ...mockLeaveApi, statut: 'REJETE' }]);
  });

  it('should compute duration when periode is null', () => {
    const leave = { ...mockLeaveApi, periode: null, dateDebut: '2025-07-01', dateFin: '2025-07-05' };
    service.getLeaves().subscribe(leaves => expect(leaves[0].duration).toBeGreaterThan(0));
    httpMock.expectOne(apiBase).flush([leave]);
  });
});
