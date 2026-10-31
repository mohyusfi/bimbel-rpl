import { test, expect } from '@playwright/test'
import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || 'https://rtamiwffuaxwzyjkocmj.supabase.co'
const SUPABASE_ANON_KEY =
  process.env.VITE_SUPABASE_ANON_KEY ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ0YW1pd2ZmdWF4d3p5amtvY21qIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTE2MTQzNDksImV4cCI6MjEwNzE5MDM0OX0.bOIIpD_R-4lQW_T0MEnBsINYXTpwVjH3ExU9peF8XD0'

const E2E_TUTOR_NAME = 'Kak E2E Playwright Tutor, M.Pd'
let e2eTutorEmail = `e2e.tutor.${Date.now()}@tadulako.sch.id`
const E2E_TUTOR_PHONE = '081299998888'

test.describe('Admin Tutor: Auto-Generated Credentials & Status Toggling Flow', () => {
  // Fungsi pembersihan data uji (Zero Stale Test Data)
  const cleanupTestData = async () => {
    try {
      const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
      await supabase.auth.signInWithPassword({
        email: 'pimpinan@tadulakocendekia.sch.id',
        password: 'password123',
      })

      const { data: oldProfiles } = await supabase
        .from('profiles')
        .select('id')
        .ilike('email', 'e2e.tutor.%@tadulako.sch.id')

      if (oldProfiles && oldProfiles.length > 0) {
        for (const op of oldProfiles) {
          await supabase.from('tutors').delete().eq('profile_id', op.id)
          await supabase.from('profiles').delete().eq('id', op.id)
        }
      }
    } catch (err) {
      console.warn('[WARN] Cleanup test data note:', err)
    }
  }

  test.beforeAll(async () => {
    await cleanupTestData()
  })

  test.beforeEach(async () => {
    e2eTutorEmail = `e2e.tutor.${Date.now()}@tadulako.sch.id`
    await cleanupTestData()
  })

  test.afterAll(async () => {
    // Wajib: Bersihkan seluruh data testing sesuai aturan AGENTS.md (Zero Stale Test Data)
    await cleanupTestData()
  })

  test('successfully adds new tutor, verifies auto-generated credentials modal & WhatsApp copy, then toggles status', async ({
    page,
    context,
  }) => {
    try {
      await context.grantPermissions(['clipboard-read', 'clipboard-write'])
    } catch {}

    // 1. Masuk sebagai Admin via Quick Demo Login
    await page.goto('/masuk?e2e=true', { waitUntil: 'load' })
    await page.waitForSelector('form[data-hydrated="true"]')

    const adminDemoBtn = page.locator('button:has-text("Admin")').first()
    await expect(adminDemoBtn).toBeVisible()
    await adminDemoBtn.click()

    await page.waitForURL('**/admin**', { timeout: 15000 })
    expect(page.url()).toContain('/admin')

    // 2. Navigasi ke Halaman Kelola Tutor
    await page.goto('/admin/tutor', { waitUntil: 'load' })
    await expect(page.locator('h1')).toContainText('Tutor & Mata Pelajaran')

    // 3. Buka Modal Tambah Tutor Baru
    const addTutorBtn = page.locator('button:has-text("Tambah Tutor Baru")')
    await expect(addTutorBtn).toBeVisible()
    await addTutorBtn.click()

    const addTutorDialog = page.locator('div[role="dialog"]:has-text("Tambah Data Tutor / Pengajar")')
    await expect(addTutorDialog).toBeVisible()

    // 4. Isi Form Tambah Tutor (termasuk Email & hint kata sandi otomatis)
    await page.fill('input[placeholder*="Kak Dian Pratiwi"]', E2E_TUTOR_NAME)
    await page.fill('input[placeholder*="tutor.tadulakocendekia.sch.id"]', e2eTutorEmail)
    await page.fill('input[placeholder*="0812-xxxx-xxxx"]', E2E_TUTOR_PHONE)
    await page.fill('input[placeholder*="S1 Fisika"]', 'S2 Pendidikan Fisika — Universitas Tadulako')
    await page.fill('input[placeholder*="Fisika UTBK"]', 'Fisika Modern, UTBK SNBT')

    // 5. Submit Form
    const submitBtn = page.locator('button:has-text("Simpan Data Tutor")')
    await expect(submitBtn).toBeVisible()
    await submitBtn.click()

    // 6. Verifikasi Modal Kredensial Akses Akun Tutor Muncul
    const credentialsModal = page.locator('div[role="dialog"]:has-text("Kredensial Akses Akun Tutor")')
    await expect(credentialsModal).toBeVisible({ timeout: 15000 })

    // Verifikasi data kredensial di modal
    await expect(credentialsModal).toContainText(E2E_TUTOR_NAME)
    await expect(credentialsModal).toContainText(e2eTutorEmail)
    await expect(credentialsModal).toContainText('tutor2026')

    // 7. Verifikasi tombol Salin Format WhatsApp
    const copyWaBtn = credentialsModal.locator('button:has-text("Salin Format WhatsApp")')
    await expect(copyWaBtn).toBeVisible()
    await copyWaBtn.click()
    await expect(credentialsModal.locator('button:has-text("Format Disalin")')).toBeVisible()

    // Tutup Modal Kredensial
    const closeCredentialsBtn = credentialsModal.locator('button:has-text("Tutup & Selesai")')
    await closeCredentialsBtn.click()
    await expect(credentialsModal).not.toBeVisible()

    // 8. Verifikasi Baris Tutor di Tabel Direktori Pengajar
    const tutorRow = page.locator(`tr:has-text("${E2E_TUTOR_NAME}")`)
    await expect(tutorRow).toBeVisible()

    // 9. Uji Tombol Kredensial pada Baris Tabel
    const rowCredentialBtn = tutorRow.locator('button:has-text("Kredensial")')
    await expect(rowCredentialBtn).toBeVisible()
    await rowCredentialBtn.click()

    // Pastikan modal kredensial terbuka lagi dengan data yang sama
    await expect(credentialsModal).toBeVisible()
    await expect(credentialsModal).toContainText('tutor2026')
    await credentialsModal.locator('button:has-text("Tutup & Selesai")').click()
    await expect(credentialsModal).not.toBeVisible()

    // 10. Uji Fitur Nonaktifkan Tutor
    const deactivateBtn = tutorRow.getByRole('button', { name: 'Nonaktifkan', exact: true })
    await expect(deactivateBtn).toBeVisible()
    await deactivateBtn.click()

    // Modal Konfirmasi Penonaktifan muncul
    const confirmDeactivateDialog = page.locator('div[role="dialog"]:has-text("Konfirmasi Nonaktifkan Tutor")')
    await expect(confirmDeactivateDialog).toBeVisible()
    await expect(confirmDeactivateDialog).toContainText(E2E_TUTOR_NAME)

    // Klik tombol konfirmasi nonaktifkan
    const confirmDeactivateBtn = confirmDeactivateDialog.getByRole('button', { name: 'Ya, Nonaktifkan Tutor', exact: true })
    await confirmDeactivateBtn.click()
    await expect(confirmDeactivateDialog).not.toBeVisible()

    // Status badge pada baris berubah menjadi Nonaktif dan tombol berubah menjadi Aktifkan
    const activateBtn = tutorRow.getByRole('button', { name: 'Aktifkan', exact: true })
    await expect(activateBtn).toBeVisible({ timeout: 10000 })

    // 11. Uji Fitur Aktifkan Kembali Tutor
    await activateBtn.click()

    const confirmActivateDialog = page.locator('div[role="dialog"]:has-text("Konfirmasi Aktifkan Tutor")')
    await expect(confirmActivateDialog).toBeVisible()
    await expect(confirmActivateDialog).toContainText(E2E_TUTOR_NAME)

    const confirmActivateBtn = confirmActivateDialog.getByRole('button', { name: 'Ya, Aktifkan Tutor', exact: true })
    await confirmActivateBtn.click()
    await expect(confirmActivateDialog).not.toBeVisible()

    // Status badge pada baris kembali menjadi Aktif dan tombol Nonaktifkan muncul
    await expect(tutorRow.getByRole('button', { name: 'Nonaktifkan', exact: true })).toBeVisible({ timeout: 10000 })
  })
})
