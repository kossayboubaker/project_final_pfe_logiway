import { test, expect } from '@playwright/test';

/**
 * dashboard.spec.ts — Tests E2E : Navigation LogiWay
 * La session est automatiquement chargée depuis e2e/.auth/session.json
 */

test.describe('Dashboard et Navigation', () => {

  // ── Test 1 : Dashboard principal accessible ───────────────────
  test('Le dashboard est accessible avec session active', async ({ page }) => {
    await page.goto('/dashboard/manager');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    expect(page.url()).toContain('/dashboard');
    await expect(page.locator('app-root')).toBeVisible();
  });

  // ── Test 2 : Navigation vers Trajets ─────────────────────────
  test('Navigation vers /dashboard/trips fonctionne', async ({ page }) => {
    await page.goto('/dashboard/trips');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    expect(page.url()).toContain('/dashboard');
    expect(page.url()).not.toContain('/auth/signin');
  });

  // ── Test 3 : Navigation vers Flotte ──────────────────────────
  test('Navigation vers /dashboard/fleet fonctionne', async ({ page }) => {
    await page.goto('/dashboard/fleet');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    expect(page.url()).toContain('/dashboard');
    expect(page.url()).not.toContain('/auth/signin');
  });

  // ── Test 4 : Navigation vers Réclamations ────────────────────
  test('Navigation vers /dashboard/reclamations fonctionne', async ({ page }) => {
    await page.goto('/dashboard/reclamations');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    expect(page.url()).toContain('/dashboard');
    expect(page.url()).not.toContain('/auth/signin');
  });

  // ── Test 5 : Profil utilisateur accessible ───────────────────
  test('Navigation vers /dashboard/profile fonctionne', async ({ page }) => {
    await page.goto('/dashboard/profile');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    expect(page.url()).toContain('/dashboard');
    expect(page.url()).not.toContain('/auth/signin');
  });

  // ── Test 6 : Navigation vers Alertes ─────────────────────────
  test('Navigation vers /dashboard/alerts fonctionne', async ({ page }) => {
    await page.goto('/dashboard/alerts');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    expect(page.url()).toContain('/dashboard');
    expect(page.url()).not.toContain('/auth/signin');
  });

});
