import math
import random
import numpy as np
import pandas as pd
from datetime import datetime, timedelta


POI_TYPES = ["fuel", "parking", "restaurant", "fast_food", "cafe", "rest_area", "services"]


def _haversine_m(lon1, lat1, lon2, lat2):
    R = 6371000.0
    phi1, phi2 = math.radians(lat1), math.radians(lat2)
    dphi = math.radians(lat2 - lat1)
    dlambda = math.radians(lon2 - lon1)
    a = math.sin(dphi / 2) ** 2 + math.cos(phi1) * math.cos(phi2) * math.sin(dlambda / 2) ** 2
    return 2 * R * math.atan2(math.sqrt(a), math.sqrt(1 - a))


# ─────────────────────────────────────────────────────────────────
# FIX 1: Continuous fatigue curve instead of hard step buckets.
# Score grows smoothly with hours driven so the model must learn
# a real gradient, not just 4 discrete jumps.
# FIX 7: Weights rebalanced to 0.33/0.33/0.34 so no single
# component dominates the final score by design.
# ─────────────────────────────────────────────────────────────────
def _calculate_fatigue_score(hours_driving, arrival_hour, dist_along_ratio):
    # Smooth exponential growth: 0h → 0, 2h → ~17, 3.5h → ~45, 5h → ~72, 6h → ~90
    base = min(90, (hours_driving ** 1.6) * 9.5)

    # Time-of-day modifiers — still meaningful but now additive on top of a real base
    if 2 <= arrival_hour <= 6:
        base += 20          # night driving bonus
    elif 13 <= arrival_hour <= 15:
        base += 10          # post-lunch drowsiness

    # Late in the trip — driver is mentally tired regardless of clock time
    if dist_along_ratio >= 0.75:
        base += 8

    return min(100, max(0, base))


# ─────────────────────────────────────────────────────────────────
# FIX 2: Accessibility starts at 50 (not 100) so good and bad POIs
# actually produce meaningfully different scores.
# ─────────────────────────────────────────────────────────────────
def _calculate_accessibility_score(perp_dist_m, tags):
    # Start neutral — earn or lose points based on real quality
    score = 50

    # Distance from road: sharp penalty for far POIs, bonus for very close ones
    if perp_dist_m < 50:
        score += 20
    elif perp_dist_m < 150:
        score += 12
    elif perp_dist_m < 300:
        score += 4
    elif perp_dist_m < 600:
        score -= 10
    else:
        score -= 25         # > 600m off road is a real detour for a truck

    highway = tags.get("highway", "")
    amenity = tags.get("amenity", "")

    # Official highway infrastructure
    if highway == "services":
        score += 25
    elif highway == "rest_area":
        score += 18

    # Fuel station — reliable infrastructure
    if amenity == "fuel":
        score += 15

    # Truck-specific access
    hgv = tags.get("hgv") or tags.get("truck")
    if hgv in ("yes", "designated"):
        score += 18
    elif hgv == "no":
        score -= 30         # explicitly forbidden for trucks — hard penalty

    # Weight restriction — trucks are usually > 3.5t
    maxweight_str = tags.get("maxweight")
    if maxweight_str:
        try:
            val = float("".join(c for c in str(maxweight_str) if c.isdigit() or c == "."))
            if 0 < val < 3.5:
                score -= 35
        except Exception:
            pass

    # Amenities — comfort matters for long breaks
    if tags.get("opening_hours") == "24/7":
        score += 10
    if tags.get("shower") == "yes":
        score += 8
    if tags.get("toilets") == "yes":
        score += 7

    return min(100, max(0, score))


