import { Component, OnInit, ViewChild, AfterViewInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
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
import { FormsModule } from '@angular/forms';
import { forkJoin, of } from 'rxjs';
import { catchError, finalize } from 'rxjs/operators';

import { AuthService } from '../../core/auth.service';
import { Company, CompanyService } from '../../core/services/company.service';
import { UserListItem, UserService } from '../../core/services/user.service';
import { PremiumSnackbarComponent } from '../../shared/components/premium-snackbar/premium-snackbar.component';
import { ConfirmDeleteDialogComponent } from '../../shared/components/confirm-delete-dialog/confirm-delete-dialog.component';

interface SectorManagerView {
    id: number;
    fullName: string;
    email: string;
    entrepriseId?: number | null;
    secteurId?: number | null;
}

interface SectorDriverView {
    id: number;
    fullName: string;
    managerId: number;
}

interface SectorRecord {
    id?: number;
    nom: string;
    description?: string;
    zoneGeographique?: string;
    codesPostaux?: string;
    entrepriseId?: number;
    managerId?: number | null;
    managers?: SectorManagerView[];
    chauffeurs?: SectorDriverView[];
}

interface SectorApiRecord {
    id?: number;
    nom?: string;
    description?: string;
    zoneGeographique?: string;
    codesPostaux?: string;
    entrepriseId?: number;
    managers?: Array<Partial<{ id: number; prenom: string; nom: string; fullName: string; email: string }>>;
    chauffeurs?: Array<Partial<{ id: number; prenom: string; nom: string; fullName: string; managerId: number }>>;
    managerId?: number | null;
}

interface SectorPayload {
    nom: string;
    description?: string;
    zoneGeographique?: string;
    codesPostaux?: string;
    entrepriseId?: number;
    managerId?: number | null;
}

@Component({
  selector: 'app-secteur-management',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatIconModule,
    MatButtonModule,
    MatTableModule,
    MatPaginatorModule,
    MatSortModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatTooltipModule,
    MatSnackBarModule,
    MatDialogModule,
    FormsModule
  ],
  templateUrl: './secteur-management.component.html',
  styleUrls: ['./secteur-management.component.css']
})
export class SecteurManagementComponent implements OnInit, AfterViewInit, OnDestroy {
    displayedColumns: string[] = ['nom', 'zone', 'managers', 'chauffeurs', 'actions'];
    dataSource = new MatTableDataSource<SectorRecord>([]);
    selectedSecteur: SectorRecord | null = null;
    selectedManagerId: number | null = null;
    enterprises: Company[] = [];
    availableEnterprises: Company[] = [];
    selectedEntrepriseId: string | null = null;
    isLightMode = false;
    isLoading = false;
    loadError = '';
    themeObserver?: MutationObserver;
    managers: SectorManagerView[] = [];
    availableManagers: SectorManagerView[] = [];
    chauffeurs: SectorDriverView[] = [];
    private readonly apiUrl = 'http://localhost:8080/api/secteurs';
    currentUserRole: string | null = null;
    canManageSectors = false;
    isSuperAdmin = false;
  
  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  // Form State
  showForm = false;
  isEditMode = false;
    currentSecteur: Partial<SectorRecord> = {};

  constructor(
      private http: HttpClient,
      private authService: AuthService,
      private companyService: CompanyService,
      private userService: UserService,
      private snackBar: MatSnackBar,
      private dialog: MatDialog,
      private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
        this.currentUserRole = this.authService.getUser()?.role || null;
      this.canManageSectors = this.currentUserRole === 'SUPERADMIN';
      this.isSuperAdmin = this.currentUserRole === 'SUPERADMIN';
    this.syncTheme();
    this.themeObserver = new MutationObserver(() => this.syncTheme());
    this.themeObserver.observe(document.body, { attributes: true, attributeFilter: ['data-theme'] });

    this.dataSource.filterPredicate = (secteur, filterValue) => this.matchesFilter(secteur, filterValue);
    this.loadData();
  }

  ngOnDestroy(): void {
      this.themeObserver?.disconnect();
  }

  ngAfterViewInit() {
    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;
  }

