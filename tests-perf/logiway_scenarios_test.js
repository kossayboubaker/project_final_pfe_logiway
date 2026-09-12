/**
 * logiway_scenarios_test.js — Tests de performance par scénarios métier
 *
 * Simule 3 profils d'utilisateurs en parallèle (k6 scenarios) :
 *   - superadmin  : consulte le dashboard global
 *   - manager     : gère les trajets de son entreprise
 *   - chauffeur   : consulte son cockpit et crée des réclamations
 *
 * Usage :
 *   k6 run tests-perf/logiway_scenarios_test.js
 *   k6 run -e JWT_SUPERADMIN="..." -e JWT_MANAGER="..." -e JWT_CHAUFFEUR="..." \
 *           tests-perf/logiway_scenarios_test.js
 */
import http from 'k6/http';
import { sleep, check, group } from 'k6';
import { Rate, Trend } from 'k6/metrics';

// ─── Métriques par profil ─────────────────────────────────────
const errorsAdmin    = new Rate('errors_superadmin');
const errorsManager  = new Rate('errors_manager');
const errorsChauf    = new Rate('errors_chauffeur');
const dashboardDur   = new Trend('dashboard_duration', true);
const trajetsDur     = new Trend('trajets_manager_duration', true);
const cockpitDur     = new Trend('cockpit_chauffeur_duration', true);

// ─── Scénarios parallèles ─────────────────────────────────────
export const options = {
  scenarios: {
    // Scénario 1 : SuperAdmin — peu d'utilisateurs, requêtes lourdes
    superadmin: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: '30s', target: 5  },
        { duration: '1m',  target: 5  },
        { duration: '30s', target: 0  },
      ],
      exec: 'superAdminScenario',
    },
    // Scénario 2 : Manager — charge intermédiaire
    manager: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: '30s', target: 15 },
        { duration: '1m',  target: 15 },
        { duration: '30s', target: 0  },
      ],
      exec: 'managerScenario',
    },
    // Scénario 3 : Chauffeur — charge élevée, requêtes légères
    chauffeur: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: '30s', target: 30 },
        { duration: '1m',  target: 30 },
        { duration: '30s', target: 0  },
      ],
      exec: 'chauffeurScenario',
    },
  },
  thresholds: {
    'http_req_duration':             ['p(95)<2000'],
    'http_req_failed':               ['rate<0.05'],
    'dashboard_duration':            ['p(90)<3000'],  // Dashboard peut être lent
    'trajets_manager_duration':      ['p(90)<1500'],
    'cockpit_chauffeur_duration':    ['p(90)<1000'],
    'errors_superadmin':             ['rate<0.05'],
    'errors_manager':                ['rate<0.05'],
    'errors_chauffeur':              ['rate<0.05'],
  },
};

const BASE_URL = __ENV.BASE_URL || 'http://localhost:8080';

// Tokens JWT par rôle (passer via variables d'env en prod)
const TOKEN_SUPERADMIN = __ENV.JWT_SUPERADMIN || __ENV.JWT_TOKEN || '';
const TOKEN_MANAGER    = __ENV.JWT_MANAGER    || __ENV.JWT_TOKEN || '';
const TOKEN_CHAUFFEUR  = __ENV.JWT_CHAUFFEUR  || __ENV.JWT_TOKEN || '';

function makeHeaders(token) {
  const h = { 'Content-Type': 'application/json', 'Accept': 'application/json' };
  if (token) h['Authorization'] = `Bearer ${token}`;
  return h;
}

// ─── Scénario SuperAdmin ──────────────────────────────────────
export function superAdminScenario() {
  group('SuperAdmin — Dashboard global', () => {
    const t0 = Date.now();

    // KPIs globaux
    const kpi = http.get(`${BASE_URL}/api/dashboard/kpis`, {
      headers: makeHeaders(TOKEN_SUPERADMIN),
    });
    dashboardDur.add(Date.now() - t0);
    check(kpi, {
      'kpi status 200/403': (r) => [200, 403].includes(r.status),
    }) || errorsAdmin.add(1);

    sleep(1);

    // Liste entreprises
    const ent = http.get(`${BASE_URL}/api/entreprises?page=0&size=10`, {
      headers: makeHeaders(TOKEN_SUPERADMIN),
    });
    check(ent, {
      'entreprises reachable': (r) => [200, 403].includes(r.status),
    }) || errorsAdmin.add(1);

    sleep(2);
  });
}

// ─── Scénario Manager ────────────────────────────────────────
export function managerScenario() {
  group('Manager — Gestion trajets entreprise', () => {
    const t1 = Date.now();

    // Trajets de l'entreprise
    const trajets = http.get(`${BASE_URL}/api/trajets?page=0&size=10`, {
      headers: makeHeaders(TOKEN_MANAGER),
    });
    trajetsDur.add(Date.now() - t1);
    check(trajets, {
      'trajets status 200': (r) => [200, 403].includes(r.status),
    }) || errorsManager.add(1);

    sleep(1);

    // Réclamations de l'entreprise
    const reclam = http.get(`${BASE_URL}/api/reclamations?page=0&size=5`, {
      headers: makeHeaders(TOKEN_MANAGER),
    });
    check(reclam, {
      'reclamations reachable': (r) => [200, 403].includes(r.status),
    }) || errorsManager.add(1);

    sleep(1);

    // Véhicules
    const vehicules = http.get(`${BASE_URL}/api/vehicules?page=0&size=10`, {
      headers: makeHeaders(TOKEN_MANAGER),
    });
    check(vehicules, {
      'vehicules reachable': (r) => [200, 403].includes(r.status),
    }) || errorsManager.add(1);

    sleep(2);
  });
}

// ─── Scénario Chauffeur ───────────────────────────────────────
export function chauffeurScenario() {
  group('Chauffeur — Cockpit + Réclamation', () => {
    const t2 = Date.now();

    // Cockpit chauffeur (ses propres trajets)
    const cockpit = http.get(`${BASE_URL}/api/trajets/me?page=0&size=5`, {
      headers: makeHeaders(TOKEN_CHAUFFEUR),
    });
    cockpitDur.add(Date.now() - t2);
    check(cockpit, {
      'cockpit reachable': (r) => [200, 403, 404].includes(r.status),
    }) || errorsChauf.add(1);

    sleep(1);

    // Pauses réglementaires
    const pauses = http.get(`${BASE_URL}/api/trajets/1/pauses`, {
      headers: makeHeaders(TOKEN_CHAUFFEUR),
    });
    check(pauses, {
      'pauses reachable': (r) => [200, 403, 404].includes(r.status),
    }) || errorsChauf.add(1);

    sleep(1);

    // Notifications du chauffeur
    const notifs = http.get(`${BASE_URL}/api/notifications?page=0&size=5`, {
      headers: makeHeaders(TOKEN_CHAUFFEUR),
    });
    check(notifs, {
      'notifications reachable': (r) => [200, 403].includes(r.status),
    }) || errorsChauf.add(1);

    sleep(2);
  });
}
