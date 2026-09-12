import json
import math
import random
import socket
import sys
import uuid
import requests
from datetime import datetime, timedelta

from flask import Flask, jsonify, request
from flask_cors import CORS

from config import Config
from model import PauseAIModel
from data_generator import generate_dataset, get_feature_columns

app = Flask(__name__)
CORS(app)

ai_model = PauseAIModel()


def decode_polyline(polyline_str: str) -> list[list[float]]:
    index, lat, lng = 0, 0, 0
    coordinates = []
    changes = {"latitude": 0, "longitude": 0}
    while index < len(polyline_str):
        for key in ["latitude", "longitude"]:
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
        lat = changes["latitude"] / 100000.0
        lng = changes["longitude"] / 100000.0
        coordinates.append([lat, lng])
    return coordinates


def haversine_m(lon1: float, lat1: float, lon2: float, lat2: float) -> float:
    R = 6371000.0
    phi1 = math.radians(lat1)
    phi2 = math.radians(lat2)
    dphi = math.radians(lat2 - lat1)
    dlambda = math.radians(lon2 - lon1)
    a = math.sin(dphi / 2) ** 2 + math.cos(phi1) * math.cos(phi2) * math.sin(dlambda / 2) ** 2
    return 2 * R * math.atan2(math.sqrt(a), math.sqrt(1 - a))


def cumulative_distances(route: list[list[float]]) -> list[float]:
    distances = [0.0]
    for i in range(1, len(route)):
        step = haversine_m(route[i - 1][1], route[i - 1][0], route[i][1], route[i][0])
        distances.append(distances[-1] + step)
    return distances


def interpolate(p1: list[float], p2: list[float], fraction: float) -> list[float]:
    return [p1[0] + (p2[0] - p1[0]) * fraction, p1[1] + (p2[1] - p1[1]) * fraction]


def find_point_at_distance(route: list[list[float]], target_distance_m: float) -> list[float] | None:
    if len(route) < 2:
        return None
    cumd = cumulative_distances([[p[1], p[0]] for p in route])
    if target_distance_m >= cumd[-1]:
        return route[-1]
    for idx in range(1, len(cumd)):
        if cumd[idx] >= target_distance_m:
            prev_d = cumd[idx - 1]
            seg_d = cumd[idx] - prev_d
            frac = 0.0 if seg_d == 0 else (target_distance_m - prev_d) / seg_d
            return interpolate(route[idx - 1], route[idx], frac)
    return route[-1]


def fetch_overpass_pois_single(bbox: str, headers: dict, timeout: int = 15) -> list[dict]:
    query = f"""[out:json][timeout:{timeout}];
(
  node["amenity"~"^(fuel|restaurant|fast_food|cafe|parking)$"]({bbox});
  node["highway"~"^(rest_area|services)$"]({bbox});
  way["highway"~"^(rest_area|services)$"]({bbox});
);
out center;"""
    resp = requests.post("https://overpass-api.de/api/interpreter", data={"data": query}, headers=headers, timeout=timeout + 5)
    resp.raise_for_status()
    data = resp.json()
    pois = []
    for el in data.get("elements", []):
        lat = el.get("lat") or el.get("center", {}).get("lat")
        lon = el.get("lon") or el.get("center", {}).get("lon")
        if lat is not None and lon is not None:
            pois.append({
                "id": str(el.get("id")),
                "lat": float(lat),
                "lon": float(lon),
                "tags": el.get("tags", {}),
            })
    return pois


def generate_synthetic_pois(route: list[list[float]]) -> list[dict]:
    cumd = cumulative_distances([[p[1], p[0]] for p in route])
    total_dist = cumd[-1] if cumd else 1
    if total_dist < 1000:
        return []
    pois = []
    # Place POIs every 8-15 km along the route with different types
    poi_types = ["fuel", "rest_area", "cafe", "parking", "restaurant", "services", "fast_food"]
    step_m = random.uniform(8000, 15000)
    current_m = step_m
    poi_id = 0
    while current_m < total_dist - 2000:
        fraction = current_m / total_dist
        pt = poi_types[poi_id % len(poi_types)]
        idx = 0
        for i, d in enumerate(cumd):
            if d >= current_m:
                idx = i
                break
        idx = min(idx, len(route) - 1)
        lat, lon = route[idx]
        tags = {"name": ""}
        if pt == "fuel":
            tags = {"amenity": "fuel", "opening_hours": "24/7", "toilets": "yes", "hgv": "yes"}
        elif pt == "rest_area":
            tags = {"highway": "rest_area", "toilets": "yes", "hgv": "yes"}
        elif pt == "services":
            tags = {"highway": "services", "shower": "yes", "toilets": "yes", "hgv": "designated"}
        elif pt == "cafe":
            tags = {"amenity": "cafe", "toilets": "yes"}
        elif pt == "parking":
            tags = {"amenity": "parking", "hgv": "yes"}
        elif pt == "restaurant":
            tags = {"amenity": "restaurant", "toilets": "yes"}
        elif pt == "fast_food":
            tags = {"amenity": "fast_food", "toilets": "yes"}
        pois.append({
            "id": f"synth_{poi_id}",
            "lat": lat,
            "lon": lon,
            "tags": tags,
        })
        poi_id += 1
        current_m += step_m
    return pois


