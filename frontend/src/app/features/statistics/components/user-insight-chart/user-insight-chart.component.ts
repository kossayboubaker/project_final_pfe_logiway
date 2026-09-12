import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { BaseChartDirective } from 'ng2-charts';
import { ChartConfiguration, ChartType } from 'chart.js';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { Subject, takeUntil } from 'rxjs';
import { UserService } from '../../../../core/services/user.service';

interface StatusChangeLog {
    id: number;
    date: string;
    userName: string;
    role: string;
    oldStatus: string;
    newStatus: string;
    approver: string;
    userId: number;
    changeCount?: number; // Number of status changes for this user
}

interface UserRating {
    userId: number;
    userName: string;
    role: string;
    attendanceScore: number; // 0-40 pts (based on activity)
    disciplineScore: number; // 0-30 pts (based on compliance)
    presenceScore: number;   // 0-30 pts (based on engagement)
    totalScore: number;      // 0-100
    rating: string;          // S, A, B, C, D, F
    ratingColor: string;
}



interface ActiveUserItem {
    id: number;
    name: string;
    role: string;
    roleLabel: string;
    sessions: number;
    totalTimeMin: number;
    lastActive: string;
}

@Component({
    selector: 'app-user-insight-chart',
    standalone: true,
    imports: [
        CommonModule,
        FormsModule,
        BaseChartDirective,
        MatIconModule,
        MatTableModule,
        MatPaginatorModule
    ],
    templateUrl: './user-insight-chart.component.html',
    styleUrls: ['./user-insight-chart.component.css']
})
export class UserInsightChartComponent implements OnInit, OnDestroy {
    private readonly destroy$ = new Subject<void>();

    /* ─── Raw Data ─────────────────────────────────── */
    allUsers: any[] = [];
    filteredUsers: any[] = [];

    /* ─── Filters ──────────────────────────────────── */
    filterRole = '';
    filterStatus = ''; // Nouveau filtre pour les statuts
    roles: string[] = ['SUPERADMIN', 'MANAGER', 'CHAUFFEUR'];
    statuses = [
        { value: '', label: 'Tous les statuts' },
        { value: 'ACTIF', label: 'Actifs' },
        { value: 'INACTIF', label: 'En Attente' },
        { value: 'REJETE', label: 'Rejetés / Désactivés' }
    ];

    /* ─── KPIs ─────────────────────────────────────── */
    kpiTotal = 0;
    kpiActive = 0;
    kpiPending = 0;
    kpiRejected = 0;
    kpiAvgSessionDuration = 15.4;
    kpiRetentionRate = 96.2;
    kpiAvgApprovalDelay = 2.4;
    kpiAvgRatingScore = 0; // NOUVEAU

    /* ─── Trends (Google Ads Style) ────────────────── */
    trendTotal = 4.8;
    trendActive = 6.2;
    trendPending = -12.5;
    trendRejected = -8.1;
    trendSession = 3.5;

    /* ─── Chart Configurations ─────────────────────── */
    readonly stackedAreaType: ChartType = 'line';
    stackedAreaData: ChartConfiguration['data'] = { labels: [], datasets: [] };
    stackedAreaOptions: any = {};

    readonly donutType: ChartType = 'doughnut';
    donutData: ChartConfiguration['data'] = { labels: [], datasets: [] };
    donutOptions: any = {};

    readonly barChartType: ChartType = 'bar';
    barChartData: ChartConfiguration['data'] = { labels: [], datasets: [] };
    barChartOptions: any = {};

    /* ─── Lists and Tables ─────────────────────────── */
    topUsers: ActiveUserItem[] = [];
    userRatings: UserRating[] = []; // User rating system

    /* ─── Drill-down State ─────────────────────────── */
    drillDownOpen = false;
    drillDownType: 'user' | 'kpi' | 'status' | null = null;
    drillDownData: any = null;
    drillDownTitle = '';
    drillDownSearchQuery = ''; // NOUVEAU

    /* ─── Logs Pagination ──────────────────────────── */
    logDisplayedColumns = ['date', 'user', 'role', 'oldStatus', 'newStatus', 'changeCount'];
    logDataSource: StatusChangeLog[] = [];
    logPageIndex = 0;
    logPageSize = 5;
    logTotalElements = 0;
    allLogs: StatusChangeLog[] = [];
    userChangeCountMap: Map<number, number> = new Map(); // Track changes per user

    /* ─── Constructor ──────────────────────────────── */
    constructor(
        private readonly userService: UserService,
        private readonly cdr: ChangeDetectorRef
    ) { }

    /* ─── Lifecycle ────────────────────────────────── */
    ngOnInit(): void {
        this.loadUsers();
    }

    ngOnDestroy(): void {
        this.destroy$.next();
        this.destroy$.complete();
    }

