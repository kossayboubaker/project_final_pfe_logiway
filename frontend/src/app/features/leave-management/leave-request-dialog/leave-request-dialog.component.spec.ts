import { ComponentFixture, TestBed } from '@angular/core/testing';
import { LeaveRequestDialogComponent } from './leave-request-dialog.component';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';

describe('LeaveRequestDialogComponent', () => {
    let component: LeaveRequestDialogComponent;
    let fixture: ComponentFixture<LeaveRequestDialogComponent>;
    const closeSpy = jasmine.createSpy('close');

    function create(data: any): void {
        TestBed.resetTestingModule();
        TestBed.configureTestingModule({
            imports: [LeaveRequestDialogComponent, NoopAnimationsModule],
            providers: [
                { provide: MatDialogRef, useValue: { close: closeSpy } },
                { provide: MAT_DIALOG_DATA, useValue: data }
            ]
        });
        fixture = TestBed.createComponent(LeaveRequestDialogComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    }

    beforeEach(() => {
        closeSpy.calls.reset();
    });

    it('should create en mode création sans données', () => {
        create(undefined);
        expect(component).toBeTruthy();
        expect(component.isEditMode).toBe(false);
        expect(component.leaveTypes.map(t => t.value)).toEqual(['MALADIE', 'MARIAGE', 'VACANCES']);
        expect(component.leaveForm.invalid).toBe(true);
    });

    it('ngOnInit préremplit le formulaire en mode édition', () => {
        create({ id: 3, type: 'MALADIE', startDate: '2025-06-01', endDate: '2025-06-05', reason: 'Repos médical' });
        component.ngOnInit();
        expect(component.isEditMode).toBe(true);
        expect(component.leaveForm.value.type).toBe('MALADIE');
        expect((component.leaveForm.value.startDate as Date).getTime()).not.toBeNaN();
        expect(component.leaveForm.value.reason).toBe('Repos médical');
        expect(component.leaveForm.valid).toBe(true);
    });

    it('parseDate gère les entrées invalides', () => {
        create(null);
        (component as any).data = { type: 'VACANCES' };
        component.ngOnInit();

        create({});
        component.ngOnInit();
        // dates manquantes → patchValue avec null
        expect(component.leaveForm.value.startDate).toBeNull();

        const invalid = (component as any).parseDate('pas-une-date');
        expect(invalid).toBeNull();
        expect((component as any).parseDate('')).toBeNull();
        expect(((component as any).parseDate('2025-06-02') as Date).getFullYear()).toBe(2025);
    });

    it('onCancel ferme le dialogue', () => {
        create(undefined);
        component.onCancel();
        expect(closeSpy).toHaveBeenCalledWith();
    });

    it('onSubmit ne ferme pas un formulaire invalide', () => {
        create(undefined);
        component.onSubmit();
        expect(closeSpy).not.toHaveBeenCalled();
    });

    it('onSubmit renvoie les valeurs formatées si valide', () => {
        create(undefined);
        component.leaveForm.patchValue({
            type: 'VACANCES',
            startDate: new Date(2025, 5, 1),
            endDate: new Date(2025, 5, 10),
            reason: 'Congés annuels'
        });
        component.onSubmit();
        expect(closeSpy).toHaveBeenCalledTimes(1);
        const payload = closeSpy.calls.mostRecent().args[0];
        expect(payload.type).toBe('VACANCES');
        expect(payload.reason).toBe('Congés annuels');
        expect(payload.startDate).toBeTruthy();
        expect(payload.endDate).toBeTruthy();
    });

    describe('durationPreview', () => {
        it('vide sans les deux dates', () => {
            create(undefined);
            expect(component.durationPreview).toBe('');

            component.leaveForm.patchValue({ startDate: new Date(2025, 5, 1) });
            expect(component.durationPreview).toBe('');
        });

        it('calcule la durée inclusive en jours', () => {
            create(undefined);
            component.leaveForm.patchValue({
                startDate: new Date(2025, 5, 1),
                endDate: new Date(2025, 5, 4)
            });
            expect(component.durationPreview).toBe('4 jours');
        });

        it('singulier pour un seul jour et vide si fin avant début', () => {
            create(undefined);
            component.leaveForm.patchValue({
                startDate: new Date(2025, 5, 1),
                endDate: new Date(2025, 5, 1)
            });
            expect(component.durationPreview).toBe('1 jour');

            component.leaveForm.patchValue({ endDate: new Date(2025, 4, 30) });
            expect(component.durationPreview).toBe('');
        });

        it('vide sur dates invalides', () => {
            create(undefined);
            component.leaveForm.patchValue({
                startDate: 'nimporte',
                endDate: 'nimportequoi'
            });
            expect(component.durationPreview).toBe('');
        });
    });
});
