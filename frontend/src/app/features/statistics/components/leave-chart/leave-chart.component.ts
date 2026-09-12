import { Component, OnInit, ChangeDetectorRef, OnDestroy, ViewChildren, QueryList } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { BaseChartDirective } from 'ng2-charts';
import { ChartConfiguration, ChartType, ChartEvent, ActiveElement } from 'chart.js';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { Subject, takeUntil } from 'rxjs';
import { LeaveService, LeaveRecord, LeaveStatusCode, LeaveTypeCode } from '../../../../core/services/leave.service';
import { AuthService } from '../../../../core/auth.service';

interface LeaveTableRow {
    id: string;
    requesterName: string;
    type: string;
    startDate: string;
    endDate: string;
    duration: number;
    status: string;
    statusClass: string;
    comment: string;
    approver: string;
}

interface TopDriver {
    name: string;
    totalDays: number;
    leaveCount: number;
    percentage: number;
}

interface DrillDownData {
    monthLabel: string;
    monthIndex: number;
    leaves: LeaveRecord[];
    totalDays: number;
    approvedCount: number;
    pendingCount: number;
    rejectedCount: number;
}

@Component({
    selector: 'app-leave-chart',
    standalone: true,
    imports: [
        CommonModule,
        FormsModule,
        BaseChartDirective,
        MatCardModule,
        MatIconModule,
        MatTableModule,
        MatPaginatorModule
    ],
    templateUrl: './leave-chart.component.html',
    styleUrls: ['./leave-chart.component.css']
})
export class LeaveChartComponent implements OnInit, OnDestroy {
    @ViewChildren(BaseChartDirective) charts!: QueryList<BaseChartDirective>;

    private readonly destroy$ = new Subject<void>();

    /* ─── Data ───────────────────────────────────────────────── */
    allLeaves: LeaveRecord[] = [];

    /* ─── KPIs ───────────────────────────────────────────────── */
    kpiTotal = 0;
    kpiApproved = 0;
    kpiRejected = 0;
    kpiPending = 0;
    kpiAvgProcessingDays = 0;
    kpiApprovalRate = 0;
    kpiAvgDaysPerLeave = 0;

    /* ─── Trend Indicators ───────────────────────────────────── */
    trendTotal = 0;
    trendApproved = 0;
    trendRejected = 0;
    trendPending = 0;

    /* ─── Peak & Insights ────────────────────────────────────── */
    peakMonth = '';
    peakMonthCount = 0;
    totalLeaveDays = 0;

    /* ─── Top Chauffeurs ─────────────────────────────────────── */
    topDrivers: TopDriver[] = [];

    /* ─── Drill-Down Panel ───────────────────────────────────── */
    drillDownOpen = false;
    drillDownData: DrillDownData | null = null;

    /* ─── Filters ────────────────────────────────────────────── */
    selectedStatus: LeaveStatusCode | '' = '';
    readonly statusOptions = [
        { value: '', label: 'Tous les statuts' },
        { value: 'APPROUVE', label: 'Approuvé' },
        { value: 'REJETE', label: 'Refusé' },
        { value: 'EN_ATTENTE', label: 'En attente' },
        { value: 'ANNULE', label: 'Annulé' }
    ];

    selectedType: LeaveTypeCode | '' = '';
    readonly typeOptions = [
        { value: '', label: 'Tous les types' },
        { value: 'VACANCES', label: 'Vacances' },
        { value: 'MALADIE', label: 'Maladie' },
        { value: 'MARIAGE', label: 'Mariage' }
    ];

    filterDateFrom = '';
    filterDateTo = '';
    selectedRequester = '';
    requesters: { id: string; name: string }[] = [];

    /* ─── Table ──────────────────────────────────────────────── */
    displayedColumns: string[] = ['requesterName', 'type', 'dates', 'duration', 'status', 'approver'];
    dataSource: LeaveTableRow[] = [];
    pageIndex = 0;
    pageSize = 10;
    totalElements = 0;

