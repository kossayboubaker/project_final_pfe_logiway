import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { WeatherInfo } from '../../../../core/services/weather.service';

@Component({
    selector: 'app-map-control-panel',
    standalone: true,
    imports: [CommonModule, FormsModule, MatSelectModule, MatFormFieldModule, MatCheckboxModule, MatIconModule, MatButtonModule],
    templateUrl: './control-panel.component.html',
    styleUrls: ['./control-panel.component.css']
})
export class MapControlPanelComponent {
    @Input() mapStyle: string = 'standard';
    @Input() activeTruck: any = null;
    @Input() followTruck: boolean = false;
    @Input() showRoads: boolean = true;
    @Input() showBreaks: boolean = true;
    @Input() localWeather: WeatherInfo | null = null;

    @Output() styleChange = new EventEmitter<string>();
    @Output() poiToggle = new EventEmitter<{ type: string, checked: boolean }>();
    @Output() followToggle = new EventEmitter<boolean>();
    @Output() share = new EventEmitter<void>();
    @Output() print = new EventEmitter<void>();
    @Output() close = new EventEmitter<void>();

    styles = [
        { value: 'standard', label: 'Standard' },
        { value: 'satellite', label: 'Satellite' },
        { value: 'terrain', label: 'Terrain' }
    ];

    onStyleChange(style: string) {
        this.styleChange.emit(style);
    }

    onPoiToggle(type: string, event: any) {
        this.poiToggle.emit({ type, checked: event.checked });
    }

    onFollowToggle(event: any) {
        this.followToggle.emit(event.checked);
    }

    onShare() {
        this.share.emit();
    }

    onPrint() {
        this.print.emit();
    }

    onClose() {
        this.close.emit();
    }
}
