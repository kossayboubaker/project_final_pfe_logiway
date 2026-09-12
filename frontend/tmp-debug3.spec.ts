import { TestBed } from '@angular/core/testing';
import { Observable, of } from 'rxjs';
import { ComponentFixture } from '@angular/core/testing';
import { AffectationVehiculeComponent } from './src/app/features/affectation-vehicule/affectation-vehicule.component';
import { provideRouter } from '@angular/router';
import { AffectationService } from './src/app/core/services/affectation.service';
import { AuthService } from './src/app/core/auth.service';
import { CompanyService } from './src/app/core/services/company.service';
import { FleetService } from './src/app/core/services/fleet.service';
import { UserService } from './src/app/core/services/user.service';
import { MatSnackBar } from '@angular/material/snack-bar';

describe('debug prototype subscribe', () => {
  it('trace', () => {
    const proto: any = (of({}) as any).constructor.prototype;
    const originalSubscribe = proto.subscribe;
    const trace: string[] = [];
    proto.subscribe = function (...args: any[]) {
      trace.push(`subscribe called with ${args.length} args; keys=${args[0] ? Object.keys(args[0]).join(',') : 'n/a'}`);
      try {
        const sub = originalSubscribe.apply(this, args);
        trace.push('original subscribe returned ok');
        return sub;
      } catch (e: any) {
        trace.push('original subscribe THREW: ' + e.message);
        throw e;
      }
    };

    const authServiceMock = { getUser: jasmine.createSpy('getUser').and.returnValue({ id: 9, role: 'SUPERADMIN' }) };
    const companyServiceMock = {
      getCompanies: jasmine.createSpy('getCompanies').and.returnValue(of([])),
      getMyCompany: jasmine.createSpy('getMyCompany').and.returnValue(of(null))
    };
    const fleetServiceMock = { getVehicles: jasmine.createSpy('getVehicles').and.returnValue(of([])) };
    const userServiceMock = { list: jasmine.createSpy('list').and.returnValue(of([])) };
    const affectationServiceMock = {
      assignerChauffeurVehicule: jasmine.createSpy('assigner').and.callFake(() => of({ assigned: true }))
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

    trace.length = 0;
    component.selectedChauffeurId = 1;
    component.selectedVehiculeId = '12';
    let thrown: string | null = null;
    try {
      component.validerAffectation();
    } catch (e: any) {
      thrown = e.message;
    }

    console.log('THROWN:', thrown);
    console.log('TRACE:\n' + trace.join('\n'));
    console.log('snack calls:', (snackBarMock.openFromComponent as any).calls.count());

    proto.subscribe = originalSubscribe;
    expect(true).toBe(true);
  });
});
