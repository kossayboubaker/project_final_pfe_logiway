import { HttpClient, HttpErrorResponse, provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { Subject } from 'rxjs';
import { AuthService } from '../auth.service';
import { tokenInterceptor } from './token.interceptor';

describe('tokenInterceptor', () => {
    let http: HttpClient;
    let ctrl: HttpTestingController;
    let authServiceMock: { refreshToken: jasmine.Spy };
    let refreshSubject: Subject<boolean>;

    beforeEach(() => {
        refreshSubject = new Subject<boolean>();
        authServiceMock = {
            refreshToken: jasmine.createSpy('refreshToken')
                .and.callFake(() => refreshSubject.asObservable())
        };

        TestBed.configureTestingModule({
            providers: [
                provideHttpClient(withInterceptors([tokenInterceptor])),
                provideHttpClientTesting(),
                { provide: AuthService, useValue: authServiceMock }
            ]
        });

        http = TestBed.inject(HttpClient);
        ctrl = TestBed.inject(HttpTestingController);
    });

    afterEach(() => ctrl.verify());

    it('laisse passer les endpoints publics sans tenter de refresh', () => {
        const events: any[] = [];
        http.post('/api/auth/login', {}).subscribe(r => events.push(r));

        ctrl.expectOne('/api/auth/login').flush({ token: 'x' });

        expect(events.length).toBe(1);
        expect(authServiceMock.refreshToken).not.toHaveBeenCalled();
    });

    it('retransmet l\u2019erreur 401 d\u2019un endpoint public sans refresh', () => {
        const errors: any[] = [];
        http.post('/api/auth/verify-email', {}).subscribe({ error: e => errors.push(e) });

        ctrl.expectOne('/api/auth/verify-email').flush({}, { status: 401, statusText: 'Unauthorized' });

        expect((errors[0] as HttpErrorResponse).status).toBe(401);
        expect(authServiceMock.refreshToken).not.toHaveBeenCalled();
    });

    it('rejoue la requête protégée après un refresh réussi', () => {
        const results: any[] = [];
        http.get('/api/protected').subscribe(r => results.push(r));

        ctrl.expectOne('/api/protected').flush({}, { status: 401, statusText: 'Unauthorized' });
        expect(authServiceMock.refreshToken).toHaveBeenCalled();

        refreshSubject.next(true);

        ctrl.expectOne('/api/protected').flush({ ok: true });
        expect(results).toEqual([{ ok: true }]);
    });

    it('échoue avec un message de reconnexion quand le refresh renvoie false', () => {
        const errors: any[] = [];
        http.get('/api/protected').subscribe({ error: e => errors.push(e) });

        ctrl.expectOne('/api/protected').flush({}, { status: 401, statusText: 'Unauthorized' });
        refreshSubject.next(false);

        expect(String(errors[0].message)).toContain('Token refresh failed');
    });

    it('retourne \u00ab Token refresh failed \u00bb quand le refresh plante', () => {
        const errors: any[] = [];
        http.get('/api/protected').subscribe({ error: e => errors.push(e) });

        ctrl.expectOne('/api/protected').flush({}, { status: 401, statusText: 'Unauthorized' });
        refreshSubject.error(new Error('boom'));

        expect(String(errors[0].message)).toContain('Token refresh failed');
    });

    it('retransmet les erreurs non-401 sans refresh', () => {
        const errors: any[] = [];
        http.get('/api/protected').subscribe({ error: e => errors.push(e) });

        ctrl.expectOne('/api/protected').flush({}, { status: 500, statusText: 'Server Error' });

        expect((errors[0] as HttpErrorResponse).status).toBe(500);
        expect(authServiceMock.refreshToken).not.toHaveBeenCalled();
    });

    it('met en file la seconde requête pendant un refresh puis rejoue les deux', () => {
        const resultsA: any[] = [];
        const resultsB: any[] = [];

        http.get('/api/queue').subscribe(r => resultsA.push(r));
        ctrl.expectOne('/api/queue').flush({}, { status: 401, statusText: 'Unauthorized' });

        http.get('/api/queue').subscribe(r => resultsB.push(r));
        ctrl.expectOne('/api/queue').flush({}, { status: 401, statusText: 'Unauthorized' });

        refreshSubject.next(true);

        const retried = ctrl.match('/api/queue');
        expect(retried.length).toBe(2);

        retried[0].flush({ who: 'B' });
        retried[1].flush({ who: 'A' });

        expect(resultsA).toEqual([{ who: 'A' }]);
        expect(resultsB).toEqual([{ who: 'B' }]);
    });
});
