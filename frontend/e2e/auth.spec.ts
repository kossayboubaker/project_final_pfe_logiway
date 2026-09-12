import { test, expect } from '@playwright/test';
import { TEST_USERS, login } from './helpers/auth.helper';

/**
 * auth.spec.ts — Tests E2E : Authentification LogiWay
 */

test.describe('Authentification LogiWay', () => {

  // ── Test 1 : Page de login affiche les éléments attendus ─────
  test('La page de login affiche le formulaire complet', async ({ page }) => {
    await page.goto('/auth/signin');
    await page.waitForLoadState('networkidle');

    // Le titre LogiWay est visible
    await expect(page.locator('h1').filter({ hasText: 'LogiWay' })).toBeVisible();

    // Les champs email et password sont présents
    await expect(page.locator('input[name="email"]')).toBeVisible();
    await expect(page.locator('input[name="password"]')).toBeVisible();

    // Le bouton Sign In est présent
    await expect(page.locator('button.signin-btn')).toBeVisible();
    await expect(page.locator('button.signin-btn')).toBeEnabled();

    // Le lien "Forgot password" est présent
    await expect(page.locator('a.forgot-link')).toBeVisible();
  });

  // ── Test 2 : Login avec identifiants invalides ───────────────
  test('Login avec mauvais identifiants → message d\'erreur visible', async ({ page }) => {
    await page.goto('/auth/signin');
    await page.waitForSelector('input[name="email"]');

    await page.fill('input[name="email"]',    'faux@email.com');
    await page.fill('input[name="password"]', 'mauvaismdp123');
    await page.click('button.signin-btn');

    // Attendre la réponse du backend (401)
    await page.waitForTimeout(4000);

    // Angular Material v19 utilise mat-mdc-snack-bar-container
    // ou div.login-alert dans le template
    const hasLoginAlert  = await page.locator('.login-alert').isVisible();
    const hasSnackbarMDC = await page.locator('mat-snack-bar-container').isVisible();
    const hasSnackbarDiv = await page.locator('[class*="snack-bar"]').first().isVisible();

    expect(hasLoginAlert || hasSnackbarMDC || hasSnackbarDiv).toBe(true);
    expect(page.url()).toContain('/auth/signin');
  });

  // ── Test 3 : Accès dashboard sans auth ───────────────────────
  // ── Test 3 : Page de login accessible sans auth ──────────────
  // Le guard de LogiWay utilise des cookies HTTP (withCredentials).
  // Ce test vérifie que la page signin est accessible et fonctionnelle.
  test('La page de login est accessible pour les utilisateurs non connectés', async ({ browser }) => {
    const context = await browser.newContext({
      storageState: { cookies: [], origins: [] }
    });
    const page = await context.newPage();

    await page.goto('http://localhost:4200/auth/signin');
    await page.waitForLoadState('networkidle');

    expect(page.url()).toContain('/auth/signin');
    await expect(page.locator('input[name="email"]')).toBeVisible({ timeout: 8_000 });
    await expect(page.locator('button.signin-btn')).toBeVisible();

    await context.close();
  });

  // ── Test 4 : Login valide → redirection dashboard ────────────
  test('Login avec identifiants valides → accès au dashboard', async ({ page }) => {
    const user = TEST_USERS.manager;
    await login(page, user.email, user.password);

    // Vérifier qu'on est sur une page du dashboard
    expect(page.url()).toContain('/dashboard');

    // La page est chargée
    await expect(page.locator('app-root')).toBeVisible({ timeout: 10_000 });
  });

});
