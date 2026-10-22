import { describe, it, expect, beforeEach } from 'vitest'
import { adminStore, type GradeRecord } from '~/lib/admin-store'
import { grades, gradesRelations, studentsRelations } from '~/db/schema'

describe('Tiket 05: Grades Schema & Store Synchronization', () => {
  beforeEach(() => {
    // Reset store state if needed or ensure clean state
  })

  it('verifies Drizzle grades schema definitions and relations', () => {
    expect(grades).toBeDefined()
    expect(grades.id).toBeDefined()
    expect(grades.studentId).toBeDefined()
    expect(grades.classId).toBeDefined()
    expect(grades.tutorId).toBeDefined()
    expect(grades.subjectName).toBeDefined()
    expect(grades.assessmentTitle).toBeDefined()
    expect(grades.category).toBeDefined()
    expect(grades.score).toBeDefined()
    expect(grades.classAverage).toBeDefined()
    expect(grades.tutorFeedback).toBeDefined()
    expect(grades.assessmentDate).toBeDefined()
    expect(grades.createdAt).toBeDefined()

    expect(gradesRelations).toBeDefined()
    expect(studentsRelations).toBeDefined()
  })

  it('automatically calculates and synchronizes classAverage when adding a new grade record', () => {
    const classId = 'cls-test-101'
    const assessmentTitle = 'Simulasi Akbar UTBK 2026'

    // Add first grade record (score 80)
    const grade1 = adminStore.addGradeRecord({
      studentId: 'stu-test-1',
      studentName: 'Siswa Satu',
      nis: 'TC-TEST-001',
      classId,
      className: 'Kelas Uji Coba',
      subjectName: 'Matematika Terapan',
      assessmentTitle,
      category: 'Try Out',
      score: 80,
      tutorId: 'tut-1',
      tutorName: 'Kak Dian',
      tutorFeedback: 'Bagus.',
    })

    expect(grade1.classAverage).toBe(80)

    // Add second grade record (score 90) -> (80 + 90) / 2 = 85
    const grade2 = adminStore.addGradeRecord({
      studentId: 'stu-test-2',
      studentName: 'Siswa Dua',
      nis: 'TC-TEST-002',
      classId,
      className: 'Kelas Uji Coba',
      subjectName: 'Matematika Terapan',
      assessmentTitle,
      category: 'Try Out',
      score: 90,
      tutorId: 'tut-1',
      tutorName: 'Kak Dian',
      tutorFeedback: 'Sangat baik.',
    })

    expect(grade2.classAverage).toBe(85)

    // Verify grade1 has also been synchronized to 85
    const allGrades = adminStore.getState().gradeRecords
    const syncedGrade1 = allGrades.find((g) => g.id === grade1.id)
    const syncedGrade2 = allGrades.find((g) => g.id === grade2.id)

    expect(syncedGrade1?.classAverage).toBe(85)
    expect(syncedGrade2?.classAverage).toBe(85)

    // Add third grade record (score 75) -> (80 + 90 + 75) / 3 = 245 / 3 = 81.67 -> round to 82
    const grade3 = adminStore.addGradeRecord({
      studentId: 'stu-test-3',
      studentName: 'Siswa Tiga',
      nis: 'TC-TEST-003',
      classId,
      className: 'Kelas Uji Coba',
      subjectName: 'Matematika Terapan',
      assessmentTitle,
      category: 'Try Out',
      score: 75,
      tutorId: 'tut-1',
      tutorName: 'Kak Dian',
      tutorFeedback: 'Cukup baik.',
    })

    expect(grade3.classAverage).toBe(82)

    const updatedGrades = adminStore.getState().gradeRecords
    const record1 = updatedGrades.find((g) => g.id === grade1.id)
    const record2 = updatedGrades.find((g) => g.id === grade2.id)
    const record3 = updatedGrades.find((g) => g.id === grade3.id)

    expect(record1?.classAverage).toBe(82)
    expect(record2?.classAverage).toBe(82)
    expect(record3?.classAverage).toBe(82)
  })

  it('recalculates and synchronizes classAverage when updating an existing grade record', () => {
    const classId = 'cls-test-102'
    const assessmentTitle = 'Kuis Kalkulus'

    const grade1 = adminStore.addGradeRecord({
      studentId: 'stu-test-A',
      studentName: 'Siswa A',
      nis: 'TC-TEST-00A',
      classId,
      className: 'Kelas Kalkulus',
      subjectName: 'Matematika',
      assessmentTitle,
      category: 'Kuis',
      score: 70,
      tutorId: 'tut-1',
      tutorName: 'Kak Dian',
      tutorFeedback: 'Belajar lagi',
    })

    const grade2 = adminStore.addGradeRecord({
      studentId: 'stu-test-B',
      studentName: 'Siswa B',
      nis: 'TC-TEST-00B',
      classId,
      className: 'Kelas Kalkulus',
      subjectName: 'Matematika',
      assessmentTitle,
      category: 'Kuis',
      score: 90,
      tutorId: 'tut-1',
      tutorName: 'Kak Dian',
      tutorFeedback: 'Mantap',
    })

    // Initial avg = (70 + 90) / 2 = 80
    const currentGrade1 = adminStore.getState().gradeRecords.find((g) => g.id === grade1.id)
    expect(currentGrade1?.classAverage).toBe(80)
    expect(grade2.classAverage).toBe(80)

    // Update grade1 score from 70 to 100 -> (100 + 90) / 2 = 95
    adminStore.updateGradeRecord(grade1.id, { score: 100 })

    const gradesAfterUpdate = adminStore.getState().gradeRecords
    const updated1 = gradesAfterUpdate.find((g) => g.id === grade1.id)
    const updated2 = gradesAfterUpdate.find((g) => g.id === grade2.id)

    expect(updated1?.score).toBe(100)
    expect(updated1?.classAverage).toBe(95)
    expect(updated2?.classAverage).toBe(95)
  })
})
