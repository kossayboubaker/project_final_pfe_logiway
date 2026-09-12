import { FormBuilder } from '@angular/forms';
import { of, throwError } from 'rxjs';
import {
    ReclamationCreateDialogComponent,
    ReclamationCreateDialogResult
} from './reclamation-create-dialog.component';
import { ReclamationRecord } from '../../core/services/reclamation.service';

describe('ReclamationCreateDialogComponent', () => {
    let dialogRef: any;
    let reclamationService: any;
    let snackBar: any;
    let component: ReclamationCreateDialogComponent;

    const build = (data?: ReclamationRecord) => {
        component = new ReclamationCreateDialogComponent(
            new FormBuilder(),
            dialogRef,
            reclamationService,
            snackBar,
            data
        );
        component.ngOnInit();
        return component;
    };

    beforeEach(() => {
        jest.useFakeTimers();
        dialogRef = { close: jasmine.createSpy('close') };
        reclamationService = {
            validate: jasmine.createSpy('validate').and.returnValue(of({
                sujet: { valide: true, message: null },
                description: { valide: true, message: null }
            })),
            create: jasmine.createSpy('create').and.returnValue(of({ id: 1 })),
            update: jasmine.createSpy('update').and.returnValue(of({ id: 1 }))
        };
        snackBar = { openFromComponent: jasmine.createSpy('openFromComponent') };
    });

    afterEach(() => {
        try {
            component.ngOnDestroy();
        } catch {
            /* pas instancié */
        }
        jest.useRealTimers();
    });

    const runValidationTick = async () => {
        await jest.advanceTimersByTimeAsync(600);
    };

    it('should start in creation mode with a pristine form', () => {
        build();

        expect(component.isEditMode).toBeFalse();
        expect(component.reclamationForm.get('priorite')?.value).toBe('NORMAL');
        expect(component.descriptionCharCount).toBe(0);
        expect(component.prioriteLabel).toBe('Normal');
        expect(component.prioriteBadgeClass).toBe('badge-normal');
        expect(component.submitButtonText).toBe('SOUMETTRE');
    });

    it('should preload fields in edit mode', () => {
        build({
            id: '12',
            sujet: 'Panne moteur',
            description: 'Le véhicule cale au démarrage',
            priorite: 'URGENT'
        } as ReclamationRecord);

        expect(component.isEditMode).toBeTrue();
        expect(component.isSubjectValid).toBeTrue();
        expect(component.isDescriptionValid).toBeTrue();
        expect(component.reclamationForm.get('sujet')?.value).toBe('Panne moteur');
        expect(component.prioriteLabel).toBe('Urgent');
        expect(component.prioriteBadgeClass).toBe('badge-urgent');
        expect(component.submitButtonText).toBe('METTRE À JOUR');
    });

    it('should expose char count and error flags', () => {
        build();

        component.reclamationForm.patchValue({ description: 'Une description suffisamment longue.' });
        expect(component.descriptionCharCount).toBe(36);

        expect(component.hasSujetError).toBeFalse();
        component.sujetError = 'invalide';
        component.descriptionError = 'invalide';
        expect(component.hasSujetError).toBeTrue();
        expect(component.hasDescriptionError).toBeTrue();
    });

    it('should run AI validation and surface field errors', async () => {
        reclamationService.validate.and.returnValue(of({
            sujet: { valide: false, message: null },
            description: { valide: false, message: 'Description trop vague.' }
        }));
        build();

        component.reclamationForm.setValue({
            sujet: 'Retard répétitif',
            description: 'Le chauffeur arrive systématiquement en retard.',
            priorite: 'NORMAL'
        });
        await runValidationTick();

        expect(reclamationService.validate).toHaveBeenCalledWith(
            'Retard répétitif',
            'Le chauffeur arrive systématiquement en retard.'
        );
        expect(component.isCheckingAI).toBeFalse();
        expect(component.isSubjectValid).toBeFalse();
        expect(component.sujetError).toBe('Le sujet est invalide.');
        expect(component.isDescriptionValid).toBeFalse();
        expect(component.descriptionError).toBe('Description trop vague.');
    });

    it('should let content pass when the AI service is unavailable', async () => {
        reclamationService.validate.and.returnValue(throwError(() => new Error('offline')));
        build();

        component.reclamationForm.setValue({
            sujet: 'Climatisation',
            description: 'La climatisation ne fonctionne plus depuis lundi.',
            priorite: 'URGENT'
        });
        await runValidationTick();

        expect(component.isCheckingAI).toBeFalse();
        expect(component.isSubjectValid).toBeTrue();
        expect(component.isDescriptionValid).toBeTrue();
    });

    it('should skip AI validation when both fields are empty', async () => {
        build();

        component.reclamationForm.get('sujet')?.setValue('');
        await runValidationTick();

        expect(reclamationService.validate).not.toHaveBeenCalled();
        expect(component.isSubjectValid).toBeTrue();
        expect(component.isDescriptionValid).toBeTrue();
    });

    it('should gate submission until everything is green', () => {
        build();

        expect(component.canSubmit()).toBeFalse();

        component.reclamationForm.setValue({
            sujet: 'Carburant',
            description: 'Consommation anormale relevée sur le véhicule.',
            priorite: 'NORMAL'
        });
        expect(component.canSubmit()).toBeFalse();

        component.isSubjectValid = true;
        expect(component.canSubmit()).toBeFalse();

        component.isDescriptionValid = true;
        expect(component.canSubmit()).toBeTrue();

        component.isCheckingAI = true;
        expect(component.canSubmit()).toBeFalse();
        component.isCheckingAI = false;

        component.sujetError = 'refusé';
        expect(component.canSubmit()).toBeFalse();
        component.sujetError = '';

        component.isSubmitting = true;
        expect(component.canSubmit()).toBeFalse();
    });

    it('should submit a new reclamation with a trimmed payload', () => {
        build();
        component.reclamationForm.setValue({
            sujet: '  Sièges déchirés  ',
            description: 'Les sièges du véhicule 45 sont déchirés côté passager.',
            priorite: 'NORMAL'
        });
        component.isSubjectValid = true;
        component.isDescriptionValid = true;

        component.submit();

        const payload = reclamationService.create.calls.mostRecent().args[0] as ReclamationCreateDialogResult;
        expect(payload.sujet).toBe('Sièges déchirés');
        expect(payload.priorite).toBe('NORMAL');
        expect(dialogRef.close).toHaveBeenCalledWith(payload);
        expect(component.isSubmitting).toBeFalse();
    });

    it('should update the existing reclamation in edit mode', () => {
        build({ id: '31', sujet: 'S', description: 'D', priorite: 'NORMAL' } as ReclamationRecord);
        component.reclamationForm.setValue({
            sujet: 'Pneus usés',
            description: 'Les quatre pneus sont à remplacer sur le véhicule.',
            priorite: 'URGENT'
        });
        component.isSubjectValid = true;
        component.isDescriptionValid = true;

        component.submit();

        expect(reclamationService.update).toHaveBeenCalledWith('31', jasmine.objectContaining({
            sujet: 'Pneus usés'
        }));
        expect(reclamationService.create).not.toHaveBeenCalled();
    });

    it('should route server errors to the right field', () => {
        reclamationService.create.and.returnValue(throwError(() => ({ error: { message: 'Le sujet est inapproprié' } })));
        build();
        component.reclamationForm.setValue({
            sujet: 'Sujet ok',
            description: 'Description tout à fait conforme aux attentes.',
            priorite: 'NORMAL'
        });
        component.isSubjectValid = true;
        component.isDescriptionValid = true;

        component.submit();

        expect(component.sujetError).toBe('Le sujet est inapproprié');
        expect(component.descriptionError).toBe('');
        expect(dialogRef.close).not.toHaveBeenCalled();

        component.sujetError = '';
        reclamationService.create.and.returnValue(throwError(() => ({ error: { message: 'Description non conforme' } })));
        component.submit();
        expect(component.descriptionError).toBe('Description non conforme');
        expect(component.sujetError).toBe('');
    });

    it('should flag both fields for language or domain violations', () => {
        reclamationService.create.and.returnValue(throwError(() => ({ error: { message: 'Langage inapproprié détecté' } })));
        build();
        component.reclamationForm.setValue({
            sujet: 'Sujet correct',
            description: 'Encore une description parfaitement conforme ici.',
            priorite: 'NORMAL'
        });
        component.isSubjectValid = true;
        component.isDescriptionValid = true;

        component.submit();

        expect(component.sujetError).toContain('Langage');
        expect(component.descriptionError).toContain('Langage');
    });

    it('should notify through the snackbar for unrelated failures', () => {
        reclamationService.create.and.returnValue(throwError(() => ({ error: { message: 'Base indisponible' } })));
        build();
        component.reclamationForm.setValue({
            sujet: 'Vitre cassée',
            description: 'La vitre avant est fissurée après un impact.',
            priorite: 'NORMAL'
        });
        component.isSubjectValid = true;
        component.isDescriptionValid = true;

        component.submit();

        const snackData = snackBar.openFromComponent.calls.mostRecent().args[1].data;
        expect(snackData.message).toBe('Base indisponible');

        reclamationService.create.and.returnValue(throwError(() => ({})));
        component.submit();
        expect(snackBar.openFromComponent.calls.mostRecent().args[1].data.message)
            .toBe('La réclamation a été refusée.');
    });

    it('should reflect transient button states and cancel cleanly', () => {
        build();

        component.isSubmitting = true;
        expect(component.submitButtonText).toBe('ENVOI...');
        component.isSubmitting = false;

        component.isCheckingAI = true;
        expect(component.submitButtonText).toBe('ANALYSE IA...');
        component.isCheckingAI = false;

        component.cancel();
        expect(dialogRef.close).toHaveBeenCalledWith();
    });
});
