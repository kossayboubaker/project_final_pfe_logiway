import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { provideRouter } from '@angular/router';
import { of, Subject, throwError } from 'rxjs';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { ReclamationComponent } from './reclamation.component';
import { AuthService } from '../../core/auth.service';
import { ReclamationService, ReclamationRecord } from '../../core/services/reclamation.service';

describe('ReclamationComponent', () => {
  let component: ReclamationComponent;
  let fixture: ComponentFixture<ReclamationComponent>;
  let authServiceMock: jasmine.SpyObj<AuthService>;
  let reclamationServiceMock: jasmine.SpyObj<ReclamationService>;
  let dialogSpy: jasmine.SpyObj<MatDialog>;
  let snackBarSpy: jasmine.SpyObj<MatSnackBar>;
  let dialogResults: Subject<any>[];

  const mockReclamations: ReclamationRecord[] = [
    {
      id: '1', sujet: 'Panne moteur', description: 'Camion en panne',
      priorite: 'URGENT', statut: 'EN_COURS',
      utilisateurId: 5, utilisateurNom: 'Ali Ben', utilisateurEmail: 'ali@test.com',
      dateCreation: '2025-06-01T10:00:00', commentaireResolution: null, dateMiseAJour: null
    },
    {
      id: '2', sujet: 'Retard livraison', description: 'Retard 2h',
      priorite: 'NORMAL', statut: 'RESOLU',
      utilisateurId: 6, utilisateurNom: 'Sara Kamel', utilisateurEmail: 'sara@test.com',
      dateCreation: '2025-06-02T08:00:00', commentaireResolution: 'Résolu', dateMiseAJour: null
    },
    {
      id: '3', sujet: 'Problème GPS', description: 'GPS ne fonctionne pas',
      priorite: 'NORMAL', statut: 'REJETE',
      utilisateurId: 7, utilisateurNom: 'Nour Ali', utilisateurEmail: 'nour@test.com',
      dateCreation: '2025-06-03T09:00:00', commentaireResolution: 'Hors garantie', dateMiseAJour: null
    }
  ];

  beforeEach(async () => {
    authServiceMock = jasmine.createSpyObj('AuthService', ['getUser']);
    authServiceMock.getUser.and.returnValue({ id: '1', role: 'SUPERADMIN' });

    reclamationServiceMock = jasmine.createSpyObj('ReclamationService', [
      'list', 'create', 'update', 'delete', 'resolve', 'reject', 'validate'
    ]);
    reclamationServiceMock.list.and.returnValue(of(mockReclamations));

    dialogResults = [];
    dialogSpy = jasmine.createSpyObj('MatDialog', ['open']);
    dialogSpy.open.and.callFake(() => {
      const s = new Subject<any>();
      dialogResults.push(s);
      return { afterClosed: () => s.asObservable(), close: () => { }, componentInstance: {} } as any;
    });
    snackBarSpy = jasmine.createSpyObj('MatSnackBar', ['open']);

    await TestBed.configureTestingModule({
      imports: [ReclamationComponent],
      providers: [
        provideRouter([]),
        provideHttpClient(),
        provideHttpClientTesting(),
        provideAnimationsAsync(),
        { provide: AuthService, useValue: authServiceMock },
        { provide: ReclamationService, useValue: reclamationServiceMock },
        { provide: MatDialog, useValue: dialogSpy },
        { provide: MatSnackBar, useValue: snackBarSpy }
      ]
    })
      .overrideComponent(ReclamationComponent, {
        remove: { imports: [MatDialogModule, MatSnackBarModule] }
      })
      .compileComponents();

    fixture = TestBed.createComponent(ReclamationComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should load reclamations on init', () => {
    expect(reclamationServiceMock.list).toHaveBeenCalled();
    expect(component.dataSource.data.length).toBe(3);
  });

  it('should set SUPERADMIN role on init', () => {
    expect(component.currentUserRole).toBe('SUPERADMIN');
  });

  // ─── Computed counts ──────────────────────────────────────────
  it('totalReclamations should count all filtered items', () => {
    expect(component.totalReclamations).toBe(3);
  });

  it('resolvedReclamations should count RESOLU', () => {
    expect(component.resolvedReclamations).toBe(1);
  });

  it('rejectedReclamations should count REJETE', () => {
    expect(component.rejectedReclamations).toBe(1);
  });

  it('pendingReclamations should count EN_COURS', () => {
    expect(component.pendingReclamations).toBe(1);
  });

  // ─── Permissions ──────────────────────────────────────────────
  it('canCreate() should return false for SUPERADMIN', () => {
    component.currentUserRole = 'SUPERADMIN';
    expect(component.canCreate()).toBeFalse();
  });

  it('canCreate() should return true for MANAGER', () => {
    component.currentUserRole = 'MANAGER';
    expect(component.canCreate()).toBeTrue();
  });

  it('canCreate() should return true for DRIVER', () => {
    component.currentUserRole = 'DRIVER';
    expect(component.canCreate()).toBeTrue();
  });

  it('canModerate() should return true for SUPERADMIN', () => {
    component.currentUserRole = 'SUPERADMIN';
    expect(component.canModerate()).toBeTrue();
  });

  it('canModerate() should return false for MANAGER', () => {
    component.currentUserRole = 'MANAGER';
    expect(component.canModerate()).toBeFalse();
  });

  // ─── Labels ───────────────────────────────────────────────────
  it('statusLabel() EN_COURS → "En cours"', () => {
    expect(component.statusLabel('EN_COURS')).toBe('En cours');
  });

  it('statusLabel() RESOLU → "Résolu"', () => {
    expect(component.statusLabel('RESOLU')).toBe('Résolu');
  });

  it('statusLabel() REJETE → "Rejeté"', () => {
    expect(component.statusLabel('REJETE')).toBe('Rejeté');
  });

  it('priorityLabel() URGENT → "Urgent"', () => {
    expect(component.priorityLabel('URGENT')).toBe('Urgent');
  });

  it('priorityLabel() NORMAL → "Normal"', () => {
    expect(component.priorityLabel('NORMAL')).toBe('Normal');
  });

  // ─── Format date ──────────────────────────────────────────────
  it('formatDate() should format ISO date to French format', () => {
    const result = component.formatDate('2025-06-01T10:00:00');
    expect(result).toBeTruthy();
    expect(result).not.toBe('-');
  });

  it('formatDate() should return "-" for null input', () => {
    expect(component.formatDate(null)).toBe('-');
  });

  it('formatDate() should return "-" for undefined input', () => {
    expect(component.formatDate(undefined)).toBe('-');
  });

  // ─── Filters ──────────────────────────────────────────────────
  it('applyFilters() should update dataSource.filter', () => {
    component.statusFilter = 'RESOLU';
    component.applyFilters();
    expect(component.dataSource.filter).toContain('RESOLU');
  });

  it('resetFilters() should clear all filters', () => {
    component.searchText = 'test';
    component.statusFilter = 'EN_COURS';
    component.priorityFilter = 'URGENT';
    component.resetFilters();
    expect(component.searchText).toBe('');
    expect(component.statusFilter).toBe('');
    expect(component.priorityFilter).toBe('');
  });

  // ─── Resolution details ───────────────────────────────────────
  it('openResolutionDetails() should set selectedResolution', () => {
    component.openResolutionDetails(mockReclamations[1]);
    expect(component.selectedResolution).toEqual(mockReclamations[1]);
  });

  it('closeResolutionDetails() should clear selectedResolution', () => {
    component.selectedResolution = mockReclamations[0];
    component.closeResolutionDetails();
    expect(component.selectedResolution).toBeNull();
  });

  it('hasResolutionComment() should return true when commentaire exists and status is RESOLU', () => {
    const r = { ...mockReclamations[1], commentaireResolution: 'OK', statut: 'RESOLU' as const };
    expect(component.hasResolutionComment(r)).toBeTrue();
  });

  it('hasResolutionComment() should return false when no comment', () => {
    expect(component.hasResolutionComment(mockReclamations[0])).toBeFalse();
  });

  // ─── trackById ────────────────────────────────────────────────
  it('trackById() should return item id', () => {
    expect(component.trackById(0, mockReclamations[0])).toBe('1');
  });

  // ─── canEditRow / canDeleteRow ────────────────────────────────
  it('canEditRow() should return false for SUPERADMIN even own row', () => {
    component.currentUserRole = 'SUPERADMIN';
    expect(component.canEditRow(mockReclamations[0])).toBeFalse();
  });

  it('canEditRow() should return true for MANAGER on own EN_COURS reclamation', () => {
    component.currentUserRole = 'MANAGER';
    component.currentUserId = 5;
    expect(component.canEditRow(mockReclamations[0])).toBeTrue();
  });

  it('canDeleteRow() should return false for RESOLU status', () => {
    component.currentUserRole = 'MANAGER';
    component.currentUserId = 6;
    expect(component.canDeleteRow(mockReclamations[1])).toBeFalse(); // RESOLU
  });

  // ─── Colonnes selon rôle ──────────────────────────────────────
  it('ngOnInit masque la colonne auteur pour un non-SUPERADMIN', () => {
    authServiceMock.getUser.and.returnValue({ id: 5, role: 'MANAGER' });
    component.ngOnInit();
    expect(component.displayedColumns).toEqual(['sujet', 'description', 'priorite', 'statut', 'dateCreation', 'actions']);
    expect(component.currentUserId).toBe(5);
    authServiceMock.getUser.and.returnValue({ id: '1', role: 'SUPERADMIN' });
  });

  it('currentUserId null si id non numérique', () => {
    authServiceMock.getUser.and.returnValue({ id: 'abc', role: 'DRIVER' });
    component.ngOnInit();
    expect(component.currentUserId).toBeNull();
    authServiceMock.getUser.and.returnValue({ id: '1', role: 'SUPERADMIN' });
  });

  // ─── Erreur de chargement ─────────────────────────────────────
  it('loadReclamations notifie en cas d\'échec', () => {
    reclamationServiceMock.list.and.returnValue(throwError(() => new Error('ko')));
    component.loadReclamations();
    expect(snackBarSpy.open).toHaveBeenCalledWith('Impossible de charger les réclamations', undefined, { duration: 3000 });
    reclamationServiceMock.list.and.returnValue(of(mockReclamations));
  });

  // ─── openCreateDialog ─────────────────────────────────────────
  it('openCreateDialog soumet et recharge après résultat', () => {
    const callsBefore = reclamationServiceMock.list.calls.count();
    component.openCreateDialog();

    expect(dialogSpy.open).toHaveBeenCalled();
    dialogResults[0].next({ sujet: 'Nouvelle' });

    expect(snackBarSpy.open).toHaveBeenCalledWith(
      'Votre réclamation a été soumise avec succès. Le SuperAdmin en a été informé.',
      undefined,
      { duration: 3500 }
    );
    expect(reclamationServiceMock.list.calls.count()).toBe(callsBefore + 1);
  });

  it('openCreateDialog sans résultat ne fait rien', () => {
    const callsBefore = reclamationServiceMock.list.calls.count();
    component.openCreateDialog();
    dialogResults[0].next(undefined);

    expect(reclamationServiceMock.list.calls.count()).toBe(callsBefore);
  });

  // ─── openEditDialog ───────────────────────────────────────────
  it('openEditDialog passe la réclamation en data et recharge', () => {
    component.openEditDialog(mockReclamations[0]);
    const config = dialogSpy.open.calls.mostRecent().args[1] as any;
    expect(config.data).toEqual(mockReclamations[0]);

    dialogResults[dialogResults.length - 1].next({ sujet: 'Modifiée' });
    expect(snackBarSpy.open).toHaveBeenCalledWith('Réclamation modifiée avec succès.', undefined, { duration: 3500 });
  });

  it('openEditDialog sans résultat ne recharge pas', () => {
    const callsBefore = reclamationServiceMock.list.calls.count();
    component.openEditDialog(mockReclamations[0]);
    dialogResults[dialogResults.length - 1].next(null);

    expect(reclamationServiceMock.list.calls.count()).toBe(callsBefore);
  });

  // ─── deleteReclamation ────────────────────────────────────────
  it('deleteReclamation annule si confirm refusé', () => {
    spyOn(window, 'confirm').and.returnValue(false);
    component.deleteReclamation(mockReclamations[0]);

    expect(reclamationServiceMock.delete).not.toHaveBeenCalled();
  });

  it('deleteReclamation supprime avec confirmation', () => {
    spyOn(window, 'confirm').and.returnValue(true);
    reclamationServiceMock.delete.and.returnValue(of({ message: 'Deleted' } as any));

    component.deleteReclamation(mockReclamations[0]);

    expect(reclamationServiceMock.delete).toHaveBeenCalledWith('1');
    expect(snackBarSpy.open).toHaveBeenCalledWith('Réclamation supprimée.', undefined, { duration: 3000 });
  });

  it('deleteReclamation affiche le message d\'erreur backend', () => {
    spyOn(window, 'confirm').and.returnValue(true);
    reclamationServiceMock.delete.and.returnValue(throwError(() => ({ error: { message: 'Interdit' } })));

    component.deleteReclamation(mockReclamations[0]);

    expect(snackBarSpy.open).toHaveBeenCalledWith('Interdit', undefined, { duration: 4000 });
  });

  it('deleteReclamation utilise le message par défaut sans erreur backend', () => {
    spyOn(window, 'confirm').and.returnValue(true);
    reclamationServiceMock.delete.and.returnValue(throwError(() => new Error('boom')));

    component.deleteReclamation(mockReclamations[0]);

    expect(snackBarSpy.open).toHaveBeenCalledWith('La réclamation n\u2019a pas pu être supprimée.', undefined, { duration: 4000 });
  });

  // ─── resolve() ────────────────────────────────────────────────
  it('resolve exige un commentaire', () => {
    spyOn(window, 'prompt').and.returnValue('   ');

    component.resolve(mockReclamations[0]);

    expect(snackBarSpy.open).toHaveBeenCalledWith('Le commentaire est obligatoire', undefined, { duration: 2500 });
    expect(reclamationServiceMock.resolve).not.toHaveBeenCalled();
  });

  it('resolve résout avec succès', () => {
    spyOn(window, 'prompt').and.returnValue(' Réparé ');
    reclamationServiceMock.resolve.and.returnValue(of({} as any));

    component.resolve(mockReclamations[0]);

    expect(reclamationServiceMock.resolve).toHaveBeenCalledWith('1', 'Réparé');
    expect(snackBarSpy.open).toHaveBeenCalledWith('Réclamation résolue', undefined, { duration: 3000 });
  });

  it('resolve notifie une erreur', () => {
    spyOn(window, 'prompt').and.returnValue('Réparé');
    reclamationServiceMock.resolve.and.returnValue(throwError(() => new Error('ko')));

    component.resolve(mockReclamations[0]);

    expect(snackBarSpy.open).toHaveBeenCalledWith('Impossible de résoudre la réclamation', undefined, { duration: 3500 });
  });

  // ─── reject() ─────────────────────────────────────────────────
  it('reject exige un commentaire', () => {
    spyOn(window, 'prompt').and.returnValue('');

    component.reject(mockReclamations[0]);

    expect(snackBarSpy.open).toHaveBeenCalledWith('Le commentaire est obligatoire', undefined, { duration: 2500 });
    expect(reclamationServiceMock.reject).not.toHaveBeenCalled();
  });

  it('reject rejette avec succès', () => {
    spyOn(window, 'prompt').and.returnValue('Hors sujet');
    reclamationServiceMock.reject.and.returnValue(of({} as any));

    component.reject(mockReclamations[0]);

    expect(reclamationServiceMock.reject).toHaveBeenCalledWith('1', 'Hors sujet');
    expect(snackBarSpy.open).toHaveBeenCalledWith('Réclamation rejetée', undefined, { duration: 3000 });
  });

  it('reject notifie une erreur', () => {
    spyOn(window, 'prompt').and.returnValue('Hors sujet');
    reclamationServiceMock.reject.and.returnValue(throwError(() => new Error('ko')));

    component.reject(mockReclamations[0]);

    expect(snackBarSpy.open).toHaveBeenCalledWith('Impossible de rejeter la réclamation', undefined, { duration: 3500 });
  });

  // ─── Labels complémentaires ───────────────────────────────────
  it('statusLabel retourne le statut inconnu tel quel', () => {
    expect(component.statusLabel('AUTRE')).toBe('AUTRE');
  });

  it('resolutionPanelTitle diffère selon le rôle', () => {
    component.currentUserRole = 'SUPERADMIN';
    expect(component.resolutionPanelTitle()).toBe('Votre commentaire de résolution');

    component.currentUserRole = 'MANAGER';
    expect(component.resolutionPanelTitle()).toBe('Réponse du SuperAdmin');
  });

  it('resolutionPanelSubtitle gère les trois cas', () => {
    expect(component.resolutionPanelSubtitle()).toBe('');

    component.selectedResolution = mockReclamations[2];
    expect(component.resolutionPanelSubtitle()).toBe('Motif du rejet');

    component.selectedResolution = mockReclamations[1];
    expect(component.resolutionPanelSubtitle()).toBe('Commentaire de résolution');
  });

  it('searchHint retourne l\'aide à la recherche', () => {
    expect(component.searchHint()).toBe('Recherche intelligente: sujet, description, auteur, priorité, statut');
  });

  it('hasResolutionComment faux si statut non final malgré commentaire', () => {
    expect(component.hasResolutionComment({ ...mockReclamations[0], commentaireResolution: 'X' })).toBeFalse();
  });

  // ─── Utilisateur absent ───────────────────────────────────────
  it('utilisateur absent : rôle DRIVER par défaut', () => {
    authServiceMock.getUser.and.returnValue(null);
    component.ngOnInit();
    expect(component.currentUserRole).toBe('DRIVER');
    expect(component.currentUserId).toBeNull();
    expect(component.displayedColumns).not.toContain('auteur');
    authServiceMock.getUser.and.returnValue({ id: '1', role: 'SUPERADMIN' });
  });

  // ─── Prédicat de filtre ───────────────────────────────────────
  it('le filtre recherche un token dans tous les champs', () => {
    component.dataSource.data = mockReclamations;
    component.searchText = 'PANNE';
    component.applyFilters();

    expect(component.dataSource.filteredData.map(r => r.id)).toEqual(['1']);
  });

  it('le filtre accepte plusieurs tokens (ET logique)', () => {
    component.dataSource.data = mockReclamations;
    component.searchText = 'gps ne';
    component.applyFilters();

    expect(component.dataSource.filteredData.map(r => r.id)).toEqual(['3']);
  });

  it('recherche vide : toutes les lignes passent', () => {
    component.dataSource.data = mockReclamations;
    component.searchText = '';
    component.applyFilters();

    expect(component.dataSource.filteredData.length).toBe(3);
  });

  it('filtres statut et priorité combinés', () => {
    component.dataSource.data = mockReclamations;
    component.searchText = '';
    component.statusFilter = 'RESOLU';
    component.priorityFilter = 'NORMAL';
    component.applyFilters();

    expect(component.dataSource.filteredData.map(r => r.id)).toEqual(['2']);

    component.statusFilter = 'RESOLU';
    component.priorityFilter = 'URGENT';
    component.applyFilters();

    expect(component.dataSource.filteredData.length).toBe(0);
  });

  it('priorité seule filtre les urgents', () => {
    component.dataSource.data = mockReclamations;
    component.statusFilter = '';
    component.priorityFilter = 'URGENT';
    component.applyFilters();

    expect(component.dataSource.filteredData.map(r => r.id)).toEqual(['1']);
  });

  it('resetFilters réaffiche tout', () => {
    component.searchText = 'panne';
    component.statusFilter = 'EN_COURS';
    component.resetFilters();

    expect(component.dataSource.filteredData.length).toBe(3);
  });

  it('filterPredicate tolère un filtre vide', () => {
    expect(
      component.dataSource.filterPredicate(mockReclamations[0], '')
    ).toBeTrue();
    expect(
      component.dataSource.filterPredicate(mockReclamations[0], '{}')
    ).toBeTrue();
  });
});
