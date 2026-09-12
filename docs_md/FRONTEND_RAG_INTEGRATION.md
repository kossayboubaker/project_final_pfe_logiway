# 🎨 Intégration Frontend Angular - Service RAG Chatbot

Guide pour intégrer le service RAG (port 5003) dans le frontend Angular.

---

## 📋 Table des Matières

1. [Service TypeScript](#1-service-typescript)
2. [Composant Chat](#2-composant-chat)
3. [Routing](#3-routing)
4. [UI/UX Recommandations](#4-uiux-recommandations)

---

## 1. Service TypeScript

### Créer le Service

**Fichier**: `frontend/src/app/core/services/rag-chatbot.service.ts`

```typescript
import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';

export interface RagQuestionRequest {
  question: string;
  user_id?: number;
  entreprise_id?: number;
}

export interface RagSourceDocument {
  content: string;
  table: string;
  score?: number;
}

export interface RagQuestionResponse {
  reponse: string;
  sources: RagSourceDocument[];
  temps_reponse_ms: number;
  model_used: string;
  retrieval_method: string;
}

export interface RagHealthResponse {
  status: string;
  database_connected: boolean;
  ollama_connected: boolean;
  vectorstore_ready: boolean;
  timestamp: string;
}

@Injectable({
  providedIn: 'root'
})
export class RagChatbotService {
  private apiUrl = 'http://localhost:5003/api/rag';
  private healthUrl = 'http://localhost:5003/health';

  constructor(private http: HttpClient) {}

  /**
   * Pose une question au chatbot RAG
   */
  poserQuestion(question: string, userId?: number, entrepriseId?: number): Observable<RagQuestionResponse> {
    const payload: RagQuestionRequest = {
      question,
      user_id: userId,
      entreprise_id: entrepriseId
    };

    return this.http.post<RagQuestionResponse>(`${this.apiUrl}/question`, payload)
      .pipe(
        catchError(this.handleError)
      );
  }

  /**
   * Vérifie l'état du service RAG
   */
  checkHealth(): Observable<RagHealthResponse> {
    return this.http.get<RagHealthResponse>(this.healthUrl)
      .pipe(
        catchError(this.handleError)
      );
  }

  /**
   * Récupère les statistiques du service
   */
  getStats(): Observable<any> {
    return this.http.get(`${this.apiUrl}/stats`)
      .pipe(
        catchError(this.handleError)
      );
  }

  /**
   * Vérifie si le service est disponible
   */
  isServiceAvailable(): Observable<boolean> {
    return this.checkHealth().pipe(
      map(health => health.status === 'healthy'),
      catchError(() => [false])
    );
  }

  private handleError(error: HttpErrorResponse) {
    let errorMessage = 'Une erreur est survenue';
    
    if (error.error instanceof ErrorEvent) {
      // Erreur côté client
      errorMessage = `Erreur: ${error.error.message}`;
    } else {
      // Erreur côté serveur
      errorMessage = error.error?.detail || `Erreur serveur: ${error.status}`;
    }
    
    console.error('Erreur RAG Service:', errorMessage);
    return throwError(() => new Error(errorMessage));
  }
}
```

---

## 2. Composant Chat

### Component TypeScript

**Fichier**: `frontend/src/app/features/rag-chat/rag-chat.component.ts`

```typescript
import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RagChatbotService, RagQuestionResponse, RagSourceDocument } from '../../core/services/rag-chatbot.service';
import { Subject, takeUntil } from 'rxjs';

interface ChatMessage {
  type: 'user' | 'bot';
  content: string;
  timestamp: Date;
  sources?: RagSourceDocument[];
  responseTime?: number;
}

@Component({
  selector: 'app-rag-chat',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './rag-chat.component.html',
  styleUrls: ['./rag-chat.component.css']
})
export class RagChatComponent implements OnInit, OnDestroy {
  question = '';
  messages: ChatMessage[] = [];
  loading = false;
  serviceAvailable = false;
  
  private destroy$ = new Subject<void>();

  // Questions suggérées
  suggestedQuestions = [
    'Combien de véhicules sont disponibles?',
    'Liste les chauffeurs disponibles',
    'Statistiques des trajets en cours',
    'Récapitulatif des réclamations ouvertes',
    'Rapport des congés ce mois'
  ];

  constructor(private ragService: RagChatbotService) {}

  ngOnInit() {
    this.checkServiceHealth();
    this.addWelcomeMessage();
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  checkServiceHealth() {
    this.ragService.isServiceAvailable()
      .pipe(takeUntil(this.destroy$))
      .subscribe(available => {
        this.serviceAvailable = available;
        if (!available) {
          this.addSystemMessage('⚠️ Service RAG non disponible. Vérifiez que le service est démarré (port 5003).');
        }
      });
  }

  addWelcomeMessage() {
    this.messages.push({
      type: 'bot',
      content: '👋 Bonjour! Je suis l\'assistant intelligent Logiway. Posez-moi des questions sur les véhicules, chauffeurs, trajets, réclamations, etc.',
      timestamp: new Date()
    });
  }

  addSystemMessage(content: string) {
    this.messages.push({
      type: 'bot',
      content,
      timestamp: new Date()
    });
  }

  poserQuestion() {
    if (!this.question.trim() || this.loading) return;

    const userMessage: ChatMessage = {
      type: 'user',
      content: this.question,
      timestamp: new Date()
    };
    this.messages.push(userMessage);

    const questionText = this.question;
    this.question = '';
    this.loading = true;

    this.ragService.poserQuestion(questionText)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response: RagQuestionResponse) => {
          const botMessage: ChatMessage = {
            type: 'bot',
            content: response.reponse,
            timestamp: new Date(),
            sources: response.sources,
            responseTime: response.temps_reponse_ms
          };
          this.messages.push(botMessage);
          this.loading = false;
          this.scrollToBottom();
        },
        error: (error) => {
          const errorMessage: ChatMessage = {
            type: 'bot',
            content: `❌ Erreur: ${error.message}`,
            timestamp: new Date()
          };
          this.messages.push(errorMessage);
          this.loading = false;
          this.scrollToBottom();
        }
      });
  }

  useSuggestedQuestion(question: string) {
    this.question = question;
    this.poserQuestion();
  }

  clearChat() {
    this.messages = [];
    this.addWelcomeMessage();
  }

  private scrollToBottom() {
    setTimeout(() => {
      const chatContainer = document.querySelector('.chat-messages');
      if (chatContainer) {
        chatContainer.scrollTop = chatContainer.scrollHeight;
      }
    }, 100);
  }
}
```

### Template HTML

**Fichier**: `frontend/src/app/features/rag-chat/rag-chat.component.html`

```html
<div class="rag-chat-container">
  <!-- Header -->
  <div class="chat-header">
    <div class="header-content">
      <h2>
        <i class="fas fa-robot"></i>
        Assistant Intelligent Logiway
      </h2>
      <span class="service-status" [class.available]="serviceAvailable" [class.unavailable]="!serviceAvailable">
        {{ serviceAvailable ? '✓ En ligne' : '✗ Hors ligne' }}
      </span>
    </div>
    <button class="btn-clear" (click)="clearChat()" title="Effacer la conversation">
      <i class="fas fa-trash"></i>
    </button>
  </div>

  <!-- Messages -->
  <div class="chat-messages">
    <div *ngFor="let message of messages" 
         class="message" 
         [class.user-message]="message.type === 'user'"
         [class.bot-message]="message.type === 'bot'">
      
      <div class="message-avatar">
        <i *ngIf="message.type === 'user'" class="fas fa-user"></i>
        <i *ngIf="message.type === 'bot'" class="fas fa-robot"></i>
      </div>

      <div class="message-content">
        <div class="message-text">{{ message.content }}</div>
        
        <!-- Sources -->
        <div *ngIf="message.sources && message.sources.length > 0" class="message-sources">
          <div class="sources-header">📚 Sources:</div>
          <div *ngFor="let source of message.sources" class="source-item">
            <span class="source-table">{{ source.table }}</span>
            <span *ngIf="source.score" class="source-score">Score: {{ (source.score * 100).toFixed(0) }}%</span>
          </div>
        </div>

        <!-- Metadata -->
        <div class="message-metadata">
          <span class="message-time">{{ message.timestamp | date:'HH:mm:ss' }}</span>
          <span *ngIf="message.responseTime" class="response-time">
            ⚡ {{ message.responseTime }}ms
          </span>
        </div>
      </div>
    </div>

    <!-- Loading -->
    <div *ngIf="loading" class="message bot-message loading-message">
      <div class="message-avatar">
        <i class="fas fa-robot"></i>
      </div>
      <div class="message-content">
        <div class="typing-indicator">
          <span></span>
          <span></span>
          <span></span>
        </div>
      </div>
    </div>
  </div>

  <!-- Suggested Questions -->
  <div class="suggested-questions" *ngIf="messages.length <= 1">
    <div class="suggestions-header">💡 Questions suggérées:</div>
    <div class="suggestions-list">
      <button *ngFor="let suggestion of suggestedQuestions" 
              class="suggestion-btn"
              (click)="useSuggestedQuestion(suggestion)">
        {{ suggestion }}
      </button>
    </div>
  </div>

  <!-- Input -->
  <div class="chat-input">
    <input type="text" 
           [(ngModel)]="question"
           (keyup.enter)="poserQuestion()"
           [disabled]="loading || !serviceAvailable"
           placeholder="Posez votre question..."
           class="input-field">
    <button (click)="poserQuestion()" 
            [disabled]="!question.trim() || loading || !serviceAvailable"
            class="btn-send">
      <i class="fas fa-paper-plane"></i>
    </button>
  </div>
</div>
```

### Styles CSS

**Fichier**: `frontend/src/app/features/rag-chat/rag-chat.component.css`

```css
.rag-chat-container {
  display: flex;
  flex-direction: column;
  height: calc(100vh - 100px);
  max-width: 1200px;
  margin: 0 auto;
  background: white;
  border-radius: 12px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  overflow: hidden;
}

/* Header */
.chat-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
}

.header-content {
  display: flex;
  align-items: center;
  gap: 15px;
}

.header-content h2 {
  margin: 0;
  font-size: 1.5rem;
}

.service-status {
  padding: 4px 12px;
  border-radius: 12px;
  font-size: 0.85rem;
  font-weight: 500;
}

.service-status.available {
  background: rgba(76, 175, 80, 0.3);
  color: #4caf50;
}

.service-status.unavailable {
  background: rgba(244, 67, 54, 0.3);
  color: #f44336;
}

.btn-clear {
  background: rgba(255, 255, 255, 0.2);
  border: none;
  color: white;
  padding: 8px 12px;
  border-radius: 6px;
  cursor: pointer;
  transition: background 0.3s;
}

.btn-clear:hover {
  background: rgba(255, 255, 255, 0.3);
}

/* Messages */
.chat-messages {
  flex: 1;
  overflow-y: auto;
  padding: 20px;
  background: #f5f7fa;
}

.message {
  display: flex;
  gap: 12px;
  margin-bottom: 20px;
  animation: fadeIn 0.3s ease-in;
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}

.message-avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.2rem;
  flex-shrink: 0;
}

.user-message .message-avatar {
  background: #667eea;
  color: white;
}

.bot-message .message-avatar {
  background: #e3f2fd;
  color: #1976d2;
}

.message-content {
  flex: 1;
  max-width: 70%;
}

.user-message .message-content {
  background: #667eea;
  color: white;
  border-radius: 18px 18px 4px 18px;
  padding: 12px 16px;
  margin-left: auto;
}

.bot-message .message-content {
  background: white;
  color: #333;
  border-radius: 18px 18px 18px 4px;
  padding: 12px 16px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
}

.message-text {
  line-height: 1.6;
  white-space: pre-wrap;
}

/* Sources */
.message-sources {
  margin-top: 12px;
  padding-top: 12px;
  border-top: 1px solid #e0e0e0;
}

.sources-header {
  font-weight: 600;
  font-size: 0.85rem;
  margin-bottom: 8px;
  color: #666;
}

.source-item {
  display: flex;
  justify-content: space-between;
  padding: 4px 8px;
  background: #f5f5f5;
  border-radius: 4px;
  margin-bottom: 4px;
  font-size: 0.8rem;
}

.source-table {
  color: #1976d2;
  font-weight: 500;
}

.source-score {
  color: #4caf50;
}

/* Metadata */
.message-metadata {
  display: flex;
  gap: 12px;
  margin-top: 8px;
  font-size: 0.75rem;
  opacity: 0.7;
}

.response-time {
  color: #4caf50;
}

/* Loading */
.typing-indicator {
  display: flex;
  gap: 4px;
  padding: 8px 0;
}

.typing-indicator span {
  width: 8px;
  height: 8px;
  background: #999;
  border-radius: 50%;
  animation: typing 1.4s infinite;
}

.typing-indicator span:nth-child(2) {
  animation-delay: 0.2s;
}

.typing-indicator span:nth-child(3) {
  animation-delay: 0.4s;
}

@keyframes typing {
  0%, 60%, 100% { transform: translateY(0); }
  30% { transform: translateY(-10px); }
}

/* Suggested Questions */
.suggested-questions {
  padding: 20px;
  background: white;
  border-top: 1px solid #e0e0e0;
}

.suggestions-header {
  font-weight: 600;
  margin-bottom: 12px;
  color: #666;
}

.suggestions-list {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.suggestion-btn {
  padding: 8px 16px;
  background: #f5f5f5;
  border: 1px solid #e0e0e0;
  border-radius: 20px;
  cursor: pointer;
  transition: all 0.3s;
  font-size: 0.9rem;
}

.suggestion-btn:hover {
  background: #667eea;
  color: white;
  border-color: #667eea;
}

/* Input */
.chat-input {
  display: flex;
  gap: 12px;
  padding: 20px;
  background: white;
  border-top: 1px solid #e0e0e0;
}

.input-field {
  flex: 1;
  padding: 12px 16px;
  border: 2px solid #e0e0e0;
  border-radius: 24px;
  font-size: 1rem;
  outline: none;
  transition: border-color 0.3s;
}

.input-field:focus {
  border-color: #667eea;
}

.input-field:disabled {
  background: #f5f5f5;
  cursor: not-allowed;
}

.btn-send {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  border: none;
  background: #667eea;
  color: white;
  cursor: pointer;
  transition: all 0.3s;
  display: flex;
  align-items: center;
  justify-content: center;
}

.btn-send:hover:not(:disabled) {
  background: #5568d3;
  transform: scale(1.05);
}

.btn-send:disabled {
  background: #ccc;
  cursor: not-allowed;
}

/* Scrollbar */
.chat-messages::-webkit-scrollbar {
  width: 8px;
}

.chat-messages::-webkit-scrollbar-track {
  background: #f1f1f1;
}

.chat-messages::-webkit-scrollbar-thumb {
  background: #888;
  border-radius: 4px;
}

.chat-messages::-webkit-scrollbar-thumb:hover {
  background: #555;
}
```

---

## 3. Routing

Ajouter la route dans `app.routes.ts`:

```typescript
import { RagChatComponent } from './features/rag-chat/rag-chat.component';

export const routes: Routes = [
  // ... autres routes
  {
    path: 'rag-chat',
    component: RagChatComponent,
    canActivate: [AuthGuard]  // Optionnel
  }
];
```

---

## 4. UI/UX Recommandations

### Placement dans le Menu

Ajouter dans `sidebar.component.html`:

```html
<a routerLink="/rag-chat" routerLinkActive="active" class="menu-item">
  <i class="fas fa-robot"></i>
  <span>Assistant IA</span>
</a>
```

### Badge d'État (Optionnel)

```typescript
// Dans un service global
export class AppStatusService {
  ragServiceStatus$ = new BehaviorSubject<boolean>(false);

  constructor(private ragService: RagChatbotService) {
    this.checkRagService();
  }

  checkRagService() {
    this.ragService.isServiceAvailable().subscribe(
      available => this.ragServiceStatus$.next(available)
    );
  }
}
```

---

## 📱 Responsive Design

Le composant est déjà responsive, mais pour mobile:

```css
@media (max-width: 768px) {
  .rag-chat-container {
    height: 100vh;
    border-radius: 0;
  }

  .message-content {
    max-width: 85%;
  }

  .suggestions-list {
    flex-direction: column;
  }

  .suggestion-btn {
    width: 100%;
  }
}
```

---

## 🧪 Test du Composant

```bash
# Démarrer le service RAG
cd rag-service
start.bat

# Dans un autre terminal, démarrer Angular
cd frontend
ng serve

# Ouvrir http://localhost:4200/rag-chat
```

---

## ✅ Checklist Intégration

- [ ] Service TypeScript créé (`rag-chatbot.service.ts`)
- [ ] Composant Chat créé (`rag-chat.component.ts/html/css`)
- [ ] Route ajoutée dans `app.routes.ts`
- [ ] Menu mis à jour (sidebar)
- [ ] Service RAG démarré (port 5003)
- [ ] Test de bout en bout effectué

---

**Status**: ✅ Guide d'intégration complet  
**Temps d'implémentation estimé**: 30-45 minutes
