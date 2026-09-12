import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';

export interface DetailDialogData {
    type: 'chart-point' | 'driver-row' | 'seniority-card';
    title: string;
    details: { label: string; value: string; icon?: string; color?: string }[];
    chartLabel?: string;
    chartValue?: number | string;
}

@Component({
    selector: 'app-driver-detail-dialog',
    standalone: true,
    imports: [CommonModule, MatDialogModule, MatIconModule],
    templateUrl: './driver-detail-dialog.component.html',
    styleUrls: ['./driver-detail-dialog.component.css']
})
export class DriverDetailDialogComponent {
    constructor(
        public dialogRef: MatDialogRef<DriverDetailDialogComponent>,
        @Inject(MAT_DIALOG_DATA) public data: DetailDialogData
    ) { }

    close(): void {
        this.dialogRef.close();
    }
}
