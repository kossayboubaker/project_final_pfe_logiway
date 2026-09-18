import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, catchError, map, of } from 'rxjs';
import { AppConfigService } from './app-config.service';

export type LeaveStatusCode = 'EN_ATTENTE' | 'APPROUVE' | 'REJETE' | 'ANNULE';
export type LeaveRequesterRole = 'MANAGER' | 'CHAUFFEUR';
export type LeaveTypeCode = 'MALADIE' | 'MARIAGE' | 'VACANCES';

export interface LeaveRecord {
    id: string;
    requesterId: number;
    requesterName: string;
    requesterEmail: string;
    requesterRole: LeaveRequesterRole;
    managerId?: number | null;
    managerName?: string | null;
    managerEmail?: string | null;
    chauffeurId?: number | null;
    chauffeurName?: string | null;
    chauffeurEmail?: string | null;
    type: LeaveTypeCode;
    typeLabel: string;
    startDate: string;
    endDate: string;
    startDateIso: string;
    endDateIso: string;
    duration: number;
    reason: string;
    status: LeaveStatusCode;
    statusLabel: string;
    comment?: string | null;
    createdAt?: string | null;
    updatedAt?: string | null;
    canEdit: boolean;
    canDelete: boolean;
    canReview: boolean;
}

interface LeaveResponse {
    id: number;
    type: LeaveTypeCode;
    dateDebut: string;
    dateFin: string;
    periode?: number | null;
    motif: string;
    statut: LeaveStatusCode;
    commentaireValidation?: string | null;
    requesterId?: number | null;
    requesterNom?: string | null;
    requesterEmail?: string | null;
    requesterRole?: LeaveRequesterRole | null;
    managerId?: number | null;
    managerNom?: string | null;
    managerEmail?: string | null;
    chauffeurId?: number | null;
    chauffeurNom?: string | null;
    chauffeurEmail?: string | null;
    dateCreation?: string | null;
    dateMiseAJour?: string | null;
}

export interface LeavePayload {
    type: LeaveTypeCode;
    startDate: Date;
    endDate: Date;
    reason: string;
}

export interface LeaveDecisionPayload {
    commentaire?: string;
    notificationId?: number;
}

@Injectable({
    providedIn: 'root'
})
export class LeaveService {
    private get apiBaseUrl(): string { return `${this.appConfig.apiUrl}/conges`; }

    constructor(private http: HttpClient, private appConfig: AppConfigService) {}

    getLeaves(): Observable<LeaveRecord[]> {
        return this.http.get<LeaveResponse[]>(this.apiBaseUrl).pipe(
            map(leaves => leaves.map(leave => this.mapLeave(leave))),
            catchError(() => of([]))
        );
    }

    getApprovedLeaves(): Observable<LeaveRecord[]> {
        return this.getLeaves().pipe(
            map(leaves => leaves.filter(leave => leave.status === 'APPROUVE'))
        );
    }

    createLeave(payload: LeavePayload): Observable<LeaveRecord> {
        return this.http.post<LeaveResponse>(this.apiBaseUrl, this.toApiPayload(payload)).pipe(
            map(leave => this.mapLeave(leave))
        );
    }

    updateLeave(id: string, payload: Partial<LeavePayload>): Observable<LeaveRecord> {
        return this.http.put<LeaveResponse>(`${this.apiBaseUrl}/${id}`, this.toApiPayload(payload)).pipe(
            map(leave => this.mapLeave(leave))
        );
    }

    approveLeave(id: string, payload: LeaveDecisionPayload = {}): Observable<LeaveRecord> {
        return this.http.put<LeaveResponse>(`${this.apiBaseUrl}/${id}/approve`, payload).pipe(
            map(leave => this.mapLeave(leave))
        );
    }

    rejectLeave(id: string, payload: LeaveDecisionPayload = {}): Observable<LeaveRecord> {
        return this.http.put<LeaveResponse>(`${this.apiBaseUrl}/${id}/reject`, payload).pipe(
            map(leave => this.mapLeave(leave))
        );
    }

    deleteLeave(id: string): Observable<{ message: string }> {
        return this.http.delete<{ message: string }>(`${this.apiBaseUrl}/${id}`);
    }

    private toApiPayload(payload: Partial<LeavePayload>) {
        return {
            type: payload.type,
            dateDebut: payload.startDate ? this.toIsoDate(payload.startDate) : undefined,
            dateFin: payload.endDate ? this.toIsoDate(payload.endDate) : undefined,
            motif: payload.reason
        };
    }

    private mapLeave(leave: LeaveResponse): LeaveRecord {
        const requesterName = leave.requesterNom || this.buildFallbackName(leave.requesterEmail);
        const requesterRole = leave.requesterRole || 'CHAUFFEUR';
        const statusLabel = this.mapStatusLabel(leave.statut);

        return {
            id: String(leave.id),
            requesterId: leave.requesterId ?? 0,
            requesterName,
            requesterEmail: leave.requesterEmail || '',
            requesterRole,
            managerId: leave.managerId ?? null,
            managerName: leave.managerNom ?? null,
            managerEmail: leave.managerEmail ?? null,
            chauffeurId: leave.chauffeurId ?? null,
            chauffeurName: leave.chauffeurNom ?? null,
            chauffeurEmail: leave.chauffeurEmail ?? null,
            type: leave.type,
            typeLabel: this.mapTypeLabel(leave.type),
            startDate: this.toDisplayDate(leave.dateDebut),
            endDate: this.toDisplayDate(leave.dateFin),
            startDateIso: leave.dateDebut,
            endDateIso: leave.dateFin,
            duration: leave.periode ?? this.computeDuration(leave.dateDebut, leave.dateFin),
            reason: leave.motif || '',
            status: leave.statut,
            statusLabel,
            comment: leave.commentaireValidation || null,
            createdAt: leave.dateCreation || null,
            updatedAt: leave.dateMiseAJour || null,
            canEdit: false,
            canDelete: false,
            canReview: false
        };
    }

    private mapTypeLabel(type: LeaveTypeCode): string {
        switch (type) {
            case 'MALADIE': return 'Maladie';
            case 'MARIAGE': return 'Mariage';
            case 'VACANCES': return 'Vacances';
            default: return type;
        }
    }

    private mapStatusLabel(status: LeaveStatusCode): string {
        switch (status) {
            case 'EN_ATTENTE': return 'En attente';
            case 'APPROUVE': return 'Approuvé';
            case 'REJETE': return 'Refusé';
            case 'ANNULE': return 'Annulé';
            default: return status;
        }
    }

    private toIsoDate(date: Date): string {
        return new Date(date).toISOString().split('T')[0];
    }

    private toDisplayDate(dateValue: string): string {
        return new Date(dateValue).toLocaleDateString('fr-FR');
    }

    private computeDuration(startDate: string, endDate: string): number {
        const start = new Date(startDate);
        const end = new Date(endDate);
        const diff = end.getTime() - start.getTime();
        return Math.max(1, Math.floor(diff / (1000 * 60 * 60 * 24)) + 1);
    }

    private buildFallbackName(email?: string | null): string {
        if (!email) {
            return 'Utilisateur';
        }

        return email.split('@')[0];
    }
}