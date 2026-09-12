import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { LeaveRecord, LeaveService } from './leave.service';

export interface CalendarEvent {
    id: string;
    title: string;
    date: Date;
    endDate?: Date;
    type: 'mission' | 'maintenance' | 'other' | 'leave';
    description?: string;
}

@Injectable({
    providedIn: 'root'
})
export class CalendarService {
    private baseEvents: CalendarEvent[] = [];
    private leaveEvents: CalendarEvent[] = [];
    private eventsSubject = new BehaviorSubject<CalendarEvent[]>(this.baseEvents);

    constructor(private leaveService: LeaveService) { }

    getEvents(): Observable<CalendarEvent[]> {
        return this.eventsSubject.asObservable();
    }

    addEvent(event: Omit<CalendarEvent, 'id'>): void {
        const newEvent = { ...event, id: Math.random().toString(36).substr(2, 9) };
        this.baseEvents = [...this.baseEvents, newEvent];
        this.recomputeEvents();
    }

    loadLeaveEvents(): Observable<LeaveRecord[]> {
        return this.leaveService.getApprovedLeaves();
    }

    refreshLeaveEvents(): void {
        this.leaveService.getApprovedLeaves().subscribe(leaves => {
            this.leaveEvents = leaves.map(leave => this.mapLeaveToEvent(leave));
            this.recomputeEvents();
        });
    }

    getEventsForDate(date: Date): CalendarEvent[] {
        return this.eventsSubject.value.filter(event => this.isEventOnDate(event, date));
    }

    /**
     * Calculates the matrix of days for a given month and year.
     * Includes padding days from previous/next months for a perfect 7x6 or 7x5 grid.
     */
    getCalendarMatrix(year: number, month: number): { date: Date, currentMonth: boolean, today: boolean }[] {
        const matrix = [];
        const firstDayOfMonth = new Date(year, month, 1);
        const lastDayOfMonth = new Date(year, month + 1, 0);

        // Day of week of first day (0-6, 0=Sunday)
        const startPadding = firstDayOfMonth.getDay();

        // Fill padding from previous month
        for (let i = startPadding - 1; i >= 0; i--) {
            const date = new Date(year, month, -i);
            matrix.push({ date, currentMonth: false, today: this.isToday(date) });
        }

        // Fill current month
        for (let i = 1; i <= lastDayOfMonth.getDate(); i++) {
            const date = new Date(year, month, i);
            matrix.push({ date, currentMonth: true, today: this.isToday(date) });
        }

        // Fill padding from next month to complete the grid (usually 42 cells)
        const remaining = 42 - matrix.length;
        for (let i = 1; i <= remaining; i++) {
            const date = new Date(year, month + 1, i);
            matrix.push({ date, currentMonth: false, today: this.isToday(date) });
        }

        return matrix;
    }

    private isToday(date: Date): boolean {
        const today = new Date();
        return date.getDate() === today.getDate() &&
            date.getMonth() === today.getMonth() &&
            date.getFullYear() === today.getFullYear();
    }

    private isEventOnDate(event: CalendarEvent, date: Date): boolean {
        const start = new Date(event.date);
        const end = event.endDate ? new Date(event.endDate) : start;
        const current = new Date(date.getFullYear(), date.getMonth(), date.getDate());
        const normalizedStart = new Date(start.getFullYear(), start.getMonth(), start.getDate());
        const normalizedEnd = new Date(end.getFullYear(), end.getMonth(), end.getDate());
        return current >= normalizedStart && current <= normalizedEnd;
    }

    private mapLeaveToEvent(leave: LeaveRecord): CalendarEvent {
        return {
            id: `leave-${leave.id}`,
            title: `Congé ${leave.typeLabel} - ${leave.requesterName}`,
            date: new Date(leave.startDateIso),
            endDate: new Date(leave.endDateIso),
            type: 'leave',
            description: `${leave.requesterRole === 'MANAGER' ? 'Manager' : 'Chauffeur'} | ${leave.reason}`
        };
    }

    private recomputeEvents(): void {
        this.eventsSubject.next([...this.baseEvents, ...this.leaveEvents]);
    }
}
