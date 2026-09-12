"""Tests unitaires du service Pause — prédiction & endpoints (app.py)."""
import pytest
from unittest.mock import patch, MagicMock

import app


# ----------------------------------------------------------------------------
# encodeur polyligne (Google) pour construire des routes OSRM fictives
# ----------------------------------------------------------------------------
def _encode_polyline(points):
    out = []
    prev_lat = prev_lng = 0
    for lat, lng in points:
        dlat = round(lat * 1e5) - prev_lat
        dlng = round(lng * 1e5) - prev_lng
        prev_lat += dlat
        prev_lng += dlng
        for val in (dlat, dlng):
            v = val << 1
            if val < 0:
                v = ~v
            while v >= 0x20:
                out.append(chr((0x20 | (v & 0x1f)) + 63))
                v >>= 5
            out.append(chr(v + 63))
    return "".join(out)


def _route_points():
    return [[46.00, 3.00], [46.05, 3.00], [46.10, 3.00], [46.15, 3.00], [46.20, 3.00]]


def _osrm_response(geometry=None):
    if geometry is None:
        geometry = _encode_polyline(_route_points())
    return {
        "routes": [{
            "geometry": geometry,
            "distance": 30000.0,
            "duration": 3600.0,
        }]
    }


@pytest.fixture(autouse=True)
def _reset_overpass_cache():
    app._overpass_available = None
    yield
    app._overpass_available = None


# ----------------------------------------------------------------------------
# predict_pauses : trajet court
# ----------------------------------------------------------------------------
@patch("app.requests.get")
def test_predict_pauses_short_duration_returns_no_osrm_call(mock_get):
    result = app.predict_pauses(46.0, 3.0, 46.2, 3.0,
                                trip_duration_minutes=120)
    assert result["stops"] == []
    assert result["meta"]["break_alert_applicable"] is False
    assert result["meta"]["trip_duration_minutes"] == 120
    mock_get.assert_not_called()


# ----------------------------------------------------------------------------
# predict_pauses : flow complet
# ----------------------------------------------------------------------------
@patch("app.ai_model")
@patch("app.fetch_overpass_pois")
@patch("app.requests.get")
def test_predict_pauses_full_flow(mock_get, mock_pois, mock_model):
    resp = MagicMock()
    resp.json.return_value = _osrm_response()
    mock_get.return_value = resp

    poj_route = _route_points()
    mock_pois.return_value = [
        {"id": "1", "lat": poj_route[1][0], "lon": poj_route[1][1],
         "tags": {"amenity": "fuel", "opening_hours": "24/7", "hgv": "yes"}},
        {"id": "2", "lat": poj_route[3][0], "lon": poj_route[3][1],
         "tags": {"highway": "services", "shower": "yes", "toilets": "yes", "hgv": "yes"}},
    ]
    mock_model.predict.return_value = [85.0, 70.0]

    result = app.predict_pauses(
        46.0, 3.0, 46.2, 3.0,
        trip_id="T1",
        trip_duration_minutes=360,
        departure_time="2024-06-01T06:00:00",
    )

    meta = result["meta"]
    assert meta["break_alert_applicable"] is True
    assert meta["num_stops"] > 0
    assert meta["overpass_pois_found"] == 2

    types = [s["type"] for s in result["stops"]]
    assert "WARNING_ALERT" in types
    assert "MANDATORY_REST" in types
    assert "STATION_SERVICE" in types
    assert "REST_AREA" in types

    # les stops sont triés par distance
    dists = [s["distanceAlongRouteM"] for s in result["stops"]]
    assert dists == sorted(dists)

    # vérifier la dérivation meta
    assert meta["route_distance_m"] == 30000
    assert result["stops"][0]["trip_id"] == "T1"


@patch("app.ai_model")
@patch("app.fetch_overpass_pois")
@patch("app.requests.get")
def test_predict_pauses_departure_time_invalid_falls_back_now(mock_get, mock_pois, mock_model):
    resp = MagicMock()
    resp.json.return_value = _osrm_response()
    mock_get.return_value = resp

    poj_route = _route_points()
    mock_pois.return_value = [
        {"id": "1", "lat": poj_route[1][0], "lon": poj_route[1][1],
         "tags": {"amenity": "fuel"}},
    ]
    mock_model.predict.return_value = [50.0]

    result = app.predict_pauses(
        46.0, 3.0, 46.2, 3.0,
        trip_duration_minutes=300,
        departure_time="not a datetime",
    )
    assert result["meta"]["break_alert_applicable"] is True
    assert result["meta"]["num_stops"] > 0


