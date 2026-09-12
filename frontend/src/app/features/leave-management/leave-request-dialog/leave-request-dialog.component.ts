import { Component, Inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatIconModule } from '@angular/material/icon';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';

@Component({
    selector: 'app-leave-request-dialog',
    standalone: true,
    imports: [
        CommonModule,
        MatDialogModule,
        MatFormFieldModule,
        MatInputModule,
        MatSelectModule,
        MatButtonModule,
        MatDatepickerModule,
        MatNativeDateModule,
        MatIconModule,
        ReactiveFormsModule
    ],
    templateUrl: './leave-request-dialog.component.html',
    styleUrls: ['./leave-request-dialog.component.css']
})
export class LeaveRequestDialogComponent implements OnInit {
    leaveForm: FormGroup;
    leaveTypes = [
        { value: 'MALADIE', label: 'Maladie' },
        { value: 'MARIAGE', label: 'Mariage' },
        { value: 'VACANCES', label: 'Vacances' }
    ];
    isEditMode = false;

    constructor(
        private fb: FormBuilder,
        private dialogRef: MatDialogRef<LeaveRequestDialogComponent>,
        @Inject(MAT_DIALOG_DATA) public data: any
    ) {
        this.isEditMode = !!data;
        this.leaveForm = this.fb.group({
            type: ['', Validators.required],
            startDate: [null, Validators.required],
            endDate: [null, Validators.required],
            reason: ['', [Validators.required, Validators.minLength(5)]]
        });
    }

    ngOnInit(): void {
        if (this.isEditMode && this.data) {
            this.leaveForm.patchValue({
                type: this.data.type,
                startDate: this.parseDate(this.data.startDate),
                endDate: this.parseDate(this.data.endDate),
                reason: this.data.reason
            });
        }
    }

    private parseDate(dateStr: string): Date | null {
        if (!dateStr) return null;
        const parsed = new Date(dateStr);
        if (!isNaN(parsed.getTime())) {
            return parsed;
        }
        return null;
    }

    onCancel(): void {
        this.dialogRef.close();
    }

    onSubmit(): void {
        if (this.leaveForm.valid) {
            const formValue = this.leaveForm.value;
            const formattedData = {
                ...formValue,
                startDate: formValue.startDate,
                endDate: formValue.endDate
            };
            this.dialogRef.close(formattedData);
        }
    }

    get durationPreview(): string {
        const startDate = this.leaveForm.get('startDate')?.value;
        const endDate = this.leaveForm.get('endDate')?.value;
        if (!startDate || !endDate) {
            return '';
        }

        const start = new Date(startDate);
        const end = new Date(endDate);
        if (isNaN(start.getTime()) || isNaN(end.getTime()) || end < start) {
            return '';
        }

        const duration = Math.floor((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
        return `${duration} jour${duration > 1 ? 's' : ''}`;
    }
}
