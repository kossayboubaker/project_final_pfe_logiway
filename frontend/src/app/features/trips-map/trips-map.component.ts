import { Component, OnDestroy, OnInit, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import * as L from 'leaflet';
import { FleetService, TripMapItem } from '../../core/services/fleet.service';

@Component({
    selector: 'app-trips-map',
    standalone: true,
    imports: [CommonModule, RouterLink, MatCardModule, MatButtonModule, MatIconModule],
    templateUrl: './trips-map.component.html',
    styleUrls: ['./trips-map.component.css']
})
export class TripsMapComponent implements OnInit, AfterViewInit, OnDestroy {
    trips: TripMapItem[] = [];
    activeTrips: TripMapItem[] = [];
    private map: L.Map | null = null;
    private layers: L.Layer[] = [];
    private vehicleMarkers: L.Marker[] = [];
    private tripMarkers: L.Marker[] = [];
    private refreshTimer: number | null = null;

    constructor(private fleetService: FleetService) { }

    ngOnInit(): void {
        this.loadTrips();
        this.refreshTimer = window.setInterval(() => this.loadTrips(), 10000);
    }

    ngAfterViewInit(): void {
        this.initMap();
        this.renderTrips();
    }

    ngOnDestroy(): void {
        if (this.refreshTimer) {
            window.clearInterval(this.refreshTimer);
        }
        this.destroyMap();
    }

    private loadTrips(): void {
        this.fleetService.getTripsCarte().subscribe(items => {
            this.trips = items.filter(item => item.statut === 'En Cours' || item.statut === 'Actif' || item.statut === 'ACTIF');
            this.activeTrips = this.trips;
            this.renderTrips();
        });
    }

    private initMap(): void {
        if (this.map) {
            return;
        }

        this.map = L.map('trips-live-map', {
            center: [36.8065, 10.1815],
            zoom: 7,
            zoomControl: true,
            attributionControl: true
        });

        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '&copy; OpenStreetMap contributors'
        }).addTo(this.map);

        setTimeout(() => this.map?.invalidateSize(true), 250);
    }

    private renderTrips(): void {
        if (!this.map) {
            return;
        }

        this.layers.forEach(layer => this.map?.removeLayer(layer));
        this.layers = [];
        this.vehicleMarkers.forEach(marker => marker.remove());
        this.tripMarkers.forEach(marker => marker.remove());
        this.vehicleMarkers = [];
        this.tripMarkers = [];

        const bounds: L.LatLngExpression[] = [];
        this.trips.forEach(trip => {
            if (trip.statut !== 'En Cours' && trip.statut !== 'Actif' && trip.statut !== 'ACTIF') {
                return;
            }

            const color = trip.vehiculeCouleur || '#3b82f6';
            const route = this.buildRouteLayer(trip, color);
            if (route) {
                route.addTo(this.map!);
                this.layers.push(route);
            }

            const startCoords = this.resolveStartPoint(trip);
            const endCoords = this.resolveEndPoint(trip);
            const vehicleCoords = this.resolveVehiclePoint(trip, startCoords, endCoords);

            if (startCoords) {
                const startMarker = L.marker(startCoords, { icon: this.pointIcon('Départ', '#16a34a') }).addTo(this.map!);
                startMarker.bindPopup(this.pointPopup('Point de départ', trip.pointDepart || 'Départ', trip));
                this.tripMarkers.push(startMarker);
                this.layers.push(startMarker);
                bounds.push(startCoords);
            }

            if (endCoords) {
                const endMarker = L.marker(endCoords, { icon: this.pointIcon('Arrivée', '#ef4444') }).addTo(this.map!);
                endMarker.bindPopup(this.pointPopup('Point d’arrivée', trip.destination || 'Arrivée', trip));
                this.tripMarkers.push(endMarker);
                this.layers.push(endMarker);
                bounds.push(endCoords);
            }

            if (vehicleCoords) {
                const vehicleMarker = L.marker(vehicleCoords, {
                    icon: this.tripIcon(trip)
                }).addTo(this.map!);
                vehicleMarker.bindPopup(this.tripPopup(trip));
                vehicleMarker.on('mouseover', () => vehicleMarker.openPopup());
                vehicleMarker.on('mouseout', () => vehicleMarker.closePopup());
                this.vehicleMarkers.push(vehicleMarker);
                this.layers.push(vehicleMarker);
                bounds.push(vehicleCoords);
            }
        });

        if (bounds.length > 1) {
            this.map.fitBounds(bounds as L.LatLngBoundsExpression, { padding: [24, 24] });
        }

        setTimeout(() => this.map?.invalidateSize(true), 50);
    }

    private buildRouteLayer(trip: TripMapItem, color: string): L.Polyline | null {
        if (!trip.geometrieItineraire) {
            return null;
        }

        try {
            const parsed = JSON.parse(trip.geometrieItineraire);
            const geometry = parsed?.type === 'FeatureCollection'
                ? parsed?.features?.[0]?.geometry
                : parsed?.type === 'Feature'
                    ? parsed?.geometry
                    : parsed?.geometry ?? parsed;
            const coordinates = geometry?.coordinates?.map((coord: number[]) => [coord[1], coord[0]]) ?? [];
            if (coordinates.length < 2) {
                return null;
            }
            return L.polyline(coordinates, { color, weight: 5, opacity: 0.8 });
        } catch {
            return null;
        }
    }

    private tripIcon(trip: TripMapItem): L.DivIcon {
        const color = trip.vehiculeCouleur || '#2563eb';
        return L.divIcon({
            html: `<div style="background:${color};color:#fff;padding:6px 10px;border-radius:999px;font-size:11px;font-weight:700;box-shadow:0 8px 20px ${color}55;white-space:nowrap;display:flex;align-items:center;gap:6px;"><span style="width:7px;height:7px;background:#fff;border-radius:50%;display:inline-block;"></span>${trip.vehiculeMatricule || 'Véhicule'}</div>`,
            className: 'trip-map-pin',
            iconSize: [110, 32],
            iconAnchor: [55, 32]
        });
    }

    private pointIcon(label: string, color: string): L.DivIcon {
        return L.divIcon({
            html: `<div style="background:${color};color:#fff;padding:5px 9px;border-radius:999px;font-size:11px;font-weight:700;box-shadow:0 8px 20px ${color}55;white-space:nowrap;display:flex;align-items:center;gap:6px;"><span style="width:7px;height:7px;background:#fff;border-radius:50%;display:inline-block;"></span>${label}</div>`,
            className: 'trip-map-point',
            iconSize: [100, 30],
            iconAnchor: [50, 30]
        });
    }

    private tripPopup(trip: TripMapItem): string {
        return `
            <div style="min-width:240px;line-height:1.45">
                <strong>${trip.vehiculeMatricule || 'Véhicule'}</strong><br>
                <span>${trip.chauffeurNom || 'Chauffeur non renseigné'}</span><br>
                <span>${trip.pointDepart || 'Départ N/A'} → ${trip.destination || 'Arrivée N/A'}</span><br>
                <span>Status: ${trip.statut || 'Inconnu'}</span><br>
                <span>Vitesse: ${trip.vehiculeVitesse != null ? `${trip.vehiculeVitesse} km/h` : 'N/A'}</span><br>
                <span>Distance: ${trip.distanceKm != null ? `${trip.distanceKm.toFixed(1)} km` : 'N/A'}</span>
            </div>
        `;
    }

    private pointPopup(title: string, value: string, trip: TripMapItem): string {
        return `
            <div style="min-width:220px;line-height:1.45">
                <strong>${title}</strong><br>
                <span>${value}</span><br>
                <span>${trip.vehiculeMatricule || 'Véhicule'} • ${trip.chauffeurNom || 'Chauffeur N/A'}</span>
            </div>
        `;
    }

    private resolveStartPoint(trip: TripMapItem): L.LatLngExpression | null {
        if (trip.latitudeDepart != null && trip.longitudeDepart != null) {
            return [trip.latitudeDepart, trip.longitudeDepart];
        }

        if (trip.geometrieItineraire) {
            try {
                const parsed = JSON.parse(trip.geometrieItineraire);
                const coords = parsed?.coordinates;
                if (Array.isArray(coords) && coords.length > 0) {
                    const first = coords[0];
                    return [first[1], first[0]];
                }
            } catch {
                return null;
            }
        }

        return null;
    }

    private resolveEndPoint(trip: TripMapItem): L.LatLngExpression | null {
        if (trip.latitudeArrivee != null && trip.longitudeArrivee != null) {
            return [trip.latitudeArrivee, trip.longitudeArrivee];
        }

        if (trip.geometrieItineraire) {
            try {
                const parsed = JSON.parse(trip.geometrieItineraire);
                const coords = parsed?.coordinates;
                if (Array.isArray(coords) && coords.length > 0) {
                    const last = coords[coords.length - 1];
                    return [last[1], last[0]];
                }
            } catch {
                return null;
            }
        }

        return null;
    }

    private resolveVehiclePoint(trip: TripMapItem, startCoords: L.LatLngExpression | null, endCoords: L.LatLngExpression | null): L.LatLngExpression | null {
        if (trip.vehiculeLatitude != null && trip.vehiculeLongitude != null) {
            return [trip.vehiculeLatitude, trip.vehiculeLongitude];
        }

        if (trip.vehiculeVitesse != null && trip.vehiculeVitesse === 0) {
            return endCoords || startCoords;
        }

        return startCoords || endCoords;
    }

    private destroyMap(): void {
        this.vehicleMarkers.forEach(marker => marker.remove());
        this.tripMarkers.forEach(marker => marker.remove());
        this.vehicleMarkers = [];
        this.tripMarkers = [];
        this.layers.forEach(layer => this.map?.removeLayer(layer));
        this.layers = [];
        if (this.map) {
            this.map.remove();
            this.map = null;
        }
    }
}