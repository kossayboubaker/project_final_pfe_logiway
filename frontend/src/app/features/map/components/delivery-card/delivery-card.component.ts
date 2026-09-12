import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';

@Component({
    selector: 'app-delivery-card',
    standalone: true,
    imports: [CommonModule, MatIconModule],
    templateUrl: './delivery-card.component.html',
    styleUrls: ['./delivery-card.component.css']
})
export class DeliveryCardComponent {
    @Input() truck: any;
    @Input() isActive: boolean = false;
    @Output() select = new EventEmitter<string>();

    onCardClick() {
        this.select.emit(this.truck.id);
    }
}
