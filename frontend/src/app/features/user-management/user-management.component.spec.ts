import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { provideRouter } from '@angular/router';
import { of, throwError, Subject, Observable } from 'rxjs';
import { UserManagementComponent } from './user-management.component';
import { UserService, UserListItem } from '../../core/services/user.service';
import { AuthService } from '../../core/auth.service';
import { PremiumSnackbarComponent } from '../../shared/components/premium-snackbar/premium-snackbar.component';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';

describe('UserManagementComponent', () => {
  let component: UserManagementComponent;
  let fixture: ComponentFixture<UserManagementComponent>;
  let userServiceMock: jasmine.SpyObj<UserService>;
  let authServiceMock: jasmine.SpyObj<AuthService>;
  let snackBarMock: jasmine.SpyObj<MatSnackBar>;
  let dialogRef: { afterClosed: () => Observable<any> };
  let afterClosedSubject: Subject<any>;

  const mockUsers: any[] = [
    { id: 1, prenom: 'Ali', nom: 'Ben', email: 'ali@test.com', role: 'CHAUFFEUR', telephone: '111', pays: 'TN', estActif: 'ACTIF', managerId: 10, rejectionReason: null, emailVerifie: true },
    { id: 2, prenom: 'Sara', nom: 'Kamel', email: 'sara@test.com', role: 'MANAGER', telephone: '222', pays: 'FR', estActif: 'REJETE', managerId: null, rejectionReason: 'triche', emailVerifie: false }
  ];

  const configure = async () => {
    TestBed.overrideComponent(UserManagementComponent, {
      remove: { imports: [MatSnackBarModule, MatDialogModule] }
    });
    await TestBed.configureTestingModule({
      imports: [UserManagementComponent],
      providers: [
        provideRouter([]),
        provideHttpClient(),
        provideHttpClientTesting(),
        provideAnimationsAsync(),
        { provide: UserService, useValue: userServiceMock },
        { provide: AuthService, useValue: authServiceMock },
        { provide: MatSnackBar, useValue: snackBarMock },
        { provide: MatDialog, useValue: { open: jasmine.createSpy('open').and.returnValue(dialogRef) } }
      ]
    }).compileComponents();
  };

  const create = () => {
    fixture = TestBed.createComponent(UserManagementComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  };

  beforeEach(async () => {
    afterClosedSubject = new Subject<any>();
    dialogRef = { afterClosed: () => afterClosedSubject.asObservable() };

    userServiceMock = jasmine.createSpyObj('UserService', ['list', 'create', 'update', 'delete']);
    userServiceMock.list.and.returnValue(of(mockUsers));
    userServiceMock.create.and.returnValue(of({}));
    userServiceMock.update.and.returnValue(of({}));
    userServiceMock.delete.and.returnValue(of({ message: 'Supprime' }));

    snackBarMock = jasmine.createSpyObj('MatSnackBar', ['openFromComponent']);

    Object.defineProperty(window, 'prompt', { value: jasmine.createSpy('prompt').and.returnValue(null), configurable: true });
  });

  afterEach(() => {
    if (typeof window !== 'undefined') {
      (window as any).prompt = undefined;
    }
  });

  describe('as SUPERADMIN', () => {
    beforeEach(async () => {
      authServiceMock = jasmine.createSpyObj('AuthService', ['getUser', 'isAuthenticated']);
      authServiceMock.getUser.and.returnValue({ id: '1', role: 'SUPERADMIN' });
      await configure();
      create();
    });

    it('should create', () => {
      expect(component).toBeTruthy();
    });

    it('should load users on init and map rows', () => {
      expect(userServiceMock.list).toHaveBeenCalled();
      expect(component.dataSource.data.length).toBe(2);
      expect(component.users[0].name).toBe('Ali Ben');
      expect(component.managers).toEqual([{ id: 2, name: 'Sara Kamel' }]);
    });

    it('isManagerView false for superadmin', () => {
      expect(component.isManagerView).toBeFalse();
    });

    it('getActiveCount / getPendingCount / getRejectedCount', () => {
      expect(component.getActiveCount()).toBe(1);
      expect(component.getPendingCount()).toBe(0);
      expect(component.getRejectedCount()).toBe(1);
    });

    it('applyFilter sets dataSource.filter', () => {
      component.applyFilter({ target: { value: '  ALI  ' } } as any);
      expect(component.dataSource.filter).toBe('ali');
    });

    it('applyFilter handles empty value', () => {
      component.applyFilter({ target: { value: '' } } as any);
      expect(component.dataSource.filter).toBe('');
    });

    it('openCreateUserForm resets and shows (manager false keeps defaults)', () => {
      component.openCreateUserForm();
      expect(component.editingUserId).toBeNull();
      expect(component.newUser.role).toBe('Driver');
      expect(component.newUser.status).toBe('Approved');
      expect(component.showAddUserForm).toBeTrue();
    });

    it('startEditUser fills the form', () => {
      component.startEditUser(component.users[0]);
      expect(component.editingUserId).toBe(1);
      expect(component.statusOnlyEdit).toBe(true);
      expect(component.newUser.name).toBe('Ali Ben');
      expect(component.newUser.role).toBe('Driver');
      expect(component.newUser.status).toBe('Approved');
      expect(component.showAddUserForm).toBeTrue();
    });

    it('startEditUser missing fields uses fallbacks', () => {
      component.startEditUser({ id: 5, name: 'X', prenom: 'X', nom: '', email: 'x@x.com', telephone: '', pays: '', image: '', estActif: 'EN ATTENTE', role: 'Manager' as any, status: 'Pending', managerId: null, rejectionReason: null });
      expect(component.newUser.telephone).toBe('');
      expect(component.newUser.rejectionReason).toBe('');
    });

    it('startEditUser statusOnlyEdit false for non-manager unverified email', () => {
      component.startEditUser({ id: 9, name: 'Q', prenom: 'Q', nom: '', email: 'q@q.com', telephone: '', pays: '', image: '', estActif: 'EN ATTENTE', role: 'Driver' as any, status: 'Pending', managerId: null, rejectionReason: null, emailVerifie: false });
      expect(component.statusOnlyEdit).toBeFalse();
    });

    it('cancelUserForm resets the form', () => {
      component.openCreateUserForm();
      component.cancelUserForm();
      expect(component.showAddUserForm).toBeFalse();
      expect(component.editingUserId).toBeNull();
      expect(component.newUser.name).toBe('');
    });

    it('toggleAddUserForm opens when closed', () => {
      component.showAddUserForm = false;
      component.toggleAddUserForm();
      expect(component.showAddUserForm).toBeTrue();
    });

    it('toggleAddUserForm cancels when open', () => {
      component.openCreateUserForm();
      component.toggleAddUserForm();
      expect(component.showAddUserForm).toBeFalse();
    });

    it('approveUser updates and snackbars', () => {
      const user = component.users.find(u => u.id === 1)!;
      component.approveUser(user);
      expect(userServiceMock.update).toHaveBeenCalledWith(1, { estActif: true });
      expect(user.status).toBe('Approved');
      expect(user.estActif).toBe('ACTIF');
      expect(snackBarMock.openFromComponent).toHaveBeenCalled();
    });

    it('approveUser handles error via showError', () => {
      userServiceMock.update.and.returnValue(throwError(() => ({ error: { message: 'Email already exists' } })));
      component.approveUser(component.users[0]);
      expect(snackBarMock.openFromComponent).toHaveBeenCalledWith(
        PremiumSnackbarComponent,
        jasmine.objectContaining({ data: jasmine.objectContaining({ title: 'Approbation impossible', message: 'Cet email existe deja. Choisissez une autre adresse.' }) })
      );
    });

    it('rejectUser with prompt calls update and snackbars', () => {
      (window.prompt as any).and.returnValue('raison');
      component.rejectUser(component.users[0]);
      expect(userServiceMock.update).toHaveBeenCalledWith(1, { estActif: false, rejectionReason: 'raison' });
      expect(component.users[0].status).toBe('Rejected');
      expect(snackBarMock.openFromComponent).toHaveBeenCalled();
    });

    it('rejectUser with empty prompt shows error and returns', () => {
      (window.prompt as any).and.returnValue('   ');
      component.rejectUser(component.users[0]);
      expect(userServiceMock.update).not.toHaveBeenCalled();
      expect(snackBarMock.openFromComponent).toHaveBeenCalledWith(
        PremiumSnackbarComponent,
        jasmine.objectContaining({ data: jasmine.objectContaining({ title: 'Rejet annulé', type: 'error' }) })
      );
    });

    it('rejectUser error shows error', () => {
      (window.prompt as any).and.returnValue('raison');
      userServiceMock.update.and.returnValue(throwError(() => ({ error: {} })));
      component.rejectUser(component.users[0]);
      expect(snackBarMock.openFromComponent).toHaveBeenCalledWith(
        PremiumSnackbarComponent,
        jasmine.objectContaining({ data: jasmine.objectContaining({ title: 'Rejet impossible' }) })
      );
    });

    it('setInactive updates and snackbars', () => {
      component.setInactive(component.users[1]);
      expect(userServiceMock.update).toHaveBeenCalledWith(2, { estActif: false });
      expect(component.users[1].status).toBe('Pending');
      expect(snackBarMock.openFromComponent).toHaveBeenCalled();
    });

    it('setInactive error shows error', () => {
      userServiceMock.update.and.returnValue(throwError(() => ({ error: {} })));
      component.setInactive(component.users[1]);
      expect(snackBarMock.openFromComponent).toHaveBeenCalledWith(
        PremiumSnackbarComponent,
        jasmine.objectContaining({ data: jasmine.objectContaining({ title: 'Mise a jour impossible' }) })
      );
    });

    it('setActionTarget and clearActionTarget', () => {
      component.setActionTarget(component.users[0]);
      expect(component.actionTargetUser?.id).toBe(1);
      component.clearActionTarget();
      expect(component.actionTargetUser).toBeNull();
    });

    it('assignToManager updates and snackbars', () => {
      component.assignToManager(component.users[1], '2');
      expect(userServiceMock.update).toHaveBeenCalledWith(2, { managerId: 2 });
      expect(userServiceMock.list).toHaveBeenCalled();
      expect(snackBarMock.openFromComponent).toHaveBeenCalled();
    });

    it('assignToManager with null user returns', () => {
      component.assignToManager(null, 2);
      expect(userServiceMock.update).not.toHaveBeenCalled();
    });

    it('assignToManager with null managerId returns', () => {
      component.assignToManager(component.users[1], null as any);
      expect(userServiceMock.update).not.toHaveBeenCalled();
    });

    it('assignToManager error shows error', () => {
      userServiceMock.update.and.returnValue(throwError(() => ({ error: {} })));
      component.assignToManager(component.users[1], 2);
      expect(snackBarMock.openFromComponent).toHaveBeenCalledWith(
        PremiumSnackbarComponent,
        jasmine.objectContaining({ data: jasmine.objectContaining({ title: 'Affectation impossible' }) })
      );
    });

    it('submitUserForm creates a new user (superadmin)', () => {
      component.openCreateUserForm();
      component.newUser.name = 'Nouvel User';
      component.newUser.email = 'n@test.com';
      component.newUser.role = 'Manager';
      component.newUser.status = 'Approved';
      component.submitUserForm();
      const payload = userServiceMock.create.calls.mostRecent().args[0];
      expect(payload.prenom).toBe('Nouvel');
      expect(payload.nom).toBe('User');
      expect(payload.role).toBe('MANAGER');
      expect(payload.estActif).toBe(true);
      expect(component.showAddUserForm).toBeFalse();
      expect(userServiceMock.list).toHaveBeenCalled();
    });

    it('submitUserForm create with single-word name uses prenom as nom', () => {
      component.openCreateUserForm();
      component.newUser.name = 'Only';
      component.newUser.email = 'o@test.com';
      component.newUser.status = 'Rejected';
      component.newUser.rejectionReason = 'nope';
      component.submitUserForm();
      const payload = userServiceMock.create.calls.mostRecent().args[0];
      expect(payload.nom).toBe('Only');
      expect(payload.rejectionReason).toBe('nope');
    });

    it('submitUserForm create with SuperAdmin role', () => {
      component.openCreateUserForm();
      component.newUser.name = 'Boss';
      component.newUser.email = 'b@test.com';
      component.newUser.role = 'SuperAdmin';
      component.submitUserForm();
      expect(userServiceMock.create.calls.mostRecent().args[0].role).toBe('SUPERADMIN');
    });

    it('submitUserForm create error shows error', () => {
      userServiceMock.create.and.returnValue(throwError(() => ({ error: { message: 'Email already exists' } })));
      component.openCreateUserForm();
      component.newUser.name = 'N';
      component.newUser.email = 'n@test.com';
      component.submitUserForm();
      expect(snackBarMock.openFromComponent).toHaveBeenCalledWith(
        PremiumSnackbarComponent,
        jasmine.objectContaining({ data: jasmine.objectContaining({ title: 'Creation impossible' }) })
      );
    });

    it('submitUserForm invalid (empty name) returns', () => {
      component.openCreateUserForm();
      component.newUser.name = '   ';
      component.submitUserForm();
      expect(userServiceMock.create).not.toHaveBeenCalled();
    });

    it('submitUserForm updates an existing user to superadmin', () => {
      component.startEditUser({ id: 8, name: 'SA', prenom: 'S', nom: 'A', email: 'sa@test.com', telephone: '1', pays: 'TN', image: '', estActif: 'ACTIF', role: 'SuperAdmin' as any, status: 'Approved', managerId: null, rejectionReason: null, emailVerifie: false });
      component.newUser.status = 'Approved';
      component.submitUserForm();
      const payload = userServiceMock.update.calls.mostRecent().args[1];
      expect(userServiceMock.update.calls.mostRecent().args[0]).toBe(8);
      expect(payload.role).toBe('SUPERADMIN');
      expect(component.showAddUserForm).toBeFalse();
    });

    it('submitUserForm update full payload with manager', () => {
      component.startEditUser(component.users[1]);
      component.newUser.managerId = 7;
      component.newUser.status = 'Rejected';
      component.newUser.rejectionReason = 'raison';
      component.submitUserForm();
      const payload = userServiceMock.update.calls.mostRecent().args[1];
      expect(payload.managerId).toBe(7);
      expect(payload.rejectionReason).toBe('raison');
      expect(payload.estActif).toBe(false);
    });

    it('submitUserForm update error shows error', () => {
      userServiceMock.update.and.returnValue(throwError(() => ({ error: {} })));
      component.startEditUser(component.users[0]);
      component.newUser.role = 'Manager';
      component.submitUserForm();
      expect(snackBarMock.openFromComponent).toHaveBeenCalledWith(
        PremiumSnackbarComponent,
        jasmine.objectContaining({ data: jasmine.objectContaining({ title: 'Modification impossible' }) })
      );
    });

    it('deleteUser confirms then deletes', () => {
      component.deleteUser(component.users[0]);
      afterClosedSubject.next(true);
      expect(userServiceMock.delete).toHaveBeenCalledWith(1);
      expect(snackBarMock.openFromComponent).toHaveBeenCalledWith(
        PremiumSnackbarComponent,
        jasmine.objectContaining({ data: jasmine.objectContaining({ title: 'Utilisateur Supprime' }) })
      );
    });

    it('deleteUser cancelled returns', () => {
      component.deleteUser(component.users[0]);
      afterClosedSubject.next(false);
      expect(userServiceMock.delete).not.toHaveBeenCalled();
    });

    it('deleteUser error shows error', () => {
      userServiceMock.delete.and.returnValue(throwError(() => ({ error: {} })));
      component.deleteUser(component.users[0]);
      afterClosedSubject.next(true);
      expect(snackBarMock.openFromComponent).toHaveBeenCalledWith(
        PremiumSnackbarComponent,
        jasmine.objectContaining({ data: jasmine.objectContaining({ title: 'Suppression impossible' }) })
      );
    });

    it('getStatusBadgeClass returns classes', () => {
      expect(component.getStatusBadgeClass('Approved')).toBe('approved');
      expect(component.getStatusBadgeClass('Rejected')).toBe('rejected');
      expect(component.getStatusBadgeClass('Pending')).toBe('pending');
      expect(component.getStatusBadgeClass('Inactive')).toBe('pending');
    });

    it('showSuccess', () => {
      (component as any).showSuccess('T', 'M');
      expect(snackBarMock.openFromComponent).toHaveBeenCalledWith(
        PremiumSnackbarComponent,
        jasmine.objectContaining({ data: jasmine.objectContaining({ type: 'success' }) })
      );
    });

    it('showError with api fallback', () => {
      (component as any).showError('T', { error: {} });
      expect(snackBarMock.openFromComponent).toHaveBeenCalledWith(
        PremiumSnackbarComponent,
        jasmine.objectContaining({ data: jasmine.objectContaining({ message: 'Une erreur est survenue.' }) })
      );
    });

    it('showError with custom fallback', () => {
      (component as any).showError('T', { error: {} }, 'fallback-msg');
      expect(snackBarMock.openFromComponent).toHaveBeenCalledWith(
        PremiumSnackbarComponent,
        jasmine.objectContaining({ data: jasmine.objectContaining({ message: 'fallback-msg' }) })
      );
    });

    it('toPayload fallback role for unknown statuses', () => {
      const mapped = component.users[0];
      expect(mapped.estActif).toBe('ACTIF');
      expect(component.users[1].estActif).toBe('REJETE');
    });

    it('reloadUsers handles null list', () => {
      userServiceMock.list.and.returnValue(of(null as any));
      (component as any).reloadUsers();
      expect(component.dataSource.data.length).toBe(0);
    });

    it('reload handles Rejected status mapping', () => {
      userServiceMock.list.and.returnValue(of([{ id: 3, prenom: 'Z', nom: 'W', email: 'z@z.com', role: 'CHAUFFEUR', estActif: 'EN ATTENTE', managerId: null, rejectionReason: 'x' }]));
      (component as any).reloadUsers();
      expect(component.users[0].status).toBe('Pending');
      expect(component.users[0].estActif).toBe('EN ATTENTE');
    });
  });

  describe('as MANAGER', () => {
    beforeEach(async () => {
      authServiceMock = jasmine.createSpyObj('AuthService', ['getUser', 'isAuthenticated']);
      authServiceMock.getUser.and.returnValue({ id: '2', role: 'MANAGER' });
      await configure();
      create();
    });

    it('isManagerView true and filters only drivers', () => {
      expect(component.isManagerView).toBeTrue();
      expect(component.users!.length).toBe(1);
      expect(component.users![0].role).toBe('Driver');
    });

    it('openCreateUserForm enforces Driver/Pending', () => {
      component.openCreateUserForm();
      expect(component.newUser.role).toBe('Driver');
      expect(component.newUser.status).toBe('Pending');
    });

    it('submitUserForm create as manager uses CHAUFFEUR and estActif false', () => {
      component.openCreateUserForm();
      component.newUser.name = 'Chauffeur X';
      component.newUser.email = 'c@test.com';
      component.submitUserForm();
      const payload = userServiceMock.create.calls.mostRecent().args[0];
      expect(payload.role).toBe('CHAUFFEUR');
      expect(payload.estActif).toBe(false);
    });

    it('statusOnlyEdit update sends only status fields', () => {
      component.startEditUser(component.users[0]);
      component.newUser.status = 'Approved';
      component.submitUserForm();
      const payload = userServiceMock.update.calls.mostRecent().args[1];
      expect(payload.estActif).toBe(true);
      expect(payload.role).toBeUndefined();
    });

    it('statusOnlyEdit rejected sends rejectionReason only', () => {
      component.startEditUser(component.users[0]);
      component.newUser.status = 'Rejected';
      component.newUser.rejectionReason = 'motif';
      component.submitUserForm();
      const payload = userServiceMock.update.calls.mostRecent().args[1];
      expect(payload.rejectionReason).toBe('motif');
      expect(payload.estActif).toBe(false);
    });
  });
});
