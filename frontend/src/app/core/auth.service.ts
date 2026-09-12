import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { catchError, finalize, map, tap } from 'rxjs/operators';
import { of } from 'rxjs';
import { NotificationService, AppNotification, NotificationCategory } from './services/notification.service';
export { AppNotification, NotificationCategory } from './services/notification.service';

interface LoginRequest {
    email: string;
    password: string;
}

interface ApiUser {
    id: number;
    prenom: string;
    nom: string;
    email: string;
    role: 'SUPERADMIN' | 'MANAGER' | 'CHAUFFEUR';
    actif: boolean;
}

interface AuthSessionResponse {
    role: 'SUPERADMIN' | 'MANAGER' | 'CHAUFFEUR';
    prenom: string;
    nom: string;
    firstLogin: boolean;
    hasCompany: boolean;
}

@Injectable({
    providedIn: 'root'
})
export class AuthService {
    private readonly apiBaseUrl = 'http://localhost:8080/api';
    private readonly hasCompanyStoragePrefix = 'logiway.hasCompany.';
    private profileSyncInProgress = false;

    private currentUserSubject = new BehaviorSubject<any>(null);
    public currentUser: Observable<any> = this.currentUserSubject.asObservable();

    private notificationsSubject = new BehaviorSubject<AppNotification[]>([
        {
            id: '1',
            title: 'Nouveau Message',
            message: 'Admin : "Votre planning a été mis à jour pour demain."',
            type: 'INFO',
            category: 'NOTIF_MESSAGE',
            time: 'Il y a 2 min',
            date: new Date(),
            isRead: false,
            dismissed: false
        },
        {
            id: '2',
            title: 'Affectation de Trajet',
            message: 'Vous avez été affecté au trajet #TR-5541: Tunis vers Sousse.',
            type: 'ACTION',
            category: 'NOTIF_TRAJET',
            time: 'Il y a 15 min',
            date: new Date(),
            isRead: false,
            dismissed: false,
            actionType: 'TRIP_ASSIGNMENT'
        },
        {
            id: '3',
            title: 'Demande de Congé',
            message: 'Driver 2 a soumis une demande de congé pour le 20/03/2026.',
            type: 'ACTION',
            category: 'NOTIF_CONGE',
            time: 'Il y a 1h',
            date: new Date(),
            isRead: false,
            dismissed: false,
            actionType: 'LEAVE_REQUEST'
        },
        {
            id: '4',
            title: 'Réclamation Client',
            message: 'Un client a déposé une réclamation concernant la livraison #DL-990.',
            type: 'WARNING',
            category: 'NOTIF_RECLAMATION',
            time: 'Il y a 3h',
            date: new Date(),
            isRead: false,
            dismissed: false
        },
        {
            id: '5',
            title: 'Sécurité du Compte',
            message: 'Nouvelle connexion détectée sur votre compte depuis un nouvel appareil.',
            type: 'DANGER',
            category: 'NOTIF_COMPTE',
            time: 'Hier',
            date: new Date(),
            isRead: true,
            dismissed: false
        },
        {
            id: '6',
            title: 'Alerte Sécurité: Fatigue',
            message: 'Le chauffeur truck_003 montre des signes de fatigue extrême. Arrêt immédiat conseillé.',
            type: 'DANGER',
            category: 'NOTIF_COMPTE',
            time: 'Maintenant',
            date: new Date(),
            isRead: false,
            dismissed: false
        },
        {
            id: '7',
            title: 'Réglementaire: Pause',
            message: 'Pause obligatoire en cours pour le chauffeur truck_001. Temps restant: 15 min.',
            type: 'WARNING',
            category: 'NOTIF_TRAJET',
            time: 'Il y a 5 min',
            date: new Date(),
            isRead: false,
            dismissed: false
        }
    ]);
    public notifications$ = this.notificationsSubject.asObservable();

    constructor(private http: HttpClient, private notificationService: NotificationService) {}

