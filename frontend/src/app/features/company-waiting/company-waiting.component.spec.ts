import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CompanyWaitingComponent } from './company-waiting.component';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { provideRouter } from '@angular/router';

describe('CompanyWaitingComponent', () => {
  let component: CompanyWaitingComponent;
  let fixture: ComponentFixture<CompanyWaitingComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CompanyWaitingComponent],
      providers: [provideRouter([]), provideAnimationsAsync()]
    }).compileComponents();

    fixture = TestBed.createComponent(CompanyWaitingComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  // ─── rendu du template ────────────────────────────────────────
  it('should render the waiting message and the profile link', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.textContent).toContain('Entreprise en cours de validation');
    expect(compiled.textContent).toContain('en attente, inactive ou suspendue');

    const link = compiled.querySelector('a.waiting-link') as HTMLAnchorElement;
    expect(link.getAttribute('href')).toBe('/dashboard/company-profile');
  });

  it('should render the hourglass icon inside a mat-card', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('mat-card')).toBeTruthy();
    expect(compiled.querySelector('mat-icon')?.textContent).toContain('hourglass_top');
  });
});
