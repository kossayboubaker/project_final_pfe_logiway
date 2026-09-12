import { ComponentFixture, TestBed } from '@angular/core/testing';
import { DeliveryCardComponent } from './delivery-card.component';

describe('DeliveryCardComponent', () => {
    let component: DeliveryCardComponent;
    let fixture: ComponentFixture<DeliveryCardComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [DeliveryCardComponent]
        })
            .compileComponents();

        fixture = TestBed.createComponent(DeliveryCardComponent);
        component = fixture.componentInstance;
        component.truck = { id: 'test', name: 'Test Truck', status: 'En cours' };
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('isActive should default to false', () => {
        expect(component.isActive).toBeFalse();
    });

    it('onCardClick() should emit the truck id', () => {
        const emitted: string[] = [];
        component.select.subscribe((id: string) => emitted.push(id));
        component.onCardClick();
        expect(emitted).toEqual(['test']);
    });

    it('onCardClick() should emit the correct id when truck id changes', () => {
        component.truck = { id: 'truck-99', name: 'Another Truck', status: 'Libre' };
        const emitted: string[] = [];
        component.select.subscribe((id: string) => emitted.push(id));
        component.onCardClick();
        expect(emitted).toEqual(['truck-99']);
    });

    it('isActive input should be settable to true', () => {
        component.isActive = true;
        expect(component.isActive).toBeTrue();
    });
});
