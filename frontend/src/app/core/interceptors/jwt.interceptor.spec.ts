import { HttpClient, provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { AuthService } from '../auth.service';
import { jwtInterceptor } from './jwt.interceptor';

describe('jwtInterceptor', () => {
    let http: HttpClient;
    let ctrl: HttpTestingController;
    let authServiceMock: { getToken: jasmine.Spy };

    beforeEach(() => {
        authServiceMock = { getToken: jasmine.createSpy('getToken').and.returnValue(null) };

        TestBed.configureTestingModule({
            providers: [
                provideHttpClient(withInterceptors([jwtInterceptor])),
                provideHttpClientTesting(),
                { provide: AuthService, useValue: authServiceMock }
            ]
        });

        http = TestBed.inject(HttpClient);
        ctrl = TestBed.inject(HttpTestingController);
    });

    afterEach(() => ctrl.verify());

    it('laisse la requête inchangée sans token', () => {
        http.get('/api/data').subscribe();

        const req = ctrl.expectOne('/api/data');
        expect(req.request.headers.has('Authorization')).toBeFalse();

        req.flush({});
        expect(authServiceMock.getToken).toHaveBeenCalled();
    });

    it('ajoute le header Bearer quand un token existe', () => {
        authServiceMock.getToken.and.returnValue('tok-123');

        http.get('/api/data').subscribe();

        const req = ctrl.expectOne('/api/data');
        expect(req.request.headers.get('Authorization')).toBe('Bearer tok-123');

        req.flush({});
    });
});
