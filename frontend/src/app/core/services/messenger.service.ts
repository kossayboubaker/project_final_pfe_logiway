import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { BehaviorSubject, Observable, Subject, of } from 'rxjs';
import { catchError, map, tap } from 'rxjs/operators';
import { throwError } from 'rxjs';
import { AuthService } from '../auth.service';

export type MessengerRole = 'SUPERADMIN' | 'MANAGER' | 'CHAUFFEUR';
export type MessengerMessageType = 'TEXTE' | 'IMAGE' | 'PDF' | 'VOCAL' | 'APPEL';
export type MessengerMessageStatus = 'NON_LU' | 'LU';
export type MessengerDeliveryState = 'SENT' | 'RECEIVED' | 'READ';
export type MessengerRealtimeEventName = 'message' | 'status' | 'conversation' | 'presence' | 'MESSAGE_MODIFIE' | 'MESSAGE_SUPPRIME';

export interface MessengerUserResponse {
    id: number;
    prenom: string | null;
    nom: string | null;
    email: string;
    image: string | null;
    role: MessengerRole;
    connecte: boolean;
    derniereActivite: string | null;
    dernierMessage: string | null;
    dateDernierMessage: string | null;
    messagesNonLus: number;
}

export interface MessengerConversationResponse {
    destinataireId: number;
    prenom: string | null;
    nom: string | null;
    email: string;
    image: string | null;
    role: MessengerRole;
    connecte: boolean;
    derniereActivite: string | null;
    dernierType: MessengerMessageType | null;
    dernierMessage: string | null;
    dateDernierMessage: string | null;
    messagesNonLus: number;
}

export interface MessengerMessageResponse {
    id: number;
    expediteurId: number;
    expediteurPrenom: string | null;
    expediteurNom: string | null;
    expediteurEmail: string;
    expediteurImage: string | null;
    expediteurRole: MessengerRole;
    destinataireId: number;
    destinatairePrenom: string | null;
    destinataireNom: string | null;
    destinataireEmail: string;
    destinataireImage: string | null;
    destinataireRole: MessengerRole;
    type: MessengerMessageType;
    contenu: string | null;
    cheminFichier: string | null;
    nomFichierOriginal: string | null;
    tailleFichier: number | null;
    dureeVocale: number | null;
    statut: MessengerMessageStatus;
    dateEnvoi: string;
    dateLecture: string | null;
    modifie: boolean;
    dateModification: string | null;
    contenuOriginal: string | null;
    supprime: boolean;
    dateSuppression: string | null;
    connecte: boolean;
    derniereActivite: string | null;
    fichierUrl: string | null;
    heureEnvoi: string;
}

export interface MessengerMessageUpdateRequest {
    contenu: string;
}

export interface MessengerMessagePageResponse {
    messages: MessengerMessageResponse[];
    page: number;
    size: number;
    totalElements: number;
    hasMore: boolean;
}

export interface MessengerPresenceResponse {
    utilisateurId: number;
    connecte: boolean;
    derniereActivite: string | null;
}

export interface MessengerEvent<T = unknown> {
    type: MessengerRealtimeEventName;
    payload: T;
}

export interface MessengerMessageView extends MessengerMessageResponse {
    sentByMe: boolean;
    deliveryState: MessengerDeliveryState;
}

@Injectable({
    providedIn: 'root'
})
export class MessengerService {
    private readonly apiBaseUrl = 'http://localhost:8080/api/messenger';
    private readonly serverBaseUrl = 'http://localhost:8080';

    private usersSubject = new BehaviorSubject<MessengerUserResponse[]>([]);
    private conversationsSubject = new BehaviorSubject<MessengerConversationResponse[]>([]);
    private unreadCountSubject = new BehaviorSubject<number>(0);
    private realtimeEventSubject = new Subject<MessengerEvent>();

    private realtimeSource?: EventSource;
    private reconnectTimer?: number;
    private heartbeatTimer?: number;

    public users$ = this.usersSubject.asObservable();
    public conversations$ = this.conversationsSubject.asObservable();
    public unreadCount$ = this.unreadCountSubject.asObservable();
    public realtimeEvents$ = this.realtimeEventSubject.asObservable();

    constructor(private http: HttpClient, private authService: AuthService) {}

    loadUsers(search = ''): Observable<MessengerUserResponse[]> {
        let params = new HttpParams();
        if (search.trim()) {
            params = params.set('search', search.trim());
        }

        return this.http.get<MessengerUserResponse[]>(`${this.apiBaseUrl}/utilisateurs`, { withCredentials: true, params }).pipe(
            tap(users => this.usersSubject.next(this.sortUsers(users))),
            catchError(() => {
                this.usersSubject.next([]);
                return of([]);
            })
        );
    }

