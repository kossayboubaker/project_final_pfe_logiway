import { ComponentFixture, TestBed } from '@angular/core/testing';
import { PageEvent } from '@angular/material/paginator';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { provideCharts, withDefaultRegisterables } from 'ng2-charts';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { of, throwError } from 'rxjs';
import { AuthService } from '../../../../core/auth.service';
import { LeaveService, LeaveRecord } from '../../../../core/services/leave.service';
import { LeaveChartComponent } from './leave-chart.component';

/* ─── Fixtures ─────────────────────────────────────────────────── */
let seq = 0;
const mkLeave = (over: Partial<LeaveRecord> = {}): LeaveRecord => ({
  id: `L${++seq}`,
  requesterId: 1,
  requesterName: 'Ali Ben',
  requesterEmail: 'ali@test.com',
  requesterRole: 'CHAUFFEUR',
  managerId: null,
  managerName: null,
  managerEmail: null,
  chauffeurId: null,
  chauffeurName: null,
  chauffeurEmail: null,
  type: 'VACANCES',
  typeLabel: 'Vacances',
  startDate: '15/06/2024',
  endDate: '18/06/2024',
  startDateIso: '2024-06-15',
  endDateIso: '2024-06-18',
  duration: 3,
  reason: 'Vacances été',
  status: 'APPROUVE',
  statusLabel: 'Approuvé',
  comment: '',
  createdAt: null,
  updatedAt: null,
  canEdit: false,
  canDelete: false,
  canReview: false,
  ...over
});

/** Dataset principal : 4 congés couvrant tous les statuts / types */
const mainDataset = (): LeaveRecord[] => [
  mkLeave({ id: 'L1', requesterId: 1, requesterName: 'Ali Ben', typeLabel: 'Vacances', status: 'APPROUVE', statusLabel: 'Approuvé', duration: 3, startDateIso: '2024-06-15', endDateIso: '2024-06-18', createdAt: '2024-01-01T00:00:00Z', updatedAt: '2024-01-03T00:00:00Z', managerName: 'Momo Manager' }),
  mkLeave({ id: 'L2', requesterId: 1, requesterName: 'Ali Ben', type: 'MALADIE', typeLabel: 'Maladie', status: 'REJETE', statusLabel: 'Refusé', duration: 4, startDateIso: '2024-06-20', endDateIso: '2024-06-24', createdAt: '2024-02-01T00:00:00Z', updatedAt: '2024-02-04T00:00:00Z' }),
  mkLeave({ id: 'L3', requesterId: 2, requesterName: 'Nadia B', type: 'VACANCES', typeLabel: 'Vacances', status: 'EN_ATTENTE', statusLabel: 'En attente', duration: 10, startDateIso: '2024-07-05', endDateIso: '2024-07-15', comment: null }),
  mkLeave({ id: 'L4', requesterId: 3, requesterName: 'Karim T', type: 'MARIAGE', typeLabel: 'Mariage', status: 'ANNULE', statusLabel: 'Annulé', duration: 2, startDateIso: '2024-07-10', endDateIso: '2024-07-12' })
];

