import { Component, Input, Output, EventEmitter, ChangeDetectionStrategy, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { DeliveryCardComponent } from '../delivery-card/delivery-card.component';

@Component({
    selector: 'app-delivery-list',
    standalone: true,
    imports: [CommonModule, FormsModule, MatButtonModule, MatIconModule, DeliveryCardComponent],
    templateUrl: './delivery-list.component.html',
    styleUrls: ['./delivery-list.component.css'],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class DeliveryListComponent implements OnChanges {
    @Input() trucks: any[] = [];
    @Input() activeTruckId: string | null = null;
    private _searchQuery: string = '';

    @Input()
    set searchQuery(value: string) {
        this._searchQuery = value ?? '';
    }

    get searchQuery(): string {
        return this._searchQuery;
    }

    @Output() selectTruck = new EventEmitter<string>();
    @Output() close = new EventEmitter<void>();
    private searchTimeout: any;

    currentPage: number = 1;
    pageSize: number = 2;
    filterType: 'all' | 'en-route' | 'arrived' | 'alerts' = 'all';

    // Computations cached manually logically handled by getters since pure
    
    ngOnChanges(changes: SimpleChanges) {
        if (changes['trucks'] && this.trucks) {
            this.validatePaginationBounds();
        }
    }

    get counts() {
        if (!this.trucks) return { total: 0, enRoute: 0, arrived: 0, alerts: 0 };
        return {
            total: this.trucks.length,
            enRoute: this.trucks.filter(t => t.status === 'En cours').length,
            arrived: this.trucks.filter(t => t.status === 'Arrivé').length,
            alerts: this.trucks.filter(t => t.hasAlert).length
        };
    }

    get filteredTrucks() {
        if (!this.trucks) return [];
        let list = this.trucks;

        // Status Filter
        if (this.filterType === 'en-route') list = list.filter(t => t.status === 'En cours');
        else if (this.filterType === 'arrived') list = list.filter(t => t.status === 'Arrivé');
        else if (this.filterType === 'alerts') list = list.filter(t => t.hasAlert);

        // Search Filter Pure Logic
        const q = this.searchQuery.trim().toLowerCase();
        if (q) {
            list = list.filter(t => 
                (t.id && t.id.toLowerCase().includes(q)) || 
                (t.name && t.name.toLowerCase().includes(q)) || 
                (t.driver && t.driver.toLowerCase().includes(q)) ||
                (t.status && t.status.toLowerCase().includes(q))
            );
        }

        return list;
    }

    get paginatedTrucks() {
        const ft = this.filteredTrucks;
        const start = (this.currentPage - 1) * this.pageSize;
        return ft.slice(start, start + this.pageSize);
    }

    get totalPages() {
        return Math.max(1, Math.ceil(this.filteredTrucks.length / this.pageSize));
    }

    get pageNumbers() {
        const total = this.totalPages;
        const current = this.currentPage;
        let start = Math.max(1, current - 2);
        let end = Math.min(total, current + 2);
        
        if (current <= 3) end = Math.min(total, 5);
        if (current >= total - 2) start = Math.max(1, total - 4);
        
        const pages = [];
        for (let i = start; i <= end; i++) {
            pages.push(i);
        }
        return pages;
    }

    onSearchInput(value: string) {
        if (this.searchTimeout) clearTimeout(this.searchTimeout);
        this.searchTimeout = setTimeout(() => {
            this.searchQuery = value;
            this.currentPage = 1; // Reset pagination on search
            // Angular handles view update automatically since ngModel binds it, 
            // but OnPush might require manual triggering if driven entirely by setTimeout without zone tracking.
            // However, native NgModel triggers change detection properly. 
        }, 200);
    }

    clearSearch() {
        this.searchQuery = '';
        this.currentPage = 1;
        if (this.searchTimeout) clearTimeout(this.searchTimeout);
    }

    setFilter(type: 'all' | 'en-route' | 'arrived' | 'alerts') {
        this.filterType = type;
        this.currentPage = 1;
    }

    private validatePaginationBounds() {
        if (this.currentPage > this.totalPages) {
            this.currentPage = this.totalPages;
        }
    }

    goToPage(page: number) {
        if (page >= 1 && page <= this.totalPages) {
            this.currentPage = page;
        }
    }

    nextPage() {
        if (this.currentPage < this.totalPages) {
            this.currentPage++;
        }
    }

    prevPage() {
        if (this.currentPage > 1) {
            this.currentPage--;
        }
    }

    onTruckSelect(id: string) {
        this.selectTruck.emit(id);
    }

    onClose() {
        this.close.emit();
    }
}
