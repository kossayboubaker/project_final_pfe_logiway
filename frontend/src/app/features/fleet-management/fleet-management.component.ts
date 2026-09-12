import { Component, OnInit, ViewChild, AfterViewInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subject, Subscription } from 'rxjs';
import { distinctUntilChanged, filter, takeUntil } from 'rxjs/operators';
import { MatCardModule } from '@angular/material/card';
import { MatTableModule, MatTableDataSource } from '@angular/material/table';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatMenuModule } from '@angular/material/menu';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { MatSort, MatSortModule } from '@angular/material/sort';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { FleetService, Vehicle, VehiclePayload, AvailableDriver } from '../../core/services/fleet.service';
import { AuthService } from '../../core/auth.service';
import { Company, CompanyService } from '../../core/services/company.service';
import { UserService } from '../../core/services/user.service';
import { VehicleDialogComponent, VehicleDialogData, VehicleDialogResult } from './vehicle-dialog/vehicle-dialog.component';
import { PremiumSnackbarComponent } from '../../shared/components/premium-snackbar/premium-snackbar.component';
import { ConfirmDeleteDialogComponent } from '../../shared/components/confirm-delete-dialog/confirm-delete-dialog.component';
import { VehiculeStatut } from '../../models/project.models';
import { NotificationService } from '../../core/services/notification.service';

interface DriverOption {
    id: string;
    name: string;
    companyId?: string;
}

@Component({
    selector: 'app-fleet-management',
    standalone: true,
    imports: [
        CommonModule,
        MatCardModule,
        MatTableModule,
        MatIconModule,
        MatButtonModule,
        MatMenuModule,
        MatPaginatorModule,
        MatSortModule,
        MatFormFieldModule,
        MatInputModule,
        MatSnackBarModule,
        MatDialogModule
    ],
    templateUrl: './fleet-management.component.html',
    styleUrls: ['./fleet-management.component.css']
})
export class FleetManagementComponent implements OnInit, AfterViewInit, OnDestroy {
    displayedColumns: string[] = ['plate', 'capacite', 'kilometrage', 'company', 'model', 'status', 'driver', 'actions'];
    defaultColumns: string[] = ['plate', 'capacite', 'kilometrage', 'company', 'model', 'status', 'driver', 'actions'];
    superadminColumns: string[] = ['plate', 'capacite', 'kilometrage', 'company', 'model', 'status', 'manager', 'driver', 'actions'];
    dataSource = new MatTableDataSource<Vehicle>([]);
    user: any;
    companies: Company[] = [];
    drivers: DriverOption[] = [];
    currentCompany: Company | null = null;

    @ViewChild(MatPaginator) paginator!: MatPaginator;
    @ViewChild(MatSort) sort!: MatSort;

    private userSubscription?: Subscription;
    private readonly destroy$ = new Subject<void>();

    constructor(
        private fleetService: FleetService,
        private authService: AuthService,
        private companyService: CompanyService,
        private userService: UserService,
        private notificationService: NotificationService,
        private snackBar: MatSnackBar,
        private dialog: MatDialog
    ) { }

    ngOnInit() {
        this.userSubscription = this.authService.currentUser.pipe(
            filter((u: any) => !!u),
            distinctUntilChanged((prev: any, curr: any) => prev?.role === curr?.role && prev?.email === curr?.email)
        ).subscribe((u: any) => {
            this.user = u;
            this.displayedColumns = this.isSuperAdmin() ? this.superadminColumns : this.defaultColumns;
            this.loadCompanies();
            if (this.isSuperAdmin()) {
                this.loadDrivers();
            }
            if (!this.isManager()) {
                this.loadVehicles();
            }
        });

        // ── Synchronisation temps réel via SSE ────────────────────────
        this.notificationService.connectRealtime();
        this.notificationService.realtimeNotification$
            .pipe(takeUntil(this.destroy$))
            .subscribe(notification => {
                const cat = notification?.category;
                if (cat === 'NOTIF_VEHICULE' || cat === 'NOTIF_TRAJET') {
                    this.loadVehicles();
                }
                if (cat === 'NOTIF_COMPTE') {
                    this.loadDrivers();
                }
            });
    }

    ngAfterViewInit() {
        this.dataSource.paginator = this.paginator;
        this.dataSource.sort = this.sort;
    }

    ngOnDestroy(): void {
        this.destroy$.next();
        this.destroy$.complete();
        this.userSubscription?.unsubscribe();
    }

    loadVehicles() {
        this.fleetService.getVehicles().subscribe(vehicles => {
            if (this.isManager() && this.currentCompany) {
                const currentCompanyId = String(this.currentCompany.id);
                this.dataSource.data = vehicles.filter(vehicle => String(vehicle.companyId ?? '') === currentCompanyId);
                return;
            }

            this.dataSource.data = vehicles;
        });
    }

