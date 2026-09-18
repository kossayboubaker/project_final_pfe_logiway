import { APP_INITIALIZER, ApplicationConfig, importProvidersFrom } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideAnimations } from '@angular/platform-browser/animations';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { provideCharts, withDefaultRegisterables } from 'ng2-charts';

import { routes } from './app.routes';
import { MaterialModule } from './shared/material.module';
import { credentialsInterceptor } from './core/interceptors/credentials.interceptor';
import { errorInterceptor } from './core/interceptors/error.interceptor';
import { tokenInterceptor } from './core/interceptors/token.interceptor';
import { AppConfigService } from './core/services/app-config.service';

function initializeApp(appConfigService: AppConfigService): () => Promise<void> {
    return () => appConfigService.load();
}

export const appConfig: ApplicationConfig = {
    providers: [
        provideRouter(routes),
        provideAnimations(),
        provideHttpClient(withInterceptors([credentialsInterceptor, tokenInterceptor, errorInterceptor])),
        provideCharts(withDefaultRegisterables()),
        importProvidersFrom(MaterialModule),
        {
            provide: APP_INITIALIZER,
            useFactory: initializeApp,
            deps: [AppConfigService],
            multi: true
        }
    ]
};
