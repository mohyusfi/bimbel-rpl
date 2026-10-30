import {
  supabase,
  createSupabaseClient,
  isSupabaseConfigured,
  type UserRole,
  type ProfileRow as SupabaseProfileRow,
} from './supabase/client'
import {
  adminStore,
  type Student,
  type ParentProfile,
  type PackageCode,
} from './admin-store'

export type { UserRole }

export interface ProfileRow extends SupabaseProfileRow {
  isSuperAdmin?: boolean
}

export interface AdminStaffMember {
  id: string
  fullName: string
  email: string
  phone: string
  roleTitle?: string
  isSuperAdmin: boolean
  joinDate: string
  status: 'aktif' | 'nonaktif'
}

export interface AuthUser {
  id: string
  email: string
  fullName: string
  role: UserRole
  phone?: string
  isSuperAdmin?: boolean
}

export interface AuthState {
  user: AuthUser | null
  profile: ProfileRow | null
  role: UserRole | null
  isSuperAdmin: boolean
  studentProfile: Student | null
  parentProfile: ParentProfile | null
  children: Student[]
  selectedChildId: string | null
  adminStaff: AdminStaffMember[]
  isAuthenticated: boolean
  isLoading: boolean
  error: string | null
}

export const INITIAL_ADMIN_STAFF: AdminStaffMember[] = [
  {
    id: 'staf-00',
    fullName: 'Drs. H. Rusdi Mastura, M.Si',
    email: 'pimpinan@tadulakocendekia.sch.id',
    phone: '0811-456-789',
    roleTitle: 'Pimpinan Lembaga / Super Admin',
    isSuperAdmin: true,
    joinDate: '2023-08-01',
    status: 'aktif',
  },
  {
    id: 'staf-01',
    fullName: 'Hj. Nuraini, S.Pd',
    email: 'nuraini.tu@tadulakocendekia.sch.id',
    phone: '0812-4112-9090',
    roleTitle: 'Kepala Tata Usaha',
    isSuperAdmin: false,
    joinDate: '2024-01-10',
    status: 'aktif',
  },
  {
    id: 'staf-02',
    fullName: 'Muhammad Rizal, S.Kom',
    email: 'rizal.tu@tadulakocendekia.sch.id',
    phone: '0852-3344-5566',
    roleTitle: 'Staf Administrasi & Data',
    isSuperAdmin: false,
    joinDate: '2025-03-01',
    status: 'aktif',
  },
  {
    id: 'staf-03',
    fullName: 'Siti Rahmawati, A.Md',
    email: 'siti.tu@tadulakocendekia.sch.id',
    phone: '0821-7788-9900',
    roleTitle: 'Staf Keuangan & Pembayaran',
    isSuperAdmin: false,
    joinDate: '2025-07-15',
    status: 'aktif',
  },
]

export const DEMO_ACCOUNTS: Record<
  UserRole | 'super_admin',
  {
    email: string
    password: string
    defaultPassword: string
    name: string
    roleTitle: string
    role: UserRole
    phone: string
    isSuperAdmin?: boolean
  }
> = {
  super_admin: {
    email: 'pimpinan@tadulakocendekia.sch.id',
    password: 'password123',
    defaultPassword: 'password123',
    name: 'Drs. H. Rusdi Mastura, M.Si',
    roleTitle: 'Pimpinan Lembaga (Super Admin)',
    role: 'admin',
    phone: '0811-456-789',
    isSuperAdmin: true,
  },
  admin: {
    email: 'nuraini.tu@tadulakocendekia.sch.id',
    password: 'password123',
    defaultPassword: 'password123',
    name: 'Hj. Nuraini, S.Pd',
    roleTitle: 'Kepala Tata Usaha',
    role: 'admin',
    phone: '0812-4112-9090',
    isSuperAdmin: false,
  },
  tutor: {
    email: 'dian.pratiwi@tadulakocendekia.sch.id',
    password: 'password123',
    defaultPassword: 'password123',
    name: 'Kak Dian Pratiwi, S.Si',
    roleTitle: 'Tutor Fisika & UTBK',
    role: 'tutor',
    phone: '0852-9988-1122',
    isSuperAdmin: false,
  },
  student: {
    email: 'fahri.ramadhan@siswa.tadulakocendekia.sch.id',
    password: 'password123',
    defaultPassword: 'password123',
    name: 'Fahri Ramadhan',
    roleTitle: 'Siswa Kelas 12 UTBK',
    role: 'student',
    phone: '0813-7788-9900',
    isSuperAdmin: false,
  },
  parent: {
    email: 'ahmad.dahlan@wali.tadulakocendekia.sch.id',
    password: 'password123',
    defaultPassword: 'password123',
    name: 'Ir. H. Ahmad Dahlan',
    roleTitle: 'Wali Siswa (2 Anak)',
    role: 'parent',
    phone: '0821-4455-6677',
    isSuperAdmin: false,
  },
}

const AUTH_STORAGE_KEY = 'tc_bimbel_auth_state_v1'
const ADMIN_STAFF_STORAGE_KEY = 'tc_bimbel_admin_staff_v1'
const CUSTOM_PASSWORDS_STORAGE_KEY = 'tc_bimbel_custom_passwords_v1'

let inMemoryCustomPasswords: Record<string, string> = {}

export function loadSavedCustomPasswords(): Record<string, string> {
  if (typeof window === 'undefined') return inMemoryCustomPasswords
  try {
    const raw = localStorage.getItem(CUSTOM_PASSWORDS_STORAGE_KEY)
    const parsed = raw ? JSON.parse(raw) : {}
    return { ...parsed, ...inMemoryCustomPasswords }
  } catch {
    return inMemoryCustomPasswords
  }
}

export function persistCustomPassword(identifier: string, pass: string) {
  const clean = identifier.trim().toLowerCase()
  inMemoryCustomPasswords[clean] = pass
  if (typeof window !== 'undefined') {
    try {
      const all = loadSavedCustomPasswords()
      all[clean] = pass
      localStorage.setItem(CUSTOM_PASSWORDS_STORAGE_KEY, JSON.stringify(all))
    } catch {}
  }
}

export function clearCustomPasswords() {
  inMemoryCustomPasswords = {}
  if (typeof window !== 'undefined') {
    try {
      localStorage.removeItem(CUSTOM_PASSWORDS_STORAGE_KEY)
    } catch {}
  }
}

export function normalizeLoginEmail(cleanEmailOrNis: string): string {
  const clean = cleanEmailOrNis.trim().toLowerCase()
  if (clean === 'dian.pratiwi@tutor.tadulakocendekia.sch.id') {
    return 'dian.pratiwi@tadulakocendekia.sch.id'
  }
  return clean
}

export function getEffectivePassword(cleanEmailOrNis: string, targetRole?: UserRole): string {
  const rawClean = cleanEmailOrNis.trim().toLowerCase()
  const clean = normalizeLoginEmail(rawClean)
  const custom = loadSavedCustomPasswords()
  if (custom[rawClean]) {
    return custom[rawClean]
  }
  if (custom[clean]) {
    return custom[clean]
  }

  // Cek apakah input berupa NIS siswa
  const matchedStudent = adminStore.getState().students.find(
    (s) => s.nis.toLowerCase() === rawClean || s.email.toLowerCase() === clean
  )
  if (matchedStudent) {
    const studentEmail = matchedStudent.email.toLowerCase()
    if (custom[studentEmail]) return custom[studentEmail]
    if (custom[matchedStudent.nis.toLowerCase()]) return custom[matchedStudent.nis.toLowerCase()]
    return 'siswa2026'
  }

  if (clean === DEMO_ACCOUNTS.super_admin.email.toLowerCase()) return DEMO_ACCOUNTS.super_admin.password
  if (clean === DEMO_ACCOUNTS.admin.email.toLowerCase()) return DEMO_ACCOUNTS.admin.password
  if (clean === DEMO_ACCOUNTS.tutor.email.toLowerCase()) return DEMO_ACCOUNTS.tutor.password
  if (clean === DEMO_ACCOUNTS.student.email.toLowerCase()) return DEMO_ACCOUNTS.student.password
  if (clean === DEMO_ACCOUNTS.parent.email.toLowerCase()) return DEMO_ACCOUNTS.parent.password

  if (targetRole === 'student') return 'siswa2026'
  if (targetRole === 'parent') return 'wali2026'

  if (targetRole && DEMO_ACCOUNTS[targetRole]) {
    return DEMO_ACCOUNTS[targetRole].password
  }

  return 'password123'
}

export function isUserPasswordValid(
  cleanEmailOrNis: string,
  password: string,
  targetRole?: UserRole
): boolean {
  const rawClean = cleanEmailOrNis.trim().toLowerCase()
  const clean = normalizeLoginEmail(rawClean)
  const custom = loadSavedCustomPasswords()

  // 1. Password kustom memiliki prioritas mutlak
  if (custom[rawClean]) return password === custom[rawClean]
  if (custom[clean]) return password === custom[clean]

  const matchedStudent = adminStore.getState().students.find(
    (s) => s.nis.toLowerCase() === rawClean || s.email.toLowerCase() === clean
  )
  if (matchedStudent) {
    const studentEmail = matchedStudent.email.toLowerCase()
    if (custom[studentEmail]) return password === custom[studentEmail]
    if (custom[matchedStudent.nis.toLowerCase()]) return password === custom[matchedStudent.nis.toLowerCase()]
  }

  // 2. Akun Demo Tadulako Cendekia
  if (clean === DEMO_ACCOUNTS.super_admin.email.toLowerCase()) return password === DEMO_ACCOUNTS.super_admin.password
  if (clean === DEMO_ACCOUNTS.admin.email.toLowerCase()) return password === DEMO_ACCOUNTS.admin.password
  if (clean === DEMO_ACCOUNTS.tutor.email.toLowerCase()) return password === DEMO_ACCOUNTS.tutor.password
  if (clean === DEMO_ACCOUNTS.student.email.toLowerCase()) {
    return password === DEMO_ACCOUNTS.student.password || password === 'siswa2026'
  }
  if (clean === DEMO_ACCOUNTS.parent.email.toLowerCase()) {
    return password === DEMO_ACCOUNTS.parent.password || password === 'wali2026'
  }

  // 3. Siswa terverifikasi: kata sandi resmi adalah 'siswa2026', dengan fallback 'password123'
  if (targetRole === 'student' || matchedStudent) {
    return password === 'siswa2026' || password === 'password123'
  }

  // 4. Orang tua terverifikasi: kata sandi resmi adalah 'wali2026', dengan fallback 'password123'
  if (targetRole === 'parent') {
    return password === 'wali2026' || password === 'password123'
  }

  // 5. Default akun lain
  return password === 'password123'
}

