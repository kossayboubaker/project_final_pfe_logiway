import { chromium, FullConfig } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';

/**
 * global-setup.ts — Login UNE SEULE FOIS avant tous les tests
 * Sauvegarde la session dans e2e/.auth/session.json
 */
async function globalSetup(config: FullConfig) {
  const { baseURL } = config.projects[0].use;

  // Créer le dossier .auth si nécessaire
  const authDir = path.join(__dirname, '.auth');
  if (!fs.existsSync(authDir)) {
    fs.mkdirSync(authDir, { recursive: true });
  }

  const browser = await chromium.launch({ headless: true });
  const page    = await browser.newPage();

  console.log('\n🔐 Global Setup — Login LogiWay...');

  await page.goto(`${baseURL}/auth/signin`);
  await page.waitForSelector('input[name="email"]', { timeout: 15_000 });

  // ↓↓↓ Mets ton mot de passe ici ↓↓↓
  await page.fill('input[name="email"]',    'kossayboubaker96@gmail.com');
  await page.fill('input[name="password"]', 'alitounsi');
  // ↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑

  await page.click('button.signin-btn');

  // Attendre 4 secondes pour laisser le backend répondre
  await page.waitForTimeout(4000);

  // Vérifier l'URL après le clic
  const urlApresLogin = page.url();
  console.log(`📍 URL après login : ${urlApresLogin}`);

  // Si on est encore sur signin → login échoué
  if (urlApresLogin.includes('/auth')) {
    const errorMsg = await page.locator('.login-alert').textContent().catch(() => 'non visible');
    await browser.close();
    throw new Error(
      `❌ Login échoué (URL: ${urlApresLogin})\n` +
      `   Erreur affichée : ${errorMsg}\n` +
      `   → Vérifie le mot de passe dans e2e/global-setup.ts ligne 25`
    );
  }

  // Login réussi — sauvegarder la session
  console.log(`✅ Login réussi → ${urlApresLogin}`);

  const sessionFile = path.join(authDir, 'session.json');
  await page.context().storageState({ path: sessionFile });
  console.log(`💾 Session sauvegardée : ${sessionFile}\n`);

  await browser.close();
}

export default globalSetup;