    public async init(): Promise<boolean> {
        return true;
    }

    public login(credentials: LoginRequest): Observable<AuthSessionResponse> {
        return this.http.post<AuthSessionResponse>(`${this.apiBaseUrl}/auth/login`, credentials, { withCredentials: true }).pipe(
            tap(response => {
                const mappedUser = this.mapSessionUser(response, credentials.email);
                this.currentUserSubject.next(mappedUser);
                this.notificationService.loadNotifications().subscribe();
                this.notificationService.connectRealtime();
                this.syncProfileAvatar();
            })
        );
    }

    public getMe(): Observable<any> {
        return this.http.get<AuthSessionResponse>(`${this.apiBaseUrl}/auth/me`, { withCredentials: true }).pipe(
            map(response => {
                const current = this.currentUserSubject.value;
                const mapped = this.mapSessionUser(response, current?.email || '');
                this.currentUserSubject.next(mapped);
                return mapped;
            }),
            tap(() => {
                this.notificationService.connectRealtime();
                this.syncProfileAvatar();
            })
        );
    }

    public ensureSession(): Observable<any | null> {
        const existing = this.currentUserSubject.value;
        if (existing) {
            this.notificationService.loadNotifications().subscribe();
            this.notificationService.connectRealtime();
            return of(existing);
        }

        return this.getMe().pipe(
            tap(() => {
                this.notificationService.loadNotifications().subscribe();
                this.notificationService.connectRealtime();
            }),
            catchError(() => of(null))
        );
    }

    public forgotPassword(email: string): Observable<{ message: string }> {
        return this.http.post<{ message: string }>(`${this.apiBaseUrl}/auth/forgot-password`, { email });
    }

    public resetPassword(code: string, newPassword: string): Observable<{ message: string }> {
        return this.http.post<{ message: string }>(`${this.apiBaseUrl}/auth/reset-password`, { code, newPassword });
    }

    public getRejectionReason(email: string): Observable<{ message: string }> {
        return this.http.post<{ message: string }>(`${this.apiBaseUrl}/auth/rejection-reason`, { email });
    }

    public getStatus(): string {
        return this.currentUserSubject.value?.status || 'PENDING';
    }

    public getAlerts(): AppNotification[] {
        const user = this.currentUserSubject.value;
        if (!user) return [];

        const isDriver = user.role === 'DRIVER';

        return this.notificationsSubject.value
            .filter(n => !(n.dismissedBy && n.dismissedBy.includes(user.id)) && !n.dismissed)
            .map(n => {
                const isRead = (n.readBy && n.readBy.includes(user.id)) || n.isRead;
                if (n.category === 'NOTIF_CONGE') {
                    return {
                        ...n,
                        isRead,
                        message: isDriver
                            ? `Votre demande de congé pour le 20/03/2026 a été Approuvée.`
                            : n.message,
                        type: isDriver ? 'INFO' : n.type,
                        actionType: isDriver ? undefined : n.actionType
                    };
                }
                return { ...n, isRead };
            });
    }

    public getHistory(): AppNotification[] {
        const user = this.currentUserSubject.value;
        if (!user) return [];
        const isDriver = user.role === 'DRIVER';

        return this.notificationsSubject.value
            .filter(n => !(n.dismissedBy && n.dismissedBy.includes(user.id)) && !n.dismissed)
            .map(n => {
                const isRead = (n.readBy && n.readBy.includes(user.id)) || n.isRead;
                if (n.category === 'NOTIF_CONGE' && isDriver) {
                    return {
                        ...n,
                        isRead,
                        message: `Votre demande de congé pour le 20/03/2026 a été Approuvée.`,
                        type: 'INFO',
                        actionType: undefined
                    };
                }
                return { ...n, isRead };
            });
    }

