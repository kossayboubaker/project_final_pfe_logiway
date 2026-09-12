import { AfterViewInit, Component, Inject, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatDialog, MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatTooltipModule } from '@angular/material/tooltip';
import { AuthService } from '../../core/auth.service';
import { ReclamationService, ReclamationRecord } from '../../core/services/reclamation.service';
import { ReclamationCreateDialogComponent } from './reclamation-create-dialog.component';
import { ReclamationDecisionModalComponent } from './reclamation-decision-modal.component';
import { PremiumSnackbarComponent } from '../../shared/components/premium-snackbar/premium-snackbar.component';
import { ConfirmDeleteDialogComponent } from '../../shared/components/confirm-delete-dialog/confirm-delete-dialog.component';

@Component({
    selector: 'app-reclamation-list',
    standalone: true,
    imports: [
        CommonModule,
        MatCardModule,
        MatButtonModule,
        MatIconModule,
        MatTableModule,
        MatPaginatorModule,
        MatTooltipModule,
        MatSnackBarModule,
        MatDialogModule
    ],
    templateUrl: './reclamation-list.component.html',
    styleUrls: ['./reclamation-list.component.css']
})
export class ReclamationListComponent implements OnInit, AfterViewInit {
    @ViewChild(MatPaginator) paginator!: MatPaginator;

    get totalReclamations(): number {
        return this.dataSource.data.length;
    }

    get resolvedReclamations(): number {
        return this.dataSource.data.filter(r => r.statut === 'RESOLU').length;
    }

    get rejectedReclamations(): number {
        return this.dataSource.data.filter(r => r.statut === 'REJETE').length;
    }

    get pendingReclamations(): number {
        return this.dataSource.data.filter(r => r.statut === 'EN_COURS').length;
    }

    displayedColumns: string[] = ['sujet', 'description', 'priorite', 'statut', 'dateCreation', 'commentaire', 'actions'];
    dataSource = new MatTableDataSource<ReclamationRecord>([]);
    currentUserRole = '';
    currentUserId: number | null = null;
    currentUserEmail = '';

    constructor(
        private readonly authService: AuthService,
        private readonly reclamationService: ReclamationService,
        private readonly dialog: MatDialog,
        private readonly snackBar: MatSnackBar
    ) {}

    ngOnInit(): void {
        const currentUser = this.authService.getUser();
        this.currentUserRole = currentUser?.role || 'DRIVER';
        this.currentUserId = typeof currentUser?.id === 'number' ? currentUser.id : null;
        this.currentUserEmail = typeof currentUser?.email === 'string' ? currentUser.email.toLowerCase().trim() : '';
        
        this.loadReclamations();
    }

    ngAfterViewInit(): void {
        this.dataSource.paginator = this.paginator;
    }

    loadReclamations(): void {
        this.reclamationService.list().subscribe({
            next: reclamations => {
                this.dataSource.data = reclamations.sort(
                    (a, b) => new Date(b.dateCreation || 0).getTime() - new Date(a.dateCreation || 0).getTime()
                );
            },
            error: () => {
                this.snackBar.openFromComponent(PremiumSnackbarComponent, {
                    duration: 4000,
                    verticalPosition: 'top',
                    horizontalPosition: 'end',
                    data: {
                        title: 'Erreur',
                        message: 'Impossible de charger les réclamations',
                        type: 'error'
                    }
                });
            }
        });
    }

    openCreateDialog(): void {
        const dialogRef = this.dialog.open(ReclamationCreateDialogComponent, {
            width: '720px',
            maxWidth: '95vw'
        });

        dialogRef.afterClosed().subscribe(() => this.loadReclamations());
    }

    openEditDialog(item: ReclamationRecord): void {
        const dialogRef = this.dialog.open(ReclamationCreateDialogComponent, {
            width: '720px',
            maxWidth: '95vw',
            data: item
        });

        dialogRef.afterClosed().subscribe(() => {
            this.snackBar.openFromComponent(PremiumSnackbarComponent, {
                duration: 3000,
                verticalPosition: 'top',
                horizontalPosition: 'end',
                data: {
                    title: 'Succès',
                    message: 'Réclamation modifiée',
                    type: 'success'
                }
            });
            this.loadReclamations();
        });
    }

    deleteReclamation(item: ReclamationRecord): void {
        const dialogRef = this.dialog.open(ConfirmDeleteDialogComponent, {
            width: '420px',
            panelClass: 'glass-dialog',
            data: {
                title: 'Supprimer cette réclamation ?',
                message: `Voulez-vous vraiment supprimer la réclamation <strong>${item.sujet}</strong> ?<br><br>Cette action est irréversible.`
            }
        });

        dialogRef.afterClosed().subscribe(confirmed => {
            if (!confirmed) return;

            this.reclamationService.delete(item.id).subscribe({
                next: () => {
                    this.snackBar.openFromComponent(PremiumSnackbarComponent, {
                        duration: 3000,
                        verticalPosition: 'top',
                        horizontalPosition: 'end',
                        data: {
                            title: 'Réclamation Supprimée',
                            message: `La réclamation "${item.sujet}" a été supprimée.`,
                            type: 'warning'
                        }
                    });
                    this.loadReclamations();
                },
                error: err => {
                    this.snackBar.openFromComponent(PremiumSnackbarComponent, {
                        duration: 4000,
                        verticalPosition: 'top',
                        horizontalPosition: 'end',
                        data: {
                            title: 'Suppression impossible',
                            message: err?.error?.message || 'La suppression de la réclamation a échoué.',
                            type: 'error'
                        }
                    });
                }
            });
        });
    }

