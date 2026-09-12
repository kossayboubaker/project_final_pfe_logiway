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

describe('debug overrideProvider', () => {
  it('snackbar mock applies', async () => {
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

    await TestBed.configureTestingModule({
      imports: [AffectationVehiculeComponent],
      providers: [
        provideRouter([]),
        { provide: AffectationService, useValue: affectationServiceMock },
        { provide: AuthService, useValue: authServiceMock },
        { provide: CompanyService, useValue: companyServiceMock },
        { provide: FleetService, useValue: fleetServiceMock },
        { provide: UserService, useValue: userServiceMock }
      ]
    }).compileComponents();

    TestBed.overrideProvider(MatSnackBar, { useValue: snackBarMock });

    const fixture: ComponentFixture<AffectationVehiculeComponent> = TestBed.createComponent(AffectationVehiculeComponent);
    const component: any = fixture.componentInstance;
    fixture.detectChanges();

    console.log('snackBar === mock:', component.snackBar === snackBarMock);

    component.selectedChauffeurId = 1;
    component.selectedVehiculeId = '12';
    component.validerAffectation();
    console.log('snack calls:', (snackBarMock.openFromComponent as any).calls.count());
    console.log('data:', JSON.stringify((snackBarMock.openFromComponent as any).calls.mostRecent()?.args?.[1]?.data));
    expect(true).toBe(true);
  });
});
