import { ComponentFixture, TestBed } from '@angular/core/testing';
import { VerifyEmailComponent } from './verify-email.component';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { ActivatedRoute, provideRouter } from '@angular/router';
import { of } from 'rxjs';

describe('VerifyEmailComponent', () => {
  let component: VerifyEmailComponent;
  let fixture: ComponentFixture<VerifyEmailComponent>;
  let httpMock: HttpTestingController;
  // Token contrôlé par les tests : lu via route.snapshot.queryParamMap.get('token')
  let currentToken: string | null;

  const routeMock = {
    snapshot: {
      paramMap: { get: () => null },
      queryParamMap: { get: (key: string) => (key === 'token' ? currentToken : null) },
      params: {},
      queryParams: {},
      data: {}
    },
    queryParams: of({}),
    params: of({})
  };

  beforeEach(async () => {
    currentToken = null;
    await TestBed.configureTestingModule({
      imports: [VerifyEmailComponent],
      providers: [
        provideRouter([]),
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: ActivatedRoute, useValue: routeMock }
      ]
    }).compileComponents();

    httpMock = TestBed.inject(HttpTestingController);
    fixture = TestBed.createComponent(VerifyEmailComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  afterEach(() => httpMock.verify());

  it('should create', () => {
    // ngOnInit a déjà tourné sans token dans le beforeEach -> message invalide
    expect(component).toBeTruthy();
    expect(component.message).toBe('Lien invalide.');
  });

  // ─── ngOnInit : token absent ──────────────────────────────────
  it('should show "Lien invalide." when no token is provided and skip HTTP', () => {
    expect(component.message).toBe('Lien invalide.');
    httpMock.expectNone(() => true);
  });

  // ─── ngOnInit : token présent, succès ─────────────────────────
  it('should GET /api/auth/verify-email with encoded token and display server message', () => {
    currentToken = 'abc123';
    component.ngOnInit();

    const req = httpMock.expectOne(
      'http://localhost:8080/api/auth/verify-email?token=abc123'
    );
    expect(req.request.method).toBe('GET');
    req.flush({ message: 'Email confirme avec succes.' });

    expect(component.message).toBe('Email confirme avec succes.');
  });

  it('should encode special characters of the token in the URL', () => {
    currentToken = 'a b&c=d';
    component.ngOnInit();

    const req = httpMock.expectOne(
      'http://localhost:8080/api/auth/verify-email?token=a%20b%26c%3Dd'
    );
    req.flush({ message: 'OK' });

    expect(component.message).toBe('OK');
  });

  it('should fall back to "Email verifie." when server message is empty', () => {
    currentToken = 'tok';
    component.ngOnInit();

    const req = httpMock.expectOne(
      'http://localhost:8080/api/auth/verify-email?token=tok'
    );
    req.flush({ message: '' });

    expect(component.message).toBe('Email verifie.');
  });

  // ─── ngOnInit : échec HTTP ────────────────────────────────────
  it('should show "Verification impossible." on HTTP error', () => {
    currentToken = 'tok';
    component.ngOnInit();

    const req = httpMock.expectOne(
      'http://localhost:8080/api/auth/verify-email?token=tok'
    );
    req.flush(null, { status: 500, statusText: 'Server Error' });

    expect(component.message).toBe('Verification impossible.');
  });
});
