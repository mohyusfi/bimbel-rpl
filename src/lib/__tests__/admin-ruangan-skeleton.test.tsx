import { describe, it, expect, vi, beforeEach } from 'vitest'
import * as React from 'react'
import { renderToString } from 'react-dom/server'

// Mock state for useAdminData hooks
let mockRoomsState = { data: [] as any[], isLoading: false }
let mockCoursesState = { data: [] as any[], isLoading: false }
let mockSchedulesState = { data: [] as any[], isLoading: false }

vi.mock('~/hooks/use-admin-data', () => ({
  useAdminRooms: () => mockRoomsState,
  useAdminCourses: () => mockCoursesState,
  useAdminSchedules: () => mockSchedulesState,
  useAdminMutations: () => ({
    addRoom: vi.fn(),
    updateRoom: vi.fn(),
    toggleRoomActive: vi.fn(),
    updateCourse: vi.fn(),
  }),
}))

// Import RuanganView after mocking
import { RuanganView } from '~/components/admin/RuanganView'

describe('Admin Ruangan Skeleton & Fallback State Suite', () => {
  beforeEach(() => {
    mockRoomsState = { data: [], isLoading: false }
    mockCoursesState = { data: [], isLoading: false }
    mockSchedulesState = { data: [], isLoading: false }
  })

  describe('Master Paket Program Table Skeleton & Fallback State', () => {
    it('merender 3 baris skeleton saat isCoursesLoading bernilai true dan tidak menampilkan pesan empty state palsu', () => {
      mockCoursesState = { data: [], isLoading: true }

      const html = renderToString(<RuanganView />)

      // Memastikan 3 baris skeleton terender
      const skeletonRows = html.match(/data-testid="course-skeleton-row"/g)
      expect(skeletonRows).not.toBeNull()
      expect(skeletonRows?.length).toBe(3)

      // Pastikan kelas animate-pulse ada di dalam baris skeleton
      expect(html).toContain('animate-pulse')

      // Mencegah pesan data kosong muncul saat proses pemuatan berlangsung
      expect(html).not.toContain('Belum ada paket program bimbingan belajar.')
    })

    it('merender pesan empty state saat isCoursesLoading bernilai false dan daftar kursus kosong', () => {
      mockCoursesState = { data: [], isLoading: false }

      const html = renderToString(<RuanganView />)

      expect(html).not.toContain('data-testid="course-skeleton-row"')
      expect(html).toContain('Belum ada paket program bimbingan belajar.')
    })

    it('merender data kursus asli saat data tersedia dan tidak memuat skeleton', () => {
      mockCoursesState = {
        data: [
          {
            id: 'crs-1',
            name: 'SD Cendekia',
            code: 'SD',
            price: 300000,
            maxStudents: 10,
            activeClassesCount: 1,
            description: 'Bimbingan calistung dasar.',
          },
        ],
        isLoading: false,
      }

      const html = renderToString(<RuanganView />)

      expect(html).not.toContain('data-testid="course-skeleton-row"')
      expect(html).not.toContain('Belum ada paket program bimbingan belajar.')
      expect(html).toContain('SD Cendekia')
      expect(html).toContain('300.000')
    })
  })

  describe('Ruang Belajar Fisik Skeleton & Fallback State', () => {
    it('merender 4 kartu skeleton saat isRoomsLoading bernilai true dan tidak menampilkan pesan empty state palsu', () => {
      mockRoomsState = { data: [], isLoading: true }

      const html = renderToString(<RuanganView />)

      const skeletonCards = html.match(/data-testid="room-skeleton-card"/g)
      expect(skeletonCards).not.toBeNull()
      expect(skeletonCards?.length).toBe(4)

      expect(html).not.toContain('Belum ada ruang belajar fisik yang terdaftar.')
    })

    it('merender pesan empty state saat isRoomsLoading bernilai false dan daftar ruangan kosong', () => {
      mockRoomsState = { data: [], isLoading: false }

      const html = renderToString(<RuanganView />)

      expect(html).not.toContain('data-testid="room-skeleton-card"')
      expect(html).toContain('Belum ada ruang belajar fisik yang terdaftar.')
    })

    it('merender kartu ruangan asli saat data ruangan tersedia', () => {
      mockRoomsState = {
        data: [
          {
            id: 'room-alpha',
            name: 'Ruang Palu-1',
            capacity: 12,
            facilities: 'AC, Proyektor, Whiteboard',
            isActive: true,
          },
        ],
        isLoading: false,
      }

      const html = renderToString(<RuanganView />)

      expect(html).not.toContain('data-testid="room-skeleton-card"')
      expect(html).not.toContain('Belum ada ruang belajar fisik yang terdaftar.')
      expect(html).toContain('Ruang Palu-1')
      expect(html).toContain('12 kursi')
    })
  })
})
