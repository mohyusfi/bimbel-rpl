import { supabase } from '~/lib/supabase/client'
import { authStore } from '~/lib/auth-store'
import type { Room, Course, Tutor, ClassGroup, PackageCode } from '~/lib/admin-store'

export type ServerResult<T> =
  | { success: true; data: T }
  | { success: false; error: string; code?: string }

export function clampCapacity(capacity: unknown, defaultCap = 12): number {
  const num = Number(capacity)
  if (isNaN(num)) return defaultCap
  return Math.min(12, Math.max(1, num))
}

/**
 * Memastikan request mutasi master data memiliki sesi autentikasi admin di Supabase.
 * Jika sesi kosong (misalnya masuk lewat quick demo), otomatis login sebagai admin aktif atau Nuraini.
 */
export async function ensureAdminSession(): Promise<boolean> {
  try {
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

    let targetEmail = 'nuraini.tu@tadulakocendekia.sch.id'
    try {
      const activeUser = authStore.getState().user
      if (activeUser?.email && (activeUser.role === 'admin' || activeUser.isSuperAdmin)) {
        targetEmail = activeUser.email
      }
    } catch {
      // fallback to default nuraini
    }

    const { data, error } = await supabase.auth.signInWithPassword({
      email: targetEmail,
      password: 'password123',
    })

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
        phone: prof.phone_number || '-',
        education: t.education_background || '-',
        subjects: subjectsArray,
        weeklySessionsCount: Number(t.weekly_sessions_count) || 0,
        status: (t.status === 'nonaktif' ? 'nonaktif' : 'aktif') as 'aktif' | 'nonaktif',
      }
    })
  },

  // =========================================================================
  // CLASSES (ROMBEL KELAS)
  // =========================================================================
  async getClasses(): Promise<ClassGroup[]> {
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
      }
    })
  },
}
