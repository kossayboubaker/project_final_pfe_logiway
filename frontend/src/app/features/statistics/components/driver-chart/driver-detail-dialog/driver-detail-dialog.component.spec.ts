import { ComponentFixture, TestBed } from '@angular/core/testing';
import { DriverDetailDialogComponent, DetailDialogData } from './driver-detail-dialog.component';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';

describe('DriverDetailDialogComponent', () => {
    let component: DriverDetailDialogComponent;
    let fixture: ComponentFixture<DriverDetailDialogComponent>;
    const closeSpy = jasmine.createSpy('close');

    beforeEach(async () => {
        closeSpy.calls.reset();

        await TestBed.configureTestingModule({
            imports: [DriverDetailDialogComponent],
            providers: [
                { provide: MatDialogRef, useValue: { close: closeSpy } },
                {
                    provide: MAT_DIALOG_DATA,
                    useValue: {
                        type: 'driver-row',
                        title: 'Ali Ben',
                        chartLabel: 'Score global',
                        chartValue: 87,
                        details: [
                            { label: 'Véhicule', value: '123 TU 4567', icon: 'local_shipping', color: '#60a5fa' },
                            { label: 'Sans icône', value: '—' },
                            { label: 'Icône sans couleur', value: '2', icon: 'route' }
                        ]
                    } as DetailDialogData
                }
            ]
        }).compileComponents();

        fixture = TestBed.createComponent(DriverDetailDialogComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('affiche titre, statistique de chart et liste de détails', () => {
        const el: HTMLElement = fixture.nativeElement;
        expect(el.querySelector('.dd-title')!.textContent).toContain('Ali Ben');
        expect(el.querySelector('.dd-stat__label')!.textContent).toContain('Score global');
        expect(el.querySelector('.dd-stat__value')!.textContent).toContain('87');
        const items = el.querySelectorAll('.dd-item');
        expect(items.length).toBe(3);
        expect(items[0].querySelector('.dd-item__label')!.textContent).toContain('Véhicule');
        expect(items[0].querySelector('.dd-item__value')!.textContent).toContain('123 TU 4567');
    });

    it('masque la statistique quand chartLabel est absent', () => {
        (component.data as any) = { type: 'chart-point', title: 'Semaine', details: [] };
        fixture.detectChanges();
        expect(fixture.nativeElement.querySelector('.dd-stat')).toBeFalsy();
    });

    it('close() délègue au dialogRef', () => {
        (fixture.nativeElement.querySelector('.dd-close') as HTMLButtonElement).click();
        expect(closeSpy).toHaveBeenCalled();
    });
});
