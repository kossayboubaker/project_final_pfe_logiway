import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, Subject } from 'rxjs';
import { switchMap, tap, catchError } from 'rxjs/operators';
import { of } from 'rxjs';
import { AppConfigService } from './app-config.service';

export interface NotificationResponse {
    id: number;
    type: 'NOTIF_COMPTE' | 'NOTIF_TRAJET' | 'NOTIF_CONGE' | 'NOTIF_RECLAMATION' | 'NOTIF_MESSAGE' | 'NOTIF_ENTREPRISE' | 'NOTIF_VEHICULE' | 'SECTEUR' | 'NOTIF_DETECTION' | 'NOTIF_WEATHER' | 'NOTIF_INFRA' | 'NOTIF_ACCIDENT';
    message: string;
    dateCreation: string;
    estLu: boolean;
    tone?: 'SUCCESS' | 'DANGER' | 'INFO' | 'WARNING';
}

export type NotificationCategory = 'NOTIF_COMPTE' | 'NOTIF_TRAJET' | 'NOTIF_CONGE' | 'NOTIF_RECLAMATION' | 'NOTIF_MESSAGE' | 'NOTIF_ENTREPRISE' | 'NOTIF_VEHICULE' | 'SECTEUR' | 'NOTIF_DETECTION' | 'NOTIF_WEATHER' | 'NOTIF_INFRA' | 'NOTIF_ACCIDENT';

export interface AppNotification {
    id: string;
    title: string;
    message: string;
    type: 'INFO' | 'ACTION' | 'WARNING' | 'DANGER';
    category: NotificationCategory;
    time: string;
    date: Date;
    isRead: boolean;
    dismissed: boolean;
    readBy?: string[];
    dismissedBy?: string[];
    actionType?: 'LEAVE_REQUEST' | 'USER_VALIDATION' | 'TRIP_ASSIGNMENT';
    tone?: 'SUCCESS' | 'DANGER' | 'INFO' | 'WARNING';
    leaveRequestId?: string;
}

@Injectable({
    providedIn: 'root'
})
export class NotificationService {
    private get apiBaseUrl(): string { return `${this.appConfig.apiUrl}/notifications`; }
    private readonly leaveTokenRegex = /\[CONGE_ID:(\d+)\]\s*/i;
    private dismissedNotificationIds = new Set<string>();
    private notificationOverrides = new Map<string, Partial<AppNotification>>();
    private realtimeSource?: EventSource;
    private realtimeReconnectTimer?: number;
    
    private notificationsSubject = new BehaviorSubject<AppNotification[]>([]);
    public notifications$ = this.notificationsSubject.asObservable();
    private unreadCountSubject = new BehaviorSubject<number>(0);
    public unreadCount$ = this.unreadCountSubject.asObservable();
    private realtimeNotificationSubject = new Subject<AppNotification>();
    public realtimeNotification$ = this.realtimeNotificationSubject.asObservable();
    private audioContext?: AudioContext;
    private notificationBuffer?: AudioBuffer;
    private audioUnlocked = false;

    constructor(private http: HttpClient, private appConfig: AppConfigService) {}

    private ensureAudioSetup() {
        if (this.audioContext) return;
        try {
            this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
            const unlock = () => {
                if (!this.audioContext) return;
                this.audioContext.resume().then(() => {
                    this.audioUnlocked = true;
                }).catch(() => {
                    // ignore
                });
                window.removeEventListener('click', unlock);
            };
            window.addEventListener('click', unlock, { once: true });
        } catch {
            this.audioContext = undefined;
        }
    }

    private loadNotificationSound(): void {
        if (!this.audioContext) {
            this.ensureAudioSetup();
        }

        if (!this.audioContext || this.notificationBuffer) return;
        fetch('/assets/notif/notification.wav').then(resp => resp.arrayBuffer()).then(data => {
            this.audioContext!.decodeAudioData(data, buffer => {
                this.notificationBuffer = buffer;
            }, () => {
                // ignore decode errors
            });
        }).catch(() => {
            // ignore load errors
        });
    }

    public connectRealtime(): void {
        if (this.realtimeSource || typeof EventSource === 'undefined') {
            return;
        }

        this.realtimeSource = new EventSource(`${this.apiBaseUrl}/stream`, { withCredentials: true });
        this.realtimeSource.addEventListener('notification', (event: MessageEvent) => {
            this.handleRealtimeNotification(event.data);
        });
        this.realtimeSource.onerror = () => {
            this.disconnectRealtime();
            this.realtimeReconnectTimer = window.setTimeout(() => this.connectRealtime(), 5000);
        };

        // Prepare audio playback for notifications
        this.ensureAudioSetup();
        this.loadNotificationSound();
    }

    public disconnectRealtime(): void {
        if (this.realtimeReconnectTimer) {
            window.clearTimeout(this.realtimeReconnectTimer);
            this.realtimeReconnectTimer = undefined;
        }

        this.realtimeSource?.close();
        this.realtimeSource = undefined;
    }

