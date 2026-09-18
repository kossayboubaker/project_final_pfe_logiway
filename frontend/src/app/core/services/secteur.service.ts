import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Secteur } from '../../models/project.models';
import { AppConfigService } from './app-config.service';

@Injectable({ providedIn: 'root' })
export class SecteurService {
  private get apiUrl(): string { return `${this.appConfig.apiUrl}/secteurs`; }

  constructor(private http: HttpClient, private appConfig: AppConfigService) {}

  getAllSecteurs(): Observable<Secteur[]> {
    return this.http.get<Secteur[]>(this.apiUrl);
  }

  /**
   * Récupère un secteur spécifique par son ID
   * avec tous ses détails (managers, chauffeurs, etc.)
   */
  getSectorById(id: number): Observable<Secteur> {
    return this.http.get<Secteur>(`${this.apiUrl}/${id}`);
  }

  createSecteur(secteur: Secteur): Observable<Secteur> {
    return this.http.post<Secteur>(this.apiUrl, secteur);
  }

  updateSecteur(id: number, secteur: Secteur): Observable<Secteur> {
    return this.http.put<Secteur>(`${this.apiUrl}/${id}`, secteur);
  }

  deleteSecteur(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

  assignChauffeurToSecteur(secteurId: number, chauffeurId: number): Observable<any> {
    return this.http.put(`${this.apiUrl}/${secteurId}/chauffeur/${chauffeurId}`, {});
  }

  assignManagerToSecteur(secteurId: number, managerId: number): Observable<any> {
    return this.http.put(`${this.apiUrl}/${secteurId}/manager/${managerId}`, {});
  }
}
