import { describe, it, expect } from 'vitest'
import { learningService } from '../learning.service'

describe('LearningService — TDD & Supabase Integration (Tiket 05)', { timeout: 15000 }, () => {
  const UTBK_CLASS_ID = 'c1000000-0000-0000-0000-000000000001'
  const SMP_CLASS_ID = 'c1000000-0000-0000-0000-000000000004'
  const KAK_DIAN_TUTOR_ID = '9383fc09-99fc-423c-ac09-e3f94c26f5e9'
  const FAHRI_STUDENT_ID = 'd992d9fc-6f5b-434f-998b-358e54a754b7'

  // =========================================================================
  // 1. MODUL BELAJAR (MATERIALS) QUERY
  // =========================================================================
  describe('Modul Belajar (Materials) Query & Isolasi Kelas', () => {
    it('mengambil modul materi riil dari Supabase berdasarkan classId', async () => {
      const materials = await learningService.getMaterialsByClass(UTBK_CLASS_ID)
      expect(Array.isArray(materials)).toBe(true)
      expect(materials.length).toBeGreaterThanOrEqual(2)

      const titles = materials.map((m) => m.title)
      expect(titles.some((t) => t.includes('Kinematika & Dinamika'))).toBe(true)
      expect(titles.some((t) => t.includes('Bank Soal: TPS'))).toBe(true)

      // Verifikasi seluruh materi terisolasi untuk UTBK_CLASS_ID
      materials.forEach((m) => {
        expect(m.classId).toBe(UTBK_CLASS_ID)
      })
    })

    it('memastikan siswa kelas UTBK tidak melihat materi rombel SMP (isolasi rombel)', async () => {
      const utbkMaterials = await learningService.getMaterialsByClass(UTBK_CLASS_ID)
      const hasSmpMaterial = utbkMaterials.some((m) => m.title.includes('Sistem Peredaran Darah Manusia'))
      expect(hasSmpMaterial).toBe(false)
    })

    it('mengambil modul materi berdasarkan tutorId pengajar', async () => {
      const tutorMaterials = await learningService.getMaterialsByTutor(KAK_DIAN_TUTOR_ID)
      expect(tutorMaterials.length).toBeGreaterThan(0)
      tutorMaterials.forEach((m) => {
        expect(m.tutorId).toBe(KAK_DIAN_TUTOR_ID)
      })
    })
  })

  // =========================================================================
  // 2. VALIDASI FORMAT & UPLOAD MODUL KE SUPABASE STORAGE & DATABASE
  // =========================================================================
  describe('Validasi Format & Upload Modul Belajar', () => {
    it('menolak pengunggahan berkas yang tidak didukung (misal: .exe atau .zip)', async () => {
      const dummyFile = new File(['executable binary'], 'virus.exe', { type: 'application/x-msdownload' })
      const res = await learningService.uploadMaterial({
        file: dummyFile,
        classId: UTBK_CLASS_ID,
        tutorId: KAK_DIAN_TUTOR_ID,
        title: 'Berkas Tidak Valid',
        category: 'Modul Teori',
        fileType: 'EXE' as any,
      })

      expect(res.success).toBe(false)
      if (!res.success) {
        expect(res.error).toContain('Format berkas tidak didukung')
      }
    })

    it('berhasil mengunggah modul PDF baru ke Supabase Storage & tabel materials, lalu menghapusnya secara atomik', async () => {
      const pdfContent = '%PDF-1.4\n1 0 obj\n<< /Title (Uji Integrasi TDD Modul) >>\nendobj\ntrailer\n<< /Root 1 0 R >>\n%%EOF'
      const testFile = new File([pdfContent], 'test-modul-tdd.pdf', { type: 'application/pdf' })

      const uploadRes = await learningService.uploadMaterial({
        file: testFile,
        classId: UTBK_CLASS_ID,
        tutorId: KAK_DIAN_TUTOR_ID,
        title: 'Uji Modul TDD Live',
        description: 'Deskripsi modul uji otomatis',
        category: 'Modul Teori',
        fileType: 'PDF',
      })

      expect(uploadRes.success, `Upload gagal: ${uploadRes.success ? '' : uploadRes.error}`).toBe(true)
      if (uploadRes.success) {
        const created = uploadRes.data
        expect(created.id).toBeDefined()
        expect(created.title).toBe('Uji Modul TDD Live')
        expect(created.fileUrl).toContain('supabase.co')
        expect(created.storagePath).toBeDefined()

        // Hapus secara atomik (hapus row DB + berkas Storage)
        const deleteRes = await learningService.deleteMaterial(created.id)
        expect(deleteRes.success, `Delete gagal: ${deleteRes.success ? '' : deleteRes.error}`).toBe(true)

        // Verifikasi materi sudah tidak ada lagi di DB
        const currentMaterials = await learningService.getMaterialsByClass(UTBK_CLASS_ID)
        expect(currentMaterials.some((m) => m.id === created.id)).toBe(false)
      }
    })
  })

  // =========================================================================
  // 3. INPUT NILAI, VALIDASI SKOR, DAN KALKULASI CLASS AVERAGE OTOMATIS
  // =========================================================================
  describe('Input Nilai Evaluasi & Rapor Siswa', () => {
    it('mengambil nilai riil siswa dari Supabase (termasuk via ID legacy stu-1)', async () => {
      const gradesByUUID = await learningService.getGradesByStudent(FAHRI_STUDENT_ID)
      expect(gradesByUUID.length).toBeGreaterThanOrEqual(3)

      const titles = gradesByUUID.map((g) => g.assessmentTitle)
      expect(titles.some((t) => t.includes('Try Out 1 UTBK'))).toBe(true)
      expect(titles.some((t) => t.includes('Kuis 1'))).toBe(true)

      // Test lewat alias legacy stu-1
      const gradesByLegacy = await learningService.getGradesByStudent('stu-1')
      expect(gradesByLegacy.length).toBe(gradesByUUID.length)
    })

    it('menolak input nilai jika skor di luar batas 0–100 (< 0 atau > 100)', async () => {
      const resUnder = await learningService.saveGrade({
        studentId: FAHRI_STUDENT_ID,
        classId: UTBK_CLASS_ID,
        tutorId: KAK_DIAN_TUTOR_ID,
        subjectName: 'Fisika UTBK',
        assessmentTitle: 'Try Out Uji Skor',
        category: 'Try Out',
        score: -5,
        assessmentDate: '2026-10-23',
      })
      expect(resUnder.success).toBe(false)

      const resOver = await learningService.saveGrade({
        studentId: FAHRI_STUDENT_ID,
        classId: UTBK_CLASS_ID,
        tutorId: KAK_DIAN_TUTOR_ID,
        subjectName: 'Fisika UTBK',
        assessmentTitle: 'Try Out Uji Skor',
        category: 'Try Out',
        score: 105,
        assessmentDate: '2026-10-23',
      })
      expect(resOver.success).toBe(false)
    })

    it('berhasil menyimpan nilai baru dengan perhitungan class_average otomatis, memperbarui, lalu menghapusnya', async () => {
      const uniqueTitle = `Try Out TDD Unik ${Date.now()}`

      const saveRes = await learningService.saveGrade({
        studentId: FAHRI_STUDENT_ID,
        classId: UTBK_CLASS_ID,
        tutorId: KAK_DIAN_TUTOR_ID,
        subjectName: 'Fisika UTBK',
        assessmentTitle: uniqueTitle,
        category: 'Try Out',
        score: 80,
        tutorFeedback: 'Bagus, pertahankan kecepatan menjawab.',
        assessmentDate: '2026-10-23',
      })

      expect(saveRes.success, `Save grade gagal: ${saveRes.success ? '' : saveRes.error}`).toBe(true)
      if (saveRes.success) {
        const createdGrade = saveRes.data
        expect(createdGrade.id).toBeDefined()
        expect(createdGrade.score).toBe(80)
        expect(createdGrade.classAverage).toBe(80)

        // Update skor ke 90
        const updateRes = await learningService.updateGrade(createdGrade.id, {
          score: 90,
          tutorFeedback: 'Meningkat drastis setelah pengayaan.',
        })

        expect(updateRes.success, `Update grade gagal: ${updateRes.success ? '' : updateRes.error}`).toBe(true)
        if (updateRes.success) {
          expect(updateRes.data.score).toBe(90)
          expect(updateRes.data.tutorFeedback).toContain('Meningkat drastis')
        }

        // Hapus nilai uji
        const delRes = await learningService.deleteGrade(createdGrade.id)
        expect(delRes.success).toBe(true)
      }
    })
  })

  // =========================================================================
  // 4. MULTI-CHILD RAPOR ORANG TUA
  // =========================================================================
  describe('Multi-Child Rapor Orang Tua', () => {
    it('mengambil nilai anak yang berbeda secara independen untuk orang tua Ahmad Dahlan', async () => {
      // Fahri Ramadhan (Anak 1)
      const fahriGrades = await learningService.getGradesByStudent(FAHRI_STUDENT_ID)
      // Alya Ramadhani (Anak 2)
      const alyaGrades = await learningService.getGradesByStudent('e1a2a3a4-b5b6-c7c8-d9d0-e1e2e3e4e5e7')

      expect(fahriGrades.length).toBeGreaterThan(0)
      expect(alyaGrades.length).toBeGreaterThan(0)

      // Pastikan mata pelajaran dan judul evaluasi keduanya terpisah
      expect(fahriGrades.some((g) => g.subjectName.includes('Fisika UTBK'))).toBe(true)
      expect(alyaGrades.some((g) => g.subjectName.includes('IPA Terpadu SMP'))).toBe(true)
    })
  })
})
