import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ResetPasswordComponent } from './reset-password.component';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { provideRouter, Router } from '@angular/router';
import { AuthService } from '../../../core/auth.service';
import { of, throwError } from 'rxjs';

describe('ResetPasswordComponent', () => {
  let component: ResetPasswordComponent;
  let fixture: ComponentFixture<ResetPasswordComponent>;
  let authServiceMock: { resetPassword: any };
  let router: Router;

  beforeEach(async () => {
    authServiceMock = {
      resetPassword: jasmine.createSpy('resetPassword').and.returnValue(of({ message: 'ok' }))
    };

    await TestBed.configureTestingModule({
      imports: [ResetPasswordComponent],
      providers: [
        provideRouter([]),
        provideAnimationsAsync(),
        { provide: AuthService, useValue: authServiceMock }
      ]
    }).compileComponents();

    router = TestBed.inject(Router);
    spyOn(router, 'navigate').and.callFake(() => Promise.resolve(true));

    fixture = TestBed.createComponent(ResetPasswordComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create with empty code and newPassword', () => {
    expect(component).toBeTruthy();
    expect(component.code).toBe('');
    expect(component.newPassword).toBe('');
  });

  // ─── onSubmit() ───────────────────────────────────────────────
  it('onSubmit() should call resetPassword with code/newPassword and navigate on success', () => {
    component.code = 'CODE-42';
    component.newPassword = 'Passw0rd!';

    component.onSubmit();

    expect(authServiceMock.resetPassword).toHaveBeenCalledWith('CODE-42', 'Passw0rd!');
    expect(router.navigate).toHaveBeenCalledWith(['/auth/signin']);
  });

  it('onSubmit() should still navigate to signin when the service fails', () => {
    authServiceMock.resetPassword.and.returnValue(
      throwError(() => new Error('code invalide'))
    );

    component.code = 'BAD';
    component.newPassword = 'x';
    component.onSubmit();

    expect(authServiceMock.resetPassword).toHaveBeenCalled();
    expect(router.navigate).toHaveBeenCalledWith(['/auth/signin']);
  });

  // ─── rendu du template ────────────────────────────────────────
  it('should render the submit form in the template', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('form')).toBeTruthy();
    expect(compiled.textContent).toContain('Reinitialiser le mot de passe');
  });
});
