import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { AuthService } from '../../../core/auth.service';
import { FormsModule } from '@angular/forms';
import { CompanyService } from '../../../core/services/company';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { PremiumSnackbarComponent } from '../../../shared/components/premium-snackbar/premium-snackbar.component';

@Component({
    selector: 'app-create-company',
    standalone: true,
    imports: [
        CommonModule,
        RouterModule,
        MatFormFieldModule,
        MatInputModule,
        MatButtonModule,
        MatIconModule,
        MatSelectModule,
        FormsModule,
        MatSnackBarModule
    ],
    templateUrl: './create-company.component.html',
    styleUrls: ['./create-company.component.css']
})
export class CreateCompanyComponent {
    company = {
        name: '',
        email: '',
        sector: 'transport',
        fleetSize: null as number | null,
        address: '',
        number: '',
        codeTVA: '',
        representantLegal: '',
        documentJustificatif: '',
        image: ''
    };
    imageFileName = '';
    legalDocFileName = '';

    constructor(
        private router: Router,
        private authService: AuthService,
        private companyService: CompanyService,
        private snackBar: MatSnackBar
    ) { }

    ngOnInit() {
        const currentUser = this.authService.getUser();
        if (currentUser?.role === 'SUPERADMIN') {
            this.router.navigate(['/dashboard/companies']);
            return;
        }

        if (this.authService.isCompanyActive()) {
            this.router.navigate(['/dashboard/company-profile']);
        }
    }

    onCreateCompany() {
        this.companyService.saveMyCompany({
            name: this.company.name,
            email: this.company.email,
            sector: this.company.sector,
            fleetSize: this.company.fleetSize || 0,
            address: this.company.address,
            number: this.company.number,
            codeTVA: this.company.codeTVA,
            representantLegal: this.company.representantLegal,
            documentJustificatif: this.company.documentJustificatif,
            image: this.company.image,
            status: 'En Attente'
        }).subscribe({
            next: () => {
                this.authService.setCompanyStatus('EN_ATTENTE');
                this.snackBar.openFromComponent(PremiumSnackbarComponent, {
                    duration: 4000,
                    verticalPosition: 'top',
                    horizontalPosition: 'end',
                    data: {
                        title: 'Entreprise créée',
                        message: 'Votre entreprise a été enregistrée et reste en attente de validation.',
                        type: 'success'
                    }
                });
                this.router.navigate(['/dashboard/company-profile']);
            },
            error: () => {
                this.snackBar.openFromComponent(PremiumSnackbarComponent, {
                    duration: 4000,
                    verticalPosition: 'top',
                    horizontalPosition: 'end',
                    data: {
                        title: 'Erreur',
                        message: 'Impossible de créer votre entreprise.',
                        type: 'error'
                    }
                });
            }
        });
    }

    onImageSelected(event: Event): void {
        const file = (event.target as HTMLInputElement).files?.[0];
        if (!file) {
            return;
        }

        this.imageFileName = file.name;
        this.readAsDataUrl(file).then(content => this.company.image = content);
    }

    onLegalDocSelected(event: Event): void {
        const file = (event.target as HTMLInputElement).files?.[0];
        if (!file) {
            return;
        }

        this.legalDocFileName = file.name;
        this.readAsDataUrl(file).then(content => this.company.documentJustificatif = content);
    }

    isImageDataUrl(value?: string): boolean {
        return !!value && value.startsWith('data:image/');
    }

    isPdfDataUrl(value?: string): boolean {
        return !!value && value.startsWith('data:application/pdf');
    }

    private readAsDataUrl(file: File): Promise<string> {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(String(reader.result || ''));
            reader.onerror = () => reject(reader.error);
            reader.readAsDataURL(file);
        });
    }
}
