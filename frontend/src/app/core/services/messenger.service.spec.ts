import { of, throwError } from 'rxjs';
import { MessengerService } from './messenger.service';

class FakeEventSource {
    static instances: FakeEventSource[] = [];
    url: string;
    withCredentials: boolean;
    listeners: Record<string, Array<(event: MessageEvent) => void>> = {};
    onerror: (() => void) | null = null;
    closed = false;

    constructor(url: string, options?: { withCredentials?: boolean }) {
        this.url = url;
        this.withCredentials = Boolean(options?.withCredentials);
        FakeEventSource.instances.push(this);
    }

    addEventListener(name: string, cb: (event: MessageEvent) => void): void {
        (this.listeners[name] = this.listeners[name] || []).push(cb);
    }

    emit(name: string, data: unknown): void {
        (this.listeners[name] || []).forEach(cb => cb({ data } as MessageEvent));
    }

    close(): void {
        this.closed = true;
    }
}

describe('MessengerService', () => {
    let http: any;
    let authService: any;
    let service: MessengerService;

    const collect = <T>(observable$: { subscribe: (cb: (value: T) => void) => void }): T[] => {
        const values: T[] = [];
        observable$.subscribe(value => values.push(value));
        return values;
    };

    const collectError = (observable$: any): any => {
        let error: any;
        observable$.subscribe({ next: () => undefined, error: (err: any) => error = err });
        return error;
    };

    const rawMessage = (overrides: Record<string, unknown> = {}) => ({
        id: 10,
        expediteurId: 1,
        expediteurPrenom: 'Moi',
        expediteurNom: 'Test',
        expediteurEmail: 'me@test.com',
        expediteurImage: null,
        expediteurRole: 'MANAGER',
        destinataireId: 2,
        destinatairePrenom: 'Ali',
        destinataireNom: 'Ben',
        destinataireEmail: 'ali@test.com',
        destinataireImage: null,
        destinataireRole: 'CHAUFFEUR',
        type: 'TEXTE',
        contenu: 'salut',
        cheminFichier: null,
        nomFichierOriginal: null,
        tailleFichier: null,
        dureeVocale: null,
        statut: 'LU',
        dateEnvoi: '2026-08-01T10:00:00Z',
        dateLecture: null,
        modifie: false,
        dateModification: null,
        contenuOriginal: null,
        supprime: false,
        dateSuppression: null,
        connecte: true,
        derniereActivite: null,
        fichierUrl: null,
        heureEnvoi: '10:00',
        ...overrides
    });

    beforeEach(() => {
        http = {
            get: jasmine.createSpy('get').and.returnValue(of([])),
            post: jasmine.createSpy('post').and.returnValue(of({})),
            put: jasmine.createSpy('put').and.returnValue(of({})),
            delete: jasmine.createSpy('delete').and.returnValue(of(undefined))
        };
        authService = {
            getUser: jasmine.createSpy('getUser').and.returnValue({ email: 'Me@Test.com' })
        };
        service = new MessengerService(http, authService);
        (globalThis as any).EventSource = FakeEventSource;
        FakeEventSource.instances = [];

        spyOn(window, 'setInterval').and.callFake(((cb: () => void) => 77 as any) as any);
        spyOn(window, 'setTimeout').and.callFake(((cb: () => void) => 88 as any) as any);
        spyOn(window, 'clearInterval').and.stub();
        spyOn(window, 'clearTimeout').and.stub();
    });

    afterEach(() => {
        try {
            service.disconnectRealtime();
        } catch {
            /* pas de flux ouvert */
        }
    });

    it('should load users sorted online-first then alphabetical', () => {
        http.get.and.returnValue(of([
            { id: 3, prenom: 'Zoe', nom: 'A', email: 'z@t.com', connecte: false },
            { id: 1, prenom: 'Ali', nom: 'Ben', email: 'a@t.com', connecte: true },
            { id: 2, prenom: null, nom: null, email: 'n@t.com', connecte: false }
        ]));

        const [returned] = collect(service.loadUsers());

        expect(http.get).toHaveBeenCalledWith(
            'http://localhost:8080/api/messenger/utilisateurs',
            jasmine.objectContaining({ withCredentials: true })
        );
        expect(returned.map((u: any) => u.id)).toEqual([3, 1, 2]);
        expect(service.getUsersSnapshot().map(u => u.id)).toEqual([1, 2, 3]);
        expect(service.getUsersSnapshot().length).toBe(3);
    });

    it('should pass a trimmed search parameter when loading users', () => {
        collect(service.loadUsers('  ali '));

        const options = http.get.calls.mostRecent().args[1];
        expect(options.params.toString()).toBe('search=ali');
    });

    it('should reset users on loading failure', () => {
        http.get.and.returnValues(of([{ id: 9 }]), throwError(() => new Error('down')));

        collect(service.loadUsers());
        const afterFailure = collect(service.loadUsers())[0];

        expect(afterFailure).toEqual([]);
        expect(service.getUsersSnapshot()).toEqual([]);
    });

    it('should sort conversations by last message and compute unread total', () => {
        http.get.and.returnValue(of([
            { destinataireId: 5, dateDernierMessage: '2026-08-01T09:00:00Z', messagesNonLus: 2 },
            { destinataireId: 6, dateDernierMessage: null, messagesNonLus: 3 },
            { destinataireId: 7, dateDernierMessage: '2026-08-02T08:00:00Z', messagesNonLus: null }
        ]));

        collect(service.loadConversations());

        expect(service.getConversationsSnapshot().map(c => c.destinataireId)).toEqual([7, 5, 6]);
        expect(service.getUnreadCountSnapshot()).toBe(5);
    });

    it('should reset conversations and unread count on failure', () => {
        http.get.and.returnValues(of([{ messagesNonLus: 4 }]), throwError(() => new Error('down')));

        collect(service.loadConversations());
        const afterFailure = collect(service.loadConversations())[0];

        expect(afterFailure).toEqual([]);
        expect(service.getConversationsSnapshot()).toEqual([]);
        expect(service.getUnreadCountSnapshot()).toBe(0);
    });

    it('should load and map message pages with sender awareness', () => {
        http.get.and.returnValue(of({
            messages: [
                rawMessage(),
                rawMessage({ id: 11, expediteurEmail: 'ali@test.com', statut: 'NON_LU' })
            ],
            page: 1,
            size: 30,
            totalElements: 40,
            hasMore: true
        }));

        let page: any;
        service.loadMessages(7, 1).subscribe(response => page = response);

        const callArgs = http.get.calls.mostRecent().args;
        expect(callArgs[0]).toBe('http://localhost:8080/api/messenger/conversations/7/messages');
        expect(callArgs[1].params.get('page')).toBe('1');
        expect(callArgs[1].params.get('size')).toBe('30');

        expect(page.messages[0].sentByMe).toBeTrue();
        expect(page.messages[0].deliveryState).toBe('READ');
        expect(page.messages[1].sentByMe).toBeFalse();
        expect(page.messages[1].deliveryState).toBe('RECEIVED');
    });

    it('should return an empty page when message loading fails', () => {
        http.get.and.returnValue(throwError(() => new Error('boom')));

        let page: any;
        service.loadMessages(7, 3, 15).subscribe(response => page = response);

        expect(page).toEqual({ messages: [], page: 3, size: 15, totalElements: 0, hasMore: false });
    });

    it('should send text messages and emit an optimistic realtime event', () => {
        http.post.and.returnValue(of(rawMessage()));
        const events: any[] = [];
        service.realtimeEvents$.subscribe(event => events.push(event));
        collect(service.loadConversations());
        const conversationsCallsBefore = http.get.calls.count();

        let view: any;
        service.sendTextMessage(2, 'salut').subscribe(value => view = value);

        expect(http.post).toHaveBeenCalledWith(
            'http://localhost:8080/api/messenger/messages',
            { destinataireId: 2, contenu: 'salut' },
            { withCredentials: true }
        );
        expect(view.sentByMe).toBeTrue();
        expect(events.length).toBe(1);
        expect(events[0].type).toBe('message');
        expect(http.get.calls.count()).toBeGreaterThan(conversationsCallsBefore);
    });

    it('should wrap send failures in a friendly error', () => {
        http.post.and.returnValue(throwError(() => new Error('offline')));

        const error = collectError(service.sendTextMessage(2, 'salut'));

        expect(error.message).toBe('Impossible d envoyer le message texte');
    });

    it('should send file messages through FormData', () => {
        http.post.and.returnValue(of(rawMessage()));
        const file = new File(['data'], 'photo.png');

        collect(service.sendFileMessage(2, file));

        expect(http.post).toHaveBeenCalledWith(
            'http://localhost:8080/api/messenger/messages/fichiers',
            jasmine.any(FormData),
            { withCredentials: true }
        );
        const formData = http.post.calls.mostRecent().args[1] as FormData;
        expect(formData.get('destinataireId')).toBe('2');
        expect(formData.get('fichier')).toBe(file);
    });

    it('should append vocal duration only when provided', () => {
        http.post.and.returnValues(of(rawMessage()), of(rawMessage()));
        const file = new File(['audio'], 'vocal.webm');

        collect(service.sendVocalMessage(2, file, 12));
        let formData = http.post.calls.mostRecent().args[1] as FormData;
        expect(formData.get('dureeVocale')).toBe('12');

        collect(service.sendVocalMessage(2, file));
        formData = http.post.calls.mostRecent().args[1] as FormData;
        expect(formData.get('dureeVocale')).toBeNull();
    });

    it('should update messages via PUT with optimistic refresh', () => {
        http.put.and.returnValue(of(rawMessage({ contenu: 'edité', modifie: true })));
        const events: any[] = [];
        service.realtimeEvents$.subscribe(event => events.push(event));

        let view: any;
        service.updateMessage(10, 'edité').subscribe(value => view = value);

        expect(http.put).toHaveBeenCalledWith(
            'http://localhost:8080/api/messenger/messages/10',
            { contenu: 'edité' },
            { withCredentials: true }
        );
        expect(view.contenu).toBe('edité');
        expect(events.length).toBe(1);
    });

    it('should delete messages and refresh conversations', () => {
        collect(service.deleteMessage(10));

        expect(http.delete).toHaveBeenCalledWith(
            'http://localhost:8080/api/messenger/messages/10',
            { withCredentials: true }
        );
        expect(http.get.calls.count()).toBeGreaterThan(0);
    });

    it('should mark conversations as read, tolerating failures', () => {
        collect(service.markConversationAsRead(2));
        expect(http.put).toHaveBeenCalledWith(
            'http://localhost:8080/api/messenger/conversations/2/lu',
            {},
            { withCredentials: true }
        );

        http.put.and.returnValue(throwError(() => new Error('down')));
        expect(collect(service.markConversationAsRead(2))).toEqual([null]);
    });

    it('should handle presence heartbeat and disconnect with fallbacks', () => {
        http.post.and.returnValues(
            of({ utilisateurId: 1, connecte: true, derniereActivite: 'now' }),
            throwError(() => new Error('down')),
            of({ utilisateurId: 1, connecte: false, derniereActivite: null }),
            throwError(() => new Error('down'))
        );

        expect(collect(service.sendPresenceHeartbeat())).toEqual([
            { utilisateurId: 1, connecte: true, derniereActivite: 'now' }
        ]);
        expect(collect(service.sendPresenceHeartbeat())).toEqual([
            { utilisateurId: 0, connecte: false, derniereActivite: null }
        ]);

        expect(collect(service.disconnectPresence())).toEqual([
            { utilisateurId: 1, connecte: false, derniereActivite: null }
        ]);
        expect(collect(service.disconnectPresence())).toEqual([
            { utilisateurId: 0, connecte: false, derniereActivite: null }
        ]);
    });

    it('should resolve the current user email defensively', () => {
        expect(service.getCurrentUserEmail()).toBe('Me@Test.com');

        authService.getUser.and.returnValue(null);
        expect(service.getCurrentUserEmail()).toBe('');
    });

    it('should build file URLs from explicit or fallback paths', () => {
        expect(service.getFileUrl({ fichierUrl: '/uploads/a.png', cheminFichier: null }))
            .toBe('http://localhost:8080/uploads/a.png');
        expect(service.getFileUrl({ fichierUrl: null, cheminFichier: 'C:\\uploads\\b.png' }))
            .toBe('http://localhost:8080/api/messenger/fichiers/b.png');
        expect(service.getFileUrl({ fichierUrl: null, cheminFichier: null })).toBeNull();
        expect(service.getFileUrl({ fichierUrl: null, cheminFichier: 'dir/' })).toBeNull();
    });

    it('should connect to the realtime stream once and start the presence heartbeat', () => {
        service.connectRealtime();

        const source = FakeEventSource.instances[FakeEventSource.instances.length - 1];
        expect(source.url).toBe('http://localhost:8080/api/messenger/stream');
        expect(source.withCredentials).toBeTrue();

        expect(window.setInterval).toHaveBeenCalledWith(jasmine.any(Function), 30000);

        const presencePosts = http.post.calls.all()
            .filter((call: any) => call.args[0] === 'http://localhost:8080/api/messenger/presence');
        expect(presencePosts.length).toBe(1);

        service.connectRealtime();
        expect(FakeEventSource.instances.length).toBe(1);
    });

    it('should dispatch realtime events and refresh the right collections', () => {
        const events: any[] = [];
        service.realtimeEvents$.subscribe(event => events.push(event));

        service.connectRealtime();
        const source = FakeEventSource.instances[0];
        const conversationGetsAfterConnect = http.get.calls.count();

        source.emit('message', JSON.stringify({ id: 1 }));
        source.emit('status', JSON.stringify({}));
        source.emit('conversation', JSON.stringify({}));
        source.emit('MESSAGE_MODIFIE', JSON.stringify({}));
        source.emit('MESSAGE_SUPPRIME', JSON.stringify({}));

        expect(events.length).toBe(5);
        expect(http.get.calls.count()).toBe(conversationGetsAfterConnect + 5);

        const userGetsBefore = http.get.calls.count();
        source.emit('presence', JSON.stringify({ utilisateurId: 3 }));
        expect(http.get.calls.count()).toBe(userGetsBefore + 1);

        const countBeforeMalformed = events.length;
        source.emit('message', '{broken');
        expect(events.length).toBe(countBeforeMalformed);
    });

    it('should reconnect after stream errors and clean everything on disconnect', () => {
        service.connectRealtime();
        const source = FakeEventSource.instances[0];

        source.onerror!();

        expect(source.closed).toBeTrue();
        expect(window.setTimeout).toHaveBeenCalledWith(jasmine.any(Function), 3000);

        service.disconnectRealtime();
        expect(window.clearTimeout).toHaveBeenCalledWith(88);
        expect(window.clearInterval).toHaveBeenCalledWith(77);
    });

    it('should skip realtime connection when EventSource is unavailable', () => {
        delete (globalThis as any).EventSource;
        const presencePostsBefore = http.post.calls.count();

        service.connectRealtime();

        expect(FakeEventSource.instances.length).toBe(0);
        expect(http.post.calls.count()).toBe(presencePostsBefore);
        (globalThis as any).EventSource = FakeEventSource;
    });
});
