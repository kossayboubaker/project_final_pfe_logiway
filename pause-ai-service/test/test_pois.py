"""Tests unitaires du service Pause — POIs Overpass (app.py)."""
import pytest
from unittest.mock import patch, MagicMock

import app


@pytest.fixture(autouse=True)
def _reset_overpass_cache():
    app._overpass_available = None
    yield
    app._overpass_available = None


# ----------------------------------------------------------------------------
# fetch_overpass_pois_single
# ----------------------------------------------------------------------------
@patch("app.requests.post")
def test_fetch_overpass_pois_single_regular_node(mock_post):
    mock_resp = MagicMock()
    mock_resp.json.return_value = {
        "elements": [
            {"type": "node", "id": 100, "lat": 48.0, "lon": 2.0,
             "tags": {"amenity": "fuel"}},
            {"type": "way", "id": 200, "center": {"lat": 48.1, "lon": 2.1},
             "tags": {"highway": "services"}},
            {"type": "node", "id": 300, "lat": 48.2, "lon": 2.2,
             "tags": {}},
        ]
    }
    mock_post.return_value = mock_resp

    pois = app.fetch_overpass_pois_single("0,0,0,0", {"User-Agent": "x"})

    assert len(pois) == 3
    assert pois[0]["id"] == "100"
    assert pois[0]["lat"] == 48.0
    assert pois[0]["lon"] == 2.0
    assert pois[1]["lat"] == 48.1  # lat depuis center


@patch("app.requests.post")
def test_fetch_overpass_pois_single_skips_missing_coordinates(mock_post):
    mock_resp = MagicMock()
    mock_resp.json.return_value = {
        "elements": [
            {"type": "way", "id": 10, "tags": {"highway": "services"}},  # pas de lat/lon
        ]
    }
    mock_post.return_value = mock_resp
    pois = app.fetch_overpass_pois_single("bbox", {}, timeout=20)
    assert pois == []


@patch("app.requests.post", side_effect=RuntimeError("network"))
def test_fetch_overpass_pois_single_http_error(mock_post):
    with pytest.raises(RuntimeError):
        app.fetch_overpass_pois_single("bbox", {})


# ----------------------------------------------------------------------------
# _try_overpass_connect
# ----------------------------------------------------------------------------
@patch("app.socket.socket")
def test_try_overpass_connect_success(mock_socket_cls):
    sock = MagicMock()
    sock.connect_ex.return_value = 0
    mock_socket_cls.return_value = sock

    assert app._try_overpass_connect() is True
    assert app._overpass_available is True
    # mis en cache: le socket ne doit plus être re-créé
    assert app._try_overpass_connect() is True
    assert mock_socket_cls.call_count == 1


@patch("app.socket.socket")
def test_try_overpass_connect_failure(mock_socket_cls):
    sock = MagicMock()
    sock.connect_ex.return_value = 1
    mock_socket_cls.return_value = sock
    assert app._try_overpass_connect() is False


@patch("app.socket.socket", side_effect=OSError("no socket"))
def test_try_overpass_connect_exception(mock_socket_cls):
    assert app._try_overpass_connect() is False


def test_try_overpass_connect_cached():
    app._overpass_available = True
    with patch("app.socket.socket") as mock_socket_cls:
        assert app._try_overpass_connect() is True
        mock_socket_cls.assert_not_called()


# ----------------------------------------------------------------------------
# generate_synthetic_pois
# ----------------------------------------------------------------------------
def test_generate_synthetic_pois_short_route_empty():
    route = [[0.0, 0.0], [0.001, 0.0]]  # < 1km
    assert app.generate_synthetic_pois(route) == []


def test_generate_synthetic_pois_produces_pois():
    # Route droite ~111 km (0 à 1.0° de latitude)
    pts = [[i * 0.001, 0.0] for i in range(1001)]
    with patch("app.random.uniform", return_value=10000.0):
        pois = app.generate_synthetic_pois(pts)
    assert isinstance(pois, list)
    assert len(pois) > 0
    for p in pois:
        assert p["id"].startswith("synth_")
        assert "lat" in p and "lon" in p and "tags" in p


def test_generate_synthetic_pois_fuel_tags():
    pts = [[i * 0.001, 0.0] for i in range(1001)]
    # premier POI = fuel (poi_id 0)
    with patch("app.random.uniform", return_value=10000.0):
        pois = app.generate_synthetic_pois(pts)
    assert pois[0]["tags"]["amenity"] == "fuel"


# ----------------------------------------------------------------------------
# fetch_overpass_pois
# ----------------------------------------------------------------------------
@patch("app.fetch_overpass_pois_single")
@patch("app._try_overpass_connect")
def test_fetch_overpass_pois_skips_duplicate_centers(mock_connect, mock_single):
    """Deux centres d'échantillonnage arrondis identiques -> un seul appel API."""
    mock_connect.return_value = True
    mock_single.return_value = [{"id": "1", "lat": 46.0, "lon": 3.0, "tags": {}}]
    # points tous arrondis au même centre (lat ≈ 46.000)
    route = [[46.00002, 3.0], [46.00001, 3.0], [46.00000, 3.0], [45.99999, 3.0]]
    pois = app.fetch_overpass_pois(route)
    assert mock_single.call_count == 1
    assert pois == [{"id": "1", "lat": 46.0, "lon": 3.0, "tags": {}}]


@patch("app.generate_synthetic_pois")
@patch("app.fetch_overpass_pois_single", return_value=[])
@patch("app._try_overpass_connect", return_value=True)
def test_fetch_overpass_pois_fallback_synthetic(mock_connect, mock_single, mock_synth):
    mock_synth.return_value = [{"id": "s0", "lat": 1.0, "lon": 1.0, "tags": {}}]
    route = [[i * 0.001, 0.0] for i in range(10)]
    pois = app.fetch_overpass_pois(route)
    assert pois == mock_synth.return_value


@patch("app.generate_synthetic_pois")
@patch("app._try_overpass_connect", return_value=False)
def test_fetch_overpass_pois_offline_uses_synthetic(mock_connect, mock_synth):
    mock_synth.return_value = [{"id": "s0", "lat": 1.0, "lon": 1.0, "tags": {}}]
    route = [[0.0, 0.0], [0.01, 0.0]]
    pois = app.fetch_overpass_pois(route)
    assert pois == mock_synth.return_value


@patch("app.fetch_overpass_pois_single", side_effect=RuntimeError("boom"))
@patch("app._try_overpass_connect", return_value=True)
def test_fetch_overpass_pois_exception_ignored_and_fallback(mock_connect, mock_single):
    # toutes les requêtes lèvent -> all_pois vide -> unique vide -> synthetic
    route = [[i * 0.001, 0.0] for i in range(10)]
    with patch("app.generate_synthetic_pois", return_value=[{"id": "f"}]):
        pois = app.fetch_overpass_pois(route)
    assert pois == [{"id": "f"}]
