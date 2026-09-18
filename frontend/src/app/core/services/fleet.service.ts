import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError, map, tap } from 'rxjs/operators';
import { AuthService } from '../auth.service';
import { VehiculeStatut } from '../../models/project.models';
import { AppConfigService } from './app-config.service';

export interface Vehicle {
    id: string;
    plate: string;
    model: string;
    status: string;
    nextCheck: string;
    managerId?: string;
    companyId?: string;
    companyName?: string;
    driverId?: string;
    driverName?: string;
    brand?: string;
    mileage?: number;
    capacity?: number;
    fuelConsumption?: number; // L/100km — consommation standard du véhicule
    managerPrenom?: string;
    managerNom?: string;
}

export interface AvailableDriver {
    id: string;
    prenom: string;
    nom: string;
    email: string;
}

export interface VehiclePayload {
    matricule: string;
    marque: string;
    modele: string;
    capacite: number;
    kilometrage?: number;
    statut: VehiculeStatut;
    entrepriseId: number;
    chauffeurId?: number | null;
}

export interface Trip {
    id: string;
    date: string;
    dateArrivee?: string;
    dateDepartIso?: string;
    dateArriveeIso?: string;
    vehicle: string;
    vehicleId?: string;
    from: string;
    to: string;
    driver: string;
    driverId: string;
    managerId: string;
    status: string;
    latitudeDepart?: number;
    longitudeDepart?: number;
    latitudeArrivee?: number;
    longitudeArrivee?: number;
    distanceKm?: number;
    dureeEstimeeMinutes?: number;
    dureeReelleMinutes?: number;
    retardMinutes?: number;
    statutPerformance?: string;
    geometrieItineraire?: string;
    priority?: string;
    driverEmail?: string;
    chauffeurNom?: string;
    vehiculeMatricule?: string;
}

export interface TripMapItem {
    id: string;
    pointDepart: string;
    destination: string;
    latitudeDepart?: number;
    longitudeDepart?: number;
    latitudeArrivee?: number;
    longitudeArrivee?: number;
    distanceKm?: number;
    dureeEstimeeMinutes?: number;
    geometrieItineraire?: string;
    statut?: string;
    vehiculeId?: string;
    vehiculeMatricule?: string;
    vehiculeCouleur?: string;
    vehiculeLatitude?: number;
    vehiculeLongitude?: number;
    vehiculeVitesse?: number;
    vehiculeNiveauCarburant?: number;
    chauffeurId?: string;
    chauffeurTelephone?: string;
    chauffeurNom?: string;
    chauffeurImage?: string;
    chauffeurRole?: string;
    chauffeurSecteur?: string;
    routePreference?: string;
    vehiculeChargeKg?: number;
    vehiculeKilometrage?: number;
    ecoScore?: number;
}

@Injectable({
    providedIn: 'root'
})
export class FleetService {
    private get apiBaseUrl(): string { return `${this.appConfig.apiUrl}/vehicules`; }
    private get trajetsApiUrl(): string { return `${this.appConfig.apiUrl}/trajets`; }
    private lastVehiclesCache: Vehicle[] = [];

    private vehicles: Vehicle[] = [];

    private trips: Trip[] = [];

    constructor(
        private authService: AuthService,
        private http: HttpClient,
        private appConfig: AppConfigService
    ) { }

    getVehicles(): Observable<Vehicle[]> {
        return this.http.get<any[]>(this.apiBaseUrl).pipe(
            map(vehicles => vehicles.map(vehicle => this.mapVehicle(vehicle))),
            tap(vehicles => {
                this.lastVehiclesCache = vehicles;
            }),
            catchError(() => this.getFallbackVehicles())
        );
    }

    getVehicle(id: string): Observable<Vehicle> {
        return this.http.get<any>(`${this.apiBaseUrl}/${id}`).pipe(
            map(vehicle => this.mapVehicle(vehicle))
        );
    }

    createVehicle(payload: VehiclePayload): Observable<Vehicle> {
        return this.http.post<any>(this.apiBaseUrl, payload).pipe(
            map(vehicle => this.mapVehicle(vehicle))
        );
    }

    updateVehicle(id: string, payload: Partial<VehiclePayload>): Observable<Vehicle> {
        return this.http.put<any>(`${this.apiBaseUrl}/${id}`, payload).pipe(
            map(vehicle => this.mapVehicle(vehicle))
        );
    }