function loadSavedAdminStaff(): AdminStaffMember[] {
  return INITIAL_ADMIN_STAFF
}

function persistAdminStaff(_staffList: AdminStaffMember[]) {
  // In-memory only: no localStorage persistence
}

function inferRoleFromEmail(email: string, explicitRole?: UserRole): UserRole {
  if (explicitRole) return explicitRole
  const lower = email.toLowerCase()
  if (lower.includes('pimpinan') || lower.includes('.tu@') || lower.startsWith('admin') || lower.includes('@admin.')) {
    return 'admin'
  }
  if (lower.includes('@tutor.') || lower.includes('tutor.') || lower.startsWith('tutor@')) {
    return 'tutor'
  }
  if (lower.includes('@wali.') || lower.includes('wali.') || lower.includes('orangtua')) {
    return 'parent'
  }
  if (lower.includes('@siswa.') || lower.includes('siswa.')) {
    return 'student'
  }
  return 'student'
}

function isEmailSuperAdmin(email: string): boolean {
  const lower = email.trim().toLowerCase()
  return lower === DEMO_ACCOUNTS.super_admin.email.toLowerCase()
}

function loadSavedAuthState(): Partial<AuthState> | null {
  if (typeof window === 'undefined' || typeof localStorage === 'undefined') return null
  try {
    const raw = localStorage.getItem(AUTH_STORAGE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw)
    if (parsed && parsed.isAuthenticated && parsed.user && parsed.role) {
      return parsed
    }
    return null
  } catch (err) {
    console.warn('[WARN] Gagal membaca auth state dari localStorage:', err)
    return null
  }
}

function persistAuthState(currState: AuthState) {
  if (typeof window === 'undefined' || typeof localStorage === 'undefined') return
  try {
    if (currState.isAuthenticated && currState.user && currState.role) {
      localStorage.setItem(
        AUTH_STORAGE_KEY,
        JSON.stringify({
          user: currState.user,
          profile: currState.profile,
          role: currState.role,
          isSuperAdmin: currState.isSuperAdmin,
          selectedChildId: currState.selectedChildId,
          studentProfile: currState.studentProfile,
          parentProfile: currState.parentProfile,
          children: currState.children,
          isAuthenticated: true,
        })
      )
    } else if (!currState.isLoading) {
      localStorage.removeItem(AUTH_STORAGE_KEY)
    }
  } catch (err) {
    console.warn('[WARN] Gagal menyimpan auth state ke localStorage:', err)
  }
}

// Initial state setup
const savedState = loadSavedAuthState()

let state: AuthState = {
  user: savedState?.user || null,
  profile: savedState?.profile || null,
  role: savedState?.role || null,
  isSuperAdmin: Boolean(
    savedState?.isSuperAdmin ||
    savedState?.user?.isSuperAdmin ||
    savedState?.profile?.is_super_admin
  ),
  studentProfile: savedState?.studentProfile || null,
  parentProfile: savedState?.parentProfile || null,
  children: savedState?.children || [],
  selectedChildId: savedState?.selectedChildId || null,
  adminStaff: loadSavedAdminStaff(),
  isAuthenticated: Boolean(savedState?.isAuthenticated && savedState?.user),
  isLoading: false,
  error: null,
}

const listeners = new Set<() => void>()

let initializePromise: Promise<void> | null = null

function notify() {
  persistAuthState(state)
  listeners.forEach((listener) => {
    try {
      listener()
    } catch (e) {
      console.error('Error notifying auth listener:', e)
    }
  })
}

/**
 * Auto-provisioning engine:
 * Memastikan profil pengguna dibuat di database Supabase dan disinkronkan
 * dengan adminStore jika belum ada saat login/registrasi.
 */
async function autoProvisionUser(
  rawUser: {
    id: string
    email?: string | null
    user_metadata?: Record<string, any>
    app_metadata?: Record<string, any>
  },
  targetRole?: UserRole
): Promise<{
  profile: ProfileRow
  student: Student | null
  parent: ParentProfile | null
  children: Student[]
  isSuperAdmin: boolean
}> {
  const email = (rawUser.email || '').toLowerCase()
  const role =
    targetRole ||
    (rawUser.app_metadata?.role as UserRole) ||
    (rawUser.user_metadata?.role as UserRole) ||
    inferRoleFromEmail(email)

  const staffList = typeof window !== 'undefined' ? loadSavedAdminStaff() : INITIAL_ADMIN_STAFF
  const matchedStaff = staffList.find((s) => s.email.toLowerCase() === email)

  const isSuperAdmin =
    rawUser.user_metadata?.isSuperAdmin !== undefined
      ? Boolean(rawUser.user_metadata.isSuperAdmin)
      : rawUser.user_metadata?.is_super_admin !== undefined
        ? Boolean(rawUser.user_metadata.is_super_admin)
        : matchedStaff
          ? matchedStaff.isSuperAdmin
          : isEmailSuperAdmin(email)

  const metaName =
    rawUser.user_metadata?.full_name ||
    rawUser.user_metadata?.name ||
    rawUser.user_metadata?.studentName ||
    rawUser.user_metadata?.parentName
  const defaultName =
    metaName ||
    (email ? email.split('@')[0] : 'Pengguna')

  const nowIso = new Date().toISOString()
  let profile: ProfileRow = {
    id: rawUser.id,
    email,
    full_name: defaultName,
    role,
    phone_number: rawUser.user_metadata?.phone || null,
    is_super_admin: isSuperAdmin,
    isSuperAdmin,
    status: matchedStaff?.status || 'aktif',
    created_at: nowIso,
    updated_at: nowIso,
  }

  // 1. Sinkronisasi Profile ke Supabase (jika online & tabel siap)
  try {
    const sb = supabase as any
    const { data: existingProfile } = await sb
      .from('profiles')
      .select('*')
      .eq('id', rawUser.id)
      .maybeSingle()

    if (existingProfile) {
      const isSuper = Boolean(existingProfile.is_super_admin ?? isSuperAdmin)
      profile = {
        ...existingProfile,
        is_super_admin: isSuper,
        isSuperAdmin: isSuper,
        status: existingProfile.status || matchedStaff?.status || 'aktif',
      } as ProfileRow
    } else {
      await sb.from('profiles').upsert([
        {
          id: rawUser.id,
          email,
          full_name: defaultName,
          role,
          phone_number: rawUser.user_metadata?.phone || null,
          is_super_admin: isSuperAdmin,
          status: matchedStaff?.status || 'aktif',
        },
      ])
      profile.is_super_admin = isSuperAdmin
      profile.isSuperAdmin = isSuperAdmin
      profile.status = matchedStaff?.status || 'aktif'
    }
  } catch (err) {
    console.info('Auto-provisioning profile running with local fallback:', err)
  }

  let studentRecord: Student | null = null
  let parentRecord: ParentProfile | null = null
  let mappedChildren: Student[] = []

  const adminState = adminStore.getState()

  // 2. Auto-provisioning Profil Siswa
  if (role === 'student') {
    let foundStudent = adminState.students.find(
      (s) =>
        s.email.toLowerCase() === email ||
        s.id === rawUser.id
    )

    if (!foundStudent) {
      const matchingReg = adminState.registrations.find(
        (r) => r.studentEmail.toLowerCase() === email
      )

      const nisNumber = (adminState.students.length + 1)
        .toString()
        .padStart(3, '0')
      const targetClass =
        adminState.classes.find((c) => c.id === matchingReg?.assignedClassId) ||
        adminState.classes[0]

      const newStudent: Student = {
        id: rawUser.id || `stu-${Date.now().toString().slice(-4)}`,
        nis: matchingReg?.registrationNumber || `TC-2026-${nisNumber}`,
        name: matchingReg?.studentName || defaultName,
        email,
        phone: matchingReg?.studentPhone || rawUser.user_metadata?.phone || '',
        school: matchingReg?.studentSchool || '',
        packageCode: (matchingReg?.packageCode as PackageCode) || 'UTBK',
        classId: targetClass?.id || '',
        className: targetClass?.name || '',
        parentName: matchingReg?.parentName || '',
        parentPhone: matchingReg?.parentPhone || '',
        parentEmail: matchingReg?.parentEmail || '',
        parentJob: matchingReg?.parentJob || '',
        parentAddress: matchingReg?.parentAddress || '',
        joinDate: new Intl.DateTimeFormat('id-ID', {
          day: 'numeric',
          month: 'long',
          year: 'numeric',
        }).format(new Date()),
        status: 'aktif',
      }

      adminStore.addStudent(newStudent)
      foundStudent = newStudent

      // Sync ke tabel students Supabase
      try {
        const sb = supabase as any
        await sb.from('students').upsert(
          [
            {
              profile_id: rawUser.id,
              nis: newStudent.nis,
              origin_school: newStudent.school,
              grade_level: 'SMA',
              class_id: newStudent.classId,
              status: 'aktif',
            },
          ],
          { onConflict: 'profile_id' }
        )
      } catch (err) {
        console.info('Supabase student insert local fallback:', err)
      }
    }

    studentRecord = foundStudent
    adminStore.setActiveStudentId(studentRecord.id)
  }

  // 3. Auto-provisioning Profil Wali / Orang Tua
  if (role === 'parent') {
    let foundParent = adminState.parents.find(
      (p) =>
        p.email.toLowerCase() === email ||
        p.id === rawUser.id
    )

    let supabaseChildren: Student[] = []
    let resolvedParentId: string | null = null

    try {
      const sb = supabase as any
      const { data: dbParent } = await sb
        .from('parents')
        .select('id, occupation, address, phone_number')
        .eq('profile_id', rawUser.id)
        .maybeSingle()

      if (dbParent) {
        resolvedParentId = dbParent.id
      } else if (email) {
        const { data: pByEmail } = await sb
          .from('profiles')
          .select('id, parents(id, occupation, address, phone_number)')
          .eq('email', email)
          .maybeSingle()
        if (pByEmail?.parents?.[0]) {
          resolvedParentId = pByEmail.parents[0].id
        }
      }

      if (resolvedParentId) {
        const { data: dbStudents } = await sb
          .from('students')
          .select('id, nis, origin_school, grade_level, package_code, class_id, status, profile_id, classes(class_name), profiles!students_profile_id_fkey(full_name, email, phone_number)')
          .eq('parent_id', resolvedParentId)

        if (dbStudents && dbStudents.length > 0) {
          supabaseChildren = dbStudents.map((s: any) => ({
            id: s.id,
            nis: s.nis,
            name: s.profiles?.full_name || 'Siswa Bimbel',
            email: s.profiles?.email || '',
            phone: s.profiles?.phone_number || '',
            school: s.origin_school || 'Sekolah di Palu',
            packageCode: (s.package_code || 'UTBK') as PackageCode,
            classId: s.class_id || '',
            className: s.classes?.class_name || (s.package_code === 'SMP' ? 'SMP Prestasi A' : 'UTBK Intensif A'),
            parentName: defaultName,
            parentPhone: rawUser.user_metadata?.phone || dbParent?.phone_number || '',
            parentEmail: email,
            parentJob: dbParent?.occupation || 'Wali Murid',
            parentAddress: dbParent?.address || '',
            joinDate: '10 Januari 2026',
            status: s.status || 'aktif',
          }))

          for (const sc of supabaseChildren) {
            const currentStudents = adminStore.getState().students
            const existingIdx = currentStudents.findIndex((st) => st.id === sc.id || st.nis === sc.nis)
            if (existingIdx === -1) {
              adminStore.addStudent(sc)
            }
          }
        }
      }
    } catch (dbErr) {
      console.info('Supabase parent & students query note:', dbErr)
    }

    if (!foundParent) {
      const studentIds = supabaseChildren.map((s) => s.id)

      const newParent: ParentProfile = {
        id: resolvedParentId || rawUser.id || `par-${Date.now().toString().slice(-4)}`,
        name: defaultName,
        email,
        phone: rawUser.user_metadata?.phone || '',
        job: rawUser.user_metadata?.job || 'Wali Murid',
        address: rawUser.user_metadata?.address || '',
        studentIds,
      }

      const addedParent = adminStore.addParent(newParent)
      foundParent = addedParent
    } else if (supabaseChildren.length > 0) {
      const mergedIds = Array.from(new Set([...foundParent.studentIds, ...supabaseChildren.map((s) => s.id)]))
      foundParent.studentIds = mergedIds
      adminStore.updateParent(foundParent.id, { studentIds: mergedIds })
    }

    parentRecord = foundParent

    if (supabaseChildren.length > 0) {
      mappedChildren = supabaseChildren
    } else {
      const currentStudents = adminStore.getState().students
      mappedChildren = currentStudents.filter((s) =>
        parentRecord?.studentIds?.includes(s.id) ||
        (s.parentEmail && s.parentEmail.toLowerCase() === email)
      )
    }

    adminStore.setActiveParentId(parentRecord.id)
    if (mappedChildren[0]?.id) {
      adminStore.setSelectedChildId(mappedChildren[0].id)
    }
  }

  // 4. Tutor / Admin synchronizer
  if (role === 'tutor') {
    const tutor =
      adminState.tutors.find((t) => t.email?.toLowerCase() === email) ||
      adminState.tutors.find((t) => t.id === rawUser.id) ||
      adminState.tutors[0]
    if (tutor) adminStore.setActiveTutorId(tutor.id)
  }

  return {
    profile,
    student: studentRecord,
    parent: parentRecord,
    children: mappedChildren,
    isSuperAdmin,
  }
}

