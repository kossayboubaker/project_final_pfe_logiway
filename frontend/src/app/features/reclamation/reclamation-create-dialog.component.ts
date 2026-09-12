import { Component, Inject, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { ReclamationService, ReclamationRecord, ValidateReclamationResponse } from '../../core/services/reclamation.service';
import { PremiumSnackbarComponent } from '../../shared/components/premium-snackbar/premium-snackbar.component';
import { Subscription, Subject, of } from 'rxjs';
import { debounceTime, switchMap, catchError, tap } from 'rxjs/operators';

export interface ReclamationCreateDialogResult {
    sujet: string;
    description: string;
    priorite: 'NORMAL' | 'URGENT';
}

@Component({
    selector: 'app-reclamation-create-dialog',
    standalone: true,
    imports: [
        CommonModule,
        ReactiveFormsModule,
        MatButtonModule,
        MatDialogModule,
        MatFormFieldModule,
        MatIconModule,
        MatInputModule,
        MatProgressSpinnerModule,
        MatSelectModule,
        MatSnackBarModule
    ],
    templateUrl: './reclamation-create-dialog.component.html',
    styleUrls: ['./reclamation-create-dialog.component.css']
})
export class ReclamationCreateDialogComponent implements OnInit, OnDestroy {
    reclamationForm: FormGroup;
    sujetError = '';
    descriptionError = '';
    isSubmitting = false;
    isCheckingAI = false;
    isSubjectValid = false;
    isDescriptionValid = false;
    isEditMode = false;

    private validationTick$ = new Subject<void>();
    private subscriptions: Subscription[] = [];

    constructor(
        private readonly fb: FormBuilder,
        private readonly dialogRef: MatDialogRef<ReclamationCreateDialogComponent>,
        private readonly reclamationService: ReclamationService,
        private readonly snackBar: MatSnackBar,
        @Inject(MAT_DIALOG_DATA) public data?: ReclamationRecord
    ) {
        this.reclamationForm = this.fb.group({
            sujet: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(200)]],
            description: ['', [Validators.required, Validators.minLength(20), Validators.maxLength(1000)]],
            priorite: ['NORMAL', Validators.required]
        });
    }

    ngOnInit(): void {
        this.isEditMode = !!this.data;
        if (this.data) {
            this.reclamationForm.patchValue({
                sujet: this.data.sujet || '',
                description: this.data.description || '',
                priorite: this.data.priorite || 'NORMAL'
            });
            this.isSubjectValid = true;
            this.isDescriptionValid = true;
        }

        const validationSub = this.validationTick$.pipe(
            debounceTime(600), // Augmenté de 100ms à 600ms
            tap(() => {
                this.isCheckingAI = true;
                this.isSubjectValid = false;
                this.isDescriptionValid = false;
                this.sujetError = '';
                this.descriptionError = '';
            }),
            switchMap(() => {
                const sujet = this.reclamationForm.get('sujet')?.value?.trim() || '';
                const description = this.reclamationForm.get('description')?.value?.trim() || '';

                if (!sujet && !description) {
                    this.isCheckingAI = false;
                    return of(null);
                }

                return this.reclamationService.validate(sujet, description).pipe(
                    catchError(() => of(null))
                );
            })
        ).subscribe(result => {
            this.isCheckingAI = false;

            if (!result) {
                // API indisponible — laisser passer avec avertissement
                this.isSubjectValid = true;
                this.isDescriptionValid = true;
                console.warn('[RECLAMATION] Validation IA indisponible');
                return;
            }

            this.isSubjectValid = result.sujet.valide;
            this.isDescriptionValid = result.description.valide;

            if (!result.sujet.valide) {
                this.sujetError = result.sujet.message || 'Le sujet est invalide.';
            }

            if (!result.description.valide) {
                this.descriptionError = result.description.message || 'La description est invalide.';
            }
        });

        this.subscriptions.push(validationSub);

        const formValueSub = this.reclamationForm.valueChanges.subscribe(() => {
            this.validationTick$.next();
        });

        this.subscriptions.push(formValueSub);
    }

    ngOnDestroy(): void {
        this.subscriptions.forEach(sub => sub.unsubscribe());
    }

    get descriptionCharCount(): number {
        return this.reclamationForm.get('description')?.value?.length || 0;
    }

    get prioriteLabel(): string {
        return this.reclamationForm.get('priorite')?.value === 'URGENT' ? 'Urgent' : 'Normal';
    }

    get prioriteBadgeClass(): string {
        return this.reclamationForm.get('priorite')?.value === 'URGENT' ? 'badge-urgent' : 'badge-normal';
    }

    get hasSujetError(): boolean {
        return !!this.sujetError;
    }

    get hasDescriptionError(): boolean {
        return !!this.descriptionError;
    }

    canSubmit(): boolean {
        if (this.isSubmitting || this.isCheckingAI) {
            return false;
        }
        if (this.sujetError || this.descriptionError) {
            return false;
        }
        if (!this.isSubjectValid || !this.isDescriptionValid) {
            return false;
        }
        return this.reclamationForm.valid;
    }

    submit(): void {
        if (!this.canSubmit()) {
            return;
        }

        const payload: ReclamationCreateDialogResult = {
            sujet: this.reclamationForm.get('sujet')?.value.trim(),
            description: this.reclamationForm.get('description')?.value.trim(),
            priorite: this.reclamationForm.get('priorite')?.value
        };

        this.isSubmitting = true;

        const request = this.isEditMode && this.data
            ? this.reclamationService.update(this.data.id, payload)
            : this.reclamationService.create(payload);

        request.subscribe({
            next: () => {
                this.isSubmitting = false;
                this.dialogRef.close(payload);
            },
            error: err => {
                this.isSubmitting = false;
                const msg = String(err?.error?.message || '');
                
                // Distinguer les erreurs par champ en fonction du message
                if (msg.toLowerCase().includes('sujet')) {
                    // Erreur concerne le sujet uniquement
                    this.sujetError = msg;
                    this.descriptionError = '';
                } else if (msg.toLowerCase().includes('description')) {
                    // Erreur concerne la description uniquement
                    this.descriptionError = msg;
                    this.sujetError = '';
                } else if (msg.toLowerCase().includes('inapproprié') || msg.toLowerCase().includes('langage') || 
                           msg.toLowerCase().includes('domaine') || msg.toLowerCase().includes('flotte')) {
                    // Message générique qui peut concerner les deux
                    this.sujetError = msg;
                    this.descriptionError = msg;
                } else {
                    // Erreur non liée à la validation IA
                    this.snackBar.openFromComponent(PremiumSnackbarComponent, {
                        duration: 4000,
                        verticalPosition: 'top',
                        horizontalPosition: 'end',
                        data: {
                            title: 'Erreur',
                            message: msg || 'La réclamation a été refusée.',
                            type: 'error'
                        }
                    });
                }
            }
        });
    }

    get submitButtonText(): string {
        if (this.isSubmitting) {
            return 'ENVOI...';
        }
        if (this.isCheckingAI) {
            return 'ANALYSE IA...';
        }
        return this.isEditMode ? 'METTRE À JOUR' : 'SOUMETTRE';
    }

    cancel(): void {
        this.dialogRef.close();
    }
}