    updateVehicleStatus(id: string, statut: VehiculeStatut): Observable<Vehicle> {
        return this.http.put<any>(`${this.apiBaseUrl}/${id}/status`, { statut }).pipe(
            map(vehicle => this.mapVehicle(vehicle))
        );
    }

    assignDriver(id: string, chauffeurId: number): Observable<Vehicle> {
        return this.http.put<any>(`${this.apiBaseUrl}/${id}/driver`, { chauffeurId }).pipe(
            map(vehicle => this.mapVehicle(vehicle))
        );
    }

    clearDriver(id: string): Observable<Vehicle> {
        return this.http.put<any>(`${this.apiBaseUrl}/${id}/driver/clear`, {}).pipe(
            map(vehicle => this.mapVehicle(vehicle))
        );
    }

    deleteVehicle(id: string): Observable<void> {
        return this.http.delete<void>(`${this.apiBaseUrl}/${id}`);
    }

    getAvailableDrivers(vehicleId: string): Observable<AvailableDriver[]> {
        return this.http.get<any[]>(`${this.apiBaseUrl}/${vehicleId}/available-drivers`).pipe(
            map(drivers => drivers.map(driver => ({
                id: String(driver.id),
                prenom: driver.prenom || '',
                nom: driver.nom || '',
                email: driver.email || ''
            }))),
            catchError(() => of([]))
        );
    }

    getTrips(): Observable<Trip[]> {
        return this.http.get<any>(`${this.trajetsApiUrl}?page=0&size=200`).pipe(
            map(response => Array.isArray(response) ? response : (response?.content ?? [])),
            map((trips: any[]) => trips.map((trip: any) => this.mapTrajet(trip))),
            tap(trips => {
                this.trips = trips;
            }),
            catchError(() => of(this.filterTripsForCurrentUser(this.trips)))
        );
    }

    getTripStats(): Observable<any> {
        return this.getTrips().pipe(
            map(trips => {
                const stats = {
                    'Lundi': 0, 'Mardi': 0, 'Mercredi': 0, 'Jeudi': 0, 'Vendredi': 0, 'Samedi': 0, 'Dimanche': 0
                };
                // Mock logic to distribute trips across days for histogram
                trips.forEach((t, i) => {
                    const days = Object.keys(stats);
                    stats[days[i % days.length] as keyof typeof stats]++;
                });
                return stats;
            })
        );
    }

    getDriversList(): Observable<{ id: string; name: string }[]> {
        const driverMap = new Map<string, string>();
        this.trips.forEach(t => driverMap.set(t.driverId, t.driver));
        return of(Array.from(driverMap, ([id, name]) => ({ id, name })));
    }

    getVehiclesList(): Observable<{ id: string; plate: string }[]> {
        return this.getVehicles().pipe(
            map(vehicles => vehicles.map(vehicle => ({ id: vehicle.id, plate: vehicle.plate })))
        );
    }

    getVehicleDetails(vehicleId: string): Observable<Vehicle | null> {
        if (!vehicleId) {
            return of(null);
        }

        return this.getVehicle(vehicleId).pipe(
            catchError(() => of(null))
        );
    }

    private getFallbackVehicles(): Observable<Vehicle[]> {
        if (this.lastVehiclesCache.length > 0) {
            return of(this.filterVehiclesForCurrentUser(this.lastVehiclesCache));
        }

        return of(this.filterVehiclesForCurrentUser(this.vehicles));
    }

    private filterVehiclesForCurrentUser(vehicles: Vehicle[]): Vehicle[] {
        const user = this.authService.getUser();
        if (!user) {
            return [];
        }

        if (user.role === 'SUPERADMIN') {
            return vehicles;
        }

        if (user.role === 'MANAGER') {
            const userCompanyId = user?.entrepriseId ?? user?.companyId ?? null;
            if (userCompanyId != null) {
                const byCompany = vehicles.filter(v => String(v.companyId ?? '') === String(userCompanyId));
                if (byCompany.length > 0) {
                    return byCompany;
                }
            }

            // Keep manager view usable during API/network issues when user company metadata is missing.
            return vehicles;
        }

        if (user.role === 'DRIVER') {
            const byDriverId = vehicles.filter(v => String(v.driverId ?? '') === String(user.id ?? ''));
            if (byDriverId.length > 0) {
                return byDriverId;
            }

            const fullName = `${user?.firstName || ''} ${user?.lastName || ''}`.trim().toLowerCase();
            if (fullName) {
                return vehicles.filter(v => (v.driverName || '').trim().toLowerCase() === fullName);
            }
        }

        return [];
    }

