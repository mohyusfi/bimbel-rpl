import { supabase } from '~/lib/supabase/client'
import type { Registration, PackageCode } from '~/lib/admin-store'
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
      console.warn('⚠️ Gagal mengambil registrations dari Supabase:', error?.message)
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
   * Mendaftarkan calon siswa baru dan mengembalikan nomor tiket
   */
  async createRegistration(input: CreateRegistrationInput): Promise<ServerResult<Registration>> {
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
        console.warn('⚠️ Gagal memasukkan siswa ke class_members:', memberInsertErr.message)
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
      console.warn('⚠️ Gagal update status registrasi:', updateRegErr.message)
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
}