    public markAllAsReadAndDismiss(): void {
        const user = this.currentUserSubject.value;
        if (!user) return;

        const current = this.notificationsSubject.value;
        const updated = current.map(n => {
            const readBy = n.readBy ? [...n.readBy] : [];
            if (!readBy.includes(user.id)) readBy.push(user.id);
            
            const dismissedBy = n.dismissedBy ? [...n.dismissedBy] : [];
            if (!dismissedBy.includes(user.id)) dismissedBy.push(user.id);

            return { ...n, readBy, dismissedBy };
        });
        this.notificationsSubject.next(updated);
    }

    public markAsRead(id: string): void {
        const user = this.currentUserSubject.value;
        if (!user) return;

        const current = this.notificationsSubject.value;
        const updated = current.map(n => {
            if (n.id === id) {
                const readBy = n.readBy ? [...n.readBy] : [];
                if (!readBy.includes(user.id)) readBy.push(user.id);
                return { ...n, readBy };
            }
            return n;
        });
        this.notificationsSubject.next(updated);
    }

    public removeNotification(id: string): void {
        const user = this.currentUserSubject.value;
        if (!user) return;

        const current = this.notificationsSubject.value;
        const updated = current.map(n => {
            if (n.id === id) {
                const dismissedBy = n.dismissedBy ? [...n.dismissedBy] : [];
                if (!dismissedBy.includes(user.id)) dismissedBy.push(user.id);
                return { ...n, dismissedBy };
            }
            return n;
        });
        this.notificationsSubject.next(updated);
    }

    public updateStatus(status: 'PENDING' | 'APPROVED' | 'REJECTED'): void {
        const user = this.currentUserSubject.value;
        if (user) {
            user.status = status;
            this.currentUserSubject.next({ ...user });
        }
    }

    public updateUser(user: any): void {
        this.currentUserSubject.next({ ...user });
    }

    public logout(): void {
        this.notificationService.disconnectRealtime();
        this.http.post<{ message: string }>(`${this.apiBaseUrl}/auth/logout`, {}, { withCredentials: true }).subscribe({
            next: () => this.currentUserSubject.next(null),
            error: () => this.currentUserSubject.next(null)
        });
    }

    public getUser() {
        return this.currentUserSubject.value;
    }

    public getToken(): string | null {
        return null;
    }

    public isAuthenticated(): boolean {
        return !!this.getUser();
    }

    public isApproved(): boolean {
        return this.currentUserSubject.value?.approved || false;
    }

    public hasCompany(): boolean {
        const user = this.currentUserSubject.value;
        if (!user) {
            return false;
        }

        if (typeof user.companyStatus === 'string') {
            return user.companyStatus !== 'NONE';
        }

        return user.hasCompany || false;
    }

    public isCompanyActive(): boolean {
        return this.currentUserSubject.value?.companyStatus === 'ACTIF';
    }

    public getCompanyStatus(): 'NONE' | 'EN_ATTENTE' | 'ACTIF' | 'INACTIF' | 'SUSPENDU' {
        return this.currentUserSubject.value?.companyStatus || 'NONE';
    }

    public setHasCompany(value: boolean): void {
        const user = this.currentUserSubject.value;
        if (user) {
            user.hasCompany = value;
            user.companyStatus = value ? (user.companyStatus || 'ACTIF') : 'NONE';
            this.persistHasCompanyFlag(user.email, value);
            this.currentUserSubject.next({ ...user });
        }
    }

    public setCompanyStatus(status: 'NONE' | 'EN_ATTENTE' | 'ACTIF' | 'INACTIF' | 'SUSPENDU'): void {
        const user = this.currentUserSubject.value;
        if (!user) {
            return;
        }

        user.companyStatus = status;
        user.hasCompany = status !== 'NONE';
        this.currentUserSubject.next({ ...user });
    }

    private mapApiUser(user: ApiUser): any {
        const uiRole = user.role === 'CHAUFFEUR' ? 'DRIVER' : user.role;
        const hasCompany = this.resolveHasCompanyFlag(user.email, uiRole, undefined);
        return {
            id: user.id,
            username: `${user.prenom} ${user.nom}`.trim(),
            firstName: user.prenom,
            lastName: user.nom,
            email: user.email,
            role: uiRole,
            status: user.actif ? 'APPROVED' : 'REJECTED',
            hasCompany
        };
    }

