import { ComponentFixture, TestBed } from '@angular/core/testing';
import { TruckCardComponent } from './truck-card.component';

describe('TruckCardComponent', () => {
    let component: TruckCardComponent;
    let fixture: ComponentFixture<TruckCardComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [TruckCardComponent]
        }).compileComponents();

        fixture = TestBed.createComponent(TruckCardComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
