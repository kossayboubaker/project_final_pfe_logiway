import { Component, OnInit, ViewChild, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule, MatTableDataSource } from '@angular/material/table';
import { MatChipsModule } from '@angular/material/chips';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { AuthService } from '../../core/auth.service';
import { LeaveRequestDialogComponent } from './leave-request-dialog/leave-request-dialog.component';
import { PremiumSnackbarComponent } from '../../shared/components/premium-snackbar/premium-snackbar.component';
import { LeaveRecord, LeaveService } from '../../core/services/leave.service';

@Component({
    selector: 'app-leave-management',
    standalone: true,
    imports: [
        CommonModule,
        MatCardModule,
        MatButtonModule,
        MatIconModule,
        MatTableModule,
        MatChipsModule,
        MatSnackBarModule,
        MatDialogModule,
        MatPaginatorModule
    ],
    templateUrl: './leave-management.component.html',
    styleUrls: ['./leave-management.component.css']
})
export class LeaveManagementComponent implements OnInit, AfterViewInit {
    @ViewChild(MatPaginator) paginator!: MatPaginator;

    displayedColumns: string[] = ['driverName', 'type', 'dates', 'duration', 'status', 'actions'];
    allRequests: LeaveRecord[] = [];
    dataSource = new MatTableDataSource<LeaveRecord>([]);
    userRole: string = '';
    currentUserName: string = '';
    currentUserEmail: string = '';

    constructor(
        private snackBar: MatSnackBar,
        private authService: AuthService,
        private dialog: MatDialog,
        private leaveService: LeaveService
    ) { }

    get totalRequests(): number {
        return this.dataSource.data.length;
    }

    get approvedRequests(): number {
        return this.dataSource.data.filter(r => r.status === 'APPROUVE').length;
    }

    get rejectedRequests(): number {
        return this.dataSource.data.filter(r => r.status === 'REJETE').length;
    }

    get pendingRequests(): number {
        return this.dataSource.data.filter(r => r.status === 'EN_ATTENTE').length;
    }

    ngOnInit() {
        const user = this.authService.getUser();
        this.userRole = user?.role || 'DRIVER';
        this.currentUserName = user?.username || 'Utilisateur';
        this.currentUserEmail = user?.email || '';

        if (this.userRole === 'DRIVER') {
            this.displayedColumns = ['type', 'dates', 'duration', 'status', 'actions'];
        }

        this.loadLeaves();
    }

    ngAfterViewInit() {
        this.dataSource.paginator = this.paginator;
    }

    requestLeave() {
        if (this.pendingRequests > 0) {
            this.snackBar.openFromComponent(PremiumSnackbarComponent, {
                duration: 4000,
                verticalPosition: 'top',
                horizontalPosition: 'end',
                data: {
                    title: 'Demande en attente',
                    message: 'Vous avez déjà une demande de congé en attente.',
                    type: 'warning'
                }
            });
            return;
        }

        const dialogRef = this.dialog.open(LeaveRequestDialogComponent, {
            width: '550px',
            maxWidth: '90vw'
        });

        dialogRef.afterClosed().subscribe(result => {
            if (result) {
                this.leaveService.createLeave({
                    type: result.type,
                    startDate: result.startDate,
                    endDate: result.endDate,
                    reason: result.reason
                }).subscribe({
                    next: () => {
                        this.showSnack('Demande Soumise', 'Votre demande de congé a été enregistrée avec succès.', 'success');
                        this.loadLeaves();
                    },
                    error: () => this.showSnack('Erreur', 'Impossible de soumettre la demande de congé.', 'error')
                });
            }
        });
    }

    approveLeave(id: string) {
        const leave = this.allRequests.find(item => item.id === id);
        if (!leave) return;

        const comment = window.prompt('Commentaire optionnel pour l’approbation', '') ?? '';
        this.leaveService.approveLeave(id, { commentaire: comment }).subscribe({
            next: updated => {
                this.replaceLeave(updated);
                this.showSnack('Demande Approuvée', `Le congé de ${leave.requesterName} a été validé.`, 'success');
            },
            error: () => this.showSnack('Erreur', 'Impossible d’approuver cette demande.', 'error')
        });
    }

    rejectLeave(id: string) {
        const leave = this.allRequests.find(item => item.id === id);
        if (!leave) return;

        const comment = window.prompt('Commentaire optionnel pour le refus', '') ?? '';
        this.leaveService.rejectLeave(id, { commentaire: comment }).subscribe({
            next: updated => {
                this.replaceLeave(updated);
                this.showSnack('Demande Refusée', `Le congé de ${leave.requesterName} a été rejeté.`, 'error');
            },
            error: () => this.showSnack('Erreur', 'Impossible de rejeter cette demande.', 'error')
        });
    }

    editRequest(element: LeaveRecord) {
        const dialogRef = this.dialog.open(LeaveRequestDialogComponent, {
            width: '550px',
            maxWidth: '90vw',
            data: element
        });

        dialogRef.afterClosed().subscribe(result => {
            if (result) {
                this.leaveService.updateLeave(element.id, {
                    type: result.type,
                    startDate: result.startDate,
                    endDate: result.endDate,
                    reason: result.reason
                }).subscribe({
                    next: updated => {
                        this.replaceLeave(updated);
                        this.showSnack('Demande Modifiée', 'Votre demande de congé a été modifiée avec succès.', 'success');
                    },
                    error: () => this.showSnack('Erreur', 'Impossible de modifier la demande.', 'error')
                });
            }
        });
    }

    cancelRequest(id: string) {
        this.leaveService.deleteLeave(id).subscribe({
            next: () => {
                this.allRequests = this.allRequests.filter(item => item.id !== id);
                this.refreshDataSource();
                this.showSnack('Demande Annulée', 'Votre demande a été supprimée de l\'historique.', 'info');
            },
            error: () => this.showSnack('Erreur', 'Impossible de supprimer la demande.', 'error')
        });
    }

    private refreshDataSource() {
        if (this.userRole === 'DRIVER') {
            this.dataSource.data = this.allRequests.filter(r => r.requesterEmail === this.currentUserEmail);
        } else {
            this.dataSource.data = this.allRequests;
        }
    }

    private loadLeaves(): void {
        this.leaveService.getLeaves().subscribe(leaves => {
            this.allRequests = leaves.map(leave => ({
                ...leave,
                canEdit: leave.requesterEmail === this.currentUserEmail,
                canDelete: leave.requesterEmail === this.currentUserEmail,
                canReview: this.canReviewLeave(leave)
            }));
            this.refreshDataSource();
        });
    }

    private replaceLeave(updated: LeaveRecord): void {
        this.allRequests = this.allRequests.map(leave => leave.id === updated.id ? {
            ...updated,
            canEdit: updated.requesterEmail === this.currentUserEmail,
            canDelete: updated.requesterEmail === this.currentUserEmail,
            canReview: this.canReviewLeave(updated)
        } : leave);
        this.refreshDataSource();
    }

    private canReviewLeave(leave: LeaveRecord): boolean {
        if (this.userRole === 'SUPERADMIN') {
            return leave.requesterRole === 'MANAGER';
        }

        if (this.userRole === 'MANAGER') {
            return leave.requesterRole === 'CHAUFFEUR' && leave.managerEmail === this.currentUserEmail;
        }

        return false;
    }

    private showSnack(title: string, message: string, type: 'success' | 'error' | 'info' | 'warning'): void {
        this.snackBar.openFromComponent(PremiumSnackbarComponent, {
            duration: 4000,
            verticalPosition: 'top',
            horizontalPosition: 'end',
            data: {
                title,
                message,
                type
            }
        });
    }
}
