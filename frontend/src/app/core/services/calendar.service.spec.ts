import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { CalendarService } from './calendar.service';
import { LeaveService, LeaveRecord } from './leave.service';

describe('CalendarService', () => {
  let service: CalendarService;
  let leaveServiceMock: jasmine.SpyObj<LeaveService>;

  const mkLeave = (over: Partial<LeaveRecord> = {}): LeaveRecord => ({
    id: '7',
    requesterId: 3,
    requesterName: 'Ali Jebali',
    requesterEmail: 'ali@test.com',
    requesterRole: 'CHAUFFEUR',
    managerId: null,
    managerName: null,
    managerEmail: null,
    chauffeurId: null,
    chauffeurName: null,
    chauffeurEmail: null,
    type: 'VACANCES',
    typeLabel: 'Vacances',
    startDate: '01/06/2026',
    endDate: '05/06/2026',
    startDateIso: '2026-06-01T00:00:00Z',
    endDateIso: '2026-06-05T00:00:00Z',
    duration: 5,
    reason: "Vacances d'été",
    status: 'APPROUVE',
    statusLabel: 'Approuvé',
    comment: null,
    createdAt: null,
    updatedAt: null,
    canEdit: false,
    canDelete: false,
    canReview: false,
    ...over
  });

  beforeEach(() => {
    leaveServiceMock = jasmine.createSpyObj('LeaveService', ['getApprovedLeaves', 'getLeaves']);
    TestBed.configureTestingModule({
      providers: [
        CalendarService,
        { provide: LeaveService, useValue: leaveServiceMock }
      ]
    });
    service = TestBed.inject(CalendarService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  // ─── getEvents() ──────────────────────────────────────────────
  it('getEvents() should emit an empty list initially', () => {
    let emitted: any[] | undefined;
    service.getEvents().subscribe(events => emitted = events);
    expect(emitted).toEqual([]);
  });

  // ─── addEvent() ───────────────────────────────────────────────
  it('addEvent() should generate an id and emit the updated list', () => {
    let emitted: any[] = [];
    service.getEvents().subscribe(events => emitted = events);

    service.addEvent({ title: 'Mission Tunis', date: new Date(2026, 5, 10), type: 'mission' });

    expect(emitted.length).toBe(1);
    expect(emitted[0].id).toBeTruthy();
    expect(emitted[0].title).toBe('Mission Tunis');
    expect(emitted[0].type).toBe('mission');
  });

  it('addEvent() should accumulate multiple events', () => {
    service.addEvent({ title: 'A', date: new Date(2026, 0, 1), type: 'other' });
    service.addEvent({ title: 'B', date: new Date(2026, 0, 2), type: 'maintenance' });
    let count = 0;
    service.getEvents().subscribe(events => count = events.length);
    expect(count).toBe(2);
  });

  // ─── loadLeaveEvents() ────────────────────────────────────────
  it('loadLeaveEvents() should delegate to leaveService.getApprovedLeaves()', () => {
    const leaves = [mkLeave()];
    leaveServiceMock.getApprovedLeaves.and.returnValue(of(leaves));

    service.loadLeaveEvents().subscribe(result => {
      expect(result).toEqual(leaves);
    });
    expect(leaveServiceMock.getApprovedLeaves).toHaveBeenCalled();
  });

  it('loadLeaveEvents() should propagate the empty fallback from LeaveService', () => {
    leaveServiceMock.getApprovedLeaves.and.returnValue(of([]));
    service.loadLeaveEvents().subscribe(result => expect(result).toEqual([]));
  });

  // ─── refreshLeaveEvents() ─────────────────────────────────────
  it('refreshLeaveEvents() should map approved leaves into leave events', () => {
    leaveServiceMock.getApprovedLeaves.and.returnValue(of([mkLeave()]));

    let emitted: any[] = [];
    service.getEvents().subscribe(events => emitted = events);
    service.refreshLeaveEvents();

    expect(emitted.length).toBe(1);
    const ev = emitted[0];
    expect(ev.id).toBe('leave-7');
    expect(ev.title).toBe('Congé Vacances - Ali Jebali');
    expect(ev.type).toBe('leave');
    expect(ev.description).toContain('Chauffeur');
    expect(ev.description).toContain("Vacances d'été");
    expect(ev.date instanceof Date).toBeTrue();
    expect(ev.endDate instanceof Date).toBeTrue();
  });

  it('refreshLeaveEvents() should label MANAGER leaves as Manager', () => {
    leaveServiceMock.getApprovedLeaves.and.returnValue(
      of([mkLeave({ id: '9', requesterRole: 'MANAGER' })])
    );

    let emitted: any[] = [];
    service.getEvents().subscribe(events => emitted = events);
    service.refreshLeaveEvents();

    expect(emitted[0].id).toBe('leave-9');
    expect(emitted[0].description.startsWith('Manager')).toBeTrue();
  });

  it('refreshLeaveEvents() should keep base events alongside leave events', () => {
    service.addEvent({ title: 'Base event', date: new Date(2026, 5, 1), type: 'other' });
    leaveServiceMock.getApprovedLeaves.and.returnValue(of([mkLeave(), mkLeave({ id: '8' })]));

    let emitted: any[] = [];
    service.getEvents().subscribe(events => emitted = events);
    service.refreshLeaveEvents();

    expect(emitted.length).toBe(3);
  });

  it('refreshLeaveEvents() should result in only base events when no leaves', () => {
    service.addEvent({ title: 'Base event', date: new Date(2026, 5, 1), type: 'other' });
    leaveServiceMock.getApprovedLeaves.and.returnValue(of([]));

    let emitted: any[] = [];
    service.getEvents().subscribe(events => emitted = events);
    service.refreshLeaveEvents();

    expect(emitted.length).toBe(1);
    expect(emitted[0].title).toBe('Base event');
  });

  // ─── getEventsForDate() ───────────────────────────────────────
  it('getEventsForDate() should match single-date events only on their day', () => {
    service.addEvent({
      title: 'Ponctuel',
      date: new Date(2026, 5, 15, 9, 30),
      type: 'mission'
    });

    expect(service.getEventsForDate(new Date(2026, 5, 15)).length).toBe(1);
    expect(service.getEventsForDate(new Date(2026, 5, 14)).length).toBe(0);
    expect(service.getEventsForDate(new Date(2026, 5, 16)).length).toBe(0);
  });

  it('getEventsForDate() should match every day of a multi-day range inclusively', () => {
    service.addEvent({
      title: 'Congé longue durée',
      date: new Date(2026, 5, 1),
      endDate: new Date(2026, 5, 5),
      type: 'leave'
    });

    expect(service.getEventsForDate(new Date(2026, 5, 1)).length).toBe(1);
    expect(service.getEventsForDate(new Date(2026, 5, 3)).length).toBe(1);
    expect(service.getEventsForDate(new Date(2026, 5, 5)).length).toBe(1);
    expect(service.getEventsForDate(new Date(2026, 5, 6)).length).toBe(0);
    expect(service.getEventsForDate(new Date(2026, 4, 31)).length).toBe(0);
  });

  it('getEventsForDate() should see refreshed leave events', () => {
    leaveServiceMock.getApprovedLeaves.and.returnValue(of([mkLeave()]));

    service.refreshLeaveEvents();
    // Congé du 01/06 au 05/06/2026
    expect(service.getEventsForDate(new Date(2026, 5, 3)).length).toBe(1);
    expect(service.getEventsForDate(new Date(2026, 5, 20)).length).toBe(0);
  });

  // ─── getCalendarMatrix() ──────────────────────────────────────
  it('getCalendarMatrix() should return a 42-cell padded grid for June 2026 (starts Monday)', () => {
    const matrix = service.getCalendarMatrix(2026, 5); // juin 2026

    expect(matrix.length).toBe(42);
    // 01/06/2026 est un lundi → 1 cellule de padding (31/05)
    expect(matrix[0].currentMonth).toBeFalse();
    expect(matrix[0].date.getDate()).toBe(31);
    expect(matrix[0].date.getMonth()).toBe(4);
    expect(matrix[1].currentMonth).toBeTrue();
    expect(matrix[1].date.getDate()).toBe(1);
    expect(matrix[1].date.getMonth()).toBe(5);
    // Dernier jour du mois : 30/06 → index 30
    expect(matrix[30].currentMonth).toBeTrue();
    expect(matrix[30].date.getDate()).toBe(30);
    // Puis padding juillet
    expect(matrix[31].currentMonth).toBeFalse();
    expect(matrix[31].date.getMonth()).toBe(6);
    expect(matrix[31].date.getDate()).toBe(1);
  });

  it('getCalendarMatrix() should pad correctly when month starts on Sunday (November 2026)', () => {
    // 01/11/2026 est un dimanche → aucun padding avant
    const matrix = service.getCalendarMatrix(2026, 10);

    expect(matrix.length).toBe(42);
    expect(matrix[0].currentMonth).toBeTrue();
    expect(matrix[0].date.getDate()).toBe(1);
  });

  it('getCalendarMatrix() should flag exactly one cell as today', () => {
    const today = new Date();
    const matrix = service.getCalendarMatrix(today.getFullYear(), today.getMonth());
    const todays = matrix.filter(cell =>
      cell.today &&
      cell.date.getFullYear() === today.getFullYear() &&
      cell.date.getMonth() === today.getMonth() &&
      cell.date.getDate() === today.getDate()
    );

    expect(todays.length).toBe(1);
    expect(matrix.filter(c => c.today).length).toBeGreaterThanOrEqual(1);
  });
});
