import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { AppConfigService } from '../../../core/services/app-config.service';

@Component({
    selector: 'app-verify-email',
    standalone: true,
    imports: [CommonModule, RouterModule],
    templateUrl: './verify-email.component.html',
    styleUrls: ['./verify-email.component.css']
})
export class VerifyEmailComponent implements OnInit {
    message = 'Verification en cours...';
    private get apiBaseUrl(): string { return this.appConfig.apiUrl; }

    constructor(private route: ActivatedRoute, private http: HttpClient, private appConfig: AppConfigService) {}

    ngOnInit(): void {
        const token = this.route.snapshot.queryParamMap.get('token');
        if (!token) {
            this.message = 'Lien invalide.';
            return;
        }

        this.http.get<{ message: string }>(`${this.apiBaseUrl}/auth/verify-email?token=${encodeURIComponent(token)}`).subscribe({
            next: (res) => this.message = res.message || 'Email verifie.',
            error: () => this.message = 'Verification impossible.'
        });
    }
}
