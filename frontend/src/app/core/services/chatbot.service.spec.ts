import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ChatbotService } from './chatbot.service';

describe('ChatbotService', () => {
  let service: ChatbotService;
  let httpMock: HttpTestingController;
  const apiUrl = 'http://localhost:8080/api/chat/message';

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        ChatbotService
      ]
    });
    service = TestBed.inject(ChatbotService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  // ─── sendMessage() ────────────────────────────────────────────
  it('sendMessage() should POST /api/chat/message with question payload', () => {
    service.sendMessage('Combien de véhicules disponibles ?').subscribe(res => {
      expect(res.reponse).toBe('Il y a 12 véhicules disponibles.');
    });

    const req = httpMock.expectOne(apiUrl);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({ question: 'Combien de véhicules disponibles ?' });
    req.flush({ reponse: 'Il y a 12 véhicules disponibles.' });
  });

  it('sendMessage() should return the fallback message on HTTP error', () => {
    service.sendMessage('Bonjour').subscribe(res => {
      expect(res.reponse)
        .toBe('Désolé, une erreur est survenue. Vérifiez que les services sont démarrés.');
    });

    httpMock.expectOne(apiUrl).flush('error', { status: 500, statusText: 'Error' });
  });

  it('sendMessage() should return the fallback message on network failure too', () => {
    service.sendMessage('Test').subscribe(res => {
      expect(res.reponse).toContain('Désolé');
    });

    httpMock.expectOne(apiUrl).error(new ProgressEvent('network error'));
  });
});
