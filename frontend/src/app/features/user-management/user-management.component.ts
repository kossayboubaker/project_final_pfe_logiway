import { Component, OnInit, ViewChild, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTableModule, MatTableDataSource } from '@angular/material/table';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { MatSort, MatSortModule } from '@angular/material/sort';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatMenuModule } from '@angular/material/menu';
import { FormsModule } from '@angular/forms';
import { PremiumSnackbarComponent } from '../../shared/components/premium-snackbar/premium-snackbar.component';
import { ConfirmDeleteDialogComponent } from '../../shared/components/confirm-delete-dialog/confirm-delete-dialog.component';
import { UserPayload, UserService } from '../../core/services/user.service';
import { AuthService } from '../../core/auth.service';

type UserStatus = 'Approved' | 'Rejected' | 'Inactive' | 'Pending';
type UserRoleLabel = 'Driver' | 'Manager' | 'SuperAdmin';

interface UserRow {
    id: number;
    name: string;
    prenom: string;
    nom: string;
    email: string;
    telephone: string;
    pays: string;
    image: string;
    estActif: string;
    role: UserRoleLabel;
    status: UserStatus;
    managerId: number | null;
    rejectionReason?: string | null;
    emailVerifie?: boolean;
}

interface UserFormModel {
    name: string;
    email: string;
    telephone: string;
    pays: string;
    image: string;
    role: 'Driver' | 'Manager' | 'SuperAdmin';
    status: UserStatus;
    managerId: number | null;
    rejectionReason: string;
}

@Component({
    selector: 'app-user-management',
    standalone: true,
    imports: [
        CommonModule,
        MatCardModule,
        MatIconModule,
        MatButtonModule,
        MatDialogModule,
        MatTableModule,
        MatPaginatorModule,
        MatSortModule,
        MatFormFieldModule,
        MatInputModule,
        MatSelectModule,
        MatTooltipModule,
        MatSnackBarModule,
        MatMenuModule,
        FormsModule
    ],
    templateUrl: './user-management.component.html',
    styleUrls: ['./user-management.component.css']
})
export class UserManagementComponent implements OnInit, AfterViewInit {
    displayedColumns: string[] = ['name', 'telephone', 'pays', 'image', 'role', 'status', 'estActif', 'actions'];
    dataSource = new MatTableDataSource<UserRow>([]);

    @ViewChild(MatPaginator) paginator!: MatPaginator;
    @ViewChild(MatSort) sort!: MatSort;

    users: UserRow[] = [];

    managers: Array<{ id: number; name: string }> = [];

    showAddUserForm = false;
    editingUserId: number | null = null;
    newUser: UserFormModel = this.createEmptyUserForm();
    statusOnlyEdit = false;
    isManagerView = false;

    constructor(
        private snackBar: MatSnackBar,
        private userService: UserService,
        private dialog: MatDialog,
        private authService: AuthService
    ) { }

    ngOnInit() {
        this.isManagerView = this.authService.getUser()?.role === 'MANAGER';
        this.reloadUsers();
    }

    ngAfterViewInit() {
        this.dataSource.paginator = this.paginator;
        this.dataSource.sort = this.sort;
    }

    getActiveCount() {
        return this.dataSource.data.filter(u => u.status === 'Approved').length;
    }

    getPendingCount() {
        return this.dataSource.data.filter(u => u.status === 'Pending').length;
    }

    getRejectedCount() {
        return this.dataSource.data.filter(u => u.status === 'Rejected').length;
    }

    applyFilter(event: Event) {
        const filterValue = (event.target as HTMLInputElement).value;
        this.dataSource.filter = filterValue.trim().toLowerCase();
    }

    openCreateUserForm() {
        this.editingUserId = null;
        this.newUser = this.createEmptyUserForm();
        if (this.isManagerView) {
            this.newUser.role = 'Driver';
            this.newUser.status = 'Pending';
        }
        this.showAddUserForm = true;
    }

