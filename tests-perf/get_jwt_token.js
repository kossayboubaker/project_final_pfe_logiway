/**
 * get_jwt_token.js — Utilitaire : obtenir un token JWT via Keycloak
 *
 * Ce script n'est PAS un test de charge. Il sert à récupérer un token JWT
 * valide depuis Keycloak pour l'injecter dans les tests de performance.
 *
 * Usage (à exécuter UNE FOIS avant les tests) :
 *   node get_jwt_token.js
 *
 * Ou manuellement avec curl :
 *   curl -X POST http://localhost:8180/realms/logiway/protocol/openid-connect/token \
 *     -H "Content-Type: application/x-www-form-urlencoded" \
 *     -d "grant_type=password&client_id=logiway-client&username=admin@logiway.com&password=Admin@2025"
 *
 * Puis injecter dans k6 :
 *   k6 run -e JWT_TOKEN="eyJhbGciOiJSUzI1NiJ9..." tests-perf/logiway_load_test.js
 */

const https = require('http'); // http car localhost

const KEYCLOAK_URL = process.env.KEYCLOAK_URL || 'http://localhost:8180';
const REALM        = process.env.REALM        || 'logiway';
const CLIENT_ID    = process.env.CLIENT_ID    || 'logiway';   // client_id réel du projet
const USERNAME     = process.env.KC_USER      || 'admin@logiway.com';
const PASSWORD     = process.env.KC_PASS      || 'Admin@2025';

const body = new URLSearchParams({
  grant_type: 'password',
  client_id: CLIENT_ID,
  username: USERNAME,
  password: PASSWORD,
}).toString();

const url = new URL(`${KEYCLOAK_URL}/realms/${REALM}/protocol/openid-connect/token`);

const options = {
  hostname: url.hostname,
  port: url.port || 80,
  path: url.pathname,
  method: 'POST',
  headers: {
    'Content-Type': 'application/x-www-form-urlencoded',
    'Content-Length': Buffer.byteLength(body),
  },
};

const req = https.request(options, (res) => {
  let data = '';
  res.on('data', (chunk) => { data += chunk; });
  res.on('end', () => {
    try {
      const json = JSON.parse(data);
      if (json.access_token) {
        console.log('\n✅ Token JWT obtenu avec succès !\n');
        console.log('─── Commandes k6 prêtes à copier-coller ───────────────────');
        console.log(`\nk6 run -e JWT_TOKEN="${json.access_token}" tests-perf/logiway_smoke_test.js`);
        console.log(`\nk6 run -e JWT_TOKEN="${json.access_token}" tests-perf/logiway_load_test.js`);
        console.log(`\nk6 run -e JWT_TOKEN="${json.access_token}" tests-perf/logiway_stress_test.js`);
        console.log('\n────────────────────────────────────────────────────────────');
      } else {
        console.error('❌ Erreur Keycloak :', json.error_description || data);
      }
    } catch (e) {
      console.error('❌ Réponse invalide :', data);
    }
  });
});

req.on('error', (e) => {
  console.error(`❌ Connexion impossible à Keycloak (${KEYCLOAK_URL}) :`, e.message);
  console.log('\n💡 Vérifiez que Keycloak est démarré sur le port 8180.');
});

req.write(body);
req.end();
