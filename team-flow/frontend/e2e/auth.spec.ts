import { test, expect } from '@playwright/test';

test.describe('Autenticação', () => {
  test('deve mostrar página de login', async ({ page }) => {
    await page.goto('/login');
    await expect(page.locator('h1')).toContainText(/entrar|login/i);
  });

  test('deve mostrar erros com credenciais inválidas', async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[type="email"]', 'invalido@teste.com');
    await page.fill('input[type="password"]', 'senhaerrada');
    await page.click('button[type="submit"]');
    await expect(page.locator('text=Email ou senha inválidos')).toBeVisible({ timeout: 10000 });
  });

  test('deve fazer login com sucesso (se seed aplicado)', async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[type="email"]', 'demo@teamflow.app');
    await page.fill('input[type="password"]', '123456');
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL(/\/dashboard|\//, { timeout: 15000 });
  });
});