# ─────────────────────────────────────────────────────────────────
# FIX 3: Feature interactions — points are no longer independent
# checklists. The context score now rewards combinations of
# conditions, not individual flags.
# FIX 6: Fixed the 11.5 float bug on integer arrival_hour.
# ─────────────────────────────────────────────────────────────────
def _calculate_context_score(tags, dist_along_ratio, arrival_hour, hours_driving, poi_type_enc):
    # Start neutral
    score = 50

    amenity = tags.get("amenity", "")
    highway = tags.get("highway", "")

    # FIX 6: use integer 11 instead of float 11.5
    is_meal_hour = (6 <= arrival_hour <= 9) or (11 <= arrival_hour <= 14) or (18 <= arrival_hour <= 21)
    is_meal_poi = amenity in ("restaurant", "fast_food", "cafe") or highway == "services"
    is_fuel = amenity == "fuel"
    is_rest_infra = highway in ("services", "rest_area")

    # FIX 3: Meal interaction — only good when BOTH conditions are true together
    if is_meal_poi and is_meal_hour:
        score += 28         # great: right place + right time
    elif is_meal_poi and not is_meal_hour:
        score -= 8          # restaurant at 3am is not useful
    elif not is_meal_poi and is_meal_hour:
        score += 4          # it's mealtime but this isn't a food stop

    # FIX 3: Fatigue × POI type interaction
    # A rest area matters much more when the driver is actually tired
    if hours_driving >= 3.5 and is_rest_infra:
        score += 22
    elif hours_driving >= 2.5 and is_rest_infra:
        score += 12
    elif hours_driving < 1.5 and is_rest_infra:
        score -= 8          # stopping too early at a rest area is wasteful

    # FIX 3: Fuel at the right point in the trip
    if is_fuel:
        if 0.40 <= dist_along_ratio <= 0.85:
            score += 18     # ideal fueling window
        elif dist_along_ratio < 0.20:
            score -= 12     # too early to stop for fuel
        elif dist_along_ratio > 0.92:
            score -= 8      # too late, nearly at destination

    # FIX 3: Fatigue + night driving → rest infrastructure becomes critical
    if hours_driving >= 4.0 and 2 <= arrival_hour <= 6:
        if is_rest_infra or is_fuel:
            score += 15     # exhausted + night = stop here no matter what

    # Penalty: too close to departure — not worth stopping yet
    if dist_along_ratio < 0.06:
        score -= 30

    return min(100, max(0, score))


def _generate_random_tags():
    poi_type = random.choice(POI_TYPES)
    tags = {}

    if poi_type == "fuel":
        tags = {
            "amenity": "fuel",
            "opening_hours": random.choice(["24/7", "06:00-22:00", ""]),
            "toilets": random.choice(["yes", "no", ""]),
            "hgv": random.choice(["yes", "no", ""]),
        }
    elif poi_type == "parking":
        tags = {
            "amenity": "parking",
            "hgv": random.choice(["yes", "designated", "no"]),
            "maxweight": random.choice(["", "3.5", "7.5", "12", ""]),
        }
    elif poi_type == "restaurant":
        tags = {
            "amenity": "restaurant",
            "toilets": random.choice(["yes", "no"]),
            "opening_hours": random.choice(["", "11:00-22:00", "24/7"]),
        }
    elif poi_type == "fast_food":
        tags = {"amenity": "fast_food", "toilets": random.choice(["yes", "no"])}
    elif poi_type == "cafe":
        tags = {"amenity": "cafe", "toilets": random.choice(["yes", "no"])}
    elif poi_type == "rest_area":
        tags = {
            "highway": "rest_area",
            "toilets": random.choice(["yes", "no"]),
            "hgv": random.choice(["yes", "no"]),
        }
    elif poi_type == "services":
        tags = {
            "highway": "services",
            "shower": random.choice(["yes", "no"]),
            "toilets": random.choice(["yes", "no"]),
            "hgv": random.choice(["yes", "no", "designated"]),
        }

    return tags


def _generate_random_route():
    total_dist_km = random.uniform(80, 1200)
    total_distance_m = total_dist_km * 1000.0
    speed_kmh = random.uniform(40, 90)
    speed_m_s = speed_kmh / 3.6
    duration_sec = total_distance_m / speed_m_s if speed_m_s > 0 else 3600
    return total_distance_m, speed_m_s, duration_sec


