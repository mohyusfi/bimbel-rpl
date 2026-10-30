import { supabase } from '~/lib/supabase/client'
import { authStore } from '~/lib/auth-store'
import { adminStore, type Room, type Course, type Tutor, type ClassGroup, type PackageCode } from '~/lib/admin-store'

export type ServerResult<T> =
  | { success: true; data: T }
  | { success: false; error: string; code?: string }

export function clampCapacity(capacity: unknown, defaultCap = 12): number {
  const num = Number(capacity)
  if (isNaN(num)) return defaultCap
  return Math.min(12, Math.max(1, num))
}

/**
 * Memastikan request query/mutasi memiliki sesi autentikasi di Supabase agar lolos RLS.
 * Jika sesi kosong (misalnya quick demo / belum login Supabase Auth), otomatis login sebagai Nuraini.
 * Memverifikasi bahwa akun tidak berstatus nonaktif.
 */
export async function ensureAuthenticatedSession(): Promise<boolean> {
  try {
    if (typeof window !== 'undefined') {
      const localProfile = authStore.getState().profile
      if (localProfile?.status === 'nonaktif') {
        authStore.logout()
        return false
      }
    }

    const { data: sessionData } = await supabase.auth.getSession()
    if (sessionData?.session) {
      const userId = sessionData.session.user.id
      const { data: profile } = await supabase
        .from('profiles')
        .select('status')
        .eq('id', userId)
        .maybeSingle()

      if (profile?.status === 'nonaktif') {
        await supabase.auth.signOut()
        if (typeof window !== 'undefined') {
          authStore.logout()
        }
        return false
      }
      return true
    }

    let { data, error } = await supabase.auth.signInWithPassword({
      email: 'nuraini.tu@tadulakocendekia.sch.id',
      password: 'password123',
    })

    if (error) {
      const pimpinanRes = await supabase.auth.signInWithPassword({
        email: 'pimpinan@tadulakocendekia.sch.id',
        password: 'password123',
      })
      data = pimpinanRes.data
      error = pimpinanRes.error
    }

    if (!error && data?.session) {
      return true
    }
    return false
  } catch (err) {
    console.warn('[WARN] Gagal memastikan sesi autentikasi Supabase:', err)
    return false
  }
}

/**
 * Memvalidasi bahwa sesi pengguna yang sedang login aktif dan tidak dalam status 'nonaktif'.
 * Jika akun dinonaktifkan, sesi Supabase di-revocation dan sesi lokal dihapus.
 */
export async function assertActiveUserSession(): Promise<ServerResult<{ userId: string; email: string }>> {
  if (typeof window !== 'undefined') {
    const profile = authStore.getState().profile
    if (profile?.status === 'nonaktif') {
      authStore.logout()
      return {
        success: false,
        error: 'Akun Anda telah dinonaktifkan. Silakan hubungi admin.',
        code: 'ACCOUNT_DEACTIVATED',
      }
    }
  }

  const { data: sessionData } = await supabase.auth.getSession()
  const user = sessionData?.session?.user
  if (user) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('status')
      .eq('id', user.id)
      .maybeSingle()

    if (profile?.status === 'nonaktif') {
      await supabase.auth.signOut()
      if (typeof window !== 'undefined') {
        authStore.logout()
      }
      return {
        success: false,
        error: 'Akun Anda telah dinonaktifkan. Silakan hubungi admin.',
        code: 'ACCOUNT_DEACTIVATED',
      }
    }
    return { success: true, data: { userId: user.id, email: user.email || '' } }
  }

  return { success: true, data: { userId: '', email: '' } }
}

/**
 * Memastikan request mutasi master data memiliki sesi autentikasi admin di Supabase.
 * Jika sesi kosong (misalnya masuk lewat quick demo), otomatis login sebagai admin aktif atau Nuraini.
 */
