import { describe, it, expect, vi } from 'vitest'
import { toast, toastManager } from '../../components/ui/toast'

describe('Toast System Utility & Base UI Manager', () => {
  it('berhasil memicu toast.success dengan metadata dan tipe data success', () => {
    const listener = vi.fn()
    const unsubscribe = toastManager[' subscribe'](listener)

    const id = toast.success('Presensi tersimpan!', {
      description: 'Data kehadiran siswa telah diperbarui.',
    })

    expect(typeof id).toBe('string')
    expect(listener).toHaveBeenCalledWith(
      expect.objectContaining({
        action: 'add',
        options: expect.objectContaining({
          id,
          title: 'Presensi tersimpan!',
          description: 'Data kehadiran siswa telah diperbarui.',
          data: { type: 'success' },
          timeout: 4000,
        }),
      })
    )

    unsubscribe()
  })

  it('berhasil memicu toast.error dengan timeout 5000ms dan priority high', () => {
    const listener = vi.fn()
    const unsubscribe = toastManager[' subscribe'](listener)

    const id = toast.error('Gagal menyimpan presensi', {
      description: 'Koneksi ke server bermasalah.',
    })

    expect(typeof id).toBe('string')
    expect(listener).toHaveBeenCalledWith(
      expect.objectContaining({
        action: 'add',
        options: expect.objectContaining({
          id,
          title: 'Gagal menyimpan presensi',
          description: 'Koneksi ke server bermasalah.',
          data: { type: 'error' },
          timeout: 5000,
          priority: 'high',
        }),
      })
    )

    unsubscribe()
  })

  it('berhasil memicu toast.info dan toast.warning dengan tipe yang sesuai', () => {
    const listener = vi.fn()
    const unsubscribe = toastManager[' subscribe'](listener)

    const infoId = toast.info('Informasi baru')
    expect(listener).toHaveBeenCalledWith(
      expect.objectContaining({
        action: 'add',
        options: expect.objectContaining({
          id: infoId,
          title: 'Informasi baru',
          data: { type: 'info' },
        }),
      })
    )

    const warnId = toast.warning('Peringatan kuota')
    expect(listener).toHaveBeenCalledWith(
      expect.objectContaining({
        action: 'add',
        options: expect.objectContaining({
          id: warnId,
          title: 'Peringatan kuota',
          data: { type: 'warning' },
        }),
      })
    )

    unsubscribe()
  })

  it('berhasil memanggil toast.dismiss untuk menutup toast', () => {
    const listener = vi.fn()
    const unsubscribe = toastManager[' subscribe'](listener)

    toast.dismiss('test-toast-id')
    expect(listener).toHaveBeenCalledWith(
      expect.objectContaining({
        action: 'close',
      })
    )

    unsubscribe()
  })
})
