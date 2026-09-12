import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { FleetService } from './fleet.service';
import { AuthService } from '../auth.service';

describe('FleetService', () => {
  let service: FleetService;
  let httpMock: HttpTestingController;
  let authServiceMock: jasmine.SpyObj<AuthService>;

  const mockVehicleApi = {
    id: 1,
    matricule: 'TN-1234-AB',
    marque: 'Mercedes',
    modele: 'Actros',
    statut: 'EN_SERVICE',
    kilometrage: 45000,
    capacite: 20000,
    entrepriseId: 10,
    chauffeurId: 5,
    chauffeurNom: 'Ali Ben Salah'
  };

  const mockTrajetApi = {
    id: 1,
    pointDepart: 'Tunis',
    destination: 'Sousse',
    dateDepart: '2025-06-01T08:00:00',
    dateArrivee: '2025-06-01T12:00:00',
    statut: 'TERMINE',
    chauffeur: { id: 5, prenom: 'Ali', nom: 'Ben Salah', email: 'ali@test.com' },
    vehicule: { id: 1, matricule: 'TN-1234-AB' },
    managerId: 3,
    distanceKm: 140,
    dureeEstimeeMinutes: 200
  };

  beforeEach(() => {
    authServiceMock = jasmine.createSpyObj('AuthService', ['getUser']);
    authServiceMock.getUser.and.returnValue({ id: '3', role: 'MANAGER' });

    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        FleetService,
        { provide: AuthService, useValue: authServiceMock }
      ]
    });

    service = TestBed.inject(FleetService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  // ─── getVehicles() ────────────────────────────────────────────
  it('getVehicles() should call GET /api/vehicules', () => {
    service.getVehicles().subscribe(vehicles => {
      expect(vehicles.length).toBe(1);
      expect(vehicles[0].plate).toBe('TN-1234-AB');
      expect(vehicles[0].model).toBe('Mercedes Actros');
      expect(vehicles[0].status).toBe('En Service');
      expect(vehicles[0].id).toBe('1');
    });
    httpMock.expectOne('http://localhost:8080/api/vehicules').flush([mockVehicleApi]);
  });

  it('getVehicles() should return fallback on HTTP error', () => {
    service.getVehicles().subscribe(vehicles => {
      expect(Array.isArray(vehicles)).toBeTrue();
    });
    httpMock.expectOne('http://localhost:8080/api/vehicules')
      .flush('error', { status: 500, statusText: 'Error' });
  });

  it('getVehicles() should map EN_SERVICE → "En Service"', () => {
    service.getVehicles().subscribe(v => expect(v[0].status).toBe('En Service'));
    httpMock.expectOne('http://localhost:8080/api/vehicules')
      .flush([{ ...mockVehicleApi, statut: 'EN_SERVICE' }]);
  });

  it('getVehicles() should map EN_MAINTENANCE → "Maintenance"', () => {
    service.getVehicles().subscribe(v => expect(v[0].status).toBe('Maintenance'));
    httpMock.expectOne('http://localhost:8080/api/vehicules')
      .flush([{ ...mockVehicleApi, statut: 'EN_MAINTENANCE' }]);
  });

  it('getVehicles() should map HORS_SERVICE → "Hors Service"', () => {
    service.getVehicles().subscribe(v => expect(v[0].status).toBe('Hors Service'));
    httpMock.expectOne('http://localhost:8080/api/vehicules')
      .flush([{ ...mockVehicleApi, statut: 'HORS_SERVICE' }]);
  });

  it('getVehicles() should map driver info correctly', () => {
    service.getVehicles().subscribe(v => {
      expect(v[0].driverId).toBe('5');
      expect(v[0].driverName).toBe('Ali Ben Salah');
    });
    httpMock.expectOne('http://localhost:8080/api/vehicules').flush([mockVehicleApi]);
  });

  // ─── getVehicle() ─────────────────────────────────────────────
  it('getVehicle() should call GET /api/vehicules/:id', () => {
    service.getVehicle('1').subscribe(v => {
      expect(v.id).toBe('1');
      expect(v.plate).toBe('TN-1234-AB');
    });
    httpMock.expectOne('http://localhost:8080/api/vehicules/1').flush(mockVehicleApi);
  });

  // ─── createVehicle() ──────────────────────────────────────────
  it('createVehicle() should call POST /api/vehicules', () => {
    const payload = {
      matricule: 'TN-5678-CD', marque: 'Volvo', modele: 'FH16',
      capacite: 25000, statut: 'EN_SERVICE' as any, entrepriseId: 10
    };
    service.createVehicle(payload).subscribe(v => {
      expect(v.plate).toBe('TN-1234-AB');
    });
    const req = httpMock.expectOne('http://localhost:8080/api/vehicules');
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(payload);
    req.flush(mockVehicleApi);
  });

  // ─── updateVehicle() ──────────────────────────────────────────
  it('updateVehicle() should call PUT /api/vehicules/:id', () => {
    service.updateVehicle('1', { matricule: 'TN-NEW' }).subscribe();
    const req = httpMock.expectOne('http://localhost:8080/api/vehicules/1');
    expect(req.request.method).toBe('PUT');
    req.flush(mockVehicleApi);
  });

  // ─── updateVehicleStatus() ────────────────────────────────────
  it('updateVehicleStatus() should call PUT /api/vehicules/:id/status', () => {
    service.updateVehicleStatus('1', 'EN_MAINTENANCE' as any).subscribe();
    const req = httpMock.expectOne('http://localhost:8080/api/vehicules/1/status');
    expect(req.request.method).toBe('PUT');
    expect(req.request.body).toEqual({ statut: 'EN_MAINTENANCE' });
    req.flush(mockVehicleApi);
  });

  // ─── deleteVehicle() ──────────────────────────────────────────
  it('deleteVehicle() should call DELETE /api/vehicules/:id', () => {
    service.deleteVehicle('1').subscribe();
    const req = httpMock.expectOne('http://localhost:8080/api/vehicules/1');
    expect(req.request.method).toBe('DELETE');
    req.flush(null);
  });

  // ─── assignDriver() ───────────────────────────────────────────
  it('assignDriver() should call PUT /api/vehicules/:id/driver', () => {
    service.assignDriver('1', 5).subscribe();
    const req = httpMock.expectOne('http://localhost:8080/api/vehicules/1/driver');
    expect(req.request.method).toBe('PUT');
    expect(req.request.body).toEqual({ chauffeurId: 5 });
    req.flush(mockVehicleApi);
  });

  // ─── clearDriver() ────────────────────────────────────────────
  it('clearDriver() should call PUT /api/vehicules/:id/driver/clear', () => {
    service.clearDriver('1').subscribe();
    const req = httpMock.expectOne('http://localhost:8080/api/vehicules/1/driver/clear');
    expect(req.request.method).toBe('PUT');
    req.flush(mockVehicleApi);
  });

  // ─── getAvailableDrivers() ────────────────────────────────────
  it('getAvailableDrivers() should call GET /api/vehicules/:id/available-drivers', () => {
    service.getAvailableDrivers('1').subscribe(drivers => {
      expect(drivers.length).toBe(1);
      expect(drivers[0].prenom).toBe('Ali');
      expect(drivers[0].id).toBe('5');
    });
    httpMock.expectOne('http://localhost:8080/api/vehicules/1/available-drivers')
      .flush([{ id: 5, prenom: 'Ali', nom: 'Jebali', email: 'ali@test.com' }]);
  });

  it('getAvailableDrivers() should return empty array on error', () => {
    service.getAvailableDrivers('1').subscribe(d => expect(d).toEqual([]));
    httpMock.expectOne('http://localhost:8080/api/vehicules/1/available-drivers')
      .flush('error', { status: 500, statusText: 'Error' });
  });

  // ─── getTrips() ───────────────────────────────────────────────
  it('getTrips() should call GET /api/trajets?page=0&size=200', () => {
    service.getTrips().subscribe(trips => {
      expect(trips.length).toBe(1);
      expect(trips[0].from).toBe('Tunis');
      expect(trips[0].to).toBe('Sousse');
      expect(trips[0].driver).toBe('Ali Ben Salah');
      expect(trips[0].status).toBe('Terminé');
    });
    httpMock.expectOne('http://localhost:8080/api/trajets?page=0&size=200').flush([mockTrajetApi]);
  });

  it('getTrips() should handle paginated response with content field', () => {
    service.getTrips().subscribe(trips => {
      expect(trips.length).toBe(1);
      expect(trips[0].from).toBe('Tunis');
    });
    httpMock.expectOne('http://localhost:8080/api/trajets?page=0&size=200')
      .flush({ content: [mockTrajetApi], totalElements: 1 });
  });

  it('getTrips() should map trip status TERMINE → "Terminé"', () => {
    service.getTrips().subscribe(trips => expect(trips[0].status).toBe('Terminé'));
    httpMock.expectOne('http://localhost:8080/api/trajets?page=0&size=200')
      .flush([{ ...mockTrajetApi, statut: 'TERMINE' }]);
  });

  it('getTrips() should map trip status EN_COURS → "En Cours"', () => {
    service.getTrips().subscribe(trips => expect(trips[0].status).toBe('En Cours'));
    httpMock.expectOne('http://localhost:8080/api/trajets?page=0&size=200')
      .flush([{ ...mockTrajetApi, statut: 'EN_COURS' }]);
  });

  it('getTrips() should map trip status PLANIFIE → "Planifié"', () => {
    service.getTrips().subscribe(trips => expect(trips[0].status).toBe('Planifié'));
    httpMock.expectOne('http://localhost:8080/api/trajets?page=0&size=200')
      .flush([{ ...mockTrajetApi, statut: 'PLANIFIE' }]);
  });

  // ─── deleteTrip() ─────────────────────────────────────────────
  it('deleteTrip() should call DELETE /api/trajets/:id', () => {
    service.deleteTrip('1').subscribe();
    const req = httpMock.expectOne('http://localhost:8080/api/trajets/1');
    expect(req.request.method).toBe('DELETE');
    req.flush(null);
  });

  // ─── addTrip() ────────────────────────────────────────────────
  it('addTrip() should call POST /api/trajets', () => {
    const trip = {
      id: 't1', from: 'Tunis', to: 'Sousse',
      date: '2025-06-01T08:00:00', driver: 'Ali',
      driverId: '5', managerId: '3', vehicle: '1', status: 'Actif'
    };
    service.addTrip(trip).subscribe(t => {
      expect(t.from).toBe('Tunis');
    });
    const req = httpMock.expectOne('http://localhost:8080/api/trajets');
    expect(req.request.method).toBe('POST');
    req.flush(mockTrajetApi);
  });

  // ─── getTripsCarte() ──────────────────────────────────────────
  it('getTripsCarte() should call GET /api/trajets/carte', () => {
    service.getTripsCarte().subscribe(items => {
      expect(items.length).toBe(1);
      expect(items[0].pointDepart).toBe('Tunis');
    });
    httpMock.expectOne('http://localhost:8080/api/trajets/carte').flush([{
      id: 1,
      pointDepart: 'Tunis',
      destination: 'Sousse',
      latitudeDepart: 36.8,
      longitudeDepart: 10.18,
      statut: 'PLANIFIE'
    }]);
  });

  it('getTripsCarte() should return empty array on error', () => {
    service.getTripsCarte().subscribe(items => expect(items).toEqual([]));
    httpMock.expectOne('http://localhost:8080/api/trajets/carte')
      .flush('error', { status: 500, statusText: 'Error' });
  });

  // ─── combineDateAndTime() ─────────────────────────────────────
  it('combineDateAndTime() should return null when date is null', () => {
    expect(service.combineDateAndTime(null, '10:30')).toBeNull();
  });

  it('combineDateAndTime() should combine date and time', () => {
    const date = new Date(2025, 5, 1); // 1 juin 2025
    const result = service.combineDateAndTime(date, '08:30');
    expect(result).toContain('2025-06-01');
    expect(result).toContain('08:30');
  });

  it('combineDateAndTime() should use 00:00 when no time given', () => {
    const date = new Date(2025, 5, 1);
    const result = service.combineDateAndTime(date, null);
    expect(result).toContain('00:00');
  });

  // ─── getTrajetsCountBySecteur() ───────────────────────────────
  it('getTrajetsCountBySecteur() should call GET /api/trajets/secteur/:id/count', () => {
    service.getTrajetsCountBySecteur(1).subscribe(count => expect(count).toBe(5));
    httpMock.expectOne('http://localhost:8080/api/trajets/secteur/1/count').flush(5);
  });

  it('getTrajetsCountBySecteur() should return 0 on error', () => {
    service.getTrajetsCountBySecteur(99).subscribe(count => expect(count).toBe(0));
    httpMock.expectOne('http://localhost:8080/api/trajets/secteur/99/count')
      .flush('error', { status: 404, statusText: 'Not Found' });
  });

  // ═══ Couverture étendue ══════════════════════════════════════

  const primeVehiclesCache = (vehicles: any[]) => {
    service.getVehicles().subscribe();
    httpMock.expectOne('http://localhost:8080/api/vehicules').flush(vehicles);
  };

  const baseVehicleApi = (over: Record<string, any> = {}) => ({
    id: 1, matricule: 'TN-1234-AB', marque: 'Mercedes', modele: 'Actros',
    statut: 'EN_SERVICE', kilometrage: 45000, capacite: 20000,
    entrepriseId: 10, chauffeurId: 5, chauffeurNom: 'Ali Ben Salah', ...over
  });

  it('getVehicles() en erreur retombe sur le cache filtré par entreprise du MANAGER', () => {
    authServiceMock.getUser.and.returnValue({ id: '3', role: 'MANAGER', entrepriseId: 10 });
    primeVehiclesCache([baseVehicleApi(), baseVehicleApi({ id: 2, entrepriseId: 20 })]);

    let out: any[] | undefined;
    service.getVehicles().subscribe(v => (out = v));
    httpMock.expectOne('http://localhost:8080/api/vehicules')
      .flush('err', { status: 500, statusText: 'Error' });

    expect(out!.length).toBe(1);
    expect(out![0].companyId).toBe('10');
  });

  it('MANAGER sans correspondance d\u2019entreprise garde tous les véhicules du cache', () => {
    authServiceMock.getUser.and.returnValue({ id: '3', role: 'MANAGER' });
    primeVehiclesCache([baseVehicleApi(), baseVehicleApi({ id: 2, entrepriseId: 20 })]);

    let out: any[] | undefined;
    service.getVehicles().subscribe(v => (out = v));
    httpMock.expectOne('http://localhost:8080/api/vehicules')
      .flush('err', { status: 503, statusText: 'Error' });

    expect(out!.length).toBe(2);
  });

  it('DRIVER retrouve son véhicule par driverId puis par nom complet', () => {
    authServiceMock.getUser.and.returnValue({ id: '5', role: 'DRIVER', firstName: 'Ali', lastName: 'Ben Salah' });
    primeVehiclesCache([
      baseVehicleApi({ id: 1 }),
      baseVehicleApi({ id: 2, chauffeurId: 99, chauffeurNom: 'Autre Chauffeur' })
    ]);

    let byId: any[] | undefined;
    service.getVehicles().subscribe(v => (byId = v));
    httpMock.expectOne('http://localhost:8080/api/vehicules')
      .flush('err', { status: 500, statusText: 'Error' });
    expect(byId!.length).toBe(1);
    expect(byId![0].id).toBe('1');

    authServiceMock.getUser.and.returnValue({ id: '77', role: 'DRIVER', firstName: 'Ali', lastName: 'Ben Salah' });
    let byName: any[] | undefined;
    service.getVehicles().subscribe(v => (byName = v));
    httpMock.expectOne('http://localhost:8080/api/vehicules')
      .flush('err', { status: 500, statusText: 'Error' });
    expect(byName!.length).toBe(1);
    expect(byName![0].driverName).toBe('Ali Ben Salah');
  });

  it('DRIVER sans correspondance et utilisateur absent renvoient un tableau vide', () => {
    authServiceMock.getUser.and.returnValue({ id: '999', role: 'DRIVER', firstName: 'X', lastName: 'Y' });
    primeVehiclesCache([baseVehicleApi()]);

    let none: any[] | undefined;
    service.getVehicles().subscribe(v => (none = v));
    httpMock.expectOne('http://localhost:8080/api/vehicules').flush('err', { status: 500, statusText: 'E' });
    expect(none).toEqual([]);

    authServiceMock.getUser.and.returnValue(null);
    let anon: any[] | undefined;
    service.getVehicles().subscribe(v => (anon = v));
    httpMock.expectOne('http://localhost:8080/api/vehicules').flush('err', { status: 500, statusText: 'E' });
    expect(anon).toEqual([]);
  });

  it('SUPERADMIN voit tout le cache même en cas d\u2019erreur réseau', () => {
    authServiceMock.getUser.and.returnValue({ id: '1', role: 'SUPERADMIN' });
    primeVehiclesCache([baseVehicleApi(), baseVehicleApi({ id: 2 })]);

    let out: any[] | undefined;
    service.getVehicles().subscribe(v => (out = v));
    httpMock.expectOne('http://localhost:8080/api/vehicules').flush('err', { status: 500, statusText: 'E' });
    expect(out!.length).toBe(2);
  });

  it('mapVehicle gère les objets imbriqués entreprise/chauffeur et les valeurs manquantes', () => {
    let v: any;
    service.getVehicles().subscribe(list => (v = list[0]));
    httpMock.expectOne('http://localhost:8080/api/vehicules').flush([{
      id: 42,
      marque: 'Renault',
      modele: 'T520',
      statut: 'STATUT_EXOTIQUE',
      capacite: 300,
      consommationL100Km: 27.5,
      entreprise: { id: 7, nomEntreprise: 'TransLoc', managerOwnerId: 3 },
      chauffeurActuel: { id: 9, prenom: 'Sami', nom: 'Trabelsi ' }
    }]);

    expect(v.id).toBe('42');
    expect(v.model).toBe('Renault T520');
    expect(v.status).toBe('STATUT_EXOTIQUE');
    expect(v.nextCheck).toBe('N/A');
    expect(v.companyId).toBe('7');
    expect(v.companyName).toBe('TransLoc');
    expect(v.managerId).toBe('3');
    expect(v.driverId).toBe('9');
    expect(v.driverName).toBe('Sami Trabelsi');
    expect(v.fuelConsumption).toBe(27.5);
    expect(v.brand).toBe('Renault');
    expect(v.capacity).toBe(300);
  });

  it('mapVehicle lit les champs alternatifs (plate, fuelConsumption, chauffeurActuelId)', () => {
    let list: any[] = [];
    service.getVehicles().subscribe(v => (list = v));
    httpMock.expectOne('http://localhost:8080/api/vehicules').flush([
      {
        id: 43, plate: 'ZZ-999-ZZ', modele: 'Solo', statut: '',
        kilometrage: 1200, fuelConsumption: 18, chauffeurActuelId: 4
      },
      { id: 44, matricule: 'YY-8-YY', marque: 'Iveco', modele: 'S-Way', kilometrage: undefined }
    ]);

    expect(list[0].plate).toBe('ZZ-999-ZZ');
    expect(list[0].model).toBe('Solo');
    expect(list[0].status).toBe('');
    expect(list[0].nextCheck).toBe('1200 km');
    expect(list[0].fuelConsumption).toBe(18);
    expect(list[0].driverId).toBe('4');
    expect(list[0].mileage).toBe(1200);

    expect(list[1].status).toBe('Inconnu');
    expect(list[1].nextCheck).toBe('N/A');
  });

  const flushTripsOnce = (trajets: any[]) => {
    let out: any[] | undefined;
    service.getTrips().subscribe(t => (out = t));
    httpMock.expectOne('http://localhost:8080/api/trajets?page=0&size=200').flush(trajets);
    return out!;
  };

  it('getTripStats répartit les trajets sur les 7 jours', () => {
    let stats: any;
    service.getTripStats().subscribe(s => (stats = s));
    const nine = Array.from({ length: 9 }, (_, i) => ({ id: i }));
    httpMock.expectOne('http://localhost:8080/api/trajets?page=0&size=200').flush(nine);

    expect(stats['Lundi']).toBe(2);
    expect(stats['Mardi']).toBe(2);
    expect(stats['Mercredi']).toBe(1);
    expect(stats['Jeudi']).toBe(1);
    expect(stats['Vendredi']).toBe(1);
    expect(stats['Samedi']).toBe(1);
    expect(stats['Dimanche']).toBe(1);
  });

  it('getDriversList déduplique les chauffeurs depuis les trajets chargés', () => {
    flushTripsOnce([
      { id: 1, chauffeur: { id: 5, prenom: 'Ali', nom: 'B' } },
      { id: 2, chauffeur: { id: 5, prenom: 'Ali', nom: 'B' } },
      { id: 3, chauffeurNom: 'Foulen J' }
    ]);

    let drivers: any;
    service.getDriversList().subscribe(d => (drivers = d));

    expect(drivers.length).toBe(2);
    expect(drivers[0]).toEqual({ id: '5', name: 'Ali B' });
    expect(drivers[1]).toEqual({ id: '', name: 'Foulen J' });
  });

  it('getVehiclesList retourne id + plaque', () => {
    let list: any;
    service.getVehiclesList().subscribe(l => (list = l));
    httpMock.expectOne('http://localhost:8080/api/vehicules').flush([{ id: 8, matricule: 'AA-1-AA' }]);

    expect(list).toEqual([{ id: '8', plate: 'AA-1-AA' }]);
  });

  it('getVehicleDetails gère id vide, succès et erreur', () => {
    let empty: any;
    service.getVehicleDetails('').subscribe(v => (empty = v));
    expect(empty).toBeNull();

    let ok: any;
    service.getVehicleDetails('1').subscribe(v => (ok = v));
    httpMock.expectOne('http://localhost:8080/api/vehicules/1').flush(baseVehicleApi());
    expect(ok.plate).toBe('TN-1234-AB');

    let failed: any;
    service.getVehicleDetails('2').subscribe(v => (failed = v));
    httpMock.expectOne('http://localhost:8080/api/vehicules/2')
      .flush('err', { status: 500, statusText: 'E' });
    expect(failed).toBeNull();
  });

  it('getTripsCarte mappe l\u2019ensemble des champs enrichis', () => {
    let item: any;
    service.getTripsCarte().subscribe(items => (item = items[0]));
    httpMock.expectOne('http://localhost:8080/api/trajets/carte').flush([{
      id: 77, pointDepart: 'Tunis', destination: 'Gabès',
      latitudeDepart: 36.1, longitudeDepart: 10.2,
      latitudeArrivee: 33.8, longitudeArrivee: 10.1,
      distanceKm: 380, dureeEstimeeMinutes: 260,
      geometrieItineraire: '{"coordinates":[]}', statut: 'actif',
      vehiculeId: 55, vehiculeMatricule: 'BB-2-BB', vehiculeCouleur: 'rouge',
      vehiculeLatitude: 36.5, vehiculeLongitude: 10.3, vehiculeVitesse: 90,
      vehiculeNiveauCarburant: 65, chauffeurId: 12, chauffeurTelephone: '+216',
      chauffeurNom: 'Med A', chauffeurImage: 'img.png', chauffeurRole: 'DRIVER',
      chauffeurSecteur: 'Nord', routePreference: 'ECO',
      vehiculeChargeKg: 8000, vehiculeKilometrage: 123456, ecoScore: 78
    }]);

    expect(item.statut).toBe('Actif');
    expect(item.vehiculeId).toBe('55');
    expect(item.chauffeurId).toBe('12');
    expect(item.chauffeurTelephone).toBe('+216');
    expect(item.chauffeurImage).toBe('img.png');
    expect(item.chauffeurRole).toBe('DRIVER');
    expect(item.chauffeurSecteur).toBe('Nord');
    expect(item.routePreference).toBe('ECO');
    expect(item.vehiculeChargeKg).toBe(8000);
    expect(item.vehiculeKilometrage).toBe(123456);
    expect(item.ecoScore).toBe(78);
    expect(item.geometrieItineraire).toContain('coordinates');
  });

  it('mapStatutTrajet couvre COMPLETE, ANNULE, minuscule, inconnu et absent', () => {
    const statuses: string[] = [];
    service.getTrips().subscribe(t => statuses.push(...t.map(x => x.status)));
    httpMock.expectOne('http://localhost:8080/api/trajets?page=0&size=200').flush([
      { id: 1, statut: 'COMPLETE' },
      { id: 2, statut: 'ANNULE' },
      { id: 3, statut: 'en_cours' },
      { id: 4, statut: 'INATTENDU' },
      { id: 5 }
    ]);

    expect(statuses).toEqual(['Terminé', 'Annulé', 'En Cours', 'INATTENDU', 'Inconnu']);
  });

  it('updateTrip fusionne les changements dans le cache puis PUT le payload', () => {
    flushTripsOnce([{
      id: 11, pointDepart: 'Tunis', destination: 'Sousse',
      dateDepart: '2025-06-01T08:00:00', statut: 'EN_COURS',
      chauffeurId: 5, vehicule: { id: 3 }, managerId: 2
    }]);

    let updated: any;
    service.updateTrip('11', { to: 'Bizerte' }).subscribe(t => (updated = t));

    const req = httpMock.expectOne('http://localhost:8080/api/trajets/11');
    expect(req.request.method).toBe('PUT');
    expect(req.request.body.destination).toBe('Bizerte');
    expect(req.request.body.statut).toBe('EN_COURS');
    expect(req.request.body.vehiculeId).toBe(3);

    req.flush({
      id: 11, pointDepart: 'Tunis', destination: 'Bizerte',
      dateDepart: '2025-06-01T08:00:00', statut: 'EN_COURS'
    });
    expect(updated.to).toBe('Bizerte');
    expect(updated.status).toBe('En Cours');
  });

  it('updateTrip sur trajet inconnu construit le payload depuis les updates et retombe dessus en cas d\u2019erreur', () => {
    const updates = { from: 'A', to: 'B', date: '', status: '', vehicle: '' } as any;
    let out: any;
    service.updateTrip('zzz', updates).subscribe(t => (out = t));

    const req = httpMock.expectOne('http://localhost:8080/api/trajets/zzz');
    expect(req.request.body.pointDepart).toBe('A');
    req.flush('err', { status: 500, statusText: 'E' });

    expect(out).toBeUndefined();
  });

  it('deleteTrip retire du cache et tolère l\u2019erreur HTTP', () => {
    flushTripsOnce([{ id: 21, chauffeur: { id: 1, prenom: 'A', nom: 'B' } }]);

    let done: boolean | undefined;
    service.deleteTrip('21').subscribe(() => (done = true));
    httpMock.expectOne('http://localhost:8080/api/trajets/21')
      .flush('err', { status: 500, statusText: 'E' });

    expect(done).toBeTrue();

    let drivers: any;
    service.getDriversList().subscribe(d => (drivers = d));
    expect(drivers).toEqual([]);
  });

  it('addTask impossible : addTrip retombe sur la copie locale en cas d\u2019erreur', () => {
    const local = {
      id: 't9', from: 'Kairouan', to: 'Monastir', date: '2025-06-02T09:00',
      driver: 'Z', driverId: '5', managerId: '1', vehicle: '4', status: 'Actif'
    };
    let out: any;
    service.addTrip(local).subscribe(t => (out = t));

    httpMock.expectOne('http://localhost:8080/api/trajets')
      .flush('err', { status: 500, statusText: 'E' });

    expect(out).toBe(local);
  });

  it('toTrajetPayload convertit un vehicle numérique en id', () => {
    const mkTrip = (over: Record<string, unknown>): any => ({
      id: 'x', from: 'a', to: 'b', date: '2025-06-01T08:00',
      driver: 'd', driverId: '5', managerId: '1', vehicle: '', status: 'En Cours', ...over
    });

    service.addTrip(mkTrip({ vehicle: '17' })).subscribe();
    const req = httpMock.expectOne('http://localhost:8080/api/trajets');
    expect(req.request.body.vehiculeId).toBe(17);
    expect(req.request.body.chauffeurId).toBe(5);
    expect(req.request.body.managerId).toBe(1);
    req.flush({});
  });

  it('resolveVehicleId utilise le cache des plaques sinon null', () => {
    primeVehiclesCache([{ id: 31, matricule: 'PL-1', marque: 'M', modele: 'X', statut: 'EN_SERVICE' }]);

    const mkTrip = (over: Record<string, unknown>): any => ({
      id: 'x', from: 'a', to: 'b', date: '2025-06-01T08:00',
      driver: 'd', driverId: '5', managerId: '1', vehicle: '', status: 'En Cours', ...over
    });

    service.addTrip(mkTrip({ vehicle: 'PL-1' })).subscribe();
    const reqPlate = httpMock.expectOne('http://localhost:8080/api/trajets');
    expect(reqPlate.request.body.vehiculeId).toBe(31);
    reqPlate.flush({});

    service.addTrip(mkTrip({ vehicle: 'INCONNU-XX' })).subscribe();
    const reqMiss = httpMock.expectOne('http://localhost:8080/api/trajets');
    expect(reqMiss.request.body.vehiculeId).toBeNull();
    reqMiss.flush({});

    service.addTrip(mkTrip({ vehicle: '' })).subscribe();
    const reqEmpty = httpMock.expectOne('http://localhost:8080/api/trajets');
    expect(reqEmpty.request.body.vehiculeId).toBeNull();
    reqEmpty.flush({});
  });

  it('parseDisplayDate gère ISO, format français accentué, ISO-like et invalide', () => {
    const mkTrip = (date: string) => ({
      id: 'x', from: 'a', to: 'b', date,
      driver: 'd', driverId: '5', managerId: '1', vehicle: '1', status: 'En Cours'
    });

    service.addTrip(mkTrip('2025-06-01T08:30')).subscribe();
    const isoReq = httpMock.expectOne('http://localhost:8080/api/trajets');
    expect(isoReq.request.body.dateDepart).toBe('2025-06-01T08:30:00');
    isoReq.flush({});

    service.addTrip(mkTrip('15 août 2025')).subscribe();
    const frReq = httpMock.expectOne('http://localhost:8080/api/trajets');
    expect(frReq.request.body.dateDepart).toBe('2025-08-15T00:00:00.000Z');
    frReq.flush({});

    service.addTrip(mkTrip('5 févr. 2026')).subscribe();
    const febReq = httpMock.expectOne('http://localhost:8080/api/trajets');
    expect(febReq.request.body.dateDepart).toBe('2026-02-05T00:00:00.000Z');
    febReq.flush({});

    service.addTrip(mkTrip('2025-06-01 09:45:00')).subscribe();
    const isoLikeReq = httpMock.expectOne('http://localhost:8080/api/trajets');
    expect(isoLikeReq.request.body.dateDepart).toContain('2025-06-01T09:45:00');
    isoLikeReq.flush({});

    service.addTrip(mkTrip('pas une date')).subscribe();
    const badReq = httpMock.expectOne('http://localhost:8080/api/trajets');
    expect(badReq.request.body.dateDepart).toBeNull();
    badReq.flush({});
  });

  it('dateArrivee absente donne null dans le payload', () => {
    const trip = {
      id: 'x', from: 'a', to: 'b', date: '2025-06-01T08:00',
      driver: 'd', driverId: '5', managerId: '1', vehicle: '1', status: 'En Cours'
    };
    service.addTrip(trip).subscribe();

    const req = httpMock.expectOne('http://localhost:8080/api/trajets');
    expect(req.request.body.dateArrivee).toBeNull();
    req.flush({});
  });

  it('priorité absente devient NORMALE et les statuts sont traduits vers le backend', () => {
    const cases: Array<[string, string]> = [
      ['En Cours', 'EN_COURS'],
      ['terminé', 'COMPLETE'],
      ['complété', 'COMPLETE'],
      ['actif', 'ACTIF'],
      ['autre', 'ACTIF']
    ];

    for (const [status, expected] of cases) {
      service.addTrip({
        id: 'x', from: 'a', to: 'b', date: '2025-06-01T08:00',
        driver: 'd', driverId: '5', managerId: '1', vehicle: '1', status
      }).subscribe();

      const req = httpMock.expectOne('http://localhost:8080/api/trajets');
      expect(req.request.body.statut).toBe(expected);
      expect(req.request.body.priorite).toBe('NORMALE');
      req.flush({});
    }
  });

  it('combineDateAndTime tolère une heure mal formée', () => {
    const date = new Date(2025, 5, 1);
    expect(service.combineDateAndTime(date, 'abc')).toContain('00:00:00');

    const odd = service.combineDateAndTime(new Date(2025, 5, 1), '8:5');
    expect(odd).toContain('T08:05:00');
  });

  it('getManagerTrips filtre selon l\u2019utilisateur connecté', () => {
    authServiceMock.getUser.and.returnValue(null);
    let anon: any[] | undefined;
    service.getManagerTrips().subscribe(t => (anon = t));
    httpMock.expectOne('http://localhost:8080/api/trajets?page=0&size=200').flush([
      { id: 1, statut: 'EN_COURS' }
    ]);
    expect(anon).toEqual([]);

    authServiceMock.getUser.and.returnValue({ id: '1', role: 'SUPERADMIN' });
    let all: any[] | undefined;
    service.getManagerTrips().subscribe(t => (all = t));
    httpMock.expectOne('http://localhost:8080/api/trajets?page=0&size=200').flush([
      { id: 1, statut: 'EN_COURS' }, { id: 2, statut: 'TERMINE' }
    ]);
    expect(all!.length).toBe(2);
  });

  it('getTrips retombe sur le cache en cas d\u2019erreur réseau', () => {
    authServiceMock.getUser.and.returnValue({ id: '1', role: 'SUPERADMIN' });

    let first: any[] | undefined;
    service.getTrips().subscribe(t => (first = t));
    httpMock.expectOne('http://localhost:8080/api/trajets?page=0&size=200').flush([
      { id: 7, pointDepart: 'Tunis', destination: 'Sfax', statut: 'EN_COURS' }
    ]);
    expect(first!.length).toBe(1);

    let fallback: any[] | undefined;
    service.getTrips().subscribe(t => (fallback = t));
    httpMock
      .expectOne('http://localhost:8080/api/trajets?page=0&size=200')
      .flush('boom', { status: 500, statusText: 'Server Error' });
    expect(fallback!.length).toBe(1);
    expect(fallback![0].id).toBe('7');
  });

  it('filterVehicles retourne [] pour un chauffeur sans correspondance ni nom', () => {
    authServiceMock.getUser.and.returnValue({ id: '777', role: 'DRIVER' });
    primeVehiclesCache([{ id: 1, matricule: 'AA-1-AA', marque: 'R', modele: 'T', statut: 'EN_SERVICE' }]);

    let res: any[] | undefined;
    service.getVehicles().subscribe(v => (res = v));
    httpMock
      .expectOne('http://localhost:8080/api/vehicules')
      .flush('down', { status: 503, statusText: 'Unavailable' });
    expect(res).toEqual([]);
  });

  it('getTrips retombe sur le cache pour un manager connecté', () => {
    authServiceMock.getUser.and.returnValue({ id: '3', role: 'MANAGER', entrepriseId: '9' });

    let res: any[] | undefined;
    service.getTrips().subscribe(t => (res = t));
    httpMock
      .expectOne('http://localhost:8080/api/trajets?page=0&size=200')
      .flush('boom', { status: 500, statusText: 'Server Error' });
    expect(res).toEqual([]);
  });

  it('parseDisplayDate couvre la branche ISO-like via Number.isNaN', () => {
    const realIsNaN = Number.isNaN;
    let calls = 0;
    spyOn(Number, 'isNaN').and.callFake((v: number) => {
      calls++;
      return calls === 1 ? realIsNaN(v) : false;
    });

    const parsed = (service as any).parseDisplayDate('2025-13-45T09:45');
    expect(typeof parsed).toBe('string');
    expect(calls).toBeGreaterThanOrEqual(2);
  });
});
