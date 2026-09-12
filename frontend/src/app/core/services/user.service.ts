import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError } from 'rxjs/operators';

export interface UserPayload {
    prenom: string;
    nom: string;
    email: string;
    telephone?: string;
    pays?: string;
    image?: string;
    role: 'SUPERADMIN' | 'MANAGER' | 'CHAUFFEUR';
    estActif?: boolean;
    rejectionReason?: string;
    managerId?: number;
}

export interface UserListItem {
    id: number;
    prenom: string;
    nom: string;
    email: string;
    role: 'SUPERADMIN' | 'MANAGER' | 'CHAUFFEUR';
    entrepriseId?: number | null;
    managerId?: number | null;
    secteurId?: number | null;
    secteurNom?: string | null;
    statutConducteur?: 'EN_SERVICE' | 'LIBRE' | null;
}

@Injectable({ providedIn: 'root' })
export class UserService {
    private readonly apiBaseUrl = 'http://localhost:8080/api/users';

    constructor(private http: HttpClient) {}

    create(payload: UserPayload): Observable<any> {
        return this.http.post(`${this.apiBaseUrl}/create`, payload);
    }

    list(): Observable<UserListItem[]> {
        return this.http.get<UserListItem[]>(this.apiBaseUrl).pipe(
            catchError(() => of([]))
        );
    }

    update(id: number, payload: Partial<UserPayload & { estActif: boolean }>): Observable<any> {
        return this.http.put(`${this.apiBaseUrl}/${id}`, payload);
    }

    delete(id: number): Observable<{ message: string }> {
        return this.http.delete<{ message: string }>(`${this.apiBaseUrl}/${id}`);
    }
}
