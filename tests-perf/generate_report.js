/**
 * generate_report.js — Génère un rapport HTML à partir de results.json
 * Usage : node tests-perf/generate_report.js
 */
const fs   = require('fs');
const path = require('path');

const inputFile  = path.join(__dirname, 'results.json');
const outputFile = path.join(__dirname, 'rapport_performance.html');

if (!fs.existsSync(inputFile)) {
  console.error('❌ results.json introuvable. Lance d\'abord :');
  console.error('   k6 run --out json=tests-perf\\results.json tests-perf\\logiway_load_test.js');
  process.exit(1);
}

// Lire et parser les métriques depuis le JSON k6
const lines = fs.readFileSync(inputFile, 'utf8').trim().split('\n');
const metrics = {};
const dataPoints = { http_req_duration: [], vus: [], errors: [] };

for (const line of lines) {
  try {
    const obj = JSON.parse(line);
    if (obj.type === 'Point') {
      const name = obj.metric;
      if (!metrics[name]) metrics[name] = { values: [], min: Infinity, max: -Infinity, sum: 0, count: 0 };
      const val = typeof obj.data.value === 'number' ? obj.data.value : 0;
      metrics[name].values.push(val);
      metrics[name].sum += val;
      metrics[name].count += 1;
      if (val < metrics[name].min) metrics[name].min = val;
      if (val > metrics[name].max) metrics[name].max = val;

      // Points pour graphiques
      if (name === 'http_req_duration') dataPoints.http_req_duration.push({ t: obj.data.time, v: val });
      if (name === 'vus')               dataPoints.vus.push({ t: obj.data.time, v: val });
    }
  } catch (_) {}
}

function avg(m)  { return m && m.count > 0 ? (m.sum / m.count).toFixed(2) : 'N/A'; }
function minV(m) { return m && m.count > 0 ? m.min.toFixed(2) : 'N/A'; }
function maxV(m) { return m && m.count > 0 ? m.max.toFixed(2) : 'N/A'; }
function pct(m, p) {
  if (!m || !m.values.length) return 'N/A';
  const sorted = [...m.values].sort((a, b) => a - b);
  const idx = Math.ceil((p / 100) * sorted.length) - 1;
  return sorted[Math.max(0, idx)].toFixed(2);
}

const reqTotal   = metrics['http_reqs']        ? metrics['http_reqs'].count        : 0;
const failedRate = metrics['http_req_failed']   ? (metrics['http_req_failed'].values.filter(v => v === 1).length / metrics['http_req_failed'].count * 100).toFixed(2) : '0';
const maxVus     = metrics['vus_max']           ? maxV(metrics['vus_max'])          : '50';

// Préparer les données pour Chart.js (échantillonnage)
function sample(arr, n) {
  if (arr.length <= n) return arr;
  const step = Math.floor(arr.length / n);
  return arr.filter((_, i) => i % step === 0).slice(0, n);
}
const durPoints  = sample(dataPoints.http_req_duration, 200);
const vusPoints  = sample(dataPoints.vus, 200);
const labels     = durPoints.map((_, i) => i);
const durData    = durPoints.map(p => p.v.toFixed(2));
const vusData    = vusPoints.map(p => p.v);

// Seuils
const p95dur = parseFloat(pct(metrics['http_req_duration'], 95));
const p90traj = parseFloat(pct(metrics['trajet_list_duration'], 90));
const p90notif = parseFloat(pct(metrics['notification_list_duration'], 90));
const p90pause = parseFloat(pct(metrics['pause_generation_duration'], 90));

const ok = (val, seuil) => val <= seuil
  ? `<span style="color:#22c55e">✅ ${val}ms &lt; ${seuil}ms</span>`
  : `<span style="color:#ef4444">❌ ${val}ms &gt; ${seuil}ms</span>`;

