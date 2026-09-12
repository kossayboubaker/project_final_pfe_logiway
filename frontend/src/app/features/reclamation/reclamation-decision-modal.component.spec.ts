import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { ReclamationDecisionModalComponent } from './reclamation-decision-modal.component';
import { ReclamationService, ReclamationRecord } from '../../core/services/reclamation.service';

describe('ReclamationDecisionModalComponent', () => {
    let component: ReclamationDecisionModalComponent;
    let fixture: ComponentFixture<ReclamationDecisionModalComponent>;
    let dialogRef: any;
    let reclamationService: any;
    let snackBar: any;

    const reclamation: ReclamationRecord = {
        id: '42',
        sujet: 'Retard livraison',
        description: 'Colis non livré à temps',
        priorite: 'URGENT',
        statut: 'EN_COURS',
        dateCreation: '2026-08-10T14:30:00Z',
        utilisateurId: 7
    };

    beforeEach(async () => {
        dialogRef = { close: jasmine.createSpy('close') };
        reclamationService = {
            resolve: jasmine.createSpy('resolve').and.returnValue(of({ success: true })),
            reject: jasmine.createSpy('reject').and.returnValue(of({ success: true }))
        };
        snackBar = { openFromComponent: jasmine.createSpy('openFromComponent') };

        await TestBed.configureTestingModule({
            imports: [ReclamationDecisionModalComponent],
            providers: [
                { provide: MatDialogRef, useValue: dialogRef },
                { provide: MAT_DIALOG_DATA, useValue: { reclamation, action: 'resolve' } },
                { provide: ReclamationService, useValue: reclamationService }
            ]
        }).compileComponents();

        fixture = TestBed.createComponent(ReclamationDecisionModalComponent);
        component = fixture.componentInstance;
        (component as any).dialogRef = dialogRef;
        (component as any).reclamationService = reclamationService;
        (component as any).snackBar = snackBar;
        fixture.detectChanges();
    });

    it('should create with the requested action and a pristine form', () => {
        expect(component).toBeTruthy();
        expect(component.action).toBe('resolve');
        expect(component.decisionForm.get('commentaire')?.value).toBe('');
        expect(component.isSubmitting).toBeFalse();
        expect(component.showConfirmation).toBeFalse();
    });

    it('should format the creation date defensively', () => {
        expect(component.formattedDate).toContain('2026');

        component.data = { reclamation: { ...reclamation, dateCreation: null }, action: 'resolve' };
        expect(component.formattedDate).toBe('-');
        expect(component.priorityBadgeClass).toBe('badge-urgent');

        component.data = { reclamation: undefined as any, action: 'reject' };
        expect(component.formattedDate).toBe('-');
        expect(component.priorityBadgeClass).toBe('badge-normal');
    });

    it('should expose labels and colors according to the action', () => {
        expect(component.actionLabel).toBe('Résoudre');
        expect(component.actionButtonColor).toBe('primary');

        component.action = 'reject';
        expect(component.actionLabel).toBe('Rejeter');
        expect(component.actionButtonColor).toBe('warn');
    });

    it('should require a confirmation step before submitting', () => {
        component.decisionForm.setValue({ commentaire: '' });
        component.onConfirm();
        expect(component.showConfirmation).toBeFalse();

        component.decisionForm.setValue({ commentaire: 'court' });
        component.onConfirm();
        expect(component.showConfirmation).toBeFalse();

        component.decisionForm.setValue({ commentaire: 'Commentaire suffisamment long pour valider.' });
        component.onConfirm();
        expect(component.showConfirmation).toBeTrue();
        expect(reclamationService.resolve).not.toHaveBeenCalled();

        component.cancelConfirmation();
        expect(component.showConfirmation).toBeFalse();
    });

    it('should resolve and close with success', () => {
        component.decisionForm.setValue({ commentaire: '  Problème traité avec le chauffeur.  ' });
        component.onConfirm();
        component.onConfirm();

        expect(reclamationService.resolve).toHaveBeenCalledWith('42', 'Problème traité avec le chauffeur.');
        expect(reclamationService.reject.calls.count()).toBe(0);
        expect(component.isSubmitting).toBeFalse();
        expect(snackBar.openFromComponent).toHaveBeenCalled();
        expect(dialogRef.close).toHaveBeenCalledWith(true);
    });

    it('should reject through the reject endpoint when configured so', () => {
        component.action = 'reject';
        component.decisionForm.setValue({ commentaire: 'Réclamation hors du périmètre support.' });
        component.onConfirm();
        component.onConfirm();

        expect(reclamationService.reject).toHaveBeenCalledWith('42', 'Réclamation hors du périmètre support.');
        expect(reclamationService.resolve).not.toHaveBeenCalled();
        expect(snackBar.openFromComponent.calls.mostRecent().args[1].data.type).toBe('success');
    });

    it('should display server errors without closing', () => {
        reclamationService.resolve.and.returnValue(throwError(() => ({ error: { message: 'Déjà résolue' } })));

        component.decisionForm.setValue({ commentaire: 'Commentaire suffisamment long pour valider.' });
        component.onConfirm();
        component.onConfirm();

        expect(component.isSubmitting).toBeFalse();
        expect(snackBar.openFromComponent.calls.mostRecent().args[1].data.message).toBe('Déjà résolue');
        expect(dialogRef.close).not.toHaveBeenCalled();
    });

    it('should fall back to a generic error message', () => {
        reclamationService.reject.and.returnValue(throwError(() => new Error('network')));

        component.action = 'reject';
        component.decisionForm.setValue({ commentaire: 'Commentaire suffisamment long pour valider.' });
        component.onConfirm();
        component.onConfirm();

        expect(snackBar.openFromComponent.calls.mostRecent().args[1].data.message)
            .toBe('Erreur lors de l\'opération');
    });

    it('should simply close on cancel', () => {
        component.onCancel();
        expect(dialogRef.close).toHaveBeenCalledWith();
        expect(reclamationService.resolve).not.toHaveBeenCalled();
    });
});
