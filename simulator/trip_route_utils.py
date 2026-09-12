from __future__ import annotations

import json
import math
import os
import random
import time
from dataclasses import dataclass
from datetime import datetime, timedelta
from typing import Any, Iterable, Sequence

import requests

BACKEND_URL = os.getenv("BACKEND_URL", "http://localhost:8080")
OSRM_URL = os.getenv("OSRM_URL", "http://router.project-osrm.org")
DEFAULT_STEP_SECONDS = float(os.getenv("SIMULATION_STEP_SECONDS", "2.5"))
DEFAULT_SPEED_KMH = float(os.getenv("SIMULATION_SPEED_KMH", "55"))
TUNIS_TIMEZONE = os.getenv("SIMULATION_TIMEZONE", "Africa/Tunis")
WEATHER_REFRESH_SECONDS = float(os.getenv("SIMULATION_WEATHER_REFRESH_SECONDS", "300"))

ACTIVE_STATUSES = {"EN_COURS", "ACTIF", "En Cours", "Actif", "in_progress", "IN_PROGRESS"}


@dataclass
class RouteContext:
    trip: dict[str, Any]
    route: list[list[float]]
    distance_km: float | None = None
    duration_minutes: int | None = None


def _now_iso() -> str:
    return datetime.now().isoformat(timespec="seconds")


def _safe_json_loads(value: Any) -> Any:
    if isinstance(value, str):
        try:
            return json.loads(value)
        except Exception:
            return value
    return value


def _coerce_lon_lat(value: Any) -> list[float] | None:
    if isinstance(value, dict):
        lon = value.get("lon", value.get("lng", value.get("longitude")))
        lat = value.get("lat", value.get("latitude"))
        if lon is not None and lat is not None:
            return [float(lon), float(lat)]
        coordinates = value.get("coordinates")
        if isinstance(coordinates, (list, tuple)) and len(coordinates) >= 2:
            return [float(coordinates[0]), float(coordinates[1])]
        return None

    if isinstance(value, (list, tuple)) and len(value) >= 2:
        return [float(value[0]), float(value[1])]

    return None


def parse_route_geometry(value: Any) -> list[list[float]] | None:
    value = _safe_json_loads(value)
    if value is None:
        return None

    if isinstance(value, list):
        if not value:
            return None
        if isinstance(value[0], dict):
            coords: list[list[float]] = []
            for point in value:
                coord = _coerce_lon_lat(point)
                if coord is not None:
                    coords.append(coord)
            return coords if len(coords) >= 2 else None
        if isinstance(value[0], (list, tuple)) and len(value[0]) >= 2:
            return [[float(point[0]), float(point[1])] for point in value if isinstance(point, (list, tuple)) and len(point) >= 2]
        return None

    if isinstance(value, dict):
        if value.get("type") == "FeatureCollection":
            features = value.get("features") or []
            if features:
                return parse_route_geometry(features[0].get("geometry"))
        if value.get("type") == "Feature":
            return parse_route_geometry(value.get("geometry"))

        coordinates = value.get("coordinates")
        if isinstance(coordinates, list) and len(coordinates) >= 2:
            return [[float(point[0]), float(point[1])] for point in coordinates if isinstance(point, (list, tuple)) and len(point) >= 2]

    return None


def _extract_trip_point(trip: dict[str, Any], coord_keys: Sequence[str] = (), name_keys: Sequence[str] = ()) -> list[float] | None:
    for key in coord_keys:
        coord = _coerce_lon_lat(trip.get(key))
        if coord is not None:
            return coord

    for key in name_keys:
        label = trip.get(key)
        if isinstance(label, str) and label:
            return parse_named_location(label)

    return None


NAMED_LOCATIONS = {
    "Tunis": [10.1815, 36.8065],
    "Ariana": [10.1877, 36.8625],
    "Ben Arous": [10.2180, 36.7538],
    "Manouba": [10.0982, 36.8081],
    "Nabeul": [10.7376, 36.4512],
    "Zaghouan": [10.1420, 36.4027],
    "Bizerte": [9.8739, 37.2744],
    "Beja": [9.1848, 36.7256],
    "Jendouba": [8.7802, 36.5011],
    "Kef": [8.7058, 36.1824],
    "Siliana": [9.3708, 36.0857],
    "Sousse": [10.6360, 35.8256],
    "Monastir": [10.8262, 35.7643],
    "Mahdia": [11.0622, 35.5047],
    "Kairouan": [10.0974, 35.6781],
    "Kasserine": [8.8368, 35.1676],
    "Sidi Bouzid": [9.4840, 35.0380],
    "Sfax": [10.7603, 34.7406],
    "Gafsa": [8.7757, 34.4250],
    "Tozeur": [8.1335, 33.9197],
    "Kebili": [8.9720, 33.7048],
    "Gabes": [10.0982, 33.8815],
    "Medenine": [10.5034, 33.3549],
    "Tataouine": [10.4518, 32.9304],
}


