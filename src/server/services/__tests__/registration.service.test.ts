import { describe, it, expect, vi, beforeEach } from 'vitest'
import {
  generateRegistrationNumber,
  generateStudentNis,
  validateClassCapacityForTransfer,
  validateStudentEmailAvailability,
  validateEmailFormat,
  registrationService,
  clampCapacity,
} from '../registration.service'

describe('RegistrationService — TDD Unit Tests', () => {
  describe('generateRegistrationNumber', () => {
    it('menghasilkan nomor tiket dengan format REG-YYYYMM-XXXX', () => {
      const regNumber = generateRegistrationNumber(1)
      const now = new Date()
      const yearMonth = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}`
      expect(regNumber).toMatch(new RegExp(`^REG-${yearMonth}-\\d{4}$`))
      expect(regNumber).toContain('0001')
    })

    it('memformat urutan angka dengan padding 4 digit', () => {
      expect(generateRegistrationNumber(42)).toContain('0042')
      expect(generateRegistrationNumber(1234)).toContain('1234')
    })
  })

  describe('generateStudentNis', () => {
    it('menghasilkan NIS dengan format TC-YYYY-XXX dengan 3 digit padding', () => {
      expect(generateStudentNis(1, 2026)).toBe('TC-2026-001')
      expect(generateStudentNis(42, 2026)).toBe('TC-2026-042')
      expect(generateStudentNis(105, 2026)).toBe('TC-2026-105')
    })
  })

  describe('validasi kapasitas rombel maksimal 12 siswa', () => {
    it('memastikan batas kapasitas rombel tidak melebihi 12', () => {
      expect(clampCapacity(15)).toBe(12)
      expect(clampCapacity(12)).toBe(12)
      expect(clampCapacity(5)).toBe(5)
    })

    it('menolak penambahan/mutasi jika rombel sudah mencapai kapasitas 12 siswa', () => {
      const resFull = validateClassCapacityForTransfer(12, 12, 'UTBK Intensif A')
      expect(resFull.valid).toBe(false)
      expect(resFull.error).toContain('sudah penuh')
      expect(resFull.error).toContain('12/12 siswa')

      const resExceed = validateClassCapacityForTransfer(13, 12, 'UTBK Intensif A')
      expect(resExceed.valid).toBe(false)
    })

    it('mengizinkan mutasi jika rombel masih memiliki kursi kosong (< 12)', () => {
      const resOk = validateClassCapacityForTransfer(11, 12, 'UTBK Intensif A')
      expect(resOk.valid).toBe(true)
      expect(resOk.error).toBeUndefined()
    })
  })

  describe('Service Interface — getStudentById & updateStudent Contracts', () => {
    it('mengembalikan error gracefully jika mencari ID siswa yang tidak ada', async () => {
      const res = await registrationService.getStudentById('00000000-0000-0000-0000-000000000000')
      expect(res.success).toBe(false)
      if (!res.success) {
        expect(res.error).toContain('tidak ditemukan')
      }
    })

    it('menolak updateStudent jika ID siswa tidak ada di database', async () => {
      const res = await registrationService.updateStudent({
        id: '00000000-0000-0000-0000-000000000000',
        name: 'Siswa Fiktif',
        email: 'fiktif@email.com',
        phone: '081234567890',
        school: 'SMAN 1 Palu',
        classId: 'cls-1',
        parentName: 'Wali Fiktif',
        parentPhone: '081234567891',
        status: 'aktif',
      })
      expect(res.success).toBe(false)
      if (!res.success) {
        expect(res.error).toContain('tidak ditemukan')
      }
    })
  })

  describe('validasi keunikan email calon siswa (validateStudentEmailAvailability)', () => {
    it('memvalidasi format email yang benar dan menolak format salah', () => {
      expect(validateEmailFormat('siswa@contoh.com')).toBe(true)
      expect(validateEmailFormat('siswa.baru@tadulako.sch.id')).toBe(true)
      expect(validateEmailFormat('bukan-email')).toBe(false)
      expect(validateEmailFormat('siswa@')).toBe(false)
      expect(validateEmailFormat('@domain.com')).toBe(false)
    })

    it('menolak jika email siswa dan email orang tua sama persis', async () => {
      const res = await validateStudentEmailAvailability('sama@contoh.com', 'sama@contoh.com')
      expect(res.available).toBe(false)
      expect(res.error).toContain('tidak boleh sama')
    })

    it('menolak jika email sudah terdaftar sebagai siswa aktif', async () => {
      const res = await validateStudentEmailAvailability('akbar@contoh.com', 'ortu@contoh.com', {
        existingStudents: [
          { email: 'akbar@contoh.com', status: 'aktif' },
        ],
      })
      expect(res.available).toBe(false)
      expect(res.error).toContain('siswa aktif')
    })

    it('menolak jika email tercatat sebagai siswa nonaktif dan memberikan arahan ke Tata Usaha', async () => {
      const res = await validateStudentEmailAvailability('alumni@contoh.com', 'ortu@contoh.com', {
        existingStudents: [
          { email: 'alumni@contoh.com', status: 'nonaktif' },
        ],
      })
      expect(res.available).toBe(false)
      expect(res.error).toContain('siswa nonaktif')
      expect(res.error).toContain('Tata Usaha')
    })

    it('menolak jika email calon siswa sedang menunggu verifikasi admin', async () => {
      const res = await validateStudentEmailAvailability('pending@contoh.com', 'ortu@contoh.com', {
        existingRegistrations: [
          { studentEmail: 'pending@contoh.com', status: 'menunggu' },
        ],
      })
      expect(res.available).toBe(false)
      expect(res.error).toContain('menunggu verifikasi')
    })

    it('mengizinkan pendaftaran jika email sebelumnya pernah ditolak (status ditolak)', async () => {
      const res = await validateStudentEmailAvailability('ditolak@contoh.com', 'ortu@contoh.com', {
        existingRegistrations: [
          { studentEmail: 'ditolak@contoh.com', status: 'ditolak' },
        ],
        existingStudents: [],
      })
      expect(res.available).toBe(true)
      expect(res.error).toBeUndefined()
    })

    it('mengizinkan email orang tua yang sama untuk anak kedua (multi-child)', async () => {
      const res = await validateStudentEmailAvailability('anak2@contoh.com', 'ortu.setia@contoh.com', {
        existingStudents: [
          { email: 'anak1@contoh.com', status: 'aktif' },
        ],
        existingRegistrations: [],
      })
      expect(res.available).toBe(true)
      expect(res.error).toBeUndefined()
    })

    it('menolak createRegistration jika email siswa dan orang tua sama', async () => {
      const res = await registrationService.createRegistration({
        studentName: 'Siswa Test',
        studentEmail: 'sama@contoh.com',
        studentPhone: '081234567890',
        studentSchool: 'SMAN 1 Palu',
        packageCode: 'UTBK',
        packageName: 'Intensif UTBK-SNBT',
        parentName: 'Ortu Test',
        parentEmail: 'sama@contoh.com',
        parentPhone: '081234567891',
      })
      expect(res.success).toBe(false)
      if (!res.success) {
        expect(res.error).toContain('tidak boleh sama')
      }
    })
  })
})
