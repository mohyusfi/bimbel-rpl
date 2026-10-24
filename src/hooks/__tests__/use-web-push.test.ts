import { describe, it, expect } from 'vitest'
import * as React from 'react'
import { renderToString } from 'react-dom/server'
import { useWebPush, urlBase64ToUint8Array } from '../use-web-push'

function renderHookInSSR<T>(hookFn: () => T): T {
  let result!: T
  function TestHarness() {
    result = hookFn()
    return React.createElement('div', null, 'rendered')
  }
  renderToString(React.createElement(TestHarness))
  return result
}

describe('useWebPush Hook & Utilities (TDD)', () => {
  describe('1. urlBase64ToUint8Array Utility', () => {
    it('mengonversi base64 string VAPID ke format Uint8Array dengan padding yang tepat', () => {
      const sampleBase64 = 'BFf8amwD3P7ZDVQaehCJ2XXPxiPaslwbWF4u3pM7sBplSZkdBcIiBR3izXemr0'
      const uint8Arr = urlBase64ToUint8Array(sampleBase64)

      expect(uint8Arr).toBeInstanceOf(Uint8Array)
      expect(uint8Arr.length).toBeGreaterThan(0)
    })
  })

  describe('2. Hook Behavior in SSR / Non-Browser Environments', () => {
    it('mengembalikan isSupported = false jika objek Notification atau serviceWorker tidak tersedia di server/SSR', () => {
      const hookResult = renderHookInSSR(() => useWebPush())

      expect(hookResult.isSupported).toBe(false)
      expect(hookResult.permission).toBe('unsupported')
      expect(typeof hookResult.subscribeToPush).toBe('function')
      expect(typeof hookResult.unsubscribeFromPush).toBe('function')
    })

    it('gagal berlangganan secara aman jika isSupported bernilai false', async () => {
      const hookResult = renderHookInSSR(() => useWebPush())

      const success = await hookResult.subscribeToPush('user-123')
      expect(success).toBe(false)
    })
  })
})
