import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AffectationVehiculeComponent } from './src/app/features/affectation-vehicule/affectation-vehicule.component';
import { provideRouter } from '@angular/router';
import { AffectationService } from './src/app/core/services/affectation.service';
import { AuthService } from './src/app/core/auth.service';
import { CompanyService } from './src/app/core/services/company.service';
import { FleetService } from './src/app/core/services/fleet.service';
import { UserService } from './src/app/core/services/user.service';
import { MatSnackBar } from '@angular/material/snack-bar';
import { of } from 'rxjs';

describe('debug validerAffectation', () => {
  it('full flow', () => {
    const authServiceMock = { getUser: jasmine.createSpy('getUser').and.returnValue({ id: 9, role: 'SUPERADMIN' }) };
    const companyServiceMock = {
      getCompanies: jasmine.createSpy('getCompanies').and.returnValue(of([])),
      getMyCompany: jasmine.createSpy('getMyCompany').and.returnValue(of(null))
    };
    const fleetServiceMock = { getVehicles: jasmine.createSpy('getVehicles').and.returnValue(of([])) };
    const userServiceMock = { list: jasmine.createSpy('list').and.returnValue(of([])) };
    const affectationServiceMock = {
      assignerChauffeurVehicule: jasmine.createSpy('assigner').and.callFake((a, b, c) => {
        console.log('ASSIGNER CALLED', a, b, c);
        return of({});
      })
    };
    const snackBarMock = {
      openFromComponent: jasmine.createSpy('openFromComponent').and.callFake((...args: any[]) => {
        console.log('SNACKBAR CALLED', args.length);
        return {};
      })
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

    component.selectedEntrepriseId = '7';
    component.onEntrepriseChange();
    console.log('after change:', JSON.stringify({
      ch: component.chauffeursLibres,
      ve: component.vehiculesHorsService,
      selC: component.selectedChauffeurId,
      selV: component.selectedVehiculeId
    }));

    component.selectedChauffeurId = 1;
    component.selectedVehiculeId = '12';
    component.validerAffectation();
    console.log('snack calls:', (snackBarMock.openFromComponent as any).calls.count());
    console.log('assigner calls:', (affectationServiceMock.assignerChauffeurVehicule as any).calls.count());

    expect(affectationServiceMock.assignerChauffeurVehicule).toHaveBeenCalled();

    const ret = (affectationServiceMock.assignerChauffeurVehicule as any).calls.mostRecent().returnValue;
    console.log('ret type:', typeof ret, 'ctor:', ret && ret.constructor && ret.constructor.name, 'hasSubscribe:', typeof (ret && ret.subscribe));
    if (ret && typeof ret.subscribe === 'function') {
      ret.subscribe({
        next: (v: any) => console.log('MANUAL NEXT', v),
        error: (e: any) => console.log('MANUAL ERR', e && e.message)
      });
      console.log('manual subscribe done');
    }

    const direct = of({});
    console.log('direct ctor:', direct.constructor.name);
    direct.subscribe({ next: () => console.log('DIRECT NEXT'), error: () => console.log('DIRECT ERR') });
  });
});
