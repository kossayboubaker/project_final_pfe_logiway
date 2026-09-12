import { Component, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatInputModule } from '@angular/material/input';
import { MatTableModule } from '@angular/material/table';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatNativeDateModule } from '@angular/material/core';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { BaseChartDirective } from 'ng2-charts';
import { ChartConfiguration, ChartType } from 'chart.js';
import { jsPDF } from 'jspdf';

import { PauseAIService } from '../../core/services/pause-ai.service';
import {
  PauseAIDashboard, PauseAIFilterOptions, ChauffeurStats, HeatmapPoint, MLInsights
} from '../../models/pause-ai.models';

@Component({
  selector: 'app-pause-analytics-dashboard',
  standalone: true,
  imports: [
    CommonModule, FormsModule,
    MatCardModule, MatButtonModule, MatIconModule, MatSelectModule,
    MatDatepickerModule, MatInputModule, MatTableModule,
    MatProgressSpinnerModule, MatNativeDateModule, MatTooltipModule,
    MatButtonToggleModule, MatPaginatorModule, BaseChartDirective
  ],
  templateUrl: './pause-analytics-dashboard.component.html',
  styleUrls: ['./pause-analytics-dashboard.component.css']
})
export class PauseAnalyticsDashboardComponent implements OnInit {
  @ViewChild('fatigueChart') fatigueChart?: BaseChartDirective;
  @ViewChild('donutChart') donutChart?: BaseChartDirective;
  @ViewChild('accessChart') accessChart?: BaseChartDirective;
  @ViewChild('poiAccessBarChart') poiAccessBarChart?: BaseChartDirective;

  loading = false;
  dashboard: PauseAIDashboard | null = null;
  generatingPdf = false;

  filters: PauseAIFilterOptions = {
    startDate: this.getDefaultStartDate(),
    endDate: new Date(),
    typeAlerte: 'ALL',
    statut: 'ALL'
  };

  periodOptions = [
    { value: 'today', label: "Aujourd'hui" },
    { value: 'week', label: 'Cette semaine' },
    { value: 'month', label: 'Ce mois' },
    { value: 'custom', label: 'Personnalisé' }
  ];

  selectedPeriod = 'week';
  showCustomDates = false;

  displayedColumns: string[] = [
    'nomChauffeur', 'nombreMissions', 'scoreFatigueMoyen', 'niveauRisque',
    'sentiment', 'arriveeEstimee', 'distanceReelle', 'heuresMoyennesConduite',
    'scoreMoyenAccessibilite', 'alertesUrgentes', 'tauxConformite'
  ];

  selectedHeatmapType = 'ALL';
  heatmapSearchQuery = '';
  heatmapChauffeurFilter = 'ALL';
  heatmapPageIndex = 0;
  heatmapPageSize = 12;

  readonly lineType: ChartType = 'line';
  readonly donutType: ChartType = 'doughnut';
  readonly barType: ChartType = 'bar';

  fatigueLineData: ChartConfiguration['data'] = { labels: [], datasets: [] };
  fatigueLineOptions: ChartConfiguration['options'] = {};
  donutData: any = { labels: [], datasets: [{ data: [] }] };
  donutOptions: any = {};
  accessBarData: ChartConfiguration['data'] = { labels: [], datasets: [] };
  accessBarOptions: ChartConfiguration['options'] = {};
  poiAccessBarData: ChartConfiguration['data'] = { labels: [], datasets: [] };
  poiAccessBarOptions: ChartConfiguration['options'] = {};

  pageIndex = 0;
  pageSize = 10;
  totalElements = 0;

  chauffeurFilterActive = false;
  localChauffeurId: number | null = null;

  readonly Math = Math;

  pdfProgress = '';
  pdfStep = 0;

  Min(a: number, b: number): number { return Math.min(a, b); }

  constructor(public pauseAIService: PauseAIService) {}

  ngOnInit() { this.loadDashboard(); }

  getDefaultStartDate(): Date {
    const d = new Date(); d.setDate(d.getDate() - 7); return d;
  }

  onPeriodChange(period: string) {
    this.selectedPeriod = period;
    this.showCustomDates = period === 'custom';
    const now = new Date();
    switch (period) {
      case 'today':
        this.filters.startDate = new Date(now.setHours(0,0,0,0));
        this.filters.endDate = new Date(); break;
      case 'week':
        const ws = new Date(); ws.setDate(ws.getDate() - 7);
        this.filters.startDate = ws; this.filters.endDate = new Date(); break;
      case 'month':
        const ms = new Date(); ms.setMonth(ms.getMonth() - 1);
        this.filters.startDate = ms; this.filters.endDate = new Date(); break;
      case 'custom': return;
    }
    if (period !== 'custom') this.loadDashboard();
  }

  applyCustomDates() { if (this.showCustomDates) this.loadDashboard(); }

  resetFilters() {
    this.filters = {
      startDate: this.getDefaultStartDate(),
      endDate: new Date(),
      typeAlerte: 'ALL',
      statut: 'ALL',
      chauffeurId: undefined
    };
    this.selectedPeriod = 'week';
    this.showCustomDates = false;
    this.selectedHeatmapType = 'ALL';
    this.heatmapSearchQuery = '';
    this.heatmapChauffeurFilter = 'ALL';
    this.heatmapPageIndex = 0;
    this.localChauffeurId = null;
    this.chauffeurFilterActive = false;
    this.loadDashboard();
  }

