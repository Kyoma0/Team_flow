import { test, expect } from '@playwright/test';

test.describe('Perfil', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[type="email"]', 'demo@teamflow.app');
    await page.fill('input[type="password"]', '123456');
    await page.click('button[type="submit"]');
    await page.waitForURL(/\/dashboard|\//, { timeout: 15000 });
  });

  test('deve mostrar dados do perfil', async ({ page }) => {
    await page.goto('/profile');
    await expect(page.locator('text=Meu Perfil')).toBeVisible();
    await expect(page.locator('text=Alterar Senha')).toBeVisible();
  });

  test('deve atualizar nome do perfil', async ({ page }) => {
    await page.goto('/profile');
    const input = page.locator('input[type="text"]').first();
    await input.fill('');
    await input.fill('Demo Editado');
    await page.click('text=Salvar');
    await expect(page.locator('text=Perfil atualizado')).toBeVisible({ timeout: 10000 });
  });
});
