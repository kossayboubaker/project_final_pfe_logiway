import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MAT_SNACK_BAR_DATA, MatSnackBarRef } from '@angular/material/snack-bar';
import { PremiumSnackbarComponent, SnackbarData } from './premium-snackbar.component';

describe('PremiumSnackbarComponent', () => {
  let component: PremiumSnackbarComponent;
  let fixture: ComponentFixture<PremiumSnackbarComponent>;
  const dismissSpy = jasmine.createSpy('dismiss');

  function render(data: SnackbarData): void {
    component.data = data;
    fixture.detectChanges();
  }

  beforeEach(async () => {
    dismissSpy.calls.reset();

    await TestBed.configureTestingModule({
      imports: [PremiumSnackbarComponent],
      providers: [
        { provide: MAT_SNACK_BAR_DATA, useValue: {} as SnackbarData },
        {
          provide: MatSnackBarRef,
          useValue: { dismiss: dismissSpy, dismissWithAction: jasmine.createSpy('dismissWithAction') }
        }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(PremiumSnackbarComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    render({ title: 'Bonjour', message: 'Contenu', type: 'info' });
    expect(component).toBeTruthy();
  });

  it('affiche le titre, le message et le bouton FERMER', () => {
    render({ title: 'Titre X', message: 'Message Y', type: 'success' });
    const el: HTMLElement = fixture.nativeElement;
    expect(el.querySelector('.alert-title')!.textContent).toContain('Titre X');
    expect(el.querySelector('.alert-message')!.textContent).toContain('Message Y');
    expect(el.querySelector('.dismiss-btn')!.textContent).toContain('FERMER');
  });

  it('utilise le libellé d\u2019action fourni et ferme au clic', () => {
    render({ title: 'T', message: 'M', type: 'error', action: 'VOIR' });
    const btn = fixture.nativeElement.querySelector('.dismiss-btn') as HTMLButtonElement;
    expect(btn.textContent).toContain('VOIR');
    btn.click();
    expect(dismissSpy).toHaveBeenCalled();
  });

  describe('getIcon', () => {
    it('mappe toutes les catégories', () => {
      const cases: Array<[SnackbarData['category'], string]> = [
        ['NOTIF_COMPTE', 'manage_accounts'],
        ['NOTIF_TRAJET', 'local_shipping'],
        ['NOTIF_CONGE', 'event_busy'],
        ['NOTIF_RECLAMATION', 'report_problem'],
        ['NOTIF_MESSAGE', 'chat_bubble'],
        ['NOTIF_ENTREPRISE', 'domain'],
        ['NOTIF_VEHICULE', 'commute'],
        ['SECTEUR', 'map']
      ];
      for (const [category, expected] of cases) {
        component.data = { title: 't', message: 'm', type: 'success', category };
        expect(component.getIcon()).toBe(expected);
      }
    });

    it('retombe sur le type quand la catégorie est absente', () => {
      const cases: Array<[SnackbarData['type'], string]> = [
        ['success', 'check_circle'],
        ['error', 'error_outline'],
        ['warning', 'report_problem'],
        ['info', 'info_outline'],
        ['inconnu' as any, 'notifications']
      ];
      for (const [type, expected] of cases) {
        component.data = { title: 't', message: 'm', type };
        expect(component.getIcon()).toBe(expected);
      }
    });

    it('la catégorie prime sur le type pour l\u2019icône', () => {
      component.data = { title: 't', message: 'm', type: 'error', category: 'NOTIF_TRAJET' };
      expect(component.getIcon()).toBe('local_shipping');
    });
  });

  describe('getTypeLabel', () => {
    it('mappe toutes les catégories', () => {
      const cases: Array<[SnackbarData['category'], string]> = [
        ['NOTIF_COMPTE', 'COMPTE'],
        ['NOTIF_TRAJET', 'TRAJET'],
        ['NOTIF_CONGE', 'CONGÉ'],
        ['NOTIF_RECLAMATION', 'RÉCLAMATION'],
        ['NOTIF_MESSAGE', 'MESSAGE'],
        ['NOTIF_ENTREPRISE', 'ENTREPRISE'],
        ['NOTIF_VEHICULE', 'VÉHICULE'],
        ['SECTEUR', 'SECTEUR']
      ];
      for (const [category, expected] of cases) {
        component.data = { title: 't', message: 'm', type: 'info', category };
        expect(component.getTypeLabel()).toBe(expected);
      }
    });

    it('retombe sur le type quand la catégorie est absente', () => {
      const cases: Array<[SnackbarData['type'], string]> = [
        ['success', 'SUCCÈS'],
        ['error', 'ERREUR'],
        ['warning', 'ATTENTION'],
        ['info', 'INFO'],
        ['inconnu' as any, 'NOTIFICATION']
      ];
      for (const [type, expected] of cases) {
        component.data = { title: 't', message: 'm', type };
        expect(component.getTypeLabel()).toBe(expected);
      }
    });
  });
});