  refreshTable() {
      this.dataSource.data = [...this.dataSource.data];
      if (this.selectedSecteur?.id != null) {
          this.selectedSecteur = this.dataSource.data.find(secteur => secteur.id === this.selectedSecteur?.id) || null;
      }
      this.cdr.markForCheck();
  }

  getAssignedCount() {
      return this.dataSource.data.filter(secteur => this.getAssignedManagers(secteur.id).length > 0).length;
  }

  getUnassignedCount() {
      return this.dataSource.data.filter(secteur => this.getAssignedManagers(secteur.id).length === 0).length;
  }

  getTotalManagers(): number {
      return this.managers.length;
    }

  getTotalChauffeurs(): number {
      return this.chauffeurs.length;
    }

  applyFilter(event: Event) {
    const filterValue = (event.target as HTMLInputElement).value;
    this.dataSource.filter = filterValue.trim().toLowerCase();
    
    if (this.dataSource.paginator) {
        this.dataSource.paginator.firstPage();
    }
  }

  openForm(secteur?: SectorRecord) {
      if (secteur) {
          if (!this.canManageSectors) {
              return;
          }
          this.isEditMode = true;
          this.currentSecteur = { ...secteur };
          this.selectedEntrepriseId = secteur.entrepriseId?.toString() ?? null;
          this.selectedManagerId = secteur.managerId ?? secteur.managers?.[0]?.id ?? null;
      } else {
          if (!this.canManageSectors) {
              return;
          }
          this.isEditMode = false;
          this.currentSecteur = {
              nom: '',
              description: '',
              zoneGeographique: '',
              codesPostaux: ''
          };
          this.selectedEntrepriseId = this.availableEnterprises[0]?.id ?? null;
          this.selectedManagerId = null;
      }
      this.refreshAvailableManagers();
      this.showForm = true;
  }

  closeForm() {
      this.showForm = false;
      this.currentSecteur = {};
      this.isEditMode = false;
      this.selectedEntrepriseId = null;
      this.selectedManagerId = null;
      this.availableManagers = [];
  }

  onEntrepriseSelectionChange() {
      this.refreshAvailableManagers();
  }

  private refreshAvailableManagers(): void {
      const selectedEnterpriseId = this.selectedEntrepriseId ? Number(this.selectedEntrepriseId) : null;
      const currentSectorId = this.currentSecteur.id ?? null;

      this.availableManagers = this.managers.filter(manager => {
          const belongsToSelectedEnterprise = selectedEnterpriseId != null && manager.entrepriseId === selectedEnterpriseId;
          const isUnassigned = manager.secteurId == null;
          const isCurrentManagerOfSector = currentSectorId != null && manager.secteurId === currentSectorId;
          return belongsToSelectedEnterprise && (isUnassigned || isCurrentManagerOfSector);
      });

      if (!this.availableManagers.some(manager => manager.id === this.selectedManagerId)) {
          this.selectedManagerId = this.availableManagers[0]?.id ?? null;
      }
  }

