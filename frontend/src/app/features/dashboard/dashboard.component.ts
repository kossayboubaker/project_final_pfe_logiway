import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';

import { AuthService } from '../../core/auth.service';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css']
})
export class DashboardComponent implements OnInit {
  private readonly apiUrl = 'http://localhost:8080/api/secteurs';
  isManager = false;
  managerSectorCount = 0;

  constructor(private authService: AuthService, private http: HttpClient) { }

  ngOnInit(): void {
    const user = this.authService.getUser();
    this.isManager = user?.role === 'MANAGER';

    if (this.isManager) {
      this.loadManagerSectorCount();
    }
  }

  private loadManagerSectorCount(): void {
    this.http.get<any[]>(this.apiUrl, { withCredentials: true }).subscribe({
      next: sectors => {
        this.managerSectorCount = sectors?.length ?? 0;
      },
      error: () => {
        this.managerSectorCount = 0;
      }
    });
  }
}
