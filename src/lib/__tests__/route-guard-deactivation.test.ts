import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { authStore } from '../auth-store'
import { adminStore } from '../admin-store'
import { validateRouteAccess, createRouteGuard } from '../route-guard'

describe('Route Guard — Pembatalan Sesi Otomatis Pengguna Nonaktif (Universal All Roles)', () => {
  beforeEach(() => {
    vi.stubGlobal('window', {})
    authStore.clearSession()
  })

  afterEach(() => {
    vi.unstubAllGlobals()
    vi.restoreAllMocks()
  })

  it('1. membatalkan sesi dan redirect ke /masuk?deactivated=true jika akun Tutor berstatus nonaktif', () => {
    // Daftarkan tutor ke store
    const tutor = adminStore.addTutor({
      name: 'Kak Dian Pratiwi, S.Si',
      email: 'dian.pratiwi@tadulakocendekia.sch.id',
      phone: '0852-9988-1122',
      education: 'S1 Fisika',
      subjects: ['Fisika'],
    })

    authStore.quickLogin('tutor')
    const state = authStore.getState()
    expect(state.isAuthenticated).toBe(true)
    expect(state.role).toBe('tutor')

    // Set status tutor menjadi nonaktif di adminStore
    adminStore.updateTutor(tutor.id, { status: 'nonaktif' })

    const check = validateRouteAccess('/tutor/jadwal', state, 'tutor')
    expect(check.allowed).toBe(false)
    expect(check.redirectTo).toContain('/masuk?deactivated=true')
    expect(check.shouldClearSession).toBe(true)

    // Cleanup: hapus tutor dari store
    adminStore.deleteTutor(tutor.id)
  })

  it('2. membatalkan sesi dan redirect ke /masuk?deactivated=true jika akun Siswa berstatus nonaktif', () => {
    const student = adminStore.addStudent({
      name: 'Fahri Ramadhan',
      email: 'fahri.ramadhan@siswa.tadulakocendekia.sch.id',
      phone: '0813-7788-9900',
      school: 'SMAN 1 Palu',
      packageCode: 'UTBK',
      classId: '',
      className: '',
      parentName: 'Orang Tua Fahri',
      parentPhone: '0813-1122-3344',
    })

    authStore.quickLogin('student')
    const state = authStore.getState()
    expect(state.isAuthenticated).toBe(true)
    expect(state.role).toBe('student')

    // Set status siswa menjadi nonaktif di adminStore
    adminStore.updateStudent(student.id, { status: 'nonaktif' })

    const check = validateRouteAccess('/student/jadwal', state, 'student')
    expect(check.allowed).toBe(false)
    expect(check.redirectTo).toContain('/masuk?deactivated=true')
    expect(check.shouldClearSession).toBe(true)

    // Cleanup
    adminStore.deleteStudent(student.id)
  })

  it('3. membatalkan sesi jika profil pengguna memiliki status nonaktif', () => {
    authStore.quickLogin('tutor')
    const state = {
      ...authStore.getState(),
      profile: {
        id: 'prof-test',
        email: 'tutor.test@tadulako.sch.id',
        full_name: 'Tutor Test',
        role: 'tutor' as const,
        status: 'nonaktif',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
    }

    const check = validateRouteAccess('/tutor', state, 'tutor')
    expect(check.allowed).toBe(false)
    expect(check.redirectTo).toContain('/masuk?deactivated=true')
    expect(check.shouldClearSession).toBe(true)
  })

  it('4. mengizinkan akses ke dashboard jika akun pengguna berstatus aktif', () => {
    const tutor = adminStore.addTutor({
      name: 'Kak Dian Pratiwi, S.Si',
      email: 'dian.pratiwi@tadulakocendekia.sch.id',
      phone: '0852-9988-1122',
      education: 'S1 Fisika',
      subjects: ['Fisika'],
    })

    authStore.quickLogin('tutor')
    const state = authStore.getState()

    const check = validateRouteAccess('/tutor/jadwal', state, 'tutor')
    expect(check.allowed).toBe(true)
    expect(check.redirectTo).toBeUndefined()

    // Cleanup
    adminStore.deleteTutor(tutor.id)
  })

  it('5. createRouteGuard membersihkan sesi dan melempar redirect saat akun dinonaktifkan', async () => {
    const tutor = adminStore.addTutor({
      name: 'Kak Dian Pratiwi, S.Si',
      email: 'dian.pratiwi@tadulakocendekia.sch.id',
      phone: '0852-9988-1122',
      education: 'S1 Fisika',
      subjects: ['Fisika'],
    })

    authStore.quickLogin('tutor')
    adminStore.updateTutor(tutor.id, { status: 'nonaktif' })

    const clearSessionSpy = vi.spyOn(authStore, 'clearSession')
    const guard = createRouteGuard('tutor')

    let caughtRedirect: any = null
    try {
      await guard({ location: { pathname: '/tutor/jadwal', href: '/tutor/jadwal' } })
    } catch (err) {
      caughtRedirect = err
    }

    expect(clearSessionSpy).toHaveBeenCalled()
    expect(caughtRedirect).toBeDefined()
    expect(authStore.getState().isAuthenticated).toBe(false)

    // Cleanup
    adminStore.deleteTutor(tutor.id)
  })
})
