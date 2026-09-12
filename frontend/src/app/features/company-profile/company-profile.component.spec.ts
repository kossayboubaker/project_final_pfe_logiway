import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { provideRouter, Router } from '@angular/router';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { of, throwError } from 'rxjs';
import { CompanyProfileComponent } from './company-profile.component';
import { AuthService } from '../../core/auth.service';
import { CompanyService } from '../../core/services/company';

describe('CompanyProfileComponent', () => {
  let component: CompanyProfileComponent;
  let fixture: ComponentFixture<CompanyProfileComponent>;
  let authServiceMock: jasmine.SpyObj<AuthService>;
  let companyServiceMock: jasmine.SpyObj<CompanyService>;
  let snackBarSpy: jasmine.SpyObj<MatSnackBar>;
  let routerSpy: jasmine.SpyObj<Router>;

  const lastSnack = (): any =>
    (snackBarSpy.openFromComponent.calls.mostRecent().args[1] as any).data;

  const fullCompany = {
    id: 'c1', name: 'LogiWay', email: 'contact@logiway.tn', fleetSize: 12,
    sector: 'transport', address: 'Tunis', number: '+216...', codeTVA: '123',
    representantLegal: 'data:application/pdf;base64,x', image: 'data:image/png;base64,y',
    managerOwnerId: 9, status: 'Actif'
  };

  const setup = async (getMyCompanyValue?: any) => {
    await TestBed.resetTestingModule()
      .configureTestingModule({
        imports: [CompanyProfileComponent],
        providers: [
          provideRouter([]),
          { provide: Router, useValue: routerSpy },
          provideAnimationsAsync(),
          { provide: AuthService, useValue: authServiceMock },
          { provide: CompanyService, useValue: companyServiceMock },
          { provide: MatSnackBar, useValue: snackBarSpy }
        ]
      })
      .overrideComponent(CompanyProfileComponent, { remove: { imports: [MatSnackBarModule] } })
      .compileComponents();

    fixture = TestBed.createComponent(CompanyProfileComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  };

  beforeEach(async () => {
    authServiceMock = jasmine.createSpyObj('AuthService', [
      'getUser', 'hasCompany', 'setHasCompany', 'isCompanyActive', 'getCompanyStatus', 'setCompanyStatus'
    ]);
    authServiceMock.getUser.and.returnValue({ id: '3', role: 'MANAGER' });
    authServiceMock.hasCompany.and.returnValue(false);

    companyServiceMock = jasmine.createSpyObj('CompanyService', ['getMyCompany', 'saveMyCompany']);
    companyServiceMock.getMyCompany.and.returnValue(of(null));
    snackBarSpy = jasmine.createSpyObj('MatSnackBar', ['openFromComponent']);
    routerSpy = jasmine.createSpyObj('Router', ['navigate']);

    await setup();
  });

  it('should create sans entreprise', () => {
    expect(component).toBeTruthy();
    expect(component.hasCompany).toBeFalse();
    expect(component.editingCompany).toBeTrue();
    expect(component.canEditCompany).toBeTrue();
    expect(component.company.status).toBe('En Attente');
  });

  it('SUPERADMIN redirigé vers companies', async () => {
    authServiceMock.getUser.and.returnValue({ id: '1', role: 'SUPERADMIN' });
    await setup();

    expect(routerSpy.navigate).toHaveBeenCalledWith(['/dashboard/companies']);
  });

  it('entreprise existante : mapping complet et édition fermée', async () => {
    companyServiceMock.getMyCompany.and.returnValue(of(fullCompany as any));
    await setup();

    expect(component.company.name).toBe('LogiWay');
    expect(component.company.managerOwnerId).toBe(9);
    expect(component.hasCompany).toBeTrue();
    expect(authServiceMock.setHasCompany).toHaveBeenCalledWith(true);
    expect(component.canEditCompany).toBeTrue();
    expect(component.editingCompany).toBeFalse();
    expect(component.imageFileName).toBe('Fichier déjà chargé');
    expect(component.legalDocFileName).toBe('Fichier déjà chargé');
  });

  it('mapping fallbacks managerId/managerName et statut non actif', async () => {
    companyServiceMock.getMyCompany.and.returnValue(of({
      ...fullCompany,
      email: null, number: null, codeTVA: null, representantLegal: '', image: '',
      managerOwnerId: undefined, managerId: 5, managerOwnerName: undefined, managerName: 'Sara',
      status: 'En Attente'
    } as any));
    await setup();

    expect(component.company.email).toBe('');
    expect(component.company.number).toBe('');
    expect(component.company.codeTVA).toBe('');
    expect(component.company.managerOwnerId).toBe(5);
    expect(component.company.managerOwnerName).toBe('Sara');
    expect(component.canEditCompany).toBeFalse();
    expect(component.imageFileName).toBe('');
  });

  // ─── saveCompanyProfile ───────────────────────────────────────
  it('création : statut forcé En Attente + snack succès', () => {
    component.company.name = 'Nouvelle';
    companyServiceMock.saveMyCompany.and.returnValue(of({ ...fullCompany, status: 'En Attente' } as any));

    component.saveCompanyProfile();

    const payload = companyServiceMock.saveMyCompany.calls.mostRecent().args[0] as any;
    expect(payload.status).toBe('En Attente');
    expect(component.hasCompany).toBeTrue();
    expect(component.editingCompany).toBeFalse();
    expect(lastSnack().title).toBe('Succès');
  });

  it('mise à jour conserve le statut existant', () => {
    component.hasCompany = true;
    component.company.status = 'Actif';
    companyServiceMock.saveMyCompany.and.returnValue(of(fullCompany as any));

    component.saveCompanyProfile();

    const payload = companyServiceMock.saveMyCompany.calls.mostRecent().args[0] as any;
    expect(payload.status).toBe('Actif');
  });

  it('échec de sauvegarde → snack erreur', () => {
    component.editingCompany = true;
    companyServiceMock.saveMyCompany.and.returnValue(throwError(() => new Error('ko')));

    component.saveCompanyProfile();

    expect(lastSnack().title).toBe('Erreur');
    expect(authServiceMock.setHasCompany).not.toHaveBeenCalled();
  });

  it('extractFileName conserve un nom de fichier brut', async () => {
    companyServiceMock.getMyCompany.and.returnValue(of({
      ...fullCompany, image: 'logo-fournisseur.png'
    } as any));
    await setup();

    expect(component.imageFileName).toBe('logo-fournisseur.png');
  });

  it('entreprise sans aucun champ manager → ids nuls', async () => {
    const { managerOwnerId, managerId, managerOwnerName, managerName, ...sans } = fullCompany as any;
    companyServiceMock.getMyCompany.and.returnValue(of(sans));
    await setup();

    expect(component.company.managerOwnerId).toBeNull();
    expect(component.company.managerOwnerName).toBe('');
  });

  it('réponse de sauvegarde sans champs manager → fallbacks', () => {
    component.hasCompany = true;
    component.company.status = 'Actif';
    const { managerOwnerId, ...minimal } = fullCompany as any;
    companyServiceMock.saveMyCompany.and.returnValue(of(minimal));

    component.saveCompanyProfile();

    expect(component.company.managerOwnerId).toBeNull();
    expect(component.company.managerOwnerName).toBe('');
  });

  // ─── toggleEditCompany ────────────────────────────────────────
  it('sans entreprise le mode édition reste ouvert', () => {
    component.hasCompany = false;
    component.editingCompany = false;

    component.toggleEditCompany();

    expect(component.editingCompany).toBeTrue();
  });

  it('entreprise non active : modification bloquée', () => {
    component.hasCompany = true;
    component.canEditCompany = false;
    component.editingCompany = false;

    component.toggleEditCompany();

    expect(lastSnack().title).toBe('Modification bloquée');
    expect(component.editingCompany).toBeFalse();
  });

  it('entreprise active : bascule du mode édition', () => {
    component.hasCompany = true;
    component.canEditCompany = true;
    component.editingCompany = false;

    component.toggleEditCompany();
    expect(component.editingCompany).toBeTrue();

    component.toggleEditCompany();
    expect(component.editingCompany).toBeFalse();
  });

  // ─── fichiers ─────────────────────────────────────────────────
  const installFakeReader = (result: string | Error) => {
    class FakeReader {
      result = result instanceof Error ? '' : result;
      onload: (() => void) | null = null;
      onerror: (() => void) | null = null;
      readAsDataURL(_f: File): void {
        setTimeout(() => (result instanceof Error ? this.onerror?.() : this.onload?.()), 0);
      }
    }
    spyOn(window, 'FileReader').and.returnValue(new FakeReader() as any);
  };

  it('onImageSelected lit une image', async () => {
    installFakeReader('data:image/jpeg;base64,IMG');

    component.onImageSelected({ target: { files: [new File(['i'], 'photo.jpg', { type: 'image/jpeg' })] } } as any);
    await new Promise<void>(res => setTimeout(res, 0));

    expect(component.imageFileName).toBe('photo.jpg');
    expect(component.company.image).toBe('data:image/jpeg;base64,IMG');
  });

  it('onImageSelected avec résultat vide → chaîne vide', async () => {
    installFakeReader('');

    component.onImageSelected({ target: { files: [new File(['i'], 'vide.jpg')] } } as any);
    await new Promise<void>(res => setTimeout(res, 0));

    expect(component.company.image).toBe('');
  });

  it('onLegalDocSelected lit un document', async () => {
    installFakeReader('data:application/pdf;base64,PDF');

    component.onLegalDocSelected({ target: { files: [new File(['p'], 'doc.pdf')] } } as any);
    await new Promise<void>(res => setTimeout(res, 0));

    expect(component.legalDocFileName).toBe('doc.pdf');
    expect(component.company.documentJustificatif).toBe('data:application/pdf;base64,PDF');
  });

  it('sélections sans fichier ne font rien', () => {
    component.onImageSelected({ target: { files: [] } } as any);
    component.onLegalDocSelected({ target: { files: null } } as any);

    expect(component.imageFileName).toBe('');
    expect(component.legalDocFileName).toBe('');
  });

  it('erreur de lecture rejetée silencieusement', async () => {
    installFakeReader(new Error('read failed'));

    component.onLegalDocSelected({ target: { files: [new File(['p'], 'ko.pdf')] } } as any);
    await new Promise<void>(res => setTimeout(res, 20));

    expect(component.legalDocFileName).toBe('ko.pdf');
    expect(component.company.documentJustificatif).toBe('');
  });

  // ─── helpers ──────────────────────────────────────────────────
  it('isImageDataUrl / isPdfDataUrl', () => {
    expect(component.isImageDataUrl('data:image/webp;base64,z')).toBeTrue();
    expect(component.isImageDataUrl('data:text/plain')).toBeFalse();
    expect(component.isImageDataUrl(undefined)).toBeFalse();

    expect(component.isPdfDataUrl('data:application/pdf;base64,z')).toBeTrue();
    expect(component.isPdfDataUrl('data:image/png')).toBeFalse();
    expect(component.isPdfDataUrl('')).toBeFalse();
  });
});
