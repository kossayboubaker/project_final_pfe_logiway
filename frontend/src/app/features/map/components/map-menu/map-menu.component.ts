import { Component, Output, EventEmitter, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { FormsModule } from '@angular/forms';

@Component({
    selector: 'app-map-menu',
    standalone: true,
    imports: [CommonModule, MatIconModule, MatButtonModule, MatSlideToggleModule, FormsModule],
    templateUrl: './map-menu.component.html',
    styleUrls: ['./map-menu.component.css']
})
export class MapMenuComponent {
    @Input() showSidebar: boolean = true;
    @Output() close = new EventEmitter<void>();
    @Output() toggleSidebar = new EventEmitter<boolean>();
    @Output() action = new EventEmitter<string>();

    menuItems = [
        { id: 'saved', icon: 'bookmark', label: 'Enregistré' },
        { id: 'recent', icon: 'history', label: 'Récents' },
        { id: 'contributions', icon: 'edit_note', label: 'Vos contributions' },
        { id: 'location_sharing', icon: 'location_searching', label: 'Partage de position' },
        { id: 'trips', icon: 'timeline', label: 'Vos trajets' },
        { id: 'data', icon: 'security', label: 'Vos données dans Maps' }
    ];

    secondaryItems = [
        { id: 'share', icon: 'link', label: 'Partager ou intégrer la carte' },
        { id: 'print', icon: 'print', label: 'Imprimer' }
    ];

    onClose() {
        this.close.emit();
    }

    onToggleSidebar(event: any) {
        this.toggleSidebar.emit(event.checked);
    }

    onAction(id: string) {
        this.action.emit(id);
        this.onClose();
    }
}