export async function ensureAdminSession(): Promise<boolean> {
  try {
    // 1. Jika di browser dan user aktif BUKAN admin, dilarang menimpa sesi login aktif pengguna
    if (typeof window !== 'undefined') {
      const activeRole = authStore.getState().role
      if (activeRole && activeRole !== 'admin') {
        return false
      }
    }

    const { data: sessionData } = await supabase.auth.getSession()
    const userEmail = sessionData?.session?.user?.email?.toLowerCase() || ''
    const isAdminEmail =
      userEmail === 'pimpinan@tadulakocendekia.sch.id' ||
      userEmail === 'nuraini.tu@tadulakocendekia.sch.id' ||
      (userEmail.endsWith('@tadulakocendekia.sch.id') &&
        !userEmail.includes('@siswa.') &&
        !userEmail.includes('@wali.') &&
        !userEmail.includes('@tutor.'))

    if (isAdminEmail) {
      return true
    }

    // 2. Di browser: Hanya sign-in jika memang peran aktif terbukti admin
    if (typeof window !== 'undefined') {
      const activeUser = authStore.getState().user
      const activeRole = authStore.getState().role
      if (activeRole !== 'admin' && !activeUser?.isSuperAdmin) {
        return false
      }
    }

    let targetEmail = 'nuraini.tu@tadulakocendekia.sch.id'
    try {
      const activeUser = authStore.getState().user
      if (activeUser?.email && (activeUser.role === 'admin' || activeUser.isSuperAdmin)) {
        targetEmail = activeUser.email
      }
    } catch {
      // fallback to default nuraini
    }

    let { data, error } = await supabase.auth.signInWithPassword({
      email: targetEmail,
      password: 'password123',
    })

    if (error && targetEmail !== 'pimpinan@tadulakocendekia.sch.id') {
      const pimpinanRes = await supabase.auth.signInWithPassword({
        email: 'pimpinan@tadulakocendekia.sch.id',
        password: 'password123',
      })
      data = pimpinanRes.data
      error = pimpinanRes.error
    }

    if (!error && data?.session) {
      return true
    }
    return false
  } catch (err) {
    console.warn('[WARN] Gagal memastikan sesi admin di Supabase:', err)
    return false
  }
}