@patch("app.ai_model")
@patch("app.fetch_overpass_pois")
@patch("app.requests.get")
def test_predict_pauses_dedup_close_candidates(mock_get, mock_pois, mock_model):
    """Deux POIs à <8000m l'un de l'autre -> le second est écarté."""
    resp = MagicMock()
    resp.json.return_value = _osrm_response()
    mock_get.return_value = resp

    route = _route_points()
    # route[1] et route[2] sont espacés d'environ 5565 m (< 8000m)
    mock_pois.return_value = [
        {"id": "1", "lat": route[1][0], "lon": route[1][1],
         "tags": {"amenity": "cafe"}},
        {"id": "2", "lat": route[2][0], "lon": route[2][1],
         "tags": {"amenity": "parking"}},
    ]
    mock_model.predict.side_effect = [[70.0], [80.0]]

    result = app.predict_pauses(46.0, 3.0, 46.2, 3.0,
                                trip_duration_minutes=360,
                                departure_time="2024-06-01T06:00:00")

    # stops candidats (hors alertes obligatoires) : un seul retenu
    candidate_stops = [s for s in result["stops"]
                       if s["type"] not in ("WARNING_ALERT", "MANDATORY_REST")]
    assert len(candidate_stops) == 1
    mock_model.predict.call_count == 2


@patch("app.ai_model")
@patch("app.fetch_overpass_pois")
@patch("app.requests.get")
def test_predict_pauses_fuel_mid_route_context_boost(mock_get, mock_pois, mock_model):
    """Une station essence à mi-route (>40% du trajet) augmente le contexte."""
    resp = MagicMock()
    resp.json.return_value = _osrm_response()
    mock_get.return_value = resp

    route = _route_points()
    mock_pois.return_value = [
        {"id": "1", "lat": route[3][0], "lon": route[3][1],
         "tags": {"amenity": "fuel", "opening_hours": "24/7", "hgv": "yes",
                  "toilets": "yes"}},
    ]
    mock_model.predict.return_value = [80.0]

    result = app.predict_pauses(46.0, 3.0, 46.2, 3.0,
                                trip_duration_minutes=360,
                                departure_time="2024-06-01T06:00:00")

    fuel_stop = next(s for s in result["stops"] if s["type"] == "STATION_SERVICE")
    assert fuel_stop["contextScore"] > 50  # boost mi-trajet + fuel


# ----------------------------------------------------------------------------
# predict_pauses : dérivation durée / départ invalide
# ----------------------------------------------------------------------------
@patch("app.requests.get")
def test_predict_pauses_no_routes(mock_get):
    resp = MagicMock()
    resp.json.return_value = {"routes": []}
    mock_get.return_value = resp
    result = app.predict_pauses(46.0, 3.0, 46.2, 3.0, trip_duration_minutes=300)
    assert result == {"error": "No OSRM routes resolved"}


@patch("app.ai_model")
@patch("app.fetch_overpass_pois")
@patch("app.requests.get")
def test_predict_pauses_duration_none_derived(mock_get, mock_pois, mock_model):
    """Sans trip_duration_minutes, on dérive depuis duration (3600s -> 60 min)."""
    resp = MagicMock()
    resp.json.return_value = _osrm_response()
    mock_get.return_value = resp
    poj_route = _route_points()
    mock_pois.return_value = [
        {"id": "1", "lat": poj_route[1][0], "lon": poj_route[1][1],
         "tags": {"amenity": "cafe"}},
    ]
    mock_model.predict.return_value = [60.0]
    result = app.predict_pauses(46.0, 3.0, 46.2, 3.0, departure_time="2024-06-01T06:00:00")
    assert result["meta"]["trip_duration_minutes"] == 60
    assert result["meta"]["break_alert_applicable"] is True


# ----------------------------------------------------------------------------
# Endpoints
# ----------------------------------------------------------------------------
def test_health_ok(client=None):
    with app.app.test_client() as c:
        resp = c.get("/api/health")
        assert resp.status_code == 200
        data = resp.get_json()
        assert data["status"] == "ok"
        assert data["model_version"] == "v3.0-ml"
        assert "model_trained" in data


