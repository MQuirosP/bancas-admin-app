import { test, expect } from '@playwright/test';

test.describe('Login to Create Ticket Flow', () => {
  test('should login and navigate to create ticket page', async ({ page }) => {
    // Navigate to app
    await page.goto('/');

    // Should redirect to login
    await expect(page.locator('text=Iniciar Sesión')).toBeVisible();

    // Login (adjust selectors based on actual implementation)
    await page.fill('input[placeholder*="correo"]', 'vendedor@test.com');
    await page.fill('input[placeholder*="Contraseña"]', 'password123');
    await page.click('button:has-text("Ingresar")');

    // Wait for dashboard
    await expect(page.locator('text=Dashboard')).toBeVisible({ timeout: 5000 });

    // Open drawer
    await page.click('button[aria-label="Abrir menú"]');
    await expect(page.locator('text=Menú')).toBeVisible();

    // Navigate to create ticket
    await page.click('button:has-text("Nuevo Tiquete")');
    await expect(page.locator('text=Crear Nuevo Tiquete')).toBeVisible();

    // Verify form elements are present
    await expect(page.locator('text=Sorteo')).toBeVisible();
    await expect(page.locator('text=Jugadas')).toBeVisible();
  });
});