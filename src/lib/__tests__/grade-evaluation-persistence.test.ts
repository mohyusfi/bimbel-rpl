import { describe, it, expect, beforeEach } from 'vitest'
import * as React from 'react'
import { renderToString } from 'react-dom/server'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { getTableColumns, createOne, createMany } from 'drizzle-orm'
import {
  adminStore,
  type GradeRecord,
  type Student,
  type ClassGroup,
  type Tutor,
} from '../admin-store'
import {
  grades as drizzleGrades,
  gradesRelations,
  students as drizzleStudents,
  classes as drizzleClasses,
  tutors as drizzleTutors,
  type Grade as DrizzleGrade,
  type NewGrade as DrizzleNewGrade,
} from '../../db/schema'
import {
  useStudentDashboardData,
  useParentDashboardData,
  useTutorDashboardData,
  ADMIN_KEYS,
} from '../../hooks/use-admin-data'

// Test harness untuk mengeksekusi TanStack Query hook dalam lingkungan pengujian SSR
function renderHookWithClient<T>(hookFn: () => T): T {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  })
  const state = adminStore.getState()
  queryClient.setQueryData(ADMIN_KEYS.session, {
    activeStudentId: state.activeStudentId,
    activeTutorId: state.activeTutorId,
    activeParentId: state.activeParentId,
    selectedChildId: state.selectedChildId,
    student: state.students.find((s) => s.id === state.activeStudentId) || state.students[0],
    tutor: state.tutors.find((t) => t.id === state.activeTutorId) || state.tutors[0],
    parent: state.parents.find((p) => p.id === state.activeParentId) || state.parents[0],
    selectedChild: state.students.find((s) => s.id === state.selectedChildId) || state.students[0],
  })
  queryClient.setQueryData(ADMIN_KEYS.tutors, state.tutors)
  queryClient.setQueryData(ADMIN_KEYS.students, state.students)
  queryClient.setQueryData(ADMIN_KEYS.schedules, state.schedules)
  queryClient.setQueryData(ADMIN_KEYS.classes, state.classes)
  queryClient.setQueryData(ADMIN_KEYS.attendance, state.attendanceSessions)
  queryClient.setQueryData(ADMIN_KEYS.materials, state.learningMaterials)
  queryClient.setQueryData(ADMIN_KEYS.grades, state.gradeRecords)
  queryClient.setQueryData(ADMIN_KEYS.parents, state.parents)
  queryClient.setQueryData(ADMIN_KEYS.invoices, state.invoices)

  let result!: T
  function TestHarness() {
    result = hookFn()
    return React.createElement('div', null, 'rendered')
  }

  renderToString(
    React.createElement(
      QueryClientProvider,
      { client: queryClient },
      React.createElement(TestHarness)
    )
  )

  return result
}