  saveSecteur() {
      const name = this.normalizeText(this.currentSecteur.nom);
      const description = this.normalizeText(this.currentSecteur.description);
      const zoneGeographique = this.normalizeText(this.currentSecteur.zoneGeographique);
      const codesPostaux = this.normalizeText(this.currentSecteur.codesPostaux);
      const enterpriseId = this.selectedEntrepriseId ? Number(this.selectedEntrepriseId) : null;

      if (!this.canManageSectors) {
          this.notify('Accès refusé', 'Seul le SuperAdmin peut gérer les secteurs.', 'error');
          return;
      }

      if (!name || name.length < 3 || name.length > 100) {
          this.notify('Validation', 'Le nom du secteur doit contenir entre 3 et 100 caractères.', 'warning');
          return;
      }

      if (!zoneGeographique) {
          this.notify('Validation', 'La zone géographique est obligatoire.', 'warning');
          return;
      }

      const duplicatedName = this.dataSource.data.some((secteur: SectorRecord) =>
          secteur.nom.toLowerCase() === name.toLowerCase()
          && secteur.id !== this.currentSecteur.id
          && String(secteur.entrepriseId ?? '') === String(enterpriseId ?? '')
      );

      if (duplicatedName) {
          this.notify('Validation', 'Un secteur avec ce nom existe déjà.', 'error');
          return;
      }

      if (!enterpriseId || Number.isNaN(enterpriseId)) {
          this.notify('Validation', 'Veuillez sélectionner une entreprise disponible.', 'warning');
          return;
      }

      if (!this.selectedManagerId) {
          this.notify('Validation', 'Veuillez sélectionner un manager disponible.', 'warning');
          return;
      }

      const payload: SectorPayload = {
          nom: name,
          description,
          zoneGeographique,
          codesPostaux,
          entrepriseId: enterpriseId,
          managerId: this.selectedManagerId
      };

      if (this.isEditMode) {
          const sectorId = this.currentSecteur.id;
          if (sectorId == null) {
              this.notify('Validation', 'Impossible de modifier ce secteur sans identifiant.', 'error');
              return;
          }

          this.http.put<SectorApiRecord>(`${this.apiUrl}/${sectorId}`, payload).subscribe({
              next: () => {
                  this.notify('Secteur mis à jour', `Les informations du secteur ${name} ont été mises à jour.`, 'success');
                  this.loadData(sectorId);
                  this.closeForm();
              },
              error: (error) => {
                  const backendMessage = error?.error?.message || error?.message || 'La mise à jour a échoué.';
                  this.notify('Erreur', backendMessage, 'error');
              }
          });
          return;
      } else {
          this.http.post<SectorApiRecord>(this.apiUrl, payload).subscribe({
              next: () => {
                  this.notify('Nouveau secteur', `Nouveau secteur créé : ${name}`, 'success');
                  this.loadData();
                  this.closeForm();
              },
              error: (error) => {
                  const backendMessage = error?.error?.message || error?.message || 'La création a échoué.';
                  this.notify('Erreur', backendMessage, 'error');
              }
          });
          return;
      }
  }

  deleteSecteur(secteur: SectorRecord) {
      if (!this.canManageSectors) {
          this.notify('Accès refusé', 'Seul le SuperAdmin peut supprimer un secteur.', 'error');
          return;
      }

      const assignedManagers = this.getAssignedManagers(secteur.id);
      const assignedDrivers = this.getAssignedDrivers(secteur.id);
      if (assignedManagers.length > 0 || assignedDrivers.length > 0) {
          this.notify('Suppression impossible', `Impossible de supprimer ce secteur : ${assignedManagers.length} manager(s) et ${assignedDrivers.length} chauffeur(s) y sont encore affectés.`, 'error');
          return;
      }

      const sectorId = secteur.id;
      if (sectorId == null) {
          this.notify('Suppression impossible', 'Identifiant de secteur introuvable.', 'error');
          return;
      }

      const dialogRef = this.dialog.open(ConfirmDeleteDialogComponent, {
          width: '400px',
          panelClass: 'glass-dialog',
          data: {
              title: 'Supprimer ce secteur ?',
              message: `Voulez-vous vraiment supprimer le secteur <strong>${secteur.nom}</strong> ?<br><br>Cette action est irréversible.`
          }
      });

      dialogRef.afterClosed().subscribe(result => {
          if (result) {
              this.http.delete(`${this.apiUrl}/${sectorId}`).subscribe({
                  next: () => {
                      this.notify('Suppression Effectuée', `Le secteur a été retiré de la liste.`, 'error');
                      if (this.selectedSecteur?.id === sectorId) {
                          this.selectedSecteur = null;
                          this.selectedManagerId = null;
                      }
                      this.loadData();
                  },
                  error: (error) => {
                      const backendMessage = error?.error?.message || error?.message || 'La suppression a échoué.';
                      this.notify('Erreur', backendMessage, 'error');
                  }
              });
          }
      });
  }

  selectSecteur(secteur: SectorRecord) {
      this.selectedSecteur = secteur;
      this.selectedManagerId = this.getAssignedManagers(secteur.id)[0]?.id ?? null;
  }

  clearSelection() {
      this.selectedSecteur = null;
      this.selectedManagerId = null;
  }