describe('LeaveChartComponent', () => {
  let component: LeaveChartComponent;
  let fixture: ComponentFixture<LeaveChartComponent>;
  let authServiceMock: any;
  let leaveServiceMock: any;
  let cdrMock: any;

  /** Initialise le composant avec un jeu de données (ou une erreur) */
  const initWith = (data: LeaveRecord[]): void => {
    leaveServiceMock.getLeaves.and.returnValue(of(data));
    component.ngOnInit();
  };

  beforeEach(async () => {
    authServiceMock = {
      getUser: jasmine.createSpy('getUser').and.returnValue({ id: '1', role: 'SUPERADMIN' })
    };
    leaveServiceMock = {
      getLeaves: jasmine.createSpy('getLeaves').and.returnValue(of([]))
    };
    // CDR mocké : les appels internes cdr.detectChanges() deviennent inoffensifs
    cdrMock = {
      detectChanges: jasmine.createSpy('detectChanges'),
      markForCheck: jasmine.createSpy('markForCheck')
    };

    await TestBed.configureTestingModule({
      imports: [LeaveChartComponent],
      providers: [
        provideRouter([]),
        provideHttpClient(),
        provideHttpClientTesting(),
        provideAnimationsAsync(),
        provideCharts(withDefaultRegisterables()),
        { provide: AuthService, useValue: authServiceMock },
        { provide: LeaveService, useValue: leaveServiceMock }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(LeaveChartComponent);
    component = fixture.componentInstance;
    // Ivy ignore l'override DI de ChangeDetectorRef : on remplace la propriété
    // d'instance `cdr` (private TS = compile-time only) par un stub -> aucun
    // rendu réel du template, donc aucun canvas/chart.js impliqué.
    Object.defineProperty(component, 'cdr', { value: cdrMock, configurable: true, writable: true });
    // Pas de fixture.detectChanges() : le template n'est jamais rendu
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should route internal change detection through the cdr stub', () => {
    initWith(mainDataset());
    expect(cdrMock.detectChanges).toHaveBeenCalled();
  });

  /* ─── Chargement & erreurs ─────────────────────────────────────── */
  it('ngOnInit() should load leaves and populate state', () => {
    initWith(mainDataset());
    expect(component.allLeaves.length).toBe(4);
    expect(component.totalElements).toBe(4);
    expect(component.dataSource.length).toBe(4);
  });

  it('ngOnInit() should handle service errors gracefully', () => {
    leaveServiceMock.getLeaves.and.returnValue(throwError(() => new Error('boom')));
    component.ngOnInit();
    expect(component.allLeaves).toEqual([]);
    expect(component.dataSource).toEqual([]);
    expect(component.totalElements).toBe(0);
  });

  it('should extract requesters and deduplicate by id', () => {
    initWith(mainDataset());
    expect(component.requesters).toEqual([
      { id: '1', name: 'Ali Ben' },
      { id: '2', name: 'Nadia B' },
      { id: '3', name: 'Karim T' }
    ]);
  });

  /* ─── KPIs ─────────────────────────────────────────────────────── */
  it('should compute status KPIs correctly', () => {
    initWith(mainDataset());
    expect(component.kpiTotal).toBe(4);
    expect(component.kpiApproved).toBe(1);
    expect(component.kpiRejected).toBe(1);
    expect(component.kpiPending).toBe(1);
  });

  it('should compute average processing days from createdAt/updatedAt', () => {
    initWith(mainDataset());
    // L1: 2 jours traités, L2: 3 jours -> moyenne arrondie à 3
    expect(component.kpiAvgProcessingDays).toBe(3);
  });

  it('should ignore processed leaves without timestamps for average', () => {
    initWith([mkLeave({ status: 'REJETE', createdAt: null, updatedAt: null })]);
    expect(component.kpiAvgProcessingDays).toBe(0);
  });

  it('should clamp negative processing delays to zero', () => {
    initWith([mkLeave({ status: 'APPROUVE', createdAt: '2024-01-05T00:00:00Z', updatedAt: '2024-01-01T00:00:00Z' })]);
    expect(component.kpiAvgProcessingDays).toBe(0);
  });

  it('should compute approval rate, total leave days and avg days per leave', () => {
    initWith(mainDataset());
    expect(component.kpiApprovalRate).toBe(25);
    expect(component.totalLeaveDays).toBe(19);
    expect(component.kpiAvgDaysPerLeave).toBe(4.8);
  });

  it('should return zero KPIs for an empty dataset', () => {
    initWith([]);
    expect(component.kpiTotal).toBe(0);
    expect(component.kpiApprovalRate).toBe(0);
    expect(component.kpiAvgDaysPerLeave).toBe(0);
    expect(component.kpiAvgProcessingDays).toBe(0);
  });

  /* ─── Tendances ────────────────────────────────────────────────── */
  it('should compute trends between current and previous month', () => {
    const now = new Date();
    const pad = (n: number): string => String(n).padStart(2, '0');
    const prev = new Date(now.getFullYear(), now.getMonth() - 1, 15);
    const curIso = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-15`;
    const prevIso = `${prev.getFullYear()}-${pad(prev.getMonth() + 1)}-15`;

    initWith([
      mkLeave({ status: 'APPROUVE', startDateIso: curIso }),
      mkLeave({ status: 'EN_ATTENTE', startDateIso: curIso.replace('-15', '-16') }),
      mkLeave({ status: 'APPROUVE', startDateIso: prevIso }),
      mkLeave({ status: 'APPROUVE', startDateIso: prevIso.replace('-15', '-16') })
    ]);

    expect(component.trendTotal).toBe(0);       // 2 vs 2
    expect(component.trendApproved).toBe(-50);  // 1 vs 2
    expect(component.trendPending).toBe(100);   // 1 vs 0 -> branche previous===0
  });

  it('should compute a negative trend when activity decreases', () => {
    const now = new Date();
    const pad = (n: number): string => String(n).padStart(2, '0');
    const prev = new Date(now.getFullYear(), now.getMonth() - 1, 15);
    const curIso = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-15`;
    const prevIso = `${prev.getFullYear()}-${pad(prev.getMonth() + 1)}-15`;

    initWith([
      mkLeave({ startDateIso: curIso }),
      mkLeave({ startDateIso: prevIso }),
      mkLeave({ startDateIso: prevIso.replace('-15', '-16') })
    ]);

    expect(component.trendTotal).toBe(-50); // 1 vs 2
  });

  it('should return 0 trend when both periods are empty', () => {
    initWith([mkLeave({ startDateIso: '' })]); // exclu des deux périodes
    expect(component.trendTotal).toBe(0);
    expect(component.trendApproved).toBe(0);
    expect(component.trendRejected).toBe(0);
    expect(component.trendPending).toBe(0);
  });

  /* ─── Mois de pic & top chauffeurs ─────────────────────────────── */
  it('should compute peak month', () => {
    initWith(mainDataset()); // juin: 2, juillet: 2 -> premier max conservé
    expect(component.peakMonth).toBe('Juin');
    expect(component.peakMonthCount).toBe(2);
  });

  it('should aggregate, sort and limit top drivers to 5', () => {
    const many = [
      mkLeave({ requesterId: 1, requesterName: 'D1', duration: 1, startDateIso: '2024-06-01' }),
      mkLeave({ requesterId: 2, requesterName: 'D2', duration: 2, startDateIso: '2024-06-02' }),
      mkLeave({ requesterId: 3, requesterName: 'D3', duration: 3, startDateIso: '2024-06-03' }),
      mkLeave({ requesterId: 4, requesterName: 'D4', duration: 4, startDateIso: '2024-06-04' }),
      mkLeave({ requesterId: 5, requesterName: 'D5', duration: 5, startDateIso: '2024-06-05' }),
      mkLeave({ requesterId: 6, requesterName: 'D6', duration: 6, startDateIso: '2024-06-06' })
    ];
    initWith(many);
    expect(component.topDrivers.length).toBe(5);
    expect(component.topDrivers[0]).toEqual(jasmine.objectContaining({ name: 'D6', totalDays: 6, leaveCount: 1 }));
    // pourcentage : 6/21 -> 29%
    expect(component.topDrivers[0].percentage).toBe(29);
  });

  /* ─── Graphiques ───────────────────────────────────────────────── */
  it('should split monthly chart into short (≤7j) and long (>7j) leaves', () => {
    initWith(mainDataset());
    const partial = component.monthlyChartData.datasets[0].data as number[];
    const full = component.monthlyChartData.datasets[1].data as number[];
    expect(partial[5]).toBe(2); // juin : L1(3j) + L2(4j)
    expect(full[6]).toBe(1);    // juillet : L3(10j)
  });

  it('should build status chart data in canonical order', () => {
    initWith(mainDataset());
    expect(component.statusChartData.labels).toEqual(['Approuvé', 'Refusé', 'En attente', 'Annulé']);
    expect(component.statusChartData.datasets[0].data).toEqual([1, 1, 1, 1]);
  });

  it('monthly tooltip afterBody callback should append the click hint', () => {
    initWith(mainDataset());
    const callbacks: any = component.monthlyChartOptions!.plugins!.tooltip!.callbacks;
    expect(callbacks.afterBody()).toEqual(['', '🖱️ Cliquez pour voir les détails']);
  });

  it('should build type chart ignoring unknown labels', () => {
    initWith([
      mkLeave({ typeLabel: 'Vacances' }),
      mkLeave({ typeLabel: 'Maladie' }),
      mkLeave({ typeLabel: 'Inconnu' })
    ]);
    expect(component.typeChartData.labels).toEqual(['Vacances', 'Maladie', 'Mariage']);
    expect(component.typeChartData.datasets[0].data as number[]).toEqual([1, 1, 0]);
  });

  /* ─── Getters ──────────────────────────────────────────────────── */
  it('hasActiveFilters should be false initially', () => {
    expect(component.hasActiveFilters).toBeFalse();
  });

  it('hasActiveFilters should be true when any filter is set', () => {
    component.selectedStatus = 'APPROUVE';
    expect(component.hasActiveFilters).toBeTrue();
    component.selectedStatus = '';
    component.selectedType = 'MALADIE';
    expect(component.hasActiveFilters).toBeTrue();
    component.selectedType = '';
    component.filterDateFrom = '2024-06-01';
    expect(component.hasActiveFilters).toBeTrue();
    component.filterDateFrom = '';
    component.filterDateTo = '2024-06-30';
    expect(component.hasActiveFilters).toBeTrue();
    component.filterDateTo = '';
    component.selectedRequester = '2';
    expect(component.hasActiveFilters).toBeTrue();
  });

  it('activeFilterCount should sum active filters', () => {
    component.selectedStatus = 'APPROUVE';
    component.selectedRequester = '2';
    expect(component.activeFilterCount).toBe(2);
  });

  it('userRole should come from AuthService', () => {
    expect(component.userRole).toBe('SUPERADMIN');
  });

  it('userRole should fallback to CHAUFFEUR when user is null', () => {
    authServiceMock.getUser.and.returnValue(null);
    expect(component.userRole).toBe('CHAUFFEUR');
  });

  /* ─── Helpers d'affichage ──────────────────────────────────────── */
  it('getStatusIcon() should cover all statuses plus default', () => {
    expect(component.getStatusIcon('APPROUVE')).toBe('check_circle');
    expect(component.getStatusIcon('REJETE')).toBe('cancel');
    expect(component.getStatusIcon('EN_ATTENTE')).toBe('pending');
    expect(component.getStatusIcon('ANNULE')).toBe('block');
    expect(component.getStatusIcon('INCONNU' as any)).toBe('help');
  });

  it('getStatusColorClass() should cover all statuses plus default', () => {
    expect(component.getStatusColorClass('APPROUVE')).toBe('dd-status--approved');
    expect(component.getStatusColorClass('REJETE')).toBe('dd-status--rejected');
    expect(component.getStatusColorClass('EN_ATTENTE')).toBe('dd-status--pending');
    expect(component.getStatusColorClass('ANNULE')).toBe('dd-status--cancelled');
    expect(component.getStatusColorClass('INCONNU' as any)).toBe('');
  });

  it('getTypeIcon() should map known types plus default', () => {
    expect(component.getTypeIcon('Vacances')).toBe('beach_access');
    expect(component.getTypeIcon('Maladie')).toBe('local_hospital');
    expect(component.getTypeIcon('Mariage')).toBe('favorite');
    expect(component.getTypeIcon('Autre')).toBe('event_busy');
  });

  it('trackByLeaveId() should return the leave id', () => {
    expect(component.trackByLeaveId(0, mkLeave({ id: 'L99' }))).toBe('L99');
  });

  it('should map table rows with fallbacks', () => {
    initWith([
      mkLeave({ id: 'L1', comment: '', managerName: null }),          // '-' fallbacks
      mkLeave({ id: 'L2', status: 'REJETE', statusLabel: 'Refusé' }),
      mkLeave({ id: 'L3', status: 'EN_ATTENTE', statusLabel: 'En attente' }),
      mkLeave({ id: 'L4', status: 'ANNULE', statusLabel: 'Annulé' }),
      mkLeave({ id: 'L5', status: 'AUTRE' as any, statusLabel: 'Autre' })
    ]);
    const rows = component.dataSource;
    expect(rows[0].comment).toBe('-');
    expect(rows[0].approver).toBe('-');
    expect(rows[0].statusClass).toBe('approved');
    expect(rows[1].statusClass).toBe('rejected');
    expect(rows[2].statusClass).toBe('pending');
    expect(rows[3].statusClass).toBe('cancelled');
    expect(rows[4].statusClass).toBe('unknown');
    expect(rows[0].type).toBe('Vacances');
  });

  /* ─── Drill-down ───────────────────────────────────────────────── */
  it('openDrillDown() should populate drill-down data for a month', () => {
    initWith(mainDataset());
    component.openDrillDown(5); // juin
    expect(component.drillDownOpen).toBeTrue();
    expect(component.drillDownData!.monthLabel).toBe('Juin');
    expect(component.drillDownData!.monthIndex).toBe(5);
    expect(component.drillDownData!.leaves.length).toBe(2);
    expect(component.drillDownData!.totalDays).toBe(7);
    expect(component.drillDownData!.approvedCount).toBe(1);
    expect(component.drillDownData!.rejectedCount).toBe(1);
    expect(component.drillDownData!.pendingCount).toBe(0);
  });

  it('closeDrillDown() should reset the panel', () => {
    initWith(mainDataset());
    component.openDrillDown(5);
    component.closeDrillDown();
    expect(component.drillDownOpen).toBeFalse();
    expect(component.drillDownData).toBeNull();
  });

  it('monthly chart onClick should open/close drill-down depending on elements', () => {
    initWith(mainDataset());
    const onClick = component.monthlyChartOptions!.onClick as any;

    onClick({}, []);
    expect(component.drillDownOpen).toBeFalse();

    onClick({}, [{ index: 5 }]);
    expect(component.drillDownOpen).toBeTrue();
  });

  /* ─── Filtres & pagination ─────────────────────────────────────── */
  it('onStatusChange() should filter rows and reset page index', () => {
    initWith(mainDataset());
    component.pageIndex = 1;
    component.onStatusChange('APPROUVE');
    expect(component.pageIndex).toBe(0);
    expect(component.kpiTotal).toBe(1);
    expect(component.dataSource.length).toBe(1);
    expect(component.dataSource[0].id).toBe('L1');
  });

  it('onTypeChange() should filter by type', () => {
    initWith(mainDataset());
    component.onTypeChange('MALADIE');
    expect(component.totalElements).toBe(1);
    expect(component.dataSource[0].type).toBe('Maladie');
  });

  it('onDateFromChange() should exclude earlier leaves', () => {
    initWith(mainDataset());
    component.onDateFromChange('2024-06-18');
    expect(component.totalElements).toBe(3);
  });

  it('onDateToChange() should exclude later leaves', () => {
    initWith(mainDataset());
    component.onDateToChange('2024-06-18');
    expect(component.totalElements).toBe(1);
  });

  it('onRequesterChange() should filter by requester id', () => {
    initWith(mainDataset());
    component.onRequesterChange('2');
    expect(component.totalElements).toBe(1);
    expect(component.requesters.find(r => r.id === '2')!.name).toBe('Nadia B');
  });

  it('date filters should ignore leaves without startDateIso', () => {
    initWith([mkLeave({ startDateIso: '' })]);
    component.onDateFromChange('2024-01-01');
    // pas de date de départ -> la garde `startDate` ne filtre pas le congé
    expect(component.totalElements).toBe(1);
  });

  it('clearFilters() should reset every filter and restore data', () => {
    initWith(mainDataset());
    component.onStatusChange('APPROUVE');
    component.onTypeChange('VACANCES');
    component.clearFilters();
    expect(component.selectedStatus).toBe('');
    expect(component.selectedType).toBe('');
    expect(component.filterDateFrom).toBe('');
    expect(component.filterDateTo).toBe('');
    expect(component.selectedRequester).toBe('');
    expect(component.pageIndex).toBe(0);
    expect(component.totalElements).toBe(4);
    expect(component.hasActiveFilters).toBeFalse();
  });

  it('onPageChange() should paginate the table', () => {
    const twelve = Array.from({ length: 12 }, (_, i) => mkLeave({ id: `P${i}`, requesterId: i + 1, requesterName: `R${i}` }));
    initWith(twelve);
    expect(component.totalElements).toBe(12);
    expect(component.dataSource.length).toBe(10);

    const ev: PageEvent = { pageIndex: 1, pageSize: 10, previousPageIndex: 0, length: 12 };
    component.onPageChange(ev);
    expect(component.pageIndex).toBe(1);
    expect(component.pageSize).toBe(10);
    expect(component.dataSource.length).toBe(2);
  });
});