describe('Tiket 05 — Evaluasi Hasil Belajar & Rapor Progres Orang Tua', () => {
  beforeEach(() => {
    // Reset state ke kondisi default yang bersih sebelum setiap skenario pengujian
    adminStore.resetToDefault()
  })

  // =========================================================================
  // 1. DRIZZLE ORM SCHEMA VALIDATION
  // =========================================================================
  describe('Drizzle ORM Schema Validation', () => {
    it('memvalidasi seluruh definisi kolom tabel grades pada skema Drizzle', () => {
      expect(drizzleGrades).toBeDefined()
      const columns = getTableColumns(drizzleGrades)

      // Memastikan 12 kolom wajib sesuai spesifikasi Tiket 05 tersedia
      expect(columns.id).toBeDefined()
      expect(columns.studentId).toBeDefined()
      expect(columns.classId).toBeDefined()
      expect(columns.tutorId).toBeDefined()
      expect(columns.subjectName).toBeDefined()
      expect(columns.assessmentTitle).toBeDefined()
      expect(columns.category).toBeDefined()
      expect(columns.score).toBeDefined()
      expect(columns.classAverage).toBeDefined()
      expect(columns.tutorFeedback).toBeDefined()
      expect(columns.assessmentDate).toBeDefined()
      expect(columns.createdAt).toBeDefined()
    })

    it('memvalidasi relasi gradesRelations terhubung secara presisi dengan students, classes, dan tutors', () => {
      expect(gradesRelations).toBeDefined()
      expect(gradesRelations.table).toBe(drizzleGrades)

      // Menggunakan builder relasi resmi Drizzle ORM
      const relationsConfig = gradesRelations.config({
        one: createOne(gradesRelations.table),
        many: createMany(gradesRelations.table),
      })

      // 1. Relasi ke tabel students
      expect(relationsConfig.student).toBeDefined()
      expect(relationsConfig.student.referencedTable).toBe(drizzleStudents)
      expect(relationsConfig.student.config?.fields).toEqual([drizzleGrades.studentId])
      expect(relationsConfig.student.config?.references).toEqual([drizzleStudents.id])

      // 2. Relasi ke tabel classes
      expect(relationsConfig.class).toBeDefined()
      expect(relationsConfig.class.referencedTable).toBe(drizzleClasses)
      expect(relationsConfig.class.config?.fields).toEqual([drizzleGrades.classId])
      expect(relationsConfig.class.config?.references).toEqual([drizzleClasses.id])

      // 3. Relasi ke tabel tutors
      expect(relationsConfig.tutor).toBeDefined()
      expect(relationsConfig.tutor.referencedTable).toBe(drizzleTutors)
      expect(relationsConfig.tutor.config?.fields).toEqual([drizzleGrades.tutorId])
      expect(relationsConfig.tutor.config?.references).toEqual([drizzleTutors.id])
    })

    it('memvalidasi kesesuaian tipe DrizzleGrade dan DrizzleNewGrade', () => {
      const mockGrade: DrizzleGrade = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        studentId: '123e4567-e89b-12d3-a456-426614174001',
        classId: '123e4567-e89b-12d3-a456-426614174002',
        tutorId: '123e4567-e89b-12d3-a456-426614174003',
        subjectName: 'Fisika UTBK',
        assessmentTitle: 'Try Out 1 UTBK Fisika',
        category: 'Try Out',
        score: 88,
        classAverage: 76,
        tutorFeedback: 'Penguasaan materi konsep kinematika sudah sangat matang.',
        assessmentDate: '15 Okt 2026',
        createdAt: new Date(),
      }

      expect(mockGrade.score).toBe(88)
      expect(mockGrade.classAverage).toBe(76)
      expect(mockGrade.category).toBe('Try Out')

      const mockNewGrade: DrizzleNewGrade = {
        studentId: '123e4567-e89b-12d3-a456-426614174001',
        classId: '123e4567-e89b-12d3-a456-426614174002',
        tutorId: '123e4567-e89b-12d3-a456-426614174003',
        subjectName: 'Matematika Sains',
        assessmentTitle: 'Kuis Logaritma',
        category: 'Kuis',
        score: 95,
        assessmentDate: '16 Okt 2026',
      }

      expect(mockNewGrade.score).toBe(95)
      expect(mockNewGrade.category).toBe('Kuis')
    })
  })

  // =========================================================================
  // 2. PERSISTENCE & STORE OPERATIONS IN ADMINSTORE
  // =========================================================================
  describe('Persistence & Store Operations in adminStore', () => {
    it('berhasil menambahkan catatan nilai (addGradeRecord) untuk kategori Try Out, Kuis, dan Tugas dengan skor valid (0–100)', () => {
      // 1. Try Out
      const tryOutGrade = adminStore.addGradeRecord({
        studentId: 'stu-1',
        studentName: 'Fahri Ramadhan',
        nis: 'TC-2026-001',
        classId: 'cls-1',
        className: 'UTBK Intensif A',
        subjectName: 'Fisika UTBK',
        assessmentTitle: 'Try Out Akbar SNBT 2026 Gelombang 1',
        category: 'Try Out',
        score: 85,
        tutorId: 'tut-1',
        tutorName: 'Kak Dian Pratiwi, S.Si',
        tutorFeedback: 'Skor sangat baik pada materi mekanika klasik.',
      })

      expect(tryOutGrade.id).toBeDefined()
      expect(tryOutGrade.category).toBe('Try Out')
      expect(tryOutGrade.score).toBe(85)
      expect(tryOutGrade.assessmentDate).toBeDefined()

      // 2. Kuis
      const kuisGrade = adminStore.addGradeRecord({
        studentId: 'stu-1',
        studentName: 'Fahri Ramadhan',
        nis: 'TC-2026-001',
        classId: 'cls-1',
        className: 'UTBK Intensif A',
        subjectName: 'Fisika UTBK',
        assessmentTitle: 'Kuis Cepat Dinamika Rotasi',
        category: 'Kuis',
        score: 92,
        tutorId: 'tut-1',
        tutorName: 'Kak Dian Pratiwi, S.Si',
        tutorFeedback: 'Sangat cepat dan akurat menyelesaikan rumus torsi.',
      })

      expect(kuisGrade.id).toBeDefined()
      expect(kuisGrade.category).toBe('Kuis')
      expect(kuisGrade.score).toBe(92)

      // 3. Tugas
      const tugasGrade = adminStore.addGradeRecord({
        studentId: 'stu-1',
        studentName: 'Fahri Ramadhan',
        nis: 'TC-2026-001',
        classId: 'cls-1',
        className: 'UTBK Intensif A',
        subjectName: 'Fisika UTBK',
        assessmentTitle: 'Lembar Kerja Mandiri Termodinamika',
        category: 'Tugas',
        score: 78,
        tutorId: 'tut-1',
        tutorName: 'Kak Dian Pratiwi, S.Si',
        tutorFeedback: 'Perlu diperbaiki penurunan rumus siklus Carnot.',
      })

      expect(tugasGrade.id).toBeDefined()
      expect(tugasGrade.category).toBe('Tugas')
      expect(tugasGrade.score).toBe(78)

      // Verifikasi notifikasi terkirim untuk setiap nilai baru
      const notifications = adminStore.getState().notifications
      expect(notifications[0].title).toBe('Nilai Evaluasi Rapor Baru')
      expect(notifications[0].message).toContain('Lembar Kerja Mandiri Termodinamika')
    })

    it('menghitung classAverage secara otomatis bertahap: 80 -> 85 -> 80 untuk 3 siswa dalam kelas dan evaluasi yang sama', () => {
      const assessmentTitle = 'Simulasi Evaluasi Standar Mandiri 2026'
      const classId = 'cls-1'
      const className = 'UTBK Intensif A'
      const subjectName = 'Fisika UTBK'
      const tutorId = 'tut-1'
      const tutorName = 'Kak Dian Pratiwi, S.Si'

      // Tahap 1: Siswa pertama memperoleh nilai 80
      // -> classAverage = 80
      const g1 = adminStore.addGradeRecord({
        studentId: 'stu-1',
        studentName: 'Fahri Ramadhan',
        nis: 'TC-2026-001',
        classId,
        className,
        subjectName,
        assessmentTitle,
        category: 'Try Out',
        score: 80,
        tutorId,
        tutorName,
        tutorFeedback: 'Mulai memahami tipe soal analitis.',
      })

      const stateAfterFirst = adminStore.getState().gradeRecords
      const foundG1AfterFirst = stateAfterFirst.find((g) => g.id === g1.id)
      expect(foundG1AfterFirst?.classAverage).toBe(80)

      // Tahap 2: Siswa kedua di kelas dan evaluasi yang sama memperoleh nilai 90
      // -> rata-rata = Math.round((80 + 90) / 2) = 85
      // -> kedua catatan nilai tersinkronisasi menjadi classAverage = 85
      const g2 = adminStore.addGradeRecord({
        studentId: 'stu-2',
        studentName: 'Siti Nurhaliza',
        nis: 'TC-2026-002',
        classId,
        className,
        subjectName,
        assessmentTitle,
        category: 'Try Out',
        score: 90,
        tutorId,
        tutorName,
        tutorFeedback: 'Hasil sangat memuaskan.',
      })

      const stateAfterSecond = adminStore.getState().gradeRecords
      const foundG1AfterSecond = stateAfterSecond.find((g) => g.id === g1.id)
      const foundG2AfterSecond = stateAfterSecond.find((g) => g.id === g2.id)

      expect(foundG1AfterSecond?.classAverage).toBe(85)
      expect(foundG2AfterSecond?.classAverage).toBe(85)

      // Tahap 3: Siswa ketiga di kelas dan evaluasi yang sama memperoleh nilai 70
      // -> rata-rata = Math.round((80 + 90 + 70) / 3) = 80
      // -> ketiga catatan nilai tersinkronisasi menjadi classAverage = 80
      const g3 = adminStore.addGradeRecord({
        studentId: 'stu-3',
        studentName: 'Budi Pratama',
        nis: 'TC-2026-003',
        classId,
        className,
        subjectName,
        assessmentTitle,
        category: 'Try Out',
        score: 70,
        tutorId,
        tutorName,
        tutorFeedback: 'Butuh pendampingan tambahan pada bagian induksi elektromagnetik.',
      })

      const stateAfterThird = adminStore.getState().gradeRecords
      const foundG1AfterThird = stateAfterThird.find((g) => g.id === g1.id)
      const foundG2AfterThird = stateAfterThird.find((g) => g.id === g2.id)
      const foundG3AfterThird = stateAfterThird.find((g) => g.id === g3.id)

      expect(foundG1AfterThird?.classAverage).toBe(80)
      expect(foundG2AfterThird?.classAverage).toBe(80)
      expect(foundG3AfterThird?.classAverage).toBe(80)
    })

    it('memperbarui catatan nilai (updateGradeRecord) dan memicu sinkronisasi ulang classAverage ke seluruh siswa terkait', () => {
      const assessmentTitle = 'Ujian Modul Getaran & Gelombang'
      const classId = 'cls-1'
      const className = 'UTBK Intensif A'
      const subjectName = 'Fisika UTBK'
      const tutorId = 'tut-1'
      const tutorName = 'Kak Dian Pratiwi, S.Si'

      // Buat 3 catatan nilai awal: Siswa 1 (80), Siswa 2 (90), Siswa 3 (70) -> Rata-rata awal 80
      const g1 = adminStore.addGradeRecord({
        studentId: 'stu-1',
        studentName: 'Fahri Ramadhan',
        nis: 'TC-2026-001',
        classId,
        className,
        subjectName,
        assessmentTitle,
        category: 'Kuis',
        score: 80,
        tutorId,
        tutorName,
        tutorFeedback: 'Baik.',
      })

      const g2 = adminStore.addGradeRecord({
        studentId: 'stu-2',
        studentName: 'Siti Nurhaliza',
        nis: 'TC-2026-002',
        classId,
        className,
        subjectName,
        assessmentTitle,
        category: 'Kuis',
        score: 90,
        tutorId,
        tutorName,
        tutorFeedback: 'Sangat baik.',
      })

      const g3 = adminStore.addGradeRecord({
        studentId: 'stu-3',
        studentName: 'Budi Pratama',
        nis: 'TC-2026-003',
        classId,
        className,
        subjectName,
        assessmentTitle,
        category: 'Kuis',
        score: 70,
        tutorId,
        tutorName,
        tutorFeedback: 'Cukup.',
      })

      // Verifikasi rata-rata sebelum modifikasi
      expect(adminStore.getState().gradeRecords.find((g) => g.id === g1.id)?.classAverage).toBe(80)

      // Perbarui skor Siswa 3 (remedial dari 70 menjadi 100)
      // Perhitungan baru: (80 + 90 + 100) / 3 = 270 / 3 = 90
      const updatedG3 = adminStore.updateGradeRecord(g3.id, {
        score: 100,
        tutorFeedback: 'Lulus remedial dengan nilai sempurna.',
      })

      expect(updatedG3).toBeDefined()
      expect(updatedG3?.score).toBe(100)
      expect(updatedG3?.classAverage).toBe(90)

      // Pastikan seluruh siswa dalam kelas dan evaluasi tersebut tersinkronisasi menjadi 90
      const recordsAfterUpdate = adminStore.getState().gradeRecords
      const syncedG1 = recordsAfterUpdate.find((g) => g.id === g1.id)
      const syncedG2 = recordsAfterUpdate.find((g) => g.id === g2.id)
      const syncedG3 = recordsAfterUpdate.find((g) => g.id === g3.id)

      expect(syncedG1?.classAverage).toBe(90)
      expect(syncedG2?.classAverage).toBe(90)
      expect(syncedG3?.classAverage).toBe(90)
    })

    describe('Kasus Batas (Edge Cases)', () => {
      it('menangani batas nilai ekstrem: skor 0 dan skor 100 secara akurat tanpa pembagian nol atau nilai NaN', () => {
        const assessmentTitle = 'Evaluasi Batas Ekstrem'
        const classId = 'cls-2'
        const className = 'UTBK Intensif B'
        const subjectName = 'Penalaran Matematika'

        // 1. Catatan tunggal bernilai 0
        const zeroGrade = adminStore.addGradeRecord({
          studentId: 'stu-2',
          studentName: 'Siti Nurhaliza',
          nis: 'TC-2026-002',
          classId,
          className,
          subjectName,
          assessmentTitle,
          category: 'Kuis',
          score: 0,
          tutorId: 'tut-2',
          tutorName: 'Pak Hendra Wijaya, M.Pd',
          tutorFeedback: 'Tidak mengumpulkan lembar jawaban kuis.',
        })

        expect(zeroGrade.score).toBe(0)
        expect(zeroGrade.classAverage).toBe(0)

        // 2. Tambah siswa kedua dengan nilai sempurna 100
        // Rata-rata: (0 + 100) / 2 = 50
        const perfectGrade = adminStore.addGradeRecord({
          studentId: 'stu-3',
          studentName: 'Budi Pratama',
          nis: 'TC-2026-003',
          classId,
          className,
          subjectName,
          assessmentTitle,
          category: 'Kuis',
          score: 100,
          tutorId: 'tut-2',
          tutorName: 'Pak Hendra Wijaya, M.Pd',
          tutorFeedback: 'Jawaban sempurna tanpa koreksi.',
        })

        const records = adminStore.getState().gradeRecords
        expect(records.find((g) => g.id === zeroGrade.id)?.classAverage).toBe(50)
        expect(records.find((g) => g.id === perfectGrade.id)?.classAverage).toBe(50)
      })

      it('menjamin evaluasi pada kelas berbeda tidak memengaruhi atau mengkontaminasi classAverage kelas lain', () => {
        const assessmentTitle = 'Simulasi Ujian Nasional Bersama'

        // Kelas A (cls-1): 2 siswa dengan skor 100 dan 100 -> Rata-rata Kelas A = 100
        const classAGrade1 = adminStore.addGradeRecord({
          studentId: 'stu-1',
          studentName: 'Fahri Ramadhan',
          nis: 'TC-2026-001',
          classId: 'cls-1',
          className: 'UTBK Intensif A',
          subjectName: 'Fisika UTBK',
          assessmentTitle,
          category: 'Try Out',
          score: 100,
          tutorId: 'tut-1',
          tutorName: 'Kak Dian Pratiwi, S.Si',
          tutorFeedback: 'Hebat.',
        })

        const classAGrade2 = adminStore.addGradeRecord({
          studentId: 'stu-2',
          studentName: 'Siti Nurhaliza',
          nis: 'TC-2026-002',
          classId: 'cls-1',
          className: 'UTBK Intensif A',
          subjectName: 'Fisika UTBK',
          assessmentTitle,
          category: 'Try Out',
          score: 100,
          tutorId: 'tut-1',
          tutorName: 'Kak Dian Pratiwi, S.Si',
          tutorFeedback: 'Sempurna.',
        })

        expect(adminStore.getState().gradeRecords.find((g) => g.id === classAGrade1.id)?.classAverage).toBe(100)

        // Kelas B (cls-4): 1 siswa dengan skor 60 untuk judul asesmen yang sama persis
        const classBGrade = adminStore.addGradeRecord({
          studentId: 'stu-4',
          studentName: 'Alya Ramadhani',
          nis: 'TC-2026-004',
          classId: 'cls-4',
          className: 'SMP Prestasi A',
          subjectName: 'Fisika UTBK',
          assessmentTitle,
          category: 'Try Out',
          score: 60,
          tutorId: 'tut-1',
          tutorName: 'Kak Dian Pratiwi, S.Si',
          tutorFeedback: 'Perlu latihan lebih sering.',
        })

        const records = adminStore.getState().gradeRecords

        // Rata-rata Kelas B harus 60
        expect(records.find((g) => g.id === classBGrade.id)?.classAverage).toBe(60)

        // Rata-rata Kelas A tetap murni 100 (tidak turun menjadi 87 akibat siswa kelas B)
        expect(records.find((g) => g.id === classAGrade1.id)?.classAverage).toBe(100)
        expect(records.find((g) => g.id === classAGrade2.id)?.classAverage).toBe(100)
      })
    })
  })

  // =========================================================================
  // 3. TANSTACK QUERY HOOKS INTEGRATION
  // =========================================================================
  describe('TanStack Query Hooks Integration', () => {
    describe('useStudentDashboardData: Rapor & Ringkasan Metrik Siswa Aktif', () => {
      it('mengembalikan hanya catatan nilai siswa aktif dan menghitung ringkasan metrik (avgScore, highestScore, total)', () => {
        const studentId = 'stu-1'
        const result = renderHookWithClient(() => useStudentDashboardData(studentId))

        expect(result).toBeDefined()
        expect(result.student.id).toBe(studentId)

        // Verifikasi seluruh daftar nilai yang dikembalikan benar-benar milik siswa stu-1
        expect(result.grades.length).toBeGreaterThan(0)
        for (const grade of result.grades) {
          expect(grade.studentId).toBe(studentId)
        }

        // Verifikasi perhitungan ringkasan metrik akademis
        const expectedTotal = result.grades.length
        const expectedSum = result.grades.reduce((sum, g) => sum + g.score, 0)
        const expectedAvg = Math.round(expectedSum / expectedTotal)
        const expectedHighest = Math.max(...result.grades.map((g) => g.score))

        expect(result.total).toBe(expectedTotal)
        expect(result.avgScore).toBe(expectedAvg)
        expect(result.highestScore).toBe(expectedHighest)
        expect(result.avgGrade).toBe(expectedAvg)
      })

      it('mengembalikan array nilai kosong dan metrik aman (0) jika siswa belum memiliki riwayat evaluasi', () => {
        // Buat siswa baru tanpa catatan nilai sama sekali
        const newStudent = adminStore.addStudent({
          name: 'Siswa Baru Tanpa Nilai',
          email: 'siswa.baru@tadulakocendekia.sch.id',
          phone: '081299990000',
          school: 'SMA Negeri 2 Palu',
          packageCode: 'SMA',
          classId: 'cls-3',
          className: 'SMA IPA 1',
          parentName: 'Ibu Siswa Baru',
          parentPhone: '081299991111',
        })

        const result = renderHookWithClient(() => useStudentDashboardData(newStudent.id))

        expect(result.student.id).toBe(newStudent.id)
        expect(result.grades).toEqual([])
        expect(result.total).toBe(0)
        expect(result.avgScore).toBe(0)
        expect(result.highestScore).toBe(0)
      })
    })

    describe('useParentDashboardData: Multi-Child Switcher & Rapor Anak Terpilih', () => {
      it('mengembalikan nilai anak terpilih dan memperbarui data secara dinamis saat setSelectedChildId dijalankan', () => {
        // Parent par-1 (Ir. H. Ahmad Dahlan) memiliki dua anak: stu-1 (Fahri Ramadhan) & stu-4 (Alya Ramadhani)
        const parentId = 'par-1'

        // 1. Default kondisi awal: anak terpilih adalah stu-1
        adminStore.setSelectedChildId('stu-1')
        const initialResult = renderHookWithClient(() => useParentDashboardData(parentId))

        expect(initialResult.parent.id).toBe(parentId)
        expect(initialResult.children.length).toBe(2)
        expect(initialResult.selectedChild.id).toBe('stu-1')
        expect(initialResult.childData.student.id).toBe('stu-1')

        // Pastikan nilai yang ditampilkan adalah nilai milik Fahri Ramadhan (stu-1)
        expect(initialResult.childData.grades.length).toBeGreaterThan(0)
        for (const g of initialResult.childData.grades) {
          expect(g.studentId).toBe('stu-1')
        }

        // 2. Alihkan anak terpilih ke anak kedua: stu-4 (Alya Ramadhani)
        adminStore.setSelectedChildId('stu-4')
        const switchedResult = renderHookWithClient(() => useParentDashboardData(parentId))

        expect(switchedResult.selectedChild.id).toBe('stu-4')
        expect(switchedResult.childData.student.id).toBe('stu-4')

        // Pastikan nilai yang ditampilkan beralih ke nilai milik Alya Ramadhani (stu-4)
        expect(switchedResult.childData.grades.length).toBeGreaterThan(0)
        for (const g of switchedResult.childData.grades) {
          expect(g.studentId).toBe('stu-4')
        }

        // Verifikasi tidak ada nilai anak pertama (stu-1) yang bocor ke dashboard anak kedua (stu-4)
        const leakedGrades = switchedResult.childData.grades.filter((g) => g.studentId !== 'stu-4')
        expect(leakedGrades.length).toBe(0)
      })
    })

    describe('useTutorDashboardData: Riwayat Penilaian Kelas Bimbingan Tutor', () => {
      it('menampilkan seluruh nilai yang diinput oleh tutor maupun nilai pada rombel kelas yang diampu', () => {
        const tutorId = 'tut-1' // Kak Dian Pratiwi, S.Si
        const result = renderHookWithClient(() => useTutorDashboardData(tutorId))

        expect(result).toBeDefined()
        expect(result.tutor.id).toBe(tutorId)
        expect(result.grades.length).toBeGreaterThan(0)

        // Verifikasi setiap grade pada tutorGrades:
        // Diajukan oleh tutor tersebut ATAU berada di dalam rombel kelas yang diampu tutor
        const tutorClassIds = new Set([
          ...result.classes.filter((c) => c.tutorName === result.tutor.name).map((c) => c.id),
          ...result.schedules.map((s) => s.classId),
        ])

        for (const grade of result.grades) {
          const isSubmittedByTutor = grade.tutorId === tutorId
          const isForTutorClass = tutorClassIds.has(grade.classId)
          expect(isSubmittedByTutor || isForTutorClass).toBe(true)
        }
      })

      it('mengembalikan array nilai kosong untuk tutor baru yang belum menginput nilai atau mengampu kelas dengan nilai', () => {
        // Buat tutor baru
        const newTutor = adminStore.addTutor({
          name: 'Tutor Penguji Baru, M.Si',
          phone: '081277778888',
          education: 'S2 Biologi Terapan',
          subjects: ['Biologi SMA'],
        })

        const result = renderHookWithClient(() => useTutorDashboardData(newTutor.id))

        expect(result.tutor.id).toBe(newTutor.id)
        expect(result.grades).toEqual([])
      })
    })
  })
})
