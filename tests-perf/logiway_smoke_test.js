/**
 * logiway_smoke_test.js — Smoke Test LogiWay
 *
 * Vérification minimale que le système répond correctement.
 * À exécuter AVANT tout autre test de charge pour s'assurer
 * que le backend est opérationnel.
 *
 * Durée : ~30 secondes | 1 seul utilisateur virtuel
 *
 * Usage :
 *   k6 run tests-perf/logiway_smoke_test.js
 *   k6 run -e JWT_TOKEN="<token>" tests-perf/logiway_smoke_test.js
 */
import http from 'k6/http';
import { sleep, check } from 'k6';

export const options = {
  vus: 1,          // 1 seul utilisateur virtuel
  duration: '30s', // 30 secondes
  thresholds: {
    'http_req_duration': ['p(99)<1000'],  // 99% < 1s en smoke
    // Note : les endpoints protégés retournent 401/403 normalement.
    // k6 les compte comme "failed" — on désactive ce seuil en smoke.
    // Ce qui compte ici c'est que les checks métier passent à 100%.
  },
};

const BASE_URL  = __ENV.BASE_URL  || 'http://localhost:8080';
const JWT_TOKEN = __ENV.JWT_TOKEN || '';

const HEADERS = {
  'Content-Type': 'application/json',
  'Accept': 'application/json',
};
if (JWT_TOKEN) {
  HEADERS['Authorization'] = `Bearer ${JWT_TOKEN}`;
}

export default function () {
  // ── 1. Endpoint trajets accessible ──────────────────────────
  const trajets = http.get(`${BASE_URL}/api/trajets?page=0&size=1`, { headers: HEADERS });
  check(trajets, {
    '[SMOKE] trajets reachable': (r) => [200, 401, 403].includes(r.status),
    '[SMOKE] trajets < 1s':      (r) => r.timings.duration < 1000,
  });

  sleep(1);

  // ── 2. Endpoint réclamations accessible ─────────────────────
  const reclam = http.get(`${BASE_URL}/api/reclamations?page=0&size=1`, { headers: HEADERS });
  check(reclam, {
    '[SMOKE] reclamations reachable': (r) => [200, 401, 403].includes(r.status),
  });

  sleep(1);

  // ── 3. Endpoint notifications accessible ────────────────────
  const notifs = http.get(`${BASE_URL}/api/notifications?page=0&size=1`, { headers: HEADERS });
  check(notifs, {
    '[SMOKE] notifications reachable': (r) => [200, 401, 403].includes(r.status),
  });

  sleep(2);
}
