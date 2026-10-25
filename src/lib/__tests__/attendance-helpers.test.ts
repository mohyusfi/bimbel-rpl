import { describe, it, expect } from 'vitest'
import {
  isSessionLockedForTutor,
  isSessionOverdue,
  calculateAttendancePercentage,
} from '../attendance-helpers'

describe('Attendance Helpers — TDD Unit Tests', () => {
  describe('isSessionLockedForTutor (Audit Lock & 2h Grace Period)', () => {
    it('mengembalikan false jika sesi belum selesai (isCompleted = false)', () => {
      const session = {
        isCompleted: false,
        sessionDate: '2026-10-20',
      }
      expect(isSessionLockedForTutor(session, new Date('2026-10-23T12:00:00Z'))).toBe(false)
    })

    it('mengembalikan false jika sesi baru selesai dalam batas 2 jam (grace period aktif)', () => {
      const now = new Date('2026-10-23T12:00:00Z')
      const completedAt = new Date('2026-10-23T11:00:00Z') // 1 jam yang lalu
      const session = {
        isCompleted: true,
        sessionDate: '2026-10-23',
        completedAt: completedAt.toISOString(),
      }
      expect(isSessionLockedForTutor(session, now)).toBe(false)
    })

    it('mengembalikan true (terkunci) jika sesi selesai lebih dari 2 jam yang lalu', () => {
      const now = new Date('2026-10-23T12:00:00Z')
      const completedAt = new Date('2026-10-23T09:30:00Z') // 2.5 jam yang lalu
      const session = {
        isCompleted: true,
        sessionDate: '2026-10-23',
        completedAt: completedAt.toISOString(),
      }
      expect(isSessionLockedForTutor(session, now)).toBe(true)
    })

    it('menggunakan sessionDate jika completedAt tidak tersedia: terkunci jika sessionDate > 2 jam yang lalu', () => {
      const now = new Date('2026-10-25T12:00:00Z')
      const session = {
        isCompleted: true,
        sessionDate: '2026-10-20',
      }
      expect(isSessionLockedForTutor(session, now)).toBe(true)
    })
  })

  describe('isSessionOverdue (Deteksi Sesi Terlewat / Lampau)', () => {
    it('mengembalikan false jika sesi sudah selesai', () => {
      const session = {
        isCompleted: true,
        sessionDate: '2026-10-20',
      }
      expect(isSessionOverdue(session, new Date('2026-10-23T00:00:00Z'))).toBe(false)
    })

    it('mengembalikan false jika sesi belum selesai tetapi untuk hari ini atau masa depan', () => {
      const session = {
        isCompleted: false,
        sessionDate: '2026-10-23',
      }
      expect(isSessionOverdue(session, new Date('2026-10-23T00:00:00Z'))).toBe(false)

      const futureSession = {
        isCompleted: false,
        sessionDate: '2026-10-25',
      }
      expect(isSessionOverdue(futureSession, new Date('2026-10-23T00:00:00Z'))).toBe(false)
    })

    it('mengembalikan true jika sesi belum selesai dan tanggalnya sudah lewat (overdue)', () => {
      const session = {
        isCompleted: false,
        sessionDate: '2026-10-21',
      }
      expect(isSessionOverdue(session, new Date('2026-10-23T00:00:00Z'))).toBe(true)
    })
  })

  describe('calculateAttendancePercentage', () => {
    it('mengembalikan 100 jika belum ada sesi selesai (totalCompleted = 0)', () => {
      expect(calculateAttendancePercentage(0, 0)).toBe(100)
    })

    it('menghitung persentase kehadiran dengan pembulatan yang benar', () => {
      // 9 hadir dari 10 sesi = 90%
      expect(calculateAttendancePercentage(9, 10)).toBe(90)
      // 2 hadir dari 3 sesi = 67%
      expect(calculateAttendancePercentage(2, 3)).toBe(67)
      // 0 hadir dari 5 sesi = 0%
      expect(calculateAttendancePercentage(0, 5)).toBe(0)
    })
  })
})