    loadCompanies() {
        if (this.isSuperAdmin()) {
            this.currentCompany = null;
            this.companyService.getCompanies().subscribe(companies => {
                this.companies = companies;
            });
            return;
        }

        if (this.isManager()) {
            this.companyService.getMyCompany().subscribe(company => {
                this.currentCompany = company;
                this.companies = company ? [company] : [];
                this.loadDrivers();
                this.loadVehicles();
            });
            return;
        }

        this.currentCompany = null;
        this.companies = [];
    }

    loadDrivers() {
        if (!this.isSuperAdmin() && !this.isManager()) {
            this.drivers = [];
            return;
        }

        this.userService.list().subscribe(users => {
            let filteredUsers = users.filter((user: any) => user.role === 'CHAUFFEUR');

            // Si Manager, filtrer par entreprise du manager
            if (this.isManager() && this.currentCompany) {
                const currentCompanyId = String(this.currentCompany.id);
                filteredUsers = filteredUsers.filter((user: any) => {
                    const userCompanyId = user?.entreprise?.id ?? user?.entrepriseId ?? user?.companyId;
                    return userCompanyId != null && String(userCompanyId) === currentCompanyId;
                });
            }

            this.drivers = filteredUsers.map((user: any) => ({
                id: String(user.id),
                name: `${user.prenom || ''} ${user.nom || ''}`.trim() || user.email || `#${user.id}`,
                companyId: String(user?.entreprise?.id ?? user?.entrepriseId ?? user?.companyId ?? '') || undefined
            }));
        });
    }

    getActiveCount() {
        return this.dataSource.data.filter(vehicle => this.normalizeStatus(vehicle.status) === VehiculeStatut.EN_SERVICE).length;
    }

    getMaintenanceCount() {
        return this.dataSource.data.filter(vehicle => this.normalizeStatus(vehicle.status) === VehiculeStatut.EN_MAINTENANCE).length;
    }

    getHorsServiceCount() {
        return this.dataSource.data.filter(vehicle => this.normalizeStatus(vehicle.status) === VehiculeStatut.HORS_SERVICE).length;
    }

    applyFilter(event: Event) {
        const filterValue = (event.target as HTMLInputElement).value;
        this.dataSource.filter = filterValue.trim().toLowerCase();
    }

    addVehicle() {
        if (!this.canCreateVehicle()) {
            return;
        }

        const dialogRef = this.dialog.open(VehicleDialogComponent, {
            width: '640px',
            data: this.buildDialogData('create')
        });

        dialogRef.afterClosed().subscribe((result: VehicleDialogResult | undefined) => {
            if (!result) {
                return;
            }

            const payload = this.toPayload(result);
            if (!payload) {
                return;
            }

            this.fleetService.createVehicle(payload).subscribe({
                next: () => {
                    this.showSnackbar(
                        'Véhicule Ajouté',
                        `Le camion ${payload.matricule} a été ajouté et notifié.`,
                        'success'
                    );
                    this.loadVehicles();
                },

                error: (error) => {
                    // 🔍 DEBUG (important pour vérifier la réponse backend)
                    console.log('Erreur backend :', error);
                    console.log('Message backend :', error?.error?.message);

                    const message = error?.error?.message;

                    // 🚨 Cas spécifique : capacité flotte atteinte
                    if (message === 'FLEET_CAPACITY_REACHED') {
                        this.showSnackbar(
                            'Flotte complète',
                            'La capacité maximale de cette entreprise est atteinte. Impossible d’ajouter un nouveau véhicule.',
                            'warning'
                        );
                        return;
                    }

                    // ❌ Erreur générique
                    this.showSnackbar(
                        'Ajout impossible',
                        message || 'La création du camion a échoué.',
                        'warning'
                    );
                }
            });
        });
    }

    editVehicle(vehicle: Vehicle) {
        if (!this.canEditVehicle()) {
            return;
        }

        const dialogRef = this.dialog.open(VehicleDialogComponent, {
            width: '640px',
            data: this.buildDialogData('edit', vehicle)
        });

        dialogRef.afterClosed().subscribe((result: VehicleDialogResult | undefined) => {
            if (!result) {
                return;
            }

            const payload = this.toPayload(result);
            if (!payload) {
                return;
            }

            this.fleetService.updateVehicle(vehicle.id, payload).subscribe({
                next: () => {
                    this.showSnackbar('Véhicule Modifié', `Les informations de ${payload.matricule} ont été mises à jour.`, 'success');
                    this.loadVehicles();
                },
                error: () => this.showSnackbar('Modification impossible', 'La mise à jour du camion a échoué.', 'warning')
            });
        });
    }

