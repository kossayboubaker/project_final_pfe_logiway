import { Component, EventEmitter, Output, OnDestroy, OnInit, ElementRef, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { RouterModule } from '@angular/router';
import { MatToolbarModule } from '@angular/material/toolbar';
import { Router } from '@angular/router';
import { AuthService, AppNotification, NotificationCategory } from '../../auth.service';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatBadgeModule } from '@angular/material/badge';
import { MatDividerModule } from '@angular/material/divider';
import { PremiumSnackbarComponent } from '../../../shared/components/premium-snackbar/premium-snackbar.component';
import { NotificationService } from '../../services/notification.service';
import { MessengerService } from '../../services/messenger.service';
import { LeaveService } from '../../services/leave.service';
import { Subscription, interval } from 'rxjs';

@Component({
    selector: 'app-navbar',
    standalone: true,
    imports: [
        CommonModule,
        RouterModule,
        MatToolbarModule,
        MatButtonModule,
        MatIconModule,
        MatMenuModule,
        MatBadgeModule,
        MatDividerModule,
        MatSnackBarModule
    ],
    templateUrl: './navbar.component.html',
    styleUrls: ['./navbar.component.css']
})
export class NavbarComponent implements OnInit, OnDestroy {
    @Output() toggleSidenav = new EventEmitter<void>();
    @ViewChild('notificationList') notificationListRef?: ElementRef<HTMLDivElement>;
    user: any;
    showAllNotifications = false;
    notifications: AppNotification[] = [];
    messengerUnreadCount = 0;
    hideFirstLoginReminder = false;
    private notificationsRefreshSub?: Subscription;
    private notificationsStateSub?: Subscription;
    private messengerUnreadSub?: Subscription;
    private unreadCountSub?: Subscription;
    private realtimeNotifSub?: Subscription;
    public unreadBadge: string | number = 0;

    constructor(
        public authService: AuthService,
        private router: Router,
        private snackBar: MatSnackBar,
        private notificationService: NotificationService,
        private messengerService: MessengerService,
        private leaveService: LeaveService
    ) { }

    ngOnInit() {
        this.notificationsStateSub = this.notificationService.notifications$.subscribe(notifs => {
            this.notifications = notifs;
        });

        this.messengerUnreadSub = this.messengerService.unreadCount$.subscribe(count => {
            this.messengerUnreadCount = count;
        });

        this.unreadCountSub = this.notificationService.unreadCount$.subscribe(count => {
            this.unreadBadge = count > 99 ? '99+' : (count || 0);
        });

        this.realtimeNotifSub = this.notificationService.realtimeNotification$.subscribe(notification => {
            this.snackBar.openFromComponent(PremiumSnackbarComponent, {
                duration: 4000,
                horizontalPosition: 'end',
                verticalPosition: 'top',
                data: {
                    title: notification.title,
                    message: notification.message,
                    type: this.mapNotifTypeToSnackbarType(notification.type),
                    category: notification.category
                }
            });
        });

        this.authService.currentUser.subscribe(u => {
            this.user = u;
            if (u) {
                this.loadNotifications();
                this.messengerService.loadConversations().subscribe();
                this.messengerService.connectRealtime();
                // rely on SSE for realtime notifications; no polling
            } else {
                this.stopNotificationsRefresh();
            }
        });
    }

    ngOnDestroy() {
        this.stopNotificationsRefresh();
        this.notificationsStateSub?.unsubscribe();
        this.messengerUnreadSub?.unsubscribe();
        this.unreadCountSub?.unsubscribe();
        this.realtimeNotifSub?.unsubscribe();
    }

    loadNotifications() {
        this.notificationService.loadNotifications().subscribe({
            next: (notifs) => {
                this.notifications = notifs;
                this.unreadBadge = this.notificationService.getNotifications().filter(n => !n.isRead).length > 99
                    ? '99+'
                    : this.notificationService.getNotifications().filter(n => !n.isRead).length;
            }
        });
    }

    private startNotificationsRefresh() {
        if (this.notificationsRefreshSub) {
            return;
        }

        this.notificationsRefreshSub = interval(20000).subscribe(() => this.loadNotifications());
    }

    private stopNotificationsRefresh() {
        this.notificationsRefreshSub?.unsubscribe();
        this.notificationsRefreshSub = undefined;
    }

