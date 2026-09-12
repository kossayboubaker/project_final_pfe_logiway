import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FleetManagementComponent } from './fleet-management.component';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { FleetService, Vehicle } from '../../core/services/fleet.service';
import { AuthService } from '../../core/auth.service';
import { NotificationService } from '../../core/services/notification.service';
import { CompanyService } from '../../core/services/company.service';
import { UserService } from '../../core/services/user.service';
import { of, Subject, throwError } from 'rxjs';
import { AppNotification } from '../../core/services/notification.service';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { VehicleDialogComponent } from './vehicle-dialog/vehicle-dialog.component';
import { ConfirmDeleteDialogComponent } from '../../shared/components/confirm-delete-dialog/confirm-delete-dialog.component';
import { VehiculeStatut } from '../../models/project.models';

describe('FleetManagementComponent', () => {
  let component: FleetManagementComponent;
  let fixture: ComponentFixture<FleetManagementComponent>;
  let fleetServiceMock: any;
  let authServiceMock: any;
  let notificationServiceMock: any;
  let companyServiceMock: any;
  let userServiceMock: any;
  let snackBarMock: any;
  let dialogMock: any;
  let realtimeSubject: Subject<AppNotification>;
  let currentUserSubject: any;

  function mkVehicle(over: any = {}): Vehicle {
    return Object.assign({
      id: '1', plate: 'TN-001', model: 'Actros', status: 'En Service', nextCheck: '10000 km',
      companyId: 'c1', companyName: 'Logiway', driverId: '5', driverName: 'Ali Ben',
      managerId: '3', managerPrenom: 'Jean', managerNom: 'Test'
    }, over);
  }

  const setupWithRole = async (role: string, opts: any = {}) => {
    TestBed.resetTestingModule();
    realtimeSubject = new Subject<AppNotification>();
    currentUserSubject = new (require('rxjs').BehaviorSubject)({ id: '3', role });

    const vehicles = opts.vehicles ?? [mkVehicle()];
    fleetServiceMock = {
      getVehicles: jasmine.createSpy('getVehicles').and.returnValue(of(vehicles)),
      getTrips: jasmine.createSpy('getTrips').and.returnValue(of([])),
      getAvailableDrivers: jasmine.createSpy('getAvailableDrivers').and.returnValue(of([
        { id: 'd1', prenom: 'Marc', nom: 'Ali', email: 'm@x.com' },
        { id: 'd2', prenom: '', nom: '', email: 's@x.com' }
      ])),
      getVehiclesList: jasmine.createSpy('getVehiclesList').and.returnValue(of([])),
      createVehicle: jasmine.createSpy('createVehicle').and.returnValue(of({})),
      updateVehicle: jasmine.createSpy('updateVehicle').and.returnValue(of({})),
      updateVehicleStatus: jasmine.createSpy('updateVehicleStatus').and.returnValue(of({})),
      assignDriver: jasmine.createSpy('assignDriver').and.returnValue(of({})),
      clearDriver: jasmine.createSpy('clearDriver').and.returnValue(of({})),
      deleteVehicle: jasmine.createSpy('deleteVehicle').and.returnValue(of({}))
    };

    authServiceMock = {
      getUser: jasmine.createSpy('getUser').and.returnValue({ id: '3', role }),
      isAuthenticated: jasmine.createSpy('isAuthenticated').and.returnValue(true),
      currentUser: currentUserSubject.asObservable()
    };

    notificationServiceMock = {
      connectRealtime: jasmine.createSpy('connectRealtime'),
      realtimeNotification$: realtimeSubject.asObservable(),
      notifications$: of([]),
      unreadCount$: of(0)
    };

    companyServiceMock = {
      getCompanies: jasmine.createSpy('getCompanies').and.returnValue(of([
        { id: 'c1', name: 'Logiway' },
        { id: 'c2', name: 'Transco' }
      ])),
      getMyCompany: jasmine.createSpy('getMyCompany').and.returnValue(of({ id: 'c1', name: 'Logiway' }))
    };
    userServiceMock = {
      list: jasmine.createSpy('list').and.returnValue(of([
        { id: 5, prenom: 'Ali', nom: 'Ben', role: 'CHAUFFEUR', email: 'a@x.com', entrepriseId: 'c1' },
        { id: 6, prenom: 'Sara', nom: 'Kamel', role: 'CHAUFFEUR', email: 's@x.com', entrepriseId: 'c2' },
        { id: 7, prenom: 'Ben', nom: 'Ali', role: 'MANAGER', email: 'm@x.com' }
      ]))
    };

    snackBarMock = { openFromComponent: jasmine.createSpy('openFromComponent'), open: jasmine.createSpy('open') };
    dialogMock = { open: jasmine.createSpy('open').and.returnValue({ afterClosed: () => of(undefined) }) };

    await TestBed.configureTestingModule({
      imports: [FleetManagementComponent],
      providers: [
        provideRouter([]),
        provideHttpClient(),
        provideHttpClientTesting(),
        provideAnimationsAsync(),
        { provide: FleetService, useValue: fleetServiceMock },
        { provide: AuthService, useValue: authServiceMock },
        { provide: NotificationService, useValue: notificationServiceMock },
        { provide: CompanyService, useValue: companyServiceMock },
        { provide: UserService, useValue: userServiceMock },
        { provide: MatSnackBar, useValue: snackBarMock },
        { provide: MatDialog, useValue: dialogMock }
      ]
    })
      .overrideComponent(FleetManagementComponent, { remove: { imports: [MatSnackBarModule, MatDialogModule] } })
      .compileComponents();

    fixture = TestBed.createComponent(FleetManagementComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  };

  function dialogResult(result: any): void {
    dialogMock.open.and.returnValue({ afterClosed: () => of(result) });
  }

  describe('as SUPERADMIN', () => {
    beforeEach(async () => await setupWithRole('SUPERADMIN'));

    it('should create', () => {
      expect(component).toBeTruthy();
    });

    it('isSuperAdmin() should return true', () => {
      expect(component.isSuperAdmin()).toBeTrue();
    });

    it('isManager() should return false', () => {
      expect(component.isManager()).toBeFalse();
    });

    it('canCreateVehicle() should return true for SUPERADMIN', () => {
      expect(component.canCreateVehicle()).toBeTrue();
      expect(component.canEditVehicle()).toBeTrue();
      expect(component.canDeleteVehicle()).toBeTrue();
      expect(component.canClearDriver()).toBeTrue();
      expect(component.canAssignDriver(mkVehicle())).toBeTrue();
    });

    it('should use superadmin columns', () => {
      expect(component.displayedColumns).toEqual(component.superadminColumns);
    });

    it('superadmin loads companies and drivers', () => {
      expect(companyServiceMock.getCompanies).toHaveBeenCalled();
      expect(userServiceMock.list).toHaveBeenCalled();
      expect(component.companies.length).toBe(2);
      expect(component.drivers.length).toBe(2);
      expect(component.currentCompany).toBeNull();
    });

    it('loadVehicles sets all vehicles for superadmin', () => {
      component.loadVehicles();
      expect(component.dataSource.data.length).toBe(1);
    });

    it('re-emits same role/email user without reloading companies', () => {
      const companiesBefore = companyServiceMock.getCompanies.calls.count();
      currentUserSubject.next({ id: '3', role: 'SUPERADMIN' });
      expect(companyServiceMock.getCompanies.calls.count()).toBe(companiesBefore);
    });

    it('distinct user (different role) reloads companies', () => {
      currentUserSubject.next({ id: '4', role: 'MANAGER' });
      expect(companyServiceMock.getMyCompany).toHaveBeenCalled();
      expect(component.isManager()).toBeTrue();
    });
  });

  describe('as MANAGER', () => {
    beforeEach(async () => await setupWithRole('MANAGER'));

    it('isManager() should return true and isSuperAdmin false', () => {
      expect(component.isManager()).toBeTrue();
      expect(component.isSuperAdmin()).toBeFalse();
    });

    it('should use default columns', () => {
      expect(component.displayedColumns).toEqual(component.defaultColumns);
    });

    it('canCreateVehicle() should return false for MANAGER', () => {
      expect(component.canCreateVehicle()).toBeFalse();
      expect(component.canEditVehicle()).toBeFalse();
      expect(component.canDeleteVehicle()).toBeFalse();
      expect(component.canClearDriver()).toBeFalse();
    });

    it('manager loads my company and filters vehicles', () => {
      expect(companyServiceMock.getMyCompany).toHaveBeenCalled();
      expect(component.currentCompany?.id).toBe('c1');
      expect(component.companies.length).toBe(1);
      expect(component.drivers.length).toBe(1);
    });

    it('canAssignDriver true when vehicle in company', () => {
      expect(component.canAssignDriver(mkVehicle({ companyId: 'c1' }))).toBeTrue();
      expect(component.canAssignDriver(mkVehicle({ companyId: 'c2' }))).toBeFalse();
    });

    it('canChangeStatus manager in company', () => {
      expect(component.canChangeStatus(mkVehicle({ companyId: 'c1' }))).toBeTrue();
      expect(component.canChangeStatus(mkVehicle({ companyId: 'c2' }))).toBeFalse();
    });
  });

  describe('as DRIVER', () => {
    beforeEach(async () => await setupWithRole('DRIVER'));

    it('isDriver() should return true', () => {
      expect(component.isDriver()).toBeTrue();
      expect(component.canCreateVehicle()).toBeFalse();
      expect(component.canAssignDriver(mkVehicle())).toBeFalse();
    });

    it('canChangeStatus true when vehicle assigned to driver', () => {
      expect(component.canChangeStatus(mkVehicle({ driverId: '3' }))).toBeTrue();
      expect(component.canChangeStatus(mkVehicle({ driverId: '99' }))).toBeFalse();
    });

    it('canChangeStatus false for other roles (not server/driver)', async () => {
      await setupWithRole('CHAUFFEUR');
      expect(component.canChangeStatus(mkVehicle({ driverId: '3' }))).toBeFalse();
    });

    it('driver loads vehicles (not manager)', () => {
      expect(fleetServiceMock.getVehicles).toHaveBeenCalled();
      expect(component.dataSource.data.length).toBe(1);
    });

    it('loadDrivers clears for non-manager/non-superadmin', () => {
      component.loadDrivers();
      expect(component.drivers).toEqual([]);
    });
  });

  describe('KPIs and formatters', () => {
    beforeEach(async () => await setupWithRole('SUPERADMIN', { vehicles: [
      mkVehicle({ status: 'En Service' }),
      mkVehicle({ id: '2', status: 'EN_MAINTENANCE' }),
      mkVehicle({ id: '3', status: 'hors service' })
    ] }));

    it('counts by status', () => {
      expect(component.getActiveCount()).toBe(1);
      expect(component.getMaintenanceCount()).toBe(1);
      expect(component.getHorsServiceCount()).toBe(1);
    });

    it('getCompanyLabel() should return company name when available', () => {
      const vehicle: any = { companyName: 'Logiway', plate: 'TN-001', model: 'Actros', status: 'En Service', nextCheck: '10000 km' };
      expect(component.getCompanyLabel(vehicle)).toBe('Logiway');
    });

    it('getCompanyLabel() should return default when no company name', () => {
      const vehicle: any = { plate: 'TN-001', model: 'Actros', status: 'En Service', nextCheck: '10000 km' };
      expect(component.getCompanyLabel(vehicle)).toBe('Entreprise non définie');
    });

    it('getDriverLabel() variants', () => {
      const v: any = { driverName: 'Ali Ben' };
      const v2: any = {};
      expect(component.getDriverLabel(v)).toBe('Ali Ben');
      expect(component.getDriverLabel(v2)).toBe('Non affecté');
    });

    it('getManagerLabel() variants', () => {
      expect(component.getManagerLabel(mkVehicle({ managerPrenom: 'Jean', managerNom: 'Test' }))).toBe('Jean Test');
      expect(component.getManagerLabel(mkVehicle({ managerPrenom: '', managerNom: 'X' }))).toBe('X');
      expect(component.getManagerLabel(mkVehicle({ managerPrenom: '', managerNom: '' }))).toBe('Non défini');
    });

    it('trackByVehicleId() should return vehicle id', () => {
      const vehicle: any = { id: 'v42' };
      expect(component.trackByVehicleId(0, vehicle)).toBe('v42');
    });
  });

  describe('filter', () => {
    beforeEach(async () => await setupWithRole('SUPERADMIN'));

    it('applyFilter() should update dataSource.filter', () => {
      component.applyFilter({ target: { value: '  TN-001  ' } } as any);
      expect(component.dataSource.filter).toBe('tn-001');
    });
  });

  describe('realtime', () => {
    beforeEach(async () => await setupWithRole('SUPERADMIN'));

    it('reloads vehicles on NOTIF_VEHICULE / NOTIF_TRAJET', () => {
      const before = fleetServiceMock.getVehicles.calls.count();
      realtimeSubject.next({ category: 'NOTIF_VEHICULE' } as any);
      realtimeSubject.next({ category: 'NOTIF_TRAJET' } as any);
      expect(fleetServiceMock.getVehicles.calls.count()).toBeGreaterThan(before);
    });

    it('reloads drivers on NOTIF_COMPTE', () => {
      const before = userServiceMock.list.calls.count();
      realtimeSubject.next({ category: 'NOTIF_COMPTE' } as any);
      expect(userServiceMock.list.calls.count()).toBeGreaterThan(before);
    });

    it('ignores other categories', () => {
      const before = fleetServiceMock.getVehicles.calls.count();
      realtimeSubject.next({ category: 'AUTRE' } as any);
      expect(fleetServiceMock.getVehicles.calls.count()).toBe(before);
    });
  });

  describe('addVehicle', () => {
    beforeEach(async () => await setupWithRole('SUPERADMIN'));

    it('does nothing without permission', () => {
      spyOn(component, 'canCreateVehicle').and.returnValue(false);
      component.addVehicle();
      expect(dialogMock.open).not.toHaveBeenCalled();
    });

    it('opens dialog and creates vehicle', () => {
      dialogResult({ matricule: 'TN-100', marque: 'Volvo', modele: 'FH', capacite: 20, entrepriseId: 1, statut: VehiculeStatut.EN_SERVICE });
      component.addVehicle();
      expect(dialogMock.open).toHaveBeenCalled();
      expect(fleetServiceMock.createVehicle).toHaveBeenCalledWith(jasmine.objectContaining({ matricule: 'TN-100' }));
      expect(snackBarMock.openFromComponent).toHaveBeenCalled();
    });

    it('no result returns', () => {
      component.addVehicle();
      expect(fleetServiceMock.createVehicle).not.toHaveBeenCalled();
    });

    it('toPayload null returns', () => {
      dialogResult({});
      component.addVehicle();
      expect(fleetServiceMock.createVehicle).not.toHaveBeenCalled();
    });

    it('createVehicle error FLEET_CAPACITY_REACHED', () => {
      fleetServiceMock.createVehicle.and.returnValue(throwError(() => ({ error: { message: 'FLEET_CAPACITY_REACHED' } })));
      dialogResult({ matricule: 'TN-100', marque: 'V', modele: 'FH', capacite: 20, entrepriseId: 1, statut: VehiculeStatut.EN_SERVICE });
      component.addVehicle();
      expect(snackBarMock.openFromComponent).toHaveBeenCalledWith(jasmine.anything(), jasmine.objectContaining({ data: jasmine.objectContaining({ title: 'Flotte complète' }) }));
    });

    it('createVehicle generic error', () => {
      fleetServiceMock.createVehicle.and.returnValue(throwError(() => ({ error: {} })));
      dialogResult({ matricule: 'TN-100', marque: 'V', modele: 'FH', capacite: 20, entrepriseId: 1, statut: VehiculeStatut.EN_SERVICE });
      component.addVehicle();
      expect(snackBarMock.openFromComponent).toHaveBeenCalled();
    });
  });

  describe('editVehicle', () => {
    beforeEach(async () => await setupWithRole('SUPERADMIN'));

    it('does nothing without permission', () => {
      spyOn(component, 'canEditVehicle').and.returnValue(false);
      component.editVehicle(mkVehicle());
      expect(dialogMock.open).not.toHaveBeenCalled();
    });

    it('updates vehicle on result', () => {
      dialogResult({ matricule: 'TN-100', marque: 'V', modele: 'FH', capacite: 20, entrepriseId: 1, statut: VehiculeStatut.EN_SERVICE });
      component.editVehicle(mkVehicle({ id: '1' }));
      expect(fleetServiceMock.updateVehicle).toHaveBeenCalledWith('1', jasmine.anything());
    });

    it('edit error shows snackbar', () => {
      fleetServiceMock.updateVehicle.and.returnValue(throwError(() => new Error('x')));
      dialogResult({ matricule: 'TN-100', marque: 'V', modele: 'FH', capacite: 20, entrepriseId: 1, statut: VehiculeStatut.EN_SERVICE });
      component.editVehicle(mkVehicle({ id: '1' }));
      expect(snackBarMock.openFromComponent).toHaveBeenCalledWith(jasmine.anything(), jasmine.objectContaining({ data: jasmine.objectContaining({ title: 'Modification impossible' }) }));
    });

    it('edit with no result returns', () => {
      dialogResult(undefined);
      component.editVehicle(mkVehicle({ id: '1' }));
      expect(fleetServiceMock.updateVehicle).not.toHaveBeenCalled();
    });

    it('edit with payload null returns', () => {
      dialogResult({});
      component.editVehicle(mkVehicle({ id: '1' }));
      expect(fleetServiceMock.updateVehicle).not.toHaveBeenCalled();
    });
  });

  describe('changeStatus', () => {
    beforeEach(async () => await setupWithRole('SUPERADMIN'));

    it('does nothing without permission', () => {
      spyOn(component, 'canChangeStatus').and.returnValue(false);
      component.changeStatus(mkVehicle());
      expect(dialogMock.open).not.toHaveBeenCalled();
    });

    it('changes status', () => {
      dialogResult({ matricule: 'TN', marque: 'V', modele: 'FH', capacite: 1, entrepriseId: 1, statut: VehiculeStatut.EN_MAINTENANCE });
      component.changeStatus(mkVehicle());
      expect(fleetServiceMock.updateVehicleStatus).toHaveBeenCalledWith('1', VehiculeStatut.EN_MAINTENANCE);
    });

    it('no statut returns', () => {
      dialogResult({ matricule: 'TN' });
      component.changeStatus(mkVehicle());
      expect(fleetServiceMock.updateVehicleStatus).not.toHaveBeenCalled();
    });

    it('status error shows snackbar', () => {
      fleetServiceMock.updateVehicleStatus.and.returnValue(throwError(() => new Error('x')));
      dialogResult({ statut: VehiculeStatut.HORS_SERVICE });
      component.changeStatus(mkVehicle());
      expect(snackBarMock.openFromComponent).toHaveBeenCalledWith(jasmine.anything(), jasmine.objectContaining({ data: jasmine.objectContaining({ title: 'Statut refusé' }) }));
    });
  });

  describe('assignDriver', () => {
    beforeEach(async () => await setupWithRole('SUPERADMIN'));

    it('does nothing without permission', () => {
      spyOn(component, 'canAssignDriver').and.returnValue(false);
      component.assignDriver(mkVehicle());
      expect(fleetServiceMock.getAvailableDrivers).not.toHaveBeenCalled();
    });

    it('loads drivers, assigns with result', () => {
      dialogResult({ chauffeurId: 5, matricule: 'TN', marque: 'V', modele: 'FH', capacite: 1 });
      component.assignDriver(mkVehicle());
      expect(fleetServiceMock.getAvailableDrivers).toHaveBeenCalledWith('1');
      expect(fleetServiceMock.assignDriver).toHaveBeenCalledWith('1', 5);
    });

    it('no chauffeurId returns', () => {
      dialogMock.open.and.returnValue({ afterClosed: () => of({ matricule: 'TN' }) });
      component.assignDriver(mkVehicle());
      expect(fleetServiceMock.assignDriver).not.toHaveBeenCalled();
    });

    it('getAvailableDrivers error shows snackbar', () => {
      fleetServiceMock.getAvailableDrivers.and.returnValue(throwError(() => new Error('x')));
      component.assignDriver(mkVehicle());
      expect(snackBarMock.openFromComponent).toHaveBeenCalled();
    });

    it('assignDriver error shows snackbar', () => {
      fleetServiceMock.assignDriver.and.returnValue(throwError(() => ({ error: {} })));
      dialogResult({ chauffeurId: 5 });
      component.assignDriver(mkVehicle());
      expect(snackBarMock.openFromComponent).toHaveBeenCalledWith(jasmine.anything(), jasmine.objectContaining({ data: jasmine.objectContaining({ title: 'Affectation impossible' }) }));
    });
  });

  describe('clearDriver', () => {
    beforeEach(async () => await setupWithRole('SUPERADMIN'));

    it('does nothing without permission', () => {
      spyOn(component, 'canClearDriver').and.returnValue(false);
      component.clearDriver(mkVehicle());
      expect(fleetServiceMock.clearDriver).not.toHaveBeenCalled();
    });

    it('clears driver', () => {
      component.clearDriver(mkVehicle());
      expect(fleetServiceMock.clearDriver).toHaveBeenCalledWith('1');
      expect(snackBarMock.openFromComponent).toHaveBeenCalled();
    });

    it('clear error shows snackbar', () => {
      fleetServiceMock.clearDriver.and.returnValue(throwError(() => new Error('x')));
      component.clearDriver(mkVehicle());
      expect(snackBarMock.openFromComponent).toHaveBeenCalledWith(jasmine.anything(), jasmine.objectContaining({ data: jasmine.objectContaining({ title: 'Suppression impossible' }) }));
    });
  });

  describe('deleteVehicle', () => {
    beforeEach(async () => await setupWithRole('SUPERADMIN'));

    it('does nothing without permission', () => {
      spyOn(component, 'canDeleteVehicle').and.returnValue(false);
      component.deleteVehicle(mkVehicle());
      expect(dialogMock.open).not.toHaveBeenCalled();
    });

    it('opens confirm and deletes on confirm', () => {
      const afterClosed = new Subject<boolean>();
      dialogMock.open.and.callFake((c: unknown, config: any) => {
        expect(c).toBe(ConfirmDeleteDialogComponent);
        return { afterClosed: () => afterClosed.asObservable() };
      });
      component.deleteVehicle(mkVehicle({ id: '1' }));
      afterClosed.next(true);
      expect(fleetServiceMock.deleteVehicle).toHaveBeenCalledWith('1');
      expect(snackBarMock.openFromComponent).toHaveBeenCalled();
    });

    it('cancel does not delete', () => {
      const afterClosed = new Subject<boolean>();
      dialogMock.open.and.callFake(() => ({ afterClosed: () => afterClosed.asObservable() }));
      component.deleteVehicle(mkVehicle());
      afterClosed.next(false);
      expect(fleetServiceMock.deleteVehicle).not.toHaveBeenCalled();
    });

    it('delete error shows snackbar', () => {
      const afterClosed = new Subject<boolean>();
      dialogMock.open.and.callFake(() => ({ afterClosed: () => afterClosed.asObservable() }));
      fleetServiceMock.deleteVehicle.and.returnValue(throwError(() => new Error('x')));
      component.deleteVehicle(mkVehicle());
      afterClosed.next(true);
      expect(snackBarMock.openFromComponent).toHaveBeenCalledWith(jasmine.anything(), jasmine.objectContaining({ data: jasmine.objectContaining({ title: 'Suppression impossible' }) }));
    });
  });

  describe('permissions and helpers', () => {
    beforeEach(async () => await setupWithRole('MANAGER'));

    it('isVehicleInCurrentCompany', () => {
      component.currentCompany = { id: 'c1', name: 'L' } as any;
      expect(component.isVehicleInCurrentCompany(mkVehicle({ companyId: 'c1' }))).toBeTrue();
      expect(component.isVehicleInCurrentCompany(mkVehicle({ companyId: 'c2' }))).toBeFalse();
      component.currentCompany = null;
      expect(component.isVehicleInCurrentCompany(mkVehicle())).toBeFalse();
    });

    it('toPayload missing company shows snackbar and returns null', () => {
      const result = (component as any).toPayload({ matricule: 'X', marque: 'Y', modele: 'Z', capacite: 1 });
      expect(result).toBeNull();
      expect(snackBarMock.openFromComponent).toHaveBeenCalled();
    });

    it('toPayload missing fields shows snackbar and returns null', () => {
      component.currentCompany = { id: 'c1', name: 'L' } as any;
      const result = (component as any).toPayload({ entrepriseId: 5, matricule: '', marque: 'Y', modele: 'Z', capacite: 1 });
      expect(result).toBeNull();
      expect(snackBarMock.openFromComponent).toHaveBeenCalled();
    });

    it('toPayload builds payload', () => {
      component.currentCompany = { id: 'c1', name: 'L' } as any;
      const result = (component as any).toPayload({
        matricule: '  TN-200 ', marque: '  Volvo ', modele: '  FH ',
        capacite: 20, kilometrage: 1000, statut: VehiculeStatut.EN_SERVICE, entrepriseId: 9, chauffeurId: 4
      });
      expect(result.matricule).toBe('TN-200');
      expect(result.entrepriseId).toBe(9);
      expect(result.chauffeurId).toBe(4);
      expect(result.kilometrage).toBe(1000);
    });

    it('toPayload uses currentCompany id when no entrepriseId', () => {
      component.currentCompany = { id: 5, name: 'L' } as any;
      const result = (component as any).toPayload({ matricule: 'X', marque: 'Y', modele: 'Z', capacite: 2, statut: VehiculeStatut.EN_MAINTENANCE });
      expect(result.entrepriseId).toBe(5);
    });

    it('normalizeStatus variants', () => {
      const n = (component as any).normalizeStatus;
      expect(n('en service')).toBe(VehiculeStatut.EN_SERVICE);
      expect(n('EN_SERVICE')).toBe(VehiculeStatut.EN_SERVICE);
      expect(n('en maintenance')).toBe(VehiculeStatut.EN_MAINTENANCE);
      expect(n('MAINTENANCE')).toBe(VehiculeStatut.EN_MAINTENANCE);
      expect(n('hors service')).toBe(VehiculeStatut.HORS_SERVICE);
      expect(n('inconnu')).toBe(VehiculeStatut.EN_SERVICE);
    });

    it('labelForStatus variants', () => {
      const l = (component as any).labelForStatus;
      expect(l(VehiculeStatut.EN_MAINTENANCE)).toBe('en maintenance');
      expect(l(VehiculeStatut.HORS_SERVICE)).toBe('hors service');
      expect(l(VehiculeStatut.EN_SERVICE)).toBe('en service');
    });

    it('buildDialogData for manager status mode restricts statuses', () => {
      component.currentCompany = { id: 'c1', name: 'L' } as any;
      const data = (component as any).buildDialogData('status', mkVehicle());
      expect(data.allowedStatuses).toEqual([VehiculeStatut.EN_MAINTENANCE]);
    });

    it('filterDriversForCompany', () => {
      const f = (component as any).filterDriversForCompany;
      expect(f(null, [{ id: 'a', companyId: 'c1' }])).toEqual([]);
      expect(f('c1', [{ id: 'a', companyId: 'c1' }, { id: 'b', companyId: 'c2' }]).length).toBe(1);
    });

    it('ngOnDestroy unsubscribes', () => {
      expect(() => component.ngOnDestroy()).not.toThrow();
    });
  });
});
