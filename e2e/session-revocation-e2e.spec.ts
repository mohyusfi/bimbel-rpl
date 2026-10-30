import { test, expect } from '@playwright/test'
import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || 'https://rtamiwffuaxwzyjkocmj.supabase.co'
const SUPABASE_ANON_KEY =
  process.env.VITE_SUPABASE_ANON_KEY ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ0YW1pd2ZmdWF4d3p5amtvY21qIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTE2MTQzNDksImV4cCI6MjEwNzE5MDM0OX0.bOIIpD_R-4lQW_T0MEnBsINYXTpwVjH3ExU9peF8XD0'

test.describe('Session Revocation Flow on User Deactivation (Universal All Roles)', () => {
  // Fungsi pembersihan data uji secara tuntas (Zero Stale Test Data)
  const cleanupTestData = async () => {
    try {
      const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
      await supabase.auth.signInWithPassword({
        email: 'pimpinan@tadulakocendekia.sch.id',
        password: 'password123',
      })

      const { data: testProfiles } = await supabase
        .from('profiles')
        .select('id, email')
        .ilike('email', 'e2e.revoc.%')

      if (testProfiles && testProfiles.length > 0) {
        for (const p of testProfiles) {
          await supabase.from('tutors').delete().eq('profile_id', p.id)
          await supabase.from('students').delete().eq('profile_id', p.id)
          await supabase.from('profiles').delete().eq('id', p.id)
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
    await cleanupTestData()
  })

  test.afterAll(async () => {
    await cleanupTestData()
  })

  test('revokes active tutor session immediately upon deactivation during navigation', async ({ page }) => {
    const timestamp = Date.now()
    const tutorEmail = `e2e.revoc.tutor.${timestamp}@tadulako.sch.id`

    // 1. Buat akun tutor via direct RPC di Supabase Auth & profiles
    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
    await supabase.auth.signInWithPassword({
      email: 'pimpinan@tadulakocendekia.sch.id',
      password: 'password123',
    })

    const { data: rpcUserId, error: rpcErr } = await supabase.rpc('provision_auth_user_direct', {
      p_email: tutorEmail,
      p_password: 'password123',
      p_full_name: 'Kak E2E Revocation Tutor',
      p_role: 'tutor',
      p_phone: '081299990001',
    })

    expect(rpcErr).toBeNull()
    expect(rpcUserId).toBeDefined()

    // Daftarkan ke tabel tutors
    const { error: tutErr } = await supabase.from('tutors').insert({
      profile_id: rpcUserId,
      education_background: 'S1 Fisika Tadulako',
      specialty_subject: 'Fisika Dasar',
      weekly_sessions_count: 0,
      status: 'aktif',
    })
    expect(tutErr).toBeNull()

    // 2. Login ke aplikasi sebagai Tutor uji
    await page.goto('/masuk?e2e=true', { waitUntil: 'load' })
    await page.waitForSelector('form[data-hydrated="true"]')

    await page.fill('#email', tutorEmail)
    await page.fill('#password', 'password123')
    await page.click('button[type="submit"]')

    // 3. Pastikan berhasil masuk ke dashboard tutor
    await page.waitForURL('**/tutor**', { timeout: 15000 })
    expect(page.url()).toContain('/tutor')
    await expect(page.locator('aside')).toBeVisible()

    // 4. Admin menonaktifkan akun tutor di database Supabase
    const { error: updateErr } = await supabase
      .from('profiles')
      .update({ status: 'nonaktif' })
      .eq('id', rpcUserId)
    expect(updateErr).toBeNull()

    // 5. Tutor berinteraksi / berpindah menu jika belum langsung ter-redirect
    const jadwalLink = page.locator('aside a[href="/tutor/jadwal"]').first()
    if (await jadwalLink.isVisible()) {
      await jadwalLink.click().catch(() => {})
    }

    // 6. Verifikasi pencekalan otomatis: redirect ke /masuk?deactivated=true
    await page.waitForURL('**/masuk?deactivated=true**', { timeout: 15000 })
    expect(page.url()).toContain('/masuk?deactivated=true')

    // 7. Verifikasi banner pemberitahuan akun nonaktif tampil di antarmuka login
    const alertBanner = page.locator('div[role="alert"]')
    await expect(alertBanner).toBeVisible()
    await expect(alertBanner).toContainText(
      'Akun Anda telah dinonaktifkan oleh pihak bimbingan belajar'
    )

    // 8. Verifikasi sesi telah bersih (tidak bisa lagi membuka /tutor secara langsung)
    await page.goto('/tutor', { waitUntil: 'load' })
    await page.waitForURL('**/masuk**', { timeout: 15000 })
    expect(page.url()).toContain('/masuk')
  })

  test('revokes active student session immediately upon deactivation during navigation', async ({ page }) => {
    const timestamp = Date.now()
    const studentEmail = `e2e.revoc.student.${timestamp}@tadulako.sch.id`

    // 1. Buat akun siswa via direct RPC di Supabase Auth & profiles
    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
    await supabase.auth.signInWithPassword({
      email: 'pimpinan@tadulakocendekia.sch.id',
      password: 'password123',
    })

    const { data: rpcUserId, error: rpcErr } = await supabase.rpc('provision_auth_user_direct', {
      p_email: studentEmail,
      p_password: 'password123',
      p_full_name: 'Siswa E2E Revocation',
      p_role: 'student',
      p_phone: '081299990002',
    })

    expect(rpcErr).toBeNull()
    expect(rpcUserId).toBeDefined()

    // Daftarkan ke tabel students
    const { error: stuErr } = await supabase.from('students').insert({
      profile_id: rpcUserId,
      nis: `TC-REVOC-${timestamp.toString().slice(-4)}`,
      origin_school: 'SMAN 1 Palu',
      grade_level: '12 SMA',
      status: 'aktif',
    })
    expect(stuErr).toBeNull()

    // 2. Login ke portal siswa
    await page.goto('/masuk?e2e=true', { waitUntil: 'load' })
    await page.waitForSelector('form[data-hydrated="true"]')

    await page.fill('#email', studentEmail)
    await page.fill('#password', 'password123')
    await page.click('button[type="submit"]')

    // 3. Pastikan berhasil masuk ke dashboard siswa
    await page.waitForURL('**/student**', { timeout: 15000 })
    expect(page.url()).toContain('/student')
    await expect(page.locator('aside')).toBeVisible()

    // 4. Admin menonaktifkan akun siswa di database Supabase
    const { error: updateErr } = await supabase
      .from('profiles')
      .update({ status: 'nonaktif' })
      .eq('id', rpcUserId)
    expect(updateErr).toBeNull()

    // 5. Siswa berinteraksi / berpindah menu jika belum langsung ter-redirect
    const jadwalLink = page.locator('aside a[href="/student/jadwal"]').first()
    if (await jadwalLink.isVisible()) {
      await jadwalLink.click().catch(() => {})
    }

    // 6. Verifikasi pencekalan otomatis: redirect ke /masuk?deactivated=true
    await page.waitForURL('**/masuk?deactivated=true**', { timeout: 15000 })
    expect(page.url()).toContain('/masuk?deactivated=true')

    // 7. Verifikasi banner peringatan akun nonaktif muncul
    const alertBanner = page.locator('div[role="alert"]')
    await expect(alertBanner).toBeVisible()
    await expect(alertBanner).toContainText(
      'Akun Anda telah dinonaktifkan oleh pihak bimbingan belajar'
    )

    // 8. Verifikasi sesi siswa telah dibersihkan
    await page.goto('/student', { waitUntil: 'load' })
    await page.waitForURL('**/masuk**', { timeout: 15000 })
    expect(page.url()).toContain('/masuk')
  })
})