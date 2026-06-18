import { test, expect } from '@playwright/test';

test.describe('Navegação', () => {
  test.beforeEach(async ({ page }) => {
    // Login first
    await page.goto('/login');
    await page.fill('input[type="email"]', 'demo@teamflow.app');
    await page.fill('input[type="password"]', '123456');
    await page.click('button[type="submit"]');
    await page.waitForURL(/\/dashboard|\//, { timeout: 15000 });
  });

  test('deve navegar para projetos', async ({ page }) => {
    await page.click('text=Projetos');
    await expect(page).toHaveURL(/\/projects/);
  });

  test('deve navegar para calendário', async ({ page }) => {
    await page.click('text=Calendário');
    await expect(page).toHaveURL(/\/calendar/);
  });

  test('deve navegar para webhooks', async ({ page }) => {
    await page.click('text=Webhooks');
    await expect(page).toHaveURL(/\/webhooks/);
  });

  test('deve navegar para API Tokens', async ({ page }) => {
    await page.click('text=API Tokens');
    await expect(page).toHaveURL(/\/tokens/);
  });

  test('deve navegar para perfil', async ({ page }) => {
    await page.click('text=Perfil');
    await expect(page).toHaveURL(/\/profile/);
  });
});
