/**
 * logiway_soak_test.js — Test d'endurance (Soak Test) LogiWay
 *
 * Maintient une charge modérée pendant longtemps pour détecter :
 *  - Fuites mémoire (memory leaks)
 *  - Dégradation progressive des performances
 *  - Connexions BDD non libérées (pool exhaustion)
 *
 * Usage :
 *   k6 run tests-perf/logiway_soak_test.js
 *   k6 run -e JWT_TOKEN="<token>" -e DURATION="30m" tests-perf/logiway_soak_test.js
 */
import http from 'k6/http';
import { sleep, check } from 'k6';
import { Rate, Trend } from 'k6/metrics';

const errorRate    = new Rate('errors');
const reqDuration  = new Trend('req_duration_trend', true);

const DURATION = __ENV.DURATION || '10m'; // Par défaut 10 minutes (30m pour soak réel)

export const options = {
  stages: [
    { duration: '2m',      target: 20 },    // Montée douce
    { duration: DURATION,  target: 20 },    // Plateau stable (charge modérée)
    { duration: '2m',      target: 0  },    // Descente
  ],
  thresholds: {
    // En soak test, on surveille la dégradation — les seuils sont strictement maintenus
    'http_req_duration': ['p(95)<2000', 'p(99)<4000'],
    'http_req_failed':   ['rate<0.02'],   // Max 2% d'erreurs
    'errors':            ['rate<0.02'],
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
  // Scénario utilisateur : consultation des ressources principales

  // 1. Liste trajets
  const t1 = Date.now();
  const trajets = http.get(`${BASE_URL}/api/trajets?page=0&size=10`, { headers: HEADERS });
  reqDuration.add(Date.now() - t1);
  check(trajets, { 'trajets 200': (r) => r.status === 200 }) || errorRate.add(1);
  sleep(1);

  // 3. Pauses
  const pauses = http.get(`${BASE_URL}/api/trajets/1/pauses`, { headers: HEADERS });
  check(pauses, { 'pauses 200/404': (r) => [200, 404].includes(r.status) }) || errorRate.add(1);
  sleep(1);

  // 4. Réclamations
  const reclam = http.get(`${BASE_URL}/api/reclamations?page=0&size=5`, { headers: HEADERS });
  check(reclam, { 'reclamations 200': (r) => r.status === 200 }) || errorRate.add(1);
  sleep(2);
}
