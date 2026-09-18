import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError, map, tap } from 'rxjs/operators';
import { AppConfigService } from './app-config.service';

export type WeatherRiskLevel = 'VERT' | 'ORANGE' | 'ROUGE';

export interface WeatherInfo {
    temperatureCelsius: number | null;
    descriptionFr: string;
    iconCode: string;
    windKmH: number | null;
    humidity: number | null;
    visibilityKm: number | null;
    etatGeneral: string;
    risqueConduite: WeatherRiskLevel;
    dangereux: boolean;
    iconUrl: string;
}

interface WeatherCacheEntry {
    expiresAt: number;
    value: WeatherInfo;
}

@Injectable({
    providedIn: 'root'
})
export class WeatherService {
    private get apiUrl(): string { return `${this.appConfig.apiUrl}/meteo`; }
    private readonly cache = new Map<string, WeatherCacheEntry>();
    private readonly ttlMs = 5 * 60 * 1000;

    constructor(private http: HttpClient, private appConfig: AppConfigService) { }

    getWeather(lat: number, lon: number, cacheKey?: string): Observable<WeatherInfo> {
        const key = cacheKey ?? this.buildKey(lat, lon);
        const cached = this.cache.get(key);
        if (cached && cached.expiresAt > Date.now()) {
            return of(cached.value);
        }

        return this.http.get<any>(this.apiUrl, { params: { lat, lon } as any }).pipe(
            map(response => this.mapWeather(response)),
            tap(value => this.cache.set(key, { expiresAt: Date.now() + this.ttlMs, value })),
            catchError(() => of(this.fallbackWeather()))
        );
    }

    clearExpiredCache() {
        const now = Date.now();
        for (const [key, entry] of this.cache.entries()) {
            if (entry.expiresAt <= now) {
                this.cache.delete(key);
            }
        }
    }

    private mapWeather(response: any): WeatherInfo {
        const iconCode = response?.iconCode || '01d';
        return {
            temperatureCelsius: response?.temperatureCelsius ?? null,
            descriptionFr: response?.descriptionFr ?? 'Météo indisponible',
            iconCode,
            windKmH: response?.windKmH ?? null,
            humidity: response?.humidity ?? null,
            visibilityKm: response?.visibilityKm ?? null,
            etatGeneral: response?.etatGeneral ?? 'NUAGEUX',
            risqueConduite: (response?.risqueConduite ?? 'ORANGE') as WeatherRiskLevel,
            dangereux: !!response?.dangereux,
            iconUrl: `https://openweathermap.org/img/wn/${iconCode}@2x.png`
        };
    }

    private fallbackWeather(): WeatherInfo {
        return {
            temperatureCelsius: null,
            descriptionFr: 'Météo indisponible',
            iconCode: '01d',
            windKmH: null,
            humidity: null,
            visibilityKm: null,
            etatGeneral: 'NUAGEUX',
            risqueConduite: 'ORANGE',
            dangereux: false,
            iconUrl: 'https://openweathermap.org/img/wn/01d@2x.png'
        };
    }

    private buildKey(lat: number, lon: number): string {
        return `${lat.toFixed(2)}:${lon.toFixed(2)}`;
    }
}