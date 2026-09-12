import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { AuthService } from '../../../core/auth.service';

@Component({
    selector: 'app-reset-password',
    standalone: true,
    imports: [CommonModule, FormsModule, RouterModule, MatFormFieldModule, MatInputModule, MatButtonModule],
    templateUrl: './reset-password.component.html',
    styleUrls: ['./reset-password.component.css']
})
export class ResetPasswordComponent {
    code = '';
    newPassword = '';

    constructor(private authService: AuthService, private router: Router) {}

    onSubmit(): void {
        this.authService.resetPassword(this.code, this.newPassword).subscribe({
            next: () => this.router.navigate(['/auth/signin']),
            error: () => this.router.navigate(['/auth/signin'])
        });
    }
}
