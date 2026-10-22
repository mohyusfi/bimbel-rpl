import { describe, it, expect, vi, beforeEach } from 'vitest'
import {
  generateRegistrationNumber,
  generateStudentNis,
  validateClassCapacityForTransfer,
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
})
