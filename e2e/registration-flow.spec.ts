import { test, expect } from '@playwright/test'
import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || 'https://rtamiwffuaxwzyjkocmj.supabase.co'
const SUPABASE_ANON_KEY =
  process.env.VITE_SUPABASE_ANON_KEY ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ0YW1pd2ZmdWF4d3p5amtvY21qIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTE2MTQzNDksImV4cCI6MjEwNzE5MDM0OX0.bOIIpD_R-4lQW_T0MEnBsINYXTpwVjH3ExU9peF8XD0'

const getUniqueEmail = (prefix: string) => `${prefix}.${Date.now()}.${Math.floor(Math.random() * 1000)}@tadulako.sch.id`

const cleanupTestData = async () => {
  try {
    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
    await supabase.auth.signInWithPassword({
      email: 'pimpinan@tadulakocendekia.sch.id',
      password: 'password123',
    })

    // 1. Bersihkan data pendaftaran uji coba E2E
    await supabase.from('registrations').delete().ilike('student_email', 'e2e.%')

    // 2. Bersihkan profil dan data siswa uji coba E2E
    const { data: testProfiles } = await supabase
      .from('profiles')
      .select('id')
      .ilike('email', 'e2e.%')

    if (testProfiles && testProfiles.length > 0) {
      for (const p of testProfiles) {
        await supabase.from('class_members').delete().eq('student_id', p.id)
        await supabase.from('students').delete().or(`id.eq.${p.id},profile_id.eq.${p.id}`)
        await supabase.from('parents').delete().or(`id.eq.${p.id},profile_id.eq.${p.id}`)
        await supabase.from('profiles').delete().eq('id', p.id)
      }
    }
  } catch (err) {
    console.warn('[WARN] Cleanup note:', err)
  }
}

