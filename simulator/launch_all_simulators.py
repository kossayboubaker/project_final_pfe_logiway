#!/usr/bin/env python3
"""
LogiWay — Lanceur parallèle de simulateurs GPS
===============================================
Lance un simulateur indépendant pour chaque trajet EN_COURS trouvé dans le backend.
Chaque trajet est simulé dans un thread séparé — aucun trajet n'attend un autre.

Ne modifie pas truck_simulator_fixed.py.

Usage:
    python launch_all_simulators.py
    python launch_all_simulators.py --step 2.0          # Intervalle GPS en secondes
    python launch_all_simulators.py --backend http://localhost:8080
    python launch_all_simulators.py --loop              # Relance en boucle toutes les 30s
    python launch_all_simulators.py --trip-id 5         # Simule uniquement le trajet #5

Règles:
    - NE PAS modifier truck_simulator_fixed.py
    - Chaque trajet EN_COURS est simulé en parallèle dans son propre thread
    - Si un thread se termine (trajet complété ou erreur), il ne bloque pas les autres
    - Le script peut être relancé : les trajets déjà complétés sont ignorés
"""
from __future__ import annotations

import argparse
import sys
import time
import threading
from datetime import datetime
from typing import Any

import random

from trip_route_utils import (
    BACKEND_URL,
    DEFAULT_STEP_SECONDS,
    OSRM_URL,
    WEATHER_REFRESH_SECONDS,
    ACTIVE_STATUSES,
    fetch_trips,
    fetch_weather,
    resolve_route,
    nearest_route_index,
    start_trip_if_needed,
    finish_trip_if_needed,
    post_position,
    is_weather_dangerous,
    weather_speed_multiplier,
    weather_fuel_multiplier,
    build_trip_snapshot,
)


def _log(prefix: str, msg: str) -> None:
    ts = datetime.now().strftime("%H:%M:%S")
    print(f"[{ts}] [{prefix}] {msg}", flush=True)


