import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { Router } from '@angular/router';
import { MatChipsModule } from '@angular/material/chips';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { PremiumSnackbarComponent } from '../../shared/components/premium-snackbar/premium-snackbar.component';
import { AuthService, AppNotification } from '../../core/auth.service';
import { NotificationService } from '../../core/services/notification.service';
import { LeaveService } from '../../core/services/leave.service';
import { Subscription } from 'rxjs';

@Component({
    selector: 'app-alerts',
    standalone: true,
    imports: [CommonModule, MatCardModule, MatIconModule, MatButtonModule, MatChipsModule, MatSnackBarModule],
    templateUrl: './alerts.component.html',
    styleUrls: ['./alerts.component.css']
})
export class AlertsComponent implements OnInit {
    private notificationsSub?: Subscription;
    notifications: AppNotification[] = [];

    constructor(
        private router: Router,
        public authService: AuthService,
        private notificationService: NotificationService,
        private leaveService: LeaveService,
        private snackBar: MatSnackBar
    ) { }

    ngOnInit() {
        this.notificationService.loadNotifications().subscribe();
        this.notificationsSub = this.notificationService.notifications$.subscribe(notifs => {
            this.notifications = notifs;
        });
    }

    get alerts(): AppNotification[] {
        return this.notifications;
    }

    getIcon(category: string): string {
        switch (category) {
            case 'NOTIF_CONGE': return 'event_note';
            case 'NOTIF_TRAJET': return 'directions_bus';
            case 'NOTIF_RECLAMATION': return 'report_problem';
            case 'NOTIF_MESSAGE': return 'chat';
            case 'NOTIF_COMPTE': return 'account_circle';
            case 'NOTIF_ENTREPRISE': return 'domain';
            case 'NOTIF_VEHICULE': return 'local_shipping';
            case 'SECTEUR': return 'map';
            case 'NOTIF_DETECTION': return 'security';
            case 'NOTIF_WEATHER': return 'wb_sunny';
            case 'NOTIF_INFRA': return 'construction';
            case 'NOTIF_ACCIDENT': return 'report';
            default: return 'notifications';
        }
    }

    getColorClass(alert: AppNotification): string {
        if (alert.category === 'NOTIF_COMPTE') {
            switch (alert.tone) {
                case 'SUCCESS': return 'notif-success';
                case 'DANGER': return 'notif-danger';
                case 'WARNING': return 'notif-warning';
                case 'INFO': return 'notif-info';
                default: return 'notif-info';
            }
        }

        switch (alert.category) {
            case 'NOTIF_TRAJET': return 'notif-trip';
            case 'NOTIF_CONGE':
                if (alert.tone === 'DANGER') return 'notif-danger';
                if (alert.tone === 'SUCCESS') return 'notif-success';
                if (alert.tone === 'WARNING') return 'notif-warning';
                return 'notif-leave';
            case 'NOTIF_RECLAMATION': return 'notif-report';
            case 'NOTIF_MESSAGE': return 'notif-msg-bubble';
            case 'NOTIF_ENTREPRISE':
                switch (alert.tone) {
                    case 'SUCCESS': return 'notif-success';
                    case 'DANGER': return 'notif-danger';
                    case 'WARNING': return 'notif-warning';
                    case 'INFO': return 'notif-info';
                    default: return 'notif-info';
                }
            case 'NOTIF_VEHICULE':
                switch (alert.tone) {
                    case 'SUCCESS': return 'notif-success';
                    case 'DANGER': return 'notif-danger';
                    case 'WARNING': return 'notif-warning';
                    case 'INFO': return 'notif-info';
                    default: return 'notif-info';
                }
            case 'SECTEUR': return 'notif-info';
            default: return 'notif-default';
        }
    }

    markAllAsRead() {
        this.notificationService.clearAllNotifications();
    }

    viewDetails(alert: AppNotification) {
        this.notificationService.markAsRead(alert.id);
        if (alert.category === 'NOTIF_CONGE') {
            this.router.navigate(['/dashboard/leave']);
        } else if (alert.category === 'NOTIF_TRAJET') {
            this.router.navigate(['/dashboard/trips']);
        } else if (alert.category === 'NOTIF_ENTREPRISE') {
            if (this.authService.getUser()?.role === 'SUPERADMIN') {
                this.router.navigate(['/dashboard/companies']);
            } else {
                this.router.navigate(['/dashboard/company-profile']);
            }
        } else if (alert.category === 'NOTIF_VEHICULE') {
            this.router.navigate(['/dashboard/fleet']);
        } else {
            this.router.navigate(['/dashboard']);
        }
    }

    handleAction(notification: AppNotification, action: 'ACCEPT' | 'REJECT') {
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

        const leaveRequestId = this.notificationService.getLeaveRequestId(notification as any);
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
}
