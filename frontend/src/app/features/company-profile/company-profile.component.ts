import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../core/auth.service';
import { MatSelectModule } from '@angular/material/select';
import { PremiumSnackbarComponent } from '../../shared/components/premium-snackbar/premium-snackbar.component';
import { CompanyService } from '../../core/services/company';

@Component({
    selector: 'app-company-profile',
    standalone: true,
    imports: [
        CommonModule,
        MatCardModule,
        MatButtonModule,
        MatInputModule,
        MatFormFieldModule,
        MatIconModule,
        MatSnackBarModule,
        MatSelectModule,
        FormsModule
    ],
    templateUrl: './company-profile.component.html',
    styleUrls: ['./company-profile.component.css']
})
export class CompanyProfileComponent implements OnInit {
    company: any = {};
    editingCompany = false;
    hasCompany = false;
    canEditCompany = true;
    imageFileName = '';
    legalDocFileName = '';

    sectorOptions = [
        { value: 'transport', label: 'Transport de marchandises' },
        { value: 'delivery', label: 'Livraison dernier kilomètre' },
        { value: 'storage', label: 'Stockage & Entrepôt' }
    ];

    constructor(
        private authService: AuthService,
        private snackBar: MatSnackBar,
        private companyService: CompanyService,
        private router: Router
    ) { }

    ngOnInit() {
        const currentUser = this.authService.getUser();
        if (currentUser?.role === 'SUPERADMIN') {
            this.router.navigate(['/dashboard/companies']);
            return;
        }

        this.hasCompany = !!this.authService.hasCompany();
        this.companyService.getMyCompany().subscribe(company => {
            if (company) {
                this.company = {
                    id: company.id,
                    name: company.name,
                    email: company.email || '',
                    fleetSize: company.fleetSize,
                    sector: company.sector,
                    address: company.address,
                    number: company.number || '',
                    codeTVA: company.codeTVA || '',
                    representantLegal: company.representantLegal || '',
                    documentJustificatif: company.documentJustificatif || '',
                    image: company.image || '',
                    managerOwnerId: company.managerOwnerId ?? company.managerId ?? null,
                    managerOwnerName: company.managerOwnerName ?? company.managerName ?? '',
                    status: company.status
                };
                this.hasCompany = true;
                this.authService.setHasCompany(true);
                this.canEditCompany = company.status === 'Actif';
                this.imageFileName = this.extractFileName(company.image || '');
                this.legalDocFileName = this.extractFileName(company.representantLegal || '');
            } else {
                this.company = {
                    name: '',
                    email: '',
                    fleetSize: null,
                    sector: '',
                    address: '',
                    number: '',
                    codeTVA: '',
                    representantLegal: '',
                    documentJustificatif: '',
                    image: '',
                    managerOwnerId: null,
                    managerOwnerName: '',
                    status: 'En Attente'
                };
                this.canEditCompany = true;
            }

            this.editingCompany = !this.hasCompany;
        });
    }

    saveCompanyProfile() {
        this.companyService.saveMyCompany({
            name: this.company.name,
            email: this.company.email,
            sector: this.company.sector,
            fleetSize: this.company.fleetSize,
            address: this.company.address,
            number: this.company.number,
            codeTVA: this.company.codeTVA,
            representantLegal: this.company.representantLegal,
            documentJustificatif: this.company.documentJustificatif,
            image: this.company.image,
            managerOwnerId: this.company.managerOwnerId,
            status: this.hasCompany ? this.company.status : 'En Attente'
        }).subscribe({
            next: company => {
                this.company = {
                    ...company,
                    managerOwnerId: company.managerOwnerId ?? company.managerId ?? null,
                    managerOwnerName: company.managerOwnerName ?? company.managerName ?? ''
                };
                this.authService.setHasCompany(true);
                this.hasCompany = true;
                this.canEditCompany = company.status === 'Actif';
                this.editingCompany = false;
                this.snackBar.openFromComponent(PremiumSnackbarComponent, {
                    duration: 4000,
                    verticalPosition: 'top',
                    horizontalPosition: 'end',
                    data: {
                        title: 'Succès',
                        message: 'Les informations de l\'entreprise ont été enregistrées.',
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
                        title: 'Erreur',
                        message: 'Impossible d\'enregistrer l\'entreprise.',
                        type: 'error'
                    }
                });
            }
        });
    }

    toggleEditCompany() {
        if (!this.hasCompany) {
            this.editingCompany = true;
            return;
        }

        if (!this.canEditCompany) {
            this.snackBar.openFromComponent(PremiumSnackbarComponent, {
                duration: 4000,
                verticalPosition: 'top',
                horizontalPosition: 'end',
                data: {
                    title: 'Modification bloquée',
                    message: 'Votre entreprise doit être ACTIF pour modifier les informations.',
                    type: 'warning'
                }
            });
            return;
        }

        this.editingCompany = !this.editingCompany;
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

    private extractFileName(value: string): string {
        if (!value) {
            return '';
        }

        if (value.startsWith('data:')) {
            return 'Fichier déjà chargé';
        }

        return value;
    }
}