    public loadNotifications(): Observable<AppNotification[]> {
        return this.http.get<NotificationResponse[]>(this.apiBaseUrl, { withCredentials: true }).pipe(
            tap(apiNotifs => {
                const appNotifs = apiNotifs
                    .map(n => this.mapToAppNotification(n))
                    .map(n => this.applyOverride(n))
                    .filter(n => !this.dismissedNotificationIds.has(n.id));
                const localNotifs = this.notificationsSubject.value.filter(n => n.id.startsWith('__local__'));
                this.notificationsSubject.next([...localNotifs, ...appNotifs]);
                this.connectRealtime();
                this.updateUnreadCount();
            }),
            switchMap(() => of(this.notificationsSubject.value)),
            catchError(() => {
                const localNotifs = this.notificationsSubject.value.filter(n => n.id.startsWith('__local__'));
                this.notificationsSubject.next(localNotifs);
                this.updateUnreadCount();
                return of([]);
            })
        );
    }

    public loadUnreadNotifications(): Observable<AppNotification[]> {
        return this.http.get<NotificationResponse[]>(`${this.apiBaseUrl}/unread`, { withCredentials: true }).pipe(
            tap(apiNotifs => {
                const appNotifs = apiNotifs.map(n => this.mapToAppNotification(n));
                this.notificationsSubject.next(appNotifs);
                this.updateUnreadCount();
            }),
            switchMap(() => of(this.notificationsSubject.value)),
            catchError(() => {
                this.notificationsSubject.next([]);
                this.updateUnreadCount();
                return of([]);
            })
        );
    }

    public getNotifications(): AppNotification[] {
        return this.notificationsSubject.value;
    }

    public removeNotification(id: string): void {
        this.dismissedNotificationIds.add(id);
        const current = this.notificationsSubject.value;
        const updated = current.filter(n => n.id !== id);
        this.notificationsSubject.next(updated);
        this.updateUnreadCount();
    }

    public clearAllNotifications(): void {
        const current = this.notificationsSubject.value;
        current.forEach(n => this.dismissedNotificationIds.add(n.id));
        this.notificationsSubject.next([]);
        this.updateUnreadCount();
    }

    public addLocalNotification(notification: Omit<AppNotification, 'id' | 'date' | 'time' | 'isRead' | 'dismissed'>): void {
        const current = this.notificationsSubject.value;
        const localNotification: AppNotification = {
            id: `__local__${Date.now()}`,
            title: notification.title,
            message: notification.message,
            type: notification.type,
            category: notification.category,
            time: this.formatExactDateTime(new Date()),
            date: new Date(),
            isRead: false,
            dismissed: false,
            tone: notification.tone
        };
        this.notificationsSubject.next([localNotification, ...current]);
        this.updateUnreadCount();
    }

    public getLeaveRequestId(notification: Pick<AppNotification, 'message' | 'leaveRequestId'>): string | null {
        if (notification.leaveRequestId) {
            return notification.leaveRequestId;
        }

        const match = notification.message.match(this.leaveTokenRegex);
        return match?.[1] ?? null;
    }

    public markLeaveNotificationHandled(id: string, decision: 'ACCEPT' | 'REJECT'): void {
        const current = this.notificationsSubject.value;
        const target = current.find(n => n.id === id);
        if (!target) {
            return;
        }

        const verb = decision === 'ACCEPT' ? 'approuvée' : 'rejetée';
        const updatedMessage = `Demande de congé traitée: ${verb}. ${target.message}`;

        const override: Partial<AppNotification> = {
            message: updatedMessage,
            isRead: true,
            type: decision === 'REJECT' ? 'DANGER' : 'INFO',
            tone: decision === 'REJECT' ? 'DANGER' : 'SUCCESS'
        };
        this.notificationOverrides.set(id, override);

        const updated = current.map(notification =>
            notification.id === id ? ({ ...notification, ...override }) : notification
        );
        this.notificationsSubject.next(updated);
    }

    public markAsRead(id: string): void {
        const current = this.notificationsSubject.value;
        const updated = current.map(n => {
            if (n.id === id) {
                return { ...n, isRead: true };
            }
            return n;
        });
        this.notificationsSubject.next(updated);
        this.updateUnreadCount();
    }

    private mapToAppNotification(apiNotif: NotificationResponse): AppNotification {
        const leaveRequestId = this.extractLeaveRequestId(apiNotif.message);
        const normalizedMessage = this.stripLeaveToken(apiNotif.message);
        const normalizedNotification: NotificationResponse = {
            ...apiNotif,
            message: normalizedMessage
        };

        return {
            id: apiNotif.id.toString(),
            title: this.getCategoryLabel(apiNotif.type),
            message: normalizedMessage,
            type: this.mapNotificationType(normalizedNotification),
            category: apiNotif.type,
            time: this.formatExactDateTime(new Date(apiNotif.dateCreation)),
            date: new Date(apiNotif.dateCreation),
            isRead: apiNotif.estLu,
            dismissed: false,
            tone: apiNotif.tone,
            leaveRequestId
        };
    }

