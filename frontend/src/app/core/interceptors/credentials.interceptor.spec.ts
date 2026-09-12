import { HttpClient, provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { credentialsInterceptor } from './credentials.interceptor';

describe('credentialsInterceptor', () => {
    beforeEach(() => {
        TestBed.configureTestingModule({
            providers: [
                provideHttpClient(withInterceptors([credentialsInterceptor])),
                provideHttpClientTesting()
            ]
        });
    });

    afterEach(() => {
        TestBed.inject(HttpTestingController).verify();
    });

    it('clone chaque requête avec withCredentials à true', () => {
        TestBed.inject(HttpClient).get('/api/test').subscribe();

        const req = TestBed.inject(HttpTestingController).expectOne('/api/test');
        expect(req.request.withCredentials).toBeTrue();

        req.flush({});
    });

    it('conserve le corps et la méthode d\u2019origine', () => {
        TestBed.inject(HttpClient).post('/api/save', { a: 1 }).subscribe();

        const req = TestBed.inject(HttpTestingController).expectOne('/api/save');
        expect(req.request.method).toBe('POST');
        expect(req.request.body).toEqual({ a: 1 });
        expect(req.request.withCredentials).toBeTrue();

        req.flush({});
    });
});
