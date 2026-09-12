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

describe('debug DI identity', () => {
  it('who is snackBar?', () => {
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
    const component = fixture.componentInstance;

    const injectedViaTestBed = TestBed.inject(MatSnackBar);
    console.log('TestBed.inject === mock:', (injectedViaTestBed as any) === snackBarMock);
    console.log('component[snackBar] === mock:', (component as any)['snackBar'] === snackBarMock);
    console.log('component ctor name:', component.constructor.name);

    // Vérifie le token utilisé par le composant : inspecte les paramètres du constructeur
    const ctor: any = component.constructor;
    console.log('ctor parameters:', JSON.stringify(ctor.parameters?.map((p: any) => (p && p.token && (p.token.name || String(p.token))) || '?')));
  });
});
