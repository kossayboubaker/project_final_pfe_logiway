import { defineConfig, devices } from '@playwright/test';

/**
 * playwright.config.ts — Configuration Playwright pour LogiWay E2E
 *
 * Prérequis :
 *   - Frontend Angular démarré sur http://localhost:4200
 *   - Backend Spring Boot démarré sur http://localhost:8080
 *   - Keycloak démarré sur http://localhost:8180
 */
export default defineConfig({
  // Dossier contenant les fichiers de test E2E
  testDir: './e2e',

  // Timeout global par test — 60 secondes
  timeout: 60_000,

  // Timeout pour les assertions expect()
  expect: { timeout: 15_000 },

  // Désactiver la parallélisation — les tests E2E partagent Keycloak
  // et doivent tourner séquentiellement pour éviter les conflits de session
  workers: 1,
  fullyParallel: false,

  // Rapport HTML interactif
  reporter: [
    ['html', { outputFolder: 'playwright-report', open: 'on-failure' }],
    ['list']
  ],

  use: {
    // URL de base — LogiWay frontend
    baseURL: 'http://localhost:4200',

    // Capture d'écran sur échec
    screenshot: 'only-on-failure',

    // Enregistrement vidéo sur échec
    video: 'retain-on-failure',

    // Trace pour debug
    trace: 'on-first-retry',

    // Navigateur en mode visible (false = headless, plus rapide)
    headless: false,

    // Réutiliser le storage state sauvegardé par globalSetup
    storageState: 'e2e/.auth/session.json',
  },

  // Setup global : login une seule fois, sauvegarde la session
  globalSetup: './e2e/global-setup.ts',

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
});