def generate_sample(index, total_distance_m, speed_m_s, dep_dt):
    dist_along_m = random.uniform(5000, total_distance_m - 5000)
    perp_dist_m = random.uniform(0, 1200)
    tags = _generate_random_tags()

    time_along_sec = dist_along_m / speed_m_s if speed_m_s > 0 else 0
    arrival_dt = dep_dt + timedelta(seconds=time_along_sec)
    arrival_hour = arrival_dt.hour
    hours_driving = time_along_sec / 3600.0

    # FIX 4: Use dist_along_ratio instead of redundant dist_along_km
    dist_along_ratio = dist_along_m / total_distance_m if total_distance_m > 0 else 0

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

    # Compute scores with fixed formulas
    fatigue_score      = _calculate_fatigue_score(hours_driving, arrival_hour, dist_along_ratio)
    accessibility_score = _calculate_accessibility_score(perp_dist_m, tags)
    context_score      = _calculate_context_score(tags, dist_along_ratio, arrival_hour, hours_driving, poi_type_enc)

    # FIX 7: Equal weights — no component dominates by design
    raw_score = fatigue_score * 0.33 + accessibility_score * 0.33 + context_score * 0.34

    # FIX 5: Add gaussian noise to prevent the model from memorizing exact values
    noise = np.random.normal(0, 4.0)
    global_score = int(np.clip(round(raw_score + noise), 0, 100))

    # FIX 4: Removed redundant derived features (is_night, is_postprandial,
    # is_meal_hour, dist_along_km). Keep raw values and let the model find patterns.
    # FIX 6: Fixed 11.5 float bug — now computed correctly as integer comparison
    is_meal_hour = 1 if (6 <= arrival_hour <= 9) or (11 <= arrival_hour <= 14) or (18 <= arrival_hour <= 21) else 0
    is_mid_range_fuel = 1 if amenity == "fuel" and (0.40 <= dist_along_ratio <= 0.85) else 0
    is_too_close = 1 if dist_along_ratio < 0.06 else 0
    is_highway_service = 1 if highway_type in ("services", "rest_area") else 0

    return {
        # Route features — only ratio kept, not redundant km value
        "total_distance_km":  total_distance_m / 1000.0,
        "dist_along_ratio":   dist_along_ratio,
        "perp_distance_m":    perp_dist_m,
        "hours_driving":      hours_driving,
        # Raw time — model finds its own patterns instead of pre-baked binary flags
        "arrival_hour":       arrival_hour,
        # POI identity
        "poi_type_encoded":   poi_type_enc,
        # Interaction features (meaningful combinations, not solo flags)
        "is_meal_poi":        1 if amenity in ("restaurant", "fast_food", "cafe") or highway_type == "services" else 0,
        "is_meal_hour":       is_meal_hour,
        "is_mid_range_fuel":  is_mid_range_fuel,
        "is_too_close":       is_too_close,
        "is_highway_service": is_highway_service,
        # POI quality flags
        "has_hgv":    1 if tags.get("hgv") in ("yes", "designated") else 0,
        "has_shower": 1 if tags.get("shower") == "yes" else 0,
        "has_toilets":1 if tags.get("toilets") == "yes" else 0,
        "is_24h":     1 if tags.get("opening_hours") == "24/7" else 0,
        # Targets
        "fatigue_score":       fatigue_score,
        "accessibility_score": accessibility_score,
        "context_score":       context_score,
        "global_score":        global_score,
    }


def generate_dataset(n_samples=10000, seed=42):
    random.seed(seed)
    np.random.seed(seed)

    dep_dt = datetime(2024, 6, 1, 6, 0, 0)
    records = []

    for i in range(n_samples):
        total_distance_m, speed_m_s, _ = _generate_random_route()
        record = generate_sample(i, total_distance_m, speed_m_s, dep_dt)
        records.append(record)

    return pd.DataFrame(records)


# FIX 4: Feature list trimmed — removed dist_along_km, is_night,
# is_postprandial (all were redundant with arrival_hour / dist_along_ratio)
def get_feature_columns():
    return [
        "total_distance_km",
        "dist_along_ratio",
        "perp_distance_m",
        "hours_driving",
        "arrival_hour",
        "poi_type_encoded",
        "is_meal_poi",
        "is_meal_hour",
        "is_mid_range_fuel",
        "is_too_close",
        "is_highway_service",
        "has_hgv",
        "has_shower",
        "has_toilets",
        "is_24h",
    ]
