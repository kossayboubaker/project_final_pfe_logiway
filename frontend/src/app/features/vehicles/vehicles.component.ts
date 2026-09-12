import { Component, OnInit, OnDestroy, ViewChild, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatTableModule, MatTableDataSource } from '@angular/material/table';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatChipsModule } from '@angular/material/chips';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { MatSort, MatSortModule } from '@angular/material/sort';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { FormsModule } from '@angular/forms';
import { FleetService, Vehicle } from '../../core/services/fleet.service';
import { NotificationService } from '../../core/services/notification.service';
import { Subject, takeUntil } from 'rxjs';

@Component({
  selector: 'app-vehicles',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatTableModule,
    MatIconModule,
    MatButtonModule,
    MatChipsModule,
    MatPaginatorModule,
    MatSortModule,
    MatFormFieldModule,
    MatInputModule,
    FormsModule
  ],
  templateUrl: './vehicles.component.html',
  styleUrls: ['./vehicles.component.css']
})
export class VehiclesComponent implements OnInit, AfterViewInit, OnDestroy {
  displayedColumns: string[] = ['plate', 'model', 'status', 'nextCheck', 'actions'];
  dataSource = new MatTableDataSource<Vehicle>([]);
  private readonly destroy$ = new Subject<void>();

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  constructor(
    private fleetService: FleetService,
    private notificationService: NotificationService
  ) { }

  ngOnInit() {
    this.fleetService.getVehicles().subscribe(vehicles => {
      this.dataSource.data = vehicles;
    });

    // ── Synchronisation temps réel via SSE ────────────────────────
    this.notificationService.connectRealtime();
    this.notificationService.realtimeNotification$
      .pipe(takeUntil(this.destroy$))
      .subscribe(notification => {
        const cat = notification?.category;
        if (cat === 'NOTIF_VEHICULE' || cat === 'NOTIF_TRAJET') {
          this.fleetService.getVehicles().subscribe(vehicles => {
            this.dataSource.data = vehicles;
          });
        }
      });
  }

  ngAfterViewInit() {
    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;
  }

  applyFilter(event: Event) {
    const filterValue = (event.target as HTMLInputElement).value;
    this.dataSource.filter = filterValue.trim().toLowerCase();

    if (this.dataSource.paginator) {
      this.dataSource.paginator.firstPage();
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