    startEditUser(user: UserRow) {
        this.editingUserId = user.id;
        this.statusOnlyEdit = this.isManagerView || !!user.emailVerifie;
        this.newUser = {
            name: user.name,
            email: user.email,
            telephone: user.telephone || '',
            pays: user.pays || '',
            image: user.image || '',
            role: user.role === 'Manager' ? 'Manager' : user.role === 'SuperAdmin' ? 'SuperAdmin' : 'Driver',
            status: user.status,
            managerId: user.managerId,
            rejectionReason: user.rejectionReason || ''
        };
        this.showAddUserForm = true;
    }

    cancelUserForm() {
        this.showAddUserForm = false;
        this.editingUserId = null;
        this.statusOnlyEdit = false;
        this.newUser = this.createEmptyUserForm();
    }

    approveUser(user: any) {
        this.userService.update(user.id, { estActif: true }).subscribe({
            next: () => {
                user.status = 'Approved';
                user.estActif = 'ACTIF';
                user.rejectionReason = null;
                user.emailVerifie = true;
                this.dataSource.data = [...this.dataSource.data];
                this.snackBar.openFromComponent(PremiumSnackbarComponent, {
                    duration: 4000,
                    verticalPosition: 'top',
                    horizontalPosition: 'end',
                    data: {
                        title: 'Utilisateur Approuve',
                        message: `Le compte de ${user.name} est maintenant actif.`,
                        type: 'success'
                    }
                });
            },
            error: (error) => {
                this.showError('Approbation impossible', error, 'Impossible d\'approuver cet utilisateur.');
            }
        });
    }

    rejectUser(user: any) {
        const rejectionReason = window.prompt('Motif du rejet:');
        if (!rejectionReason || !rejectionReason.trim()) {
            this.showError('Rejet annulé', null, 'Veuillez saisir un motif de rejet.');
            return;
        }

        this.userService.update(user.id, { estActif: false, rejectionReason: rejectionReason.trim() }).subscribe({
            next: () => {
                user.status = 'Rejected';
                user.estActif = 'REJETE';
                user.rejectionReason = rejectionReason.trim();
                user.emailVerifie = true;
                this.dataSource.data = [...this.dataSource.data];
                this.snackBar.openFromComponent(PremiumSnackbarComponent, {
                    duration: 4000,
                    verticalPosition: 'top',
                    horizontalPosition: 'end',
                    data: {
                        title: 'Utilisateur Rejete',
                        message: `L'acces a ete refuse pour ${user.name}.`,
                        type: 'error'
                    }
                });
            },
            error: (error) => {
                this.showError('Rejet impossible', error, 'Impossible de rejeter cet utilisateur.');
            }
        });
    }

    setInactive(user: UserRow) {
        this.userService.update(user.id, { estActif: false }).subscribe({
            next: () => {
                user.status = 'Pending';
                user.rejectionReason = null;
                user.estActif = 'EN ATTENTE';
                user.emailVerifie = true;
                this.dataSource.data = [...this.dataSource.data];
                this.snackBar.openFromComponent(PremiumSnackbarComponent, {
                    duration: 3500,
                    verticalPosition: 'top',
                    horizontalPosition: 'end',
                    data: {
                        title: 'Utilisateur Inactif',
                        message: `Le compte de ${user.name} est passe au statut inactif.`,
                        type: 'warning'
                    }
                });
            },
            error: (error) => {
                this.showError('Mise a jour impossible', error, 'Impossible de passer cet utilisateur en inactif.');
            }
        });
    }

    activeCalendarUserEmail: string | null = null;
    actionTargetUser: UserRow | null = null;

    setActionTarget(user: UserRow): void {
        this.actionTargetUser = user;
    }

    clearActionTarget(): void {
        this.actionTargetUser = null;
    }

