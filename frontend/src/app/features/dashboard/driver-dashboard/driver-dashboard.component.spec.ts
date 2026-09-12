import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { provideRouter } from '@angular/router';
import { of, BehaviorSubject, Subject, throwError } from 'rxjs';
import { DriverDashboardComponent } from './driver-dashboard.component';
import { FleetService } from '../../../core/services/fleet.service';
import { AuthService } from '../../../core/auth.service';
import { NotificationService, AppNotification } from '../../../core/services/notification.service';
import { CompanyService } from '../../../core/services/company.service';
import { ProfileService } from '../../../core/services/profile.service';

describe('DriverDashboardComponent', () => {
  let component: DriverDashboardComponent;
  let fixture: ComponentFixture<DriverDashboardComponent>;
  let httpMock: HttpTestingController;
  let realtimeSubject: Subject<AppNotification>;
  let currentUserSubject: BehaviorSubject<any>;
  let authServiceMock: any;
  let fleetServiceMock: any;
  let companyServiceMock: any;
  let profileServiceMock: any;

  const SECTORS_URL = 'http://localhost:8080/api/secteurs';

  function iso(minutesFromNow: number): string {
    return new Date(Date.now() + minutesFromNow * 60000).toISOString();
  }

  function mkTrip(over: any = {}): any {
    return Object.assign(
      {
        id: 11,
        statut: 'COMPLETE',
        dateDepart: iso(-120),
        dateArriveeReelle: iso(-110),
        dureeEstimeeMinutes: 8,
        distanceKm: 42,
        vehiculeMatricule: 'AA-123-BB',
        vehiculeId: 9,
        chauffeurId: 5,
        pointDepart: 'Lyon',
        destination: 'Marseille'
      },
      over
    );
  }

  function mkVehicle(over: any = {}): any {
    return Object.assign(
      {
        id: '9',
        plate: 'AA-123-BB',
        model: 'Caddy',
        brand: 'VW',
        status: 'En service',
        driverId: '5',
        driverName: 'Ali Bina'
      },
      over
    );
  }

  function mkCompany(over: any = {}): any {
    return Object.assign(
      {
        id: '3',
        name: 'LogiPro',
        address: '12 rue du Port',
        sector: 'Transport',
        fleetSize: 10,
        activeMissions: 4,
        status: 'Actif',
        joinDate: '2024-01-01'
      },
      over
    );
  }

  function mkBackendDashboard(over: any = {}): any {
    return Object.assign(
      {
        chauffeur: { id: 5, entrepriseId: 3, entrepriseNom: 'LogiPro' },
        manager: { id: 77, prenom: 'Marc', nom: 'Duval' },
        vehiculeActuel: {
          id: 9,
          matricule: 'AA-123-BB',
          modele: 'Caddy',
          marque: 'VW',
          statut: 'EN_SERVICE',
          entrepriseId: 3,
          entrepriseNom: 'LogiPro',
          kilometrage: 120000,
          capaciteCharge: 900
        },
        missionActuelle: mkTrip({ id: 20, statut: 'EN_COURS', dateArriveeReelle: undefined }),
        missionsDuJour: [mkTrip({ id: 21 })],
        statistiques: { ecoScoreMoyen: 88.4, consommationMoyenneL100Km: 7.9, distanceTotaleKm: 1520 },
        disponibiliteProchaine: { disponible: false, minutesRestantes: 95 }
      },
      over
    );
  }

  async function create(opts?: {
    user?: any;
    profile?: any;
    dashboard?: any;
    backendTrips?: any[];
    vehicles?: any[];
    companies?: any[];
    sectors?: any[];
    failVehicles?: boolean;
    failCompanies?: boolean;
    failDashboard?: boolean;
    failTrips?: boolean;
    failProfile?: boolean;
    sectorFail?: boolean;
  }): Promise<void> {
    TestBed.resetTestingModule();
    const user = opts?.user ?? { id: '5', role: 'DRIVER', firstName: 'Ali', lastName: 'Bina' };
    currentUserSubject = new BehaviorSubject(user);
    authServiceMock = {
      getUser: jasmine.createSpy('getUser').and.returnValue(user),
      isAuthenticated: jasmine.createSpy('isAuthenticated').and.returnValue(true),
      currentUser: currentUserSubject.asObservable()
    };
    fleetServiceMock = {
      getVehicles: jasmine.createSpy('getVehicles').and.returnValue(
        opts?.failVehicles ? throwError(() => new Error('ko')) : of(opts?.vehicles ?? [])
      ),
      getTrips: jasmine.createSpy('getTrips').and.returnValue(of([]))
    };
    companyServiceMock = {
      getCompanies: jasmine.createSpy('getCompanies').and.returnValue(
        opts?.failCompanies ? throwError(() => new Error('ko')) : of(opts?.companies ?? [])
      )
    };
    profileServiceMock = {
      getCurrentProfile: jasmine.createSpy('getCurrentProfile').and.returnValue(
        opts?.failProfile ? throwError(() => new Error('ko')) : of(opts?.profile ?? null)
      ),
      getDriverDashboard: jasmine.createSpy('getDriverDashboard').and.returnValue(
        opts?.failDashboard ? throwError(() => new Error('ko')) : of(opts?.dashboard ?? null)
      ),
      getDriverTrips: jasmine.createSpy('getDriverTrips').and.returnValue(
        opts?.failTrips ? throwError(() => new Error('ko')) : of({ content: opts?.backendTrips ?? [] })
      )
    };
    const notificationServiceMock = {
      connectRealtime: jasmine.createSpy('connectRealtime'),
      disconnectRealtime: jasmine.createSpy('disconnectRealtime'),
      loadNotifications: jasmine.createSpy('loadNotifications').and.returnValue(of([])),
      notifications$: of([]),
      unreadCount$: of(0),
      realtimeNotification$: realtimeSubject.asObservable()
    };

    await TestBed.configureTestingModule({
      imports: [DriverDashboardComponent],
      providers: [
        provideRouter([]),
        provideHttpClient(),
        provideHttpClientTesting(),
        provideAnimationsAsync(),
        { provide: AuthService, useValue: authServiceMock },
        { provide: FleetService, useValue: fleetServiceMock },
        { provide: CompanyService, useValue: companyServiceMock },
        { provide: ProfileService, useValue: profileServiceMock },
        { provide: NotificationService, useValue: notificationServiceMock }
      ]
    }).compileComponents();

    httpMock = TestBed.inject(HttpTestingController);
    fixture = TestBed.createComponent(DriverDashboardComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();

    const pendingSectors = httpMock.match((r) => r.url.includes(SECTORS_URL));
    if (opts?.sectorFail) {
      pendingSectors.forEach((r) => r.flush(null, { status: 500, statusText: 'Erreur Serveur' }));
    } else {
      pendingSectors.forEach((r) => r.flush(opts?.sectors ?? []));
    }
  }

  function flushSectors(data: any[]): void {
    httpMock.match((r) => r.url.includes(SECTORS_URL)).forEach((r) => r.flush(data));
  }

  beforeEach(() => {
    localStorage.clear();
    realtimeSubject = new Subject<AppNotification>();
  });

  afterEach(() => {
    try {
      httpMock.match(() => true).forEach((r) => {
        if (!r.cancelled) r.flush([]);
      });
      httpMock.verify();
    } catch {
      /* ignore */
    }
    try {
      fixture.destroy();
    } catch {
      /* ignore */
    }
    jest.useRealTimers();
  });

  it('crée le composant avec utilisateur et initiales dérivées', async () => {
    await create();

    expect(component).toBeTruthy();
    expect(component.currentUserName).toBe('Ali Bina');
    expect(component.driverInitials).toBe('AB');
    expect(component.currentUser?.id).toBe('5');
  });

  it("nom de secours sur username puis 'Chauffeur'", async () => {
    await create({ user: { id: '5', username: 'alib' } });
    expect(component.currentUserName).toBe('alib');
    expect(component.driverInitials).toBe('A');

    await create({ user: {} as any });
    expect(component.currentUserName).toBe('Chauffeur');
    expect(component.driverInitials).toBe('C');
  });

  it('restorePointage relance le chronomètre si session sauvegardée', async () => {
    localStorage.setItem('logiway_pointage_driver', JSON.stringify({ clockedIn: true, startTime: Date.now() - 60000 }));

    await create();

    expect(component.pointage.clockedIn).toBeTrue();
    expect(component.pointage.timerId).toBeTruthy();
    expect(component.pointageStatusLabel).toBe('En service');
  });

  it('restorePointage ignore un JSON corrompu mais lit un journal valide', async () => {
    localStorage.setItem('logiway_pointage_driver', '{oops');
    const today = new Date().toISOString();
    const yesterday = new Date(Date.now() - 86400000).toISOString();
    localStorage.setItem(
      'logiway_pointage_driver_log',
      JSON.stringify([
        { date: today, duration: 3600000 },
        { date: yesterday, duration: 7200000 },
        { date: today }
      ])
    );

    await create();

    expect(component.pointage.clockedIn).toBeFalse();
    expect(component.pointage.todayTotal).toBe(3600000);
    expect(component.pointageTodayLabel).toBe('1h 00m');
  });

  it('journal corrompu est ignoré', async () => {
    localStorage.setItem('logiway_pointage_driver_log', 'not-json');

    await create();

    expect(component.pointage.todayTotal).toBe(0);
    expect(component.pointageTodayLabel).toBe('0h 00m');
  });

  it('togglePointage enchaîne clockIn puis clockOut avec journalisation', async () => {
    await create();

    component.togglePointage();
    expect(component.pointage.clockedIn).toBeTrue();
    expect(JSON.parse(localStorage.getItem('logiway_pointage_driver')!)).toEqual(
      jasmine.objectContaining({ clockedIn: true })
    );
    expect(component.pointage.sessionElapsed).toBe('00:00:00');

    component.togglePointage();
    expect(component.pointage.clockedIn).toBeFalse();
    expect(localStorage.getItem('logiway_pointage_driver')).toBeNull();
    expect(component.pointage.startTime).toBe(0);
    expect(component.pointage.sessionElapsed).toBe('00:00:00');
    expect(component.pointageStatusLabel).toBe('Hors service');

    const log = JSON.parse(localStorage.getItem('logiway_pointage_driver_log') || '[]');
    expect(log.length).toBe(1);
  });

  it('beforeunload enregistre la session en cours', async () => {
    await create();

    component.clockIn();
    component.pointage.startTime = Date.now() - 20000;
    window.dispatchEvent(new Event('beforeunload'));

    expect(component.pointage.clockedIn).toBeFalse();
    const log = JSON.parse(localStorage.getItem('logiway_pointage_driver_log') || '[]');
    expect(log.length).toBe(1);
  });

  it('la déconnexion clôt la session ouverte', async () => {
    await create();

    component.clockIn();
    currentUserSubject.next(null);

    expect(component.pointage.clockedIn).toBeFalse();
  });

  it('ngOnDestroy coupe les abonnements temps réel', async () => {
    await create();
    const dashCalls = () => profileServiceMock.getDriverDashboard.calls.count();

    component.ngOnDestroy();
    const before = dashCalls();
    realtimeSubject.next({ category: 'TRAJET' } as unknown as AppNotification);

    expect(dashCalls()).toBe(before);
  });

  describe('labels disponibilité / véhicule / entreprise', () => {
    beforeEach(() => localStorage.clear());

    it('couvre les trois états de disponibilité', async () => {
      await create();

      expect(component.availabilityLabel).toBe('Libre');
      expect(component.availabilityTone).toBe('info');
      expect(component.availabilityProgress).toBe(8);

      component.assignedVehicle = mkVehicle();
      expect(component.availabilityLabel).toBe('Affecté');
      expect(component.availabilityTone).toBe('warning');
      expect(component.availabilityProgress).toBe(65);

      component.currentTrip = { id: '1', status: 'En cours' } as any;
      expect(component.availabilityLabel).toBe('En service');
      expect(component.availabilityTone).toBe('success');
      expect(component.availabilityProgress).toBe(100);
    });

    it('libellés mission courante', async () => {
      await create();

      expect(component.tripStatusLabel).toBe('Aucune mission active');
      expect(component.tripRouteLabel).toBe('Aucune mission en cours');
      expect(component.missionDuJour).toBeNull();

      component.currentTrip = { from: 'Nice', to: 'Paris', status: 'En cours', vehicle: 'ZZ-999' } as any;
      expect(component.tripStatusLabel).toBe('En cours');
      expect(component.tripRouteLabel).toBe('Nice vers Paris');
      expect(component.tripVehicleLabel).toBe('ZZ-999');
    });

    it('vehicleSubtitle gère modèle présent puis absent puis aucun véhicule', async () => {
      await create();

      expect(component.vehicleSubtitle).toBe('Aucun véhicule assigné');
      expect(component.vehicleStatusLabel).toBe('Véhicule non attribué');

      component.assignedVehicle = mkVehicle({ model: '' }) as any;
      expect(component.vehicleSubtitle).toBe('AA-123-BB');

      component.assignedVehicle = mkVehicle() as any;
      expect(component.vehicleSubtitle).toBe('AA-123-BB • Caddy');
      expect(component.vehicleStatusLabel).toBe('En service');
    });

    it('companyLabel retombe sur le nom du véhicule', async () => {
      await create();

      expect(component.companyLabel).toBe('Entreprise non renseignée');
      expect(component.companySectorLabel).toBe('Secteur non précisé');
      expect(component.companyManagerLabel).toBe('Manager non renseigné');

      component.assignedVehicle = mkVehicle({ companyName: 'ViaVehicule' }) as any;
      expect(component.companyLabel).toBe('ViaVehicule');

      component.assignedCompany = mkCompany({ managerOwnerName: '  Nora Chef  ' }) as any;
      expect(component.companyLabel).toBe('LogiPro');
      expect(component.companySectorLabel).toBe('Transport');
      expect(component.companyManagerLabel).toBe('Nora Chef');

      component.directManagerName = 'Marc Duval';
      expect(component.companyManagerLabel).toBe('Marc Duval');
    });
  });

  describe('résolutions depuis les flux chargés', () => {
    it('associe véhicule, secteur, entreprise et trajet au chauffeur connecté', async () => {
      await create({
        profile: { id: 5, managerId: 77, entrepriseId: 3, entrepriseNom: 'LogiPro', managerPrenom: 'Marc', managerNom: 'Duval' },
        backendTrips: [
          mkTrip({ id: 11 }),
          mkTrip({ id: 12, statut: 'ANNULE', dateArriveeReelle: iso(-100) })
        ],
        vehicles: [mkVehicle()],
        companies: [mkCompany()],
        sectors: [
          {
            id: 2,
            nom: '  Sud ',
            description: '',
            zoneGeographique: 'PACA',
            codesPostaux: '13000',
            managers: [],
            chauffeurs: [{ id: 5 }]
          }
        ]
      });

      expect(component.assignedVehicle?.plate).toBe('AA-123-BB');
      expect(component.assignedCompany?.name).toBe('LogiPro');
      expect(component.directManagerName).toBe('Marc Duval');
      expect(component.assignedSector).toEqual(
        jasmine.objectContaining({ id: 2, nom: 'Sud', description: '', zoneGeographique: 'PACA', codesPostaux: '13000' })
      );

      expect(component.delayedTrips.length).toBe(0);
      expect(component.incidentTrips.length).toBe(1);
      expect(component.tripSummary.total).toBe(2);
      expect(component.tripSummary.completed).toBe(1);
      expect(component.currentTrip).toBeNull();
      expect(component.availabilityLabel).toBe('Affecté');
    });

    it('secteur trouvé par le manager quand chauffeur absent', async () => {
      await create({
        profile: { id: 5, managerId: 77 },
        sectors: [{ id: 4, nom: 'Nord', managers: [{ id: 77 }], chauffeurs: [{ id: 999 }] }]
      });

      expect(component.assignedSector?.nom).toBe('Nord');
    });

    it('aucun secteur ni véhicule ni entreprise → valeurs nulles', async () => {
      await create({ profile: { id: 5 } });

      expect(component.assignedSector).toBeNull();
      expect(component.assignedVehicle).toBeNull();
      expect(component.assignedCompany).toBeNull();
      expect(component.availabilityProgress).toBe(8);
    });

    it('entreprise synthétique quand identifiant connu mais liste vide', async () => {
      await create({
        profile: { id: 5, entrepriseId: 3, entrepriseNom: 'LogiPro' },
        companies: []
      });

      expect(component.assignedCompany).toEqual(jasmine.objectContaining({ id: '3', name: 'LogiPro', status: 'Actif' }));
    });

    it('entreprise trouvée par managerOwnerId quand pas de véhicule ni entrepriseId', async () => {
      await create({
        profile: { id: 5, managerId: 77, entrepriseId: null },
        companies: [mkCompany({ managerOwnerId: 77 })]
      });

      expect(component.assignedCompany?.name).toBe('LogiPro');
    });

    it("erreur véhicules/entreprises affiche les messages d'échec", async () => {
      await create({ failVehicles: true, failCompanies: true });

      expect(component.vehicleError).toContain('Impossible de charger');
      expect(component.companyError).toContain('Impossible de charger');
      expect(component.isVehicleLoading).toBeFalse();
      expect(component.isCompanyLoading).toBeFalse();
    });

    it('véhicule isolé attribué par défaut', async () => {
      await create({
        profile: null,
        user: { id: '42' },
        vehicles: [mkVehicle({ driverId: '999', driverName: 'Autre' })]
      });

      expect(component.assignedVehicle?.plate).toBe('AA-123-BB');
    });

    it('trajet courant préféré selon le véhicule assigné (par plaque)', async () => {
      await create({
        backendTrips: [
          mkTrip({ id: 31, chauffeurId: 999, statut: 'EN_COURS', dateArriveeReelle: undefined, vehiculeMatricule: 'aa 123 bb' })
        ],
        vehicles: [mkVehicle()]
      });

      expect(component.currentTrip?.id).toBe('31');
      expect(component.availabilityLabel).toBe('En service');
    });

    it('trajets du même chauffeur retrouvés via le nom normalisé', async () => {
      await create({
        backendTrips: [mkTrip({ id: 41, chauffeurId: null as any, chauffeurNom: 'ali bina' })],
        vehicles: []
      });

      expect(component.myTrips.length).toBe(1);
    });

    it('temps réel recharge dashboard, entreprises et secteurs', async () => {
      await create({
        companies: [],
        dashboard: mkBackendDashboard()
      });
      const dashBefore = profileServiceMock.getDriverDashboard.calls.count();

      realtimeSubject.next({ category: 'TRAJET' } as unknown as AppNotification);
      flushSectors([{ id: 6, nom: 'Est', chauffeurs: [{ id: 5 }] }]);

      expect(profileServiceMock.getDriverDashboard.calls.count()).toBeGreaterThan(dashBefore);
      expect(companyServiceMock.getCompanies.calls.count()).toBeGreaterThanOrEqual(2);
      expect(component.assignedSector?.nom).toBe('Est');
      expect(component.assignedVehicle?.plate).toBe('AA-123-BB');
      expect(component.currentTrip).not.toBeNull();
    });

    it('dashboard indisponible en rechargement conserve les données locales', async () => {
      await create({ dashboard: null, backendTrips: [mkTrip()] });
      profileServiceMock.getDriverDashboard.and.returnValue(throwError(() => new Error('down')));

      realtimeSubject.next({ category: 'COMPTE' } as unknown as AppNotification);
      flushSectors([]);

      expect(component.myTrips.length).toBeGreaterThan(0);
    });
  });

  describe('historique paginé et KPIs', () => {
    function seedMany(count: number): any[] {
      const list: any[] = [];
      for (let i = 0; i < count; i++) {
        list.push(mkTrip({ id: 100 + i, dateDepart: iso(-200 - i), dateArriveeReelle: iso(-190 - i) }));
      }
      return list;
    }

    it('pagination avant/arrière/saut', async () => {
      await create({ backendTrips: seedMany(20) });

      expect(component.histTotalPages).toBe(3);
      expect(component.historyTripsPage.length).toBe(8);
      expect(component.histPageNumbers).toEqual([0, 1, 2]);

      component.nextHistPage();
      expect(component.histPageIndex).toBe(1);
      component.prevHistPage();
      expect(component.histPageIndex).toBe(0);
      component.prevHistPage();
      expect(component.histPageIndex).toBe(0);

      component.goHistPage(2);
      expect(component.historyTripsPage.length).toBe(4);
      component.nextHistPage();
      expect(component.histPageIndex).toBe(2);

      component.goHistPage(99);
      expect(component.historyTripsPage.length).toBe(0);
      expect(component.historyTrips.length).toBe(20);
    });

    it('pagination vide donne une seule page', async () => {
      await create();

      expect(component.histTotalPages).toBe(1);
      expect(component.historyTripsPage).toEqual([]);
      expect(component.drivingStats.punctuality).toBe(100);
      expect(component.delayRate).toBe(0);
    });

    it('delayRate et punctualityRate reflètent les retards', async () => {
      await create({
        backendTrips: [
          mkTrip({ id: 61, dateDepart: iso(-60), dateArriveeReelle: iso(-48), dureeEstimeeMinutes: 5 }),
          mkTrip({ id: 62, dateDepart: iso(-90), dateArriveeReelle: iso(-85), dureeEstimeeMinutes: 5 })
        ]
      });

      expect(component.delayedTrips.length).toBe(1);
      expect(component.delayRate).toBe(50);
      expect(component.punctualityRate).toBe(50);
      expect(component.drivingStats.safetyScore).toBeLessThanOrEqual(100);
      expect(component.drivingStats.fuelEfficiency).toBeGreaterThan(8);
    });

    it('trajet non terminé jamais retardé', async () => {
      await create({
        backendTrips: [mkTrip({ id: 63, statut: 'EN_COURS', dateArriveeReelle: undefined, dureeEstimeeMinutes: 1 })]
      });

      expect(component.delayedTrips.length).toBe(0);
      expect(component.activeTrips.length).toBe(1);
      expect(component.tripSummary.active).toBe(1);
    });

    it('drivingStats signale la pause requise au-delà de 4h30', async () => {
      await create();

      (component as any).todaysTrips = [
        { id: '900', status: 'En cours', dateDepartIso: iso(-290), dureeEstimeeMinutes: 300 }
      ];

      expect(component.drivingStats.restRequiredIn).toBe('Pause requise !');
      expect(component.drivingStats.needsRest).toBeTrue();
      expect(component.drivingStats.drivingTimeToday).not.toBe('0 min');
    });

    it('drivingStats reste dans des bornes saines avec beaucoup de retards', async () => {
      const trips: any[] = [];
      for (let i = 0; i < 4; i++) {
        trips.push(mkTrip({ id: 70 + i, dateDepart: iso(-60 - i), dateArriveeReelle: iso(-40 - i), dureeEstimeeMinutes: 2 }));
      }

      await create({ backendTrips: trips });

      const stats = component.drivingStats;
      expect(stats.safetyScore).toBeGreaterThanOrEqual(0);
      expect(stats.safetyScore).toBeLessThanOrEqual(100);
      expect(stats.totalDistance).toBeGreaterThan(0);
      expect(stats.restRequiredIn).toContain('h');
    });

    it("getTripActualMinutes vaut zéro sans dates exploitables", async () => {
      await create();

      expect(component.getTripActualMinutes({ date: '', dateDepartIso: '', dateArriveeIso: '', status: 'TERMINE' } as any)).toBe(0);
      expect(component.getTripActualMinutes({ date: 'pas-une-date', status: 'TERMINE', dateArrivee: 'x' } as any)).toBe(0);
      expect(component.isToday({ date: '', dateDepartIso: '' } as any)).toBeFalse();
      expect(component.isToday({ date: 'impossible' } as any)).toBeFalse();
    });
  });

  describe('mapping backend', () => {
    it('applique une réponse complète du dashboard', async () => {
      await create({ dashboard: mkBackendDashboard(), backendTrips: [mkTrip()] });

      expect((component as any).currentDriverId).toBe('5');
      expect((component as any).currentDriverManagerId).toBe('77');
      expect(component.driverCompanyId).toBe('3');
      expect(component.driverCompanyName).toBe('LogiPro');
      expect(component.directManagerName).toBe('Marc Duval');
      expect(component.assignedVehicle).toEqual(
        jasmine.objectContaining({ id: '9', plate: 'AA-123-BB', model: 'Caddy', status: 'En service', companyId: '3', mileage: 120000, capacity: 900 })
      );
      expect(component.currentTrip?.id).toBe('20');
      expect(component.tripSummary.distanceKm).toBeGreaterThan(0);
    });

    it('gestionnaire incomplet réinitialise le lien managérial', async () => {
      await create({
        dashboard: mkBackendDashboard({ manager: { id: 77 }, chauffeur: { id: 8 } }),
        profile: { id: 5, managerId: 99 }
      });

      expect(component.directManagerName).toBeNull();
      expect((component as any).currentDriverManagerId).toBeNull();
      expect((component as any).currentDriverId).toBe('8');
    });

    it('statut véhicule inconnu est restitué brut et vide retombe sur Hors service', async () => {
      await create({
        dashboard: mkBackendDashboard({ vehiculeActuel: { id: 9, matricule: 'X', statut: 'MAINTENANCE' } })
      });

      expect(component.assignedVehicle?.status).toBe('MAINTENANCE');

      await create({
        dashboard: mkBackendDashboard({
          chauffeur: { id: 9 },
          manager: null,
          vehiculeActuel: { id: 2, matricule: 'Y' },
          missionActuelle: null,
          missionsDuJour: [],
          statistiques: null,
          disponibiliteProchaine: null
        })
      });

      expect(component.assignedVehicle?.status).toBe('Hors service');
      expect(component.assignedVehicle?.nextCheck).toBe('HORS_SERVICE');
    });

    it('disponibilité future formatée et cas disponibles', async () => {
      await create({
        dashboard: mkBackendDashboard({ disponibiliteProchaine: { disponible: true } })
      });

      expect((component as any)._backendStats.restRequiredIn).toBe('Disponible');

      await create({
        dashboard: mkBackendDashboard({ disponibiliteProchaine: null })
      });

      expect((component as any)._backendStats.restRequiredIn).toBe('0h 00m');

      await create({
        dashboard: mkBackendDashboard({
          disponibiliteProchaine: { disponible: false, minutesRestantes: -5 }
        })
      });

      expect((component as any)._backendStats.restRequiredIn).toBe('Disponible dans 0h 00m');
    });

    it('mapBackendTrip couvre replis et statuts', async () => {
      await create({
        backendTrips: [
          mkTrip({ id: 81, statut: 'ACTIF', dateArriveeReelle: undefined, dateArrivee: iso(-80), vehiculeMatricule: undefined, chauffeurNom: undefined, distanceKm: undefined, dureeEstimeeMinutes: undefined, managerId: 4, latitudeDepart: 1.5 }),
          mkTrip({ id: 82, statut: 'INCONNU', dateDepart: 'date-invalide', dateArriveeReelle: 'aussi-invalide' })
        ]
      });

      const first = component.myTrips.find((t) => t.id === '81');
      const second = component.myTrips.find((t) => t.id === '82');

      expect(first?.status).toBe('Actif');
      expect(first?.vehicle).toBe('-');
      expect(first?.driver).toBe('-');
      expect(first?.distanceKm).toBeUndefined();
      expect(first?.managerId).toBe('4');
      expect(first?.latitudeDepart).toBe(1.5);
      expect(second?.status).toBe('INCONNU');
      expect(second?.date).toBe('date-invalide');
      expect(second?.dateArrivee).toBe('aussi-invalide');
    });

    it('mission actuelle fusionne les doublons par identifiant', async () => {
      await create({
        dashboard: mkBackendDashboard(),
        backendTrips: [mkTrip({ id: 20 })]
      });

      const missionIds = ((component as any).trips as any[]).map((t) => t.id);
      expect(missionIds.filter((v) => v === '20').length).toBe(1);
    });
  });

  it('erreurs dashboard et trajets tolérées silencieusement', async () => {
    await create({ failDashboard: true, failTrips: true });

    expect(component.myTrips).toEqual([]);
    expect(component.tripSummary.total).toBe(0);
  });

  it('profil en erreur continue le chargement via les replis', async () => {
    await create({ failProfile: true, backendTrips: [mkTrip()] });

    expect((component as any).currentDriverId).toBeNull();
    expect(component.myTrips.length).toBe(1);
    expect(component.directManagerName).toBeNull();
  });

  it("erreur HTTP sur les secteurs affiche l'échec", async () => {
    await create({ sectorFail: true });

    expect(component.sectorError).toContain('Impossible de charger');
    expect(component.isSectorLoading).toBeFalse();
    expect(component.assignedSector).toBeNull();
  });

  it('le chronomètre de session se met à jour chaque seconde', async () => {
    await create();

    let tick: any = null;
    spyOn(window, 'setInterval').and.callFake((fn: any) => {
      tick = fn;
      return 123;
    });

    component.clockIn();
    expect(component.pointage.timerId).toBe(123);

    component.clockOut();
    component.clockIn();
    component.clockOut();

    component.clockIn();
    component.pointage.startTime = Date.now() - 3700000;

    tick();

    expect(component.pointage.sessionElapsed).toBe('01:01:40');

    if (component.pointage.timerId) clearInterval(component.pointage.timerId as any);
  });

  it("getTripActualMinutes vaut zéro pour un trajet terminé sans arrivée", async () => {
    await create();

    const minutes = component.getTripActualMinutes({
      dateDepartIso: iso(-5),
      dateArriveeIso: '',
      dateArrivee: '',
      status: 'Terminé'
    } as any);

    expect(minutes).toBe(0);
  });

  it('véhicule rattaché au chauffeur du profil quand le nom diffère', async () => {
    await create({
      profile: { id: 7 },
      vehicles: [mkVehicle({ driverName: 'Quelquun Dautre', driverId: '7' })]
    });

    expect(component.assignedVehicle?.driverId).toBe('7');
  });

  it('buildInitials retombe sur CH sans lettres exploitables', async () => {
    await create();

    expect((component as any).buildInitials('')).toBe('CH');
  });

  it('payload trajet squelettique active tous les replis de mapping', async () => {
    await create({
      dashboard: {
        chauffeur: { id: 5 },
        manager: {},
        vehiculeActuel: { id: 3, matricule: '', modele: '', marque: '', statut: '' },
        missionActuelle: null,
        missionsDuJour: [],
        statistiques: { ecoScoreMoyen: null, consommationMoyenneL100Km: null, distanceTotaleKm: null },
        disponibiliteProchaine: { disponible: null, minutesRestantes: null }
      },
      backendTrips: [
        {
          id: 91,
          statut: '',
          dateDepart: '',
          dateArriveeReelle: null,
          dateArrivee: null,
          dureeEstimeeMinutes: null,
          distanceKm: null,
          vehiculeMatricule: null,
          vehiculeCouleur: null,
          vehiculeId: null,
          pointDepart: null,
          destination: null,
          chauffeurNom: null,
          chauffeurId: 5,
          managerId: null,
          priorite: null
        }
      ]
    });

    const skeleton = component.myTrips.find((t) => t.id === '91');
    expect(skeleton?.status).toBe('-');
    expect(skeleton?.vehicle).toBe('-');
    expect(skeleton?.driver).toBe('-');
    expect(skeleton?.from).toBe('-');
    expect(skeleton?.to).toBe('-');
    expect(skeleton?.dateDepartIso).toBe('');
    expect(component.assignedVehicle?.status).toBe('Hors service');
    expect(component.assignedVehicle?.model).toBe('');
    expect((component as any)._backendStats.fuelEfficiency).toBe(0);
    expect((component as any)._backendStats.totalDistance).toBe(0);
    expect((component as any)._backendStats.restRequiredIn).toBe('Disponible dans 0h 00m');
    expect(component.directManagerName).toBeNull();
  });
});
