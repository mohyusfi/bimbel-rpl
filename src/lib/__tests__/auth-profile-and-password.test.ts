import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import {
  authStore,
  DEMO_ACCOUNTS,
  clearCustomPasswords,
} from '../auth-store'
import { adminStore } from '../admin-store'

describe('Autentikasi Ketat, Pembaruan Profil Mandiri & Reset Password Admin', { timeout: 30000 }, () => {
  beforeEach(async () => {
    await authStore.logout()
    clearCustomPasswords()
  })

  afterEach(async () => {
    await authStore.logout()
    // Cleanup data testing sesuai instruksi pengguna:
    // "*Hapus data hasil testing setelah selesai tetsing"
    clearCustomPasswords()
    DEMO_ACCOUNTS.tutor.password = DEMO_ACCOUNTS.tutor.defaultPassword
    DEMO_ACCOUNTS.student.password = DEMO_ACCOUNTS.student.defaultPassword
    DEMO_ACCOUNTS.parent.password = DEMO_ACCOUNTS.parent.defaultPassword
    DEMO_ACCOUNTS.admin.password = DEMO_ACCOUNTS.admin.defaultPassword
    DEMO_ACCOUNTS.tutor.name = 'Kak Dian Pratiwi, S.Si'
    DEMO_ACCOUNTS.admin.name = 'Hj. Nuraini, S.Pd'
  })

  // =========================================================================
  // 1. VERIFIKASI LOGIN: KATA SANDI SALAH DITOLAK TEGAS
  // =========================================================================
  describe('Validasi Login Ketat (Anti Bypass Password Salah)', () => {
    it('menolak login form jika kata sandi salah pada akun pengajar (tutor)', async () => {
      const res = await authStore.login(
        DEMO_ACCOUNTS.tutor.email,
        'passwordsalah123',
        'tutor'
      )

      expect(res.success).toBe(false)
      expect(res.error).toContain('Email atau kata sandi tidak cocok')

      const state = authStore.getState()
      expect(state.isAuthenticated).toBe(false)
      expect(state.user).toBeNull()
    })

    it('menolak login form jika kata sandi salah pada akun siswa', async () => {
      const res = await authStore.login(
        DEMO_ACCOUNTS.student.email,
        'passwordSalahTotal',
        'student'
      )

      expect(res.success).toBe(false)
      expect(res.error).toContain('Email atau kata sandi tidak cocok')
      expect(authStore.getState().isAuthenticated).toBe(false)
    })

    it('menolak login form jika kata sandi salah pada akun orang tua (wali)', async () => {
      const res = await authStore.login(
        DEMO_ACCOUNTS.parent.email,
        'salahLagiBro',
        'parent'
      )

      expect(res.success).toBe(false)
      expect(res.error).toContain('Email atau kata sandi tidak cocok')
      expect(authStore.getState().isAuthenticated).toBe(false)
    })

    it('menolak login form jika email sama sekali tidak dikenal', async () => {
      const res = await authStore.login(
        'akun.fiktif@example.com',
        'password123',
        'student'
      )

      expect(res.success).toBe(false)
      expect(res.error).toBeDefined()
      expect(authStore.getState().isAuthenticated).toBe(false)
    })

    it('berhasil login form jika kata sandi benar', async () => {
      const res = await authStore.login(
        DEMO_ACCOUNTS.tutor.email,
        DEMO_ACCOUNTS.tutor.defaultPassword,
        'tutor'
      )

      expect(res.success).toBe(true)
      expect(res.role).toBe('tutor')
      expect(authStore.getState().isAuthenticated).toBe(true)
      expect(authStore.getState().user?.email).toBe(DEMO_ACCOUNTS.tutor.email)
    })
  })

  // =========================================================================
  // 2. PEMBARUAN PROFIL MANDIRI (KECUALI SUPER ADMIN)
  // =========================================================================
  describe('Pembaruan Profil Mandiri (updateProfile)', () => {
    it('memperbarui profil staf Admin TU (nama dan no hp)', async () => {
      await authStore.login(
        DEMO_ACCOUNTS.admin.email,
        DEMO_ACCOUNTS.admin.defaultPassword,
        'admin'
      )

      const updateRes = await authStore.updateProfile({
        fullName: 'Hj. Nuraini, S.Pd, M.M',
        phone: '0812-9999-0000',
      })

      expect(updateRes.success).toBe(true)
      const state = authStore.getState()
      expect(state.user?.fullName).toBe('Hj. Nuraini, S.Pd, M.M')
      expect(state.user?.phone).toBe('0812-9999-0000')
    })

    it('memperbarui profil siswa (nama, no hp, asal sekolah)', async () => {
      await authStore.login(
        DEMO_ACCOUNTS.student.email,
        DEMO_ACCOUNTS.student.defaultPassword,
        'student'
      )

      const updateRes = await authStore.updateProfile({
        fullName: 'Fahri Ramadhan Putra',
        phone: '0813-1111-2222',
        school: 'SMAN 1 Palu',
      })

      expect(updateRes.success).toBe(true)
      const state = authStore.getState()
      expect(state.user?.fullName).toBe('Fahri Ramadhan Putra')
      expect(state.studentProfile?.name).toBe('Fahri Ramadhan Putra')
      expect(state.studentProfile?.school).toBe('SMAN 1 Palu')
    })

    it('memperbarui profil orang tua (nama, pekerjaan, alamat)', async () => {
      await authStore.login(
        DEMO_ACCOUNTS.parent.email,
        DEMO_ACCOUNTS.parent.defaultPassword,
        'parent'
      )

      const updateRes = await authStore.updateProfile({
        fullName: 'Ir. H. Ahmad Dahlan, M.T',
        occupation: 'Dosen Universitas Tadulako',
        address: 'Jl. Sam Ratulangi No. 45, Palu',
      })

      expect(updateRes.success).toBe(true)
      const state = authStore.getState()
      expect(state.user?.fullName).toBe('Ir. H. Ahmad Dahlan, M.T')
      expect(state.parentProfile?.job).toBe('Dosen Universitas Tadulako')
      expect(state.parentProfile?.address).toBe('Jl. Sam Ratulangi No. 45, Palu')
    })

    it('menolak pembaruan profil mandiri jika akun adalah Super Admin', async () => {
      authStore.quickLogin('super_admin')
      expect(authStore.getState().isSuperAdmin).toBe(true)

      const updateRes = await authStore.updateProfile({
        fullName: 'Nama Baru Super Admin',
      })

      expect(updateRes.success).toBe(false)
      expect(updateRes.error).toContain('Super Admin tidak dapat diubah secara mandiri')
    })
  })

  // =========================================================================
  // 3. PEMBARUAN KATA SANDI MANDIRI (VERIFIKASI KATA SANDI LAMA)
  // =========================================================================
  describe('Pembaruan Kata Sandi Mandiri (updatePassword)', () => {
    it('menolak ganti kata sandi jika kata sandi lama salah', async () => {
      await authStore.login(
        DEMO_ACCOUNTS.tutor.email,
        DEMO_ACCOUNTS.tutor.defaultPassword,
        'tutor'
      )

      const updateRes = await authStore.updatePassword(
        'kataSandiLamaSalah',
        'rahasiaBaru123'
      )

      expect(updateRes.success).toBe(false)
      expect(updateRes.error).toContain('lama) yang Anda masukkan tidak sesuai')
    })

    it('menolak ganti kata sandi jika kata sandi baru kurang dari 6 karakter', async () => {
      await authStore.login(
        DEMO_ACCOUNTS.tutor.email,
        DEMO_ACCOUNTS.tutor.defaultPassword,
        'tutor'
      )

      const updateRes = await authStore.updatePassword(
        DEMO_ACCOUNTS.tutor.defaultPassword,
        '123'
      )

      expect(updateRes.success).toBe(false)
      expect(updateRes.error).toContain('minimal harus 6 karakter')
    })

    it('berhasil memperbarui kata sandi dan kata sandi baru langsung aktif saat login berikutnya', async () => {
      const email = DEMO_ACCOUNTS.tutor.email
      const oldPass = DEMO_ACCOUNTS.tutor.defaultPassword
      const newPass = 'fisikaKeren2026'

      // 1. Tutor login
      await authStore.login(email, oldPass, 'tutor')

      // 2. Ubah kata sandi dengan verifikasi kata sandi lama
      const updateRes = await authStore.updatePassword(oldPass, newPass)
      expect(updateRes.success).toBe(true)

      // 3. Logout
      await authStore.logout()

      // 4. Login dengan kata sandi lama HARUS GAGAL
      const failLogin = await authStore.login(email, oldPass, 'tutor')
      expect(failLogin.success).toBe(false)

      // 5. Login dengan kata sandi baru HARUS BERHASIL
      const successLogin = await authStore.login(email, newPass, 'tutor')
      expect(successLogin.success).toBe(true)
      expect(authStore.getState().isAuthenticated).toBe(true)

      // 6. Kembalikan kata sandi tutor ke default password123 agar test idempotent
      await authStore.updatePassword(newPass, oldPass)
      await authStore.logout()
    })
  })

  // =========================================================================
  // 4. RESET PASSWORD OLEH ADMIN TATA USAHA
  // =========================================================================
  describe('Reset Password Siswa & Orang Tua oleh Admin (adminResetUserPassword)', () => {
    it('menolak reset password jika dipanggil oleh selain Admin', async () => {
      authStore.quickLogin('tutor')

      const resetRes = await authStore.adminResetUserPassword({
        targetRole: 'student',
        targetId: 'stu-1',
        email: DEMO_ACCOUNTS.student.email,
        newPassword: 'resetByTutorHarusGagal',
      })

      expect(resetRes.success).toBe(false)
      expect(resetRes.error).toContain('Hanya Administrator')
    })

    it('Admin dapat mereset kata sandi siswa ke kata sandi kustom', async () => {
      // 1. Admin login
      authStore.quickLogin('admin')

      const studentEmail = DEMO_ACCOUNTS.student.email
      const customNewPass = 'siswaReset999'

      // 2. Admin mereset password siswa
      const resetRes = await authStore.adminResetUserPassword({
        targetRole: 'student',
        targetId: 'stu-1',
        email: studentEmail,
        newPassword: customNewPass,
      })

      expect(resetRes.success).toBe(true)
      expect(resetRes.newPassword).toBe(customNewPass)

      // 3. Admin logout
      await authStore.logout()

      // 4. Siswa login dengan password lama HARUS DITOLAK
      const failRes = await authStore.login(studentEmail, 'passwordLamaSalah', 'student')
      expect(failRes.success).toBe(false)

      // 5. Siswa login dengan password hasil reset HARUS BERHASIL
      const loginRes = await authStore.login(studentEmail, customNewPass, 'student')
      expect(loginRes.success).toBe(true)
      expect(authStore.getState().isAuthenticated).toBe(true)

      // 6. Kembalikan password siswa ke default password123 via Admin
      await authStore.logout()
      authStore.quickLogin('admin')
      await authStore.adminResetUserPassword({
        targetRole: 'student',
        targetId: 'stu-1',
        email: studentEmail,
        newPassword: 'password123',
      })
      await authStore.logout()
    })

    it('Admin dapat mereset kata sandi orang tua ke default (password123)', async () => {
      // 1. Ubah dulu password orang tua ke password kustom
      await authStore.login(
        DEMO_ACCOUNTS.parent.email,
        DEMO_ACCOUNTS.parent.defaultPassword,
        'parent'
      )
      await authStore.updatePassword(
        DEMO_ACCOUNTS.parent.defaultPassword,
        'waliRahasiaTinggi'
      )
      await authStore.logout()

      // 2. Admin login dan reset password orang tua (tanpa mengisi newPassword, default password123)
      authStore.quickLogin('admin')
      const resetRes = await authStore.adminResetUserPassword({
        targetRole: 'parent',
        targetId: 'par-1',
        email: DEMO_ACCOUNTS.parent.email,
      })

      expect(resetRes.success).toBe(true)
      expect(resetRes.newPassword).toBe('password123')
      await authStore.logout()

      // 3. Orang tua login dengan password123 HARUS BERHASIL
      const loginRes = await authStore.login(
        DEMO_ACCOUNTS.parent.email,
        'password123',
        'parent'
      )
      expect(loginRes.success).toBe(true)
      expect(authStore.getState().isAuthenticated).toBe(true)
    })
  })
})