  loadDashboard() {
    this.loading = true;
    this.pauseAIService.getDashboardStats(this.filters).subscribe({
      next: (data) => {
        const sorted = [...(data.chauffeurStats || [])]
          .sort((a, b) => a.tauxConformite - b.tauxConformite);
        this.dashboard = { ...data, chauffeurStats: sorted };
        this.totalElements = sorted.length;
        this.pageIndex = 0;
        this.heatmapPageIndex = 0;
        this.chauffeurFilterActive = false;
        this.localChauffeurId = null;
        this.buildCharts();
        this.loading = false;
      },
      error: () => { this.loading = false; }
    });
  }

  private buildCharts() {
    this.buildFatigueLine();
    this.buildDonut();
    this.buildAccessBar();
    this.buildPoiAccessBar();
  }

  private get chartStats(): ChauffeurStats[] {
    const all = this.dashboard?.chauffeurStats || [];
    if (this.chauffeurFilterActive && this.localChauffeurId != null) {
      return all.filter(s => s.chauffeurId === this.localChauffeurId);
    }
    return all;
  }

  private buildFatigueLine() {
    const s = this.chartStats;
    const labels = s.map(x => x.nomChauffeur.split(' ')[0]);
    this.fatigueLineData = {
      labels,
      datasets: [
        {
          data: s.map(x => x.scoreFatigueMoyen), label: 'Score Fatigue',
          borderColor: '#ef4444', backgroundColor: 'rgba(239,68,68,0.08)',
          borderWidth: 2.5, tension: 0.45, fill: true,
          pointBackgroundColor: '#ef4444', pointBorderColor: '#1e1b4b',
          pointBorderWidth: 2, pointRadius: 4, pointHoverRadius: 8
        },
        {
          data: s.map(x => x.tauxConformite), label: 'Taux Conformité',
          borderColor: '#10b981', backgroundColor: 'rgba(16,185,129,0.08)',
          borderWidth: 2, tension: 0.45, fill: false,
          pointBackgroundColor: '#10b981', pointBorderColor: '#1e1b4b',
          pointBorderWidth: 2, pointRadius: 4, pointHoverRadius: 8,
          yAxisID: 'y1'
        }
      ]
    };
    this.fatigueLineOptions = {
      responsive: true, maintainAspectRatio: false,
      interaction: { mode: 'index', intersect: false },
      animation: { duration: 900, easing: 'easeOutQuart' },
      plugins: {
        legend: { display: true, position: 'top', labels: { color: '#94a3b8', usePointStyle: true, padding: 20, font: { size: 11 } } },
        tooltip: { backgroundColor: 'rgba(15,23,42,0.95)', titleColor: '#e2e8f0', bodyColor: '#94a3b8', borderColor: 'rgba(239,68,68,0.3)', borderWidth: 1, padding: 14, cornerRadius: 12 }
      },
      scales: {
        y: { beginAtZero: true, max: 100, grid: { color: 'rgba(99,102,241,0.06)' }, ticks: { color: '#64748b', font: { size: 11 } }, border: { display: false }, title: { display: true, text: 'Fatigue', color: '#ef4444', font: { size: 10 } } },
        y1: { beginAtZero: true, max: 100, position: 'right', grid: { display: false }, ticks: { color: '#10b981', font: { size: 11 } }, border: { display: false }, title: { display: true, text: 'Conformité %', color: '#10b981', font: { size: 10 } } },
        x: { grid: { display: false }, ticks: { color: '#94a3b8', font: { size: 11 } }, border: { display: false } }
      }
    };
  }

  private buildDonut() {
    if (!this.dashboard) return;
    let effectuees = this.dashboard.pausesEffectuees;
    let ignorees = this.dashboard.pausesIgnorees;
    if (this.chauffeurFilterActive && this.localChauffeurId != null) {
      const filtered = this.chartStats;
      effectuees = filtered.reduce((sum, s) => sum + (s.pausesEffectuees ?? 0), 0);
      ignorees = filtered.reduce((sum, s) => sum + (s.pausesIgnorees ?? 0), 0);
    }
    this.donutData = {
      labels: ['Effectuées', 'Ignorées'],
      datasets: [{
        data: [effectuees, ignorees],
        backgroundColor: ['rgba(16,185,129,0.8)', 'rgba(239,68,68,0.75)'],
        hoverBackgroundColor: ['#10b981', '#ef4444'],
        borderWidth: 0, hoverOffset: 10
      }]
    };
    this.donutOptions = {
      responsive: true, maintainAspectRatio: false, cutout: '72%',
      animation: { duration: 900, easing: 'easeOutQuart' },
      plugins: {
        legend: { display: true, position: 'bottom', labels: { color: '#94a3b8', padding: 16, usePointStyle: true, font: { size: 11 } } },
        tooltip: { backgroundColor: 'rgba(15,23,42,0.95)', titleColor: '#e2e8f0', bodyColor: '#94a3b8', borderColor: 'rgba(255,255,255,0.08)', borderWidth: 1, padding: 14, cornerRadius: 12 }
      }
    };
  }

