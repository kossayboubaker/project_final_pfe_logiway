import { TestBed } from '@angular/core/testing';
import { ActivatedRouteSnapshot, RouterStateSnapshot, UrlTree, provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { roleGuard } from './role.guard';
import { AuthService } from '../auth.service';

describe('roleGuard', () => {
    let authService: any;

    const route = (roles: string[] | undefined) =>
        ({ data: roles === undefined ? undefined : { roles } } as unknown as ActivatedRouteSnapshot);
    const state = {} as RouterStateSnapshot;

    const run = (roles: string[] | undefined) => {
        const results: Array<boolean | UrlTree> = [];
        const result$: any = TestBed.runInInjectionContext(() => roleGuard(route(roles), state));
        result$.subscribe((res: any) => results.push(res));
        return results[0];
    };

    beforeEach(() => {
        authService = { ensureSession: jasmine.createSpy('ensureSession') };

        TestBed.configureTestingModule({
            providers: [
                provideRouter([]),
                { provide: AuthService, useValue: authService }
            ]
        });
    });

    it('should redirect to signin without a session', () => {
        authService.ensureSession.and.returnValue(of(null));

        const result = run(['MANAGER']);

        expect(result instanceof UrlTree).toBeTrue();
        expect((result as UrlTree).toString()).toBe('/auth/signin');
    });

    it('should allow access when the route declares no roles', () => {
        authService.ensureSession.and.returnValue(of({ role: 'CHAUFFEUR' }));

        expect(run(undefined)).toBeTrue();
        expect(run([])).toBeTrue();
    });

    it('should allow access when the user role is expected', () => {
        authService.ensureSession.and.returnValue(of({ role: 'MANAGER' }));

        expect(run(['SUPERADMIN', 'MANAGER'])).toBeTrue();
    });

    it('should redirect a superadmin to its own dashboard when unauthorized', () => {
        authService.ensureSession.and.returnValue(of({ role: 'SUPERADMIN' }));

        const result = run(['MANAGER']);

        expect(result instanceof UrlTree).toBeTrue();
        expect((result as UrlTree).toString()).toBe('/dashboard/superadmin');
    });

    it('should redirect a manager to its own dashboard when unauthorized', () => {
        authService.ensureSession.and.returnValue(of({ role: 'MANAGER' }));

        const result = run(['SUPERADMIN']);

        expect((result as UrlTree).toString()).toBe('/dashboard/manager');
    });

    it('should redirect any other role to the driver dashboard', () => {
        authService.ensureSession.and.returnValue(of({ role: 'CHAUFFEUR' }));

        const result = run(['MANAGER']);

        expect((result as UrlTree).toString()).toBe('/dashboard/driver');
    });
});
