import { Component, OnInit, OnDestroy, ChangeDetectorRef, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { BaseChartDirective } from 'ng2-charts';
import { ChartConfiguration, ChartType } from 'chart.js';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { Subject, takeUntil } from 'rxjs';
import { NotificationService, AppNotification, NotificationCategory } from '../../../../core/services/notification.service';

interface NotificationRow {
    id: string;
    date: Date;
    dateLabel: string;
    type: NotificationCategory;
    typeLabel: string;
    message: string;
    tone: string;
}

interface DailyStat {
    label: string;
    total: number;
    info: number;
    warning: number;
    danger: number;
}

interface TypeCount {
    label: string;
    count: number;
    pct: number;
}

interface DrillDetailItem {
    icon: string;
    label: string;
    value: string;
    color: string;
}

interface DrillDownData {
    title: string;
    statLabel?: string;
    statValue?: string | number;
    details: DrillDetailItem[];
    items?: NotificationRow[];
}

const TYPE_LABELS: Record<string, string> = {
    NOTIF_COMPTE: 'Compte',
    NOTIF_TRAJET: 'Trajet',
    NOTIF_CONGE: 'Congé',
    NOTIF_RECLAMATION: 'Réclamation',
    NOTIF_MESSAGE: 'Message',
    NOTIF_ENTREPRISE: 'Entreprise',
    NOTIF_VEHICULE: 'Véhicule',
    NOTIF_DETECTION: 'Détection',
    NOTIF_WEATHER: 'Météo',
    NOTIF_INFRA: 'Infrastructure',
    NOTIF_ACCIDENT: 'Accident',
    SECTEUR: 'Secteur'
};

const TYPE_COLORS: Record<string, string> = {
    NOTIF_COMPTE: '#6366f1',
    NOTIF_TRAJET: '#10b981',
    NOTIF_CONGE: '#f59e0b',
    NOTIF_RECLAMATION: '#ef4444',
    NOTIF_MESSAGE: '#3b82f6',
    NOTIF_ENTREPRISE: '#8b5cf6',
    NOTIF_VEHICULE: '#06b6d4',
    NOTIF_DETECTION: '#ec4899',
    NOTIF_WEATHER: '#0ea5e9',
    NOTIF_INFRA: '#f97316',
    NOTIF_ACCIDENT: '#dc2626',
    SECTEUR: '#14b8a6'
};

const TONE_LABELS: Record<string, string> = {
    INFO: 'Information',
    SUCCESS: 'Succès',
    WARNING: 'Avertissement',
    DANGER: 'Critique'
};

const TONE_ICONS: Record<string, string> = {
    INFO: 'info',
    SUCCESS: 'check_circle',
    WARNING: 'warning',
    DANGER: 'error'
};

const TONE_COLORS: Record<string, string> = {
    INFO: '#3b82f6',
    SUCCESS: '#34d399',
    WARNING: '#f59e0b',
    DANGER: '#ef4444'
};

@Component({
    selector: 'app-notification-chart',
    standalone: true,
    imports: [CommonModule, FormsModule, BaseChartDirective, MatIconModule, MatTableModule, MatPaginatorModule],
    templateUrl: './notification-chart.component.html',
    styleUrls: ['./notification-chart.component.css']
})
export class NotificationChartComponent implements OnInit, OnDestroy {
    private destroy$ = new Subject<void>();
    private notificationService = inject(NotificationService);
    private cdr = inject(ChangeDetectorRef);

    readonly lineType: ChartType = 'line';
    readonly donutType: ChartType = 'doughnut';

    notifications: AppNotification[] = [];

    filterType = '';
    filterGranularity: 'day' | 'week' | 'month' = 'day';
    dateFrom = '';
    dateTo = '';

    typeOptions = Object.entries(TYPE_LABELS).map(([value, label]) => ({ value, label }));
    granularityOptions = [
        { value: 'day', label: 'Jour' },
        { value: 'week', label: 'Semaine' },
        { value: 'month', label: 'Mois' }
    ];

    kpiVolumeTotal = 0;
    kpiMoyJournaliere = 0;
    kpiDominantType: TypeCount | null = null;
    kpiPeakValue = 0;
    kpiPeakLabel = '';
    kpiEvolutionPct = 0;
    kpiEvolutionDirection: 'up' | 'down' | 'stable' = 'stable';
    kpiCritiques = 0;

    timelineData: ChartConfiguration['data'] = { labels: [], datasets: [] };
    timelineOptions: ChartConfiguration['options'] = {};

    typeDonutData: ChartConfiguration['data'] = { labels: [], datasets: [] };
    typeDonutOptions: ChartConfiguration['options'] = {};

    pageIndex = 0;
    pageSize = 10;
    totalElements = 0;
    dataSource: NotificationRow[] = [];
    displayedColumns = ['date', 'type', 'message', 'severity'];

    drillDownOpen = false;
    drillDownData: DrillDownData | null = null;

    ngOnInit(): void {
        this.loadData();
    }

    ngOnDestroy(): void {
        this.destroy$.next();
        this.destroy$.complete();
    }

    private loadData(): void {
        this.notificationService.loadNotifications().pipe(
            takeUntil(this.destroy$)
        ).subscribe(all => {
            this.notifications = all;
            this.refreshAll();
        });
    }

    get hasActiveFilters(): boolean {
        return !!(this.filterType || this.filterGranularity !== 'day' || this.dateFrom || this.dateTo);
    }

    onFilterChange(): void {
        this.pageIndex = 0;
        this.refreshAll();
    }

    clearFilters(): void {
        this.filterType = '';
        this.filterGranularity = 'day';
        this.dateFrom = '';
        this.dateTo = '';
        this.pageIndex = 0;
        this.refreshAll();
    }

    onPageChange(event: PageEvent): void {
        this.pageIndex = event.pageIndex;
        this.pageSize = event.pageSize;
        this.populateTable();
    }

    private refreshAll(): void {
        const filtered = this.getFilteredNotifications();
        const previous = this.getPreviousPeriodNotifications();
        this.computeKpis(filtered, previous);
        this.buildTimelineChart(filtered);
        this.buildTypeDonut(filtered);
        this.populateTable();
        this.cdr.detectChanges();
    }

    private getFilteredNotifications(): AppNotification[] {
        return this.notifications.filter(n => {
            if (this.filterType && n.category !== this.filterType) return false;
            if (this.dateFrom && n.date < new Date(this.dateFrom)) return false;
            if (this.dateTo) {
                const end = new Date(this.dateTo);
                end.setHours(23, 59, 59, 999);
                if (n.date > end) return false;
            }
            return true;
        });
    }

    private getPreviousPeriodNotifications(): AppNotification[] {
        const filtered = this.getFilteredNotifications();
        if (filtered.length === 0) return [];

        const dates = filtered.map(n => n.date.getTime()).sort((a, b) => a - b);
        const rangeMs = dates[dates.length - 1] - dates[0];
        if (rangeMs < 1) return [];

        const periodEnd = dates[0] - 1;
        const periodStart = periodEnd - rangeMs;

        return this.notifications.filter(n => {
            if (this.filterType && n.category !== this.filterType) return false;
            const t = n.date.getTime();
            return t >= periodStart && t <= periodEnd;
        });
    }

    private computeKpis(list: AppNotification[], previous: AppNotification[]): void {
        this.kpiVolumeTotal = list.length;

        const days = this.computeDaysInRange(list);
        this.kpiMoyJournaliere = days > 0 ? Math.round((list.length / days) * 10) / 10 : 0;

        const typeCounts = new Map<string, number>();
        for (const n of list) {
            const label = TYPE_LABELS[n.category] || n.category;
            typeCounts.set(label, (typeCounts.get(label) || 0) + 1);
        }
        let maxCount = 0;
        let maxLabel = '';
        for (const [label, count] of typeCounts) {
            if (count > maxCount) { maxCount = count; maxLabel = label; }
        }
        this.kpiDominantType = maxCount > 0
            ? { label: maxLabel, count: maxCount, pct: Math.round((maxCount / list.length) * 100) }
            : null;

        const stats = this.aggregateByPeriod(list);
        let peakVal = 0;
        let peakLbl = '';
        for (const s of stats) {
            if (s.total > peakVal) { peakVal = s.total; peakLbl = s.label; }
        }
        this.kpiPeakValue = peakVal;
        this.kpiPeakLabel = peakLbl;

        const pLen = previous.length;
        const cLen = list.length;
        if (pLen > 0) {
            const diff = cLen - pLen;
            this.kpiEvolutionPct = Math.round((diff / pLen) * 100);
        } else {
            this.kpiEvolutionPct = cLen > 0 ? 100 : 0;
        }
        this.kpiEvolutionDirection = this.kpiEvolutionPct > 5 ? 'up' : this.kpiEvolutionPct < -5 ? 'down' : 'stable';

        this.kpiCritiques = list.filter(n => n.tone === 'DANGER' || n.tone === 'WARNING').length;
    }

    private computeDaysInRange(list: AppNotification[]): number {
        if (list.length < 2) return 1;
        const dates = list.map(n => n.date.getTime()).sort((a, b) => a - b);
        const diffMs = dates[dates.length - 1] - dates[0];
        const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
        return Math.max(1, diffDays);
    }

    private buildTimelineChart(list: AppNotification[]): void {
        const stats = this.aggregateByPeriod(list);
        const labels = stats.map(s => s.label);
        const info = stats.map(s => s.info);
        const warning = stats.map(s => s.warning);
        const danger = stats.map(s => s.danger);

        this.timelineData = {
            labels,
            datasets: [
                {
                    data: danger,
                    label: 'Critique',
                    borderColor: '#ef4444',
                    backgroundColor: 'rgba(239,68,68,0.15)',
                    fill: true,
                    tension: 0.4,
                    pointBackgroundColor: '#ef4444',
                    pointBorderColor: '#0f172a',
                    pointBorderWidth: 2,
                    pointRadius: 4,
                    pointHoverRadius: 7,
                    borderWidth: 2.5
                },
                {
                    data: warning,
                    label: 'Avertissement',
                    borderColor: '#f59e0b',
                    backgroundColor: 'rgba(245,158,11,0.12)',
                    fill: true,
                    tension: 0.4,
                    pointBackgroundColor: '#f59e0b',
                    pointBorderColor: '#0f172a',
                    pointBorderWidth: 2,
                    pointRadius: 4,
                    pointHoverRadius: 7,
                    borderWidth: 2.5
                },
                {
                    data: info,
                    label: 'Information',
                    borderColor: '#3b82f6',
                    backgroundColor: 'rgba(59,130,246,0.10)',
                    fill: true,
                    tension: 0.4,
                    pointBackgroundColor: '#3b82f6',
                    pointBorderColor: '#0f172a',
                    pointBorderWidth: 2,
                    pointRadius: 3,
                    pointHoverRadius: 6,
                    borderWidth: 2
                }
            ]
        };

        this.timelineOptions = {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: true,
                    position: 'top',
                    labels: { color: '#94a3b8', usePointStyle: true, padding: 16, font: { size: 11 } }
                },
                tooltip: {
                    backgroundColor: 'rgba(15,23,42,0.95)',
                    titleColor: '#e2e8f0',
                    bodyColor: '#94a3b8',
                    padding: 12,
                    cornerRadius: 10,
                    callbacks: {
                        label: (ctx: any) => ` ${ctx.dataset.label} : ${ctx.parsed.y}`
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    grid: { color: 'rgba(99,102,241,0.06)' },
                    ticks: { color: '#64748b', font: { size: 11 } },
                    border: { display: false }
                },
                x: {
                    grid: { display: false },
                    ticks: { color: '#94a3b8', font: { size: 10 } },
                    border: { display: false }
                }
            }
        };
    }

    private aggregateByPeriod(list: AppNotification[]): DailyStat[] {
        const map = new Map<string, DailyStat>();
        for (const n of list) {
            const key = this.formatPeriodKey(n.date);
            const existing = map.get(key) || { label: key, total: 0, info: 0, warning: 0, danger: 0 };
            existing.total++;
            const tone = n.tone || 'INFO';
            if (tone === 'DANGER') existing.danger++;
            else if (tone === 'WARNING') existing.warning++;
            else existing.info++;
            map.set(key, existing);
        }
        const sorted = Array.from(map.entries()).sort((a, b) => a[0].localeCompare(b[0]));
        return sorted.map(([, v]) => v);
    }

    private formatPeriodKey(date: Date): string {
        switch (this.filterGranularity) {
            case 'week': {
                const start = new Date(date);
                start.setDate(start.getDate() - start.getDay());
                const day = String(start.getDate()).padStart(2, '0');
                const month = String(start.getMonth() + 1).padStart(2, '0');
                return `Sem. ${day}/${month}`;
            }
            case 'month': {
                const months = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin', 'Juil', 'Août', 'Sep', 'Oct', 'Nov', 'Déc'];
                return months[date.getMonth()] + ' ' + date.getFullYear();
            }
            default: {
                const d = String(date.getDate()).padStart(2, '0');
                const m = String(date.getMonth() + 1).padStart(2, '0');
                return `${d}/${m}`;
            }
        }
    }

    private getTone(tone?: string): string {
        return tone || 'INFO';
    }

    private buildTypeDonut(list: AppNotification[]): void {
        const countMap = new Map<string, number>();
        for (const n of list) {
            const label = TYPE_LABELS[n.category] || n.category;
            countMap.set(label, (countMap.get(label) || 0) + 1);
        }
        const entries = Array.from(countMap.entries()).sort((a, b) => b[1] - a[1]);

        const bgColors = entries.map(([label]) => {
            const cat = Object.entries(TYPE_LABELS).find(([, v]) => v === label)?.[0];
            return cat ? (TYPE_COLORS[cat] || '#6366f1') : '#6366f1';
        });

        this.typeDonutData = {
            labels: entries.map(e => e[0]),
            datasets: [{
                data: entries.map(e => e[1]),
                backgroundColor: bgColors.map(c => c + 'CC'),
                hoverBackgroundColor: bgColors,
                borderWidth: 0,
                hoverOffset: 10
            }]
        };

        this.typeDonutOptions = ({
            responsive: true,
            maintainAspectRatio: false,
            cutout: '68%',
            plugins: {
                legend: {
                    display: true,
                    position: 'bottom',
                    labels: { color: '#94a3b8', padding: 10, usePointStyle: true, font: { size: 10 } }
                },
                tooltip: {
                    backgroundColor: 'rgba(15,23,42,0.95)',
                    titleColor: '#e2e8f0',
                    bodyColor: '#94a3b8',
                    padding: 12,
                    cornerRadius: 10,
                    callbacks: {
                        label: (ctx: any) => ` ${ctx.label} : ${ctx.parsed} notification(s)`
                    }
                }
            }
        } as any);
    }

    private populateTable(): void {
        const filtered = this.getFilteredNotifications();
        const rows: NotificationRow[] = filtered.map(n => ({
            id: n.id,
            date: n.date,
            dateLabel: n.time,
            type: n.category,
            typeLabel: TYPE_LABELS[n.category] || n.category,
            message: n.message,
            tone: this.getTone(n.tone)
        }));

        this.totalElements = rows.length;
        const start = this.pageIndex * this.pageSize;
        this.dataSource = rows.slice(start, start + this.pageSize);
    }

    getTypeColor(type: string): string {
        return TYPE_COLORS[type] || '#6366f1';
    }

    getSeverityColor(tone: string): string {
        return TONE_COLORS[tone] || '#3b82f6';
    }

    getSeverityIcon(tone: string): string {
        return TONE_ICONS[tone] || 'info';
    }

    getSeverityLabel(tone: string): string {
        return TONE_LABELS[tone] || tone;
    }

    getSeverityClass(tone: string): string {
        const t = tone || 'INFO';
        if (t === 'DANGER') return 'nc-severity--danger';
        if (t === 'WARNING') return 'nc-severity--warning';
        if (t === 'SUCCESS') return 'nc-severity--success';
        return 'nc-severity--info';
    }

    getGranularityLabel(): string {
        switch (this.filterGranularity) {
            case 'week': return 'semaine';
            case 'month': return 'mois';
            default: return 'jour';
        }
    }

    onChartClick(type: string, event: any): void {
        if (!event?.active?.length) return;
        const idx = event.active[0]._index;
        if (idx == null) return;

        const allFiltered = this.getFilteredNotifications();
        const stats = this.aggregateByPeriod(allFiltered);

        if (type === 'timeline') {
            const stat = stats[idx];
            if (!stat) return;
            const periodNotifs = allFiltered.filter(n => this.formatPeriodKey(n.date) === stat.label);
            const toneCounts = new Map<string, number>();
            for (const n of periodNotifs) {
                const t = TONE_LABELS[n.tone || 'INFO'] || 'Information';
                toneCounts.set(t, (toneCounts.get(t) || 0) + 1);
            }
            this.openDrillDown({
                title: `Période du ${stat.label}`,
                statLabel: 'Total notifications',
                statValue: stat.total,
                details: Array.from(toneCounts.entries()).map(([label, count]) => ({
                    icon: label === 'Critique' ? 'error' : label === 'Avertissement' ? 'warning' : 'info',
                    label, value: `${count} notif.`,
                    color: label === 'Critique' ? '#ef4444' : label === 'Avertissement' ? '#f59e0b' : '#3b82f6'
                })),
                items: periodNotifs.map(n => ({
                    id: n.id, date: n.date, dateLabel: n.time,
                    type: n.category, typeLabel: TYPE_LABELS[n.category] || n.category,
                    message: n.message, tone: this.getTone(n.tone)
                })).slice(0, 50)
            });
        } else if (type === 'donut') {
            const label = this.typeDonutData.labels?.[idx] as string || '';
            const cat = Object.entries(TYPE_LABELS).find(([, v]) => v === label)?.[0];
            const catNotifs = allFiltered.filter(n => (cat ? n.category === cat : false));
            this.openDrillDown({
                title: `Type : ${label}`,
                statLabel: 'Notifications',
                statValue: catNotifs.length,
                details: [
                    { icon: 'error', label: 'Dont critiques', value: `${catNotifs.filter(n => n.tone === 'DANGER').length}`, color: '#ef4444' },
                    { icon: 'warning', label: 'Dont avertissements', value: `${catNotifs.filter(n => n.tone === 'WARNING').length}`, color: '#f59e0b' },
                    { icon: 'info', label: 'Dont informations', value: `${catNotifs.filter(n => !n.tone || n.tone === 'INFO' || n.tone === 'SUCCESS').length}`, color: '#3b82f6' },
                    { icon: 'access_time', label: 'Dernière', value: catNotifs.length > 0 ? catNotifs[catNotifs.length - 1].time : '—', color: '#94a3b8' }
                ],
                items: catNotifs.map(n => ({
                    id: n.id, date: n.date, dateLabel: n.time,
                    type: n.category, typeLabel: TYPE_LABELS[n.category] || n.category,
                    message: n.message, tone: this.getTone(n.tone)
                })).slice(0, 50)
            });
        }
    }

    onRowClick(row: NotificationRow): void {
        const full = this.notifications.find(n => n.id === row.id);
        if (!full) return;
        this.openDrillDown({
            title: `Notification #${row.id}`,
            details: [
                { icon: 'category', label: 'Type', value: row.typeLabel, color: this.getTypeColor(row.type) },
                { icon: this.getSeverityIcon(row.tone), label: 'Sévérité', value: this.getSeverityLabel(row.tone), color: this.getSeverityColor(row.tone) },
                { icon: 'access_time', label: 'Date', value: row.dateLabel, color: '#94a3b8' },
                { icon: 'message', label: 'Message', value: row.message, color: '#e2e8f0' },
                { icon: 'label', label: 'Catégorie brute', value: row.type, color: '#64748b' }
            ]
        });
    }

    openDrillDown(data: DrillDownData): void {
        this.drillDownData = data;
        this.drillDownOpen = true;
        this.cdr.detectChanges();
    }

    closeDrillDown(): void {
        this.drillDownOpen = false;
        this.drillDownData = null;
        this.cdr.detectChanges();
    }
}
