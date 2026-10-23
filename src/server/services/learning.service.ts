import { supabase } from '~/lib/supabase/client'
import { ensureAdminSession } from './master-data.service'
import {
  validateMaterialFormat,
  validateMaterialFileSize,
  formatBytesToReadable,
} from '~/lib/materials-validator'
import type { LearningMaterial, GradeRecord } from '~/lib/admin-store'

export type ServerResult<T> =
  | { success: true; data: T }
  | { success: false; error: string; code?: string }

export interface UploadMaterialInput {
  file?: File | Blob | null
  classId: string
  tutorId?: string
  title: string
  description?: string
  category: string
  fileType: 'PDF' | 'PPTX'
  fileSize?: string
  fileUrl?: string
  storagePath?: string
}

export interface SaveGradeInput {
  studentId: string
  classId: string
  tutorId?: string
  subjectName: string
  assessmentTitle: string
  category: 'Try Out' | 'Kuis' | 'Tugas'
  score: number
  classAverage?: number
  tutorFeedback?: string
  assessmentDate?: string
}

interface RawMaterialRow {
  id: string
  class_id: string
  tutor_id: string | null
  title: string
  description: string | null
  category: string
  file_type: string
  file_size: string | null
  file_url: string
  storage_path: string | null
  created_at: string
  classes?: {
    class_name: string
    courses?: {
      course_name: string
      course_code: string
    } | null
  } | null
  tutors?: {
    profiles?: {
      full_name: string
    } | null
  } | null
}

interface RawGradeRow {
  id: string
  student_id: string
  class_id: string
  tutor_id: string | null
  subject_name: string
  assessment_title: string
  category: string
  score: number
  class_average: number | null
  tutor_feedback: string | null
  assessment_date: string
  created_at: string
  students?: {
    nis: string
    profiles?: {
      full_name: string
    } | null
  } | null
  classes?: {
    class_name: string
  } | null
  tutors?: {
    profiles?: {
      full_name: string
    } | null
  } | null
}

/**
 * Memetakan ID legacy (misal: 'stu-1' ke UUID riil siswa di Supabase)
 */
async function resolveStudentUUID(studentId: string): Promise<string> {
  if (!studentId) return ''
  const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(studentId)
  if (isUUID) return studentId

  if (studentId.startsWith('stu-')) {
    const seq = studentId.replace('stu-', '').padStart(3, '0')
    const targetNis = `TC-2026-${seq}`
    const { data } = await supabase
      .from('students')
      .select('id')
      .eq('nis', targetNis)
      .maybeSingle()

    if (data?.id) return data.id
  }

  // Jika tidak ditemukan, kembalikan nilai asal tanpa fallback sembarangan ke siswa lain
  return studentId
}

/**
 * Memetakan ID legacy tutor (misal: 'tut-1' ke UUID riil tutor di Supabase)
 */
async function resolveTutorUUID(tutorId?: string): Promise<string | undefined> {
  if (!tutorId) return undefined
  const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(tutorId)
  if (isUUID) return tutorId

  const { data: first } = await supabase
    .from('tutors')
    .select('id')
    .limit(1)
    .maybeSingle()

  return first?.id || tutorId
}

function mapRawMaterial(row: RawMaterialRow): LearningMaterial {
  const className = row.classes?.class_name || 'Kelas Belajar'
  const subjectName = row.classes?.courses?.course_name || 'Materi Umum'
  const tutorName = row.tutors?.profiles?.full_name || 'Pengajar'

  return {
    id: row.id,
    classId: row.class_id,
    className,
    subjectName,
    title: row.title,
    description: row.description || '',
    category: row.category,
    tutorId: row.tutor_id || '',
    tutorName,
    fileType: row.file_type === 'PPTX' ? 'PPTX' : 'PDF',
    fileSize: row.file_size || '0 MB',
    fileUrl: row.file_url,
    storagePath: row.storage_path || undefined,
    storage_path: row.storage_path || undefined,
    uploadedAt: row.created_at ? row.created_at.split('T')[0] : '',
  }
}

