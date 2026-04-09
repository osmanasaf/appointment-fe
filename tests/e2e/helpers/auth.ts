import { Page } from '@playwright/test';

export async function loginAsAdmin(page: Page) {
  await page.goto('/login');
  await page.fill('#login-email', 'admin@test.com');
  await page.fill('#login-password', 'admin123');
  await Promise.all([
    page.waitForNavigation(),
    page.click('button[type="submit"]')
  ]);
}
