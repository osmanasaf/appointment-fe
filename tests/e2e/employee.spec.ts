import { test, expect } from '@playwright/test';
import { loginAsAdmin } from './helpers/auth';

test.describe('Employee Management Flow', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
  });

  test('Admin can add an employee, assign services, and delete them', async ({ page }) => {
    // Navigate to employees
    await page.goto('/admin/employees');
    
    // Add Employee
    await page.click('button:has-text("Ekle")');
    await page.fill('input[name="firstName"], input[name="name"]', 'Test');
    await page.fill('input[name="lastName"]', 'Çalışan');
    await page.fill('input[name="email"], input[type="email"]', `calisan_${Date.now()}@test.com`);
    
    // Click some role or assign services if available in standard form
    const serviceSelector = page.locator('text=Hizmet Seç'); // Generic
    if (await serviceSelector.isVisible()) {
      await serviceSelector.click();
      await page.click('.p-checkbox-box >> nth=0'); // select first service
      await page.keyboard.press('Escape');
    }

    await page.click('button:has-text("Kaydet"), button:has-text("Oluştur")');
    
    // Verify visibility
    await expect(page.locator('text=Test Çalışan')).toBeVisible({ timeout: 10000 });

    // Offboarding / Deleting employee
    // Assume there's a row with "Test Çalışan" and an options/delete button nearby
    const row = page.locator('tr:has-text("Test Çalışan")');
    await row.locator('button[icon="pi pi-trash"], button[aria-label="Sil"]').click();
    
    // Confirm delete modal
    await page.click('button:has-text("Evet"), button:has-text("Sil")');

    // Verify it disappears (if soft-delete is hidden)
    await expect(row).not.toBeVisible({ timeout: 10000 });
  });
});
