#!/usr/bin/env python3
"""
LogiWay — GPS Truck Simulator
=============================
Simulates a vehicle moving along a real OSRM route in real-time.
The vehicle position is sent to the backend every few seconds,
which triggers SSE events that update the frontend map live.

Usage:
    python run_simulation.py                          # auto-detect an active trip
    python run_simulation.py --trip-id 5              # simulate a specific trip
    python run_simulation.py --create                 # create a test trip then simulate
    python run_simulation.py --from "Paris" --to "Lyon" --create   # custom route

The script works with any location worldwide — OSRM public API covers the full planet.
"""
from __future__ import annotations

import argparse
import json
import sys
import time
import random
from datetime import datetime

from trip_route_utils import (
    BACKEND_URL,
    OSRM_URL,
    DEFAULT_STEP_SECONDS,
    WEATHER_REFRESH_SECONDS,
    NAMED_LOCATIONS,
    build_trip_snapshot,
    fetch_weather,
    emit_route_points,
    fetch_trips,
    get_osrm_route,
    is_weather_dangerous,
    nearest_route_index,
    parse_named_location,
    resolve_route,
    select_trip,
    start_trip_if_needed,
    finish_trip_if_needed,
    weather_fuel_multiplier,
    weather_speed_multiplier,
)

import requests


# ──────────────────────────────────────────────
# Default test routes (worldwide examples)
# ──────────────────────────────────────────────
TEST_ROUTES = [
    {"from": "Tunis",     "to": "Sousse",    "from_coords": [10.1815, 36.8065], "to_coords": [10.6360, 35.8256]},
    {"from": "Tunis",     "to": "Sfax",      "from_coords": [10.1815, 36.8065], "to_coords": [10.7603, 34.7406]},
    {"from": "Tunis",     "to": "Bizerte",   "from_coords": [10.1815, 36.8065], "to_coords": [9.8739, 37.2744]},
    {"from": "Sousse",    "to": "Kairouan",  "from_coords": [10.6360, 35.8256], "to_coords": [10.0974, 35.6781]},
    {"from": "Sfax",      "to": "Gabes",     "from_coords": [10.7603, 34.7406], "to_coords": [10.0982, 33.8815]},
]


def _log(msg: str) -> None:
    ts = datetime.now().strftime("%H:%M:%S")
    print(f"[{ts}] {msg}", flush=True)


def _resolve_coords(name: str) -> list[float] | None:
    """Resolve a city name or lat,lon string to [lon, lat] coordinates."""
    coords = parse_named_location(name)
    if coords:
        return coords

    # Try as "lat,lon" format
    parts = name.split(",")
    if len(parts) == 2:
        try:
            lat = float(parts[0].strip())
            lon = float(parts[1].strip())
            return [lon, lat]
        except ValueError:
            pass

    # Try geocoding via Nominatim
    try:
        resp = requests.get(
            "https://nominatim.openstreetmap.org/search",
            params={"q": name, "format": "jsonv2", "limit": 1},
            headers={"User-Agent": "LogiWay-Simulator/1.0"},
            timeout=15,
        )
        resp.raise_for_status()
        data = resp.json()
        if data:
            return [float(data[0]["lon"]), float(data[0]["lat"])]
    except Exception as e:
        _log(f"⚠ Geocoding failed for '{name}': {e}")

    return None


