import { AfterViewInit, Component, ElementRef, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatListModule } from '@angular/material/list';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { FormsModule } from '@angular/forms';
import { Subscription } from 'rxjs';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { ConfirmDeleteDialogComponent } from '../../shared/components/confirm-delete-dialog/confirm-delete-dialog.component';
import { MessengerConversationResponse, MessengerDeliveryState, MessengerEvent, MessengerMessagePageResponse, MessengerMessageResponse, MessengerMessageStatus, MessengerMessageType, MessengerMessageView, MessengerService, MessengerUserResponse } from '../../core/services/messenger.service';

interface MessengerContactView extends MessengerUserResponse {
  displayName: string;
  initials: string;
  roleLabel: string;
  lastMessagePreview: string | null;
  lastMessageDate: string | null;
  unreadCount: number;
  isOnline: boolean;
}

interface MessengerBubbleView extends MessengerMessageView {
  isImageLoaded: boolean;
  isPending: boolean;
}

@Component({
  selector: 'app-messenger',
  standalone: true,
  imports: [CommonModule, MatCardModule, MatInputModule, MatButtonModule, MatIconModule, MatMenuModule, MatListModule, MatProgressSpinnerModule, MatSnackBarModule, FormsModule, MatDialogModule],
  templateUrl: './messenger.component.html',
  styleUrls: ['./messenger.component.css']
})
export class MessengerComponent implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild('messagesArea') messagesAreaRef?: ElementRef<HTMLDivElement>;
  @ViewChild('fileInput') fileInputRef?: ElementRef<HTMLInputElement>;

  contacts: MessengerContactView[] = [];
  selectedContact: MessengerContactView | null = null;
  messages: MessengerBubbleView[] = [];
  newMessage = '';
  searchTerm = '';
  unreadCount = 0;
  loadingMessages = false;
  loadingMore = false;
  hasMoreMessages = true;
  private currentPage = 0;
  private pageSize = 30;
  private subscriptions = new Subscription();
  private imageLoadedIds = new Set<number>();
  private pendingMessageIds = new Set<number>();
  private recordingStream?: MediaStream;
  private mediaRecorder?: MediaRecorder;
  private recordingChunks: BlobPart[] = [];
  private recordingTimer?: number;
  recordingSeconds = 0;
  isRecording = false;
  previewImageUrl: string | null = null;
  previewImageLabel = '';
  editingMessageId: number | null = null;
  editingMessageContent = '';
  hoveredMessageId: number | null = null;

  constructor(private messengerService: MessengerService, private snackBar: MatSnackBar, private dialog: MatDialog) { }

  ngOnInit(): void {
    this.subscriptions.add(this.messengerService.users$.subscribe(users => {
      this.rebuildContacts(users, this.messengerService.getConversationsSnapshot());
    }));

    this.subscriptions.add(this.messengerService.conversations$.subscribe(conversations => {
      this.rebuildContacts(this.messengerService.getUsersSnapshot(), conversations);
      if (!this.selectedContact && this.contacts.length > 0) {
        this.selectContact(this.contacts[0]);
      } else {
        this.syncSelectedContact();
      }
    }));

    this.subscriptions.add(this.messengerService.unreadCount$.subscribe(count => {
      this.unreadCount = count;
    }));

    this.subscriptions.add(this.messengerService.realtimeEvents$.subscribe(event => this.handleRealtimeEvent(event)));

    this.messengerService.loadUsers().subscribe();
    this.messengerService.loadConversations().subscribe();
    this.messengerService.connectRealtime();
  }

  ngAfterViewInit(): void {
    this.scrollToBottom(true);
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
    this.stopRecording(false);
  }

  get filteredContacts(): MessengerContactView[] {
    const normalized = this.normalize(this.searchTerm);
    if (!normalized) {
      return this.contacts;
    }

    return this.contacts.filter(contact => {
      const fullName = this.normalize(contact.displayName);
      return fullName.includes(normalized) || this.normalize(contact.roleLabel).includes(normalized);
    });
  }

  selectContact(contact: MessengerContactView): void {
    if (!contact) {
      return;
    }

    this.selectedContact = contact;
    this.currentPage = 0;
    this.hasMoreMessages = true;
    this.messages = [];
    this.loadMessagesForContact(contact.id, true);
    this.messengerService.markConversationAsRead(contact.id).subscribe();
  }

  onSearchChange(): void {
    this.rebuildContacts(this.messengerService.getUsersSnapshot(), this.messengerService.getConversationsSnapshot());
  }

  sendMessage(): void {
    const contact = this.selectedContact;
    const content = this.newMessage.trim();
    if (!contact || !content) {
      return;
    }

    this.newMessage = '';
    this.messengerService.sendTextMessage(contact.id, content).subscribe({
      next: () => this.loadMessagesForContact(contact.id, true),
      error: () => this.showError('Impossible d\'envoyer le message texte.')
    });
  }

  beginEditMessage(message: MessengerBubbleView): void {
    if (!this.canEditMessage(message)) {
      return;
    }

    this.editingMessageId = message.id;
    this.editingMessageContent = message.contenu || '';
  }

  saveEditedMessage(message: MessengerBubbleView): void {
    if (!this.canEditMessage(message)) {
      return;
    }

    const content = this.editingMessageContent.trim();
    if (!content) {
      this.showError('Le message texte ne peut pas etre vide.');
      return;
    }

    this.messengerService.updateMessage(message.id, content).subscribe({
      next: () => {
        this.editingMessageId = null;
        this.editingMessageContent = '';
        if (this.selectedContact) {
          this.loadMessagesForContact(this.selectedContact.id, true);
        }
      },
      error: () => this.showError('Impossible de modifier le message.')
    });
  }

  cancelEditMessage(): void {
    this.editingMessageId = null;
    this.editingMessageContent = '';
  }



  openFilePicker(): void {
    this.fileInputRef?.nativeElement.click();
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    input.value = '';

    if (!file || !this.selectedContact) {
      return;
    }

    if (file.type.startsWith('image/') || file.type === 'application/pdf') {
      this.messengerService.sendFileMessage(this.selectedContact.id, file).subscribe({
        next: () => this.loadMessagesForContact(this.selectedContact?.id || 0, true),
        error: () => this.showError(file.type === 'application/pdf'
          ? 'Le document PDF n\'a pas pu etre envoye.'
          : 'L\'image n\'a pas pu etre envoyee.')
      });
      return;
    }

    this.showError('Format de fichier non autorise. Utilisez JPG, PNG, GIF ou PDF.');
  }

  startRecording(): void {
    if (this.isRecording || !this.selectedContact) {
      return;
    }

    if (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === 'undefined') {
      this.showError('L\'enregistrement vocal n\'est pas supporte par ce navigateur.');
      return;
    }

    this.isRecording = true;
    this.recordingSeconds = 0;
    this.recordingChunks = [];

    navigator.mediaDevices.getUserMedia({ audio: true }).then(stream => {
      this.recordingStream = stream;
      this.mediaRecorder = new MediaRecorder(stream);
      this.mediaRecorder.ondataavailable = event => {
        if (event.data.size > 0) {
          this.recordingChunks.push(event.data);
        }
      };
      this.mediaRecorder.onstop = () => {
        const duration = this.recordingSeconds;
        const blob = new Blob(this.recordingChunks, { type: this.mediaRecorder?.mimeType || 'audio/webm' });
        const extension = blob.type.includes('mpeg') ? 'mp3' : 'webm';
        const file = new File([blob], `vocal-${Date.now()}.${extension}`, { type: blob.type || 'audio/webm' });
        this.stopRecordingStream();
        if (this.selectedContact) {
          this.messengerService.sendVocalMessage(this.selectedContact.id, file, duration).subscribe({
            next: () => this.loadMessagesForContact(this.selectedContact?.id || 0, true),
            error: () => this.showError('Le message vocal n\'a pas pu etre envoye.')
          });
        }
      };
      this.mediaRecorder.start();
      this.recordingTimer = window.setInterval(() => this.recordingSeconds += 1, 1000);
    }).catch(() => {
      this.isRecording = false;
      this.showError('Impossible d\'acceder au micro. Verifiez les autorisations du navigateur.');
    });
  }

  stopRecording(sendIfActive = true): void {
    if (!this.isRecording) {
      return;
    }

    if (sendIfActive && this.mediaRecorder && this.mediaRecorder.state !== 'inactive') {
      this.mediaRecorder.stop();
    } else {
      this.stopRecordingStream();
    }
  }

  onMessagesScroll(): void {
    const container = this.messagesAreaRef?.nativeElement;
    if (!container || this.loadingMessages || this.loadingMore || !this.hasMoreMessages || !this.selectedContact) {
      return;
    }

    if (container.scrollTop > 40) {
      return;
    }

    this.loadingMore = true;
    const previousHeight = container.scrollHeight;
    const previousTop = container.scrollTop;

    this.messengerService.loadMessages(this.selectedContact.id, this.currentPage + 1, this.pageSize).subscribe({
      next: response => {
        const olderMessages = response.messages.map(message => this.decorateMessage(message));
        this.messages = [...olderMessages, ...this.messages];
        this.currentPage = response.page;
        this.hasMoreMessages = response.hasMore;
        window.requestAnimationFrame(() => {
          const nextHeight = container.scrollHeight;
          container.scrollTop = nextHeight - previousHeight + previousTop;
        });
      },
      error: () => this.showError('Impossible de charger les anciens messages.'),
      complete: () => this.loadingMore = false
    });
  }

  openImage(message: MessengerBubbleView): void {
    const url = this.resolveFileUrl(message);
    if (!url) {
      return;
    }

    this.previewImageUrl = url;
    this.previewImageLabel = message.nomFichierOriginal || 'Image';
  }

  closeImagePreview(): void {
    this.previewImageUrl = null;
    this.previewImageLabel = '';
  }

  downloadFile(message: MessengerBubbleView): void {
    const url = this.resolveFileUrl(message);
    if (!url) {
      return;
    }

    window.open(url, '_blank', 'noopener,noreferrer');
  }

  isImageLoaded(id: number): boolean {
    return this.imageLoadedIds.has(id);
  }

  onImageLoaded(id: number): void {
    this.imageLoadedIds.add(id);
  }

  getAvatar(contact: MessengerContactView): string {
    return contact.image || contact.initials;
  }

  getRoleLabel(role: string): string {
    switch (role) {
      case 'SUPERADMIN': return 'SuperAdmin';
      case 'MANAGER': return 'Manager';
      case 'CHAUFFEUR': return 'Chauffeur';
      default: return role;
    }
  }

  getMessageViewState(message: MessengerBubbleView): MessengerDeliveryState {
    return message.deliveryState;
  }

  getMessageDateLabel(message: MessengerBubbleView): string {
    return message.heureEnvoi || this.formatTime(message.dateEnvoi);
  }

  getMessageTooltip(message: MessengerBubbleView): string {
    if (message.supprime) {
      return 'Message supprimé';
    }

    if (message.modifie && message.dateModification) {
      return `Modifié le ${this.formatExactDate(message.dateModification)}`;
    }

    return message.dateLecture ? `Lu le ${this.formatExactDate(message.dateLecture)}` : 'En attente de lecture';
  }

  canEditMessage(message: MessengerBubbleView): boolean {
    if (message.type !== 'TEXTE' || message.supprime) {
      return false;
    }

    // Allow any user to edit text messages
    return true;
  }

  canDeleteMessage(message: MessengerBubbleView): boolean {
    // Allow any user to delete messages (unless already deleted)
    return !message.supprime;
  }

  getFileUrl(message: MessengerBubbleView): string | null {
    return this.resolveFileUrl(message);
  }

  getMessageSizeLabel(message: MessengerBubbleView): string {
    if (!message.tailleFichier) {
      return '';
    }

    const size = message.tailleFichier;
    if (size < 1024) return `${size} o`;
    if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} Ko`;
    return `${(size / (1024 * 1024)).toFixed(1)} Mo`;
  }

  trackByContactId(index: number, contact: MessengerContactView): number {
    return contact.id;
  }

  trackByMessageId(index: number, message: MessengerBubbleView): number {
    return message.id;
  }

  private loadMessagesForContact(contactId: number, reset: boolean): void {
    if (!contactId) {
      return;
    }

    this.loadingMessages = true;
    const page = reset ? 0 : this.currentPage;

    this.messengerService.loadMessages(contactId, page, this.pageSize).subscribe({
      next: response => {
        const mapped = response.messages.map(message => this.decorateMessage(message));
        this.hasMoreMessages = response.hasMore;
        this.currentPage = response.page;

        if (reset) {
          this.messages = [...mapped].reverse();
          this.scrollToBottom();
        } else {
          this.messages = [...mapped.reverse(), ...this.messages];
        }

        this.messengerService.markConversationAsRead(contactId).subscribe();
        this.syncSelectedContact();
      },
      error: () => this.showError('Impossible de charger la conversation.'),
      complete: () => this.loadingMessages = false
    });
  }

  deleteMessage(message: MessengerBubbleView): void {
    if (!this.canDeleteMessage(message)) {
      return;
    }

    const dialogRef = this.dialog.open(ConfirmDeleteDialogComponent, {
      width: '400px',
      data: {
        title: 'Supprimer le message',
        message: 'Voulez-vous vraiment supprimer ce message pour tout le monde ? Cette action est irréversible.',
        itemName: 'ce message'
      },
      panelClass: 'glass-dialog'
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.messengerService.deleteMessage(message.id).subscribe({
          next: () => {
            // Optimistically mark the message as deleted locally and keep the placeholder
            const idx = this.messages.findIndex(m => m.id === message.id);
            if (idx !== -1) {
              const existing = this.messages[idx];
              this.messages[idx] = {
                ...existing,
                supprime: true,
                contenu: 'Message supprimé',
                dateSuppression: new Date().toISOString()
              };
            }
            // Refresh conversation previews / unread counters
            this.messengerService.loadConversations().subscribe();
          },
          error: () => this.showError('Impossible de supprimer le message.')
        });
      }
    });
  }

  private handleRealtimeEvent(event: MessengerEvent): void {
    if (!this.selectedContact) {
      return;
    }

    if (event.type === 'presence') {
      this.syncSelectedContact();
      return;
    }

    if (event.type === 'MESSAGE_SUPPRIME') {
      const payload = event.payload as { messageId?: number; dateSuppression?: string } | null;
      if (payload?.messageId) {
        // Mark the message as deleted locally if present and keep a visible 'Message supprimé' bubble
        const idx = this.messages.findIndex(m => m.id === payload.messageId);
        if (idx !== -1) {
          const existing = this.messages[idx];
          this.messages[idx] = {
            ...existing,
            supprime: true,
            contenu: 'Message supprimé',
            dateSuppression: payload.dateSuppression ?? existing.dateSuppression
          };
        }
        // Refresh conversations (preview / unread counters)
        this.messengerService.loadConversations().subscribe();
      } else {
        // Fallback: reload full message list
        this.loadMessagesForContact(this.selectedContact.id, true);
      }
      return;
    }

    if (event.type === 'MESSAGE_MODIFIE') {
      const payload = event.payload as { messageId?: number; contenu?: string; dateModification?: string } | null;
      if (payload?.messageId) {
        // Update message content in-place if present
        const idx = this.messages.findIndex(m => m.id === payload.messageId);
        if (idx !== -1) {
          const existing = this.messages[idx];
          const updated: MessengerBubbleView = {
            ...existing,
            contenu: payload.contenu ?? existing.contenu,
            modifie: true,
            dateModification: payload.dateModification ?? existing.dateModification
          };
          this.messages[idx] = updated;
        }
        // Refresh conversations to update previews
        this.messengerService.loadConversations().subscribe();
      } else {
        // Fallback: reload
        this.loadMessagesForContact(this.selectedContact.id, true);
      }
      return;
    }

    if (event.type === 'message') {
      const payload = event.payload as MessengerMessageResponse;
      if (payload.expediteurId === this.selectedContact.id || payload.destinataireId === this.selectedContact.id) {
        this.loadMessagesForContact(this.selectedContact.id, true);
      }
      return;
    }

    if (event.type === 'status') {
      const payload = Array.isArray(event.payload) ? event.payload as MessengerMessageResponse[] : [];
      if (payload.some(message => message.expediteurId === this.selectedContact?.id || message.destinataireId === this.selectedContact?.id)) {
        this.loadMessagesForContact(this.selectedContact.id, true);
      }
      return;
    }
  }

  private rebuildContacts(users: MessengerUserResponse[], conversations: MessengerConversationResponse[]): void {
    const conversationMap = new Map<number, MessengerConversationResponse>();
    conversations.forEach(conversation => conversationMap.set(conversation.destinataireId, conversation));

    this.contacts = users.map(user => {
      const conversation = conversationMap.get(user.id);
      const displayName = `${user.prenom || ''} ${user.nom || ''}`.trim() || user.email;
      return {
        ...user,
        displayName,
        initials: this.buildInitials(user.prenom, user.nom, user.email),
        roleLabel: this.getRoleLabel(user.role),
        lastMessagePreview: conversation?.dernierMessage || user.dernierMessage || null,
        lastMessageDate: conversation?.dateDernierMessage || user.dateDernierMessage || null,
        unreadCount: conversation?.messagesNonLus || user.messagesNonLus || 0,
        isOnline: Boolean(conversation?.connecte ?? user.connecte)
      };
    }).sort((left, right) => {
      const onlineCompare = Number(right.isOnline) - Number(left.isOnline);
      if (onlineCompare !== 0) {
        return onlineCompare;
      }

      return left.displayName.localeCompare(right.displayName, 'fr');
    });

    this.syncSelectedContact();
  }

  private syncSelectedContact(): void {
    if (!this.selectedContact) {
      return;
    }

    const refreshed = this.contacts.find(contact => contact.id === this.selectedContact?.id);
    if (refreshed) {
      this.selectedContact = refreshed;
    }
  }

  private decorateMessage(message: MessengerMessageResponse): MessengerBubbleView {
    const currentEmail = this.messengerService.getCurrentUserEmail();
    const sentByMe = message.expediteurEmail.toLowerCase() === currentEmail.toLowerCase();
    return {
      ...message,
      sentByMe,
      deliveryState: sentByMe ? (message.statut === 'LU' ? 'READ' : 'RECEIVED') : 'RECEIVED',
      isImageLoaded: this.imageLoadedIds.has(message.id),
      isPending: this.pendingMessageIds.has(message.id)
    };
  }

  private buildInitials(prenom: string | null, nom: string | null, email: string): string {
    const first = (prenom || '').trim().charAt(0);
    const last = (nom || '').trim().charAt(0);
    const initials = `${first}${last}`.trim();
    if (initials) {
      return initials.toUpperCase();
    }

    return (email || '?').trim().charAt(0).toUpperCase();
  }

  private resolveFileUrl(message: Pick<MessengerBubbleView, 'fichierUrl' | 'cheminFichier'>): string | null {
    return this.messengerService.getFileUrl(message);
  }

  private normalize(value: string): string {
    return (value || '').trim().toLowerCase();
  }

  private formatTime(dateValue: string): string {
    const date = new Date(dateValue);
    return date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
  }

  private formatExactDate(dateValue: string): string {
    const date = new Date(dateValue);
    return date.toLocaleString('fr-FR', { dateStyle: 'short', timeStyle: 'short' });
  }

  private scrollToBottom(force = false): void {
    window.setTimeout(() => {
      const container = this.messagesAreaRef?.nativeElement;
      if (!container) {
        return;
      }

      if (force || container.scrollHeight - container.scrollTop - container.clientHeight < 80) {
        container.scrollTop = container.scrollHeight;
      }
    }, 0);
  }

  private showError(message: string): void {
    this.snackBar.open(message, 'Fermer', {
      duration: 3500,
      horizontalPosition: 'end',
      verticalPosition: 'top'
    });
  }

  private stopRecordingStream(): void {
    this.mediaRecorder = undefined;
    this.recordingChunks = [];
    this.isRecording = false;
    this.recordingSeconds = 0;

    if (this.recordingTimer) {
      window.clearInterval(this.recordingTimer);
      this.recordingTimer = undefined;
    }

    this.recordingStream?.getTracks().forEach(track => track.stop());
    this.recordingStream = undefined;
  }
}
