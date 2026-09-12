import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class AffectationService {
  private readonly apiBaseUrl = 'http://localhost:8080/api/vehicules';

  constructor(private http: HttpClient) {}

  // Assigner un chauffeur à un véhicule dans un secteur
  assignerChauffeurVehicule(secteurId: number, chauffeurId: number, vehiculeId: number): Observable<any> {
    void secteurId;
    const payload = { chauffeurId };
    return this.http.put(`${this.apiBaseUrl}/${vehiculeId}/driver`, payload);
  }
}
