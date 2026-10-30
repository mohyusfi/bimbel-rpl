import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { chromium, type Browser, type BrowserContext, type Page } from 'playwright'
import { spawn, type ChildProcess } from 'node:child_process'
import http from 'node:http'

const TEST_PORT = 4322
const BASE_URL = `http://localhost:${TEST_PORT}`

function waitForServer(url: string, timeoutMs: number = 30000): Promise<void> {
  const start = Date.now()
  return new Promise((resolve, reject) => {
    const check = () => {
      const req = http.get(url, (res) => {
        if (res.statusCode && res.statusCode < 500) {
          resolve()
        } else {
          retry()
        }
      })
      req.on('error', () => retry())
      req.end()
    }

    const retry = () => {
      if (Date.now() - start > timeoutMs) {
        reject(new Error(`Timeout waiting for test server at ${url}`))
      } else {
        setTimeout(check, 400)
      }
    }

    check()
  })
}

describe('Playwright E2E Automated Tests: Login Flow & Activation', { timeout: 60000 }, () => {
  let serverProcess: ChildProcess | null = null
  let browser: Browser | null = null
  let context: BrowserContext | null = null
  let page: Page | null = null

  beforeAll(async () => {
    // 1. Jalankan Vite dev server pada port terisolasi 4322
    serverProcess = spawn('npx', ['vite', 'dev', '--port', String(TEST_PORT)], {
      stdio: 'ignore',
      detached: false,
      env: {
        ...process.env,
        PORT: String(TEST_PORT),
        VITE_LOGIN_MODE: 'demo',
      },
    })

    // Tunggu hingga server siap melayani request
    await waitForServer(`${BASE_URL}/masuk?e2e=true`)

    // 2. Luncurkan Chromium headless via Playwright
    browser = await chromium.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
    })

    context = await browser.newContext({
      viewport: { width: 1280, height: 720 },
    })

    page = await context.newPage()
  }, 60000)

  afterAll(async () => {
    if (page) await page.close().catch(() => {})
    if (context) await context.close().catch(() => {})
    if (browser) await browser.close().catch(() => {})

    if (serverProcess) {
      serverProcess.kill('SIGTERM')
      serverProcess = null
    }
  })

  it('renders login page correctly with all form fields and security elements', async () => {
    if (!page) throw new Error('Page not initialized')

    await page.goto(`${BASE_URL}/masuk?e2e=true`, { waitUntil: 'load' })
    await page.waitForSelector('form[data-hydrated="true"]')

    // Validasi form fields
    const emailInput = page.locator('#email')
    const passwordInput = page.locator('#password')
    const submitBtn = page.locator('button[type="submit"]')

    expect(await emailInput.isVisible()).toBe(true)
    expect(await passwordInput.isVisible()).toBe(true)
    expect(await submitBtn.isVisible()).toBe(true)
  })

  it('successfully logs in verified student Moh Yusfi Lakhafidun without unconfirmed error', async () => {
    if (!page) throw new Error('Page not initialized')

    await page.goto(`${BASE_URL}/masuk?e2e=true`, { waitUntil: 'load' })
    await page.waitForSelector('form[data-hydrated="true"]')

    // Masukkan email dan sandi siswa terverifikasi
    await page.fill('#email', 'mohammadyusfi039@gmail.com')
    await page.fill('#password', 'siswa2026')

    // Submit form login
    await page.click('button[type="submit"]')

    // Tunggu navigasi ke portal siswa
    await page.waitForURL('**/student**', { timeout: 12000 })

    // Verifikasi bahwa pesan kesalahan "Akun Anda belum aktif..." TIDAK muncul sama sekali
    const errorBanner = page.locator('div[role="alert"]')
    const isErrorVisible = await errorBanner.isVisible()
    const errorText = isErrorVisible ? await errorBanner.innerText() : ''
    expect(errorText).not.toContain('Akun Anda belum aktif')

    // Verifikasi URL dialihkan ke portal siswa
    expect(page.url()).toContain('/student')
  })

  it('allows student login using Student Identification Number (NIS TC-2026-011)', async () => {
    if (!page) throw new Error('Page not initialized')

    await context?.clearCookies()
    await page.goto(`${BASE_URL}/masuk?e2e=true`, { waitUntil: 'load' })
    await page.waitForSelector('form[data-hydrated="true"]')

    // Masukkan NIS dan sandi siswa
    await page.fill('#email', 'TC-2026-011')
    await page.fill('#password', 'siswa2026')

    await page.click('button[type="submit"]')
    await page.waitForURL('**/student**', { timeout: 12000 })

    const errorBanner = page.locator('div[role="alert"]')
    const isErrorVisible = await errorBanner.isVisible()
    const errorText = isErrorVisible ? await errorBanner.innerText() : ''
    expect(errorText).not.toContain('Akun Anda belum aktif')

    expect(page.url()).toContain('/student')
  })

  it('blocks unverified pending registration with informative polite message', async () => {
    if (!page) throw new Error('Page not initialized')

    await context?.clearCookies()
    await page.goto(`${BASE_URL}/masuk?e2e=true`, { waitUntil: 'load' })
    await page.waitForSelector('form[data-hydrated="true"]')

    // Masukkan email calon siswa yang statusnya 'menunggu' di database Supabase
    await page.fill('#email', 'calon.siswa.pending@tadulako.sch.id')
    await page.fill('#password', 'siswa2026')
    await page.click('button[type="submit"]')

    // Tunggu pesan banner error muncul
    await page.waitForSelector('div[role="alert"]')

    const alertText = await page.locator('div[role="alert"]').innerText()
    expect(alertText).toContain('menunggu verifikasi oleh staf Tata Usaha')
  })

  it('allows quick demo login for Student role successfully', async () => {
    if (!page) throw new Error('Page not initialized')

    await context?.clearCookies()
    await page.goto(`${BASE_URL}/masuk?e2e=true`, { waitUntil: 'load' })
    await page.waitForSelector('form[data-hydrated="true"]')

    // Klik tombol quick demo login "Siswa"
    const studentDemoBtn = page.locator('button:has-text("Siswa")').first()
    expect(await studentDemoBtn.isVisible()).toBe(true)

    await studentDemoBtn.click()
    await page.waitForURL('**/student**', { timeout: 12000 })

    expect(page.url()).toContain('/student')
  })
})