@patch("app.ai_model")
def test_train_endpoint_ok(mock_model):
    mock_model.train.return_value = {"n_samples": 10, "n_features": 15}
    with app.app.test_client() as c:
        resp = c.post("/api/train", json={"n_samples": 10})
        assert resp.status_code == 200
        assert resp.get_json()["status"] == "ok"


@patch("app.ai_model")
def test_train_endpoint_empty_body(mock_model):
    mock_model.train.return_value = {"n_samples": 10000, "n_features": 15}
    with app.app.test_client() as c:
        resp = c.post("/api/train", json=None)
        assert resp.status_code == 200
        # body par défaut -> Config.TRAINING_SAMPLES
        assert resp.get_json()["status"] == "ok"
        mock_model.train.assert_called_once_with(n_samples=10000)


def test_train_endpoint_error():
    with app.app.test_client() as c:
        with patch("app.ai_model.train", side_effect=RuntimeError("boom")):
            resp = c.post("/api/train", json={"n_samples": 5})
            assert resp.status_code == 500
            assert resp.get_json()["status"] == "error"


def test_predict_missing_body_400():
    with app.app.test_client() as c:
        resp = c.post("/api/predict", json=None)
        assert resp.status_code == 400
        assert resp.get_json()["error"] == "Request body required"


def test_predict_not_trained_400():
    with app.app.test_client() as c:
        with patch("app.ai_model.is_trained", return_value=False):
            resp = c.post("/api/predict", json={"startLat": 1, "startLon": 1,
                                                "endLat": 2, "endLon": 2})
            assert resp.status_code == 400
            assert "not trained" in resp.get_json()["error"]


@patch("app.predict_pauses")
def test_predict_ok(mock_predict_pauses):
    mock_predict_pauses.return_value = {"stops": [], "meta": {"num_stops": 0}}
    with app.app.test_client() as c:
        resp = c.post("/api/predict", json={
            "startLat": "46.0", "startLon": "3.0", "endLat": "46.2", "endLon": "3.0",
            "trip_id": "T9", "trip_duration_minutes": "300", "departure_time": "2024-06-01T06:00:00"
        })
        assert resp.status_code == 200
        assert resp.get_json() == {"stops": [], "meta": {"num_stops": 0}}
        mock_predict_pauses.assert_called_once()


@patch("app.predict_pauses", side_effect=ValueError("bad coords"))
def test_predict_exception_500(mock_predict_pauses):
    with app.app.test_client() as c:
        resp = c.post("/api/predict", json={
            "startLat": "x", "startLon": "y", "endLat": "0", "endLon": "0"
        })
        assert resp.status_code == 500
        assert "error" in resp.get_json()


def test_predict_batch_missing_candidates_400():
    with app.app.test_client() as c:
        resp = c.post("/api/predict/batch", json={"nope": 1})
        assert resp.status_code == 400


def test_predict_batch_not_trained_400():
    with app.app.test_client() as c:
        with patch("app.ai_model.is_trained", return_value=False):
            resp = c.post("/api/predict/batch", json={"candidates": []})
            assert resp.status_code == 400


@patch("app.ai_model")
def test_predict_batch_ok(mock_model):
    mock_model.is_trained.return_value = True
    mock_model.predict.return_value = [80.0, 40.0]
    cands = [
        {"poi": {"tags": {"amenity": "fuel"}}, "dist_along_m": 1000,
         "total_distance_m": 50000, "perp_dist_m": 10, "arrival_hour": 12, "hours_driving": 1},
        {"poi": {"tags": {}}, "dist_along_m": 2000,
         "total_distance_m": 50000},
    ]
    with app.app.test_client() as c:
        resp = c.post("/api/predict/batch", json={"candidates": cands})
        assert resp.status_code == 200
        scores = resp.get_json()["scores"]
        assert scores[0]["ai_score"] == 80
        assert scores[0]["confidence"] == pytest.approx(0.8)
        # colonnes manquantes (perp_dist_m etc.) complétées par valeurs par défaut
        mock_model.predict.assert_called_once()


@patch("app.ai_model.predict", side_effect=RuntimeError("fail"))
def test_predict_batch_exception_500(mock_predict):
    with app.app.test_client() as c:
        with patch("app.ai_model.is_trained", return_value=True):
            resp = c.post("/api/predict/batch", json={"candidates": [
                {"poi": {}, "dist_along_m": 1000, "total_distance_m": 50000}
            ]})
            assert resp.status_code == 500
