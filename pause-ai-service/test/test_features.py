"""Tests unitaires du service Pause — build_features & map_poi_type (app.py)."""
import pytest

import app


# ----------------------------------------------------------------------------
# build_features
# ----------------------------------------------------------------------------
def test_build_features_fuel_full():
    poi = {"tags": {
        "amenity": "fuel",
        "opening_hours": "24/7",
        "toilets": "yes",
        "hgv": "yes",
    }}
    f = app.build_features(poi, dist_along_m=50000, total_distance_m=100000,
                           perp_dist_m=100, arrival_hour=12, hours_driving=2.0)
    assert f["poi_type_encoded"] == 1
    assert f["dist_along_ratio"] == pytest.approx(0.5)
    assert f["is_meal_poi"] == 0
    assert f["is_meal_hour"] == 1  # 12h
    assert f["is_mid_range_fuel"] == 1  # 0.40 <= 0.5 <= 0.85
    assert f["is_too_close"] == 0
    assert f["is_highway_service"] == 0
    assert f["has_hgv"] == 1
    assert f["has_shower"] == 0
    assert f["has_toilets"] == 1
    assert f["is_24h"] == 1


def test_build_features_restaurant_meal_poi():
    poi = {"tags": {"amenity": "restaurant", "hgv": "designated"}}
    f = app.build_features(poi, dist_along_m=10000, total_distance_m=200000,
                           perp_dist_m=50, arrival_hour=19, hours_driving=3)
    assert f["poi_type_encoded"] == 2
    assert f["is_meal_poi"] == 1
    assert f["is_meal_hour"] == 1  # 19h
    assert f["has_hgv"] == 1
    assert f["total_distance_km"] == pytest.approx(200.0)


def test_build_features_cafe_morning_hour():
    poi = {"tags": {"amenity": "cafe"}}
    f = app.build_features(poi, 1000, 50000, 200, 8, 1)
    assert f["poi_type_encoded"] == 3
    assert f["is_meal_poi"] == 1
    assert f["is_meal_hour"] == 1  # 8h
    assert f["is_too_close"] == 1  # 1000/50000 = 0.02 < 0.06


def test_build_features_rest_area_highway():
    poi = {"tags": {"highway": "rest_area", "toilets": "yes"}}
    f = app.build_features(poi, 20000, 100000, 500, 3, 0.5)
    assert f["poi_type_encoded"] == 4
    assert f["is_highway_service"] == 1
    assert f["is_meal_hour"] == 0  # 3h
    assert f["is_24h"] == 0


def test_build_features_services_type():
    poi = {"tags": {"highway": "services", "shower": "yes", "hgv": "yes"}}
    f = app.build_features(poi, 30000, 100000, 700, 15, 4)
    assert f["poi_type_encoded"] == 5
    assert f["is_highway_service"] == 1
    assert f["has_shower"] == 1
    assert f["has_hgv"] == 1
    assert f["is_meal_poi"] == 1  # services fait partie de is_meal_poi


def test_build_features_default_type_zero():
    poi = {"tags": {"amenity": "parking"}}
    f = app.build_features(poi, 0, 0, 0, 10, 1)
    assert f["poi_type_encoded"] == 0
    assert f["dist_along_ratio"] == 0  # total_distance 0 -> 0
    assert f["is_meal_poi"] == 0


def test_build_features_hgv_no_and_24h():
    poi = {"tags": {"ami-ish": "", "hgv": "no", "opening_hours": "24/7"}}
    f = app.build_features(poi, 1000, 10000, 0, 7, 1)
    assert f["has_hgv"] == 0
    assert f["is_24h"] == 1
    assert f["is_too_close"] == 0  # 1000/10000 = 0.1 > 0.06


# ----------------------------------------------------------------------------
# map_poi_type
# ----------------------------------------------------------------------------
def test_map_poi_type_station_fuel():
    assert app.map_poi_type({"amenity": "fuel"}) == "STATION_SERVICE"


def test_map_poi_type_rest_area():
    assert app.map_poi_type({"highway": "rest_area"}) == "REST_AREA"
    assert app.map_poi_type({"highway": "services"}) == "REST_AREA"


def test_map_poi_type_cafe():
    assert app.map_poi_type({"amenity": "cafe"}) == "CAFE"


def test_map_poi_type_kiosk():
    assert app.map_poi_type({"amenity": "fast_food"}) == "KIOSK"
    assert app.map_poi_type({"amenity": "restaurant"}) == "KIOSK"


def test_map_poi_type_parking():
    assert app.map_poi_type({"amenity": "parking"}) == "PARKING"


def test_map_poi_type_default():
    assert app.map_poi_type({}) == "POI"