    private getCategoryLabel(category: string): string {
        switch (category) {
            case 'NOTIF_COMPTE': return 'Compte';
            case 'NOTIF_TRAJET': return 'Trajet';
            case 'NOTIF_CONGE': return 'Congé';
            case 'NOTIF_RECLAMATION': return 'Réclamation';
            case 'NOTIF_MESSAGE': return 'Message';
            case 'NOTIF_ENTREPRISE': return 'Entreprise';
            case 'NOTIF_VEHICULE': return 'Véhicule';
            case 'NOTIF_DETECTION': return 'Détection';
            case 'NOTIF_WEATHER': return 'Météo';
            case 'NOTIF_INFRA': return 'Infrastructure';
            case 'NOTIF_ACCIDENT': return 'Accident';
            case 'SECTEUR': return 'Secteur';
            default: return 'Notification';
        }
    }

    private mapNotificationType(notification: NotificationResponse): 'INFO' | 'ACTION' | 'WARNING' | 'DANGER' {
        switch (notification.type) {
            case 'NOTIF_COMPTE':
                if (notification.tone === 'DANGER') {
                    return 'DANGER';
                }
                if (notification.tone === 'WARNING') {
                    return 'WARNING';
                }
                return 'INFO';
            case 'NOTIF_TRAJET': return 'INFO';
            case 'NOTIF_CONGE':
                if (notification.tone === 'DANGER') {
                    return 'DANGER';
                }
                if (notification.tone === 'SUCCESS') {
                    return 'INFO';
                }
                if (notification.tone === 'WARNING') {
                    return /nouvelle demande de congé/i.test(notification.message) ? 'ACTION' : 'WARNING';
                }
                return /nouvelle demande de congé/i.test(notification.message) ? 'ACTION' : 'INFO';
            case 'NOTIF_RECLAMATION': return 'WARNING';
            case 'NOTIF_MESSAGE': return 'INFO';
            case 'NOTIF_ENTREPRISE':
                if (notification.tone === 'DANGER') return 'DANGER';
                if (notification.tone === 'WARNING') return 'WARNING';
                return 'INFO';
            case 'NOTIF_VEHICULE':
                if (notification.tone === 'DANGER') return 'DANGER';
                if (notification.tone === 'WARNING') return 'WARNING';
                return 'INFO';
            case 'NOTIF_DETECTION':
                return notification.tone === 'DANGER' ? 'DANGER' : (notification.tone === 'WARNING' ? 'WARNING' : 'INFO');
            case 'NOTIF_WEATHER':
                return notification.tone === 'DANGER' ? 'DANGER' : (notification.tone === 'WARNING' ? 'WARNING' : 'INFO');
            case 'NOTIF_INFRA':
                return notification.tone === 'DANGER' ? 'DANGER' : (notification.tone === 'WARNING' ? 'WARNING' : 'INFO');
            case 'NOTIF_ACCIDENT':
                return 'DANGER';
            case 'SECTEUR': return 'INFO';
            default: return 'INFO';
        }
    }

    private formatExactDateTime(date: Date): string {
        return date.toLocaleString('fr-FR', {
            dateStyle: 'short',
            timeStyle: 'medium'
        });
    }

    private handleRealtimeNotification(payload: string): void {
        try {
            const apiNotif = JSON.parse(payload) as NotificationResponse;
            const mapped = this.mapToAppNotification(apiNotif);
            const resolved = this.applyOverride(mapped);
            if (this.dismissedNotificationIds.has(resolved.id)) {
                return;
            }

            const current = this.notificationsSubject.value.filter(n => n.id !== resolved.id);
            this.notificationsSubject.next([resolved, ...current]);
            // update unread counter
            this.updateUnreadCount();
            // play sound
            this.playNotificationSound();
            // notify UI listeners for immediate alert display
            this.realtimeNotificationSubject.next(resolved);
        } catch {
            // Ignore malformed realtime payloads to preserve stability.
        }
    }

    private updateUnreadCount(): void {
        const count = this.notificationsSubject.value.filter(n => !n.isRead).length;
        this.unreadCountSubject.next(count);
    }

    private playNotificationSound(): void {
        if (!this.audioContext || !this.notificationBuffer) return;
        try {
            const src = this.audioContext.createBufferSource();
            src.buffer = this.notificationBuffer!;
            const gain = this.audioContext.createGain();
            gain.gain.value = 0.8; // 80%
            src.connect(gain).connect(this.audioContext.destination);
            src.start(0);
        } catch {
            // ignore playback errors
        }
    }

    private extractLeaveRequestId(message: string): string | undefined {
        const match = (message || '').match(this.leaveTokenRegex);
        return match?.[1];
    }

    private stripLeaveToken(message: string): string {
        return (message || '').replace(this.leaveTokenRegex, '').trim();
    }

    private applyOverride(notification: AppNotification): AppNotification {
        const override = this.notificationOverrides.get(notification.id);
        if (!override) {
            return notification;
        }

        return {
            ...notification,
            ...override
        };
    }
}
