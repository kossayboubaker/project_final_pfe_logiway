import { TestBed } from '@angular/core/testing';
import { ActivatedRouteSnapshot, RouterStateSnapshot, UrlTree, provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { companyGuard } from './company.guard';
import { AuthService } from '../auth.service';
import { CompanyService } from '../services/company';

describe('companyGuard', () => {
    let authService: any;
    let companyService: any;

    const childRoute = (path: string | undefined) =>
        ({ routeConfig: { path } } as unknown as ActivatedRouteSnapshot);
    const state = {} as RouterStateSnapshot;

    const run = (path: string | undefined) => {
        const results: Array<boolean | UrlTree> = [];
        const result$: any = TestBed.runInInjectionContext(() =>
            companyGuard(childRoute(path), state)
        );
        result$.subscribe((res: any) => results.push(res));
        return results[0];
    };

    beforeEach(() => {
        authService = {
            ensureSession: jasmine.createSpy('ensureSession'),
            getCompanyStatus: jasmine.createSpy('getCompanyStatus')
        };
        companyService = { getMyCompany: jasmine.createSpy('getMyCompany') };

        TestBed.configureTestingModule({
            providers: [
                provideRouter([]),
                { provide: AuthService, useValue: authService },
                { provide: CompanyService, useValue: companyService }
            ]
        });
    });

    it('should redirect to signin when there is no session', () => {
        authService.ensureSession.and.returnValue(of(null));

        const result = run('fleet');

        expect(result instanceof UrlTree).toBeTrue();
        expect((result as UrlTree).toString()).toBe('/auth/signin');
    });

    it('should allow access immediately for non-manager roles', () => {
        authService.ensureSession.and.returnValue(of({ role: 'CHAUFFEUR' }));

        expect(run('fleet')).toBeTrue();
        expect(companyService.getMyCompany).not.toHaveBeenCalled();
    });

    it('should allow access for a manager with an active company', () => {
        authService.ensureSession.and.returnValue(of({ role: 'MANAGER' }));
        companyService.getMyCompany.and.returnValue(of({ status: 'ACTIF' }));

        expect(run('fleet')).toBeTrue();
    });

    it('should allow locked-company managers on whitelisted routes', () => {
        authService.ensureSession.and.returnValue(of({ role: 'MANAGER' }));
        companyService.getMyCompany.and.returnValue(of({ status: 'En Attente' }));

        expect(run('company-profile')).toBeTrue();
        expect(run('company-waiting')).toBeTrue();
        expect(run('profile')).toBeTrue();
    });

    it('should redirect locked-company managers elsewhere to company-waiting', () => {
        authService.ensureSession.and.returnValue(of({ role: 'MANAGER' }));
        companyService.getMyCompany.and.returnValue(of({ status: 'EN_ATTENTE' }));

        const result = run('fleet');

        expect(result instanceof UrlTree).toBeTrue();
        expect((result as UrlTree).toString()).toBe('/dashboard/company-waiting');
    });

    it('should fall back to the auth service company status when company is null', () => {
        authService.ensureSession.and.returnValue(of({ role: 'MANAGER' }));
        authService.getCompanyStatus.and.returnValue('INACTIF');
        companyService.getMyCompany.and.returnValue(of(null));

        const blocked = run('fleet');
        expect(blocked instanceof UrlTree).toBeTrue();

        authService.getCompanyStatus.and.returnValue('');
        expect(run('company-profile')).toBeTrue();
    });

    it('should normalize exotic status spellings', () => {
        authService.ensureSession.and.returnValue(of({ role: 'MANAGER' }));

        companyService.getMyCompany.and.returnValue(of({ status: ' actif ' }));
        expect(run('fleet')).toBeTrue();

        companyService.getMyCompany.and.returnValue(of({ status: 'suspendu' }));
        const suspended = run('fleet');
        expect(suspended instanceof UrlTree).toBeTrue();

        companyService.getMyCompany.and.returnValue(of({ status: 'unknown-status' }));
        expect(run('company-waiting')).toBeTrue();
    });
});
