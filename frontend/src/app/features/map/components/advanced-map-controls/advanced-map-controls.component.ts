import { Component, Output, EventEmitter, Input, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatBadgeModule } from '@angular/material/badge';

@Component({
    selector: 'app-advanced-map-controls',
    standalone: true,
    imports: [CommonModule, MatButtonModule, MatIconModule, MatBadgeModule],
    templateUrl: './advanced-map-controls.component.html',
    styleUrls: ['./advanced-map-controls.component.css']
})
export class AdvancedMapControlsComponent implements OnInit, OnDestroy {
    @Input() alertCount: number = 0;

    @Output() home = new EventEmitter<void>();
    @Output() notifications = new EventEmitter<void>();
    @Output() settings = new EventEmitter<void>();

    isDarkMode: boolean = true;
    private themeObserver!: MutationObserver;

    ngOnInit() {
        this.isDarkMode = document.body.getAttribute('data-theme') !== 'light';
        this.themeObserver = new MutationObserver(() => {
            this.isDarkMode = document.body.getAttribute('data-theme') !== 'light';
        });
        this.themeObserver.observe(document.body, { attributes: true, attributeFilter: ['data-theme'] });
    }

    ngOnDestroy() {
        if (this.themeObserver) this.themeObserver.disconnect();
    }

    onHome() { this.home.emit(); }
    onNotifications() { this.notifications.emit(); }
    onSettings() { this.settings.emit(); }

    onThemeToggle() {
        if (typeof (window as any).toggleTheme === 'function') {
            (window as any).toggleTheme();
        }
    }
}
