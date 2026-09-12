/**
 * logiway_load_test.js — Test de performance / charge LogiWay
 *
 * ✅ Login Keycloak AUTOMATIQUE au démarrage — plus besoin de token manuel.
 *
 * Usage simple (credentials dans le fichier) :
 *   k6 run tests-perf/logiway_load_test.js
 *
 * Usage avec credentials en paramètre :
 *   k6 run -e KC_PASS="monmotdepasse" tests-perf/logiway_load_test.js
 */
import http from 'k6/http';
import { sleep, check } from 'k6';
import { Rate, Trend } from 'k6/metrics';

// ─── Métriques personnalisées ─────────────────────────────────
const errorRate          = new Rate('errors');
const trajetListDuration = new Trend('trajet_list_duration', true);
const pauseDuration      = new Trend('pause_generation_duration', true);
const notifDuration      = new Trend('notification_list_duration', true);

// ─── Scénario de charge ───────────────────────────────────────
export const options = {
  stages: [
    { duration: '30s', target: 10 },
    { duration: '1m',  target: 50 },
    { duration: '30s', target: 0  },
  ],
  thresholds: {
    'http_req_duration':           ['p(95)<2000'],
    'trajet_list_duration':        ['p(90)<1500'],
    'pause_generation_duration':   ['p(90)<5000'],
    'notification_list_duration':  ['p(90)<1500'],
  },
};

// ─── Configuration — modifie KC_PASS avec ton mot de passe ───
const BASE_URL  = __ENV.BASE_URL  || 'http://localhost:8080';
const KC_URL    = __ENV.KC_URL    || 'http://localhost:8180';
const KC_REALM  = __ENV.KC_REALM  || 'logiway';
const KC_CLIENT = __ENV.KC_CLIENT || 'logiway';
const KC_USER   = __ENV.KC_USER   || 'kossayboubaker96@gmail.com';
// ↓↓↓ METS TON MOT DE PASSE ICI ↓↓↓
const KC_PASS   = __ENV.KC_PASS   || 'alitounsi';
// ↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑

// ─── Setup : login Keycloak UNE FOIS avant les VUs ───────────
export function setup() {
  console.log(`🔐 Login Keycloak : ${KC_USER} sur ${KC_URL}/realms/${KC_REALM}`);

  const loginResp = http.post(
    `${KC_URL}/realms/${KC_REALM}/protocol/openid-connect/token`,
    `grant_type=password&client_id=${KC_CLIENT}&username=${KC_USER}&password=${KC_PASS}`,
    { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }
  );

  if (loginResp.status !== 200) {
    console.error(`❌ Login échoué (${loginResp.status}) : ${loginResp.body}`);
    // Fallback : utilise JWT_TOKEN passé en env si disponible
    const fallback = __ENV.JWT_TOKEN || '';
    if (fallback) {
      console.warn('⚠️  Utilisation du JWT_TOKEN de secours.');
      return { token: fallback };
    }
    console.error('❌ Aucun token disponible — les checks vont échouer.');
    return { token: '' };
  }

  const json  = JSON.parse(loginResp.body);
  const token = json.access_token;
  console.log(`✅ Token obtenu — expire dans ${json.expires_in}s`);
  return { token };
}

// ─── Scénario principal (reçoit le token du setup) ───────────
export default function (data) {
  const token = (data && data.token) ? data.token : (__ENV.JWT_TOKEN || '');

  const HEADERS = {
    'Content-Type':  'application/json',
    'Accept':        'application/json',
    'Authorization': token ? `Bearer ${token}` : '',
  };

  // 1. Liste des trajets
  const t1 = Date.now();
  const trajetResp = http.get(`${BASE_URL}/api/trajets?page=0&size=10`, { headers: HEADERS });
  trajetListDuration.add(Date.now() - t1);
  check(trajetResp, {
    'trajets status 200': (r) => r.status === 200,
  }) || errorRate.add(1);

  sleep(1);

  // 2. Pauses d'un trajet
  const trajetId = __ENV.TRAJET_ID || '1';
  const t2 = Date.now();
  const pauseResp = http.get(`${BASE_URL}/api/trajets/${trajetId}/pauses`, { headers: HEADERS });
  pauseDuration.add(Date.now() - t2);
  check(pauseResp, {
    'pauses status 200 ou 404': (r) => [200, 404].includes(r.status),
  }) || errorRate.add(1);

  sleep(1);

  // 3. Notifications
  const t3 = Date.now();
  const notifResp = http.get(`${BASE_URL}/api/notifications?page=0&size=5`, { headers: HEADERS });
  notifDuration.add(Date.now() - t3);
  check(notifResp, {
    'notifications status 200': (r) => r.status === 200,
  }) || errorRate.add(1);

  sleep(2);
}
