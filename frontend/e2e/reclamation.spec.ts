import { test, expect } from '@playwright/test';

/**
 * reclamation.spec.ts — Tests E2E : Module Réclamations
 * La session est automatiquement chargée depuis e2e/.auth/session.json
 */

test.describe('Module Réclamations', () => {

  // Naviguer vers la page réclamations avant chaque test
  test.beforeEach(async ({ page }) => {
    await page.goto('/dashboard/reclamations');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
  });

  // ── Test 1 : La page réclamations est accessible ──────────────
  test('La page réclamations est accessible', async ({ page }) => {
    expect(page.url()).toContain('/dashboard');
    expect(page.url()).not.toContain('/auth/signin');

    await expect(
      page.locator('h1').filter({ hasText: 'Réclamations' })
    ).toBeVisible({ timeout: 15_000 });
  });

  // ── Test 2 : Les stats sont affichées ─────────────────────────
  test('Les statistiques de réclamations sont affichées', async ({ page }) => {
    await page.waitForSelector('.stats-grid', { timeout: 15_000 });

    await expect(
      page.locator('.stats-grid .label').filter({ hasText: 'Total Réclamations' })
    ).toBeVisible({ timeout: 10_000 });

    await expect(
      page.locator('.stats-grid .label').filter({ hasText: 'Résolues' })
    ).toBeVisible({ timeout: 10_000 });
  });

  // ── Test 3 : Le tableau est présent ──────────────────────────
  test('Le tableau des réclamations est visible', async ({ page }) => {
    await page.waitForSelector('.table-container', { timeout: 15_000 });
    await expect(page.locator('.table-container')).toBeVisible();
  });

  // ── Test 4 : Bouton "Nouvelle réclamation" visible ────────────
  test('Le bouton "Nouvelle réclamation" est visible', async ({ page }) => {
    await page.waitForSelector('.header', { timeout: 15_000 });
    await expect(page.locator('button.create-btn')).toBeVisible({ timeout: 10_000 });
  });

  // ── Test 5 : Ouvrir la dialog de création ────────────────────
  test('Clic sur "Nouvelle réclamation" ouvre une dialog', async ({ page }) => {
    await page.waitForSelector('button.create-btn', { timeout: 15_000 });
    await page.click('button.create-btn');
    await page.waitForTimeout(1000);

    // Cibler uniquement le mat-dialog-container via le rôle ARIA
    await expect(
      page.getByRole('dialog').first()
    ).toBeVisible({ timeout: 10_000 });
  });

});