    get alerts() {
        const alerts = [...this.notifications];

        if (this.user?.firstLogin && !this.hideFirstLoginReminder) {
            alerts.unshift({
                id: '__first_login_activation__',
                title: 'Activation de votre compte requise',
                message: 'Allez vers Espace Personnel > Mon profil pour changer votre mot de passe temporaire et activer votre compte.',
                type: 'WARNING',
                category: 'NOTIF_COMPTE',
                time: 'Maintenant',
                date: new Date(),
                isRead: false,
                dismissed: false,
                tone: 'INFO'
            });
        }

        return alerts;
    }

    get userStatus(): string {
        return this.authService.getStatus();
    }

    onToggleSidenav() {
        this.toggleSidenav.emit();
    }

    onLogout() {
        this.messengerService.disconnectRealtime();
        this.authService.logout();
        this.router.navigate(['/auth/signin']);
    }

    handleAction(notification: any, action: 'ACCEPT' | 'REJECT') {
        if (notification.category !== 'NOTIF_CONGE') {
            this.snackBar.openFromComponent(PremiumSnackbarComponent, {
                duration: 3500,
                verticalPosition: 'top',
                horizontalPosition: 'end',
                data: {
                    title: 'Action non prise en charge',
                    message: 'Cette notification ne supporte pas l’action rapide.',
                    type: 'warning'
                }
            });
            return;
        }

        const leaveRequestId = this.notificationService.getLeaveRequestId(notification);
        if (!leaveRequestId) {
            this.snackBar.openFromComponent(PremiumSnackbarComponent, {
                duration: 3500,
                verticalPosition: 'top',
                horizontalPosition: 'end',
                data: {
                    title: 'Action impossible',
                    message: 'Identifiant du congé introuvable dans la notification.',
                    type: 'error'
                }
            });
            return;
        }

        const isAccept = action === 'ACCEPT';
        const decisionRequest = {
            commentaire: '',
            notificationId: Number(notification.id)
        };
        const decision$ = isAccept
            ? this.leaveService.approveLeave(leaveRequestId, decisionRequest)
            : this.leaveService.rejectLeave(leaveRequestId, decisionRequest);

        decision$.subscribe({
            next: () => {
                this.notificationService.markLeaveNotificationHandled(notification.id, action);
                this.notifications = this.notificationService.getNotifications();

                this.snackBar.openFromComponent(PremiumSnackbarComponent, {
                    duration: 4000,
                    verticalPosition: 'top',
                    horizontalPosition: 'end',
                    data: {
                        title: isAccept ? 'Demande Acceptée' : 'Demande Refusée',
                        message: isAccept
                            ? `Vous avez validé : ${notification.title}`
                            : `Vous avez rejeté : ${notification.title}`,
                        type: isAccept ? 'success' : 'error'
                    }
                });
            },
            error: () => {
                this.snackBar.openFromComponent(PremiumSnackbarComponent, {
                    duration: 4000,
                    verticalPosition: 'top',
                    horizontalPosition: 'end',
                    data: {
                        title: 'Erreur',
                        message: 'Impossible de traiter la demande de congé.',
                        type: 'error'
                    }
                });
            }
        });
    }

    onNotificationClick(notification: AppNotification) {
        if (notification.id === '__first_login_activation__') {
            this.router.navigate(['/dashboard/profile']);
        }
    }

    dismissNotification(id: string, event: Event) {
        event.stopPropagation();
        if (id === '__first_login_activation__') {
            this.hideFirstLoginReminder = true;
            return;
        }
        this.notificationService.removeNotification(id);
        this.notifications = this.notificationService.getNotifications();
    }

    toggleShowAll(event: Event) {
        event.stopPropagation();
        this.showAllNotifications = !this.showAllNotifications;
        if (!this.showAllNotifications) {
            this.resetNotificationsScroll();
        }
    }

    onNotificationsMenuOpened() {
        this.showAllNotifications = false;
        this.resetNotificationsScroll();
        // Mark all visible notifications as read locally and reset unread badge
        const current = this.notificationService.getNotifications();
        current.forEach(n => {
            if (!n.isRead) {
                this.notificationService.markAsRead(n.id);
            }
        });
        // update local view and unread badge
        this.notifications = this.notificationService.getNotifications();
        this.unreadBadge = 0;
    }

