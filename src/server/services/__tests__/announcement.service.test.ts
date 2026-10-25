import { describe, it, expect, vi, beforeEach } from 'vitest'
import { announcementService } from '../announcement.service'
import { adminStore } from '~/lib/admin-store'
import { pushNotificationService } from '../push-notification.service'

describe('AnnouncementService (TDD Seam)', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
    pushNotificationService.clearMemorySubscriptions()
  })

  it('1. berhasil menerbitkan pengumuman baru untuk semua audiens (Semua)', async () => {
    const title = `Uji Coba Pengumuman Akbar ${Date.now()}`
    const content = 'Seluruh siswa dan orang tua diimbau menghadiri sosialisasi CBT.'

    const res = await announcementService.createAnnouncement({
      title,
      content,
      targetAudience: 'Semua',
      isPinned: true,
      broadcast: true,
    })

    expect(res.success).toBe(true)
    if (!res.success) throw new Error(res.error)

    expect(res.data.title).toBe(title)
    expect(res.data.targetAudience).toBe('Semua')
    expect(res.data.isPinned).toBe(true)
    expect(res.data.id).toBeDefined()

    // Verifikasi pengumuman tersimpan dan dapat diambil via service
    const list = await announcementService.getAnnouncements({ role: 'admin' })
    expect(list.success).toBe(true)
    if (list.success) {
      expect(list.data.some((a) => a.id === res.data.id || a.title === title)).toBe(true)
    }
  }, 45000)

  it('2. berhasil menyaring pengumuman berdasarkan audiens spesifik (Siswa / Tutor)', async () => {
    const studentTitle = `Pengumuman Khusus Siswa ${Date.now()}`
    const resStudent = await announcementService.createAnnouncement({
      title: studentTitle,
      content: 'Pengingat materi persiapan TO SNBT.',
      targetAudience: 'Siswa',
      isPinned: false,
      broadcast: false,
    })
    expect(resStudent.success).toBe(true)

    // Query untuk siswa
    const studentList = await announcementService.getAnnouncements({ role: 'student' })
    expect(studentList.success).toBe(true)
    if (studentList.success) {
      expect(studentList.data.some((a) => a.title === studentTitle)).toBe(true)
    }

    // Query untuk tutor tidak boleh memuat pengumuman khusus siswa
    const tutorList = await announcementService.getAnnouncements({ role: 'tutor' })
    expect(tutorList.success).toBe(true)
    if (tutorList.success) {
      expect(tutorList.data.some((a) => a.title === studentTitle)).toBe(false)
    }
  }, 45000)

  it('3. mengurutkan pengumuman dengan isPinned = true di posisi paling atas', async () => {
    const normalTitle = `Pengumuman Biasa ${Date.now()}`
    const pinnedTitle = `Pengumuman Disematkan ${Date.now()}`

    await announcementService.createAnnouncement({
      title: normalTitle,
      content: 'Konten biasa',
      targetAudience: 'Semua',
      isPinned: false,
    })

    const resPinned = await announcementService.createAnnouncement({
      title: pinnedTitle,
      content: 'Konten penting yang disematkan',
      targetAudience: 'Semua',
      isPinned: true,
    })

    expect(resPinned.success).toBe(true)

    const list = await announcementService.getAnnouncements({ role: 'admin' })
    expect(list.success).toBe(true)
    if (list.success && list.data.length >= 2) {
      const firstPinnedIndex = list.data.findIndex((a) => a.title === pinnedTitle)
      const normalIndex = list.data.findIndex((a) => a.title === normalTitle)
      expect(firstPinnedIndex).toBeLessThan(normalIndex)
    }
  }, 45000)

  it('4. dapat mengubah status pin pengumuman (togglePinAnnouncement)', async () => {
    const title = `Toggle Pin Test ${Date.now()}`
    const created = await announcementService.createAnnouncement({
      title,
      content: 'Konten uji pin',
      targetAudience: 'Semua',
      isPinned: false,
    })
    expect(created.success).toBe(true)
    if (!created.success) return

    const toggleRes = await announcementService.togglePinAnnouncement(created.data.id, true)
    expect(toggleRes.success).toBe(true)

    const list = await announcementService.getAnnouncements({ role: 'admin' })
    if (list.success) {
      const item = list.data.find((a) => a.id === created.data.id)
      expect(item?.isPinned).toBe(true)
    }
  }, 45000)

  it('5. berhasil menghapus pengumuman secara atomik (deleteAnnouncement)', async () => {
    const title = `Hapus Pengumuman Test ${Date.now()}`
    const created = await announcementService.createAnnouncement({
      title,
      content: 'Konten yang akan segera dihapus',
      targetAudience: 'Semua',
      isPinned: false,
    })
    expect(created.success).toBe(true)
    if (!created.success) return

    const delRes = await announcementService.deleteAnnouncement(created.data.id)
    expect(delRes.success).toBe(true)

    const list = await announcementService.getAnnouncements({ role: 'admin' })
    if (list.success) {
      expect(list.data.some((a) => a.id === created.data.id)).toBe(false)
    }
  }, 45000)

  it('6. pengumuman dengan target Siswa mengisolasi audiens dan tidak dikirim ke admin', async () => {
    const studentTitle = `Isolasi Audiens Siswa ${Date.now()}`
    const res = await announcementService.createAnnouncement({
      title: studentTitle,
      content: 'Instruksi khusus peserta didik ujian mandiri.',
      targetAudience: 'Siswa',
      isPinned: false,
      broadcast: false,
    })

    expect(res.success).toBe(true)
    if (!res.success) return

    // Query untuk siswa berhasil menemukan pengumuman
    const studentList = await announcementService.getAnnouncements({ role: 'student' })
    expect(studentList.success).toBe(true)
    if (studentList.success) {
      expect(studentList.data.some((a) => a.title === studentTitle)).toBe(true)
    }

    // Query untuk tutor tidak memuat pengumuman ini
    const tutorList = await announcementService.getAnnouncements({ role: 'tutor' })
    expect(tutorList.success).toBe(true)
    if (tutorList.success) {
      expect(tutorList.data.some((a) => a.title === studentTitle)).toBe(false)
    }
  }, 45000)
})