def simulate_one_trip(
    trip: dict[str, Any],
    backend_url: str = BACKEND_URL,
    osrm_url: str = OSRM_URL,
    step_seconds: float = DEFAULT_STEP_SECONDS,
    auto_finish: bool = True,
) -> None:
    """
    Simule un seul trajet dans le thread courant avec logs détaillés.
    Appelé depuis un thread séparé pour chaque trajet EN_COURS.
    """
    trip_id = str(trip.get("id", "?"))
    label = f"Trajet#{trip_id}"
    depart = trip.get("pointDepart", "?")
    dest   = trip.get("destination", "?")

    _log(label, "=" * 56)
    _log(label, f"🚛 Démarrage simulation : {depart} → {dest}")
    _log(label, f"   ID trajet : {trip_id}")
    _log(label, "=" * 56)

    # ── Résoudre l'itinéraire OSRM ──────────────────────────────
    route_context = resolve_route(trip, osrm_url=osrm_url)
    if not route_context:
        _log(label, "❌ Impossible de résoudre l'itinéraire — trajet ignoré")
        return

    route          = route_context.route
    distance_km    = route_context.distance_km or 0.0
    duration_min   = route_context.duration_minutes or 0
    total_points   = len(route)

    _log(label, f"✅ Itinéraire OSRM calculé !")
    _log(label, f"   📏 Distance   : {distance_km:.1f} km")
    _log(label, f"   ⏱ Durée      : {duration_min} min")
    _log(label, f"   📍 Points     : {total_points} points de route")

    # ── Démarrer le trajet si pas encore EN_COURS ────────────────
    _log(label, f"▶ Démarrage du trajet {trip_id}...")
    start_trip_if_needed(trip_id, backend_url=backend_url)

    # ── Reprendre depuis la position courante ────────────────────
    current_position = None
    if trip.get("vehiculeLongitude") is not None and trip.get("vehiculeLatitude") is not None:
        current_position = [float(trip["vehiculeLongitude"]), float(trip["vehiculeLatitude"])]
    start_index = nearest_route_index(route, current_position)
    if start_index > 0:
        _log(label, f"   ↪ Reprise depuis le point {start_index}/{total_points}")

    estimated_time = (total_points - start_index) * step_seconds
    _log(label, f"🚀 Simulation lancée !")
    _log(label, f"   Intervalle   : {step_seconds}s entre chaque point")
    _log(label, f"   Durée estimée: ~{estimated_time:.0f}s ({estimated_time / 60:.1f} min)")
    _log(label, "-" * 56)

    # ── Boucle principale ────────────────────────────────────────
    fuel                    = 100.0
    speed_kmh               = float(trip.get("vehiculeVitesse") or 55)
    current_weather         = None
    next_weather_refresh    = 0.0
    current_simulated_time  = 0.0

    try:
        for index in range(start_index, total_points):
            lon, lat = route[index]
            progress = 100.0 if total_points == 1 else round(
                (index / (total_points - 1)) * 100.0, 2
            )
            current_simulated_time += step_seconds

            # Météo — rafraîchie toutes les WEATHER_REFRESH_SECONDS
            if current_weather is None or current_simulated_time >= next_weather_refresh:
                current_weather      = fetch_weather(lat, lon, backend_url=backend_url)
                next_weather_refresh = current_simulated_time + WEATHER_REFRESH_SECONDS

            weather_speed_factor = weather_speed_multiplier(current_weather)
            weather_fuel_factor  = weather_fuel_multiplier(current_weather)

            current_speed = max(10.0, (speed_kmh + random.uniform(-8.0, 10.0)) * weather_speed_factor)
            fuel          = max(5.0, fuel - random.uniform(0.1, 0.4) * weather_fuel_factor)

            # Alerte météo
            weather_extra = ""
            if is_weather_dangerous(current_weather):
                state = str((current_weather or {}).get("etatGeneral") or "").upper()
                if state == "BROUILLARD":
                    weather_extra = " | 🌫️  météo dangereuse"
                elif state == "NEIGE":
                    weather_extra = " | ❄️  météo dangereuse"
                elif state == "ORAGE":
                    weather_extra = " | ⛈️  météo dangereuse"

            # Envoi de la position au backend
            try:
                post_position(trip_id, lat, lon, round(current_speed, 1), round(fuel, 1), backend_url=backend_url)

                # Barre de progression
                bar_len = 28
                filled  = int(bar_len * progress / 100)
                bar     = "█" * filled + "░" * (bar_len - filled)
                _log(
                    label,
                    f"[{bar}] {progress:5.1f}%"
                    f" | 📍 ({lat:.4f}, {lon:.4f})"
                    f" | 🏎 {current_speed:.0f} km/h"
                    f" | ⛽ {fuel:.0f}%"
                    f"{weather_extra}"
                )

            except Exception as send_err:
                _log(label, f"⚠️  Erreur envoi position : {send_err}")
                if hasattr(send_err, "response") and send_err.response is not None:
                    try:
                        _log(label, f"   Réponse backend: {send_err.response.text[:300]}")
                    except Exception:
                        pass

            if index < total_points - 1:
                time.sleep(step_seconds)

        # ── Fin de la simulation ─────────────────────────────────
        _log(label, "-" * 56)
        _log(label, f"🏁 Trajet terminé ! ({depart} → {dest})")
        if auto_finish:
            _log(label, "   → Marquage comme COMPLÉTÉ...")
            finish_trip_if_needed(trip_id, backend_url=backend_url)
            _log(label, "✅ Trajet marqué COMPLÉTÉ")

    except KeyboardInterrupt:
        _log(label, "")
        _log(label, "⏸️ Simulation interrompue par l'utilisateur (Ctrl+C)")
        _log(label, "💾 Position actuelle conservée")

    # 🔥 IMPORTANT : sauvegarde du point actuel pour reprise
    _log(label, f"📍 Index sauvegardé : {index}/{total_points}")
    _log(label, f"📊 Progression : {progress:.1f}%")

    # 👉 ici tu peux stocker start_index dans un fichier si tu veux reprise réelle
    # save_checkpoint(trip_id, index, progress)

    _log(label, "▶️ Relancez le simulateur pour reprendre le trajet")
    return 0

def launch_all(
    backend_url: str = BACKEND_URL,
    osrm_url: str = OSRM_URL,
    step_seconds: float = DEFAULT_STEP_SECONDS,
    trip_id_filter: str | None = None,
    auto_finish: bool = True,
) -> list[threading.Thread]:
    """
    Récupère tous les trajets EN_COURS et lance un thread par trajet.
    Retourne la liste des threads démarrés.
    """
    _log("LAUNCHER", f"Récupération des trajets EN_COURS depuis {backend_url}...")
    try:
        trips = fetch_trips(backend_url)
    except Exception as exc:
        _log("LAUNCHER", f"❌ Connexion impossible : {exc}")
        _log("LAUNCHER", "   → Vérifiez que le backend Spring Boot est démarré sur le port 8080.")
        return []

    # Filtrer par statut actif
    active_trips = [t for t in trips if str(t.get("statut") or "").strip() in ACTIVE_STATUSES]

    if trip_id_filter:
        active_trips = [t for t in active_trips if str(t.get("id")) == str(trip_id_filter)]

    if not active_trips:
        _log("LAUNCHER", "⚠ Aucun trajet EN_COURS trouvé.")
        _log("LAUNCHER", "  → Créez un trajet via l'interface Angular et passez-le en statut EN_COURS.")
        return []

    _log("LAUNCHER", f"✅ {len(active_trips)} trajet(s) EN_COURS trouvé(s) :")
    for t in active_trips:
        _log("LAUNCHER", f"   - Trajet #{t.get('id')} : {t.get('pointDepart', '?')} → {t.get('destination', '?')}")

    threads: list[threading.Thread] = []
    for trip in active_trips:
        thread = threading.Thread(
            target=simulate_one_trip,
            args=(trip,),
            kwargs={
                "backend_url": backend_url,
                "osrm_url": osrm_url,
                "step_seconds": step_seconds,
                "auto_finish": auto_finish,
            },
            daemon=True,
            name=f"sim-trip-{trip.get('id', '?')}",
        )
        thread.start()
        threads.append(thread)
        _log("LAUNCHER", f"▶ Thread démarré pour Trajet #{trip.get('id')}")

    return threads