function mapRawGrade(row: RawGradeRow): GradeRecord {
  const studentName = row.students?.profiles?.full_name || 'Siswa'
  const nis = row.students?.nis || '-'
  const className = row.classes?.class_name || 'Kelas Bimbingan'
  const tutorName = row.tutors?.profiles?.full_name || 'Pengajar'

  return {
    id: row.id,
    studentId: row.student_id,
    studentName,
    nis,
    classId: row.class_id,
    className,
    subjectName: row.subject_name,
    assessmentTitle: row.assessment_title,
    category: (row.category as 'Try Out' | 'Kuis' | 'Tugas') || 'Kuis',
    score: row.score,
    classAverage: row.class_average ?? row.score,
    tutorId: row.tutor_id || '',
    tutorName,
    tutorFeedback: row.tutor_feedback || '',
    assessmentDate: row.assessment_date,
  }
}

export const learningService = {
  // =========================================================================
  // 1. MANAJEMEN MODUL BELAJAR (MATERIALS)
  // =========================================================================

  /**
   * Mengambil seluruh modul pembelajaran dari Supabase dengan filter opsional classId atau tutorId.
   */
  async getMaterials(filters?: { classId?: string; tutorId?: string }): Promise<LearningMaterial[]> {
    await ensureAdminSession()

    let query = supabase
      .from('materials')
      .select(`
        id,
        class_id,
        tutor_id,
        title,
        description,
        category,
        file_type,
        file_size,
        file_url,
        storage_path,
        created_at,
        classes:class_id (
          class_name,
          courses:course_id (
            course_name,
            course_code
          )
        ),
        tutors:tutor_id (
          profiles:profile_id (
            full_name
          )
        )
      `)
      .order('created_at', { ascending: false })

    if (filters?.classId && filters.classId !== 'ALL') {
      query = query.eq('class_id', filters.classId)
    }

    if (filters?.tutorId) {
      const realTutorId = await resolveTutorUUID(filters.tutorId)
      if (realTutorId) {
        query = query.eq('tutor_id', realTutorId)
      }
    }

    let { data, error } = await query

    if (error) {
      // Retry sekali jika terjadi gangguan jaringan sementara
      await new Promise((resolve) => setTimeout(resolve, 300))
      const retryResult = await query
      data = retryResult.data
      error = retryResult.error
    }

    if (error) {
      console.error('[ERROR] Gagal memuat data modul pembelajaran dari Supabase:', error.message)
      return []
    }

    return (data as unknown as RawMaterialRow[] || []).map(mapRawMaterial)
  },

  async getMaterialsByClass(classId: string): Promise<LearningMaterial[]> {
    if (!classId) return []
    return this.getMaterials({ classId })
  },

  async getMaterialsByTutor(tutorId: string): Promise<LearningMaterial[]> {
    if (!tutorId) return []
    return this.getMaterials({ tutorId })
  },

  /**
   * Mengunggah modul berkas (PDF atau PPTX) ke Supabase Storage dan menyimpan metadata ke tabel materials.
   */
  async uploadMaterial(input: UploadMaterialInput): Promise<ServerResult<LearningMaterial>> {
    await ensureAdminSession()

    const { file, classId, title, description, category } = input

    if (!classId) {
      return { success: false, error: 'Kelas tujuan wajib dipilih.' }
    }

    if (!title || !title.trim()) {
      return { success: false, error: 'Judul modul belajar wajib diisi.' }
    }

    let finalFileType: 'PDF' | 'PPTX' = input.fileType || 'PDF'
    let finalFileSize = input.fileSize || '0 MB'
    let fileUrl = input.fileUrl || ''
    let storagePath = input.storagePath || ''

    // 1. Validasi berkas fisik jika diunggah
    if (file) {
      const fileName = file instanceof File ? file.name : 'modul-belajar.pdf'
      const fileSize = file.size

      // Validasi format (.pdf / .pptx)
      const formatCheck = validateMaterialFormat(fileName, file.type)
      if (!formatCheck.valid) {
        return { success: false, error: formatCheck.error || 'Format berkas tidak didukung.' }
      }
      finalFileType = formatCheck.fileType || 'PDF'

      // Validasi batas ukuran (maksimal 20 MB)
      const sizeCheck = validateMaterialFileSize(fileSize)
      if (!sizeCheck.valid) {
        return { success: false, error: sizeCheck.error || 'Ukuran berkas melebihi batas 20 MB.' }
      }
      finalFileSize = formatBytesToReadable(fileSize)

      // Upload ke Supabase Storage bucket learning-materials
      const sanitizedName = fileName.replace(/[^a-zA-Z0-9._-]/g, '_')
      const targetPath = `classes/${classId}/${Date.now()}_${sanitizedName}`
      const contentType =
        file.type ||
        (finalFileType === 'PPTX'
          ? 'application/vnd.openxmlformats-officedocument.presentationml.presentation'
          : 'application/pdf')

      const { error: uploadError } = await supabase.storage
        .from('learning-materials')
        .upload(targetPath, file, {
          contentType,
          upsert: true,
        })

      if (uploadError) {
        console.error('[ERROR] Gagal mengunggah berkas ke Supabase Storage:', uploadError.message)
        return { success: false, error: `Gagal upload berkas: ${uploadError.message}` }
      }

      const { data: publicUrlData } = supabase.storage
        .from('learning-materials')
        .getPublicUrl(targetPath)

      fileUrl = publicUrlData.publicUrl
      storagePath = targetPath
    } else if (!fileUrl) {
      return { success: false, error: 'Berkas dokumen atau URL modul wajib disertakan.' }
    }

    const realTutorId = await resolveTutorUUID(input.tutorId)

    // 2. Simpan metadata ke tabel materials
    const { data: inserted, error: insertError } = await supabase
      .from('materials')
      .insert({
        class_id: classId,
        tutor_id: realTutorId || null,
        title: title.trim(),
        description: description?.trim() || null,
        category: category || 'Modul Teori',
        file_type: finalFileType,
        file_size: finalFileSize,
        file_url: fileUrl,
        storage_path: storagePath || null,
      })
      .select(`
        id,
        class_id,
        tutor_id,
        title,
        description,
        category,
        file_type,
        file_size,
        file_url,
        storage_path,
        created_at,
        classes:class_id (
          class_name,
          courses:course_id (
            course_name,
            course_code
          )
        ),
        tutors:tutor_id (
          profiles:profile_id (
            full_name
          )
        )
      `)
      .single()

    if (insertError || !inserted) {
      console.error('[ERROR] Gagal menyimpan metadata modul ke tabel materials:', insertError?.message)
      return { success: false, error: insertError?.message || 'Gagal menyimpan data modul.' }
    }

    return {
      success: true,
      data: mapRawMaterial(inserted as unknown as RawMaterialRow),
    }
  },

  /**
   * Menghapus modul secara atomik: menghapus berkas fisik di Supabase Storage dan baris di tabel materials.
   */
  async deleteMaterial(materialId: string): Promise<ServerResult<boolean>> {
    if (!materialId) {
      return { success: false, error: 'ID materi tidak valid.' }
    }

    await ensureAdminSession()

    // 1. Dapatkan storage_path
    const { data: material } = await supabase
      .from('materials')
      .select('id, storage_path')
      .eq('id', materialId)
      .maybeSingle()

    if (material?.storage_path) {
      try {
        const { error: removeErr } = await supabase.storage
          .from('learning-materials')
          .remove([material.storage_path])
        if (removeErr) {
          console.warn('[WARN] Gagal menghapus berkas fisik dari Supabase Storage:', removeErr.message)
        }
      } catch (err) {
        console.warn('[WARN] Kesalahan penghapusan storage object:', err)
      }
    }

    // 2. Hapus dari tabel materials
    let { error: delError } = await supabase
      .from('materials')
      .delete()
      .eq('id', materialId)

    if (delError) {
      // Retry sekali jika gangguan jaringan sementara
      await new Promise((resolve) => setTimeout(resolve, 300))
      const retryDel = await supabase
        .from('materials')
        .delete()
        .eq('id', materialId)
      delError = retryDel.error
    }

    if (delError) {
      console.error('[ERROR] Gagal menghapus baris tabel materials:', delError.message)
      return { success: false, error: delError.message }
    }

    return { success: true, data: true }
  },

  // =========================================================================
  // 2. EVALUASI NILAI & RAPOR (GRADES)
  // =========================================================================

  /**
   * Mengambil seluruh nilai evaluasi dari Supabase dengan filter opsional.
   */
  async getGrades(filters?: { studentId?: string; classId?: string; tutorId?: string }): Promise<GradeRecord[]> {
    await ensureAdminSession()

    let query = supabase
      .from('grades')
      .select(`
        id,
        student_id,
        class_id,
        tutor_id,
        subject_name,
        assessment_title,
        category,
        score,
        class_average,
        tutor_feedback,
        assessment_date,
        created_at,
        students:student_id (
          nis,
          profiles:profile_id (
            full_name
          )
        ),
        classes:class_id (
          class_name
        ),
        tutors:tutor_id (
          profiles:profile_id (
            full_name
          )
        )
      `)
      .order('assessment_date', { ascending: false })

    if (filters?.studentId) {
      const realStudentId = await resolveStudentUUID(filters.studentId)
      query = query.eq('student_id', realStudentId)
    }

    if (filters?.classId && filters.classId !== 'ALL') {
      query = query.eq('class_id', filters.classId)
    }

    if (filters?.tutorId) {
      const realTutorId = await resolveTutorUUID(filters.tutorId)
      if (realTutorId) {
        query = query.eq('tutor_id', realTutorId)
      }
    }

    const { data, error } = await query

    if (error) {
      console.error('[ERROR] Gagal memuat data nilai dari Supabase:', error.message)
      return []
    }

    return (data as unknown as RawGradeRow[] || []).map(mapRawGrade)
  },

  async getGradesByStudent(studentId: string): Promise<GradeRecord[]> {
    if (!studentId) return []
    return this.getGrades({ studentId })
  },

  async getGradesByClass(classId: string): Promise<GradeRecord[]> {
    if (!classId) return []
    return this.getGrades({ classId })
  },

  async getGradesByTutor(tutorId: string): Promise<GradeRecord[]> {
    if (!tutorId) return []
    return this.getGrades({ tutorId })
  },

  /**
   * Menyimpan nilai evaluasi baru dengan batas validasi 0-100 dan kalkulasi class_average otomatis.
   */
  async saveGrade(input: SaveGradeInput): Promise<ServerResult<GradeRecord>> {
    await ensureAdminSession()

    const {
      studentId,
      classId,
      subjectName,
      assessmentTitle,
      category,
      score,
      tutorFeedback,
    } = input

    if (!studentId) return { success: false, error: 'Siswa wajib dipilih.' }
    if (!classId) return { success: false, error: 'Kelas wajib dipilih.' }
    if (!subjectName || !subjectName.trim()) return { success: false, error: 'Mata pelajaran wajib diisi.' }
    if (!assessmentTitle || !assessmentTitle.trim()) return { success: false, error: 'Judul evaluasi wajib diisi.' }

    // Validasi skor numerik 0 - 100
    if (typeof score !== 'number' || isNaN(score) || score < 0 || score > 100) {
      return { success: false, error: 'Skor nilai harus berupa angka antara 0 hingga 100.' }
    }

    const realStudentId = await resolveStudentUUID(studentId)
    const realTutorId = await resolveTutorUUID(input.tutorId)
    const assessmentDate = input.assessmentDate || new Date().toISOString().split('T')[0]

    // 1. Ambil nilai sekelas yang sudah ada untuk asesmen ini guna menghitung class_average
    const { data: existingClassGrades } = await supabase
      .from('grades')
      .select('score')
      .eq('class_id', classId)
      .eq('assessment_title', assessmentTitle.trim())

    const currentScores = (existingClassGrades || []).map((g) => g.score)
    currentScores.push(score)

    const computedClassAverage = Math.round(
      currentScores.reduce((sum, s) => sum + s, 0) / currentScores.length
    )

    // 2. Simpan nilai ke tabel grades
    let { data: inserted, error: insertError } = await supabase
      .from('grades')
      .insert({
        student_id: realStudentId,
        class_id: classId,
        tutor_id: realTutorId || null,
        subject_name: subjectName.trim(),
        assessment_title: assessmentTitle.trim(),
        category: category || 'Kuis',
        score: Math.round(score),
        class_average: computedClassAverage,
        tutor_feedback: tutorFeedback?.trim() || null,
        assessment_date: assessmentDate,
      })
      .select(`
        id,
        student_id,
        class_id,
        tutor_id,
        subject_name,
        assessment_title,
        category,
        score,
        class_average,
        tutor_feedback,
        assessment_date,
        created_at,
        students:student_id (
          nis,
          profiles:profile_id (
            full_name
          )
        ),
        classes:class_id (
          class_name
        ),
        tutors:tutor_id (
          profiles:profile_id (
            full_name
          )
        )
      `)
      .single()

    if (insertError) {
      await new Promise((resolve) => setTimeout(resolve, 300))
      const retryInsert = await supabase
        .from('grades')
        .insert({
          student_id: realStudentId,
          class_id: classId,
          tutor_id: realTutorId || null,
          subject_name: subjectName.trim(),
          assessment_title: assessmentTitle.trim(),
          category: category || 'Kuis',
          score: Math.round(score),
          class_average: computedClassAverage,
          tutor_feedback: tutorFeedback?.trim() || null,
          assessment_date: assessmentDate,
        })
        .select(`
          id,
          student_id,
          class_id,
          tutor_id,
          subject_name,
          assessment_title,
          category,
          score,
          class_average,
          tutor_feedback,
          assessment_date,
          created_at,
          students:student_id (
            nis,
            profiles:profile_id (
              full_name
            )
          ),
          classes:class_id (
            class_name
          ),
          tutors:tutor_id (
            profiles:profile_id (
              full_name
            )
          )
        `)
        .single()
      inserted = retryInsert.data
      insertError = retryInsert.error
    }

    if (insertError || !inserted) {
      console.error('[ERROR] Gagal menyimpan nilai ke Supabase:', insertError?.message)
      return { success: false, error: insertError?.message || 'Gagal menyimpan nilai evaluasi.' }
    }

    // 3. Perbarui class_average pada entri siswa lain untuk asesmen ini
    await supabase
      .from('grades')
      .update({ class_average: computedClassAverage })
      .eq('class_id', classId)
      .eq('assessment_title', assessmentTitle.trim())

    return {
      success: true,
      data: mapRawGrade(inserted as unknown as RawGradeRow),
    }
  },

  /**
   * Memperbarui nilai dan catatan umpan balik tutor.
   */
  async updateGrade(id: string, updates: Partial<GradeRecord>): Promise<ServerResult<GradeRecord>> {
    if (!id) return { success: false, error: 'ID nilai tidak valid.' }

    await ensureAdminSession()

    if (updates.score !== undefined) {
      if (typeof updates.score !== 'number' || isNaN(updates.score) || updates.score < 0 || updates.score > 100) {
        return { success: false, error: 'Skor nilai harus berupa angka antara 0 hingga 100.' }
      }
    }

    const payload: Record<string, unknown> = {}
    if (updates.score !== undefined) payload.score = Math.round(updates.score)
    if (updates.tutorFeedback !== undefined) payload.tutor_feedback = updates.tutorFeedback.trim()
    if (updates.subjectName !== undefined) payload.subject_name = updates.subjectName.trim()
    if (updates.assessmentTitle !== undefined) payload.assessment_title = updates.assessmentTitle.trim()
    if (updates.category !== undefined) payload.category = updates.category
    if (updates.assessmentDate !== undefined) payload.assessment_date = updates.assessmentDate

    const { data: updated, error: updateErr } = await supabase
      .from('grades')
      .update(payload)
      .eq('id', id)
      .select(`
        id,
        student_id,
        class_id,
        tutor_id,
        subject_name,
        assessment_title,
        category,
        score,
        class_average,
        tutor_feedback,
        assessment_date,
        created_at,
        students:student_id (
          nis,
          profiles:profile_id (
            full_name
          )
        ),
        classes:class_id (
          class_name
        ),
        tutors:tutor_id (
          profiles:profile_id (
            full_name
          )
        )
      `)
      .single()

    if (updateErr || !updated) {
      console.error('[ERROR] Gagal memperbarui nilai:', updateErr?.message)
      return { success: false, error: updateErr?.message || 'Gagal memperbarui nilai.' }
    }

    // Hitung ulang dan sinkronkan class_average jika skor berubah
    if (updates.score !== undefined && updated.class_id && updated.assessment_title) {
      const { data: classGrades } = await supabase
        .from('grades')
        .select('score')
        .eq('class_id', updated.class_id)
        .eq('assessment_title', updated.assessment_title)

      if (classGrades && classGrades.length > 0) {
        const avg = Math.round(classGrades.reduce((s, g) => s + g.score, 0) / classGrades.length)
        await supabase
          .from('grades')
          .update({ class_average: avg })
          .eq('class_id', updated.class_id)
          .eq('assessment_title', updated.assessment_title)

        updated.class_average = avg
      }
    }

    return {
      success: true,
      data: mapRawGrade(updated as unknown as RawGradeRow),
    }
  },

  /**
   * Menghapus entri nilai evaluasi dari Supabase.
   */
  async deleteGrade(id: string): Promise<ServerResult<boolean>> {
    if (!id) return { success: false, error: 'ID nilai tidak valid.' }

    await ensureAdminSession()

    const { error: delErr } = await supabase
      .from('grades')
      .delete()
      .eq('id', id)

    if (delErr) {
      console.error('[ERROR] Gagal menghapus nilai dari Supabase:', delErr.message)
      return { success: false, error: delErr.message }
    }

    return { success: true, data: true }
  },
}
