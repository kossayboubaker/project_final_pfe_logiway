import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { forkJoin, of } from 'rxjs';
import { catchError, switchMap } from 'rxjs/operators';

import { AffectationService } from '../../core/services/affectation.service';
import { VehiculeStatut } from '../../models/project.models';
import { AuthService } from '../../core/auth.service';
import { CompanyService, Company } from '../../core/services/company.service';
import { FleetService, Vehicle } from '../../core/services/fleet.service';
import { UserListItem, UserService } from '../../core/services/user.service';
import { PremiumSnackbarComponent } from '../../shared/components/premium-snackbar/premium-snackbar.component';

interface ChauffeurOption {
  id: number;
  username: string;
  email: string;
  role: 'CHAUFFEUR';
  managerId?: number | null;
}

@Component({
  selector: 'app-affectation-vehicule',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatSelectModule,
    MatButtonModule,
    MatIconModule,
    MatSnackBarModule
  ],
  templateUrl: './affectation-vehicule.component.html',
  styleUrls: ['./affectation-vehicule.component.css']
})
export class AffectationVehiculeComponent implements OnInit {
  // Entreprises et sélection
  entreprises: Company[] = [];
  selectedEntrepriseId: string | null = null;

  // Données filtrées par entreprise
  chauffeursLibres: ChauffeurOption[] = [];
  vehiculesHorsService: Vehicle[] = [];

  // Sélections utilisateur
  selectedChauffeurId: number | null = null;
  selectedVehiculeId: string | null = null;

  currentUser: any;
  isLoading = false;
  isManagerView = false;

  constructor(
    private affectationService: AffectationService,
    private snackBar: MatSnackBar,
    private authService: AuthService,
    private companyService: CompanyService,
    private fleetService: FleetService,
    private userService: UserService
  ) { }

  ngOnInit() {
    this.currentUser = this.authService.getUser();
    this.isManagerView = this.currentUser?.role === 'MANAGER';
    this.chargerEntreprises();
  }

  chargerEntreprises() {
    if (this.isManagerView) {
      this.companyService.getMyCompany().pipe(
        catchError(() => of(null))
      ).subscribe(company => {
        if (company) {
          this.entreprises = [company];
          // Si manager, pré-sélectionner son entreprise
          this.selectedEntrepriseId = company.id;
          this.onEntrepriseChange();
        }
      });
    } else {
      // SuperAdmin voit toutes les entreprises
      this.companyService.getCompanies().pipe(
        catchError(() => of([]))
      ).subscribe(companies => {
        this.entreprises = companies;
      });
    }
  }

  onEntrepriseChange() {
    if (!this.selectedEntrepriseId) {
      this.chauffeursLibres = [];
      this.vehiculesHorsService = [];
      this.selectedChauffeurId = null;
      this.selectedVehiculeId = null;
      return;
    }

    this.isLoading = true;

    forkJoin({
      chauffeurs: this.userService.list().pipe(catchError(() => of([]))),
      vehicules: this.fleetService.getVehicles().pipe(catchError(() => of([])))
    }).subscribe(({ chauffeurs, vehicules }) => {
      // Filtrer chauffeurs : LIBRE + appartenant à l'entreprise sélectionnée
      this.chauffeursLibres = (chauffeurs as UserListItem[])
        .filter(user =>
          user.role === 'CHAUFFEUR' &&
          user.statutConducteur === 'LIBRE'
        )
        .map(user => ({
          id: Number(user.id),
          username: `${user.prenom || ''} ${user.nom || ''}`.trim() || user.email,
          email: user.email,
          role: 'CHAUFFEUR' as const,
          managerId: user.managerId ?? null
        }));

      // Filtrer véhicules : HORS_SERVICE + appartenant à l'entreprise sélectionnée + NON AFFECTÉ
      this.vehiculesHorsService = (vehicules as Vehicle[])
        .filter(vehicule =>
          this.normalizeStatus(vehicule.status) === VehiculeStatut.HORS_SERVICE &&
          vehicule.companyId?.toString() === this.selectedEntrepriseId &&
          !vehicule.driverId // ✅ Véhicule non affecté = réellement disponible
        );

      this.isLoading = false;
      this.selectedChauffeurId = null;
      this.selectedVehiculeId = null;
    });
  }

  validerAffectation() {
    if (this.selectedChauffeurId && this.selectedVehiculeId) {
      this.affectationService.assignerChauffeurVehicule(
        0,
        this.selectedChauffeurId,
        Number(this.selectedVehiculeId)
      ).subscribe({
        next: () => {
          this.snackBar.openFromComponent(PremiumSnackbarComponent, {
            duration: 4000,
            verticalPosition: 'top',
            horizontalPosition: 'end',
            data: {
              title: 'Affectation Réussie',
              message: 'Le chauffeur a été affecté et la notification envoyée.',
              type: 'success'
            }
          });
          this.annuler();
          this.onEntrepriseChange();
        },
        error: (error) => {
          const backendMessage = error?.error?.message || error?.message || 'La requête a échoué.';
          this.snackBar.openFromComponent(PremiumSnackbarComponent, {
            duration: 5000,
            verticalPosition: 'top',
            horizontalPosition: 'end',
            data: {
              title: 'Affectation Impossible',
              message: backendMessage,
              type: 'warning'
            }
          });
        }
      });
    }
  }

  annuler() {
    this.selectedChauffeurId = null;
    this.selectedVehiculeId = null;
  }

  private normalizeStatus(status: string): VehiculeStatut {
    const normalized = (status || '').toUpperCase().replace(/\s+/g, '_');
    switch (normalized) {
      case VehiculeStatut.EN_SERVICE:
        return VehiculeStatut.EN_SERVICE;
      case VehiculeStatut.EN_MAINTENANCE:
        return VehiculeStatut.EN_MAINTENANCE;
      case VehiculeStatut.HORS_SERVICE:
        return VehiculeStatut.HORS_SERVICE;
      default:
        return VehiculeStatut.HORS_SERVICE;
    }
  }
}