def create_test_trip(
    from_name: str,
    to_name: str,
    from_coords: list[float],
    to_coords: list[float],
    backend_url: str = BACKEND_URL,
) -> dict | None:
    """Create a test trip via the backend API."""
    payload = {
        "pointDepart": from_name,
        "destination": to_name,
        "latitudeDepart": from_coords[1],   # lat
        "longitudeDepart": from_coords[0],  # lon
        "latitudeArrivee": to_coords[1],     # lat
        "longitudeArrivee": to_coords[0],    # lon
        "statut": "ACTIF",
        "priorite": "NORMALE",
        "chargeKg": round(random.uniform(500, 5000), 0),
        "notes": f"Trajet de simulation — {from_name} vers {to_name}",
    }

    _log(f"📦 Création du trajet : {from_name} → {to_name}")
    try:
        resp = requests.post(f"{backend_url}/api/trajets", json=payload, timeout=20)
        resp.raise_for_status()
        trip = resp.json()
        _log(f"✅ Trajet créé — ID: {trip.get('id')}")

        # Check if OSRM geometry was computed by the backend
        if trip.get("geometrieItineraire"):
            _log(f"   ✅ Itinéraire OSRM calculé par le backend")
        else:
            _log(f"   ⚠ Pas de géométrie OSRM du backend — le simulateur calculera l'itinéraire")

        if trip.get("distanceKm"):
            _log(f"   📏 Distance: {trip['distanceKm']:.1f} km")
        if trip.get("dureeEstimeeMinutes"):
            _log(f"   ⏱ Durée estimée: {trip['dureeEstimeeMinutes']} min")

        return trip
    except requests.exceptions.ConnectionError:
        _log(f"❌ Impossible de se connecter au backend ({backend_url})")
        _log(f"   Vérifiez que le backend Spring Boot est démarré.")
        return None
    except Exception as e:
        _log(f"❌ Erreur création trajet: {e}")
        if hasattr(e, "response") and e.response is not None:
            try:
                _log(f"   Réponse: {e.response.text[:300]}")
            except Exception:
                pass
        return None