    private mapSessionUser(session: AuthSessionResponse, email: string): any {
        const uiRole = session.role === 'CHAUFFEUR' ? 'DRIVER' : session.role;
        const existingAvatar = this.currentUserSubject.value?.avatar ?? null;
        const existingHasCompany = this.currentUserSubject.value?.hasCompany;
        const hasCompany = typeof session.hasCompany === 'boolean'
            ? session.hasCompany
            : this.resolveHasCompanyFlag(email, uiRole, existingHasCompany);
        return {
            id: 'current',
            username: `${session.prenom || ''} ${session.nom || ''}`.trim() || email,
            firstName: session.prenom || '',
            lastName: session.nom || '',
            email,
            role: uiRole,
            firstLogin: session.firstLogin,
            avatar: existingAvatar,
            status: 'APPROVED',
            hasCompany,
            companyStatus: hasCompany ? 'ACTIF' : 'NONE'
        };
    }

    private resolveHasCompanyFlag(email: string, role: 'SUPERADMIN' | 'MANAGER' | 'DRIVER', existing?: boolean): boolean {
        if (role !== 'MANAGER') {
            return true;
        }

        if (typeof existing === 'boolean') {
            return existing;
        }

        return this.readHasCompanyFlag(email);
    }

    private persistHasCompanyFlag(email: string | undefined, value: boolean): void {
        const key = this.companyStorageKey(email);
        if (!key) {
            return;
        }

        try {
            localStorage.setItem(key, value ? '1' : '0');
        } catch {
            // Ignore storage failures to keep auth flow stable.
        }
    }

    private readHasCompanyFlag(email: string | undefined): boolean {
        const key = this.companyStorageKey(email);
        if (!key) {
            return false;
        }

        try {
            return localStorage.getItem(key) === '1';
        } catch {
            return false;
        }
    }

    private companyStorageKey(email: string | undefined): string | null {
        if (!email || !email.trim()) {
            return null;
        }
        return `${this.hasCompanyStoragePrefix}${email.trim().toLowerCase()}`;
    }

    public refreshToken(): Observable<boolean> {
        return this.http.post<any>(`${this.apiBaseUrl}/auth/refresh`, {}, { withCredentials: true }).pipe(
            tap(() => {
                // Token cookies are automatically handled by the browser
                // No need to manually store them
                console.log('Token refreshed successfully');
            }),
            map(() => true),
            catchError((error) => {
                console.error('Token refresh failed:', error);
                return of(false);
            })
        );
    }

    private syncProfileAvatar(): void {
        const currentUser = this.currentUserSubject.value;
        if (!currentUser || this.profileSyncInProgress) {
            return;
        }

        this.profileSyncInProgress = true;
        this.http.get<{ image?: string }>(`${this.apiBaseUrl}/profile/me`, { withCredentials: true }).pipe(
            finalize(() => {
                this.profileSyncInProgress = false;
            })
        ).subscribe({
            next: (profile) => {
                const user = this.currentUserSubject.value;
                if (!user) {
                    return;
                }

                const avatar = profile?.image ?? null;
                if ((user.avatar ?? null) === avatar) {
                    return;
                }

                this.currentUserSubject.next({ ...user, avatar });
            },
            error: () => {
                // Keep auth/session flow stable even if profile image sync fails.
            }
        });
    }

    private extractRoleFromJwtPayload(payload: any): 'SUPERADMIN' | 'MANAGER' | 'DRIVER' {
        const roles: string[] = payload?.realm_access?.roles || [];
        if (roles.includes('ROLE_SUPERADMIN')) return 'SUPERADMIN';
        if (roles.includes('ROLE_MANAGER')) return 'MANAGER';
        return 'DRIVER';
    }
}
