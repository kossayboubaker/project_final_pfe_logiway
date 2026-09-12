import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { provideCharts, withDefaultRegisterables } from 'ng2-charts';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { of, throwError } from 'rxjs';
import { NotificationService, AppNotification } from '../../../../core/services/notification.service';
import { NotificationChartComponent } from './notification-chart.component';

/* ─── Fixtures ─────────────────────────────────────────────────── */
let seq = 0;
const mkNotif = (over: Partial<AppNotification> = {}): AppNotification => ({
  id: `n${++seq}`,
  title: 'Titre',
  message: `Message ${seq}`,
  type: 'INFO',
  category: 'NOTIF_TRAJET',
  time: '05/06/2024 08:00:00',
  date: new Date('2024-06-05T08:00:00'),
  isRead: false,
  dismissed: false,
  tone: 'INFO',
  ...over
});

/** Dataset principal : 2 jours, tous les tons représentés */
const mainDataset = (): AppNotification[] => [
  mkNotif({ id: 'n1', date: new Date('2024-06-05T08:00:00'), tone: 'INFO', category: 'NOTIF_TRAJET' }),
  mkNotif({ id: 'n2', date: new Date('2024-06-05T10:00:00'), tone: 'WARNING', category: 'NOTIF_CONGE' }),
  mkNotif({ id: 'n3', date: new Date('2024-06-08T09:00:00'), tone: 'SUCCESS', category: 'NOTIF_MESSAGE' }),
  mkNotif({ id: 'n4', date: new Date('2024-06-08T11:00:00'), tone: 'DANGER', category: 'NOTIF_ACCIDENT' }),
  mkNotif({ id: 'n5', date: new Date('2024-06-08T12:00:00'), tone: 'INFO', category: 'NOTIF_TRAJET' })
];

