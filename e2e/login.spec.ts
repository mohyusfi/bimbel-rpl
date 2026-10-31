import { test, expect } from '@playwright/test'
import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || 'https://rtamiwffuaxwzyjkocmj.supabase.co'
const SUPABASE_ANON_KEY =
  process.env.VITE_SUPABASE_ANON_KEY ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ0YW1pd2ZmdWF4d3p5amtvY21qIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTE2MTQzNDksImV4cCI6MjEwNzE5MDM0OX0.bOIIpD_R-4lQW_T0MEnBsINYXTpwVjH3ExU9peF8XD0'

const PENDING_TEST_EMAIL = 'e2e.pending.calon@tadulako.sch.id'

test.describe('Playwright E2E Automated Tests: Login Flow & Activation', () => {
  test.beforeAll(async () => {
    // Siapkan data registrasi pending sementara untuk pengujian pencekalan akun belum diverifikasi
    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
    await supabase.auth.signInWithPassword({
      email: 'pimpinan@tadulakocendekia.sch.id',
      password: 'password123',
    })

    // Bersihkan dulu jika ada sisa row sebelumnya
    await supabase.from('registrations').delete().eq('student_email', PENDING_TEST_EMAIL)

    await supabase.from('registrations').insert({
      student_name: 'Calon Siswa Pending E2E',
      student_email: PENDING_TEST_EMAIL,
      student_phone: '081234567899',
      student_school: 'SMAN 1 Palu',
      parent_name: 'Wali Calon E2E',
      parent_phone: '081234567898',
      status: 'menunggu',
      package_code: 'UTBK',
      package_name: 'Intensif UTBK',
    })
  })

  test.afterAll(async () => {
    // Wajib: Bersihkan seluruh data testing sesuai aturan AGENTS.md (Zero Stale Test Data)
    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
    await supabase.auth.signInWithPassword({
      email: 'pimpinan@tadulakocendekia.sch.id',
      password: 'password123',
    })

    await supabase.from('registrations').delete().eq('student_email', PENDING_TEST_EMAIL)
  })

  test('renders login page correctly with all form fields and security elements', async ({ page }) => {
    await page.goto('/masuk?e2e=true', { waitUntil: 'load' })
    await page.waitForSelector('form[data-hydrated="true"]')

    const emailInput = page.locator('#email')
    const passwordInput = page.locator('#password')
    const submitBtn = page.locator('button[type="submit"]')

    await expect(emailInput).toBeVisible()
    await expect(passwordInput).toBeVisible()
    await expect(submitBtn).toBeVisible()
  })

  test('successfully logs in verified student Moh Yusfi Lakhafidun without unconfirmed error', async ({ page }) => {
    await page.goto('/masuk?e2e=true', { waitUntil: 'load' })
    await page.waitForSelector('form[data-hydrated="true"]')

    await page.fill('#email', 'mohammadyusfi039@gmail.com')
    await page.fill('#password', 'siswa2026')
    await page.click('button[type="submit"]')

    await page.waitForURL('**/student**', { timeout: 15000 })

    const errorBanner = page.locator('div[role="alert"]')
    if (await errorBanner.isVisible()) {
      const errorText = await errorBanner.innerText()
      expect(errorText).not.toContain('Akun Anda belum aktif')
    }

    expect(page.url()).toContain('/student')
  })

  test('successfully logs in verified student calon.siswa.pending@tadulako.sch.id into student portal', async ({ page }) => {
    await page.goto('/masuk?e2e=true', { waitUntil: 'load' })
    await page.waitForSelector('form[data-hydrated="true"]')

    await page.fill('#email', 'calon.siswa.pending@tadulako.sch.id')
    await page.fill('#password', 'siswa2026')
    await page.click('button[type="submit"]')

    await page.waitForURL('**/student**', { timeout: 15000 })

    const errorBanner = page.locator('div[role="alert"]')
    if (await errorBanner.isVisible()) {
      const errorText = await errorBanner.innerText()
      expect(errorText).not.toContain('menunggu verifikasi')
      expect(errorText).not.toContain('Akun Anda belum aktif')
    }

    expect(page.url()).toContain('/student')
  })

  test('allows student login using Student Identification Number (NIS TC-2026-011)', async ({ page }) => {
    await page.goto('/masuk?e2e=true', { waitUntil: 'load' })
    await page.waitForSelector('form[data-hydrated="true"]')

    await page.fill('#email', 'TC-2026-011')
    await page.fill('#password', 'siswa2026')
    await page.click('button[type="submit"]')

    await page.waitForURL('**/student**', { timeout: 15000 })

    const errorBanner = page.locator('div[role="alert"]')
    if (await errorBanner.isVisible()) {
      const errorText = await errorBanner.innerText()
      expect(errorText).not.toContain('Akun Anda belum aktif')
    }

    expect(page.url()).toContain('/student')
  })

  test('successfully logs in verified parent IMAM KANAFI (wali Moh Yusfi Lakhafidun) into parent portal', async ({ page }) => {
    await page.goto('/masuk?e2e=true', { waitUntil: 'load' })
    await page.waitForSelector('form[data-hydrated="true"]')

    await page.fill('#email', 'imam@gmail.com')
    await page.fill('#password', 'wali2026')
    await page.click('button[type="submit"]')

    await page.waitForURL('**/parent**', { timeout: 15000 })

    const errorBanner = page.locator('div[role="alert"]')
    if (await errorBanner.isVisible()) {
      const errorText = await errorBanner.innerText()
      expect(errorText).not.toContain('Akun Anda belum aktif')
      expect(errorText).not.toContain('tidak cocok')
    }

    expect(page.url()).toContain('/parent')
  })

  test('blocks unverified pending registration with informative polite message', async ({ page }) => {
    await page.goto('/masuk?e2e=true', { waitUntil: 'load' })
    await page.waitForSelector('form[data-hydrated="true"]')

    await page.fill('#email', PENDING_TEST_EMAIL)
    await page.fill('#password', 'siswa2026')
    await page.click('button[type="submit"]')

    await page.waitForSelector('div[role="alert"]')

    const alertText = await page.locator('div[role="alert"]').innerText()
    expect(alertText).toContain('menunggu verifikasi oleh staf Tata Usaha')
  })

  test('allows quick demo login for Student role successfully', async ({ page }) => {
    await page.goto('/masuk?e2e=true', { waitUntil: 'load' })
    await page.waitForSelector('form[data-hydrated="true"]')

    const studentDemoBtn = page.locator('button:has-text("Siswa")').first()
    await expect(studentDemoBtn).toBeVisible()

    await studentDemoBtn.click()
    await page.waitForURL('**/student**', { timeout: 15000 })

    expect(page.url()).toContain('/student')
  })
})