    /* ═══════════════════════════════════════════════════
       DATA LOADING
       ═══════════════════════════════════════════════════ */
    private loadUsers(): void {
        this.userService.list()
            .pipe(takeUntil(this.destroy$))
            .subscribe({
                next: (users) => {
                    const hasRealSectors = (users || []).some((u: any) => u.secteurNom && u.secteurNom !== 'Sans secteur');

                    // Mapper les utilisateurs bruts avec leurs vraies propriétés
                    this.allUsers = (users || []).map((u: any, idx: number) => {
                        // Si dateCreation n'existe pas ou est aujourd'hui, on simule une répartition sur 6 mois
                        let dateCreation = u.dateCreation ? new Date(u.dateCreation) : null;
                        if (!dateCreation) {
                            dateCreation = new Date();
                            // Répartir uniformément sur les 6 derniers mois (0 à 5 mois d'écart)
                            const monthOffset = idx % 6;
                            dateCreation.setMonth(dateCreation.getMonth() - monthOffset);
                            dateCreation.setDate(Math.floor(Math.random() * 28) + 1);
                        }

                        // Corriger les secteurs : assigner un secteur par défaut si "Sans secteur" ou absent, SEULEMENT s'il n'y a pas de vrais secteurs dans la base
                        const defaultSecteurs = ['Tunis Centre', 'Sfax Maritime', 'Sousse Port', 'Nord-Ouest'];
                        const secteurNom = u.secteurNom && u.secteurNom !== 'Sans secteur'
                            ? u.secteurNom
                            : (hasRealSectors ? 'Sans secteur' : defaultSecteurs[idx % defaultSecteurs.length]);

                        return {
                            id: u.id,
                            name: `${u.prenom || ''} ${u.nom || ''}`.trim() || u.email,
                            email: u.email,
                            role: u.role || 'CHAUFFEUR',
                            secteurNom: secteurNom,
                            estActif: (() => {
                                const rawStatus = u.estActif;
                                if (rawStatus === true || rawStatus === 'ACTIF' || rawStatus === 'Actif') return 'ACTIF';
                                if (rawStatus === 'REJETE' || rawStatus === 'Rejeté' || rawStatus === 'REJECTED') return 'REJETE';
                                return 'INACTIF';
                            })(),
                            dateCreation: dateCreation,
                            emailVerifie: u.emailVerifie || false,
                            actif: u.actif || false,
                            simulatedMonthOffset: idx % 6 // Garder la référence pour l'historique mensuel
                        };
                    });

                    this.generateMockLogsAndStats();
                    this.refreshAll();
                },
                error: () => {
                    this.allUsers = [];
                    this.cdr.detectChanges();
                }
            });
    }

    /* ═══════════════════════════════════════════════════
       REFRESH LOGIC
       ═══════════════════════════════════════════════════ */
    refreshAll(): void {
        this.applyFilters();
        this.computeUserRatings(); // Compute ratings first so KPIs can use them
        this.computeKpis();
        this.computeTopUsers();
        this.buildCharts();
        this.paginateLogs();
        this.cdr.detectChanges();
    }

    private applyFilters(): void {
        this.filteredUsers = this.allUsers.filter(u => {
            if (this.filterRole && u.role !== this.filterRole) return false;
            if (this.filterStatus && u.estActif !== this.filterStatus) return false;
            return true;
        });
    }

    /* ═══════════════════════════════════════════════════
       KPIs & LISTS COMPUTATION
       ═══════════════════════════════════════════════════ */
    private computeKpis(): void {
        const total = this.filteredUsers.length;
        this.kpiTotal = total;
        this.kpiActive = this.filteredUsers.filter(u => u.estActif === 'ACTIF').length;
        this.kpiPending = this.filteredUsers.filter(u => u.estActif === 'INACTIF').length;
        this.kpiRejected = this.filteredUsers.filter(u => u.estActif === 'REJETE').length;

        // Calculs intelligents basés sur les données réelles
        // 1. Durée de session moyenne (estimation intelligente)
        this.kpiAvgSessionDuration = this.computeIntelligentSessionDuration();

        // 2. Taux de rétention des comptes actifs (%)
        this.kpiRetentionRate = this.computeRetentionRate();

        // 3. Délai moyen d'approbation (jours)
        this.kpiAvgApprovalDelay = this.computeAvgApprovalDelay();

        // Calcul du trend de session dynamique
        this.trendSession = this.kpiAvgSessionDuration > 15 ? 3.5 : -2.1;

        // 4. Score de Performance Global Moyen (Basé sur les notations calculées)
        const ratingScores = this.userRatings.map(r => r.totalScore);
        this.kpiAvgRatingScore = ratingScores.length > 0
            ? Math.round((ratingScores.reduce((a, b) => a + b, 0) / ratingScores.length) * 10) / 10
            : 0;
    }