    assignToManager(user: UserRow | null, managerId: number | string) {
        if (!user || !managerId) {
            return;
        }

        const managerNumericId = Number(managerId);
        const managerName = this.managers.find(m => m.id === managerNumericId)?.name;
        this.userService.update(user.id, { managerId: managerNumericId }).subscribe({
            next: () => {
                user.managerId = managerNumericId;
                this.reloadUsers();
                this.snackBar.openFromComponent(PremiumSnackbarComponent, {
                    duration: 4000,
                    verticalPosition: 'top',
                    horizontalPosition: 'end',
                    data: {
                        title: 'Affectation Manager',
                        message: `${user.name} est désormais sous la responsabilité de ${managerName}.`,
                        type: 'info'
                    }
                });
            },
            error: (error) => {
                this.showError('Affectation impossible', error, 'Impossible de modifier le manager de cet utilisateur.');
            }
        });
    }



    toggleAddUserForm() {
        if (this.showAddUserForm) {
            this.cancelUserForm();
            return;
        }

        this.openCreateUserForm();
    }

    submitUserForm() {
        if (!this.statusOnlyEdit && (!this.newUser.name.trim() || !this.newUser.email.trim() || !this.newUser.role)) {
            return;
        }

        if (this.editingUserId == null) {
            const createPayload = this.buildCreatePayloadFromForm();
            this.userService.create(createPayload).subscribe({
                next: () => {
                    this.showSuccess('Utilisateur Cree', `Le compte de ${this.newUser.name} a ete ajoute avec succes.`);
                    this.cancelUserForm();
                    this.reloadUsers();
                },
                error: (error) => {
                    this.showError('Creation impossible', error, 'La creation de l\'utilisateur a echoue.');
                }
            });
            return;
        }

        const payload = this.buildPayloadFromForm();
        this.userService.update(this.editingUserId, payload).subscribe({
            next: () => {
                this.showSuccess('Utilisateur Modifie', `Les informations de ${this.newUser.name} ont ete mises a jour.`);
                this.cancelUserForm();
                this.reloadUsers();
            },
            error: (error) => {
                this.showError('Modification impossible', error, 'La modification de l\'utilisateur a echoue.');
            }
        });
    }

    deleteUser(user: UserRow) {
        const dialogRef = this.dialog.open(ConfirmDeleteDialogComponent, {
            width: '420px',
            panelClass: 'glass-dialog',
            data: {
                title: 'Supprimer cet utilisateur ?',
                message: `Voulez-vous supprimer definitivement <strong>${user.name}</strong> ?<br><br>Cette action est irreversible.`
            }
        });

        dialogRef.afterClosed().subscribe((result: boolean) => {
            if (!result) {
                return;
            }

            this.userService.delete(user.id).subscribe({
                next: (response) => {
                    this.showSuccess('Utilisateur Supprime', response?.message || `Le compte de ${user.name} a ete supprime.`);
                    this.reloadUsers();
                },
                error: (error) => {
                    this.showError('Suppression impossible', error, 'La suppression de l\'utilisateur a echoue.');
                }
            });
        });
    }

    private reloadUsers() {
        this.userService.list().subscribe({
            next: (users) => {
                const mappedUsers: UserRow[] = (users || []).map((u: any) => ({
                    id: u.id,
                    name: `${u.prenom || ''} ${u.nom || ''}`.trim(),
                    prenom: u.prenom || '',
                    nom: u.nom || '',
                    email: u.email,
                    telephone: u.telephone || '',
                    pays: u.pays || '',
                    image: u.image || '',
                    estActif: u.estActif === 'ACTIF'
                        ? 'ACTIF'
                        : u.estActif === 'REJETE'
                            ? 'REJETE'
                            : 'EN ATTENTE',
                    role: (u.role === 'MANAGER' ? 'Manager' : u.role === 'CHAUFFEUR' ? 'Driver' : 'SuperAdmin') as UserRoleLabel,
                    status: (u.estActif === 'ACTIF'
                        ? 'Approved'
                        : u.estActif === 'REJETE'
                            ? 'Rejected'
                            : 'Pending') as UserStatus,
                    managerId: u.managerId ?? null,
                    rejectionReason: u.rejectionReason ?? null,
                    emailVerifie: !!u.emailVerifie
                }));

                this.users = this.isManagerView
                    ? mappedUsers.filter(user => user.role === 'Driver')
                    : mappedUsers;

                this.managers = this.users
                    .filter(user => user.role === 'Manager')
                    .map(user => ({ id: user.id, name: user.name }));
                this.dataSource.data = this.users;
            }
        });
    }

