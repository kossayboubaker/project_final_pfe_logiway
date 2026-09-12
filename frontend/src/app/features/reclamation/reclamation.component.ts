import { AfterViewInit, Component, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { MatSelectModule } from '@angular/material/select';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { AuthService } from '../../core/auth.service';
import { ReclamationService, ReclamationRecord } from '../../core/services/reclamation.service';
import { MatDialogRef } from '@angular/material/dialog';
import { MAT_DIALOG_DATA } from '@angular/material/dialog';
import { Inject } from '@angular/core';
import { ReclamationCreateDialogComponent, ReclamationCreateDialogResult } from './reclamation-create-dialog.component';

@Component({
    selector: 'app-reclamation',
    standalone: true,
    imports: [
        CommonModule,
        FormsModule,
        MatCardModule,
        MatButtonModule,
        MatChipsModule,
        MatDialogModule,
        MatFormFieldModule,
        MatIconModule,
        MatInputModule,
        MatPaginatorModule,
        MatSelectModule,
        MatTooltipModule,
        MatSnackBarModule,
        MatTableModule
    ],
    templateUrl: './reclamation.component.html',
    styleUrls: ['./reclamation.component.css']
})
export class ReclamationComponent implements OnInit, AfterViewInit {
    @ViewChild(MatPaginator) paginator!: MatPaginator;

    readonly statusOptions = [
        { value: '', label: 'Tous les statuts' },
        { value: 'EN_COURS', label: 'En cours' },
        { value: 'RESOLU', label: 'Résolu' },
        { value: 'REJETE', label: 'Rejeté' }
    ];

    readonly priorityOptions = [
        { value: '', label: 'Toutes les priorités' },
        { value: 'NORMAL', label: 'Normal' },
        { value: 'URGENT', label: 'Urgent' }
    ];

    get totalReclamations(): number {
        return this.dataSource.filteredData.length;
    }

    get resolvedReclamations(): number {
        return this.dataSource.filteredData.filter(reclamation => reclamation.statut === 'RESOLU').length;
    }

    get rejectedReclamations(): number {
        return this.dataSource.filteredData.filter(reclamation => reclamation.statut === 'REJETE').length;
    }

    get pendingReclamations(): number {
        return this.dataSource.filteredData.filter(reclamation => reclamation.statut === 'EN_COURS').length;
    }

    displayedColumns: string[] = ['sujet', 'description', 'priorite', 'statut', 'auteur', 'dateCreation', 'actions'];
    dataSource = new MatTableDataSource<ReclamationRecord>([]);
    currentUserRole = '';
    currentUserId: number | null = null;
    searchText = '';
    statusFilter = '';
    priorityFilter = '';
    selectedResolution: ReclamationRecord | null = null;

    constructor(
        private readonly authService: AuthService,
        private readonly reclamationService: ReclamationService,
        private readonly dialog: MatDialog,
        private readonly snackBar: MatSnackBar
    ) {
        this.dataSource.filterPredicate = (row, filterValue) => {
            const filters = JSON.parse(filterValue || '{}') as { search: string; status: string; priority: string };
            const search = (filters.search || '').trim().toLowerCase();
            const status = filters.status || '';
            const priority = filters.priority || '';
            const searchTokens = search.split(/\s+/).filter(Boolean);

            const haystack = [
                row.sujet,
                row.description,
                row.priorite,
                row.statut,
                row.utilisateurNom,
                row.utilisateurEmail
            ].join(' ').toLowerCase();

            const matchesSearch = !searchTokens.length || searchTokens.every(token => haystack.includes(token));

            const matchesStatus = !status || row.statut === status;
            const matchesPriority = !priority || row.priorite === priority;
            return matchesSearch && matchesStatus && matchesPriority;
        };
    }

    ngOnInit(): void {
        const currentUser = this.authService.getUser();
        this.currentUserRole = currentUser?.role || 'DRIVER';
        this.currentUserId = typeof currentUser?.id === 'number' ? currentUser.id : null;
        if (this.currentUserRole !== 'SUPERADMIN') {
            this.displayedColumns = ['sujet', 'description', 'priorite', 'statut', 'dateCreation', 'actions'];
        }
        this.loadReclamations();
    }

    ngAfterViewInit(): void {
        this.dataSource.paginator = this.paginator;
    }

    loadReclamations(): void {
        this.reclamationService.list().subscribe({
            next: reclamations => {
                this.dataSource.data = reclamations;
                this.applyFilters();
            },
            error: () => this.snackBar.open('Impossible de charger les réclamations', undefined, { duration: 3000 })
        });
    }

    openCreateDialog(): void {
        const dialogRef = this.dialog.open(ReclamationCreateDialogComponent, {
            width: '720px',
            maxWidth: '95vw'
        });

        dialogRef.afterClosed().subscribe((result?: ReclamationCreateDialogResult) => {
            if (!result) {
                return;
            }
            this.snackBar.open('Votre réclamation a été soumise avec succès. Le SuperAdmin en a été informé.', undefined, { duration: 3500 });
            this.loadReclamations();
        });
    }

    openEditDialog(item: ReclamationRecord): void {
        const dialogRef = this.dialog.open(ReclamationCreateDialogComponent, {
            width: '720px',
            maxWidth: '95vw',
            data: item
        });

        dialogRef.afterClosed().subscribe((result?: ReclamationCreateDialogResult) => {
            if (!result) {
                return;
            }

            this.snackBar.open('Réclamation modifiée avec succès.', undefined, { duration: 3500 });
            this.loadReclamations();
        });
    }

    deleteReclamation(item: ReclamationRecord): void {
        if (!window.confirm('Supprimer définitivement cette réclamation ?')) {
            return;
        }

        this.reclamationService.delete(item.id).subscribe({
            next: () => {
                this.snackBar.open('Réclamation supprimée.', undefined, { duration: 3000 });
                this.loadReclamations();
            },
            error: err => {
                const message = err?.error?.message || 'La réclamation n’a pas pu être supprimée.';
                this.snackBar.open(message, undefined, { duration: 4000 });
            }
        });
    }

    resolve(item: ReclamationRecord): void {
        const commentaire = window.prompt('Commentaire de résolution', '')?.trim() || '';
        if (!commentaire) {
            this.snackBar.open('Le commentaire est obligatoire', undefined, { duration: 2500 });
            return;
        }

        this.reclamationService.resolve(item.id, commentaire).subscribe({
            next: () => {
                this.snackBar.open('Réclamation résolue', undefined, { duration: 3000 });
                this.loadReclamations();
            },
            error: () => this.snackBar.open('Impossible de résoudre la réclamation', undefined, { duration: 3500 })
        });
    }

    reject(item: ReclamationRecord): void {
        const commentaire = window.prompt('Commentaire de rejet', '')?.trim() || '';
        if (!commentaire) {
            this.snackBar.open('Le commentaire est obligatoire', undefined, { duration: 2500 });
            return;
        }

        this.reclamationService.reject(item.id, commentaire).subscribe({
            next: () => {
                this.snackBar.open('Réclamation rejetée', undefined, { duration: 3000 });
                this.loadReclamations();
            },
            error: () => this.snackBar.open('Impossible de rejeter la réclamation', undefined, { duration: 3500 })
        });
    }

    openResolutionDetails(item: ReclamationRecord): void {
        this.selectedResolution = item;
    }

    closeResolutionDetails(): void {
        this.selectedResolution = null;
    }

    applyFilters(): void {
        const filterValue = JSON.stringify({
            search: this.searchText,
            status: this.statusFilter,
            priority: this.priorityFilter
        });
        this.dataSource.filter = filterValue;
        if (this.dataSource.paginator) {
            this.dataSource.paginator.firstPage();
        }
    }

    resetFilters(): void {
        this.searchText = '';
        this.statusFilter = '';
        this.priorityFilter = '';
        this.applyFilters();
    }

    canCreate(): boolean {
        return this.currentUserRole === 'MANAGER' || this.currentUserRole === 'DRIVER' || this.currentUserRole === 'CHAUFFEUR';
    }

    canModerate(): boolean {
        return this.currentUserRole === 'SUPERADMIN';
    }

    canEditRow(item: ReclamationRecord): boolean {
        return this.canManageOwnReclamation(item) && item.statut === 'EN_COURS';
    }

    canDeleteRow(item: ReclamationRecord): boolean {
        return this.canManageOwnReclamation(item) && item.statut === 'EN_COURS';
    }

    canOwnRow(item: ReclamationRecord): boolean {
        return !!this.currentUserId && item.utilisateurId === this.currentUserId;
    }

    canManageOwnReclamation(item: ReclamationRecord): boolean {
        return (this.currentUserRole === 'MANAGER' || this.currentUserRole === 'CHAUFFEUR') && this.canOwnRow(item);
    }

    trackById(index: number, item: ReclamationRecord): string {
        return item.id;
    }

    statusLabel(status: string): string {
        switch (status) {
            case 'EN_COURS': return 'En cours';
            case 'RESOLU': return 'Résolu';
            case 'REJETE': return 'Rejeté';
            default: return status;
        }
    }

    priorityLabel(priority: string): string {
        return priority === 'URGENT' ? 'Urgent' : 'Normal';
    }

    resolutionPanelTitle(): string {
        return this.currentUserRole === 'SUPERADMIN' ? 'Votre commentaire de résolution' : 'Réponse du SuperAdmin';
    }

    resolutionPanelSubtitle(): string {
        if (!this.selectedResolution) {
            return '';
        }

        return this.selectedResolution.statut === 'REJETE'
            ? 'Motif du rejet'
            : 'Commentaire de résolution';
    }

    hasResolutionComment(item: ReclamationRecord): boolean {
        return !!item.commentaireResolution && (item.statut === 'RESOLU' || item.statut === 'REJETE');
    }

    searchHint(): string {
        return 'Recherche intelligente: sujet, description, auteur, priorité, statut';
    }

    formatDate(value?: string | null): string {
        return value ? new Date(value).toLocaleDateString('fr-FR') : '-';
    }
}

// ReclamationCreateDialogComponent is now defined in its own standalone file:
// reclamation-create-dialog.component.ts
