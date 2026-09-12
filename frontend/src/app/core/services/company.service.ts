import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, catchError, map, of, switchMap, tap } from 'rxjs';
import { AuthService } from '../auth.service';

export interface Company {
    id: string;
    name: string;
    address: string;
    sector: string;
    fleetSize: number;
    activeMissions: number;
    status: 'Actif' | 'Inactif' | 'En Attente' | 'Suspendu';
    joinDate: string;
    email?: string;
    number?: string;
    codeTVA?: string;
    representantLegal?: string;
    documentJustificatif?: string;
    image?: string;
    managerId?: number | null;
    managerName?: string | null;
    managerOwnerId?: number | null;
    managerOwnerName?: string | null;
}

interface EntrepriseResponse {
    id: number;
    nomEntreprise: string;
    emailEntreprise?: string | null;
    adresseEntreprise?: string | null;
    numeroEntreprise?: string | null;
    codeTVA?: string | null;
    representantLegal?: string | null;
    documentJustificatif?: string | null;
    secteurActivite?: string | null;
    image?: string | null;
    tailleFlotte?: number | null;
    statut?: 'ACTIF' | 'INACTIF' | 'EN_ATTENTE' | 'SUSPENDU';
    managerOwnerId?: number | null;
    managerOwnerName?: string | null;
    dateCreation?: string | null;
    activeMissions?: number | null;
}

export interface CompanyPayload {
    name: string;
    address?: string;
    sector?: string;
    fleetSize?: number;
    status?: Company['status'];
    managerId?: number | null;
    managerOwnerId?: number | null;
    email?: string;
    number?: string;
    codeTVA?: string;
    representantLegal?: string;
    documentJustificatif?: string;
    image?: string;
}

@Injectable({
    providedIn: 'root'
})
export class CompanyService {
    private readonly apiBaseUrl = 'http://localhost:8080/api/entreprises';

    private companiesSubject = new BehaviorSubject<Company[]>(this.buildFallbackCompanies());

    constructor(private http: HttpClient, private authService: AuthService) { }

    getCompanies(): Observable<Company[]> {
        return this.http.get<EntrepriseResponse[]>(this.apiBaseUrl).pipe(
            map(companies => companies.map(company => this.mapCompany(company))),
            tap(companies => this.companiesSubject.next(companies)),
            catchError(() => of(this.companiesSubject.value))
        );
    }

    getMyCompany(): Observable<Company | null> {
        return this.http.get<EntrepriseResponse | null>(`${this.apiBaseUrl}/me`).pipe(
            map(company => company ? this.mapCompany(company) : null),
            tap(company => {
                if (company) {
                    this.authService.setCompanyStatus(this.mapStatusToAuth(company.status));
                    return;
                }

                this.authService.setCompanyStatus('NONE');
            }),
            catchError(() => of(null))
        );
    }

    createCompany(payload: CompanyPayload): Observable<Company> {
        return this.http.post<EntrepriseResponse>(this.apiBaseUrl, this.toApiPayload(payload)).pipe(
            map(company => this.mapCompany(company)),
            tap(company => {
                this.upsertLocalCompany(company);
                this.authService.setCompanyStatus(this.mapStatusToAuth(company.status));
            })
        );
    }

    updateCompany(id: string, payload: Partial<CompanyPayload>): Observable<Company> {
        return this.http.put<EntrepriseResponse>(`${this.apiBaseUrl}/${id}`, this.toApiPayload(payload)).pipe(
            map(company => this.mapCompany(company)),
            tap(company => {
                this.upsertLocalCompany(company);
                this.authService.setCompanyStatus(this.mapStatusToAuth(company.status));
            })
        );
    }

    deleteCompany(id: string): Observable<{ success: boolean; message: string }> {
        return this.http.delete<void>(`${this.apiBaseUrl}/${id}`).pipe(
            tap(() => {
                this.removeLocalCompany(id);
                this.authService.setCompanyStatus('NONE');
            }),
            map(() => ({ success: true, message: 'L\'entreprise a été supprimée.' })),
            catchError(() => of({ success: false, message: 'Impossible de supprimer cette entreprise.' }))
        );
    }

    saveMyCompany(payload: CompanyPayload): Observable<Company> {
        return this.getMyCompany().pipe(
            switchMap(company => {
                if (company) {
                    return this.updateCompany(company.id, payload);
                }
                return this.createCompany(payload);
            })
        );
    }