def run_simulation(
    trip_id: str | None = None,
    from_name: str | None = None,
    to_name: str | None = None,
    create_trip: bool = False,
    backend_url: str = BACKEND_URL,
    osrm_url: str = OSRM_URL,
    step_seconds: float = DEFAULT_STEP_SECONDS,
    auto_finish: bool = True,
) -> int:
    """Main simulation loop."""

    _log("=" * 60)
    _log("🚛 LogiWay — Simulateur GPS en temps réel")
    _log(f"   Backend : {backend_url}")
    _log(f"   OSRM    : {osrm_url}")
    _log("=" * 60)

    trip = None

    # ── Option 1: Create a new test trip ──
    if create_trip:
        if from_name and to_name:
            from_coords = _resolve_coords(from_name)
            to_coords = _resolve_coords(to_name)
            if not from_coords:
                _log(f"❌ Impossible de résoudre les coordonnées pour '{from_name}'")
                return 1
            if not to_coords:
                _log(f"❌ Impossible de résoudre les coordonnées pour '{to_name}'")
                return 1
        else:
            # Pick a random test route
            route = random.choice(TEST_ROUTES)
            from_name = route["from"]
            to_name = route["to"]
            from_coords = route["from_coords"]
            to_coords = route["to_coords"]

        trip = create_test_trip(from_name, to_name, from_coords, to_coords, backend_url)
        if not trip:
            return 1
        trip_id = str(trip["id"])

    # ── Option 2: Find an existing trip ──
    if not trip:
        _log("🔍 Recherche des trajets actifs...")
        try:
            trips = fetch_trips(backend_url)
        except requests.exceptions.ConnectionError:
            _log(f"❌ Impossible de se connecter au backend ({backend_url})")
            _log(f"   Vérifiez que le backend Spring Boot est démarré sur le port 8080.")
            return 1
        except Exception as e:
            _log(f"❌ Erreur récupération trajets: {e}")
            return 1

        if not trips:
            _log("⚠ Aucun trajet EN_COURS trouvé.")
            _log("   → Utilisez --create pour créer un trajet de test automatiquement.")
            _log(f"   → Ou créez un trajet via l'interface Angular et démarrez-le.")
            return 1

        trip = select_trip(trips, trip_id=trip_id)
        if not trip:
            _log("⚠ Aucun trajet correspondant trouvé.")
            return 1

        _log(f"✅ Trajet trouvé — ID: {trip.get('id')}")
        _log(f"   {trip.get('pointDepart', '?')} → {trip.get('destination', '?')}")

    # ── Resolve the route ──
    _log("🗺 Calcul de l'itinéraire OSRM...")
    route_context = resolve_route(trip, osrm_url=osrm_url)

    if not route_context:
        _log("⚠ Pas d'itinéraire dans le trajet — calcul via OSRM...")
        # Try to build coordinates from the trip data
        start_lon = trip.get("longitudeDepart")
        start_lat = trip.get("latitudeDepart")
        end_lon = trip.get("longitudeArrivee")
        end_lat = trip.get("latitudeArrivee")

        if start_lon and start_lat and end_lon and end_lat:
            route, dist, dur = get_osrm_route(
                [float(start_lon), float(start_lat)],
                [float(end_lon), float(end_lat)],
                osrm_url=osrm_url,
            )
            if route:
                from trip_route_utils import RouteContext
                route_context = RouteContext(trip=trip, route=route, distance_km=dist, duration_minutes=dur)

    if not route_context:
        _log("❌ Impossible de calculer l'itinéraire.")
        _log("   Vérifiez que les coordonnées de départ et d'arrivée sont correctes.")
        return 1

    route = route_context.route
    distance_km = route_context.distance_km or 0
    duration_min = route_context.duration_minutes or 0

    _log(f"✅ Itinéraire OSRM calculé !")
    _log(f"   📏 Distance  : {distance_km:.1f} km")
    _log(f"   ⏱ Durée     : {duration_min} min")
    _log(f"   📍 Points    : {len(route)} points de route")

    # ── Start the trip ──
    trip_id_str = str(trip.get("id"))
    _log(f"▶ Démarrage du trajet {trip_id_str}...")
    start_trip_if_needed(trip_id_str, backend_url=backend_url)

    # ── Find current position on route ──
    current_position = None
    if trip.get("vehiculeLongitude") is not None and trip.get("vehiculeLatitude") is not None:
        current_position = [float(trip["vehiculeLongitude"]), float(trip["vehiculeLatitude"])]
    start_index = nearest_route_index(route, current_position)

    if start_index > 0:
        _log(f"   ↪ Reprise depuis le point {start_index}/{len(route)}")

    # ── Simulate movement ──
    total_points = len(route)
    remaining_points = total_points - start_index
    estimated_time = remaining_points * step_seconds

    _log(f"🚀 Simulation démarrée !")
    _log(f"   Intervalle   : {step_seconds}s entre chaque point")
    _log(f"   Durée estimée: ~{estimated_time:.0f}s ({estimated_time/60:.1f} min)")
    _log(f"   Ouvrez la carte : http://localhost:4200/dashboard/trips-map")
    _log("-" * 60)

    fuel = 100.0
    speed_kmh = float(trip.get("vehiculeVitesse", 55) or 55)
    current_weather = None
    next_weather_refresh = 0.0
    current_simulated_time = 0.0

    for index in range(start_index, total_points):
        lon, lat = route[index]
        progress = 100.0 if total_points == 1 else round((index / (total_points - 1)) * 100.0, 2)
        current_simulated_time += step_seconds

        if current_weather is None or current_simulated_time >= next_weather_refresh:
            current_weather = fetch_weather(lat, lon, backend_url=backend_url)
            next_weather_refresh = current_simulated_time + WEATHER_REFRESH_SECONDS

        weather_speed_factor = weather_speed_multiplier(current_weather)
        weather_fuel_factor = weather_fuel_multiplier(current_weather)

        current_speed = max(10.0, (speed_kmh + random.uniform(-8.0, 10.0)) * weather_speed_factor)
        fuel = max(5.0, fuel - random.uniform(0.1, 0.4) * weather_fuel_factor)
        extra = ""

        try:
            payload = {
                "latitude": lat,
                "longitude": lon,
                "vitesse": round(current_speed, 1),
                "carburant": round(fuel, 1),
                "datePosition": datetime.now().isoformat(timespec="seconds"),
            }
            resp = requests.post(
                f"{backend_url}/api/trajets/{trip_id_str}/position",
                json=payload,
                timeout=10,
            )
            resp.raise_for_status()

            if is_weather_dangerous(current_weather):
                state = str((current_weather or {}).get("etatGeneral") or "").upper()
                if state == "BROUILLARD":
                    extra = " | 🌫️ météo dangereuse"
                elif state == "NEIGE":
                    extra = " | ❄️ météo dangereuse"
                elif state == "ORAGE":
                    extra = " | ⛈️ météo dangereuse"

            # Progress bar
            bar_len = 30
            filled = int(bar_len * progress / 100)
            bar = "█" * filled + "░" * (bar_len - filled)
            _log(f"   [{bar}] {progress:5.1f}% | 📍 ({lat:.4f}, {lon:.4f}) | 🏎 {current_speed:.0f} km/h | ⛽ {fuel:.0f}%{extra}")

        except requests.exceptions.ConnectionError:
            _log(f"   ⚠ Connexion perdue — réessai dans 5s...")
            time.sleep(5)
            continue
        except Exception as e:
            _log(f"   ⚠ Erreur envoi position: {e}")
            if hasattr(e, "response") and e.response is not None:
                try:
                    _log(f"   Réponse backend: {e.response.text[:400]}")
                except Exception:
                    pass

        if index < total_points - 1:
            time.sleep(step_seconds)

    _log("-" * 60)
    _log("🏁 Trajet terminé !")

    if auto_finish:
        _log("   → Marquage comme COMPLÉTÉ...")
        finish_trip_if_needed(trip_id_str, backend_url=backend_url)

    _log("✅ Simulation terminée avec succès.")
    return 0


