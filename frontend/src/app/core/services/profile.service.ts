import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AppConfigService } from './app-config.service';

export interface DriverDashboardResponse {
    chauffeur: any;
    vehiculeActuel: any;
    manager: any;
    missionActuelle: any;
    missionsDuJour: any[];
    statistiques: any;
    disponibiliteProchaine?: {
        dateDisponibilite?: string;
        minutesRestantes?: number;
        disponible?: boolean;
    };
}

export interface PageResponse<T> {
    content: T[];
    pageable: unknown;
    totalPages: number;
    totalElements: number;
    last: boolean;
    first: boolean;
    size: number;
    number: number;
    numberOfElements: number;
    empty: boolean;
}

@Injectable({ providedIn: 'root' })
export class ProfileService {
    private get apiBaseUrl(): string { return `${this.appConfig.apiUrl}/profile/me`; }

    constructor(private http: HttpClient, private appConfig: AppConfigService) {}

    getCurrentProfile(): Observable<any> {
        return this.http.get(this.apiBaseUrl);
    }

    updateCurrentProfile(payload: { prenom?: string; nom?: string; telephone?: string; image?: string }): Observable<any> {
        return this.http.put(this.apiBaseUrl, payload);
    }

    changePassword(payload: { oldPassword: string; newPassword: string }): Observable<{ message: string }> {
        return this.http.put<{ message: string }>(`${this.apiBaseUrl}/password`, payload);
    }

    getDriverDashboard(): Observable<DriverDashboardResponse> {
        return this.http.get<DriverDashboardResponse>(`${this.apiBaseUrl}/dashboard`, { withCredentials: true });
    }

    getDriverTrips(page = 0, size = 50, statut?: string): Observable<PageResponse<any>> {
        const params: string[] = [`page=${page}`, `size=${size}`];
        if (statut) {
            params.push(`statut=${encodeURIComponent(statut)}`);
        }
        return this.http.get<PageResponse<any>>(`${this.apiBaseUrl}/trajets?${params.join('&')}`, { withCredentials: true });
    }
}