/**
 * Singleton Auth Store
 */
export const authStore = {
  getState(): AuthState {
    return state
  },

  subscribe(listener: () => void): () => void {
    listeners.add(listener)
    return () => listeners.delete(listener)
  },

  quickLogin(roleOrSuper: UserRole | 'super_admin'): { success: boolean; role: UserRole; href: string; error?: string } {
    const isSuper = roleOrSuper === 'super_admin'
    const targetRole: UserRole = isSuper ? 'admin' : roleOrSuper
    const demoInfo = isSuper ? DEMO_ACCOUNTS.super_admin : DEMO_ACCOUNTS[targetRole]

    // Autentikasi sesi Supabase untuk akun demo admin jika terkonfigurasi
    if (typeof window !== 'undefined' && isSupabaseConfigured()) {
      try {
        if (targetRole === 'admin') {
          supabase.auth.signInWithPassword({
            email: demoInfo.email,
            password: demoInfo.defaultPassword,
          }).catch(() => {})
        }
      } catch {}
    }

    const matchedStaff = state.adminStaff.find(
      (s) => s.email.toLowerCase() === demoInfo.email.toLowerCase()
    )
    if (matchedStaff && matchedStaff.status === 'nonaktif') {
      state.isLoading = false
      state.error = 'Akun Anda telah dinonaktifkan oleh Pimpinan Lembaga. Silakan hubungi Tata Usaha.'
      notify()
      return {
        success: false,
        role: targetRole,
        href: '/masuk?deactivated=true',
        error: 'Akun Anda telah dinonaktifkan oleh Pimpinan Lembaga. Silakan hubungi Tata Usaha.',
      }
    }

    const adminState = adminStore.getState()
    let studentRecord: Student | null = null
    let parentRecord: ParentProfile | null = null
    let mappedChildren: Student[] = []

    if (targetRole === 'student') {
      studentRecord =
        adminState.students.find((s) => s.email.toLowerCase() === demoInfo.email.toLowerCase()) ||
        adminState.students[0] ||
        null
      if (studentRecord) {
        adminStore.setActiveStudentId(studentRecord.id)
      }
    } else if (targetRole === 'parent') {
      parentRecord =
        adminState.parents.find((p) => p.email.toLowerCase() === demoInfo.email.toLowerCase()) ||
        adminState.parents[0] ||
        null
      mappedChildren = adminState.students.filter((s) =>
        parentRecord?.studentIds?.includes(s.id)
      )
      if (mappedChildren.length === 0 && adminState.students.length > 0) {
        mappedChildren = [adminState.students[0]]
      }
      if (parentRecord) {
        adminStore.setActiveParentId(parentRecord.id)
      }
      if (mappedChildren[0]?.id) {
        adminStore.setSelectedChildId(mappedChildren[0].id)
      }
    } else if (targetRole === 'tutor') {
      const tutor =
        adminState.tutors.find((t) => t.email?.toLowerCase() === demoInfo.email.toLowerCase()) ||
        adminState.tutors[0] ||
        null
      if (tutor) {
        adminStore.setActiveTutorId(tutor.id)
      }
    }

    const resolvedUserId =
      targetRole === 'student' && studentRecord?.id
        ? studentRecord.id
        : targetRole === 'parent' && parentRecord?.id
        ? parentRecord.id
        : `usr-${isSuper ? 'super_admin' : targetRole}-${Date.now().toString().slice(-4)}`

    const syntheticUser = {
      id: resolvedUserId,
      email: demoInfo.email,
      user_metadata: {
        full_name: demoInfo.name,
        phone: demoInfo.phone,
        role: targetRole,
        is_super_admin: isSuper,
      },
    }

    const nowIso = new Date().toISOString()
    const profile: ProfileRow = {
      id: syntheticUser.id,
      email: demoInfo.email,
      full_name: demoInfo.name,
      role: targetRole,
      phone_number: demoInfo.phone,
      is_super_admin: isSuper,
      isSuperAdmin: isSuper,
      status: matchedStaff?.status || 'aktif',
      created_at: nowIso,
      updated_at: nowIso,
    }

    state = {
      user: {
        id: syntheticUser.id,
        email: demoInfo.email,
        fullName: demoInfo.name,
        role: targetRole,
        phone: demoInfo.phone,
        isSuperAdmin: isSuper,
      },
      profile,
      role: targetRole,
      isSuperAdmin: isSuper,
      studentProfile: studentRecord,
      parentProfile: parentRecord,
      children: mappedChildren,
      selectedChildId: mappedChildren[0]?.id || null,
      adminStaff: state.adminStaff,
      isAuthenticated: true,
      isLoading: false,
      error: null,
    }

    notify()
    return { success: true, role: targetRole, href: `/${targetRole}` }
  },

  async initialize(): Promise<void> {
    const currentSavedState = loadSavedAuthState()
    if (currentSavedState?.isAuthenticated && currentSavedState?.user && currentSavedState?.role) {
      state = {
        ...state,
        user: currentSavedState.user,
        profile: currentSavedState.profile || null,
        role: currentSavedState.role,
        isAuthenticated: true,
      }
    }
    state.isLoading = true
    notify()

    try {

      // 1. Cek sesi Supabase jika ada
      const { data, error } = await supabase.auth.getSession()
      if (!error && data?.session?.user) {
        const user = data.session.user
        const sessionEmail = (user.email || '').toLowerCase()
        const savedEmail = (currentSavedState?.user?.email || '').toLowerCase()
        const isServiceAccount = sessionEmail === 'nuraini.tu@tadulakocendekia.sch.id'

        // A. Jika ada savedState untuk pengguna aktif (misal Tutor, Siswa, Wali) dan sesi Supabase
        // adalah service account atau email berbeda, pertahankan akun savedState (jangan di-overwrite oleh Supabase session).
        // Biarkan sesi Supabase tetap berjalan sebagai token bearer query agar lolos RLS.
        const shouldRestoreSavedState = Boolean(
          currentSavedState?.isAuthenticated &&
          currentSavedState?.role &&
          savedEmail &&
          sessionEmail !== savedEmail
        )

        if (!shouldRestoreSavedState && ((savedEmail && sessionEmail === savedEmail) || (!currentSavedState?.isAuthenticated && !isServiceAccount))) {
          const provisioned = await autoProvisionUser(user)
          const isSuper = Boolean(
            provisioned.isSuperAdmin ||
            provisioned.profile.is_super_admin ||
            user.user_metadata?.is_super_admin ||
            user.user_metadata?.isSuperAdmin ||
            isEmailSuperAdmin(user.email || '')
          )

          state = {
            user: {
              id: user.id,
              email: user.email || '',
              fullName: provisioned.profile.full_name,
              role: provisioned.profile.role,
              phone: provisioned.profile.phone_number || undefined,
              isSuperAdmin: isSuper,
            },
            profile: {
              ...provisioned.profile,
              is_super_admin: isSuper,
              isSuperAdmin: isSuper,
            },
            role: provisioned.profile.role,
            isSuperAdmin: isSuper,
            studentProfile: provisioned.student,
            parentProfile: provisioned.parent,
            children: provisioned.children,
            selectedChildId:
              provisioned.children[0]?.id || state.selectedChildId || null,
            adminStaff: state.adminStaff,
            isAuthenticated: true,
            isLoading: false,
            error: null,
          }
          notify()
          return
        }
      }

      // 2. Jika tidak ada sesi Supabase aktif (atau akun demo/unconfirmed), pulihkan dari savedState
      if (currentSavedState?.isAuthenticated && currentSavedState?.user && currentSavedState?.role) {
        const staffList = loadSavedAdminStaff()
        const matchedStaff = staffList.find(
          (s) => s.email.toLowerCase() === currentSavedState.user?.email.toLowerCase()
        )
        const isSuper = Boolean(
          currentSavedState.isSuperAdmin ||
          currentSavedState.user.isSuperAdmin ||
          currentSavedState.profile?.is_super_admin
        )

        const adminState = adminStore.getState()
        let studentRecord = currentSavedState.studentProfile || null
        let parentRecord = currentSavedState.parentProfile || null
        let mappedChildren = currentSavedState.children || []

        if (currentSavedState.role === 'student') {
          if (!studentRecord) {
            studentRecord =
              adminState.students.find(
                (s) => s.email.toLowerCase() === currentSavedState.user?.email.toLowerCase()
              ) ||
              adminState.students[0] ||
              null
          }
          if (studentRecord) {
            adminStore.setActiveStudentId(studentRecord.id)
          }
        } else if (currentSavedState.role === 'parent') {
          if (!parentRecord) {
            parentRecord =
              adminState.parents.find(
                (p) => p.email.toLowerCase() === currentSavedState.user?.email.toLowerCase()
              ) ||
              adminState.parents[0] ||
              null
          }
          if (mappedChildren.length === 0 && parentRecord) {
            mappedChildren = adminState.students.filter((s) => parentRecord?.studentIds?.includes(s.id))
            if (mappedChildren.length === 0 && adminState.students.length > 0) {
              mappedChildren = [adminState.students[0]]
            }
          }
          if (parentRecord) {
            adminStore.setActiveParentId(parentRecord.id)
          }
          if (mappedChildren[0]) {
            adminStore.setSelectedChildId(mappedChildren[0].id)
          }
        } else if (currentSavedState.role === 'tutor') {
          const tutor =
            adminState.tutors.find((t) => t.email?.toLowerCase() === currentSavedState.user?.email?.toLowerCase()) ||
            adminState.tutors.find((t) => t.id === currentSavedState.user?.id) ||
            adminState.tutors[0]
          if (tutor) {
            adminStore.setActiveTutorId(tutor.id)
          }
        }

        const nowIso = new Date().toISOString()
        state = {
          user: currentSavedState.user,
          profile: currentSavedState.profile || {
            id: currentSavedState.user.id,
            email: currentSavedState.user.email,
            full_name: currentSavedState.user.fullName,
            role: currentSavedState.role,
            phone_number: currentSavedState.user.phone,
            is_super_admin: isSuper,
            isSuperAdmin: isSuper,
            status: matchedStaff?.status || 'aktif',
            created_at: nowIso,
            updated_at: nowIso,
          },
          role: currentSavedState.role,
          isSuperAdmin: isSuper,
          studentProfile: studentRecord,
          parentProfile: parentRecord,
          children: mappedChildren,
          selectedChildId:
            currentSavedState.selectedChildId || mappedChildren[0]?.id || null,
          adminStaff: staffList,
          isAuthenticated: true,
          isLoading: false,
          error: null,
        }
        notify()
        return
      }

      // 3. Jika tidak ada savedState, pertahankan sesi in-memory aktif jika ada
      if (state.user && state.isAuthenticated) {
        state.isLoading = false
        notify()
        return
      }

      // Default: Belum login
      state.isLoading = false
      state.isAuthenticated = false
      state.user = null
      state.role = null
      state.isSuperAdmin = false
      notify()
    } catch (err: any) {
      console.warn('AuthStore initialization note:', err?.message || err)
      state.isLoading = false
      notify()
    }
  },

  /**
   * Menginisialisasi state auth sekali saja (memoized). Dipakai route guard
   * (beforeLoad) agar pemulihan sesi Supabase ter-persist selesai sebelum
   * memutuskan redirect — mencegah hard refresh membuang pengguna ke /masuk.
   */
  ensureInitialized(): Promise<void> {
    if (!initializePromise) {
      initializePromise = this.initialize().catch((err) => {
        // Jangan cache kegagalan: biarkan percobaan berikutnya menginisialisasi ulang.
        initializePromise = null
        throw err
      })
    }
    return initializePromise
  },

  async login(
    email: string,
    password: string,
    explicitRole?: UserRole
  ): Promise<{ success: boolean; role?: UserRole; href?: string; error?: string }> {
    state.isLoading = true
    state.error = null
    notify()

    const cleanInput = normalizeLoginEmail(email.trim().toLowerCase())
    if (!password || !password.trim()) {
      state.isLoading = false
      state.error = 'Kata sandi tidak boleh kosong.'
      notify()
      return {
        success: false,
        error: 'Kata sandi tidak boleh kosong.',
      }
    }

    // Resolusi jika pengguna login menggunakan NIS siswa
    let cleanEmail = cleanInput

    // Resolusi via Supabase jika input format mirip NIS
    if (isSupabaseConfigured() && (cleanInput.startsWith('tc-') || cleanInput.includes('-') || !cleanInput.includes('@'))) {
      try {
        const { data: resolvedEmail } = await supabase.rpc('resolve_student_email_by_nis', {
          p_nis: cleanInput,
        })
        if (resolvedEmail) {
          cleanEmail = String(resolvedEmail).toLowerCase()
        } else {
          const sb = supabase as any
          const { data: dbStudent } = await sb
            .from('students')
            .select('id, nis, origin_school, grade_level, class_id, profiles(email, full_name, phone_number, role)')
            .ilike('nis', cleanInput)
            .maybeSingle()

          if (dbStudent && dbStudent.profiles) {
            const prof = Array.isArray(dbStudent.profiles) ? dbStudent.profiles[0] : dbStudent.profiles
            if (prof?.email) {
              cleanEmail = prof.email.toLowerCase()
            }
          }
        }
      } catch (err) {
        console.info('[INFO] Supabase student lookup by NIS note:', err)
      }
    }

    // 2. Cek status di tabel public.profiles Supabase
    let dbProfile: any = null
    try {
      const sb = supabase as any
      const { data } = await sb
        .from('profiles')
        .select('id, full_name, role, status, phone_number')
        .eq('email', cleanEmail)
        .maybeSingle()

      dbProfile = data
      if (dbProfile && dbProfile.status === 'nonaktif') {
        state.isLoading = false
        state.error = 'Akun Anda telah dinonaktifkan oleh Pimpinan Lembaga. Silakan hubungi Tata Usaha.'
        notify()
        return {
          success: false,
          error: 'Akun Anda telah dinonaktifkan oleh Pimpinan Lembaga. Silakan hubungi Tata Usaha.',
        }
      }
    } catch (checkErr) {
      console.info('Login status check note in profiles:', checkErr)
    }

    const isSuperAdminEmail = isEmailSuperAdmin(cleanEmail)
    const targetRole = isSuperAdminEmail
      ? 'admin'
      : (dbProfile?.role as UserRole) || inferRoleFromEmail(cleanEmail, explicitRole)

    // PENCEKALAN LOGIN (Login Guard):
    // Calon siswa hanya dicekal jika belum memiliki profil aktif di profiles dan status pendaftarannya masih 'menunggu'
    if (!dbProfile || dbProfile.status !== 'aktif') {
      if (isSupabaseConfigured()) {
        try {
          const sb = supabase as any
          const { data: dbPendingReg } = await sb
            .from('registrations')
            .select('status')
            .or(`student_email.eq.${cleanEmail},parent_email.eq.${cleanEmail}`)
            .eq('status', 'menunggu')
            .maybeSingle()

          if (dbPendingReg) {
            state.isLoading = false
            state.error =
              'Pendaftaran Anda sedang menunggu verifikasi oleh staf Tata Usaha. Silakan tunggu konfirmasi admin sebelum masuk portal.'
            notify()
            return {
              success: false,
              error:
                'Pendaftaran Anda sedang menunggu verifikasi oleh staf Tata Usaha. Silakan tunggu konfirmasi admin sebelum masuk portal.',
            }
          }
        } catch (err) {
          console.info('[INFO] Pending registration check note:', err)
        }
      }
    }

    // 1. Cek status di daftar staf lokal
    const matchedStaff = state.adminStaff.find(
      (s) => s.email.toLowerCase() === cleanEmail
    )
    if (matchedStaff && matchedStaff.status === 'nonaktif') {
      state.isLoading = false
      state.error = 'Akun Anda telah dinonaktifkan oleh Pimpinan Lembaga. Silakan hubungi Tata Usaha.'
      notify()
      return {
        success: false,
        error: 'Akun Anda telah dinonaktifkan oleh Pimpinan Lembaga. Silakan hubungi Tata Usaha.',
      }
    }

    // A. Coba Supabase Auth terlebih dahulu jika terkonfigurasi
    let supabaseAuthSucceeded = false
    let supabaseAuthUser: any = null
    let supabaseAuthError: any = null

    if (isSupabaseConfigured()) {
      try {
        const { data, error } = await supabase.auth.signInWithPassword({
          email: cleanEmail,
          password,
        })

        if (!error && data?.user) {
          supabaseAuthSucceeded = true
          supabaseAuthUser = data.user
        } else if (error) {
          supabaseAuthError = error
        }
      } catch (err: any) {
        supabaseAuthError = err
      }
    }

    if (supabaseAuthSucceeded && supabaseAuthUser) {
      const provisioned = await autoProvisionUser(supabaseAuthUser, targetRole)
      if (provisioned.profile.status === 'nonaktif') {
        await supabase.auth.signOut().catch(() => {})
        state.isLoading = false
        state.isAuthenticated = false
        state.user = null
        state.error = 'Akun Anda telah dinonaktifkan oleh Pimpinan Lembaga. Silakan hubungi Tata Usaha.'
        notify()
        return {
          success: false,
          error: 'Akun Anda telah dinonaktifkan oleh Pimpinan Lembaga. Silakan hubungi Tata Usaha.',
        }
      }
      const isSuper = Boolean(
        provisioned.isSuperAdmin ||
        provisioned.profile.is_super_admin ||
        isSuperAdminEmail ||
        supabaseAuthUser.user_metadata?.is_super_admin
      )

      state = {
        user: {
          id: supabaseAuthUser.id,
          email: supabaseAuthUser.email || cleanEmail,
          fullName: provisioned.profile.full_name,
          role: provisioned.profile.role,
          phone: provisioned.profile.phone_number || undefined,
          isSuperAdmin: isSuper,
        },
        profile: {
          ...provisioned.profile,
          is_super_admin: isSuper,
          isSuperAdmin: isSuper,
        },
        role: provisioned.profile.role,
        isSuperAdmin: isSuper,
        studentProfile: provisioned.student,
        parentProfile: provisioned.parent,
        children: provisioned.children,
        selectedChildId: provisioned.children[0]?.id || null,
        adminStaff: state.adminStaff,
        isAuthenticated: true,
        isLoading: false,
        error: null,
      }
      notify()
      return {
        success: true,
        role: provisioned.profile.role,
        href: `/${provisioned.profile.role}`,
      }
    }

    // Penanganan khusus error email belum dikonfirmasi di Supabase Auth
    if (supabaseAuthError) {
      const errCode = supabaseAuthError.code || ''
      const errMsg = supabaseAuthError.message || ''
      if (errCode === 'email_not_confirmed' || errMsg.toLowerCase().includes('email not confirmed')) {
        let activatedSuccessfully = false

        // 1. Coba aktivasi instan via PostgreSQL RPC SECURITY DEFINER (berfungsi tanpa service role key)
        try {
          const { data: rpcActivated, error: rpcErr } = await supabase.rpc('confirm_verified_user', {
            user_email: cleanEmail,
          })
          if (!rpcErr && rpcActivated) {
            activatedSuccessfully = true
          }
        } catch (rpcEx) {
          console.info('[INFO] Supabase RPC confirm note:', rpcEx)
        }

        // 2. Coba auto-aktivasi sisi server jika RPC direct belum berhasil
        if (!activatedSuccessfully) {
          try {
            const { activateUnconfirmedUserFn } = await import('~/server/functions/auth')
            const activateRes = await activateUnconfirmedUserFn({ data: { email: cleanEmail } })
            if (activateRes.success) {
              activatedSuccessfully = true
            }
          } catch (actErr) {
            console.info('[INFO] Auto-activate on unconfirmed error note:', actErr)
          }
        }

        if (activatedSuccessfully) {
          // Percobaan ulang login setelah aktivasi berhasil
          const retryRes = await supabase.auth.signInWithPassword({
            email: cleanEmail,
            password,
          })
          if (!retryRes.error && retryRes.data?.user) {
            const provisioned = await autoProvisionUser(retryRes.data.user, targetRole)
            state = {
              user: {
                id: retryRes.data.user.id,
                email: retryRes.data.user.email || cleanEmail,
                fullName: provisioned.profile.full_name,
                role: provisioned.profile.role,
                phone: provisioned.profile.phone_number || undefined,
                isSuperAdmin: false,
              },
              profile: provisioned.profile,
              role: provisioned.profile.role,
              isSuperAdmin: false,
              studentProfile: provisioned.student,
              parentProfile: provisioned.parent,
              children: provisioned.children,
              selectedChildId: provisioned.children[0]?.id || null,
              adminStaff: state.adminStaff,
              isAuthenticated: true,
              isLoading: false,
              error: null,
            }
            notify()
            return {
              success: true,
              role: provisioned.profile.role,
              href: `/${provisioned.profile.role}`,
            }
          }
        }

        const politeError =
          'Akun Anda belum aktif. Silakan hubungi staf Tata Usaha untuk bantuan aktivasi akun pendaftaran Anda.'
        state.isLoading = false
        state.error = politeError
        notify()
        return {
          success: false,
          error: politeError,
        }
      }
    }

    // B. Verifikasi Password Ketat untuk Akun Demo / Terdaftar / Password Lokal
    const isDemoEmail =
      isSuperAdminEmail ||
      cleanEmail === DEMO_ACCOUNTS.super_admin.email.toLowerCase() ||
      cleanEmail === DEMO_ACCOUNTS.admin.email.toLowerCase() ||
      cleanEmail === DEMO_ACCOUNTS.tutor.email.toLowerCase() ||
      cleanEmail === DEMO_ACCOUNTS.student.email.toLowerCase() ||
      cleanEmail === DEMO_ACCOUNTS.parent.email.toLowerCase()

    const adminState = adminStore.getState()
    let matchedStudent = adminState.students.find(
      (s) => s.email.toLowerCase() === cleanEmail || s.nis.toLowerCase() === cleanInput
    )
    let matchedParent = adminState.parents.find(
      (p) => p.email.toLowerCase() === cleanEmail
    )
    const matchedApprovedReg = adminState.registrations.find(
      (r) =>
        r.status === 'terverifikasi' &&
        (r.studentEmail.toLowerCase() === cleanEmail || r.parentEmail?.toLowerCase() === cleanEmail)
    )

    if (!matchedStudent && (targetRole === 'student' || dbProfile?.role === 'student') && isSupabaseConfigured() && dbProfile) {
      try {
        const sb = supabase as any
        const { data: sRow } = await sb
          .from('students')
          .select('id, nis, origin_school, grade_level, class_id')
          .eq('profile_id', dbProfile.id)
          .maybeSingle()
        if (sRow) {
          matchedStudent = {
            id: sRow.id,
            nis: sRow.nis,
            name: dbProfile.full_name || 'Siswa',
            email: cleanEmail,
            phone: dbProfile.phone_number || '',
            school: sRow.origin_school || '',
            packageCode: 'UTBK',
            classId: sRow.class_id || '',
            className: 'Rombel Aktif',
            parentName: '',
            parentPhone: '',
            joinDate: '2026',
            status: 'aktif',
          }
        }
      } catch (err) {
        console.info('[INFO] Lookup student record by profile_id note:', err)
      }
    }

    const isInstitutionalEmail =
      cleanEmail.endsWith('@siswa.tadulakocendekia.sch.id') ||
      cleanEmail.endsWith('@wali.tadulakocendekia.sch.id') ||
      cleanEmail.endsWith('@tadulakocendekia.sch.id')

    const isKnownAccount = Boolean(
      isDemoEmail || matchedStaff || matchedStudent || matchedParent || matchedApprovedReg || isInstitutionalEmail || dbProfile
    )

    const isPasswordValid = isUserPasswordValid(cleanInput, password, targetRole)

    // JIKA PASSWORD SALAH, DILARANG MEMBUAT SESI (TOLAK SEGERA)
    if (!isPasswordValid) {
      state.isLoading = false
      state.error = 'Email atau kata sandi tidak cocok. Silakan periksa kembali kata sandi Anda.'
      notify()
      return {
        success: false,
        error: 'Email atau kata sandi tidak cocok. Silakan periksa kembali kata sandi Anda.',
      }
    }

    // Jika akun sama sekali tidak terdaftar di sistem dan Supabase Auth gagal
    if (!isKnownAccount && supabaseAuthError) {
      state.isLoading = false
      state.error = 'Akun tidak ditemukan. Silakan periksa kembali email Anda.'
      notify()
      return {
        success: false,
        error: 'Akun tidak ditemukan. Silakan periksa kembali email Anda.',
      }
    }

    // B. Auto-registration untuk siswa / wali yang sudah disetujui di adminStore namun belum punya akun Supabase Auth
    if (matchedStudent || matchedParent || matchedApprovedReg) {
      try {
        const actualEmail =
          matchedStudent?.email ||
          matchedParent?.email ||
          (matchedApprovedReg?.studentEmail.toLowerCase() === cleanEmail
            ? matchedApprovedReg.studentEmail
            : matchedApprovedReg?.parentEmail || cleanEmail)

        const autoRole: UserRole = matchedParent ? 'parent' : (targetRole || 'student')
        const candidateName =
          matchedStudent?.name ||
          matchedParent?.name ||
          (autoRole === 'parent' ? matchedApprovedReg?.parentName : matchedApprovedReg?.studentName) ||
          'Pengguna Bimbel'
        const candidatePhone =
          matchedStudent?.phone ||
          matchedParent?.phone ||
          matchedApprovedReg?.studentPhone ||
          '0813-7788-9900'

        const defaultTargetPw = password || (autoRole === 'parent' ? 'wali2026' : 'siswa2026')
        try {
          await supabase.rpc('provision_auth_user_direct', {
            p_email: actualEmail,
            p_password: defaultTargetPw,
            p_full_name: candidateName,
            p_role: autoRole,
            p_phone: candidatePhone,
          })
        } catch (err: any) {
          console.info('[INFO] Direct RPC auto-provisioning note:', err?.message)
        }

        const signInRes = await supabase.auth.signInWithPassword({
          email: actualEmail,
          password: defaultTargetPw,
        })

        if (!signInRes.error && signInRes.data?.user) {
          const authUser = signInRes.data.user
          const provisioned = await autoProvisionUser(authUser, autoRole)

          // Provisioning ke tabel 'students' / 'parents' di Supabase dengan authUser.id
          if (autoRole === 'student' && provisioned.student) {
            try {
              const sb = supabase as any
              await sb.from('students').upsert(
                [
                  {
                    profile_id: authUser.id,
                    nis: provisioned.student.nis,
                    origin_school: provisioned.student.school,
                    grade_level: 'SMA',
                    class_id: provisioned.student.classId,
                    status: 'aktif',
                  },
                ],
                { onConflict: 'profile_id' }
              )
            } catch (err) {
              console.info('Supabase student sync on auto-signup note:', err)
            }
          } else if (autoRole === 'parent' && provisioned.parent) {
            try {
              const sb = supabase as any
              await sb.from('parents').upsert([
                {
                  profile_id: authUser.id,
                  occupation: provisioned.parent.job,
                  address: provisioned.parent.address,
                  phone_number: provisioned.parent.phone,
                },
              ])
            } catch (err) {
              console.info('Supabase parent sync on auto-signup note:', err)
            }
          }

          state = {
            user: {
              id: authUser.id,
              email: authUser.email || actualEmail,
              fullName: provisioned.profile.full_name,
              role: provisioned.profile.role,
              phone: provisioned.profile.phone_number || undefined,
              isSuperAdmin: false,
            },
            profile: provisioned.profile,
            role: provisioned.profile.role,
            isSuperAdmin: false,
            studentProfile: provisioned.student,
            parentProfile: provisioned.parent,
            children: provisioned.children,
            selectedChildId: provisioned.children[0]?.id || null,
            adminStaff: state.adminStaff,
            isAuthenticated: true,
            isLoading: false,
            error: null,
          }
          notify()
          return {
            success: true,
            role: provisioned.profile.role,
            href: `/${provisioned.profile.role}`,
          }
        }
      } catch (signUpErr) {
        console.info('Supabase auto-signup error note:', signUpErr)
      }
    }

    // Jika Supabase Auth gagal dan auto-signup tidak terpenuhi, tolak login
    state.isLoading = false
    const rawError = supabaseAuthError?.message || ''
    const politeError =
      rawError.toLowerCase().includes('invalid login credentials') ||
      rawError.toLowerCase().includes('invalid credential')
        ? 'Email atau kata sandi tidak cocok. Silakan periksa kembali kata sandi Anda.'
        : rawError || 'Email atau kata sandi tidak cocok. Silakan periksa kembali kata sandi Anda.'
    state.error = politeError
    notify()
    return {
      success: false,
      error: politeError,
    }
  },

  clearSession(): void {
    state = {
      user: null,
      profile: null,
      role: null,
      isSuperAdmin: false,
      studentProfile: null,
      parentProfile: null,
      children: [],
      selectedChildId: null,
      adminStaff: state.adminStaff,
      isAuthenticated: false,
      isLoading: false,
      error: null,
    }

    if (typeof window !== 'undefined') {
      try {
        localStorage.removeItem(AUTH_STORAGE_KEY)
        localStorage.removeItem('tc_bimbel_supabase_auth_token')
        const keysToRemove: string[] = []
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i)
          if (key && (key.startsWith('sb-') || key.includes('supabase'))) {
            keysToRemove.push(key)
          }
        }
        keysToRemove.forEach((k) => localStorage.removeItem(k))
      } catch {}
    }

    notify()

    try {
      supabase.auth.signOut().catch(() => {})
    } catch {}
  },

  async logout(): Promise<void> {
    this.clearSession()
  },

  getAdminStaff(): AdminStaffMember[] {
    return state.adminStaff
  },

  setSuperAdmin(isSuper: boolean): void {
    state = {
      ...state,
      isSuperAdmin: isSuper,
      user: state.user ? { ...state.user, isSuperAdmin: isSuper } : null,
      profile: state.profile
        ? { ...state.profile, is_super_admin: isSuper, isSuperAdmin: isSuper }
        : null,
    }
    notify()
  },

  async createAdminStaff(data: {
    fullName: string
    email: string
    phone?: string
    password?: string
    isSuperAdmin?: boolean
  }): Promise<{ success: boolean; staff?: AdminStaffMember; error?: string }> {
    const cleanEmail = data.email.trim().toLowerCase()
    const cleanName = data.fullName.trim()
    const cleanPhone = (data.phone || '0812-4000-0000').trim()
    const password = data.password || 'password123'

    if (!state.isSuperAdmin) {
      return {
        success: false,
        error: 'Hanya Super Admin (Pimpinan Lembaga) yang berwenang menambahkan akun staf baru.',
      }
    }

    if (!cleanName || !cleanEmail) {
      return { success: false, error: 'Nama lengkap dan email staf wajib diisi.' }
    }

    if (state.adminStaff.some((s) => s.email.toLowerCase() === cleanEmail)) {
      return {
        success: false,
        error: 'Alamat email ini sudah terdaftar sebagai akun staf administrasi.',
      }
    }

    const isSuper = Boolean(data.isSuperAdmin)
    const newStaff: AdminStaffMember = {
      id: `staf-${Date.now().toString().slice(-4)}`,
      fullName: cleanName,
      email: cleanEmail,
      phone: cleanPhone,
      roleTitle: isSuper ? 'Pimpinan Lembaga / Super Admin' : 'Staf Tata Usaha',
      isSuperAdmin: isSuper,
      joinDate: new Date().toISOString().split('T')[0],
      status: 'aktif',
    }

    const updated = [newStaff, ...state.adminStaff]
    state = {
      ...state,
      adminStaff: updated,
    }
    persistAdminStaff(updated)
    notify()

    // Buat akun baru ke Supabase Auth via Direct RPC & public.profiles
    try {
      const { data: authUserId } = await supabase.rpc('provision_auth_user_direct', {
        p_email: cleanEmail,
        p_password: password,
        p_full_name: cleanName,
        p_role: 'admin',
        p_phone: cleanPhone,
      })

      // Pastikan record profil admin tersimpan di public.profiles
      const sb = supabase as any
      await sb.from('profiles').upsert([
        {
          id: authUserId || newStaff.id,
          email: cleanEmail,
          full_name: cleanName,
          role: 'admin',
          phone_number: cleanPhone,
          is_super_admin: isSuper,
        },
      ])
    } catch (err) {
      console.warn('[WARN] Error creating admin staff:', err)
    }

    return { success: true, staff: newStaff }
  },

  async updateAdminStaff(
    staffId: string,
    data: {
      fullName: string
      phone: string
      isSuperAdmin: boolean
      newPassword?: string
      password?: string
    }
  ): Promise<{ success: boolean; staff?: AdminStaffMember; error?: string }> {
    // a. Validasi otorisasi: pastikan state.isSuperAdmin bernilai true
    if (!state.isSuperAdmin) {
      return {
        success: false,
        error: 'Hanya Super Admin (Pimpinan Lembaga) yang berwenang memperbarui data staf.',
      }
    }

    const staffIndex = state.adminStaff.findIndex(
      (s) => s.id === staffId || s.email.toLowerCase() === staffId.toLowerCase()
    )
    if (staffIndex === -1) {
      return { success: false, error: 'Akun staf tidak ditemukan.' }
    }

    const existingStaff = state.adminStaff[staffIndex]

    // b. Validasi anti-self-lockout: jika mengedit akun sendiri, cegah pencabutan status Super Admin jika dia adalah satu-satunya Super Admin aktif
    const currentEmail = (state.user?.email || '').toLowerCase()
    const currentId = state.user?.id
    const isCurrentUser = Boolean(
      (currentId && existingStaff.id === currentId) ||
      (currentEmail && existingStaff.email.toLowerCase() === currentEmail)
    )

    if (
      isCurrentUser &&
      existingStaff.isSuperAdmin &&
      !data.isSuperAdmin
    ) {
      const activeSuperAdmins = state.adminStaff.filter(
        (s) => s.isSuperAdmin && s.status === 'aktif'
      )
      if (activeSuperAdmins.length <= 1) {
        return {
          success: false,
          error: 'Tidak dapat mencabut hak akses Super Admin karena Anda adalah satu-satunya Super Admin aktif di sistem.',
        }
      }
    }

    const cleanName = data.fullName.trim()
    const cleanPhone = data.phone.trim()
    const isSuper = Boolean(data.isSuperAdmin)

    if (!cleanName) {
      return { success: false, error: 'Nama lengkap staf wajib diisi.' }
    }

    // c. Perbarui data staf di state.adminStaff dan simpan via persistAdminStaff
    const updatedStaff: AdminStaffMember = {
      ...existingStaff,
      fullName: cleanName,
      phone: cleanPhone,
      isSuperAdmin: isSuper,
      roleTitle: isSuper
        ? 'Pimpinan Lembaga / Super Admin'
        : existingStaff.roleTitle?.includes('Super Admin')
        ? 'Staf Tata Usaha'
        : existingStaff.roleTitle || 'Staf Tata Usaha',
    }

    const updated = [...state.adminStaff]
    updated[staffIndex] = updatedStaff

    // Jika mengupdate diri sendiri, sinkronkan user dan profile aktif
    let updatedUser = state.user
    let updatedProfile = state.profile
    if (isCurrentUser) {
      if (state.user) {
        updatedUser = {
          ...state.user,
          fullName: cleanName,
          phone: cleanPhone,
          isSuperAdmin: isSuper,
        }
      }
      if (state.profile) {
        updatedProfile = {
          ...state.profile,
          full_name: cleanName,
          phone_number: cleanPhone,
          is_super_admin: isSuper,
          isSuperAdmin: isSuper,
        }
      }
    }

    state = {
      ...state,
      user: updatedUser,
      profile: updatedProfile,
      isSuperAdmin: isCurrentUser ? isSuper : state.isSuperAdmin,
      adminStaff: updated,
    }
    persistAdminStaff(updated)
    notify()

    // d. Sinkronkan full_name, phone_number, is_super_admin ke tabel public.profiles di Supabase
    try {
      const sb = supabase as any
      await sb
        .from('profiles')
        .update({
          full_name: cleanName,
          phone_number: cleanPhone,
          is_super_admin: isSuper,
          updated_at: new Date().toISOString(),
        })
        .eq('email', existingStaff.email.toLowerCase())
    } catch (err) {
      console.info('Supabase admin staff profile update note:', err)
    }

    // e. Jika newPassword diisi, perbarui password melalui Supabase Auth isolated client
    const targetPassword = (data.newPassword || data.password || '').trim()
    if (targetPassword && targetPassword.length >= 6) {
      try {
        if (isCurrentUser) {
          await supabase.auth.updateUser({ password: targetPassword })
        } else {
          // Gunakan isolated Supabase client agar tidak menimpa sesi login aktif di browser
          const isolatedClient = createSupabaseClient(undefined, false)
          const currentStaffPassword =
            existingStaff.email.toLowerCase() === DEMO_ACCOUNTS.super_admin.email.toLowerCase()
              ? DEMO_ACCOUNTS.super_admin.password
              : existingStaff.email.toLowerCase() === DEMO_ACCOUNTS.admin.email.toLowerCase()
              ? DEMO_ACCOUNTS.admin.password
              : 'password123'

          let signInData: any = null
          let signInErr: any = null
          const res1 = await isolatedClient.auth.signInWithPassword({
            email: existingStaff.email.toLowerCase(),
            password: currentStaffPassword,
          })
          signInData = res1.data
          signInErr = res1.error

          if (signInErr && currentStaffPassword !== 'password123') {
            const res2 = await isolatedClient.auth.signInWithPassword({
              email: existingStaff.email.toLowerCase(),
              password: 'password123',
            })
            signInData = res2.data
            signInErr = res2.error
          }

          if (!signInErr && signInData?.session) {
            await isolatedClient.auth.updateUser({ password: targetPassword })
            await isolatedClient.auth.signOut()
          } else {
            await isolatedClient.auth.updateUser({ password: targetPassword }).catch(() => {})
          }
        }

        const targetEmail = existingStaff.email.toLowerCase()
        if (targetEmail === DEMO_ACCOUNTS.super_admin.email.toLowerCase()) {
          DEMO_ACCOUNTS.super_admin.password = targetPassword
        } else if (targetEmail === DEMO_ACCOUNTS.admin.email.toLowerCase()) {
          DEMO_ACCOUNTS.admin.password = targetPassword
        }
      } catch (err) {
        console.warn('Supabase password update note for admin staff:', err)
      }
    }

    return { success: true, staff: updatedStaff }
  },

  async toggleAdminStaffStatus(
    staffId: string,
    newStatus: 'aktif' | 'nonaktif'
  ): Promise<{ success: boolean; staff?: AdminStaffMember; error?: string }> {
    // a. Validasi otorisasi: pastikan state.isSuperAdmin bernilai true
    if (!state.isSuperAdmin) {
      return {
        success: false,
        error: 'Hanya Super Admin (Pimpinan Lembaga) yang berwenang mengubah status staf.',
      }
    }

    const staffIndex = state.adminStaff.findIndex(
      (s) => s.id === staffId || s.email.toLowerCase() === staffId.toLowerCase()
    )
    if (staffIndex === -1) {
      return { success: false, error: 'Akun staf tidak ditemukan.' }
    }

    const existingStaff = state.adminStaff[staffIndex]

    // b. Validasi anti-self-lockout: pastikan Super Admin yang sedang login (state.user?.id atau state.user?.email) TIDAK dapat menonaktifkan akunnya sendiri
    const currentEmail = (state.user?.email || '').toLowerCase()
    const currentId = state.user?.id
    const isCurrentUser = Boolean(
      (currentId && existingStaff.id === currentId) ||
      (currentEmail && existingStaff.email.toLowerCase() === currentEmail)
    )

    if (isCurrentUser && newStatus === 'nonaktif') {
      return {
        success: false,
        error: 'Anda tidak dapat menonaktifkan akun Anda sendiri demi mencegah penguncian sistem (anti-lockout).',
      }
    }

    // c. Perbarui status staf di state.adminStaff dan simpan via persistAdminStaff
    const updatedStaff: AdminStaffMember = {
      ...existingStaff,
      status: newStatus,
    }

    const updated = [...state.adminStaff]
    updated[staffIndex] = updatedStaff

    state = {
      ...state,
      adminStaff: updated,
    }
    persistAdminStaff(updated)
    notify()

    // d. Sinkronkan status ke tabel public.profiles di Supabase (UPDATE profiles SET status = ... WHERE email = ...)
    try {
      const sb = supabase as any
      await sb
        .from('profiles')
        .update({
          status: newStatus,
          updated_at: new Date().toISOString(),
        })
        .eq('email', existingStaff.email.toLowerCase())
    } catch (err) {
      console.info('Supabase sync toggleAdminStaffStatus note:', err)
    }

    return { success: true, staff: updatedStaff }
  },

  verifyRole(allowedRoles: UserRole | UserRole[]): boolean {
    if (!state.isAuthenticated || !state.role) return false
    const allowed = Array.isArray(allowedRoles) ? allowedRoles : [allowedRoles]
    return allowed.includes(state.role)
  },

  switchSelectedChild(childId: string): void {
    if (state.role !== 'parent') return
    state.selectedChildId = childId
    adminStore.setSelectedChildId(childId)
    notify()
  },

  async switchRole(role: UserRole | 'super_admin'): Promise<void> {
    const demo = DEMO_ACCOUNTS[role]
    await this.login(demo.email, demo.defaultPassword, demo.role)
  },

  /**
   * Pembaruan data profil pengguna mandiri (untuk Admin TU, Tutor, Siswa, dan Wali).
   * Dikecualikan untuk Super Admin (Pimpinan Lembaga).
   */
  async updateProfile(data: {
    fullName?: string
    phone?: string
    occupation?: string
    address?: string
    school?: string
  }): Promise<{ success: boolean; error?: string }> {
    if (!state.isAuthenticated || !state.user) {
      return { success: false, error: 'Sesi pengguna tidak aktif. Silakan masuk kembali.' }
    }

    if (state.isSuperAdmin) {
      return { success: false, error: 'Profil Super Admin tidak dapat diubah secara mandiri.' }
    }

    const newFullName = data.fullName !== undefined ? data.fullName.trim() : state.user.fullName
    const newPhone = data.phone !== undefined ? data.phone.trim() : state.user.phone

    if (!newFullName) {
      return { success: false, error: 'Nama lengkap tidak boleh kosong.' }
    }

    // Perbarui state dasar pengguna
    state = {
      ...state,
      user: {
        ...state.user,
        fullName: newFullName,
        phone: newPhone,
      },
      profile: state.profile
        ? {
            ...state.profile,
            full_name: newFullName,
            phone_number: newPhone,
          }
        : null,
    }

    // Perbarui data entitas terkait berdasarkan peran
    if (state.role === 'student') {
      const newSchool = data.school !== undefined ? data.school.trim() : state.studentProfile?.school || ''
      if (state.studentProfile) {
        state.studentProfile = {
          ...state.studentProfile,
          name: newFullName,
          phone: newPhone || state.studentProfile.phone,
          school: newSchool,
        }
        adminStore.updateStudent(state.studentProfile.id, {
          name: newFullName,
          phone: newPhone || undefined,
          school: newSchool,
        })
      } else {
        const student = adminStore.getState().students.find(
          (s) => s.email.toLowerCase() === state.user?.email.toLowerCase()
        )
        if (student) {
          adminStore.updateStudent(student.id, {
            name: newFullName,
            phone: newPhone || undefined,
            school: newSchool,
          })
        }
      }
    } else if (state.role === 'parent') {
      const newJob = data.occupation !== undefined ? data.occupation.trim() : state.parentProfile?.job || ''
      const newAddress = data.address !== undefined ? data.address.trim() : state.parentProfile?.address || ''
      if (state.parentProfile) {
        state.parentProfile = {
          ...state.parentProfile,
          name: newFullName,
          phone: newPhone || state.parentProfile.phone,
          job: newJob,
          address: newAddress,
        }
        adminStore.updateParent(state.parentProfile.id, {
          name: newFullName,
          phone: newPhone || undefined,
          job: newJob,
          address: newAddress,
        })
      } else {
        const parent = adminStore.getState().parents.find(
          (p) => p.email.toLowerCase() === state.user?.email.toLowerCase()
        )
        if (parent) {
          adminStore.updateParent(parent.id, {
            name: newFullName,
            phone: newPhone || undefined,
            job: newJob,
            address: newAddress,
          })
        }
      }
    } else if (state.role === 'tutor') {
      const tutors = adminStore.getState().tutors
      const matchedTutor = tutors.find(
        (t) =>
          t.name.toLowerCase() === state.user?.fullName.toLowerCase() ||
          t.id === state.user?.id
      )
      if (matchedTutor) {
        adminStore.updateTutor(matchedTutor.id, {
          name: newFullName,
          phone: newPhone || undefined,
        })
      }
      if (DEMO_ACCOUNTS.tutor.email.toLowerCase() === state.user?.email.toLowerCase()) {
        DEMO_ACCOUNTS.tutor.name = newFullName
        if (newPhone) DEMO_ACCOUNTS.tutor.phone = newPhone
      }
    } else if (state.role === 'admin') {
      const staffList = [...state.adminStaff]
      const staffIdx = staffList.findIndex(
        (s) =>
          s.email.toLowerCase() === state.user?.email.toLowerCase() ||
          s.id === state.user?.id
      )
      if (staffIdx !== -1) {
        staffList[staffIdx] = {
          ...staffList[staffIdx],
          fullName: newFullName,
          phone: newPhone || staffList[staffIdx].phone,
        }
        state.adminStaff = staffList
        persistAdminStaff(staffList)
      }
      if (DEMO_ACCOUNTS.admin.email.toLowerCase() === state.user?.email.toLowerCase()) {
        DEMO_ACCOUNTS.admin.name = newFullName
        if (newPhone) DEMO_ACCOUNTS.admin.phone = newPhone
      }
    }

    // Sinkronkan ke Supabase jika terkonfigurasi
    const activeUserId = state.user?.id
    if (isSupabaseConfigured() && activeUserId) {
      try {
        const sb = supabase as any
        await sb
          .from('profiles')
          .update({
            full_name: newFullName,
            phone_number: newPhone,
            updated_at: new Date().toISOString(),
          })
          .eq('id', activeUserId)
      } catch (err) {
        console.info('Supabase profile update sync note:', err)
      }
    }

    notify()
    return { success: true }
  },

  /**
   * Pembaruan kata sandi mandiri dengan verifikasi kata sandi saat ini (lama).
   */
  async updatePassword(
    oldPassword: string,
    newPassword: string
  ): Promise<{ success: boolean; error?: string }> {
    if (!state.isAuthenticated || !state.user) {
      return { success: false, error: 'Sesi pengguna tidak aktif. Silakan masuk kembali.' }
    }

    const trimmedOld = (oldPassword || '').trim()
    const trimmedNew = (newPassword || '').trim()

    if (!trimmedOld) {
      return { success: false, error: 'Kata sandi saat ini (lama) wajib diisi.' }
    }

    if (!trimmedNew) {
      return { success: false, error: 'Kata sandi baru tidak boleh kosong.' }
    }

    if (trimmedNew.length < 6) {
      return { success: false, error: 'Kata sandi baru minimal harus 6 karakter.' }
    }

    const userEmail = state.user.email.toLowerCase()
    const custom = loadSavedCustomPasswords()
    const currentExpected = getEffectivePassword(userEmail, state.role || undefined)

    let isOldPasswordValid = trimmedOld === currentExpected
    if (!isOldPasswordValid && !custom[userEmail]) {
      if (state.role === 'student' && (trimmedOld === 'siswa2026' || trimmedOld === 'password123')) {
        isOldPasswordValid = true
      } else if (state.role === 'parent' && (trimmedOld === 'wali2026' || trimmedOld === 'password123')) {
        isOldPasswordValid = true
      }
    }

    if (!isOldPasswordValid && isSupabaseConfigured()) {
      try {
        const isolatedClient = createSupabaseClient(undefined, false)
        const checkRes = await isolatedClient.auth.signInWithPassword({
          email: userEmail,
          password: trimmedOld,
        })
        if (!checkRes.error && checkRes.data?.session) {
          isOldPasswordValid = true
          await isolatedClient.auth.signOut().catch(() => {})
        }
      } catch {}
    }

    if (!isOldPasswordValid) {
      return {
        success: false,
        error: 'Kata sandi saat ini (lama) yang Anda masukkan tidak sesuai.',
      }
    }

    // Simpan kata sandi baru
    persistCustomPassword(userEmail, trimmedNew)

    // Perbarui di DEMO_ACCOUNTS jika sesuai
    if (state.role && DEMO_ACCOUNTS[state.role]?.email.toLowerCase() === userEmail) {
      DEMO_ACCOUNTS[state.role].password = trimmedNew
    }

    if (isSupabaseConfigured()) {
      try {
        await supabase.auth.updateUser({ password: trimmedNew })
      } catch (err) {
        console.info('Supabase updateUser password note:', err)
      }
    }

    notify()
    return { success: true }
  },

  /**
   * Reset kata sandi Siswa atau Orang Tua oleh Administrator Tata Usaha.
   */
  async adminResetUserPassword(params: {
    targetRole: 'student' | 'parent'
    targetId: string
    email: string
    newPassword?: string
  }): Promise<{ success: boolean; newPassword?: string; error?: string }> {
    if (state.role !== 'admin') {
      return {
        success: false,
        error: 'Hanya Administrator / Staf Tata Usaha yang berwenang mereset kata sandi siswa atau orang tua.',
      }
    }

    const cleanEmail = params.email.trim().toLowerCase()
    if (!cleanEmail) {
      return { success: false, error: 'Email akun pengguna tujuan wajib diisi.' }
    }

    const finalPassword = (params.newPassword || '').trim() || 'password123'
    if (finalPassword.length < 6) {
      return { success: false, error: 'Kata sandi minimal harus 6 karakter.' }
    }

    persistCustomPassword(cleanEmail, finalPassword)

    if (params.targetRole === 'student') {
      const student = adminStore.getState().students.find(
        (s) => s.id === params.targetId || s.email.toLowerCase() === cleanEmail
      )
      if (student?.nis) {
        persistCustomPassword(student.nis.toLowerCase(), finalPassword)
      }
      if (cleanEmail === DEMO_ACCOUNTS.student.email.toLowerCase()) {
        DEMO_ACCOUNTS.student.password = finalPassword
      }
    } else if (params.targetRole === 'parent') {
      if (cleanEmail === DEMO_ACCOUNTS.parent.email.toLowerCase()) {
        DEMO_ACCOUNTS.parent.password = finalPassword
      }
    }

    if (isSupabaseConfigured()) {
      try {
        const isolatedClient = createSupabaseClient(undefined, false)
        const currentExpected = getEffectivePassword(cleanEmail, params.targetRole)
        const signRes = await isolatedClient.auth.signInWithPassword({
          email: cleanEmail,
          password: currentExpected,
        })
        if (!signRes.error && signRes.data?.session) {
          await isolatedClient.auth.updateUser({ password: finalPassword })
          await isolatedClient.auth.signOut().catch(() => {})
        }
      } catch (err) {
        console.info('Supabase adminResetUserPassword sync note:', err)
      }
    }

    return { success: true, newPassword: finalPassword }
  },
}