    updateCompanyStatus(id: string, status: Company['status']): Observable<Company> {
        return this.updateCompany(id, { status });
    }

    clearCompanyOwner(id: string): Observable<Company> {
        return this.http.put<EntrepriseResponse>(`${this.apiBaseUrl}/${id}/clear-owner`, {}).pipe(
            map(company => this.mapCompany(company)),
            tap(company => this.upsertLocalCompany(company))
        );
    }

    private toApiPayload(payload: Partial<CompanyPayload>) {
        return {
            nomEntreprise: payload.name,
            adresseEntreprise: payload.address,
            secteurActivite: payload.sector,
            tailleFlotte: payload.fleetSize,
            statut: payload.status ? this.mapStatusToApi(payload.status) : undefined,
            managerOwnerId: payload.managerOwnerId ?? payload.managerId ?? undefined,
            emailEntreprise: payload.email,
            numeroEntreprise: payload.number,
            codeTVA: payload.codeTVA,
            representantLegal: payload.representantLegal,
            documentJustificatif: payload.documentJustificatif,
            image: payload.image
        };
    }

    private mapCompany(company: EntrepriseResponse): Company {
        return {
            id: company.id.toString(),
            name: company.nomEntreprise,
            address: company.adresseEntreprise || '',
            sector: company.secteurActivite || 'Logistique',
            fleetSize: company.tailleFlotte || 0,
            activeMissions: company.activeMissions || 0,
            status: this.mapStatusFromApi(company.statut),
            joinDate: company.dateCreation ? new Date(company.dateCreation).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
            email: company.emailEntreprise || '',
            number: company.numeroEntreprise || '',
            codeTVA: company.codeTVA || '',
            representantLegal: company.representantLegal || '',
            documentJustificatif: company.documentJustificatif || '',
            image: company.image || '',
            managerId: company.managerOwnerId ?? null,
            managerName: company.managerOwnerName ?? null,
            managerOwnerId: company.managerOwnerId ?? null,
            managerOwnerName: company.managerOwnerName ?? null
        };
    }

    private mapStatusFromApi(status?: EntrepriseResponse['statut']): Company['status'] {
        switch (status) {
            case 'INACTIF': return 'Inactif';
            case 'EN_ATTENTE': return 'En Attente';
            case 'SUSPENDU': return 'Suspendu';
            default: return 'Actif';
        }
    }

    private mapStatusToApi(status: Company['status']): EntrepriseResponse['statut'] {
        switch (status) {
            case 'Inactif': return 'INACTIF';
            case 'En Attente': return 'EN_ATTENTE';
            case 'Suspendu': return 'SUSPENDU';
            default: return 'ACTIF';
        }
    }

    private mapStatusToAuth(status: Company['status']): 'NONE' | 'EN_ATTENTE' | 'ACTIF' | 'INACTIF' | 'SUSPENDU' {
        switch (status) {
            case 'En Attente': return 'EN_ATTENTE';
            case 'Inactif': return 'INACTIF';
            case 'Suspendu': return 'SUSPENDU';
            case 'Actif': return 'ACTIF';
            default: return 'NONE';
        }
    }

    private upsertLocalCompany(company: Company): void {
        const current = this.companiesSubject.value;
        const index = current.findIndex(item => item.id === company.id);
        if (index === -1) {
            this.companiesSubject.next([company, ...current]);
            return;
        }

        const updated = [...current];
        updated[index] = company;
        this.companiesSubject.next(updated);
    }

    private removeLocalCompany(id: string): void {
        const updated = this.companiesSubject.value.filter(company => company.id !== id);
        this.companiesSubject.next(updated);
    }

    private buildFallbackCompanies(): Company[] {
        return [
            {
                id: '1',
                name: 'TransExpress Maghreb',
                address: 'Z.I Monastir, Tunisie',
                sector: 'Transport National',
                fleetSize: 12,
                activeMissions: 5,
                status: 'Actif',
                joinDate: '2023-10-15'
            },
            {
                id: '2',
                name: 'LogiLogistics S.A',
                address: 'Rades Port, Tunis',
                sector: 'Import/Export',
                fleetSize: 8,
                activeMissions: 0,
                status: 'Inactif',
                joinDate: '2024-01-20'
            },
            {
                id: '3',
                name: 'Global Trucking Co',
                address: 'Paris, France',
                sector: 'Logistique Internationale',
                fleetSize: 25,
                activeMissions: 12,
                status: 'Actif',
                joinDate: '2023-05-10'
            }
        ];
    }
}