    private resetNotificationsScroll() {
        if (!this.notificationListRef) {
            return;
        }

        this.notificationListRef.nativeElement.scrollTop = 0;
    }

    getNotifIcon(category: NotificationCategory): string {
        switch (category) {
            case 'NOTIF_COMPTE': return 'manage_accounts';
            case 'NOTIF_TRAJET': return 'local_shipping';
            case 'NOTIF_CONGE': return 'event_busy';
            case 'NOTIF_RECLAMATION': return 'report_problem';
            case 'NOTIF_MESSAGE': return 'chat_bubble';
            case 'NOTIF_ENTREPRISE': return 'domain';
            case 'NOTIF_VEHICULE': return 'commute';
            case 'SECTEUR': return 'map';
            case 'NOTIF_DETECTION': return 'security';
            case 'NOTIF_WEATHER': return 'wb_sunny';
            case 'NOTIF_INFRA': return 'construction';
            case 'NOTIF_ACCIDENT': return 'report';
            default: return 'notifications';
        }
    }

    getNotifColorClass(notification: AppNotification): string {
        if (notification.category === 'NOTIF_COMPTE') {
            switch (notification.tone) {
                case 'SUCCESS': return 'notif-success';
                case 'DANGER': return 'notif-danger';
                case 'WARNING': return 'notif-warning';
                case 'INFO': return 'notif-info';
                default: return 'notif-info';
            }
        }

        switch (notification.category) {
            case 'NOTIF_TRAJET': return 'notif-trip';
            case 'NOTIF_CONGE':
                if (notification.tone === 'DANGER') return 'notif-danger';
                if (notification.tone === 'SUCCESS') return 'notif-success';
                if (notification.tone === 'WARNING') return 'notif-warning';
                return 'notif-leave';
            case 'NOTIF_RECLAMATION': return 'notif-report';
            case 'NOTIF_MESSAGE': return 'notif-msg-bubble';
            case 'NOTIF_ENTREPRISE':
                switch (notification.tone) {
                    case 'SUCCESS': return 'notif-success';
                    case 'DANGER': return 'notif-danger';
                    case 'WARNING': return 'notif-warning';
                    case 'INFO': return 'notif-info';
                    default: return 'notif-info';
                }
            case 'NOTIF_VEHICULE':
                switch (notification.tone) {
                    case 'SUCCESS': return 'notif-success';
                    case 'DANGER': return 'notif-danger';
                    case 'WARNING': return 'notif-warning';
                    case 'INFO': return 'notif-info';
                    default: return 'notif-info';
                }
            case 'NOTIF_DETECTION':
            case 'NOTIF_WEATHER':
            case 'NOTIF_INFRA':
                switch (notification.tone) {
                    case 'DANGER': return 'notif-danger';
                    case 'WARNING': return 'notif-warning';
                    default: return 'notif-info';
                }
            case 'NOTIF_ACCIDENT': return 'notif-danger';
            case 'SECTEUR': return 'notif-info';
            default: return 'notif-default';
        }
    }

    getNotifLabel(category: NotificationCategory): string {
        switch (category) {
            case 'NOTIF_COMPTE': return 'Compte';
            case 'NOTIF_TRAJET': return 'Trajet';
            case 'NOTIF_CONGE': return 'Congé';
            case 'NOTIF_RECLAMATION': return 'Réclamation';
            case 'NOTIF_MESSAGE': return 'Message';
            case 'NOTIF_ENTREPRISE': return 'Entreprise';
            case 'NOTIF_VEHICULE': return 'Véhicule';
            case 'SECTEUR': return 'Secteur';
            case 'NOTIF_DETECTION': return 'Détection';
            case 'NOTIF_WEATHER': return 'Météo';
            case 'NOTIF_INFRA': return 'Infrastructure';
            case 'NOTIF_ACCIDENT': return 'Accident';
            default: return 'Info';
        }
    }

    private mapNotifTypeToSnackbarType(type: string): 'success' | 'error' | 'warning' | 'info' {
        switch (type) {
            case 'DANGER': return 'error';
            case 'WARNING': return 'warning';
            case 'ACTION': return 'warning';
            default: return 'info';
        }
    }
}
