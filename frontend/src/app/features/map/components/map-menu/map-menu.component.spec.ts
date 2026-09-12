import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MapMenuComponent } from './map-menu.component';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';

describe('MapMenuComponent', () => {
    let component: MapMenuComponent;
    let fixture: ComponentFixture<MapMenuComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [MapMenuComponent, NoopAnimationsModule]
        }).compileComponents();

        fixture = TestBed.createComponent(MapMenuComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('expose les entrées de menu principales et secondaires', () => {
        expect(component.menuItems.map(i => i.id)).toEqual([
            'saved', 'recent', 'contributions', 'location_sharing', 'trips', 'data'
        ]);
        expect(component.secondaryItems.map(i => i.id)).toEqual(['share', 'print']);
    });

    it('onClose émet close', () => {
        let closed = false;
        component.close.subscribe(() => (closed = true));
        component.onClose();
        expect(closed).toBe(true);
    });

    it('onToggleSidebar émet l\u2019état du toggle', () => {
        let received: boolean | undefined;
        component.toggleSidebar.subscribe(v => (received = v));
        component.onToggleSidebar({ checked: false });
        expect(received).toBe(false);
        component.onToggleSidebar({ checked: true });
        expect(received).toBe(true);
    });

    it('onAction émet l\u2019identifiant puis ferme le menu', () => {
        const order: string[] = [];
        component.action.subscribe(id => order.push(`action:${id}`));
        component.close.subscribe(() => order.push('close'));
        component.onAction('trips');
        expect(order).toEqual(['action:trips', 'close']);
    });

    it('clic sur une entrée du menu déclenche action et close', () => {
        const actions: string[] = [];
        let closedCount = 0;
        component.action.subscribe(id => actions.push(id));
        component.close.subscribe(() => closedCount++);

        const items = fixture.nativeElement.querySelectorAll('.menu-item:not(.toggle-item)');
        (items[0] as HTMLElement).click();
        expect(actions).toEqual(['saved']);
        expect(closedCount).toBe(1);

        (items[items.length - 1] as HTMLElement).click();
        expect(actions).toEqual(['saved', 'print']);
        expect(closedCount).toBe(2);
    });

    it('rend les libellés des entrées', () => {
        const el: HTMLElement = fixture.nativeElement;
        expect(el.textContent).toContain('Enregistré');
        expect(el.textContent).toContain('Partager ou intégrer la carte');
        expect(el.textContent).toContain('v1.2.0');
    });
});
