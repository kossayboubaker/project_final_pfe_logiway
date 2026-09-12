import { Page } from '@playwright/test';

/**
 * auth.helper.ts — Utilitaires d'authentification
 *
 * La session est gérée par global-setup.ts (login unique).
 * Ces fonctions sont utilisées uniquement pour les tests
 * qui testent explicitement le processus de login.
 */

export const TEST_USERS = {
  manager: {
    email:    'kossayboubaker96@gmail.com',
    password: 'METS_TON_MOT_DE_PASSE_ICI',  // ← même mot de passe que global-setup.ts
  },
};

/**
 * Login explicite — utilisé uniquement dans auth.spec.ts
 * Les autres tests utilisent la session sauvegardée par global-setup
 */
export async function login(page: Page, email: string, password: string): Promise<void> {
  await page.goto('/auth/signin');
  await page.waitForSelector('input[name="email"]', { timeout: 10_000 });
  await page.fill('input[name="email"]',    email);
  await page.fill('input[name="password"]', password);
  await page.click('button.signin-btn');

  await page.waitForURL(
    (url) => url.pathname.startsWith('/dashboard'),
    { timeout: 25_000 }
  );
}

/**
 * Naviguer vers le dashboard en utilisant la session existante
 * (plus besoin de se reconnecter à chaque test)
 */
export async function goToDashboard(page: Page): Promise<void> {
  await page.goto('/dashboard/manager');
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(1000);
}
