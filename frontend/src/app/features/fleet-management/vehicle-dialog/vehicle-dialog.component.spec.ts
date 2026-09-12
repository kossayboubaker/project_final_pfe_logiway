import { ComponentFixture, TestBed } from '@angular/core/testing';
import { VehicleDialogComponent, VehicleDialogData } from './vehicle-dialog.component';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';

describe('VehicleDialogComponent', () => {
    let closeSpy: jasmine.Spy;

    function create(data: Partial<VehicleDialogData>): ComponentFixture<VehicleDialogComponent> {
        TestBed.resetTestingModule();
        TestBed.configureTestingModule({
            imports: [VehicleDialogComponent],
            providers: [
                { provide: MatDialogRef, useValue: { close: closeSpy } },
                { provide: MAT_DIALOG_DATA, useValue: data }
            ]
        });
        const fixture = TestBed.createComponent(VehicleDialogComponent);
        fixture.detectChanges();
        return fixture;
    }

    beforeEach(() => {
        closeSpy = jasmine.createSpy('close');
    });

    it('should create en mode création avec valeurs par défaut', () => {
        const fixture = create({ mode: 'create' });
        const component = fixture.componentInstance;

        expect(component).toBeTruthy();
        expect(component.title).toBe('Ajouter un Véhicule');
        expect(component.confirmLabel).toBe('Enregistrer');
        expect(component.isCreateOrEdit).toBe(true);
        expect(component.isStatusMode).toBe(false);
        expect(component.isAssignMode).toBe(false);
        expect(component.companies).toEqual([]);
        expect(component.drivers).toEqual([]);
        expect(component.companyFixed).toBe(false);
        expect(component.allowedStatuses.length).toBe(3);
        expect(component.form.statut).toBe('EN_SERVICE');
    });

    it('préremplit le formulaire en mode édition et normalise les statuts', () => {
        const fixture = create({
            mode: 'edit',
            vehicle: {
                id: '7', plate: '123 TU 4567', brand: 'Renault', model: 'T460',
                capacity: 18, mileage: 1200, status: 'Maintenance',
                companyId: '9', driverId: '5'
            } as any,
            companies: [{ id: '9', name: 'LogiPlus' }],
            drivers: [{ id: '5', name: 'Ali Ben' }]
        });
        const component = fixture.componentInstance;

        expect(component.title).toBe('Modifier un Véhicule');
        expect(component.confirmLabel).toBe('Mettre à jour');
        expect(component.form).toEqual(jasmine.objectContaining({
            matricule: '123 TU 4567',
            marque: 'Renault',
            modele: 'T460',
            capacite: 18,
            kilometrage: 1200,
            statut: 'EN_MAINTENANCE',
            entrepriseId: 9,
            chauffeurId: 5
        }));
    });

    it('normalise HORS_SERVICE et les statuts inconnus vers EN_SERVICE', () => {
        const fixture = create({ mode: 'edit', vehicle: { id: '1', status: 'HORS_SERVICE' } as any });
        expect(fixture.componentInstance.form.statut).toBe('HORS_SERVICE');

        const fixture2 = create({ mode: 'edit', vehicle: { id: '2', status: 'INCONNU' } as any });
        expect(fixture2.componentInstance.form.statut).toBe('EN_SERVICE');

        const fixture3 = create({ mode: 'edit', vehicle: { id: '3' } as any });
        expect(fixture3.componentInstance.form.statut).toBe('EN_SERVICE');
    });

    it('utilise defaultCompanyId sans véhicule', () => {
        const fixture = create({ mode: 'create', defaultCompanyId: '12' });
        expect(fixture.componentInstance.form.entrepriseId).toBe(12);
    });

    it('mode statut : restreint aux statuts autorisés et retombe sur le premier', () => {
        const fixture = create({
            mode: 'status',
            vehicle: { id: '1', status: 'HORS_SERVICE' } as any,
            allowedStatuses: ['EN_MAINTENANCE'] as any
        });
        const component = fixture.componentInstance;
        expect(component.title).toBe('Changer le Statut');
        expect(component.confirmLabel).toBe('Enregistrer');
        expect(component.isStatusMode).toBe(true);
        expect(component.form.statut).toBe('EN_MAINTENANCE');

        const fixture2 = create({
            mode: 'status',
            vehicle: { id: '2', status: 'HORS_SERVICE' } as any
        });
        expect(fixture2.componentInstance.form.statut).toBe('HORS_SERVICE');
    });

    it('mode affectation : préselectionne le chauffeur du véhicule', () => {
        const fixture = create({
            mode: 'assign',
            vehicle: { id: '4', driverId: '31' } as any,
            drivers: [{ id: '31', name: 'Sami T' }]
        });
        const component = fixture.componentInstance;
        expect(component.title).toBe('Affecter un Chauffeur');
        expect(component.confirmLabel).toBe('Affecter');
        expect(component.isAssignMode).toBe(true);
        expect(component.form.chauffeurId).toBe(31);
    });

    it('companyFixed est forcé à true quand fourni', () => {
        const fixture = create({
            mode: 'create',
            companyFixed: true as any,
            companyName: 'LogiPlus',
            companyId: '3'
        });
        expect(fixture.componentInstance.companyFixed).toBe(true);
        expect(fixture.componentInstance.companyName).toBe('LogiPlus');
        expect(fixture.componentInstance.companyId).toBe('3');
    });

    it('statut déjà normalisé et priorité du companyId du véhicule', () => {
        const fixture = create({
            mode: 'edit',
            vehicle: { id: '9', status: 'EN_MAINTENANCE', companyId: '21' } as any,
            defaultCompanyId: '77'
        });
        const component = fixture.componentInstance;
        expect(component.form.statut).toBe('EN_MAINTENANCE');
        expect(component.form.entrepriseId).toBe(21);
    });

    it('onCancel ferme sans résultat et onSave renvoie le formulaire', () => {
        const fixture = create({ mode: 'create' });
        const component = fixture.componentInstance;

        component.onCancel();
        expect(closeSpy).toHaveBeenCalledWith();

        component.form.matricule = 'XX-999-XX';
        component.onSave();
        expect(closeSpy).toHaveBeenCalledWith(jasmine.objectContaining({ matricule: 'XX-999-XX' }));
    });
});
