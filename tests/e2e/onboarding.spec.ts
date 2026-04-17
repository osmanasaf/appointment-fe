import { test, expect } from '@playwright/test'

const testUser = {
  email: `admin_${Date.now()}@test.com`,
  password: 'Password123!',
}

test.describe('Setup Wizard Flow', () => {
  test('legacy /admin/onboarding redirects to /admin/setup', async ({ page }) => {
    await page.goto('/register')
    await page.fill('#register-firstName', 'Test')
    await page.fill('#register-lastName', 'Kullanıcı')
    await page.fill('#register-email', testUser.email)
    await page.fill('#register-password', testUser.password)

    await Promise.all([page.waitForNavigation(), page.click('button[type="submit"]')])

    if (page.url().includes('/login')) {
      await page.fill('#login-email', testUser.email)
      await page.fill('#login-password', testUser.password)
      await Promise.all([page.waitForNavigation(), page.click('button[type="submit"]')])
    }

    await page.goto('/admin/onboarding')
    await expect(page).toHaveURL(/\/admin\/setup/)
  })

  test('setup wizard renders all six steps', async ({ page }) => {
    await page.goto('/login')
    await page.fill('#login-email', testUser.email)
    await page.fill('#login-password', testUser.password)
    await Promise.all([page.waitForNavigation(), page.click('button[type="submit"]')])

    await page.goto('/admin/setup')

    await expect(page.locator('h1', { hasText: /sihirbazı|wizard/i })).toBeVisible({
      timeout: 10000,
    })

    const stepper = page.getByRole('tablist')
    await expect(stepper).toBeVisible()
    await expect(stepper.getByRole('tab')).toHaveCount(6)
  })
})
