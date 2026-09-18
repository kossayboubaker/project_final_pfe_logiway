import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, catchError, map, of } from 'rxjs';
import { AppConfigService } from './app-config.service';

export type ReclamationStatus = 'EN_COURS' | 'RESOLU' | 'REJETE';

export interface ReclamationRecord {
    id: string;
    sujet: string;
    description: string;
    priorite: 'NORMAL' | 'URGENT';
    statut: ReclamationStatus;
    commentaireResolution?: string | null;
    utilisateurId?: number | null;
    utilisateurNom?: string | null;
    utilisateurEmail?: string | null;
    dateCreation?: string | null;
    dateMiseAJour?: string | null;
}

interface ApiReclamation {
    id: number;
    sujet: string;
    description: string;
    priorite: 'NORMAL' | 'URGENT';
    statut: ReclamationStatus;
    commentaireResolution?: string | null;
    utilisateurId?: number | null;
    utilisateurNom?: string | null;
    utilisateurEmail?: string | null;
    dateCreation?: string | null;
    dateMiseAJour?: string | null;
}

export interface ReclamationPayload {
    sujet: string;
    description: string;
    priorite: 'NORMAL' | 'URGENT';
}

export interface ValidationFieldResult {
    valide: boolean;
    type_erreur?: 'toxicite' | 'hors_sujet' | null;
    message?: string | null;
}

export interface ValidateReclamationResponse {
    sujet: ValidationFieldResult;
    description: ValidationFieldResult;
}

@Injectable({ providedIn: 'root' })
export class ReclamationService {
    private get apiBase(): string { return `${this.appConfig.apiUrl}/reclamations`; }

    constructor(private http: HttpClient, private appConfig: AppConfigService) {}

    list(): Observable<ReclamationRecord[]> {
        return this.http.get<ApiReclamation[]>(this.apiBase).pipe(
            map(list => list.map(r => this.map(r))),
            catchError(() => of([]))
        );
    }

    create(payload: ReclamationPayload) {
        return this.http.post<ApiReclamation>(this.apiBase, payload).pipe(map(r => this.map(r)));
    }

    update(id: string, payload: ReclamationPayload) {
        return this.http.put<ApiReclamation>(`${this.apiBase}/${id}`, payload).pipe(map(r => this.map(r)));
    }

    delete(id: string) {
        return this.http.delete<void>(`${this.apiBase}/${id}`);
    }

    resolve(id: string, commentaire: string) {
        return this.http.put<ApiReclamation>(`${this.apiBase}/${id}/resolve`, { commentaire }).pipe(map(r => this.map(r)));
    }

    reject(id: string, commentaire: string) {
        return this.http.put<ApiReclamation>(`${this.apiBase}/${id}/reject`, { commentaire }).pipe(map(r => this.map(r)));
    }

    validate(sujet: string, description: string): Observable<ValidateReclamationResponse> {
        return this.http.post<ValidateReclamationResponse>(`${this.apiBase}/validate`, { sujet, description });
    }

    private map(r: ApiReclamation): ReclamationRecord {
        return {
            id: String(r.id),
            sujet: r.sujet,
            description: r.description,
            priorite: r.priorite,
            statut: r.statut,
            commentaireResolution: r.commentaireResolution || null,
            utilisateurId: r.utilisateurId ?? null,
            utilisateurNom: r.utilisateurNom || null,
            utilisateurEmail: r.utilisateurEmail || null,
            dateCreation: r.dateCreation || null
            ,dateMiseAJour: r.dateMiseAJour || null
        };
    }
}
