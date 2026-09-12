import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';

@Component({
    selector: 'app-pdf-preview-dialog',
    standalone: true,
    imports: [CommonModule, MatDialogModule, MatButtonModule],
    templateUrl: './pdf-preview-dialog.component.html',
    styleUrls: ['./pdf-preview-dialog.component.css']
})
export class PdfPreviewDialogComponent {
    safePdfUrl: SafeResourceUrl;

    constructor(
        private sanitizer: DomSanitizer,
        public dialogRef: MatDialogRef<PdfPreviewDialogComponent>,
        @Inject(MAT_DIALOG_DATA) public data: { pdfUrl: string; companyName?: string }
    ) {
        this.safePdfUrl = this.sanitizer.bypassSecurityTrustResourceUrl(data.pdfUrl);
    }
}
