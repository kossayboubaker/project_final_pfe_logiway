import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { provideRouter } from '@angular/router';
import { of, throwError, BehaviorSubject, Subject } from 'rxjs';
import { ManagerDashboardComponent } from './manager-dashboard.component';
import { FleetService } from '../../../core/services/fleet.service';
import { AuthService } from '../../../core/auth.service';
import { NotificationService, AppNotification } from '../../../core/services/notification.service';
import { SecteurService } from '../../../core/services/secteur.service';
import { ReclamationService } from '../../../core/services/reclamation.service';
import { LeaveService } from '../../../core/services/leave.service';
import { MessengerService } from '../../../core/services/messenger.service';
import { UserService } from '../../../core/services/user.service';
import { ProfileService } from '../../../core/services/profile.service';

describe('ManagerDashboardComponent', () => {
  let component: ManagerDashboardComponent;
  let fixture: ComponentFixture<ManagerDashboardComponent>;
  let realtimeSubject: Subject<AppNotification>;
  let currentUserSubject: BehaviorSubject<any>;

  let authServiceMock: any;
  let fleetServiceMock: any;
  let notificationServiceMock: any;
  let secteurServiceMock: any;
  let reclamationServiceMock: any;
  let leaveServiceMock: any;
  let messengerServiceMock: any;
  let userServiceMock: any;
  let profileServiceMock: any;

  const trip = (over: Record<string, unknown>): any => ({
    id: '1', driverId: '1', status: 'EN_COURS', distanceKm: 10, retardMinutes: 0, ...over
  });

  const create = async () => {
    await TestBed.resetTestingModule()
      .configureTestingModule({
        imports: [ManagerDashboardComponent],
        providers: [
          provideRouter([]),
          provideHttpClient(),
          provideHttpClientTesting(),
          provideAnimationsAsync(),
          { provide: AuthService, useValue: authServiceMock },
          { provide: FleetService, useValue: fleetServiceMock },
          { provide: NotificationService, useValue: notificationServiceMock },
          { provide: SecteurService, useValue: secteurServiceMock },
          { provide: ReclamationService, useValue: reclamationServiceMock },
          { provide: LeaveService, useValue: leaveServiceMock },
          { provide: MessengerService, useValue: messengerServiceMock },
          { provide: UserService, useValue: userServiceMock },
          { provide: ProfileService, useValue: profileServiceMock }
        ]
      })
      .compileComponents();

    fixture = TestBed.createComponent(ManagerDashboardComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
    await Promise.resolve();
  };

  beforeEach(async () => {
    localStorage.clear();

    realtimeSubject = new Subject<AppNotification>();
    currentUserSubject = new BehaviorSubject({ id: '3', role: 'MANAGER', username: 'Jean Test' });

    authServiceMock = {
      getUser: jasmine.createSpy('getUser').and.returnValue({ id: '3', role: 'MANAGER' }),
      isAuthenticated: jasmine.createSpy('isAuthenticated').and.returnValue(true),
      currentUser: currentUserSubject.asObservable()
    };

    fleetServiceMock = {
      getVehicles: jasmine.createSpy('getVehicles').and.returnValue(of([])),
      getTrips: jasmine.createSpy('getTrips').and.returnValue(of([])),
      getTrajetsCountBySecteur: jasmine.createSpy('getTrajetsCountBySecteur').and.returnValue(of(4))
    };

    notificationServiceMock = {
      connectRealtime: jasmine.createSpy('connectRealtime'),
      disconnectRealtime: jasmine.createSpy('disconnectRealtime'),
      loadNotifications: jasmine.createSpy('loadNotifications').and.returnValue(of([])),
      notifications$: of([]),
      unreadCount$: of(0),
      realtimeNotification$: realtimeSubject.asObservable()
    };

    secteurServiceMock = {
      getAllSecteurs: jasmine.createSpy('getAllSecteurs').and.returnValue(of([])),
      getSectorById: jasmine.createSpy('getSectorById').and.returnValue(of(null))
    };

    reclamationServiceMock = { list: jasmine.createSpy('list').and.returnValue(of([])) };
    leaveServiceMock = { getLeaves: jasmine.createSpy('getLeaves').and.returnValue(of([])) };
    messengerServiceMock = {
      unreadCount$: of(0),
      loadConversations: jasmine.createSpy('loadConversations').and.returnValue(of([]))
    };
    userServiceMock = { list: jasmine.createSpy('list').and.returnValue(of([])) };
    profileServiceMock = { getCurrentProfile: jasmine.createSpy('getCurrentProfile').and.returnValue(of(null)) };

    await create();
  });

  const mkUser = (over: Record<string, unknown>): any => ({ id: 1, role: 'CHAUFFEUR', ...over });

  it('should create et charger les compteurs de base', () => {
    expect(component).toBeTruthy();
    expect(notificationServiceMock.connectRealtime).toHaveBeenCalled();
    expect(component.isLoading).toBeFalse();
  });

  it('KPIs utilisateurs et autres sources', () => {
    userServiceMock.list.and.returnValue(of([
      mkUser({ id: 1 }), mkUser({ id: 2, role: 'MANAGER' }), mkUser({ id: 3 })
    ]));
    leaveServiceMock.getLeaves.and.returnValue(of([{}, {}] as any[]));
    reclamationServiceMock.list.and.returnValue(of([{}] as any[]));
    messengerServiceMock.loadConversations.and.returnValue(of([{}, {}, {}] as any[]));
    secteurServiceMock.getAllSecteurs.and.returnValue(of([{}] as any[]));

    component.ngOnInit();

    expect(component.drivers.length).toBe(2);
    expect(component.kpiTotalUsersCount).toBe(3);
    expect(component.isDriversLoading).toBeFalse();
    expect(component.kpiLeavesCount).toBe(2);
    expect(component.kpiComplaintsCount).toBe(1);
    expect(component.kpiMessagesCount).toBe(3);
    expect(component.kpiSectorsCount).toBe(1);
  });

  it('erreur de chargement des utilisateurs → liste vide', () => {
    userServiceMock.list.and.returnValue(throwError(() => new Error('ko')));

    component.ngOnInit();

    expect(component.drivers).toEqual([]);
    expect(component.kpiTotalUsersCount).toBe(0);
  });

  // ─── Trajets et KPIs ──────────────────────────────────────────
  it('computeKpis depuis les trajets réels', () => {
    fleetServiceMock.getTrips.and.returnValue(of([
      trip({ id: '1', status: 'En cours', distanceKm: 100.4, retardMinutes: 10 }),
      trip({ id: '2', status: 'TERMINE', driverId: '2', distanceKm: 50, retardMinutes: 30 }),
      trip({ id: '3', status: 'completé', driverId: '2', distanceKm: 0 }),
      trip({ id: '4', status: 'ANNULE', driverId: '2', distanceKm: 0 })
    ]));

    component.ngOnInit();

    expect(component.allTrips.length).toBe(4);
    expect(component.activeTripCount).toBe(1);
    expect(component.kpiCompletedTrips).toBe(2);
    expect(component.kpiTotalDistance).toBe(150);
    expect(component.kpiAvgDelay).toBe(20);
    expect(component.kpiOnTimeRate).toBe(50);
    expect(component.kpiTotalTrips).toBe(4);
  });

  it('aucun retard → moyenne 0 et taux 100 %', () => {
    component.selectedDriverId = null;
    (component as any).allTrips = [trip({})];
    (component as any).applyDriverFilter();

    expect(component.kpiAvgDelay).toBe(0);
    expect(component.kpiOnTimeRate).toBe(100);
  });

  it('erreur getTrips réinitialise les trajets', () => {
    fleetServiceMock.getTrips.and.returnValue(throwError(() => new Error('ko')));

    component.ngOnInit();

    expect(component.allTrips).toEqual([]);
    expect(component.recentTrips).toEqual([]);
    expect(component.activeTripCount).toBe(0);
    expect(component.isLoading).toBeFalse();
  });

  // ─── Filtre chauffeur ─────────────────────────────────────────
  it('onDriverSelect filtre les trajets par chauffeur', () => {
    userServiceMock.list.and.returnValue(of([
      mkUser({ id: 2, prenom: 'Sara', nom: 'Kamel', statutConducteur: 'LIBRE' })
    ]));
    fleetServiceMock.getTrips.and.returnValue(of([
      trip({ id: '1', driverId: '1' }), trip({ id: '2', driverId: '2' })
    ]));
    component.ngOnInit();

    component.onDriverSelect(2);
    expect(component.selectedDriverId).toBe(2);
    expect(component.recentTrips.map(t => t.id)).toEqual(['2']);
    expect(component.kpiTotalTrips).toBe(1);
    expect(component.selectedDriver?.prenom).toBe('Sara');

    component.onDriverSelect(null);
    expect(component.recentTrips.length).toBe(2);
  });

  // ─── Secteur ──────────────────────────────────────────────────
  it('secteur chargé depuis le profil avec trajetsCount présent', () => {
    profileServiceMock.getCurrentProfile.and.returnValue(of({ secteurId: 7 }));
    secteurServiceMock.getSectorById.and.returnValue(of({
      id: 7, nom: 'Sud', zoneGeographique: 'Médenine',
      managers: [{ id: 1 }], chauffeurs: [{ id: 2 }, { id: 3 }], trajetsCount: 9
    }));

    component.ngOnInit();

    expect(component.sectorStats).toEqual(jasmine.objectContaining({
      id: 7, nom: 'Sud', managersCount: 1, driversCount: 2, trajetsCount: 9
    }));
    expect(fleetServiceMock.getTrajetsCountBySecteur).not.toHaveBeenCalled();
  });

  it('secteur sans trajetsCount → appel au service fleet', () => {
    profileServiceMock.getCurrentProfile.and.returnValue(of({ secteurId: 7 }));
    secteurServiceMock.getSectorById.and.returnValue(of({ id: 8 }));

    component.ngOnInit();

    expect(component.sectorStats).toEqual(jasmine.objectContaining({
      id: 8, nom: 'Secteur', zoneGeographique: 'N/A', managersCount: 1, driversCount: 0
    }));
    expect(fleetServiceMock.getTrajetsCountBySecteur).toHaveBeenCalledWith(8);
    expect(component.sectorStats?.trajetsCount).toBe(4);
  });

  it('profil sans secteurId et utilisateur sans secteurId → pas de secteur', () => {
    profileServiceMock.getCurrentProfile.and.returnValue(of({}));
    authServiceMock.getUser.and.returnValue({ id: '3', role: 'MANAGER' });

    component.ngOnInit();

    expect(component.sectorStats).toBeNull();
    expect(secteurServiceMock.getSectorById).not.toHaveBeenCalled();
  });

  it('profil en erreur mais utilisateur avec secteurId → fallback', () => {
    profileServiceMock.getCurrentProfile.and.returnValue(throwError(() => new Error('ko')));
    authServiceMock.getUser.and.returnValue({ id: '3', role: 'MANAGER', secteurId: 5 });
    secteurServiceMock.getSectorById.and.returnValue(of({
      id: 5, nom: 'Nord', zoneGeographique: 'Bizerte', managers: [], chauffeurs: [], trajetsCount: 0
    }));

    component.ngOnInit();

    expect(component.sectorStats).toEqual(jasmine.objectContaining({ id: 5, nom: 'Nord', trajetsCount: 0 }));
  });

  it('fallback secteur minimal dans le chemin de secours', () => {
    profileServiceMock.getCurrentProfile.and.returnValue(throwError(() => new Error('ko')));
    authServiceMock.getUser.and.returnValue({ id: '3', role: 'MANAGER', secteurId: 5 });
    secteurServiceMock.getSectorById.and.returnValue(of({ id: 6 }));

    component.ngOnInit();

    expect(component.sectorStats).toEqual(jasmine.objectContaining({
      id: 6, nom: 'Secteur', zoneGeographique: 'N/A', managersCount: 1, driversCount: 0, trajetsCount: 0
    }));
  });

  it('double échec secteur → sectorStats null', () => {
    profileServiceMock.getCurrentProfile.and.returnValue(throwError(() => new Error('ko')));
    authServiceMock.getUser.and.returnValue({ id: '3', role: 'MANAGER', secteurId: 5 });
    secteurServiceMock.getSectorById.and.returnValue(throwError(() => new Error('ko')));

    component.ngOnInit();

    expect(component.sectorStats).toBeNull();
  });

  it('profil OK mais getSectorById en erreur → sectorStats null', () => {
    profileServiceMock.getCurrentProfile.and.returnValue(of({ secteurId: 7 }));
    secteurServiceMock.getSectorById.and.returnValue(throwError(() => new Error('ko')));

    component.ngOnInit();

    expect(component.sectorStats).toBeNull();
  });

  it('échec du comptage de trajets du secteur reste silencieux', () => {
    profileServiceMock.getCurrentProfile.and.returnValue(of({ secteurId: 7 }));
    secteurServiceMock.getSectorById.and.returnValue(of({ id: 8 }));
    fleetServiceMock.getTrajetsCountBySecteur.and.returnValue(throwError(() => new Error('ko')));

    component.ngOnInit();

    expect(component.sectorStats?.trajetsCount).toBe(0);
  });

  // ─── Véhicules ────────────────────────────────────────────────
  it('vehicleCount depuis le service', () => {
    fleetServiceMock.getVehicles.and.returnValue(of([{}, {}, {}] as any[]));
    component.ngOnInit();
    expect(component.vehicleCount).toBe(3);

    fleetServiceMock.getVehicles.and.returnValue(throwError(() => new Error('ko')));
    component.ngOnInit();
    expect(component.vehicleCount).toBe(0);
  });

  // ─── Temps réel ───────────────────────────────────────────────
  it('notification TRAJET recharge trajets et véhicules', () => {
    fleetServiceMock.getTrips.calls.reset();
    fleetServiceMock.getVehicles.calls.reset();

    realtimeSubject.next({ category: 'NOTIF_TRAJET' } as AppNotification);

    expect(fleetServiceMock.getTrips).toHaveBeenCalled();
    expect(fleetServiceMock.getVehicles).toHaveBeenCalled();
  });

  it('notification VEHICULE déclenche aussi le rechargement', () => {
    fleetServiceMock.getTrips.calls.reset();
    realtimeSubject.next({ category: 'NOTIF_VEHICULE' } as AppNotification);
    expect(fleetServiceMock.getTrips).toHaveBeenCalled();
  });

  it('notification COMPTE recharge les utilisateurs', () => {
    userServiceMock.list.calls.reset();
    realtimeSubject.next({ category: 'NOTIF_COMPTE' } as AppNotification);
    expect(userServiceMock.list).toHaveBeenCalled();
  });

  it('notification SECTEUR recharge les utilisateurs', () => {
    userServiceMock.list.calls.reset();
    realtimeSubject.next({ category: 'SECTEUR' } as AppNotification);
    expect(userServiceMock.list).toHaveBeenCalled();
  });

  it('autre catégorie ignorée', () => {
    fleetServiceMock.getTrips.calls.reset();
    userServiceMock.list.calls.reset();
    realtimeSubject.next({ category: 'NOTIF_MESSAGE' } as AppNotification);
    expect(fleetServiceMock.getTrips).not.toHaveBeenCalled();
    expect(userServiceMock.list).not.toHaveBeenCalled();
  });

  // ─── Helpers statuts ──────────────────────────────────────────
  it('isActive / isCompleted / getStatusClass / isDelayed', () => {
    expect(component.isActive('En cours')).toBeTrue();
    expect(component.isActive('ACTIF')).toBeTrue();
    expect(component.isActive('TERMINE')).toBeFalse();
    expect(component.isActive(undefined as any)).toBeFalse();

    expect(component.isCompleted('terminé')).toBeTrue();
    expect(component.isCompleted('ANNULE')).toBeFalse();

    expect(component.getStatusClass('en cours')).toBe('active');
    expect(component.getStatusClass('TERMINÉ')).toBe('completed');
    expect(component.getStatusClass('xyz')).toBe('unknown');

    expect(component.isDelayed(trip({ retardMinutes: 5 }))).toBeTrue();
    expect(component.isDelayed(trip({ retardMinutes: undefined }))).toBeFalse();
  });

  it('formatDuration couvre tous les formats', () => {
    expect(component.formatDuration(undefined)).toBe('-');
    expect(component.formatDuration(0)).toBe('-');
    expect(component.formatDuration(45)).toBe('45 min');
    expect(component.formatDuration(125)).toBe('2h 05m');
    expect(component.formatDuration(60)).toBe('1h 00m');
  });

  it('helpers chauffeurs', () => {
    const drv = mkUser({ prenom: 'Ali', nom: 'Ben', statutConducteur: 'EN_SERVICE' });

    expect(component.getDriverInitials(drv)).toBe('AB');
    expect(component.getDriverInitials(mkUser({ prenom: '', nom: '', statutConducteur: 'LIBRE' }))).toBe('CH');
    expect(component.getDriverStatusClass(drv)).toBe('drv-status--active');
    expect(component.getDriverStatusClass(mkUser({ statutConducteur: 'LIBRE' }))).toBe('drv-status--libre');
    expect(component.getDriverStatusClass(mkUser({ statutConducteur: 'X' }))).toBe('drv-status--unknown');
    expect(component.getDriverStatusLabel(drv)).toBe('En service');
    expect(component.getDriverStatusLabel(mkUser({ statutConducteur: 'LIBRE' }))).toBe('Libre');
    expect(component.getDriverStatusLabel(mkUser({ statutConducteur: 'X' }))).toBe('Inconnu');
  });

  // ─── Pointage ─────────────────────────────────────────────────
  it('clockIn puis clockOut enregistrent la session', () => {
    component.clockIn();

    expect(component.pointage.clockedIn).toBeTrue();
    expect(component.pointage.timerId).toBeTruthy();
    expect(JSON.parse(localStorage.getItem('logiway_pointage_manager') || '{}').clockedIn).toBeTrue();

    // force a positive elapsed duration so todayTotal is deterministic regardless of wall-clock speed
    component.pointage.startTime = Date.now() - 1000;
    component.clockOut();

    expect(component.pointage.clockedIn).toBeFalse();
    expect(component.pointage.timerId).toBeNull();
    expect(localStorage.getItem('logiway_pointage_manager')).toBeNull();
    const log = JSON.parse(localStorage.getItem('logiway_pointage_manager_log') || '[]');
    expect(log.length).toBe(1);
    expect(component.pointage.todayTotal).toBeGreaterThan(0);
    expect(component.pointage.sessionElapsed).toBe('00:00:00');
    expect(component.pointageTodayLabel).toContain('h');
    expect(component.pointageStatusLabel).toBe('Hors service');
    expect(component.pointageStatusClass).toBe('ptg--off');
  });

  it('togglePointage bascule selon l\'état', () => {
    component.togglePointage();
    expect(component.pointage.clockedIn).toBeTrue();

    component.togglePointage();
    expect(component.pointage.clockedIn).toBeFalse();
  });

  it('pointage actif affiche En service', () => {
    component.pointage.clockedIn = true;

    expect(component.pointageStatusLabel).toBe('En service');
    expect(component.pointageStatusClass).toBe('ptg--on');
  });

  it('restorePointage restaure une session sauvegardée', async () => {
    localStorage.setItem('logiway_pointage_manager', JSON.stringify({ clockedIn: true, startTime: Date.now() - 60000 }));

    await create();

    expect(component.pointage.clockedIn).toBeTrue();
    expect(component.pointage.timerId).toBeTruthy();

    component.ngOnDestroy();
  });

  it('restorePointage ignore un JSON corrompu', async () => {
    localStorage.setItem('logiway_pointage_manager', '{invalid json');
    localStorage.setItem('logiway_pointage_manager_log', '[{bad');

    await create();

    expect(component.pointage.clockedIn).toBeFalse();
    expect(component.pointage.todayTotal).toBe(0);
  });

  it('restorePointage cumule les durées du jour uniquement', async () => {
    const today = new Date().toISOString();
    const yesterday = new Date(Date.now() - 86400000).toISOString();
    localStorage.setItem(
      'logiway_pointage_manager_log',
      JSON.stringify([
        { date: today, duration: 3600000 },
        { date: yesterday, duration: 7200000 },
        { date: today }
      ])
    );

    await create();

    expect(component.pointage.todayTotal).toBe(3600000);
    expect(component.pointageTodayLabel).toBe('1h 00m');
  });

  it('beforeunload pendant le pointage sauvegarde la session', () => {
    component.clockIn();
    component.pointage.startTime = Date.now() - 30000;

    window.dispatchEvent(new Event('beforeunload'));

    expect(component.pointage.clockedIn).toBeFalse();
    expect(localStorage.getItem('logiway_pointage_manager')).toBeNull();
    const log = JSON.parse(localStorage.getItem('logiway_pointage_manager_log') || '[]');
    expect(log[0].duration).toBeGreaterThan(0);
  });

  it('beforeunload hors service ne fait rien', () => {
    component.pointage.clockedIn = false;

    window.dispatchEvent(new Event('beforeunload'));

    expect(localStorage.getItem('logiway_pointage_manager_log')).toBeNull();
  });

  it('déconnexion utilisateur pendant le pointage sauvegarde', () => {
    component.clockIn();
    component.pointage.startTime = Date.now() - 10000;

    currentUserSubject.next(null);

    expect(component.pointage.clockedIn).toBeFalse();
  });

  it('ngOnDestroy nettoie les timers sans erreur', () => {
    component.clockIn();

    expect(() => component.ngOnDestroy()).not.toThrow();
    expect(component.pointage.timerId).toBeTruthy();
  });

  it('le timer de pointage met à jour le compteur de session', () => {
    jest.useFakeTimers();
    try {
      component.clockIn();
      component.pointage.startTime = Date.now() - 3725000;

      jest.advanceTimersByTime(1000);

      expect(component.pointage.sessionElapsed).toMatch(/^\d{2}:\d{2}:\d{2}$/);
      expect(component.pointage.sessionElapsed.startsWith('01:02')).toBeTrue();
    } finally {
      jest.useRealTimers();
      if (component.pointage.timerId) clearInterval(component.pointage.timerId);
    }
  });

  it('aucun trajet → KPIs neutres', () => {
    component.selectedDriverId = null;
    (component as any).allTrips = [];
    (component as any).applyDriverFilter();

    expect(component.kpiTotalTrips).toBe(0);
    expect(component.kpiAvgDelay).toBe(0);
    expect(component.kpiOnTimeRate).toBe(100);
    expect(component.kpiTotalDistance).toBe(0);
  });

  it('champs manquants des trajets traités comme zéros', () => {
    component.selectedDriverId = null;
    (component as any).allTrips = [
      trip({ id: '1', distanceKm: undefined, retardMinutes: undefined }),
      trip({ id: '2', distanceKm: null, retardMinutes: null })
    ];
    (component as any).applyDriverFilter();

    expect(component.kpiTotalDistance).toBe(0);
    expect(component.kpiAvgDelay).toBe(0);
    expect(component.kpiOnTimeRate).toBe(100);
  });

  it('statuts nuls traités comme chaîne vide', () => {
    expect(component.isActive(null as any)).toBeFalse();
    expect(component.isCompleted(null as any)).toBeFalse();
    expect(component.getStatusClass(null as any)).toBe('unknown');
  });

  it('clockOut cumule avec un journal préexistant', () => {
    localStorage.setItem(
      'logiway_pointage_manager_log',
      JSON.stringify([{ date: new Date().toISOString(), duration: 60000 }])
    );

    component.clockIn();
    component.clockIn();
    component.clockOut();

    const log = JSON.parse(localStorage.getItem('logiway_pointage_manager_log') || '[]');
    expect(log.length).toBe(2);
    expect(component.pointage.todayTotal).toBeGreaterThanOrEqual(60000);
  });

  it('beforeunload avec journal existant cumule aussi', () => {
    localStorage.setItem(
      'logiway_pointage_manager_log',
      JSON.stringify([{ date: new Date(Date.now() - 86400000).toISOString(), duration: 5000 }])
    );
    component.clockIn();
    component.pointage.startTime = Date.now() - 20000;

    window.dispatchEvent(new Event('beforeunload'));

    const log = JSON.parse(localStorage.getItem('logiway_pointage_manager_log') || '[]');
    expect(log.length).toBe(2);
  });
  it('le timer horloge met à jour currentTime toutes les 30 s', () => {
    jest.useFakeTimers();
    try {
      const before = component.currentTime;
      jest.advanceTimersByTime(30000);
      expect(component.currentTime.getTime()).toBeGreaterThanOrEqual(before.getTime());
    } finally {
      jest.useRealTimers();
      if ((component as any).timeTimerId) clearInterval((component as any).timeTimerId);
    }
  });
});
