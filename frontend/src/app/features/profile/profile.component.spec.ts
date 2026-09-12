import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { of, throwError, Subject } from 'rxjs';
import { ProfileComponent } from './profile.component';
import { AuthService } from '../../core/auth.service';
import { ProfileService } from '../../core/services/profile.service';
import { NotificationService } from '../../core/services/notification.service';

describe('ProfileComponent', () => {
  let component: ProfileComponent;
  let fixture: ComponentFixture<ProfileComponent>;
  let authServiceMock: jasmine.SpyObj<AuthService>;
  let profileServiceMock: jasmine.SpyObj<ProfileService>;
  let notificationServiceMock: jasmine.SpyObj<NotificationService>;
  let snackBarSpy: jasmine.SpyObj<MatSnackBar>;

  const lastSnack = (): any =>
    (snackBarSpy.openFromComponent.calls.mostRecent().args[1] as any).data;

  beforeEach(async () => {
    authServiceMock = jasmine.createSpyObj('AuthService', ['getUser', 'updateUser']);
    authServiceMock.getUser.and.returnValue({ id: '1', email: 'ali@test.com', role: 'MANAGER' });

    profileServiceMock = jasmine.createSpyObj('ProfileService', [
      'getCurrentProfile', 'updateCurrentProfile', 'changePassword'
    ]);
    profileServiceMock.getCurrentProfile.and.returnValue(of({}));
    notificationServiceMock = jasmine.createSpyObj('NotificationService', ['addLocalNotification']);
    snackBarSpy = jasmine.createSpyObj('MatSnackBar', ['openFromComponent']);

    await TestBed.configureTestingModule({
      imports: [ProfileComponent],
      providers: [
        provideRouter([]),
        provideAnimationsAsync(),
        { provide: AuthService, useValue: authServiceMock },
        { provide: ProfileService, useValue: profileServiceMock },
        { provide: NotificationService, useValue: notificationServiceMock },
        { provide: MatSnackBar, useValue: snackBarSpy }
      ]
    })
      .overrideComponent(ProfileComponent, { remove: { imports: [MatSnackBarModule] } })
      .compileComponents();

    fixture = TestBed.createComponent(ProfileComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create et charger le profil', () => {
    expect(component).toBeTruthy();

    const profileResponse = {
      prenom: 'Ali', nom: 'Ben Salah', email: 'ali@test.com', telephone: '12345',
      image: 'data:image/png;base64,x', secteurId: 7, secteurNom: 'Sud'
    };
    profileServiceMock.getCurrentProfile.and.returnValue(of(profileResponse));

    component.ngOnInit();

    expect(component.user.firstName).toBe('Ali');
    expect(component.user.lastName).toBe('Ben Salah');
    expect(component.user.phone).toBe('12345');
    expect(component.user.sectorId).toBe(7);
    expect(component.user.sectorName).toBe('Sud');
    expect(component.avatarPreview).toBe('data:image/png;base64,x');
    expect(authServiceMock.updateUser).toHaveBeenCalled();
  });

  it('ngOnInit gère les valeurs manquantes du profil', () => {
    profileServiceMock.getCurrentProfile.and.returnValue(of({ prenom: 'X' }));

    component.ngOnInit();

    expect(component.user.sectorId).toBeNull();
    expect(component.user.sectorName).toBeNull();
    expect(component.avatarPreview).toBeNull();
  });

  it('ngOnInit sans utilisateur local : user vide puis profil', () => {
    authServiceMock.getUser.and.returnValue(null);
    profileServiceMock.getCurrentProfile.and.returnValue(of({ prenom: 'Y', email: 'y@t.t' }));

    component.ngOnInit();

    expect(component.user.firstName).toBe('Y');
  });

  // ─── saveUserProfile ──────────────────────────────────────────
  it('saveUserProfile succès : maj, fermeture édition et snack', () => {
    profileServiceMock.updateCurrentProfile.and.returnValue(of({}));
    component.avatarPreview = 'data:image/jpg;base64,z';

    component.saveUserProfile();

    const payload = profileServiceMock.updateCurrentProfile.calls.mostRecent().args[0];
    expect(payload).toEqual({
      prenom: undefined, nom: undefined, telephone: undefined, image: 'data:image/jpg;base64,z'
    });
    expect(authServiceMock.updateUser).toHaveBeenCalledWith(component.user);
    expect(component.editingUser).toBeFalse();
    expect(lastSnack().title).toBe('Profil Mis à Jour');
  });

  it('saveUserProfile sans avatar ne l\'écrase pas', () => {
    profileServiceMock.updateCurrentProfile.and.returnValue(of({}));
    component.avatarPreview = null;
    component.user.firstName = 'A';

    component.saveUserProfile();

    expect(lastSnack().title).toBe('Profil Mis à Jour');
  });

  it('saveUserProfile erreur → snack erreur', () => {
    profileServiceMock.updateCurrentProfile.and.returnValue(throwError(() => new Error('ko')));

    component.saveUserProfile();

    expect(component.editingUser).toBeFalse();
    expect(lastSnack().title).toBe('Erreur de mise à jour');
  });

  // ─── changePassword validations ───────────────────────────────
  it('champ vide refusé', () => {
    component.passwordForm = { oldPassword: '', newPassword: 'x', confirmPassword: 'x' };
    component.changePassword();

    expect(lastSnack().title).toBe('Champs requis');
    expect(profileServiceMock.changePassword).not.toHaveBeenCalled();
  });

  it('confirmation différente refusée', () => {
    component.passwordForm = { oldPassword: 'a', newPassword: 'longpassword1', confirmPassword: 'autre' };
    component.changePassword();

    expect(lastSnack().title).toBe('Confirmation invalide');
  });

  it('mot de passe trop court refusé', () => {
    component.passwordForm = { oldPassword: 'a', newPassword: 'court', confirmPassword: 'court' };
    component.changePassword();

    expect(lastSnack().title).toBe('Mot de passe trop court');
  });

  // ─── changePassword succès ────────────────────────────────────
  it('succès simple réinitialise le formulaire', () => {
    profileServiceMock.changePassword.and.returnValue(of({ message: 'ok' }));
    component.passwordForm = { oldPassword: 'ancien', newPassword: 'nouveau123', confirmPassword: 'nouveau123' };

    component.changePassword();

    expect(profileServiceMock.changePassword).toHaveBeenCalledWith({
      oldPassword: 'ancien', newPassword: 'nouveau123'
    });
    expect(component.passwordForm.oldPassword).toBe('');
    expect(component.changingPassword).toBeFalse();
    expect(lastSnack().title).toBe('Mot de passe modifié');
  });

  it('première connexion : réactivation + notification locale + double snack', () => {
    profileServiceMock.changePassword.and.returnValue(of({ message: 'ok' }));
    component.user = { firstLogin: true, email: 'ali@test.com' };
    component.passwordForm = { oldPassword: 'a', newPassword: 'nouveau123', confirmPassword: 'nouveau123' };

    component.changePassword();

    expect(component.user.firstLogin).toBeFalse();
    expect(authServiceMock.updateUser).toHaveBeenCalled();
    expect(notificationServiceMock.addLocalNotification).toHaveBeenCalledWith(
      jasmine.objectContaining({ title: 'Compte réactivé', category: 'NOTIF_COMPTE' })
    );
    const titles = snackBarSpy.openFromComponent.calls.all().map(c => (c.args[1] as any).data.title);
    expect(titles).toContain('Compte activé');
    expect(component.changingPassword).toBeFalse();
  });

  it('première connexion sans email : message avec vide', () => {
    profileServiceMock.changePassword.and.returnValue(of({ message: 'ok' }));
    component.user = { firstLogin: true };
    component.passwordForm = { oldPassword: 'a', newPassword: 'nouveau123', confirmPassword: 'nouveau123' };

    component.changePassword();

    expect(notificationServiceMock.addLocalNotification).toHaveBeenCalledWith(
      jasmine.objectContaining({ message: 'Le compte  a été réactivé.' })
    );
    expect(component.changingPassword).toBeFalse();
  });

  it('échec avec message backend', () => {
    profileServiceMock.changePassword.and.returnValue(throwError(() => ({ error: { message: 'Ancien mot de passe incorrect' } })));
    component.passwordForm = { oldPassword: 'a', newPassword: 'nouveau123', confirmPassword: 'nouveau123' };

    component.changePassword();

    expect(lastSnack().title).toBe('Échec du changement');
    expect(lastSnack().message).toBe('Ancien mot de passe incorrect');
    expect(component.changingPassword).toBeFalse();
  });

  it('échec sans message backend → fallback', () => {
    const pending = new Subject<never>();
    profileServiceMock.changePassword.and.returnValue(pending);
    component.passwordForm = { oldPassword: 'a', newPassword: 'nouveau123', confirmPassword: 'nouveau123' };

    component.changePassword();
    expect(component.changingPassword).toBeTrue();
    pending.error({});

    expect(lastSnack().message).toBe('Impossible de changer le mot de passe.');
  });

  // ─── divers ───────────────────────────────────────────────────
  it('toggleEditUser bascule le mode édition', () => {
    component.toggleEditUser();
    expect(component.editingUser).toBeTrue();
    component.toggleEditUser();
    expect(component.editingUser).toBeFalse();
  });

  it('onFileSelected refuse un non-image', () => {
    const file = new File(['x'], 'doc.pdf', { type: 'application/pdf' });
    component.onFileSelected({ target: { files: [file] } } as any);

    expect(lastSnack().title).toBe('Fichier invalide');
  });

  it('onFileSelected refuse une image trop lourde', () => {
    const bigFile = new File([new ArrayBuffer(3 * 1024 * 1024)], 'big.png', { type: 'image/png' });
    component.onFileSelected({ target: { files: [bigFile] } } as any);

    expect(lastSnack().title).toBe('Image trop lourde');
  });

  it('onFileSelected lit une image valide', async () => {
    class FakeReader {
      result = 'data:image/png;base64,IMG';
      onload: (() => void) | null = null;
      readAsDataURL(_f: File): void {
        setTimeout(() => this.onload?.(), 0);
      }
    }
    spyOn(window, 'FileReader').and.returnValue(new FakeReader() as any);

    const file = new File(['img'], 'photo.png', { type: 'image/png' });
    component.onFileSelected({ target: { files: [file] } } as any);

    await new Promise<void>(res => setTimeout(res, 0));
    expect(component.avatarPreview).toBe('data:image/png;base64,IMG');
  });

  it('onFileSelected sans fichier ne fait rien', () => {
    component.onFileSelected({ target: { files: [] } } as any);
    expect(snackBarSpy.openFromComponent).not.toHaveBeenCalled();
  });
});
