import { createServerFn } from '@tanstack/react-start'
import { z } from 'zod'
import type { Registration } from '~/lib/admin-store'
import type { ServerResult } from '~/server/services/registration.service'

export const submitRegistrationSchema = z.object({
  studentName: z.string().min(1, 'Nama lengkap calon siswa wajib diisi'),
  studentEmail: z.string().email('Format email calon siswa tidak valid'),
  studentPhone: z.string().min(1, 'Nomor WhatsApp calon siswa wajib diisi'),
  studentSchool: z.string().min(1, 'Asal sekolah calon siswa wajib diisi'),
  packageCode: z.enum(['UTBK', 'SMA', 'SMP', 'SD']),
  packageName: z.string().min(1, 'Nama paket bimbingan belajar wajib diisi'),
  parentName: z.string().min(1, 'Nama orang tua/wali wajib diisi'),
  parentEmail: z.string().email('Format email orang tua tidak valid').optional().or(z.literal('')),
  parentPhone: z.string().min(1, 'Nomor WhatsApp orang tua/wali wajib diisi'),
  parentJob: z.string().optional(),
  parentAddress: z.string().optional(),
  turnstileToken: z.string().min(1, 'Verifikasi bot wajib diselesaikan.'),
})

export type SubmitRegistrationInput = z.infer<typeof submitRegistrationSchema>

export const submitRegistrationWithTurnstileFn = createServerFn({ method: 'POST' })
  .validator((d: unknown) => submitRegistrationSchema.parse(d))
  .handler(async ({ data }): Promise<ServerResult<Registration>> => {
    // 1. Verifikasi token Turnstile terlebih dahulu
    const { turnstileService } = await import('~/server/services/turnstile.service')
    const verifyResult = await turnstileService.verifyToken(data.turnstileToken, {
      expectedAction: 'signup',
    })

    if (!verifyResult.success) {
      console.warn('[WARN] Pendaftaran diblokir: Verifikasi Turnstile gagal', verifyResult.error)
      return {
        success: false,
        error: verifyResult.error || 'Verifikasi keamanan bot gagal. Silakan coba kembali.',
        code: verifyResult.code || 'BOT_VERIFICATION_FAILED',
      }
    }

    // 2. Simpan data pendaftaran via registrationService
    const { registrationService } = await import('~/server/services/registration.service')
    const createResult = await registrationService.createRegistration({
      studentName: data.studentName,
      studentEmail: data.studentEmail,
      studentPhone: data.studentPhone,
      studentSchool: data.studentSchool,
      packageCode: data.packageCode,
      packageName: data.packageName,
      parentName: data.parentName,
      parentEmail: data.parentEmail || undefined,
      parentPhone: data.parentPhone,
      parentJob: data.parentJob,
      parentAddress: data.parentAddress,
    })

    return createResult
  })
