import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AlertNotificationsComponent } from './alert-notifications.component';

describe('AlertNotificationsComponent', () => {
    let component: AlertNotificationsComponent;
    let fixture: ComponentFixture<AlertNotificationsComponent>;

    const mkAlert = (over: Record<string, unknown> = {}): any => ({
        id: 'a1', type: 'INFO', category: 'NOTIF_TRAJET',
        title: 'Titre', message: 'Message', time: '10:00', ...over
    });

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [AlertNotificationsComponent]
        }).compileComponents();

        fixture = TestBed.createComponent(AlertNotificationsComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('émet close au clic sur le bouton fermer', () => {
        let closed = false;
        component.close.subscribe(() => (closed = true));
        const btn = fixture.nativeElement.querySelector('.alerts-header button') as HTMLButtonElement;
        btn.click();
        expect(closed).toBe(true);
    });

    it('émet treat avec l\u2019alerte correspondante', () => {
        let received: any;
        component.treat.subscribe(a => (received = a));
        component.alerts = [mkAlert({ id: 'x9' })];
        fixture.detectChanges();
        const btns = fixture.nativeElement.querySelectorAll('.alert-actions button');
        (btns[1] as HTMLButtonElement).click();
        expect(received.id).toBe('x9');
    });

    it('émet focus via onTreat/onFocus et boutons', () => {
        let received: any;
        component.focus.subscribe(a => (received = a));

        const alert = mkAlert({ id: 'f1' });
        component.onFocus(alert);
        expect(received.id).toBe('f1');

        component.alerts = [alert];
        fixture.detectChanges();
        const btns = fixture.nativeElement.querySelectorAll('.alert-actions button');
        (btns[0] as HTMLButtonElement).click();
        expect(received.id).toBe('f1');
    });

    describe('getIcon', () => {
        it('mappe les catégories connues', () => {
            const cases: Array<[string, string]> = [
                ['NOTIF_TRAJET', 'route'],
                ['NOTIF_VEHICULE', 'local_shipping'],
                ['NOTIF_ENTREPRISE', 'business'],
                ['NOTIF_CONGE', 'event_busy'],
                ['NOTIF_RECLAMATION', 'report_problem'],
                ['AUTRE', 'notifications']
            ];
            for (const [category, expected] of cases) {
                expect(component.getIcon(mkAlert({ category }))).toBe(expected);
            }
            expect(component.getIcon(mkAlert({ category: undefined }))).toBe('notifications');
        });
    });

    describe('getSeverityClass', () => {
        it('retourne critical pour DANGER via tone ou type', () => {
            expect(component.getSeverityClass(mkAlert({ tone: 'DANGER' }))).toBe('critical');
            expect(component.getSeverityClass(mkAlert({ type: 'DANGER' }))).toBe('critical');
        });

        it('retourne warning pour WARNING via tone ou type', () => {
            expect(component.getSeverityClass(mkAlert({ tone: 'WARNING' }))).toBe('warning');
            expect(component.getSeverityClass(mkAlert({ type: 'WARNING' }))).toBe('warning');
        });

        it('retourne info par défaut', () => {
            expect(component.getSeverityClass(mkAlert())).toBe('info');
        });
    });

    it('affiche l\u2019état vide sans alertes', () => {
        component.alerts = [];
        fixture.detectChanges();
        const el: HTMLElement = fixture.nativeElement;
        expect(el.querySelector('.alert-empty')).toBeTruthy();
        expect(el.querySelector('.alert-item')).toBeFalsy();
    });

    it('rend le contenu de chaque alerte', () => {
        component.alerts = [
            mkAlert({ id: '1', title: 'Panne véhicule', message: 'Moteur', time: '09:15', tone: 'DANGER' }),
            mkAlert({ id: '2', title: 'Congé approuvé', message: 'Vacances', time: '11:30' })
        ];
        fixture.detectChanges();
        const items = fixture.nativeElement.querySelectorAll('.alert-item');
        expect(items.length).toBe(2);
        expect(items[0].classList.contains('critical')).toBe(true);
        expect(items[1].classList.contains('info')).toBe(true);
        expect(items[0].querySelector('.alert-msg')!.textContent).toContain('Panne véhicule');
        expect(items[0].querySelector('.alert-submsg')!.textContent).toContain('Moteur');
        expect(items[0].querySelector('.alert-time')!.textContent).toContain('09:15');
    });
});
