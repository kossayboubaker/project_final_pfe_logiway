import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { HttpClient } from '@angular/common/http';

@Component({
    selector: 'app-verify-email',
    standalone: true,
    imports: [CommonModule, RouterModule],
    templateUrl: './verify-email.component.html',
    styleUrls: ['./verify-email.component.css']
})
export class VerifyEmailComponent implements OnInit {
    message = 'Verification en cours...';
    private readonly apiBaseUrl = 'http://localhost:8080/api';

    constructor(private route: ActivatedRoute, private http: HttpClient) {}

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
