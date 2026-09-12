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

describe('debug next side effects', () => {
  function makeComponent() {
    const authServiceMock = { getUser: jasmine.createSpy('getUser').and.returnValue({ id: 9, role: 'SUPERADMIN' }) };
    const companyServiceMock = {
      getCompanies: jasmine.createSpy('getCompanies').and.returnValue(of([])),
      getMyCompany: jasmine.createSpy('getMyCompany').and.returnValue(of(null))
    };
    const fleetServiceMock = { getVehicles: jasmine.createSpy('getVehicles').and.returnValue(of([])) };
    const userServiceMock = { list: jasmine.createSpy('list').and.returnValue(of([])) };
    const affectationServiceMock = {
      assignerChauffeurVehicule: jasmine.createSpy('assigner').and.callFake(() => of({}))
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
    fixture.detectChanges();
    return { component, affectationServiceMock, snackBarMock };
  }

  it('check side effects of next', () => {
    const { component, snackBarMock } = makeComponent();

    component.selectedEntrepriseId = '7';
    component.onEntrepriseChange();

    component.selectedChauffeurId = 1;
    component.selectedVehiculeId = '12';
    component.validerAffectation();

    console.log('after success selC:', component.selectedChauffeurId, 'selV:', component.selectedVehiculeId);
    console.log('snack:', (snackBarMock.openFromComponent as any).calls.count());
  });

  it('check error path side effects', () => {
    TestBed.resetTestingModule?.();
    const { component, snackBarMock, affectationServiceMock } = makeComponent();
    (affectationServiceMock.assignerChauffeurVehicule as any).and.callFake(() =>
      (require('rxjs') as any).throwError(() => ({ message: 'boom' }))
    );

    component.selectedChauffeurId = 1;
    component.selectedVehiculeId = '12';
    let thrown: string | null = null;
    try {
      component.validerAffectation();
    } catch (e: any) {
      thrown = e.message;
    }
    console.log('ERRPATH thrown:', thrown);
    console.log('after error selC:', component.selectedChauffeurId, 'selV:', component.selectedVehiculeId);
    console.log('snack:', (snackBarMock.openFromComponent as any).calls.count());
  });
});
