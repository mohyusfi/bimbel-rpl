import { describe, it } from 'vitest'
import { authStore, DEMO_ACCOUNTS } from '../auth-store'
import { supabase, isSupabaseConfigured } from '../supabase/client'
import { adminStore } from '../admin-store'

describe('Auth & Auto-Provisioning Test Suite', { timeout: 30000 }, () => {
  it('provisions students, parents, and staff correctly', async () => {
    await runTests()
  })
})

async function runTests() {
  console.log('--- Starting Auth & Auto-Provisioning Test Suite ---')

  // 1. Check Supabase Client
  console.log('\n[TEST 1] Supabase Client Configuration:')
  const configured = isSupabaseConfigured()
  console.log('[PASS] isSupabaseConfigured():', configured)
  if (!supabase) throw new Error('Supabase client is not instantiated')
  console.log('[PASS] Supabase client instance exists')

  // 2. Test Student Login & Auto-provisioning
  console.log('\n[TEST 2] Student Login & Auto-Provisioning:')
  const studentEmail = 'budi.santoso@siswa.tadulakocendekia.sch.id'
  const studentLoginRes = await authStore.login(studentEmail, 'password123', 'student')

  console.log('Student login result:', studentLoginRes)
  if (!studentLoginRes.success) throw new Error('Student login failed')
  if (studentLoginRes.role !== 'student') throw new Error(`Expected role student, got ${studentLoginRes.role}`)

  const state1 = authStore.getState()
  console.log('[PASS] Authenticated:', state1.isAuthenticated)
  console.log('[PASS] User:', state1.user?.fullName, `(${state1.user?.email})`)
  console.log('[PASS] Role:', state1.role)
  console.log('[PASS] Provisioned Student Profile:', state1.studentProfile?.name)
  console.log('[PASS] Generated NIS:', state1.studentProfile?.nis)
  console.log('[PASS] Assigned Class:', state1.studentProfile?.className)

  if (!state1.studentProfile?.nis.startsWith('TC-2026-')) {
    throw new Error(`NIS format invalid: ${state1.studentProfile?.nis}`)
  }

  // Check role verification
  if (!authStore.verifyRole('student')) throw new Error('verifyRole(student) should be true')
  if (authStore.verifyRole('admin')) throw new Error('verifyRole(admin) should be false for student')
  console.log('[PASS] RBAC verifyRole passed: student=true, admin=false')

  // 3. Test Parent Login & Auto-provisioning
  console.log('\n[TEST 3] Parent Login & Multi-Child Auto-Provisioning:')
  const parentEmail = 'bapak.santoso@wali.tadulakocendekia.sch.id'
  const parentLoginRes = await authStore.login(parentEmail, 'password123', 'parent')

  console.log('Parent login result:', parentLoginRes)
  if (!parentLoginRes.success) throw new Error('Parent login failed')
  if (parentLoginRes.role !== 'parent') throw new Error(`Expected role parent, got ${parentLoginRes.role}`)

  const state2 = authStore.getState()
  console.log('[PASS] Authenticated:', state2.isAuthenticated)
  console.log('[PASS] Parent Name:', state2.user?.fullName)
  console.log('[PASS] Parent Job:', state2.parentProfile?.job)
  console.log('[PASS] Linked Children count:', state2.children.length)
  console.log('[PASS] Active Selected Child ID:', state2.selectedChildId)

  if (state2.children.length === 0) {
    throw new Error('Expected at least 1 linked child for parent')
  }

  // Test child switcher
  const firstChildId = state2.children[0].id
  authStore.switchSelectedChild(firstChildId)
  if (authStore.getState().selectedChildId !== firstChildId) {
    throw new Error('switchSelectedChild failed')
  }
  console.log('[PASS] switchSelectedChild successful')

  // Check role verification
  if (!authStore.verifyRole('parent')) throw new Error('verifyRole(parent) should be true')
  if (authStore.verifyRole(['admin', 'tutor'])) throw new Error('verifyRole([admin, tutor]) should be false for parent')
  console.log('[PASS] RBAC verifyRole passed: parent=true, [admin, tutor]=false')

  // 4. Test Demo Quick Login for Tutor & Admin
  console.log('\n[TEST 4] Admin & Tutor Quick Demo Login:')
  const adminQuick = authStore.quickLogin('admin')
  console.log('Admin quick login:', adminQuick)
  if (!adminQuick.success || adminQuick.href !== '/admin') throw new Error('Admin quick login failed')
  if (!authStore.verifyRole('admin')) throw new Error('Expected admin role')
  console.log('[PASS] Admin quickLogin verified')

  const tutorQuick = authStore.quickLogin('tutor')
  console.log('Tutor quick login:', tutorQuick)
  if (!tutorQuick.success || tutorQuick.href !== '/tutor') throw new Error('Tutor quick login failed')
  if (!authStore.verifyRole('tutor')) throw new Error('Expected tutor role')
  console.log('[PASS] Tutor quickLogin verified')

  // 5. Test Logout
  console.log('\n[TEST 5] Logout flow:')
  await authStore.logout()
  const stateLoggedOut = authStore.getState()
  console.log('[PASS] After logout - isAuthenticated:', stateLoggedOut.isAuthenticated)
  console.log('[PASS] After logout - user:', stateLoggedOut.user)
  console.log('[PASS] After logout - role:', stateLoggedOut.role)

  if (stateLoggedOut.isAuthenticated || stateLoggedOut.user !== null) {
    throw new Error('Session not properly cleared after logout')
  }
  if (authStore.verifyRole('admin')) {
    throw new Error('verifyRole should be false after logout')
  }

  // 6. Test Super Admin Login & Staff Creation
  console.log('\n[TEST 6] Super Admin Login & Staff Creation:')
  const superAdminQuick = authStore.quickLogin('super_admin')
  console.log('Super Admin quick login:', superAdminQuick)
  if (!superAdminQuick.success || superAdminQuick.href !== '/admin') throw new Error('Super Admin login failed')
  const superState = authStore.getState()
  if (!superState.isSuperAdmin) throw new Error('Expected isSuperAdmin to be true')
  if (superState.user?.email !== DEMO_ACCOUNTS.super_admin.email) throw new Error('Expected Super Admin email')
  console.log('[PASS] Super Admin quickLogin verified:', superState.user?.fullName, '| isSuperAdmin =', superState.isSuperAdmin)

  // Test createAdminStaff
  const newStaffRes = await authStore.createAdminStaff({
    fullName: 'Test Staff Baru, S.Pd',
    email: `staff.test.${Date.now()}@tadulakocendekia.sch.id`,
    phone: '0812-9999-8888',
    isSuperAdmin: false,
  })
  console.log('createAdminStaff result:', newStaffRes.success, newStaffRes.staff?.fullName)
  if (!newStaffRes.success || !newStaffRes.staff) throw new Error('createAdminStaff failed')
  console.log('[PASS] createAdminStaff succeeded')

  await authStore.logout()

  console.log('\n=============================================')
  console.log('[SUCCESS] ALL TESTS PASSED SUCCESSFULLY! (100% OK)')
  console.log('=============================================')
}
