import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';

@Component({
    selector: 'app-company-waiting',
    standalone: true,
    imports: [CommonModule, RouterModule, MatCardModule, MatIconModule],
    templateUrl: './company-waiting.component.html',
    styleUrls: ['./company-waiting.component.css']
})
export class CompanyWaitingComponent {
}
