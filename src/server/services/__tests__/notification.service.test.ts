import { describe, it, expect, beforeEach, vi } from 'vitest'

const mocks = vi.hoisted(() => {
  const notificationsData: Array<Record<string, any>> = []
  const profileRows: Array<{ id: string }> = []
  const inCalls: string[][] = []

  const fakeClient = {
    from(table: string) {
      if (table === 'profiles') {
        return {
          select: () => ({
            eq: async () => ({ data: profileRows }),
          }),
        }
      }
      return {
        select: () => ({
          in: (_col: string, values: string[]) => {
            inCalls.push(values)
            return {
              order: () => ({
                limit: async () => ({ data: notificationsData, error: null }),
              }),
            }
          },
        }),
      }
    },
  }

  return { notificationsData, profileRows, inCalls, fakeClient }
})

vi.mock('~/lib/supabase/client', () => ({ supabase: mocks.fakeClient }))
vi.mock('../billing.service', () => ({
  getIsolatedAdminClient: async () => mocks.fakeClient,
}))

import { notificationService } from '../notification.service'

const TUTOR_UUID = '11111111-1111-1111-1111-111111111111'

describe('notificationService.getInbox', () => {
  beforeEach(() => {
    mocks.notificationsData.length = 0
    mocks.profileRows.length = 0
    mocks.inCalls.length = 0
  })

  it('mengembalikan notifikasi milik user dan mengecualikan pengumuman yang dihapus', async () => {
    mocks.notificationsData.push(
      {
        id: 'n-1',
        user_id: TUTOR_UUID,
        title: 'PENGUMUMAN: SPP akan dinaikkan',
        message: 'SPP naik.',
        type: 'announcement',
        link_url: '/tutor',
        is_read: false,
        metadata: { announcementId: 'ann-1', targetAudience: 'Semua', recipientRole: 'tutor' },
        created_at: '2026-10-25T08:33:42Z',
      },
      {
        id: 'n-2',
        user_id: TUTOR_UUID,
        title: 'Pengumuman lama',
        message: 'sudah dihapus',
        type: 'announcement_deleted',
        link_url: null,
        is_read: false,
        metadata: { isDeleted: true },
        created_at: '2026-10-24T08:00:00Z',
      },
      {
        id: 'n-3',
        user_id: TUTOR_UUID,
        title: 'Pengumuman soft-deleted',
        message: 'juga dihapus',
        type: 'announcement',
        link_url: null,
        is_read: false,
        metadata: { isDeleted: true },
        created_at: '2026-10-23T08:00:00Z',
      }
    )

    const res = await notificationService.getInbox({ userIds: [TUTOR_UUID] })

    expect(res.success).toBe(true)
    if (!res.success) return
    expect(res.data.length).toBe(1)
    expect(res.data[0].id).toBe('n-1')
    expect(res.data[0].metadata?.recipientRole).toBe('tutor')
    expect(mocks.inCalls[0]).toContain(TUTOR_UUID)
  })

  it('menyaring id legacy non-UUID sebelum query (mencegah PostgREST 400 invalid uuid)', async () => {
    const PARENT_UUID = '22222222-2222-2222-2222-222222222222'
    mocks.notificationsData.push({
      id: 'n-1',
      user_id: PARENT_UUID,
      title: 'Presensi Anak: Alpa',
      message: 'tercatat alpa',
      type: 'attendance',
      link_url: '/parent/kehadiran',
      is_read: false,
      metadata: { sessionId: 's-1' },
      created_at: '2026-10-25T08:33:42Z',
    })

    const res = await notificationService.getInbox({
      userIds: ['par-1', 'stu-1', PARENT_UUID],
    })

    expect(res.success).toBe(true)
    // Id legacy (par-1/stu-1) harus dibuang; hanya UUID valid yang dikirim ke PostgREST.
    expect(mocks.inCalls[0]).toEqual([PARENT_UUID])
    expect(mocks.inCalls[0]).not.toContain('par-1')
    expect(mocks.inCalls[0]).not.toContain('stu-1')
  })

  it('tidak menjalankan query bila semua id non-UUID (fallback aman)', async () => {
    const res = await notificationService.getInbox({ userIds: ['par-1', 'stu-1'] })
    expect(res.success).toBe(true)
    if (!res.success) return
    expect(res.data).toEqual([])
    expect(mocks.inCalls.length).toBe(0)
  })

  it('me-resolve profile_id dari email lalu memuat kotak masuk', async () => {
    mocks.profileRows.push({ id: TUTOR_UUID })
    mocks.notificationsData.push({
      id: 'n-1',
      user_id: TUTOR_UUID,
      title: 'Halo Tutor',
      message: 'pesan',
      type: 'general',
      link_url: null,
      is_read: true,
      metadata: null,
      created_at: '2026-10-25T08:33:42Z',
    })

    const res = await notificationService.getInbox({
      email: 'dian.pratiwi@tadulakocendekia.sch.id',
    })

    expect(res.success).toBe(true)
    if (!res.success) return
    expect(res.data.length).toBe(1)
    expect(mocks.inCalls[0]).toContain(TUTOR_UUID)
  })

  it('mengembalikan array kosong bila tidak ada id maupun email', async () => {
    const res = await notificationService.getInbox({})
    expect(res.success).toBe(true)
    if (!res.success) return
    expect(res.data).toEqual([])
  })
})
