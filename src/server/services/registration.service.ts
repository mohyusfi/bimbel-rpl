import { supabase } from '~/lib/supabase/client'
import type { Registration, PackageCode, Student } from '~/lib/admin-store'
import { clampCapacity, ensureAdminSession } from './master-data.service'

export { clampCapacity }

export type ServerResult<T> =
  | { success: true; data: T }
  | { success: false; error: string; code?: string }

export function generateRegistrationNumber(sequence: number): string {
  const now = new Date()
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const seq = String(sequence).padStart(4, '0')
  return `REG-${year}${month}-${seq}`
}

export function generateStudentNis(sequence: number, year = 2026): string {
  const seq = String(sequence).padStart(3, '0')
  return `TC-${year}-${seq}`
}

export function validateClassCapacityForTransfer(
  currentCount: number,
  capacityLimit = 12,
  className = 'Rombel'
): { valid: boolean; error?: string } {
  const max = Math.min(12, clampCapacity(capacityLimit))
  if (currentCount >= max) {
    return {
      valid: false,
      error: `Rombel ${className} sudah penuh (${currentCount}/${max} siswa). Batas maksimal adalah ${max} siswa.`,
    }
  }
  return { valid: true }
}

export interface EmailValidationResult {
  available: boolean
  error?: string
}

export function validateEmailFormat(email: string): boolean {
  if (!email || typeof email !== 'string') return false
  const trimmed = email.trim()
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return re.test(trimmed)
}

export async function validateStudentEmailAvailability(
  studentEmail: string,
  parentEmail?: string,
  options?: {
    existingStudents?: Array<{ email: string; status: 'aktif' | 'nonaktif' }>
    existingRegistrations?: Array<{ studentEmail: string; status: 'menunggu' | 'terverifikasi' | 'ditolak' }>
  }
): Promise<EmailValidationResult> {
  const cleanStudentEmail = studentEmail?.trim().toLowerCase()
  const cleanParentEmail = parentEmail?.trim().toLowerCase()

  if (!cleanStudentEmail || !validateEmailFormat(cleanStudentEmail)) {
    return { available: false, error: 'Format email siswa tidak valid.' }
  }

  if (cleanParentEmail && !validateEmailFormat(cleanParentEmail)) {
    return { available: false, error: 'Format email orang tua / wali tidak valid.' }
  }

  if (cleanParentEmail && cleanStudentEmail === cleanParentEmail) {
    return {
      available: false,
      error: 'Email siswa dan email orang tua tidak boleh sama. Gunakan email berbeda untuk masing-masing peran.',
    }
  }

  // 1. Cek apakah sudah terdaftar di data siswa
  let studentsToCheck = options?.existingStudents
  if (!studentsToCheck) {
    try {
      const dbStudents = await registrationService.getStudents()
      studentsToCheck = dbStudents.map((s) => ({
        email: s.email,
        status: s.status,
      }))
    } catch {
      studentsToCheck = []
    }
  }

  const existingStudent = studentsToCheck.find(
    (s) => s.email?.trim().toLowerCase() === cleanStudentEmail
  )

  if (existingStudent) {
    if (existingStudent.status === 'nonaktif') {
      return {
        available: false,
        error: 'Email ini tercatat sebagai siswa nonaktif di Tadulako Cendekia. Silakan hubungi staf Tata Usaha untuk pengaktifan kembali.',
      }
    }
    return {
      available: false,
      error: 'Email ini telah terdaftar sebagai siswa aktif di Tadulako Cendekia.',
    }
  }

  // 2. Cek apakah ada antrean pendaftaran
  let registrationsToCheck = options?.existingRegistrations
  if (!registrationsToCheck) {
    try {
      const dbRegistrations = await registrationService.getRegistrations()
      registrationsToCheck = dbRegistrations.map((r) => ({
        studentEmail: r.studentEmail,
        status: r.status,
      }))
    } catch {
      registrationsToCheck = []
    }
  }

  const existingReg = registrationsToCheck.find(
    (r) => r.studentEmail?.trim().toLowerCase() === cleanStudentEmail
  )

  if (existingReg) {
    if (existingReg.status === 'menunggu') {
      return {
        available: false,
        error: 'Email calon siswa ini sedang menunggu verifikasi oleh Tata Usaha. Mohon tunggu proses validasi.',
      }
    }
    if (existingReg.status === 'terverifikasi') {
      return {
        available: false,
        error: 'Email ini telah terdaftar dan terverifikasi di Tadulako Cendekia.',
      }
    }
    // Jika 'ditolak', siswa diizinkan mendaftar kembali
  }

  return { available: true }
}

export interface UpdateStudentInput {
  id: string
  name: string
  email: string
  phone: string
  school: string
  classId: string
  parentName: string
  parentPhone: string
  parentEmail?: string
  parentJob?: string
  parentAddress?: string
  status: 'aktif' | 'nonaktif'
}

