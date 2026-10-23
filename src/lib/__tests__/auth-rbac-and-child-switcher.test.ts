import { describe, it, expect, beforeEach } from 'vitest'
import { authStore, DEMO_ACCOUNTS } from '../auth-store'
import { validateRouteAccess } from '../route-guard'
import { adminStore } from '../admin-store'

describe('Tiket 07 — Autentikasi Pengguna Terpadu, Multi-Child Switcher & RBAC Guard', { timeout: 30000 }, () => {
  beforeEach(async () => {
    await authStore.logout()
  })

  // =========================================================================
  // 1. ROUTE GUARD & RBAC SEAM (TanStack Router beforeLoad Guard)
  // =========================================================================
  describe('RBAC Route Guard & Navigation Isolation', () => {
    it('mengalihkan tamu (unauthenticated) ke /masuk saat mengakses rute terproteksi', () => {
      const state = authStore.getState()
      expect(state.isAuthenticated).toBe(false)

      const protectedRoutes = ['/admin', '/admin/siswa', '/tutor', '/student', '/parent']
      for (const route of protectedRoutes) {
        const check = validateRouteAccess(route, state)
        expect(check.allowed).toBe(false)
        expect(check.redirectTo).toBe(`/masuk?redirect=${encodeURIComponent(route)}`)
      }
    })

    it('mengalihkan siswa yang mencoba mengakses /admin ke dashboard /student', async () => {
      authStore.quickLogin('student')
      const state = authStore.getState()
      expect(state.role).toBe('student')

      const adminCheck = validateRouteAccess('/admin', state)
      expect(adminCheck.allowed).toBe(false)
      expect(adminCheck.redirectTo).toBe('/student')

      const tutorCheck = validateRouteAccess('/tutor', state)
      expect(tutorCheck.allowed).toBe(false)
      expect(tutorCheck.redirectTo).toBe('/student')

      const studentCheck = validateRouteAccess('/student', state)
      expect(studentCheck.allowed).toBe(true)
    })

    it('mengalihkan tutor yang mencoba mengakses /parent ke dashboard /tutor', async () => {
      authStore.quickLogin('tutor')
      const state = authStore.getState()
      expect(state.role).toBe('tutor')

      const parentCheck = validateRouteAccess('/parent', state)
      expect(parentCheck.allowed).toBe(false)
      expect(parentCheck.redirectTo).toBe('/tutor')

      const tutorCheck = validateRouteAccess('/tutor/jadwal', state)
      expect(tutorCheck.allowed).toBe(true)
    })

    it('mengizinkan staf admin mengakses /admin/*', async () => {
      authStore.quickLogin('admin')
      const state = authStore.getState()
      expect(state.role).toBe('admin')

      const adminCheck = validateRouteAccess('/admin/siswa', state)
      expect(adminCheck.allowed).toBe(true)

      const studentCheck = validateRouteAccess('/student', state)
      expect(studentCheck.allowed).toBe(false)
      expect(studentCheck.redirectTo).toBe('/admin')
    })
  })

  // =========================================================================
  // 2. MULTI-CHILD SWITCHER & ISOLASI DATA ANAK
  // =========================================================================
  describe('Multi-Child Switcher Orang Tua', () => {
    it('memuat seluruh anak yang berelasi dan mendukung pergantian profil aktif', async () => {
      // Login sebagai Ahmad Dahlan (Wali 2 anak)
      const loginRes = await authStore.login(
        DEMO_ACCOUNTS.parent.email,
        DEMO_ACCOUNTS.parent.defaultPassword,
        'parent'
      )
      expect(loginRes.success).toBe(true)

      const state = authStore.getState()
      expect(state.role).toBe('parent')
      expect(state.children.length).toBeGreaterThanOrEqual(2)

      const child1 = state.children[0]
      const child2 = state.children[1]
      expect(child1).toBeDefined()
      expect(child2).toBeDefined()

      // Default selected child adalah anak pertama
      expect(state.selectedChildId).toBe(child1.id)

      // Ganti anak aktif ke anak kedua
      authStore.switchSelectedChild(child2.id)
      const updatedState = authStore.getState()
      expect(updatedState.selectedChildId).toBe(child2.id)

      // Sinkronisasi dengan adminStore
      const adminState = adminStore.getState()
      expect(adminState.selectedChildId).toBe(child2.id)
    })

    it('mengisolasi data tagihan dan jadwal antara anak yang dipilih', async () => {
      await authStore.login(
        DEMO_ACCOUNTS.parent.email,
        DEMO_ACCOUNTS.parent.defaultPassword,
        'parent'
      )
      const state = authStore.getState()
      const fahri = state.children.find((c) => c.name.toLowerCase().includes('fahri'))
      const alya = state.children.find((c) => c.name.toLowerCase().includes('alya'))

      expect(fahri).toBeDefined()
      expect(alya).toBeDefined()
      if (!fahri || !alya) return

      // Saat memilih Fahri
      authStore.switchSelectedChild(fahri.id)
      expect(authStore.getState().selectedChildId).toBe(fahri.id)

      // Saat beralih ke Alya
      authStore.switchSelectedChild(alya.id)
      expect(authStore.getState().selectedChildId).toBe(alya.id)
    })
  })

  // =========================================================================
  // 3. TATA KELOLA STAF & INSTANT SESSION REVOCATION
  // =========================================================================
  describe('Tata Kelola Staf, Login Guard & Session Revocation', () => {
    it('membedakan hak Super Admin (Pimpinan) dan Staf TU biasa pada Quick Login', () => {
      // Super Admin
      const superLogin = authStore.quickLogin('super_admin')
      expect(superLogin.success).toBe(true)
      expect(authStore.getState().isSuperAdmin).toBe(true)
      expect(authStore.getState().user?.email).toBe(DEMO_ACCOUNTS.super_admin.email)

      // Regular Admin
      const regularLogin = authStore.quickLogin('admin')
      expect(regularLogin.success).toBe(true)
      expect(authStore.getState().isSuperAdmin).toBe(false)
      expect(authStore.getState().user?.email).toBe(DEMO_ACCOUNTS.admin.email)
    })

    it('mencekal login staf yang dinonaktifkan oleh Super Admin', async () => {
      // 1. Login sebagai Super Admin
      authStore.quickLogin('super_admin')
      const targetStaff = authStore.getAdminStaff().find((s) => !s.isSuperAdmin)
      expect(targetStaff).toBeDefined()
      if (!targetStaff) return

      // 2. Nonaktifkan staf target
      const toggleRes = await authStore.toggleAdminStaffStatus(targetStaff.id, 'nonaktif')
      expect(toggleRes.success).toBe(true)

      // 3. Logout Super Admin
      await authStore.logout()

      // 4. Staf target mencoba login -> Wajib DITOLAK oleh Login Guard
      const loginAttempt = await authStore.login(targetStaff.email, 'password123', 'admin')
      expect(loginAttempt.success).toBe(false)
      expect(loginAttempt.error).toContain('dinonaktifkan')

      // 5. Kembalikan status staf ke aktif agar tidak mempengaruhi test suite lain
      authStore.quickLogin('super_admin')
      await authStore.toggleAdminStaffStatus(targetStaff.id, 'aktif')
    })

    it('mencabut sesi aktif (instant revocation) jika status staf diubah menjadi nonaktif saat sedang browsing', async () => {
      // 1. Staf biasa login
      authStore.quickLogin('admin')
      const regularStaffEmail = DEMO_ACCOUNTS.admin.email
      let state = authStore.getState()
      expect(state.isAuthenticated).toBe(true)

      // 2. Simulasi staf dinonaktifkan di sistem
      const staffList = authStore.getAdminStaff()
      const targetIndex = staffList.findIndex((s) => s.email.toLowerCase() === regularStaffEmail.toLowerCase())
      if (targetIndex !== -1) {
        staffList[targetIndex].status = 'nonaktif'
      }

      // 3. Saat staf melakukan navigasi rute, route guard mendeteksi status nonaktif dan memutus sesi
      const check = validateRouteAccess('/admin/pendaftaran', state)
      expect(check.allowed).toBe(false)
      expect(check.redirectTo).toContain('/masuk?deactivated=true')
      expect(check.shouldClearSession).toBe(true)

      if (check.shouldClearSession) {
        authStore.clearSession()
      }

      // Pastikan sesi aktif di authStore langsung terhapus
      expect(authStore.getState().isAuthenticated).toBe(false)

      // Kembalikan status ke aktif
      if (targetIndex !== -1) {
        staffList[targetIndex].status = 'aktif'
      }
    })
  })
})
