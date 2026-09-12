import { Component, Inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { ReclamationService, ReclamationRecord } from '../../core/services/reclamation.service';
import { PremiumSnackbarComponent } from '../../shared/components/premium-snackbar/premium-snackbar.component';

@Component({
    selector: 'app-reclamation-decision-modal',
    standalone: true,
    imports: [
        CommonModule,
        ReactiveFormsModule,
        MatButtonModule,
        MatCardModule,
        MatDialogModule,
        MatFormFieldModule,
        MatIconModule,
        MatInputModule,
        MatSnackBarModule
    ],
    templateUrl: './reclamation-decision-modal.component.html',
    styleUrls: ['./reclamation-decision-modal.component.css']
})
export class ReclamationDecisionModalComponent implements OnInit {
    decisionForm: FormGroup;
    isSubmitting = false;
    showConfirmation = false;
    action: 'resolve' | 'reject' = 'resolve';

    constructor(
        private fb: FormBuilder,
        private dialogRef: MatDialogRef<ReclamationDecisionModalComponent>,
        private reclamationService: ReclamationService,
        private snackBar: MatSnackBar,
        @Inject(MAT_DIALOG_DATA) public data: { reclamation: ReclamationRecord; action: 'resolve' | 'reject' }
    ) {
        this.action = data.action;
        this.decisionForm = this.fb.group({
            commentaire: ['', [Validators.required, Validators.minLength(10), Validators.maxLength(500)]]
        });
    }

    ngOnInit(): void { }

    get formattedDate(): string {
        if (!this.data?.reclamation?.dateCreation) {
            return '-';
        }
        try {
            const date = new Date(this.data.reclamation.dateCreation);
            return new Intl.DateTimeFormat('fr-FR', {
                year: 'numeric',
                month: '2-digit',
                day: '2-digit',
                hour: '2-digit',
                minute: '2-digit'
            }).format(date);
        } catch {
            return this.data.reclamation.dateCreation;
        }
    }

    get priorityBadgeClass(): string {
        return this.data?.reclamation?.priorite === 'URGENT'
            ? 'badge-urgent'
            : 'badge-normal';
    }

    get actionLabel(): string {
        return this.action === 'resolve' ? 'Résoudre' : 'Rejeter';
    }

    get actionButtonColor(): string {
        return this.action === 'resolve' ? 'primary' : 'warn';
    }

    onConfirm(): void {
        if (!this.decisionForm.valid) {
            return;
        }

        if (!this.showConfirmation) {
            this.showConfirmation = true;
            return;
        }

        const commentaire = this.decisionForm.get('commentaire')?.value.trim();
        this.isSubmitting = true;

        const request = this.action === 'resolve'
            ? this.reclamationService.resolve(this.data.reclamation.id, commentaire)
            : this.reclamationService.reject(this.data.reclamation.id, commentaire);

        request.subscribe({
            next: () => {
                this.isSubmitting = false;
                this.snackBar.openFromComponent(PremiumSnackbarComponent, {
                    duration: 4000,
                    verticalPosition: 'top',
                    horizontalPosition: 'end',
                    data: {
                        title: 'Succès',
                        message: `Réclamation ${this.action === 'resolve' ? 'résolue' : 'rejetée'} avec succès.`,
                        type: 'success'
                    }
                });
                this.dialogRef.close(true);
            },
            error: (err) => {
                this.isSubmitting = false;
                const errorMessage = err?.error?.message || 'Erreur lors de l\'opération';
                this.snackBar.openFromComponent(PremiumSnackbarComponent, {
                    duration: 4000,
                    verticalPosition: 'top',
                    horizontalPosition: 'end',
                    data: {
                        title: 'Erreur',
                        message: errorMessage,
                        type: 'error'
                    }
                });
            }
        });
    }

    cancelConfirmation(): void {
        this.showConfirmation = false;
    }

    onCancel(): void {
        this.dialogRef.close();
    }
}
