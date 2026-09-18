import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, catchError, of } from 'rxjs';
import { AppConfigService } from './app-config.service';

export interface ChatbotResponse {
  reponse: string;
}

@Injectable({ providedIn: 'root' })
export class ChatbotService {
  constructor(private http: HttpClient, private appConfig: AppConfigService) {}

  sendMessage(question: string): Observable<ChatbotResponse> {
    return this.http.post<ChatbotResponse>(`${this.appConfig.apiUrl}/chat/message`, { question }).pipe(
      catchError(() => of({ reponse: 'Désolé, une erreur est survenue. Vérifiez que les services sont démarrés.' }))
    );
  }
}
