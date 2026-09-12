import { HttpClient, provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter, Router } from '@angular/router';
import { TestBed } from '@angular/core/testing';
import { AuthService } from '../auth.service';
import { errorInterceptor } from './error.interceptor';

describe('errorInterceptor', () => {
    let http: HttpClient;
    let ctrl: HttpTestingController;
    let navigations: any[];
    let authServiceMock: { getUser: jasmine.Spy };

    beforeEach(() => {
        authServiceMock = { getUser: jasmine.createSpy('getUser').and.returnValue(null) };

        TestBed.configureTestingModule({
            providers: [
                provideRouter([]),
                provideHttpClient(withInterceptors([errorInterceptor])),
                provideHttpClientTesting(),
                { provide: AuthService, useValue: authServiceMock }
            ]
        });

        http = TestBed.inject(HttpClient);
        ctrl = TestBed.inject(HttpTestingController);
        navigations = [];
        spyOn(TestBed.inject(Router), 'navigate').and.callFake((cmds: any) => {
            navigations.push(cmds);
            return Promise.resolve(true) as any;
        });
    });

    afterEach(() => ctrl.verify());

    it('laisse passer les requêtes sans erreur', () => {
        const emitted: any[] = [];
        http.get('/api/trips').subscribe(r => emitted.push(r));

        ctrl.expectOne('/api/trips').flush({ ok: true });

        expect(emitted).toEqual([{ ok: true }]);
        expect(navigations.length).toBe(0);
    });

    it('redirige vers /auth/signin sur 401 hors route d\u2019authentification', () => {
        authServiceMock.getUser.and.returnValue({ id: '1', role: 'DRIVER' });
        const errors: any[] = [];
        http.get('/api/trips').subscribe({ error: e => errors.push(e) });

        ctrl.expectOne('/api/trips').flush({}, { status: 401, statusText: 'Unauthorized' });

        expect(navigations).toContainEqual(['/auth/signin']);
        expect(errors[0].status).toBe(401);
    });

    it('ne redirige pas sur 401 pour une route d\u2019authentification', () => {
        authServiceMock.getUser.and.returnValue({ id: '1', role: 'DRIVER' });
        const errors: any[] = [];
        http.post('/api/auth/login', {}).subscribe({ error: e => errors.push(e) });

        ctrl.expectOne('/api/auth/login').flush({}, { status: 401, statusText: 'Unauthorized' });

        expect(navigations.length).toBe(0);
        expect(errors[0].status).toBe(401);
    });

    it('ne redirige pas sur 401 sans utilisateur connecté', () => {
        const errors: any[] = [];
        http.get('/api/trips').subscribe({ error: e => errors.push(e) });

        ctrl.expectOne('/api/trips').flush({}, { status: 401, statusText: 'Unauthorized' });

        expect(navigations.length).toBe(0);
        expect(errors[0].status).toBe(401);
    });

    it('redirige selon le rôle sur 403 (SUPERADMIN / MANAGER / défaut)', () => {
        authServiceMock.getUser.and.returnValues(
            { role: 'SUPERADMIN' }, { role: 'MANAGER' }, { role: 'DRIVER' }
        );

        for (let i = 0; i < 3; i++) {
            const errors: any[] = [];
            http.get(`/api/secure-${i}`).subscribe({ error: e => errors.push(e) });
            ctrl.expectOne(`/api/secure-${i}`).flush({}, { status: 403, statusText: 'Forbidden' });
            expect(errors[0].status).toBe(403);
        }

        expect(navigations.length).toBe(3);
        expect(navigations[0]).toEqual(['/dashboard/superadmin']);
        expect(navigations[1]).toEqual(['/dashboard/manager']);
        expect(navigations[2]).toEqual(['/dashboard/driver']);
    });

    it('ignore le 403 sur une route d\u2019authentification', () => {
        authServiceMock.getUser.and.returnValue({ role: 'SUPERADMIN' });
        const errors: any[] = [];
        http.post('/api/auth/refresh', {}).subscribe({ error: e => errors.push(e) });

        ctrl.expectOne('/api/auth/refresh').flush({}, { status: 403, statusText: 'Forbidden' });

        expect(navigations.length).toBe(0);
        expect(errors[0].status).toBe(403);
    });
});