    changeStatus(vehicle: Vehicle) {
        if (!this.canChangeStatus(vehicle)) {
            return;
        }

        const dialogRef = this.dialog.open(VehicleDialogComponent, {
            width: '520px',
            data: this.buildDialogData('status', vehicle)
        });

        dialogRef.afterClosed().subscribe((result: VehicleDialogResult | undefined) => {
            if (!result?.statut) {
                return;
            }

            this.fleetService.updateVehicleStatus(vehicle.id, result.statut).subscribe({
                next: () => {
                    const newStatus = result.statut as VehiculeStatut;
                    this.showSnackbar('Statut mis à jour', `Le camion ${vehicle.plate} est maintenant ${this.labelForStatus(newStatus)}.`, 'success');
                    this.loadVehicles();
                },
                error: () => this.showSnackbar('Statut refusé', 'Le changement de statut a été rejeté par le serveur.', 'warning')
            });
        });
    }

    assignDriver(vehicle: Vehicle) {
        if (!this.canAssignDriver(vehicle)) {
            return;
        }

        this.fleetService.getAvailableDrivers(vehicle.id).subscribe({
            next: (availableDrivers: AvailableDriver[]) => {
                const drivers = availableDrivers.map(driver => ({
                    id: driver.id,
                    name: `${driver.prenom || ''} ${driver.nom || ''}`.trim() || driver.email || `#${driver.id}`
                }));

                const dialogRef = this.dialog.open(VehicleDialogComponent, {
                    width: '520px',
                    data: this.buildDialogData('assign', vehicle, drivers)
                });

                dialogRef.afterClosed().subscribe((result: VehicleDialogResult | undefined) => {
                    if (!result?.chauffeurId) {
                        return;
                    }

                    this.fleetService.assignDriver(vehicle.id, result.chauffeurId).subscribe({
                        next: () => {
                            this.showSnackbar('Chauffeur Affecté', `Le chauffeur a été affecté au camion ${vehicle.plate}.`, 'success');
                            this.loadVehicles();
                        },
                        error: (error) => {
                            const backendMessage = error?.error?.message;
                            this.showSnackbar(
                                'Affectation impossible',
                                backendMessage || 'Le serveur a refusé l’affectation du chauffeur.',
                                'warning'
                            );
                        }
                    });
                });
            },
            error: () => {
                this.showSnackbar('Affectation impossible', 'Impossible de charger la liste des chauffeurs disponibles.', 'warning');
            }
        });
    }

    clearDriver(vehicle: Vehicle) {
        if (!this.canClearDriver()) {
            return;
        }

        this.fleetService.clearDriver(vehicle.id).subscribe({
            next: () => {
                this.showSnackbar('Affectation retirée', `Le chauffeur du camion ${vehicle.plate} a été retiré.`, 'warning');
                this.loadVehicles();
            },
            error: () => this.showSnackbar('Suppression impossible', 'La suppression de l’affectation a échoué.', 'warning')
        });
    }

    deleteVehicle(vehicle: Vehicle) {
        if (!this.canDeleteVehicle()) {
            return;
        }

        const dialogRef = this.dialog.open(ConfirmDeleteDialogComponent, {
            width: '420px',
            panelClass: 'glass-dialog',
            data: {
                title: 'Supprimer ce véhicule ?',
                message: `Voulez-vous vraiment supprimer le camion <strong>${vehicle.plate}</strong> ?<br><br>Cette action est irréversible.`
            }
        });

        dialogRef.afterClosed().subscribe(result => {
            if (!result) {
                return;
            }

            this.fleetService.deleteVehicle(vehicle.id).subscribe({
                next: () => {
                    this.showSnackbar('Véhicule Supprimé', `Le camion ${vehicle.plate} a été supprimé.`, 'warning');
                    this.loadVehicles();
                },
                error: () => this.showSnackbar('Suppression impossible', 'Le camion ne peut pas être supprimé.', 'warning')
            });
        });
    }

    canCreateVehicle(): boolean {
        return this.isSuperAdmin();
    }

    canEditVehicle(): boolean {
        return this.isSuperAdmin();
    }

    canDeleteVehicle(): boolean {
        return this.isSuperAdmin();
    }

    canAssignDriver(vehicle: Vehicle): boolean {
        if (this.isSuperAdmin()) {
            return true;
        }

        if (this.isManager()) {
            return this.isVehicleInCurrentCompany(vehicle);
        }

        return false;
    }

    canChangeStatus(vehicle: Vehicle): boolean {
        if (this.isSuperAdmin()) {
            return true;
        }

        if (this.isManager()) {
            return this.isVehicleInCurrentCompany(vehicle);
        }

        if (this.isDriver()) {
            return vehicle.driverId === String(this.user?.id);
        }

        return false;
    }

    canClearDriver(): boolean {
        return this.isSuperAdmin();
    }

    isSuperAdmin(): boolean {
        return this.user?.role === 'SUPERADMIN';
    }