describe('NotificationChartComponent', () => {
  let component: NotificationChartComponent;
  let fixture: ComponentFixture<NotificationChartComponent>;
  let notificationServiceMock: any;
  let cdrMock: any;

  /** Initialise le composant avec un jeu de notifications */
  const initWith = (notifs: AppNotification[]): void => {
    notificationServiceMock.loadNotifications.and.returnValue(of(notifs));
    component.ngOnInit();
  };

  beforeEach(async () => {
    notificationServiceMock = {
      loadNotifications: jasmine.createSpy('loadNotifications').and.returnValue(of([]))
    };
    cdrMock = {
      detectChanges: jasmine.createSpy('detectChanges'),
      markForCheck: jasmine.createSpy('markForCheck')
    };

    await TestBed.configureTestingModule({
      imports: [NotificationChartComponent],
      providers: [
        provideRouter([]),
        provideHttpClient(),
        provideHttpClientTesting(),
        provideAnimationsAsync(),
        provideCharts(withDefaultRegisterables()),
        { provide: NotificationService, useValue: notificationServiceMock }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(NotificationChartComponent);
    component = fixture.componentInstance;
    // Ivy ignore l'override DI de ChangeDetectorRef : on stub la propriété d'instance
    Object.defineProperty(component, 'cdr', { value: cdrMock, configurable: true, writable: true });
    // Pas de fixture.detectChanges() : aucun rendu réel du template / canvas
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  /* ─── Chargement ──────────────────────────────────────────────── */
  it('ngOnInit() should load notifications and refresh all state', () => {
    initWith(mainDataset());
    expect(component.notifications.length).toBe(5);
    expect(component.totalElements).toBe(5);
    expect(cdrMock.detectChanges).toHaveBeenCalled();
  });

  it('ngOnInit() should leave state untouched when the service errors', () => {
    // RxJS 7 : erreur sans handler -> reportUnhandledError asynchrone, pas de throw synchrone
    notificationServiceMock.loadNotifications.and.returnValue(throwError(() => new Error('boom')));
    expect(() => component.ngOnInit()).not.toThrow();
    expect(component.notifications).toEqual([]);
  });

  /* ─── KPIs ────────────────────────────────────────────────────── */
  it('should compute volume, daily average, dominant type and peak', () => {
    initWith(mainDataset());
    expect(component.kpiVolumeTotal).toBe(5);
    // plage du 05/06 08:00 au 08/06 12:00 -> ceil(3j4h) = 4 jours -> round(5/4*10)/10 = 1.3
    expect(component.kpiMoyJournaliere).toBe(1.3);
    expect(component.kpiDominantType).toEqual(jasmine.objectContaining({ label: 'Trajet', count: 2, pct: 40 }));
    expect(component.kpiPeakLabel).toBe('08/06');
    expect(component.kpiPeakValue).toBe(3);
    expect(component.kpiCritiques).toBe(2); // WARNING + DANGER
  });

  it('should flag evolution as "up" when no previous period exists', () => {
    initWith(mainDataset());
    expect(component.kpiEvolutionPct).toBe(100);
    expect(component.kpiEvolutionDirection).toBe('up');
  });

  it('should compute a negative evolution against the previous period', () => {
    component.notifications = [
      ...Array.from({ length: 4 }, (_, i) => mkNotif({ date: new Date(`2024-06-09T${String(i + 8).padStart(2, '0')}:00:00`) })),
      mkNotif({ date: new Date('2024-06-10T08:00:00') }),
      mkNotif({ date: new Date('2024-06-11T08:00:00') })
    ];
    component.dateFrom = '2024-06-10';
    component.onFilterChange();
    expect(component.kpiVolumeTotal).toBe(2);
    expect(component.kpiEvolutionPct).toBe(-50);
    expect(component.kpiEvolutionDirection).toBe('down');
  });

  it('should mark evolution as "stable" within ±5%', () => {
    component.notifications = [
      mkNotif({ category: 'NOTIF_COMPTE', date: new Date('2024-06-09T08:00:00') }),
      mkNotif({ category: 'NOTIF_COMPTE', date: new Date('2024-06-09T09:00:00') }),
      mkNotif({ category: 'NOTIF_COMPTE', date: new Date('2024-06-10T08:00:00') }),
      mkNotif({ category: 'NOTIF_COMPTE', date: new Date('2024-06-11T08:00:00') })
    ];
    component.filterType = 'NOTIF_COMPTE';
    component.dateFrom = '2024-06-10';
    component.onFilterChange();
    expect(component.kpiEvolutionPct).toBe(0);
    expect(component.kpiEvolutionDirection).toBe('stable');
  });

  it('should handle single-item and empty lists for KPIs', () => {
    initWith([]);
    expect(component.kpiMoyJournaliere).toBe(0);
    expect(component.kpiDominantType).toBeNull();
    expect(component.kpiPeakValue).toBe(0);

    initWith([mkNotif()]);
    expect(component.kpiMoyJournaliere).toBe(1);
    expect(component.kpiPeakValue).toBe(1);
  });

  /* ─── Graphiques ──────────────────────────────────────────────── */
  it('should build the timeline chart per tone and day', () => {
    initWith(mainDataset());
    expect(component.timelineData.labels).toEqual(['05/06', '08/06']);
    const [danger, warning, info] = component.timelineData.datasets.map(d => d.data as number[]);
    expect(danger).toEqual([0, 1]);
    expect(warning).toEqual([1, 0]);
    expect(info).toEqual([1, 2]);
    expect(component.timelineData.datasets.map(d => d.label)).toEqual(['Critique', 'Avertissement', 'Information']);
  });

  it('timeline tooltip label callback should format the value', () => {
    initWith(mainDataset());
    const cb: any = component.timelineOptions!.plugins!.tooltip!.callbacks!.label;
    expect(cb({ dataset: { label: 'Critique' }, parsed: { y: 2 } })).toBe(' Critique : 2');
  });

  it('should build the type donut sorted by count with colors', () => {
    initWith(mainDataset());
    expect(component.typeDonutData.labels![0]).toBe('Trajet');
    expect((component.typeDonutData.datasets[0].data as number[])[0]).toBe(2);
    expect((component.typeDonutData.datasets[0].backgroundColor as any)[0]).toBe('#10b981CC');
  });

  it('donut tooltip label callback should format the value', () => {
    initWith(mainDataset());
    const cb: any = component.typeDonutOptions!.plugins!.tooltip!.callbacks!.label;
    expect(cb({ label: 'Trajet', parsed: 3 })).toBe(' Trajet : 3 notification(s)');
  });

  it('should fall back to the default color for unknown categories', () => {
    initWith([mkNotif({ category: 'INCONNU_X' as any })]);
    expect(component.typeDonutData.labels).toEqual(['INCONNU_X']);
    expect((component.typeDonutData.datasets[0].backgroundColor as any)[0]).toBe('#6366f1CC');
    expect(component.dataSource[0].typeLabel).toBe('INCONNU_X');
  });

  /* ─── Granularité ─────────────────────────────────────────────── */
  it('getGranularityLabel() should cover all granularities', () => {
    expect(component.getGranularityLabel()).toBe('jour');
    component.filterGranularity = 'week';
    expect(component.getGranularityLabel()).toBe('semaine');
    component.filterGranularity = 'month';
    expect(component.getGranularityLabel()).toBe('mois');
  });

  it('weekly granularity should produce "Sem." period keys', () => {
    initWith(mainDataset());
    component.filterGranularity = 'week';
    component.onFilterChange();
    expect(component.getGranularityLabel()).toBe('semaine');
    expect(String(component.timelineData.labels![0])).toMatch(/^Sem\. \d{2}\/\d{2}$/);
  });

  it('monthly granularity should produce "MMM YYYY" period keys', () => {
    initWith(mainDataset());
    component.filterGranularity = 'month';
    component.onFilterChange();
    expect(component.timelineData.labels![0]).toBe('Juin 2024');
  });

  /* ─── Filtres & pagination ────────────────────────────────────── */
  it('hasActiveFilters should react to every filter field', () => {
    expect(component.hasActiveFilters).toBeFalse();
    component.filterType = 'NOTIF_CONGE';
    expect(component.hasActiveFilters).toBeTrue();
    component.filterType = '';
    component.filterGranularity = 'month';
    expect(component.hasActiveFilters).toBeTrue();
    component.filterGranularity = 'day';
    component.dateFrom = '2024-06-01';
    expect(component.hasActiveFilters).toBeTrue();
    component.dateFrom = '';
    component.dateTo = '2024-06-30';
    expect(component.hasActiveFilters).toBeTrue();
  });

  it('onFilterChange() should reset pagination and refilter', () => {
    initWith(mainDataset());
    component.pageIndex = 2;
    component.dateFrom = '2024-06-08';
    component.onFilterChange();
    expect(component.pageIndex).toBe(0);
    expect(component.totalElements).toBe(3);
  });

  it('date filters should bound the range inclusively', () => {
    initWith(mainDataset());
    component.dateTo = '2024-06-05';
    component.onFilterChange();
    expect(component.totalElements).toBe(2); // fin de journée incluse
  });

  it('clearFilters() should reset every filter', () => {
    initWith(mainDataset());
    component.filterType = 'NOTIF_CONGE';
    component.filterGranularity = 'month';
    component.dateFrom = '2024-06-01';
    component.clearFilters();
    expect(component.filterType).toBe('');
    expect(component.filterGranularity).toBe('day');
    expect(component.dateFrom).toBe('');
    expect(component.dateTo).toBe('');
    expect(component.pageIndex).toBe(0);
    expect(component.hasActiveFilters).toBeFalse();
    expect(cdrMock.detectChanges).toHaveBeenCalled();
  });

  it('onPageChange() should paginate the table', () => {
    initWith(Array.from({ length: 12 }, (_, i) => mkNotif({ id: `p${i}`, date: new Date('2024-06-05T08:00:00') })));
    expect(component.totalElements).toBe(12);
    expect(component.dataSource.length).toBe(10);
    component.onPageChange({ pageIndex: 1, pageSize: 10, previousPageIndex: 0, length: 12 });
    expect(component.dataSource.length).toBe(2);
  });

  /* ─── Helpers d'affichage ─────────────────────────────────────── */
  it('getTypeColor() should map known categories plus fallback', () => {
    expect(component.getTypeColor('NOTIF_TRAJET')).toBe('#10b981');
    expect(component.getTypeColor('INCONNU')).toBe('#6366f1');
  });

  it('getSeverityColor() should map tones plus fallback', () => {
    expect(component.getSeverityColor('INFO')).toBe('#3b82f6');
    expect(component.getSeverityColor('SUCCESS')).toBe('#34d399');
    expect(component.getSeverityColor('WARNING')).toBe('#f59e0b');
    expect(component.getSeverityColor('DANGER')).toBe('#ef4444');
    expect(component.getSeverityColor('WEIRD')).toBe('#3b82f6');
  });

  it('getSeverityIcon() should map tones plus fallback', () => {
    expect(component.getSeverityIcon('INFO')).toBe('info');
    expect(component.getSeverityIcon('SUCCESS')).toBe('check_circle');
    expect(component.getSeverityIcon('WARNING')).toBe('warning');
    expect(component.getSeverityIcon('DANGER')).toBe('error');
    expect(component.getSeverityIcon('WEIRD')).toBe('info');
  });

  it('getSeverityLabel() should map tones plus fallback', () => {
    expect(component.getSeverityLabel('INFO')).toBe('Information');
    expect(component.getSeverityLabel('SUCCESS')).toBe('Succès');
    expect(component.getSeverityLabel('WARNING')).toBe('Avertissement');
    expect(component.getSeverityLabel('DANGER')).toBe('Critique');
    expect(component.getSeverityLabel('WEIRD')).toBe('WEIRD');
  });

  it('getSeverityClass() should cover all branches including empty tone', () => {
    expect(component.getSeverityClass('DANGER')).toBe('nc-severity--danger');
    expect(component.getSeverityClass('WARNING')).toBe('nc-severity--warning');
    expect(component.getSeverityClass('SUCCESS')).toBe('nc-severity--success');
    expect(component.getSeverityClass('INFO')).toBe('nc-severity--info');
    expect(component.getSeverityClass('')).toBe('nc-severity--info');
  });

  /* ─── Interactions graphiques ─────────────────────────────────── */
  it('onChartClick("timeline") should open a drill-down for the clicked period', () => {
    initWith(mainDataset());
    component.onChartClick('timeline', { active: [{ _index: 1 }] });
    expect(component.drillDownOpen).toBeTrue();
    expect(component.drillDownData!.title).toBe('Période du 08/06');
    expect(component.drillDownData!.statValue).toBe(3);
    const labels = component.drillDownData!.details.map(d => d.label);
    expect(labels).toContain('Succès');
    expect(labels).toContain('Critique');
    expect(labels).toContain('Information');
    expect(component.drillDownData!.items!.length).toBe(3);
  });

  it('onChartClick() should ignore empty or invalid events', () => {
    initWith(mainDataset());
    component.onChartClick('timeline', {});
    expect(component.drillDownOpen).toBeFalse();

    component.onChartClick('timeline', { active: [{ _index: null }] });
    expect(component.drillDownOpen).toBeFalse();

    component.onChartClick('timeline', { active: [{ _index: 99 }] }); // période inexistante
    expect(component.drillDownOpen).toBeFalse();

    component.onChartClick('autre', { active: [{ _index: 0 }] }); // type inconnu
    expect(component.drillDownOpen).toBeFalse();
  });

  it('onChartClick("donut") should open a drill-down for the clicked type', () => {
    initWith(mainDataset());
    component.onChartClick('donut', { active: [{ _index: 0 }] });
    expect(component.drillDownOpen).toBeTrue();
    expect(component.drillDownData!.title).toBe('Type : Trajet');
    expect(component.drillDownData!.statValue).toBe(2);
    expect(component.drillDownData!.items!.length).toBe(2);
    expect(component.drillDownData!.details.map(d => d.value)).toEqual(['0', '0', '2', jasmine.any(String)]);
  });

  it('onChartClick("donut") should tolerate an unknown index', () => {
    initWith(mainDataset());
    component.onChartClick('donut', { active: [{ _index: 42 }] });
    expect(component.drillDownOpen).toBeTrue();
    expect(component.drillDownData!.title).toBe('Type : ');
    expect(component.drillDownData!.statValue).toBe(0);
    expect(component.drillDownData!.details[3].value).toBe('—');
  });

  it('onRowClick() should open a drill-down for a known notification', () => {
    initWith(mainDataset());
    const row = component.dataSource[0];
    component.onRowClick(row);
    expect(component.drillDownOpen).toBeTrue();
    expect(component.drillDownData!.title).toBe(`Notification #${row.id}`);
    expect(component.drillDownData!.details.length).toBe(5);
  });

  it('onRowClick() should ignore unknown rows', () => {
    initWith(mainDataset());
    component.onRowClick({ ...component.dataSource[0], id: 'ghost' });
    expect(component.drillDownOpen).toBeFalse();
  });

  it('openDrillDown()/closeDrillDown() should manage the panel state', () => {
    initWith(mainDataset());
    component.openDrillDown({ title: 'Test', details: [] });
    expect(component.drillDownOpen).toBeTrue();
    component.closeDrillDown();
    expect(component.drillDownOpen).toBeFalse();
    expect(component.drillDownData).toBeNull();
  });

  /* ─── Cas limites privés ──────────────────────────────────────── */
  it('getPreviousPeriodNotifications() should return [] when nothing is filtered', () => {
    initWith([]);
    expect((component as any).getPreviousPeriodNotifications()).toEqual([]);
  });

  it('getPreviousPeriodNotifications() should return [] when the range is < 1ms', () => {
    const sameDate = new Date('2024-06-05T08:00:00');
    initWith([mkNotif({ date: sameDate }), mkNotif({ date: new Date(sameDate.getTime()) })]);
    expect((component as any).getPreviousPeriodNotifications()).toEqual([]);
  });

  it('computeDaysInRange() should return at least one day', () => {
    initWith([mkNotif()]);
    expect((component as any).computeDaysInRange([mkNotif({ date: new Date('2024-06-05T00:00:00') })])).toBe(1);
    expect((component as any).computeDaysInRange([])).toBe(1);
  });

  it('ngOnDestroy() should complete without error', () => {
    initWith(mainDataset());
    expect(() => component.ngOnDestroy()).not.toThrow();
  });
});
