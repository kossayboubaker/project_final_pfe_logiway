import { Component, OnInit, ViewChild, ElementRef, AfterViewChecked } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { FormsModule } from '@angular/forms';
import { ChatbotService, ChatbotResponse } from '../../services/chatbot.service';

interface Message {
  text: string;
  bot: boolean;
}

@Component({
  selector: 'app-chatbot',
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatIconModule,
    MatCardModule,
    MatProgressSpinnerModule,
    FormsModule
  ],
  templateUrl: './chatbot.component.html',
  styleUrls: ['./chatbot.component.css']
})
export class ChatbotComponent implements OnInit, AfterViewChecked {
  @ViewChild('messagesContainer') messagesContainer!: ElementRef;

  isOpen = false;
  input = '';
  messages: Message[] = [];
  isLoading = false;
  private shouldScroll = false;

  constructor(private chatbotService: ChatbotService) { }

  ngOnInit() {
    this.messages.push({
      text: 'Bonjour ! Je suis LogiWay Assistant, propulsé par Gemini IA.\n\nPosez-moi une question sur vos chauffeurs, véhicules, trajets, congés ou réclamations.',
      bot: true
    });
  }

  ngAfterViewChecked() {
    if (this.shouldScroll) {
      this.scrollToBottom();
      this.shouldScroll = false;
    }
  }

  toggleChat() {
    this.isOpen = !this.isOpen;
    if (this.isOpen) {
      this.shouldScroll = true;
    }
  }

  send() {
    const trimmed = this.input.trim();
    if (!trimmed || this.isLoading) return;

    this.messages.push({ text: trimmed, bot: false });
    this.input = '';
    this.isLoading = true;
    this.shouldScroll = true;

    this.chatbotService.sendMessage(trimmed).subscribe({
      next: (response: ChatbotResponse) => {
        this.messages.push({ text: response.reponse, bot: true });
        this.isLoading = false;
        this.shouldScroll = true;
      },
      error: () => {
        this.messages.push({
          text: 'Je suis désolé, une erreur est survenue. Vérifiez que le backend est démarré.',
          bot: true
        });
        this.isLoading = false;
        this.shouldScroll = true;
      }
    });
  }

  private scrollToBottom() {
    try {
      if (this.messagesContainer) {
        this.messagesContainer.nativeElement.scrollTop =
          this.messagesContainer.nativeElement.scrollHeight;
      }
    } catch { }
  }

  trackByFn(index: number) { return index; }
}
