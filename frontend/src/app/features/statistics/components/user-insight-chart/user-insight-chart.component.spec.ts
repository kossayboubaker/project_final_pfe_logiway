import { ComponentFixture, TestBed } from '@angular/core/testing';
import { UserInsightChartComponent } from './user-insight-chart.component';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { provideCharts, withDefaultRegisterables } from 'ng2-charts';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { AuthService } from '../../../../core/auth.service';
import { UserService } from '../../../../core/services/user.service';
import { of, throwError } from 'rxjs';

describe('UserInsightChartComponent', () => {
  let component: UserInsightChartComponent;
  let fixture: ComponentFixture<UserInsightChartComponent>;
  let userServiceMock: any;
  let usersFixture: any[];

  const dAgo = (days: number): string =>
    new Date(Date.now() - days * 86400000 - 3600000).toISOString();

  /** Jeu de données couvrant toutes les classes de notation S/A/B/C/D/F. */
  const ratingCrew = (): any[] => [
    { id: 1, prenom: 'Ali', nom: 'Admin', email: 'ali@x.tn', role: 'SUPERADMIN', estActif: true, emailVerifie: true, dateCreation: dAgo(91), secteurNom: 'Tunis' },
    { id: 2, prenom: 'Sam', nom: 'Chauffeur', email: 'sam@x.tn', role: 'CHAUFFEUR', estActif: 'ACTIF', emailVerifie: false, dateCreation: dAgo(31) },
    { id: 3, prenom: 'Leila', nom: 'Pending', email: 'leila@x.tn', role: 'SUPERADMIN', estActif: false, emailVerifie: false, dateCreation: dAgo(91) },
    { id: 4, prenom: 'Marc', nom: 'Rejected', email: 'marc@x.tn', role: 'SUPERADMIN', estActif: 'REJECTED', emailVerifie: true, dateCreation: dAgo(91) },
    { id: 5, prenom: 'Nina', nom: 'Rejetee', email: 'nina@x.tn', role: 'CHAUFFEUR', estActif: 'Rejeté', emailVerifie: true, dateCreation: dAgo(5) },
    { id: 6, prenom: 'Omar', nom: 'Instable', email: 'omar@x.tn', role: 'CHAUFFEUR', estActif: 'REJETE', emailVerifie: false, dateCreation: dAgo(5) }
  ];

  beforeEach(async () => {
    usersFixture = [];

    const authServiceMock = {
      getUser: jasmine.createSpy('getUser').and.returnValue({ id: '1', role: 'SUPERADMIN' })
    };
    userServiceMock = {
      list: jasmine.createSpy('list').and.callFake(() => of(usersFixture))
    };

    await TestBed.configureTestingModule({
      imports: [UserInsightChartComponent],
      providers: [
        provideRouter([]),
        provideHttpClient(),
        provideHttpClientTesting(),
        provideAnimationsAsync(),
        provideCharts(withDefaultRegisterables()),
        { provide: AuthService, useValue: authServiceMock },
        { provide: UserService, useValue: userServiceMock }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(UserInsightChartComponent);
    component = fixture.componentInstance;
    (component as any).cdr = {
      detectChanges: jasmine.createSpy('detectChanges'),
      markForCheck: jasmine.createSpy('markForCheck')
    };
    fixture.detectChanges();
  });

  function loadRaw(raw: any[]): void {
    usersFixture = raw;
    (component as any).loadUsers();
  }

  function loadRatingCrew(): void {
    loadRaw(ratingCrew());
    // Rendre le 6e utilisateur instable -> discipline minimale -> classe F
    component.userChangeCountMap.set(6, 6);
    component.refreshAll();
  }

  // ─── Cycle de vie / chargement ─────────────────────────────────

  it('should create and load users on init', () => {
    expect(component).toBeTruthy();
    expect(userServiceMock.list).toHaveBeenCalled();
  });

  it('should reset users on load error', () => {
    (userServiceMock.list as any).and.returnValue(throwError(() => new Error('ko')));
    (component as any).loadUsers();
    expect(component.allUsers).toEqual([]);
  });

  it('should complete destroy$ on ngOnDestroy', () => {
    expect(() => component.ngOnDestroy()).not.toThrow();
  });

  it('should map raw users with status variants and name fallbacks', () => {
    loadRaw([
      { id: 1, prenom: 'Ali', nom: 'Ben', email: 'a@x.tn', role: 'MANAGER', estActif: true },
      { id: 2, prenom: '', nom: '', email: 'b@x.tn', role: undefined, estActif: 'Actif' },
      { id: 3, prenom: 'C', nom: 'D', email: 'c@x.tn', estActif: undefined, dateCreation: '2024-01-15T00:00:00Z' }
    ]);

    const mapped = component.allUsers;
    expect(mapped[0].name).toBe('Ali Ben');
    expect(mapped[0].estActif).toBe('ACTIF');
    expect(mapped[0].role).toBe('MANAGER');
    expect(mapped[1].name).toBe('b@x.tn');
    expect(mapped[1].role).toBe('CHAUFFEUR');
    expect(mapped[1].estActif).toBe('ACTIF');
    expect(mapped[2].estActif).toBe('INACTIF');
    expect(mapped[2].dateCreation).toEqual(new Date('2024-01-15T00:00:00Z'));
    expect(mapped.every((u: any) => u.dateCreation instanceof Date)).toBeTrue();
  });

  it('should assign default sectors only when none is real', () => {
    loadRaw([
      { id: 1, prenom: 'A', nom: 'B', email: 'a@x.tn', secteurNom: 'Sidi Bouzid' },
      { id: 2, prenom: 'C', nom: 'D', email: 'c@x.tn', secteurNom: 'Sans secteur' }
    ]);
    expect(component.allUsers[0].secteurNom).toBe('Sidi Bouzid');
    expect(component.allUsers[1].secteurNom).toBe('Sans secteur');

    loadRaw([
      { id: 1, prenom: 'A', nom: 'B', email: 'a@x.tn', secteurNom: 'Sans secteur' },
      { id: 2, prenom: 'C', nom: 'D', email: 'c@x.tn' },
      { id: 3, prenom: 'E', nom: 'F', email: 'e@x.tn' },
      { id: 4, prenom: 'G', nom: 'H', email: 'g@x.tn' },
      { id: 5, prenom: 'I', nom: 'J', email: 'i@x.tn' }
    ]);
    const secteurs = component.allUsers.map((u: any) => u.secteurNom);
    expect(secteurs).toEqual([
      'Tunis Centre', 'Sfax Maritime', 'Sousse Port', 'Nord-Ouest', 'Tunis Centre'
    ]);
  });

  // ─── KPIs ──────────────────────────────────────────────────────

  it('should compute KPIs including retention, session trend and avg rating', () => {
    loadRatingCrew();

    expect(component.kpiTotal).toBe(6);
    expect(component.kpiActive).toBe(2);
    expect(component.kpiPending).toBe(1);
    expect(component.kpiRejected).toBe(3);
    expect(component.kpiRetentionRate).toBe(66.7);
    expect(component.kpiAvgSessionDuration).toBeGreaterThan(15);
    expect(component.trendSession).toBe(3.5);

    const scores = component.userRatings.map(r => r.totalScore);
    const expectedAvg = Math.round((scores.reduce((a, b) => a + b, 0) / scores.length) * 10) / 10;
    expect(component.kpiAvgRatingScore).toBe(expectedAvg);
  });

  it('should switch the session trend below 15 min average', () => {
    loadRatingCrew();
    component.onRoleChange('CHAUFFEUR');

    expect(component.kpiAvgSessionDuration).toBeLessThan(15);
    expect(component.trendSession).toBe(-2.1);
  });

  it('should return zero delay when no pending accounts', () => {
    loadRaw([ratingCrew()[0]]);
    expect(component.kpiAvgApprovalDelay).toBe(0);
    expect(component.kpiRetentionRate).toBe(100);
  });

  // ─── Notations utilisateurs ────────────────────────────────────

  it('should grade every rating class from S to F', () => {
    loadRatingCrew();

    const byId = (id: number) => component.getUserRating(id)!;

    expect(byId(1).rating).toBe('S');
    expect(byId(1).ratingColor).toBe('#a78bfa');
    expect(byId(2).rating).toBe('A');
    expect(byId(2).attendanceScore).toBe(34);
    expect(byId(3).rating).toBe('B');
    expect(byId(4).rating).toBe('C');
    expect(byId(5).rating).toBe('D');
    expect(byId(6).rating).toBe('F');
    expect(byId(6).ratingColor).toBe('#ef4444');
    expect(byId(6).disciplineScore).toBe(10);
    expect(component.userRatings[0].totalScore).toBeGreaterThanOrEqual(
      component.userRatings[component.userRatings.length - 1].totalScore
    );
  });

  it('should cap presence bonus for unknown roles', () => {
    loadRaw([{ id: 9, prenom: 'Z', nom: 'X', email: 'z@x.tn', role: 'AUTRE', estActif: 'REJETE' }]);
    const rating = component.getUserRating(9)!;
    expect(rating.presenceScore).toBe(20);
  });

  // ─── Top utilisateurs ──────────────────────────────────────────

  it('should build top active users sorted by sessions', () => {
    loadRatingCrew();

    expect(component.topUsers.length).toBe(2);
    expect(component.topUsers[0].id).toBe(1);
    expect(component.topUsers[0].sessions).toBe(Math.floor(Math.min(91, 30) * 3.5));
    expect(component.topUsers[0].roleLabel).toBe('SuperAdmin');
    expect(component.topUsers[1].lastActive).toBe('Il y a 7 jour(s)');
    expect(component.topUsers.map(u => u.sessions)).toEqual(
      [...component.topUsers.map(u => u.sessions)].sort((a, b) => b - a)
    );
  });

  it('should label recent activity for brand-new accounts', () => {
    loadRaw([
      { id: 1, prenom: 'New', nom: 'Today', email: 'n@x.tn', role: 'MANAGER', estActif: true, dateCreation: dAgo(0) },
      { id: 2, prenom: 'Yest', nom: 'Erd', email: 'y@x.tn', role: 'MANAGER', estActif: true, dateCreation: dAgo(1) }
    ]);

    // Tri par sessions d\u00e9croissantes : le compte d'hier (2 sessions) passe devant
    const today = component.topUsers.find(u => u.name === 'New Today')!;
    const yesterday = component.topUsers.find(u => u.name === 'Yest Erd')!;
    expect(today.lastActive).toBe('Il y a quelques minutes');
    expect(yesterday.lastActive).toBe('Hier');
    expect(today.sessions).toBe(0);
    expect(yesterday.sessions).toBe(2);
  });

  // ─── Charts ────────────────────────────────────────────────────

  it('should build the stacked area chart and toggle role on click', () => {
    loadRatingCrew();

    expect(component.stackedAreaData.labels!.length).toBe(7);
    expect((component.stackedAreaData.datasets![0] as any).data.length).toBe(7);
    expect((component.stackedAreaData.datasets![0] as any).data[0]).toBe(Math.round(2.5 * 1));

    component.stackedAreaOptions.onClick(null, []);
    expect(component.filterRole).toBe('');

    component.stackedAreaOptions.onClick(null, [{ datasetIndex: 0 }]);
    expect(component.filterRole).toBe('CHAUFFEUR');
    component.stackedAreaOptions.onClick(null, [{ datasetIndex: 0 }]);
    expect(component.filterRole).toBe('');
    component.stackedAreaOptions.onClick(null, [{ datasetIndex: 1 }]);
    expect(component.filterRole).toBe('MANAGER');
    component.stackedAreaOptions.onClick(null, [{ datasetIndex: 1 }]);
    expect(component.filterRole).toBe('');

    component.clearFilters();

    const ev: any = { native: { target: { style: {} } } };
    component.stackedAreaOptions.onHover(ev, [{ x: 1 }]);
    expect(ev.native.target.style.cursor).toBe('pointer');
    component.stackedAreaOptions.onHover(ev, []);
    expect(ev.native.target.style.cursor).toBe('default');
    expect(() => component.stackedAreaOptions.onHover({}, [])).not.toThrow();
  });

  it('should build the role donut with click toggles and tooltip label', () => {
    loadRatingCrew();

    expect(component.donutData.labels).toEqual(['SuperAdmin', 'Manager', 'Chauffeur']);
    expect(component.donutData.datasets![0].data).toEqual([3, 0, 3]);

    component.donutOptions.onClick(null, [{ index: 0 }]);
    expect(component.filterRole).toBe('SUPERADMIN');
    component.donutOptions.onClick(null, [{ index: 0 }]);
    expect(component.filterRole).toBe('');
    component.donutOptions.onClick(null, [{ index: 9 }]);
    expect(component.filterRole).toBe('');
    component.donutOptions.onClick(null, [{ index: 1 }]);
    expect(component.filterRole).toBe('MANAGER');
    component.donutOptions.onClick(null, [{ index: 1 }]);
    expect(component.filterRole).toBe('');

    const label = component.donutOptions.plugins.tooltip.callbacks.label;
    expect(label({ label: 'Manager', parsed: 2 })).toBe(' Manager : 2 utilisateur(s)');

    const ev: any = { native: { target: { style: {} } } };
    component.donutOptions.onHover(ev, [{}]);
    expect(ev.native.target.style.cursor).toBe('pointer');
    expect(() => component.donutOptions.onHover({}, [])).not.toThrow();
  });

  it('should build the monthly status bar with approval-delay curve', () => {
    loadRatingCrew();

    expect(component.barChartData.labels!.length).toBe(6);
    expect(component.barChartData.datasets!.length).toBe(4);

    const lineDs = component.barChartData.datasets![3] as any;
    expect(lineDs.type).toBe('line');
    expect(lineDs.data[5]).toBe(component.kpiAvgApprovalDelay);
    expect(lineDs.data[0]).toBe(Math.round(component.kpiAvgApprovalDelay * 1.5 * 10) / 10);

    const pendingDs = component.barChartData.datasets!.find((d: any) => d.label === 'En attente') as any;
    expect(pendingDs.data.some((v: number) => v > 0)).toBeTrue();
  });

  it('should toggle status filters from bar clicks and hover cursor', () => {
    loadRatingCrew();

    component.barChartOptions.onClick(null, [{ datasetIndex: 0 }]);
    expect(component.filterStatus).toBe('ACTIF');
    component.barChartOptions.onClick(null, [{ datasetIndex: 0 }]);
    expect(component.filterStatus).toBe('');
    component.barChartOptions.onClick(null, [{ datasetIndex: 1 }]);
    expect(component.filterStatus).toBe('INACTIF');
    component.barChartOptions.onClick(null, [{ datasetIndex: 1 }]);
    expect(component.filterStatus).toBe('');
    component.barChartOptions.onClick(null, [{ datasetIndex: 2 }]);
    expect(component.filterStatus).toBe('REJETE');
    component.barChartOptions.onClick(null, [{ datasetIndex: 2 }]);
    expect(component.filterStatus).toBe('');
    component.barChartOptions.onClick(null, []);
    expect(component.filterStatus).toBe('');

    const ev: any = { native: { target: { style: {} } } };
    component.barChartOptions.onHover(ev, [{}]);
    expect(ev.native.target.style.cursor).toBe('pointer');
    expect(() => component.barChartOptions.onHover({}, [])).not.toThrow();

    const cb = component.barChartOptions.plugins.tooltip.callbacks.label;
    expect(cb({ dataset: { type: 'line', label: 'D\u00e9lai' }, parsed: { y: 3 } })).toBe(' D\u00e9lai: 3 jours');
    expect(cb({ dataset: { type: 'bar', label: 'Actif' }, parsed: { y: 4 } })).toBe(' Actif: 4 utilisateur(s)');
  });

  // ─── Drill-downs ───────────────────────────────────────────────

  it('should open a user drill-down with rating, logs and stats', () => {
    loadRatingCrew();

    component.openUserDrillDown(component.filteredUsers[0]);

    expect(component.drillDownOpen).toBeTrue();
    expect(component.drillDownType).toBe('user');
    expect(component.drillDownTitle).toContain('D\u00e9tails - ');
    expect(component.drillDownData.rating.userId).toBe(1);
    expect(Array.isArray(component.drillDownData.logs)).toBeTrue();
    expect(component.drillDownData.stats.daysSinceCreation).toBeGreaterThan(80);
    expect(component.drillDownData.stats.currentStatus).toBe('Actif');
    expect(component.drillDownData.stats.roleLabel).toBe('SuperAdmin');
  });

  it('should open kpi drill-downs of every type', () => {
    loadRatingCrew();

    const cases: [any, string, number][] = [
      ['total', 'Tous les utilisateurs', 6],
      ['active', 'Utilisateurs actifs', 2],
      ['pending', 'Comptes en attente', 1],
      ['rejected', 'Comptes rejet\u00e9s / d\u00e9sactiv\u00e9s', 3]
    ];

    cases.forEach(([type, title, count]) => {
      component.openKpiDrillDown(type);
      expect(component.drillDownType).toBe('kpi');
      expect(component.drillDownTitle).toBe(title);
      expect(component.drillDownData.users.length).toBe(count);
      expect(component.drillDownSearchQuery).toBe('');
      expect(component.drillDownData.users[0].statusLabel).toBeDefined();
    });
  });

  it('should open a status drill-down over matching logs', () => {
    loadRatingCrew();
    const actifLogs = component.allLogs.filter(l => l.newStatus === 'Actif');
    expect(actifLogs.length).toBeGreaterThan(0);

    component.openStatusDrillDown('Actif');

    expect(component.drillDownType).toBe('status');
    expect(component.drillDownTitle).toBe('Historique - Actif');
    expect(component.drillDownData.count).toBe(actifLogs.length);
    expect(component.drillDownData.logs).toEqual(actifLogs);
  });

  it('should close drill-downs and reset every state field', () => {
    loadRatingCrew();
    component.openKpiDrillDown('total');
    component.drillDownSearchQuery = 'abc';

    component.closeDrillDown();

    expect(component.drillDownOpen).toBeFalse();
    expect(component.drillDownType).toBeNull();
    expect(component.drillDownData).toBeNull();
    expect(component.drillDownTitle).toBe('');
    expect(component.drillDownSearchQuery).toBe('');
  });

  it('should filter drill-down users by query on name or email', () => {
    loadRatingCrew();
    component.openKpiDrillDown('total');

    expect(component.getFilteredDrillDownUsers().length).toBe(6);

    component.onDrillDownSearch({ target: { value: 'ali' } } as any);
    expect(component.getFilteredDrillDownUsers().map((u: any) => u.id)).toEqual([1]);

    component.onDrillDownSearch({ target: { value: 'OMAR@X' } } as any);
    expect(component.getFilteredDrillDownUsers().map((u: any) => u.id)).toEqual([6]);

    component.onDrillDownSearch({ target: { value: 'inconnu' } } as any);
    expect(component.getFilteredDrillDownUsers()).toEqual([]);

    component.drillDownData = null;
    expect(component.getFilteredDrillDownUsers()).toEqual([]);
  });

  it('should resolve ratings and users through helpers', () => {
    loadRatingCrew();

    expect(component.getUserRating(999)).toBeUndefined();
    expect(component.findUserByName('Omar Instable')!.id).toBe(6);
    expect(component.findUserByName('Inconnu')).toBeUndefined();
  });

  // ─── Logs & pagination ─────────────────────────────────────────

  it('should generate status-change logs per user lifecycle', () => {
    loadRatingCrew();

    expect(component.allLogs.length).toBeGreaterThan(0);
    // Index 0 + ACTIF : s\u00e9quence compl\u00e8te INACTIF \u2192 ACTIF \u2192 INACTIF \u2192 ACTIF
    expect(component.userChangeCountMap.get(1)).toBe(3);
    expect(component.userChangeCountMap.get(2)).toBe(1);
    expect(component.userChangeCountMap.get(3)).toBe(1);
    expect(component.logTotalElements).toBe(component.allLogs.length);
    expect(component.logDataSource.length).toBeLessThanOrEqual(5);
    expect(component.allLogs).toEqual(
      [...component.allLogs].sort((a, b) => b.date.localeCompare(a.date))
    );
  });

  it('should paginate logs and filter them along with users', () => {
    loadRatingCrew();

    component.onLogPageChange({ pageIndex: 1, pageSize: 2 } as any);
    expect(component.logPageIndex).toBe(1);
    expect(component.logPageSize).toBe(2);
    expect(component.logDataSource.length).toBe(2);

    component.onLogPageChange({ pageIndex: 0, pageSize: 5 } as any);
    component.onRoleChange('CHAUFFEUR');

    const driverNames = new Set(
      component.allUsers.filter((u: any) => u.role === 'CHAUFFEUR').map((u: any) => u.name)
    );
    component.logDataSource.forEach(log => {
      expect(driverNames.has(log.userName)).toBeTrue();
    });

    component.onStatusChange('REJETE');
    const rejectedIds = new Set(
      component.allUsers.filter((u: any) => u.estActif === 'REJETE').map((u: any) => u.name)
    );
    component.logDataSource.forEach(log => {
      expect(rejectedIds.has(log.userName)).toBeTrue();
    });
  });

  it('should tolerate a null users payload', () => {
    (userServiceMock.list as any).and.returnValue(of(null));
    (component as any).loadUsers();
    expect(component.allUsers).toEqual([]);
  });

  it('should survive missing creation dates and orphaned logs', () => {
    loadRatingCrew();

    const ghost = component.allUsers.find((u: any) => u.id === 2);
    ghost.dateCreation = undefined;
    component.refreshAll();

    expect(component.topUsers.some(u => u.id === 2)).toBeTrue();
    component.openUserDrillDown(ghost as any);
    expect(component.drillDownData.stats.daysSinceCreation).toBe(0);

    component.allUsers = component.allUsers.filter((u: any) => u.id !== 2);
    component.refreshAll();
    expect(component.logDataSource.length).toBeGreaterThan(0);
  });

  it('should apply fallbacks for an injected user without tracked stats', () => {
    loadRatingCrew();

    component.allUsers.push({
      id: 99, prenom: 'Hors', nom: 'Map', name: 'Hors Map', email: 'h@x.tn',
      role: 'AUDITEUR', estActif: 'ACTIF', dateCreation: new Date(dAgo(10)), secteurNom: 'X'
    } as any);

    component.refreshAll();

    const outsider = component.topUsers.find(u => u.id === 99)!;
    expect(outsider.sessions).toBe(Math.floor(10 * 2));
    expect(outsider.totalTimeMin).toBe(Math.floor(10 * 2) * 15);
    expect(outsider.roleLabel).toBe('AUDITEUR');
    expect(component.getUserRating(99)!.disciplineScore).toBe(30);
    expect(component.getUserRating(99)!.presenceScore).toBe(20);

    component.openUserDrillDown(component.allUsers[component.allUsers.length - 1] as any);
    expect(component.drillDownData.stats.statusChanges).toBe(0);
  });

  // ─── Helpers UI ────────────────────────────────────────────────

  it('should map roles and statuses to labels, classes and durations', () => {
    expect(component.getRoleLabel('SUPERADMIN')).toBe('SuperAdmin');
    expect(component.getRoleLabel('MANAGER')).toBe('Manager');
    expect(component.getRoleLabel('CHAUFFEUR')).toBe('Chauffeur');
    expect(component.getRoleLabel('AUTRE')).toBe('AUTRE');

    expect(component.getStatusLabel('ACTIF')).toBe('Actif');
    expect(component.getStatusLabel('INACTIF')).toBe('En attente');
    expect(component.getStatusLabel('REJETE')).toBe('Rejet\u00e9 / D\u00e9sactiv\u00e9');
    expect(component.getStatusLabel('AUTRE')).toBe('AUTRE');

    expect(component.getRoleClass('SUPERADMIN')).toBe('role--admin');
    expect(component.getRoleClass('MANAGER')).toBe('role--manager');
    expect(component.getRoleClass('CHAUFFEUR')).toBe('role--driver');
    expect(component.getRoleClass('AUTRE')).toBe('');

    expect(component.getStatusClass('ACTIF')).toBe('status--active');
    expect(component.getStatusClass('En attente')).toBe('status--pending');
    expect(component.getStatusClass('Rejet\u00e9')).toBe('status--rejected');
    expect(component.getStatusClass('Inscription')).toBe('status--disabled');
    expect(component.getStatusClass('?')).toBe('');

    expect(component.formatMin(65)).toBe('1h 5m');
    expect(component.formatMin(45)).toBe('45m');
  });
});
