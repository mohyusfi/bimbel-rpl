import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import {
  authStore,
  DEMO_ACCOUNTS,
  clearCustomPasswords,
} from '../auth-store'
import { adminStore } from '../admin-store'

describe('Verified Student & Parent Login with Default Credentials', { timeout: 30000 }, () => {
  const TEST_STUDENT_EMAIL = 'ahmad.siswa.test@gmail.com'
  const TEST_STUDENT_NIS = 'TC-2026-991'
  const TEST_PARENT_EMAIL = 'ahmad.wali.test@gmail.com'

  beforeEach(async () => {
    await authStore.logout()
    clearCustomPasswords()

    // Clean up any existing test student first
    adminStore.getState().students = adminStore.getState().students.filter(
      (s) => s.email.toLowerCase() !== TEST_STUDENT_EMAIL
    )
    adminStore.getState().parents = adminStore.getState().parents.filter(
      (p) => p.email.toLowerCase() !== TEST_PARENT_EMAIL
    )

    // Add a verified student and parent directly to adminStore state
    adminStore.getState().students.push({
      id: 'stu-test-991',
      nis: TEST_STUDENT_NIS,
      name: 'Ahmad Santoso',
      email: TEST_STUDENT_EMAIL,
      phone: '0812-1111-2222',
      school: 'SMA Negeri 1 Palu',
      packageCode: 'UTBK',
      classId: 'cls-1',
      className: 'UTBK Intensif A',
      parentName: 'Pak Santoso',
      parentPhone: '0812-3333-4444',
      parentEmail: TEST_PARENT_EMAIL,
      joinDate: '30 Oktober 2026',
      status: 'aktif',
    })

    adminStore.getState().parents.push({
      id: 'par-test-991',
      name: 'Pak Santoso',
      email: TEST_PARENT_EMAIL,
      phone: '0812-3333-4444',
      job: 'Wiraswasta',
      address: 'Kota Palu',
      studentIds: ['stu-test-991'],
    })
  })

  afterEach(async () => {
    await authStore.logout()
    clearCustomPasswords()
    adminStore.getState().students = adminStore.getState().students.filter(
      (s) => s.email.toLowerCase() !== TEST_STUDENT_EMAIL
    )
    adminStore.getState().parents = adminStore.getState().parents.filter(
      (p) => p.email.toLowerCase() !== TEST_PARENT_EMAIL
    )
  })

  it('allows verified student to log in using email and password siswa2026', async () => {
    const res = await authStore.login(TEST_STUDENT_EMAIL, 'siswa2026', 'student')
    expect(res.success).toBe(true)
    expect(res.role).toBe('student')
    expect(authStore.getState().isAuthenticated).toBe(true)
    expect(authStore.getState().user?.email).toBe(TEST_STUDENT_EMAIL)
  })

  it('allows verified student to log in using NIS and password siswa2026', async () => {
    const res = await authStore.login(TEST_STUDENT_NIS, 'siswa2026', 'student')
    expect(res.success).toBe(true)
    expect(res.role).toBe('student')
    expect(authStore.getState().isAuthenticated).toBe(true)
  })

  it('rejects student login when password is wrong', async () => {
    const res = await authStore.login(TEST_STUDENT_EMAIL, 'passwordSalahBro', 'student')
    expect(res.success).toBe(false)
    expect(res.error).toContain('tidak cocok')
    expect(authStore.getState().isAuthenticated).toBe(false)
  })

  it('allows verified parent to log in using email and password wali2026', async () => {
    const res = await authStore.login(TEST_PARENT_EMAIL, 'wali2026', 'parent')
    expect(res.success).toBe(true)
    expect(res.role).toBe('parent')
    expect(authStore.getState().isAuthenticated).toBe(true)
  })

  it('rejects parent login when password is wrong', async () => {
    const res = await authStore.login(TEST_PARENT_EMAIL, 'salahSandiWali', 'parent')
    expect(res.success).toBe(false)
    expect(res.error).toContain('tidak cocok')
    expect(authStore.getState().isAuthenticated).toBe(false)
  })

  it('still allows demo student and demo parent to login with password123 for backward compatibility', async () => {
    const studentRes = await authStore.login(DEMO_ACCOUNTS.student.email, 'password123', 'student')
    expect(studentRes.success).toBe(true)
    await authStore.logout()

    const parentRes = await authStore.login(DEMO_ACCOUNTS.parent.email, 'password123', 'parent')
    expect(parentRes.success).toBe(true)
  })

  it('allows student to update password using old password siswa2026', async () => {
    // 1. Login with initial password siswa2026
    const loginRes = await authStore.login(TEST_STUDENT_EMAIL, 'siswa2026', 'student')
    expect(loginRes.success).toBe(true)

    // 2. Update password
    const updateRes = await authStore.updatePassword('siswa2026', 'newPasswordSiswa999')
    expect(updateRes.success).toBe(true)

    await authStore.logout()

    // 3. Old password should now fail
    const oldLoginRes = await authStore.login(TEST_STUDENT_EMAIL, 'siswa2026', 'student')
    expect(oldLoginRes.success).toBe(false)

    // 4. New password should succeed
    const newLoginRes = await authStore.login(TEST_STUDENT_EMAIL, 'newPasswordSiswa999', 'student')
    expect(newLoginRes.success).toBe(true)
  })

  it('handles email_not_confirmed Supabase error gracefully with informative guidance', async () => {
    const { supabase } = await import('../supabase/client')
    const originalSignIn = supabase.auth.signInWithPassword.bind(supabase.auth)

    // Mock unconfirmed email response
    supabase.auth.signInWithPassword = async () => ({
      data: { user: null, session: null },
      error: {
        code: 'email_not_confirmed',
        message: 'Email not confirmed',
        name: 'AuthApiError',
        status: 400,
      } as any,
    })

    try {
      const res = await authStore.login('unconfirmed.user@gmail.com', 'password123', 'student')
      expect(res.success).toBe(false)
      expect(res.error).toContain('Email akun belum dikonfirmasi di Supabase')
      expect(authStore.getState().isAuthenticated).toBe(false)
    } finally {
      supabase.auth.signInWithPassword = originalSignIn
    }
  })
})