    /**
     * Calcule intelligemment la durée moyenne de session
     * Basé sur le rôle et le niveau d'activité
     */
    private computeIntelligentSessionDuration(): number {
        if (this.filteredUsers.length === 0) return 0;

        // Estimation par rôle (basée sur les patterns observés)
        const roleDurations = {
            'SUPERADMIN': 22.5, // Admins passent plus de temps sur la plateforme
            'MANAGER': 18.0,    // Managers: temps moyen
            'CHAUFFEUR': 12.0   // Chauffeurs: sessions plus courtes
        };

        // Calculer la moyenne pondérée selon les rôles présents
        let totalDuration = 0;
        let count = 0;

        this.filteredUsers.forEach(u => {
            const baseDuration = roleDurations[u.role as keyof typeof roleDurations] || 15;
            // Ajuster légèrement selon l'ancienneté (utilisateurs plus anciens = sessions plus longues)
            const daysSinceCreation = u.dateCreation
                ? Math.floor((new Date().getTime() - u.dateCreation.getTime()) / (1000 * 60 * 60 * 24))
                : 0;
            const experienceFactor = Math.min(daysSinceCreation / 30, 1.3); // Max 30% bonus
            const adjustedDuration = baseDuration * (0.8 + experienceFactor * 0.5);

            totalDuration += adjustedDuration;
            count++;
        });

        return count > 0 ? Math.round((totalDuration / count) * 10) / 10 : 0;
    }

    /**
     * Calcule le taux de rétention des comptes actifs
     * Ratio des comptes restés actifs sur total des comptes approuvés
     */
    private computeRetentionRate(): number {
        const everApproved = this.filteredUsers.filter(u =>
            u.estActif === 'ACTIF' || u.estActif === 'INACTIF'
        ).length;

        if (everApproved === 0) return 0;

        const stillActive = this.kpiActive;
        const rate = (stillActive / everApproved) * 100;

        return Math.round(rate * 10) / 10;
    }

    /**
     * Calcule le délai moyen d'approbation en jours
     * Estimation basée sur l'ancienneté des comptes en attente
     */
    private computeAvgApprovalDelay(): number {
        const pendingUsers = this.filteredUsers.filter(u => u.estActif === 'INACTIF');

        if (pendingUsers.length === 0) return 0;

        // Calculer le nombre de jours depuis la création pour les comptes en attente
        let totalDays = 0;
        pendingUsers.forEach(u => {
            if (u.dateCreation) {
                const days = Math.floor((new Date().getTime() - u.dateCreation.getTime()) / (1000 * 60 * 60 * 24));
                totalDays += Math.min(days, 30); // Cap à 30 jours max pour éviter outliers
            }
        });

        const avgDelay = pendingUsers.length > 0 ? totalDays / pendingUsers.length : 0;
        return Math.round(avgDelay * 10) / 10;
    }

    private computeTopUsers(): void {
        // Calculer intelligemment les métriques d'activité pour chaque utilisateur
        this.topUsers = this.filteredUsers
            .filter(u => u.estActif === 'ACTIF') // Seulement les utilisateurs actifs
            .map(u => {
                // Calculer les sessions basées sur l'ancienneté et le rôle
                const daysSinceCreation = u.dateCreation
                    ? Math.floor((new Date().getTime() - u.dateCreation.getTime()) / (1000 * 60 * 60 * 24))
                    : 1;

                // Sessions par jour varie selon le rôle
                const sessionsPerDay = {
                    'SUPERADMIN': 3.5,
                    'MANAGER': 2.8,
                    'CHAUFFEUR': 2.0
                }[u.role as string] || 2.0;

                const totalSessions = Math.floor(Math.min(daysSinceCreation, 30) * sessionsPerDay);

                // Temps total basé sur durée de session moyenne et nombre de sessions
                const avgSessionMin = {
                    'SUPERADMIN': 22,
                    'MANAGER': 18,
                    'CHAUFFEUR': 12
                }[u.role as string] || 15;

                const totalTimeMin = totalSessions * avgSessionMin;

                // Dernière activité estimée (plus récent pour les comptes récents)
                const lastActiveTexts = daysSinceCreation < 1
                    ? 'Il y a quelques minutes'
                    : daysSinceCreation < 2
                        ? 'Hier'
                        : `Il y a ${Math.min(daysSinceCreation, 7)} jour(s)`;

                return {
                    id: u.id,
                    name: u.name,
                    role: u.role,
                    roleLabel: this.getRoleLabel(u.role),
                    sessions: totalSessions,
                    totalTimeMin,
                    lastActive: lastActiveTexts
                };
            })
            .sort((a, b) => b.sessions - a.sessions)
            .slice(0, 8); // Top 8 utilisateurs
    }



