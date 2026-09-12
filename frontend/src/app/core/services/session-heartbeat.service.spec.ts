import { TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { SessionHeartbeatService } from './session-heartbeat.service';
import { AuthService } from '../auth.service';

describe('SessionHeartbeatService', () => {
  let service: SessionHeartbeatService;
  let authServiceMock: jasmine.SpyObj<AuthService>;
  let consoleLogSpy: jest.SpyInstance;
  let consoleWarnSpy: jest.SpyInstance;

  beforeAll(() => {
    consoleLogSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
    consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
  });

  afterAll(() => {
    consoleLogSpy.mockRestore();
    consoleWarnSpy.mockRestore();
  });

  beforeEach(() => {
    authServiceMock = jasmine.createSpyObj('AuthService', ['refreshToken']);
    TestBed.configureTestingModule({
      providers: [
        SessionHeartbeatService,
        { provide: AuthService, useValue: authServiceMock }
      ]
    });
    service = TestBed.inject(SessionHeartbeatService);
    jest.useFakeTimers();
  });

  afterEach(() => {
    service.stopHeartbeat();
    jest.useRealTimers();
  });

  it('should be created with inactive heartbeat', () => {
    expect(service).toBeTruthy();
    expect(service.isHeartbeatActive()).toBeFalse();
  });

  // ─── startHeartbeat() ─────────────────────────────────────────
  it('startHeartbeat() should activate the heartbeat', () => {
    service.startHeartbeat();
    expect(service.isHeartbeatActive()).toBeTrue();
  });

  it('startHeartbeat() should call refreshToken every 5 minutes', () => {
    authServiceMock.refreshToken.and.returnValue(of(true));

    service.startHeartbeat();
    expect(authServiceMock.refreshToken).not.toHaveBeenCalled();

    jest.advanceTimersByTime(5 * 60 * 1000);
    expect(authServiceMock.refreshToken).toHaveBeenCalledTimes(1);

    jest.advanceTimersByTime(5 * 60 * 1000);
    expect(authServiceMock.refreshToken).toHaveBeenCalledTimes(2);
  });

  it('startHeartbeat() should not start a second interval if already active', () => {
    authServiceMock.refreshToken.and.returnValue(of(true));

    service.startHeartbeat();
    service.startHeartbeat(); // no-op

    jest.advanceTimersByTime(5 * 60 * 1000);
    expect(authServiceMock.refreshToken).toHaveBeenCalledTimes(1);
  });

  it('startHeartbeat() should log on successful refresh', () => {
    authServiceMock.refreshToken.and.returnValue(of(true));

    service.startHeartbeat();
    jest.advanceTimersByTime(5 * 60 * 1000);

    expect(consoleLogSpy).toHaveBeenCalledWith('Session heartbeat: Token refreshed successfully');
  });

  it('startHeartbeat() should not log when refresh returns false', () => {
    authServiceMock.refreshToken.and.returnValue(of(false));

    service.startHeartbeat();
    consoleLogSpy.mockClear();   // isole des logs des tests précédents
    jest.advanceTimersByTime(5 * 60 * 1000);

    expect(consoleLogSpy).not.toHaveBeenCalled();
    expect(service.isHeartbeatActive()).toBeTrue();
  });

  // ─── erreur de refresh ────────────────────────────────────────
  it('should stop the heartbeat when refreshToken errors', () => {
    authServiceMock.refreshToken.and.returnValue(throwError(() => new Error('boom')));

    service.startHeartbeat();
    jest.advanceTimersByTime(5 * 60 * 1000);

    expect(consoleWarnSpy).toHaveBeenCalled();
    expect(service.isHeartbeatActive()).toBeFalse();
  });

  it('should not tick again after being stopped by an error', () => {
    authServiceMock.refreshToken.and.returnValue(throwError(() => new Error('boom')));

    service.startHeartbeat();
    jest.advanceTimersByTime(5 * 60 * 1000); // erreur → stop
    jest.advanceTimersByTime(10 * 60 * 1000); // plus de tick

    expect(authServiceMock.refreshToken).toHaveBeenCalledTimes(1);
  });

  // ─── stopHeartbeat() ──────────────────────────────────────────
  it('stopHeartbeat() should deactivate and stop future ticks', () => {
    authServiceMock.refreshToken.and.returnValue(of(true));

    service.startHeartbeat();
    expect(service.isHeartbeatActive()).toBeTrue();

    service.stopHeartbeat();
    expect(service.isHeartbeatActive()).toBeFalse();

    jest.advanceTimersByTime(30 * 60 * 1000);
    expect(authServiceMock.refreshToken).not.toHaveBeenCalled();
  });

  it('stopHeartbeat() should be safe when never started', () => {
    expect(() => service.stopHeartbeat()).not.toThrow();
    expect(service.isHeartbeatActive()).toBeFalse();
  });

  // ─── ngOnDestroy() ────────────────────────────────────────────
  it('ngOnDestroy() should stop the heartbeat', () => {
    service.startHeartbeat();

    service.ngOnDestroy();

    expect(service.isHeartbeatActive()).toBeFalse();
  });
});
