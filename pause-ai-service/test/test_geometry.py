"""Tests unitaires du service Pause — géométrie (app.py)."""
import pytest

import app


# ----------------------------------------------------------------------------
# decode_polyline
# ----------------------------------------------------------------------------
def test_decode_polyline_flat_route():
    """Polyligne connue Google (encodage officiel)."""
    # Exemple de la doc Google: _p~iF~ps|U_ulLnnqC_mqNvxq`@
    encoded = "_p~iF~ps|U_ulLnnqC_mqNvxq`@"
    coords = app.decode_polyline(encoded)
    expected = [[38.5, -120.2], [40.7, -120.95], [43.252, -126.453]]
    assert len(coords) == len(expected)
    for got, want in zip(coords, expected):
        assert got == pytest.approx(want, abs=0.001)


def test_decode_polyline_empty():
    assert app.decode_polyline("") == []


def test_decode_polyline_single_zero():
    decoded = app.decode_polyline("_p~iF~ps|U")
    assert len(decoded) == 1
    assert decoded[0][0] == pytest.approx(38.5)


# ----------------------------------------------------------------------------
# haversine_m
# ----------------------------------------------------------------------------
def test_haversine_zero_same_point():
    assert app.haversine_m(2.3, 48.8, 2.3, 48.8) == 0.0


def test_haversine_known_distance():
    # Paris (48.8566, 2.3522) -> Versailles (48.8044, 2.1202) ~ 17 km
    d = app.haversine_m(2.3522, 48.8566, 2.1202, 48.8044)
    assert 15000 < d < 19000


# ----------------------------------------------------------------------------
# cumulative_distances
# ----------------------------------------------------------------------------
def test_cumulative_distances_increasing():
    # points [lat, lon]
    route = [[0.0, 0.0], [0.01, 0.0], [0.01, 0.01], [0.02, 0.01]]
    cums = app.cumulative_distances(route)
    assert cums[0] == 0.0
    assert all(cums[i] <= cums[i + 1] for i in range(len(cums) - 1))
    assert cums[-1] > 0


# ----------------------------------------------------------------------------
# interpolate
# ----------------------------------------------------------------------------
def test_interpolate_midpoint():
    p = app.interpolate([0.0, 0.0], [10.0, 10.0], 0.5)
    assert p == pytest.approx([5.0, 5.0])


def test_interpolate_fraction_zero():
    p = app.interpolate([1.0, 2.0], [3.0, 4.0], 0.0)
    assert p == pytest.approx([1.0, 2.0])


def test_interpolate_fraction_one():
    p = app.interpolate([1.0, 2.0], [3.0, 4.0], 1.0)
    assert p == pytest.approx([3.0, 4.0])


# ----------------------------------------------------------------------------
# find_point_at_distance
# ----------------------------------------------------------------------------
def test_find_point_at_distance_short_route_none():
    assert app.find_point_at_distance([[0.0, 0.0]], 100.0) is None


def test_find_point_at_distance_beyond_returns_end():
    route = [[0.0, 0.0], [0.01, 0.0]]
    end = route[-1]
    assert app.find_point_at_distance(route, 10 ** 9) == end


def test_find_point_at_distance_intermediate():
    route = [[0.0, 0.0], [0.01, 0.0], [0.02, 0.0]]
    cums = app.cumulative_distances([[p[1], p[0]] for p in route])
    target = cums[1] - 1.0
    pt = app.find_point_at_distance(route, target)
    # le point doit être entre le début et le point milieu
    assert pt[0] >= route[0][0]
    assert pt[0] <= route[1][0]
