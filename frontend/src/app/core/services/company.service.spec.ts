import { of, throwError } from 'rxjs';
import { CompanyService } from './company.service';

describe('CompanyService', () => {
    let http: any;
    let authService: any;
    let service: CompanyService;

    const apiCompany = (overrides: Record<string, unknown> = {}) => ({
        id: 4,
        nomEntreprise: 'Alpha Transport',
        emailEntreprise: null,
        adresseEntreprise: null,
        numeroEntreprise: null,
        codeTVA: null,
        representantLegal: null,
        documentJustificatif: null,
        secteurActivite: null,
        image: null,
        tailleFlotte: null,
        statut: undefined,
        managerOwnerId: null,
        managerOwnerName: null,
        dateCreation: '2024-03-05T00:00:00.000Z',
        activeMissions: null,
        ...overrides
    });

    const companies = () => (service as any).companiesSubject.value as any[];

    beforeEach(() => {
        http = {
            get: jasmine.createSpy('get'),
            post: jasmine.createSpy('post'),
            put: jasmine.createSpy('put'),
            delete: jasmine.createSpy('delete')
        };
        authService = { setCompanyStatus: jasmine.createSpy('setCompanyStatus') };
        service = new CompanyService(http, authService);
    });

    it('should map API responses and refresh the local list', () => {
        http.get.and.returnValue(of([apiCompany()]));

        const result = service.getCompanies();

        let received: any;
        result.subscribe(value => received = value);
        expect(http.get).toHaveBeenCalledWith('http://localhost:8080/api/entreprises');
        expect(received[0]).toEqual(jasmine.objectContaining({
            id: '4',
            name: 'Alpha Transport',
            address: '',
            sector: 'Logistique',
            fleetSize: 0,
            activeMissions: 0,
            status: 'Actif',
            joinDate: '2024-03-05',
            email: '',
            number: '',
            codeTVA: '',
            representantLegal: '',
            documentJustificatif: '',
            image: '',
            managerId: null,
            managerName: null,
            managerOwnerId: null,
            managerOwnerName: null
        }));
        expect(companies().length).toBe(1);
    });

    it('should map every status variant coming from the API', () => {
        http.get.and.returnValue(of([
            apiCompany({ id: 1, statut: 'INACTIF' }),
            apiCompany({ id: 2, statut: 'EN_ATTENTE' }),
            apiCompany({ id: 3, statut: 'SUSPENDU' })
        ]));

        service.getCompanies().subscribe();

        expect(companies().map(c => c.status)).toEqual(['Inactif', 'En Attente', 'Suspendu']);
    });

    it('should fall back to the current list when loading fails', () => {
        http.get.and.returnValue(throwError(() => new Error('network')));

        let received: any;
        service.getCompanies().subscribe(value => received = value);

        expect(received.length).toBe(3);
        expect(received.map((c: any) => c.name)).toContain('TransExpress Maghreb');
    });

    it('should load my company and propagate its status to auth', () => {
        http.get.and.returnValue(of(apiCompany({ id: 8, statut: 'ACTIF' })));

        let received: any;
        service.getMyCompany().subscribe(value => received = value);

        expect(http.get).toHaveBeenCalledWith('http://localhost:8080/api/entreprises/me');
        expect(received.id).toBe('8');
        expect(authService.setCompanyStatus).toHaveBeenCalledWith('ACTIF');
    });

    it('should reset the company status when no company exists', () => {
        http.get.and.returnValue(of(null));

        let received: any;
        service.getMyCompany().subscribe(value => received = value);

        expect(received).toBeNull();
        expect(authService.setCompanyStatus).toHaveBeenCalledWith('NONE');
    });

    it('should return null silently when my company cannot be loaded', () => {
        http.get.and.returnValue(throwError(() => new Error('boom')));

        let received: any;
        service.getMyCompany().subscribe(value => received = value);

        expect(received).toBeNull();
        expect(authService.setCompanyStatus).not.toHaveBeenCalled();
    });

    it('should create a company with a fully mapped payload', () => {
        http.post.and.returnValue(of(apiCompany({ id: 42, nomEntreprise: 'Beta', statut: 'ACTIF' })));

        let created: any;
        service.createCompany({
            name: 'Beta',
            address: 'Rue A',
            sector: 'Transport',
            fleetSize: 6,
            status: 'Actif',
            managerId: 7,
            email: 'b@x.tn',
            number: '+216',
            codeTVA: 'TVA1',
            representantLegal: 'RL',
            documentJustificatif: 'doc.pdf',
            image: 'img.png'
        }).subscribe(value => created = value);

        expect(http.post).toHaveBeenCalledWith(
            'http://localhost:8080/api/entreprises',
            jasmine.objectContaining({
                nomEntreprise: 'Beta',
                adresseEntreprise: 'Rue A',
                secteurActivite: 'Transport',
                tailleFlotte: 6,
                statut: 'ACTIF',
                managerOwnerId: 7,
                emailEntreprise: 'b@x.tn',
                numeroEntreprise: '+216',
                codeTVA: 'TVA1',
                representantLegal: 'RL',
                documentJustificatif: 'doc.pdf',
                image: 'img.png'
            })
        );
        expect(created.id).toBe('42');
        expect(companies()[0].id).toBe('42');
        expect(authService.setCompanyStatus).toHaveBeenCalledWith('ACTIF');
    });

    it('should omit optional fields in the payload when absent', () => {
        http.post.and.returnValue(of(apiCompany({ id: 43 })));

        service.createCompany({ name: 'Gamma' }).subscribe();

        const sent = http.post.calls.mostRecent().args[1];
        expect(sent.statut).toBeUndefined();
        expect(sent.managerOwnerId).toBeUndefined();
    });

    it('should update a company in place', () => {
        http.put.and.returnValue(of(apiCompany({
            id: 2,
            nomEntreprise: 'LogiLogistics S.A v2',
            statut: 'INACTIF'
        })));

        let updated: any;
        service.updateCompany('2', { name: 'LogiLogistics S.A v2', status: 'Inactif' })
            .subscribe(value => updated = value);

        expect(http.put).toHaveBeenCalledWith(
            'http://localhost:8080/api/entreprises/2',
            jasmine.objectContaining({ nomEntreprise: 'LogiLogistics S.A v2', statut: 'INACTIF' })
        );
        expect(updated.name).toBe('LogiLogistics S.A v2');
        expect(companies().length).toBe(3);
        expect(companies()[1].name).toBe('LogiLogistics S.A v2');
        expect(authService.setCompanyStatus).toHaveBeenCalledWith('INACTIF');
    });

    it('should delegate status updates to updateCompany', () => {
        http.put.and.returnValue(of(apiCompany({ id: 1, statut: 'SUSPENDU' })));

        let updated: any;
        service.updateCompanyStatus('1', 'Suspendu').subscribe(value => updated = value);

        expect(updated.status).toBe('Suspendu');
    });

    it('should delete a company locally and report success', () => {
        http.delete.and.returnValue(of(undefined));

        let result: any;
        service.deleteCompany('3').subscribe(value => result = value);

        expect(http.delete).toHaveBeenCalledWith('http://localhost:8080/api/entreprises/3');
        expect(result).toEqual({ success: true, message: 'L\'entreprise a été supprimée.' });
        expect(companies().map(c => c.id)).toEqual(['1', '2']);
        expect(authService.setCompanyStatus).toHaveBeenCalledWith('NONE');
    });

    it('should report failure when deletion fails', () => {
        http.delete.and.returnValue(throwError(() => new Error('locked')));

        let result: any;
        service.deleteCompany('1').subscribe(value => result = value);

        expect(result.success).toBeFalse();
        expect(result.message).toBe('Impossible de supprimer cette entreprise.');
        expect(companies().length).toBe(3);
    });

    it('should update through saveMyCompany when a company already exists', () => {
        http.get.and.returnValue(of(apiCompany({ id: 2, statut: 'ACTIF' })));
        http.put.and.returnValue(of(apiCompany({ id: 2, nomEntreprise: 'Renamed', statut: 'ACTIF' })));

        let saved: any;
        service.saveMyCompany({ name: 'Renamed' }).subscribe(value => saved = value);

        expect(http.post).not.toHaveBeenCalled();
        expect(saved.name).toBe('Renamed');
    });

    it('should create through saveMyCompany when no company exists yet', () => {
        http.get.and.returnValue(of(null));
        http.post.and.returnValue(of(apiCompany({ id: 77, nomEntreprise: 'New Co', statut: 'ACTIF' })));

        let saved: any;
        service.saveMyCompany({ name: 'New Co' }).subscribe(value => saved = value);

        expect(http.post).toHaveBeenCalled();
        expect(saved.id).toBe('77');
    });

    it('should clear the company owner and refresh the local entry', () => {
        http.put.and.returnValue(of(apiCompany({ id: 55, managerOwnerId: null })));

        let cleared: any;
        service.clearCompanyOwner('55').subscribe(value => cleared = value);

        expect(http.put).toHaveBeenCalledWith(
            'http://localhost:8080/api/entreprises/55/clear-owner',
            {}
        );
        expect(cleared.managerId).toBeNull();
        expect(companies()[0].id).toBe('55');
    });
});
