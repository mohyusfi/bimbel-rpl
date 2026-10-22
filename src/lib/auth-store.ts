import {
  supabase,
  createSupabaseClient,
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

function loadSavedAdminStaff(): AdminStaffMember[] {
  if (typeof window === 'undefined') return INITIAL_ADMIN_STAFF
  try {
    const raw = localStorage.getItem(ADMIN_STAFF_STORAGE_KEY)
    if (!raw) return INITIAL_ADMIN_STAFF
    const parsed = JSON.parse(raw)
    if (Array.isArray(parsed) && parsed.length > 0) return parsed
    return INITIAL_ADMIN_STAFF
  } catch {
    return INITIAL_ADMIN_STAFF
  }
}

function persistAdminStaff(staffList: AdminStaffMember[]) {
  if (typeof window === 'undefined') return
  try {
    localStorage.setItem(ADMIN_STAFF_STORAGE_KEY, JSON.stringify(staffList))
  } catch {}
}

function inferRoleFromEmail(email: string, explicitRole?: UserRole): UserRole {
  if (explicitRole) return explicitRole
  const lower = email.toLowerCase()
  if (lower.includes('pimpinan') || lower.includes('rusdi')) {
    return 'admin'
  }
  if (lower.includes('.tu@') || lower.startsWith('admin') || lower.includes('nuraini')) {
    return 'admin'
  }
  if (lower.includes('dian.pratiwi') || lower.includes('tutor.')) {
    return 'tutor'
  }
  if (lower.includes('@wali.') || lower.includes('wali') || lower.includes('orangtua') || lower.includes('dahlan')) {
    return 'parent'
  }
  if (lower.includes('@siswa.') || lower.includes('siswa') || lower.includes('fahri')) {
    return 'student'
  }
  return 'student'
}

function isEmailSuperAdmin(email: string): boolean {
  const lower = email.trim().toLowerCase()
  return lower === DEMO_ACCOUNTS.super_admin.email.toLowerCase()
}

function loadSavedAuthState(): Partial<AuthState> | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = localStorage.getItem(AUTH_STORAGE_KEY)
    if (!raw) return null
    return JSON.parse(raw)
  } catch (err) {
    console.warn('Gagal membaca auth state dari localStorage:', err)
    return null
  }
}

