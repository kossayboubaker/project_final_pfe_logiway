import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import {
  GenerateReportRequest,
  GenerateReportResponse,
  ReportListResponse,
  ReportMetadata
} from '../../models/report.models';
import { AppConfigService } from './app-config.service';

@Injectable({
  providedIn: 'root'
})
export class ReportService {
  private get apiUrl(): string { return `${this.appConfig.apiUrl}/reports`; }

  constructor(private http: HttpClient, private appConfig: AppConfigService) {}

  /**
   * Génère un rapport intelligent via requête en langage naturel
   */
  genererRapport(request: GenerateReportRequest): Observable<GenerateReportResponse> {
    return this.http.post<GenerateReportResponse>(`${this.apiUrl}/generate`, request).pipe(
      map(response => {
        // Conversion des dates
        if (response.metadata) {
          response.metadata.dateCreation = new Date(response.metadata.dateCreation);
          if (response.metadata.dateDebutDonnees) {
            response.metadata.dateDebutDonnees = new Date(response.metadata.dateDebutDonnees);
          }
          if (response.metadata.dateFinDonnees) {
            response.metadata.dateFinDonnees = new Date(response.metadata.dateFinDonnees);
          }
        }
        return response;
      })
    );
  }

  /**
   * Liste tous les rapports générés
   */
  listerRapports(domaine?: string, limit: number = 50): Observable<ReportListResponse> {
    let url = `${this.apiUrl}?limit=${limit}`;
    if (domaine) {
      url += `&domaine=${domaine}`;
    }

    return this.http.get<ReportListResponse>(url).pipe(
      map(response => {
        // Conversion des dates
        response.rapports = response.rapports.map(rapport => ({
          ...rapport,
          dateCreation: new Date(rapport.dateCreation),
          dateDebutDonnees: rapport.dateDebutDonnees ? new Date(rapport.dateDebutDonnees) : undefined,
          dateFinDonnees: rapport.dateFinDonnees ? new Date(rapport.dateFinDonnees) : undefined
        }));
        return response;
      })
    );
  }

  /**
   * Récupère les métadonnées d'un rapport spécifique
   */
  getMetadataRapport(reportId: string): Observable<ReportMetadata> {
    return this.http.get<ReportMetadata>(`${this.apiUrl}/${reportId}`).pipe(
      map(metadata => ({
        ...metadata,
        dateCreation: new Date(metadata.dateCreation),
        dateDebutDonnees: metadata.dateDebutDonnees ? new Date(metadata.dateDebutDonnees) : undefined,
        dateFinDonnees: metadata.dateFinDonnees ? new Date(metadata.dateFinDonnees) : undefined
      }))
    );
  }

  /**
   * Télécharge un rapport
   */
  telechargerRapport(reportId: string): Observable<Blob> {
    return this.http.get(`${this.apiUrl}/download/${reportId}`, {
      responseType: 'blob'
    });
  }

  /**
   * Supprime un rapport
   */
  supprimerRapport(reportId: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${reportId}`);
  }

  /**
   * Télécharge et sauvegarde un rapport localement
   */
  downloadAndSave(reportId: string, filename: string): void {
    this.telechargerRapport(reportId).subscribe({
      next: (blob) => {
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        link.click();
        window.URL.revokeObjectURL(url);
      },
      error: (error) => {
        console.error('Erreur téléchargement rapport:', error);
      }
    });
  }

  /**
   * Formate la taille du fichier en Ko, Mo
   */
  formatFileSize(sizeKo: number): string {
    if (sizeKo < 1024) {
      return `${sizeKo} Ko`;
    } else {
      return `${(sizeKo / 1024).toFixed(2)} Mo`;
    }
  }

  /**
   * Formate le temps de génération
   */
  formatGenerationTime(timeMs: number): string {
    if (timeMs < 1000) {
      return `${timeMs} ms`;
    } else {
      return `${(timeMs / 1000).toFixed(2)} s`;
    }
  }
}