  getManagerName(managerId?: number): string {
      const manager = this.managers.find(m => m.id === managerId);
      return manager ? manager.fullName : 'Inconnu';
  }

  getManagerEmail(managerId?: number): string {
      const manager = this.managers.find(m => m.id === managerId);
      return manager ? manager.email : '—';
  }

  getAssignedManagers(secteurId?: number): SectorManagerView[] {
      if (secteurId == null) {
          return [];
      }

      const secteur = this.dataSource.data.find(item => item.id === secteurId);
      return secteur?.managers ?? [];
  }

  getAssignedDrivers(secteurId?: number): SectorDriverView[] {
      if (secteurId == null) {
          return [];
      }

      const secteur = this.dataSource.data.find(item => item.id === secteurId);
      return secteur?.chauffeurs ?? [];
  }

  getManagerTooltip(secteurId?: number): string {
      const assignedManagers = this.getAssignedManagers(secteurId);
      if (!assignedManagers.length) {
          return 'Aucun manager affecté';
      }

      return assignedManagers.map(manager => `${manager.fullName} - ${manager.email}`).join(' | ');
  }

    getChauffeurCount(secteurId?: number): number {
          return this.getAssignedDrivers(secteurId).length;
  }

  assignSelectedManager() {
      if (!this.canManageSectors) {
          this.notify('Accès refusé', 'Seul le SuperAdmin peut affecter un manager à un secteur.', 'error');
          return;
      }

      if (!this.selectedSecteur || !this.selectedManagerId) {
          this.notify('Assignation', 'Veuillez choisir un manager à affecter.', 'warning');
          return;
      }

          const sectorId = this.selectedSecteur.id;
          if (sectorId == null) {
              this.notify('Assignation', 'Identifiant du secteur introuvable.', 'error');
              return;
          }

          const manager = this.availableManagers.find(item => item.id === this.selectedManagerId);
      if (!manager) {
          this.notify('Assignation', 'Manager introuvable.', 'error');
          return;
      }

          if (this.getAssignedManagers(sectorId).some(item => item.id === manager.id)) {
          this.notify('Assignation', 'Ce manager est déjà affecté à ce secteur.', 'info');
          return;
      }

          this.http.put(`${this.apiUrl}/${sectorId}/manager/${manager.id}`, {}).subscribe({
              next: () => {
                  this.notify('Assignation Manager', `Vous avez été assigné au secteur ${this.selectedSecteur?.nom} (${this.selectedSecteur?.zoneGeographique || 'Zone non renseignée'})`, 'success');
                  this.loadData(sectorId);
              },
              error: (error) => {
                  const backendMessage = error?.error?.message || error?.message || 'L\'assignation a échoué.';
                  this.notify('Erreur', backendMessage, 'error');
              }
          });
  }

  removeSelectedManager(managerId: number) {
      if (!this.canManageSectors) {
          this.notify('Accès refusé', 'Seul le SuperAdmin peut retirer un manager d’un secteur.', 'error');
          return;
      }

      if (!this.selectedSecteur) {
          return;
      }

          const sectorId = this.selectedSecteur.id;
          if (sectorId == null) {
              this.notify('Retrait impossible', 'Identifiant du secteur introuvable.', 'error');
              return;
          }

          const manager = this.managers.find(item => item.id === managerId);
          if (!manager || !this.getAssignedManagers(sectorId).some(item => item.id === managerId)) {
          this.notify('Retrait impossible', 'Ce Manager n\'est pas affecté à ce secteur.', 'error');
          return;
      }

          this.http.delete(`${this.apiUrl}/${sectorId}/manager/${managerId}`).subscribe({
              next: () => {
                  this.notify('Retrait Manager', `Vous avez été retiré du secteur ${this.selectedSecteur?.nom}`, 'warning');
                  this.loadData(sectorId);
              },
              error: (error) => {
                  const backendMessage = error?.error?.message || error?.message || 'Le retrait a échoué.';
                  this.notify('Erreur', backendMessage, 'error');
              }
          });
  }

