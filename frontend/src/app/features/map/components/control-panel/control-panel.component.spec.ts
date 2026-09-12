import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MapControlPanelComponent } from './control-panel.component';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';

describe('MapControlPanelComponent', () => {
    let component: MapControlPanelComponent;
    let fixture: ComponentFixture<MapControlPanelComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [MapControlPanelComponent, NoopAnimationsModule]
        }).compileComponents();

        fixture = TestBed.createComponent(MapControlPanelComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('expose les trois styles de carte', () => {
        expect(component.styles).toEqual([
            { value: 'standard', label: 'Standard' },
            { value: 'satellite', label: 'Satellite' },
            { value: 'terrain', label: 'Terrain' }
        ]);
    });

    it('onStyleChange émet le style choisi', () => {
        let received: string | undefined;
        component.styleChange.subscribe(s => (received = s));
        component.onStyleChange('satellite');
        expect(received).toBe('satellite');
    });

    it('onPoiToggle émet type et état coché', () => {
        let received: { type: string, checked: boolean } | undefined;
        component.poiToggle.subscribe(p => (received = p));
        component.onPoiToggle('fuel', { checked: true });
        expect(received).toEqual({ type: 'fuel', checked: true });
        component.onPoiToggle('parking', { checked: false });
        expect(received).toEqual({ type: 'parking', checked: false });
    });

    it('onFollowToggle émet l\u2019état de suivi', () => {
        let received: boolean | undefined;
        component.followToggle.subscribe(v => (received = v));
        component.onFollowToggle({ checked: true });
        expect(received).toBe(true);
    });

    it('onShare, onPrint et onClose émettent leurs événements', () => {
        const order: string[] = [];
        component.share.subscribe(() => order.push('share'));
        component.print.subscribe(() => order.push('print'));
        component.close.subscribe(() => order.push('close'));

        component.onShare();
        component.onPrint();
        component.onClose();
        expect(order).toEqual(['share', 'print', 'close']);
    });
});