    /* ═══════════════════════════════════════════════════
       USER RATING SYSTEM (Attendance, Discipline, Presence)
       ═══════════════════════════════════════════════════ */
    private computeUserRatings(): void {
        this.userRatings = this.filteredUsers.map(u => {
            // 1. Attendance Score (0-40 pts) - Based on account status and activity
            let attendanceScore = 0;
            if (u.estActif === 'ACTIF') {
                attendanceScore = 40; // Full points for active users
            } else if (u.estActif === 'INACTIF') {
                attendanceScore = 20; // Partial points for pending
            } else {
                attendanceScore = 0; // No points for rejected
            }

            // Adjust based on account age (newer accounts get slight penalty)
            const daysSinceCreation = u.dateCreation
                ? Math.floor((new Date().getTime() - u.dateCreation.getTime()) / (1000 * 60 * 60 * 24))
                : 0;
            const ageFactor = Math.min(daysSinceCreation / 60, 1); // Full bonus after 60 days
            attendanceScore *= (0.7 + ageFactor * 0.3);

            // 2. Discipline Score (0-30 pts) - Based on status change frequency
            const changeCount = this.userChangeCountMap.get(u.id) || 1;
            let disciplineScore = 30;
            if (changeCount > 2) {
                disciplineScore = Math.max(10, 30 - (changeCount - 2) * 5); // Penalty for frequent changes
            }

            // 3. Presence Score (0-30 pts) - Based on role and engagement
            let presenceScore = 0;
            const roleBaseScore = {
                'SUPERADMIN': 28,
                'MANAGER': 25,
                'CHAUFFEUR': 22
            };
            presenceScore = roleBaseScore[u.role as keyof typeof roleBaseScore] || 20;

            // Adjust based on email verification
            if (u.emailVerifie) {
                presenceScore += 2;
            }

            // Total Score
            const totalScore = Math.round(attendanceScore + disciplineScore + presenceScore);

            // Rating classification
            let rating = 'F';
            let ratingColor = '#64748b';
            if (totalScore >= 90) {
                rating = 'S';
                ratingColor = '#a78bfa'; // Purple
            } else if (totalScore >= 80) {
                rating = 'A';
                ratingColor = '#10b981'; // Green
            } else if (totalScore >= 70) {
                rating = 'B';
                ratingColor = '#3b82f6'; // Blue
            } else if (totalScore >= 60) {
                rating = 'C';
                ratingColor = '#f59e0b'; // Amber
            } else if (totalScore >= 50) {
                rating = 'D';
                ratingColor = '#f97316'; // Orange
            } else {
                rating = 'F';
                ratingColor = '#ef4444'; // Red
            }

            return {
                userId: u.id,
                userName: u.name,
                role: u.role,
                attendanceScore: Math.round(attendanceScore),
                disciplineScore: Math.round(disciplineScore),
                presenceScore: Math.round(presenceScore),
                totalScore,
                rating,
                ratingColor
            };
        }).sort((a, b) => b.totalScore - a.totalScore);
    }

    /* ═══════════════════════════════════════════════════
       DRILL-DOWN FUNCTIONALITY
       ═══════════════════════════════════════════════════ */
    openUserDrillDown(user: any): void {
        this.drillDownType = 'user';
        this.drillDownTitle = `Détails - ${user.name}`;

        // Find user rating
        const userRating = this.userRatings.find(r => r.userId === user.id);

        // Find user logs
        const userLogs = this.allLogs.filter(log => log.userName === user.name);

        // Calculate user-specific stats
        const daysSinceCreation = user.dateCreation
            ? Math.floor((new Date().getTime() - user.dateCreation.getTime()) / (1000 * 60 * 60 * 24))
            : 0;
        const estimatedSessions = Math.floor(daysSinceCreation * 2.5);

        this.drillDownData = {
            ...user,
            rating: userRating,
            logs: userLogs,
            stats: {
                daysSinceCreation,
                estimatedSessions,
                statusChanges: this.userChangeCountMap.get(user.id) || 0,
                currentStatus: this.getStatusLabel(user.estActif),
                roleLabel: this.getRoleLabel(user.role)
            }
        };

        this.drillDownOpen = true;
        this.cdr.detectChanges();
    }

    openKpiDrillDown(kpiType: 'total' | 'active' | 'pending' | 'rejected'): void {
        this.drillDownType = 'kpi';
        this.drillDownSearchQuery = ''; // Clear search query on open

        let filteredUsers: any[] = [];
        let title = '';

        switch (kpiType) {
            case 'total':
                filteredUsers = this.filteredUsers;
                title = 'Tous les utilisateurs';
                break;
            case 'active':
                filteredUsers = this.filteredUsers.filter(u => u.estActif === 'ACTIF');
                title = 'Utilisateurs actifs';
                break;
            case 'pending':
                filteredUsers = this.filteredUsers.filter(u => u.estActif === 'INACTIF');
                title = 'Comptes en attente';
                break;
            case 'rejected':
                filteredUsers = this.filteredUsers.filter(u => u.estActif === 'REJETE');
                title = 'Comptes rejetés / désactivés';
                break;
        }

        this.drillDownTitle = title;
        this.drillDownData = {
            users: filteredUsers.map(u => ({
                ...u,
                rating: this.userRatings.find(r => r.userId === u.id),
                statusLabel: this.getStatusLabel(u.estActif),
                roleLabel: this.getRoleLabel(u.role)
            })),
            kpiType
        };

        this.drillDownOpen = true;
        this.cdr.detectChanges();
    }

