import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { ConfirmDeleteDialogComponent } from './confirm-delete-dialog.component';

describe('ConfirmDeleteDialogComponent', () => {
  let component: ConfirmDeleteDialogComponent;
  let fixture: ComponentFixture<ConfirmDeleteDialogComponent>;
  const closeSpy = jasmine.createSpy('close');

  beforeEach(async () => {
    closeSpy.calls.reset();

    await TestBed.configureTestingModule({
      imports: [ConfirmDeleteDialogComponent],
      providers: [
        { provide: MatDialogRef, useValue: { close: closeSpy } },
        {
          provide: MAT_DIALOG_DATA,
          useValue: {
            title: 'Supprimer le véhicule ?',
            message: 'Cette action est <strong>irréversible</strong>.',
            itemId: 42,
            itemName: 'Camion X',
            itemDetail: 'Immatriculé 123 TU 4567'
          }
        }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(ConfirmDeleteDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('affiche titre et message HTML', () => {
    const el: HTMLElement = fixture.nativeElement;
    expect(el.querySelector('.dialog-title')!.textContent).toContain('Supprimer le véhicule ?');
    expect((el.querySelector('.dialog-msg') as HTMLElement).innerHTML).toContain('<strong>');
  });

  it('Annuler ferme avec false', () => {
    (fixture.nativeElement.querySelector('.btn-cancel') as HTMLButtonElement).click();
    expect(closeSpy).toHaveBeenCalledWith(false);
  });

  it('Supprimer ferme avec true', () => {
    (fixture.nativeElement.querySelector('.btn-delete') as HTMLButtonElement).click();
    expect(closeSpy).toHaveBeenCalledWith(true);
  });
});