test.describe.serial('E2E Registration Flow & Multi-Child Handling', () => {
  test.beforeAll(async () => {
    await cleanupTestData()
  })

  test.afterAll(async () => {
    // Wajib: Bersihkan seluruh data testing sesuai aturan AGENTS.md (Zero Stale Test Data)
    await cleanupTestData()
  })

  test('Case 1: Registrasi Calon Siswa Baru Pertama via Modal Publik', async ({ page }) => {
    await page.goto('/masuk?e2e=true', { waitUntil: 'load' })
    await page.waitForSelector('form[data-hydrated="true"]')

    // 1. Buka formulir registrasi
    const openRegisterBtn = page.locator('button:has-text("Daftar program sekarang")')
    await expect(openRegisterBtn).toBeVisible()
    await openRegisterBtn.click()

    // 2. Verifikasi modal terbuka
    const modalTitle = page.locator('#regTitle')
    await expect(modalTitle).toBeVisible()
    await expect(modalTitle).toContainText('Pendaftaran Calon Siswa Baru')

    // 3. Isi data calon siswa baru
    await page.fill('#studentName', 'E2E Siswa Baru Satu')
    await page.fill('#studentEmail', getUniqueEmail('e2e.student.one'))
    await page.fill('#studentPhone', '08129881111')
    await page.fill('#studentSchool', 'SMAN 1 Palu')
    await page.selectOption('#studentPackage', 'UTBK')

    // 4. Isi data orang tua baru
    await page.fill('#parentName', 'E2E Wali Baru Satu')
    await page.fill('#parentEmail', getUniqueEmail('e2e.parent.one'))
    await page.fill('#parentPhone', '08129882222')
    await page.fill('#parentJob', 'Wiraswasta')
    await page.fill('#parentAddress', 'Jl. Sam Ratulangi No. 10')

    // 5. Bypass Turnstile di lingkungan dev (scoping ke #regForm agar tidak bentrok dengan login turnstile)
    const bypassBtn = page.locator('#regForm button:has-text("[Dev: Isi Token Uji Coba Otomatis]")')
    await expect(bypassBtn).toBeVisible()
    await bypassBtn.click()

    // 6. Submit formulir pendaftaran
    const submitBtn = page.locator('#submitRegBtn')
    await expect(submitBtn).toBeEnabled()
    await submitBtn.click()

    // 7. Verifikasi pendaftaran berhasil dan tiket terbit
    await expect(page.locator('text=Tiket Pendaftaran')).toBeVisible({ timeout: 15000 })
    await expect(page.locator('text=E2E Siswa Baru Satu')).toBeVisible()

    // 8. Tutup modal
    const selesaiBtn = page.locator('div[role="dialog"] button:has-text("Selesai")')
    await expect(selesaiBtn).toBeVisible()
    await selesaiBtn.click()
  })

  test('Case 2: Registrasi Anak Kedua untuk Wali Terdaftar & Deteksi Otomatis', async ({ page }) => {
    await page.goto('/masuk?e2e=true', { waitUntil: 'load' })
    await page.waitForSelector('form[data-hydrated="true"]')

    // 1. Buka formulir registrasi
    const openRegisterBtn = page.locator('button:has-text("Daftar program sekarang")')
    await expect(openRegisterBtn).toBeVisible()
    await openRegisterBtn.click()

    await expect(page.locator('#regTitle')).toBeVisible()

    // 2. Isi data calon siswa anak kedua
    await page.fill('#studentName', 'E2E Anak Kedua Dahlan')
    await page.fill('#studentEmail', getUniqueEmail('e2e.student.sibling'))
    await page.fill('#studentPhone', '08129883333')
    await page.fill('#studentSchool', 'SMAN 2 Palu')
    await page.selectOption('#studentPackage', 'UTBK')

    // 3. Masukkan kontak orang tua terdaftar (Ir. H. Ahmad Dahlan)
    await page.fill('#parentName', 'Ir. H. Ahmad Dahlan')
    await page.fill('#parentEmail', 'ahmad.dahlan@wali.tadulakocendekia.sch.id')
    await page.fill('#parentPhone', '0821-4455-6677')

    // 4. Verifikasi muncul banner deteksi akun wali terdaftar
    const detectedBanner = page.locator('text=Akun Wali Terdeteksi')
    await expect(detectedBanner).toBeVisible({ timeout: 10000 })
    await expect(page.locator('text=otomatis ditautkan ke akun orang tua')).toBeVisible()

    // 5. Bypass Turnstile dan kirim pendaftaran (scoping ke #regForm)
    const bypassBtn = page.locator('#regForm button:has-text("[Dev: Isi Token Uji Coba Otomatis]")')
    await bypassBtn.click()

    const submitBtn = page.locator('#submitRegBtn')
    await submitBtn.click()

    // 6. Verifikasi pendaftaran anak kedua sukses tercatat
    await expect(page.locator('text=Tiket Pendaftaran')).toBeVisible({ timeout: 15000 })
    await expect(page.locator('text=E2E Anak Kedua Dahlan')).toBeVisible()

    const selesaiBtn = page.locator('div[role="dialog"] button:has-text("Selesai")')
    await selesaiBtn.click()
  })

  test('Case 3: Verifikasi & Plotting oleh Admin dengan Deteksi Wali Terdaftar', async ({ page }) => {
    // 1. Masuk sebagai Admin
    await page.goto('/masuk?e2e=true', { waitUntil: 'load' })
    await page.waitForSelector('form[data-hydrated="true"]')

    const adminDemoBtn = page.locator('button:has-text("Admin")').first()
    await adminDemoBtn.click()
    await page.waitForURL('**/admin**', { timeout: 15000 })

    // 2. Buka menu Pendaftaran Siswa
    await page.goto('/admin/pendaftaran', { waitUntil: 'load' })
    await expect(page.locator('h1')).toContainText('Verifikasi Pendaftaran', { timeout: 20000 })

    // 3. Cari pendaftar anak kedua
    const searchInput = page.locator('input[placeholder*="Cari nama calon siswa"]')
    await expect(searchInput).toBeVisible()
    await searchInput.fill('E2E Anak Kedua Dahlan')

    // 4. Klik tombol Setujui & Plot
    const approveBtn = page.locator('button:has-text("Setujui & Plot")').first()
    await expect(approveBtn).toBeVisible({ timeout: 10000 })
    await approveBtn.click()

    // 5. Verifikasi di dalam modal persetujuan muncul info wali terdaftar
    const existingParentNotice = page.locator('text=Wali Murid Sudah Terdaftar')
    await expect(existingParentNotice).toBeVisible()

    // Pastikan rombel kelas terisi jika belum otomatis terpilih
    const classInput = page.locator('div[role="dialog"] input[placeholder="Pilih rombel / kelas..."]')
    if (await classInput.isVisible()) {
      await classInput.click()
      const classOption = page.locator('button:has-text("UTBK Intensif")').first()
      if (await classOption.isVisible({ timeout: 2000 }).catch(() => false)) {
        await classOption.click()
      }
    }

    // 6. Konfirmasi persetujuan
    const confirmApproveBtn = page.locator('button:has-text("Konfirmasi Persetujuan")')
    await expect(confirmApproveBtn).toBeVisible()
    await confirmApproveBtn.click()

    // 7. Verifikasi modal kredensial menandai akun wali sudah terdaftar sebelumnya
    const credsModal = page.locator('text=Kredensial Akses Akun Siswa & Wali')
    await expect(credsModal).toBeVisible({ timeout: 15000 })

    const existingParentStatus = page.locator('text=Akun Telah Aktif (Gunakan akun yang telah ada)')
    await expect(existingParentStatus).toBeVisible()

    // 8. Tutup modal kredensial
    const closeCredsBtn = page.locator('button:has-text("Tutup & Selesai")')
    await expect(closeCredsBtn).toBeVisible()
    await closeCredsBtn.click()
  })

  test('Case 4: Tambah Siswa Manual di Dashboard Admin dengan Memilih Wali Terdaftar', async ({ page }) => {
    // 1. Masuk sebagai Admin jika belum di dashboard admin
    if (!page.url().includes('/admin')) {
      await page.goto('/masuk?e2e=true', { waitUntil: 'load' })
      await page.waitForSelector('form[data-hydrated="true"]')
      const adminDemoBtn = page.locator('button:has-text("Admin")').first()
      await adminDemoBtn.click()
      await page.waitForURL('**/admin**', { timeout: 15000 })
    }

    // 2. Buka menu Direktori Siswa
    await page.goto('/admin/siswa', { waitUntil: 'load' })
    await expect(page.locator('h1')).toContainText('Direktori Siswa & Wali Murid', { timeout: 20000 })

    // 3. Buka modal Tambah Siswa Baru
    const addStudentBtn = page.locator('button:has-text("Tambah Siswa & Wali Baru")')
    await expect(addStudentBtn).toBeVisible()
    await addStudentBtn.click()

    // 4. Isi identitas siswa
    await page.fill('input[placeholder="Contoh: Muhammad Akbar"]', 'E2E Siswa Tambah Manual')
    await page.fill('input[placeholder="akbar@email.com"]', getUniqueEmail('e2e.student.manual'))
    await page.fill('input[placeholder="0821-xxxx-xxxx"]', '08129884444')
    await page.fill('input[placeholder="Contoh: SMAN 1 Palu"]', 'SMAN 3 Palu')

    // Pastikan rombel kelas terisi
    const classSelect = page.locator('div[role="dialog"] input[placeholder="Pilih rombel / kelas..."]')
    if (await classSelect.isVisible()) {
      await classSelect.click()
      const firstClassOpt = page.locator('button:has-text("kursi")').first()
      if (await firstClassOpt.isVisible({ timeout: 2000 }).catch(() => false)) {
        await firstClassOpt.click()
      }
    }

    // 5. Ganti opsi kontak wali ke "Pilih Wali Terdaftar"
    const existingParentTab = page.locator('button:has-text("Pilih Wali Terdaftar")')
    await expect(existingParentTab).toBeVisible()
    await existingParentTab.click()

    // 6. Pilih orang tua Ir. H. Ahmad Dahlan
    const parentSearchInput = page.locator('input[placeholder="Cari nama orang tua / nomor WA..."]')
    await expect(parentSearchInput).toBeVisible()
    await parentSearchInput.click()
    await parentSearchInput.fill('Ahmad Dahlan')

    const parentOption = page.locator('button:has-text("Ahmad Dahlan")').first()
    await expect(parentOption).toBeVisible()
    await parentOption.click()

    // 7. Verifikasi pesan penautan otomatis tampil
    const linkNotice = page.locator('text=[INFO] Siswa baru ini akan otomatis ditautkan ke akun orang tua di atas.')
    await expect(linkNotice).toBeVisible()

    // 8. Simpan data siswa baru
    const saveStudentBtn = page.locator('button:has-text("Simpan Data Siswa")')
    await expect(saveStudentBtn).toBeVisible()
    await saveStudentBtn.click()

    // 9. Verifikasi modal tertutup dan siswa baru muncul pada daftar
    await expect(page.locator('h1')).toContainText('Direktori Siswa & Wali Murid')
    const searchStudent = page.locator('input[placeholder*="Cari NIS, nama siswa"]')
    await expect(searchStudent).toBeVisible()
    await searchStudent.fill('E2E Siswa Tambah Manual')
    await expect(page.locator('text=E2E Siswa Tambah Manual')).toBeVisible({ timeout: 10000 })
  })

  test('Case 5: Multi-Child Switcher pada Portal Orang Tua Berfungsi Penuh', async ({ page }) => {
    // 1. Masuk sebagai Orang Tua (Ahmad Dahlan)
    await page.goto('/masuk?e2e=true', { waitUntil: 'load' })
    await page.waitForSelector('form[data-hydrated="true"]')

    const parentDemoBtn = page.locator('button:has-text("Orang Tua")')
    await expect(parentDemoBtn).toBeVisible()
    await parentDemoBtn.click()

    // 2. Verifikasi halaman dashboard portal orang tua
    await page.waitForURL('**/parent**', { timeout: 15000 })
    expect(page.url()).toContain('/parent')

    // 3. Verifikasi ketersediaan tombol switcher profil anak
    const switcherTitle = page.locator('text=Pilih Profil Anak')
    await expect(switcherTitle).toBeVisible({ timeout: 15000 })

    const fahriBtn = page.locator('button:has-text("Fahri Ramadhan")').first()
    const alyaBtn = page.locator('button:has-text("Alya Ramadhani")').first()

    await expect(fahriBtn).toBeVisible()
    await expect(alyaBtn).toBeVisible()

    // 4. Verifikasi pergantian ke anak kedua (Alya Ramadhani)
    await alyaBtn.click()
    await expect(page.locator('h1')).toContainText('Alya Ramadhani', { timeout: 8000 })

    // 5. Verifikasi pergantian kembali ke anak pertama (Fahri Ramadhan)
    await fahriBtn.click()
    await expect(page.locator('h1')).toContainText('Fahri Ramadhan', { timeout: 8000 })
  })
})
