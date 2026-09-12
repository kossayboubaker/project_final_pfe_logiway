from __future__ import annotations

import json
import os
from typing import Any

from trip_route_utils import BACKEND_URL, OSRM_URL, fetch_trips, resolve_route, route_total_distance_km

CO2_PER_TON_KM = float(os.getenv("CO2_PER_TON_KM", "0.115"))
DEFAULT_SPEED = float(os.getenv("DEFAULT_SPEED_KMH", "70"))
SPEED_OPTIONS = [60, 70, 80]


def estimate_weight_tons(trip: dict[str, Any]) -> float:
    charge_kg = trip.get("chargeKg")
    if charge_kg is not None:
        try:
            return max(1.0, float(charge_kg) / 1000.0)
        except Exception:
            pass

    vehicle_capacity = trip.get("vehiculeCapacite") or trip.get("capacity")
    if vehicle_capacity is not None:
        try:
            return max(1.0, float(vehicle_capacity) / 1000.0)
        except Exception:
            pass

    return 1.0


def calculate_emission(weight_tons: float, distance_km: float, speed_kmh: float) -> float:
    base_emission = distance_km * weight_tons * CO2_PER_TON_KM
    speed_factor = 1 + (speed_kmh - DEFAULT_SPEED) * 0.01
    return base_emission * speed_factor


def fetch_trip_distance(trip: dict[str, Any]) -> tuple[float | None, list[list[float]] | None]:
    route_context = resolve_route(trip, osrm_url=OSRM_URL)
    if not route_context:
        return None, None

    if route_context.distance_km is not None:
        return float(route_context.distance_km), route_context.route

    return route_total_distance_km(route_context.route), route_context.route


def optimize_trip_routes() -> list[dict[str, Any]]:
    trips = fetch_trips(BACKEND_URL)
    optimized: list[dict[str, Any]] = []

    for trip in trips:
        if str(trip.get("statut") or "").strip().lower() not in {"en cours", "actif", "en_cours", "active", "in_progress"}:
            continue

        distance_km, route = fetch_trip_distance(trip)
        if not distance_km:
            continue

        weight_tons = estimate_weight_tons(trip)
        emissions_by_speed = {speed: calculate_emission(weight_tons, distance_km, speed) for speed in SPEED_OPTIONS}
        best_speed = min(emissions_by_speed, key=emissions_by_speed.get)

        optimized.append({
            "trip_id": trip.get("id"),
            "vehicle_id": trip.get("vehiculeId"),
            "driver_id": trip.get("chauffeurId"),
            "pointDepart": trip.get("pointDepart"),
            "destination": trip.get("destination"),
            "latitudeDepart": trip.get("latitudeDepart"),
            "longitudeDepart": trip.get("longitudeDepart"),
            "latitudeArrivee": trip.get("latitudeArrivee"),
            "longitudeArrivee": trip.get("longitudeArrivee"),
            "distance_km": round(float(distance_km), 2),
            "weight_tons": round(weight_tons, 2),
            "best_speed_kmh": best_speed,
            "emissions_kg": round(emissions_by_speed[best_speed], 2),
            "geometrieItineraire": {"type": "LineString", "coordinates": route or []},
        })

    return optimized


if __name__ == "__main__":
    results = optimize_trip_routes()
    print(json.dumps(results, ensure_ascii=False, indent=2))
