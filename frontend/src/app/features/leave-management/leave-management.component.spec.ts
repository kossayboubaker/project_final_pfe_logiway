import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { provideRouter } from '@angular/router';
import { of, Subject, throwError } from 'rxjs';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { LeaveManagementComponent } from './leave-management.component';
import { AuthService } from '../../core/auth.service';
import { LeaveService, LeaveRecord } from '../../core/services/leave.service';

describe('LeaveManagementComponent', () => {
  let component: LeaveManagementComponent;
  let fixture: ComponentFixture<LeaveManagementComponent>;
  let authServiceMock: jasmine.SpyObj<AuthService>;
  let leaveServiceMock: jasmine.SpyObj<LeaveService>;
  let dialogSpy: jasmine.SpyObj<MatDialog>;
  let snackBarSpy: jasmine.SpyObj<MatSnackBar>;
  let dialogResults: Subject<any>[];

  const mkLeave = (over: Partial<LeaveRecord>): any => ({
    id: 'x', requesterId: 5, requesterName: 'Ali Ben',
    requesterEmail: 'ali@test.com', requesterRole: 'CHAUFFEUR',
    type: 'VACANCES', typeLabel: 'Vacances',
    startDate: '01/07/2025', endDate: '10/07/2025',
    startDateIso: '2025-07-01', endDateIso: '2025-07-10',
    duration: 10, reason: 'Vacances été', status: 'EN_ATTENTE', statusLabel: 'En attente',
    managerId: 3, managerEmail: 'manager@test.com', managerName: 'Jean Test',
    ...over
  });

  const mockLeaves: LeaveRecord[] = [
    mkLeave({ id: '1', status: 'EN_ATTENTE' }),
    mkLeave({ id: '2', status: 'APPROUVE' }),
    mkLeave({ id: '3', status: 'REJETE' })
  ];

  const setupWithRole = async (
    role: string,
    userEmail = 'manager@test.com',
    leaves: LeaveRecord[] = mockLeaves,
    user?: any
  ) => {
    TestBed.resetTestingModule();
    authServiceMock.getUser.and.returnValue(
      user !== undefined ? user : { id: '3', role, username: 'Jean Test', email: userEmail }
    );
    leaveServiceMock.getLeaves.and.returnValue(of(leaves));

    await TestBed.configureTestingModule({
      imports: [LeaveManagementComponent],
      providers: [
        provideRouter([]),
        provideHttpClient(),
        provideHttpClientTesting(),
        provideAnimationsAsync(),
        { provide: AuthService, useValue: authServiceMock },
        { provide: LeaveService, useValue: leaveServiceMock },
        { provide: MatDialog, useValue: dialogSpy },
        { provide: MatSnackBar, useValue: snackBarSpy }
      ]
    }).overrideComponent(LeaveManagementComponent, {
      remove: { imports: [MatDialogModule, MatSnackBarModule] }
    }).compileComponents();

    fixture = TestBed.createComponent(LeaveManagementComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  };

  function lastSnack(): { title: string; message: string } {
    const cfg: any = snackBarSpy.openFromComponent.calls.mostRecent().args[1];
    return cfg.data;
  }

  beforeEach(() => {
    authServiceMock = jasmine.createSpyObj('AuthService', ['getUser']);
    leaveServiceMock = jasmine.createSpyObj('LeaveService', [
      'getLeaves', 'createLeave', 'updateLeave', 'approveLeave', 'rejectLeave', 'deleteLeave'
    ]);
    dialogResults = [];
    dialogSpy = jasmine.createSpyObj('MatDialog', ['open']);
    dialogSpy.open.and.callFake(() => {
      const s = new Subject<any>();
      dialogResults.push(s);
      return { afterClosed: () => s.asObservable(), close: () => { }, componentInstance: {} } as any;
    });
    snackBarSpy = jasmine.createSpyObj('MatSnackBar', ['openFromComponent']);
  });

  // ─── MANAGER ──────────────────────────────────────────────────
  describe('as MANAGER', () => {
    beforeEach(async () => {
      await setupWithRole('MANAGER');
    });

    it('should create', () => expect(component).toBeTruthy());

    it('should load leaves on init', () => {
      expect(leaveServiceMock.getLeaves).toHaveBeenCalled();
    });

    it('should show all leaves for MANAGER', () => {
      expect(component.dataSource.data.length).toBe(3);
    });

    it('totalRequests should be 3', () => expect(component.totalRequests).toBe(3));
    it('approvedRequests should be 1', () => expect(component.approvedRequests).toBe(1));
    it('rejectedRequests should be 1', () => expect(component.rejectedRequests).toBe(1));
    it('pendingRequests should be 1', () => expect(component.pendingRequests).toBe(1));
    it('userRole should be MANAGER', () => expect(component.userRole).toBe('MANAGER'));

    it('displayedColumns should include driverName for MANAGER', () => {
      expect(component.displayedColumns).toContain('driverName');
    });

    it('marque canReview pour les demandes de ses chauffeurs', () => {
      expect(component.allRequests.every(l => l.canReview)).toBeTrue();
    });
  });

  // ─── DRIVER ───────────────────────────────────────────────────
  describe('as DRIVER (own leaves only)', () => {
    beforeEach(async () => {
      await setupWithRole('DRIVER', 'ali@test.com');
    });

    it('should create', () => expect(component).toBeTruthy());

    it('should filter leaves to own email for DRIVER', () => {
      expect(component.dataSource.data.every(l => l.requesterEmail === 'ali@test.com')).toBeTrue();
    });

    it('displayedColumns should NOT include driverName for DRIVER', () => {
      expect(component.displayedColumns).not.toContain('driverName');
    });

    it('displayedColumns should include type and status', () => {
      expect(component.displayedColumns).toContain('type');
      expect(component.displayedColumns).toContain('status');
    });

    it('canEdit/canDelete uniquement pour ses propres demandes', () => {
      expect(component.allRequests.filter(l => l.canEdit).length).toBe(3);
      const otherUserLeaves = component.allRequests.filter(l => l.requesterEmail !== 'ali@test.com');
      expect(otherUserLeaves.length).toBe(0);
    });

    it('canReview toujours false pour un chauffeur', () => {
      expect(component.allRequests.every(l => !l.canReview)).toBeTrue();
    });
  });

  // ─── SUPERADMIN ───────────────────────────────────────────────
  describe('as SUPERADMIN', () => {
    beforeEach(async () => {
      await setupWithRole('SUPERADMIN', 'admin@test.com');
    });

    it('should show all leaves for SUPERADMIN', () => {
      expect(component.dataSource.data.length).toBe(3);
    });

    it('userRole should be SUPERADMIN', () => {
      expect(component.userRole).toBe('SUPERADMIN');
    });

    it('ne peut examiner que les demandes des managers', async () => {
      await setupWithRole('SUPERADMIN', 'admin@test.com', [
        mkLeave({ id: '9', requesterEmail: 'mgr@x.tn', requesterRole: 'MANAGER' as any }),
        mkLeave({ id: '10', requesterEmail: 'ali@test.com', requesterRole: 'CHAUFFEUR' })
      ]);
      const mgr = component.allRequests.find(l => l.id === '9')!;
      const driver = component.allRequests.find(l => l.id === '10')!;
      expect(mgr.canReview).toBeTrue();
      expect(driver.canReview).toBeFalse();
    });
  });

  // ─── Utilisateur absent ───────────────────────────────────────
  it('utilisateur absent : valeurs par défaut DRIVER', async () => {
    await setupWithRole('DRIVER', 'x@y.z', mockLeaves, null);
    expect(component.userRole).toBe('DRIVER');
    expect(component.currentUserName).toBe('Utilisateur');
    expect(component.currentUserEmail).toBe('');
  });

  // ─── cancelRequest ────────────────────────────────────────────
  describe('cancelRequest()', () => {
    beforeEach(async () => {
      await setupWithRole('MANAGER');
      leaveServiceMock.deleteLeave.and.returnValue(of({ message: 'Deleted' }));
    });

    it('should call deleteLeave and remove from list', () => {
      const initialCount = component.dataSource.data.length;
      component.cancelRequest('1');
      expect(leaveServiceMock.deleteLeave).toHaveBeenCalledWith('1');
      expect(initialCount).toBe(3);
    });

    it('notifie en cas d\u2019échec de suppression', () => {
      leaveServiceMock.deleteLeave.and.returnValue(throwError(() => new Error('down')));
      component.cancelRequest('1');
      expect(lastSnack().title).toBe('Erreur');
    });
  });

  // ─── requestLeave ─────────────────────────────────────────────
  describe('requestLeave()', () => {
    beforeEach(async () => {
      await setupWithRole('MANAGER');
    });

    it('bloque si une demande est déjà en attente', () => {
      component.requestLeave();
      expect(dialogSpy.open).not.toHaveBeenCalled();
      expect(lastSnack().title).toBe('Demande en attente');
    });

    it('ouvre le dialogue et crée la demande après fermeture avec résultat', () => {
      leaveServiceMock.getLeaves.and.returnValue(of([]));
      (component as any).loadLeaves();

      leaveServiceMock.createLeave.and.returnValue(of({} as any));
      component.requestLeave();

      expect(dialogSpy.open).toHaveBeenCalledWith(jasmine.any(Function), jasmine.any(Object));
      dialogResults[0].next({ type: 'VACANCES', startDate: new Date(), endDate: new Date(), reason: 'Congés' });

      expect(leaveServiceMock.createLeave).toHaveBeenCalled();
      expect(lastSnack().title).toBe('Demande Soumise');
    });

    it('notifie une erreur de création', () => {
      leaveServiceMock.getLeaves.and.returnValue(of([]));
      (component as any).loadLeaves();

      leaveServiceMock.createLeave.and.returnValue(throwError(() => new Error('ko')));
      component.requestLeave();
      dialogResults[0].next({ type: 'MALADIE', startDate: new Date(), endDate: new Date(), reason: 'Malade' });

      expect(lastSnack().title).toBe('Erreur');
    });

    it('fermeture sans résultat ne crée rien', () => {
      leaveServiceMock.getLeaves.and.returnValue(of([]));
      (component as any).loadLeaves();

      component.requestLeave();
      dialogResults[0].next(undefined);
      expect(leaveServiceMock.createLeave).not.toHaveBeenCalled();
    });
  });

  // ─── approve / reject / edit ──────────────────────────────────
  describe('approveLeave() et rejectLeave()', () => {
    beforeEach(async () => {
      await setupWithRole('MANAGER');
      spyOn(window, 'prompt').and.returnValue('Commentaire RH');
    });

    it('ignore un identifiant inconnu', () => {
      component.approveLeave('inconnu');
      component.rejectLeave('inconnu');
      expect(window.prompt).not.toHaveBeenCalled();
    });

    it('approuve avec commentaire et remplace la ligne', () => {
      const updated = mkLeave({ id: '1', status: 'APPROUVE', statusLabel: 'Approuvé' });
      leaveServiceMock.approveLeave.and.returnValue(of(updated));

      component.approveLeave('1');

      expect(window.prompt).toHaveBeenCalled();
      expect(leaveServiceMock.approveLeave).toHaveBeenCalledWith('1', { commentaire: 'Commentaire RH' });
      expect(component.dataSource.data.find(l => l.id === '1')!.status).toBe('APPROUVE');
      expect(lastSnack().title).toBe('Demande Approuvée');
    });

    it('notifie une erreur d\u2019approbation', () => {
      leaveServiceMock.approveLeave.and.returnValue(throwError(() => new Error('ko')));
      component.approveLeave('1');
      expect(lastSnack().title).toBe('Erreur');
    });

    it('refuse avec commentaire et remplace la ligne', () => {
      const updated = mkLeave({ id: '2', status: 'REJETE', statusLabel: 'Refusé' });
      leaveServiceMock.rejectLeave.and.returnValue(of(updated));

      component.rejectLeave('2');

      expect(leaveServiceMock.rejectLeave).toHaveBeenCalledWith('2', { commentaire: 'Commentaire RH' });
      expect(component.dataSource.data.find(l => l.id === '2')!.status).toBe('REJETE');
      expect(lastSnack().title).toBe('Demande Refusée');
    });

    it('notifie une erreur de refus', () => {
      leaveServiceMock.rejectLeave.and.returnValue(throwError(() => new Error('ko')));
      component.rejectLeave('2');
      expect(lastSnack().title).toBe('Erreur');
    });

    it('prompt null devient chaîne vide', () => {
      (window.prompt as jasmine.Spy).and.returnValue(null);
      const updated = mkLeave({ id: '1', status: 'APPROUVE' });
      leaveServiceMock.approveLeave.and.returnValue(of(updated));

      component.approveLeave('1');
      expect(leaveServiceMock.approveLeave).toHaveBeenCalledWith('1', { commentaire: '' });
    });

    it('prompt undefined retombe aussi sur chaîne vide', () => {
      (window.prompt as jasmine.Spy).and.returnValue(undefined);
      const updated = mkLeave({ id: '2', status: 'REJETE' });
      leaveServiceMock.rejectLeave.and.returnValue(of(updated));

      component.rejectLeave('2');
      expect(leaveServiceMock.rejectLeave).toHaveBeenCalledWith('2', { commentaire: '' });
    });
  });

  describe('editRequest()', () => {
    beforeEach(async () => {
      await setupWithRole('DRIVER', 'ali@test.com');
    });

    it('met à jour la demande après édition', () => {
      const target = component.dataSource.data[0];
      const updated = mkLeave({ id: target.id, reason: 'Nouveau motif' });
      leaveServiceMock.updateLeave.and.returnValue(of(updated));

      component.editRequest(target);
      dialogResults[dialogResults.length - 1].next({
        type: 'VACANCES', startDate: new Date(), endDate: new Date(), reason: 'Nouveau motif'
      });

      expect(leaveServiceMock.updateLeave).toHaveBeenCalledWith(target.id, jasmine.any(Object));
      expect(component.dataSource.data.find(l => l.id === target.id)!.reason).toBe('Nouveau motif');
      expect(lastSnack().title).toBe('Demande Modifiée');
    });

    it('notifie une erreur de mise à jour', () => {
      leaveServiceMock.updateLeave.and.returnValue(throwError(() => new Error('ko')));
      component.editRequest(component.dataSource.data[0]);
      dialogResults[dialogResults.length - 1].next({ type: 'MALADIE' });
      expect(lastSnack().title).toBe('Erreur');
    });

    it('fermeture sans résultat ne met rien à jour', () => {
      component.editRequest(component.dataSource.data[0]);
      dialogResults[dialogResults.length - 1].next(null);
      expect(leaveServiceMock.updateLeave).not.toHaveBeenCalled();
    });
  });
});
