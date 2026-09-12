import { Injectable, OnDestroy } from '@angular/core';
import { BehaviorSubject, interval, Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { AuthService } from '../auth.service';

@Injectable({
  providedIn: 'root'
})
export class SessionHeartbeatService implements OnDestroy {
  // Refresh token every 5 minutes (300 seconds) to keep session alive
  private readonly HEARTBEAT_INTERVAL = 5 * 60 * 1000;

  private heartbeatActive$ = new BehaviorSubject<boolean>(false);
  private destroy$ = new Subject<void>();

  constructor(private authService: AuthService) { }

  startHeartbeat(): void {
    if (this.heartbeatActive$.value) {
      return;
    }

    this.heartbeatActive$.next(true);

    interval(this.HEARTBEAT_INTERVAL)
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.authService.refreshToken().subscribe({
          next: (success) => {
            if (success) {
              console.log('Session heartbeat: Token refreshed successfully');
            }
          },
          error: (error) => {
            console.warn('Session heartbeat: Token refresh failed', error);
            this.stopHeartbeat();
          }
        });
      });
  }

  stopHeartbeat(): void {
    this.heartbeatActive$.next(false);
    this.destroy$.next();
  }

  isHeartbeatActive(): boolean {
    return this.heartbeatActive$.value;
  }

  ngOnDestroy(): void {
    this.stopHeartbeat();
  }
}
