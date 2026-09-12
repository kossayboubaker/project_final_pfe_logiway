/**
 * logiway_stress_test.js — Test de stress LogiWay
 *
 * Pousse le système au-delà de sa limite pour trouver le point de rupture.
 * ⚠️  À exécuter UNIQUEMENT sur un environnement de test, jamais en production.
 *
 * Usage :
 *   k6 run tests-perf/logiway_stress_test.js
 *   k6 run -e JWT_TOKEN="<token>" tests-perf/logiway_stress_test.js
 */
import http from 'k6/http';
import { sleep, check } from 'k6';
import { Rate, Trend, Counter } from 'k6/metrics';

// ─── Métriques personnalisées ─────────────────────────────────
const errorRate    = new Rate('errors');
const reqDuration  = new Trend('req_duration_trend', true);
const totalErrors  = new Counter('total_errors');

// ─── Scénario de stress (montée agressive) ────────────────────
export const options = {
  stages: [
    { duration: '1m',  target: 50  },  // Montée normale
    { duration: '2m',  target: 100 },  // Double la charge
    { duration: '2m',  target: 200 },  // Pression forte
    { duration: '1m',  target: 300 },  // Point de rupture potentiel
    { duration: '2m',  target: 0   },  // Recovery
  ],
  thresholds: {
    // On observe mais on ne bloque pas — on cherche le point de rupture
    'http_req_duration': ['p(95)<10000'],  // Tolérance haute en stress
    'http_req_failed':   ['rate<0.30'],    // 30% max d'erreurs acceptées
    'errors':            ['rate<0.30'],
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
  const t0 = Date.now();

  // Requête principale : liste des trajets
  const res = http.get(`${BASE_URL}/api/trajets?page=0&size=5`, {
    headers: HEADERS,
    timeout: '10s',
  });

  reqDuration.add(Date.now() - t0);

  const ok = check(res, {
    'status 200': (r) => r.status === 200,
    'response time < 5s': (r) => r.timings.duration < 5000,
  });

  if (!ok) {
    errorRate.add(1);
    totalErrors.add(1);
  }

  sleep(0.5);
}
