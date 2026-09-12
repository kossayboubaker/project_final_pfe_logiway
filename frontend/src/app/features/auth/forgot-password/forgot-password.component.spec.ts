import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { provideRouter } from '@angular/router';
import { of, throwError } from 'rxjs';
import { ForgotPasswordComponent } from './forgot-password.component';
import { AuthService } from '../../../core/auth.service';
import { NotificationService } from '../../../core/services/notification.service';

describe('ForgotPasswordComponent', () => {
  let component: ForgotPasswordComponent;
  let fixture: ComponentFixture<ForgotPasswordComponent>;
  let authServiceMock: jasmine.SpyObj<AuthService>;
  let notificationServiceMock: jasmine.SpyObj<NotificationService>;

  beforeEach(async () => {
    authServiceMock = jasmine.createSpyObj('AuthService', ['forgotPassword']);
    notificationServiceMock = jasmine.createSpyObj('NotificationService', [
      'loadNotifications', 'connectRealtime', 'disconnectRealtime'
    ]);
    notificationServiceMock.loadNotifications.and.returnValue(of([]));

    await TestBed.configureTestingModule({
      imports: [ForgotPasswordComponent],
      providers: [
        provideRouter([]),
        provideHttpClient(),
        provideHttpClientTesting(),
        provideAnimationsAsync(),
        { provide: AuthService, useValue: authServiceMock },
        { provide: NotificationService, useValue: notificationServiceMock }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(ForgotPasswordComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should call forgotPassword on valid email submission', () => {
    authServiceMock.forgotPassword.and.returnValue(of({ message: 'Email envoyé' }));
    component.email = 'test@test.com';
    component.onSubmit();
    expect(authServiceMock.forgotPassword).toHaveBeenCalledWith('test@test.com');
  });

  it('should handle forgotPassword error gracefully', () => {
    authServiceMock.forgotPassword.and.returnValue(throwError(() => ({ status: 404 })));
    component.email = 'notfound@test.com';
    expect(() => component.onSubmit()).not.toThrow();
  });
});
