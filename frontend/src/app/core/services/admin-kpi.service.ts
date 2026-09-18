import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AppConfigService } from './app-config.service';

@Injectable({ providedIn: 'root' })
export class AdminKpiService {
  constructor(private http: HttpClient, private appConfig: AppConfigService) {}

  getOverview(params: any = {}): Observable<any> {
    return this.http.get(`${this.appConfig.apiUrl}/admin/kpi/overview`, { params });
  }
}
