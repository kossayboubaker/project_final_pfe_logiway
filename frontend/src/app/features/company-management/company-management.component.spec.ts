import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CompanyManagementComponent } from './company-management.component';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { AuthService } from '../../core/auth.service';
import { CompanyService, Company } from '../../core/services/company.service';
import { UserService, UserListItem } from '../../core/services/user.service';
import { NotificationService } from '../../core/services/notification.service';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { of, throwError, Subject, Observable } from 'rxjs';
import { PremiumSnackbarComponent } from '../../shared/components/premium-snackbar/premium-snackbar.component';
import { CompanyDialogComponent } from './company-dialog/company-dialog.component';
import { PdfPreviewDialogComponent } from './pdf-preview-dialog/pdf-preview-dialog.component';
import { ConfirmDeleteDialogComponent } from '../../shared/components/confirm-delete-dialog/confirm-delete-dialog.component';

describe('CompanyManagementComponent', () => {
  let component: CompanyManagementComponent;
  let fixture: ComponentFixture<CompanyManagementComponent>;
  let companyServiceMock: jasmine.SpyObj<CompanyService>;
  let userServiceMock: jasmine.SpyObj<UserService>;
  let authServiceMock: jasmine.SpyObj<AuthService>;
  let snackBarMock: jasmine.SpyObj<MatSnackBar>;
  let notificationServiceMock: jasmine.SpyObj<NotificationService>;
  let dialogMock: { open: jasmine.Spy };
  let afterClosedSubject: Subject<any>;
  let dialogRef: { afterClosed: () => Observable<any> };

  const mockCompany: Company = {
    id: 'c1', name: 'TransExpress', status: 'Actif', image: 'data:image/png;base64,x',
    email: 'c@c.com', sector: 'Logistique', address: 'Tunis', number: '1', codeTVA: 'TV1',
    representantLegal: 'M. X', fleetSize: 10, managerOwnerId: null,
    documentJustificatif: 'data:application/pdf;base64,y'
  } as any;

  const mockUsers: UserListItem[] = [
    { id: 1, prenom: 'Ali', nom: 'Ben', email: 'ali@test.com', role: 'MANAGER' },
    { id: 2, prenom: 'Sara', nom: '', email: 'sara@test.com', role: 'CHAUFFEUR' }
  ];

  beforeEach(async () => {
    afterClosedSubject = new Subject<any>();
    dialogRef = { afterClosed: () => afterClosedSubject.asObservable() };
    dialogMock = { open: jasmine.createSpy('open').and.returnValue(dialogRef) };

    companyServiceMock = jasmine.createSpyObj('CompanyService', ['getCompanies', 'createCompany', 'updateCompany', 'deleteCompany', 'updateCompanyStatus', 'clearCompanyOwner']);
    companyServiceMock.getCompanies.and.returnValue(of([mockCompany, { ...mockCompany, id: 'c2', status: 'En Attente' }]));
    companyServiceMock.createCompany.and.returnValue(of(mockCompany));
    companyServiceMock.updateCompany.and.returnValue(of(mockCompany));
    companyServiceMock.updateCompanyStatus.and.returnValue(of(mockCompany));
    companyServiceMock.clearCompanyOwner.and.returnValue(of(mockCompany));
    companyServiceMock.deleteCompany.and.returnValue(of({ success: true, message: 'Supprimée' }));

    userServiceMock = jasmine.createSpyObj('UserService', ['list']);
    userServiceMock.list.and.returnValue(of(mockUsers));

    authServiceMock = jasmine.createSpyObj('AuthService', ['getUser', 'isAuthenticated']);
    authServiceMock.getUser.and.returnValue({ id: '1', role: 'SUPERADMIN' });
    authServiceMock.isAuthenticated.and.returnValue(true);

    snackBarMock = jasmine.createSpyObj('MatSnackBar', ['openFromComponent']);
    notificationServiceMock = jasmine.createSpyObj('NotificationService', ['loadNotifications']);
    notificationServiceMock.loadNotifications.and.returnValue(of([]));

    TestBed.overrideComponent(CompanyManagementComponent, {
      remove: { imports: [MatSnackBarModule, MatDialogModule] }
    });

    await TestBed.configureTestingModule({
      imports: [CompanyManagementComponent],
      providers: [
        provideRouter([]),
        provideHttpClient(),
        provideHttpClientTesting(),
        provideAnimationsAsync(),
        { provide: AuthService, useValue: authServiceMock },
        { provide: CompanyService, useValue: companyServiceMock },
        { provide: UserService, useValue: userServiceMock },
        { provide: NotificationService, useValue: notificationServiceMock },
        { provide: MatSnackBar, useValue: snackBarMock },
        { provide: MatDialog, useValue: dialogMock }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(CompanyManagementComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('loads companies and managers on init', () => {
    expect(companyServiceMock.getCompanies).toHaveBeenCalled();
    expect(userServiceMock.list).toHaveBeenCalled();
    expect(component.dataSource.data.length).toBe(2);
    expect(component.managers).toEqual([{ id: 1, name: 'Ali Ben' }]);
    expect(component.currentUserRole).toBe('SUPERADMIN');
  });

  it('loadCompanies sets dataSource', () => {
    component.loadCompanies();
    expect(component.dataSource.data.length).toBe(2);
  });

  it('loadManagers maps managers and uses email fallback', () => {
    userServiceMock.list.and.returnValue(of([
      { id: 1, prenom: 'Ali', nom: 'Ben', email: 'ali@test.com', role: 'MANAGER' },
      { id: 2, prenom: '', nom: '', email: 'noName@test.com', role: 'MANAGER' },
      { id: 3, prenom: 'Sara', nom: '', email: 'sara@test.com', role: 'CHAUFFEUR' }
    ] as any));
    (component as any).loadManagers();
    expect(component.managers).toEqual(jasmine.arrayContaining([jasmine.objectContaining({ id: 1, name: 'Ali Ben' })]));
    expect(component.managers).toEqual(jasmine.arrayContaining([jasmine.objectContaining({ id: 2, name: 'noName@test.com' })]));
    expect(component.managers.some(m => m.id === 3)).toBeFalse();
  });

  it('getActiveCount / getInactiveCount / getPendingCount', () => {
    expect(component.getActiveCount()).toBe(1);
    expect(component.getInactiveCount()).toBe(1);
    expect(component.getPendingCount()).toBe(1);
  });

  it('applyFilter sets filter', () => {
    component.applyFilter({ target: { value: '  TRANS ' } } as any);
    expect(component.dataSource.filter).toBe('trans');
  });

  it('openAddModal creates company', () => {
    component.openAddModal();
    afterClosedSubject.next({ name: 'NewCo' });
    expect(companyServiceMock.createCompany).toHaveBeenCalledWith({ name: 'NewCo' });
    expect(snackBarMock.openFromComponent).toHaveBeenCalledWith(
      PremiumSnackbarComponent,
      jasmine.objectContaining({ data: jasmine.objectContaining({ title: 'Entreprise Ajoutée', type: 'success' }) })
    );
    expect(notificationServiceMock.loadNotifications).toHaveBeenCalled();
  });

  it('openAddModal cancelled does nothing', () => {
    component.openAddModal();
    afterClosedSubject.next(null);
    expect(companyServiceMock.createCompany).not.toHaveBeenCalled();
  });

  it('openAddModal create error shows error', () => {
    companyServiceMock.createCompany.and.returnValue(throwError(() => new Error('x')));
    component.openAddModal();
    afterClosedSubject.next({ name: 'NewCo' });
    expect(snackBarMock.openFromComponent).toHaveBeenCalledWith(
      PremiumSnackbarComponent,
      jasmine.objectContaining({ data: jasmine.objectContaining({ title: 'Création impossible', type: 'error' }) })
    );
  });

  it('editCompany updates company', () => {
    component.editCompany(mockCompany);
    afterClosedSubject.next({ name: 'Updated' });
    expect(companyServiceMock.updateCompany).toHaveBeenCalledWith('c1', { name: 'Updated' });
    expect(snackBarMock.openFromComponent).toHaveBeenCalledWith(
      PremiumSnackbarComponent,
      jasmine.objectContaining({ data: jasmine.objectContaining({ title: 'Modifications Enregistrées' }) })
    );
  });

  it('editCompany cancelled does nothing', () => {
    component.editCompany(mockCompany);
    afterClosedSubject.next(false);
    expect(companyServiceMock.updateCompany).not.toHaveBeenCalled();
  });

  it('editCompany error shows error', () => {
    companyServiceMock.updateCompany.and.returnValue(throwError(() => new Error('x')));
    component.editCompany(mockCompany);
    afterClosedSubject.next({ name: 'Updated' });
    expect(snackBarMock.openFromComponent).toHaveBeenCalledWith(
      PremiumSnackbarComponent,
      jasmine.objectContaining({ data: jasmine.objectContaining({ title: 'Modification impossible' }) })
    );
  });

  it('deleteCompany success removes and snackbars', () => {
    component.deleteCompany(mockCompany);
    afterClosedSubject.next(true);
    expect(companyServiceMock.deleteCompany).toHaveBeenCalledWith('c1');
    expect(component.dataSource.data.some(c => c.id === 'c1')).toBeFalse();
    expect(snackBarMock.openFromComponent).toHaveBeenCalledWith(
      PremiumSnackbarComponent,
      jasmine.objectContaining({ data: jasmine.objectContaining({ title: 'Entreprise Supprimée', type: 'warning' }) })
    );
  });

  it('deleteCompany cancelled returns', () => {
    component.deleteCompany(mockCompany);
    afterClosedSubject.next(false);
    expect(companyServiceMock.deleteCompany).not.toHaveBeenCalled();
  });

  it('deleteCompany failure shows error snackbar', () => {
    companyServiceMock.deleteCompany.and.returnValue(of({ success: false, message: 'Echec' }));
    component.deleteCompany(mockCompany);
    afterClosedSubject.next(true);
    expect(snackBarMock.openFromComponent).toHaveBeenCalledWith(
      PremiumSnackbarComponent,
      jasmine.objectContaining({ data: jasmine.objectContaining({ title: 'Opération Échouée', type: 'error' }) })
    );
  });

  it('updateStatus updates', () => {
    component.updateStatus(mockCompany, 'Inactif');
    expect(companyServiceMock.updateCompanyStatus).toHaveBeenCalledWith('c1', 'Inactif');
    expect(snackBarMock.openFromComponent).toHaveBeenCalledWith(
      PremiumSnackbarComponent,
      jasmine.objectContaining({ data: jasmine.objectContaining({ title: 'Statut Mis à Jour', type: 'info' }) })
    );
  });

  it('updateStatus error', () => {
    companyServiceMock.updateCompanyStatus.and.returnValue(throwError(() => new Error('x')));
    component.updateStatus(mockCompany, 'Actif');
    expect(snackBarMock.openFromComponent).toHaveBeenCalledWith(
      PremiumSnackbarComponent,
      jasmine.objectContaining({ data: jasmine.objectContaining({ title: 'Mise à jour impossible' }) })
    );
  });

  it('clearManagerOwner updates', () => {
    component.clearManagerOwner(mockCompany);
    expect(companyServiceMock.clearCompanyOwner).toHaveBeenCalledWith('c1');
    expect(snackBarMock.openFromComponent).toHaveBeenCalledWith(
      PremiumSnackbarComponent,
      jasmine.objectContaining({ data: jasmine.objectContaining({ title: 'Affectation annulée' }) })
    );
  });

  it('clearManagerOwner error', () => {
    companyServiceMock.clearCompanyOwner.and.returnValue(throwError(() => new Error('x')));
    component.clearManagerOwner(mockCompany);
    expect(snackBarMock.openFromComponent).toHaveBeenCalledWith(
      PremiumSnackbarComponent,
      jasmine.objectContaining({ data: jasmine.objectContaining({ title: 'Action impossible' }) })
    );
  });

  it('openPdfPreview opens dialog when valid pdf', () => {
    component.openPdfPreview(mockCompany);
    expect(dialogMock.open).toHaveBeenCalledWith(
      PdfPreviewDialogComponent,
      jasmine.objectContaining({ data: jasmine.objectContaining({ pdfUrl: mockCompany.documentJustificatif }) })
    );
  });

  it('openPdfPreview shows error when no valid pdf', () => {
    component.openPdfPreview({ ...mockCompany, documentJustificatif: '' } as any);
    expect(snackBarMock.openFromComponent).toHaveBeenCalledWith(
      PremiumSnackbarComponent,
      jasmine.objectContaining({ data: jasmine.objectContaining({ title: 'Document indisponible' }) })
    );
    expect(dialogMock.open).not.toHaveBeenCalled();
  });

  it('showError', () => {
    component.showError('T', 'M');
    expect(snackBarMock.openFromComponent).toHaveBeenCalledWith(
      PremiumSnackbarComponent,
      jasmine.objectContaining({ data: jasmine.objectContaining({ title: 'T', type: 'error' }) })
    );
  });

  it('isImageDataUrl', () => {
    expect(component.isImageDataUrl('data:image/png;base64,x')).toBeTrue();
    expect(component.isImageDataUrl('data:application/pdf;base64,x')).toBeFalse();
    expect(component.isImageDataUrl(undefined)).toBeFalse();
  });

  it('isPdfDataUrl', () => {
    expect(component.isPdfDataUrl('data:application/pdf;base64,x')).toBeTrue();
    expect(component.isPdfDataUrl('data:image/png;base64,x')).toBeFalse();
    expect(component.isPdfDataUrl('')).toBeFalse();
  });

  it('ngAfterViewInit sets paginator and sort', () => {
    component.ngAfterViewInit();
    expect(component.dataSource.paginator).toBeDefined();
    expect(component.dataSource.sort).toBeDefined();
  });
});
