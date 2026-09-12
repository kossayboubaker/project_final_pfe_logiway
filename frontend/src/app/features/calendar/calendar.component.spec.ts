import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CalendarComponent } from './calendar.component';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { provideRouter } from '@angular/router';
import { of, Subject } from 'rxjs';
import { AuthService } from '../../core/auth.service';
import { CalendarService } from '../../core/services/calendar.service';

describe('CalendarComponent', () => {
  let component: CalendarComponent;
  let fixture: ComponentFixture<CalendarComponent>;
  let authServiceMock: jasmine.SpyObj<AuthService>;
  let calendarServiceMock: jasmine.SpyObj<CalendarService>;
  let dialogSpy: jasmine.SpyObj<MatDialog>;
  let dialogResults: Subject<any>[];

  const matrixDay = (d: Date) => ({ date: d, currentMonth: true, today: false });

  beforeEach(async () => {
    authServiceMock = jasmine.createSpyObj('AuthService', ['getUser']);
    authServiceMock.getUser.and.returnValue({ id: '1', role: 'MANAGER' });

    calendarServiceMock = jasmine.createSpyObj('CalendarService', [
      'getEvents', 'addEvent', 'loadLeaveEvents', 'refreshLeaveEvents', 'getEventsForDate', 'getCalendarMatrix'
    ]);
    calendarServiceMock.getEvents.and.returnValue(of([]));
    calendarServiceMock.loadLeaveEvents.and.returnValue(of([]));
    calendarServiceMock.getCalendarMatrix.and.callFake(
      (year: number, month: number) => [matrixDay(new Date(year, month, 1)), matrixDay(new Date(year, month, 2))]
    );

    dialogResults = [];
    dialogSpy = jasmine.createSpyObj('MatDialog', ['open']);
    dialogSpy.open.and.callFake(() => {
      const s = new Subject<any>();
      dialogResults.push(s);
      return { afterClosed: () => s.asObservable(), close: () => { }, componentInstance: {} } as any;
    });

    await TestBed.configureTestingModule({
      imports: [CalendarComponent],
      providers: [
        provideRouter([]),
        { provide: AuthService, useValue: authServiceMock },
        { provide: CalendarService, useValue: calendarServiceMock },
        { provide: MatDialog, useValue: dialogSpy }
      ]
    })
      .overrideComponent(CalendarComponent, { remove: { imports: [MatDialogModule] } })
      .compileComponents();

    fixture = TestBed.createComponent(CalendarComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('ngOnInit charge événements et congés', () => {
    expect(calendarServiceMock.refreshLeaveEvents).toHaveBeenCalled();
    expect(component.events).toEqual([]);
    expect(component.leaveEvents).toEqual([]);
    expect(component.holidays.length).toBe(12);
  });

  // ─── loadLeaveEvents mapping ──────────────────────────────────
  it('loadLeaveEvents mappe les congés approuvés', () => {
    calendarServiceMock.loadLeaveEvents.and.returnValue(of([
      {
        id: 'L1', requesterName: 'Ali', typeLabel: 'Vacances', type: 'VACANCES',
        duration: 3, startDateIso: '2026-03-02T00:00:00', endDateIso: '2026-03-04T00:00:00'
      }
    ] as any[]));
    (component as any).loadLeaveEvents();

    expect(component.leaveEvents[0]).toEqual(
      jasmine.objectContaining({ id: 'L1', requesterName: 'Ali', duration: 3 })
    );
    expect(component.leaveEvents[0].startDate.getFullYear()).toBe(2026);
  });

  // ─── getHolidayForDate ────────────────────────────────────────
  it('getHolidayForDate trouve un jour férié', () => {
    const holiday = component.getHolidayForDate(new Date(2026, 0, 1));
    expect(holiday?.name).toBe('Jour An');
  });

  it('getHolidayForDate retourne null sinon', () => {
    expect(component.getHolidayForDate(new Date(2027, 5, 15))).toBeNull();
  });

  // ─── getLeaveEventsForDate ────────────────────────────────────
  it('getLeaveEventsForDate couvre toute la durée du congé', () => {
    component.leaveEvents = [{
      id: 'L1', requesterName: 'Ali', typeLabel: 'Congés', leaveType: 'VACANCES',
      duration: 3, startDate: new Date(2026, 2, 2), endDate: new Date(2026, 2, 4)
    }];

    expect(component.getLeaveEventsForDate(new Date(2026, 2, 2)).length).toBe(1);
    expect(component.getLeaveEventsForDate(new Date(2026, 2, 3)).length).toBe(1);
    expect(component.getLeaveEventsForDate(new Date(2026, 2, 4)).length).toBe(1);
    expect(component.getLeaveEventsForDate(new Date(2026, 2, 5)).length).toBe(0);
  });

  // ─── getManualEventsForDate ───────────────────────────────────
  it('getManualEventsForDate exclut les congés et gère les plages', () => {
    component.events = [
      { id: 'E1', title: 'Mission Sud', date: '2026-03-10T08:00:00', type: 'mission' },
      { id: 'E2', title: 'Maintenance', date: '2026-03-20T08:00:00', endDate: '2026-03-22T18:00:00', type: 'maintenance' },
      { id: 'E3', title: 'Congé', date: '2026-03-10T08:00:00', type: 'leave' }
    ] as any[];

    expect(component.getManualEventsForDate(new Date(2026, 2, 10)).map(e => e.id)).toEqual(['E1']);
    expect(component.getManualEventsForDate(new Date(2026, 2, 21)).map(e => e.id)).toEqual(['E2']);
    expect(component.getManualEventsForDate(new Date(2026, 2, 25))).toEqual([]);
  });

  // ─── isWeekend ────────────────────────────────────────────────
  it('isWeekend identifie samedi/dimanche', () => {
    expect(component.isWeekend(new Date(2026, 7, 22))).toBeTrue();
    expect(component.isWeekend(new Date(2026, 7, 23))).toBeTrue();
    expect(component.isWeekend(new Date(2026, 7, 26))).toBeFalse();
  });

  // ─── loadCalendar / navigation ────────────────────────────────
  it('loadCalendar mode mois utilise la matrice du service', () => {
    component.setView('month');
    expect(calendarServiceMock.getCalendarMatrix).toHaveBeenCalledWith(component.displayDate.getFullYear(), component.displayDate.getMonth());
    expect(component.calendarDays.length).toBe(2);
  });

  it('loadCalendar mode semaine génère 7 jours', () => {
    component.setView('week');
    expect(component.calendarDays.length).toBe(7);
  });

  it('loadCalendar mode jour génère une seule entrée', () => {
    component.setView('day');
    expect(component.calendarDays.length).toBe(1);
    expect(component.calendarDays[0].currentMonth).toBeTrue();
  });

  it('prev/next reculent et avancent selon le mode mois', () => {
    component.setView('month');
    const startMonth = component.displayDate.getMonth();

    component.prev();
    expect(component.displayDate.getMonth()).toBe((startMonth + 11) % 12);

    component.next();
    component.next();
    expect(component.displayDate.getMonth()).toBe((startMonth + 1) % 12);
  });

  it('prev/next en mode semaine décalent de 7 jours', () => {
    component.setView('week');
    component.displayDate = new Date(2026, 7, 26);
    const timeBefore = component.displayDate.getTime();

    component.next();
    expect(component.displayDate.getTime()).toBe(timeBefore + 7 * 24 * 3600 * 1000);

    component.prev();
    expect(component.displayDate.getTime()).toBe(timeBefore);
  });

  it('prev/next en mode jour décalent d\'un jour', () => {
    component.setView('day');
    const dayBefore = component.displayDate.getDate();

    component.prev();
    expect(component.displayDate.getDate()).toBe(dayBefore - 1);

    component.next();
    expect(component.displayDate.getDate()).toBe(dayBefore);
  });

  it('isToday marque le jour courant', () => {
    component.setView('day');
    expect(component.calendarDays[0].today).toBeTrue();

    component.setView('week');
    expect(component.calendarDays.some(d => d.today)).toBeTrue();
  });

  // ─── openEventDialog ──────────────────────────────────────────
  it('openEventDialog ajoute l\'événement après fermeture avec résultat', () => {
    component.openEventDialog(new Date(2026, 2, 10));

    const config = dialogSpy.open.calls.mostRecent().args[1] as any;
    expect(config.data.date).toEqual(new Date(2026, 2, 10));

    dialogResults[0].next({ title: 'Mission' });
    expect(calendarServiceMock.addEvent).toHaveBeenCalledWith({ title: 'Mission' });
  });

  it('openEventDialog sans résultat ni date n\'ajoute rien', () => {
    component.openEventDialog();
    const config = dialogSpy.open.calls.mostRecent().args[1] as any;
    expect(config.data.date).toBeInstanceOf(Date);

    dialogResults[0].next(undefined);
    expect(calendarServiceMock.addEvent).not.toHaveBeenCalled();
  });

  // ─── getCurrentLabel ──────────────────────────────────────────
  it('getCurrentLabel retourne le libellé du mois', () => {
    component.setView('month');
    expect(component.getCurrentLabel()).toMatch(/2026|2025|\d{4}/);
    expect(component.getCurrentLabel()).toContain(String(component.displayDate.getFullYear()));
  });

  it('getCurrentLabel retourne un intervalle en mode semaine', () => {
    component.setView('week');
    const label = component.getCurrentLabel();
    expect(label).toContain('-');
  });

  it('getCurrentLabel retourne la date complète en mode jour', () => {
    component.setView('day');
    const label = component.getCurrentLabel();
    expect(label).toContain(`${component.displayDate.getDate()}`);
  });
});
