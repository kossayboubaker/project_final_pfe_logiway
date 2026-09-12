import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AdvancedMapControlsComponent } from './advanced-map-controls.component';

describe('AdvancedMapControlsComponent', () => {
    let component: AdvancedMapControlsComponent;
    let fixture: ComponentFixture<AdvancedMapControlsComponent>;

    function setTheme(value: string | null): void {
        if (value === null) {
            document.body.removeAttribute('data-theme');
        } else {
            document.body.setAttribute('data-theme', value);
        }
    }

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [AdvancedMapControlsComponent]
        }).compileComponents();

        fixture = TestBed.createComponent(AdvancedMapControlsComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    afterEach(() => {
        component.ngOnDestroy();
        setTheme(null);
        delete (window as any).toggleTheme;
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('détecte le thème sombre par défaut (attribut absent)', () => {
        setTheme(null);
        component.ngOnInit();
        expect(component.isDarkMode).toBe(true);
    });

    it('détecte le thème clair via MutationObserver', (done) => {
        setTheme('light');
        component.ngOnInit();
        expect(component.isDarkMode).toBe(false);

        setTheme('dark');
        setTimeout(() => {
            expect(component.isDarkMode).toBe(true);
            done();
        }, 50);
    });

    it('ngOnDisconnect protège un observer absent', () => {
        (component as any).themeObserver = undefined;
        expect(() => component.ngOnDestroy()).not.toThrow();
    });

    it('émet home, notifications et settings', () => {
        const received: string[] = [];
        component.home.subscribe(() => received.push('home'));
        component.notifications.subscribe(() => received.push('notifications'));
        component.settings.subscribe(() => received.push('settings'));

        component.onHome();
        component.onNotifications();
        component.onSettings();
        expect(received).toEqual(['home', 'notifications', 'settings']);
    });

    it('onThemeToggle appelle window.toggleTheme si défini', () => {
        let called = 0;
        (window as any).toggleTheme = () => called++;
        component.onThemeToggle();
        expect(called).toBe(1);

        delete (window as any).toggleTheme;
        component.onThemeToggle();
        expect(called).toBe(1);
    });
});
