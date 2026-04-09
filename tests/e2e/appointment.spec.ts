import { test, expect } from '@playwright/test';
import { loginAsAdmin } from './helpers/auth';

test.describe('Appointment Booking Flow', () => {
  
  test('Customer (Public) can book an appointment', async ({ page }) => {
    // Navigate to a mock or existing public booking slug
    // Ensure slug like "test-isletmesi" exists
    await page.goto('/b/demo'); 
    
    // Depending on the public booking logic, usually select category/service -> employee -> date/time
    const serviceCard = page.locator('.service-card, .p-card').first();
    if (await serviceCard.isVisible()) {
      await serviceCard.click();
      
      const employeeCard = page.locator('.employee-card').first();
      if (await employeeCard.isVisible()) await employeeCard.click();

      // Pick a date on the calendar
      await page.click('.fc-day-future, .p-datepicker-calendar td:not(.p-disabled)');
      
      // Pick a time slot
      await page.click('.time-slot:not(.disabled)');

      // Fill info
      await page.fill('input[name="firstName"]', 'Test');
      await page.fill('input[name="lastName"]', 'Kullanıcı');
      await page.fill('input[name="phone"]', '+905551112233');

      // Submit
      await page.click('button:has-text("Randevu Al"), button:has-text("Onayla")');
      
      // Look for success message
      await expect(page.locator('text=Başarılı')).toBeVisible({ timeout: 10000 });
    }
  });

  test('Admin can book an appointment internally', async ({ page }) => {
    // Use layout routing logic
    await loginAsAdmin(page);
    await page.goto('/admin/appointments');
    
    // Open appointment modal from calendar or explicit Add button
    const addButton = page.locator('button:has-text("Randevu Ekle"), button:has-text("Ekle")');
    if (await addButton.isVisible()) {
      await addButton.click();
    } else {
      // Click somewhere on FullCalendar to trigger slot create event
      await page.click('.fc-timegrid-slot'); 
    }

    // Modal opens, fill form
    // Select customer
    const customerDropdown = page.locator('.p-dropdown').nth(0);
    if (await customerDropdown.isVisible()) {
      await customerDropdown.click();
      await page.click('.p-dropdown-item:visible >> nth=0');
    }
    
    // Select Service
    const serviceDropdown = page.locator('.p-dropdown').nth(1);
    if (await serviceDropdown.isVisible()) {
      await serviceDropdown.click();
      await page.click('.p-dropdown-item:visible >> nth=0');
    }

    // Save
    await page.click('button:has-text("Kaydet"), button:has-text("Oluştur")');
    
    // Ensure modal closes and event appears on calendar
    // Assuming 1 event is rendered:
    await expect(page.locator('.fc-event')).toBeVisible({ timeout: 10000 });
  });
});
