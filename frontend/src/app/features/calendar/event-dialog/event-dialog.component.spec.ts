import { ComponentFixture, TestBed } from '@angular/core/testing';
import { EventDialogComponent } from './event-dialog.component';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';

describe('EventDialogComponent', () => {
  let component: EventDialogComponent;
  let fixture: ComponentFixture<EventDialogComponent>;
  let dialogRefSpy: jasmine.SpyObj<MatDialogRef<EventDialogComponent>>;

  const create = async (data?: any) => {
    await TestBed.resetTestingModule()
      .configureTestingModule({
        imports: [EventDialogComponent],
        providers: [
          { provide: MatDialogRef, useValue: dialogRefSpy },
          { provide: MAT_DIALOG_DATA, useValue: data }
        ]
      })
      .overrideComponent(EventDialogComponent, { remove: { imports: [MatDialogModule] } })
      .compileComponents();

    fixture = TestBed.createComponent(EventDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  };

  beforeEach(async () => {
    dialogRefSpy = jasmine.createSpyObj('MatDialogRef', ['close']);
    await create({ date: new Date(2026, 4, 10) });
  });

  it('should create avec la date fournie', () => {
    expect(component).toBeTruthy();
    expect(component.eventForm.get('date')?.value).toEqual(new Date(2026, 4, 10));
  });

  it('date par défaut = aujourd\'hui si absente des données', async () => {
    await create(undefined);
    expect(component.eventForm.get('date')?.value).toBeInstanceOf(Date);
    await create(null);
    expect(component.eventForm.get('date')?.value).toBeInstanceOf(Date);
  });

  it('onSubmit invalide ne ferme pas', () => {
    component.onSubmit();
    expect(dialogRefSpy.close).not.toHaveBeenCalled();
  });

  it('onSubmit valide ferme avec les valeurs', () => {
    component.eventForm.patchValue({ title: 'Mission Sud', description: 'Livraison' });
    component.onSubmit();

    expect(component.eventForm.valid).toBeTrue();
    expect(dialogRefSpy.close).toHaveBeenCalledWith(
      jasmine.objectContaining({ title: 'Mission Sud', type: 'mission', description: 'Livraison' })
    );
  });

  it('title est requis', () => {
    expect(component.eventForm.get('title')?.hasError('required')).toBeTrue();
    component.eventForm.patchValue({ title: 'X' });
    expect(component.eventForm.get('title')?.hasError('required')).toBeFalse();
  });

  it('onCancel ferme sans valeur', () => {
    component.onCancel();
    expect(dialogRefSpy.close).toHaveBeenCalledWith();
  });
});
