import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, catchError, of } from 'rxjs';

export interface ChatbotResponse {
  reponse: string;
}

@Injectable({ providedIn: 'root' })
export class ChatbotService {
  private readonly apiUrl = 'http://localhost:8080/api/chat/message';

  constructor(private http: HttpClient) {}

  sendMessage(question: string): Observable<ChatbotResponse> {
    return this.http.post<ChatbotResponse>(this.apiUrl, { question }).pipe(
      catchError(() => of({ reponse: 'Désolé, une erreur est survenue. Vérifiez que les services sont démarrés.' }))
    );
  }
}