    loadConversations(search = ''): Observable<MessengerConversationResponse[]> {
        let params = new HttpParams();
        if (search.trim()) {
            params = params.set('search', search.trim());
        }

        return this.http.get<MessengerConversationResponse[]>(`${this.apiBaseUrl}/conversations`, { withCredentials: true, params }).pipe(
            tap(conversations => {
                this.conversationsSubject.next(this.sortConversations(conversations));
                this.unreadCountSubject.next(conversations.reduce((total, conversation) => total + (conversation.messagesNonLus || 0), 0));
            }),
            catchError(() => {
                this.conversationsSubject.next([]);
                this.unreadCountSubject.next(0);
                return of([]);
            })
        );
    }

    loadMessages(destinataireId: number, page = 0, size = 30): Observable<MessengerMessagePageResponse> {
        return this.http.get<MessengerMessagePageResponse>(`${this.apiBaseUrl}/conversations/${destinataireId}/messages`, {
            withCredentials: true,
            params: new HttpParams()
                .set('page', page)
                .set('size', size)
        }).pipe(
            tap(response => {
                response.messages = response.messages.map(message => this.mapMessageView(message));
            }),
            catchError(() => of({ messages: [], page, size, totalElements: 0, hasMore: false }))
        );
    }

    sendTextMessage(destinataireId: number, contenu: string): Observable<MessengerMessageView> {
        return this.http.post<MessengerMessageResponse>(`${this.apiBaseUrl}/messages`, {
            destinataireId,
            contenu
        }, { withCredentials: true }).pipe(
            tap(message => this.handleRealtimeOptimisticRefresh(message, 'message')),
            map(message => this.mapMessageView(message)),
            catchError(() => {
                return throwError(() => new Error('Impossible d envoyer le message texte'));
            })
        );
    }

    sendFileMessage(destinataireId: number, file: File): Observable<MessengerMessageView> {
        const formData = new FormData();
        formData.append('destinataireId', String(destinataireId));
        formData.append('fichier', file);

        return this.http.post<MessengerMessageResponse>(`${this.apiBaseUrl}/messages/fichiers`, formData, { withCredentials: true }).pipe(
            tap(message => this.handleRealtimeOptimisticRefresh(message, 'message')),
            map(message => this.mapMessageView(message)),
            catchError(() => {
                return throwError(() => new Error('Impossible d envoyer le fichier'));
            })
        );
    }

    sendVocalMessage(destinataireId: number, file: File, dureeVocale?: number): Observable<MessengerMessageView> {
        const formData = new FormData();
        formData.append('destinataireId', String(destinataireId));
        formData.append('fichier', file);
        if (typeof dureeVocale === 'number') {
            formData.append('dureeVocale', String(dureeVocale));
        }

        return this.http.post<MessengerMessageResponse>(`${this.apiBaseUrl}/messages/vocal`, formData, { withCredentials: true }).pipe(
            tap(message => this.handleRealtimeOptimisticRefresh(message, 'message')),
            map(message => this.mapMessageView(message)),
            catchError(() => {
                return throwError(() => new Error('Impossible d envoyer le message vocal'));
            })
        );
    }

    updateMessage(messageId: number, contenu: string): Observable<MessengerMessageView> {
        return this.http.put<MessengerMessageResponse>(`${this.apiBaseUrl}/messages/${messageId}`, { contenu }, { withCredentials: true }).pipe(
            tap(message => this.handleRealtimeOptimisticRefresh(message, 'message')),
            map(message => this.mapMessageView(message))
        );
    }

    deleteMessage(messageId: number): Observable<void> {
        return this.http.delete<void>(`${this.apiBaseUrl}/messages/${messageId}`, { withCredentials: true }).pipe(
            tap(() => this.refreshConversations())
        );
    }

    markConversationAsRead(destinataireId: number): Observable<unknown> {
        return this.http.put(`${this.apiBaseUrl}/conversations/${destinataireId}/lu`, {}, { withCredentials: true }).pipe(
            tap(() => this.refreshConversations()),
            catchError(() => of(null))
        );
    }

    sendPresenceHeartbeat(): Observable<MessengerPresenceResponse> {
        return this.http.post<MessengerPresenceResponse>(`${this.apiBaseUrl}/presence`, {}, { withCredentials: true }).pipe(
            catchError(() => of({ utilisateurId: 0, connecte: false, derniereActivite: null }))
        );
    }

    disconnectPresence(): Observable<MessengerPresenceResponse> {
        return this.http.post<MessengerPresenceResponse>(`${this.apiBaseUrl}/presence/disconnect`, {}, { withCredentials: true }).pipe(
            catchError(() => of({ utilisateurId: 0, connecte: false, derniereActivite: null }))
        );
    }