def parse_named_location(label: str) -> list[float] | None:
    normalized = label.strip()
    if normalized in NAMED_LOCATIONS:
        return NAMED_LOCATIONS[normalized]
    lowered = normalized.lower()
    for key, value in NAMED_LOCATIONS.items():
        if key.lower() == lowered:
            return value
    return None


def fetch_trips(base_url: str = BACKEND_URL) -> list[dict[str, Any]]:
    response = requests.get(f"{base_url}/api/trajets/carte", timeout=20)
    response.raise_for_status()
    data = response.json()
    return data if isinstance(data, list) else []


def select_trip(trips: list[dict[str, Any]], trip_id: str | None = None, vehicle_id: str | None = None, driver_id: str | None = None) -> dict[str, Any] | None:
    if trip_id:
        for trip in trips:
            if str(trip.get("id")) == str(trip_id):
                return trip

    if vehicle_id:
        for trip in trips:
            if str(trip.get("vehiculeId")) == str(vehicle_id):
                return trip

    if driver_id:
        for trip in trips:
            if str(trip.get("chauffeurId")) == str(driver_id):
                return trip

    for trip in trips:
        if str(trip.get("statut") or "").strip() in ACTIVE_STATUSES:
            return trip

    return trips[0] if trips else None


def resolve_trip_start(trip: dict[str, Any]) -> list[float] | None:
    return _extract_trip_point(
        trip,
        coord_keys=("start", "startPoint", "pointDepart", "latitudeDepartLongitudeDepart"),
        name_keys=("pointDepart", "startPoint"),
    ) or _coerce_lon_lat({"lon": trip.get("longitudeDepart"), "lat": trip.get("latitudeDepart")})


def resolve_trip_end(trip: dict[str, Any]) -> list[float] | None:
    return _extract_trip_point(
        trip,
        coord_keys=("end", "destinationPoint", "destination", "latitudeArriveeLongitudeArrivee"),
        name_keys=("destination",),
    ) or _coerce_lon_lat({"lon": trip.get("longitudeArrivee"), "lat": trip.get("latitudeArrivee")})


def get_osrm_route(start: Sequence[float], end: Sequence[float], osrm_url: str = OSRM_URL) -> tuple[list[list[float]] | None, float | None, int | None]:
    route_url = (
        f"{osrm_url}/route/v1/driving/"
        f"{start[0]},{start[1]};{end[0]},{end[1]}?overview=full&geometries=geojson"
    )
    response = requests.get(route_url, timeout=20)
    response.raise_for_status()
    payload = response.json()
    routes = payload.get("routes") or []
    if not routes:
        return None, None, None
    geometry = routes[0].get("geometry") or {}
    coords = geometry.get("coordinates") if isinstance(geometry, dict) else None
    if not isinstance(coords, list) or len(coords) < 2:
        return None, None, None
    route = [[float(point[0]), float(point[1])] for point in coords if isinstance(point, (list, tuple)) and len(point) >= 2]
    distance = float(routes[0].get("distance", 0.0)) / 1000.0
    duration = int(round(float(routes[0].get("duration", 0.0)) / 60.0))
    return route, distance, duration


def resolve_route(trip: dict[str, Any], osrm_url: str = OSRM_URL) -> RouteContext | None:
    route = parse_route_geometry(trip.get("geometrieItineraire") or trip.get("geometry") or trip.get("route"))
    if route and len(route) >= 2:
        return RouteContext(trip=trip, route=route, distance_km=trip.get("distanceKm"), duration_minutes=trip.get("dureeEstimeeMinutes"))

    start = resolve_trip_start(trip)
    end = resolve_trip_end(trip)
    if not start or not end:
        return None

    route, distance_km, duration_minutes = get_osrm_route(start, end, osrm_url=osrm_url)
    if not route:
        return None
    return RouteContext(trip=trip, route=route, distance_km=distance_km, duration_minutes=duration_minutes)


def nearest_route_index(route: Sequence[Sequence[float]], position: Sequence[float] | None) -> int:
    if not route or position is None:
        return 0

    best_index = 0
    best_distance = float("inf")
    for index, point in enumerate(route):
        distance = haversine_m(point[0], point[1], position[0], position[1])
        if distance < best_distance:
            best_distance = distance
            best_index = index
    return best_index


def haversine_m(lon1: float, lat1: float, lon2: float, lat2: float) -> float:
    radius = 6371000.0
    phi1 = math.radians(lat1)
    phi2 = math.radians(lat2)
    dphi = math.radians(lat2 - lat1)
    dlambda = math.radians(lon2 - lon1)
    a = math.sin(dphi / 2) ** 2 + math.cos(phi1) * math.cos(phi2) * math.sin(dlambda / 2) ** 2
    return 2 * radius * math.atan2(math.sqrt(a), math.sqrt(1 - a))


