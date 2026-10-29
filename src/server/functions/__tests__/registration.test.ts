import { describe, it, expect, vi, beforeEach } from 'vitest'
import { submitRegistrationSchema } from '../registration'

describe('Registration Server Function — Validation Schema', () => {
  it('berhasil memvalidasi input lengkap dengan token Turnstile', () => {
    const validPayload = {
      studentName: 'Ahmad Dahlan',
      studentEmail: 'ahmad@example.com',
      studentPhone: '081234567890',
      studentSchool: 'SMAN 1 Palu',
      packageCode: 'UTBK' as const,
      packageName: 'Intensif UTBK-SNBT',
      parentName: 'Bapak Dahlan',
      parentEmail: 'bapak.dahlan@example.com',
      parentPhone: '081298765432',
      parentJob: 'PNS',
      parentAddress: 'Jl. Sam Ratulangi No. 10, Palu',
      turnstileToken: 'valid-turnstile-token-xyz',
    }

    const parsed = submitRegistrationSchema.parse(validPayload)
    expect(parsed.studentName).toBe('Ahmad Dahlan')
    expect(parsed.turnstileToken).toBe('valid-turnstile-token-xyz')
  })

  it('gagal memvalidasi jika turnstileToken kosong', () => {
    const invalidPayload = {
      studentName: 'Ahmad Dahlan',
      studentEmail: 'ahmad@example.com',
      studentPhone: '081234567890',
      studentSchool: 'SMAN 1 Palu',
      packageCode: 'UTBK' as const,
      packageName: 'Intensif UTBK-SNBT',
      parentName: 'Bapak Dahlan',
      parentEmail: 'bapak.dahlan@example.com',
      parentPhone: '081298765432',
      turnstileToken: '',
    }

    expect(() => submitRegistrationSchema.parse(invalidPayload)).toThrow(
      'Verifikasi bot wajib diselesaikan'
    )
  })

  it('gagal memvalidasi jika format email siswa tidak valid', () => {
    const invalidPayload = {
      studentName: 'Ahmad Dahlan',
      studentEmail: 'bukan-email-valid',
      studentPhone: '081234567890',
      studentSchool: 'SMAN 1 Palu',
      packageCode: 'UTBK' as const,
      packageName: 'Intensif UTBK-SNBT',
      parentName: 'Bapak Dahlan',
      parentPhone: '081298765432',
      turnstileToken: 'valid-token',
    }

    expect(() => submitRegistrationSchema.parse(invalidPayload)).toThrow(
      'Format email calon siswa tidak valid'
    )
  })
})
