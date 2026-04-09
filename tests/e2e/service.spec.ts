import { test, expect } from '@playwright/test';
import { loginAsAdmin } from './helpers/auth';

test.describe('Service Management Flow', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
  });

  test('Admin can add a new service', async ({ page }) => {
    await page.goto('/admin/services');
    
    // Click Add Service Button (assuming it has some standard text or icon)
    await page.click('button:has-text("Ekle"), button[aria-label="Ekle"]');
    
    // Fill the modal form for new service
    await page.fill('input[name="name"]', 'Test Yeni Hizmet');
    await page.fill('input[name="durationPricing"]', '60'); // Assuming duration field
    // Select a category if dropdown exists
    const categoryDropdown = page.locator('.p-dropdown').first();
    if (await categoryDropdown.isVisible()) {
      await categoryDropdown.click();
      await page.click('.p-dropdown-item:visible >> nth=0');
    }

    // Save
    await page.click('button:has-text("Kaydet"), button:has-text("Oluştur")');
    
    // Verify it appears in the list
    await expect(page.locator('text=Test Yeni Hizmet')).toBeVisible();
  });
});