    openDecisionModal(item: ReclamationRecord, action: 'resolve' | 'reject'): void {
        const dialogRef = this.dialog.open(ReclamationDecisionModalComponent, {
            width: '600px',
            maxWidth: '95vw',
            data: { reclamation: item, action }
        });

        dialogRef.afterClosed().subscribe((success: boolean) => {
            if (success) this.loadReclamations();
        });
    }

    openResolutionDetails(item: ReclamationRecord): void {
        this.dialog.open(ReclamationResolutionDetailsComponent, {
            width: '500px',
            maxWidth: '95vw',
            data: { reclamation: item, role: this.currentUserRole }
        });
    }

    canCreate(): boolean {
        return this.isManagerOrDriver();
    }

    canEditRow(row: ReclamationRecord): boolean {
        return row.statut === 'EN_COURS' && this.canOwnRow(row);
    }

    canDeleteRow(row: ReclamationRecord): boolean {
        // SuperAdmin can delete any reclamation
        if (this.currentUserRole === 'SUPERADMIN') {
            return true;
        }
        // Managers and drivers can delete their own reclamation regardless of status
        return this.isManagerOrDriver() && this.canOwnRow(row);
    }

    canModerate(): boolean {
        return this.currentUserRole === 'SUPERADMIN';
    }

    statusLabel(status: string): string {
        const labels: Record<string, string> = {
            EN_COURS: 'En cours',
            RESOLU: 'Résolu',
            REJETE: 'Rejeté'
        };
        return labels[status] || status;
    }

    priorityLabel(priority: string): string {
        return priority === 'URGENT' ? 'Urgent' : 'Normal';
    }

    truncateDescription(description: string, maxLength: number = 20): string {
        if (!description) return '';
        return description.length > maxLength ? description.substring(0, maxLength) + '...' : description;
    }

    hasResolutionComment(row: ReclamationRecord): boolean {
        return (row.statut === 'RESOLU' || row.statut === 'REJETE') && !!row.commentaireResolution;
    }

    formatDate(dateStr: string | null | undefined): string {
        if (!dateStr) return '-';
        try {
            const date = new Date(dateStr);
            return new Intl.DateTimeFormat('fr-FR', {
                year: 'numeric',
                month: '2-digit',
                day: '2-digit',
                hour: '2-digit',
                minute: '2-digit'
            }).format(date);
        } catch {
            return dateStr;
        }
    }

    trackById(index: number, item: ReclamationRecord): string {
        return item.id;
    }

    canOwnRow(row: ReclamationRecord): boolean {
        const ownerEmail = (row.utilisateurEmail || '').toLowerCase().trim();
        if (this.currentUserEmail && ownerEmail) {
            return ownerEmail === this.currentUserEmail;
        }

        return this.currentUserId !== null && row.utilisateurId === this.currentUserId;
    }

    private isManagerOrDriver(): boolean {
        return this.currentUserRole === 'MANAGER' || this.currentUserRole === 'DRIVER' || this.currentUserRole === 'CHAUFFEUR';
    }
}

@Component({
    selector: 'app-reclamation-resolution-details',
    standalone: true,
    imports: [CommonModule, MatCardModule, MatButtonModule, MatDialogModule, MatIconModule],
    template: `
        <div class="resolution-details glass-card">
            <h2 mat-dialog-title class="text-gradient">
                {{ dialogTitle }}
            </h2>
            <mat-dialog-content>
                <div class="detail-container">
                    <div class="detail-header">
                        <strong>Sujet:</strong> {{ data.reclamation.sujet }}
                    </div>
                    <div class="detail-subtitle">
                        {{ data.reclamation.statut === 'REJETE' ? 'Motif du rejet' : 'Commentaire de résolution' }}
                    </div>
                    <div class="detail-content">
                        <p>{{ data.reclamation.commentaireResolution }}</p>
                    </div>
                </div>
            </mat-dialog-content>
            <mat-dialog-actions align="end">
                <button mat-button (click)="onClose()">FERMER</button>
            </mat-dialog-actions>
        </div>
    `,
    styles: [`
        .resolution-details {
            padding: 8px;
            border-radius: 16px;
        }
        .text-gradient {
            background: linear-gradient(135deg, #3b82f6 0%, #6366f1 100%);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            font-weight: 700;
        }
        .detail-container {
            padding: 16px 0;
        }
        .detail-header {
            margin-bottom: 12px;
            color: #e2e8f0;
        }
        .detail-subtitle {
            color: rgba(226, 232, 240, 0.6);
            font-size: 12px;
            font-weight: 600;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            margin-bottom: 8px;
        }
        .detail-content {
            background: rgba(15, 23, 42, 0.5);
            padding: 12px;
            border-radius: 8px;
            border-left: 3px solid rgba(59, 130, 246, 0.5);
        }
        .detail-content p {
            margin: 0;
            color: #cbd5e1;
            line-height: 1.6;
            white-space: pre-wrap;
            word-break: break-word;
        }
    `]
})
export class ReclamationResolutionDetailsComponent {
    constructor(
        private dialogRef: MatDialogRef<ReclamationResolutionDetailsComponent>,
        @Inject(MAT_DIALOG_DATA) public data: { reclamation: ReclamationRecord; role: string }
    ) {}

    get dialogTitle(): string {
        return this.data.role === 'SUPERADMIN'
            ? 'Votre commentaire de résolution'
            : 'Réponse du SuperAdmin';
    }

    onClose(): void {
        this.dialogRef.close();
    }
}
