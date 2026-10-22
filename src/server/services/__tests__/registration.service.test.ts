import { describe, it, expect, vi, beforeEach } from 'vitest'
import {
  generateRegistrationNumber,
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

  describe('validasi kapasitas rombel maksimal 12 siswa', () => {
    it('memastikan batas kapasitas rombel tidak melebihi 12', () => {
      expect(clampCapacity(15)).toBe(12)
      expect(clampCapacity(12)).toBe(12)
      expect(clampCapacity(5)).toBe(5)
    })
  })
})