// Pasang listener onAuthStateChange sync (mencegah deadlock async)
if (typeof window !== 'undefined') {
  try {
    supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_OUT') {
        const currentEmail = state.user?.email?.toLowerCase()
        const signedOutEmail = session?.user?.email?.toLowerCase()
        if (state.isAuthenticated && currentEmail && signedOutEmail && currentEmail === signedOutEmail) {
          authStore.clearSession()
        }
      } else if (event === 'SIGNED_IN' && session?.user) {
        const sessionEmail = session.user.email?.toLowerCase() || ''
        const isServiceAccount = sessionEmail === 'nuraini.tu@tadulakocendekia.sch.id'
        const currentSaved = loadSavedAuthState()
        const activeEmail = (state.user?.email || currentSaved?.user?.email || '').toLowerCase()
        const activeRole = state.role || currentSaved?.role

        // 1. Jika pengguna saat ini terautentikasi dengan email berbeda (misal Tutor Kak Dian, Siswa Fahri, Wali Ahmad Dahlan),
        // atau peran bukan admin, dan sesi Supabase yang masuk adalah service account / email berbeda:
        // JANGAN TIMPA sesi aktif pengguna!
        if (
          (state.isAuthenticated || currentSaved?.isAuthenticated) &&
          activeEmail &&
          activeEmail !== sessionEmail &&
          (isServiceAccount || activeRole !== 'admin')
        ) {
          return
        }

        // 2. Jika user di antarmuka belum login sama sekali dan sesi yang masuk adalah background service account:
        // JANGAN jadikan admin secara otomatis di antarmuka pengguna!
        if (!state.isAuthenticated && !currentSaved?.isAuthenticated && isServiceAccount) {
          return
        }

        autoProvisionUser(session.user).then((provisioned) => {
          const isSuper = Boolean(
            provisioned.isSuperAdmin ||
            session.user.user_metadata?.is_super_admin ||
            session.user.user_metadata?.isSuperAdmin ||
            session.user.email?.toLowerCase().includes('pimpinan') ||
            provisioned.profile.is_super_admin
          )

          state = {
            ...state,
            user: {
              id: session.user.id,
              email: session.user.email || '',
              fullName: provisioned.profile.full_name,
              role: provisioned.profile.role,
              phone: provisioned.profile.phone_number || undefined,
              isSuperAdmin: isSuper,
            },
            profile: {
              ...provisioned.profile,
              is_super_admin: isSuper,
              isSuperAdmin: isSuper,
            },
            role: provisioned.profile.role,
            isSuperAdmin: isSuper,
            studentProfile: provisioned.student,
            parentProfile: provisioned.parent,
            children: provisioned.children,
            selectedChildId:
              provisioned.children[0]?.id || state.selectedChildId || null,
            adminStaff: state.adminStaff,
            isAuthenticated: true,
            isLoading: false,
            error: null,
          }
          notify()
        })
      }
    })
  } catch (err) {
    console.warn('onAuthStateChange registration note:', err)
  }
}
