import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AppConfigService } from './app-config.service';

@Injectable({ providedIn: 'root' })
export class AffectationService {
  private get apiBaseUrl(): string { return `${this.appConfig.apiUrl}/vehicules`; }

  constructor(private http: HttpClient, private appConfig: AppConfigService) {}

  // Assigner un chauffeur à un véhicule dans un secteur
  assignerChauffeurVehicule(secteurId: number, chauffeurId: number, vehiculeId: number): Observable<any> {
    void secteurId;
    const payload = { chauffeurId };
    return this.http.put(`${this.apiBaseUrl}/${vehiculeId}/driver`, payload);
  }
}