def main() -> None:
    parser = argparse.ArgumentParser(
        description="LogiWay — Lance un simulateur GPS parallèle pour chaque trajet EN_COURS",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Exemples:
  python launch_all_simulators.py                        # Tous les trajets EN_COURS
  python launch_all_simulators.py --step 1.5             # Intervalle GPS de 1.5s
  python launch_all_simulators.py --trip-id 7            # Uniquement le trajet #7
  python launch_all_simulators.py --loop --step 2.0      # Relance toutes les 30s
  python launch_all_simulators.py --backend http://localhost:8080
        """,
    )
    parser.add_argument("--backend", default=BACKEND_URL, help=f"URL backend (défaut: {BACKEND_URL})")
    parser.add_argument("--osrm", default=OSRM_URL, help=f"URL OSRM (défaut: {OSRM_URL})")
    parser.add_argument(
        "--step",
        type=float,
        default=DEFAULT_STEP_SECONDS,
        help=f"Secondes entre chaque point GPS (défaut: {DEFAULT_STEP_SECONDS})",
    )
    parser.add_argument("--trip-id", help="Simuler uniquement ce trajet (par ID)")
    parser.add_argument(
        "--loop",
        action="store_true",
        help="Relancer automatiquement toutes les 30s pour détecter de nouveaux trajets",
    )
    parser.add_argument("--no-finish", action="store_true", help="Ne pas marquer les trajets comme COMPLÉTÉS")

    args = parser.parse_args()

    _log("LAUNCHER", "=" * 60)
    _log("LAUNCHER", "🚛 LogiWay — Simulateur GPS parallèle multi-trajets")
    _log("LAUNCHER", f"   Backend : {args.backend}")
    _log("LAUNCHER", f"   OSRM    : {args.osrm}")
    _log("LAUNCHER", f"   Étape   : {args.step}s")
    _log("LAUNCHER", "=" * 60)

    if args.loop:
        _log("LAUNCHER", "Mode LOOP activé — relance toutes les 30s pour détecter de nouveaux trajets")
        known_trip_ids: set[str] = set()

        while True:
            try:
                trips = fetch_trips(args.backend)
                active_trips = [
                    t for t in trips
                    if str(t.get("statut") or "").strip() in ACTIVE_STATUSES
                    and str(t.get("id")) not in known_trip_ids
                ]

                if args.trip_id:
                    active_trips = [t for t in active_trips if str(t.get("id")) == str(args.trip_id)]

                for trip in active_trips:
                    tid = str(trip.get("id"))
                    known_trip_ids.add(tid)
                    thread = threading.Thread(
                        target=simulate_one_trip,
                        args=(trip,),
                        kwargs={
                            "backend_url": args.backend,
                            "osrm_url": args.osrm,
                            "step_seconds": args.step,
                            "auto_finish": not args.no_finish,
                        },
                        daemon=True,
                        name=f"sim-trip-{tid}",
                    )
                    thread.start()
                    _log("LAUNCHER", f"▶ Nouveau thread pour Trajet #{tid}")

            except KeyboardInterrupt:
                _log("LAUNCHER", "⛔ Arrêté par l'utilisateur")
                break
            except Exception as exc:
                _log("LAUNCHER", f"⚠ Erreur boucle : {exc}")

            time.sleep(30)

    else:
        # Lancement unique
        threads = launch_all(
            backend_url=args.backend,
            osrm_url=args.osrm,
            step_seconds=args.step,
            trip_id_filter=args.trip_id,
            auto_finish=not args.no_finish,
        )

        if not threads:
            raise SystemExit(1)

        _log("LAUNCHER", f"⏳ En attente de la fin des {len(threads)} thread(s)...")
        try:
            for thread in threads:
                thread.join()
        except KeyboardInterrupt:
            _log("LAUNCHER", "⛔ Interrompu — les threads en cours se termineront naturellement")

        _log("LAUNCHER", "✅ Tous les simulateurs ont terminé.")


if __name__ == "__main__":
    main()
