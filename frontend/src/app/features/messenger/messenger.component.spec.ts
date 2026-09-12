import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MessengerComponent } from './messenger.component';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { of, Subject, throwError } from 'rxjs';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MessengerService } from '../../core/services/messenger.service';
import { ConfirmDeleteDialogComponent } from '../../shared/components/confirm-delete-dialog/confirm-delete-dialog.component';

describe('MessengerComponent', () => {
    let component: MessengerComponent;
    let fixture: ComponentFixture<MessengerComponent>;
    let messengerServiceMock: any;
    let snackBarMock: any;
    let dialogMock: any;
    let usersSubject: Subject<any[]>;
    let conversationsSubject: Subject<any[]>;
    let unreadSubject: Subject<number>;
    let realtimeSubject: Subject<any>;

    const currentUserEmail = 'ali@logiway.com';

    class FakeRecorderNoAuto {
        mimeType = 'audio/webm';
        state = 'inactive';
        ondataavailable: (e: any) => void = () => {};
        onstop: () => void = () => {};
        start(): void { this.state = 'recording'; }
        stop(): void { this.state = 'inactive'; if (this.onstop) this.onstop(); }
    }

    function mkUser(over: any = {}): any {
        return Object.assign({
            id: 1,
            prenom: 'Marc',
            nom: 'Duval',
            email: 'marc@logiway.com',
            image: null,
            role: 'MANAGER',
            connecte: true,
            derniereActivite: null,
            dernierMessage: null,
            dateDernierMessage: null,
            messagesNonLus: 0
        }, over);
    }

    function mkConversation(over: any = {}): any {
        return Object.assign({
            destinataireId: 1,
            prenom: 'Marc',
            nom: 'Duval',
            email: 'marc@logiway.com',
            image: null,
            role: 'MANAGER',
            connecte: true,
            derniereActivite: null,
            dernierType: 'TEXTE',
            dernierMessage: 'Bonjour',
            dateDernierMessage: '2026-01-01T10:00:00',
            messagesNonLus: 2
        }, over);
    }

    function mkMessage(over: any = {}): any {
        return Object.assign({
            id: 5,
            expediteurId: 1,
            expediteurPrenom: 'Marc',
            expediteurNom: 'Duval',
            expediteurEmail: 'marc@logiway.com',
            expediteurImage: null,
            expediteurRole: 'MANAGER',
            destinataireId: 9,
            destinatairePrenom: 'Ali',
            destinataireNom: 'Bina',
            destinataireEmail: currentUserEmail,
            destinataireImage: null,
            destinataireRole: 'CHAUFFEUR',
            type: 'TEXTE',
            contenu: 'Bonjour',
            cheminFichier: null,
            nomFichierOriginal: null,
            tailleFichier: null,
            dureeVocale: null,
            statut: 'NON_LU',
            dateEnvoi: '2026-01-01T10:00:00',
            dateLecture: null,
            modifie: false,
            dateModification: null,
            contenuOriginal: null,
            supprime: false,
            dateSuppression: null,
            connecte: true,
            derniereActivite: null,
            fichierUrl: null,
            heureEnvoi: '10:00'
        }, over);
    }

    async function create(): Promise<void> {
        usersSubject = new Subject<any[]>();
        conversationsSubject = new Subject<any[]>();
        unreadSubject = new Subject<number>();
        realtimeSubject = new Subject<any>();

        messengerServiceMock = {
            users$: usersSubject.asObservable(),
            conversations$: conversationsSubject.asObservable(),
            unreadCount$: unreadSubject.asObservable(),
            realtimeEvents$: realtimeSubject.asObservable(),
            loadUsers: jasmine.createSpy('loadUsers').and.returnValue(of([])),
            loadConversations: jasmine.createSpy('loadConversations').and.returnValue(of([])),
            loadMessages: jasmine.createSpy('loadMessages').and.returnValue(of({ messages: [], page: 0, size: 30, totalElements: 0, hasMore: false })),
            sendTextMessage: jasmine.createSpy('sendTextMessage').and.returnValue(of({})),
            sendFileMessage: jasmine.createSpy('sendFileMessage').and.returnValue(of({})),
            sendVocalMessage: jasmine.createSpy('sendVocalMessage').and.returnValue(of({})),
            updateMessage: jasmine.createSpy('updateMessage').and.returnValue(of({})),
            deleteMessage: jasmine.createSpy('deleteMessage').and.returnValue(of(undefined)),
            markConversationAsRead: jasmine.createSpy('markConversationAsRead').and.returnValue(of(null)),
            connectRealtime: jasmine.createSpy('connectRealtime'),
            getUsersSnapshot: jasmine.createSpy('getUsersSnapshot').and.returnValue([]),
            getConversationsSnapshot: jasmine.createSpy('getConversationsSnapshot').and.returnValue([]),
            getCurrentUserEmail: jasmine.createSpy('getCurrentUserEmail').and.returnValue(currentUserEmail),
            getFileUrl: jasmine.createSpy('getFileUrl').and.callFake((m: any) => m?.fichierUrl ? `http://localhost:8080${m.fichierUrl}` : null)
        };

        snackBarMock = { open: jasmine.createSpy('open') };
        dialogMock = { open: jasmine.createSpy('open') };

        await TestBed.configureTestingModule({
            imports: [MessengerComponent, NoopAnimationsModule, HttpClientTestingModule],
            providers: [
                { provide: MessengerService, useValue: messengerServiceMock },
                { provide: MatSnackBar, useValue: snackBarMock },
                { provide: MatDialog, useValue: dialogMock }
            ]
        })
            .overrideComponent(MessengerComponent, { remove: { imports: [MatSnackBarModule, MatDialogModule] } })
            .compileComponents();

        fixture = TestBed.createComponent(MessengerComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    }

    function emitUsers(users: any[]): void {
        currentUsersInner = users;
        messengerServiceMock.getUsersSnapshot.and.returnValue(users);
        usersSubject.next(users);
    }

    function emitConversations(conversations: any[]): void {
        messengerServiceMock.getConversationsSnapshot.and.returnValue(conversations);
        messengerServiceMock.getUsersSnapshot.and.returnValue(currentUsersInner);
        conversationsSubject.next(conversations);
    }

    let currentUsersInner: any[] = [];

    beforeEach(() => {
        currentUsersInner = [
            mkUser({ id: 1, prenom: 'Marc', nom: 'Duval', role: 'MANAGER', connecte: true }),
            mkUser({ id: 2, prenom: 'Sara', nom: 'Ali', role: 'CHAUFFEUR', connecte: false }),
            mkUser({ id: 3, prenom: 'Boss', nom: '', email: 'boss@company.com', role: 'SUPERADMIN', connecte: true })
        ];
    });

    it('should create', async () => {
        await create();
        expect(component).toBeTruthy();
    });

    describe('contacts et filtres', () => {
        it('reconstruit les contacts depuis les sujets users/conversations et trie en ligne', async () => {
            await create();
            emitUsers([
                mkUser({ id: 1, prenom: 'Marc', nom: 'Duval', role: 'MANAGER', connecte: true }),
                mkUser({ id: 2, prenom: 'Sara', nom: 'Ali', role: 'CHAUFFEUR', connecte: false }),
                mkUser({ id: 3, prenom: 'Boss', nom: '', email: 'boss@company.com', role: 'SUPERADMIN', connecte: true })
            ]);
            emitConversations([mkConversation()]);

            expect(component.contacts.length).toBe(3);
            // online first, puis par displayName
            expect(component.contacts[0].displayName).toBe('Boss');
            expect(component.contacts.find(c => c.displayName === 'Marc Duval')?.initials).toBe('MD');
            expect(component.contacts.find(c => c.displayName === 'Marc Duval')?.roleLabel).toBe('Manager');

            const offline = component.contacts.find(c => !c.isOnline);
            expect(offline?.displayName).toBe('Sara Ali');

            const conversation = component.contacts.find(c => c.id === 1);
            expect(conversation?.lastMessagePreview).toBe('Bonjour');
            expect(conversation?.unreadCount).toBe(2);
        });

        it('nom de secours sur email et initiales', async () => {
            await create();
            emitUsers([
                mkUser({ id: 4, prenom: null, nom: null, email: 'seule@mail.com', role: 'CHAUFFEUR' })
            ]);

            const c = component.contacts[0];
            expect(c.displayName).toBe('seule@mail.com');
            expect(c.initials).toBe('S');
            expect(c.roleLabel).toBe('Chauffeur');
        });

        it('roleLabel mappe les trois rôles', async () => {
            await create();
            expect(component.getRoleLabel('SUPERADMIN')).toBe('SuperAdmin');
            expect(component.getRoleLabel('MANAGER')).toBe('Manager');
            expect(component.getRoleLabel('CHAUFFEUR')).toBe('Chauffeur');
            expect(component.getRoleLabel('AUTRE')).toBe('AUTRE');
        });

        it('filteredContacts filtre par nom et par rôle', async () => {
            await create();
            emitUsers(currentUsersInner);

            component.searchTerm = 'sara';
            expect(component.filteredContacts.length).toBe(1);
            expect(component.filteredContacts[0].displayName).toBe('Sara Ali');

            component.searchTerm = 'manager';
            expect(component.filteredContacts.length).toBe(1);

            component.searchTerm = '  ';
            expect(component.filteredContacts.length).toBe(3);
        });

        it('sélectionne automatiquement le premier contact', async () => {
            await create();
            emitUsers(currentUsersInner);

            emitConversations([mkConversation()]);

            const firstId = component.contacts[0].id;
            expect(component.selectedContact?.id).toBe(firstId);
            expect(messengerServiceMock.loadMessages).toHaveBeenCalled();
            expect(messengerServiceMock.markConversationAsRead).toHaveBeenCalledWith(firstId);
        });

        it('onSearchChange reconstruit les contacts', async () => {
            await create();
            emitUsers(currentUsersInner);
            component.searchTerm = 'x';

            component.onSearchChange();
            expect(component.contacts.length).toBe(3);
        });

        it('selectContact(null) ne fait rien et selectContact charge la conversation', async () => {
            await create();
            component.selectContact(null as any);
            expect(messengerServiceMock.loadMessages).not.toHaveBeenCalled();

            emitUsers([mkUser({ id: 2 })]);
            component.selectContact(component.contacts[0]);
            expect(component.selectedContact?.id).toBe(2);
            expect((component as any).currentPage).toBe(0);
            expect(component.messages).toEqual([]);
            expect(messengerServiceMock.markConversationAsRead).toHaveBeenCalledWith(2);
        });
    });

    describe('chargement des messages', () => {
        it('décore les messages reçus et inverse pour l’affichage', async () => {
            await create();
            const mm = mkMessage({ id: 1 });
            const received = mkMessage({ id: 2, expediteurId: 9, expediteurEmail: currentUserEmail, statut: 'LU' });
            messengerServiceMock.loadMessages.and.returnValue(of({
                messages: [mm, received], page: 0, size: 30, totalElements: 2, hasMore: false
            }));

            emitUsers(currentUsersInner);
            component.selectContact(component.contacts[0]);

            expect(component.messages.length).toBe(2);
            expect(component.hasMoreMessages).toBeFalse();
            const sent = component.messages.find(m => m.id === 2);
            expect(sent?.sentByMe).toBeTrue();
            expect(sent?.deliveryState).toBe('READ');
            const other = component.messages.find(m => m.id === 1);
            expect(other?.sentByMe).toBeFalse();
            expect(other?.deliveryState).toBe('RECEIVED');
        });

        it('erreur de chargement affiche un snack bar', async () => {
            await create();
            messengerServiceMock.loadMessages.and.returnValue(throwError(() => new Error('ko')));
            const errSpy = spyOn(console, 'error');

            emitUsers(currentUsersInner);
            component.selectContact(component.contacts[0]);

            expect(snackBarMock.open).toHaveBeenCalledWith('Impossible de charger la conversation.', 'Fermer', jasmine.anything());
            errSpy.calls.reset();
        });

        it('onMessagesScroll ne charge pas sans conteneur ou charge déjà', async () => {
            await create();
            emitUsers(currentUsersInner);
            component.selectContact(component.contacts[0]);
            messengerServiceMock.loadMessages.calls.reset();

            component.onMessagesScroll();
            expect(messengerServiceMock.loadMessages).not.toHaveBeenCalled();

            component.loadingMessages = true;
            component.onMessagesScroll();
            expect(messengerServiceMock.loadMessages).not.toHaveBeenCalled();
        });

        it('onMessagesScroll charge les messages plus anciens en prépendant', async () => {
            await create();
            const old = mkMessage({ id: 30 });
            messengerServiceMock.loadMessages.and.returnValue(of({
                messages: [old], page: 1, size: 30, totalElements: 31, hasMore: true
            }));

            emitUsers(currentUsersInner);
            (component as any).currentPage = 1;

            messengerServiceMock.loadMessages.calls.reset();
            messengerServiceMock.loadMessages.and.returnValue(of({ messages: [old], page: 2, size: 30, totalElements: 31, hasMore: false }));

            (component as any).messagesAreaRef = { nativeElement: { scrollTop: 0, scrollHeight: 100, clientHeight: 50 } };
            component.hasMoreMessages = true;
            component.loadingMessages = false;
            component.loadingMore = false;
            component.selectedContact = { id: 1 } as any;

            component.onMessagesScroll();

            expect(messengerServiceMock.loadMessages).toHaveBeenCalledWith(1, 2, 30);
            expect(component.loadingMore).toBeFalse();
        });
    });

    describe('envoi et édition', () => {
        it('sendMessage ignore contact ou contenu vide', async () => {
            await create();
            component.newMessage = '  ';
            component.sendMessage();
            expect(messengerServiceMock.sendTextMessage).not.toHaveBeenCalled();

            emitUsers(currentUsersInner);
            component.selectedContact = component.contacts[0];
            component.newMessage = '   ';
            component.sendMessage();
            expect(messengerServiceMock.sendTextMessage).not.toHaveBeenCalled();
        });

        it('sendMessage envoie le texte et recharge', async () => {
            await create();
            component.selectedContact = { id: 1 } as any;
            component.newMessage = '  Hello  ';
            messengerServiceMock.loadMessages.calls.reset();

            component.sendMessage();

            expect(component.newMessage).toBe('');
            expect(messengerServiceMock.sendTextMessage).toHaveBeenCalledWith(1, 'Hello');
            expect(messengerServiceMock.loadMessages).toHaveBeenCalledWith(1, 0, 30);
        });

        it("sendMessage affiche l'erreur en cas d'échec", async () => {
            await create();
            component.selectedContact = { id: 1 } as any;
            messengerServiceMock.sendTextMessage.and.returnValue(throwError(() => new Error('x')));
            component.newMessage = 'Bonjour';

            component.sendMessage();
            expect(snackBarMock.open).toHaveBeenCalledWith('Impossible d\'envoyer le message texte.', 'Fermer', jasmine.anything());
        });

        it('beginEditMessage refuse les messages non texte/supprimés et accepte sinon', async () => {
            await create();
            const texto = mkMessage({ id: 1 });
            component.beginEditMessage(texto as any);
            expect(component.editingMessageId).toBe(1);
            expect(component.editingMessageContent).toBe('Bonjour');

            component.beginEditMessage(mkMessage({ id: 2, type: 'IMAGE' }) as any);
            expect(component.editingMessageId).toBe(1);

            component.beginEditMessage(mkMessage({ id: 3, supprime: true }) as any);
            expect(component.editingMessageId).toBe(1);
        });

        it('saveEditedMessage refuse contenu vide', async () => {
            await create();
            component.editingMessageId = 1;
            component.editingMessageContent = '   ';
            const msg = mkMessage({ id: 1 });
            component.saveEditedMessage(msg as any);
            expect(messengerServiceMock.updateMessage).not.toHaveBeenCalled();
            expect(snackBarMock.open).toHaveBeenCalled();
        });

        it('saveEditedMessage met à jour et recharge', async () => {
            await create();
            emitUsers(currentUsersInner);
            component.selectedContact = component.contacts[0];
            messengerServiceMock.loadMessages.calls.reset();

            component.editingMessageId = 1;
            component.editingMessageContent = '  Nouveau  ';
            component.saveEditedMessage(mkMessage({ id: 1 }) as any);

            expect(messengerServiceMock.updateMessage).toHaveBeenCalledWith(1, 'Nouveau');
            expect(component.editingMessageId).toBeNull();
            expect(component.editingMessageContent).toBe('');
            expect(messengerServiceMock.loadMessages).toHaveBeenCalled();
        });

        it("saveEditedMessage affiche l'erreur en cas d'échec", async () => {
            await create();
            messengerServiceMock.updateMessage.and.returnValue(throwError(() => new Error('x')));
            component.editingMessageId = 1;
            component.editingMessageContent = 'Bonjour';
            component.saveEditedMessage(mkMessage({ id: 1 }) as any);
            expect(snackBarMock.open).toHaveBeenCalledWith('Impossible de modifier le message.', 'Fermer', jasmine.anything());
        });

        it('cancelEditMessage réinitialise', async () => {
            await create();
            component.editingMessageId = 3;
            component.editingMessageContent = 'x';
            component.cancelEditMessage();
            expect(component.editingMessageId).toBeNull();
            expect(component.editingMessageContent).toBe('');
        });
    });

    describe('fichiers', () => {
        it('openFilePicker déclenche le clic du fichier', async () => {
            await create();
            const click = jasmine.createSpy('click');
            (component as any).fileInputRef = { nativeElement: { click } };
            component.openFilePicker();
            expect(click).toHaveBeenCalled();
        });

        it('onFileSelected ignore sans fichier ou contact', async () => {
            await create();
            const input = { files: null, value: '' } as any;
            component.onFileSelected({ target: input } as any);
            expect(messengerServiceMock.sendFileMessage).not.toHaveBeenCalled();
        });

        it('onFileSelected envoie une image', async () => {
            await create();
            component.selectedContact = { id: 1 } as any;
            messengerServiceMock.loadMessages.calls.reset();

            const file = new File(['ab'], 'photo.png', { type: 'image/png' });
            const input = { files: [file], value: 'x' } as any;
            component.onFileSelected({ target: input } as any);

            expect(input.value).toBe('');
            expect(messengerServiceMock.sendFileMessage).toHaveBeenCalledWith(1, file);
            expect(messengerServiceMock.loadMessages).toHaveBeenCalled();
        });

        it('onFileSelected envoie un PDF et gère son échec', async () => {
            await create();
            component.selectedContact = { id: 1 } as any;
            messengerServiceMock.sendFileMessage.and.returnValue(throwError(() => new Error('x')));

            const file = new File(['ab'], 'doc.pdf', { type: 'application/pdf' });
            component.onFileSelected({ target: { files: [file], value: '' } } as any);
            expect(snackBarMock.open).toHaveBeenCalledWith('Le document PDF n\'a pas pu etre envoye.', 'Fermer', jasmine.anything());
        });

        it("onFileSelected refuse un format non autorisé", async () => {
            await create();
            emitUsers(currentUsersInner);
            component.selectedContact = component.contacts[0];

            const file = new File(['ab'], 'code.txt', { type: 'text/plain' });
            component.onFileSelected({ target: { files: [file], value: '' } } as any);
            expect(messengerServiceMock.sendFileMessage).not.toHaveBeenCalled();
            expect(snackBarMock.open).toHaveBeenCalledWith('Format de fichier non autorise. Utilisez JPG, PNG, GIF ou PDF.', 'Fermer', jasmine.anything());
        });
    });

    describe('aperçu, download, images', () => {
        it('openImage résout une URL et ferme', async () => {
            await create();
            const msg = mkMessage({ fichierUrl: '/uploads/img.png', nomFichierOriginal: 'ma-photo.png' });
            component.openImage(msg as any);
            expect(component.previewImageUrl).toBe('http://localhost:8080/uploads/img.png');
            expect(component.previewImageLabel).toBe('ma-photo.png');

            const noUrl = mkMessage({ fichierUrl: null });
            component.previewImageUrl = 'prev';
            component.openImage(noUrl as any);
            expect(component.previewImageUrl).toBe('prev');

            component.closeImagePreview();
            expect(component.previewImageUrl).toBeNull();
            expect(component.previewImageLabel).toBe('');
        });

        it('downloadFile ouvre une nouvelle fenêtre si URL résolue', async () => {
            await create();
            const open = spyOn(window, 'open');
            component.downloadFile(mkMessage({ fichierUrl: '/f.pdf' }) as any);
            expect(open).toHaveBeenCalledWith('http://localhost:8080/f.pdf', '_blank', 'noopener,noreferrer');

            open.calls.reset();
            component.downloadFile(mkMessage({ fichierUrl: null, cheminFichier: null }) as any);
            expect(open).not.toHaveBeenCalled();
        });

        it('isImageLoaded / onImageLoaded', async () => {
            await create();
            expect(component.isImageLoaded(7)).toBeFalse();
            component.onImageLoaded(7);
            expect(component.isImageLoaded(7)).toBeTrue();
        });

        it('getAvatar priorise l’image puis les initiales', async () => {
            await create();
            expect(component.getAvatar(mkUser({ image: '/x.png', initials: 'MD' }) as any)).toBe('/x.png');
            expect(component.getAvatar(mkUser({ image: null, initials: 'MD' }) as any)).toBe('MD');
        });

        it('getMessageSizeLabel', async () => {
            await create();
            expect(component.getMessageSizeLabel(mkMessage({ tailleFichier: null }) as any)).toBe('');
            expect(component.getMessageSizeLabel(mkMessage({ tailleFichier: 500 }) as any)).toBe('500 o');
            expect(component.getMessageSizeLabel(mkMessage({ tailleFichier: 2048 }) as any)).toBe('2.0 Ko');
            expect(component.getMessageSizeLabel(mkMessage({ tailleFichier: 3 * 1024 * 1024 }) as any)).toBe('3.0 Mo');
        });
    });

    describe('étiquettes messages', () => {
        it('getMessageDateLabel priorise heureEnvoi puis formatTime', async () => {
            await create();
            expect(component.getMessageDateLabel(mkMessage({ heureEnvoi: '14:30' }) as any)).toBe('14:30');
            const m = mkMessage({ heureEnvoi: '', dateEnvoi: '2026-01-01T10:00:00' });
            expect((component as any).formatTime(m.dateEnvoi)).toBe(new Date(m.dateEnvoi).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }));
        });

        it('getMessageTooltip', async () => {
            await create();
            const delet = mkMessage({ supprime: true });
            expect(component.getMessageTooltip(delet as any)).toBe('Message supprimé');

            const mod = mkMessage({ supprime: false, modifie: true, dateModification: '2026-01-01T10:00:00' });
            expect(component.getMessageTooltip(mod as any)).toContain('Modifié le');

            const lu = mkMessage({ supprime: false, modifie: false, dateLecture: '2026-01-01T10:00:00' });
            expect(component.getMessageTooltip(lu as any)).toContain('Lu le');

            const attente = mkMessage({ supprime: false, modifie: false, dateLecture: null });
            expect(component.getMessageTooltip(attente as any)).toBe('En attente de lecture');
        });

        it('canEditMessage / canDeleteMessage', async () => {
            await create();
            expect(component.canEditMessage(mkMessage({ type: 'TEXTE' }) as any)).toBeTrue();
            expect(component.canEditMessage(mkMessage({ type: 'IMAGE' }) as any)).toBeFalse();
            expect(component.canEditMessage(mkMessage({ type: 'TEXTE', supprime: true }) as any)).toBeFalse();
            expect(component.canDeleteMessage(mkMessage({ supprime: false }) as any)).toBeTrue();
            expect(component.canDeleteMessage(mkMessage({ supprime: true }) as any)).toBeFalse();
        });

        it('getMessageViewState / getFileUrl / trackers', async () => {
            await create();
            expect(component.getMessageViewState(mkMessage({ deliveryState: 'READ' }) as any)).toBe('READ');
            expect(component.getFileUrl(mkMessage({ fichierUrl: '/f' }) as any)).toBe('http://localhost:8080/f');
            expect(component.trackByContactId(0, { id: 3 } as any)).toBe(3);
            expect(component.trackByMessageId(0, { id: 8 } as any)).toBe(8);
        });

        it('hoveredMessageId est exposé', async () => {
            await create();
            component.hoveredMessageId = 4;
            expect(component.hoveredMessageId).toBe(4);
        });
    });

    describe('suppression', () => {
        it("deleteMessage refuse si non supprimable", async () => {
            await create();
            const msg = mkMessage({ supprime: true });
            component.deleteMessage(msg as any);
            expect(dialogMock.open).not.toHaveBeenCalled();
        });

        it('deleteMessage ouvre la boîte de dialogue et supprime si confirmé', async () => {
            await create();
            const afterClosed = new Subject<boolean>();
            dialogMock.open.and.callFake((c: unknown, config: any) => {
                expect(c).toBe(ConfirmDeleteDialogComponent);
                expect(config.width).toBe('400px');
                return { afterClosed: () => afterClosed.asObservable() };
            });

            component.messages = [mkMessage({ id: 5 }) as any];
            component.deleteMessage(component.messages[0]);

            afterClosed.next(true);

            expect(messengerServiceMock.deleteMessage).toHaveBeenCalledWith(5);
            expect(component.messages[0].supprime).toBeTrue();
            expect(component.messages[0].contenu).toBe('Message supprimé');

            expect(messengerServiceMock.loadConversations).toHaveBeenCalled();
        });

        it('deleteMessage ne supprime pas si refusé', async () => {
            await create();
            const afterClosed = new Subject<boolean>();
            dialogMock.open.and.callFake(() => ({ afterClosed: () => afterClosed.asObservable() }));

            component.deleteMessage(mkMessage({ id: 6 }) as any);
            afterClosed.next(false);

            expect(messengerServiceMock.deleteMessage).not.toHaveBeenCalled();
        });

        it('deleteMessage affiche erreur si l’appel échoue', async () => {
            await create();
            const afterClosed = new Subject<boolean>();
            dialogMock.open.and.callFake(() => ({ afterClosed: () => afterClosed.asObservable() }));
            messengerServiceMock.deleteMessage.and.returnValue(throwError(() => new Error('x')));

            component.deleteMessage(mkMessage({ id: 7 }) as any);
            afterClosed.next(true);

            expect(snackBarMock.open).toHaveBeenCalledWith('Impossible de supprimer le message.', 'Fermer', jasmine.anything());
        });
    });

    describe('temps réel', () => {
        it('ignore les événements sans contact sélectionné', async () => {
            await create();
            emitUsers(currentUsersInner);
            component.selectedContact = null;
            const before = messengerServiceMock.loadMessages.calls.count();
            realtimeSubject.next({ type: 'message', payload: {} });
            expect(messengerServiceMock.loadMessages.calls.count()).toBe(before);
        });

        it('presence synchronise le contact', async () => {
            await create();
            component.selectedContact = { id: 9, displayName: 'Ali', initials: 'A', roleLabel: 'Chauffeur', isOnline: false, unreadCount: 0, lastMessagePreview: null, lastMessageDate: null } as any;
            messengerServiceMock.loadMessages.calls.reset();
            realtimeSubject.next({ type: 'presence', payload: {} });

            // presence ne recharge PAS les messages, elle resynchronise le contact
            expect(messengerServiceMock.loadMessages).not.toHaveBeenCalled();
            expect(component.selectedContact).toBeTruthy();
        });

        it('MESSAGE_SUPPRIME marque localement et recharge les conversations', async () => {
            await create();
            component.selectedContact = { id: 9 } as any;
            component.messages = [mkMessage({ id: 5 }) as any];
            messengerServiceMock.loadMessages.calls.reset();

            realtimeSubject.next({ type: 'MESSAGE_SUPPRIME', payload: { messageId: 5 } });

            expect(component.messages[0].supprime).toBeTrue();
            expect(component.messages[0].contenu).toBe('Message supprimé');
            expect(messengerServiceMock.loadConversations).toHaveBeenCalled();
            expect(messengerServiceMock.loadMessages).not.toHaveBeenCalled();
        });

        it('MESSAGE_SUPPRIME sans id recharge tout', async () => {
            await create();
            component.selectedContact = { id: 9 } as any;
            messengerServiceMock.loadMessages.calls.reset();
            realtimeSubject.next({ type: 'MESSAGE_SUPPRIME', payload: {} });
            expect(messengerServiceMock.loadMessages).toHaveBeenCalled();
        });

        it('MESSAGE_MODIFIE met à jour en place', async () => {
            await create();
            component.selectedContact = { id: 9 } as any;
            component.messages = [mkMessage({ id: 5 }) as any];
            realtimeSubject.next({ type: 'MESSAGE_MODIFIE', payload: { messageId: 5, contenu: 'Modifié' } });

            expect(component.messages[0].contenu).toBe('Modifié');
            expect(component.messages[0].modifie).toBeTrue();
        });

        it('MESSAGE_MODIFIE sans id recharge tout', async () => {
            await create();
            component.selectedContact = { id: 9 } as any;
            messengerServiceMock.loadMessages.calls.reset();
            realtimeSubject.next({ type: 'MESSAGE_MODIFIE', payload: {} });
            expect(messengerServiceMock.loadMessages).toHaveBeenCalled();
        });

        it('message concernant la conversé charge les messages', async () => {
            await create();
            component.selectedContact = { id: 1 } as any;
            messengerServiceMock.loadMessages.calls.reset();

            realtimeSubject.next({ type: 'message', payload: { expediteurId: 1, destinataireId: 9 } });
            expect(messengerServiceMock.loadMessages).toHaveBeenCalled();
        });

        it('message hors conversation ignoré', async () => {
            await create();
            component.selectedContact = { id: 1 } as any;
            messengerServiceMock.loadMessages.calls.reset();

            realtimeSubject.next({ type: 'message', payload: { expediteurId: 99, destinataireId: 98 } });
            expect(messengerServiceMock.loadMessages).not.toHaveBeenCalled();
        });

        it('status avec payload correspondant recharge', async () => {
            await create();
            component.selectedContact = { id: 1 } as any;
            messengerServiceMock.loadMessages.calls.reset();

            realtimeSubject.next({ type: 'status', payload: [mkMessage(), mkMessage({ expediteurId: 99 })] });
            expect(messengerServiceMock.loadMessages).toHaveBeenCalled();
        });

        it('status sans correspondance ne recharge pas', async () => {
            await create();
            emitUsers(currentUsersInner);
            component.selectedContact = component.contacts[0];
            messengerServiceMock.loadMessages.calls.reset();

            realtimeSubject.next({ type: 'status', payload: [mkMessage({ expediteurId: 99, destinataireId: 98 })] });
            expect(messengerServiceMock.loadMessages).not.toHaveBeenCalled();
        });
    });

    describe('enregistrement vocal', () => {
        it('refuse sans contact ou déjà en cours', async () => {
            await create();
            component.startRecording();
            expect(component.isRecording).toBeFalse();

            emitUsers(currentUsersInner);
            component.selectedContact = component.contacts[0];
            component.isRecording = true;
            component.startRecording();
            expect(component.isRecording).toBeTrue();
        });

        it('refuse quand getUserMedia/MediaRecorder indisponibles', async () => {
            await create();
            emitUsers(currentUsersInner);
            component.selectedContact = component.contacts[0];
            (navigator as any).mediaDevices = undefined;

            component.startRecording();

            expect(component.isRecording).toBeFalse();
            expect(snackBarMock.open).toHaveBeenCalledWith('L\'enregistrement vocal n\'est pas supporte par ce navigateur.', 'Fermer', jasmine.anything());
        });

        it('enregistre, puis à l’arrêt envoie le vocal', async () => {
            await create();
            emitUsers(currentUsersInner);
            component.selectedContact = component.contacts[0];

            const fakeStream = { getTracks: jasmine.createSpy('getTracks').and.returnValue([{ stop: jasmine.createSpy('stop') }]) };
            let onstop: (() => void) | null = null;
            let ondata: ((e: any) => void) | null = null;
            const FakeMediaRecorder = class {
                mimeType = 'audio/webm';
                state = 'recording';
                start() { this.state = 'recording'; }
                stop() { this.state = 'inactive'; if (onstop) onstop(); }
            };

            (navigator as any).mediaDevices = { getUserMedia: jasmine.createSpy('getUserMedia').and.returnValue(Promise.resolve(fakeStream)) };
            (window as any).MediaRecorder = FakeMediaRecorder;

            spyOn(window, 'setInterval').and.callFake(() => 999 as any);

            component.startRecording();

            // await promise
            await fixture.whenStable();
            ondata = (component as any).mediaRecorder?.ondataavailable;
            if (ondata) ondata({ data: { size: 10 } });
            onstop = (component as any).mediaRecorder?.onstop;
            onstop?.();

            expect(messengerServiceMock.sendVocalMessage).toHaveBeenCalled();
            expect(component.isRecording).toBeFalse();
        });

        it('échec d’accès micro affiche erreur', async () => {
            await create();
            emitUsers(currentUsersInner);
            component.selectedContact = component.contacts[0];
            (navigator as any).mediaDevices = { getUserMedia: jasmine.createSpy('getUserMedia').and.returnValue(Promise.reject(new Error('denied'))) };
            const Fake = class { start() {} stop() {} state = 'inactive' };
            (window as any).MediaRecorder = Fake as any;

            component.startRecording();
            await fixture.whenStable();

            expect(component.isRecording).toBeFalse();
            expect(snackBarMock.open).toHaveBeenCalledWith('Impossible d\'acceder au micro. Verifiez les autorisations du navigateur.', 'Fermer', jasmine.anything());
        });

        it('stopRecording sans session ne fait rien', async () => {
            await create();
            component.stopRecording();
            expect(component.isRecording).toBeFalse();
        });
    });

    describe('branches complémentaires', () => {
        it('mets à jour unreadCount depuis le service', async () => {
            await create();
            unreadSubject.next(5);
            expect(component.unreadCount).toBe(5);
        });

        it('réémission de conversations synchronise un contact déjà sélectionné', async () => {
            await create();
            component.selectedContact = { id: 2 } as any;
            emitConversations([mkConversation()]);
            expect(component.selectedContact).toBeTruthy();
        });

        it('saveEditedMessage ignore un message non éditable', async () => {
            await create();
            component.editingMessageId = 1;
            component.editingMessageContent = 'Nouveau';
            messengerServiceMock.updateMessage.calls.reset();
            component.saveEditedMessage(mkMessage({ id: 1, type: 'IMAGE' }) as any);
            expect(messengerServiceMock.updateMessage).not.toHaveBeenCalled();
        });

        it("sendVocalMessage affiche l'erreur en cas d'échec", async () => {
            await create();
            component.selectedContact = { id: 1 } as any;
            const stopTrack = jasmine.createSpy('stop');
            (navigator as any).mediaDevices = {
                getUserMedia: jasmine.createSpy('getUserMedia').and.returnValue(Promise.resolve({
                    getTracks: () => [{ stop: stopTrack }]
                }))
            };
            (window as any).MediaRecorder = FakeRecorderNoAuto as any;
            spyOn(window, 'setInterval').and.returnValue(1 as any);
            spyOn(window, 'clearInterval');
            messengerServiceMock.sendVocalMessage.and.returnValue(throwError(() => new Error('x')));

            component.startRecording();
            await fixture.whenStable();

            const rec = (component as any).mediaRecorder;
            rec.ondataavailable({ data: { size: 50 } });
            rec.onstop();

            expect(snackBarMock.open).toHaveBeenCalledWith('Le message vocal n\'a pas pu etre envoye.', 'Fermer', jasmine.anything());
            expect(component.isRecording).toBeFalse();
            expect(stopTrack).toHaveBeenCalled();
        });

        it("stopRecording avec sendIfActive=false libère le flux", async () => {
            await create();
            const stopTrack = jasmine.createSpy('stop');
            (component as any).recordingStream = { getTracks: () => [{ stop: stopTrack }] };
            (component as any).recordingChunks = [];
            (component as any).isRecording = true;
            component.stopRecording(false);
            expect(stopTrack).toHaveBeenCalled();
            expect(component.isRecording).toBeFalse();
        });

        it("stopRecording actif arrête le mediaRecorder", async () => {
            await create();
            const stopSpy = jasmine.createSpy('stop');
            const recorder: any = { state: 'recording', stop: stopSpy };
            (component as any).isRecording = true;
            (component as any).mediaRecorder = recorder;
            component.stopRecording(true);
            expect(stopSpy).toHaveBeenCalled();
        });

        it('onMessagesScroll ne descend pas quand scrollTop > 40', async () => {
            await create();
            (component as any).messagesAreaRef = { nativeElement: { scrollTop: 100, scrollHeight: 500 } };
            component.hasMoreMessages = true;
            component.loadingMessages = false;
            component.loadingMore = false;
            component.selectedContact = { id: 1 } as any;
            messengerServiceMock.loadMessages.calls.reset();
            component.onMessagesScroll();
            expect(messengerServiceMock.loadMessages).not.toHaveBeenCalled();
        });

        it("onMessagesScroll affiche l'erreur si le chargement échoue", async () => {
            await create();
            (component as any).messagesAreaRef = { nativeElement: { scrollTop: 0, scrollHeight: 500 } };
            component.hasMoreMessages = true;
            component.loadingMessages = false;
            component.loadingMore = false;
            component.selectedContact = { id: 1 } as any;
            const cb: any = spyOn(window, 'requestAnimationFrame').and.callFake(() => 0);
            messengerServiceMock.loadMessages.and.returnValue(throwError(() => new Error('x')));
            component.onMessagesScroll();
            expect(snackBarMock.open).toHaveBeenCalledWith('Impossible de charger les anciens messages.', 'Fermer', jasmine.anything());
            cb.calls.reset();
        });

        it('loadMessagesForContact sans id ne fait rien', async () => {
            await create();
            messengerServiceMock.loadMessages.calls.reset();
            (component as any).loadMessagesForContact(0, true);
            expect(messengerServiceMock.loadMessages).not.toHaveBeenCalled();
        });

        it('loadMessagesForContact préprend les anciens messages quand reset=false', async () => {
            await create();
            const m1 = mkMessage({ id: 1 });
            const m2 = mkMessage({ id: 2 });
            messengerServiceMock.loadMessages.and.returnValue(of({
                messages: [m1, m2], page: 1, size: 30, totalElements: 2, hasMore: false
            }));
            component.messages = [mkMessage({ id: 99 }) as any];
            (component as any).loadMessagesForContact(1, false);
            expect(component.messages.length).toBe(3);
        });

        it('ngOnDestroy libère les abonnements et arrête l\'enregistrement', async () => {
            const stopTrack = jasmine.createSpy('stop');
            await create();
            (component as any).recordingStream = { getTracks: () => [{ stop: stopTrack }] };
            (component as any).isRecording = true;
            component.ngOnDestroy();
            expect(stopTrack).toHaveBeenCalled();
        });
    });
});