  private buildAccessBar() {
    const s = this.chartStats;
    const labels = s.map(x => x.nomChauffeur.split(' ')[0]);
    const data = s.map(x => x.scoreMoyenAccessibilite ?? 0);
    this.accessBarData = {
      labels,
      datasets: [{
        data, label: 'Score Accessibilité',
        backgroundColor: data.map(v => v >= 80 ? 'rgba(16,185,129,0.75)' : v >= 50 ? 'rgba(245,158,11,0.75)' : 'rgba(239,68,68,0.75)'),
        hoverBackgroundColor: data.map(v => v >= 80 ? '#10b981' : v >= 50 ? '#f59e0b' : '#ef4444'),
        borderRadius: 8, barThickness: 22, borderWidth: 0
      }]
    };
    this.accessBarOptions = {
      responsive: true, maintainAspectRatio: false,
      animation: { duration: 900, easing: 'easeOutQuart' },
      plugins: {
        legend: { display: false },
        tooltip: { backgroundColor: 'rgba(15,23,42,0.95)', titleColor: '#e2e8f0', bodyColor: '#94a3b8', padding: 14, cornerRadius: 12, callbacks: { label: (ctx: any) => ` ${ctx.parsed.y}/100` } }
      },
      scales: {
        y: { beginAtZero: true, max: 100, grid: { color: 'rgba(99,102,241,0.06)' }, ticks: { color: '#64748b', font: { size: 11 } }, border: { display: false } },
        x: { grid: { display: false }, ticks: { color: '#94a3b8', font: { size: 11 } }, border: { display: false } }
      }
    };
  }

  private buildPoiAccessBar() {
    let points = this.dashboard?.heatmapPoints || [];
    if (this.chauffeurFilterActive && this.localChauffeurId != null) {
      const selectedName = (this.dashboard?.chauffeurStats || []).find(s => s.chauffeurId === this.localChauffeurId)?.nomChauffeur;
      if (selectedName) {
        points = points.filter(p => p.chauffeurNom === selectedName);
      }
    }
    if (points.length === 0) { this.poiAccessBarData = { labels: [], datasets: [{ data: [] }] }; return; }

    const typeGroups: { [icon: string]: { scores: number[], count: number } } = {};
    for (const p of points) {
      const cat = this.getPOIIconFromName(p.nomLieu || '');
      if (!typeGroups[cat]) typeGroups[cat] = { scores: [], count: 0 };
      if (p.accessibilityScore != null) typeGroups[cat].scores.push(p.accessibilityScore);
      typeGroups[cat].count++;
    }

    const labels = Object.keys(typeGroups);
    const avgScores = labels.map(k => {
      const g = typeGroups[k];
      return g.scores.length > 0 ? Math.round(g.scores.reduce((a, b) => a + b, 0) / g.scores.length) : 0;
    });
    const counts = labels.map(k => typeGroups[k].count);

    this.poiAccessBarData = {
      labels,
      datasets: [
        {
          data: avgScores, label: 'Score Moyen',
          backgroundColor: avgScores.map(v => v >= 80 ? 'rgba(16,185,129,0.75)' : v >= 50 ? 'rgba(245,158,11,0.75)' : 'rgba(239,68,68,0.75)'),
          hoverBackgroundColor: avgScores.map(v => v >= 80 ? '#10b981' : v >= 50 ? '#f59e0b' : '#ef4444'),
          borderRadius: 8, barThickness: 28, borderWidth: 0,
          order: 0
        },
        {
          data: counts, label: 'Nombre de POIs',
          backgroundColor: 'rgba(99,102,241,0.2)',
          hoverBackgroundColor: 'rgba(99,102,241,0.4)',
          borderRadius: 4, barThickness: 28, borderWidth: 0,
          yAxisID: 'y1', order: 1
        }
      ]
    };
    this.poiAccessBarOptions = {
      responsive: true, maintainAspectRatio: false,
      animation: { duration: 900, easing: 'easeOutQuart' },
      plugins: {
        legend: { display: true, position: 'top', labels: { color: '#94a3b8', usePointStyle: true, padding: 16, font: { size: 10 } } },
        tooltip: { backgroundColor: 'rgba(15,23,42,0.95)', titleColor: '#e2e8f0', bodyColor: '#94a3b8', padding: 14, cornerRadius: 12 }
      },
      scales: {
        y: { beginAtZero: true, max: 100, grid: { color: 'rgba(99,102,241,0.06)' }, ticks: { color: '#64748b', font: { size: 11 } }, border: { display: false }, title: { display: true, text: 'Score /100', color: '#94a3b8', font: { size: 9 } } },
        y1: { beginAtZero: true, position: 'right', grid: { display: false }, ticks: { color: '#818cf8', font: { size: 11 } }, border: { display: false }, title: { display: true, text: 'Nb POIs', color: '#818cf8', font: { size: 9 } } },
        x: { grid: { display: false }, ticks: { color: '#94a3b8', font: { size: 10 } }, border: { display: false } }
      }
    };
  }

  getAccessibilityTiers(): { low: number, medium: number, high: number, total: number } {
    const points = this.getFilteredHeatmapPoints();
    if (points.length === 0) return { low: 0, medium: 0, high: 0, total: 0 };
    let low = 0, medium = 0, high = 0;
    for (const p of points) {
      const s = p.accessibilityScore ?? 0;
      if (s >= 80) high++;
      else if (s >= 50) medium++;
      else low++;
    }
    return { low, medium, high, total: points.length };
  }

  /* ── Helpers ── */

