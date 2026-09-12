from __future__ import annotations

import json
import sys

from trip_route_utils import (
    BACKEND_URL,
    DEFAULT_STEP_SECONDS,
    OSRM_URL,
    build_trip_snapshot,
    emit_route_points,
    fetch_trips,
    nearest_route_index,
    resolve_route,
    select_trip,
    start_trip_if_needed,
)


def run(
    trip_id: str | None = None,
    vehicle_id: str | None = None,
    driver_id: str | None = None,
    backend_url: str = BACKEND_URL,
    osrm_url: str = OSRM_URL,
    step_seconds: float = DEFAULT_STEP_SECONDS,
) -> int:
    trips = fetch_trips(backend_url)
    trip = select_trip(trips, trip_id=trip_id, vehicle_id=vehicle_id, driver_id=driver_id)

    if not trip:
        print(json.dumps({"error": "No active trip found", "backend_url": backend_url}, ensure_ascii=False))
        return 1

    route_context = resolve_route(trip, osrm_url=osrm_url)
    if not route_context:
        print(json.dumps({"error": "Unable to resolve route for trip", "trip_id": trip.get("id")}, ensure_ascii=False))
        return 1

    route = route_context.route
    trip_identifier = str(trip.get("id"))
    start_trip_if_needed(trip_identifier, backend_url=backend_url)

    current_position = None
    if trip.get("vehiculeLongitude") is not None and trip.get("vehiculeLatitude") is not None:
        current_position = [float(trip.get("vehiculeLongitude")), float(trip.get("vehiculeLatitude"))]

    start_index = nearest_route_index(route, current_position)
    snapshot = build_trip_snapshot(trip, route)
    print(json.dumps({"status": "started", **snapshot}, ensure_ascii=False))

    emit_route_points(
        trip=trip,
        route=route,
        backend_url=backend_url,
        step_seconds=step_seconds,
        start_index=start_index,
    )

    print(json.dumps({"status": "completed", "trip_id": trip_identifier, "points": len(route)}, ensure_ascii=False))
    return 0


def main() -> None:
    try:
        payload = json.loads(sys.stdin.read() or "{}")
    except Exception as exc:
        print(json.dumps({"error": f"Invalid input JSON: {exc}"}, ensure_ascii=False))
        raise SystemExit(1)

    exit_code = run(
        trip_id=str(payload.get("trip_id")) if payload.get("trip_id") is not None else None,
        vehicle_id=str(payload.get("vehicle_id")) if payload.get("vehicle_id") is not None else None,
        driver_id=str(payload.get("driver_id")) if payload.get("driver_id") is not None else None,
        backend_url=str(payload.get("backend_url") or BACKEND_URL),
        osrm_url=str(payload.get("osrm_url") or OSRM_URL),
        step_seconds=float(payload.get("step_seconds") or DEFAULT_STEP_SECONDS),
    )
    raise SystemExit(exit_code)


if __name__ == "__main__":
    main()