    private mapVehicle(vehicle: any): Vehicle {
        const status = this.formatStatus(vehicle?.statut);
        const model = [vehicle?.marque, vehicle?.modele].filter(Boolean).join(' ').trim();
        const companyId = vehicle?.entrepriseId ?? vehicle?.entreprise?.id ?? null;
        const managerId = vehicle?.managerId ?? vehicle?.entreprise?.managerOwnerId ?? null;
        const companyName = vehicle?.entrepriseNom ?? vehicle?.entreprise?.nomEntreprise ?? undefined;
        const driverId = vehicle?.chauffeurId ?? vehicle?.chauffeurActuelId ?? vehicle?.chauffeurActuel?.id ?? null;
        const driverName = vehicle?.chauffeurNom
            || (vehicle?.chauffeurActuel ? `${vehicle.chauffeurActuel.prenom || ''} ${vehicle.chauffeurActuel.nom || ''}`.trim() : undefined)
            || undefined;
        const managerPrenom = vehicle?.managerPrenom ?? undefined;
        const managerNom = vehicle?.managerNom ?? undefined;

        return {
            id: String(vehicle?.id ?? ''),
            plate: vehicle?.matricule ?? vehicle?.plate ?? '',
            model: model || vehicle?.modele || '',
            status,
            nextCheck: vehicle?.kilometrage != null ? `${vehicle.kilometrage} km` : 'N/A',
            managerId: managerId != null ? String(managerId) : undefined,
            companyId: companyId != null ? String(companyId) : undefined,
            companyName,
            driverId: driverId != null ? String(driverId) : undefined,
            driverName,
            brand: vehicle?.marque,
            mileage: vehicle?.kilometrage ?? undefined,
            capacity: vehicle?.capacite ?? undefined,
            fuelConsumption: vehicle?.consommationL100Km ?? vehicle?.fuelConsumption ?? undefined,
            managerPrenom,
            managerNom
        };
    }

    private formatStatus(status: string | undefined): string {
        switch ((status ?? '').toUpperCase()) {
            case 'EN_SERVICE':
                return 'En Service';
            case 'EN_MAINTENANCE':
                return 'Maintenance';
            case 'HORS_SERVICE':
                return 'Hors Service';
            default:
                return status ?? 'Inconnu';
        }
    }

    /**
     * Récupère les trajets du manager connecté
     * Filtre par son entreprise pour éviter les données croisées
     */
    getManagerTrips(): Observable<Trip[]> {
        return this.getTrips().pipe(
            map(trips => this.filterTripsForCurrentUser(trips))
        );
    }

    getTripsCarte(): Observable<TripMapItem[]> {
        return this.http.get<any[]>(`${this.trajetsApiUrl}/carte`).pipe(
            map((trajets: any[]) => trajets.map((trajet: any) => ({
                id: String(trajet?.id ?? ''),
                pointDepart: trajet?.pointDepart ?? '',
                destination: trajet?.destination ?? '',
                latitudeDepart: trajet?.latitudeDepart ?? undefined,
                longitudeDepart: trajet?.longitudeDepart ?? undefined,
                latitudeArrivee: trajet?.latitudeArrivee ?? undefined,
                longitudeArrivee: trajet?.longitudeArrivee ?? undefined,
                distanceKm: trajet?.distanceKm ?? undefined,
                dureeEstimeeMinutes: trajet?.dureeEstimeeMinutes ?? undefined,
                geometrieItineraire: trajet?.geometrieItineraire ?? undefined,
                statut: this.mapStatutTrajet(trajet?.statut),
                vehiculeId: trajet?.vehiculeId != null ? String(trajet.vehiculeId) : undefined,
                vehiculeMatricule: trajet?.vehiculeMatricule ?? undefined,
                vehiculeCouleur: trajet?.vehiculeCouleur ?? undefined,
                vehiculeLatitude: trajet?.vehiculeLatitude ?? undefined,
                vehiculeLongitude: trajet?.vehiculeLongitude ?? undefined,
                vehiculeVitesse: trajet?.vehiculeVitesse ?? undefined,
                vehiculeNiveauCarburant: trajet?.vehiculeNiveauCarburant ?? undefined,
                chauffeurId: trajet?.chauffeurId != null ? String(trajet.chauffeurId) : undefined,
                chauffeurTelephone: trajet?.chauffeurTelephone ?? undefined,
                chauffeurNom: trajet?.chauffeurNom ?? undefined
                , chauffeurImage: trajet?.chauffeurImage ?? undefined,
                chauffeurRole: trajet?.chauffeurRole ?? undefined,
                chauffeurSecteur: trajet?.chauffeurSecteur ?? undefined,
                routePreference: trajet?.routePreference ?? undefined,
                vehiculeChargeKg: trajet?.vehiculeChargeKg ?? undefined,
                vehiculeKilometrage: trajet?.vehiculeKilometrage ?? undefined,
                ecoScore: trajet?.ecoScore ?? undefined
            }))),
            catchError(() => of([]))
        );
    }

