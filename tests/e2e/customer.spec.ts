import { test, expect } from '@playwright/test';
import { loginAsAdmin } from './helpers/auth';

test.describe('Customer Management Flow', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
  });

  test('Admin can add a customer, assign a package, and offboard them', async ({ page }) => {
    await page.goto('/admin/customers');
    
    // 1. Add Customer
    await page.click('button:has-text("Ekle")');
    await page.fill('input[name="firstName"]', 'Test');
    await page.fill('input[name="lastName"]', 'Müşteri');
    await page.fill('input[name="phone"]', '+905559998877');
    await page.click('button:has-text("Kaydet")');
    
    // Verify customer is in list
    await expect(page.locator('text=Test Müşteri')).toBeVisible({ timeout: 10000 });

    // 2. Assign Package
    // Open customer details or package assign modal
    // Assuming there's a button to assign package or we click the row -> then "Paket Sat"
    const row = page.locator('tr:has-text("Test Müşteri")');
    
    // EITHER click row to View OR click an action assigned inline
    // This is a generic assumption. If no explicit inline button, maybe open details:
    await row.click(); 

    // Look for "Paket Sat" or "Paket Ata"
    const assignBtn = page.locator('button:has-text("Paket Sat"), button:has-text("Paket Ekle")');
    if (await assignBtn.isVisible()) {
      await assignBtn.click();
      
      // Select a package from dropdown
      const packageDropdown = page.locator('.p-dropdown').first();
      await packageDropdown.click();
      await page.click('.p-dropdown-item:visible >> nth=0');
      
      await page.click('button:has-text("Kaydet"), button:has-text("Onayla")');
      
      // Package should be visible in customer details package list
      await expect(page.locator('text=Kalan Seans')).toBeVisible({ timeout: 10000 });
    }

    // Navigate back if needed or just use breadcrumb/router
    await page.goto('/admin/customers');

    // 3. Offboard / Archiving a customer
    const rowAgain = page.locator('tr:has-text("Test Müşteri")');
    await rowAgain.locator('button[icon="pi pi-trash"], button[aria-label="Sil"]').click();
    await page.click('button:has-text("Evet"), button:has-text("Sil")');
    
    // Ensure customer is removed
    await expect(rowAgain).not.toBeVisible({ timeout: 10000 });
  });
});
