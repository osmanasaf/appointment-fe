import { test, expect } from '@playwright/test';
import { loginAsAdmin } from './helpers/auth';

test.describe('Package Management Flow', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
  });

  test('Admin can create a package', async ({ page }) => {
    await page.goto('/admin/packages');
    
    // Click Add Package
    await page.click('button:has-text("Ekle")');
    
    await page.fill('input[name="name"], input#name', 'Avantajlı Test Paketi');
    await page.fill('input[name="price"], input#price', '1500');

    // Assign a service
    const serviceDropdown = page.locator('.p-dropdown, .p-multiselect').first();
    if (await serviceDropdown.isVisible()) {
      await serviceDropdown.click();
      await page.click('.p-dropdown-item:visible >> nth=0, .p-multiselect-item:visible >> nth=0');
      await page.keyboard.press('Escape'); // close dropdown
    }

    // Enter session count
    await page.fill('input[name="sessionCount"], input[type="number"]', '10');

    await page.click('button:has-text("Kaydet")');
    
    // Verify it appears
    await expect(page.locator('text=Avantajlı Test Paketi')).toBeVisible({ timeout: 10000 });
  });
});
