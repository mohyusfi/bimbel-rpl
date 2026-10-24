import { describe, it, expect, vi } from 'vitest'
import * as fs from 'fs'
import * as path from 'path'

describe('Client Bundle Isolation & Route Health Regression Tests', () => {
  const rootDir = process.cwd()

  describe('1. Node-only web-push Client Bundle Isolation', () => {
    it('memastikan src/server/functions/push-notifications.ts tidak mengimpor web-push atau service secara statis', () => {
      const filePath = path.join(rootDir, 'src/server/functions/push-notifications.ts')
      const content = fs.readFileSync(filePath, 'utf-8')

      // Tidak boleh ada import statis pushNotificationService di level modul
      expect(content).not.toMatch(/^import\s+.*pushNotificationService.*from/m)
      expect(content).not.toMatch(/^import\s+.*web-push.*from/m)

      // Harus menggunakan dynamic import di dalam handler
      expect(content).toContain("import(\n      '~/server/services/push-notification.service'\n    )")
    })

    it('memastikan src/server/services/attendance.service.ts tidak mengimpor push-notification secara statis', () => {
      const filePath = path.join(rootDir, 'src/server/services/attendance.service.ts')
      const content = fs.readFileSync(filePath, 'utf-8')

      expect(content).not.toMatch(/^import\s+.*pushNotificationService.*from/m)
      expect(content).not.toMatch(/^import\s+.*web-push.*from/m)
    })

    it('memastikan src/server/services/billing.service.ts tidak mengimpor push-notification secara statis', () => {
      const filePath = path.join(rootDir, 'src/server/services/billing.service.ts')
      const content = fs.readFileSync(filePath, 'utf-8')

      expect(content).not.toMatch(/^import\s+.*pushNotificationService.*from/m)
      expect(content).not.toMatch(/^import\s+.*web-push.*from/m)
    })

    it('memastikan push-notification.service.ts memuat web-push secara dinamis dan aman di browser', () => {
      const filePath = path.join(rootDir, 'src/server/services/push-notification.service.ts')
      const content = fs.readFileSync(filePath, 'utf-8')

      // web-push tidak boleh diimpor statis di baris pertama file
      expect(content).not.toMatch(/^import\s+.*webpush.*from\s+['"]web-push['"]/m)
      expect(content).toContain("typeof window !== 'undefined'")
    })
  })

  describe('2. Public SSR Route Configuration (/masuk)', () => {
    it('memastikan rute /masuk tidak memiliki ssr: false agar halaman publik tidak blank screen', () => {
      const filePath = path.join(rootDir, 'src/routes/masuk.tsx')
      const content = fs.readFileSync(filePath, 'utf-8')

      expect(content).not.toContain('ssr: false')
    })
  })
})
