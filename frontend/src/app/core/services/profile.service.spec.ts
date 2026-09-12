import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { ProfileService } from './profile.service';

describe('ProfileService', () => {
    let service: ProfileService;
    let httpMock: HttpTestingController;
    const base = 'http://localhost:8080/api/profile/me';

    beforeEach(() => {
        TestBed.configureTestingModule({
            providers: [provideHttpClient(), provideHttpClientTesting()]
        });
        service = TestBed.inject(ProfileService);
        httpMock = TestBed.inject(HttpTestingController);
    });

    afterEach(() => httpMock.verify());

    it('getCurrentProfile GET le profil courant', () => {
        let result: any;
        service.getCurrentProfile().subscribe(r => (result = r));

        const req = httpMock.expectOne(base);
        expect(req.request.method).toBe('GET');
        req.flush({ id: 1 });
        expect(result).toEqual({ id: 1 });
    });

    it('updateCurrentProfile PUT le payload', () => {
        const payload = { prenom: 'Ali', telephone: '123' };
        service.updateCurrentProfile(payload).subscribe();

        const req = httpMock.expectOne(base);
        expect(req.request.method).toBe('PUT');
        expect(req.request.body).toEqual(payload);
        req.flush({});
    });

    it('changePassword PUT sur /password', () => {
        const payload = { oldPassword: 'a', newPassword: 'b' };
        service.changePassword(payload).subscribe();

        const req = httpMock.expectOne(`${base}/password`);
        expect(req.request.method).toBe('PUT');
        expect(req.request.body).toEqual(payload);
        req.flush({ message: 'ok' });
    });

    it('getDriverDashboard GET /dashboard avec withCredentials', () => {
        service.getDriverDashboard().subscribe();

        const req = httpMock.expectOne(`${base}/dashboard`);
        expect(req.request.method).toBe('GET');
        expect(req.request.withCredentials).toBeTrue();
        req.flush({});
    });

    it('getDriverTrips applique les paramètres par défaut', () => {
        service.getDriverTrips().subscribe();

        const req = httpMock.expectOne(`${base}/trajets?page=0&size=50`);
        expect(req.request.withCredentials).toBeTrue();
        req.flush({});
    });

    it('getDriverTrips encode page/size/statut', () => {
        service.getDriverTrips(2, 25, 'EN COURS').subscribe();

        httpMock.expectOne(`${base}/trajets?page=2&size=25&statut=EN%20COURS`).flush({});
    });

    it('getDriverTrips omet statut quand absent', () => {
        service.getDriverTrips(0, 10).subscribe();

        httpMock.expectOne(`${base}/trajets?page=0&size=10`).flush({});
    });
});
