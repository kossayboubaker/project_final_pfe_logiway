import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ReportService } from '../../../core/services/report.service';
import {
  GenerateReportRequest,
  ReportMetadata,
  ReportFormat,
  ReportDomain
} from '../../../models/report.models';

@Component({
  selector: 'app-generate-rapport',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './generate-rapport.component.html',
  styleUrls: ['./generate-rapport.component.css']
})
export class GenerateRapportComponent implements OnInit {
  // État de l'interface
  viewMode: 'generate' | 'list' = 'list';
  isGenerating = false;
  isLoading = false;

  // Formulaire de génération
  requeteNaturelle = '';
  formatSelectionne: ReportFormat = ReportFormat.PDF;
  formats = Object.values(ReportFormat);

  // Exemples de requêtes
  exempleRequetes = [
    'Rapport PDF de tous les véhicules',
    'Liste CSV de tous les chauffeurs',
    'Liste de toutes les réclamations',
    'Statistiques TXT des trajets',
    'Rapport de tous les congés',
    'Rapport global de la flotte'
  ];

  // Liste des rapports
  rapports: ReportMetadata[] = [];
  filtreDomaineSelectionne: string = '';
  domaines = ['', ...Object.values(ReportDomain)];

  // Message de feedback
  messageSucces = '';
  messageErreur = '';

  constructor(private reportService: ReportService) {}

  ngOnInit(): void {
    this.chargerRapports();
  }

  /**
   * Bascule entre les vues génération et liste
   */
  switchView(view: 'generate' | 'list'): void {
    this.viewMode = view;
    if (view === 'list') {
      this.chargerRapports();
    }
  }

  /**
   * Utilise un exemple de requête
   */
  utiliserExemple(exemple: string): void {
    this.requeteNaturelle = exemple;
  }

  /**
   * Génère un nouveau rapport
   */
  genererRapport(): void {
    if (!this.requeteNaturelle.trim()) {
      this.afficherErreur('Veuillez saisir une requête');
      return;
    }

    this.isGenerating = true;
    this.messageSucces = '';
    this.messageErreur = '';

    const request: GenerateReportRequest = {
      requeteNaturelle: this.requeteNaturelle.trim(),
      formatPrefere: this.formatSelectionne
    };

    console.log('[FRONTEND] Envoi requête génération rapport:', request);

    this.reportService.genererRapport(request).subscribe({
      next: (response) => {
        console.log('[FRONTEND] Réponse reçue:', response);
        this.isGenerating = false;

        if (response.success) {
          this.afficherSucces(`Rapport généré avec succès : ${response.message}`);
          
          // Téléchargement automatique
          if (response.metadata) {
            const filename = `${response.metadata.titre}_${response.reportId}.${response.metadata.format.toLowerCase()}`;
            setTimeout(() => {
              this.reportService.downloadAndSave(response.reportId, filename);
            }, 500);
          }

          // Rafraîchir la liste et basculer vers la vue liste
          setTimeout(() => {
            this.chargerRapports();
            this.viewMode = 'list';
            this.requeteNaturelle = '';
          }, 2000);
        } else {
          this.afficherErreur(response.message || 'Erreur lors de la génération');
        }
      },
      error: (error) => {
        this.isGenerating = false;
        console.error('[FRONTEND] Erreur génération rapport:', error);
        console.error('[FRONTEND] Status:', error.status);
        console.error('[FRONTEND] Message:', error.message);
        console.error('[FRONTEND] Error body:', error.error);
        
        let errorMessage = 'Erreur technique lors de la génération du rapport';
        if (error.status === 400) {
          errorMessage = 'Requête invalide. Vérifiez votre saisie.';
        } else if (error.status === 403) {
          errorMessage = 'Accès refusé. Vous n\'avez pas les droits nécessaires.';
        } else if (error.status === 401) {
          errorMessage = 'Session expirée. Veuillez vous reconnecter.';
        }
        
        this.afficherErreur(errorMessage);
      }
    });
  }

  /**
   * Charge la liste des rapports
   */
  chargerRapports(): void {
    this.isLoading = true;

    this.reportService.listerRapports(this.filtreDomaineSelectionne, 50).subscribe({
      next: (response) => {
        this.rapports = response.rapports;
        this.isLoading = false;
      },
      error: (error) => {
        this.isLoading = false;
        this.afficherErreur('Erreur lors du chargement des rapports');
        console.error('Erreur chargement rapports:', error);
      }
    });
  }

  /**
   * Applique le filtre de domaine
   */
  appliquerFiltre(): void {
    this.chargerRapports();
  }

  /**
   * Télécharge un rapport
   */
  telechargerRapport(rapport: ReportMetadata): void {
    const filename = `${rapport.titre}_${rapport.reportId}.${rapport.format.toLowerCase()}`;
    this.reportService.downloadAndSave(rapport.reportId, filename);
    this.afficherSucces('Téléchargement en cours...');
  }

  /**
   * Supprime un rapport
   */
  supprimerRapport(rapport: ReportMetadata): void {
    if (!confirm(`Voulez-vous vraiment supprimer ce rapport ?\n"${rapport.titre}"`)) {
      return;
    }

    this.reportService.supprimerRapport(rapport.reportId).subscribe({
      next: () => {
        this.afficherSucces('Rapport supprimé avec succès');
        this.chargerRapports();
      },
      error: (error) => {
        this.afficherErreur('Erreur lors de la suppression du rapport');
        console.error('Erreur suppression rapport:', error);
      }
    });
  }

  /**
   * Formate la taille du fichier
   */
  formatFileSize(sizeKo: number | undefined): string {
    if (!sizeKo) return '-';
    return this.reportService.formatFileSize(sizeKo);
  }

  /**
   * Formate le temps de génération
   */
  formatGenerationTime(timeMs: number | undefined): string {
    if (!timeMs) return '-';
    return this.reportService.formatGenerationTime(timeMs);
  }

  /**
   * Badge CSS pour le format
   */
  getFormatBadgeClass(format: string): string {
    switch (format) {
      case 'PDF':
        return 'badge-pdf';
      case 'CSV':
        return 'badge-csv';
      case 'TXT':
        return 'badge-txt';
      default:
        return 'badge-default';
    }
  }

  /**
   * Badge CSS pour le domaine
   */
  getDomaineBadgeClass(domaine: string): string {
    const classes: { [key: string]: string } = {
      'vehicules': 'badge-vehicules',
      'chauffeurs': 'badge-chauffeurs',
      'trajets': 'badge-trajets',
      'conges': 'badge-conges',
      'reclamations': 'badge-reclamations',
      'managers': 'badge-managers',
      'global': 'badge-global'
    };
    return classes[domaine] || 'badge-default';
  }

  /**
   * Icône pour le format
   */
  getFormatIcon(format: string): string {
    switch (format) {
      case 'PDF':
        return '📄';
      case 'CSV':
        return '📊';
      case 'TXT':
        return '📝';
      default:
        return '📁';
    }
  }

  /**
   * Affiche un message de succès
   */
  private afficherSucces(message: string): void {
    this.messageSucces = message;
    this.messageErreur = '';
    setTimeout(() => {
      this.messageSucces = '';
    }, 5000);
  }

  /**
   * Affiche un message d'erreur
   */
  private afficherErreur(message: string): void {
    this.messageErreur = message;
    this.messageSucces = '';
    setTimeout(() => {
      this.messageErreur = '';
    }, 5000);
  }
}
