import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { Vehicle } from '../../../core/services/fleet.service';
import { VehiculeStatut } from '../../../models/project.models';

export type VehicleDialogMode = 'create' | 'edit' | 'status' | 'assign';

export interface VehicleDialogCompanyOption {
    id: string;
    name: string;
}

export interface VehicleDialogDriverOption {
    id: string;
    name: string;
}

export interface VehicleDialogData {
    mode: VehicleDialogMode;
    vehicle?: Vehicle;
    companies?: VehicleDialogCompanyOption[];
    drivers?: VehicleDialogDriverOption[];
    companyName?: string;
    companyId?: string;
    companyFixed?: boolean;
    defaultCompanyId?: string;
    allowedStatuses?: VehiculeStatut[];
}

export interface VehicleDialogResult {
    matricule?: string;
    marque?: string;
    modele?: string;
    capacite?: number;
    kilometrage?: number;
    statut?: VehiculeStatut;
    entrepriseId?: number;
    chauffeurId?: number;
}

@Component({
    selector: 'app-vehicle-dialog',
    standalone: true,
    imports: [
        CommonModule,
        MatDialogModule,
        MatFormFieldModule,
        MatInputModule,
        MatSelectModule,
        MatButtonModule,
        MatIconModule,
        FormsModule
    ],
    templateUrl: './vehicle-dialog.component.html',
    styleUrls: ['./vehicle-dialog.component.css']
})
export class VehicleDialogComponent {
    readonly mode: VehicleDialogMode;
    readonly vehicle?: Vehicle;
    readonly companies: VehicleDialogCompanyOption[];
    readonly drivers: VehicleDialogDriverOption[];
    readonly companyName?: string;
    readonly companyId?: string;
    readonly companyFixed: boolean;
    readonly allowedStatuses: VehiculeStatut[];

    form: VehicleDialogResult;

    constructor(
        public dialogRef: MatDialogRef<VehicleDialogComponent>,
        @Inject(MAT_DIALOG_DATA) public data: VehicleDialogData
    ) {
        this.mode = data.mode;
        this.vehicle = data.vehicle;
        this.companies = data.companies || [];
        this.drivers = data.drivers || [];
        this.companyName = data.companyName;
        this.companyId = data.companyId;
        this.companyFixed = Boolean(data.companyFixed);
        this.allowedStatuses = data.allowedStatuses && data.allowedStatuses.length > 0
            ? data.allowedStatuses
            : [VehiculeStatut.EN_SERVICE, VehiculeStatut.EN_MAINTENANCE, VehiculeStatut.HORS_SERVICE];

        this.form = {
            matricule: data.vehicle?.plate || '',
            marque: data.vehicle?.brand || '',
            modele: data.vehicle?.model || '',
            capacite: data.vehicle?.capacity,
            kilometrage: data.vehicle?.mileage,
            statut: this.normalizeStatus(data.vehicle?.status),
            entrepriseId: data.vehicle?.companyId ? Number(data.vehicle.companyId) : data.defaultCompanyId ? Number(data.defaultCompanyId) : undefined,
            chauffeurId: data.vehicle?.driverId ? Number(data.vehicle.driverId) : undefined
        };

        if (this.mode === 'status' && data.vehicle) {
            this.form = {
                statut: this.allowedStatuses.includes(this.normalizeStatus(data.vehicle.status))
                    ? this.normalizeStatus(data.vehicle.status)
                    : this.allowedStatuses[0]
            };
        }

        if (this.mode === 'assign' && data.vehicle?.driverId) {
            this.form.chauffeurId = Number(data.vehicle.driverId);
        }
    }

    get title(): string {
        switch (this.mode) {
            case 'edit': return 'Modifier un Véhicule';
            case 'status': return 'Changer le Statut';
            case 'assign': return 'Affecter un Chauffeur';
            default: return 'Ajouter un Véhicule';
        }
    }

    get confirmLabel(): string {
        switch (this.mode) {
            case 'edit': return 'Mettre à jour';
            case 'status': return 'Enregistrer';
            case 'assign': return 'Affecter';
            default: return 'Enregistrer';
        }
    }

    get isCreateOrEdit(): boolean {
        return this.mode === 'create' || this.mode === 'edit';
    }

    get isStatusMode(): boolean {
        return this.mode === 'status';
    }

    get isAssignMode(): boolean {
        return this.mode === 'assign';
    }

    onCancel(): void {
        this.dialogRef.close();
    }

    onSave(): void {
        this.dialogRef.close(this.form);
    }

    private normalizeStatus(status?: string): VehiculeStatut {
        const normalized = (status || '').toUpperCase().replace(/\s+/g, '_');
        switch (normalized) {
            case 'EN_MAINTENANCE':
            case 'MAINTENANCE':
                return VehiculeStatut.EN_MAINTENANCE;
            case 'HORS_SERVICE':
                return VehiculeStatut.HORS_SERVICE;
            default:
                return VehiculeStatut.EN_SERVICE;
        }
    }
}
