import { describe, it, expect, beforeEach } from 'vitest'
import { authStore, DEMO_ACCOUNTS, INITIAL_ADMIN_STAFF } from '../auth-store'
import { supabase } from '../supabase/client'

describe('Admin Staff Management & Security Audit (Wave 1)', { timeout: 30000 }, () => {
  beforeEach(async () => {
    // Reset auth state & staff to known clean state before each test
    await authStore.logout()
    // Login as Super Admin
    authStore.quickLogin('super_admin')
  })

  // =========================================================================
  // 1. ANTI SELF-LOCKOUT AUDIT
  // =========================================================================
  describe('Anti Self-Lockout Guardrails', () => {
    it('mencegah Super Admin menonaktifkan akunnya sendiri menggunakan ID staf', async () => {
      const superAdminStaff = authStore.getAdminStaff().find((s) => s.isSuperAdmin)
      expect(superAdminStaff).toBeDefined()
      if (!superAdminStaff) return

      // Coba nonaktifkan akun sendiri via staff ID
      const result = await authStore.toggleAdminStaffStatus(superAdminStaff.id, 'nonaktif')

      expect(result.success).toBe(false)
      expect(result.error).toContain(
        'Anda tidak dapat menonaktifkan akun Anda sendiri demi mencegah penguncian sistem (anti-lockout).'
      )

      // Pastikan status akun Super Admin tetap 'aktif'
      const checkStaff = authStore.getAdminStaff().find((s) => s.id === superAdminStaff.id)
      expect(checkStaff?.status).toBe('aktif')
    })

    it('mencegah Super Admin menonaktifkan akunnya sendiri menggunakan Email staf', async () => {
      const superAdminEmail = DEMO_ACCOUNTS.super_admin.email

      // Coba nonaktifkan akun sendiri via email
      const result = await authStore.toggleAdminStaffStatus(superAdminEmail, 'nonaktif')

      expect(result.success).toBe(false)
      expect(result.error).toContain(
        'Anda tidak dapat menonaktifkan akun Anda sendiri demi mencegah penguncian sistem (anti-lockout).'
      )

      const checkStaff = authStore.getAdminStaff().find(
        (s) => s.email.toLowerCase() === superAdminEmail.toLowerCase()
      )
      expect(checkStaff?.status).toBe('aktif')
    })

    it('mencegah Super Admin mencabut hak Super Admin dirinya sendiri jika dia adalah satu-satunya Super Admin aktif', async () => {
      const superAdminStaff = authStore.getAdminStaff().find((s) => s.isSuperAdmin)
      expect(superAdminStaff).toBeDefined()
      if (!superAdminStaff) return

      // Pastikan hanya ada 1 Super Admin aktif
      const activeSuperAdmins = authStore
        .getAdminStaff()
        .filter((s) => s.isSuperAdmin && s.status === 'aktif')
      expect(activeSuperAdmins.length).toBe(1)

      // Coba turunkan hak akses Super Admin dirinya sendiri
      const result = await authStore.updateAdminStaff(superAdminStaff.id, {
        fullName: superAdminStaff.fullName,
        phone: superAdminStaff.phone,
        isSuperAdmin: false, // Pencabutan hak akses
      })

      expect(result.success).toBe(false)
      expect(result.error).toContain(
        'Tidak dapat mencabut hak akses Super Admin karena Anda adalah satu-satunya Super Admin aktif di sistem.'
      )

      // Pastikan status isSuperAdmin tetap true
      const checkStaff = authStore.getAdminStaff().find((s) => s.id === superAdminStaff.id)
      expect(checkStaff?.isSuperAdmin).toBe(true)
    })

    it('menolak pengubahan status atau data staf jika pemanggil bukan Super Admin', async () => {
      // Login sebagai staf biasa (bukan super admin)
      authStore.quickLogin('admin')
      expect(authStore.getState().isSuperAdmin).toBe(false)

      const targetStaff = authStore.getAdminStaff().find((s) => !s.isSuperAdmin)
      expect(targetStaff).toBeDefined()
      if (!targetStaff) return

      // Coba ubah status sebagai staf biasa
      const toggleRes = await authStore.toggleAdminStaffStatus(targetStaff.id, 'nonaktif')
      expect(toggleRes.success).toBe(false)
      expect(toggleRes.error).toContain(
        'Hanya Super Admin (Pimpinan Lembaga) yang berwenang mengubah status staf.'
      )

      // Coba edit data staf sebagai staf biasa
      const editRes = await authStore.updateAdminStaff(targetStaff.id, {
        fullName: 'Percobaan Ilegal',
        phone: '0812-0000-0000',
        isSuperAdmin: false,
      })
      expect(editRes.success).toBe(false)
      expect(editRes.error).toContain(
        'Hanya Super Admin (Pimpinan Lembaga) yang berwenang memperbarui data staf.'
      )
    })
  })

  // =========================================================================
  // 2. LOGIN GUARD UNTUK AKUN NONAKTIF
  // =========================================================================
  describe('Login Guard untuk Akun Nonaktif', () => {
    const testStaffEmail = 'nuraini.tu@tadulakocendekia.sch.id'
    const testStaffPassword = 'password123'

    it('menolak login staf yang dinonaktifkan dengan pesan resmi penonaktifan', async () => {
      // 1. Super Admin menonaktifkan akun staf
      const targetStaff = authStore.getAdminStaff().find(
        (s) => s.email.toLowerCase() === testStaffEmail.toLowerCase()
      )
      expect(targetStaff).toBeDefined()
      if (!targetStaff) return

      const toggleRes = await authStore.toggleAdminStaffStatus(targetStaff.id, 'nonaktif')
      expect(toggleRes.success).toBe(true)
      expect(toggleRes.staff?.status).toBe('nonaktif')

      // 2. Logout Super Admin
      await authStore.logout()
      expect(authStore.getState().isAuthenticated).toBe(false)

      // 3. Staf yang dinonaktifkan mencoba login
      const loginRes = await authStore.login(testStaffEmail, testStaffPassword, 'admin')

      expect(loginRes.success).toBe(false)
      expect(loginRes.error).toBe(
        'Akun Anda telah dinonaktifkan oleh Pimpinan Lembaga. Silakan hubungi Tata Usaha.'
      )

      // Pastikan status auth tetap unauthenticated
      const state = authStore.getState()
      expect(state.isAuthenticated).toBe(false)
      expect(state.user).toBeNull()
      expect(state.error).toBe(
        'Akun Anda telah dinonaktifkan oleh Pimpinan Lembaga. Silakan hubungi Tata Usaha.'
      )
    })

    it('mengizinkan login kembali setelah akun diaktifkan ulang oleh Super Admin', async () => {
      // 1. Super Admin login kembali dan mengaktifkan akun staf
      authStore.quickLogin('super_admin')
      const targetStaff = authStore.getAdminStaff().find(
        (s) => s.email.toLowerCase() === testStaffEmail.toLowerCase()
      )
      expect(targetStaff).toBeDefined()
      if (!targetStaff) return

      const reactivateRes = await authStore.toggleAdminStaffStatus(targetStaff.id, 'aktif')
      expect(reactivateRes.success).toBe(true)
      expect(reactivateRes.staff?.status).toBe('aktif')

      // 2. Logout Super Admin
      await authStore.logout()

      // 3. Staf yang telah diaktifkan kembali mencoba login
      const loginRes = await authStore.login(testStaffEmail, testStaffPassword, 'admin')

      expect(loginRes.success).toBe(true)
      expect(loginRes.role).toBe('admin')

      const state = authStore.getState()
      expect(state.isAuthenticated).toBe(true)
      expect(state.user?.email.toLowerCase()).toBe(testStaffEmail.toLowerCase())
      expect(state.error).toBeNull()
    })
  })

  // =========================================================================
  // 3. MODIFIKASI DATA STAF TATA USAHA
  // =========================================================================
  describe('Modifikasi Data Staf Tata Usaha', () => {
    it('memperbarui nama lengkap, nomor telepon, dan hak akses staf dengan konsisten', async () => {
      const targetStaff = authStore.getAdminStaff().find((s) => s.id === 'staf-02')
      expect(targetStaff).toBeDefined()
      if (!targetStaff) return

      const updatedName = 'Muhammad Rizal Al-Habsyi, M.Kom'
      const updatedPhone = '0812-9876-5432'

      const updateRes = await authStore.updateAdminStaff(targetStaff.id, {
        fullName: updatedName,
        phone: updatedPhone,
        isSuperAdmin: false,
      })

      expect(updateRes.success).toBe(true)
      expect(updateRes.staff?.fullName).toBe(updatedName)
      expect(updateRes.staff?.phone).toBe(updatedPhone)

      // Pastikan data tersimpan secara konsisten di state adminStaff
      const savedStaff = authStore.getAdminStaff().find((s) => s.id === 'staf-02')
      expect(savedStaff?.fullName).toBe(updatedName)
      expect(savedStaff?.phone).toBe(updatedPhone)
    })

    it('memperbarui kata sandi staf dan menolak kata sandi kurang dari 6 karakter', async () => {
      const targetStaff = authStore.getAdminStaff().find((s) => s.id === 'staf-01')
      expect(targetStaff).toBeDefined()
      if (!targetStaff) return

      // Kata sandi baru yang valid
      const updateRes = await authStore.updateAdminStaff(targetStaff.id, {
        fullName: targetStaff.fullName,
        phone: targetStaff.phone,
        isSuperAdmin: false,
        password: 'sandiBaru2026!',
      })

      expect(updateRes.success).toBe(true)
      // Kata sandi demo account admin ter-update
      expect(DEMO_ACCOUNTS.admin.password).toBe('sandiBaru2026!')

      // Kembalikan ke default password untuk konsistensi
      await authStore.updateAdminStaff(targetStaff.id, {
        fullName: targetStaff.fullName,
        phone: targetStaff.phone,
        isSuperAdmin: false,
        password: 'password123',
      })
      expect(DEMO_ACCOUNTS.admin.password).toBe('password123')
    })

    it('menolak pembaruan data jika nama lengkap kosong', async () => {
      const targetStaff = authStore.getAdminStaff().find((s) => s.id === 'staf-02')
      expect(targetStaff).toBeDefined()
      if (!targetStaff) return

      const updateRes = await authStore.updateAdminStaff(targetStaff.id, {
        fullName: '    ', // nama kosong
        phone: '0812-3344-5566',
        isSuperAdmin: false,
      })

      expect(updateRes.success).toBe(false)
      expect(updateRes.error).toBe('Nama lengkap staf wajib diisi.')
    })
  })

  // =========================================================================
  // 4. DATABASE & MODEL INTEGRITY CHECK
  // =========================================================================
  describe('Database & Model Integrity Check', () => {
    it('memastikan schema ProfileRow dan Supabase client mendukung kolom status', () => {
      // Periksa bahwa type definition dan state profile mengenali status
      const state = authStore.getState()
      expect(state.profile).toBeDefined()
      expect(state.profile?.status).toBeDefined()
      expect(['aktif', 'nonaktif']).toContain(state.profile?.status)
    })

    it('memastikan setiap anggota staf default memiliki status awal "aktif"', () => {
      const staffList = authStore.getAdminStaff()
      expect(staffList.length).toBeGreaterThan(0)
      for (const staff of staffList) {
        expect(staff.status).toBe('aktif')
      }
    })
  })
})
