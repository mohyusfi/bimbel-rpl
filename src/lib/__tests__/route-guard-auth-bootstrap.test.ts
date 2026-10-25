import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { authStore } from '../auth-store'
import { createRouteGuard } from '../route-guard'

/**
 * Regression (feedback loop) untuk bug: "hard refresh browser kembali ke halaman login".
 *
 * Akar masalah: state auth in-memory; route guard (beforeLoad) berjalan sinkron
 * SEBELUM authStore.initialize() async memulihkan sesi Supabase ter-persist,
 * sehingga isAuthenticated masih false -> redirect ke /masuk.
 *
 * Guard harus menunggu authStore.ensureInitialized() sebelum memutuskan.
 */
describe('Route Guard — bootstrap auth sebelum memvalidasi (anti-logout saat refresh)', () => {
  beforeEach(() => {
    vi.stubGlobal('window', {})
    authStore.clearSession()
  })

  afterEach(() => {
    vi.unstubAllGlobals()
    vi.restoreAllMocks()
  })

  it('menunggu ensureInitialized() lalu mengizinkan rute saat sesi ter-persist dipulihkan', async () => {
    const spy = vi.spyOn(authStore, 'ensureInitialized').mockImplementation(async () => {
      // Simulasikan initialize() memulihkan sesi Supabase ter-persist.
      authStore.quickLogin('parent')
    })

    const guard = createRouteGuard('parent')
    await expect(
      guard({ location: { pathname: '/parent', href: '/parent' } })
    ).resolves.toBeUndefined()

    expect(spy).toHaveBeenCalledTimes(1)
  })

  it('tetap mengalihkan ke /masuk bila setelah bootstrap benar-benar belum login', async () => {
    vi.spyOn(authStore, 'ensureInitialized').mockResolvedValue(undefined)

    const guard = createRouteGuard('parent')
    await expect(
      guard({ location: { pathname: '/parent', href: '/parent' } })
    ).rejects.toBeDefined()
  })
})