    openStatusDrillDown(status: string): void {
        this.drillDownType = 'status';
        this.drillDownTitle = `Historique - ${status}`;

        const statusLogs = this.allLogs.filter(log => log.newStatus === status);

        this.drillDownData = {
            status,
            logs: statusLogs,
            count: statusLogs.length
        };

        this.drillDownOpen = true;
        this.cdr.detectChanges();
    }

    closeDrillDown(): void {
        this.drillDownOpen = false;
        this.drillDownType = null;
        this.drillDownData = null;
        this.drillDownTitle = '';
        this.drillDownSearchQuery = ''; // Reset search query on close
        this.cdr.detectChanges();
    }

    onDrillDownSearch(event: any): void {
        this.drillDownSearchQuery = event.target.value;
    }

    getFilteredDrillDownUsers(): any[] {
        if (!this.drillDownData || !this.drillDownData.users) return [];
        if (!this.drillDownSearchQuery) return this.drillDownData.users;
        const q = this.drillDownSearchQuery.toLowerCase().trim();
        return this.drillDownData.users.filter((u: any) =>
            (u.name && u.name.toLowerCase().includes(q)) ||
            (u.email && u.email.toLowerCase().includes(q))
        );
    }

    getUserRating(userId: number): UserRating | undefined {
        return this.userRatings.find(r => r.userId === userId);
    }

    findUserByName(userName: string): any {
        return this.allUsers.find(u => u.name === userName);
    }

    /* ═══════════════════════════════════════════════════
       MOCK DATA GENERATION (Based on Real Users)
       ═══════════════════════════════════════════════════ */
    private generateMockLogsAndStats(): void {
        // Générer des logs de changement de statut basés sur les vrais utilisateurs
        const approvers = ['Super Admin', 'Directeur Flotte', 'Responsable RH'];
        const now = new Date();
        const tempLogs: StatusChangeLog[] = [];

        // Pour chaque utilisateur, générer une séquence réaliste de changements de statut
        this.allUsers.forEach((u, i) => {
            // Créer une séquence de statuts réalistes
            const statusSequence: string[] = ['INACTIF']; // Tous commencent en attente

            if (u.estActif === 'ACTIF') {
                // Approuvé: INACTIF → ACTIF
                statusSequence.push('ACTIF');
                // Possibilité de désactivation puis réactivation (pour plus de variété)
                if (i % 4 === 0) {
                    statusSequence.push('INACTIF');
                    statusSequence.push('ACTIF');
                }
            } else if (u.estActif === 'REJETE') {
                // Rejeté: INACTIF → REJETE (toujours au moins cette transition)
                statusSequence.push('REJETE');
            } else {
                // En attente: reste INACTIF (pas de transition, mais on enregistre le statut initial)
                // On ne crée pas de doublon INACTIF → INACTIF
            }

            // Le nombre de changements est le nombre de transitions réelles
            const numChanges = statusSequence.length - 1;
            this.userChangeCountMap.set(u.id, Math.max(numChanges, 1));

            // Générer les logs pour chaque transition
            for (let j = 0; j < statusSequence.length - 1; j++) {
                const daysAgo = (statusSequence.length - j - 1) * 15 + Math.floor(Math.random() * 10);
                const logDate = new Date(now);
                logDate.setDate(logDate.getDate() - daysAgo);
                const dateStr = logDate.toISOString().substring(0, 16).replace('T', ' ');

                tempLogs.push({
                    id: tempLogs.length + 1,
                    date: dateStr,
                    userName: u.name,
                    userId: u.id,
                    role: this.getRoleLabel(u.role),
                    oldStatus: this.getStatusLabel(statusSequence[j]),
                    newStatus: this.getStatusLabel(statusSequence[j + 1]),
                    approver: approvers[(i + j) % approvers.length],
                    changeCount: Math.max(numChanges, 1)
                });
            }

            // Si l'utilisateur n'a aucune transition (reste INACTIF), créer un log d'inscription
            if (statusSequence.length <= 1) {
                const daysAgo = 20 + Math.floor(Math.random() * 30);
                const logDate = new Date(now);
                logDate.setDate(logDate.getDate() - daysAgo);
                const dateStr = logDate.toISOString().substring(0, 16).replace('T', ' ');

                tempLogs.push({
                    id: tempLogs.length + 1,
                    date: dateStr,
                    userName: u.name,
                    userId: u.id,
                    role: this.getRoleLabel(u.role),
                    oldStatus: 'Inscription',
                    newStatus: this.getStatusLabel('INACTIF'),
                    approver: 'Système',
                    changeCount: 1
                });
            }
        });

        // Trier par date décroissante
        this.allLogs = tempLogs.sort((a, b) => b.date.localeCompare(a.date));
    }

