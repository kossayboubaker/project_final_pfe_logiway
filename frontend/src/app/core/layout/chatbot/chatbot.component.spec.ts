import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ChatbotComponent } from './chatbot.component';
import { provideRouter } from '@angular/router';
import { AuthService } from '../../auth.service';
import { ChatbotService } from '../../services/chatbot.service';
import { of, Subject, throwError } from 'rxjs';

describe('ChatbotComponent', () => {
  let component: ChatbotComponent;
  let fixture: ComponentFixture<ChatbotComponent>;
  let authServiceMock: jasmine.SpyObj<AuthService>;
  let chatbotServiceMock: jasmine.SpyObj<ChatbotService>;

  beforeEach(async () => {
    authServiceMock = jasmine.createSpyObj('AuthService', ['getUser']);
    authServiceMock.getUser.and.returnValue({ id: '1', role: 'MANAGER' });

    chatbotServiceMock = jasmine.createSpyObj('ChatbotService', ['sendMessage']);

    await TestBed.configureTestingModule({
      imports: [ChatbotComponent],
      providers: [
        provideRouter([]),
        { provide: AuthService, useValue: authServiceMock },
        { provide: ChatbotService, useValue: chatbotServiceMock }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(ChatbotComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create avec message de bienvenue', () => {
    expect(component).toBeTruthy();
    expect(component.messages.length).toBe(1);
    expect(component.messages[0].bot).toBeTrue();
    expect(component.messages[0].text).toContain('LogiWay Assistant');
  });

  it('toggleChat bascule l\'ouverture', () => {
    expect(component.isOpen).toBeFalse();

    component.toggleChat();
    expect(component.isOpen).toBeTrue();
    expect((component as any).shouldScroll).toBeTrue();

    component.toggleChat();
    expect(component.isOpen).toBeFalse();
  });

  it('send ignore une entrée vide ou blanche', () => {
    component.input = '   ';
    component.send();

    expect(chatbotServiceMock.sendMessage).not.toHaveBeenCalled();
    expect(component.messages.length).toBe(1);
  });

  it('send ignore pendant le chargement', () => {
    const pending = new Subject<any>();
    chatbotServiceMock.sendMessage.and.returnValue(pending.asObservable());
    component.input = 'question';
    component.send();

    expect(component.isLoading).toBeTrue();
    component.input = 'deuxième';
    component.send();

    expect(chatbotServiceMock.sendMessage).toHaveBeenCalledTimes(1);
    expect(component.messages.length).toBe(2);

    pending.next({ reponse: 'fini' });
    expect(component.isLoading).toBeFalse();
  });

  it('send ajoute la question puis la réponse du bot', () => {
    chatbotServiceMock.sendMessage.and.returnValue(of({ reponse: 'Voici la réponse' }));

    component.input = '  mes trajets  ';
    component.send();

    expect(chatbotServiceMock.sendMessage).toHaveBeenCalledWith('mes trajets');
    expect(component.input).toBe('');
    expect(component.isLoading).toBeFalse();
    expect(component.messages.map(m => m.bot)).toEqual([true, false, true]);
    expect(component.messages[2].text).toBe('Voici la réponse');
  });

  it('send affiche un message d\'erreur en cas d\'échec HTTP', () => {
    chatbotServiceMock.sendMessage.and.returnValue(throwError(() => new Error('ko')));

    component.input = 'help';
    component.send();

    expect(component.isLoading).toBeFalse();
    expect(component.messages[2].bot).toBeTrue();
    expect(component.messages[2].text).toContain('erreur est survenue');
  });

  it('trackByFn retourne l\'index', () => {
    expect(component.trackByFn(7)).toBe(7);
  });

  it('ngAfterViewChecked scrolle seulement si demandé', () => {
    let scrollCalls = 0;
    const el = {
      nativeElement: {
        set scrollTop(v: number) { scrollCalls++; },
        get scrollTop() { return 0; },
        scrollHeight: 500
      }
    };
    (component as any).messagesContainer = el;

    (component as any).shouldScroll = true;
    component.ngAfterViewChecked();
    expect(scrollCalls).toBe(1);
    expect((component as any).shouldScroll).toBeFalse();

    (component as any).shouldScroll = false;
    component.ngAfterViewChecked();
    expect(scrollCalls).toBe(1);
  });
});
