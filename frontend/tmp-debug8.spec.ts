import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { ComponentFixture } from '@angular/core/testing';
import { AffectationVehiculeComponent } from './src/app/features/affectation-vehicule/affectation-vehicule.component';
import { provideRouter } from '@angular/router';
import { AffectationService } from './src/app/core/services/affectation.service';
import { AuthService } from './src/app/core/auth.service';
import { CompanyService } from './src/app/core/services/company.service';
import { FleetService } from './src/app/core/services/fleet.service';
import { UserService } from './src/app/core/services/user.service';
import { MatSnackBar } from '@angular/material/snack-bar';

describe('debug what is snackBar', () => {
  it('inspect instance', () => {
    const authServiceMock = { getUser: jasmine.createSpy('getUser').and.returnValue({ id: 9, role: 'SUPERADMIN' }) };
    const companyServiceMock = {
      getCompanies: jasmine.createSpy('getCompanies').and.returnValue(of([])),
      getMyCompany: jasmine.createSpy('getMyCompany').and.returnValue(of(null))
    };
    const fleetServiceMock = { getVehicles: jasmine.createSpy('getVehicles').and.returnValue(of([])) };
    const userServiceMock = { list: jasmine.createSpy('list').and.returnValue(of([])) };
    const affectationServiceMock = {
      assignerChauffeurVehicule: jasmine.createSpy('assigner').and.returnValue(of({}))
    };
    const snackBarMock = {
      openFromComponent: jasmine.createSpy('openFromComponent').and.returnValue({})
    };

    TestBed.configureTestingModule({
      imports: [AffectationVehiculeComponent],
      providers: [
        provideRouter([]),
        { provide: AffectationService, useValue: affectationServiceMock },
        { provide: MatSnackBar, useValue: snackBarMock },
        { provide: AuthService, useValue: authServiceMock },
        { provide: CompanyService, useValue: companyServiceMock },
        { provide: FleetService, useValue: fleetServiceMock },
        { provide: UserService, useValue: userServiceMock }
      ]
    }).compileComponents();

    const fixture: ComponentFixture<AffectationVehiculeComponent> = TestBed.createComponent(AffectationVehiculeComponent);
    const component: any = fixture.componentInstance;

    console.log('own keys:', Object.keys(component).join(','));
    console.log('snackBar ctor:', component.snackBar && component.snackBar.constructor && component.snackBar.constructor.name);
    console.log('snackBar === mock:', component.snackBar === snackBarMock);
    console.log('affectationService === mock:', component.affectationService === affectationServiceMock);
    console.log('authService === mock:', component.authService === authServiceMock);
    console.log('typeof comp.snackBar.openFromComponent:', typeof (component.snackBar || {}).openFromComponent);

    // Compare against a fresh TestBed.inject
    const injected: any = TestBed.inject(MatSnackBar);
    console.log('injected ctor:', injected.constructor && injected.constructor.name);
    console.log('injected === mock:', injected === snackBarMock);
    expect(true).toBe(true);
  });
});
