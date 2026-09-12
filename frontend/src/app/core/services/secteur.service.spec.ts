import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { Secteur } from '../../models/project.models';
import { SecteurService } from './secteur.service';

describe('SecteurService', () => {
    let service: SecteurService;
    let httpMock: HttpTestingController;
    const apiUrl = 'http://localhost:8080/api/secteurs';

    const mkSecteur = (id: number): Secteur =>
        ({ id, nom: `Secteur ${id}` } as Secteur);

    beforeEach(() => {
        TestBed.configureTestingModule({
            providers: [provideHttpClient(), provideHttpClientTesting()]
        });
        service = TestBed.inject(SecteurService);
        httpMock = TestBed.inject(HttpTestingController);
    });

    afterEach(() => httpMock.verify());

    it('getAllSecteurs fait un GET sur la collection', () => {
        const payload = [mkSecteur(1), mkSecteur(2)];
        let result: Secteur[] | undefined;

        service.getAllSecteurs().subscribe(r => (result = r));
        const req = httpMock.expectOne(apiUrl);

        expect(req.request.method).toBe('GET');
        req.flush(payload);
        expect(result).toEqual(payload);
    });

    it('getSectorById cible l\u2019identifiant fourni', () => {
        service.getSectorById(7).subscribe();
        const req = httpMock.expectOne(`${apiUrl}/7`);

        expect(req.request.method).toBe('GET');
        req.flush(mkSecteur(7));
    });

    it('createSecteur poste le corps complet', () => {
        const nouveau = mkSecteur(0);
        service.createSecteur(nouveau).subscribe();

        const req = httpMock.expectOne(apiUrl);

        expect(req.request.method).toBe('POST');
        expect(req.request.body).toEqual(nouveau);
        req.flush(mkSecteur(9));
    });

    it('updateSecteur fait un PUT avec le corps', () => {
        const modifie = mkSecteur(3);
        service.updateSecteur(3, modifie).subscribe();

        const req = httpMock.expectOne(`${apiUrl}/3`);

        expect(req.request.method).toBe('PUT');
        expect(req.request.body).toEqual(modifie);
        req.flush(modifie);
    });

    it('deleteSecteur supprime par id', () => {
        let done: boolean | undefined;
        service.deleteSecteur(5).subscribe(() => (done = true));
        const req = httpMock.expectOne(`${apiUrl}/5`);

        expect(req.request.method).toBe('DELETE');
        req.flush(null);
        expect(done).toBeTrue();
    });

    it('assignChauffeurToSecteur construit l\u2019URL d\u2019affectation', () => {
        service.assignChauffeurToSecteur(1, 22).subscribe();
        const req = httpMock.expectOne(`${apiUrl}/1/chauffeur/22`);

        expect(req.request.method).toBe('PUT');
        expect(req.request.body).toEqual({});
        req.flush({});
    });

    it('assignManagerToSecteur construit l\u2019URL d\u2019affectation', () => {
        service.assignManagerToSecteur(2, 33).subscribe();
        const req = httpMock.expectOne(`${apiUrl}/2/manager/33`);

        expect(req.request.method).toBe('PUT');
        expect(req.request.body).toEqual({});
        req.flush({});
    });
});
