import { Component, OnInit, OnDestroy, ViewChild, AfterViewInit, ChangeDetectorRef, NgZone } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatTableModule, MatTableDataSource } from '@angular/material/table';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { MatSort, MatSortModule } from '@angular/material/sort';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators, AbstractControl, ValidationErrors } from '@angular/forms';
import { FleetService, Trip, Vehicle } from '../../core/services/fleet.service';
import { AuthService } from '../../core/auth.service';
import { NotificationService } from '../../core/services/notification.service';
import { BaseChartDirective } from 'ng2-charts';
import { ChartConfiguration, ChartOptions, ChartType } from 'chart.js';
import { PremiumSnackbarComponent } from '../../shared/components/premium-snackbar/premium-snackbar.component';
import { ConfirmDeleteDialogComponent } from '../../shared/components/confirm-delete-dialog/confirm-delete-dialog.component';
import * as L from 'leaflet';
import { Subject, takeUntil } from 'rxjs';

@Component({
  selector: 'app-trips',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatTableModule,
    MatIconModule,
    MatButtonModule,
    MatPaginatorModule,
    MatSortModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatSnackBarModule,
    MatDialogModule,
    MatTooltipModule,
    RouterLink,
    FormsModule,
    ReactiveFormsModule,
    BaseChartDirective
  ],
  templateUrl: './trips.component.html',
  styleUrls: ['./trips.component.css']
})
export class TripsComponent implements OnInit, AfterViewInit, OnDestroy {
  // ─── Existing table (preserved) ───
  displayedColumns: string[] = ['date', 'vehicle', 'from', 'to', 'driver', 'status', 'actions'];
  dataSource = new MatTableDataSource<Trip>([]);

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  // ─── Chart (preserved) ───
  public barChartOptions: ChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    indexAxis: 'x',
    scales: {
      x: {
        grid: { display: false },
        ticks: { color: '#94a3b8', font: { family: 'Outfit', size: 12 } }
      },
      y: {
        beginAtZero: true,
        grid: { color: 'rgba(255, 255, 255, 0.05)', drawOnChartArea: true },
        ticks: { color: '#94a3b8', stepSize: 1, font: { family: 'Outfit', size: 12 } }
      }
    },
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: '#1e293b',
        titleFont: { family: 'Outfit', size: 14, weight: 'bold' },
        bodyFont: { family: 'Outfit', size: 13 },
        padding: 12, cornerRadius: 8, displayColors: false,
        borderColor: 'rgba(59, 130, 246, 0.5)', borderWidth: 1
      }
    },
    animation: { duration: 2000, easing: 'easeOutQuart' }
  };
  public barChartType: ChartType = 'bar';
  public barChartData: ChartConfiguration['data'] = {
    labels: ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'],
    datasets: [{
      data: [0, 0, 0, 0, 0, 0, 0],
      label: 'Missions',
      backgroundColor: (context: any) => {
        const chart = context.chart;
        const { ctx, chartArea } = chart;
        if (!chartArea) return '#3b82f6';
        const gradient = ctx.createLinearGradient(0, chartArea.bottom, 0, chartArea.top);
        gradient.addColorStop(0, 'rgba(30, 58, 138, 0.8)');
        gradient.addColorStop(1, 'rgba(59, 130, 246, 1)');
        return gradient;
      },
      borderRadius: 6,
      hoverBackgroundColor: '#60a5fa',
      barThickness: 35
    }]
  };

  // ─── Form ───
  showModal = false;
  isEditMode = false;
  editingTripId: string | null = null;
  trajetForm!: FormGroup;

  // ─── Mini map ───
  private miniMap: L.Map | null = null;
  private miniMapTiles: { [key: string]: L.TileLayer } = {};
  private departMarker: L.Marker | null = null;
  private arriveeMarker: L.Marker | null = null;
  private routeLine: L.Polyline | null = null;
  private mapClickCount = 0;
  mapTileMode = 'standard';
  mapInstruction = 'Cliquez pour définir le départ, puis la destination';

  // ─── Select data ───
  drivers: { id: string; name: string }[] = [];
  vehiclePlates: { id: string; plate: string }[] = [];
  vehicleOptions: Vehicle[] = [];
  selectedVehicle: Vehicle | null = null;
  selectedVehicleDriverNote = 'Sélectionnez un camion pour charger son chauffeur.';
  statusOptions = [
    { value: 'En Cours', label: 'En Cours' },
    { value: 'Actif', label: 'Actif' },
    { value: 'Complété', label: 'Complété' }
  ];

  // ─── Role ───
  currentUser: { id: string; role: string; username: string } | null = null;
  isManager = false;
  today = new Date();
  private readonly destroy$ = new Subject<void>();

  constructor(
    private fleetService: FleetService,
    private authService: AuthService,
    private notificationService: NotificationService,
    private fb: FormBuilder,
    private snackBar: MatSnackBar,
    private dialog: MatDialog,
    private cdr: ChangeDetectorRef,
    private ngZone: NgZone
  ) {}

  ngOnInit(): void {
    this.authService.currentUser.pipe(takeUntil(this.destroy$)).subscribe(user => {
      this.currentUser = user;
      this.isManager = user?.role === 'SUPERADMIN' || user?.role === 'MANAGER';
      if (user) {
        this.loadTrips();
      }
    });

    this.notificationService.realtimeNotification$
      .pipe(takeUntil(this.destroy$))
      .subscribe(notification => {
        if (notification?.category === 'NOTIF_TRAJET' || notification?.category === 'NOTIF_VEHICULE') {
          this.loadTrips();
        }
      });

    this.loadTrips();

    this.initForm();
    this.fleetService.getDriversList().subscribe(d => this.drivers = d);
    this.fleetService.getVehiclesList().subscribe(v => this.vehiclePlates = v);
    this.fleetService.getVehicles().subscribe(v => this.vehicleOptions = v);
  }

  ngAfterViewInit(): void {
    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    this.destroyMiniMap();
  }

  private loadTrips(): void {
    this.fleetService.getTrips().pipe(takeUntil(this.destroy$)).subscribe(trips => {
      this.dataSource.data = [...trips];
      this.cdr.detectChanges();
    });

    this.fleetService.getTripStats().pipe(takeUntil(this.destroy$)).subscribe(stats => {
      this.barChartData = {
        ...this.barChartData,
        datasets: [{
          ...this.barChartData.datasets[0],
          data: Object.values(stats)
        }]
      };
      this.cdr.detectChanges();
    });
  }

  applyFilter(event: Event): void {
    const filterValue = (event.target as HTMLInputElement).value;
    this.dataSource.filter = filterValue.trim().toLowerCase();
    if (this.dataSource.paginator) {
      this.dataSource.paginator.firstPage();
    }
  }

  getActiveCount() {
      return this.dataSource.data.filter(t => t.status === 'Actif').length;
  }

  getInProgressCount() {
      return this.dataSource.data.filter(t => t.status === 'En Cours').length;
  }

  getCompletedCount() {
      return this.dataSource.data.filter(t => t.status === 'Complété' || t.status === 'Terminé').length;
  }

  // ═══════════════════════════════════════
  //  Form
  // ═══════════════════════════════════════

  private initForm(): void {
    this.trajetForm = this.fb.group({
      pointDepart: ['', Validators.required],
      destination: ['', Validators.required],
      dateDepart: [null, Validators.required],
      heureDepart: ['08:00', Validators.required],
      dateArrivee: [null, Validators.required],
      heureArrivee: ['18:00', Validators.required],
      statut: ['', Validators.required],
      IDChauffeur: ['', Validators.required],
      IDVehicule: ['', Validators.required],
    }, { validators: TripsComponent.dateRangeValidator });
  }

  static dateRangeValidator(group: AbstractControl): ValidationErrors | null {
    const start = group.get('dateDepart')?.value;
    const startTime = group.get('heureDepart')?.value || '00:00';
    const end = group.get('dateArrivee')?.value;
    const endTime = group.get('heureArrivee')?.value || '00:00';

    if (start && end) {
      const startDateTime = new Date(start);
      const endDateTime = new Date(end);
      const [startHours, startMinutes] = String(startTime).split(':').map(Number);
      const [endHours, endMinutes] = String(endTime).split(':').map(Number);
      startDateTime.setHours(Number.isFinite(startHours) ? startHours : 0, Number.isFinite(startMinutes) ? startMinutes : 0, 0, 0);
      endDateTime.setHours(Number.isFinite(endHours) ? endHours : 0, Number.isFinite(endMinutes) ? endMinutes : 0, 0, 0);

      if (endDateTime <= startDateTime) {
        return { dateRange: true };
      }
    }
    return null;
  }

  openCreate(): void {
    this.isEditMode = false;
    this.editingTripId = null;
    this.trajetForm.reset();
    this.selectedVehicle = null;
    this.drivers = [];
    this.selectedVehicleDriverNote = 'Sélectionnez un camion pour charger son chauffeur.';
    this.showModal = true;
    this.resetMapState();
    setTimeout(() => this.initMiniMap(), 250);
  }

  openEdit(trip: Trip): void {
    this.isEditMode = true;
    this.editingTripId = trip.id;
    this.showModal = true;
    const vehicleSelection = this.resolveVehicleSelectionId(trip.vehicleId || trip.vehicle);

    this.trajetForm.patchValue({
      pointDepart: trip.from,
      destination: trip.to,
      dateDepart: this.parseDateStr(trip.dateDepartIso || trip.date),
      heureDepart: this.extractTime(trip.dateDepartIso || trip.date) || '08:00',
      dateArrivee: trip.dateArriveeIso ? this.parseDateStr(trip.dateArriveeIso) : (trip.dateArrivee ? this.parseDateStr(trip.dateArrivee) : null),
      heureArrivee: trip.dateArriveeIso ? this.extractTime(trip.dateArriveeIso) || '18:00' : (trip.dateArrivee ? this.extractTime(trip.dateArrivee) || '18:00' : '18:00'),
      statut: trip.status,
      IDChauffeur: trip.driverId,
      IDVehicule: vehicleSelection,
    });

    setTimeout(() => {
      this.initMiniMap();
      this.tryPlacePinsFromText(trip.from, trip.to);
      this.onVehicleSelected(vehicleSelection);
    }, 300);
  }

  closeModal(): void {
    this.showModal = false;
    this.trajetForm.reset();
    this.selectedVehicle = null;
    this.drivers = [];
    this.selectedVehicleDriverNote = 'Sélectionnez un camion pour charger son chauffeur.';
    this.clearMapPins();
    this.destroyMiniMap();
  }

  onSubmit(): void {
    if (this.trajetForm.invalid) return;
    const v = this.trajetForm.value;
    const driverName = this.selectedVehicle?.driverName || this.drivers.find(d => d.id === v.IDChauffeur)?.name || '';
    const payload: Trip = {
      id: this.isEditMode && this.editingTripId ? this.editingTripId : `t${Date.now()}`,
      from: v.pointDepart,
      to: v.destination,
      date: this.combineDateAndTime(v.dateDepart, v.heureDepart),
      dateArrivee: v.dateArrivee ? this.combineDateAndTime(v.dateArrivee, v.heureArrivee) : undefined,
      status: v.statut,
      driverId: v.IDChauffeur,
      driver: driverName,
      vehicle: v.IDVehicule,
      vehicleId: v.IDVehicule,
      managerId: this.currentUser?.id || ''
    };

    if (this.isEditMode && this.editingTripId) {
      this.fleetService.updateTrip(this.editingTripId, payload).subscribe(updated => {
        const idx = this.dataSource.data.findIndex(t => t.id === this.editingTripId);
        if (idx > -1) {
          this.dataSource.data[idx] = updated;
          this.dataSource.data = [...this.dataSource.data];
        }
        this.showSnackbar('Trajet Modifié', 'Le trajet a été mis à jour avec succès.', 'success');
        this.closeModal();
      });
    } else {
      this.fleetService.addTrip(payload).subscribe(created => {
        this.dataSource.data = [...this.dataSource.data, created];
        this.showSnackbar('Trajet Enregistré', 'Le nouveau trajet a été enregistré avec succès.', 'success');
        this.closeModal();
      });
    }
  }

  onVehicleSelected(vehicleId: string): void {
    const normalizedVehicleId = this.resolveVehicleSelectionId(vehicleId);

    if (!normalizedVehicleId) {
      this.selectedVehicle = null;
      this.drivers = [];
      this.selectedVehicleDriverNote = 'Sélectionnez un camion pour charger son chauffeur.';
      this.trajetForm.patchValue({ IDChauffeur: '' });
      return;
    }

    vehicleId = normalizedVehicleId;

    if (!vehicleId) {
      this.selectedVehicle = null;
      this.drivers = [];
      this.selectedVehicleDriverNote = 'Sélectionnez un camion pour charger son chauffeur.';
      this.trajetForm.patchValue({ IDChauffeur: '' });
      return;
    }

    this.fleetService.getVehicleDetails(vehicleId).subscribe(vehicle => {
      this.selectedVehicle = vehicle;
      if (vehicle?.driverId && vehicle.driverName) {
        this.drivers = [{ id: vehicle.driverId, name: vehicle.driverName }];
        this.trajetForm.patchValue({ IDChauffeur: vehicle.driverId });
        this.selectedVehicleDriverNote = `Chauffeur affecté: ${vehicle.driverName}`;
      } else {
        this.drivers = [];
        this.trajetForm.patchValue({ IDChauffeur: '' });
        this.selectedVehicleDriverNote = 'Ce camion n’a pas encore de chauffeur affecté.';
      }
      this.cdr.markForCheck();
    });
  }

  private resolveVehicleSelectionId(value: string | null | undefined): string {
    if (!value) {
      return '';
    }

    const matched = this.vehicleOptions.find(vehicle => vehicle.id === value || vehicle.plate === value);
    return matched ? matched.id : value;
  }

  deleteTrip(trip: Trip): void {
    const dialogRef = this.dialog.open(ConfirmDeleteDialogComponent, {
      width: '400px',
      panelClass: 'glass-dialog',
      data: {
        title: 'Supprimer ce trajet ?',
        message: `Voulez-vous vraiment supprimer le trajet de <strong>${trip.from}</strong> vers <strong>${trip.to}</strong> ?<br><br>Cette action est irréversible.`
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.fleetService.deleteTrip(trip.id).subscribe(() => {
          this.dataSource.data = this.dataSource.data.filter(t => t.id !== trip.id);
          this.showSnackbar('Trajet Supprimé', `Le trajet de ${trip.from} vers ${trip.to} a été supprimé.`, 'warning');
        });
      }
    });
  }

  // ═══════════════════════════════════════
  //  Mini Leaflet Map
  // ═══════════════════════════════════════

  private initMiniMap(): void {
    this.destroyMiniMap();
    this.ngZone.runOutsideAngular(() => {
      const el = document.getElementById('trajet-mini-map');
      if (!el) return;

      this.miniMap = L.map('trajet-mini-map', {
        center: [36.8065, 10.1815],
        zoom: 7,
        zoomControl: true,
        attributionControl: true
      });

      this.miniMapTiles['standard'] = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { attribution: '&copy; OSM' });
      this.miniMapTiles['satellite'] = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', { attribution: '&copy; Esri' });
      this.miniMapTiles['terrain'] = L.tileLayer('https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png', { attribution: '&copy; OSM' });

      this.miniMapTiles['standard'].addTo(this.miniMap);

      this.miniMap.on('click', (e: L.LeafletMouseEvent) => {
        this.ngZone.run(() => this.handleMapClick(e));
      });

      setTimeout(() => this.miniMap?.invalidateSize(), 300);
    });
  }

  private handleMapClick(e: L.LeafletMouseEvent): void {
    if (!this.miniMap) return;
    const lat = e.latlng.lat.toFixed(5);
    const lng = e.latlng.lng.toFixed(5);

    if (this.mapClickCount === 0) {
      this.clearMapPins();
      this.departMarker = L.marker(e.latlng, { icon: this.pinIcon('Départ', '#10b981') }).addTo(this.miniMap);
      this.trajetForm.patchValue({ pointDepart: `${lat}, ${lng}` });
      this.mapClickCount = 1;
      this.mapInstruction = 'Cliquez pour définir la destination';
    } else if (this.mapClickCount === 1) {
      this.arriveeMarker = L.marker(e.latlng, { icon: this.pinIcon('Arrivée', '#ef4444') }).addTo(this.miniMap);
      this.trajetForm.patchValue({ destination: `${lat}, ${lng}` });
      if (this.departMarker) {
        this.routeLine = L.polyline([this.departMarker.getLatLng(), e.latlng], {
          color: '#3b82f6', weight: 3, dashArray: '8 8', opacity: 0.8
        }).addTo(this.miniMap);
      }
      this.mapClickCount = 2;
      this.mapInstruction = 'Cliquez pour réinitialiser les points';
    } else {
      this.clearMapPins();
      this.trajetForm.patchValue({ pointDepart: '', destination: '' });
      this.mapClickCount = 0;
      this.mapInstruction = 'Cliquez pour définir le départ, puis la destination';
    }
    this.cdr.markForCheck();
  }

  private pinIcon(label: string, color: string): L.DivIcon {
    return L.divIcon({
      html: `<div style="background:${color};color:#fff;padding:4px 10px;border-radius:12px;font-size:11px;font-weight:600;font-family:'Outfit',sans-serif;box-shadow:0 2px 8px ${color}66;white-space:nowrap;display:flex;align-items:center;gap:4px;">
        <span style="width:6px;height:6px;background:#fff;border-radius:50%;display:inline-block;"></span>${label}</div>`,
      className: 'trajet-pin-wrapper',
      iconSize: [80, 28],
      iconAnchor: [40, 28]
    });
  }

  changeTileMode(mode: string): void {
    if (!this.miniMap) return;
    Object.values(this.miniMapTiles).forEach(l => this.miniMap!.removeLayer(l));
    this.miniMapTiles[mode]?.addTo(this.miniMap);
    this.mapTileMode = mode;
  }

  private clearMapPins(): void {
    if (this.departMarker && this.miniMap) { this.miniMap.removeLayer(this.departMarker); this.departMarker = null; }
    if (this.arriveeMarker && this.miniMap) { this.miniMap.removeLayer(this.arriveeMarker); this.arriveeMarker = null; }
    if (this.routeLine && this.miniMap) { this.miniMap.removeLayer(this.routeLine); this.routeLine = null; }
  }

  private resetMapState(): void {
    this.mapClickCount = 0;
    this.mapInstruction = 'Cliquez pour définir le départ, puis la destination';
  }

  private destroyMiniMap(): void {
    this.clearMapPins();
    if (this.miniMap) { this.miniMap.remove(); this.miniMap = null; }
    this.miniMapTiles = {};
  }

  private tryPlacePinsFromText(from: string, to: string): void {
    if (!this.miniMap) return;
    const re = /^(-?\d+\.?\d*),\s*(-?\d+\.?\d*)$/;
    const fm = from.match(re);
    const tm = to.match(re);
    if (fm) {
      const ll = L.latLng(parseFloat(fm[1]), parseFloat(fm[2]));
      this.departMarker = L.marker(ll, { icon: this.pinIcon('Départ', '#10b981') }).addTo(this.miniMap);
      this.mapClickCount = 1;
    }
    if (tm) {
      const ll = L.latLng(parseFloat(tm[1]), parseFloat(tm[2]));
      this.arriveeMarker = L.marker(ll, { icon: this.pinIcon('Arrivée', '#ef4444') }).addTo(this.miniMap);
      this.mapClickCount = 2;
    }
    if (fm && tm && this.departMarker && this.arriveeMarker) {
      this.routeLine = L.polyline([this.departMarker.getLatLng(), this.arriveeMarker.getLatLng()], {
        color: '#3b82f6', weight: 3, dashArray: '8 8', opacity: 0.8
      }).addTo(this.miniMap);
      this.mapInstruction = 'Cliquez pour réinitialiser les points';
      this.miniMap.fitBounds(L.latLngBounds(this.departMarker.getLatLng(), this.arriveeMarker.getLatLng()).pad(0.3));
    }
  }

  // ═══════════════════════════════════════
  //  Helpers
  // ═══════════════════════════════════════

  private parseDateStr(dateStr: string): Date | null {
    if (!dateStr) return null;
    const direct = new Date(dateStr);
    if (!isNaN(direct.getTime())) {
      return direct;
    }

    const cleaned = dateStr.trim().replace(/\./g, '');
    const match = cleaned.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
    if (match) {
      return new Date(Number(match[3]), Number(match[2]) - 1, Number(match[1]));
    }

    const monthNames: Record<string, number> = {
      jan: 0, janv: 0, janvier: 0,
      fev: 1, fév: 1, fevr: 1, février: 1, fevrier: 1,
      mar: 2, mars: 2,
      avr: 3, avril: 3,
      mai: 4,
      jun: 5, juin: 5,
      jul: 6, juil: 6, juillet: 6,
      aou: 7, août: 7, aout: 7,
      sep: 8, sept: 8, septembre: 8,
      oct: 9, octobre: 9,
      nov: 10, novembre: 10,
      dec: 11, déc: 11, decembre: 11, décembre: 11
    };
    const parts = cleaned.toLowerCase().split(/\s+/);
    if (parts.length === 3) {
      const day = Number(parts[0]);
      const month = monthNames[parts[1]] ?? monthNames[parts[1].slice(0, 3)];
      const year = Number(parts[2]);
      if (!Number.isNaN(day) && month !== undefined && !Number.isNaN(year)) {
        return new Date(year, month, day);
      }
    }

    return null;
  }

  private extractTime(value: string): string | null {
    if (!value) {
      return null;
    }

    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) {
      return null;
    }

    return `${String(parsed.getHours()).padStart(2, '0')}:${String(parsed.getMinutes()).padStart(2, '0')}`;
  }

  private combineDateAndTime(dateValue: Date, timeValue: string): string {
    const [hours, minutes] = String(timeValue || '00:00').split(':').map(Number);
    const combined = new Date(dateValue);
    combined.setHours(Number.isFinite(hours) ? hours : 0, Number.isFinite(minutes) ? minutes : 0, 0, 0);
    return this.formatLocalDateTime(combined);
  }

  private formatLocalDateTime(value: Date): string {
    const year = value.getFullYear();
    const month = String(value.getMonth() + 1).padStart(2, '0');
    const day = String(value.getDate()).padStart(2, '0');
    const hours = String(value.getHours()).padStart(2, '0');
    const minutes = String(value.getMinutes()).padStart(2, '0');
    const seconds = String(value.getSeconds()).padStart(2, '0');
    return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}`;
  }

  getStatusClass(status: string): string {
    if (!status) return '';
    return status.toLowerCase().replace(/[\s_]+/g, '-');
  }

  private showSnackbar(title: string, message: string, type: 'success' | 'error' | 'warning' | 'info'): void {
    this.snackBar.openFromComponent(PremiumSnackbarComponent, {
      duration: 4000,
      verticalPosition: 'top',
      horizontalPosition: 'end',
      data: { title, message, type }
    });
  }
}