    /**
     * Récupère le nombre de trajets pour un secteur
     */
    getTrajetsCountBySecteur(secteurId: number): Observable<number> {
        return this.http.get<number>(`${this.trajetsApiUrl}/secteur/${secteurId}/count`).pipe(
            catchError(() => of(0))
        );
    }

    private mapTrajet(trajet: any): Trip {
        const dateDepart = trajet?.dateDepart ? new Date(trajet.dateDepart) : null;
        const dateArrivee = trajet?.dateArrivee ? new Date(trajet.dateArrivee) : null;
        return {
            id: String(trajet?.id ?? ''),
            date: dateDepart ? dateDepart.toLocaleString('fr-FR', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            }) : '',
            dateArrivee: dateArrivee ? dateArrivee.toLocaleString('fr-FR', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            }) : undefined,
            dateDepartIso: trajet?.dateDepart ?? undefined,
            dateArriveeIso: trajet?.dateArrivee ?? undefined,
            vehicle: trajet?.vehicule?.matricule ?? trajet?.vehiculeMatricule ?? trajet?.vehicule?.marque ?? 'N/A',
            vehicleId: trajet?.vehicule?.id != null ? String(trajet.vehicule.id) : undefined,
            vehiculeMatricule: trajet?.vehicule?.matricule ?? trajet?.vehiculeMatricule ?? undefined,
            from: trajet?.pointDepart ?? '',
            to: trajet?.destination ?? '',
            driver: trajet?.chauffeur
                ? `${trajet.chauffeur.prenom ?? ''} ${trajet.chauffeur.nom ?? ''}`.trim()
                : (trajet?.chauffeurNom ?? 'N/A'),
            chauffeurNom: trajet?.chauffeur
                ? `${trajet.chauffeur.prenom ?? ''} ${trajet.chauffeur.nom ?? ''}`.trim()
                : (trajet?.chauffeurNom ?? undefined),
            // ── CORRECTIF : le backend /api/trajets renvoie chauffeurId à plat
            //    ET parfois l'objet chauffeur imbriqué ; on lit les deux. ──────
            driverId: String(trajet?.chauffeur?.id ?? trajet?.chauffeurId ?? ''),
            managerId: String(trajet?.manager?.id ?? trajet?.managerId ?? ''),
            status: this.mapStatutTrajet(trajet?.statut),
            driverEmail: trajet?.chauffeur?.email ?? undefined,
            distanceKm: trajet?.distanceKm ?? undefined,
            dureeEstimeeMinutes: trajet?.dureeEstimeeMinutes ?? undefined,
            dureeReelleMinutes: trajet?.dureeReelleMinutes ?? undefined,
            retardMinutes: trajet?.retardMinutes ?? undefined,
            statutPerformance: trajet?.statutPerformance ?? undefined
        };
    }

    private mapStatutTrajet(statut: string): string {
        switch ((statut ?? '').toUpperCase()) {
            case 'EN_COURS':
                return 'En Cours';
            case 'ACTIF':
                return 'Actif';
            case 'TERMINE':
            case 'COMPLETE':
                return 'Terminé';
            case 'PLANIFIE':
                return 'Planifié';
            case 'ANNULE':
                return 'Annulé';
            default:
                return statut ?? 'Inconnu';
        }
    }

    addTrip(trip: Trip): Observable<Trip> {
        const payload = this.toTrajetPayload(trip);
        return this.http.post<any>(this.trajetsApiUrl, payload).pipe(
            map(created => this.mapTrajet(created)),
            catchError(() => {
                this.trips.push(trip);
                return of(trip);
            })
        );
    }

    updateTrip(id: string, updates: Partial<Trip>): Observable<Trip> {
        const idx = this.trips.findIndex(t => t.id === id);
        if (idx > -1) {
            this.trips[idx] = { ...this.trips[idx], ...updates };
        }
        const payload = this.toTrajetPayload({ ...(this.trips[idx] ?? updates), id } as Trip);
        return this.http.put<any>(`${this.trajetsApiUrl}/${id}`, payload).pipe(
            map(updated => this.mapTrajet(updated)),
            catchError(() => of(this.trips[idx]))
        );
    }

    deleteTrip(id: string): Observable<void> {
        this.trips = this.trips.filter(t => t.id !== id);
        return this.http.delete<void>(`${this.trajetsApiUrl}/${id}`).pipe(
            catchError(() => of(void 0))
        );
    }

    private filterTripsForCurrentUser(trips: Trip[]): Trip[] {
        const user = this.authService.getUser();
        if (!user) {
            return [];
        }

        if (user.role === 'SUPERADMIN') {
            return trips;
        }

        // Le backend filtre déjà par rôle côté serveur — ce filtre client-side
        // est uniquement utilisé en fallback réseau (cache local).
        // Le backend renvoie uniquement les trajets visibles pour l'utilisateur connecté,
        // donc on retourne tous les trajets reçus sans re-filtrer.
        return trips;
    }

    private toTrajetPayload(trip: Trip): any {
        return {
            pointDepart: trip.from,
            destination: trip.to,
            dateDepart: this.parseDisplayDate(trip.date),
            dateArrivee: trip.dateArrivee ? this.parseDisplayDate(trip.dateArrivee) : null,
            chauffeurId: trip.driverId ? Number(trip.driverId) : null,
            vehiculeId: trip.vehicleId ? Number(trip.vehicleId) : this.resolveVehicleId(trip.vehicle),
            managerId: trip.managerId ? Number(trip.managerId) : null,
            statut: this.mapTripStatusToBackend(trip.status),
            priorite: trip.priority ?? 'NORMALE'
        };
    }

    private resolveVehicleId(vehicleValue: string): number | null {
        if (!vehicleValue) {
            return null;
        }

        const numericValue = Number(vehicleValue);
        if (!Number.isNaN(numericValue) && String(numericValue) === vehicleValue.trim()) {
            return numericValue;
        }

        const resolved = this.lastVehiclesCache.find(vehicle => vehicle.plate === vehicleValue || vehicle.id === vehicleValue);
        return resolved ? Number(resolved.id) : null;
    }

    private parseDisplayDate(value: string): string | null {
        if (!value) {
            return null;
        }

        const trimmed = value.trim();
        const directDate = new Date(trimmed);
        if (!Number.isNaN(directDate.getTime())) {
            return this.formatLocalDateTime(directDate);
        }

        const isoLike = trimmed.match(/^\d{4}-\d{2}-\d{2}[ T]\d{2}:\d{2}(:\d{2})?(\.\d+)?(Z|[+-]\d{2}:?\d{2})?$/);
        if (isoLike) {
            const parsed = new Date(trimmed);
            if (!Number.isNaN(parsed.getTime())) {
                return this.formatLocalDateTime(parsed);
            }
        }

        const frenchMonths: Record<string, number> = {
            jan: 0, janv: 0,
            fev: 1, fév: 1, fevr: 1, févr: 1,
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

        const match = trimmed.toLowerCase()
            .replace(/\./g, '')
            .match(/^(\d{1,2})\s+([a-zéûîôàäëïöüç]+)\s+(\d{4})$/i);

        if (match) {
            const day = Number(match[1]);
            const monthToken = match[2].slice(0, 4);
            const year = Number(match[3]);
            const month = frenchMonths[monthToken] ?? frenchMonths[match[2].slice(0, 3)] ?? null;
            if (month !== null) {
                return new Date(Date.UTC(year, month, day)).toISOString();
            }
        }

        return null;
    }

    combineDateAndTime(dateValue: Date | null, timeValue: string | null | undefined): string | null {
        if (!dateValue) {
            return null;
        }

        const normalizedTime = (timeValue || '00:00').trim();
        const [hoursPart, minutesPart] = normalizedTime.split(':');
        const hours = Number(hoursPart ?? 0);
        const minutes = Number(minutesPart ?? 0);
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

    private mapTripStatusToBackend(status: string): string {
        switch ((status ?? '').toLowerCase()) {
            case 'en cours':
                return 'EN_COURS';
            case 'terminé':
            case 'termine':
            case 'complété':
            case 'complete':
                return 'COMPLETE';
            case 'actif':
                return 'ACTIF';
            default:
                return 'ACTIF';
        }
    }

}