def main() -> None:
    parser = argparse.ArgumentParser(
        description="LogiWay — Simulateur GPS de véhicule en temps réel",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Exemples:
  python run_simulation.py                              # Auto-détecte un trajet actif
  python run_simulation.py --trip-id 5                  # Simule le trajet #5
  python run_simulation.py --create                     # Crée un trajet test aléatoire
  python run_simulation.py --create --from Tunis --to Sousse
  python run_simulation.py --create --from Paris --to Lyon
  python run_simulation.py --create --from "36.8065,10.1815" --to "35.8256,10.6360"
  python run_simulation.py --create --from "New York" --to "Washington"
        """,
    )
    parser.add_argument("--trip-id", help="ID du trajet à simuler")
    parser.add_argument("--create", action="store_true", help="Créer un trajet de test")
    parser.add_argument("--from", dest="from_name", help="Point de départ (ville ou lat,lon)")
    parser.add_argument("--to", dest="to_name", help="Point d'arrivée (ville ou lat,lon)")
    parser.add_argument("--speed", type=float, default=DEFAULT_STEP_SECONDS, help=f"Secondes entre chaque point (défaut: {DEFAULT_STEP_SECONDS})")
    parser.add_argument("--backend", default=BACKEND_URL, help=f"URL du backend (défaut: {BACKEND_URL})")
    parser.add_argument("--osrm", default=OSRM_URL, help=f"URL OSRM (défaut: {OSRM_URL})")
    parser.add_argument("--no-finish", action="store_true", help="Ne pas marquer le trajet comme terminé")

    args = parser.parse_args()

    exit_code = run_simulation(
        trip_id=args.trip_id,
        from_name=args.from_name,
        to_name=args.to_name,
        create_trip=args.create,
        backend_url=args.backend,
        osrm_url=args.osrm,
        step_seconds=args.speed,
        auto_finish=not args.no_finish,
    )
    raise SystemExit(exit_code)


if __name__ == "__main__":
    main()
