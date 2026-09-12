import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { FormsModule } from '@angular/forms';
import { Company } from '../../../core/services/company';

@Component({
    selector: 'app-company-dialog',
    standalone: true,
    imports: [
        CommonModule,
        MatDialogModule,
        MatFormFieldModule,
        MatInputModule,
        MatSelectModule,
        MatButtonModule,
        FormsModule
    ],
    templateUrl: './company-dialog.component.html',
    styleUrls: ['./company-dialog.component.css']
})
export class CompanyDialogComponent {
    company: Partial<Company>;
    managers: Array<{ id: number; name: string }> = [];
    currentRole: 'SUPERADMIN' | 'MANAGER' | 'DRIVER' | null = null;
    imageFileName = '';
    legalDocFileName = '';

    constructor(
        public dialogRef: MatDialogRef<CompanyDialogComponent>,
        @Inject(MAT_DIALOG_DATA) public data: { company?: Company; managers?: Array<{ id: number; name: string }>; currentRole?: 'SUPERADMIN' | 'MANAGER' | 'DRIVER' | null }
    ) {
        this.managers = data.managers || [];
        this.currentRole = data.currentRole || null;
        this.company = data.company ? { ...data.company } : {
            name: '',
            email: '',
            sector: 'Logistique',
            fleetSize: 0,
            status: this.currentRole === 'SUPERADMIN' ? 'Actif' : 'En Attente',
            address: '',
            number: '',
            codeTVA: '',
            representantLegal: '',
            image: '',
            activeMissions: 0,
            managerOwnerId: null
        };

        if (this.data.company && this.currentRole === 'SUPERADMIN') {
            this.company.managerOwnerId = this.data.company.managerOwnerId ?? this.data.company.managerId ?? null;
        }

        this.imageFileName = this.extractFileName(this.company.image);
        this.legalDocFileName = this.extractFileName(this.company.representantLegal);
    }

    onCancel(): void {
        this.dialogRef.close();
    }

    onSave(): void {
        this.dialogRef.close(this.company);
    }

    onImageSelected(event: Event): void {
        const file = (event.target as HTMLInputElement).files?.[0];
        if (!file) {
            return;
        }

        this.imageFileName = file.name;
        this.readAsDataUrl(file).then(content => {
            this.company.image = content;
        });
    }

    onLegalDocSelected(event: Event): void {
        const file = (event.target as HTMLInputElement).files?.[0];
        if (!file) {
            return;
        }

        this.legalDocFileName = file.name;
        this.readAsDataUrl(file).then(content => {
            this.company.documentJustificatif = content;
        });
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

    private extractFileName(value?: string | null): string {
        if (!value) {
            return '';
        }

        if (value.startsWith('data:')) {
            return 'Fichier déjà chargé';
        }

        return value;
    }
}