  getSelectedManager(): SectorManagerView | undefined {
      return this.selectedManagerId ? this.managers.find(manager => manager.id === this.selectedManagerId) : undefined;
  }

  formatDate(value?: string): string {
      if (!value) {
          return '—';
      }

      return new Intl.DateTimeFormat('fr-FR', { dateStyle: 'medium' }).format(new Date(value));
  }

  trackBySectorId(_index: number, secteur: SectorRecord) {
      return secteur.id;
  }

  trackByManagerId(_index: number, manager: SectorManagerView) {
      return manager.id;
  }

  private notify(title: string, message: string, type: 'success' | 'error' | 'info' | 'warning') {
      this.snackBar.openFromComponent(PremiumSnackbarComponent, {
          duration: 4000,
          verticalPosition: 'top',
          horizontalPosition: 'end',
          data: { title, message, type }
      });
  }

  private syncTheme() {
      this.isLightMode = document.body.getAttribute('data-theme') === 'light';
      this.cdr.markForCheck();
  }

  private loadData(keepSelectedId?: number) {
      this.isLoading = true;
      this.loadError = '';

      forkJoin({
          secteurs: this.http.get<SectorApiRecord[]>(this.apiUrl).pipe(catchError(() => of([]))),
          users: this.userService.list().pipe(catchError(() => of([]))),
          entreprises: this.companyService.getCompanies().pipe(catchError(() => of([])))
      }).pipe(
          finalize(() => {
              this.isLoading = false;
              this.cdr.markForCheck();
          })
      ).subscribe({
          next: ({ secteurs, users, entreprises }) => {
              this.managers = this.mapManagers(users);
              this.chauffeurs = this.mapChauffeurs(users);
              this.enterprises = entreprises;
              this.dataSource.data = secteurs.map(secteur => this.normalizeSector(secteur));
              this.updateAvailableEnterprises();
              this.applyRoleVisibility();

              if (this.paginator) {
                  this.dataSource.paginator = this.paginator;
              }
              if (this.sort) {
                  this.dataSource.sort = this.sort;
              }

              const selectedId = keepSelectedId ?? this.selectedSecteur?.id;
              if (selectedId != null) {
                  this.selectedSecteur = this.dataSource.data.find(secteur => secteur.id === selectedId) || null;
                  this.selectedManagerId = this.selectedSecteur ? this.getAssignedManagers(this.selectedSecteur.id)[0]?.id ?? null : null;
              } else {
                  this.selectedSecteur = null;
                  this.selectedManagerId = null;
              }

              if (!this.isEditMode && !this.selectedEntrepriseId) {
                  this.selectedEntrepriseId = this.availableEnterprises[0]?.id ?? null;
              }
          },
          error: (error) => {
              this.loadError = 'Impossible de charger les secteurs depuis le backend.';
              const backendMessage = error?.error?.message || error?.message || this.loadError;
              this.notify('Chargement impossible', backendMessage, 'error');
          }
      });
  }

  private mapManagers(users: UserListItem[]): SectorManagerView[] {
      return users
          .filter(user => user.role === 'MANAGER')
          .map(user => ({
              id: Number(user.id),
              fullName: this.buildFullName(user.prenom, user.nom) || user.email,
              email: user.email,
              entrepriseId: user.entrepriseId ?? null,
              secteurId: user.secteurId ?? null
          }));
  }

  private mapChauffeurs(users: UserListItem[]): SectorDriverView[] {
      return users
          .filter(user => user.role === 'CHAUFFEUR')
          .map(user => ({
              id: Number(user.id),
              fullName: this.buildFullName(user.prenom, user.nom) || user.email,
              managerId: Number(user.managerId ?? 0)
          }))
          .filter(chauffeur => chauffeur.managerId > 0);
  }

  private normalizeSector(sector: SectorApiRecord): SectorRecord {
      const managerCandidates = this.normalizeSectorManagers(sector.managers ?? [], sector.managerId);

      return {
          id: sector.id,
          nom: this.trimText(sector.nom),
          description: this.trimText(sector.description),
          zoneGeographique: this.trimText(sector.zoneGeographique),
          codesPostaux: this.trimText(sector.codesPostaux),
          entrepriseId: sector.entrepriseId ?? undefined,
          managerId: sector.managerId ?? managerCandidates[0]?.id ?? null,
          managers: managerCandidates,
          chauffeurs: this.normalizeSectorDrivers(sector.chauffeurs ?? [])
      };
  }

