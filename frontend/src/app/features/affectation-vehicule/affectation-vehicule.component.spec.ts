import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AffectationVehiculeComponent } from './affectation-vehicule.component';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { provideRouter } from '@angular/router';
import { Observable, of, throwError } from 'rxjs';
import { AffectationService } from '../../core/services/affectation.service';
import { AuthService } from '../../core/auth.service';
import { CompanyService } from '../../core/services/company.service';
import { FleetService } from '../../core/services/fleet.service';
import { UserService } from '../../core/services/user.service';
import { MatSnackBar } from '@angular/material/snack-bar';
import { PremiumSnackbarComponent } from '../../shared/components/premium-snackbar/premium-snackbar.component';

describe('AffectationVehiculeComponent', () => {
  let component: AffectationVehiculeComponent;
  let fixture: ComponentFixture<AffectationVehiculeComponent>;

  // Comportements mutables pilotés par les tests (fonctions usine -> permet throwError)
  let currentUserRole: string;
  let companiesImpl: () => Observable<any>;
  let myCompanyImpl: () => Observable<any>;
  let usersImpl: () => Observable<any>;
  let vehiclesImpl: () => Observable<any>;

  const err$ = <T>(e: unknown) => throwError(() => e);

  let affectationServiceMock: { assignerChauffeurVehicule: any };
  let snackBarMock: { openFromComponent: any };

  const companyFixture = {
    id: '7',
    name: 'LogiWay Tunisie',
    address: 'Rue 1',
    sector: 'Transport',
    fleetSize: 10,
    activeMissions: 2,
    status: 'Actif' as const,
    joinDate: '2025-01-01'
  };

  const usersFixture = [
    { id: 1, prenom: 'Ali', nom: 'Ben Salah', email: 'ali@x.tn', role: 'CHAUFFEUR', statutConducteur: 'LIBRE', managerId: 5 },
    { id: 2, prenom: 'Karim', nom: 'Trabelsi', email: 'karim@x.tn', role: 'CHAUFFEUR', statutConducteur: 'EN_SERVICE' },
    { id: 3, prenom: 'Sami', nom: 'Manager', email: 'sami@x.tn', role: 'MANAGER', statutConducteur: 'LIBRE' },
    { id: 4, prenom: '', nom: '', email: 'noname@x.tn', role: 'CHAUFFEUR', statutConducteur: 'LIBRE', managerId: null }
  ];

  const vehiclesFixture = [
    { id: '12', plate: '123-TN-001', model: 'Kangoo', status: 'HORS_SERVICE', nextCheck: '', companyId: '7' },
    { id: '13', plate: '124-TN-002', model: 'Master', status: 'hors service', nextCheck: '', companyId: '7' },
    { id: '14', plate: '125-TN-003', model: 'Boxer', status: 'EN_SERVICE', nextCheck: '', companyId: '7' },
    { id: '15', plate: '126-TN-004', model: 'Jumper', status: 'EN_MAINTENANCE', nextCheck: '', companyId: '7' },
    { id: '16', plate: '127-TN-005', model: 'Daily', status: 'statut inconnu', nextCheck: '', companyId: '7' },
    { id: '17', plate: '128-TN-006', model: 'Ducato', status: 'HORS_SERVICE', nextCheck: '', companyId: '99' },
    { id: '18', plate: '129-TN-007', model: 'Transit', status: 'HORS_SERVICE', nextCheck: '', companyId: '7', driverId: '3' }
  ];

  beforeEach(async () => {
    currentUserRole = 'SUPERADMIN';
    companiesImpl = () => of([companyFixture]);
    myCompanyImpl = () => of(companyFixture);
    usersImpl = () => of(usersFixture);
    vehiclesImpl = () => of(vehiclesFixture);

    // NB : MatSnackBar est fourni par MatSnackBarModule importé dans le composant
    // standalone -> l'override doit passer par TestBed.overrideProvider
    snackBarMock = { openFromComponent: jasmine.createSpy('openFromComponent') };

    const affectationServiceInstance = {
      assignerChauffeurVehicule: jasmine.createSpy('assignerChauffeurVehicule').and.returnValue(of({}))
    };

    await TestBed.configureTestingModule({
      imports: [AffectationVehiculeComponent],
      providers: [
        provideRouter([]),
        provideAnimationsAsync(),
        { provide: AffectationService, useValue: affectationServiceInstance },
        { provide: AuthService, useValue: { getUser: () => ({ id: 9, role: currentUserRole }) } },
        { provide: CompanyService, useValue: { getCompanies: () => companiesImpl(), getMyCompany: () => myCompanyImpl() } },
        { provide: FleetService, useValue: { getVehicles: () => vehiclesImpl() } },
        { provide: UserService, useValue: { list: () => usersImpl() } }
      ]
    }).compileComponents();

    TestBed.overrideProvider(MatSnackBar, { useValue: snackBarMock });
    affectationServiceMock = affectationServiceInstance;

    fixture = TestBed.createComponent(AffectationVehiculeComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create and load companies for SUPERADMIN via ngOnInit', () => {
    expect(component).toBeTruthy();
    expect(component.isManagerView).toBeFalse();
    expect(component.entreprises).toEqual([companyFixture]);
    expect(component.selectedEntrepriseId).toBeNull();
  });

  // ─── ngOnInit / chargerEntreprises() ──────────────────────────
  it('chargerEntreprises() as MANAGER should preload own company and trigger filtering', () => {
    currentUserRole = 'MANAGER';
    component.ngOnInit();

    expect(component.isManagerView).toBeTrue();
    expect(component.entreprises).toEqual([companyFixture]);
    expect(component.selectedEntrepriseId).toBe('7');
    // onEntrepriseChange a été déclenché : forkJoin users + véhicules
    expect(component.chauffeursLibres.length).toBe(2);
    expect(component.vehiculesHorsService.length).toBe(3);
    expect(component.isLoading).toBeFalse();
  });

  it('chargerEntreprises() as MANAGER with null company should keep empty state', () => {
    currentUserRole = 'MANAGER';
    myCompanyImpl = () => of(null);
    component.entreprises = [];
    component.ngOnInit();

    // company null -> aucun remplissage ni présélection
    expect(component.entreprises).toEqual([]);
    expect(component.selectedEntrepriseId).toBeNull();
    expect(component.chauffeursLibres).toEqual([]);
  });

  it('chargerEntreprises() as MANAGER should fall back to null on service error', () => {
    currentUserRole = 'MANAGER';
    myCompanyImpl = () => err$(new Error('boom'));
    component.entreprises = [];
    component.ngOnInit();

    expect(component.entreprises).toEqual([]);
    expect(component.selectedEntrepriseId).toBeNull();
  });

  it('chargerEntreprises() as SUPERADMIN should fall back to empty array on service error', () => {
    companiesImpl = () => err$(new Error('boom'));
    component.chargerEntreprises();

    expect(component.entreprises).toEqual([]);
  });

  // ─── onEntrepriseChange() ─────────────────────────────────────
  it('onEntrepriseChange() without selected company should reset lists and selections', () => {
    component.chauffeursLibres = [{ id: 1, username: 'x', email: 'x@x.tn', role: 'CHAUFFEUR' }];
    component.vehiculesHorsService = [{ id: '12', plate: 'p', model: 'm', status: 'HORS_SERVICE', nextCheck: '' }];
    component.selectedChauffeurId = 1;
    component.selectedVehiculeId = '12';
    component.selectedEntrepriseId = null;

    component.onEntrepriseChange();

    expect(component.chauffeursLibres).toEqual([]);
    expect(component.vehiculesHorsService).toEqual([]);
    expect(component.selectedChauffeurId).toBeNull();
    expect(component.selectedVehiculeId).toBeNull();
  });

  it('onEntrepriseChange() should filter free CHAUFFEURS and available HORS_SERVICE vehicles', () => {
    component.selectedEntrepriseId = '7';

    component.onEntrepriseChange();

    // Chauffeurs LIBRE uniquement (ids 1 et 4), username fallback sur email
    expect(component.chauffeursLibres.length).toBe(2);
    expect(component.chauffeursLibres[0]).toEqual({
      id: 1,
      username: 'Ali Ben Salah',
      email: 'ali@x.tn',
      role: 'CHAUFFEUR',
      managerId: 5
    });
    expect(component.chauffeursLibres[1].username).toBe('noname@x.tn');
    expect(component.chauffeursLibres[1].managerId).toBeNull();

    // Véhicules HORS_SERVICE de l'entreprise 7 non affectés (12, 13 normalisé, 16 statut inconnu)
    const ids = component.vehiculesHorsService.map(v => v.id);
    expect(ids).toEqual(['12', '13', '16']);

    expect(component.isLoading).toBeFalse();
    expect(component.selectedChauffeurId).toBeNull();
    expect(component.selectedVehiculeId).toBeNull();
  });

  it('onEntrepriseChange() should tolerate service errors by falling back to empty lists', () => {
    usersImpl = () => err$(new Error('users ko'));
    vehiclesImpl = () => err$(new Error('fleet ko'));
    component.selectedEntrepriseId = '7';

    component.onEntrepriseChange();

    expect(component.chauffeursLibres).toEqual([]);
    expect(component.vehiculesHorsService).toEqual([]);
    expect(component.isLoading).toBeFalse();
  });

  // ─── validerAffectation() ─────────────────────────────────────
  it('validerAffectation() should do nothing when selections are incomplete', () => {
    component.selectedChauffeurId = 1;
    component.selectedVehiculeId = null;

    component.validerAffectation();

    expect(affectationServiceMock.assignerChauffeurVehicule).not.toHaveBeenCalled();
    expect(snackBarMock.openFromComponent).not.toHaveBeenCalled();
  });

  it('validerAffectation() should assign, notify success, reset selections and refresh lists', () => {
    component.selectedEntrepriseId = '7';
    component.onEntrepriseChange();

    component.selectedChauffeurId = 1;
    component.selectedVehiculeId = '12';

    component.validerAffectation();

    expect(affectationServiceMock.assignerChauffeurVehicule).toHaveBeenCalledWith(0, 1, 12);
    expect(snackBarMock.openFromComponent).toHaveBeenCalled();
    const args = snackBarMock.openFromComponent.calls.mostRecent().args;
    expect(args[0]).toBe(PremiumSnackbarComponent);
    expect(args[1].data.type).toBe('success');
    expect(args[1].data.title).toBe('Affectation Réussie');
    // annuler() + onEntrepriseChange() ont réinitialisé la sélection
    expect(component.selectedChauffeurId).toBeNull();
    expect(component.selectedVehiculeId).toBeNull();
  });

  it('validerAffectation() should show backend message on error', () => {
    affectationServiceMock.assignerChauffeurVehicule =
      affectationServiceMock.assignerChauffeurVehicule.and.returnValue(err$({ error: { message: 'Chauffeur déjà affecté' } }));
    component.selectedChauffeurId = 1;
    component.selectedVehiculeId = '12';

    component.validerAffectation();

    const config = snackBarMock.openFromComponent.calls.mostRecent().args[1];
    expect(config.data.type).toBe('warning');
    expect(config.data.title).toBe('Affectation Impossible');
    expect(config.data.message).toBe('Chauffeur déjà affecté');
    // la sélection est conservée en cas d'échec
    expect(component.selectedChauffeurId).toBe(1);
  });

  it('validerAffectation() should use error.message then default fallback when absent', () => {
    affectationServiceMock.assignerChauffeurVehicule =
      affectationServiceMock.assignerChauffeurVehicule.and.returnValue(err$({ message: 'Network error' }));
    component.selectedChauffeurId = 1;
    component.selectedVehiculeId = '12';
    component.validerAffectation();
    expect(snackBarMock.openFromComponent.calls.mostRecent().args[1].data.message).toBe('Network error');

    affectationServiceMock.assignerChauffeurVehicule =
      affectationServiceMock.assignerChauffeurVehicule.and.returnValue(err$({}));
    component.validerAffectation();
    expect(snackBarMock.openFromComponent.calls.mostRecent().args[1].data.message).toBe('La requête a échoué.');
  });

  // ─── annuler() ────────────────────────────────────────────────
  it('annuler() should reset both selections', () => {
    component.selectedChauffeurId = 3;
    component.selectedVehiculeId = '16';

    component.annuler();

    expect(component.selectedChauffeurId).toBeNull();
    expect(component.selectedVehiculeId).toBeNull();
  });

  // ─── rendu du template ────────────────────────────────────────
  it('should render the form with entreprise options after loading', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.textContent).toContain('Nouvelle Affectation');
    expect(compiled.querySelectorAll('mat-select').length).toBeGreaterThan(0);
  });
});
