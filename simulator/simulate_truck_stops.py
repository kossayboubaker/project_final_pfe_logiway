from __future__ import annotations

import json
import math
import sys
import os
import uuid
from datetime import datetime, timedelta
from typing import Any
import requests

BACKEND_URL = os.getenv("BACKEND_URL", "http://localhost:8080")
OSRM_URL = os.getenv("OSRM_URL", "https://router.project-osrm.org")


def decode_polyline(polyline_str: str) -> list[list[float]]:
    """Decode a Google polyline5 string into a list of [lat, lon] coordinates."""
    index, lat, lng = 0, 0, 0
    coordinates = []
    changes = {'latitude': 0, 'longitude': 0}
    while index < len(polyline_str):
        for key in ['latitude', 'longitude']:
            shift, result = 0, 0
            while True:
                byte = ord(polyline_str[index]) - 63
                index += 1
                result |= (byte & 0x1f) << shift
                shift += 5
                if not (byte & 0x20):
                    break
            change = ~(result >> 1) if (result & 1) else (result >> 1)
            changes[key] += change

        lat = changes['latitude'] / 100000.0
        lng = changes['longitude'] / 100000.0
        coordinates.append([lat, lng])
    return coordinates


def haversine_m(lon1: float, lat1: float, lon2: float, lat2: float) -> float:
    radius = 6371000.0
    phi1 = math.radians(lat1)
    phi2 = math.radians(lat2)
    dphi = math.radians(lat2 - lat1)
    dlambda = math.radians(lon2 - lon1)
    a = math.sin(dphi / 2) ** 2 + math.cos(phi1) * math.cos(phi2) * math.sin(dlambda / 2) ** 2
    return 2 * radius * math.atan2(math.sqrt(a), math.sqrt(1 - a))


def cumulative_distances(route: list[list[float]]) -> list[float]:
    distances = [0.0]
    for index in range(1, len(route)):
        step = haversine_m(route[index - 1][0], route[index - 1][1], route[index][0], route[index][1])
        distances.append(distances[-1] + step)
    return distances


def interpolate(p1: list[float], p2: list[float], fraction: float) -> list[float]:
    return [p1[0] + (p2[0] - p1[0]) * fraction, p1[1] + (p2[1] - p1[1]) * fraction]


