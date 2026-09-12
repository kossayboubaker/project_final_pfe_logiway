import { Component, OnInit, ViewChild, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
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
import { FormsModule } from '@angular/forms';
import { CompanyService, Company } from '../../core/services/company';
import { CompanyDialogComponent } from './company-dialog/company-dialog.component';
import { PdfPreviewDialogComponent } from './pdf-preview-dialog/pdf-preview-dialog.component';
import { PremiumSnackbarComponent } from '../../shared/components/premium-snackbar/premium-snackbar.component';
import { ConfirmDeleteDialogComponent } from '../../shared/components/confirm-delete-dialog/confirm-delete-dialog.component';
import { AuthService } from '../../core/auth.service';
import { UserService } from '../../core/services/user.service';
import { NotificationService } from '../../core/services/notification.service';

@Component({
    selector: 'app-company-management',
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
        MatDialogModule,
        FormsModule
    ],
    templateUrl: './company-management.component.html',
    styleUrls: ['./company-management.component.css']
})
export class CompanyManagementComponent implements OnInit, AfterViewInit {
    displayedColumns: string[] = ['image', 'name', 'email', 'sector', 'address', 'number', 'codeTVA', 'representantLegal', 'fleetSize', 'status', 'managerOwner', 'joinDate', 'actions'];
    dataSource = new MatTableDataSource<Company>([]);
    managers: Array<{ id: number; name: string }> = [];
    currentUserRole: 'SUPERADMIN' | 'MANAGER' | 'DRIVER' | null = null;

    @ViewChild(MatPaginator) paginator!: MatPaginator;
    @ViewChild(MatSort) sort!: MatSort;

    constructor(
        private companyService: CompanyService,
        private snackBar: MatSnackBar,
        private dialog: MatDialog,
        private authService: AuthService,
        private userService: UserService,
        private notificationService: NotificationService
    ) { }

    ngOnInit() {
        this.currentUserRole = this.authService.getUser()?.role || null;
        this.loadManagers();
        this.loadCompanies();
    }

    loadCompanies() {
        this.companyService.getCompanies().subscribe(companies => {
            this.dataSource.data = companies;
        });
    }

    loadManagers() {
        this.userService.list().subscribe(users => {
            this.managers = users
                .filter(user => user.role === 'MANAGER')
                .map(user => ({
                    id: user.id,
                    name: `${user.prenom || ''} ${user.nom || ''}`.trim() || user.email
                }));
        });
    }

    getActiveCount() {
        return this.dataSource.data.filter(c => c.status === 'Actif').length;
    }

    getInactiveCount() {
        return this.dataSource.data.filter(c => c.status !== 'Actif').length;
    }

    getPendingCount() {
        return this.dataSource.data.filter(c => c.status === 'En Attente').length;
    }

    ngAfterViewInit() {
        this.dataSource.paginator = this.paginator;
        this.dataSource.sort = this.sort;
    }

    applyFilter(event: Event) {
        const filterValue = (event.target as HTMLInputElement).value;
        this.dataSource.filter = filterValue.trim().toLowerCase();
    }

    openAddModal() {
        const dialogRef = this.dialog.open(CompanyDialogComponent, {
            width: '500px',
            data: {
                managers: this.managers,
                currentRole: this.currentUserRole
            }
        });

        dialogRef.afterClosed().subscribe(result => {
            if (result) {
                this.companyService.createCompany(result).subscribe({
                    next: company => {
                        this.dataSource.data = [company, ...this.dataSource.data.filter(item => item.id !== company.id)];
                        this.notificationService.loadNotifications().subscribe();
                        this.snackBar.openFromComponent(PremiumSnackbarComponent, {
                            duration: 4000,
                            verticalPosition: 'top',
                            horizontalPosition: 'end',
                            data: {
                                title: 'Entreprise Ajoutée',
                                message: `L'entreprise ${company.name} a été créée avec succès.`,
                                type: 'success'
                            }
                        });
                    },
                    error: () => this.showError('Création impossible', 'Impossible de créer cette entreprise.')
                });
            }
        });
    }

