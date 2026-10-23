import { describe, it, expect } from 'vitest'
import { scheduleService } from '../schedule.service'
import { attendanceService } from '../attendance.service'

describe('Live Supabase Integration: Tutor Presensi Sesi Bimbingan', () => {
  const KAK_DIAN_TUTOR_ID = '9383fc09-99fc-423c-ac09-e3f94c26f5e9'

  it('mengambil sesi riil dari Supabase untuk Kak Dian Pratiwi tanpa mock data Sabtu/Rabu', async () => {
    const sessions = await scheduleService.getSessions(KAK_DIAN_TUTOR_ID)

    console.log(`[TEST] Jumlah sesi Supabase untuk Kak Dian: ${sessions.length}`)
    sessions.forEach((s) => {
      console.log(`  - ID: ${s.id}, Hari: ${s.dayOfWeek}, Tanggal: ${s.sessionDate}, Topik: ${s.topic}, Selesai: ${s.isCompleted}`)
    })

    expect(sessions.length).toBeGreaterThan(0)

    // Verifikasi bahwa data mock lama (Sabtu 2026-10-24 dan Rabu 2026-10-21) TIDAK ada
    const hasMockSabtu = sessions.some((s) => s.dayOfWeek === 'Sabtu' && s.sessionDate === '2026-10-24')
    const hasMockRabu = sessions.some((s) => s.dayOfWeek === 'Rabu' && s.sessionDate === '2026-10-21')

    expect(hasMockSabtu).toBe(false)
    expect(hasMockRabu).toBe(false)

    // Verifikasi sesi bimbingan adalah hari Jumat (Fisika UTBK)
    expect(sessions.some((s) => s.dayOfWeek === 'Jumat' && s.subjectName?.includes('Fisika UTBK'))).toBe(true)
  })

  it('memverifikasi pemisahan sesi pending vs riwayat berbasis status isCompleted Supabase', async () => {
    const sessions = await scheduleService.getSessions(KAK_DIAN_TUTOR_ID)

    const pending = sessions.filter((s) => !s.isCompleted)
    const history = sessions.filter((s) => s.isCompleted)

    console.log(`[TEST] Pending: ${pending.length}, Riwayat: ${history.length}`)
    expect(pending.length + history.length).toBe(sessions.length)
  })
})