def calculate_bearing(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    phi1 = math.radians(lat1)
    phi2 = math.radians(lat2)
    delta_lambda = math.radians(lon2 - lon1)
    y = math.sin(delta_lambda) * math.cos(phi2)
    x = math.cos(phi1) * math.sin(phi2) - math.sin(phi1) * math.cos(phi2) * math.cos(delta_lambda)
    bearing = math.degrees(math.atan2(y, x))
    return (bearing + 360) % 360


def find_point_at_distance(route: list[list[float]], target_distance_m: float) -> list[float] | None:
    """Find the [lat, lon] point at target_distance_m along a [lat, lon] route"""
    if len(route) < 2:
        return None
    cumd = cumulative_distances([[p[1], p[0]] for p in route])
    if target_distance_m >= cumd[-1]:
        return route[-1]
    for index in range(1, len(cumd)):
        if cumd[index] >= target_distance_m:
            prev_distance = cumd[index - 1]
            segment_distance = cumd[index] - prev_distance
            fraction = 0.0 if segment_distance == 0 else (target_distance_m - prev_distance) / segment_distance
            return interpolate(route[index - 1], route[index], fraction)
    return route[-1]


def generate_fallback_pois(route: list[list[float]]) -> list[dict[str, Any]]:
    print("[Overpass] ERROR or timeout, generating fallback simulated POIs along route", file=sys.stderr)
    pois = []
    cum_dists = cumulative_distances([[p[1], p[0]] for p in route])
    total_dist = cum_dists[-1]
    
    interval = 15000.0 # every 15km
    target = interval
    types = ["fuel", "parking", "restaurant", "cafe", "rest_area", "services"]
    
    while target < total_dist:
        point = find_point_at_distance(route, target)
        if point:
            poi_type = types[len(pois) % len(types)]
            tags = {}
            if poi_type == "fuel":
                tags = {"amenity": "fuel", "name": f"Station Service Fallback {len(pois)+1}", "opening_hours": "24/7", "toilets": "yes"}
            elif poi_type == "parking":
                tags = {"amenity": "parking", "name": f"Parking Fallback {len(pois)+1}", "hgv": "yes"}
            elif poi_type == "restaurant":
                tags = {"amenity": "restaurant", "name": f"Resto Fallback {len(pois)+1}", "toilets": "yes"}
            elif poi_type == "cafe":
                tags = {"amenity": "cafe", "name": f"Café Fallback {len(pois)+1}"}
            elif poi_type == "rest_area":
                tags = {"highway": "rest_area", "name": f"Aire de Repos Fallback {len(pois)+1}"}
            elif poi_type == "services":
                tags = {"highway": "services", "name": f"Centre de Service Fallback {len(pois)+1}", "shower": "yes", "toilets": "yes"}
                
            pois.append({
                "id": f"fallback-{len(pois)}",
                "lat": point[0],
                "lon": point[1],
                "tags": tags
            })
        target += interval
    return pois


def fetch_overpass_pois(route: list[list[float]]) -> list[dict[str, Any]]:
    lats = [p[0] for p in route]
    lons = [p[1] for p in route]
    min_lat = min(lats) - 0.09
    max_lat = max(lats) + 0.09
    min_lon = min(lons) - 0.09
    max_lon = max(lons) + 0.09
    
    bbox = f"{min_lat},{min_lon},{max_lat},{max_lon}"
    
    query = f"""[out:json][timeout:25];
(
  node["amenity"~"^(fuel|restaurant|fast_food|cafe|parking)$"]({bbox});
  node["highway"~"^(rest_area|services)$"]({bbox});
  way["highway"~"^(rest_area|services)$"]({bbox});
);
out center;"""
    
    try:
        print(f"[Overpass] Fetching POIs with bbox={bbox}...", file=sys.stderr)
        response = requests.post("https://overpass-api.de/api/interpreter", data={"data": query}, timeout=15)
        response.raise_for_status()
        data = response.json()
        elements = data.get("elements", [])
        print(f"[Overpass] {len(elements)} POI bruts", file=sys.stderr)
        
        pois = []
        for el in elements:
            lat = el.get("lat") or el.get("center", {}).get("lat")
            lon = el.get("lon") or el.get("center", {}).get("lon")
            if lat is not None and lon is not None:
                pois.append({
                    "id": str(el.get("id")),
                    "lat": float(lat),
                    "lon": float(lon),
                    "tags": el.get("tags", {})
                })
        return pois
    except Exception as e:
        return generate_fallback_pois(route)


def calculate_fatigue_score(dist_along_m: float, total_distance_m: float, speed_m_s: float, dep_dt: datetime) -> tuple[int, list[str]]:
    score = 0
    reasons = []
    time_along_sec = dist_along_m / speed_m_s if speed_m_s > 0 else 0
    hours_conduite = time_along_sec / 3600.0
    
    if hours_conduite > 4.5:
        score += 60
        reasons.append("Temps de conduite > 4h30 (seuil critique)")
    elif hours_conduite > 3.5:
        score += 45
        reasons.append("Temps de conduite > 3h30")
    elif hours_conduite > 2.5:
        score += 28
        reasons.append("Temps de conduite > 2h30")
        
    arrival_dt = dep_dt + timedelta(seconds=time_along_sec)
    arrival_hour = arrival_dt.hour
    
    if 2 <= arrival_hour <= 6:
        score += 25
        reasons.append(f"Conduite nocturne à {arrival_hour}h (+25)")
    elif 13 <= arrival_hour <= 15:
        score += 12
        reasons.append(f"Creux d'éveil postprandial à {arrival_hour}h (+12)")
        
    if dist_along_m >= total_distance_m * 0.75:
        score += 10
        reasons.append("Dernier quart du trajet (+10)")
        
    return min(100, max(0, score)), reasons


def calculate_accessibility_score(tags: dict[str, Any], perp_dist_m: float) -> tuple[int, list[str]]:
    score = 100
    reasons = []
    
    if perp_dist_m < 100.0:
        score += 15
        reasons.append(f"Très proche du tracé ({perp_dist_m:.0f}m)")
    elif perp_dist_m <= 300.0:
        score += 5
        reasons.append(f"Proche du tracé ({perp_dist_m:.0f}m)")
    elif perp_dist_m > 600.0:
        score -= 20
        reasons.append(f"Éloigné du tracé ({perp_dist_m:.0f}m)")
        
    highway = tags.get("highway", "")
    if highway in ["services", "rest_area"]:
        score += 25
        reasons.append(f"Aire officielle : {highway} (+25)")
        
    amenity = tags.get("amenity", "")
    if amenity == "fuel":
        score += 20
        reasons.append("Station-service (+20)")
        
    hgv = tags.get("hgv") or tags.get("truck")
    if hgv in ["yes", "designated"]:
        score += 20
        reasons.append("Accès poids lourds certifié (+20)")
        
    maxweight_str = tags.get("maxweight")
    if maxweight_str:
        try:
            val = float(''.join(c for c in maxweight_str if c.isdigit() or c == '.'))
            if val < 3.5:
                score -= 40
                reasons.append(f"Interdit poids lourds ({maxweight_str} < 3.5t)")
        except Exception:
            pass
            
    if tags.get("opening_hours") == "24/7":
        score += 10
        reasons.append("Ouvert 24h/24, 7j/7 (+10)")
        
    if tags.get("shower") == "yes":
        score += 5
        reasons.append("Douche disponible (+5)")
        
    if tags.get("toilets") == "yes":
        score += 8
        reasons.append("Sanitaires disponibles (+8)")
        
    return min(100, max(0, score)), reasons


def calculate_context_score(tags: dict[str, Any], dist_along_m: float, total_distance_m: float, arrival_hour: float) -> tuple[int, list[str]]:
    score = 50
    reasons = []
    
    amenity = tags.get("amenity", "")
    highway = tags.get("highway", "")
    
    is_meal_poi = amenity in ["restaurant", "fast_food", "cafe"] or highway == "services"
    is_meal_hour = (6 <= arrival_hour <= 9) or (11.5 <= arrival_hour <= 14) or (18 <= arrival_hour <= 21)
    
    if is_meal_poi and is_meal_hour:
        score += 25
        reasons.append("Idéal pour une pause repas (+25)")
        
    if amenity == "fuel" and (total_distance_m * 0.40 <= dist_along_m <= total_distance_m * 0.85):
        score += 15
        reasons.append("Zone optimale de mi-parcours pour carburant (+15)")
        
    if highway == "services":
        score += 20
        reasons.append("Centre routier complet (+20)")
        
    if dist_along_m < 30000.0:
        score -= 25
        reasons.append("Trop proche du départ (<30km)")
        
    return min(100, max(0, score)), reasons


def map_poi_type(tags: dict[str, Any]) -> str:
    amenity = tags.get("amenity", "")
    highway = tags.get("highway", "")
    if amenity == "fuel":
        return "STATION_SERVICE"
    if highway in ["rest_area", "services"]:
        return "REST_AREA"
    if amenity in ["cafe", "fast_food"]:
        return "KIOSK"
    return "POI"


def run(
    start_lat: float,
    start_lon: float,
    end_lat: float,
    end_lon: float,
    trip_id: int | None = None,
    trip_duration_minutes: int | None = None,
    departure_time: str | None = None
) -> dict[str, Any]:
    print(f"Starting run: ({start_lat}, {start_lon}) -> ({end_lat}, {end_lon}), duration={trip_duration_minutes}", file=sys.stderr)

    if trip_duration_minutes is not None and trip_duration_minutes < 180:
        print(f"[SIMULATOR] Trip duration {trip_duration_minutes} < 180 min, returning empty stops", file=sys.stderr)
        return {
            "stops": [],
            "meta": {
                "break_alert_applicable": False,
                "trip_duration_minutes": trip_duration_minutes,
                "route_distance_m": 0,
                "num_stops": 0,
                "overpass_pois_found": 0,
                "candidates_on_route": 0,
                "ai_engine_version": "v2.0-intelligent",
                "scoring_model": "fatigue_40_access_35_context_25"
            }
        }

    # ÉTAPE 1 — OSRM Route API
    osrm_url = f"https://router.project-osrm.org/route/v1/driving/{start_lon},{start_lat};{end_lon},{end_lat}?overview=full&geometries=polyline&steps=true"
    response = requests.get(osrm_url, timeout=20)
    response.raise_for_status()
    res_data = response.json()
    
    if not res_data.get("routes"):
        print("[OSRM] ERROR: No routes returned", file=sys.stderr)
        return {"error": "No OSRM routes resolved"}
        
    route_geom = res_data["routes"][0]["geometry"]
    total_distance_m = float(res_data["routes"][0]["distance"])
    total_duration_sec = float(res_data["routes"][0]["duration"])
    
    route = decode_polyline(route_geom)
    print(f"[OSRM] {len(route)} points | {total_distance_m/1000.0:.2f} km | {total_duration_sec/60.0:.2f} min", file=sys.stderr)

    if trip_duration_minutes is None:
        trip_duration_minutes = int(total_duration_sec / 60)

    # ÉTAPE 2 — Calcul du tracé enrichi
    route_points = []
    cum_dist = 0.0
    route_points.append({
        "lat": route[0][0],
        "lon": route[0][1],
        "dist_along_m": 0.0,
        "bearing": 0.0
    })
    for i in range(1, len(route)):
        p_prev = route[i-1]
        p_curr = route[i]
        step_dist = haversine_m(p_prev[1], p_prev[0], p_curr[1], p_curr[0])
        cum_dist += step_dist
        bearing = calculate_bearing(p_prev[0], p_prev[1], p_curr[0], p_curr[1])
        route_points.append({
            "lat": p_curr[0],
            "lon": p_curr[1],
            "dist_along_m": cum_dist,
            "bearing": bearing
        })
    if len(route_points) > 1:
        route_points[0]["bearing"] = route_points[1]["bearing"]

    # ÉTAPE 3 — Overpass API
    pois = fetch_overpass_pois(route)
    overpass_pois_found = len(pois)

    # ÉTAPE 4 — Projection + Filtre intelligent (< 800m, skip first & last 1km)
    candidates = []
    for poi in pois:
        # project
        best_dist = float("inf")
        best_idx = -1
        for idx, rp in enumerate(route_points):
            d = haversine_m(poi["lon"], poi["lat"], rp["lon"], rp["lat"])
            if d < best_dist:
                best_dist = d
                best_idx = idx
                
        if best_idx != -1 and best_dist <= 800.0:
            closest_rp = route_points[best_idx]
            dist_along_m = closest_rp["dist_along_m"]
            
            # Exclude first and last 1 km
            if 1000.0 <= dist_along_m <= (total_distance_m - 1000.0):
                candidates.append({
                    "poi": poi,
                    "dist_along_m": dist_along_m,
                    "perp_dist_m": best_dist,
                    "bearing": closest_rp["bearing"]
                })
    print(f"[Filter] {len(candidates)} sur tracé", file=sys.stderr)
    candidates_on_route = len(candidates)

    # ÉTAPE 5 — Scoring IA
    speed_m_s = total_distance_m / total_duration_sec if total_duration_sec > 0 else 18.0
    try:
        dep_dt = datetime.fromisoformat(departure_time) if departure_time else datetime.now()
    except Exception:
        dep_dt = datetime.now()

    scored_candidates = []
    for c in candidates:
        tags = c["poi"]["tags"]
        dist_along = c["dist_along_m"]
        perp_dist = c["perp_dist_m"]
        
        time_along_sec = dist_along / speed_m_s
        arrival_hour = (dep_dt + timedelta(seconds=time_along_sec)).hour
        
        f_score, f_reasons = calculate_fatigue_score(dist_along, total_distance_m, speed_m_s, dep_dt)
        a_score, a_reasons = calculate_accessibility_score(tags, perp_dist)
        c_score, c_reasons = calculate_context_score(tags, dist_along, total_distance_m, arrival_hour)
        
        score_global = int(f_score * 0.40 + a_score * 0.35 + c_score * 0.25)
        
        reasoning = f_reasons + a_reasons + c_reasons
        if not reasoning:
            reasoning = ["Point d'arrêt convenable sur l'itinéraire"]
            
        scored_candidates.append({
            "poi": c["poi"],
            "dist_along_m": dist_along,
            "score_global": score_global,
            "fatigue_score": f_score,
            "accessibility_score": a_score,
            "context_score": c_score,
            "reasoning": reasoning,
            "bearing": c["bearing"]
        })

    # ÉTAPE 6 — Sélection par fenêtre de 8km
    scored_candidates.sort(key=lambda x: x["score_global"], reverse=True)
    accepted_candidates = []
    for cand in scored_candidates:
        # Check if there is an accepted POI within 8km
        is_too_close = False
        for acc in accepted_candidates:
            if abs(acc["dist_along_m"] - cand["dist_along_m"]) < 8000.0:
                is_too_close = True
                break
        if not is_too_close:
            accepted_candidates.append(cand)
            
    # Sort by distance
    accepted_candidates.sort(key=lambda x: x["dist_along_m"])

    # ÉTAPE 7 — Injection réglementaire (WARNING_ALERT at 3h, MANDATORY_REST at 4.5h)
    stops = []
    
    # 1. Warning alert at 3h driving
    warn_dist = min(3.0 * 3600.0 * speed_m_s, total_distance_m * 0.93)
    warn_point = find_point_at_distance(route, warn_dist)
    if warn_point:
        warn_time_sec = warn_dist / speed_m_s
        warn_arrival = (dep_dt + timedelta(seconds=warn_time_sec)).isoformat(timespec="seconds")
        stops.append({
            "id": str(uuid.uuid4()),
            "type": "WARNING_ALERT",
            "lat": warn_point[0],
            "lon": warn_point[1],
            "distanceAlongRouteM": int(warn_dist),
            "arrivalTime": warn_arrival,
            "durationSec": 0,
            "resumeTime": warn_arrival,
            "nomLieu": "Alerte de conduite - 3h",
            "trip_id": trip_id,
            "aiScore": 100,
            "fatigueScore": 100,
            "accessibilityScore": 100,
            "contextScore": 100,
            "reasoning": ["Seuil légal d'alerte anticipée de 3h de conduite atteint"],
            "confidence": 1.0
        })

    # 2. Add POI stops (mapped from Overpass candidates)
    for ac in accepted_candidates:
        poi = ac["poi"]
        tags = poi["tags"]
        name = tags.get("name") or tags.get("brand") or f"Point d'intérêt ({map_poi_type(tags)})"
        
        arr_time = (dep_dt + timedelta(seconds=(ac["dist_along_m"]/speed_m_s))).isoformat(timespec="seconds")
        # standard stops are 15 minutes recommended rest
        resume = (dep_dt + timedelta(seconds=(ac["dist_along_m"]/speed_m_s) + 900)).isoformat(timespec="seconds")
        
        stops.append({
            "id": str(uuid.uuid4()),
            "type": map_poi_type(tags),
            "lat": ac["poi"]["lat"],
            "lon": ac["poi"]["lon"],
            "distanceAlongRouteM": int(ac["dist_along_m"]),
            "arrivalTime": arr_time,
            "durationSec": 900,
            "resumeTime": resume,
            "nomLieu": name,
            "trip_id": trip_id,
            "aiScore": ac["score_global"],
            "fatigueScore": ac["fatigue_score"],
            "accessibilityScore": ac["accessibility_score"],
            "contextScore": ac["context_score"],
            "reasoning": ac["reasoning"],
            "confidence": round(ac["score_global"] / 100.0, 2)
        })

    # 3. Mandatory rest at 4.5h driving
    mand_dist = min(4.5 * 3600.0 * speed_m_s, total_distance_m * 0.97)
    mand_point = find_point_at_distance(route, mand_dist)
    if mand_point:
        mand_time_sec = mand_dist / speed_m_s
        mand_arrival = (dep_dt + timedelta(seconds=mand_time_sec)).isoformat(timespec="seconds")
        mand_resume = (dep_dt + timedelta(seconds=mand_time_sec + 2700)).isoformat(timespec="seconds")
        stops.append({
            "id": str(uuid.uuid4()),
            "type": "MANDATORY_REST",
            "lat": mand_point[0],
            "lon": mand_point[1],
            "distanceAlongRouteM": int(mand_dist),
            "arrivalTime": mand_arrival,
            "durationSec": 2700,
            "resumeTime": mand_resume,
            "nomLieu": "Arrêt obligatoire - 4h30",
            "trip_id": trip_id,
            "aiScore": 100,
            "fatigueScore": 100,
            "accessibilityScore": 100,
            "contextScore": 100,
            "reasoning": ["Seuil légal de repos obligatoire de 4h30 de conduite atteint (Règlement CE 561/2006)"],
            "confidence": 1.0
        })

    # Sort final stops by distance along route
    stops.sort(key=lambda x: x["distanceAlongRouteM"])

    result = {
        "stops": stops,
        "meta": {
            "break_alert_applicable": True,
            "trip_duration_minutes": trip_duration_minutes,
            "route_distance_m": int(total_distance_m),
            "num_stops": len(stops),
            "overpass_pois_found": overpass_pois_found,
            "candidates_on_route": candidates_on_route,
            "ai_engine_version": "v2.0-intelligent",
            "scoring_model": "fatigue_40_access_35_context_25"
        }
    }
    return result


def main() -> None:
    import sys
    import argparse
    
    print("[SIMULATOR] Starting simulate_truck_stops.py", file=sys.stderr)
    
    payload = {}
    if not sys.stdin.isatty() and len(sys.argv) == 1:
        try:
            stdin_data = sys.stdin.read().strip()
            if stdin_data:
                payload = json.loads(stdin_data)
                print(f"[SIMULATOR] Input JSON validated: {payload}", file=sys.stderr)
        except Exception as exc:
            print(f"[SIMULATOR] ERROR: Invalid input JSON: {exc}", file=sys.stderr)
            print(json.dumps({"error": f"Invalid input JSON: {exc}"}, ensure_ascii=False))
            raise SystemExit(1)

    # Support command line args for manual execution
    parser = argparse.ArgumentParser(description="Simulate truck stops.")
    parser.add_argument("--start-lat", type=float, default=33.93880)
    parser.add_argument("--start-lon", type=float, default=7.95959)
    parser.add_argument("--end-lat", type=float, default=36.68164)
    parser.add_argument("--end-lon", type=float, default=10.14587)
    parser.add_argument("--trip-id", type=int, default=29)
    parser.add_argument("--duration", type=int, default=441)
    parser.add_argument("--departure-time", type=str, default=None)
    
    args, _ = parser.parse_known_args()

    # Priority to stdin payload, fallback to CLI args
    start_lat = float(payload.get("startLat") if payload.get("startLat") is not None else args.start_lat)
    start_lon = float(payload.get("startLon") if payload.get("startLon") is not None else args.start_lon)
    end_lat = float(payload.get("endLat") if payload.get("endLat") is not None else args.end_lat)
    end_lon = float(payload.get("endLon") if payload.get("endLon") is not None else args.end_lon)
    trip_id = int(payload.get("trip_id") if payload.get("trip_id") is not None else args.trip_id)
    trip_duration_minutes = payload.get("trip_duration_minutes")
    if trip_duration_minutes is not None:
        trip_duration_minutes = int(trip_duration_minutes)
    else:
        trip_duration_minutes = args.duration
    departure_time = payload.get("departure_time") or args.departure_time

    result = run(
        start_lat=start_lat,
        start_lon=start_lon,
        end_lat=end_lat,
        end_lon=end_lon,
        trip_id=trip_id,
        trip_duration_minutes=trip_duration_minutes,
        departure_time=departure_time
    )
    
    if "stops" in result:
        print(f"[SIMULATOR] Generated {len(result['stops'])} pauses", file=sys.stderr)
    if "error" in result:
        print(f"[SIMULATOR] ERROR in result: {result['error']}", file=sys.stderr)
    
    print("[SIMULATOR] Writing JSON to stdout", file=sys.stderr)
    print(json.dumps(result, ensure_ascii=False))


if __name__ == "__main__":
    main()
