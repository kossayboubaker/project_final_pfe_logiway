import { ComponentFixture, TestBed } from '@angular/core/testing';
import { DeliveryListComponent } from './delivery-list.component';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';

describe('DeliveryListComponent', () => {
    let component: DeliveryListComponent;
    let fixture: ComponentFixture<DeliveryListComponent>;

    const mkTruck = (over: Record<string, unknown> = {}) => ({
        id: 'T1', name: 'Camion 1', driver: 'Ali', status: 'En cours', hasAlert: false, ...over
    });

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [DeliveryListComponent, NoopAnimationsModule]
        }).compileComponents();

        fixture = TestBed.createComponent(DeliveryListComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    afterEach(() => {
        jest.useRealTimers();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    describe('counts', () => {
        it('calcule les compteurs par statut et alertes', () => {
            component.trucks = [
                mkTruck({ id: 'A', status: 'En cours' }),
                mkTruck({ id: 'B', status: 'En cours', hasAlert: true }),
                mkTruck({ id: 'C', status: 'Arrivé' }),
                mkTruck({ id: 'D', status: 'Arrivé', hasAlert: true }),
                mkTruck({ id: 'E', status: 'Autre' })
            ];
            expect(component.counts).toEqual({ total: 5, enRoute: 2, arrived: 2, alerts: 2 });
        });

        it('retourne des zéros sans camions', () => {
            component.trucks = null as any;
            expect(component.counts).toEqual({ total: 0, enRoute: 0, arrived: 0, alerts: 0 });
        });
    });

    describe('filteredTrucks', () => {
        beforeEach(() => {
            component.trucks = [
                mkTruck({ id: 'T1', name: 'Renault', driver: 'Ali', status: 'En cours', hasAlert: false }),
                mkTruck({ id: 'T2', name: 'Iveco', driver: 'Sami', status: 'Arrivé', hasAlert: true }),
                mkTruck({ id: 'T3', name: 'Volvo', driver: 'Moez', status: 'En cours', hasAlert: true })
            ];
        });

        it('liste vide sans camions', () => {
            component.trucks = null as any;
            expect(component.filteredTrucks).toEqual([]);
        });

        it('filtre par type en-route / arrived / alerts', () => {
            component.filterType = 'en-route';
            expect(component.filteredTrucks.map(t => t.id)).toEqual(['T1', 'T3']);

            component.filterType = 'arrived';
            expect(component.filteredTrucks.map(t => t.id)).toEqual(['T2']);

            component.filterType = 'alerts';
            expect(component.filteredTrucks.map(t => t.id)).toEqual(['T2', 'T3']);

            component.filterType = 'all';
            expect(component.filteredTrucks.length).toBe(3);
        });

        it('filtre par recherche insensible à la casse sur plusieurs champs', () => {
            component.searchQuery = 'ALI';
            expect(component.filteredTrucks.map(t => t.id)).toEqual(['T1']);

            component.searchQuery = 'iveco';
            expect(component.filteredTrucks.map(t => t.id)).toEqual(['T2']);

            component.searchQuery = 't3';
            expect(component.filteredTrucks.map(t => t.id)).toEqual(['T3']);

            component.searchQuery = 'arrivé';
            expect(component.filteredTrucks.map(t => t.id)).toEqual(['T2']);
        });

        it('combine filtre de type et recherche, ignore les champs absents', () => {
            component.trucks.push(mkTruck({ id: 'T4', name: '', driver: undefined, status: undefined }));
            component.setFilter('en-route');
            component.searchQuery = 't4';
            expect(component.filteredTrucks.map(t => t.id)).toEqual([]);
        });
    });

    describe('pagination', () => {
        beforeEach(() => {
            component.trucks = Array.from({ length: 7 }, (_, i) => mkTruck({ id: `K${i + 1}` }));
            component.currentPage = 1;
        });

        it('paginatedTrucks découpe selon pageSize=2', () => {
            expect(component.paginatedTrucks.map(t => t.id)).toEqual(['K1', 'K2']);
            component.goToPage(4);
            expect(component.paginatedTrucks.map(t => t.id)).toEqual(['K7']);
        });

        it('totalPages minimum 1', () => {
            component.trucks = [];
            expect(component.totalPages).toBe(1);
        });

        it('goToPage respecte les bornes', () => {
            component.goToPage(0);
            expect(component.currentPage).toBe(1);
            component.goToPage(99);
            expect(component.currentPage).toBe(1);
            component.goToPage(3);
            expect(component.currentPage).toBe(3);
        });

        it('nextPage et prevPage bornés', () => {
            component.nextPage();
            expect(component.currentPage).toBe(2);
            component.prevPage();
            expect(component.currentPage).toBe(1);
            component.prevPage();
            expect(component.currentPage).toBe(1);

            component.goToPage(component.totalPages);
            component.nextPage();
            expect(component.currentPage).toBe(component.totalPages);
        });

        it('pageNumbers fenêtre glissante au milieu', () => {
            component.goToPage(2);
            expect(component.pageNumbers).toEqual([1, 2, 3, 4]);
        });

        it('validatePaginationBounds ramène currentPage dans les limites', () => {
            component.currentPage = 9;
            component.ngOnChanges({ trucks: { currentValue: component.trucks } as any });
            expect(component.currentPage).toBe(4);
        });

        it('ngOnChanges sans trucks ne valide pas', () => {
            component.currentPage = 9;
            component.ngOnChanges({});
            expect(component.currentPage).toBe(9);
        });
    });

    describe('recherche', () => {
        it('onSearchInput applique la valeur après debounce de 200ms', async () => {
            jest.useFakeTimers();
            component.onSearchInput('camion');
            expect(component.searchQuery).not.toBe('camion');
            await jest.advanceTimersByTimeAsync(200);
            expect(component.searchQuery).toBe('camion');
            expect(component.currentPage).toBe(1);
        });

        it('un nouvel input annule le timer précédent', async () => {
            jest.useFakeTimers();
            component.onSearchInput('premier');
            await jest.advanceTimersByTimeAsync(150);
            component.onSearchInput('second');
            await jest.advanceTimersByTimeAsync(200);
            expect(component.searchQuery).toBe('second');
        });

        it('clearSearch réinitialise la requête et la page', async () => {
            jest.useFakeTimers();
            component.onSearchInput('xyz');
            await jest.advanceTimersByTimeAsync(200);
            component.goToPage(2);

            component.clearSearch();
            expect(component.searchQuery).toBe('');
            expect(component.currentPage).toBe(1);

            await jest.advanceTimersByTimeAsync(300);
            expect(component.searchQuery).toBe('');
        });

        it('le setter searchQuery tolère null', () => {
            component.searchQuery = null as any;
            expect(component.searchQuery).toBe('');
        });
    });

    describe('actions', () => {
        it('setFilter change le filtre et remet la page à 1', () => {
            component.goToPage(3);
            component.setFilter('alerts');
            expect(component.filterType).toBe('alerts');
            expect(component.currentPage).toBe(1);
        });

        it('onTruckSelect émet selectTruck', () => {
            let received: string | undefined;
            component.selectTruck.subscribe(id => (received = id));
            component.onTruckSelect('T42');
            expect(received).toBe('T42');
        });

        it('onClose émet close', () => {
            let closed = false;
            component.close.subscribe(() => (closed = true));
            component.onClose();
            expect(closed).toBe(true);
        });
    });
});
