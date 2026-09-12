import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../../core/auth.service';
import { PremiumSnackbarComponent } from '../../../shared/components/premium-snackbar/premium-snackbar.component';

@Component({
    selector: 'app-signin',
    standalone: true,
    imports: [
        CommonModule,
        RouterModule,
        MatFormFieldModule,
        MatInputModule,
        MatButtonModule,
        MatIconModule,
        MatCheckboxModule,
        MatSnackBarModule,
        FormsModule
    ],
    templateUrl: './signin.component.html',
    styleUrls: ['./signin.component.css']
})
export class SignInComponent {
    email: string = '';
    password: string = '';
    errorMessage: string | null = null;
    isSubmitting = false;

    constructor(
        private router: Router,
        private authService: AuthService,
        private snackBar: MatSnackBar
    ) { }

    onSignIn() {
        if (this.isSubmitting) {
            return;
        }

        this.isSubmitting = true;
        this.errorMessage = null;
        this.authService.login({ email: this.email, password: this.password }).subscribe({
            next: () => {
                this.isSubmitting = false;
                const user = this.authService.getUser();
                if (!user) return;

                if (user.role === 'SUPERADMIN') {
                    this.router.navigate(['/dashboard/superadmin']);
                } else if (user.role === 'MANAGER') {
                    if (!this.authService.hasCompany()) {
                        this.router.navigate(['/dashboard/company-profile']);
                    } else {
                        this.router.navigate(['/dashboard/manager']);
                    }
                } else {
                    this.router.navigate(['/dashboard/driver']);
                }
            },
            error: (err) => {
                this.isSubmitting = false;
                const backendMessage = this.extractBackendMessage(err);
                if (err?.status === 403 || backendMessage?.toLowerCase().includes('compte rejeté') || backendMessage?.toLowerCase().includes('account rejected')) {
                    const message = backendMessage || 'Compte rejeté par l\'administrateur';
                    this.errorMessage = message;
                    this.showRejectedAccountSnack(message);
                    return;
                }

                if (err?.status === 401) {
                    const normalized = backendMessage?.toLowerCase() || '';
                    const isInvalidCredentials = !normalized
                        || normalized.includes('invalid credentials')
                        || normalized.includes('email ou mot de passe invalide')
                        || normalized.includes('http failure response');

                    const message = isInvalidCredentials ? 'Invalid credentials' : (backendMessage || 'Invalid credentials');
                    this.errorMessage = message;
                    this.showInvalidCredentialsSnack(message);
                    return;
                }

                if (err?.status === 503) {
                    const message = backendMessage || 'Service d\'authentification temporairement indisponible. Réessayez dans un instant.';
                    this.errorMessage = message;
                    this.showInvalidCredentialsSnack(message);
                    return;
                }

                this.errorMessage = backendMessage || 'Invalid credentials';
            }
        });
    }

    private showRejectedAccountSnack(message: string) {
        this.snackBar.openFromComponent(PremiumSnackbarComponent, {
            duration: 6000,
            verticalPosition: 'top',
            horizontalPosition: 'end',
            data: {
                title: 'Compte rejeté',
                message,
                type: 'error'
            }
        });
    }

    private showInvalidCredentialsSnack(message: string) {
        this.snackBar.openFromComponent(PremiumSnackbarComponent, {
            duration: 5000,
            verticalPosition: 'top',
            horizontalPosition: 'end',
            data: {
                title: 'Connexion refusée',
                message,
                type: 'error'
            }
        });
    }

    private extractBackendMessage(err: any): string | null {
        if (!err) {
            return null;
        }

        const errorPayload = err.error;
        if (typeof errorPayload === 'string') {
            try {
                const parsed = JSON.parse(errorPayload);
                return parsed?.message || parsed?.error || errorPayload;
            } catch {
                return this.isTransportErrorMessage(errorPayload) ? null : errorPayload;
            }
        }

        return errorPayload?.message || errorPayload?.error || null;
    }

    private isTransportErrorMessage(message: string): boolean {
        const normalized = message.toLowerCase();
        return normalized.includes('http failure response');
    }
}