  getSentimentIcon(s?: string): string {
    switch (s) {
      case 'VERY_DISSATISFIED': return 'sentiment_very_dissatisfied';
      case 'DISSATISFIED': return 'sentiment_dissatisfied';
      case 'SATISFIED': return 'sentiment_satisfied';
      default: return 'sentiment_neutral';
    }
  }

  getSentimentLabel(s?: string): string {
    switch (s) {
      case 'VERY_DISSATISFIED': return 'Très Insatisfait';
      case 'DISSATISFIED': return 'Insatisfait';
      case 'SATISFIED': return 'Satisfait';
      default: return 'Neutre';
    }
  }

  getSentimentColor(s?: string): string {
    switch (s) {
      case 'VERY_DISSATISFIED': return '#ef4444';
      case 'DISSATISFIED': return '#f59e0b';
      case 'SATISFIED': return '#10b981';
      default: return '#6b7280';
    }
  }

  getRiskColor(r?: string): string {
    switch (r) {
      case 'CRITICAL': return '#ef4444';
      case 'HIGH': return '#f59e0b';
      case 'MODERATE': return '#3b82f6';
      default: return '#10b981';
    }
  }

  getRiskIcon(r?: string): string {
    switch (r) {
      case 'CRITICAL': return 'error';
      case 'HIGH': return 'warning';
      case 'MODERATE': return 'info';
      default: return 'check_circle';
    }
  }

  getScoreColor(score: number): string {
    return this.pauseAIService.getScoreColor(score);
  }

  getConformiteColor(taux: number): string {
    return taux >= 90 ? '#10b981' : taux >= 70 ? '#f59e0b' : '#ef4444';
  }

  getPOIIconFromName(n: string): string {
    const l = n.toLowerCase();
    if (l.includes('station')||l.includes('fuel')||l.includes('essence')||l.includes('carburant')) return 'local_gas_station';
    if (l.includes('restaurant')||l.includes('resto')) return 'restaurant';
    if (l.includes('kiosque')||l.includes('fast')||l.includes('snack')||l.includes('café')) return 'fastfood';
    if (l.includes('aire')||l.includes('rest')||l.includes('repos')) return 'local_parking';
    if (l.includes('service')||l.includes('autoroute')) return 'store';
    return 'place';
  }

  getPOIIconLabel(icon: string): string {
    const map: any = {
      local_gas_station: 'Station',
      restaurant: 'Restaurant',
      fastfood: 'Snack',
      local_parking: 'Aire Repos',
      store: 'Service',
      place: 'Autre'
    };
    return map[icon] || 'Autre';
  }

  getPointTypeLabel(t: string): string {
    switch (t) {
      case 'URGENTE_IGNOREE': return 'Urgente ignorée';
      case 'RECOMMANDEE_EFFECTUEE': return 'Effectuée';
      case 'RECOMMANDEE_IGNOREE': return 'Ignorée';
      case 'VOLONTAIRE': return 'Volontaire';
      default: return t;
    }
  }

  getHeatmapColor(t: string): string {
    switch (t) {
      case 'URGENTE_IGNOREE': return '#ef4444';
      case 'RECOMMANDEE_IGNOREE': return '#f59e0b';
      case 'RECOMMANDEE_EFFECTUEE': return '#10b981';
      case 'VOLONTAIRE': return '#3b82f6';
      default: return '#6b7280';
    }
  }

  getHeatmapIcon(t: string): string {
    switch (t) {
      case 'URGENTE_IGNOREE': return 'error';
      case 'RECOMMANDEE_IGNOREE': return 'warning';
      case 'RECOMMANDEE_EFFECTUEE': return 'check_circle';
      case 'VOLONTAIRE': return 'info';
      default: return 'place';
    }
  }

  get uniqueChauffeurNames(): string[] {
    if (!this.dashboard?.heatmapPoints) return [];
    return [...new Set(this.dashboard.heatmapPoints
      .filter(p => p.chauffeurNom)
      .map(p => p.chauffeurNom!))].sort();
  }

  getFilteredHeatmapPoints(): HeatmapPoint[] {
    if (!this.dashboard?.heatmapPoints) return [];
    let points = this.dashboard.heatmapPoints;

    // Filter by chauffeur click from the table
    if (this.chauffeurFilterActive && this.localChauffeurId != null) {
      const selectedName = (this.dashboard.chauffeurStats || []).find(s => s.chauffeurId === this.localChauffeurId)?.nomChauffeur;
      if (selectedName) {
        points = points.filter(p => p.chauffeurNom === selectedName);
      }
    }

    if (this.selectedHeatmapType !== 'ALL') {
      points = points.filter(p => p.type === this.selectedHeatmapType);
    }
    if (this.heatmapChauffeurFilter !== 'ALL') {
      points = points.filter(p => p.chauffeurNom === this.heatmapChauffeurFilter);
    }
    if (this.heatmapSearchQuery.trim()) {
      const q = this.heatmapSearchQuery.toLowerCase().trim();
      points = points.filter(p =>
        (p.nomLieu && p.nomLieu.toLowerCase().includes(q)) ||
        (p.chauffeurNom && p.chauffeurNom.toLowerCase().includes(q)) ||
        (p.type && p.type.toLowerCase().includes(q))
      );
    }
    return points;
  }

  getPaginatedHeatmapPoints(): HeatmapPoint[] {
    const all = this.getFilteredHeatmapPoints();
    const start = this.heatmapPageIndex * this.heatmapPageSize;
    return all.slice(start, start + this.heatmapPageSize);
  }

