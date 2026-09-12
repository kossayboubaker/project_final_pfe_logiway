import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { MatPaginator } from '@angular/material/paginator';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import {
    ReclamationListComponent,
    ReclamationResolutionDetailsComponent
} from './reclamation-list.component';
import { AuthService } from '../../core/auth.service';
import { ReclamationService, ReclamationRecord } from '../../core/services/reclamation.service';

describe('ReclamationListComponent', () => {
    let component: ReclamationListComponent;
    let fixture: ComponentFixture<ReclamationListComponent>;
    let authService: any;
    let reclamationService: any;
    let dialog: any;
    let snackBar: any;

    const record = (overrides: Partial<ReclamationRecord> = {}): ReclamationRecord => ({
        id: '1',
        sujet: 'Panne moteur',
        description: 'Le moteur fait un bruit étrange depuis ce matin',
        priorite: 'NORMAL',
        statut: 'EN_COURS',
        commentaireResolution: null,
        utilisateurId: 7,
        utilisateurNom: 'Ali',
        utilisateurEmail: 'ali@test.com',
        dateCreation: '2026-08-01T10:00:00Z',
        dateMiseAJour: null,
        ...overrides
    });

    beforeEach(async () => {
        authService = {
            getUser: jasmine.createSpy('getUser').and.returnValue({
                id: 7,
                role: 'MANAGER',
                email: ' Ali@Test.COM '
            })
        };
        reclamationService = {
            list: jasmine.createSpy('list').and.returnValue(of([
                record(),
                record({ id: '2', statut: 'RESOLU', dateCreation: '2026-08-05T09:00:00Z' }),
                record({ id: '3', statut: 'REJETE', dateCreation: '2026-07-20T09:00:00Z' }),
                record({ id: '4', dateCreation: undefined })
            ])),
            delete: jasmine.createSpy('delete').and.returnValue(of({ message: 'ok' })),
            resolve: jasmine.createSpy('resolve').and.returnValue(of(record())),
            reject: jasmine.createSpy('reject').and.returnValue(of(record()))
        };
        dialog = {
            open: jasmine.createSpy('open').and.returnValue({ afterClosed: () => of(undefined) })
        };
        snackBar = { openFromComponent: jasmine.createSpy('openFromComponent') };

        await TestBed.configureTestingModule({
            imports: [ReclamationListComponent],
            providers: [
                { provide: AuthService, useValue: authService },
                { provide: ReclamationService, useValue: reclamationService },
                { provide: MatDialog, useValue: dialog },
                { provide: MatSnackBar, useValue: snackBar }
            ]
        }).compileComponents();

        fixture = TestBed.createComponent(ReclamationListComponent);
        component = fixture.componentInstance;
        (component as any).authService = authService;
        (component as any).reclamationService = reclamationService;
        (component as any).dialog = dialog;
        (component as any).snackBar = snackBar;
        fixture.detectChanges();
    });

    it('should create, normalize current user info and load sorted reclamations', () => {
        expect(component).toBeTruthy();
        expect(component.currentUserRole).toBe('MANAGER');
        expect(component.currentUserId).toBe(7);
        expect(component.currentUserEmail).toBe('ali@test.com');

        expect(reclamationService.list).toHaveBeenCalled();
        expect(component.dataSource.data.map(r => r.id)).toEqual(['2', '1', '3', '4']);
    });

    it('should fall back safely when there is no authenticated user', () => {
        authService.getUser.and.returnValue(null);
        reclamationService.list.and.returnValue(of([]));

        fixture = TestBed.createComponent(ReclamationListComponent);
        component = fixture.componentInstance;
        (component as any).authService = authService;
        (component as any).reclamationService = reclamationService;
        (component as any).dialog = dialog;
        (component as any).snackBar = snackBar;
        fixture.detectChanges();

        expect(component.currentUserRole).toBe('DRIVER');
        expect(component.currentUserId).toBeNull();
        expect(component.currentUserEmail).toBe('');
    });

    it('should expose counters derived from the table data', () => {
        expect(component.totalReclamations).toBe(4);
        expect(component.resolvedReclamations).toBe(1);
        expect(component.rejectedReclamations).toBe(1);
        expect(component.pendingReclamations).toBe(2);
    });

    it('should attach the paginator after view init', () => {
        expect(component.dataSource.paginator instanceof MatPaginator).toBeTrue();
    });

    it('should notify when loading fails', () => {
        reclamationService.list.and.returnValue(throwError(() => new Error('down')));

        component.loadReclamations();

        expect(snackBar.openFromComponent).toHaveBeenCalled();
    });

    it('should decide creation rights from the current role', () => {
        expect(component.canCreate()).toBeTrue();

        component.currentUserRole = 'SUPERADMIN';
        expect(component.canCreate()).toBeFalse();

        component.currentUserRole = 'CHAUFFEUR';
        expect(component.canCreate()).toBeTrue();

        component.currentUserRole = 'DRIVER';
        expect(component.canCreate()).toBeTrue();
    });

    it('should allow editing only pending rows owned by the current user', () => {
        expect(component.canEditRow(record())).toBeTrue();

        expect(component.canEditRow(record({ statut: 'RESOLU' }))).toBeFalse();
        expect(component.canEditRow(record({ utilisateurEmail: 'other@test.com' }))).toBeFalse();

        component.currentUserId = null;
        component.currentUserEmail = '';
        expect(component.canEditRow(record())).toBeFalse();

        component.currentUserId = 7;
        expect(component.canEditRow(record({ utilisateurEmail: null }))).toBeTrue();
    });

    it('should always allow deletion for superadmins, otherwise only owners', () => {
        component.currentUserRole = 'SUPERADMIN';
        expect(component.canDeleteRow(record({ utilisateurEmail: 'x@y.z' }))).toBeTrue();

        component.currentUserRole = 'MANAGER';
        expect(component.canDeleteRow(record())).toBeTrue();
        expect(component.canDeleteRow(record({ utilisateurEmail: 'x@y.z' }))).toBeFalse();

        component.currentUserRole = 'UNKNOWN';
        expect(component.canDeleteRow(record())).toBeFalse();
    });

    it('should grant moderation only to superadmins', () => {
        expect(component.canModerate()).toBeFalse();
        component.currentUserRole = 'SUPERADMIN';
        expect(component.canModerate()).toBeTrue();
    });

    it('should format labels, truncation, dates and tracking keys', () => {
        expect(component.statusLabel('EN_COURS')).toBe('En cours');
        expect(component.statusLabel('RESOLU')).toBe('Résolu');
        expect(component.statusLabel('REJETE')).toBe('Rejeté');
        expect(component.statusLabel('AUTRE')).toBe('AUTRE');

        expect(component.priorityLabel('URGENT')).toBe('Urgent');
        expect(component.priorityLabel('NORMAL')).toBe('Normal');

        expect(component.truncateDescription('', 5)).toBe('');
        expect(component.truncateDescription('court', 20)).toBe('court');
        expect(component.truncateDescription('une description beaucoup trop longue pour rester entière'))
            .toBe('une description beau...');

        expect(component.formatDate(null)).toBe('-');
        expect(component.formatDate('pas-une-date')).toBe('pas-une-date');
        expect(component.formatDate('2026-08-01T10:00:00Z')).toContain('2026');

        expect(component.trackById(0, record({ id: '9' }))).toBe('9');
    });

    it('should flag resolution comments only on closed rows', () => {
        expect(component.hasResolutionComment(record({
            statut: 'RESOLU', commentaireResolution: 'Réparé'
        }))).toBeTrue();
        expect(component.hasResolutionComment(record({
            statut: 'REJETE', commentaireResolution: 'Hors scope'
        }))).toBeTrue();
        expect(component.hasResolutionComment(record({
            statut: 'RESOLU', commentaireResolution: null
        }))).toBeFalse();
        expect(component.hasResolutionComment(record({
            statut: 'EN_COURS', commentaireResolution: 'brouillon'
        }))).toBeFalse();
    });

    it('should reopen create dialog and refresh on close', () => {
        dialog.open.and.returnValue({ afterClosed: () => of(true) });
        const callsBefore = reclamationService.list.calls.count();

        component.openCreateDialog();

        expect(dialog.open.calls.mostRecent().args[0].name).toBe('ReclamationCreateDialogComponent');
        expect(reclamationService.list.calls.count()).toBe(callsBefore + 1);
    });

    it('should celebrate edits through the edit dialog flow', () => {
        dialog.open.and.returnValue({ afterClosed: () => of(true) });
        const snackCallsBefore = snackBar.openFromComponent.calls.count();
        const listCallsBefore = reclamationService.list.calls.count();

        component.openEditDialog(record());

        expect(dialog.open).toHaveBeenCalledWith(
            jasmine.anything(),
            jasmine.objectContaining({ data: record() })
        );
        expect(snackBar.openFromComponent.calls.count()).toBe(snackCallsBefore + 1);
        expect(reclamationService.list.calls.count()).toBe(listCallsBefore + 1);
    });

    it('should delete after explicit confirmation only', () => {
        dialog.open.and.returnValue({ afterClosed: () => of(false) });
        component.deleteReclamation(record());
        expect(reclamationService.delete).not.toHaveBeenCalled();

        dialog.open.and.returnValue({ afterClosed: () => of(true) });
        const listCallsBefore = reclamationService.list.calls.count();

        component.deleteReclamation(record());

        expect(reclamationService.delete).toHaveBeenCalledWith('1');
        expect(snackBar.openFromComponent).toHaveBeenCalled();
        expect(reclamationService.list.calls.count()).toBe(listCallsBefore + 1);
    });

    it('should surface deletion failures', () => {
        dialog.open.and.returnValue({ afterClosed: () => of(true) });
        reclamationService.delete.and.returnValue(throwError(() => ({
            error: { message: 'Liée à des missions' }
        })));

        component.deleteReclamation(record());

        const snackData = snackBar.openFromComponent.calls.mostRecent().args[1].data;
        expect(snackData.title).toBe('Suppression impossible');
        expect(snackData.message).toBe('Liée à des missions');

        snackBar.openFromComponent.calls.reset();
        reclamationService.delete.and.returnValue(throwError(() => new Error('boom')));
        component.deleteReclamation(record());
        expect(snackBar.openFromComponent.calls.mostRecent().args[1].data.message)
            .toBe('La suppression de la réclamation a échoué.');
    });

    it('should refresh after a successful moderation decision', () => {
        dialog.open.and.returnValue({ afterClosed: () => of(true) });
        const listCallsBefore = reclamationService.list.calls.count();

        component.openDecisionModal(record(), 'resolve');

        expect(dialog.open).toHaveBeenCalledWith(
            jasmine.anything(),
            jasmine.objectContaining({ data: { reclamation: record(), action: 'resolve' } })
        );
        expect(reclamationService.list.calls.count()).toBe(listCallsBefore + 1);

        dialog.open.and.returnValue({ afterClosed: () => of(false) });
        const countAfterSuccess = reclamationService.list.calls.count();
        component.openDecisionModal(record(), 'reject');
        expect(reclamationService.list.calls.count()).toBe(countAfterSuccess);
    });

    it('should display resolution details with role-aware title', () => {
        component.openResolutionDetails(record({ statut: 'RESOLU' }));

        expect(dialog.open).toHaveBeenCalledWith(
            jasmine.anything(),
            jasmine.objectContaining({ data: { reclamation: record({ statut: 'RESOLU' }), role: 'MANAGER' } })
        );

        const closeSpy = jasmine.createSpy('close');
        const superadminView = new ReclamationResolutionDetailsComponent(
            { close: closeSpy } as any,
            { reclamation: record({ statut: 'RESOLU', commentaireResolution: 'Fait' }), role: 'SUPERADMIN' }
        );
        expect(superadminView.dialogTitle).toBe('Votre commentaire de résolution');
        superadminView.onClose();
        expect(closeSpy).toHaveBeenCalled();

        const driverView = new ReclamationResolutionDetailsComponent(
            { close: closeSpy } as any,
            { reclamation: record({ statut: 'REJETE', commentaireResolution: 'Non' }), role: 'DRIVER' }
        );
        expect(driverView.dialogTitle).toBe('Réponse du SuperAdmin');
    });
});
