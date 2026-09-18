import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';

export interface AppConfig {
    apiBaseUrl: string;
    keycloakUrl: string;
    keycloakRealm: string;
    keycloakClientId: string;
}

@Injectable({ providedIn: 'root' })
export class AppConfigService {
    private config: AppConfig = {
        apiBaseUrl: 'http://localhost:8080',
        keycloakUrl: 'http://localhost:8180',
        keycloakRealm: 'logiway',
        keycloakClientId: 'logiway'
    };

    constructor(private http: HttpClient) {}

    /**
     * Charge la configuration depuis /assets/config.json au démarrage.
     * En Docker, les placeholders sont remplacés par docker-entrypoint.sh.
     * En développement local, les valeurs par défaut sont utilisées.
     */
    load(): Promise<void> {
        return firstValueFrom(
            this.http.get<AppConfig>('/assets/config.json')
        ).then(data => {
            // Ne pas écraser si les placeholders n'ont pas été remplacés
            if (data.apiBaseUrl && !data.apiBaseUrl.startsWith('__')) {
                this.config = data;
            }
        }).catch(() => {
            console.warn('config.json not found, using defaults');
        });
    }

    get apiBaseUrl(): string {
        return this.config.apiBaseUrl;
    }

    get keycloakUrl(): string {
        return this.config.keycloakUrl;
    }

    get keycloakRealm(): string {
        return this.config.keycloakRealm;
    }

    get keycloakClientId(): string {
        return this.config.keycloakClientId;
    }

    /** Helper: retourne l'URL API complète (apiBaseUrl + /api) */
    get apiUrl(): string {
        return `${this.config.apiBaseUrl}/api`;
    }
}
