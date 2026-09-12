import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { UserService, UserPayload, UserListItem } from './user.service';

describe('UserService', () => {
  let service: UserService;
  let httpMock: HttpTestingController;
  const apiBase = 'http://localhost:8080/api/users';

  const mockUser: UserListItem = {
    id: 1,
    prenom: 'Ali',
    nom: 'Ben Salah',
    email: 'ali@test.com',
    role: 'CHAUFFEUR',
    entrepriseId: 10,
    managerId: 3,
    secteurId: 2,
    secteurNom: 'Secteur Nord',
    statutConducteur: 'LIBRE'
  };

  const mockPayload: UserPayload = {
    prenom: 'Ali',
    nom: 'Ben Salah',
    email: 'ali@test.com',
    telephone: '+21612345678',
    role: 'CHAUFFEUR',
    estActif: true
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        UserService
      ]
    });
    service = TestBed.inject(UserService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  // ─── list() ───────────────────────────────────────────────────
  it('list() should call GET /api/users', () => {
    service.list().subscribe(users => {
      expect(users.length).toBe(1);
      expect(users[0].id).toBe(1);
      expect(users[0].prenom).toBe('Ali');
      expect(users[0].role).toBe('CHAUFFEUR');
    });
    const req = httpMock.expectOne(apiBase);
    expect(req.request.method).toBe('GET');
    req.flush([mockUser]);
  });

  it('list() should return empty array on error', () => {
    service.list().subscribe(users => expect(users).toEqual([]));
    httpMock.expectOne(apiBase).flush('error', { status: 500, statusText: 'Error' });
  });

  // ─── create() ─────────────────────────────────────────────────
  it('create() should call POST /api/users/create', () => {
    service.create(mockPayload).subscribe(res => {
      expect(res).toBeTruthy();
    });
    const req = httpMock.expectOne(`${apiBase}/create`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(mockPayload);
    req.flush({ ...mockPayload, id: 1 });
  });

  it('create() should send correct CHAUFFEUR payload', () => {
    const chauffeurPayload: UserPayload = {
      prenom: 'Sara', nom: 'Kamel', email: 'sara@test.com', role: 'CHAUFFEUR'
    };
    service.create(chauffeurPayload).subscribe();
    const req = httpMock.expectOne(`${apiBase}/create`);
    expect(req.request.body.role).toBe('CHAUFFEUR');
    req.flush({ id: 2, ...chauffeurPayload });
  });

  it('create() should send correct MANAGER payload', () => {
    const managerPayload: UserPayload = {
      prenom: 'Jean', nom: 'Dupont', email: 'jean@test.com', role: 'MANAGER'
    };
    service.create(managerPayload).subscribe();
    const req = httpMock.expectOne(`${apiBase}/create`);
    expect(req.request.body.role).toBe('MANAGER');
    req.flush({ id: 3, ...managerPayload });
  });

  // ─── update() ─────────────────────────────────────────────────
  it('update() should call PUT /api/users/:id', () => {
    const updates = { prenom: 'Ali Updated', estActif: false };
    service.update(1, updates).subscribe();
    const req = httpMock.expectOne(`${apiBase}/1`);
    expect(req.request.method).toBe('PUT');
    expect(req.request.body).toEqual(updates);
    req.flush({ ...mockUser, id: 1, ...updates });
  });

  it('update() should pass partial payload', () => {
    service.update(1, { estActif: false }).subscribe();
    const req = httpMock.expectOne(`${apiBase}/1`);
    expect(req.request.body).toEqual({ estActif: false });
    req.flush({});
  });

  // ─── delete() ─────────────────────────────────────────────────
  it('delete() should call DELETE /api/users/:id', () => {
    service.delete(1).subscribe(res => {
      expect(res.message).toBe('User deleted');
    });
    const req = httpMock.expectOne(`${apiBase}/1`);
    expect(req.request.method).toBe('DELETE');
    req.flush({ message: 'User deleted' });
  });

  it('delete() should call correct URL for different ids', () => {
    service.delete(42).subscribe();
    httpMock.expectOne(`${apiBase}/42`).flush({ message: 'OK' });
  });
});