  private normalizeSectorDrivers(drivers: Array<Partial<{ id: number; prenom: string; nom: string; fullName: string; managerId: number }>>): SectorDriverView[] {
      return drivers
          .map(driver => {
              const id = Number(driver.id);
              if (!Number.isFinite(id) || id <= 0) {
                  return null;
              }

              return {
                  id,
                  fullName: this.trimText(driver.fullName) || this.buildFullName(driver.prenom, driver.nom) || `Chauffeur ${id}`,
                  managerId: Number(driver.managerId ?? 0)
              };
          })
          .filter((driver): driver is SectorDriverView => driver !== null);
  }

  private normalizeSectorManagers(
      managers: Array<Partial<{ id: number; prenom: string; nom: string; fullName: string; email: string }>>,
      managerId?: number | null
  ): SectorManagerView[] {
      const normalized = managers
          .map(manager => this.normalizeManager(manager))
          .filter((manager): manager is SectorManagerView => manager !== null);

      if (!normalized.length && managerId != null) {
          const fallback = this.managers.find(manager => manager.id === managerId);
          return fallback ? [fallback] : [];
      }

      return normalized;
  }

  private normalizeManager(manager: Partial<{ id: number; prenom: string; nom: string; fullName: string; email: string; entrepriseId: number; secteurId: number | null }>): SectorManagerView | null {
      const id = Number(manager.id);
      if (!Number.isFinite(id) || id <= 0) {
          return null;
      }

      const fullName = this.trimText(manager.fullName) || this.buildFullName(manager.prenom, manager.nom) || `Manager ${id}`;

      return {
          id,
          fullName,
          email: this.trimText(manager.email),
          entrepriseId: manager.entrepriseId ?? null,
          secteurId: manager.secteurId ?? null
      };
  }

  private buildFullName(prenom?: string, nom?: string): string {
      return [prenom, nom].filter(Boolean).join(' ').trim();
  }

  private trimText(value?: string | null): string {
      return (value ?? '').trim();
  }

  private normalizeText(value?: string | null): string {
      return (value ?? '').trim();
  }

  private updateAvailableEnterprises(): void {
      const usedEnterpriseIds = new Set(
          this.dataSource.data
              .map(secteur => secteur.entrepriseId)
              .filter((id): id is number => id != null)
              .map(id => String(id))
      );

      this.availableEnterprises = this.enterprises.filter(company => !usedEnterpriseIds.has(company.id));
      if (this.isEditMode && this.currentSecteur.entrepriseId != null) {
          const currentEnterpriseId = String(this.currentSecteur.entrepriseId);
          const currentEnterprise = this.enterprises.find(company => company.id === currentEnterpriseId);
          if (currentEnterprise && !this.availableEnterprises.some(company => company.id === currentEnterpriseId)) {
              this.availableEnterprises = [currentEnterprise, ...this.availableEnterprises];
          }
      }
  }

  private applyRoleVisibility(): void {
      if (this.currentUserRole === 'SUPERADMIN') {
          this.displayedColumns = ['nom', 'zone', 'managers', 'chauffeurs', 'actions'];
          return;
      }

      this.displayedColumns = ['nom', 'zone', 'managers', 'chauffeurs', 'actions'];
  }

  private matchesFilter(secteur: SectorRecord, filterValue: string): boolean {
      const normalizedFilter = filterValue.trim().toLowerCase();
      if (!normalizedFilter) {
          return true;
      }

      const assignedManagers = this.getAssignedManagers(secteur.id);
      const managerTerms = assignedManagers.map(manager => `${manager.fullName} ${manager.email}`).join(' ');

      return [
          secteur.nom,
          secteur.description,
          secteur.zoneGeographique,
          secteur.codesPostaux,
          managerTerms
      ]
        .filter(Boolean)
        .some(value => value!.toLowerCase().includes(normalizedFilter));
  }
}