const html = `<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="UTF-8">
<title>Rapport Performance LogiWay — k6</title>
<script src="https://cdn.jsdelivr.net/npm/chart.js@4.4.0/dist/chart.umd.min.js"></script>
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: 'Segoe UI', sans-serif; background: #0f172a; color: #e2e8f0; padding: 24px; }
  h1 { font-size: 1.8rem; margin-bottom: 4px; color: #f8fafc; }
  .subtitle { color: #94a3b8; margin-bottom: 24px; font-size: 0.9rem; }
  .grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 16px; margin-bottom: 24px; }
  .card { background: #1e293b; border-radius: 12px; padding: 20px; border: 1px solid #334155; }
  .card .label { font-size: 0.75rem; color: #94a3b8; text-transform: uppercase; letter-spacing: 1px; }
  .card .value { font-size: 2rem; font-weight: bold; color: #38bdf8; margin: 4px 0; }
  .card .sub   { font-size: 0.8rem; color: #64748b; }
  .chart-box  { background: #1e293b; border-radius: 12px; padding: 20px; border: 1px solid #334155; margin-bottom: 24px; }
  .chart-box h2 { font-size: 1rem; color: #94a3b8; margin-bottom: 16px; }
  .thresholds { background: #1e293b; border-radius: 12px; padding: 20px; border: 1px solid #334155; margin-bottom: 24px; }
  .thresholds h2 { font-size: 1rem; color: #94a3b8; margin-bottom: 12px; }
  .thresholds table { width: 100%; border-collapse: collapse; font-size: 0.9rem; }
  .thresholds td { padding: 8px 12px; border-bottom: 1px solid #334155; }
  .thresholds td:first-child { color: #94a3b8; }
  .badge-ok  { background: #14532d; color: #86efac; padding: 2px 10px; border-radius: 99px; font-size: 0.8rem; }
  .badge-err { background: #7f1d1d; color: #fca5a5; padding: 2px 10px; border-radius: 99px; font-size: 0.8rem; }
  canvas { max-height: 280px; }
</style>
</head>
<body>
<h1>📊 Rapport Performance LogiWay</h1>
<p class="subtitle">Test de charge k6 — ${new Date().toLocaleString('fr-FR')} — 50 VUs max / 2 minutes</p>

<div class="grid">
  <div class="card">
    <div class="label">Requêtes totales</div>
    <div class="value">${reqTotal.toLocaleString()}</div>
    <div class="sub">durant le test</div>
  </div>
  <div class="card">
    <div class="label">Taux d'erreur</div>
    <div class="value" style="color:${parseFloat(failedRate)<5?'#22c55e':'#ef4444'}">${failedRate}%</div>
    <div class="sub">seuil : &lt; 5%</div>
  </div>
  <div class="card">
    <div class="label">Durée moy. requête</div>
    <div class="value">${avg(metrics['http_req_duration'])}ms</div>
    <div class="sub">min: ${minV(metrics['http_req_duration'])}ms / max: ${maxV(metrics['http_req_duration'])}ms</div>
  </div>
  <div class="card">
    <div class="label">p95 durée</div>
    <div class="value" style="color:${p95dur<2000?'#22c55e':'#ef4444'}">${p95dur}ms</div>
    <div class="sub">seuil : &lt; 2000ms</div>
  </div>
  <div class="card">
    <div class="label">VUs max</div>
    <div class="value">${maxVus}</div>
    <div class="sub">utilisateurs simultanés</div>
  </div>
</div>

<div class="thresholds">
  <h2>🎯 Seuils de performance</h2>
  <table>
    <tr><td>http_req_duration p(95) &lt; 2000ms</td><td>${ok(p95dur, 2000)}</td></tr>
    <tr><td>trajet_list_duration p(90) &lt; 1500ms</td><td>${ok(p90traj, 1500)}</td></tr>
    <tr><td>notification_list_duration p(90) &lt; 1500ms</td><td>${ok(p90notif, 1500)}</td></tr>
    <tr><td>pause_generation_duration p(90) &lt; 5000ms</td><td>${ok(p90pause, 5000)}</td></tr>
  </table>
</div>

<div class="chart-box">
  <h2>⏱ Temps de réponse HTTP (ms) — échantillon</h2>
  <canvas id="durChart"></canvas>
</div>

<div class="chart-box">
  <h2>👥 Utilisateurs virtuels (VUs) dans le temps</h2>
  <canvas id="vusChart"></canvas>
</div>

<div class="grid">
  <div class="card">
    <div class="label">Trajets — p90</div>
    <div class="value">${pct(metrics['trajet_list_duration'], 90)}ms</div>
  </div>
  <div class="card">
    <div class="label">Notifications — p90</div>
    <div class="value">${pct(metrics['notification_list_duration'], 90)}ms</div>
  </div>
  <div class="card">
    <div class="label">Pauses — p90</div>
    <div class="value">${pct(metrics['pause_generation_duration'], 90)}ms</div>
  </div>
</div>

<script>
new Chart(document.getElementById('durChart'), {
  type: 'line',
  data: {
    labels: ${JSON.stringify(labels)},
    datasets: [{
      label: 'Durée req (ms)',
      data: ${JSON.stringify(durData)},
      borderColor: '#38bdf8',
      backgroundColor: 'rgba(56,189,248,0.1)',
      borderWidth: 1.5,
      pointRadius: 0,
      fill: true,
      tension: 0.3
    }]
  },
  options: { responsive: true, plugins: { legend: { labels: { color: '#94a3b8' } } }, scales: {
    x: { ticks: { color: '#64748b' }, grid: { color: '#1e293b' } },
    y: { ticks: { color: '#64748b' }, grid: { color: '#334155' } }
  }}
});
new Chart(document.getElementById('vusChart'), {
  type: 'line',
  data: {
    labels: ${JSON.stringify(vusPoints.map((_, i) => i))},
    datasets: [{
      label: 'VUs actifs',
      data: ${JSON.stringify(vusData)},
      borderColor: '#a78bfa',
      backgroundColor: 'rgba(167,139,250,0.1)',
      borderWidth: 1.5,
      pointRadius: 0,
      fill: true,
      tension: 0.3
    }]
  },
  options: { responsive: true, plugins: { legend: { labels: { color: '#94a3b8' } } }, scales: {
    x: { ticks: { color: '#64748b' }, grid: { color: '#1e293b' } },
    y: { ticks: { color: '#64748b' }, grid: { color: '#334155' }, min: 0 }
  }}
});
</script>
</body>
</html>`;

fs.writeFileSync(outputFile, html, 'utf8');
console.log(`✅ Rapport généré : ${outputFile}`);
console.log('   Ouvre-le avec : Invoke-Item tests-perf\\rapport_performance.html');