    editCompany(company: Company) {
        const dialogRef = this.dialog.open(CompanyDialogComponent, {
            width: '500px',
            data: {
                company,
                managers: this.managers,
                currentRole: this.currentUserRole
            }
        });

        dialogRef.afterClosed().subscribe(result => {
            if (result) {
                this.companyService.updateCompany(company.id, result).subscribe({
                    next: updatedCompany => {
                        this.dataSource.data = this.dataSource.data.map(item => item.id === updatedCompany.id ? updatedCompany : item);
                        this.notificationService.loadNotifications().subscribe();
                        this.snackBar.openFromComponent(PremiumSnackbarComponent, {
                            duration: 4000,
                            verticalPosition: 'top',
                            horizontalPosition: 'end',
                            data: {
                                title: 'Modifications Enregistrées',
                                message: `Les données de ${updatedCompany.name} ont été mises à jour.`,
                                type: 'success'
                            }
                        });
                    },
                    error: () => this.showError('Modification impossible', 'Impossible de mettre à jour cette entreprise.')
                });
            }
        });
    }

    deleteCompany(company: Company) {
        const dialogRef = this.dialog.open(ConfirmDeleteDialogComponent, {
            width: '400px',
            panelClass: 'glass-dialog',
            data: {
                title: 'Supprimer cette entreprise ?',
                message: `Action critique: Voulez-vous supprimer définitivement <strong>${company.name}</strong> ?<br><br>Cette action est irréversible.`
            }
        });

        dialogRef.afterClosed().subscribe((result: boolean) => {
            if (result) {
                this.companyService.deleteCompany(company.id).subscribe(deleteResult => {
                    if (deleteResult.success) {
                        this.dataSource.data = this.dataSource.data.filter(item => item.id !== company.id);
                        this.notificationService.loadNotifications().subscribe();
                        this.snackBar.openFromComponent(PremiumSnackbarComponent, {
                            duration: 5000,
                            verticalPosition: 'top',
                            horizontalPosition: 'end',
                            data: {
                                title: 'Entreprise Supprimée',
                                message: deleteResult.message,
                                type: 'warning'
                            }
                        });
                        return;
                    }

                    this.snackBar.openFromComponent(PremiumSnackbarComponent, {
                        duration: 6000,
                        verticalPosition: 'top',
                        horizontalPosition: 'end',
                        data: {
                            title: 'Opération Échouée',
                            message: deleteResult.message,
                            type: 'error'
                        }
                    });
                });
            }
        });
    }

    updateStatus(company: Company, status: Company['status']) {
        this.companyService.updateCompanyStatus(company.id, status).subscribe({
            next: updatedCompany => {
                this.dataSource.data = this.dataSource.data.map(item => item.id === updatedCompany.id ? updatedCompany : item);
                this.notificationService.loadNotifications().subscribe();
                this.snackBar.openFromComponent(PremiumSnackbarComponent, {
                    duration: 4000,
                    verticalPosition: 'top',
                    horizontalPosition: 'end',
                    data: {
                        title: 'Statut Mis à Jour',
                        message: `Le nouveau statut est maintenant : ${status}`,
                        type: 'info'
                    }
                });
            },
            error: () => this.showError('Mise à jour impossible', 'Impossible de modifier le statut de cette entreprise.')
        });
    }

    clearManagerOwner(company: Company) {
        this.companyService.clearCompanyOwner(company.id).subscribe({
            next: updatedCompany => {
                this.dataSource.data = this.dataSource.data.map(item => item.id === updatedCompany.id ? updatedCompany : item);
                this.notificationService.loadNotifications().subscribe();
                this.snackBar.openFromComponent(PremiumSnackbarComponent, {
                    duration: 4000,
                    verticalPosition: 'top',
                    horizontalPosition: 'end',
                    data: {
                        title: 'Affectation annulée',
                        message: `Le manager a été retiré de ${updatedCompany.name}.`,
                        type: 'info'
                    }
                });
            },
            error: () => this.showError('Action impossible', 'Impossible de retirer le manager affecté.')
        });
    }

    openPdfPreview(company: Company): void {
        if (!this.isPdfDataUrl(company.documentJustificatif)) {
            this.showError('Document indisponible', 'Aucun PDF valide n\'est associé à cette entreprise.');
            return;
        }

        this.dialog.open(PdfPreviewDialogComponent, {
            maxWidth: '95vw',
            data: {
                pdfUrl: company.documentJustificatif,
                companyName: company.name
            }
        });
    }

    showError(title: string, message: string) {
        this.snackBar.openFromComponent(PremiumSnackbarComponent, {
            duration: 5000,
            verticalPosition: 'top',
            horizontalPosition: 'end',
            data: {
                title,
                message,
                type: 'error'
            }
        });
    }

    isImageDataUrl(value?: string): boolean {
        return !!value && value.startsWith('data:image/');
    }

    isPdfDataUrl(value?: string): boolean {
        return !!value && value.startsWith('data:application/pdf');
    }
}