  getHeatmapTotalPages(): number {
    return Math.max(1, Math.ceil(this.getFilteredHeatmapPoints().length / this.heatmapPageSize));
  }

  setHeatmapPage(page: number) {
    const total = this.getHeatmapTotalPages();
    this.heatmapPageIndex = Math.max(0, Math.min(page, total - 1));
  }

  getHeatmapPageArray(): number[] {
    const total = this.getHeatmapTotalPages();
    const pages: number[] = [];
    const start = Math.max(0, this.heatmapPageIndex - 2);
    const end = Math.min(total, start + 5);
    for (let i = start; i < end; i++) pages.push(i);
    return pages;
  }

  formatKm(km: number): string {
    if (km >= 1000) return `${(km / 1000).toFixed(1)}k`;
    return `${Math.round(km)}`;
  }

  formatHours(h: number): string {
    const hh = Math.floor(h); const mm = Math.round((h - hh) * 60);
    return `${hh}h${mm.toString().padStart(2, '0')}`;
  }

  roundKm(val: number): number { return Math.round(val); }

  formatDate(d?: string): string {
    if (!d) return '—';
    const dt = new Date(d);
    return dt.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });
  }

  getStatusLabel(s?: string): string {
    switch (s) {
      case 'EN_COURS': return 'En cours';
      case 'ACTIF': return 'Actif';
      case 'COMPLETE': return 'Terminé';
      default: return '—';
    }
  }

  getStatusColor(s?: string): string {
    switch (s) {
      case 'EN_COURS': return '#3b82f6';
      case 'ACTIF': return '#10b981';
      case 'COMPLETE': return '#6b7280';
      default: return '#6b7280';
    }
  }

  get filteredChauffeurs(): ChauffeurStats[] {
    const source = this.dashboard?.chauffeurStats || [];
    const start = this.pageIndex * this.pageSize;
    return source.slice(start, start + this.pageSize);
  }

  onPageChange(e: PageEvent) { this.pageIndex = e.pageIndex; this.pageSize = e.pageSize; }

  onChauffeurClick(stat: ChauffeurStats) {
    if (this.localChauffeurId === stat.chauffeurId) {
      this.localChauffeurId = null;
      this.chauffeurFilterActive = false;
    } else {
      this.localChauffeurId = stat.chauffeurId;
      this.chauffeurFilterActive = true;
    }
    this.pageIndex = 0;
    this.heatmapPageIndex = 0;
    this.buildCharts();
  }

  get filteredStatsForTable(): ChauffeurStats[] {
    const all = this.dashboard?.chauffeurStats || [];
    if (!this.chauffeurFilterActive || this.localChauffeurId == null) return this.chartStats.slice(this.pageIndex * this.pageSize, (this.pageIndex + 1) * this.pageSize);
    const filtered = all.filter(s => s.chauffeurId === this.localChauffeurId);
    return filtered.slice(this.pageIndex * this.pageSize, (this.pageIndex + 1) * this.pageSize);
  }

  get filteredTableTotal(): number {
    if (!this.chauffeurFilterActive || this.localChauffeurId == null) return this.totalElements;
    return (this.dashboard?.chauffeurStats || []).filter(s => s.chauffeurId === this.localChauffeurId).length;
  }

  get selectedChauffeurName(): string {
    if (!this.chauffeurFilterActive || this.localChauffeurId == null) return '';
    const s = this.dashboard?.chauffeurStats.find(c => c.chauffeurId === this.localChauffeurId);
    return s?.nomChauffeur || '';
  }

  get chauffeurCritiquesProportion(): { count: number, pct: number } {
    const total = this.chartStats.length;
    const count = this.dashboard?.mlInsights?.chauffeursCritiquesFatigue ?? 0;
    return { count, pct: total > 0 ? Math.round(count / total * 100) : 0 };
  }

  get chauffeurModeresProportion(): { count: number, pct: number } {
    const total = this.chartStats.length;
    const count = this.dashboard?.mlInsights?.chauffeursModereesFatigue ?? 0;
    return { count, pct: total > 0 ? Math.round(count / total * 100) : 0 };
  }

  exportToCSV() {
    if (!this.dashboard) return;
    const rows: string[] = [];
    rows.push(['Chauffeur','Missions','Score Fatigue','Alertes','Ignorées','Conformité%','Risque','Sentiment','Arrivée Est.','Distance Réelle','Heures','Accessibilité'].join(','));
    this.dashboard.chauffeurStats.forEach(s => {
      rows.push([
        s.nomChauffeur, s.nombreMissions, s.scoreFatigueMoyen.toFixed(2),
        s.alertesUrgentes, s.pausesIgnorees, s.tauxConformite.toFixed(2),
        s.niveauRisque||'', s.sentiment||'',
        s.arriveeEstimee ? new Date(s.arriveeEstimee).toISOString() : '',
        s.distanceReelle?.toFixed(2)||'', s.heuresMoyennesConduite?.toFixed(2)||'', s.scoreMoyenAccessibilite?.toFixed(2)||''
      ].join(','));
    });
    const blob = new Blob([rows.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `dashboard-pauses-${Date.now()}.csv`;
    link.click();
  }

  async generatePdf() {
    if (!this.dashboard) return;
    this.generatingPdf = true;
    this.pdfStep = 0;

    try {
      const chauffeurLabel = this.chauffeurFilterActive && this.localChauffeurId != null
        ? this.dashboard.chauffeurStats.find(s => s.chauffeurId === this.localChauffeurId)?.nomChauffeur || 'Filtré'
        : 'Tous les chauffeurs';

      const doc = new jsPDF('p', 'mm', 'a4');
      const pageW = 210;
      const pageH = 297;
      const margin = 18;
      const contentW = pageW - 2 * margin;
      let y = margin;
      let pageNum = 1;

      const addHeaderFooter = (pNum: number) => {
        if (pNum === 1) return; // Pas d'en-tête/pied sur la page de couverture
        
        // En-tête
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(8);
        doc.setTextColor(148, 163, 184);
        doc.text('RAPPORT ANALYTIQUE DES PAUSES — LOGIWAY', margin, 10);
        doc.text(`Page ${pNum}`, pageW - margin - 12, 10);
        doc.setDrawColor(226, 232, 240);
        doc.setLineWidth(0.25);
        doc.line(margin, 12, pageW - margin, 12);
        
        // Pied de page
        doc.line(margin, pageH - 12, pageW - margin, pageH - 12);
        doc.text('Document Confidentiel — Généré par Logiway AI Engine', margin, pageH - 8);
        doc.text(new Date().toLocaleDateString('fr-FR'), pageW - margin - 15, pageH - 8);
      };

      const addPage = () => {
        doc.addPage();
        pageNum++;
        // Fond blanc propre
        doc.setFillColor(255, 255, 255);
        doc.rect(0, 0, pageW, pageH, 'F');
        addHeaderFooter(pageNum);
        y = margin + 6; // Démarrer sous la ligne d'en-tête
      };

      const checkPage = (needed: number) => {
        if (y + needed > 275) addPage();
      };

      const addSectionTitle = (text: string) => {
        checkPage(22);
        y += 4;
        // Barre verticale d'accentuation
        doc.setFillColor(99, 102, 241);
        doc.rect(margin, y, 4, 8, 'F');
        
        doc.setTextColor(15, 23, 42);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(11);
        doc.text(text, margin + 8, y + 6.5);
        y += 14;
      };

      // --- PAGE DE COUVERTURE (Page 1) ---
      // Fond sombre élégant
      doc.setFillColor(15, 23, 42);
      doc.rect(0, 0, pageW, pageH, 'F');

      // Graphisme décoratif latéral
      doc.setFillColor(30, 41, 59);
      doc.rect(0, 0, 8, pageH, 'F');
      doc.setFillColor(99, 102, 241);
      doc.rect(8, 0, 3, pageH, 'F');

      // Logo Logiway
      doc.setTextColor(255, 255, 255);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(16);
      doc.text('LOGIWAY', margin + 5, 25);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(99, 102, 241);
      doc.text('ANALYTICS', margin + 35, 25);

      // Titre principal
      doc.setTextColor(255, 255, 255);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(28);
      doc.text('Rapport Analytique', margin + 5, 80);
      doc.text('des Pauses & Fatigue', margin + 5, 93);
      
      doc.setFillColor(99, 102, 241);
      doc.rect(margin + 5, 102, 40, 2, 'F');

      // Description
      doc.setTextColor(148, 163, 184);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(11);
      doc.text("Analyse prédictive de la fatigue des chauffeurs et", margin + 5, 114);
      doc.text("conformité réglementaire des temps de repos.", margin + 5, 120);

      // Bloc des métadonnées
      doc.setFillColor(30, 41, 59);
      doc.setDrawColor(71, 85, 105);
      doc.setLineWidth(0.5);
      doc.roundedRect(margin + 5, 180, contentW - 10, 65, 4, 4, 'FD');

      const printMeta = (lbl: string, val: string, currentY: number) => {
        doc.setTextColor(148, 163, 184);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(9);
        doc.text(lbl, margin + 15, currentY);
        doc.setTextColor(255, 255, 255);
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(10);
        doc.text(val, margin + 55, currentY);
      };

      printMeta('Période d\'analyse', `${this.filters.startDate.toLocaleDateString('fr-FR')} - ${this.filters.endDate.toLocaleDateString('fr-FR')}`, 198);
      printMeta('Chauffeur ciblé', chauffeurLabel, 208);
      printMeta('Généré par', 'Logiway AI Intelligence Engine', 218);
      printMeta('Date de génération', new Date().toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' }), 228);

      // --- PAGE 2: INDICATEURS ---
      addPage();

      addSectionTitle('INDICATEURS CLÉS');

      // Cartes KPIs en grille (2x2)
      const kpis = [
        { title: 'Pauses Recommandées', val: `${this.dashboard.totalPausesRecommandees}`, color: [99, 102, 241] },
        { title: 'Pauses Effectuées', val: `${this.dashboard.pausesEffectuees}`, color: [16, 185, 129] },
        { title: 'Pauses Ignorées', val: `${this.dashboard.pausesIgnorees}`, color: [239, 68, 68] },
        { title: 'Taux de Conformité', val: `${this.dashboard.tauxConformite}%`, color: [245, 158, 11] },
      ];

      let cardW = (contentW - 10) / 2;
      let cardH = 28;
      
      checkPage(cardH * 2 + 10);
      
      // KPI 0
      doc.setFillColor(250, 250, 250);
      doc.setDrawColor(226, 232, 240);
      doc.roundedRect(margin, y, cardW, cardH, 3, 3, 'FD');
      doc.setFillColor(kpis[0].color[0], kpis[0].color[1], kpis[0].color[2]);
      doc.rect(margin, y, 3, cardH, 'F');
      doc.setTextColor(100, 116, 139);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8.5);
      doc.text(kpis[0].title, margin + 8, y + 8);
      doc.setTextColor(15, 23, 42);
      doc.setFontSize(16);
      doc.text(kpis[0].val, margin + 8, y + 20);

      // KPI 1
      doc.setFillColor(250, 250, 250);
      doc.setDrawColor(226, 232, 240);
      doc.roundedRect(margin + cardW + 10, y, cardW, cardH, 3, 3, 'FD');
      doc.setFillColor(kpis[1].color[0], kpis[1].color[1], kpis[1].color[2]);
      doc.rect(margin + cardW + 10, y, 3, cardH, 'F');
      doc.setTextColor(100, 116, 139);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8.5);
      doc.text(kpis[1].title, margin + cardW + 18, y + 8);
      doc.setTextColor(15, 23, 42);
      doc.setFontSize(16);
      doc.text(kpis[1].val, margin + cardW + 18, y + 20);

      y += cardH + 8;

      // KPI 2
      doc.setFillColor(250, 250, 250);
      doc.setDrawColor(226, 232, 240);
      doc.roundedRect(margin, y, cardW, cardH, 3, 3, 'FD');
      doc.setFillColor(kpis[2].color[0], kpis[2].color[1], kpis[2].color[2]);
      doc.rect(margin, y, 3, cardH, 'F');
      doc.setTextColor(100, 116, 139);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8.5);
      doc.text(kpis[2].title, margin + 8, y + 8);
      doc.setTextColor(15, 23, 42);
      doc.setFontSize(16);
      doc.text(kpis[2].val, margin + 8, y + 20);

      // KPI 3
      doc.setFillColor(250, 250, 250);
      doc.setDrawColor(226, 232, 240);
      doc.roundedRect(margin + cardW + 10, y, cardW, cardH, 3, 3, 'FD');
      doc.setFillColor(kpis[3].color[0], kpis[3].color[1], kpis[3].color[2]);
      doc.rect(margin + cardW + 10, y, 3, cardH, 'F');
      doc.setTextColor(100, 116, 139);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8.5);
      doc.text(kpis[3].title, margin + cardW + 18, y + 8);
      doc.setTextColor(15, 23, 42);
      doc.setFontSize(16);
      doc.text(kpis[3].val, margin + cardW + 18, y + 20);

      y += cardH + 12;

      // ML Insights
      const mi = this.dashboard.mlInsights;
      if (mi) {
        addSectionTitle('ANALYSE PRÉDICTIVE IA / ML');
        
        checkPage(85);
        doc.setFillColor(248, 250, 252);
        doc.setDrawColor(226, 232, 240);
        doc.roundedRect(margin, y, contentW, 80, 4, 4, 'FD');
        
        let startY = y + 8;
        const addMlField = (lbl: string, val: string, curY: number, isRight: boolean = false) => {
          let curX = isRight ? margin + (contentW / 2) + 4 : margin + 6;
          doc.setTextColor(100, 116, 139);
          doc.setFont('helvetica', 'bold');
          doc.setFontSize(8);
          doc.text(lbl, curX, curY);
          doc.setTextColor(15, 23, 42);
          doc.setFont('helvetica', 'normal');
          doc.setFontSize(9.5);
          doc.text(val, curX + 50, curY);
        };

        addMlField('Fatigue critique', `${mi.chauffeursCritiquesFatigue} ch.`, startY);
        addMlField('Tendance Conformité', `${mi.tendanceConformite >= 0 ? '+' : ''}${mi.tendanceConformite}%`, startY, true);
        
        addMlField('Fatigue modérée', `${mi.chauffeursModereesFatigue} ch.`, startY + 12);
        addMlField('Tendance Fatigue', `${mi.tendanceScoreFatigue >= 0 ? '+' : ''}${mi.tendanceScoreFatigue} pts`, startY + 12, true);
        
        addMlField('Fatigue Max', `${mi.scoreFatigueMax}/100`, startY + 24);
        addMlField('Acceptation IA', `${mi.tauxAcceptationAI}%`, startY + 24, true);
        
        addMlField('Chauffeur à risque', mi.chauffeurPlusRisque ? mi.chauffeurPlusRisque.substring(0, 16) : 'Aucun', startY + 36);
        addMlField('Repos mi-parcours', `${mi.tauxPausesMiParcours}%`, startY + 36, true);
        
        addMlField('Score moyen pauses', `${mi.scoreMoyenPausesEffectuees}/100`, startY + 48);
        addMlField('Pauses Volontaires', `${mi.pausesVolontaires}`, startY + 48, true);

        addMlField('Pauses Repas / Nuit', `${mi.pausesHeuresRepas} / ${mi.pausesNuit}`, startY + 60);
        addMlField('Score moyen fatigue', `${this.dashboard.scoreMoyenFatigue}/100`, startY + 60, true);

        y += 88;
      }

      // --- PAGE 3: TABLEAU CHAUFFEURS ---
      addPage();
      addSectionTitle('DÉTAIL COMPLET PAR CHAUFFEUR');

      const cols = [
        { label: 'Chauffeur', w: 32 },
        { label: 'Missions', w: 14 },
        { label: 'Fatigue', w: 14 },
        { label: 'Risque', w: 16 },
        { label: 'Sentiment', w: 18 },
        { label: 'Arrivée', w: 26 },
        { label: 'Dist. (km)', w: 16 },
        { label: 'Conform.', w: 16 },
        { label: 'Urgentes', w: 14 },
      ];

      // En-tête du tableau
      checkPage(12);
      doc.setFillColor(238, 242, 255); // Light indigo
      doc.rect(margin, y, contentW, 7, 'F');
      
      doc.setDrawColor(99, 102, 241, 0.25);
      doc.line(margin, y, pageW - margin, y);
      doc.line(margin, y + 7, pageW - margin, y + 7);

      doc.setTextColor(15, 23, 42);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(7.5);
      
      let cx = margin + 2;
      cols.forEach(c => {
        doc.text(c.label, cx, y + 5);
        cx += c.w;
      });
      y += 10;

      // Lignes du tableau
      this.dashboard.chauffeurStats.forEach((s, i) => {
        checkPage(9);
        
        if (i % 2 === 0) {
          doc.setFillColor(248, 250, 252);
          doc.rect(margin, y - 2, contentW, 7.5, 'F');
        }
        
        doc.setDrawColor(241, 245, 249);
        doc.line(margin, y + 5.5, pageW - margin, y + 5.5);

        doc.setTextColor(30, 41, 59);
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(7.5);
        
        cx = margin + 2;
        const vals = [
          s.nomChauffeur.substring(0, 16),
          `${s.nombreMissions}`,
          `${s.scoreFatigueMoyen}`,
          s.niveauRisque || 'LOW',
          this.getSentimentLabel(s.sentiment) || 'Neutre',
          this.formatDate(s.arriveeEstimee).substring(0, 12),
          s.distanceReelle ? `${Math.round(s.distanceReelle)}` : '—',
          `${s.tauxConformite}%`,
          `${s.alertesUrgentes}`
        ];

        for (let ci = 0; ci < cols.length; ci++) {
          if (ci === 2) {
            const score = Number(vals[ci]);
            if (score >= 80) doc.setTextColor(239, 68, 68);
            else if (score >= 50) doc.setTextColor(245, 158, 11);
            else doc.setTextColor(16, 185, 129);
            doc.setFont('helvetica', 'bold');
          } else if (ci === 7) {
            const conf = Number(vals[ci].replace('%', ''));
            if (conf >= 90) doc.setTextColor(16, 185, 129);
            else if (conf >= 70) doc.setTextColor(245, 158, 11);
            else doc.setTextColor(239, 68, 68);
            doc.setFont('helvetica', 'bold');
          } else {
            doc.setTextColor(30, 41, 59);
            doc.setFont('helvetica', 'normal');
          }

          doc.text(vals[ci] || '', cx, y + 3);
          cx += cols[ci].w;
        }
        y += 7.5;
      });

      // --- PAGE 4: POINTS DE PAUSE ---
      if (this.dashboard.heatmapPoints.length > 0) {
        addPage();
        addSectionTitle(`POINTS DE PAUSE ENREGISTRÉS (${this.dashboard.heatmapPoints.length})`);

        this.dashboard.heatmapPoints.slice(0, 24).forEach((p, i) => {
          checkPage(12);
          
          doc.setFillColor(255, 255, 255);
          doc.setDrawColor(241, 245, 249);
          doc.roundedRect(margin, y, contentW, 10, 2, 2, 'FD');

          const color = this.getHeatmapColor(p.type);
          doc.setFillColor(color);
          doc.rect(margin, y, 2.5, 10, 'F');

          doc.setTextColor(15, 23, 42);
          doc.setFont('helvetica', 'bold');
          doc.setFontSize(8.5);
          doc.text(`${p.nomLieu || 'Point de pause'}`, margin + 6, y + 4);
          
          doc.setTextColor(100, 116, 139);
          doc.setFont('helvetica', 'normal');
          doc.setFontSize(7.5);
          doc.text(`Chauffeur: ${p.chauffeurNom || 'N/A'}  |  Score: ${p.score}/100  |  Type: ${this.getPointTypeLabel(p.type)}`, margin + 6, y + 8);
          
          // Badge des coordonnées GPS
          doc.setFillColor(241, 245, 249);
          doc.roundedRect(pageW - margin - 46, y + 2, 42, 6, 1.5, 1.5, 'F');
          doc.setTextColor(71, 85, 105);
          doc.setFontSize(7);
          doc.text(`📍 ${p.latitude.toFixed(4)}, ${p.longitude.toFixed(4)}`, pageW - margin - 43, y + 6);

          y += 12;
        });

        if (this.dashboard.heatmapPoints.length > 24) {
          checkPage(10);
          doc.setTextColor(100, 116, 139);
          doc.setFont('helvetica', 'italic');
          doc.setFontSize(8.5);
          doc.text(`... et ${this.dashboard.heatmapPoints.length - 24} autres points de pause enregistrés dans la base.`, margin, y + 5);
          y += 10;
        }
      }

      const safeName = chauffeurLabel.replace(/[^a-zA-Z0-9]/g, '_');
      doc.save(`rapport-pauses-${safeName}-${Date.now()}.pdf`);

    } catch (err) {
      console.error('[PDF] Error:', err);
    } finally {
      this.generatingPdf = false;
    }
  }
}
