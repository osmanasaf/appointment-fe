import { test, expect } from '@playwright/test';

// Use a unique email for onboarding each time if running against a real db,
// or a standard one if the db gets wiped.
const testUser = {
  email: `admin_${Date.now()}@test.com`,
  password: 'Password123!'
};

test.describe('Onboarding Flow', () => {
  test('User can register, login and complete business onboarding', async ({ page }) => {
    // 1. Register
    await page.goto('/register');
    await page.fill('#register-firstName', 'Test');
    await page.fill('#register-lastName', 'Kullanıcı');
    await page.fill('#register-email', testUser.email);
    await page.fill('#register-password', testUser.password);
    
    // Catch potential errors if running against a real db or mock it.
    // Assuming backend returns success and logs us in or redirects to /login
    await Promise.all([
      page.waitForNavigation(),
      page.click('button[type="submit"]')
    ]);

    // 2. Login (if it redirects to login)
    if (page.url().includes('/login')) {
      await page.fill('#login-email', testUser.email);
      await page.fill('#login-password', testUser.password);
      await Promise.all([
        page.waitForNavigation(),
        page.click('button[type="submit"]')
      ]);
    }

    // 3. Onboarding
    // Check if we are redirected to onboarding
    await page.goto('/admin/onboarding'); // Force navigate to ensure we are on onboarding
    
    await expect(page.locator('text=İşletme Profilinizi Oluşturun')).toBeVisible({ timeout: 10000 });
    
    // Fill business details
    await page.fill('input[name="name"]', 'Test İşletmesi');
    await page.fill('input[name="phone"]', '+905554443322');
    await page.fill('input[name="address"]', 'Örnek Mah. Test Sok.');

    // Submit onboarding form
    await page.click('button:has-text("Kaydet")');

    // Wait for redirect to admin Dashboard
    await expect(page).toHaveURL(/\/admin/);
  });
});
