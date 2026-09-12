import { ComponentFixture, TestBed } from '@angular/core/testing';
import { PauseAnalyticsDashboardComponent } from './pause-analytics-dashboard.component';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { provideCharts, withDefaultRegisterables } from 'ng2-charts';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { PauseAIService } from '../../core/services/pause-ai.service';
import {
  PauseAIDashboard, ChauffeurStats, HeatmapPoint, MLInsights
} from '../../models/pause-ai.models';
import { of, throwError } from 'rxjs';

describe('PauseAnalyticsDashboardComponent', () => {
  let component: PauseAnalyticsDashboardComponent;
  let fixture: ComponentFixture<PauseAnalyticsDashboardComponent>;
  let serviceMock: any;
  let dashFixture: PauseAIDashboard;

  const mkStat = (over: Partial<ChauffeurStats>): ChauffeurStats => ({
    chauffeurId: 1,
    nomChauffeur: 'X Y',
    nombreMissions: 1,
    scoreFatigueMoyen: 50,
    alertesUrgentes: 0,
    pausesIgnorees: 0,
    tauxConformite: 80,
    ...over
  });

  const crew = (): ChauffeurStats[] => [
    mkStat({
      chauffeurId: 1, nomChauffeur: 'Ali Ben Salah', nombreMissions: 12,
      scoreFatigueMoyen: 85, alertesUrgentes: 2, pausesIgnorees: 2, tauxConformite: 60,
      niveauRisque: 'MODERATE', heuresMoyennesConduite: 6.5, pausesEffectuees: 3,
      scoreMoyenAccessibilite: 85, sentiment: 'SATISFIED',
      arriveeEstimee: '2026-08-25T10:00:00Z', distanceReelle: 1234.56, statutTrajet: 'EN_COURS'
    }),
    mkStat({
      chauffeurId: 2, nomChauffeur: 'Bassem Trabelsi', nombreMissions: 8,
      scoreFatigueMoyen: 55, alertesUrgentes: 1, tauxConformite: 90,
      niveauRisque: 'LOW', heuresMoyennesConduite: 5.25, pausesEffectuees: 2,
      pausesIgnorees: 1, scoreMoyenAccessibilite: 65, sentiment: 'VERY_DISSATISFIED',
      distanceReelle: 987.2
    }),
    mkStat({
      chauffeurId: 3, nomChauffeur: 'Chirine Gharbi', nombreMissions: 5,
      scoreFatigueMoyen: 30, alertesUrgentes: 0, tauxConformite: 70,
      niveauRisque: 'HIGH', heuresMoyennesConduite: 4, pausesEffectuees: 1,
      pausesIgnorees: 1, scoreMoyenAccessibilite: 20
    })
  ];

  const points = (): HeatmapPoint[] => [
    { latitude: 36.8, longitude: 10.18, type: 'URGENTE_IGNOREE', score: 92, nomLieu: 'Station Shell', accessibilityScore: 90, chauffeurNom: 'Ali Ben Salah' },
    { latitude: 36.45, longitude: 10.73, type: 'RECOMMANDEE_EFFECTUEE', score: 60, nomLieu: 'Restaurant Mido', accessibilityScore: 55, chauffeurNom: 'Ali Ben Salah' },
    { latitude: 35.82, longitude: 10.64, type: 'VOLONTAIRE', score: 40, nomLieu: 'Kiosque Fast Sidi', chauffeurNom: 'Bassem Trabelsi' },
    { latitude: 36.13, longitude: 8.68, type: 'VOLONTAIRE', score: 35, nomLieu: 'Aire de repos Jendouba', accessibilityScore: 30, chauffeurNom: 'Bassem Trabelsi' },
    { latitude: 36.9, longitude: 10.05, type: 'RECOMMANDEE_IGNOREE', score: 88, nomLieu: 'Service Autoroute A1', accessibilityScore: 100, chauffeurNom: 'Ali Ben Salah' }
  ];

  const mlInsights = (): MLInsights => ({
    chauffeursCritiquesFatigue: 1,
    chauffeursModereesFatigue: 1,
    scoreFatigueMax: 85,
    chauffeurPlusRisque: 'Ali Ben Salah NomTresLongIci',
    tendanceConformite: -5,
    tendanceScoreFatigue: 3,
    pausesHeuresRepas: 2,
    pausesNuit: 1,
    tauxPausesMiParcours: 40,
    tauxAcceptationAI: 75,
    pausesVolontaires: 9,
    scoreMoyenPausesEffectuees: 82
  });

  const mkDash = (over: Partial<PauseAIDashboard> = {}): PauseAIDashboard => ({
    totalPausesRecommandees: 10,
    pausesEffectuees: 6,
    pausesIgnorees: 4,
    tauxConformite: 62.5,
    scoreMoyenFatigue: 56.7,
    chauffeurStats: crew(),
    heatmapPoints: points(),
    mlInsights: mlInsights(),
    ...over
  });

  function loadDash(d: PauseAIDashboard | null): void {
    (serviceMock.getDashboardStats as jasmine.Spy).and.returnValue(
      d === null ? throwError(() => new Error('ko')) : of(d)
    );
    component.loadDashboard();
  }

  beforeAll(() => {
    if (!(URL as any).createObjectURL) {
      (URL as any).createObjectURL = jasmine.createSpy('createObjectURL').and.returnValue('blob:mock');
      (URL as any).revokeObjectURL = jasmine.createSpy('revokeObjectURL');
    }
  });

  beforeEach(async () => {
    dashFixture = mkDash();

    serviceMock = {
      getDashboardStats: jasmine.createSpy('getDashboardStats')
        .and.callFake(() => of(dashFixture)),
      getScoreColor: jasmine.createSpy('getScoreColor').and.returnValue('#f59e0b')
    };

    await TestBed.configureTestingModule({
      imports: [PauseAnalyticsDashboardComponent],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideAnimationsAsync(),
        provideCharts(withDefaultRegisterables()),
        { provide: PauseAIService, useValue: serviceMock }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(PauseAnalyticsDashboardComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  // ─── Chargement ────────────────────────────────────────────────

  it('should load, sort by conformite and build charts on init', () => {
    expect(component.dashboard).not.toBeNull();
    expect(component.dashboard!.chauffeurStats.map(s => s.chauffeurId)).toEqual([1, 3, 2]);
    expect(component.totalElements).toBe(3);
    expect(component.loading).toBeFalse();
    expect(serviceMock.getDashboardStats).toHaveBeenCalledWith(component.filters);
  });

  it('should stop loading on service error', () => {
    loadDash(null);
    expect(component.loading).toBeFalse();
    expect(component.dashboard!.chauffeurStats.length).toBe(3);
  });

  // ─── Filtres de période ────────────────────────────────────────

  it('onPeriodChange() should handle every period', () => {
    const callsBefore = (serviceMock.getDashboardStats as jasmine.Spy).calls.count();

    component.onPeriodChange('custom');
    expect(component.selectedPeriod).toBe('custom');
    expect(component.showCustomDates).toBeTrue();

    component.onPeriodChange('today');
    expect(component.showCustomDates).toBeFalse();
    expect(component.filters.startDate.getHours()).toBe(0);

    component.onPeriodChange('week');
    expect((serviceMock.getDashboardStats as jasmine.Spy).calls.count())
      .toBe(callsBefore + 2);

    const monthStart = new Date();
    monthStart.setMonth(monthStart.getMonth() - 1);
    component.onPeriodChange('month');
    expect(component.filters.startDate.getMonth()).toBe(monthStart.getMonth());
  });

  it('applyCustomDates() should reload only in custom mode', () => {
    const spy = serviceMock.getDashboardStats as jasmine.Spy;
    const before = spy.calls.count();

    component.applyCustomDates();
    expect(spy.calls.count()).toBe(before);

    component.showCustomDates = true;
    component.applyCustomDates();
    expect(spy.calls.count()).toBe(before + 1);
  });

  it('resetFilters() should restore every default', () => {
    component.onPeriodChange('custom');
    component.selectedHeatmapType = 'URGENTE_IGNOREE';
    component.heatmapSearchQuery = 'abc';
    component.heatmapChauffeurFilter = 'Bassem Trabelsi';
    component.heatmapPageIndex = 2;
    component.localChauffeurId = 7;
    component.chauffeurFilterActive = true;

    component.resetFilters();

    expect(component.selectedPeriod).toBe('week');
    expect(component.showCustomDates).toBeFalse();
    expect(component.selectedHeatmapType).toBe('ALL');
    expect(component.heatmapSearchQuery).toBe('');
    expect(component.heatmapChauffeurFilter).toBe('ALL');
    expect(component.heatmapPageIndex).toBe(0);
    expect(component.localChauffeurId).toBeNull();
    expect(component.chauffeurFilterActive).toBeFalse();
    expect(component.filters.chauffeurId).toBeUndefined();
  });

  // ─── Graphiques ────────────────────────────────────────────────

  it('should build the fatigue line over the sorted crew', () => {
    expect(component.fatigueLineData.labels).toEqual(['Ali', 'Chirine', 'Bassem']);
    expect((component.fatigueLineData.datasets![0] as any).data).toEqual([85, 30, 55]);
    expect((component.fatigueLineData.datasets![1] as any).data).toEqual([60, 70, 90]);
    expect((component.fatigueLineOptions as any).scales.y.title.text).toBe('Fatigue');
  });

  it('should build the global donut and re-sum it when a driver is filtered', () => {
    expect(component.donutData.datasets[0].data).toEqual([6, 4]);

    component.onChauffeurClick(component.dashboard!.chauffeurStats.find(s => s.chauffeurId === 2)!);
    expect(component.donutData.datasets[0].data).toEqual([2, 1]);
    expect(component.selectedChauffeurName).toBe('Bassem Trabelsi');

    component.onChauffeurClick(component.dashboard!.chauffeurStats.find(s => s.chauffeurId === 2)!);
    expect(component.donutData.datasets[0].data).toEqual([6, 4]);
    expect(component.selectedChauffeurName).toBe('');
  });

  it('should color accessibility bars by tier', () => {
    expect(component.accessBarData.labels).toEqual(['Ali', 'Chirine', 'Bassem']);
    expect((component.accessBarData.datasets![0] as any).data).toEqual([85, 20, 65]);
    expect((component.accessBarData.datasets![0] as any).backgroundColor).toEqual([
      'rgba(16,185,129,0.75)', 'rgba(239,68,68,0.75)', 'rgba(245,158,11,0.75)'
    ]);
    const tooltip = (component.accessBarOptions as any).plugins.tooltip.callbacks.label;
    expect(tooltip({ parsed: { y: 85 } })).toBe(' 85/100');
  });

  it('should aggregate POI points by category with average scores', () => {
    expect(component.poiAccessBarData.labels).toEqual([
      'local_gas_station', 'restaurant', 'fastfood', 'local_parking', 'store'
    ]);
    expect((component.poiAccessBarData.datasets![0] as any).data).toEqual([90, 55, 0, 30, 100]);
    expect((component.poiAccessBarData.datasets![1] as any).data).toEqual([1, 1, 1, 1, 1]);
  });

  it('should short-circuit the POI chart without points', () => {
    loadDash(mkDash({ heatmapPoints: [] }));
    expect(component.poiAccessBarData.labels).toEqual([]);
    expect((component.poiAccessBarData.datasets![0] as any).data).toEqual([]);
  });

  // ─── Heatmap ───────────────────────────────────────────────────

  it('should expose sorted unique chauffeur names', () => {
    expect(component.uniqueChauffeurNames).toEqual(['Ali Ben Salah', 'Bassem Trabelsi']);
  });

  it('should filter heatmap points by type, driver and free-text query', () => {
    component.selectedHeatmapType = 'RECOMMANDEE_EFFECTUEE';
    expect(component.getFilteredHeatmapPoints().length).toBe(1);
    component.selectedHeatmapType = 'ALL';

    component.heatmapChauffeurFilter = 'Bassem Trabelsi';
    expect(component.getFilteredHeatmapPoints().map(p => p.nomLieu)).toEqual([
      'Kiosque Fast Sidi', 'Aire de repos Jendouba'
    ]);
    component.heatmapChauffeurFilter = 'ALL';

    component.heatmapSearchQuery = 'STATION';
    expect(component.getFilteredHeatmapPoints().length).toBe(1);

    component.heatmapSearchQuery = 'bassem';
    expect(component.getFilteredHeatmapPoints().length).toBe(2);

    component.heatmapSearchQuery = 'volontaire';
    expect(component.getFilteredHeatmapPoints().length).toBe(2);

    component.heatmapSearchQuery = 'introuvable';
    expect(component.getFilteredHeatmapPoints()).toEqual([]);

    const saved = component.dashboard;
    component.dashboard = null;
    expect(component.getFilteredHeatmapPoints()).toEqual([]);
    expect(component.uniqueChauffeurNames).toEqual([]);
    component.dashboard = saved;
  });

  it('should restrict everything to the driver picked from the table', () => {
    component.onChauffeurClick(component.dashboard!.chauffeurStats[0]);

    expect(component.getFilteredHeatmapPoints().map(p => p.nomLieu)).toEqual([
      'Station Shell', 'Restaurant Mido', 'Service Autoroute A1'
    ]);
    expect(component.filteredTableTotal).toBe(1);
    expect(component.filteredStatsForTable.length).toBe(1);
    expect(component.getAccessibilityTiers()).toEqual({ low: 0, medium: 1, high: 2, total: 3 });
  });

  it('should paginate heatmap points with clamped page helpers', () => {
    const many = Array.from({ length: 55 }, (_, i) => ({
      latitude: i, longitude: i, type: 'VOLONTAIRE' as const, score: i,
      nomLieu: `Point ${i}`, accessibilityScore: i % 100, chauffeurNom: 'Ali Ben Salah'
    }));
    loadDash(mkDash({ heatmapPoints: many }));

    expect(component.getHeatmapTotalPages()).toBe(5);
    expect(component.getPaginatedHeatmapPoints().length).toBe(12);

    component.setHeatmapPage(-5);
    expect(component.heatmapPageIndex).toBe(0);

    component.setHeatmapPage(99);
    expect(component.heatmapPageIndex).toBe(4);

    component.setHeatmapPage(3);
    expect(component.getHeatmapPageArray()).toEqual([1, 2, 3, 4]);
  });

  it('should compute accessibility tiers including null scores', () => {
    expect(component.getAccessibilityTiers())
      .toEqual({ low: 2, medium: 1, high: 2, total: 5 });
  });

  // ─── Table chauffeurs ──────────────────────────────────────────

  it('should paginate the driver table through getters and events', () => {
    expect(component.filteredChauffeurs.length).toBe(3);
    expect(component.filteredStatsForTable.map(s => s.chauffeurId)).toEqual([1, 3, 2]);
    expect(component.filteredTableTotal).toBe(3);

    component.onPageChange({ pageIndex: 1, pageSize: 2 } as any);
    expect(component.filteredStatsForTable.map(s => s.chauffeurId)).toEqual([2]);
    expect(component.filteredChauffeurs.length).toBe(1);
  });

  it('should compute ML proportions safely', () => {
    expect(component.chauffeurCritiquesProportion).toEqual({ count: 1, pct: 33 });
    expect(component.chauffeurModeresProportion).toEqual({ count: 1, pct: 33 });

    const saved = component.dashboard;
    component.dashboard = null;
    expect(component.chauffeurCritiquesProportion).toEqual({ count: 0, pct: 0 });
    component.dashboard = saved;
  });

  // ─── Helpers ───────────────────────────────────────────────────

  it('sentiment helpers should cover every state', () => {
    expect(component.getSentimentIcon('VERY_DISSATISFIED')).toBe('sentiment_very_dissatisfied');
    expect(component.getSentimentIcon('DISSATISFIED')).toBe('sentiment_dissatisfied');
    expect(component.getSentimentIcon('SATISFIED')).toBe('sentiment_satisfied');
    expect(component.getSentimentIcon(undefined)).toBe('sentiment_neutral');

    expect(component.getSentimentLabel('VERY_DISSATISFIED')).toBe('Tr\u00e8s Insatisfait');
    expect(component.getSentimentLabel('DISSATISFIED')).toBe('Insatisfait');
    expect(component.getSentimentLabel('SATISFIED')).toBe('Satisfait');
    expect(component.getSentimentLabel(undefined)).toBe('Neutre');

    expect(component.getSentimentColor('VERY_DISSATISFIED')).toBe('#ef4444');
    expect(component.getSentimentColor('DISSATISFIED')).toBe('#f59e0b');
    expect(component.getSentimentColor('SATISFIED')).toBe('#10b981');
    expect(component.getSentimentColor(undefined)).toBe('#6b7280');
  });

  it('risk helpers should cover every level', () => {
    expect(component.getRiskColor('CRITICAL')).toBe('#ef4444');
    expect(component.getRiskColor('HIGH')).toBe('#f59e0b');
    expect(component.getRiskColor('MODERATE')).toBe('#3b82f6');
    expect(component.getRiskColor('LOW')).toBe('#10b981');

    expect(component.getRiskIcon('CRITICAL')).toBe('error');
    expect(component.getRiskIcon('HIGH')).toBe('warning');
    expect(component.getRiskIcon('MODERATE')).toBe('info');
    expect(component.getRiskIcon('LOW')).toBe('check_circle');
  });

  it('score/conformite helpers should delegate and bucket', () => {
    expect(component.getScoreColor(42)).toBe('#f59e0b');
    expect(serviceMock.getScoreColor).toHaveBeenCalledWith(42);

    expect(component.getConformiteColor(95)).toBe('#10b981');
    expect(component.getConformiteColor(75)).toBe('#f59e0b');
    expect(component.getConformiteColor(50)).toBe('#ef4444');
  });

  it('POI helpers should classify names and resolve labels', () => {
    expect(component.getPOIIconFromName('Station Total')).toBe('local_gas_station');
    expect(component.getPOIIconFromName('Fuel Express')).toBe('local_gas_station');
    expect(component.getPOIIconFromName('Essence Nord')).toBe('local_gas_station');
    expect(component.getPOIIconFromName('Carburant Sud')).toBe('local_gas_station');
    expect(component.getPOIIconFromName('Resto du Coin')).toBe('restaurant');
    expect(component.getPOIIconFromName('Kiosque Plus')).toBe('fastfood');
    expect(component.getPOIIconFromName('Fast Food Bizerte')).toBe('fastfood');
    expect(component.getPOIIconFromName('Snack Center')).toBe('fastfood');
    expect(component.getPOIIconFromName('Caf\u00e9 Mornag')).toBe('fastfood');
    expect(component.getPOIIconFromName('Aire Hammamet')).toBe('local_parking');
    expect(component.getPOIIconFromName('Rest Area Sousse')).toBe('local_parking');
    expect(component.getPOIIconFromName('Repos Nord')).toBe('local_parking');
    expect(component.getPOIIconFromName('Service El Jouz')).toBe('store');
    expect(component.getPOIIconFromName('Autoroute A1 Relay')).toBe('store');
    expect(component.getPOIIconFromName('Endroit Myst\u00e8re')).toBe('place');
    expect(component.getPOIIconFromName('')).toBe('place');

    expect(component.getPOIIconLabel('local_gas_station')).toBe('Station');
    expect(component.getPOIIconLabel('restaurant')).toBe('Restaurant');
    expect(component.getPOIIconLabel('fastfood')).toBe('Snack');
    expect(component.getPOIIconLabel('local_parking')).toBe('Aire Repos');
    expect(component.getPOIIconLabel('store')).toBe('Service');
    expect(component.getPOIIconLabel('place')).toBe('Autre');
    expect(component.getPOIIconLabel('inconnu')).toBe('Autre');
  });

  it('point type and heat color/icon helpers should cover every type', () => {
    expect(component.getPointTypeLabel('URGENTE_IGNOREE')).toBe('Urgente ignor\u00e9e');
    expect(component.getPointTypeLabel('RECOMMANDEE_EFFECTUEE')).toBe('Effectu\u00e9e');
    expect(component.getPointTypeLabel('RECOMMANDEE_IGNOREE')).toBe('Ignor\u00e9e');
    expect(component.getPointTypeLabel('VOLONTAIRE')).toBe('Volontaire');
    expect(component.getPointTypeLabel('AUTRE')).toBe('AUTRE');

    expect(component.getHeatmapColor('URGENTE_IGNOREE')).toBe('#ef4444');
    expect(component.getHeatmapColor('RECOMMANDEE_IGNOREE')).toBe('#f59e0b');
    expect(component.getHeatmapColor('RECOMMANDEE_EFFECTUEE')).toBe('#10b981');
    expect(component.getHeatmapColor('VOLONTAIRE')).toBe('#3b82f6');
    expect(component.getHeatmapColor('?')).toBe('#6b7280');

    expect(component.getHeatmapIcon('URGENTE_IGNOREE')).toBe('error');
    expect(component.getHeatmapIcon('RECOMMANDEE_IGNOREE')).toBe('warning');
    expect(component.getHeatmapIcon('RECOMMANDEE_EFFECTUEE')).toBe('check_circle');
    expect(component.getHeatmapIcon('VOLONTAIRE')).toBe('info');
    expect(component.getHeatmapIcon('?')).toBe('place');
  });

  it('format helpers should handle every branch', () => {
    expect(component.formatKm(1234.5)).toBe('1.2k');
    expect(component.formatKm(87.4)).toBe('87');
    expect(component.formatHours(6.5)).toBe('6h30');
    expect(component.formatHours(2.02)).toBe('2h01');
    expect(component.roundKm(9.6)).toBe(10);
    expect(component.formatDate(undefined)).toBe('\u2014');
    expect(component.formatDate('2026-08-01T09:30:00Z')).toContain('ao\u00fbt');

    expect(component.getStatusLabel('EN_COURS')).toBe('En cours');
    expect(component.getStatusLabel('ACTIF')).toBe('Actif');
    expect(component.getStatusLabel('COMPLETE')).toBe('Termin\u00e9');
    expect(component.getStatusLabel(undefined)).toBe('\u2014');

    expect(component.getStatusColor('EN_COURS')).toBe('#3b82f6');
    expect(component.getStatusColor('ACTIF')).toBe('#10b981');
    expect(component.getStatusColor('COMPLETE')).toBe('#6b7280');
    expect(component.getStatusColor(undefined)).toBe('#6b7280');

    expect(component.Min(3, 7)).toBe(3);
  });

  function captureAnchorDownload(): { anchor: HTMLAnchorElement | null } {
    const origCreate = document.createElement.bind(document);
    const origCreateNS = document.createElementNS.bind(document);
    const state = { anchor: null as HTMLAnchorElement | null };
    spyOn(document, 'createElement').and.callFake((tag: string) => {
      const el: any = origCreate(tag);
      if (tag === 'a' && !state.anchor) state.anchor = el;
      return el;
    });
    spyOn(document, 'createElementNS').and.callFake((ns: any, tag: string) => {
      const el: any = origCreateNS(ns, tag);
      if (tag === 'a' && !state.anchor) state.anchor = el;
      return el;
    });
    return state;
  }

  /** jsPDF (build node) \u00e9crit le PDF via fs.writeFileSync : on intercepte ce point. */
  function stubPdfWrite(): jasmine.Spy {
    return spyOn(require('fs'), 'writeFileSync').and.stub();
  }

  afterAll(() => {
    const fs = require('fs');
    const dir = process.cwd();
    try {
      fs.readdirSync(dir)
        .filter((f: string) => f.startsWith('rapport-pauses-'))
        .forEach((f: string) => {
          try { fs.unlinkSync(`${dir}/${f}`); } catch { /* ignor\u00e9 */ }
        });
    } catch { /* ignor\u00e9 */ }
  });

  // ─── Export CSV ────────────────────────────────────────────────

  it('exportToCSV() should no-op without data and export otherwise', () => {
    component.exportToCSV();

    const saved = component.dashboard;
    component.dashboard = null;
    component.exportToCSV();
    component.dashboard = saved;

    const state = captureAnchorDownload();
    component.exportToCSV();

    expect(state.anchor!.download).toContain('dashboard-pauses-');
    expect(URL.createObjectURL as unknown as jasmine.Spy).toHaveBeenCalled();
  });

  // ─── Export PDF ────────────────────────────────────────────────

  it('generatePdf() should no-op without dashboard', async () => {
    const saved = component.dashboard;
    component.dashboard = null;

    await component.generatePdf();

    expect(component.generatingPdf).toBeFalse();
    component.dashboard = saved;
  });

  it('generatePdf() should produce a filtered report with ML insights and long point lists', async () => {
    const many = Array.from({ length: 30 }, (_, i) => ({
      latitude: 36 + i * 0.01, longitude: 9 + i * 0.01,
      type: 'RECOMMANDEE_EFFECTUEE' as const, score: 50 + i,
      nomLieu: `Relais ${i}`, accessibilityScore: 60, chauffeurNom: 'Bassem Trabelsi'
    }));
    loadDash(mkDash({ heatmapPoints: many }));

    component.onChauffeurClick(component.dashboard!.chauffeurStats.find(s => s.chauffeurId === 2)!);

    const wSpy = stubPdfWrite();
    await component.generatePdf();

    expect(wSpy.calls.count()).toBeGreaterThan(0);
    expect(String(wSpy.calls.mostRecent().args[0])).toContain('rapport-pauses-Bassem_Trabelsi-');
    expect(component.generatingPdf).toBeFalse();
    expect(component.pdfStep).toBe(0);
  });

  it('generatePdf() should skip the ML block when insights are missing', async () => {
    loadDash(mkDash({ mlInsights: undefined }));

    const wSpy = stubPdfWrite();
    await component.generatePdf();

    expect(String(wSpy.calls.mostRecent().args[0])).toContain('rapport-pauses-Tous_les_chauffeurs-');
  });

  it('generatePdf() should swallow internal errors and reset its flag', async () => {
    loadDash(mkDash({
      chauffeurStats: [mkStat({ nomChauffeur: null as any })]
    }));
    spyOn(console, 'error');

    await component.generatePdf();

    expect(component.generatingPdf).toBeFalse();
    expect(console.error).toHaveBeenCalled();
  });
});
