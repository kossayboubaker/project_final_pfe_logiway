import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CreateCompanyComponent } from './create-company.component';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { provideRouter, Router } from '@angular/router';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { AuthService } from '../../../core/auth.service';
import { CompanyService } from '../../../core/services/company';
import { of, throwError } from 'rxjs';

describe('CreateCompanyComponent', () => {
  let component: CreateCompanyComponent;
  let fixture: ComponentFixture<CreateCompanyComponent>;
  let authServiceMock: jasmine.SpyObj<AuthService>;
  let companyServiceMock: jasmine.SpyObj<CompanyService>;
  let snackBarSpy: jasmine.SpyObj<MatSnackBar>;
  let routerSpy: jasmine.SpyObj<Router>;

  const setup = async () => {
    await TestBed.resetTestingModule()
      .configureTestingModule({
        imports: [CreateCompanyComponent],
        providers: [
          provideRouter([]),
          { provide: Router, useValue: routerSpy },
          provideAnimationsAsync(),
          { provide: AuthService, useValue: authServiceMock },
          { provide: CompanyService, useValue: companyServiceMock },
          { provide: MatSnackBar, useValue: snackBarSpy }
        ]
      })
      .overrideComponent(CreateCompanyComponent, { remove: { imports: [MatSnackBarModule] } })
      .compileComponents();

    fixture = TestBed.createComponent(CreateCompanyComponent);
    component = fixture.componentInstance;
    routerSpy.navigate.calls.reset();
    fixture.detectChanges();
  };

  beforeEach(async () => {
    authServiceMock = jasmine.createSpyObj('AuthService', [
      'getUser', 'isAuthenticated', 'isCompanyActive', 'setCompanyStatus'
    ]);
    authServiceMock.getUser.and.returnValue({ id: '1', role: 'MANAGER' });
    authServiceMock.isCompanyActive.and.returnValue(false);

    companyServiceMock = jasmine.createSpyObj('CompanyService', ['saveMyCompany']);
    snackBarSpy = jasmine.createSpyObj('MatSnackBar', ['openFromComponent']);
    routerSpy = jasmine.createSpyObj('Router', ['navigate']);

    await setup();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
    expect(routerSpy.navigate).not.toHaveBeenCalled();
  });

  it('SUPERADMIN est redirigé vers companies', async () => {
    authServiceMock.getUser.and.returnValue({ id: '1', role: 'SUPERADMIN' });
    await setup();

    expect(routerSpy.navigate).toHaveBeenCalledWith(['/dashboard/companies']);
  });

  it('société active redirigée vers company-profile', async () => {
    authServiceMock.isCompanyActive.and.returnValue(true);
    await setup();

    expect(routerSpy.navigate).toHaveBeenCalledWith(['/dashboard/company-profile']);
  });

  it('onCreateCompany succès : statut, snack et navigation', () => {
    companyServiceMock.saveMyCompany.and.returnValue(of({} as any));
    component.company.fleetSize = null;

    component.onCreateCompany();

    const payload = companyServiceMock.saveMyCompany.calls.mostRecent().args[0] as any;
    expect(payload.fleetSize).toBe(0);
    expect(payload.status).toBe('En Attente');
    expect(authServiceMock.setCompanyStatus).toHaveBeenCalledWith('EN_ATTENTE');

    expect(snackBarSpy.openFromComponent).toHaveBeenCalledTimes(1);
    const config = snackBarSpy.openFromComponent.calls.mostRecent().args[1] as any;
    expect(config.data.title).toBe('Entreprise créée');
    expect(config.data.type).toBe('success');
    expect(routerSpy.navigate).toHaveBeenCalledWith(['/dashboard/company-profile']);
  });

  it('onCreateCompany échec : snack erreur sans navigation', () => {
    companyServiceMock.saveMyCompany.and.returnValue(throwError(() => new Error('ko')));

    component.onCreateCompany();

    expect(snackBarSpy.openFromComponent).toHaveBeenCalledTimes(1);
    const config = snackBarSpy.openFromComponent.calls.mostRecent().args[1] as any;
    expect(config.data.title).toBe('Erreur');
    expect(config.data.type).toBe('error');
    expect(authServiceMock.setCompanyStatus).not.toHaveBeenCalled();
    expect(routerSpy.navigate).not.toHaveBeenCalled();
  });

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

  it('onImageSelected lit le fichier en data URL', async () => {
    installFakeReader('data:image/png;base64,QUJD');
    const file = new File(['contenu-image'], 'logo.png', { type: 'image/png' });
    component.onImageSelected({ target: { files: [file] } } as any);

    await new Promise<void>(res => setTimeout(res, 0));

    expect(component.imageFileName).toBe('logo.png');
    expect(component.company.image).toBe('data:image/png;base64,QUJD');
  });

  it('onImageSelected avec résultat vide → chaîne vide', async () => {
    installFakeReader('');
    const file = new File(['x'], 'vide.png', { type: 'image/png' });
    component.onImageSelected({ target: { files: [file] } } as any);

    await new Promise<void>(res => setTimeout(res, 0));

    expect(component.company.image).toBe('');
  });

  it('onImageSelected sans fichier ne fait rien', () => {
    component.onImageSelected({ target: { files: [] } } as any);

    expect(component.imageFileName).toBe('');
    expect(component.company.image).toBe('');
  });

  it('onLegalDocSelected lit le document en data URL', async () => {
    installFakeReader('data:application/pdf;base64,cGRm');
    const file = new File(['pdf'], 'justificatif.pdf', { type: 'application/pdf' });
    component.onLegalDocSelected({ target: { files: [file] } } as any);

    await new Promise<void>(res => setTimeout(res, 0));

    expect(component.legalDocFileName).toBe('justificatif.pdf');
    expect(component.company.documentJustificatif).toBe('data:application/pdf;base64,cGRm');
  });

  it('onLegalDocSelected sans fichier ne fait rien', () => {
    component.onLegalDocSelected({ target: { files: null } } as any);

    expect(component.legalDocFileName).toBe('');
  });

  it('isImageDataUrl / isPdfDataUrl', () => {
    expect(component.isImageDataUrl('data:image/png;base64,x')).toBeTrue();
    expect(component.isImageDataUrl('data:text/plain')).toBeFalse();
    expect(component.isImageDataUrl(undefined)).toBeFalse();

    expect(component.isPdfDataUrl('data:application/pdf;base64,x')).toBeTrue();
    expect(component.isPdfDataUrl('data:image/png')).toBeFalse();
    expect(component.isPdfDataUrl('')).toBeFalse();
  });

  it('erreur de lecture du fichier : la promesse est rejetée silencieusement', async () => {
    const unhandled: PromiseRejectionEvent[] = [];
    const handler = (e: PromiseRejectionEvent) => unhandled.push(e);
    window.addEventListener('unhandledrejection', handler);

    installFakeReader(new Error('read failed'));

    const file = new File(['x'], 'broken.png', { type: 'image/png' });
    component.onImageSelected({ target: { files: [file] } } as any);

    await new Promise<void>(res => setTimeout(res, 20));

    expect(component.imageFileName).toBe('broken.png');
    expect(component.company.image).toBe('');
    window.removeEventListener('unhandledrejection', handler);
  });
});
