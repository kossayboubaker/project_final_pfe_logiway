import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';

export interface ConfirmDeleteData {
  title: string;
  message: string;
  itemId?: string | number;
  itemName?: string;
  itemDetail?: string;
}

@Component({
  selector: 'app-confirm-delete-dialog',
  standalone: true,
  imports: [CommonModule, MatButtonModule, MatIconModule, MatDialogModule],
  template: `
    <div class="confirm-dialog">
      <!-- Warning Icon -->
      <div class="icon-circle">
        <mat-icon class="warn-icon">warning_amber</mat-icon>
      </div>

      <!-- Title -->
      <h2 class="dialog-title">{{ data.title }}</h2>

      <!-- Message -->
      <p class="dialog-msg" [innerHTML]="data.message"></p>

      <!-- Actions -->
      <div class="dialog-btns">
        <button mat-stroked-button class="btn-cancel" (click)="dialogRef.close(false)">
          Annuler
        </button>
        <button mat-flat-button class="btn-delete" (click)="dialogRef.close(true)">
          <mat-icon>delete_forever</mat-icon>
          Supprimer
        </button>
      </div>
    </div>
  `,
  styles: [`
    .confirm-dialog {
      padding: 28px 28px 22px;
      text-align: center;
      font-family: 'Outfit', sans-serif;
    }

    /* ── Icon ── */
    .icon-circle {
      width: 58px;
      height: 58px;
      border-radius: 50%;
      background: rgba(239, 68, 68, 0.12);
      display: flex;
      align-items: center;
      justify-content: center;
      margin: 0 auto 18px;
    }
    .warn-icon {
      font-size: 30px;
      width: 30px;
      height: 30px;
      color: #ef4444;
    }

    /* ── Title ── */
    .dialog-title {
      font-size: 1.15rem;
      font-weight: 700;
      color: var(--text-primary, #f8fafc);
      margin: 0 0 12px;
    }

    /* ── Message ── */
    .dialog-msg {
      font-size: 0.85rem;
      color: var(--text-secondary, #94a3b8);
      line-height: 1.7;
      margin: 0 0 24px;
      max-width: 380px;
      margin-left: auto;
      margin-right: auto;
    }
    .dialog-msg :host ::ng-deep strong,
    .dialog-msg strong {
      color: var(--accent, #3b82f6);
      font-weight: 600;
    }

    /* ── Buttons ── */
    .dialog-btns {
      display: flex;
      gap: 12px;
      justify-content: center;
    }

    .btn-cancel {
      border-color: var(--glass-border, rgba(51, 65, 85, 0.5)) !important;
      color: var(--text-secondary, #94a3b8) !important;
      border-radius: 12px !important;
      padding: 8px 28px !important;
      font-weight: 600 !important;
      font-size: 0.85rem !important;
      letter-spacing: 0.3px;
    }
    .btn-cancel:hover {
      background: rgba(255, 255, 255, 0.04) !important;
    }

    .btn-delete {
      background: #ef4444 !important;
      color: #fff !important;
      border-radius: 12px !important;
      padding: 8px 28px !important;
      font-weight: 600 !important;
      font-size: 0.85rem !important;
      letter-spacing: 0.3px;
      display: flex !important;
      align-items: center !important;
      gap: 6px !important;
      box-shadow: 0 4px 14px rgba(239, 68, 68, 0.3);
      transition: transform 0.2s ease, box-shadow 0.2s ease !important;
    }
    .btn-delete:hover {
      transform: translateY(-1px) !important;
      box-shadow: 0 6px 20px rgba(239, 68, 68, 0.45) !important;
    }
    .btn-delete mat-icon {
      font-size: 18px;
      width: 18px;
      height: 18px;
    }
  `]
})
export class ConfirmDeleteDialogComponent {
  constructor(
    public dialogRef: MatDialogRef<ConfirmDeleteDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: ConfirmDeleteData
  ) {}
}
