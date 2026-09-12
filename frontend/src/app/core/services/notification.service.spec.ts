import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { NotificationService, AppNotification } from './notification.service';

// EventSource factice pour tester le flux temps réel (jsdom ne l'expose pas)
class FakeEventSource {
  static instances: FakeEventSource[] = [];
  url: string;
  withCredentials = false;
  closed = false;
  private listeners = new Map<string, Array<(ev?: any) => void>>();
  onerror: (() => void) | null = null;

  constructor(url: string, opts?: any) {
    this.url = url;
    this.withCredentials = !!opts?.withCredentials;
    FakeEventSource.instances.push(this);
  }

  addEventListener(type: string, cb: (ev?: any) => void): void {
    const arr = this.listeners.get(type) || [];
    arr.push(cb);
    this.listeners.set(type, arr);
  }

  emit(type: string, data: any): void {
    (this.listeners.get(type) || []).forEach(cb => cb({ data }));
  }

  close(): void {
    this.closed = true;
  }
}

function installFakeEventSource(): void {
  (globalThis as any).EventSource = FakeEventSource;
}

function uninstallFakeEventSource(): void {
  delete (globalThis as any).EventSource;
  FakeEventSource.instances.length = 0;
}


describe('NotificationService', () => {
  let service: NotificationService;
  let httpMock: HttpTestingController;
  const apiBase = 'http://localhost:8080/api/notifications';

  const mockApiNotif = {
    id: 1,
    type: 'NOTIF_TRAJET' as const,
    message: 'Nouveau trajet assigné',
    dateCreation: '2025-06-01T10:00:00',
    estLu: false,
    tone: 'INFO' as const
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        NotificationService
      ]
    });
    service = TestBed.inject(NotificationService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should start with an empty notification list', () => {
    expect(service.getNotifications()).toEqual([]);
  });

  // ─── loadNotifications() ──────────────────────────────────────
  it('loadNotifications() should call GET /api/notifications', () => {
    service.loadNotifications().subscribe(notifs => {
      expect(notifs.length).toBe(1);
    });
    httpMock.expectOne(apiBase).flush([mockApiNotif]);
  });

  it('loadNotifications() should map notification correctly', () => {
    service.loadNotifications().subscribe(() => {
      const notifs = service.getNotifications();
      expect(notifs.length).toBe(1);
      expect(notifs[0].id).toBe('1');
      expect(notifs[0].message).toBe('Nouveau trajet assigné');
      expect(notifs[0].isRead).toBeFalse();
      expect(notifs[0].category).toBe('NOTIF_TRAJET');
    });
    httpMock.expectOne(apiBase).flush([mockApiNotif]);
  });

  it('loadNotifications() should return empty on error', () => {
    service.loadNotifications().subscribe(() => {
      expect(service.getNotifications()).toEqual([]);
    });
    httpMock.expectOne(apiBase).flush('error', { status: 500, statusText: 'Error' });
  });

  // ─── removeNotification() ─────────────────────────────────────
  it('removeNotification() should remove from list', () => {
    service.loadNotifications().subscribe(() => {
      service.removeNotification('1');
      expect(service.getNotifications().find(n => n.id === '1')).toBeUndefined();
    });
    httpMock.expectOne(apiBase).flush([mockApiNotif]);
  });

  it('removeNotification() should not add dismissed notification back on reload', () => {
    service.loadNotifications().subscribe(() => {
      service.removeNotification('1');
    });
    httpMock.expectOne(apiBase).flush([mockApiNotif]);

    service.loadNotifications().subscribe(() => {
      const notifs = service.getNotifications().filter(n => !n.id.startsWith('__local__'));
      expect(notifs.find(n => n.id === '1')).toBeUndefined();
    });
    httpMock.expectOne(apiBase).flush([mockApiNotif]);
  });

  // ─── clearAllNotifications() ──────────────────────────────────
  it('clearAllNotifications() should clear all notifications', () => {
    service.loadNotifications().subscribe(() => {
      service.clearAllNotifications();
      const notifs = service.getNotifications().filter(n => !n.id.startsWith('__local__'));
      expect(notifs.length).toBe(0);
    });
    httpMock.expectOne(apiBase).flush([mockApiNotif]);
  });

  // ─── markAsRead() ─────────────────────────────────────────────
  it('markAsRead() should mark a notification as read', () => {
    service.loadNotifications().subscribe(() => {
      service.markAsRead('1');
      const n = service.getNotifications().find(notif => notif.id === '1');
      expect(n?.isRead).toBeTrue();
    });
    httpMock.expectOne(apiBase).flush([mockApiNotif]);
  });

  it('markAsRead() should leave other notifications untouched', () => {
    service.loadNotifications().subscribe(() => {
      service.markAsRead('999');
      const n = service.getNotifications().find(notif => notif.id === '1');
      expect(n?.isRead).toBeFalse();
      let unread = -1;
      service.unreadCount$.subscribe(c => unread = c);
      expect(unread).toBe(1);
    });
    httpMock.expectOne(apiBase).flush([mockApiNotif]);
  });

  // ─── addLocalNotification() ───────────────────────────────────
  it('addLocalNotification() should add to front of list with __local__ prefix', () => {
    service.addLocalNotification({
      title: 'Test',
      message: 'Test message',
      type: 'INFO',
      category: 'NOTIF_MESSAGE'
    });
    const notifs = service.getNotifications();
    expect(notifs.length).toBe(1);
    expect(notifs[0].id.startsWith('__local__')).toBeTrue();
    expect(notifs[0].isRead).toBeFalse();
  });

  // ─── unreadCount$ ─────────────────────────────────────────────
  it('unreadCount$ should emit correct count after loading', () => {
    let count = -1;
    service.unreadCount$.subscribe(c => count = c);
    service.loadNotifications().subscribe();
    httpMock.expectOne(apiBase).flush([mockApiNotif, { ...mockApiNotif, id: 2, estLu: true }]);
    expect(count).toBe(1);
  });

  // ─── getLeaveRequestId() ──────────────────────────────────────
  it('getLeaveRequestId() should extract leave ID from message', () => {
    const notif = { message: 'Nouvelle demande [CONGE_ID:42] de congé', leaveRequestId: undefined };
    const id = service.getLeaveRequestId(notif as any);
    expect(id).toBe('42');
  });

  it('getLeaveRequestId() should return leaveRequestId if set', () => {
    const notif = { message: 'msg', leaveRequestId: '99' };
    expect(service.getLeaveRequestId(notif as any)).toBe('99');
  });

  it('getLeaveRequestId() should return null when no token', () => {
    const notif = { message: 'Simple notification', leaveRequestId: undefined };
    expect(service.getLeaveRequestId(notif as any)).toBeNull();
  });

  // ─── notification type mapping ────────────────────────────────
  it('should map NOTIF_RECLAMATION to WARNING type', () => {
    service.loadNotifications().subscribe(() => {
      const n = service.getNotifications()[0];
      expect(n.type).toBe('WARNING');
    });
    httpMock.expectOne(apiBase).flush([{ ...mockApiNotif, type: 'NOTIF_RECLAMATION' }]);
  });

  it('should map NOTIF_ACCIDENT to DANGER type', () => {
    service.loadNotifications().subscribe(() => {
      const n = service.getNotifications()[0];
      expect(n.type).toBe('DANGER');
    });
    httpMock.expectOne(apiBase).flush([{ ...mockApiNotif, type: 'NOTIF_ACCIDENT' }]);
  });

  it('should strip [CONGE_ID:x] token from notification message', () => {
    service.loadNotifications().subscribe(() => {
      const n = service.getNotifications()[0];
      expect(n.message).not.toContain('[CONGE_ID:');
    });
    httpMock.expectOne(apiBase).flush([{
      ...mockApiNotif,
      type: 'NOTIF_CONGE',
      message: 'Nouvelle demande [CONGE_ID:5] de congé soumise'
    }]);
  });

  // ═══════════════ EXTENSIONS (couverture complémentaire) ═══════════════

  // ─── loadUnreadNotifications() ────────────────────────────────
  it('loadUnreadNotifications() should call GET /api/notifications/unread and replace the list', () => {
    service.addLocalNotification({
      title: 'Local', message: 'local msg', type: 'INFO', category: 'NOTIF_MESSAGE'
    });

    service.loadUnreadNotifications().subscribe(() => {
      const notifs = service.getNotifications();
      expect(notifs.length).toBe(1);
      expect(notifs[0].id).toBe('5');
      expect(notifs[0].isRead).toBeFalse();
      let unread = -1;
      service.unreadCount$.subscribe(c => unread = c);
      expect(unread).toBe(1);
    });
    httpMock.expectOne(`${apiBase}/unread`).flush([{ ...mockApiNotif, id: 5 }]);
  });

  it('loadUnreadNotifications() should reset the list on HTTP error', () => {
    service.addLocalNotification({
      title: 'Local', message: 'local msg', type: 'INFO', category: 'NOTIF_MESSAGE'
    });

    service.loadUnreadNotifications().subscribe(notifs => {
      expect(notifs).toEqual([]);
      expect(service.getNotifications()).toEqual([]);
    });
    httpMock.expectOne(`${apiBase}/unread`).flush('error', { status: 500, statusText: 'Error' });
  });

  // ─── persistance des notifications locales ───────────────────
  it('loadNotifications() should keep __local__ notifications on reload', () => {
    service.addLocalNotification({
      title: 'Locale', message: 'créée localement', type: 'INFO', category: 'NOTIF_MESSAGE'
    });

    service.loadNotifications().subscribe(() => {
      const notifs = service.getNotifications();
      expect(notifs.length).toBe(2);
      expect(notifs[0].id.startsWith('__local__')).toBeTrue();
      expect(notifs[1].id).toBe('1');
    });
    httpMock.expectOne(apiBase).flush([mockApiNotif]);
  });

  // ─── markLeaveNotificationHandled() ───────────────────────────
  it('markLeaveNotificationHandled() should apply ACCEPT override to the target notification', () => {
    service.loadNotifications().subscribe(() => {
      service.markLeaveNotificationHandled('1', 'ACCEPT');
      const n = service.getNotifications().find(x => x.id === '1')!;
      expect(n.message).toContain('Demande de congé traitée: approuvée.');
      expect(n.isRead).toBeTrue();
      expect(n.type).toBe('INFO');
      expect(n.tone).toBe('SUCCESS');
      // les autres notifications restent intactes
      const other = service.getNotifications().find(x => x.id === '2')!;
      expect(other.isRead).toBeFalse();
    });
    httpMock.expectOne(apiBase).flush([
      { ...mockApiNotif, type: 'NOTIF_CONGE', message: '[CONGE_ID:12] Demande de congé' },
      { ...mockApiNotif, id: 2 }
    ]);
  });

  it('markLeaveNotificationHandled() should apply REJECT override as DANGER', () => {
    service.loadNotifications().subscribe(() => {
      service.markLeaveNotificationHandled('1', 'REJECT');
      const n = service.getNotifications().find(x => x.id === '1')!;
      expect(n.message).toContain('rejetée');
      expect(n.type).toBe('DANGER');
      expect(n.tone).toBe('DANGER');
    });
    httpMock.expectOne(apiBase).flush([{ ...mockApiNotif, type: 'NOTIF_CONGE' }]);
  });

  it('markLeaveNotificationHandled() should ignore unknown ids', () => {
    service.loadNotifications().subscribe(() => {
      service.markLeaveNotificationHandled('inconnu', 'ACCEPT');
      expect(service.getNotifications()[0].message).toBe('Nouveau trajet assigné');
    });
    httpMock.expectOne(apiBase).flush([mockApiNotif]);
  });

  it('override should survive a reload of notifications', () => {
    service.loadNotifications().subscribe();
    httpMock.expectOne(apiBase).flush([{ ...mockApiNotif, type: 'NOTIF_CONGE' }]);
    service.markLeaveNotificationHandled('1', 'ACCEPT');

    service.loadNotifications().subscribe(() => {
      const n = service.getNotifications().find(x => x.id === '1')!;
      expect(n.isRead).toBeTrue();
      expect(n.message).toContain('Demande de congé traitée: approuvée.');
    });
    httpMock.expectOne(apiBase).flush([{ ...mockApiNotif, type: 'NOTIF_CONGE' }]);
  });

  // ─── connectRealtime() sans EventSource ───────────────────────
  it('connectRealtime() should do nothing when EventSource is unavailable', () => {
    expect((globalThis as any).EventSource).toBeUndefined();
    expect(() => service.connectRealtime()).not.toThrow();
    expect(service.realtimeNotification$).toBeTruthy();
  });

  it('disconnectRealtime() should be safe when never connected', () => {
    expect(() => service.disconnectRealtime()).not.toThrow();
  });

  // ─── flux temps réel ──────────────────────────────────────────
  it('connectRealtime() should open the stream and handle incoming notifications', () => {
    installFakeEventSource();
    try {
      let realtimeReceived: AppNotification | undefined;
      service.realtimeNotification$.subscribe(n => realtimeReceived = n);

      service.connectRealtime();

      const source = FakeEventSource.instances[0];
      expect(source.url).toBe(`${apiBase}/stream`);
      expect(source.withCredentials).toBeTrue();

      source.emit('notification', JSON.stringify({
        id: 77,
        type: 'NOTIF_TRAJET',
        message: 'Trajet temps réel',
        dateCreation: '2026-08-24T10:00:00',
        estLu: false
      }));

      const notifs = service.getNotifications();
      expect(notifs.length).toBe(1);
      expect(notifs[0].id).toBe('77');
      expect(realtimeReceived?.id).toBe('77');
      let unread = -1;
      service.unreadCount$.subscribe(c => unread = c);
      expect(unread).toBe(1);
    } finally {
      uninstallFakeEventSource();
    }
  });

  it('realtime notification with an existing id should replace, not duplicate', () => {
    installFakeEventSource();
    try {
      service.connectRealtime();
      const payload = JSON.stringify({
        id: 1, type: 'NOTIF_MESSAGE', message: 'v1',
        dateCreation: '2026-08-24T10:00:00', estLu: false
      });
      FakeEventSource.instances[0].emit('notification', payload);
      FakeEventSource.instances[0].emit('notification', JSON.stringify({
        id: 1, type: 'NOTIF_MESSAGE', message: 'v2',
        dateCreation: '2026-08-24T10:01:00', estLu: false
      }));

      const notifs = service.getNotifications();
      expect(notifs.length).toBe(1);
      expect(notifs[0].message).toBe('v2');
    } finally {
      uninstallFakeEventSource();
    }
  });

  it('realtime notification already dismissed should be ignored', () => {
    installFakeEventSource();
    try {
      service.connectRealtime();
      service.removeNotification('33');
      FakeEventSource.instances[0].emit('notification', JSON.stringify({
        id: 33, type: 'NOTIF_MESSAGE', message: 'rejetée avant réception',
        dateCreation: '2026-08-24T10:00:00', estLu: false
      }));

      expect(service.getNotifications()).toEqual([]);
    } finally {
      uninstallFakeEventSource();
    }
  });

  it('malformed realtime payloads should be ignored silently', () => {
    installFakeEventSource();
    try {
      service.connectRealtime();
      expect(() => FakeEventSource.instances[0].emit('notification', '{pas du json')).not.toThrow();
      expect(service.getNotifications()).toEqual([]);
    } finally {
      uninstallFakeEventSource();
    }
  });

  it('realtime mapping should honor pending leave overrides by id', () => {
    installFakeEventSource();
    try {
      service.loadNotifications().subscribe();
      httpMock.expectOne(apiBase).flush([{
        ...mockApiNotif, type: 'NOTIF_CONGE', message: '[CONGE_ID:3] demande'
      }]);
      service.markLeaveNotificationHandled('1', 'REJECT');

      service.connectRealtime();
      FakeEventSource.instances[0].emit('notification', JSON.stringify({
        id: 1, type: 'NOTIF_CONGE', message: 'demande',
        dateCreation: '2026-08-24T10:00:00', estLu: false
      }));

      const n = service.getNotifications().find(x => x.id === '1')!;
      expect(n.tone).toBe('DANGER');
    } finally {
      uninstallFakeEventSource();
    }
  });

  it('onerror should close the stream and schedule a reconnect in 5s', () => {
    installFakeEventSource();
    const origSetTimeout = window.setTimeout;
    const origClearTimeout = window.clearTimeout;
    const captured: Array<() => void> = [];
    window.setTimeout = ((fn: any) => { captured.push(fn); return 123 as any; }) as any;
    const clearedIds: any[] = [];
    window.clearTimeout = ((id: any) => { clearedIds.push(id); }) as any;

    try {
      service.connectRealtime();
      expect(FakeEventSource.instances.length).toBe(1);

      FakeEventSource.instances[0].onerror!();

      expect(FakeEventSource.instances[0].closed).toBeTrue();
      expect(captured.length).toBe(1);

      // déclenchement manuel du timer de reconnexion
      captured[0]();
      expect(FakeEventSource.instances.length).toBe(2);
    } finally {
      window.setTimeout = origSetTimeout;
      window.clearTimeout = origClearTimeout;
      uninstallFakeEventSource();
    }
  });

  it('disconnectRealtime() should close the source and cancel a pending reconnect', () => {
    installFakeEventSource();
    const origSetTimeout = window.setTimeout;
    const origClearTimeout = window.clearTimeout;
    window.setTimeout = (() => 123) as any;
    const clearedIds: any[] = [];
    window.clearTimeout = ((id: any) => { clearedIds.push(id); }) as any;

    try {
      service.connectRealtime();
      FakeEventSource.instances[0].onerror!();   // planifie une reconnexion
      service.disconnectRealtime();               // annule le timer + ferme

      expect(clearedIds).toContain(123);
      expect(FakeEventSource.instances.every(s => s.closed)).toBeTrue();

      // double disconnect : aucun effet de bord
      expect(() => service.disconnectRealtime()).not.toThrow();
    } finally {
      window.setTimeout = origSetTimeout;
      window.clearTimeout = origClearTimeout;
      uninstallFakeEventSource();
    }
  });

  // ─── libellés et mapping des types ────────────────────────────
  it('loadNotifications() should map category labels for every category', () => {
    service.loadNotifications().subscribe(() => {
      const titles = service.getNotifications().map(n => n.title);
      expect(titles).toEqual([
        'Compte', 'Trajet', 'Congé', 'Réclamation', 'Message',
        'Entreprise', 'Véhicule', 'Détection', 'Météo',
        'Infrastructure', 'Accident', 'Secteur', 'Notification'
      ]);
    });
    const mk = (type: string, id: number) => ({
      id, type, message: `msg ${id}`, dateCreation: '2026-08-24T10:00:00', estLu: false
    });
    httpMock.expectOne(apiBase).flush([
      mk('NOTIF_COMPTE', 1), mk('NOTIF_TRAJET', 2), mk('NOTIF_CONGE', 3),
      mk('NOTIF_RECLAMATION', 4), mk('NOTIF_MESSAGE', 5), mk('NOTIF_ENTREPRISE', 6),
      mk('NOTIF_VEHICULE', 7), mk('NOTIF_DETECTION', 8), mk('NOTIF_WEATHER', 9),
      mk('NOTIF_INFRA', 10), mk('NOTIF_ACCIDENT', 11), mk('SECTEUR', 12),
      mk('TYPE_INCONNU', 13)
    ]);
  });

  it('loadNotifications() should derive UI types from category + tone exhaustively', () => {
    service.loadNotifications().subscribe(() => {
      const types = service.getNotifications().map(n => n.type);
      expect(types).toEqual([
        // NOTIF_COMPTE
        'DANGER', 'WARNING', 'INFO',
        // NOTIF_TRAJET
        'INFO',
        // NOTIF_CONGE
        'DANGER', 'INFO', 'ACTION', 'WARNING', 'ACTION', 'INFO',
        // NOTIF_RECLAMATION / MESSAGE
        'WARNING', 'INFO',
        // NOTIF_ENTREPRISE
        'DANGER', 'WARNING', 'INFO',
        // NOTIF_VEHICULE
        'DANGER', 'WARNING', 'INFO',
        // NOTIF_DETECTION
        'DANGER', 'WARNING', 'INFO',
        // NOTIF_WEATHER
        'DANGER', 'WARNING', 'INFO',
        // NOTIF_INFRA
        'DANGER', 'WARNING', 'INFO',
        // NOTIF_ACCIDENT / SECTEUR / default
        'DANGER', 'INFO', 'INFO'
      ]);
    });

    const mk = (type: string, tone: string | undefined, message: string, id: number) =>
      ({ id, type, tone, message, dateCreation: '2026-08-24T10:00:00', estLu: false });
    const nouvelleDemande = 'Nouvelle demande de congé de Ali';
    httpMock.expectOne(apiBase).flush([
      mk('NOTIF_COMPTE', 'DANGER', 'a', 101),
      mk('NOTIF_COMPTE', 'WARNING', 'b', 102),
      mk('NOTIF_COMPTE', undefined, 'c', 103),
      mk('NOTIF_TRAJET', 'SUCCESS', 'd', 104),
      mk('NOTIF_CONGE', 'DANGER', 'e', 105),
      mk('NOTIF_CONGE', 'SUCCESS', 'f', 106),
      mk('NOTIF_CONGE', 'WARNING', nouvelleDemande, 107),
      mk('NOTIF_CONGE', 'WARNING', 'Congé approuvé pour Sara', 108),
      mk('NOTIF_CONGE', undefined, nouvelleDemande, 109),
      mk('NOTIF_CONGE', undefined, 'Congé approuvé pour Sara', 110),
      mk('NOTIF_RECLAMATION', 'SUCCESS', 'g', 111),
      mk('NOTIF_MESSAGE', 'DANGER', 'h', 112),
      mk('NOTIF_ENTREPRISE', 'DANGER', 'i', 113),
      mk('NOTIF_ENTREPRISE', 'WARNING', 'j', 114),
      mk('NOTIF_ENTREPRISE', undefined, 'k', 115),
      mk('NOTIF_VEHICULE', 'DANGER', 'l', 116),
      mk('NOTIF_VEHICULE', 'WARNING', 'm', 117),
      mk('NOTIF_VEHICULE', undefined, 'n', 118),
      mk('NOTIF_DETECTION', 'DANGER', 'o', 119),
      mk('NOTIF_DETECTION', 'WARNING', 'p', 120),
      mk('NOTIF_DETECTION', undefined, 'q', 121),
      mk('NOTIF_WEATHER', 'DANGER', 'r', 122),
      mk('NOTIF_WEATHER', 'WARNING', 's', 123),
      mk('NOTIF_WEATHER', undefined, 't', 124),
      mk('NOTIF_INFRA', 'DANGER', 'u', 125),
      mk('NOTIF_INFRA', 'WARNING', 'v', 126),
      mk('NOTIF_INFRA', undefined, 'w', 127),
      mk('NOTIF_ACCIDENT', 'SUCCESS', 'x', 128),
      mk('SECTEUR', 'DANGER', 'y', 129),
      mk('AUTRE', undefined, 'z', 130)
    ]);
  });

  // ─── audio : setup, décodage et lecture ───────────────────────
  class FakeAudioContext {
    destination = {};
    resume(): Promise<void> { return Promise.resolve(); }
    decodeAudioData(_data: ArrayBuffer, ok: (b: any) => void, _err?: (e: any) => void): void {
      ok({ decoded: true });
    }
    createGain(): any {
      return { gain: { value: 0 }, connect: (_d: any) => ({}) };
    }
    createBufferSource(): any {
      return {
        buffer: null,
        start: jasmine.createSpy('start'),
        connect: (_node: any) => ({ connect: (_d: any) => {} })
      };
    }
  }

  it('connectRealtime() should unlock audio, decode the sound and play it on realtime event', async () => {
    const realFetch = (globalThis as any).fetch;
    (globalThis as any).fetch = () =>
      Promise.resolve({ arrayBuffer: () => Promise.resolve(new ArrayBuffer(8)) });
    (window as any).AudioContext = FakeAudioContext;
    installFakeEventSource();
    try {
      service.connectRealtime();
      // laisse la chaîne fetch -> arrayBuffer -> decodeAudioData se terminer
      await new Promise(resolve => setTimeout(resolve, 0));
      expect((service as any).notificationBuffer).toEqual({ decoded: true });

      // déblocage audio au premier clic
      window.dispatchEvent(new Event('click'));
      await new Promise(resolve => setTimeout(resolve, 0));
      expect((service as any).audioUnlocked).toBeTrue();

      FakeEventSource.instances[0].emit('notification', JSON.stringify({
        id: 9, type: 'NOTIF_MESSAGE', message: 'son',
        dateCreation: '2026-08-24T10:00:00', estLu: false
      }));
      expect(service.getNotifications()[0].id).toBe('9');
    } finally {
      delete (window as any).AudioContext;
      (globalThis as any).fetch = realFetch;
      uninstallFakeEventSource();
    }
  });

  it('sound decoding errors should be ignored without breaking realtime flow', async () => {
    class BadDecoder extends FakeAudioContext {
      override decodeAudioData(_data: ArrayBuffer, _ok: (b: any) => void, err?: (e: any) => void): void {
        err!(new Error('bad wav'));
      }
    }
    const realFetch = (globalThis as any).fetch;
    (globalThis as any).fetch = () =>
      Promise.resolve({ arrayBuffer: () => Promise.resolve(new ArrayBuffer(8)) });
    (window as any).AudioContext = BadDecoder;
    installFakeEventSource();
    try {
      service.connectRealtime();
      await new Promise(resolve => setTimeout(resolve, 0));
      expect((service as any).notificationBuffer).toBeUndefined();

      FakeEventSource.instances[0].emit('notification', JSON.stringify({
        id: 10, type: 'NOTIF_MESSAGE', message: 'sans son',
        dateCreation: '2026-08-24T10:00:00', estLu: false
      }));
      expect(service.getNotifications()[0].message).toBe('sans son');
    } finally {
      delete (window as any).AudioContext;
      (globalThis as any).fetch = realFetch;
      uninstallFakeEventSource();
    }
  });

  it('playback failures should not prevent the notification from being added', () => {
    installFakeEventSource();
    try {
      // contexte audio qui explose à la lecture + buffer déjà chargé
      (service as any).audioContext = {
        createGain: () => { throw new Error('no audio device'); }
      };
      (service as any).notificationBuffer = { dummy: true };

      service.connectRealtime();   // ensureAudioSetup: no-op car contexte présent
      FakeEventSource.instances[0].emit('notification', JSON.stringify({
        id: 11, type: 'NOTIF_MESSAGE', message: 'lecture impossible',
        dateCreation: '2026-08-24T10:00:00', estLu: false
      }));

      expect(service.getNotifications()[0].message).toBe('lecture impossible');
    } finally {
      uninstallFakeEventSource();
    }
  });

  it('notifications without message should be mapped with an empty message', () => {
    service.loadNotifications().subscribe(() => {
      const n = service.getNotifications()[0];
      expect(n.message).toBe('');
      expect(n.leaveRequestId).toBeUndefined();
    });
    // pas de champ message → garde-fous (message || '') des helpers
    httpMock.expectOne(apiBase).flush([{
      id: 42, type: 'NOTIF_MESSAGE', dateCreation: '2026-08-24T10:00:00', estLu: true
    }]);
  });

  it('ensureAudioSetup() should fall back to webkitAudioContext when available', async () => {
    const realFetch = (globalThis as any).fetch;
    (globalThis as any).fetch = () => Promise.reject(new Error('offline'));
    (window as any).webkitAudioContext = FakeAudioContext;
    installFakeEventSource();
    try {
      service.connectRealtime();
      expect((service as any).audioContext instanceof FakeAudioContext).toBeTrue();

      window.dispatchEvent(new Event('click'));   // unlock via le listener one-shot
      await new Promise(resolve => setTimeout(resolve, 0));
      expect((service as any).audioUnlocked).toBeTrue();
    } finally {
      delete (window as any).webkitAudioContext;
      (globalThis as any).fetch = realFetch;
      uninstallFakeEventSource();
    }
  });
});
