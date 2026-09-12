import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MAT_SNACK_BAR_DATA, MatSnackBarRef } from '@angular/material/snack-bar';

export interface SnackbarData {
    title: string;
    message: string;
    type: 'success' | 'error' | 'warning' | 'info';
    category?: 'NOTIF_COMPTE' | 'NOTIF_TRAJET' | 'NOTIF_CONGE' | 'NOTIF_RECLAMATION' | 'NOTIF_MESSAGE' | 'NOTIF_ENTREPRISE' | 'NOTIF_VEHICULE' | 'SECTEUR';
    action?: string;
}

@Component({
    selector: 'app-premium-snackbar',
    standalone: true,
    imports: [CommonModule, MatIconModule, MatButtonModule],
    templateUrl: './premium-snackbar.component.html',
    styleUrls: ['./premium-snackbar.component.css']
})
export class PremiumSnackbarComponent {
    constructor(
        @Inject(MAT_SNACK_BAR_DATA) public data: SnackbarData,
        public snackBarRef: MatSnackBarRef<PremiumSnackbarComponent>
    ) { }

    getIcon(): string {
        if (this.data.category) {
            switch (this.data.category) {
                case 'NOTIF_COMPTE': return 'manage_accounts';
                case 'NOTIF_TRAJET': return 'local_shipping';
                case 'NOTIF_CONGE': return 'event_busy';
                case 'NOTIF_RECLAMATION': return 'report_problem';
                case 'NOTIF_MESSAGE': return 'chat_bubble';
                case 'NOTIF_ENTREPRISE': return 'domain';
                case 'NOTIF_VEHICULE': return 'commute';
                case 'SECTEUR': return 'map';
            }
        }
        switch (this.data.type) {
            case 'success': return 'check_circle';
            case 'error': return 'error_outline';
            case 'warning': return 'report_problem';
            case 'info': return 'info_outline';
            default: return 'notifications';
        }
    }

    getTypeLabel(): string {
        if (this.data.category) {
            switch (this.data.category) {
                case 'NOTIF_COMPTE': return 'COMPTE';
                case 'NOTIF_TRAJET': return 'TRAJET';
                case 'NOTIF_CONGE': return 'CONGÉ';
                case 'NOTIF_RECLAMATION': return 'RÉCLAMATION';
                case 'NOTIF_MESSAGE': return 'MESSAGE';
                case 'NOTIF_ENTREPRISE': return 'ENTREPRISE';
                case 'NOTIF_VEHICULE': return 'VÉHICULE';
                case 'SECTEUR': return 'SECTEUR';
            }
        }
        switch (this.data.type) {
            case 'success': return 'SUCCÈS';
            case 'error': return 'ERREUR';
            case 'warning': return 'ATTENTION';
            case 'info': return 'INFO';
            default: return 'NOTIFICATION';
        }
    }
}