    connectRealtime(): void {
        if (this.realtimeSource || typeof EventSource === 'undefined') {
            return;
        }

        this.realtimeSource = new EventSource(`${this.apiBaseUrl}/stream`, { withCredentials: true });
        ['message', 'status', 'conversation', 'presence', 'MESSAGE_MODIFIE', 'MESSAGE_SUPPRIME']
            .forEach(eventName => this.realtimeSource?.addEventListener(eventName, event => this.handleRealtimeEvent(eventName as MessengerRealtimeEventName, event)));
        this.realtimeSource.onerror = () => {
            this.disconnectRealtime();
            this.reconnectTimer = window.setTimeout(() => this.connectRealtime(), 3000);
        };

        this.startHeartbeat();
        this.sendPresenceHeartbeat().subscribe();
    }

    disconnectRealtime(): void {
        if (this.reconnectTimer) {
            window.clearTimeout(this.reconnectTimer);
            this.reconnectTimer = undefined;
        }

        if (this.heartbeatTimer) {
            window.clearInterval(this.heartbeatTimer);
            this.heartbeatTimer = undefined;
        }

        this.realtimeSource?.close();
        this.realtimeSource = undefined;
    }

    getUsersSnapshot(): MessengerUserResponse[] {
        return this.usersSubject.value;
    }

    getConversationsSnapshot(): MessengerConversationResponse[] {
        return this.conversationsSubject.value;
    }

    getUnreadCountSnapshot(): number {
        return this.unreadCountSubject.value;
    }

    getCurrentUserEmail(): string {
        return this.authService.getUser()?.email || '';
    }

    getFileUrl(message: Pick<MessengerMessageResponse, 'fichierUrl' | 'cheminFichier'>): string | null {
        if (message.fichierUrl) {
            return `${this.serverBaseUrl}${message.fichierUrl}`;
        }

        if (!message.cheminFichier) {
            return null;
        }

        const filename = message.cheminFichier.split(/[\\/]/).pop();
        return filename ? `${this.serverBaseUrl}/api/messenger/fichiers/${filename}` : null;
    }

    private handleRealtimeEvent(type: MessengerEvent['type'], event: MessageEvent): void {
        try {
            const payload = JSON.parse(String(event.data));
            this.realtimeEventSubject.next({ type, payload });

            if (type === 'message' || type === 'status' || type === 'conversation' || type === 'MESSAGE_MODIFIE' || type === 'MESSAGE_SUPPRIME') {
                this.refreshConversations();
            }

            if (type === 'presence') {
                this.refreshUsers();
            }
        } catch {
            // Ignore malformed SSE payloads.
        }
    }

    private refreshConversations(): void {
        this.loadConversations().subscribe();
    }

    private refreshUsers(): void {
        this.loadUsers().subscribe();
    }

    private startHeartbeat(): void {
        if (this.heartbeatTimer) {
            return;
        }

        this.heartbeatTimer = window.setInterval(() => {
            this.sendPresenceHeartbeat().subscribe();
        }, 30000);
    }

    private sortUsers(users: MessengerUserResponse[]): MessengerUserResponse[] {
        return [...users].sort((left, right) => {
            const onlineCompare = Number(Boolean(right.connecte)) - Number(Boolean(left.connecte));
            if (onlineCompare !== 0) {
                return onlineCompare;
            }

            const leftName = `${left.prenom || ''} ${left.nom || ''}`.trim().toLocaleLowerCase('fr-FR');
            const rightName = `${right.prenom || ''} ${right.nom || ''}`.trim().toLocaleLowerCase('fr-FR');
            return leftName.localeCompare(rightName, 'fr');
        });
    }

    private sortConversations(conversations: MessengerConversationResponse[]): MessengerConversationResponse[] {
        return [...conversations].sort((left, right) => {
            const leftDate = left.dateDernierMessage ? new Date(left.dateDernierMessage).getTime() : 0;
            const rightDate = right.dateDernierMessage ? new Date(right.dateDernierMessage).getTime() : 0;
            return rightDate - leftDate;
        });
    }

    private mapMessageView(message: MessengerMessageResponse): MessengerMessageView {
        const currentEmail = this.authService.getUser()?.email || '';
        const sentByMe = message.expediteurEmail.toLowerCase() === currentEmail.toLowerCase();
        return {
            ...message,
            sentByMe,
            deliveryState: sentByMe ? (message.statut === 'LU' ? 'READ' : 'RECEIVED') : 'RECEIVED'
        };
    }

    private handleRealtimeOptimisticRefresh(message: MessengerMessageResponse, type: 'message'): void {
        this.refreshConversations();
        this.realtimeEventSubject.next({ type, payload: message });
    }
}