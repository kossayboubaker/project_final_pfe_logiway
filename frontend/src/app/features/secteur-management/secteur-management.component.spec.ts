import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { of, Subject, throwError } from 'rxjs';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { SecteurManagementComponent } from './secteur-management.component';
import { Company, CompanyService } from '../../core/services/company.service';
import { AuthService } from '../../core/auth.service';
import { UserListItem, UserService } from '../../core/services/user.service';

describe('SecteurManagementComponent', () => {
  let component: SecteurManagementComponent;
  let fixture: ComponentFixture<SecteurManagementComponent>;
  let httpMock: HttpTestingController;

  const sectorsUrl = 'http://localhost:8080/api/secteurs';

  const users: UserListItem[] = [
    { id: 10, prenom: 'Ali', nom: 'Ben', email: 'ali.ben@logiway.tn', role: 'MANAGER' },
    { id: 11, prenom: 'Sara', nom: 'Nabi', email: 'sara.nabi@logiway.tn', role: 'CHAUFFEUR', managerId: 10 },
    { id: 12, prenom: 'Yassin', nom: 'Khalfi', email: 'yassin.khalfi@logiway.tn', role: 'CHAUFFEUR', managerId: 10 },
    { id: 13, prenom: 'Nour', nom: 'Haddad', email: 'nour.haddad@logiway.tn', role: 'MANAGER' }
  ];

  const companies: Company[] = [
    { id: '1', name: 'Entreprise A', address: '', sector: '', fleetSize: 0, activeMissions: 0, status: 'Actif', joinDate: '2026-01-01' }
  ];

  const initialSectors = [
    {
      id: 1, nom: 'Secteur Nord', description: 'Zone industrielle de Bizerte',
      zoneGeographique: 'Bizerte Nord', codesPostaux: '7000, 7010',
      entrepriseId: 1, createdAt: '2026-05-01T12:00:00.000Z',
      managers: [{ id: 10, prenom: 'Ali', nom: 'Ben', email: 'ali.ben@logiway.tn' }],
      chauffeurs: [
        { id: 11, prenom: 'Sara', nom: 'Nabi', fullName: 'Sara Nabi', managerId: 10 },
        { id: 12, prenom: 'Yassin', nom: 'Khalfi', fullName: 'Yassin Khalfi', managerId: 10 }
      ]
    },
    {
      id: 2, nom: 'Secteur Sud', description: 'Sfax et alentours',
      zoneGeographique: 'Sfax Sud', codesPostaux: '3000',
      entrepriseId: 1, createdAt: '2026-05-02T08:30:00.000Z',
      managers: [],
      chauffeurs: []
    }
  ];

  /** Flush the initial loadData() forkJoin — only GET /secteurs goes through HTTP,
   *  UserService.list() and CompanyService.getCompanies() are mocked. */
  function flushLoadData(sectors = initialSectors) {
    httpMock.match(sectorsUrl).forEach(r => r.flush(sectors));
  }

  beforeEach(async () => {
    const userServiceSpy = {
      list: jasmine.createSpy('list').and.returnValue(of(users))
    };
    const companyServiceSpy = {
      getCompanies: jasmine.createSpy('getCompanies').and.returnValue(of(companies))
    };
    const authServiceSpy = {
      getUser: jasmine.createSpy('getUser').and.returnValue({ role: 'SUPERADMIN' })
    };
    const dialogSpy = {
      open: jasmine.createSpy('open').and.returnValue({
        afterClosed: () => of(true),
        close: () => { },
        componentInstance: {},
        id: 'mock-dialog-1'
      }),
      _openedDialogs: [] as any[],
      openDialogs: [] as any[],
      afterOpened: new Subject(),
      afterAllClosed: of(undefined),
      getDialogById: () => null
    };
    const snackBarSpy = {
      openFromComponent: jasmine.createSpy('openFromComponent')
    };

    await TestBed.configureTestingModule({
      imports: [SecteurManagementComponent, NoopAnimationsModule],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: AuthService, useValue: authServiceSpy },
        { provide: UserService, useValue: userServiceSpy },
        { provide: CompanyService, useValue: companyServiceSpy },
        { provide: MatDialog, useValue: dialogSpy },
        { provide: MatSnackBar, useValue: snackBarSpy }
      ]
    })
      .overrideComponent(SecteurManagementComponent, {
        remove: { imports: [MatDialogModule, MatSnackBarModule] }
      })
      .compileComponents();

    fixture = TestBed.createComponent(SecteurManagementComponent);
    component = fixture.componentInstance;
    httpMock = TestBed.inject(HttpTestingController);
    fixture.detectChanges();
    flushLoadData();
    fixture.detectChanges();
  });

  afterEach(() => {
    // consume any leftover requests to not fail verify()
    httpMock.match(() => true).forEach(r => { if (!r.cancelled) r.flush([]); });
    httpMock.verify();
  });

  // ─── Basic load ──────────────────────────────────────────────
  it('should create and load sectors', () => {
    expect(component).toBeTruthy();
    expect(component.dataSource.data.length).toBe(2);
  });

  it('should derive managers from users list', () => {
    expect(component.managers.length).toBe(2);
  });

  it('should return assigned managers for sector 1', () => {
    expect(component.getAssignedManagers(1).length).toBe(1);
  });

  it('getChauffeurCount() should count chauffeurs assigned to manager of sector', () => {
    expect(component.getChauffeurCount(1)).toBe(2);
  });

  it('getUnassignedCount() should count sectors without a manager', () => {
    expect(component.getUnassignedCount()).toBe(1);
  });

  // ─── Create ──────────────────────────────────────────────────
  it('should POST to create a sector and reload', () => {
    const newSector = {
      id: 3, nom: 'Secteur Est', description: 'Desc',
      zoneGeographique: 'Est', codesPostaux: '4000',
      entrepriseId: 1, createdAt: '', managers: [] as any[], chauffeurs: [] as any[]
    };

    component.openForm();
    component.currentSecteur = { nom: 'Secteur Est', description: 'Desc', zoneGeographique: 'Est', codesPostaux: '4000' };
    component.selectedEntrepriseId = '1';
    component.selectedManagerId = 13;
    component.saveSecteur();

    // flush POST
    const postReqs = httpMock.match(req => req.method === 'POST');
    expect(postReqs.length).toBe(1);
    postReqs[0].flush(newSector);

    // flush reload GET
    flushLoadData([...initialSectors, newSector]);
    fixture.detectChanges();

    expect(component.dataSource.data.some(s => s.nom === 'Secteur Est')).toBeTrue();
  });

  // ─── Update ──────────────────────────────────────────────────
  it('should PUT to update a sector and reload', () => {
    component.openForm(component.dataSource.data[0]);
    component.selectedEntrepriseId = '1';
    component.selectedManagerId = 10;
    component.saveSecteur();

    const putReqs = httpMock.match(req => req.method === 'PUT');
    expect(putReqs.length).toBe(1);
    putReqs[0].flush(initialSectors[0]);

    flushLoadData();
    fixture.detectChanges();

    expect(component.dataSource.data.length).toBe(2);
  });

  // ─── Assign manager ──────────────────────────────────────────
  it('should PUT to assign a manager to a sector', () => {
    component.selectSecteur(component.dataSource.data[0]);
    component.selectedManagerId = 13;
    component.availableManagers = [
      { id: 13, fullName: 'Nour Haddad', email: 'nour.haddad@logiway.tn', entrepriseId: 1, secteurId: null }
    ];
    component.assignSelectedManager();

    const putReqs = httpMock.match(req => req.method === 'PUT');
    expect(putReqs.length).toBe(1);
    putReqs[0].flush({ message: 'ok' });

    flushLoadData();
    fixture.detectChanges();
  });

  // ─── Delete ──────────────────────────────────────────────────
  it('should DELETE a sector and reload', () => {
    const sectorToDelete = component.dataSource.data[1];
    component.deleteSecteur(sectorToDelete);

    const deleteReqs = httpMock.match(req => req.method === 'DELETE');
    expect(deleteReqs.length).toBe(1);
    deleteReqs[0].flush({ message: 'deleted' });

    flushLoadData([initialSectors[0]]);
    fixture.detectChanges();

    expect(component.dataSource.data.length).toBe(1);
  });

  // ─── Bloc couverture étendue ─────────────────────────────────
  function lastNotify(): { title: string; message: string } {
    const sb: any = TestBed.inject(MatSnackBar);
    const cfg = sb.openFromComponent.calls.mostRecent().args[1];
    return cfg.data;
  }

  it('refreshTable conserve la sélection existante', () => {
    component.selectSecteur(component.dataSource.data[0]);
    component.refreshTable();
    expect((component.selectedSecteur as any)?.id).toBe(1);

    component.clearSelection();
    component.refreshTable();
    expect(component.selectedSecteur).toBeNull();
    expect(component.getTotalManagers()).toBe(2);
    expect(component.getTotalChauffeurs()).toBe(2);
  });

  it('applyFilter met à jour le filtre et retourne à la première page', () => {
    const input = document.createElement('input');
    input.value = '  NORD  ';
    component.applyFilter({ target: input } as unknown as Event);
    expect(component.dataSource.filter).toBe('nord');
  });

  it('filterPredicate cherche dans nom, zone et managers', () => {
    const predicate = component.dataSource.filterPredicate!;
    expect(predicate(component.dataSource.data[0], '')).toBe(true);
    expect(predicate(component.dataSource.data[0], 'bizerte')).toBe(true);
    expect(predicate(component.dataSource.data[0], 'ali.ben')).toBe(true);
    expect(predicate(component.dataSource.data[1], 'ali.ben')).toBe(false);
    expect(predicate(component.dataSource.data[1], 'sfax')).toBe(true);
    expect(predicate(component.dataSource.data[1], 'inexistant')).toBe(false);
  });

  it('openForm refuse sans droits SUPERADMIN', () => {
    component.canManageSectors = false;
    component.openForm(component.dataSource.data[0]);
    expect(component.showForm).toBe(false);

    component.openForm();
    expect(component.showForm).toBe(false);
  });

  it('saveSecteur applique toutes les validations', () => {
    // nom trop court
    component.openForm();
    component.currentSecteur = { nom: 'ab', zoneGeographique: 'Zone' };
    component.saveSecteur();
    expect(lastNotify().title).toBe('Validation');

    // zone manquante
    component.currentSecteur = { nom: 'Nouveau Secteur', zoneGeographique: '' };
    component.saveSecteur();
    expect(lastNotify().message).toContain('zone géographique');

    // doublon
    component.currentSecteur = { nom: 'secteur nord', zoneGeographique: 'Zone' };
    component.selectedEntrepriseId = '1';
    component.saveSecteur();
    expect(lastNotify().title).toBe('Validation');
    expect(lastNotify().message).toContain('existe déjà');

    // entreprise manquante
    component.currentSecteur = { nom: 'Secteur Ouest', zoneGeographique: 'Ouest' };
    component.selectedEntrepriseId = null;
    component.saveSecteur();
    expect(lastNotify().message).toContain('entreprise');

    // manager manquant
    component.selectedEntrepriseId = '1';
    component.selectedManagerId = null;
    component.saveSecteur();
    expect(lastNotify().message).toContain('manager');

    // édition sans identifiant
    component.isEditMode = true;
    component.currentSecteur = { nom: 'Secteur Sans Id', zoneGeographique: 'Z' };
    component.selectedEntrepriseId = '1';
    component.selectedManagerId = 13;
    component.saveSecteur();
    expect(lastNotify().title).toBe('Validation');

    // accès refusé
    component.canManageSectors = false;
    component.saveSecteur();
    expect(lastNotify().title).toBe('Accès refusé');
  });

  it('saveSecteur gère les erreurs POST et PUT', () => {
    component.openForm();
    component.currentSecteur = { nom: 'Secteur Err', zoneGeographique: 'Z' };
    component.selectedEntrepriseId = '1';
    component.selectedManagerId = 13;
    component.saveSecteur();
    httpMock.match(r => r.method === 'POST')[0]
      .flush({ message: 'Doublon backend' }, { status: 409, statusText: 'Conflict' });
    expect(lastNotify().title).toBe('Erreur');

    component.canManageSectors = true;
    component.openForm(component.dataSource.data[0]);
    component.selectedEntrepriseId = '1';
    component.selectedManagerId = 10;
    component.saveSecteur();
    httpMock.match(r => r.method === 'PUT').forEach(r =>
      r.flush('boom', { status: 500, statusText: 'Server Error' }));
    expect(lastNotify().title).toBe('Erreur');
  });

  it('deleteSecteur bloque selon droits, affectations ou identifiant', () => {
    const sb: any = TestBed.inject(MatSnackBar);

    // sans droits
    component.canManageSectors = false;
    component.deleteSecteur(component.dataSource.data[0]);
    expect(sb.openFromComponent.calls.mostRecent().args[1].data.title).toBe('Accès refusé');

    // secteur occupé
    component.canManageSectors = true;
    component.deleteSecteur(component.dataSource.data[0]);
    expect(sb.openFromComponent.calls.mostRecent().args[1].data.title).toBe('Suppression impossible');

    // identifiant absent
    component.deleteSecteur({ nom: 'Fantome' });
    expect(sb.openFromComponent.calls.mostRecent().args[1].data.message).toContain('introuvable');
  });

  it('deleteSecteur ne supprime pas si le dialogue est annulé', () => {
    const dialog: any = TestBed.inject(MatDialog);
    dialog.open.and.returnValue({ afterClosed: () => of(false), close: () => { } });

    component.deleteSecteur(component.dataSource.data[1]);
    expect(httpMock.match(r => r.method === 'DELETE').length).toBe(0);
  });

  it('deleteSecteur notifie en cas d\u2019échec HTTP', () => {
    component.deleteSecteur(component.dataSource.data[1]);
    httpMock.match(r => r.method === 'DELETE').forEach(r =>
      r.flush({ message: 'Contrainte SQL' }, { status: 409, statusText: 'Conflict' }));
    expect(lastNotify().title).toBe('Erreur');
  });

  it('helpers de recherche manager par identifiant', () => {
    expect(component.getManagerName(10)).toBe('Ali Ben');
    expect(component.getManagerName(999)).toBe('Inconnu');
    expect(component.getManagerEmail(10)).toContain('@logiway.tn');
    expect(component.getManagerEmail(undefined)).toBe('—');
    expect(component.getAssignedManagers(undefined)).toEqual([]);
    expect(component.getAssignedDrivers(undefined)).toEqual([]);
    expect(component.getSelectedManager()?.id).toBeUndefined();

    component.selectSecteur(component.dataSource.data[0]);
    expect(component.selectedManagerId).toBe(10);
    expect(component.getSelectedManager()?.fullName).toBe('Ali Ben');
    expect(component.getManagerTooltip(1)).toContain('Ali Ben - ali.ben@logiway.tn');
    expect(component.getManagerTooltip(2)).toBe('Aucun manager affecté');
    expect(component.getManagerTooltip(undefined)).toBe('Aucun manager affecté');

    component.clearSelection();
    expect(component.selectedSecteur).toBeNull();
    expect(component.selectedManagerId).toBeNull();
  });

  it('assignSelectedManager applique ses gardes puis réussit', () => {
    const sb: any = TestBed.inject(MatSnackBar);

    // accès refusé
    component.canManageSectors = false;
    component.assignSelectedManager();
    expect(sb.openFromComponent.calls.mostRecent().args[1].data.title).toBe('Accès refusé');
    component.canManageSectors = true;

    // pas de sélection
    component.clearSelection();
    component.assignSelectedManager();
    expect(sb.openFromComponent.calls.mostRecent().args[1].data.type).toBe('warning');

    // manager introuvable
    component.selectSecteur(component.dataSource.data[1]);
    component.availableManagers = [];
    component.selectedManagerId = 999;
    component.assignSelectedManager();
    expect(sb.openFromComponent.calls.mostRecent().args[1].data.message).toContain('introuvable');

    // identifiant du secteur absent
    component.selectSecteur(component.dataSource.data[0]);
    (component as any).selectedSecteur = { nom: 'Sans Id' };
    component.availableManagers = [{ id: 13, fullName: 'Nour Haddad', email: 'n@x.tn', entrepriseId: 1, secteurId: null }];
    component.selectedManagerId = 13;
    component.assignSelectedManager();
    expect(sb.openFromComponent.calls.mostRecent().args[1].data.message).toContain('introuvable');

    // déjà affecté
    component.selectSecteur(component.dataSource.data[0]);
    component.availableManagers = [{ id: 10, fullName: 'Ali Ben', email: 'a@x.tn', entrepriseId: 1, secteurId: 1 }];
    component.selectedManagerId = 10;
    component.assignSelectedManager();
    expect(sb.openFromComponent.calls.mostRecent().args[1].data.type).toBe('info');

    // succès
    component.availableManagers = [{ id: 13, fullName: 'Nour Haddad', email: 'n@x.tn', entrepriseId: 1, secteurId: null }];
    component.selectedManagerId = 13;
    component.assignSelectedManager();
    const puts = httpMock.match(r => r.url.includes('/manager/13'));
    expect(puts.length).toBe(1);
    puts.forEach(r => r.flush({ ok: true }));
    flushLoadData();

    // échec HTTP
    component.availableManagers = [{ id: 13, fullName: 'Nour Haddad', email: 'n@x.tn', entrepriseId: 1, secteurId: null }];
    component.selectedManagerId = 13;
    component.assignSelectedManager();
    httpMock.match(r => r.url.includes('/manager/13')).forEach(r =>
      r.flush('down', { status: 500, statusText: 'Server Error' }));
    expect(lastNotify().title).toBe('Erreur');
  });

  it('removeSelectedManager couvre gardes, succès et échec', () => {
    const sb: any = TestBed.inject(MatSnackBar);

    // accès refusé
    component.canManageSectors = false;
    component.removeSelectedManager(10);
    expect(sb.openFromComponent.calls.mostRecent().args[1].data.title).toBe('Accès refusé');
    component.canManageSectors = true;

    // aucune sélection → sortie silencieuse
    component.clearSelection();
    component.removeSelectedManager(10);
    expect(sb.openFromComponent.calls.count()).toBe(1);

    // manager non affecté au secteur
    component.selectSecteur(component.dataSource.data[1]);
    component.removeSelectedManager(10);
    expect(sb.openFromComponent.calls.mostRecent().args[1].data.message).toContain("n'est pas affect\u00e9");

    // identifiant du secteur absent
    (component as any).selectedSecteur = { nom: 'Sans Id' };
    component.removeSelectedManager(10);
    expect(sb.openFromComponent.calls.mostRecent().args[1].data.message).toContain('introuvable');

    // succès
    component.selectSecteur(component.dataSource.data[0]);
    component.removeSelectedManager(10);
    const dels = httpMock.match(r => r.url.includes('/manager/10'));
    expect(dels.length).toBe(1);
    dels.forEach(r => r.flush({ ok: true }));
    flushLoadData();

    // échec HTTP
    component.removeSelectedManager(10);
    httpMock.match(r => r.url.includes('/manager/10')).forEach(r =>
      r.flush('down', { status: 503, statusText: 'Unavailable' }));
    expect(lastNotify().title).toBe('Erreur');
  });

  it('formatDate et fonctions trackBy', () => {
    expect(component.formatDate(undefined)).toBe('—');
    expect(component.formatDate('2026-05-01T12:00:00.000Z')).toContain('2026');
    expect(component.trackBySectorId(0, { id: 7, nom: 'x' })).toBe(7);
    expect(component.trackByManagerId(0, { id: 3, fullName: '', email: '' })).toBe(3);
  });

  it('onEntrepriseSelectionChange recalcule les managers disponibles', () => {
    component.openForm();
    component.selectedEntrepriseId = '1';
    component.onEntrepriseSelectionChange();
    // tous les managers sont déjà affectés au secteur 1 → aucun disponible pour un nouveau secteur
    expect(component.availableManagers.length).toBe(0);
    expect(component.selectedManagerId).toBeNull();
  });

  it('les sources d\u2019erreur de loadData retombent sur des listes vides', () => {
    const userService: any = TestBed.inject(UserService);
    const companyService: any = TestBed.inject(CompanyService);

    (component as any).loadData();
    httpMock.match(sectorsUrl).forEach(r => r.flush('down', { status: 500, statusText: 'Server Error' }));
    expect(component.dataSource.data.length).toBe(0);
    expect(component.isLoading).toBe(false);

    // chemin normal avec listes vides côté services
    userService.list.and.returnValue(of([]));
    companyService.getCompanies.and.returnValue(of([]));
    component.managers = [];
    component.chauffeurs = [];
    (component as any).loadData();
    httpMock.match(sectorsUrl).forEach(r => r.flush([]));
    expect(component.managers.length).toBe(0);

    // users en erreur → managers vides
    userService.list.and.returnValue(throwError(() => new Error('users down')));
    companyService.getCompanies.and.returnValue(of(companies));
    (component as any).loadData();
    httpMock.match(sectorsUrl).forEach(r => r.flush(initialSectors));
    expect(component.managers.length).toBe(0);

    // entreprises en erreur → liste vide
    userService.list.and.returnValue(of(users));
    companyService.getCompanies.and.returnValue(throwError(() => new Error('companies down')));
    (component as any).loadData();
    httpMock.match(sectorsUrl).forEach(r => r.flush(initialSectors));
    expect(component.enterprises.length).toBe(0);
  });

  it('deleteSecteur réinitialise la sélection du secteur supprimé', () => {
    component.selectSecteur(component.dataSource.data[1]);
    component.deleteSecteur(component.dataSource.data[1]);

    httpMock.match(r => r.method === 'DELETE').forEach(r => r.flush({ message: 'ok' }));
    flushLoadData([initialSectors[0]]);

    expect(component.selectedSecteur).toBeNull();
    expect(component.selectedManagerId).toBeNull();
  });

  it('normalise les enregistrements partiels du backend', () => {
    (component as any).loadData();
    httpMock.match(sectorsUrl).forEach(r => r.flush([
      {
        id: 5,
        nom: '  Secteur Partiel  ',
        description: '   ',
        managerId: 10,
        managers: [],
        chauffeurs: [
          { id: 11, prenom: 'Sara', nom: 'Nabi', managerId: 10 },
          { prenom: 'Sans', nom: 'Id', managerId: 10 },
          { id: 0, managerId: 0 }
        ]
      },
      {
        nom: 'Sans Managers',
        managers: [
          { id: 0 },
          { id: 14, prenom: 'Nour', nom: 'Haddad', email: 'nour.haddad@logiway.tn' }
        ]
      }
    ]));

    const partial = component.dataSource.data.find(s => s.id === 5)!;
    expect(partial.nom).toBe('Secteur Partiel');
    expect(partial.description).toBe('');
    expect(partial.managerId).toBe(10);
    expect((partial.chauffeurs ?? []).map(c => c.id)).toEqual([11]);

    const orphan = component.dataSource.data.find(s => s.id === undefined)!;
    expect((orphan.managers ?? []).length).toBe(1);
    expect(orphan.managers![0].id).toBe(14);
  });

  it('retombe sur le manager global quand le secteur n\u2019embarque personne', () => {
    (component as any).loadData();
    httpMock.match(sectorsUrl).forEach(r => r.flush([
      { id: 8, nom: 'Orphelin', managerId: 13, managers: [], chauffeurs: [] }
    ]));
    const orphan = component.dataSource.data[0];
    expect((orphan.managers ?? []).length).toBe(1);
    expect(orphan.managers![0].id).toBe(13);
  });

  it('updateAvailableEnterprises réintègre l\u2019entreprise du secteur en cours d\u2019édition', () => {
    component.isEditMode = true;
    (component as any).currentSecteur = { entrepriseId: 1 };
    (component as any).updateAvailableEnterprises();
    expect(component.availableEnterprises.some(c => c.id === '1')).toBe(true);

    component.isEditMode = false;
    (component as any).updateAvailableEnterprises();
    expect(component.availableEnterprises.length).toBe(0);
  });

  it('visibility des colonnes pour un rôle non SUPERADMIN', () => {
    (component as any).currentUserRole = 'MANAGER';
    (component as any).applyRoleVisibility();
    expect(component.displayedColumns).toContain('actions');
  });

  it('syncTheme reflète l\u2019attribut data-theme', () => {
    document.body.removeAttribute('data-theme');
    (component as any).syncTheme();
    expect(component.isLightMode).toBe(false);

    document.body.setAttribute('data-theme', 'light');
    (component as any).syncTheme();
    expect(component.isLightMode).toBe(true);
    document.body.removeAttribute('data-theme');
  });
});
