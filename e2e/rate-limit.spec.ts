import { test, expect } from '@playwright/test'

test.describe('Playwright E2E: Rate Limiting & Abuse Protection', () => {
  test('displays rate limit error banner when login attempts exceed quota', async ({ page }) => {
    await page.goto('/masuk?e2e=true', { waitUntil: 'load' })
    await page.waitForSelector('form[data-hydrated="true"]')

    const emailInput = page.locator('#email')
    const passwordInput = page.locator('#password')
    const submitBtn = page.locator('button[type="submit"]')

    await emailInput.fill('rate.limit.tester@tadulako.sch.id')
    await passwordInput.fill('wrongpassword123')

    // Submit berulang kali hingga kuota 10 req/menit tercapai
    let sawRateLimitMessage = false

    for (let attempt = 1; attempt <= 12; attempt++) {
      await submitBtn.click()

      // Tunggu respons sesaat
      await page.waitForTimeout(300)

      const alertBanner = page.locator('div[role="alert"]')
      if (await alertBanner.isVisible()) {
        const alertText = (await alertBanner.innerText()) || ''
        if (alertText.includes('Terlalu banyak permintaan')) {
          sawRateLimitMessage = true
          break
        }
      }
    }

    expect(sawRateLimitMessage).toBe(true)
  })
})
