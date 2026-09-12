import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { WeatherInfo, WeatherService } from './weather.service';

describe('WeatherService', () => {
    let service: WeatherService;
    let httpMock: HttpTestingController;

    beforeEach(() => {
        TestBed.configureTestingModule({
            providers: [provideHttpClient(), provideHttpClientTesting()]
        });
        service = TestBed.inject(WeatherService);
        httpMock = TestBed.inject(HttpTestingController);
    });

    afterEach(() => httpMock.verify());

    it('récupère et mappe la météo puis sert le cache sans nouvelle requête', () => {
        const emissions: WeatherInfo[] = [];
        service.getWeather(36.80651, 10.18147).subscribe(w => emissions.push(w));

        const req = httpMock.expectOne(r => r.url.includes('/api/meteo'));
        expect(req.request.params.get('lat')).toBe('36.80651');
        expect(req.request.params.get('lon')).toBe('10.18147');
        req.flush({
            temperatureCelsius: 31,
            descriptionFr: 'Ensoleillé',
            iconCode: '01d',
            windKmH: 12,
            humidity: 40,
            visibilityKm: 9,
            etatGeneral: 'CLAIR',
            risqueConduite: 'VERT',
            dangereux: true
        });

        expect(emissions[0]).toEqual({
            temperatureCelsius: 31,
            descriptionFr: 'Ensoleillé',
            iconCode: '01d',
            windKmH: 12,
            humidity: 40,
            visibilityKm: 9,
            etatGeneral: 'CLAIR',
            risqueConduite: 'VERT',
            dangereux: true,
            iconUrl: 'https://openweathermap.org/img/wn/01d@2x.png'
        });

        service.getWeather(36.80651, 10.18147).subscribe(w => emissions.push(w));
        expect(emissions[1]).toEqual(emissions[0]);
        httpMock.expectNone(r => r.url.includes('/api/meteo'));
    });

    it('utilise la cacheKey fournie et complète les champs manquants', () => {
        const out: WeatherInfo[] = [];
        service.getWeather(10, 20, 'cle-fixe').subscribe(w => out.push(w));

        httpMock.expectOne(r => r.url.includes('/api/meteo')).flush(null);

        expect(out[0].descriptionFr).toBe('Météo indisponible');
        expect(out[0].etatGeneral).toBe('NUAGEUX');
        expect(out[0].risqueConduite).toBe('ORANGE');
        expect(out[0].dangereux).toBeFalse();
        expect(out[0].temperatureCelsius).toBeNull();
        expect(out[0].iconCode).toBe('01d');
    });

    it('retourne la météo de repli en cas d\u2019erreur HTTP', () => {
        const out: WeatherInfo[] = [];
        service.getWeather(1, 2, 'err-key').subscribe(w => out.push(w));

        httpMock.expectOne(r => r.url.includes('/api/meteo')).flush(
            {}, { status: 500, statusText: 'Server Error' }
        );

        expect(out[0]).toEqual({
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
        });
    });

    it('clearExpiredCache supprime uniquement les entrées périmées', () => {
        const cache: Map<string, any> = (service as any).cache;
        cache.set('perimee', { expiresAt: Date.now() - 1000, value: {} as WeatherInfo });
        cache.set('valide', { expiresAt: Date.now() + 60000, value: {} as WeatherInfo });

        service.clearExpiredCache();

        expect(cache.has('perimee')).toBeFalse();
        expect(cache.has('valide')).toBeTrue();

        cache.clear();
    });

    it('rafraîchit la donnée quand l\u2019entrée de cache est expirée', () => {
        const emissions: number[] = [];
        service.getWeather(5, 5, 'exp-key').subscribe(w => emissions.push(1));
        httpMock.expectOne(r => r.url.includes('/api/meteo')).flush({ temperatureCelsius: 20 });

        ((service as any).cache.get('exp-key') as any).expiresAt = Date.now() - 1;

        service.getWeather(5, 5, 'exp-key').subscribe(w => emissions.push(2));
        httpMock.expectOne(r => r.url.includes('/api/meteo')).flush({ temperatureCelsius: 21 });

        expect(emissions.length).toBe(2);
    });
});