export interface CreateStudentInput {
  name: string
  email: string
  phone: string
  school: string
  packageCode: PackageCode
  classId: string
  parentName: string
  parentPhone: string
  parentEmail?: string
  parentJob?: string
  parentAddress?: string
}

export interface StudentDetail extends Student {
  classDetails?: {
    id: string
    name: string
    capacity: number
    currentStudents: number
    tutorName?: string
  }
  schedules?: Array<{
    id: string
    subjectName: string
    tutorName: string
    roomName: string
    dayOfWeek: string
    startTime: string
    endTime: string
  }>
}

interface DbClassRow {
  id: string
  class_name: string
  capacity: number
  courses?: { course_code?: string | null } | null
}

interface DbScheduleRow {
  id: string
  subject_name: string | null
  day_of_week: string
  start_time: string | null
  end_time: string | null
  rooms?: { name?: string | null } | null
  tutors?: {
    profiles?: {
      full_name?: string | null
    } | null
  } | null
}

interface DbStudentRelationRow {
  id: string
  nis: string
  origin_school: string | null
  grade_level: string
  status: string
  created_at: string | null
  profiles?: {
    id?: string
    full_name?: string | null
    email?: string | null
    phone_number?: string | null
  } | null
  parents?: {
    id?: string
    occupation?: string | null
    address?: string | null
    profiles?: {
      full_name?: string | null
      email?: string | null
      phone_number?: string | null
    } | null
  } | null
  class_members?: Array<{
    class_id?: string
    classes?: {
      id?: string
      class_name?: string | null
      capacity?: number | null
      courses?: { course_code?: string | null } | null
      tutors?: {
        profiles?: { full_name?: string | null } | null
      } | null
    } | null
  }> | null
}

export interface CreateRegistrationInput {
  studentName: string
  studentEmail: string
  studentPhone: string
  studentSchool: string
  packageCode: PackageCode
  packageName: string
  parentName: string
  parentEmail?: string
  parentPhone: string
  parentJob?: string
  parentAddress?: string
}

