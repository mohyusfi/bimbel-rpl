import { describe, it, expect, vi } from 'vitest'
import * as React from 'react'
import { renderToString } from 'react-dom/server'
import { Skeleton } from '../../components/ui/skeleton'
import { SummaryMetricCard } from '../../components/dashboard/SummaryMetricCard'
import { DataTable } from '../../components/ui/data-table'
import { NavigationProgressBar } from '../../components/ui/navigation-progress-bar'
import { Users } from 'lucide-react'
import type { ColumnDef } from '@tanstack/react-table'

let mockIsLoading = false
vi.mock('@tanstack/react-router', () => ({
  useRouterState: ({ select }: { select?: (s: { isLoading: boolean }) => boolean }) => {
    return select ? select({ isLoading: mockIsLoading }) : { isLoading: mockIsLoading }
  },
  Link: ({ children, to, className }: any) => <a href={to} className={className}>{children}</a>,
}))

describe('Skeleton & Navigation Progress Fallback Suite', () => {
  describe('Primitif Skeleton Component', () => {
    it('merender elemen div dengan kelas Tailwind standar animate-pulse dan bg-[#DCDCDC]', () => {
      const html = renderToString(<Skeleton className="w-20 h-4" />)
      expect(html).toContain('animate-pulse')
      expect(html).toContain('bg-[#DCDCDC]')
      expect(html).toContain('w-20')
      expect(html).toContain('h-4')
    })
  })

  describe('SummaryMetricCard Skeleton State', () => {
    it('merender blok skeleton saat isLoading bernilai true dan tidak menampilkan angka nominal asli', () => {
      const html = renderToString(
        <SummaryMetricCard
          title="Total Pendaftar"
          value="42"
          unit="Siswa"
          description="Siswa baru terdaftar"
          icon={Users}
          isLoading={true}
        />
      )

      // Menampilkan skeleton container & pulse
      expect(html).toContain('data-testid="summary-metric-card-skeleton"')
      expect(html).toContain('animate-pulse')
      expect(html).toContain('pointer-events-none')

      // Tidak menampilkan nilai metrik mentah saat masih loading
      expect(html).not.toContain('>42<')
    })

    it('merender konten normal saat isLoading bernilai false', () => {
      const html = renderToString(
        <SummaryMetricCard
          title="Total Pendaftar"
          value="42"
          unit="Siswa"
          description="Siswa baru terdaftar"
          icon={Users}
          isLoading={false}
        />
      )

      expect(html).not.toContain('data-testid="summary-metric-card-skeleton"')
      expect(html).toContain('Total Pendaftar')
      expect(html).toContain('42')
      expect(html).toContain('Siswa')
    })
  })

  describe('DataTable Skeleton & Opacity State', () => {
    interface TestItem {
      id: string
      name: string
      amount: number
    }

    const testColumns: ColumnDef<TestItem>[] = [
      { accessorKey: 'id', header: 'ID' },
      { accessorKey: 'name', header: 'Nama' },
      { accessorKey: 'amount', header: 'Nominal' },
    ]

    it('merender 5 baris skeleton saat isLoading bernilai true dan data kosong, serta mencegah pesan false empty state', () => {
      const html = renderToString(
        <DataTable
          columns={testColumns}
          data={[]}
          isLoading={true}
          emptyState="Belum ada tagihan."
        />
      )

      // Memastikan 5 baris skeleton terender
      const matches = html.match(/data-testid="data-table-skeleton-row"/g)
      expect(matches).not.toBeNull()
      expect(matches?.length).toBe(5)

      // Mencegah munculnya pesan false empty state saat masih proses load
      expect(html).not.toContain('Belum ada tagihan.')
      expect(html).not.toContain('Tidak ada data yang cocok')

      // Footer menampilkan indikasi memuat
      expect(html).toContain('Memuat data...')
    })

    it('merender emptyState saat isLoading bernilai false dan data kosong', () => {
      const html = renderToString(
        <DataTable
          columns={testColumns}
          data={[]}
          isLoading={false}
          emptyState="Belum ada tagihan."
        />
      )

      expect(html).not.toContain('data-testid="data-table-skeleton-row"')
      expect(html).toContain('Belum ada tagihan.')
    })

    it('menerapkan kelas opacity-50 dan pointer-events-none saat isLoading bernilai true namun data sudah tersedia (refetch / filter)', () => {
      const existingData: TestItem[] = [
        { id: '1', name: 'Ahmad', amount: 500000 },
        { id: '2', name: 'Fatimah', amount: 600000 },
      ]

      const html = renderToString(
        <DataTable
          columns={testColumns}
          data={existingData}
          isLoading={true}
        />
      )

      // Data lama tetap tampil (no layout shift)
      expect(html).toContain('Ahmad')
      expect(html).toContain('Fatimah')

      // Disertai efek soft dimming
      expect(html).toContain('opacity-50')
      expect(html).toContain('pointer-events-none')
    })
  })

  describe('NavigationProgressBar Component', () => {
    it('merender progress bar merah kirmizi (#CB2957) di z-[9999] saat isLoading bernilai true', () => {
      mockIsLoading = true
      const html = renderToString(<NavigationProgressBar />)
      expect(html).toContain('role="progressbar"')
      expect(html).toContain('bg-[#CB2957]')
      expect(html).toContain('animate-navigation-progress')
      expect(html).toContain('z-[9999]')
    })

    it('tidak merender progress bar saat isLoading bernilai false', () => {
      mockIsLoading = false
      const html = renderToString(<NavigationProgressBar />)
      expect(html).toBe('')
    })
  })
})
