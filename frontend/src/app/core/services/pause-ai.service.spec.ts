import { of } from 'rxjs';
import { PauseAIService } from './pause-ai.service';

class FakeEventSource {
    static instances: FakeEventSource[] = [];
    url: string;
    withCredentials: boolean;
    listeners: Record<string, Array<(event: MessageEvent) => void>> = {};
    onerror: (() => void) | null = null;
    closed = false;

    constructor(url: string, options?: { withCredentials?: boolean }) {
        this.url = url;
        this.withCredentials = Boolean(options?.withCredentials);
        FakeEventSource.instances.push(this);
    }

    addEventListener(name: string, cb: (event: MessageEvent) => void): void {
        (this.listeners[name] = this.listeners[name] || []).push(cb);
    }

    emit(name: string, data: unknown): void {
        (this.listeners[name] || []).forEach(cb => cb({ data } as MessageEvent));
    }

    close(): void {
        this.closed = true;
    }
}

describe('PauseAIService', () => {
    let http: any;
    let service: PauseAIService;

    const collect = <T>(observable$: { subscribe: (cb: (value: T) => void) => void }): T[] => {
        const values: T[] = [];
        observable$.subscribe(value => values.push(value));
        return values;
    };

    beforeEach(() => {
        http = {
            get: jasmine.createSpy('get').and.returnValue(of({})),
            post: jasmine.createSpy('post').and.returnValue(of({}))
        };
        service = new PauseAIService(http);
        (globalThis as any).EventSource = FakeEventSource;
        FakeEventSource.instances = [];

        spyOn(window, 'setTimeout').and.callFake(((cb: () => void) => 991 as any) as any);
        spyOn(window, 'clearTimeout').and.stub();
    });

    afterEach(() => {
        try {
            service.disconnectRealtime();
        } catch {
            /* pas de flux ouvert */
        }
    });

    it('should evaluate a pause for a trip', () => {
        const prediction = { score: 91 };
        http.post.and.returnValue(of(prediction));

        const request = { drivingHours: 5 } as any;
        expect(collect(service.evaluerPause(7, request))).toEqual([prediction]);
        expect(http.post).toHaveBeenCalledWith(
            'http://localhost:8080/api/pauseai/evaluer/7',
            request
        );
    });

    it('should load, complete, ignore and regenerate regulatory pauses', () => {
        const pauses = [{ id: 1 }];
        http.get.and.returnValue(of(pauses));
        http.post.and.returnValue(of(pauses[0]));

        expect(collect(service.getPausesForTrajet(3))).toEqual([pauses]);
        expect(http.get).toHaveBeenCalledWith('http://localhost:8080/api/trajets/3/pauses');

        expect(collect(service.markPauseCompleted(3, 9))).toEqual([pauses[0]]);
        expect(http.post).toHaveBeenCalledWith(
            'http://localhost:8080/api/trajets/3/pauses/9/effectuee',
            {}
        );

        expect(collect(service.ignorePause(3, 9))).toEqual([pauses[0]]);
        expect(http.post).toHaveBeenCalledWith(
            'http://localhost:8080/api/trajets/3/pauses/9/ignorer',
            {}
        );

        http.post.and.returnValue(of(pauses));
        expect(collect(service.regeneratePauses(3))).toEqual([pauses]);
        expect(http.post).toHaveBeenCalledWith(
            'http://localhost:8080/api/trajets/3/pauses/regenerer',
            {}
        );
    });

    it('should fetch prediction history', () => {
        const history = [{ score: 50 }];
        http.get.and.returnValue(of(history));

        expect(collect(service.getHistoriquePredictions(12))).toEqual([history]);
        expect(http.get).toHaveBeenCalledWith('http://localhost:8080/api/pauseai/trajets/12/historique');
    });

    it('should query dashboard stats with date and driver filters', () => {
        const dashboard = {
            totalPausesRecommandees: 4,
            pausesEffectuees: 2,
            pausesIgnorees: 1,
            heatmapPoints: [{ nomLieu: 'Tunis', type: 'CITY', score: 88, latitude: 36.8, longitude: 10.18 }],
            chauffeurStats: [{ id: 1 }]
        };
        http.get.and.returnValue(of(dashboard));

        const start = new Date('2026-08-01T00:00:00.000Z');
        const end = new Date('2026-08-20T00:00:00.000Z');
        expect(collect(service.getDashboardStats({ startDate: start, endDate: end, chauffeurId: 5 } as any)))
            .toEqual([dashboard]);

        const options = http.get.calls.mostRecent().args[1];
        const params = options.params as any;
        expect(params.get('startDate')).toBe(start.toISOString());
        expect(params.get('endDate')).toBe(end.toISOString());
        expect(params.get('chauffeurId')).toBe('5');
    });

    it('should query dashboard stats without a driver filter', () => {
        const dashboard = { heatmapPoints: [], chauffeurStats: [] };
        http.get.and.returnValue(of(dashboard));

        const start = new Date('2026-07-01T00:00:00.000Z');
        const end = new Date('2026-07-31T00:00:00.000Z');
        collect(service.getDashboardStats({ startDate: start, endDate: end, chauffeurId: undefined } as any));

        const params = http.get.calls.mostRecent().args[1].params as any;
        expect(params.get('chauffeurId')).toBeNull();
    });

    it('should fetch complete pauses for a trip including stop summaries', () => {
        const payload = {
            stops: [
                { type: 'REGLEMENTAIRE', nomLieu: 'Pause A', latitude: 36, longitude: 10 },
                { type: 'POI', nomLieu: 'Pause B', aiScore: 90, lat: 35, lon: 9 }
            ],
            meta: { trajetId: 21 }
        };
        http.get.and.returnValue(of(payload));

        expect(collect(service.getPausesCompletes(21))).toEqual([payload]);
        expect(http.get).toHaveBeenCalledWith('http://localhost:8080/api/pauseai/trajets/21/pauses-completes');

        http.get.and.returnValue(of({ stops: [] }));
        collect(service.getPausesCompletes(22));
    });

    it('should publish and clear alerts through the alert stream', () => {
        const alerts: any[] = [];
        service.alert$.subscribe(alert => alerts.push(alert));

        const event = { trajetId: 4, score: 95 } as any;
        service.publishAlert(event);
        service.clearAlert();

        expect(alerts).toEqual([null, event, null]);
    });

    it('should expose score colors and labels', () => {
        expect(service.getScoreColor(90)).toBe('#ef4444');
        expect(service.getScoreColor(75)).toBe('#f59e0b');
        expect(service.getScoreColor(10)).toBe('#10b981');

        expect(service.getScoreLabel(92)).toBe('Score critique');
        expect(service.getScoreLabel(70)).toBe('Score élevé');
        expect(service.getScoreLabel(55)).toBe('Score modéré');
        expect(service.getScoreLabel(5)).toBe('Score faible');
    });

    it('should format durations and distances', () => {
        expect(service.formatHoursDriving(2)).toBe('2h00');
        expect(service.formatHoursDriving(1.5)).toBe('1h30');
        expect(service.formatDistance(1250)).toBe('1.3 km');
        expect(service.formatDistance(480)).toBe('480 m');
    });

    it('should open the SSE stream once and dispatch parsed events', () => {
        const alerts: any[] = [];
        const statuses: any[] = [];
        const generated: number[] = [];
        service.alert$.subscribe(a => alerts.push(a));
        (service as any).pauseStatusSubject.subscribe((s: any) => statuses.push(s));
        (service as any).pauseGeneratedSubject.subscribe((g: number) => generated.push(g));

        service.connectRealtime();

        const source = FakeEventSource.instances[FakeEventSource.instances.length - 1];
        expect(source.url).toBe('http://localhost:8080/api/notifications/stream');
        expect(source.withCredentials).toBeTrue();

        source.emit('PAUSE_AI_ALERT', JSON.stringify({ trajetId: 1 }));
        source.emit('PAUSE_STATUS_UPDATED', JSON.stringify({ trajetId: 1, statut: 'EFFECTUEE' }));
        source.emit('PAUSES_GENEREES', '42');
        source.emit('PAUSES_GENEREES', 'not-a-number');
        source.emit('PAUSE_AI_ALERT', '{broken json');

        expect(alerts[alerts.length - 1]).toEqual({ trajetId: 1 });
        expect(alerts.filter(a => a !== null).length).toBe(1);
        expect(statuses.length).toBe(1);
        expect(generated).toEqual([42]);

        service.connectRealtime();
        expect(FakeEventSource.instances.length).toBe(1);
    });

    it('should reconnect after SSE errors and clean up on disconnect', () => {
        service.connectRealtime();
        const source = FakeEventSource.instances[0];

        source.onerror!();

        expect(source.closed).toBeTrue();
        expect(window.setTimeout).toHaveBeenCalledWith(jasmine.any(Function), 5000);

        service.disconnectRealtime();
        expect(window.clearTimeout).toHaveBeenCalledWith(991);
    });

    it('should skip realtime connection when EventSource is unavailable', () => {
        delete (globalThis as any).EventSource;

        service.connectRealtime();

        expect(FakeEventSource.instances.length).toBe(0);
        (globalThis as any).EventSource = FakeEventSource;
    });
});