    private createEmptyUserForm(): UserFormModel {
        return {
            name: '',
            email: '',
            telephone: '',
            pays: '',
            image: '',
            role: 'Driver',
            status: 'Approved',
            managerId: null,
            rejectionReason: ''
        };
    }

    private buildCreatePayloadFromForm(): UserPayload {
        const [prenom, ...nomParts] = this.newUser.name.trim().split(/\s+/);
        const nom = nomParts.length ? nomParts.join(' ') : prenom;
        const role: UserPayload['role'] = this.isManagerView
            ? 'CHAUFFEUR'
            : this.newUser.role === 'Manager'
                ? 'MANAGER'
                : this.newUser.role === 'SuperAdmin'
                    ? 'SUPERADMIN'
                    : 'CHAUFFEUR';

        return {
            prenom,
            nom,
            email: this.newUser.email.trim(),
            telephone: this.newUser.telephone.trim() || undefined,
            pays: this.newUser.pays.trim() || undefined,
            image: this.newUser.image.trim() || undefined,
            role,
            // Manager-created chauffeurs are inactive by default (EN ATTENTE) and require SuperAdmin approval
            estActif: this.isManagerView ? false : this.newUser.status === 'Approved',
            rejectionReason: this.newUser.status === 'Rejected' ? this.newUser.rejectionReason.trim() : undefined,
            managerId: this.isManagerView ? undefined : this.newUser.managerId ? Number(this.newUser.managerId) : undefined
        };
    }

    private buildPayloadFromForm(): Partial<UserPayload & { estActif: boolean }> {
        if (this.editingUserId != null && this.statusOnlyEdit) {
            return {
                estActif: this.newUser.status === 'Approved',
                rejectionReason: this.newUser.status === 'Rejected' ? this.newUser.rejectionReason.trim() : undefined
            };
        }

        const [prenom, ...nomParts] = this.newUser.name.trim().split(/\s+/);
        const nom = nomParts.length ? nomParts.join(' ') : prenom;
        const editRole: UserPayload['role'] = this.newUser.role === 'SuperAdmin'
            ? 'SUPERADMIN'
            : this.newUser.role === 'Manager'
                ? 'MANAGER'
                : 'CHAUFFEUR';

        return {
            prenom,
            nom,
            email: this.newUser.email.trim(),
            telephone: this.newUser.telephone.trim() || undefined,
            pays: this.newUser.pays.trim() || undefined,
            image: this.newUser.image.trim() || undefined,
            role: editRole,
            estActif: this.newUser.status === 'Approved',
            rejectionReason: this.newUser.status === 'Rejected' ? this.newUser.rejectionReason.trim() : undefined,
            managerId: this.newUser.managerId ? Number(this.newUser.managerId) : undefined
        };
    }

    getStatusBadgeClass(status: UserStatus): string {
        switch (status) {
            case 'Approved':
                return 'approved';
            case 'Rejected':
                return 'rejected';
            default:
                return 'pending';
        }
    }

    private showSuccess(title: string, message: string) {
        this.snackBar.openFromComponent(PremiumSnackbarComponent, {
            duration: 4000,
            verticalPosition: 'top',
            horizontalPosition: 'end',
            data: {
                title,
                message,
                type: 'success'
            }
        });
    }

    private showError(title: string, error: any, fallbackMessage = 'Une erreur est survenue.') {
        const apiMessage = error?.error?.message;
        const message = apiMessage === 'Email already exists'
            ? 'Cet email existe deja. Choisissez une autre adresse.'
            : apiMessage || fallbackMessage;

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
}