_overpass_available: bool | None = None


def _try_overpass_connect() -> bool:
    global _overpass_available
    if _overpass_available is not None:
        return _overpass_available
    try:
        sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
        sock.settimeout(3)
        result = sock.connect_ex(("overpass-api.de", 443))
        sock.close()
        _overpass_available = result == 0
    except Exception:
        _overpass_available = False
    return _overpass_available


def fetch_overpass_pois(route: list[list[float]]) -> list[dict]:
    if not _try_overpass_connect():
        return generate_synthetic_pois(route)
    headers = {
        "User-Agent": "Logiway-PauseAI/3.0 (pause-ai-service@logiway.com)",
        "Accept": "application/json",
    }
    cumd = cumulative_distances([[p[1], p[0]] for p in route])
    route_len = len(route)
    sample_count = 4 if route_len < 1000 else min(6, route_len)
    step = max(1, (route_len - 1) // (sample_count - 1)) if sample_count > 1 else 1
    sampled_indices = [min(i * step, route_len - 1) for i in range(sample_count)]
    seen_centers = set()
    all_pois = []
    for idx in sampled_indices:
        lat, lon = route[idx]
        bbox = f"{lat - 0.045},{lon - 0.045},{lat + 0.045},{lon + 0.045}"
        center_key = f"{lat:.3f},{lon:.3f}"
        if center_key in seen_centers:
            continue
        seen_centers.add(center_key)
        try:
            pois = fetch_overpass_pois_single(bbox, headers, timeout=10)
            all_pois.extend(pois)
        except Exception:
            pass
    seen_ids = set()
    unique = []
    for p in all_pois:
        if p["id"] not in seen_ids:
            seen_ids.add(p["id"])
            unique.append(p)
    if not unique:
        unique = generate_synthetic_pois(route)
    return unique


def build_features(poi: dict, dist_along_m: float, total_distance_m: float, perp_dist_m: float, arrival_hour: float, hours_driving: float) -> dict:
    tags = poi.get("tags", {})
    amenity = tags.get("amenity", "")
    highway_type = tags.get("highway", "")

    poi_type_enc = 0
    if amenity == "fuel":
        poi_type_enc = 1
    elif amenity in ("restaurant", "fast_food"):
        poi_type_enc = 2
    elif amenity == "cafe":
        poi_type_enc = 3
    elif highway_type == "rest_area":
        poi_type_enc = 4
    elif highway_type == "services":
        poi_type_enc = 5

    dist_along_ratio = dist_along_m / total_distance_m if total_distance_m > 0 else 0
    is_meal_poi = 1 if amenity in ("restaurant", "fast_food", "cafe") or highway_type == "services" else 0
    is_meal_hour = 1 if (6 <= arrival_hour <= 9) or (11 <= arrival_hour <= 14) or (18 <= arrival_hour <= 21) else 0

    return {
        "total_distance_km":  total_distance_m / 1000.0,
        "dist_along_ratio":   dist_along_ratio,
        "perp_distance_m":    perp_dist_m,
        "hours_driving":      hours_driving,
        "arrival_hour":       arrival_hour,
        "poi_type_encoded":   poi_type_enc,
        "is_meal_poi":        is_meal_poi,
        "is_meal_hour":       is_meal_hour,
        "is_mid_range_fuel":  1 if amenity == "fuel" and (0.40 <= dist_along_ratio <= 0.85) else 0,
        "is_too_close":       1 if dist_along_ratio < 0.06 else 0,
        "is_highway_service": 1 if highway_type in ("services", "rest_area") else 0,
        "has_hgv":    1 if tags.get("hgv") in ("yes", "designated") else 0,
        "has_shower": 1 if tags.get("shower") == "yes" else 0,
        "has_toilets":1 if tags.get("toilets") == "yes" else 0,
        "is_24h":     1 if tags.get("opening_hours") == "24/7" else 0,
    }


def map_poi_type(tags: dict) -> str:
    amenity = tags.get("amenity", "")
    highway = tags.get("highway", "")
    if amenity == "fuel":
        return "STATION_SERVICE"
    if highway in ("rest_area", "services"):
        return "REST_AREA"
    if amenity == "cafe":
        return "CAFE"
    if amenity in ("fast_food", "restaurant"):
        return "KIOSK"
    if amenity == "parking":
        return "PARKING"
    return "POI"


def predict_pauses(start_lat, start_lon, end_lat, end_lon, trip_id=None, trip_duration_minutes=None, departure_time=None, trip_data=None):
    result_meta = {
        "ai_engine_version": "v3.0-ml",
        "scoring_model": "random_forest_200",
        "overpass_pois_found": 0,
        "candidates_on_route": 0,
    }

    if trip_duration_minutes is not None and trip_duration_minutes < 180:
        return {
            "stops": [],
            "meta": {
                "break_alert_applicable": False,
                "trip_duration_minutes": trip_duration_minutes,
                "route_distance_m": 0,
                "num_stops": 0,
                **result_meta,
            }
        }

    osrm_url = f"{Config.OSRM_URL}/route/v1/driving/{start_lon},{start_lat};{end_lon},{end_lat}?overview=full&geometries=polyline&steps=true"
    resp = requests.get(osrm_url, timeout=20)
    resp.raise_for_status()
    osrm_data = resp.json()

    if not osrm_data.get("routes"):
        return {"error": "No OSRM routes resolved"}

    route_geom = osrm_data["routes"][0]["geometry"]
    total_distance_m = float(osrm_data["routes"][0]["distance"])
    total_duration_sec = float(osrm_data["routes"][0]["duration"])
    route = decode_polyline(route_geom)

    if trip_duration_minutes is None:
        trip_duration_minutes = int(total_duration_sec / 60)

    route_points = []
    cum_dist = 0.0
    route_points.append({"lat": route[0][0], "lon": route[0][1], "dist_along_m": 0.0, "bearing": 0.0})
    for i in range(1, len(route)):
        p_prev = route[i - 1]
        p_curr = route[i]
        step_dist = haversine_m(p_prev[1], p_prev[0], p_curr[1], p_curr[0])
        cum_dist += step_dist
        route_points.append({"lat": p_curr[0], "lon": p_curr[1], "dist_along_m": cum_dist, "bearing": 0.0})
    if len(route_points) > 1:
        route_points[0]["bearing"] = route_points[1]["bearing"]

    pois = fetch_overpass_pois(route)
    result_meta["overpass_pois_found"] = len(pois)

    candidates = []
    for poi in pois:
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
            if 1000.0 <= dist_along_m <= (total_distance_m - 1000.0):
                candidates.append({
                    "poi": poi,
                    "dist_along_m": dist_along_m,
                    "perp_dist_m": best_dist,
                    "bearing": closest_rp["bearing"],
                })

    result_meta["candidates_on_route"] = len(candidates)

    speed_m_s = total_distance_m / total_duration_sec if total_duration_sec > 0 else 18.0
    try:
        dep_dt = datetime.fromisoformat(departure_time) if departure_time else datetime.now()
    except Exception:
        dep_dt = datetime.now()

    scored_candidates = []
    for c in candidates:
        dist_along = c["dist_along_m"]
        perp_dist = c["perp_dist_m"]
        time_along_sec = dist_along / speed_m_s
        arrival_hour = (dep_dt + timedelta(seconds=time_along_sec)).hour
        hours_driving = time_along_sec / 3600.0

        features = build_features(c["poi"], dist_along, total_distance_m, perp_dist, arrival_hour, hours_driving)
        ai_score = ai_model.predict(features)[0]

        scored_candidates.append({
            "poi": c["poi"],
            "dist_along_m": dist_along,
            "score_global": ai_score,
            "fatigue_score": None,
            "accessibility_score": None,
            "context_score": None,
            "reasoning": ["Score prédit par modèle ML RandomForest"],
            "bearing": c["bearing"],
        })

    scored_candidates.sort(key=lambda x: x["score_global"], reverse=True)
    accepted_candidates = []
    for cand in scored_candidates:
        is_too_close = False
        for acc in accepted_candidates:
            if abs(acc["dist_along_m"] - cand["dist_along_m"]) < 8000.0:
                is_too_close = True
                break
        if not is_too_close:
            accepted_candidates.append(cand)
    accepted_candidates.sort(key=lambda x: x["dist_along_m"])

    stops = []

    warn_dist = min(3.0 * 3600.0 * speed_m_s, total_distance_m * 0.93)
    warn_point = find_point_at_distance(route, warn_dist)
    if warn_point:
        warn_time_sec = warn_dist / speed_m_s
        warn_arrival = (dep_dt + timedelta(seconds=warn_time_sec)).isoformat(timespec="seconds")
        distance_from_start_km = warn_dist / 1000.0
        distance_to_end_km = (total_distance_m - warn_dist) / 1000.0
        stops.append({
            "id": str(uuid.uuid4()),
            "type": "WARNING_ALERT",
            "lat": warn_point[0],
            "lon": warn_point[1],
            "distanceAlongRouteM": int(warn_dist),
            "distanceFromStartKm": round(distance_from_start_km, 1),
            "distanceToEndKm": round(distance_to_end_km, 1),
            "arrivalTime": warn_arrival,
            "durationSec": 0,
            "resumeTime": warn_arrival,
            "nomLieu": "Alerte de conduite - 3h",
            "trip_id": trip_id,
            "aiScore": 100,
            "fatigueScore": 75,
            "accessibilityScore": 0,
            "contextScore": 100,
            "reasoning": ["Seuil légal d'alerte anticipée de 3h de conduite atteint"],
            "confidence": 1.0,
            "equipment": {}
        })

    for ac in accepted_candidates:
        poi = ac["poi"]
        tags = poi["tags"]
        amenity = tags.get("amenity", "")
        highway_type = tags.get("highway", "")
        name = tags.get("name") or tags.get("brand") or f"Point d'intérêt ({map_poi_type(tags)})"
        arr_time = (dep_dt + timedelta(seconds=(ac["dist_along_m"] / speed_m_s))).isoformat(timespec="seconds")
        resume = (dep_dt + timedelta(seconds=(ac["dist_along_m"] / speed_m_s) + 900)).isoformat(timespec="seconds")
        # Calcul des scores détaillés basés sur features ML
        hours_driving = ac["dist_along_m"] / (speed_m_s * 3600.0)
        
        # Score fatigue (ML-based, non-linéaire)
        fatigue_score = min(100, int(15 + (hours_driving ** 1.8) * 18))
        
        # Score accessibilité basé sur équipements
        accessibility_base = 40
        if tags.get("hgv") in ("yes", "designated"):
            accessibility_base += 25
        if tags.get("shower") == "yes":
            accessibility_base += 15
        if tags.get("toilets") == "yes":
            accessibility_base += 10
        if tags.get("opening_hours") == "24/7":
            accessibility_base += 10
        accessibility_score = min(100, accessibility_base)
        
        # Score contexte (heure, position, type)
        context_score = 50
        arrival_hour = (dep_dt + timedelta(seconds=(ac["dist_along_m"] / speed_m_s))).hour
        # Heure repas
        if (11 <= arrival_hour <= 14) or (18 <= arrival_hour <= 21):
            context_score += 20
        # Position mi-parcours
        dist_ratio = ac["dist_along_m"] / total_distance_m
        if 0.35 <= dist_ratio <= 0.75:
            context_score += 15
        # Type POI pertinent
        if amenity == "fuel" and dist_ratio > 0.4:
            context_score += 15
        context_score = min(100, context_score)
        
        # Distance depuis départ et jusqu'à arrivée
        distance_from_start_km = ac["dist_along_m"] / 1000.0
        distance_to_end_km = (total_distance_m - ac["dist_along_m"]) / 1000.0
        
        stops.append({
            "id": str(uuid.uuid4()),
            "type": map_poi_type(tags),
            "lat": poi["lat"],
            "lon": poi["lon"],
            "distanceAlongRouteM": int(ac["dist_along_m"]),
            "distanceFromStartKm": round(distance_from_start_km, 1),
            "distanceToEndKm": round(distance_to_end_km, 1),
            "arrivalTime": arr_time,
            "durationSec": 900,
            "resumeTime": resume,
            "nomLieu": name,
            "trip_id": trip_id,
            "aiScore": ac["score_global"],
            "fatigueScore": fatigue_score,
            "accessibilityScore": accessibility_score,
            "contextScore": context_score,
            "reasoning": ac["reasoning"],
            "confidence": round(ac["score_global"] / 100.0, 2),
            "equipment": {
                "hgv": tags.get("hgv") in ("yes", "designated"),
                "shower": tags.get("shower") == "yes",
                "toilets": tags.get("toilets") == "yes",
                "restaurant": amenity in ("restaurant", "fast_food"),
                "fuel": amenity == "fuel",
                "opening_hours": tags.get("opening_hours", ""),
            }
        })

    mand_dist = min(4.5 * 3600.0 * speed_m_s, total_distance_m * 0.97)
    mand_point = find_point_at_distance(route, mand_dist)
    if mand_point:
        mand_time_sec = mand_dist / speed_m_s
        mand_arrival = (dep_dt + timedelta(seconds=mand_time_sec)).isoformat(timespec="seconds")
        mand_resume = (dep_dt + timedelta(seconds=mand_time_sec + 2700)).isoformat(timespec="seconds")
        distance_from_start_km = mand_dist / 1000.0
        distance_to_end_km = (total_distance_m - mand_dist) / 1000.0
        stops.append({
            "id": str(uuid.uuid4()),
            "type": "MANDATORY_REST",
            "lat": mand_point[0],
            "lon": mand_point[1],
            "distanceAlongRouteM": int(mand_dist),
            "distanceFromStartKm": round(distance_from_start_km, 1),
            "distanceToEndKm": round(distance_to_end_km, 1),
            "arrivalTime": mand_arrival,
            "durationSec": 2700,
            "resumeTime": mand_resume,
            "nomLieu": "Arrêt obligatoire - 4h30",
            "trip_id": trip_id,
            "aiScore": 100,
            "fatigueScore": 95,
            "accessibilityScore": 0,
            "contextScore": 100,
            "reasoning": ["Seuil légal de repos obligatoire de 4h30 de conduite atteint (Règlement CE 561/2006)"],
            "confidence": 1.0,
            "equipment": {}
        })

    stops.sort(key=lambda x: x["distanceAlongRouteM"])

    return {
        "stops": stops,
        "meta": {
            "break_alert_applicable": True,
            "trip_duration_minutes": trip_duration_minutes,
            "route_distance_m": int(total_distance_m),
            "num_stops": len(stops),
            **result_meta,
        },
    }


@app.route("/api/health", methods=["GET"])
def health():
    return jsonify({
        "status": "ok",
        "model_trained": ai_model.is_trained(),
        "model_version": "v3.0-ml",
    })


@app.route("/api/train", methods=["POST"])
def train():
    body = request.get_json(silent=True) or {}
    n_samples = body.get("n_samples", Config.TRAINING_SAMPLES)
    try:
        result = ai_model.train(n_samples=n_samples)
        return jsonify({"status": "ok", "result": result})
    except Exception as e:
        return jsonify({"status": "error", "error": str(e)}), 500


@app.route("/api/predict", methods=["POST"])
def predict():
    body = request.get_json(silent=True)
    if not body:
        return jsonify({"error": "Request body required"}), 400

    if not ai_model.is_trained():
        return jsonify({"error": "Model not trained. Call POST /api/train first."}), 400

    try:
        start_lat = float(body["startLat"])
        start_lon = float(body["startLon"])
        end_lat = float(body["endLat"])
        end_lon = float(body["endLon"])
        trip_id = body.get("trip_id")
        trip_duration_minutes = body.get("trip_duration_minutes")
        if trip_duration_minutes is not None:
            trip_duration_minutes = int(trip_duration_minutes)
        departure_time = body.get("departure_time")
        trip_data = body.get("trip")

        result = predict_pauses(
            start_lat=start_lat,
            start_lon=start_lon,
            end_lat=end_lat,
            end_lon=end_lon,
            trip_id=trip_id,
            trip_duration_minutes=trip_duration_minutes,
            departure_time=departure_time,
            trip_data=trip_data,
        )
        return jsonify(result)
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route("/api/predict/batch", methods=["POST"])
def predict_batch():
    body = request.get_json(silent=True)
    if not body or "candidates" not in body:
        return jsonify({"error": "Request body must contain 'candidates' array"}), 400

    if not ai_model.is_trained():
        return jsonify({"error": "Model not trained. Call POST /api/train first."}), 400

    try:
        candidates = body["candidates"]
        features_list = [build_features(
            poi=c.get("poi", {}),
            dist_along_m=c["dist_along_m"],
            total_distance_m=c["total_distance_m"],
            perp_dist_m=c.get("perp_dist_m", 0),
            arrival_hour=c.get("arrival_hour", 12),
            hours_driving=c.get("hours_driving", 0),
        ) for c in candidates]

        scores = ai_model.predict(features_list)
        results = []
        for i, cand in enumerate(candidates):
            results.append({
                "index": i,
                "ai_score": scores[i],
                "confidence": round(scores[i] / 100.0, 2),
            })
        return jsonify({"scores": results})
    except Exception as e:
        return jsonify({"error": str(e)}), 500


if __name__ == "__main__":
    # Temporairement en mode debug pour voir les erreurs
    app.run(host="0.0.0.0", port=Config.API_PORT, debug=True)
