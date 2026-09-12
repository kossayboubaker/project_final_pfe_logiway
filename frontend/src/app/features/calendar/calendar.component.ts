import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { CalendarService, CalendarEvent } from '../../core/services/calendar.service';
import { EventDialogComponent } from './event-dialog/event-dialog.component';

interface Holiday {
    date: Date;
    name: string;
    type: 'official' | 'religious';
}

interface LeaveEvent {
    id: string;
    requesterName: string;
    typeLabel: string;
    leaveType: string;
    duration: number;
    startDate: Date;
    endDate: Date;
}

@Component({
    selector: 'app-calendar',
    standalone: true,
    imports: [CommonModule, MatCardModule, MatButtonModule, MatIconModule, MatTooltipModule, MatDialogModule],
    templateUrl: './calendar.component.html',
    styleUrls: ['./calendar.component.css']
})
export class CalendarComponent implements OnInit {
    weekDays = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'];
    displayDate = new Date();
    calendarDays: { date: Date, currentMonth: boolean, today: boolean }[] = [];
    viewMode: 'month' | 'week' | 'day' = 'month';
    events: CalendarEvent[] = [];
    holidays: Holiday[] = [];
    leaveEvents: LeaveEvent[] = [];

    monthNames = [
        'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
        'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
    ];

    constructor(
        private calendarService: CalendarService,
        private dialog: MatDialog
    ) { }

    ngOnInit() {
        this.loadCalendar();
        this.loadHolidays();
        this.loadLeaveEvents();
        
        this.calendarService.refreshLeaveEvents();
        this.calendarService.getEvents().subscribe(evs => {
            this.events = evs;
        });
    }

    /**
     * Load Tunisia holidays and Islamic religious events for 2026
     */
    private loadHolidays(): void {
        this.holidays = [
            // Official Tunisia holidays 2026
            { date: new Date(2026, 0, 1), name: 'Jour An', type: 'official' },
            { date: new Date(2026, 2, 20), name: 'Fête Indépendance', type: 'official' },
            { date: new Date(2026, 3, 9), name: 'Jour Martyr', type: 'official' },
            { date: new Date(2026, 4, 1), name: 'Fête Travail', type: 'official' },
            { date: new Date(2026, 6, 25), name: 'Fête République', type: 'official' },
            { date: new Date(2026, 9, 15), name: 'Évacuation Ben Guerdane', type: 'official' },
            { date: new Date(2026, 10, 7), name: 'Jour Changement', type: 'official' },
            
            // Islamic religious events 2026 (approximate dates based on Islamic calendar)
            { date: new Date(2026, 1, 24), name: 'Mawlid (Mouled)', type: 'religious' },
            { date: new Date(2026, 3, 2), name: 'Début Ramadan', type: 'religious' },
            { date: new Date(2026, 4, 1), name: 'Aïd el-Fitr', type: 'religious' },
            { date: new Date(2026, 5, 7), name: 'Aïd el-Adha', type: 'religious' },
            { date: new Date(2026, 5, 27), name: 'Hijra (An Musulman)', type: 'religious' }
        ];
    }

    /**
     * Load approved leave events from CalendarService
     */
    private loadLeaveEvents(): void {
        this.calendarService.loadLeaveEvents().subscribe(leaves => {
            this.leaveEvents = leaves.map(leave => ({
                id: leave.id,
                requesterName: leave.requesterName,
                typeLabel: leave.typeLabel,
                leaveType: leave.type,
                duration: leave.duration,
                startDate: new Date(leave.startDateIso),
                endDate: new Date(leave.endDateIso)
            }));
        });
    }

