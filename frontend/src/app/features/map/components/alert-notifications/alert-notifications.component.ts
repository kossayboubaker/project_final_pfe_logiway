import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { AppNotification } from '../../../../core/services/notification.service';

@Component({
    selector: 'app-alert-notifications',
    standalone: true,
    imports: [CommonModule, MatIconModule, MatButtonModule],
    templateUrl: './alert-notifications.component.html',
    styleUrls: ['./alert-notifications.component.css']
})
export class AlertNotificationsComponent {
    @Input() alerts: AppNotification[] = [];

    @Output() close = new EventEmitter<void>();
    @Output() treat = new EventEmitter<AppNotification>();
    @Output() focus = new EventEmitter<AppNotification>();

    onClose() {
        this.close.emit();
    }

    onTreat(alert: AppNotification) {
        this.treat.emit(alert);
    }

    onFocus(alert: AppNotification) {
        this.focus.emit(alert);
    }

    getIcon(alert: AppNotification): string {
        switch (alert.category) {
            case 'NOTIF_TRAJET': return 'route';
            case 'NOTIF_VEHICULE': return 'local_shipping';
            case 'NOTIF_ENTREPRISE': return 'business';
            case 'NOTIF_CONGE': return 'event_busy';
            case 'NOTIF_RECLAMATION': return 'report_problem';
            default: return 'notifications';
        }
    }

    getSeverityClass(alert: AppNotification): string {
        if (alert.tone === 'DANGER' || alert.type === 'DANGER') {
            return 'critical';
        }
        if (alert.tone === 'WARNING' || alert.type === 'WARNING') {
            return 'warning';
        }
        return 'info';
    }
}