function persistAuthState(currState: AuthState) {
  if (typeof window === 'undefined') return
  try {
    if (currState.isAuthenticated && currState.user) {
      localStorage.setItem(
        AUTH_STORAGE_KEY,
        JSON.stringify({
          user: currState.user,
          profile: currState.profile,
          role: currState.role,
          isSuperAdmin: currState.isSuperAdmin,
          selectedChildId: currState.selectedChildId,
          isAuthenticated: true,
        })
      )
    } else {
      localStorage.removeItem(AUTH_STORAGE_KEY)
    }
  } catch (err) {
    console.warn('Gagal menyimpan auth state ke localStorage:', err)
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
  studentProfile: null,
  parentProfile: null,
  children: [],
  selectedChildId: savedState?.selectedChildId || null,
  adminStaff: loadSavedAdminStaff(),
  isAuthenticated: Boolean(savedState?.isAuthenticated && savedState?.user),
  isLoading: false,
  error: null,
}

const listeners = new Set<() => void>()

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
    (isSuperAdmin
      ? 'Drs. H. Rusdi Mastura, M.Si'
      : role === 'admin'
      ? 'Hj. Nuraini, S.Pd'
      : role === 'tutor'
      ? 'Kak Dian Pratiwi, S.Si'
      : role === 'parent'
      ? 'Ir. H. Ahmad Dahlan'
      : 'Fahri Ramadhan')

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
      (s) => s.email.toLowerCase() === email
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
        id: `stu-${Date.now().toString().slice(-4)}`,
        nis: `TC-2026-${nisNumber}`,
        name: matchingReg?.studentName || defaultName,
        email,
        phone: matchingReg?.studentPhone || '0813-7788-9900',
        school: matchingReg?.studentSchool || 'SMA Negeri 1 Palu',
        packageCode: (matchingReg?.packageCode as PackageCode) || 'UTBK',
        classId: targetClass?.id || 'cls-1',
        className: targetClass?.name || 'Kelas 12 IPA 1 (Reguler)',
        parentName: matchingReg?.parentName || 'Ir. H. Ahmad Dahlan',
        parentPhone: matchingReg?.parentPhone || '0821-4455-6677',
        parentEmail: matchingReg?.parentEmail || 'ahmad.dahlan@wali.tadulakocendekia.sch.id',
        parentJob: matchingReg?.parentJob || 'Wali Murid',
        parentAddress: matchingReg?.parentAddress || 'Jl. Jenderal Sudirman No. 25, Palu Timur',
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
        await sb.from('students').upsert([
          {
            profile_id: rawUser.id,
            nis: newStudent.nis,
            origin_school: newStudent.school,
            grade_level: 'SMA',
            class_id: newStudent.classId,
            status: 'aktif',
          },
        ])
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
      (p) => p.email.toLowerCase() === email
    )

    if (!foundParent) {
      const matchingStudents = adminState.students.filter(
        (s) => s.parentEmail?.toLowerCase() === email
      )
      const studentIds =
        matchingStudents.length > 0
          ? matchingStudents.map((s) => s.id)
          : [adminState.students[0]?.id || 'stu-1']

      const newParent: ParentProfile = {
        id: `par-${Date.now().toString().slice(-4)}`,
        name: defaultName,
        email,
        phone: rawUser.user_metadata?.phone || '0821-4455-6677',
        job: rawUser.user_metadata?.job || 'Wali Murid',
        address: rawUser.user_metadata?.address || 'Kota Palu, Sulawesi Tengah',
        studentIds,
      }

      const addedParent = adminStore.addParent(newParent)
      foundParent = addedParent

      // Sync ke tabel parents Supabase
      try {
        const sb = supabase as any
        await sb.from('parents').upsert([
          {
            profile_id: rawUser.id,
            occupation: newParent.job,
            address: newParent.address,
            phone_number: newParent.phone,
          },
        ])
      } catch (err) {
        console.info('Supabase parent insert local fallback:', err)
      }
    }

    parentRecord = foundParent
    mappedChildren = adminState.students.filter((s) =>
      parentRecord?.studentIds.includes(s.id)
    )
    if (mappedChildren.length === 0 && adminState.students.length > 0) {
      mappedChildren = [adminState.students[0]]
    }

    adminStore.setActiveParentId(parentRecord.id)
    if (mappedChildren[0]?.id) {
      adminStore.setSelectedChildId(mappedChildren[0].id)
    }
  }

  // 4. Tutor / Admin synchronizer
  if (role === 'tutor') {
    const tutor =
      adminState.tutors.find((t) => t.name.toLowerCase().includes('dian')) ||
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

  quickLogin(roleOrSuper: UserRole | 'super_admin'): { success: boolean; role: UserRole; href: string } {
    const isSuper = roleOrSuper === 'super_admin'
    const targetRole: UserRole = isSuper ? 'admin' : roleOrSuper
    const demoInfo = isSuper ? DEMO_ACCOUNTS.super_admin : DEMO_ACCOUNTS[targetRole]

    const syntheticUser = {
      id: `usr-${isSuper ? 'super_admin' : targetRole}-${Date.now().toString().slice(-4)}`,
      email: demoInfo.email,
      user_metadata: {
        full_name: demoInfo.name,
        phone: demoInfo.phone,
        role: targetRole,
        is_super_admin: isSuper,
      },
    }

    const adminState = adminStore.getState()
    const nowIso = new Date().toISOString()
    const matchedStaff = state.adminStaff.find(
      (s) => s.email.toLowerCase() === demoInfo.email.toLowerCase()
    )
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

    let studentRecord: Student | null = null
    let parentRecord: ParentProfile | null = null
    let mappedChildren: Student[] = []

    if (targetRole === 'student') {
      studentRecord =
        adminState.students.find((s) => s.email.toLowerCase() === demoInfo.email.toLowerCase()) ||
        adminState.students[0] ||
        null
      const studentId = studentRecord?.id || 'd992d9fc-6f5b-434f-998b-358e54a754b7'
      adminStore.setActiveStudentId(studentId)
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
      const parentId = parentRecord?.id || 'ec6f75cb-887a-442b-b91d-f47f9afc5ab8'
      const childId = mappedChildren[0]?.id || 'd992d9fc-6f5b-434f-998b-358e54a754b7'
      adminStore.setActiveParentId(parentId)
      adminStore.setSelectedChildId(childId)
    } else if (targetRole === 'tutor') {
      const tutor =
        adminState.tutors.find((t) => t.name.toLowerCase().includes('dian')) ||
        adminState.tutors[0]
      const tutorId = tutor?.id || '9383fc09-99fc-423c-ac09-e3f94c26f5e9'
      adminStore.setActiveTutorId(tutorId)
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
    state.isLoading = true
    notify()

    try {
      // 1. Cek sesi Supabase jika ada
      const { data, error } = await supabase.auth.getSession()
      if (!error && data?.session?.user) {
        const user = data.session.user
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

      // 2. Jika tidak ada sesi Supabase tetapi ada demo user di localStorage
      if (savedState?.user && savedState?.isAuthenticated) {
        const demoUser = savedState.user
        const provisioned = await autoProvisionUser(
          {
            id: demoUser.id,
            email: demoUser.email,
            user_metadata: {
              full_name: demoUser.fullName,
              isSuperAdmin: demoUser.isSuperAdmin,
            },
          },
          demoUser.role
        )

        const isSuper = Boolean(
          savedState.isSuperAdmin ||
          demoUser.isSuperAdmin ||
          provisioned.isSuperAdmin ||
          provisioned.profile.is_super_admin ||
          isEmailSuperAdmin(demoUser.email || '')
        )

        state = {
          user: {
            ...demoUser,
            isSuperAdmin: isSuper,
          },
          profile: {
            ...provisioned.profile,
            is_super_admin: isSuper,
            isSuperAdmin: isSuper,
          },
          role: demoUser.role,
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

  async login(
    email: string,
    password: string,
    explicitRole?: UserRole
  ): Promise<{ success: boolean; role?: UserRole; href?: string; error?: string }> {
    state.isLoading = true
    state.error = null
    notify()

    const cleanEmail = email.trim().toLowerCase()
    const isSuperAdminEmail = isEmailSuperAdmin(cleanEmail)
    const targetRole = isSuperAdminEmail ? 'admin' : inferRoleFromEmail(cleanEmail, explicitRole)

    // PENCEKALAN LOGIN (Login Guard):
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

    // 2. Cek status di tabel public.profiles Supabase
    try {
      const sb = supabase as any
      const { data: dbProfile } = await sb
        .from('profiles')
        .select('status')
        .eq('email', cleanEmail)
        .maybeSingle()

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

    // A. Coba Supabase Auth terlebih dahulu
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: cleanEmail,
        password,
      })

      if (!error && data?.user) {
        const provisioned = await autoProvisionUser(data.user, targetRole)
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
          data.user.user_metadata?.is_super_admin
        )

        state = {
          user: {
            id: data.user.id,
            email: data.user.email || cleanEmail,
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
    } catch (err) {
      console.info('Supabase signInWithPassword note:', err)
    }

    // B. Auto-registration untuk siswa / wali yang sudah disetujui di adminStore namun belum punya akun Supabase Auth
    const adminState = adminStore.getState()
    const matchedStudent = adminState.students.find(
      (s) => s.email.toLowerCase() === cleanEmail || s.nis.toLowerCase() === cleanEmail
    )
    const matchedParent = adminState.parents.find(
      (p) => p.email.toLowerCase() === cleanEmail
    )
    const matchedApprovedReg = adminState.registrations.find(
      (r) =>
        r.status === 'terverifikasi' &&
        (r.studentEmail.toLowerCase() === cleanEmail || r.parentEmail?.toLowerCase() === cleanEmail)
    )

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

        const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
          email: actualEmail,
          password: password || 'password123',
          options: {
            data: {
              full_name: candidateName,
              role: autoRole,
              phone: candidatePhone,
            },
          },
        })

        if (!signUpError && signUpData?.user) {
          const authUser = signUpData.user
          const provisioned = await autoProvisionUser(authUser, autoRole)

          // Provisioning ke tabel 'students' / 'parents' di Supabase dengan authUser.id
          if (autoRole === 'student' && provisioned.student) {
            try {
              const sb = supabase as any
              await sb.from('students').upsert([
                {
                  profile_id: authUser.id,
                  nis: provisioned.student.nis,
                  origin_school: provisioned.student.school,
                  grade_level: 'SMA',
                  class_id: provisioned.student.classId,
                  status: 'aktif',
                },
              ])
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

    // C. Fallback Akun Demo / Akun Cepat Simulasi
    const isSuperDemo = isSuperAdminEmail || cleanEmail === DEMO_ACCOUNTS.super_admin.email.toLowerCase()
    const demo = isSuperDemo
      ? DEMO_ACCOUNTS.super_admin
      : DEMO_ACCOUNTS[targetRole]
    const matchedRole = isSuperDemo ? 'admin' : (demo?.email.toLowerCase() === cleanEmail ? targetRole : targetRole)
    const demoInfo = isSuperDemo ? DEMO_ACCOUNTS.super_admin : DEMO_ACCOUNTS[matchedRole]

    const syntheticUser = {
      id: `usr-${matchedRole}-${Date.now().toString().slice(-4)}`,
      email: cleanEmail,
      user_metadata: {
        full_name: demoInfo ? demoInfo.name : cleanEmail.split('@')[0],
        phone: demoInfo ? demoInfo.phone : '0812-3456-7890',
        role: matchedRole,
        is_super_admin: isSuperDemo,
      },
    }

    const provisioned = await autoProvisionUser(syntheticUser, matchedRole)
    if (provisioned.profile.status === 'nonaktif') {
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

    const finalIsSuper = Boolean(isSuperDemo || provisioned.isSuperAdmin)

    state = {
      user: {
        id: syntheticUser.id,
        email: cleanEmail,
        fullName: provisioned.profile.full_name,
        role: provisioned.profile.role,
        phone: provisioned.profile.phone_number || undefined,
        isSuperAdmin: finalIsSuper,
      },
      profile: {
        ...provisioned.profile,
        is_super_admin: finalIsSuper,
        isSuperAdmin: finalIsSuper,
      },
      role: provisioned.profile.role,
      isSuperAdmin: finalIsSuper,
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
  },

  async logout(): Promise<void> {
    try {
      await supabase.auth.signOut()
    } catch (e) {
      console.info('Supabase signOut note:', e)
    }

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
      } catch {}
    }

    notify()
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

    // Buat akun baru ke Supabase Auth & public.profiles
    try {
      // Gunakan isolated Supabase client agar tidak menimpa sesi login aktif di browser
      const isolatedClient = createSupabaseClient(undefined, false)
      const { data: authData, error: authErr } = await isolatedClient.auth.signUp({
        email: cleanEmail,
        password,
        options: {
          data: {
            full_name: cleanName,
            phone: cleanPhone,
            role: 'admin',
            is_super_admin: isSuper,
          },
        },
      })

      if (authErr) {
        console.warn('Supabase Auth signUp note for admin staff:', authErr.message)
      }

      // Pastikan record profil admin tersimpan di public.profiles
      const sb = supabase as any
      await sb.from('profiles').upsert([
        {
          id: authData?.user?.id || newStaff.id,
          email: cleanEmail,
          full_name: cleanName,
          role: 'admin',
          phone_number: cleanPhone,
          is_super_admin: isSuper,
        },
      ])
    } catch (err) {
      console.info('Supabase admin staff profile upsert note:', err)
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
}

// Pasang listener onAuthStateChange sync (mencegah deadlock async)
if (typeof window !== 'undefined') {
  try {
    supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_OUT') {
        if (state.isAuthenticated && !savedState?.user) {
          authStore.logout()
        }
      } else if (event === 'SIGNED_IN' && session?.user) {
        // Safe deferred sync
        setTimeout(() => {
          autoProvisionUser(session.user).then((provisioned) => {
            const isSuper = Boolean(
              provisioned.isSuperAdmin ||
              session.user.user_metadata?.is_super_admin ||
              session.user.user_metadata?.isSuperAdmin ||
              session.user.email?.toLowerCase().includes('pimpinan') ||
              provisioned.profile.is_super_admin
            )

            state.user = {
              id: session.user.id,
              email: session.user.email || '',
              fullName: provisioned.profile.full_name,
              role: provisioned.profile.role,
              phone: provisioned.profile.phone_number || undefined,
              isSuperAdmin: isSuper,
            }
            state.profile = {
              ...provisioned.profile,
              is_super_admin: isSuper,
              isSuperAdmin: isSuper,
            }
            state.role = provisioned.profile.role
            state.isSuperAdmin = isSuper
            state.studentProfile = provisioned.student
            state.parentProfile = provisioned.parent
            state.children = provisioned.children
            state.adminStaff = state.adminStaff
            state.isAuthenticated = true
            notify()
          })
        }, 0)
      }
    })
  } catch (err) {
    console.warn('onAuthStateChange registration note:', err)
  }
}
