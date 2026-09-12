import { Component, OnInit, OnDestroy } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { AuthService } from './core/auth.service';
import { SessionHeartbeatService } from './core/services/session-heartbeat.service';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit, OnDestroy {
  title = 'logiway-frontend';
  private destroy$ = new Subject<void>();

  constructor(
    private authService: AuthService,
    private sessionHeartbeatService: SessionHeartbeatService
  ) {}

  ngOnInit(): void {
    // Subscribe to user state and manage session heartbeat
    this.authService.currentUser
      .pipe(takeUntil(this.destroy$))
      .subscribe((user) => {
        if (user && user.id) {
          // User is authenticated, start heartbeat
          this.sessionHeartbeatService.startHeartbeat();
        } else {
          // User is not authenticated, stop heartbeat
          this.sessionHeartbeatService.stopHeartbeat();
        }
      });

    // Restore session on app load
    this.authService.ensureSession().subscribe();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    this.sessionHeartbeatService.stopHeartbeat();
  }
}