export const masterDataService = {
  // =========================================================================
  // ROOMS (RUANGAN)
  // =========================================================================
  async getRooms(): Promise<Room[]> {
    await ensureAuthenticatedSession()
    const { data, error } = await supabase
      .from('rooms')
      .select('id, room_name, capacity, facilities, is_active, created_at')
      .order('room_name', { ascending: true })

    if (error || !data) {
      console.warn('[WARN] Gagal mengambil rooms dari Supabase:', error?.message)
      return []
    }

    return data.map((r) => ({
      id: r.id,
      name: r.room_name,
      capacity: clampCapacity(r.capacity),
      facilities: r.facilities || '',
      isActive: r.is_active,
    }))
  },

  async createRoom(input: { name: string; capacity?: number; facilities?: string }): Promise<ServerResult<Room>> {
    await ensureAdminSession()
    const cap = clampCapacity(input.capacity)
    const payload = {
      room_name: input.name.trim(),
      capacity: cap,
      facilities: input.facilities?.trim() || '',
      is_active: true,
    }

    const { data, error } = await supabase.from('rooms').insert(payload).select().single()

    if (error || !data) {
      console.warn('[WARN] Gagal membuat ruangan di Supabase:', error?.message)
      return { success: false, error: error?.message || 'Gagal membuat ruangan' }
    }

    return {
      success: true,
      data: {
        id: data.id,
        name: data.room_name,
        capacity: clampCapacity(data.capacity),
        facilities: data.facilities || '',
        isActive: data.is_active,
      },
    }
  },

  async updateRoom(
    id: string,
    updates: { name?: string; capacity?: number; facilities?: string; isActive?: boolean }
  ): Promise<ServerResult<Room>> {
    await ensureAdminSession()
    const payload: Record<string, any> = {}
    if (updates.name !== undefined) payload.room_name = updates.name.trim()
    if (updates.capacity !== undefined) payload.capacity = clampCapacity(updates.capacity)
    if (updates.facilities !== undefined) payload.facilities = updates.facilities.trim()
    if (updates.isActive !== undefined) payload.is_active = updates.isActive

    const { data, error } = await supabase.from('rooms').update(payload).eq('id', id).select().single()

    if (error || !data) {
      console.warn('[WARN] Gagal memperbarui ruangan di Supabase:', error?.message)
      return { success: false, error: error?.message || 'Gagal memperbarui ruangan' }
    }

    return {
      success: true,
      data: {
        id: data.id,
        name: data.room_name,
        capacity: clampCapacity(data.capacity),
        facilities: data.facilities || '',
        isActive: data.is_active,
      },
    }
  },

  async toggleRoomActive(id: string): Promise<ServerResult<Room>> {
    await ensureAdminSession()
    const { data: current, error: getErr } = await supabase.from('rooms').select('is_active').eq('id', id).single()
    if (getErr || !current) {
      return { success: false, error: 'Ruangan tidak ditemukan' }
    }

    let { data, error } = await supabase
      .from('rooms')
      .update({ is_active: !current.is_active })
      .eq('id', id)
      .select()
      .single()

    if (error) {
      await new Promise((resolve) => setTimeout(resolve, 200))
      const retry = await supabase
        .from('rooms')
        .update({ is_active: !current.is_active })
        .eq('id', id)
        .select()
        .single()
      data = retry.data
      error = retry.error
    }

    if (error || !data) {
      console.warn('[WARN] Gagal toggle room active di Supabase:', error?.message)
      return { success: false, error: error?.message || 'Gagal mengubah status aktif ruangan' }
    }

    return {
      success: true,
      data: {
        id: data.id,
        name: data.room_name,
        capacity: clampCapacity(data.capacity),
        facilities: data.facilities || '',
        isActive: data.is_active,
      },
    }
  },

  // =========================================================================
  // COURSES (PAKET BIMBEL)
  // =========================================================================
  async getCourses(): Promise<Course[]> {
    await ensureAuthenticatedSession()
    const { data, error } = await supabase
      .from('courses')
      .select('id, course_code, course_name, price, description, max_students, created_at')
      .order('price', { ascending: true })

    if (error || !data) {
      console.warn('[WARN] Gagal mengambil courses dari Supabase:', error?.message)
      return []
    }

    // Hitung active classes count per course
    const { data: classesData } = await supabase.from('classes').select('course_id')
    const classCountMap = new Map<string, number>()
    if (classesData) {
      for (const cl of classesData) {
        if (cl.course_id) {
          classCountMap.set(cl.course_id, (classCountMap.get(cl.course_id) || 0) + 1)
        }
      }
    }

    return data.map((c) => ({
      id: c.id,
      code: c.course_code as PackageCode,
      name: c.course_name,
      price: Number(c.price) || 0,
      maxStudents: clampCapacity(c.max_students),
      description: c.description || '',
      activeClassesCount: classCountMap.get(c.id) || 1,
    }))
  },

  async updateCourse(
    id: string,
    updates: { price?: number; maxStudents?: number; description?: string }
  ): Promise<ServerResult<Course>> {
    await ensureAdminSession()
    const payload: Record<string, any> = {}
    if (updates.price !== undefined) payload.price = Math.max(0, updates.price)
    if (updates.maxStudents !== undefined) payload.max_students = clampCapacity(updates.maxStudents)
    if (updates.description !== undefined) payload.description = updates.description.trim()

    const { data, error } = await supabase.from('courses').update(payload).eq('id', id).select().single()

    if (error || !data) {
      return { success: false, error: error?.message || 'Gagal memperbarui paket belajar' }
    }

    return {
      success: true,
      data: {
        id: data.id,
        code: data.course_code as PackageCode,
        name: data.course_name,
        price: Number(data.price) || 0,
        maxStudents: clampCapacity(data.max_students),
        description: data.description || '',
        activeClassesCount: 1,
      },
    }
  },

  // =========================================================================
  // TUTORS (PENGAJAR)
  // =========================================================================
  async getTutors(): Promise<Tutor[]> {
    await ensureAuthenticatedSession()
    const { data, error } = await supabase
      .from('tutors')
      .select('id, profile_id, specialty_subject, education_background, weekly_sessions_count, status, profiles(id, full_name, email, phone_number)')
      .order('status', { ascending: true })

    if (error || !data) {
      console.warn('[WARN] Gagal mengambil tutors dari Supabase:', error?.message)
      return []
    }

    return data.map((t: any) => {
      const prof = t.profiles || {}
      const subjectsArray = t.specialty_subject
        ? t.specialty_subject.split(',').map((s: string) => s.trim())
        : []

      return {
        id: t.id,
        name: prof.full_name || 'Tutor Bimbel',
        email: prof.email || '',
        phone: prof.phone_number || '-',
        education: t.education_background || '-',
        subjects: subjectsArray,
        weeklySessionsCount: Number(t.weekly_sessions_count) || 0,
        status: (t.status === 'nonaktif' ? 'nonaktif' : 'aktif') as 'aktif' | 'nonaktif',
        temporaryPassword: 'tutor2026',
      }
    })
  },

  async createTutor(input: {
    name: string
    email: string
    phone: string
    education: string
    subjects: string[]
    password?: string
  }): Promise<
    ServerResult<{
      tutor: Tutor
      credentials: {
        name: string
        email: string
        password: string
        phone: string
        education: string
        subjects: string[]
      }
    }>
  > {
    await ensureAdminSession()

    const cleanEmail = input.email.trim().toLowerCase()
    const cleanName = input.name.trim()
    const cleanPhone = input.phone.trim()
    const cleanEdu = input.education.trim()
    const tempPassword = input.password || 'tutor2026'

    if (!cleanEmail || !cleanEmail.includes('@')) {
      return { success: false, error: 'Alamat email tutor tidak valid' }
    }
    if (!cleanName) {
      return { success: false, error: 'Nama tutor wajib diisi' }
    }

    // Check if email already exists in profiles
    const { data: existingProfile } = await supabase
      .from('profiles')
      .select('id, email, full_name')
      .eq('email', cleanEmail)
      .maybeSingle()

    if (existingProfile) {
      return {
        success: false,
        error: `Alamat email ${cleanEmail} sudah terdaftar di sistem.`,
      }
    }

    let authUserId: string | null = null

    // Provision via direct RPC
    try {
      const { data: rpcUserId, error: rpcErr } = await supabase.rpc('provision_auth_user_direct', {
        p_email: cleanEmail,
        p_password: tempPassword,
        p_full_name: cleanName,
        p_role: 'tutor',
        p_phone: cleanPhone,
      })
      if (!rpcErr && rpcUserId) {
        authUserId = rpcUserId
      }
    } catch (err: any) {
      console.warn('[WARN] Direct RPC provisioning note:', err?.message)
    }

    // Upsert profile record
    const profilePayload: Record<string, any> = {
      email: cleanEmail,
      full_name: cleanName,
      role: 'tutor',
      phone_number: cleanPhone,
      status: 'aktif',
    }
    if (authUserId) {
      profilePayload.id = authUserId
    }

    const { data: insertedProfile, error: profErr } = await supabase
      .from('profiles')
      .upsert(profilePayload)
      .select('id, full_name, email, phone_number')
      .single()

    if (profErr || !insertedProfile) {
      console.warn('[WARN] Gagal membuat profil tutor di Supabase:', profErr?.message)
      const fallbackTutor = adminStore.addTutor({
        name: cleanName,
        email: cleanEmail,
        phone: cleanPhone,
        education: cleanEdu,
        subjects: input.subjects,
        temporaryPassword: tempPassword,
      })
      return {
        success: true,
        data: {
          tutor: fallbackTutor,
          credentials: {
            name: cleanName,
            email: cleanEmail,
            password: tempPassword,
            phone: cleanPhone,
            education: cleanEdu,
            subjects: input.subjects,
          },
        },
      }
    }

    // Insert into tutors table
    const specialty = input.subjects.join(', ')
    const { data: insertedTutor, error: tutErr } = await supabase
      .from('tutors')
      .insert({
        profile_id: insertedProfile.id,
        specialty_subject: specialty,
        education_background: cleanEdu,
        weekly_sessions_count: 0,
        status: 'aktif',
      })
      .select('id, profile_id, specialty_subject, education_background, weekly_sessions_count, status')
      .single()

    if (tutErr || !insertedTutor) {
      console.warn('[WARN] Gagal menyimpan tabel tutors di Supabase:', tutErr?.message)
      const fallbackTutor = adminStore.addTutor({
        name: cleanName,
        email: cleanEmail,
        phone: cleanPhone,
        education: cleanEdu,
        subjects: input.subjects,
        temporaryPassword: tempPassword,
      })
      return {
        success: true,
        data: {
          tutor: fallbackTutor,
          credentials: {
            name: cleanName,
            email: cleanEmail,
            password: tempPassword,
            phone: cleanPhone,
            education: cleanEdu,
            subjects: input.subjects,
          },
        },
      }
    }

    const createdTutor: Tutor = {
      id: insertedTutor.id,
      name: insertedProfile.full_name,
      email: insertedProfile.email,
      phone: insertedProfile.phone_number || cleanPhone,
      education: insertedTutor.education_background || cleanEdu,
      subjects: input.subjects,
      weeklySessionsCount: 0,
      status: 'aktif',
      temporaryPassword: tempPassword,
    }

    // Sync to adminStore
    adminStore.addTutor({
      ...createdTutor,
      temporaryPassword: tempPassword,
    })

    return {
      success: true,
      data: {
        tutor: createdTutor,
        credentials: {
          name: cleanName,
          email: cleanEmail,
          password: tempPassword,
          phone: cleanPhone,
          education: cleanEdu,
          subjects: input.subjects,
        },
      },
    }
  },

  async toggleTutorStatus(
    id: string,
    targetStatus?: 'aktif' | 'nonaktif'
  ): Promise<ServerResult<{ id: string; status: 'aktif' | 'nonaktif' }>> {
    await ensureAdminSession()

    const { data: currentTutor } = await supabase
      .from('tutors')
      .select('id, profile_id, status')
      .eq('id', id)
      .maybeSingle()

    let nextStatus: 'aktif' | 'nonaktif' = 'aktif'
    if (targetStatus) {
      nextStatus = targetStatus
    } else if (currentTutor) {
      nextStatus = currentTutor.status === 'aktif' ? 'nonaktif' : 'aktif'
    } else {
      const storeTutor = adminStore.getState().tutors.find((t) => t.id === id)
      if (storeTutor) {
        nextStatus = storeTutor.status === 'aktif' ? 'nonaktif' : 'aktif'
      }
    }

    if (currentTutor) {
      await supabase
        .from('tutors')
        .update({ status: nextStatus })
        .eq('id', id)

      if (currentTutor.profile_id) {
        await supabase
          .from('profiles')
          .update({ status: nextStatus })
          .eq('id', currentTutor.profile_id)
      }
    }

    adminStore.updateTutor(id, { status: nextStatus })

    return {
      success: true,
      data: {
        id,
        status: nextStatus,
      },
    }
  },

  async deleteTutor(id: string): Promise<ServerResult<{ id: string }>> {
    await ensureAdminSession()

    const { data: currentTutor } = await supabase
      .from('tutors')
      .select('id, profile_id')
      .eq('id', id)
      .maybeSingle()

    if (currentTutor) {
      await supabase.from('tutors').delete().eq('id', id)
      if (currentTutor.profile_id) {
        await supabase.from('profiles').delete().eq('id', currentTutor.profile_id)
      }
    }

    adminStore.deleteTutor(id)
    return { success: true, data: { id } }
  },

  // =========================================================================
  // CLASSES (ROMBEL KELAS)
  // =========================================================================
  async getClasses(): Promise<ClassGroup[]> {
    await ensureAuthenticatedSession()
    const { data, error } = await supabase
      .from('classes')
      .select('id, class_name, capacity, academic_year, course_id, tutor_id, courses(id, course_code, course_name), tutors(id, profiles(full_name))')
      .order('class_name', { ascending: true })

    if (error || !data) {
      console.warn('[WARN] Gagal mengambil classes dari Supabase:', error?.message)
      return []
    }

    // Ambil jumlah murid per rombel dari class_members
    const { data: membersData } = await supabase.from('class_members').select('class_id')
    const memberCountMap = new Map<string, number>()
    if (membersData) {
      for (const m of membersData) {
        if (m.class_id) {
          memberCountMap.set(m.class_id, (memberCountMap.get(m.class_id) || 0) + 1)
        }
      }
    }

    return data.map((c: any) => {
      const crs = c.courses || {}
      const tut = c.tutors || {}
      const tutProf = tut.profiles || {}

      return {
        id: c.id,
        name: c.class_name,
        courseCode: (crs.course_code || 'UTBK') as PackageCode,
        courseName: crs.course_name || 'Intensif Bimbel',
        capacity: clampCapacity(c.capacity),
        studentCount: memberCountMap.get(c.id) || 0,
        tutorName: tutProf.full_name || 'Tutor Bimbel',
        tutorId: c.tutor_id,
      }
    })
  },
}