def route_total_distance_km(route: Sequence[Sequence[float]]) -> float:
    if not route or len(route) < 2:
        return 0.0
    total = 0.0
    for index in range(1, len(route)):
        total += haversine_m(route[index - 1][0], route[index - 1][1], route[index][0], route[index][1]) / 1000.0
    return total


def post_position(trip_id: str, latitude: float, longitude: float, speed: float, fuel: float, backend_url: str = BACKEND_URL) -> dict[str, Any]:
    payload = {
        "latitude": latitude,
        "longitude": longitude,
        "vitesse": speed,
        "carburant": fuel,
        "datePosition": _now_iso(),
    }
    response = requests.post(f"{backend_url}/api/trajets/{trip_id}/position", json=payload, timeout=20)
    response.raise_for_status()
    return response.json()


def fetch_weather(latitude: float, longitude: float, backend_url: str = BACKEND_URL) -> dict[str, Any] | None:
    try:
        response = requests.get(
            f"{backend_url}/api/meteo",
            params={"lat": latitude, "lon": longitude},
            timeout=15,
        )
        response.raise_for_status()
        payload = response.json()
        return payload if isinstance(payload, dict) else None
    except Exception:
        return None


def weather_speed_multiplier(weather: dict[str, Any] | None) -> float:
    if not weather:
        return 1.0

    state = str(weather.get("etatGeneral") or "").upper()
    visibility = weather.get("visibilityKm")

    if state == "ORAGE":
        return 0.6
    if state == "NEIGE":
        return 0.4
    if state == "BROUILLARD" and visibility is not None and float(visibility) < 0.2:
        return 0.5
    if state == "PLUIE":
        return 0.8
    return 1.0


def weather_fuel_multiplier(weather: dict[str, Any] | None) -> float:
    if not weather:
        return 1.0

    state = str(weather.get("etatGeneral") or "").upper()
    if state == "PLUIE":
        return 1.10
    if state == "NEIGE":
        return 1.25
    return 1.0


def is_weather_dangerous(weather: dict[str, Any] | None) -> bool:
    if not weather:
        return False
    return str(weather.get("risqueConduite") or "").upper() == "ROUGE"


def start_trip_if_needed(trip_id: str, backend_url: str = BACKEND_URL) -> None:
    try:
        requests.post(f"{backend_url}/api/trajets/{trip_id}/demarrer", timeout=20).raise_for_status()
    except Exception:
        return


def finish_trip_if_needed(trip_id: str, backend_url: str = BACKEND_URL) -> None:
    try:
        requests.post(f"{backend_url}/api/trajets/{trip_id}/terminer", timeout=20).raise_for_status()
    except Exception:
        return


def emit_route_points(
    trip: dict[str, Any],
    route: Sequence[Sequence[float]],
    backend_url: str = BACKEND_URL,
    step_seconds: float = DEFAULT_STEP_SECONDS,
    speed_kmh: float = DEFAULT_SPEED_KMH,
    start_index: int = 0,
) -> None:
    trip_id = str(trip.get("id"))
    if not trip_id or not route:
        return

    total_points = len(route)
    start_index = max(0, min(start_index, total_points - 1))

    vehicle_speed = trip.get("vehiculeVitesse")
    if vehicle_speed is not None:
        speed_kmh = float(vehicle_speed)

    fuel = 100.0
    for index in range(start_index, total_points):
        lon, lat = route[index]
        progress = 100.0 if total_points == 1 else round((index / (total_points - 1)) * 100.0, 2)
        current_speed = max(10.0, speed_kmh + random.uniform(-8.0, 10.0))
        fuel = max(0.0, fuel - random.uniform(0.2, 0.8))
        post_position(trip_id, lat, lon, current_speed, fuel, backend_url=backend_url)
        if index < total_points - 1:
            time.sleep(step_seconds)


def build_trip_snapshot(trip: dict[str, Any], route: Sequence[Sequence[float]]) -> dict[str, Any]:
    return {
        "trip_id": trip.get("id"),
        "vehicle_id": trip.get("vehiculeId"),
        "driver_id": trip.get("chauffeurId"),
        "pointDepart": trip.get("pointDepart"),
        "destination": trip.get("destination"),
        "latitudeDepart": trip.get("latitudeDepart"),
        "longitudeDepart": trip.get("longitudeDepart"),
        "latitudeArrivee": trip.get("latitudeArrivee"),
        "longitudeArrivee": trip.get("longitudeArrivee"),
        "geometrieItineraire": {"type": "LineString", "coordinates": list(route)},
    }