    /**
     * Get holiday for a specific date if exists
     */
    getHolidayForDate(date: Date): Holiday | null {
        const dateStr = `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
        const holiday = this.holidays.find(h => 
            `${h.date.getFullYear()}-${h.date.getMonth()}-${h.date.getDate()}` === dateStr
        );
        return holiday || null;
    }

    /**
     * Get all leaves that span a given date
     */
    getLeaveEventsForDate(date: Date): LeaveEvent[] {
        return this.leaveEvents.filter(leave => {
            const current = new Date(date.getFullYear(), date.getMonth(), date.getDate());
            const start = new Date(leave.startDate.getFullYear(), leave.startDate.getMonth(), leave.startDate.getDate());
            const end = new Date(leave.endDate.getFullYear(), leave.endDate.getMonth(), leave.endDate.getDate());
            return current >= start && current <= end;
        });
    }

    /**
     * Get manual events (missions, maintenance) for a date - exclude leaves
     */
    getManualEventsForDate(date: Date): CalendarEvent[] {
        return this.events.filter(event => {
            if (event.type === 'leave') return false; // Leaves are shown separately
            return this.isEventOnDate(event, date);
        });
    }

    /**
     * Check if date is weekend (Sunday or Saturday)
     */
    isWeekend(date: Date): boolean {
        const day = date.getDay();
        return day === 0 || day === 6;
    }

    loadCalendar() {
        if (this.viewMode === 'month') {
            this.calendarDays = this.calendarService.getCalendarMatrix(
                this.displayDate.getFullYear(),
                this.displayDate.getMonth()
            );
        } else if (this.viewMode === 'week') {
            const current = new Date(this.displayDate);
            const first = current.getDate() - current.getDay();
            this.calendarDays = [];
            for (let i = 0; i < 7; i++) {
                const date = new Date(current.getFullYear(), current.getMonth(), first + i);
                this.calendarDays.push({
                    date,
                    currentMonth: date.getMonth() === this.displayDate.getMonth(),
                    today: this.isToday(date)
                });
            }
        } else {
            this.calendarDays = [{
                date: new Date(this.displayDate),
                currentMonth: true,
                today: this.isToday(this.displayDate)
            }];
        }
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

    prev() {
        if (this.viewMode === 'month') {
            this.displayDate = new Date(this.displayDate.getFullYear(), this.displayDate.getMonth() - 1, 1);
        } else if (this.viewMode === 'week') {
            this.displayDate = new Date(this.displayDate.getFullYear(), this.displayDate.getMonth(), this.displayDate.getDate() - 7);
        } else {
            this.displayDate = new Date(this.displayDate.getFullYear(), this.displayDate.getMonth(), this.displayDate.getDate() - 1);
        }
        this.loadCalendar();
    }

    next() {
        if (this.viewMode === 'month') {
            this.displayDate = new Date(this.displayDate.getFullYear(), this.displayDate.getMonth() + 1, 1);
        } else if (this.viewMode === 'week') {
            this.displayDate = new Date(this.displayDate.getFullYear(), this.displayDate.getMonth(), this.displayDate.getDate() + 7);
        } else {
            this.displayDate = new Date(this.displayDate.getFullYear(), this.displayDate.getMonth(), this.displayDate.getDate() + 1);
        }
        this.loadCalendar();
    }

    setView(mode: 'month' | 'week' | 'day') {
        this.viewMode = mode;
        this.loadCalendar();
    }

    openEventDialog(date?: Date) {
        const dialogRef = this.dialog.open(EventDialogComponent, {
            width: '500px',
            data: { date: date || new Date() }
        });

        dialogRef.afterClosed().subscribe(result => {
            if (result) {
                this.calendarService.addEvent(result);
            }
        });
    }

    getCurrentLabel(): string {
        if (this.viewMode === 'month') {
            return `${this.monthNames[this.displayDate.getMonth()]} ${this.displayDate.getFullYear()}`;
        } else if (this.viewMode === 'week') {
            const first = this.calendarDays[0].date;
            const last = this.calendarDays[6].date;
            return `${first.getDate()} ${this.monthNames[first.getMonth()].substr(0, 3)} - ${last.getDate()} ${this.monthNames[last.getMonth()].substr(0, 3)}`;
        } else {
            return `${this.displayDate.getDate()} ${this.monthNames[this.displayDate.getMonth()]} ${this.displayDate.getFullYear()}`;
        }
    }
}
