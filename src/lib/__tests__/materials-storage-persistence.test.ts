import { describe, it, expect, beforeEach } from 'vitest'
import {
  adminStore,
  type LearningMaterial,
} from '../admin-store'
import {
  validateMaterialFile,
  validateMaterialFormat,
  validateMaterialFileSize,
  MAX_MATERIAL_FILE_SIZE_BYTES,
  ALLOWED_MATERIAL_EXTENSIONS,
  ALLOWED_MATERIAL_MIME_TYPES,
} from '../materials-validator'
import {
  materials,
  materialsRelations,
  classes,
  tutors,
  classesRelations,
  tutorsRelations,
  type Material as DrizzleMaterial,
  type NewMaterial,
} from '../../db/schema'

describe('Tiket 04 — Distribusi Modul Pembelajaran & Integrasi Cloud Storage', () => {
  beforeEach(() => {
    // Reset state store ke kondisi awal yang bersih untuk memastikan isolasi pengujian
    adminStore.resetToDefault()
  })

  // =========================================================================
  // 1. VALIDASI METADATA MATERI: FORMAT BERKAS LEGAL & PENOLAKAN BERKAS ILEGAL
  // =========================================================================
  describe('Validasi Format Berkas Legal (PDF & PPTX) dan Penolakan Berkas Ilegal', () => {
    it('mengizinkan berkas PDF dengan ekstensi .pdf huruf kecil maupun kapital', () => {
      const resLower = validateMaterialFormat('modul-fisika-mekanika.pdf', 'application/pdf')
      expect(resLower.valid).toBe(true)
      expect(resLower.fileType).toBe('PDF')
      expect(resLower.error).toBeUndefined()

      const resUpper = validateMaterialFormat('BANK_SOAL_UTBK_2026.PDF')
      expect(resUpper.valid).toBe(true)
      expect(resUpper.fileType).toBe('PDF')

      const resMixed = validateMaterialFormat('Latihan-Soal-Hots.Pdf')
      expect(resMixed.valid).toBe(true)
      expect(resMixed.fileType).toBe('PDF')
    })

    it('mengizinkan berkas presentasi PPTX dengan ekstensi .pptx dan MIME type resmi', () => {
      const res1 = validateMaterialFormat(
        'Arsitektur-REST-API.pptx',
        'application/vnd.openxmlformats-officedocument.presentationml.presentation'
      )
      expect(res1.valid).toBe(true)
      expect(res1.fileType).toBe('PPTX')
      expect(res1.error).toBeUndefined()

      const res2 = validateMaterialFormat('Slide_Presentasi_Logika.PPTX')
      expect(res2.valid).toBe(true)
      expect(res2.fileType).toBe('PPTX')

      const resMimeFallback = validateMaterialFormat('dokumen_tanpa_ekstensi', 'application/vnd.ms-powerpoint')
      expect(resMimeFallback.valid).toBe(true)
      expect(resMimeFallback.fileType).toBe('PPTX')

      const resWps = validateMaterialFormat('slide-materi.pptx', 'application/wps-office.pptx')
      expect(resWps.valid).toBe(true)
      expect(resWps.fileType).toBe('PPTX')
    })

    it('menolak format berkas selain PDF dan PPTX (DOCX, ZIP, EXE, JPG, MP4, dsb)', () => {
      const illegalFiles = [
        { name: 'modul-belajar.docx', type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' },
        { name: 'arsip-materi.zip', type: 'application/zip' },
        { name: 'skrip-otomatis.exe', type: 'application/x-msdownload' },
        { name: 'foto-papan-tulis.jpg', type: 'image/jpeg' },
        { name: 'tangkapan-layar.png', type: 'image/png' },
        { name: 'rekaman-kelas.mp4', type: 'video/mp4' },
        { name: 'skrip-berbahaya.sh', type: 'application/x-sh' },
        { name: 'payload.js', type: 'application/javascript' },
      ]

      for (const item of illegalFiles) {
        const result = validateMaterialFormat(item.name, item.type)
        expect(result.valid).toBe(false)
        expect(result.error).toBeDefined()
        expect(result.error).toContain('Hanya berkas PDF (.pdf) dan Presentasi (.pptx) yang diizinkan')
      }
    })

    it('menolak berkas tanpa nama atau nama kosong', () => {
      const res1 = validateMaterialFormat('')
      expect(res1.valid).toBe(false)
      expect(res1.error).toBe('Nama berkas tidak valid.')

      // @ts-expect-error Pengujian input null secara sengaja
      const res2 = validateMaterialFormat(null)
      expect(res2.valid).toBe(false)
      expect(res2.error).toBe('Nama berkas tidak valid.')
    })

    it('memastikan konstanta format berkas sesuai standar spesifikasi', () => {
      expect(ALLOWED_MATERIAL_EXTENSIONS).toContain('.pdf')
      expect(ALLOWED_MATERIAL_EXTENSIONS).toContain('.pptx')
      expect(ALLOWED_MATERIAL_EXTENSIONS.length).toBe(2)

      expect(ALLOWED_MATERIAL_MIME_TYPES).toContain('application/pdf')
      expect(ALLOWED_MATERIAL_MIME_TYPES).toContain(
        'application/vnd.openxmlformats-officedocument.presentationml.presentation'
      )
    })
  })

  // =========================================================================
  // 2. VALIDASI BATAS UKURAN BERKAS (LOLOS <= 20 MB & PENOLAKAN > 20 MB)
  // =========================================================================
  describe('Validasi Batas Ukuran Berkas Modul (Maksimal 20 MB)', () => {
    it('memastikan batas ukuran berkas bernilai tepat 20 MB (20,971,520 bytes)', () => {
      expect(MAX_MATERIAL_FILE_SIZE_BYTES).toBe(20 * 1024 * 1024)
      expect(MAX_MATERIAL_FILE_SIZE_BYTES).toBe(20971520)
    })

    it('mengizinkan berkas dengan ukuran di bawah atau tepat 20 MB', () => {
      // 500 KB
      const resSmall = validateMaterialFileSize(500 * 1024)
      expect(resSmall.valid).toBe(true)
      expect(resSmall.error).toBeUndefined()

      // 3.7 MB (ukuran rata-rata modul PDF contoh)
      const resMedium = validateMaterialFileSize(Math.round(3.7 * 1024 * 1024))
      expect(resMedium.valid).toBe(true)

      // 19.9 MB
      const resAlmostMax = validateMaterialFileSize(Math.round(19.9 * 1024 * 1024))
      expect(resAlmostMax.valid).toBe(true)

      // Tepat 20 MB (Boundary Test batas atas)
      const resExactMax = validateMaterialFileSize(MAX_MATERIAL_FILE_SIZE_BYTES)
      expect(resExactMax.valid).toBe(true)
    })

    it('menolak berkas yang melebihi batas 20 MB (Boundary Test 20 MB + 1 byte)', () => {
      // Tepat 20 MB + 1 byte
      const resOverByOne = validateMaterialFileSize(MAX_MATERIAL_FILE_SIZE_BYTES + 1)
      expect(resOverByOne.valid).toBe(false)
      expect(resOverByOne.error).toContain('melebihi batas maksimum 20 MB')

      // 20.5 MB
      const resOver1 = validateMaterialFileSize(Math.round(20.5 * 1024 * 1024))
      expect(resOver1.valid).toBe(false)
      expect(resOver1.error).toContain('melebihi batas maksimum 20 MB')

      // 50 MB
      const resBig = validateMaterialFileSize(50 * 1024 * 1024)
      expect(resBig.valid).toBe(false)
      expect(resBig.error).toContain('melebihi batas maksimum 20 MB')
    })

    it('menolak berkas kosong 0 bytes atau ukuran tidak valid (negatif, NaN)', () => {
      const resZero = validateMaterialFileSize(0)
      expect(resZero.valid).toBe(false)
      expect(resZero.error).toContain('Berkas kosong')

      const resNegative = validateMaterialFileSize(-1024)
      expect(resNegative.valid).toBe(false)
      expect(resNegative.error).toContain('Ukuran berkas tidak valid')

      const resNaN = validateMaterialFileSize(NaN)
      expect(resNaN.valid).toBe(false)
      expect(resNaN.error).toContain('Ukuran berkas tidak valid')
    })

    it('memvalidasi berkas secara menyeluruh lewat helper validateMaterialFile', () => {
      // Sukses: PDF 5 MB
      const validPdf = validateMaterialFile({
        name: 'Modul-Geometri-Analitik.pdf',
        size: 5 * 1024 * 1024,
        type: 'application/pdf',
      })
      expect(validPdf.valid).toBe(true)
      expect(validPdf.fileType).toBe('PDF')

      // Sukses: PPTX 12 MB
      const validPptx = validateMaterialFile({
        name: 'Slide-Fisika-Termodinamika.pptx',
        size: 12 * 1024 * 1024,
        type: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      })
      expect(validPptx.valid).toBe(true)
      expect(validPptx.fileType).toBe('PPTX')

      // Gagal karena format ilegal
      const invalidFormat = validateMaterialFile({
        name: 'Video-Tutorial.mp4',
        size: 5 * 1024 * 1024,
        type: 'video/mp4',
      })
      expect(invalidFormat.valid).toBe(false)
      expect(invalidFormat.error).toContain('Format berkas tidak didukung')

      // Gagal karena ukuran melebihi 20 MB (walau formatnya PDF)
      const oversizedPdf = validateMaterialFile({
        name: 'Ensiklopedia-Besar.pdf',
        size: 25 * 1024 * 1024,
        type: 'application/pdf',
      })
      expect(oversizedPdf.valid).toBe(false)
      expect(oversizedPdf.error).toContain('melebihi batas maksimum 20 MB')
    })
  })

  // =========================================================================
  // 3. PEMETAAN MODUL MATERI KE ROMBEL KELAS YANG TEPAT
  // =========================================================================
  describe('Pemetaan Modul Materi ke Rombel Kelas yang Tepat', () => {
    it('memastikan modul materi terpetakan ke rombel kelas yang sesuai', () => {
      const state = adminStore.getState()
      const allMaterials = state.learningMaterials
      expect(allMaterials.length).toBeGreaterThan(0)

      // Ambil rombel pertama (UTBK Intensif A - cls-1)
      const class1 = state.classes.find((c) => c.id === 'cls-1')
      expect(class1).toBeDefined()

      // Materi yang dipetakan ke cls-1
      const class1Materials = allMaterials.filter(
        (m) => m.classId === class1?.id || m.classId === 'ALL'
      )
      expect(class1Materials.length).toBeGreaterThan(0)
      for (const m of class1Materials) {
        expect(['cls-1', 'ALL']).toContain(m.classId)
      }
    })

    it('mengisolasi materi kelas sehingga tidak bocor ke rombel kelas lain', () => {
      // Tambahkan modul khusus kelas Kedinasan (cls-2)
      const kedinasanMaterial = adminStore.addLearningMaterial({
        classId: 'cls-2',
        className: 'Kedinasan & Poltek',
        subjectName: 'Tes Potensi Akademik',
        title: 'Modul Rahasia Strategi Lolos SKD Kedinasan.pdf',
        description: 'Materi intensif kisi-kisi dan pembahasan soal SKD CAT.',
        category: 'Modul Teori',
        tutorId: 'tut-1',
        tutorName: 'Kak Dian Pratiwi, S.Si',
        fileType: 'PDF',
        fileSize: '4.2 MB',
        fileUrl: 'https://rtamiwffuaxwzyjkocmj.supabase.co/storage/v1/object/public/learning-materials/cls-2/skd.pdf',
      })

      const state = adminStore.getState()

      // Siswa kelas UTBK Intensif A (cls-1)
      const studentClass1Materials = state.learningMaterials.filter(
        (m) => m.classId === 'cls-1'
      )
      // Modul kedinasan tidak boleh ada di daftar materi siswa kelas UTBK Intensif A
      const leaked = studentClass1Materials.some((m) => m.id === kedinasanMaterial.id)
      expect(leaked).toBe(false)

      // Sebaliknya, siswa kelas Kedinasan (cls-2) harus mendapatkan modul ini
      const studentClass2Materials = state.learningMaterials.filter(
        (m) => m.classId === 'cls-2'
      )
      const foundInClass2 = studentClass2Materials.some((m) => m.id === kedinasanMaterial.id)
      expect(foundInClass2).toBe(true)
    })

    it('mengizinkan materi umum (classId: ALL) dapat diakses oleh seluruh rombel siswa', () => {
      const generalMaterial = adminStore.addLearningMaterial({
        classId: 'ALL',
        className: 'Semua Rombel',
        subjectName: 'Panduan Umum Bimbel',
        title: 'Buku Pedoman Belajar & Tata Tertib Siswa Tadulako Cendekia.pdf',
        description: 'Panduan tata tertib, etika bimbingan, dan jadwal kalender akademik.',
        category: 'Modul Teori',
        tutorId: 'tut-1',
        tutorName: 'Kak Dian Pratiwi, S.Si',
        fileType: 'PDF',
        fileSize: '1.2 MB',
        fileUrl: 'https://rtamiwffuaxwzyjkocmj.supabase.co/storage/v1/object/public/learning-materials/general/pedoman.pdf',
      })

      const state = adminStore.getState()

      // Logika resolver modul siswa (kelas siswa ATAU ALL)
      const resolveForClass = (classId: string) =>
        state.learningMaterials.filter((m) => m.classId === classId || m.classId === 'ALL')

      const materialsForClass1 = resolveForClass('cls-1')
      const materialsForClass2 = resolveForClass('cls-2')

      expect(materialsForClass1.some((m) => m.id === generalMaterial.id)).toBe(true)
      expect(materialsForClass2.some((m) => m.id === generalMaterial.id)).toBe(true)
    })
  })

  // =========================================================================
  // 4. OPERASI CRUD MODUL (CREATE, QUERY PER KELAS/TUTOR, DELETE)
  // =========================================================================
  describe('Operasi CRUD Modul Pembelajaran', () => {
    it('CREATE: berhasil menambahkan modul baru dengan metadata lengkap dan memicu notifikasi sistem', () => {
      const initialCount = adminStore.getState().learningMaterials.length
      const initialNotifCount = adminStore.getState().notifications.length

      const payload: Omit<LearningMaterial, 'id' | 'uploadedAt'> = {
        classId: 'cls-1',
        className: 'UTBK Intensif A',
        subjectName: 'Kimia UTBK',
        title: 'Stoikiometri dan Larutan Asam Basa.pdf',
        description: 'Ringkasan komprehensif konsep mol, tetapan kesetimbangan, dan latihan soal SNBT.',
        category: 'Modul Teori',
        tutorId: 'tut-2',
        tutorName: 'Pak Hendra Wijaya, M.Pd',
        fileType: 'PDF',
        fileSize: '2.8 MB',
        fileUrl: 'https://rtamiwffuaxwzyjkocmj.supabase.co/storage/v1/object/public/learning-materials/cls-1/stoikiometri.pdf',
        storagePath: 'cls-1/stoikiometri.pdf',
      }

      const created = adminStore.addLearningMaterial(payload)

      expect(created).toBeDefined()
      expect(created.id).toBeDefined()
      expect(created.title).toBe(payload.title)
      expect(created.subjectName).toBe(payload.subjectName)
      expect(created.fileType).toBe('PDF')
      expect(created.uploadedAt).toBeDefined()

      const state = adminStore.getState()
      expect(state.learningMaterials.length).toBe(initialCount + 1)
      expect(state.learningMaterials[0].id).toBe(created.id)

      // Memastikan notifikasi penambahan modul terbit otomatis
      expect(state.notifications.length).toBe(initialNotifCount + 1)
      const latestNotif = state.notifications[0]
      expect(latestNotif.title).toBe('Modul Belajar Baru Diunggah')
      expect(latestNotif.message).toContain(payload.title)
    })

    it('READ: berhasil memfilter modul berdasarkan rombel kelas dan kategori', () => {
      const state = adminStore.getState()

      // Filter per kelas
      const cls1Items = state.learningMaterials.filter((m) => m.classId === 'cls-1')
      expect(cls1Items.length).toBeGreaterThan(0)
      for (const item of cls1Items) {
        expect(item.classId).toBe('cls-1')
      }

      // Filter per kategori
      const theoryItems = state.learningMaterials.filter((m) => m.category === 'Modul Teori')
      for (const item of theoryItems) {
        expect(item.category).toBe('Modul Teori')
      }

      const questionBankItems = state.learningMaterials.filter((m) => m.category === 'Bank Soal')
      for (const item of questionBankItems) {
        expect(item.category).toBe('Bank Soal')
      }
    })

    it('READ: berhasil memfilter modul materi berdasarkan pengampu (tutorId)', () => {
      const state = adminStore.getState()
      const tutor1Id = 'tut-1'
      const tutor1Materials = state.learningMaterials.filter((m) => m.tutorId === tutor1Id)

      expect(tutor1Materials.length).toBeGreaterThan(0)
      for (const m of tutor1Materials) {
        expect(m.tutorId).toBe(tutor1Id)
      }
    })

    it('DELETE: berhasil menghapus modul pembelajaran berdasarkan ID', () => {
      // Buat modul sementara untuk dihapus
      const tempMaterial = adminStore.addLearningMaterial({
        classId: 'cls-1',
        className: 'UTBK Intensif A',
        subjectName: 'Bahasa Indonesia',
        title: 'Materi Uji Hapus.pdf',
        description: 'Modul sementara yang akan diuji hapus.',
        category: 'Lembar Tugas',
        tutorId: 'tut-1',
        tutorName: 'Kak Dian Pratiwi, S.Si',
        fileType: 'PDF',
        fileSize: '500 KB',
        fileUrl: 'https://rtamiwffuaxwzyjkocmj.supabase.co/storage/v1/object/public/learning-materials/temp.pdf',
      })

      expect(adminStore.getState().learningMaterials.some((m) => m.id === tempMaterial.id)).toBe(true)

      // Eksekusi hapus
      const deleteResult = adminStore.deleteLearningMaterial(tempMaterial.id)
      expect(deleteResult).toBe(true)

      // Verifikasi modul sudah tereliminasi dari state
      const isStillPresent = adminStore
        .getState()
        .learningMaterials.some((m) => m.id === tempMaterial.id)
      expect(isStillPresent).toBe(false)
    })

    it('DELETE: penghapusan bersifat idempoten dan tidak menimbulkan crash bila ID tidak ditemukan', () => {
      const nonExistentId = 'mat-non-existent-9999'
      const initialCount = adminStore.getState().learningMaterials.length

      const deleteResult = adminStore.deleteLearningMaterial(nonExistentId)
      expect(deleteResult).toBe(true)
      expect(adminStore.getState().learningMaterials.length).toBe(initialCount)
    })
  })

  // =========================================================================
  // 5. VALIDASI RELASI DATA DRIZZLE & INTEGRITAS TIPE DATA TYPESCRIPT
  // =========================================================================
  describe('Validasi Relasi Data Drizzle & Integritas Tipe Data TypeScript', () => {
    it('memastikan skema Drizzle materials memiliki kolom metadata lengkap', () => {
      expect(materials).toBeDefined()
      expect(materials.id).toBeDefined()
      expect(materials.classId).toBeDefined()
      expect(materials.tutorId).toBeDefined()
      expect(materials.title).toBeDefined()
      expect(materials.description).toBeDefined()
      expect(materials.category).toBeDefined()
      expect(materials.fileType).toBeDefined()
      expect(materials.fileSize).toBeDefined()
      expect(materials.fileUrl).toBeDefined()
      expect(materials.storagePath).toBeDefined()
      expect(materials.createdAt).toBeDefined()
    })

    it('memastikan relasi Drizzle materialsRelations terhubung ke tabel classes dan tutors', () => {
      expect(materialsRelations).toBeDefined()
      expect(materialsRelations.table).toBe(materials)

      // Memastikan relasi dua arah pada classes dan tutors terdaftar
      expect(classesRelations).toBeDefined()
      expect(tutorsRelations).toBeDefined()
    })

    it('memvalidasi integritas tipe data TypeScript untuk payload NewMaterial dan Material', () => {
      // Kontrak tipe NewMaterial (Insert Model Drizzle)
      const validInsertPayload: NewMaterial = {
        classId: '11111111-2222-3333-4444-555555555555',
        tutorId: '22222222-3333-4444-5555-666666666666',
        title: 'Mekanika Fluida & Termodinamika Fisika',
        description: 'Ringkasan komprehensif rumus dan pembahasan latihan soal.',
        category: 'Modul Teori',
        fileType: 'PDF',
        fileSize: '3.7 MB',
        fileUrl: 'https://rtamiwffuaxwzyjkocmj.supabase.co/storage/v1/object/public/learning-materials/cls-1/mekanika.pdf',
        storagePath: 'cls-1/mekanika.pdf',
      }

      expect(validInsertPayload.title).toBe('Mekanika Fluida & Termodinamika Fisika')
      expect(validInsertPayload.fileType).toBe('PDF')
      expect(validInsertPayload.category).toBe('Modul Teori')

      // Kontrak tipe DrizzleMaterial (Select Model Drizzle)
      const validSelectModel: DrizzleMaterial = {
        id: '99999999-8888-7777-6666-555555555555',
        classId: '11111111-2222-3333-4444-555555555555',
        tutorId: '22222222-3333-4444-5555-666666666666',
        title: 'Presentasi Slide PPTX Arsitektur Sistem',
        description: 'Slide pendalaman konsep REST API.',
        category: 'Modul Teori',
        fileType: 'PPTX',
        fileSize: '160 KB',
        fileUrl: 'https://rtamiwffuaxwzyjkocmj.supabase.co/storage/v1/object/public/learning-materials/cls-1/arsitektur.pptx',
        storagePath: 'cls-1/arsitektur.pptx',
        createdAt: new Date(),
      }

      expect(validSelectModel.id).toBeDefined()
      expect(validSelectModel.fileType).toBe('PPTX')
      expect(validSelectModel.createdAt).toBeInstanceOf(Date)
    })
  })
})