    /* ─── Month Names ────────────────────────────────────────── */
    readonly monthNames = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin', 'Juil', 'Août', 'Sep', 'Oct', 'Nov', 'Déc'];
    readonly monthNamesFull = ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin', 'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'];

    /* ─── Charts ─────────────────────────────────────────────── */
    readonly monthlyChartType: ChartType = 'bar';
    readonly statusChartType: ChartType = 'doughnut';
    readonly typeChartType: ChartType = 'bar';

    /* ─── Monthly Chart ──────────────────────────────────────── */
    monthlyChartOptions: ChartConfiguration['options'] = {
        responsive: true,
        maintainAspectRatio: false,
        animation: { duration: 900, easing: 'easeOutQuart' },
        onClick: (_event: ChartEvent, elements: ActiveElement[]) => {
            if (elements.length > 0) {
                const index = elements[0].index;
                this.openDrillDown(index);
            }
        },
        plugins: {
            legend: { display: true, position: 'top', labels: { color: '#94a3b8', usePointStyle: true, padding: 20, font: { size: 12, weight: 500 } } },
            tooltip: {
                backgroundColor: 'rgba(15,23,42,0.95)',
                titleColor: '#e2e8f0',
                bodyColor: '#94a3b8',
                borderColor: 'rgba(139,92,246,0.4)',
                borderWidth: 1,
                padding: 14,
                cornerRadius: 12,
                displayColors: true,
                callbacks: {
                    afterBody: () => ['', '🖱️ Cliquez pour voir les détails']
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
                ticks: { color: '#94a3b8', font: { size: 11, weight: 500 } },
                border: { display: false }
            }
        }
    };
    monthlyChartData: ChartConfiguration['data'] = { labels: [], datasets: [] };

    /* ─── Status Doughnut Chart ──────────────────────────────── */
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    statusChartOptions: any = {
        responsive: true,
        maintainAspectRatio: false,
        animation: { duration: 900, easing: 'easeOutQuart' },
        cutout: '72%',
        plugins: {
            legend: {
                display: true,
                position: 'bottom',
                labels: { color: '#94a3b8', padding: 16, usePointStyle: true, pointStyleWidth: 8, font: { size: 11 } }
            },
            tooltip: {
                backgroundColor: 'rgba(15,23,42,0.95)',
                titleColor: '#e2e8f0',
                bodyColor: '#94a3b8',
                borderColor: 'rgba(255,255,255,0.1)',
                borderWidth: 1,
                padding: 14,
                cornerRadius: 12
            }
        }
    };
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    statusChartData: any = { labels: [], datasets: [{ data: [] }] };

    /* ─── Type Bar Chart ─────────────────────────────────────── */
    typeChartOptions: ChartConfiguration['options'] = {
        responsive: true,
        maintainAspectRatio: false,
        animation: { duration: 900, easing: 'easeOutQuart' },
        indexAxis: 'y',
        plugins: {
            legend: { display: false },
            tooltip: {
                backgroundColor: 'rgba(15,23,42,0.95)',
                padding: 14,
                cornerRadius: 12,
                titleColor: '#e2e8f0',
                bodyColor: '#94a3b8'
            }
        },
        scales: {
            x: {
                beginAtZero: true,
                grid: { color: 'rgba(99,102,241,0.06)' },
                ticks: { color: '#64748b', font: { size: 11 } },
                border: { display: false }
            },
            y: {
                grid: { display: false },
                ticks: { color: '#94a3b8', font: { size: 12, weight: 'bold' } },
                border: { display: false }
            }
        }
    };
    typeChartData: ChartConfiguration['data'] = { labels: [], datasets: [] };

    /* ─── Getters ────────────────────────────────────────────── */
    get hasActiveFilters(): boolean {
        return !!(this.selectedStatus || this.selectedType || this.filterDateFrom || this.filterDateTo || this.selectedRequester);
    }

    get activeFilterCount(): number {
        return (this.selectedStatus ? 1 : 0) + (this.selectedType ? 1 : 0)
            + (this.filterDateFrom ? 1 : 0) + (this.filterDateTo ? 1 : 0)
            + (this.selectedRequester ? 1 : 0);
    }

    get userRole(): string {
        return this.authService.getUser()?.role ?? 'CHAUFFEUR';
    }

    /* ─── Constructor ────────────────────────────────────────── */
    constructor(
        private readonly leaveService: LeaveService,
        private readonly authService: AuthService,
        private readonly cdr: ChangeDetectorRef
    ) { }

    /* ─── Lifecycle ──────────────────────────────────────────── */
    ngOnInit(): void {
        this.loadLeaves();
    }

    ngOnDestroy(): void {
        this.destroy$.next();
        this.destroy$.complete();
    }

    /* ─── Data Loading ───────────────────────────────────────── */
    private loadLeaves(): void {
        this.leaveService.getLeaves()
            .pipe(takeUntil(this.destroy$))
            .subscribe({
                next: leaves => {
                    this.allLeaves = leaves;
                    this.extractRequesters();
                    this.applyFiltersAndPaginate();
                    this.updateCharts();
                    this.computeTopDrivers();
                    this.computePeakMonth();
                    this.computeTrends();
                    this.cdr.detectChanges();
                },
                error: () => {
                    this.allLeaves = [];
                    this.dataSource = [];
                    this.totalElements = 0;
                    this.cdr.detectChanges();
                }
            });
    }

    private extractRequesters(): void {
        const map = new Map<string, string>();
        this.allLeaves.forEach(leave => {
            if (leave.requesterId && leave.requesterName) {
                map.set(String(leave.requesterId), leave.requesterName);
            }
        });
        this.requesters = Array.from(map, ([id, name]) => ({ id, name }));
    }

    /* ─── Filtering & Pagination ─────────────────────────────── */
    private getFiltered(): LeaveRecord[] {
        return this.allLeaves.filter(leave => {
            if (this.selectedStatus && leave.status !== this.selectedStatus) return false;
            if (this.selectedType && leave.type !== this.selectedType) return false;

            const startDate = leave.startDateIso ? new Date(leave.startDateIso) : null;
            if (this.filterDateFrom && startDate) {
                const from = new Date(this.filterDateFrom);
                from.setHours(0, 0, 0, 0);
                if (startDate < from) return false;
            }

            if (this.filterDateTo && startDate) {
                const to = new Date(this.filterDateTo);
                to.setHours(23, 59, 59, 999);
                if (startDate > to) return false;
            }

            if (this.selectedRequester && String(leave.requesterId) !== this.selectedRequester) {
                return false;
            }

            return true;
        });
    }

    applyFiltersAndPaginate(): void {
        const filtered = this.getFiltered();
        this.computeKpis(filtered);

        const rows = filtered.map(leave => this.mapLeaveToRow(leave));
        this.totalElements = rows.length;
        const start = this.pageIndex * this.pageSize;
        this.dataSource = rows.slice(start, start + this.pageSize);
        this.cdr.detectChanges();
    }

    private computeKpis(leaves: LeaveRecord[]): void {
        this.kpiTotal = leaves.length;
        this.kpiApproved = leaves.filter(l => l.status === 'APPROUVE').length;
        this.kpiRejected = leaves.filter(l => l.status === 'REJETE').length;
        this.kpiPending = leaves.filter(l => l.status === 'EN_ATTENTE').length;

        const processed = leaves.filter(l => l.status === 'APPROUVE' || l.status === 'REJETE');
        let totalDays = 0;
        processed.forEach(leave => {
            if (leave.createdAt && leave.updatedAt) {
                const created = new Date(leave.createdAt);
                const updated = new Date(leave.updatedAt);
                const diff = updated.getTime() - created.getTime();
                totalDays += Math.max(0, Math.floor(diff / (1000 * 60 * 60 * 24)));
            }
        });
        this.kpiAvgProcessingDays = processed.length ? Math.round(totalDays / processed.length) : 0;

        this.kpiApprovalRate = this.kpiTotal > 0 ? Math.round((this.kpiApproved / this.kpiTotal) * 100) : 0;

        this.totalLeaveDays = leaves.reduce((sum, l) => sum + l.duration, 0);
        this.kpiAvgDaysPerLeave = this.kpiTotal > 0 ? Math.round((this.totalLeaveDays / this.kpiTotal) * 10) / 10 : 0;
    }

    /* ─── Trends ─────────────────────────────────────────────── */
    private computeTrends(): void {
        const now = new Date();
        const currentMonth = now.getMonth();
        const currentYear = now.getFullYear();

        const thisMonthLeaves = this.allLeaves.filter(l => {
            if (!l.startDateIso) return false;
            const d = new Date(l.startDateIso);
            return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
        });

        const lastMonth = currentMonth === 0 ? 11 : currentMonth - 1;
        const lastMonthYear = currentMonth === 0 ? currentYear - 1 : currentYear;
        const lastMonthLeaves = this.allLeaves.filter(l => {
            if (!l.startDateIso) return false;
            const d = new Date(l.startDateIso);
            return d.getMonth() === lastMonth && d.getFullYear() === lastMonthYear;
        });

        const calcTrend = (current: number, previous: number): number => {
            if (previous === 0) return current > 0 ? 100 : 0;
            return Math.round(((current - previous) / previous) * 100);
        };

        this.trendTotal = calcTrend(thisMonthLeaves.length, lastMonthLeaves.length);
        this.trendApproved = calcTrend(
            thisMonthLeaves.filter(l => l.status === 'APPROUVE').length,
            lastMonthLeaves.filter(l => l.status === 'APPROUVE').length
        );
        this.trendRejected = calcTrend(
            thisMonthLeaves.filter(l => l.status === 'REJETE').length,
            lastMonthLeaves.filter(l => l.status === 'REJETE').length
        );
        this.trendPending = calcTrend(
            thisMonthLeaves.filter(l => l.status === 'EN_ATTENTE').length,
            lastMonthLeaves.filter(l => l.status === 'EN_ATTENTE').length
        );
    }

    /* ─── Peak Month ─────────────────────────────────────────── */
    private computePeakMonth(): void {
        const filtered = this.getFiltered();
        const monthCounts = new Array(12).fill(0);

        filtered.forEach(leave => {
            if (leave.startDateIso) {
                const date = new Date(leave.startDateIso);
                monthCounts[date.getMonth()]++;
            }
        });

        let maxCount = 0;
        let maxIndex = 0;
        monthCounts.forEach((count, index) => {
            if (count > maxCount) {
                maxCount = count;
                maxIndex = index;
            }
        });

        this.peakMonth = this.monthNamesFull[maxIndex];
        this.peakMonthCount = maxCount;
    }

    /* ─── Top Chauffeurs ─────────────────────────────────────── */
    private computeTopDrivers(): void {
        const filtered = this.getFiltered();
        const driverMap = new Map<string, { name: string; totalDays: number; leaveCount: number }>();

        filtered.forEach(leave => {
            const key = String(leave.requesterId);
            const existing = driverMap.get(key);
            if (existing) {
                existing.totalDays += leave.duration;
                existing.leaveCount++;
            } else {
                driverMap.set(key, {
                    name: leave.requesterName,
                    totalDays: leave.duration,
                    leaveCount: 1
                });
            }
        });

        const totalDaysAll = filtered.reduce((sum, l) => sum + l.duration, 0);
        const drivers = Array.from(driverMap.values())
            .map(d => ({
                ...d,
                percentage: totalDaysAll > 0 ? Math.round((d.totalDays / totalDaysAll) * 100) : 0
            }))
            .sort((a, b) => b.totalDays - a.totalDays)
            .slice(0, 5);

        this.topDrivers = drivers;
    }

    /* ─── Drill-Down ─────────────────────────────────────────── */
    openDrillDown(monthIndex: number): void {
        const filtered = this.getFiltered();
        const monthLeaves = filtered.filter(leave => {
            if (!leave.startDateIso) return false;
            const date = new Date(leave.startDateIso);
            return date.getMonth() === monthIndex;
        });

        this.drillDownData = {
            monthLabel: this.monthNamesFull[monthIndex],
            monthIndex,
            leaves: monthLeaves,
            totalDays: monthLeaves.reduce((sum, l) => sum + l.duration, 0),
            approvedCount: monthLeaves.filter(l => l.status === 'APPROUVE').length,
            pendingCount: monthLeaves.filter(l => l.status === 'EN_ATTENTE').length,
            rejectedCount: monthLeaves.filter(l => l.status === 'REJETE').length
        };
        this.drillDownOpen = true;
        this.cdr.detectChanges();
    }

    closeDrillDown(): void {
        this.drillDownOpen = false;
        this.drillDownData = null;
        this.cdr.detectChanges();
    }

    getStatusIcon(status: LeaveStatusCode): string {
        switch (status) {
            case 'APPROUVE': return 'check_circle';
            case 'REJETE': return 'cancel';
            case 'EN_ATTENTE': return 'pending';
            case 'ANNULE': return 'block';
            default: return 'help';
        }
    }

    getStatusColorClass(status: LeaveStatusCode): string {
        switch (status) {
            case 'APPROUVE': return 'dd-status--approved';
            case 'REJETE': return 'dd-status--rejected';
            case 'EN_ATTENTE': return 'dd-status--pending';
            case 'ANNULE': return 'dd-status--cancelled';
            default: return '';
        }
    }

    private mapLeaveToRow(leave: LeaveRecord): LeaveTableRow {
        return {
            id: leave.id,
            requesterName: leave.requesterName,
            type: leave.typeLabel,
            startDate: leave.startDate,
            endDate: leave.endDate,
            duration: leave.duration,
            status: leave.statusLabel,
            statusClass: this.getStatusClass(leave.status),
            comment: leave.comment || '-',
            approver: leave.managerName || '-'
        };
    }

    private getStatusClass(status: LeaveStatusCode): string {
        switch (status) {
            case 'APPROUVE': return 'approved';
            case 'REJETE': return 'rejected';
            case 'EN_ATTENTE': return 'pending';
            case 'ANNULE': return 'cancelled';
            default: return 'unknown';
        }
    }

    /* ─── Charts ─────────────────────────────────────────────── */
    private updateCharts(): void {
        const leaves = this.getFiltered();
        this.buildMonthlyChart(leaves);
        this.buildStatusChart(leaves);
        this.buildTypeChart(leaves);
    }

    private buildMonthlyChart(leaves: LeaveRecord[]): void {
        const monthCounts: { [key: string]: { partial: number; full: number } } = {};

        this.monthNames.forEach(month => {
            monthCounts[month] = { partial: 0, full: 0 };
        });

        leaves.forEach(leave => {
            if (leave.startDateIso) {
                const date = new Date(leave.startDateIso);
                const monthName = this.monthNames[date.getMonth()];
                if (leave.duration <= 7) {
                    monthCounts[monthName].partial += 1;
                } else {
                    monthCounts[monthName].full += 1;
                }
            }
        });

        const labels = this.monthNames;
        const partialData = labels.map(month => monthCounts[month].partial);
        const fullData = labels.map(month => monthCounts[month].full);

        this.monthlyChartData = {
            labels,
            datasets: [
                {
                    data: partialData,
                    label: 'Congé court (≤7j)',
                    backgroundColor: 'rgba(139,92,246,0.65)',
                    hoverBackgroundColor: 'rgba(139,92,246,0.85)',
                    borderColor: '#8b5cf6',
                    borderWidth: 0,
                    borderRadius: 8,
                    barPercentage: 0.7,
                    categoryPercentage: 0.6
                },
                {
                    data: fullData,
                    label: 'Congé long (>7j)',
                    backgroundColor: 'rgba(236,72,153,0.55)',
                    hoverBackgroundColor: 'rgba(236,72,153,0.8)',
                    borderColor: '#ec4899',
                    borderWidth: 0,
                    borderRadius: 8,
                    barPercentage: 0.7,
                    categoryPercentage: 0.6
                }
            ]
        };
    }

    private buildStatusChart(leaves: LeaveRecord[]): void {
        const approved = leaves.filter(l => l.status === 'APPROUVE').length;
        const rejected = leaves.filter(l => l.status === 'REJETE').length;
        const pending = leaves.filter(l => l.status === 'EN_ATTENTE').length;
        const cancelled = leaves.filter(l => l.status === 'ANNULE').length;

        this.statusChartData = {
            labels: ['Approuvé', 'Refusé', 'En attente', 'Annulé'],
            datasets: [{
                data: [approved, rejected, pending, cancelled],
                backgroundColor: [
                    'rgba(16,185,129,0.8)', 'rgba(239,68,68,0.8)',
                    'rgba(99,102,241,0.8)', 'rgba(100,116,139,0.5)'
                ],
                hoverBackgroundColor: ['#10b981', '#ef4444', '#6366f1', '#64748b'],
                borderWidth: 0,
                hoverOffset: 8
            }]
        };
    }

    private buildTypeChart(leaves: LeaveRecord[]): void {
        const typeCounts: { [key: string]: number } = {
            'Vacances': 0,
            'Maladie': 0,
            'Mariage': 0
        };

        leaves.forEach(leave => {
            if (typeCounts[leave.typeLabel] !== undefined) {
                typeCounts[leave.typeLabel]++;
            }
        });

        const labels = Object.keys(typeCounts);
        const data = labels.map(label => typeCounts[label]);
        const colors = [
            'rgba(245,158,11,0.75)', 'rgba(239,68,68,0.75)', 'rgba(236,72,153,0.75)'
        ];
        const hoverColors = ['rgba(245,158,11,0.95)', 'rgba(239,68,68,0.95)', 'rgba(236,72,153,0.95)'];

        this.typeChartData = {
            labels,
            datasets: [{
                data,
                label: 'Demandes',
                backgroundColor: colors,
                hoverBackgroundColor: hoverColors,
                borderRadius: 8,
                barThickness: 28,
                borderWidth: 0
            }]
        };
    }

    /* ─── UI Handlers ────────────────────────────────────────── */
    onPageChange(event: PageEvent): void {
        this.pageIndex = event.pageIndex;
        this.pageSize = event.pageSize;
        this.applyFiltersAndPaginate();
    }

    onStatusChange(value: string): void {
        this.selectedStatus = value as LeaveStatusCode | '';
        this.pageIndex = 0;
        this.applyFiltersAndPaginate();
        this.updateCharts();
        this.computeTopDrivers();
        this.computePeakMonth();
    }

    onTypeChange(value: string): void {
        this.selectedType = value as LeaveTypeCode | '';
        this.pageIndex = 0;
        this.applyFiltersAndPaginate();
        this.updateCharts();
        this.computeTopDrivers();
        this.computePeakMonth();
    }

    onDateFromChange(value: string): void {
        this.filterDateFrom = value;
        this.pageIndex = 0;
        this.applyFiltersAndPaginate();
        this.updateCharts();
        this.computeTopDrivers();
        this.computePeakMonth();
    }

    onDateToChange(value: string): void {
        this.filterDateTo = value;
        this.pageIndex = 0;
        this.applyFiltersAndPaginate();
        this.updateCharts();
        this.computeTopDrivers();
        this.computePeakMonth();
    }

    onRequesterChange(value: string): void {
        this.selectedRequester = value;
        this.pageIndex = 0;
        this.applyFiltersAndPaginate();
        this.updateCharts();
        this.computeTopDrivers();
        this.computePeakMonth();
    }

    clearFilters(): void {
        this.selectedStatus = '';
        this.selectedType = '';
        this.filterDateFrom = '';
        this.filterDateTo = '';
        this.selectedRequester = '';
        this.pageIndex = 0;
        this.applyFiltersAndPaginate();
        this.updateCharts();
        this.computeTopDrivers();
        this.computePeakMonth();
    }

    /* ─── Helpers ────────────────────────────────────────────── */
    getTypeIcon(type: string): string {
        switch (type) {
            case 'Vacances': return 'beach_access';
            case 'Maladie': return 'local_hospital';
            case 'Mariage': return 'favorite';
            default: return 'event_busy';
        }
    }

    trackByLeaveId(_index: number, leave: LeaveRecord): string {
        return leave.id;
    }
}