    isManager(): boolean {
        return this.user?.role === 'MANAGER';
    }

    isDriver(): boolean {
        return this.user?.role === 'DRIVER';
    }

    isVehicleInCurrentCompany(vehicle: Vehicle): boolean {
        if (!this.currentCompany) {
            return false;
        }

        return vehicle.companyId === this.currentCompany.id;
    }

    getCompanyLabel(vehicle: Vehicle): string {
        return vehicle.companyName || 'Entreprise non définie';
    }

    getDriverLabel(vehicle: Vehicle): string {
        return vehicle.driverName || 'Non affecté';
    }

    getManagerLabel(vehicle: Vehicle): string {
        if (vehicle.managerPrenom || vehicle.managerNom) {
            return `${vehicle.managerPrenom || ''} ${vehicle.managerNom || ''}`.trim();
        }
        return 'Non défini';
    }

    trackByVehicleId(_: number, vehicle: Vehicle): string {
        return vehicle.id;
    }

    private buildDialogData(mode: 'create' | 'edit' | 'status' | 'assign', vehicle?: Vehicle, assignDrivers?: DriverOption[]): VehicleDialogData {
        const allStatuses = [VehiculeStatut.EN_SERVICE, VehiculeStatut.EN_MAINTENANCE, VehiculeStatut.HORS_SERVICE];
        const statusOptions = mode === 'status' && this.isManager()
            ? [VehiculeStatut.EN_MAINTENANCE]
            : allStatuses;
        const dialogCompanyId = vehicle?.companyId ?? this.currentCompany?.id ?? this.companies[0]?.id ?? undefined;
        const sourceDrivers = mode === 'assign' ? (assignDrivers ?? this.drivers) : this.filterDriversForCompany(dialogCompanyId, this.drivers);

        return {
            mode,
            vehicle,
            companies: this.isSuperAdmin() ? this.companies.map(company => ({ id: company.id, name: company.name })) : undefined,
            drivers: sourceDrivers,
            companyName: this.currentCompany?.name ?? undefined,
            companyId: this.currentCompany?.id ?? undefined,
            companyFixed: this.isManager(),
            defaultCompanyId: dialogCompanyId,
            allowedStatuses: statusOptions
        };
    }

    private filterDriversForCompany(companyId: string | number | null | undefined, drivers: DriverOption[]): DriverOption[] {
        if (companyId == null) {
            return [];
        }

        const normalizedCompanyId = String(companyId);
        return drivers.filter(driver => driver.companyId === normalizedCompanyId);
    }

    private toPayload(result: VehicleDialogResult): VehiclePayload | null {
        const companyId = result.entrepriseId ?? (this.currentCompany ? Number(this.currentCompany.id) : null);
        if (!companyId) {
            this.showSnackbar('Entreprise manquante', 'Veuillez sélectionner une entreprise valide.', 'warning');
            return null;
        }

        if (!result.matricule || !result.marque || !result.modele || result.capacite == null) {
            this.showSnackbar('Champs incomplets', 'Merci de renseigner les champs obligatoires.', 'warning');
            return null;
        }

        return {
            matricule: result.matricule.trim(),
            marque: result.marque.trim(),
            modele: result.modele.trim(),
            capacite: Number(result.capacite),
            kilometrage: result.kilometrage ?? 0,
            statut: result.statut ?? VehiculeStatut.EN_SERVICE,
            entrepriseId: companyId,
            chauffeurId: result.chauffeurId ?? null
        };
    }

    private normalizeStatus(status: string): VehiculeStatut {
        const normalized = (status || '').toUpperCase().replace(/\s+/g, '_');
        switch (normalized) {
            case VehiculeStatut.EN_SERVICE:
            case 'EN_SERVICE':
                return VehiculeStatut.EN_SERVICE;
            case VehiculeStatut.EN_MAINTENANCE:
            case 'MAINTENANCE':
                return VehiculeStatut.EN_MAINTENANCE;
            case VehiculeStatut.HORS_SERVICE:
            case 'HORS_SERVICE':
                return VehiculeStatut.HORS_SERVICE;
            default:
                return VehiculeStatut.EN_SERVICE;
        }
    }

    private labelForStatus(status: VehiculeStatut): string {
        switch (status) {
            case VehiculeStatut.EN_MAINTENANCE:
                return 'en maintenance';
            case VehiculeStatut.HORS_SERVICE:
                return 'hors service';
            default:
                return 'en service';
        }
    }

    private showSnackbar(title: string, message: string, type: 'success' | 'warning' | 'info' = 'success'): void {
        this.snackBar.openFromComponent(PremiumSnackbarComponent, {
            duration: 4000,
            verticalPosition: 'top',
            horizontalPosition: 'end',
            data: {
                title,
                message,
                type
            }
        });
    }
}
