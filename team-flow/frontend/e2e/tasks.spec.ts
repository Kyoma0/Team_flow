import { test, expect } from '@playwright/test';

test.describe('Tarefas', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[type="email"]', 'demo@teamflow.app');
    await page.fill('input[type="password"]', '123456');
    await page.click('button[type="submit"]');
    await page.waitForURL(/\/dashboard|\//, { timeout: 15000 });
  });

  test('deve listar projetos', async ({ page }) => {
    await page.goto('/projects');
    await expect(page.locator('text=Comercial XYZ')).toBeVisible({ timeout: 10000 });
  });

  test('deve abrir projeto e ver tarefas', async ({ page }) => {
    await page.goto('/projects');
    await page.click('text=Comercial XYZ');
    await page.waitForURL(/\/projects\//);
    await expect(page.locator('text=Briefing criativo')).toBeVisible({ timeout: 10000 });
  });
});
