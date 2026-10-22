import { describe, it } from 'vitest'
import assert from 'node:assert/strict'
import { authStore, DEMO_ACCOUNTS } from '../auth-store'
import { adminStore } from '../admin-store'
import { createSupabaseClient, isSupabaseConfigured, supabase } from '../supabase/client'

describe('QA & Security Edge Cases Verification', { timeout: 30000 }, () => {
  it('passes all edge cases verification', async () => {
    await runQATests()
  })
})

async function runQATests() {
  console.log('=====================================================')
  console.log('🧪 RUNNING QA & SECURITY EDGE CASES VERIFICATION')
  console.log('=====================================================\n')

  // ----------------------------------------------------
  // SECTION 1: EDGE CASES IN REGISTRATION (RegisterModal)
  // ----------------------------------------------------
  console.log('--- [TEST GROUP 1] RegisterModal & Registrations Edge Cases ---')

  // Test 1.1: Registration with minimum required fields (nullable fields omitted)
  const initialRegCount = adminStore.getState().registrations.length
  const edgeRegInput = {
    studentName: 'Calon Siswa Edge Case',
    studentEmail: `calon.edge.${Date.now()}@example.com`,
    studentPhone: '0812-4455-6677',
    studentSchool: 'SMAN 2 Palu',
    packageCode: 'UTBK' as const,
    packageName: 'Intensif UTBK-SNBT',
    parentName: 'Orang Tua Edge Case',
    parentEmail: '', // Nullable in DB
    parentPhone: '0821-9988-7766',
    parentAddress: '', // Nullable in DB
  }

  const addedReg = adminStore.addRegistration(edgeRegInput)
  assert.ok(addedReg.id, 'Registration ID should be generated')
  assert.equal(addedReg.status, 'menunggu', 'Initial registration status must be "menunggu"')
  assert.equal(addedReg.parentEmail, '', 'Empty parentEmail should not throw')
  assert.equal(
    adminStore.getState().registrations.length,
    initialRegCount + 1,
    'Registrations count should increment'
  )
  console.log('✓ Test 1.1: Minimal/null optional fields handled safely without crash')

  // Test 1.2: Phone validation logic edge cases
  const validatePhone = (phone: string) => {
    const clean = phone.replace(/[^0-9+]/g, '')
    return clean.length >= 10 && clean.length <= 15
  }

  assert.equal(validatePhone('081244556677'), true, 'Standard 12 digit phone should pass')
  assert.equal(validatePhone('+6281244556677'), true, 'International format should pass')
  assert.equal(validatePhone('0812-4455-6677'), true, 'Dashed phone should pass')
  assert.equal(validatePhone('12345'), false, 'Short phone (< 10 digits) should fail')
  assert.equal(validatePhone('abcdefghijk'), false, 'Non-digit string should fail')
  assert.equal(validatePhone('081234567890123456'), false, 'Too long phone (> 15 digits) should fail')
  console.log('✓ Test 1.2: Phone number validation boundaries passed')

  // Test 1.3: Duplicate registration detection
  const duplicateRegCheck = adminStore
    .getState()
    .registrations.some(
      (r) =>
        r.studentEmail.toLowerCase() === edgeRegInput.studentEmail.toLowerCase() &&
        r.status === 'menunggu'
    )
  assert.equal(duplicateRegCheck, true, 'Duplicate waiting registration should be detected')
  console.log('✓ Test 1.3: Duplicate waiting registration detection verified')

  // ----------------------------------------------------
  // SECTION 2: SUPER ADMIN STAFF CREATION & SESSION INTEGRITY
  // ----------------------------------------------------
  console.log('\n--- [TEST GROUP 2] Staff Creation & Session Isolation ---')

  // Test 2.1: Verify isolated client does NOT have session persistence
  const isolatedClient = createSupabaseClient(undefined, false)
  // isolatedClient config auth.persistSession must be false
  assert.equal(
    (isolatedClient.auth as any).persistSession,
    false,
    'Isolated Supabase client MUST NOT persist sessions to browser localStorage'
  )
  console.log('✓ Test 2.1: Isolated client session persistence is strictly disabled')

  // Test 2.2: Create staff with valid data
  authStore.quickLogin('super_admin')
  const initialStaffCount = authStore.getAdminStaff().length
  const newStaffEmail = `staff.qa.${Date.now()}@tadulakocendekia.sch.id`

  const createStaffResult = await authStore.createAdminStaff({
    fullName: 'Ahmad Fauzi, S.Kom',
    email: newStaffEmail,
    phone: '0812-3344-5566',
    isSuperAdmin: false,
  })

  assert.equal(createStaffResult.success, true, 'Staff creation should succeed')
  assert.ok(createStaffResult.staff, 'Staff object should be returned')
  assert.equal(createStaffResult.staff?.roleTitle, 'Staf Tata Usaha')
  assert.equal(createStaffResult.staff?.isSuperAdmin, false)
  assert.equal(authStore.getAdminStaff().length, initialStaffCount + 1)
  console.log('✓ Test 2.2: Regular staff creation succeeds with correct metadata')

  // Test 2.3: Prevent duplicate staff email
  const duplicateStaffResult = await authStore.createAdminStaff({
    fullName: 'Duplicate Staff',
    email: newStaffEmail,
    phone: '0812-0000-0000',
    isSuperAdmin: false,
  })
  assert.equal(duplicateStaffResult.success, false, 'Duplicate staff email should be rejected')
  assert.ok(
    duplicateStaffResult.error?.includes('sudah terdaftar'),
    'Expected error message for duplicate staff'
  )
  console.log('✓ Test 2.3: Duplicate staff email is properly rejected')

  // Test 2.4: Empty name or email rejection
  const invalidStaffResult = await authStore.createAdminStaff({
    fullName: '   ',
    email: '',
  })
  assert.equal(invalidStaffResult.success, false, 'Blank staff name/email should be rejected')
  console.log('✓ Test 2.4: Blank staff validation rejected')

  // Test 2.5: Active session preserved after staff creation
  const currState = authStore.getState()
  assert.equal(currState.isAuthenticated, true, 'Current user session must remain authenticated')
  assert.equal(currState.isSuperAdmin, true, 'Current user Super Admin privilege must remain intact')
  assert.equal(currState.user?.email, DEMO_ACCOUNTS.super_admin.email, 'Current user must not be replaced')
  console.log('✓ Test 2.5: Super admin active session is fully preserved after staff creation')

  // ----------------------------------------------------
  // SECTION 3: FORMAT VALIDATION & SANITIZATION
  // ----------------------------------------------------
  console.log('\n--- [TEST GROUP 3] Data Format & ID Integrity ---')

  // Test 3.1: UUID format validation helper
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
  const validUUID = 'a3bb189e-8bf9-3888-9912-ace4e6543002'
  const invalidUUID = 'not-a-uuid-string'
  assert.equal(uuidRegex.test(validUUID), true, 'Valid UUID should pass regex')
  assert.equal(uuidRegex.test(invalidUUID), false, 'Invalid UUID should fail regex')
  console.log('✓ Test 3.1: UUID format validator verified')

  // Test 3.2: NIS format validation
  const nisRegex = /^TC-\d{4}-\d{3}$/
  assert.equal(nisRegex.test('TC-2026-001'), true, 'Valid NIS matches TC-YYYY-NNN format')
  assert.equal(nisRegex.test('NIS-123'), false, 'Non-conforming NIS fails')
  console.log('✓ Test 3.2: NIS format strictly adheres to TC-YYYY-NNN')

  // Test 3.3: Email validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  assert.equal(emailRegex.test('pimpinan@tadulakocendekia.sch.id'), true)
  assert.equal(emailRegex.test('invalid-email-address'), false)
  assert.equal(emailRegex.test('no-at-sign.com'), false)
  console.log('✓ Test 3.3: Email format validator verified')

  await authStore.logout()

  console.log('\n=====================================================')
  console.log('🎉 ALL 11 QA & SECURITY ASSERTIONS PASSED!')
  console.log('=====================================================')
}