    private paginateLogs(): void {
        // Filtrer les logs selon les filtres actifs
        const filteredLogs = this.allLogs.filter(log => {
            const user = this.allUsers.find(u => u.name === log.userName);
            if (!user) return true;
            if (this.filterRole && user.role !== this.filterRole) return false;
            if (this.filterStatus && user.estActif !== this.filterStatus) return false;
            return true;
        });

        this.logTotalElements = filteredLogs.length;
        const start = this.logPageIndex * this.logPageSize;
        this.logDataSource = filteredLogs.slice(start, start + this.logPageSize);
    }

    onLogPageChange(event: PageEvent): void {
        this.logPageIndex = event.pageIndex;
        this.logPageSize = event.pageSize;
        this.paginateLogs();
    }

    /* ═══════════════════════════════════════════════════
       CHART BUILDERS
       ═══════════════════════════════════════════════════ */
    private buildCharts(): void {
        this.buildStackedAreaChart();
        this.buildDonutChart();
        this.buildBarChart();
    }

    /* ── Stacked Area Chart (Temps de connexion) ────── */
    private buildStackedAreaChart(): void {
        // Générer les données de temps de connexion basées sur les utilisateurs filtrés
        const days = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche'];

        // Calculer le temps cumulé par jour et par type d'utilisateur
        const driversCount = this.filteredUsers.filter(u => u.role === 'CHAUFFEUR' && u.estActif === 'ACTIF').length;
        const staffCount = this.filteredUsers.filter(u =>
            (u.role === 'SUPERADMIN' || u.role === 'MANAGER') && u.estActif === 'ACTIF'
        ).length;

        // Heures par jour par utilisateur (pattern réaliste)
        const driversHoursPerDay = [2.5, 3.0, 2.8, 3.5, 4.0, 2.0, 1.5]; // Chauffeurs plus actifs en semaine
        const staffHoursPerDay = [1.8, 2.0, 1.9, 2.4, 2.2, 1.0, 0.6];   // Staff plus actif en semaine

        const driversData = driversHoursPerDay.map(h => Math.round(h * driversCount));
        const staffData = staffHoursPerDay.map(h => Math.round(h * staffCount));

        this.stackedAreaData = {
            labels: days,
            datasets: [
                {
                    data: driversData,
                    label: 'Chauffeurs (heures)',
                    borderColor: '#6366f1',
                    backgroundColor: 'rgba(99, 102, 241, 0.25)',
                    borderWidth: 2.5,
                    fill: true,
                    tension: 0.4,
                    pointBackgroundColor: '#6366f1',
                    pointHoverRadius: 7
                },
                {
                    data: staffData,
                    label: 'Managers & Admins (heures)',
                    borderColor: '#ec4899',
                    backgroundColor: 'rgba(236, 72, 153, 0.2)',
                    borderWidth: 2.5,
                    fill: true,
                    tension: 0.4,
                    pointBackgroundColor: '#ec4899',
                    pointHoverRadius: 7
                }
            ]
        };

        this.stackedAreaOptions = {
            responsive: true,
            maintainAspectRatio: false,
            onClick: (event: any, elements: any[]) => {
                if (elements && elements.length > 0) {
                    const datasetIndex = elements[0].datasetIndex;
                    if (datasetIndex === 0) {
                        this.onRoleChange(this.filterRole === 'CHAUFFEUR' ? '' : 'CHAUFFEUR');
                    } else if (datasetIndex === 1) {
                        this.onRoleChange(this.filterRole === 'MANAGER' ? '' : 'MANAGER');
                    }
                }
            },
            onHover: (event: any, elements: any[]) => {
                if (event.native && event.native.target) {
                    event.native.target.style.cursor = elements.length > 0 ? 'pointer' : 'default';
                }
            },
            plugins: {
                legend: {
                    display: true,
                    position: 'top',
                    labels: { color: '#94a3b8', boxWidth: 12, usePointStyle: true, font: { size: 11 } }
                },
                tooltip: {
                    backgroundColor: 'rgba(15, 23, 42, 0.95)',
                    titleColor: '#e2e8f0',
                    bodyColor: '#94a3b8',
                    borderColor: 'rgba(255, 255, 255, 0.08)',
                    borderWidth: 1,
                    padding: 12,
                    cornerRadius: 10
                }
            },
            scales: {
                x: {
                    grid: { display: false },
                    ticks: { color: '#64748b', font: { size: 10 } },
                    border: { display: false }
                },
                y: {
                    stacked: true,
                    beginAtZero: true,
                    grid: { color: 'rgba(255,255,255,0.04)' },
                    ticks: { color: '#64748b', font: { size: 10 } },
                    border: { display: false }
                }
            }
        };
    }

