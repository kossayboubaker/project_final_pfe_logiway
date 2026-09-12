import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatTabsModule } from '@angular/material/tabs';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../core/auth.service';
import { MatSelectModule } from '@angular/material/select';
import { PremiumSnackbarComponent } from '../../shared/components/premium-snackbar/premium-snackbar.component';
import { ProfileService } from '../../core/services/profile.service';
import { NotificationService } from '../../core/services/notification.service';


@Component({
    selector: 'app-profile',
    standalone: true,
    imports: [
        CommonModule,
        MatCardModule,
        MatButtonModule,
        MatInputModule,
        MatFormFieldModule,
        MatIconModule,
        MatTabsModule,
        MatSnackBarModule,
        MatSelectModule,
        FormsModule
    ],
    templateUrl: './profile.component.html',
    styleUrls: ['./profile.component.css']
})
export class ProfileComponent implements OnInit {
    user: any = {};
    editingUser = false;
    avatarPreview: string | ArrayBuffer | null = null;
    changingPassword = false;
    passwordForm = {
        oldPassword: '',
        newPassword: '',
        confirmPassword: ''
    };

    constructor(
        private authService: AuthService,
        private profileService: ProfileService,
        private notificationService: NotificationService,
        private snackBar: MatSnackBar
    ) { }

    ngOnInit() {
        const userData = this.authService.getUser();
        if (userData) {
            this.user = { ...userData };
        }

        this.profileService.getCurrentProfile().subscribe({
            next: (profile: any) => {
                const currentImage = profile.image ?? null;
                this.user = {
                    ...this.user,
                    firstName: profile.prenom,
                    lastName: profile.nom,
                    email: profile.email,
                    phone: profile.telephone,
                    avatar: currentImage,
                    sectorId: profile.secteurId ?? null,
                    sectorName: profile.secteurNom ?? null
                };
                this.avatarPreview = currentImage;
                this.authService.updateUser(this.user);
            }
        });
    }

    saveUserProfile() {
        if (this.avatarPreview) {
            this.user.avatar = this.avatarPreview;
        }
        this.profileService.updateCurrentProfile({
            prenom: this.user.firstName,
            nom: this.user.lastName,
            telephone: this.user.phone,
            image: this.user.avatar
        }).subscribe({
            next: () => {
                this.authService.updateUser(this.user);
                this.editingUser = false;
                this.snackBar.openFromComponent(PremiumSnackbarComponent, {
                    duration: 4000,
                    verticalPosition: 'top',
                    horizontalPosition: 'end',
                    data: {
                        title: 'Profil Mis à Jour',
                        message: 'Vos informations personnelles ont ete enregistrees avec succes.',
                        type: 'success'
                    }
                });
            },
            error: () => {
                this.snackBar.openFromComponent(PremiumSnackbarComponent, {
                    duration: 4000,
                    verticalPosition: 'top',
                    horizontalPosition: 'end',
                    data: {
                        title: 'Erreur de mise à jour',
                        message: 'Impossible de sauvegarder le profil pour le moment.',
                        type: 'error'
                    }
                });
            }
        });
    }

    changePassword() {
        if (!this.passwordForm.oldPassword || !this.passwordForm.newPassword || !this.passwordForm.confirmPassword) {
            this.snackBar.openFromComponent(PremiumSnackbarComponent, {
                duration: 4000,
                verticalPosition: 'top',
                horizontalPosition: 'end',
                data: {
                    title: 'Champs requis',
                    message: 'Veuillez remplir tous les champs du mot de passe.',
                    type: 'warning'
                }
            });
            return;
        }

        if (this.passwordForm.newPassword !== this.passwordForm.confirmPassword) {
            this.snackBar.openFromComponent(PremiumSnackbarComponent, {
                duration: 4000,
                verticalPosition: 'top',
                horizontalPosition: 'end',
                data: {
                    title: 'Confirmation invalide',
                    message: 'Le nouveau mot de passe et la confirmation ne correspondent pas.',
                    type: 'warning'
                }
            });
            return;
        }

        if (this.passwordForm.newPassword.length < 8) {
            this.snackBar.openFromComponent(PremiumSnackbarComponent, {
                duration: 4000,
                verticalPosition: 'top',
                horizontalPosition: 'end',
                data: {
                    title: 'Mot de passe trop court',
                    message: 'Le nouveau mot de passe doit contenir au moins 8 caractères.',
                    type: 'warning'
                }
            });
            return;
        }

        this.changingPassword = true;
        const wasFirstLogin = !!this.user?.firstLogin;
        this.profileService.changePassword({
            oldPassword: this.passwordForm.oldPassword,
            newPassword: this.passwordForm.newPassword
        }).subscribe({
            next: () => {
                this.passwordForm = {
                    oldPassword: '',
                    newPassword: '',
                    confirmPassword: ''
                };
                this.snackBar.openFromComponent(PremiumSnackbarComponent, {
                    duration: 4000,
                    verticalPosition: 'top',
                    horizontalPosition: 'end',
                    data: {
                        title: 'Mot de passe modifié',
                        message: 'Votre mot de passe a été mis à jour avec succès.',
                        type: 'success'
                    }
                });

                if (wasFirstLogin) {
                    this.user.firstLogin = false;
                    this.authService.updateUser(this.user);
                    this.notificationService.addLocalNotification({
                        title: 'Compte réactivé',
                        message: `Le compte ${this.user?.email || ''} a été réactivé.`,
                        type: 'INFO',
                        category: 'NOTIF_COMPTE'
                    });
                    this.snackBar.openFromComponent(PremiumSnackbarComponent, {
                        duration: 5000,
                        verticalPosition: 'top',
                        horizontalPosition: 'end',
                        data: {
                            title: 'Compte activé',
                            message: 'Votre compte est maintenant activé. Vous pouvez utiliser toutes les fonctionnalités.',
                            type: 'success'
                        }
                    });
                }
                this.changingPassword = false;
            },
            error: (err) => {
                const message = err?.error?.message || 'Impossible de changer le mot de passe.';
                this.snackBar.openFromComponent(PremiumSnackbarComponent, {
                    duration: 4000,
                    verticalPosition: 'top',
                    horizontalPosition: 'end',
                    data: {
                        title: 'Échec du changement',
                        message,
                        type: 'error'
                    }
                });
                this.changingPassword = false;
            }
        });
    }

    toggleEditUser() {
        this.editingUser = !this.editingUser;
    }

    onFileSelected(event: Event) {
        const file = (event.target as HTMLInputElement).files?.[0];
        if (file) {
            if (!file.type.startsWith('image/')) {
                this.snackBar.openFromComponent(PremiumSnackbarComponent, {
                    duration: 4000,
                    verticalPosition: 'top',
                    horizontalPosition: 'end',
                    data: {
                        title: 'Fichier invalide',
                        message: 'Veuillez sélectionner un fichier image valide.',
                        type: 'warning'
                    }
                });
                return;
            }

            if (file.size > 2 * 1024 * 1024) {
                this.snackBar.openFromComponent(PremiumSnackbarComponent, {
                    duration: 4000,
                    verticalPosition: 'top',
                    horizontalPosition: 'end',
                    data: {
                        title: 'Image trop lourde',
                        message: 'La taille maximale autorisée est de 2 Mo.',
                        type: 'warning'
                    }
                });
                return;
            }

            const reader = new FileReader();
            reader.onload = () => {
                this.avatarPreview = reader.result;
            };
            reader.readAsDataURL(file);
        }
    }
}
