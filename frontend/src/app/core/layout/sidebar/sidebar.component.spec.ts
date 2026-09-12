import { ComponentFixture, TestBed } from '@angular/core/testing';
import { SidebarComponent } from './sidebar.component';
import { provideRouter } from '@angular/router';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { AuthService } from '../../auth.service';
import { of, BehaviorSubject } from 'rxjs';

describe('SidebarComponent', () => {
  let component: SidebarComponent;
  let fixture: ComponentFixture<SidebarComponent>;
  let authServiceMock: any;
  let currentUserSubject: BehaviorSubject<any>;

  beforeEach(async () => {
    currentUserSubject = new BehaviorSubject({ id: '1', role: 'MANAGER', username: 'Test' });

    authServiceMock = {
      getUser: jasmine.createSpy('getUser').and.returnValue({ id: '1', role: 'MANAGER', username: 'Test' }),
      isAuthenticated: jasmine.createSpy('isAuthenticated').and.returnValue(true),
      isCompanyActive: jasmine.createSpy('isCompanyActive').and.returnValue(true),
      logout: jasmine.createSpy('logout'),
      currentUser: currentUserSubject.asObservable()
    };

    await TestBed.configureTestingModule({
      imports: [SidebarComponent],
      providers: [
        provideRouter([]),
        provideAnimationsAsync(),
        { provide: AuthService, useValue: authServiceMock }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(SidebarComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should show user from auth service', () => {
    expect(component.user).toBeTruthy();
    expect(component.user.role).toBe('MANAGER');
  });

  it('isManagerCompanyLocked should return false when company is active', () => {
    authServiceMock.isCompanyActive.and.returnValue(true);
    expect(component.isManagerCompanyLocked).toBeFalse();
  });

  it('isManagerCompanyLocked should return true for MANAGER with inactive company', () => {
    authServiceMock.isCompanyActive.and.returnValue(false);
    component.user = { role: 'MANAGER' };
    expect(component.isManagerCompanyLocked).toBeTrue();
  });

  it('should update user when currentUser$ emits', () => {
    currentUserSubject.next({ id: '2', role: 'SUPERADMIN', username: 'Admin' });
    expect(component.user.role).toBe('SUPERADMIN');
  });
});