    /* ── Donut Chart (Répartition Rôles) ────────────── */
    private buildDonutChart(): void {
        const admins = this.filteredUsers.filter(u => u.role === 'SUPERADMIN').length;
        const managers = this.filteredUsers.filter(u => u.role === 'MANAGER').length;
        const drivers = this.filteredUsers.filter(u => u.role === 'CHAUFFEUR').length;

        this.donutData = {
            labels: ['SuperAdmin', 'Manager', 'Chauffeur'],
            datasets: [{
                data: [admins, managers, drivers],
                backgroundColor: ['#8b5cf6', '#3b82f6', '#10b981'],
                hoverBackgroundColor: ['#a78bfa', '#60a5fa', '#34d399'],
                borderWidth: 0,
                hoverOffset: 12
            }]
        };

        this.donutOptions = {
            responsive: true,
            maintainAspectRatio: false,
            cutout: '72%',
            onClick: (event: any, elements: any[]) => {
                if (elements && elements.length > 0) {
                    const index = elements[0].index;
                    const roles = ['SUPERADMIN', 'MANAGER', 'CHAUFFEUR'];
                    const selectedRole = roles[index];
                    if (selectedRole) {
                        this.onRoleChange(this.filterRole === selectedRole ? '' : selectedRole);
                    }
                }
            },
            onHover: (event: any, elements: any[]) => {
                if (event.native && event.native.target) {
                    event.native.target.style.cursor = elements.length > 0 ? 'pointer' : 'default';
                }
            },
            plugins: {
                legend: {
                    display: true,
                    position: 'bottom',
                    labels: { color: '#94a3b8', padding: 12, usePointStyle: true, font: { size: 11 } }
                },
                tooltip: {
                    backgroundColor: 'rgba(15,23,42,0.95)',
                    titleColor: '#e2e8f0',
                    bodyColor: '#94a3b8',
                    padding: 12,
                    cornerRadius: 10,
                    callbacks: {
                        label: (ctx: any) => ` ${ctx.label} : ${ctx.parsed} utilisateur(s)`
                    }
                }
            }
        };
    }

    /* ─── Bar Chart (Changements de Statut) ──────────── */
    private buildBarChart(): void {
        const now = new Date();
        const months: string[] = [];
        const monthLabels = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin', 'Juil', 'Août', 'Sep', 'Oct', 'Nov', 'Déc'];

        // Construire les labels des 6 derniers mois
        for (let i = 5; i >= 0; i--) {
            const d = new Date(now);
            d.setMonth(d.getMonth() - i);
            months.push(monthLabels[d.getMonth()]);
        }

        const statusesToDisplay = ['Actif', 'En attente', 'Rejeté / Désactivé'];
        const datasetMap = new Map<string, number[]>();
        statusesToDisplay.forEach(status => {
            datasetMap.set(status, new Array(6).fill(0));
        });

        // Calculer l'état cumulé historique pour chaque utilisateur filtré
        this.filteredUsers.forEach(u => {
            const uMonthOffset = u.simulatedMonthOffset ?? 0;
            const uMonthIndex = 5 - uMonthOffset; // Mois de création (0 à 5)

            for (let m = 0; m < 6; m++) {
                if (m >= uMonthIndex) {
                    let statusLabel = 'En attente';

                    if (u.estActif === 'ACTIF') {
                        // Le premier mois de création, l'utilisateur est en attente
                        if (m === uMonthIndex) {
                            statusLabel = 'En attente';
                        } else {
                            statusLabel = 'Actif';
                        }
                    } else if (u.estActif === 'REJETE') {
                        // Le premier mois de création, l'utilisateur est en attente
                        // À partir du mois suivant, il est rejeté
                        if (m === uMonthIndex) {
                            statusLabel = 'En attente';
                        } else {
                            statusLabel = 'Rejeté / Désactivé';
                        }
                    } else {
                        // INACTIF: reste en attente
                        statusLabel = 'En attente';
                    }

                    const data = datasetMap.get(statusLabel);
                    if (data) {
                        data[m]++;
                    }
                }
            }
        });

        // Couleurs par statut
        const statusColors: Record<string, { bg: string, hover: string }> = {
            'Actif': { bg: 'rgba(16, 185, 129, 0.75)', hover: '#10b981' },
            'En attente': { bg: 'rgba(245, 158, 11, 0.75)', hover: '#f59e0b' },
            'Rejeté / Désactivé': { bg: 'rgba(239, 68, 68, 0.7)', hover: '#ef4444' }
        };

        // Construire les datasets barres
        const datasets: any[] = Array.from(datasetMap.entries()).map(([status, data]) => {
            const colors = statusColors[status] || { bg: 'rgba(100, 116, 139, 0.6)', hover: '#64748b' };
            return {
                type: 'bar',
                data,
                label: status,
                backgroundColor: colors.bg,
                hoverBackgroundColor: colors.hover,
                barPercentage: 0.9,
                categoryPercentage: 0.9,
                maxBarThickness: 40,
                borderRadius: 8
            };
        });

        // Ajouter la courbe du délai moyen d'approbation (jours)
        const baseDelay = this.kpiAvgApprovalDelay || 2.4;
        const approvalDelays = [
            Math.round((baseDelay * 1.5) * 10) / 10,
            Math.round((baseDelay * 1.3) * 10) / 10,
            Math.round((baseDelay * 1.2) * 10) / 10,
            Math.round((baseDelay * 1.1) * 10) / 10,
            Math.round((baseDelay * 1.05) * 10) / 10,
            baseDelay
        ];

        datasets.push({
            type: 'line',
            data: approvalDelays,
            label: "Délai moyen d'approbation (jours)",
            borderColor: '#6366f1',
            backgroundColor: 'rgba(99, 102, 241, 0.1)',
            borderWidth: 3,
            tension: 0.4,
            pointBackgroundColor: '#6366f1',
            pointBorderColor: '#ffffff',
            pointBorderWidth: 1.5,
            pointRadius: 4,
            pointHoverRadius: 6,
            fill: false
        });

        this.barChartData = {
            labels: months,
            datasets
        };

        this.barChartOptions = {
            responsive: true,
            maintainAspectRatio: false,
            onClick: (event: any, elements: any[]) => {
                if (elements && elements.length > 0) {
                    const datasetIndex = elements[0].datasetIndex;
                    if (datasetIndex === 0) {
                        this.onStatusChange(this.filterStatus === 'ACTIF' ? '' : 'ACTIF');
                    } else if (datasetIndex === 1) {
                        this.onStatusChange(this.filterStatus === 'INACTIF' ? '' : 'INACTIF');
                    } else if (datasetIndex === 2) {
                        this.onStatusChange(this.filterStatus === 'REJETE' ? '' : 'REJETE');
                    }
                }
            },
            onHover: (event: any, elements: any[]) => {
                if (event.native && event.native.target) {
                    event.native.target.style.cursor = elements.length > 0 ? 'pointer' : 'default';
                }
            },
            plugins: {
                legend: {
                    display: true,
                    position: 'top',
                    labels: { color: '#94a3b8', boxWidth: 10, usePointStyle: true, font: { size: 10 } }
                },
                tooltip: {
                    backgroundColor: 'rgba(15,23,42,0.95)',
                    titleColor: '#e2e8f0',
                    bodyColor: '#94a3b8',
                    padding: 12,
                    cornerRadius: 10,
                    callbacks: {
                        label: (ctx: any) => {
                            if (ctx.dataset.type === 'line') {
                                return ` ${ctx.dataset.label}: ${ctx.parsed.y} jours`;
                            }
                            return ` ${ctx.dataset.label}: ${ctx.parsed.y} utilisateur(s)`;
                        }
                    }
                }
            },
            scales: {
                x: {
                    stacked: false,
                    grid: { display: false },
                    ticks: { color: '#64748b', font: { size: 10 } },
                    border: { display: false }
                },
                y: {
                    beginAtZero: true,
                    grid: { color: 'rgba(255,255,255,0.04)' },
                    ticks: {
                        color: '#64748b',
                        font: { size: 10 }
                    },
                    border: { display: false }
                }
            }
        };
    }

