import { ComponentFixture, TestBed } from '@angular/core/testing';
import { BreakNotificationComponent } from './break-notification.component';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { PauseAIService } from '../../../../core/services/pause-ai.service';
import { POIInfo, TypeAlerteIA } from '../../../../models/pause-ai.models';

describe('BreakNotificationComponent', () => {
  let component: BreakNotificationComponent;
  let fixture: ComponentFixture<BreakNotificationComponent>;
  const pauseAIServiceMock: any = {};

  const mkPoi = (over: Partial<POIInfo> = {}): POIInfo =>
    ({ type: 'STATION_SERVICE', lat: 36.8, lon: 10.18, name: 'Total Mirabeau', distance: 850, ...over });

  beforeEach(async () => {
    pauseAIServiceMock.getScoreColor = jasmine.createSpy('getScoreColor').and.returnValue('#ef4444');
    pauseAIServiceMock.getScoreLabel = jasmine.createSpy('getScoreLabel').and.returnValue('Score critique');
    pauseAIServiceMock.formatHoursDriving = jasmine.createSpy('formatHoursDriving').and.returnValue('4h30');
    pauseAIServiceMock.formatDistance = jasmine.createSpy('formatDistance').and.returnValue('850 m');
    pauseAIServiceMock.getPrediction = jasmine.createSpy('getPrediction').and.returnValue(of(null));
    pauseAIServiceMock.getBreakStatus = jasmine.createSpy('getBreakStatus').and.returnValue(of(null));

    await TestBed.configureTestingModule({
      imports: [BreakNotificationComponent],
      providers: [
        provideRouter([]),
        provideHttpClient(),
        provideHttpClientTesting(),
        provideAnimationsAsync(),
        { provide: PauseAIService, useValue: pauseAIServiceMock }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(BreakNotificationComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('refreshAIMetadata / cycle de vie', () => {
    it('recalcule couleur et label quand un aiScore est fourni', () => {
      component.aiScore = 92;
      component.ngOnInit();
      expect(pauseAIServiceMock.getScoreColor).toHaveBeenCalledWith(92);
      expect(pauseAIServiceMock.getScoreLabel).toHaveBeenCalledWith(92);
      expect(component.scoreColor).toBe('#ef4444');
      expect(component.scoreLabel).toBe('Score critique');
      expect(component.showAIDetails).toBe(true);
    });

    it('réagit aux changements de ngOnChanges', () => {
      component.hoursDriving = 3;
      component.ngOnChanges({ hoursDriving: {} as any });
      expect(component.showAIDetails).toBe(true);

      pauseAIServiceMock.getScoreColor.calls.reset();
      component.aiScore = 55;
      component.ngOnChanges({ aiScore: {} as any });
      expect(pauseAIServiceMock.getScoreColor).toHaveBeenCalled();
    });

    it('masque les détails IA sans score ni type ni heures', () => {
      component.aiScore = undefined;
      component.typeAlerteIA = undefined;
      component.hoursDriving = undefined;
      component.ngOnInit();
      expect(component.showAIDetails).toBe(false);
    });

    it('ignore aiScore null mais garde le label par défaut', () => {
      component.aiScore = null as any;
      component.ngOnInit();
      expect(pauseAIServiceMock.getScoreColor).not.toHaveBeenCalled();
      expect(component.scoreColor).toBe('#10b981');
      expect(component.scoreLabel).toBe('Score faible');
    });
  });

  describe('actions et émissions', () => {
    it('onClose émet close', () => {
      let closed = false;
      component.close.subscribe(() => (closed = true));
      component.onClose();
      expect(closed).toBe(true);
    });

    it('onAction émet action puis markCompleted', () => {
      const order: string[] = [];
      component.action.subscribe(() => order.push('action'));
      component.markCompleted.subscribe(() => order.push('completed'));
      component.onAction();
      expect(order).toEqual(['action', 'completed']);
    });

    it('onCancel et onIgnore émettent ignore', () => {
      let count = 0;
      component.ignore.subscribe(() => count++);
      component.onCancel();
      component.onIgnore();
      expect(count).toBe(2);
    });

    it('onStart et onMarkCompleted émettent leurs événements', () => {
      let started = false;
      let done = false;
      component.start.subscribe(() => (started = true));
      component.markCompleted.subscribe(() => (done = true));
      component.onStart();
      component.onMarkCompleted();
      expect(started).toBe(true);
      expect(done).toBe(true);
    });

    it('onViewOnMap émet le POI uniquement s\u2019il existe', () => {
      let received: POIInfo | undefined;
      component.viewOnMap.subscribe(p => (received = p));

      component.poiInfo = undefined;
      component.onViewOnMap();
      expect(received).toBeUndefined();

      const poi = mkPoi();
      component.poiInfo = poi;
      component.onViewOnMap();
      expect(received).toBe(poi);
    });
  });

  describe('formats et labels', () => {
    it('getFormattedHoursDriving formate ou retourne vide', () => {
      component.hoursDriving = 4.5;
      expect(component.getFormattedHoursDriving()).toBe('4h30');

      component.hoursDriving = undefined;
      expect(component.getFormattedHoursDriving()).toBe('');
    });

    it('getFormattedDistance formate ou retourne vide', () => {
      component.distanceToPoiM = 850;
      expect(component.getFormattedDistance()).toBe('850 m');

      component.distanceToPoiM = undefined;
      expect(component.getFormattedDistance()).toBe('');
    });

    it('labels de position avec valeurs par défaut', () => {
      expect(component.getCurrentPointLabel()).toBe('Position actuelle du trajet');
      component.currentPointLabel = 'Tunis Centre';
      expect(component.getCurrentPointLabel()).toBe('Tunis Centre');

      expect(component.getNextPointLabel()).toBe('Point de pause recommandé');
      component.poiInfo = mkPoi({ name: 'Total Mirabeau' });
      expect(component.getNextPointLabel()).toBe('Total Mirabeau');
      component.nextPointLabel = 'Sousse Nord';
      expect(component.getNextPointLabel()).toBe('Sousse Nord');
    });
  });

  describe('hasEquipment', () => {
    it('retourne false sans POI ni tags', () => {
      component.poiInfo = undefined;
      expect(component.hasEquipment('fuel')).toBe(false);

      component.poiInfo = mkPoi({ tags: undefined });
      expect(component.hasEquipment('fuel')).toBe(false);
    });

    it('accepte yes, designated et 24/7', () => {
      component.poiInfo = mkPoi({ tags: { fuel: 'yes', toilets: 'designated', shower: '24/7', wifi: 'no' } });
      expect(component.hasEquipment('fuel')).toBe(true);
      expect(component.hasEquipment('toilets')).toBe(true);
      expect(component.hasEquipment('shower')).toBe(true);
      expect(component.hasEquipment('wifi')).toBe(false);
      expect(component.hasEquipment('absent')).toBe(false);
    });
  });

  describe('getters d\u2019urgence', () => {
    it('isUrgent selon typeAlerteIA, score ou heures', () => {
      component.typeAlerteIA = TypeAlerteIA.URGENTE;
      expect(component.isUrgent).toBe(true);

      component.typeAlerteIA = undefined;
      component.aiScore = 90;
      expect(component.isUrgent).toBe(true);

      component.aiScore = 84;
      component.hoursDriving = 5;
      expect(component.isUrgent).toBe(true);

      component.hoursDriving = 2;
      component.aiScore = null as any;
      expect(component.isUrgent).toBe(false);
    });

    it('isRecommended selon typeAlerteIA ou score entre 70 et 85', () => {
      component.typeAlerteIA = TypeAlerteIA.RECOMMANDEE;
      expect(component.isRecommended).toBe(true);

      component.typeAlerteIA = undefined;
      component.aiScore = 75;
      expect(component.isRecommended).toBe(true);

      component.aiScore = 85;
      expect(component.isRecommended).toBe(false);

      component.aiScore = null as any;
      expect(component.isRecommended).toBe(false);
    });
  });

  describe('scores de fatigue ML', () => {
    it('getFatigueIcon parcourt les seuils décroissants', () => {
      expect(component.getFatigueIcon()).toBe('sentiment_satisfied');
      expect(component.fatigueScore = 95).toBeDefined();
      expect(component.getFatigueIcon()).toBe('hotel');
      component.fatigueScore = 85;
      expect(component.getFatigueIcon()).toBe('sentiment_very_dissatisfied');
      component.fatigueScore = 70;
      expect(component.getFatigueIcon()).toBe('sentiment_dissatisfied');
      component.fatigueScore = 50;
      expect(component.getFatigueIcon()).toBe('sentiment_neutral');
      component.fatigueScore = 20;
      expect(component.getFatigueIcon()).toBe('sentiment_satisfied');
    });

    it('getFatigueColor interpole sur tous les paliers', () => {
      expect(component.getFatigueColor()).toBe('#10b981');
      component.fatigueScore = 30;
      expect(component.getFatigueColor()).toBe('#10b981');
      component.fatigueScore = 50;
      expect(component.getFatigueColor()).toMatch(/^#[0-9a-f]{6}$/);
      component.fatigueScore = 65;
      expect(component.getFatigueColor()).not.toBe('#f59e0b');
      component.fatigueScore = 80;
      expect(component.getFatigueColor()).not.toBe('#f97316');
      component.fatigueScore = 95;
      expect(component.getFatigueColor()).toBe('#dc2626');
    });

    it('getFatigueLabel classe chaque palier', () => {
      expect(component.getFatigueLabel()).toBe('Niveau normal');
      component.fatigueScore = 95;
      expect(component.getFatigueLabel()).toContain('critique');
      component.fatigueScore = 80;
      expect(component.getFatigueLabel()).toContain('élevée');
      component.fatigueScore = 65;
      expect(component.getFatigueLabel()).toContain('modérée');
      component.fatigueScore = 45;
      expect(component.getFatigueLabel()).toContain('légère');
      component.fatigueScore = 10;
      expect(component.getFatigueLabel()).toBe('Niveau optimal');
    });

    it('valeur négative : boucles sans correspondance', () => {
      component.fatigueScore = -5;
      expect(component.getFatigueIcon()).toBe('sentiment_satisfied');
      expect(component.getFatigueLabel()).toBe('Niveau normal');
    });

    it('getConfidencePercent arrondit la confiance', () => {
      expect(component.getConfidencePercent()).toBe(0);
      component.confidence = 0.874;
      expect(component.getConfidencePercent()).toBe(87);
    });
  });

  describe('POI', () => {
    it('getPOIIcon mappe les types connus', () => {
      component.poiInfo = undefined;
      expect(component.getPOIIcon()).toBe('place');

      const icons: Array<[string, string]> = [
        ['STATION_SERVICE', 'local_gas_station'],
        ['REST_AREA', 'nature_people'],
        ['CAFE', 'local_cafe'],
        ['FAST_FOOD', 'restaurant'],
        ['PARKING', 'local_parking'],
        ['HOTEL', 'place']
      ];
      for (const [type, expected] of icons) {
        component.poiInfo = mkPoi({ type });
        expect(component.getPOIIcon()).toBe(expected);
      }
    });

    it('getPOITypeLabel traduit ou transmet le type brut', () => {
      component.poiInfo = undefined;
      expect(component.getPOITypeLabel()).toContain('intérêt');

      const cases: Array<[string, string]> = [
        ['STATION_SERVICE', 'Station-service'],
        ['REST_AREA', 'Aire de repos'],
        ['CAFE', 'Café'],
        ['KIOSK', 'Restaurant / Kiosque'],
        ['PARKING', 'Parking poids lourds'],
        ['POI', 'Point d\u0027intérêt'],
        ['MANDATORY_REST', 'Arrêt obligatoire'],
        ['WARNING_ALERT', 'Alerte pause'],
        ['INCONNU_XYZ', 'INCONNU_XYZ']
      ];
      for (const [type, expected] of cases) {
        component.poiInfo = mkPoi({ type });
        expect(component.getPOITypeLabel()).toBe(expected);
      }
    });
  });
});
