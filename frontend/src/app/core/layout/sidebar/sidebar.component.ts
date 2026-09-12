import { Component, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatListModule } from '@angular/material/list';
import { MatIconModule } from '@angular/material/icon';
import { MatDividerModule } from '@angular/material/divider';
import { MatButtonModule } from '@angular/material/button';
import { MatExpansionModule } from '@angular/material/expansion';
import { AuthService } from '../../auth.service';
import { Subscription } from 'rxjs';

@Component({
    selector: 'app-sidebar',
    standalone: true,
    imports: [
        CommonModule,
        RouterModule,
        MatListModule,
        MatIconModule,
        MatButtonModule,
        MatDividerModule,
        MatExpansionModule
    ],
    templateUrl: './sidebar.component.html',
    styleUrls: ['./sidebar.component.css']
})
export class SidebarComponent implements OnDestroy {
    user: any;
    private userSub: Subscription;

    constructor(private authService: AuthService) {
        this.user = this.authService.getUser();
        this.userSub = this.authService.currentUser.subscribe(user => {
            this.user = user;
        });
    }

    get isManagerCompanyLocked(): boolean {
        return this.user?.role === 'MANAGER' && !this.authService.isCompanyActive();
    }

    ngOnDestroy(): void {
        this.userSub.unsubscribe();
    }
}