export const registrationService = {
  /**
   * Mengambil semua data pendaftaran calon siswa dari Supabase
   */
  async getRegistrations(): Promise<Registration[]> {
    const { data, error } = await supabase
      .from('registrations')
      .select('*')
      .order('created_at', { ascending: false })

    if (error || !data) {
      console.warn('[WARN] Gagal mengambil registrations dari Supabase:', error?.message)
      return []
    }

    return data.map((r: any) => ({
      id: r.id,
      registrationNumber: r.registration_number || undefined,
      studentName: r.student_name,
      studentEmail: r.student_email,
      studentPhone: r.student_phone,
      studentSchool: r.student_school,
      packageCode: r.package_code as PackageCode,
      packageName: r.package_name,
      parentName: r.parent_name,
      parentEmail: r.parent_email || undefined,
      parentPhone: r.parent_phone,
      parentJob: r.parent_job || undefined,
      parentAddress: r.parent_address || undefined,
      status: (r.status as 'menunggu' | 'terverifikasi' | 'ditolak') || 'menunggu',
      rejectedReason: r.rejected_reason || undefined,
      assignedClassId: r.assigned_class_id || undefined,
      createdAt: r.created_at,
    }))
  },

  /**
   * Mengambil data seluruh siswa dari Supabase beserta relasi profil, wali, dan rombel kelas
   */
  async getStudents(): Promise<Student[]> {
    const { data, error } = await supabase
      .from('students')
      .select(`
        id,
        nis,
        origin_school,
        grade_level,
        status,
        created_at,
        profiles:profile_id (
          id,
          full_name,
          email,
          phone_number
        ),
        parents:parent_id (
          id,
          occupation,
          address,
          profiles:profile_id (
            full_name,
            email,
            phone_number
          )
        ),
        class_members (
          class_id,
          classes:class_id (
            id,
            class_name,
            courses:course_id (
              course_code
            )
          )
        )
      `)
      .order('nis', { ascending: true })

    if (error || !data) {
      console.warn('[WARN] Gagal mengambil students dari Supabase:', error?.message)
      return []
    }

    return data.map((s: any) => {
      const studentProfile = s.profiles || {}
      const parentRecord = s.parents || {}
      const parentProfile = parentRecord.profiles || {}
      const firstMember = s.class_members?.[0] || {}
      const classRecord = firstMember.classes || {}
      const courseRecord = classRecord.courses || {}

      const packageCode =
        (courseRecord.course_code as PackageCode) ||
        (s.grade_level === 'SMA' ? 'UTBK' : (s.grade_level as PackageCode)) ||
        'UTBK'

      return {
        id: s.id,
        nis: s.nis,
        name: studentProfile.full_name || 'Siswa Bimbel',
        email: studentProfile.email || '',
        phone: studentProfile.phone_number || '',
        school: s.origin_school || 'Sekolah di Kota Palu',
        packageCode,
        classId: firstMember.class_id || '',
        className: classRecord.class_name || 'Rombel Bimbingan',
        parentName: parentProfile.full_name || 'Wali Murid',
        parentPhone: parentProfile.phone_number || '',
        parentEmail: parentProfile.email || undefined,
        parentJob: parentRecord.occupation || undefined,
        parentAddress: parentRecord.address || undefined,
        joinDate: s.created_at
          ? new Intl.DateTimeFormat('id-ID', {
              day: 'numeric',
              month: 'long',
              year: 'numeric',
            }).format(new Date(s.created_at))
          : 'Oktober 2026',
        status: (s.status as 'aktif' | 'nonaktif') || 'aktif',
      }
    })
  },

  /**
   * Mendaftarkan calon siswa baru dan mengembalikan nomor tiket
   */
  async createRegistration(input: CreateRegistrationInput): Promise<ServerResult<Registration>> {
    // 0. Validasi keunikan email siswa & relasi orang tua
    const emailValidation = await validateStudentEmailAvailability(
      input.studentEmail,
      input.parentEmail
    )
    if (!emailValidation.available) {
      return {
        success: false,
        error: emailValidation.error || 'Pendaftaran ditolak karena email sudah terdaftar.',
      }
    }

    // 1. Hitung total registrasi untuk sequence nomor tiket
    const { count, error: countErr } = await supabase
      .from('registrations')
      .select('id', { count: 'exact', head: true })

    const nextSeq = (count ?? 0) + 1
    const registrationNumber = generateRegistrationNumber(nextSeq)

    const payload = {
      registration_number: registrationNumber,
      student_name: input.studentName.trim(),
      student_email: input.studentEmail.trim(),
      student_phone: input.studentPhone.trim(),
      student_school: input.studentSchool.trim(),
      package_code: input.packageCode,
      package_name: input.packageName.trim(),
      parent_name: input.parentName.trim(),
      parent_email: input.parentEmail?.trim() || null,
      parent_phone: input.parentPhone.trim(),
      parent_job: input.parentJob?.trim() || null,
      parent_address: input.parentAddress?.trim() || 'Kota Palu',
      status: 'menunggu',
    }

    const { data, error } = await supabase
      .from('registrations')
      .insert([payload])
      .select()
      .single()

    if (error || !data) {
      return {
        success: false,
        error: error?.message || 'Gagal menyimpan data pendaftaran ke database',
      }
    }

    return {
      success: true,
      data: {
        id: data.id,
        registrationNumber: data.registration_number,
        studentName: data.student_name,
        studentEmail: data.student_email,
        studentPhone: data.student_phone,
        studentSchool: data.student_school,
        packageCode: data.package_code as PackageCode,
        packageName: data.package_name,
        parentName: data.parent_name,
        parentEmail: data.parent_email || undefined,
        parentPhone: data.parent_phone,
        parentJob: data.parent_job || undefined,
        parentAddress: data.parent_address || undefined,
        status: data.status,
        createdAt: data.created_at,
      },
    }
  },

  /**
   * Verifikasi pendaftaran calon siswa dan plotting rombel kelas
   * Menegakkan batas maksimal 12 siswa per rombel
   */
  async approveRegistration(
    regId: string,
    classId: string
  ): Promise<ServerResult<{ studentId: string; nis: string; classId: string }>> {
    await ensureAdminSession()

    // 1. Ambil data kelas target untuk validasi kuota
    // Dukung pencarian baik berdasarkan UUID database maupun ID lokal 'cls-X'
    let targetClass: { id: string; class_name: string; capacity: number } | null = null

    const { data: dbClasses } = await supabase.from('classes').select('id, class_name, capacity')
    if (dbClasses && dbClasses.length > 0) {
      targetClass = dbClasses.find((c: any) => c.id === classId) || null
      // Jika classId berasal dari local store misal 'cls-1', cocokkan berdasarkan nama
      if (!targetClass) {
        const clsMapping: Record<string, string> = {
          'cls-1': 'UTBK Intensif A',
          'cls-2': 'UTBK Intensif B',
          'cls-3': 'SMA IPA 1',
          'cls-4': 'SMP Prestasi A',
          'cls-5': 'SD Cendekia A',
        }
        const mappedName = clsMapping[classId]
        if (mappedName) {
          targetClass = dbClasses.find((c: any) => c.class_name.toLowerCase() === mappedName.toLowerCase()) || null
        }
      }
    }

    if (!targetClass) {
      // Cek apakah query langsung by ID berhasil
      const { data: directClass } = await supabase
        .from('classes')
        .select('id, class_name, capacity')
        .eq('id', classId)
        .maybeSingle()

      if (directClass) {
        targetClass = directClass
      }
    }

    if (!targetClass) {
      return { success: false, error: 'Kelas rombel tujuan tidak ditemukan.' }
    }

    const resolvedClassId = targetClass.id
    const maxCapacity = Math.min(12, clampCapacity(targetClass.capacity || 12))

    // 2. Cek jumlah siswa yang sudah ada di class_members
    const { count: currentMembersCount } = await supabase
      .from('class_members')
      .select('id', { count: 'exact', head: true })
      .eq('class_id', resolvedClassId)

    const currentCount = currentMembersCount ?? 0
    if (currentCount >= maxCapacity) {
      return {
        success: false,
        error: `Rombel ${targetClass.class_name} sudah penuh (${currentCount}/${maxCapacity} siswa). Batas maksimal adalah 12 siswa.`,
      }
    }

    // 3. Ambil data registrasi
    const { data: reg, error: regErr } = await supabase
      .from('registrations')
      .select('*')
      .eq('id', regId)
      .single()

    if (regErr || !reg) {
      return { success: false, error: 'Data registrasi tidak ditemukan.' }
    }

    // 4. Hitung total siswa untuk generate NIS
    const { count: studentCount } = await supabase
      .from('students')
      .select('id', { count: 'exact', head: true })

    const nisSeq = String((studentCount ?? 0) + 1).padStart(3, '0')
    const nis = `TC-2026-${nisSeq}`

    // 5. Cek atau buat profile siswa
    let studentProfileId = ''
    const { data: existingStudentProfile } = await supabase
      .from('profiles')
      .select('id')
      .eq('email', reg.student_email.trim().toLowerCase())
      .maybeSingle()

    if (existingStudentProfile) {
      studentProfileId = existingStudentProfile.id
    } else {
      const generatedProfileId = crypto.randomUUID()
      const { data: newProfile, error: profErr } = await supabase
        .from('profiles')
        .insert([{
          id: generatedProfileId,
          full_name: reg.student_name,
          email: reg.student_email.trim().toLowerCase(),
          phone_number: reg.student_phone,
          role: 'student',
          status: 'aktif',
        }])
        .select('id')
        .single()

      if (profErr || !newProfile) {
        return { success: false, error: profErr?.message || 'Gagal membuat profil siswa' }
      }
      studentProfileId = newProfile.id
    }

    // 6. Cek atau buat profil orang tua
    let parentId: string | null = null
    const parentEmail = reg.parent_email?.trim().toLowerCase() || `${reg.student_email.split('@')[0]}.wali@tadulakocendekia.sch.id`

    const { data: existingParentProfile } = await supabase
      .from('profiles')
      .select('id, parents(id)')
      .eq('email', parentEmail)
      .maybeSingle()

    if (existingParentProfile) {
      const parentRecord = (existingParentProfile as any).parents?.[0]
      if (parentRecord) {
        parentId = parentRecord.id
      }
    } else {
      const parentProfileId = crypto.randomUUID()
      const { data: newParentProfile } = await supabase
        .from('profiles')
        .insert([{
          id: parentProfileId,
          full_name: reg.parent_name,
          email: parentEmail,
          phone_number: reg.parent_phone,
          role: 'parent',
          status: 'aktif',
        }])
        .select('id')
        .single()

      if (newParentProfile) {
        const parentRecordId = crypto.randomUUID()
        const { data: newParent } = await supabase
          .from('parents')
          .insert([{
            id: parentRecordId,
            profile_id: newParentProfile.id,
            occupation: reg.parent_job || 'Wali Murid',
            address: reg.parent_address || 'Kota Palu',
            phone_number: reg.parent_phone,
          }])
          .select('id')
          .single()

        if (newParent) parentId = newParent.id
      }
    }

    // 7. Insert ke tabel students jika belum ada
    let studentId = ''
    const { data: existingStudent } = await supabase
      .from('students')
      .select('id')
      .eq('profile_id', studentProfileId)
      .maybeSingle()

    if (existingStudent) {
      studentId = existingStudent.id
      // Update class_id dan parent_id jika diperlukan
      await supabase
        .from('students')
        .update({ class_id: resolvedClassId, parent_id: parentId })
        .eq('id', studentId)
    } else {
      const generatedStudentId = crypto.randomUUID()
      const { data: newStudent, error: studErr } = await supabase
        .from('students')
        .insert([{
          id: generatedStudentId,
          profile_id: studentProfileId,
          parent_id: parentId,
          nis,
          origin_school: reg.student_school,
          grade_level: reg.package_code === 'UTBK' ? 'SMA' : reg.package_code,
          status: 'aktif',
          class_id: resolvedClassId,
        }])
        .select('id')
        .single()

      if (studErr || !newStudent) {
        return { success: false, error: studErr?.message || 'Gagal membuat data siswa' }
      }
      studentId = newStudent.id
    }

    // 8. Tambahkan ke class_members (hindari duplikasi)
    const { data: existingMember } = await supabase
      .from('class_members')
      .select('id')
      .eq('class_id', resolvedClassId)
      .eq('student_id', studentId)
      .maybeSingle()

    if (!existingMember) {
      const memberId = crypto.randomUUID()
      const { error: memberInsertErr } = await supabase
        .from('class_members')
        .insert([{
          id: memberId,
          class_id: resolvedClassId,
          student_id: studentId,
        }])

      if (memberInsertErr) {
        console.warn('[WARN] Gagal memasukkan siswa ke class_members:', memberInsertErr.message)
      }
    }

    // 9. Update status pendaftaran menjadi 'terverifikasi'
    const { error: updateRegErr } = await supabase
      .from('registrations')
      .update({
        status: 'terverifikasi',
        assigned_class_id: resolvedClassId,
        updated_at: new Date().toISOString(),
      })
      .eq('id', regId)

    if (updateRegErr) {
      console.warn('[WARN] Gagal update status registrasi:', updateRegErr.message)
    }

    return {
      success: true,
      data: {
        studentId,
        nis,
        classId: resolvedClassId,
      },
    }
  },

  /**
   * Menolak pendaftaran dengan mencatat alasan penolakan
   */
  async rejectRegistration(regId: string, reason: string): Promise<ServerResult<boolean>> {
    const { error } = await supabase
      .from('registrations')
      .update({
        status: 'ditolak',
        rejected_reason: reason.trim(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', regId)

    if (error) {
      return { success: false, error: error.message }
    }

    return { success: true, data: true }
  },

  /**
   * Memperbarui data siswa, kontak orang tua, dan mutasi rombel kelas
   */
  async updateStudent(input: UpdateStudentInput): Promise<ServerResult<Student>> {
    await ensureAdminSession()

    // 1. Ambil data siswa yang akan diupdate (dukung UUID maupun ID mock 'stu-X')
    let studentRecord: {
      id: string
      profile_id: string
      parent_id: string | null
      class_id: string | null
      grade_level: string
      nis: string
      created_at: string | null
    } | null = null

    const { data: directStudent } = await supabase
      .from('students')
      .select('id, profile_id, parent_id, class_id, grade_level, nis, created_at')
      .eq('id', input.id)
      .maybeSingle()

    if (directStudent) {
      studentRecord = directStudent
    } else if (input.id.startsWith('stu-')) {
      const seq = input.id.replace('stu-', '').padStart(3, '0')
      const targetNis = `TC-2026-${seq}`
      const { data: nisStudent } = await supabase
        .from('students')
        .select('id, profile_id, parent_id, class_id, grade_level, nis, created_at')
        .eq('nis', targetNis)
        .maybeSingle()

      if (nisStudent) {
        studentRecord = nisStudent
      }
    }

    if (!studentRecord) {
      return { success: false, error: 'Data siswa tidak ditemukan di database.' }
    }

    // 2. Update profil siswa di tabel profiles
    if (studentRecord.profile_id) {
      const { error: spErr } = await supabase
        .from('profiles')
        .update({
          full_name: input.name.trim(),
          email: input.email.trim().toLowerCase(),
          phone_number: input.phone.trim(),
          status: input.status,
          updated_at: new Date().toISOString(),
        })
        .eq('id', studentRecord.profile_id)

      if (spErr) {
        console.warn('[WARN] Gagal update profil siswa:', spErr.message)
      }
    }

    // 3. Update data orang tua di tabel parents & profiles
    if (studentRecord.parent_id) {
      await supabase
        .from('parents')
        .update({
          occupation: input.parentJob?.trim() || null,
          address: input.parentAddress?.trim() || null,
          phone_number: input.parentPhone.trim(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', studentRecord.parent_id)

      const { data: parentRecord } = await supabase
        .from('parents')
        .select('profile_id')
        .eq('id', studentRecord.parent_id)
        .maybeSingle()

      if (parentRecord?.profile_id) {
        const parentProfileUpdates: Record<string, string> = {
          full_name: input.parentName.trim(),
          phone_number: input.parentPhone.trim(),
          updated_at: new Date().toISOString(),
        }
        if (input.parentEmail?.trim()) {
          parentProfileUpdates.email = input.parentEmail.trim().toLowerCase()
        }
        await supabase
          .from('profiles')
          .update(parentProfileUpdates)
          .eq('id', parentRecord.profile_id)
      }
    }

    // 4. Cek perubahan kelas / mutasi rombel
    let currentClassId = studentRecord.class_id
    let updatedPackageCode: PackageCode =
      (studentRecord.grade_level === 'SMA' ? 'UTBK' : (studentRecord.grade_level as PackageCode)) || 'UTBK'
    let resolvedClassName = 'Rombel Bimbingan'

    // Ambil info semua kelas untuk resolusi
    const { data: dbClasses } = await supabase
      .from('classes')
      .select('id, class_name, capacity, courses:course_id(course_code)')

    const typedClasses = (dbClasses as unknown as DbClassRow[] | null) || []

    if (input.classId && input.classId !== currentClassId) {
      let targetClass: DbClassRow | null = typedClasses.find((c) => c.id === input.classId) || null
      if (!targetClass && typedClasses.length > 0) {
        const clsMapping: Record<string, string> = {
          'cls-1': 'UTBK Intensif A',
          'cls-2': 'UTBK Intensif B',
          'cls-3': 'SMA IPA 1',
          'cls-4': 'SMP Prestasi A',
          'cls-5': 'SD Cendekia A',
        }
        const mapped = clsMapping[input.classId]
        if (mapped) {
          targetClass = typedClasses.find((c) => c.class_name.toLowerCase() === mapped.toLowerCase()) || null
        }
      }

      if (!targetClass) {
        return { success: false, error: 'Kelas rombel tujuan mutasi tidak ditemukan.' }
      }

      // Validasi kuota rombel tujuan (maksimal 12 siswa)
      const { count: memberCount } = await supabase
        .from('class_members')
        .select('id', { count: 'exact', head: true })
        .eq('class_id', targetClass.id)

      const capacityCheck = validateClassCapacityForTransfer(
        memberCount ?? 0,
        targetClass.capacity || 12,
        targetClass.class_name
      )
      if (!capacityCheck.valid) {
        return { success: false, error: capacityCheck.error! }
      }

      // Hapus keanggotaan kelas lama dan daftarkan ke kelas baru
      await supabase
        .from('class_members')
        .delete()
        .eq('student_id', studentRecord.id)

      await supabase
        .from('class_members')
        .insert([{
          id: crypto.randomUUID(),
          class_id: targetClass.id,
          student_id: studentRecord.id,
          joined_at: new Date().toISOString(),
        }])

      currentClassId = targetClass.id
      resolvedClassName = targetClass.class_name
      const courseCode = targetClass.courses?.course_code as PackageCode
      if (courseCode) {
        updatedPackageCode = courseCode
      }
    } else if (currentClassId && typedClasses.length > 0) {
      const existingCls = typedClasses.find((c) => c.id === currentClassId)
      if (existingCls) {
        resolvedClassName = existingCls.class_name
      }
    }

    // 5. Update tabel students
    const gradeLevel = updatedPackageCode === 'UTBK' ? 'SMA' : updatedPackageCode
    const { error: finalStudErr } = await supabase
      .from('students')
      .update({
        origin_school: input.school.trim(),
        status: input.status,
        class_id: currentClassId,
        grade_level: gradeLevel,
      })
      .eq('id', studentRecord.id)

    if (finalStudErr) {
      return { success: false, error: finalStudErr.message }
    }

    const updatedResult: Student = {
      id: studentRecord.id,
      nis: studentRecord.nis,
      name: input.name.trim(),
      email: input.email.trim().toLowerCase(),
      phone: input.phone.trim(),
      school: input.school.trim(),
      packageCode: updatedPackageCode,
      classId: currentClassId || '',
      className: resolvedClassName,
      parentName: input.parentName.trim(),
      parentPhone: input.parentPhone.trim(),
      parentEmail: input.parentEmail?.trim() || undefined,
      parentJob: input.parentJob?.trim() || undefined,
      parentAddress: input.parentAddress?.trim() || undefined,
      joinDate: studentRecord.created_at
        ? new Intl.DateTimeFormat('id-ID', {
            day: 'numeric',
            month: 'long',
            year: 'numeric',
          }).format(new Date(studentRecord.created_at))
        : 'Oktober 2026',
      status: input.status,
    }

    return { success: true, data: updatedResult }
  },

  /**
   * Mendaftarkan siswa & wali baru langsung ke Supabase
   */
  async createStudent(input: CreateStudentInput): Promise<ServerResult<Student>> {
    await ensureAdminSession()

    // 1. Validasi rombel kelas
    const { data: dbClasses } = await supabase
      .from('classes')
      .select('id, class_name, capacity, courses:course_id(course_code)')

    const typedClasses = (dbClasses as unknown as DbClassRow[] | null) || []
    let targetClass: DbClassRow | null = typedClasses.find((c) => c.id === input.classId) || null
    if (!targetClass && typedClasses.length > 0) {
      const clsMapping: Record<string, string> = {
        'cls-1': 'UTBK Intensif A',
        'cls-2': 'UTBK Intensif B',
        'cls-3': 'SMA IPA 1',
        'cls-4': 'SMP Prestasi A',
        'cls-5': 'SD Cendekia A',
      }
      const mapped = clsMapping[input.classId]
      if (mapped) {
        targetClass = typedClasses.find((c) => c.class_name.toLowerCase() === mapped.toLowerCase()) || null
      }
    }

    if (!targetClass) {
      return { success: false, error: 'Rombel kelas tujuan tidak ditemukan.' }
    }

    // 2. Cek kuota rombel kelas
    const { count: memberCount } = await supabase
      .from('class_members')
      .select('id', { count: 'exact', head: true })
      .eq('class_id', targetClass.id)

    const capacityCheck = validateClassCapacityForTransfer(
      memberCount ?? 0,
      targetClass.capacity || 12,
      targetClass.class_name
    )
    if (!capacityCheck.valid) {
      return { success: false, error: capacityCheck.error! }
    }

    // 3. Generate sequential NIS
    const { count: totalStudents } = await supabase
      .from('students')
      .select('id', { count: 'exact', head: true })

    const nis = generateStudentNis((totalStudents ?? 0) + 1)

    // 4. Buat profil siswa
    const studentProfileId = crypto.randomUUID()
    const { error: spErr } = await supabase
      .from('profiles')
      .insert([{
        id: studentProfileId,
        full_name: input.name.trim(),
        email: input.email.trim().toLowerCase(),
        phone_number: input.phone.trim(),
        role: 'student',
        status: 'aktif',
      }])

    if (spErr) {
      return { success: false, error: spErr.message }
    }

    // 5. Buat profil & entri orang tua
    const parentProfileId = crypto.randomUUID()
    const parentEmail =
      input.parentEmail?.trim().toLowerCase() ||
      `${input.email.split('@')[0]}.wali@tadulakocendekia.sch.id`

    await supabase
      .from('profiles')
      .insert([{
        id: parentProfileId,
        full_name: input.parentName.trim(),
        email: parentEmail,
        phone_number: input.parentPhone.trim(),
        role: 'parent',
        status: 'aktif',
      }])

    const parentRecordId = crypto.randomUUID()
    await supabase
      .from('parents')
      .insert([{
        id: parentRecordId,
        profile_id: parentProfileId,
        occupation: input.parentJob?.trim() || 'Wali Murid',
        address: input.parentAddress?.trim() || 'Kota Palu',
        phone_number: input.parentPhone.trim(),
      }])

    // 6. Buat entri siswa
    const courseCode = (targetClass.courses?.course_code as PackageCode) || input.packageCode
    const gradeLevel = courseCode === 'UTBK' ? 'SMA' : courseCode
    const studentId = crypto.randomUUID()

    const { data: newStudent, error: stErr } = await supabase
      .from('students')
      .insert([{
        id: studentId,
        profile_id: studentProfileId,
        parent_id: parentRecordId,
        nis,
        origin_school: input.school.trim(),
        grade_level: gradeLevel,
        status: 'aktif',
        class_id: targetClass.id,
      }])
      .select()
      .single()

    if (stErr || !newStudent) {
      return { success: false, error: stErr?.message || 'Gagal menyimpan data siswa.' }
    }

    // 7. Daftarkan ke class_members
    await supabase
      .from('class_members')
      .insert([{
        id: crypto.randomUUID(),
        class_id: targetClass.id,
        student_id: studentId,
      }])

    const result: Student = {
      id: studentId,
      nis,
      name: input.name.trim(),
      email: input.email.trim().toLowerCase(),
      phone: input.phone.trim(),
      school: input.school.trim(),
      packageCode: courseCode,
      classId: targetClass.id,
      className: targetClass.class_name,
      parentName: input.parentName.trim(),
      parentPhone: input.parentPhone.trim(),
      parentEmail: input.parentEmail?.trim() || undefined,
      parentJob: input.parentJob?.trim() || undefined,
      parentAddress: input.parentAddress?.trim() || undefined,
      joinDate: new Intl.DateTimeFormat('id-ID', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      }).format(new Date()),
      status: 'aktif',
    }

    return { success: true, data: result }
  },

  /**
   * Mengambil detail lengkap seorang siswa berdasarkan ID
   */
  async getStudentById(id: string): Promise<ServerResult<StudentDetail>> {
    await ensureAdminSession()

    let studentData: DbStudentRelationRow | null = null

    // 1. Coba query langsung by id (UUID)
    const { data: directData } = await supabase
      .from('students')
      .select(`
        id,
        nis,
        origin_school,
        grade_level,
        status,
        created_at,
        profiles:profile_id (
          id,
          full_name,
          email,
          phone_number
        ),
        parents:parent_id (
          id,
          occupation,
          address,
          profiles:profile_id (
            full_name,
            email,
            phone_number
          )
        ),
        class_members (
          class_id,
          classes:class_id (
            id,
            class_name,
            capacity,
            courses:course_id (
              course_code
            ),
            tutors:tutor_id (
              profiles:profile_id (
                full_name
              )
            )
          )
        )
      `)
      .eq('id', id)
      .maybeSingle()

    if (directData) {
      studentData = directData as unknown as DbStudentRelationRow
    } else if (id.startsWith('stu-')) {
      // 2. Pemetaan ID mock 'stu-X' ke NIS 'TC-2026-00X'
      const seq = id.replace('stu-', '').padStart(3, '0')
      const targetNis = `TC-2026-${seq}`
      const { data: nisData } = await supabase
        .from('students')
        .select(`
          id,
          nis,
          origin_school,
          grade_level,
          status,
          created_at,
          profiles:profile_id (
            id,
            full_name,
            email,
            phone_number
          ),
          parents:parent_id (
            id,
            occupation,
            address,
            profiles:profile_id (
              full_name,
              email,
              phone_number
            )
          ),
          class_members (
            class_id,
            classes:class_id (
              id,
              class_name,
              capacity,
              courses:course_id (
                course_code
              ),
              tutors:tutor_id (
                profiles:profile_id (
                  full_name
                )
              )
            )
          )
        `)
        .eq('nis', targetNis)
        .maybeSingle()

      if (nisData) {
        studentData = nisData as unknown as DbStudentRelationRow
      }
    }

    if (!studentData) {
      return { success: false, error: 'Siswa tidak ditemukan' }
    }

    const s = studentData
    const studentProfile = s.profiles || {}
    const parentRecord = s.parents || {}
    const parentProfile = parentRecord.profiles || {}
    const firstMember = s.class_members?.[0] || {}
    const classRecord = firstMember.classes || {}
    const courseRecord = classRecord.courses || {}
    const tutorRecord = classRecord.tutors || {}
    const tutorProfile = tutorRecord.profiles || {}

    const classId = firstMember.class_id || ''
    const className = classRecord.class_name || 'Rombel Bimbingan'

    // Ambil jumlah siswa aktif di kelas tersebut
    let currentStudentsCount = 0
    if (classId) {
      const { count } = await supabase
        .from('class_members')
        .select('id', { count: 'exact', head: true })
        .eq('class_id', classId)
      currentStudentsCount = count ?? 0
    }

    // Ambil jadwal bimbingan untuk kelas ini
    let schedulesList: StudentDetail['schedules'] = []
    if (classId) {
      const { data: dbSchedules } = await supabase
        .from('schedules')
        .select(`
          id,
          subject_name,
          day_of_week,
          start_time,
          end_time,
          rooms:room_id (name),
          tutors:tutor_id (
            profiles:profile_id (
              full_name
            )
          )
        `)
        .eq('class_id', classId)
        .order('day_of_week', { ascending: true })

      if (dbSchedules) {
        const typedSchedules = dbSchedules as unknown as DbScheduleRow[]
        schedulesList = typedSchedules.map((sch) => ({
          id: sch.id,
          subjectName: sch.subject_name || 'Mata Pelajaran',
          tutorName: sch.tutors?.profiles?.full_name || 'Tutor Bimbel',
          roomName: sch.rooms?.name || 'Ruang Belajar',
          dayOfWeek: sch.day_of_week,
          startTime: sch.start_time?.slice(0, 5) || '',
          endTime: sch.end_time?.slice(0, 5) || '',
        }))
      }
    }

    const packageCode =
      (courseRecord.course_code as PackageCode) ||
      (s.grade_level === 'SMA' ? 'UTBK' : (s.grade_level as PackageCode)) ||
      'UTBK'

    const studentDetail: StudentDetail = {
      id: s.id,
      nis: s.nis,
      name: studentProfile.full_name || 'Siswa Bimbel',
      email: studentProfile.email || '',
      phone: studentProfile.phone_number || '',
      school: s.origin_school || 'Sekolah di Kota Palu',
      packageCode,
      classId,
      className,
      parentName: parentProfile.full_name || 'Wali Murid',
      parentPhone: parentProfile.phone_number || '',
      parentEmail: parentProfile.email || undefined,
      parentJob: parentRecord.occupation || undefined,
      parentAddress: parentRecord.address || undefined,
      joinDate: s.created_at
        ? new Intl.DateTimeFormat('id-ID', {
            day: 'numeric',
            month: 'long',
            year: 'numeric',
          }).format(new Date(s.created_at))
        : 'Oktober 2026',
      status: (s.status as 'aktif' | 'nonaktif') || 'aktif',
      classDetails: classId
        ? {
            id: classId,
            name: className,
            capacity: classRecord.capacity || 12,
            currentStudents: currentStudentsCount,
            tutorName: tutorProfile.full_name || undefined,
          }
        : undefined,
      schedules: schedulesList,
    }

    return { success: true, data: studentDetail }
  },
}