    /* ═══════════════════════════════════════════════════
       HELPERS & UI UTILITIES
       ═══════════════════════════════════════════════════ */
    onRoleChange(val: string): void {
        this.filterRole = val;
        this.logPageIndex = 0;
        this.refreshAll();
    }

    onStatusChange(val: string): void {
        this.filterStatus = val;
        this.logPageIndex = 0;
        this.refreshAll();
    }

    clearFilters(): void {
        this.filterRole = '';
        this.filterStatus = '';
        this.logPageIndex = 0;
        this.refreshAll();
    }

    getRoleLabel(role: string): string {
        switch (role) {
            case 'SUPERADMIN': return 'SuperAdmin';
            case 'MANAGER': return 'Manager';
            case 'CHAUFFEUR': return 'Chauffeur';
            default: return role;
        }
    }

    getStatusLabel(status: string): string {
        switch (status) {
            case 'ACTIF': return 'Actif';
            case 'INACTIF': return 'En attente';
            case 'REJETE': return 'Rejeté / Désactivé';
            default: return status;
        }
    }

    getRoleClass(role: string): string {
        switch (role) {
            case 'SUPERADMIN': return 'role--admin';
            case 'MANAGER': return 'role--manager';
            case 'CHAUFFEUR': return 'role--driver';
            default: return '';
        }
    }

    getStatusClass(status: string): string {
        switch (status) {
            case 'Actif': case 'ACTIF': return 'status--active';
            case 'En attente': case 'INACTIF': return 'status--pending';
            case 'Rejeté / Désactivé': case 'Rejeté': case 'REJETE': return 'status--rejected';
            case 'Inscription': return 'status--disabled';
            default: return '';
        }
    }

    formatMin(min: number): string {
        if (min >= 60) {
            const h = Math.floor(min / 60);
            const m = min % 60;
            return `${h}h ${m}m`;
        }
        return `${min}m`;
    }
}
