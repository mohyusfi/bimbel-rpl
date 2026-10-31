/**
 * Pintar Yuk — Script Verifikasi Rate Limiting & Proteksi DDoS
 * Menjalankan simulasi penyerangan dan pembuktian anti-pemblokiran Wi-Fi bersama
 * pada backend Upstash Redis Serverless & In-Memory Fallback.
 *
 * Jalankan via: npm run verify:rate-limit
 */

import { rateLimitService } from '../src/server/services/rate-limit.service.ts'

async function runVerification() {
  console.log('======================================================================')
  console.log(' [VERIFIKASI] PINTAR YUK — PENGUJIAN RATE LIMIT UPSTASH REDIS')
  console.log('======================================================================\n')

  rateLimitService.resetStore()
  const testRunId = Date.now().toString(36)

  // -------------------------------------------------------------------------
  // SKENARIO 1: Pengujian Batas Kuota Presisi (PUBLIC_AUTH: 10 req/menit)
  // -------------------------------------------------------------------------
  console.log('--- SKENARIO 1: Batas Kuota Presisi Login Turnstile (Maks 10 req/menit) ---')
  const authSessionId = `test-browser-session-${testRunId}`
  const clientIp = '103.111.222.1'
  const targetEmail = `siswa.uji.${testRunId}@palu.sch.id`

  let blockedCount = 0
  let allowedCount = 0

  for (let reqIndex = 1; reqIndex <= 12; reqIndex++) {
    const checkResult = await rateLimitService.check({
      tier: 'PUBLIC_AUTH',
      action: 'auth:login-turnstile',
      targetId: targetEmail,
      contextOverride: {
        sessionId: authSessionId,
        clientIp,
      },
    })

    if (checkResult.allowed) {
      allowedCount++
      console.log(
        ` [OK] Request #${reqIndex.toString().padStart(2, '0')}: DIIZINKAN | Kuota Tersisa: ${checkResult.remaining}/${checkResult.limit} | Backend: ${checkResult.backend}`
      )
    } else {
      blockedCount++
      console.log(
        ` [BLOCKED] Request #${reqIndex.toString().padStart(2, '0')}: DITOLAK | Kode: RATE_LIMIT_EXCEEDED | Waktu Tunggu: ${checkResult.retryAfterSeconds}s | Backend: ${checkResult.backend}`
      )
    }
  }

  console.log(
    ` Hasil Skenario 1: ${allowedCount} Diizinkan, ${blockedCount} Ditolak. (Target: 10 Diizinkan, 2 Ditolak)\n`
  )

  if (allowedCount !== 10 || blockedCount !== 2) {
    throw new Error('[ERROR] Skenario 1 gagal: Jumlah request yang diizinkan/ditolak tidak sesuai.')
  }

  // -------------------------------------------------------------------------
  // SKENARIO 2: Pembuktian Anti-Pemblokiran IP Bersama (Wi-Fi Bimbel Palu)
  // -------------------------------------------------------------------------
  console.log('--- SKENARIO 2: Uji Keamanan Wi-Fi Bimbel (Shared IP: 114.122.88.99) ---')
  console.log(' Kondisi: Sesi Siswa A baru saja diblokir karena melebihi batas (5 req/menit).')
  console.log(' Pengujian: Apakah Siswa B di Wi-Fi yang sama ikut terblokir?')

  const sharedBimbelWifiIp = '114.122.88.99'
  const sessionA = `session-siswa-a-${testRunId}`
  const sessionB = `session-siswa-b-${testRunId}`

  // Siswa A menghabiskan kuota pendaftaran (5 req/menit)
  for (let i = 1; i <= 5; i++) {
    await rateLimitService.enforce({
      tier: 'PUBLIC_REGISTRATION',
      action: 'reg:submit',
      targetId: `siswa.a.${testRunId}@tadulako.sch.id`,
      contextOverride: {
        sessionId: sessionA,
        clientIp: sharedBimbelWifiIp,
      },
    })
  }

  // Request ke-6 Siswa A pasti ditolak
  const siswaABlocked = await rateLimitService.enforce({
    tier: 'PUBLIC_REGISTRATION',
    action: 'reg:submit',
    targetId: `siswa.a.${testRunId}@tadulako.sch.id`,
    contextOverride: {
      sessionId: sessionA,
      clientIp: sharedBimbelWifiIp,
    },
  })

  const siswaAIsBlocked = Boolean(siswaABlocked && siswaABlocked.code === 'RATE_LIMIT_EXCEEDED')
  console.log(` [STATUS SISWA A]: ${siswaAIsBlocked ? 'TERBLOKIR (RATE_LIMIT_EXCEEDED)' : 'LOLOS'}`)

  // Siswa B mengakses pendaftaran dari Wi-Fi yang sama persis
  const siswaBResult = await rateLimitService.enforce({
    tier: 'PUBLIC_REGISTRATION',
    action: 'reg:submit',
    targetId: `siswa.b.${testRunId}@tadulako.sch.id`,
    contextOverride: {
      sessionId: sessionB,
      clientIp: sharedBimbelWifiIp,
    },
  })

  const siswaBSuccess = siswaBResult === null
  console.log(
    ` [STATUS SISWA B]: ${siswaBSuccess ? 'DIIZINKAN (TIDAK IKUT TERBLOKIR)' : 'GAGAL TERBLOKIR'}`
  )

  if (!siswaAIsBlocked || !siswaBSuccess) {
    throw new Error('[ERROR] Skenario 2 gagal: Siswa B ikut terblokir pada IP yang sama atau Siswa A tidak terblokir.')
  }
  console.log(' Hasil Skenario 2: Perlindungan IP Bersama BERHASIL BEKERJA SEMPURNA.\n')

  // -------------------------------------------------------------------------
  // SKENARIO 3: Perlindungan Auto-Check Wali di Form Pendaftaran (15 req/menit)
  // -------------------------------------------------------------------------
  console.log('--- SKENARIO 3: Proteksi Auto-Check Wali Calon Siswa (Maks 15 req/menit) ---')
  const lookupSession = `session-lookup-${testRunId}`
  let lookupAllowed = 0
  let lookupBlocked = 0

  for (let i = 1; i <= 17; i++) {
    const res = await rateLimitService.enforce({
      tier: 'PUBLIC_LOOKUP',
      action: 'reg:check-parent',
      contextOverride: {
        sessionId: lookupSession,
        clientIp: '180.252.10.20',
      },
    })

    if (!res) lookupAllowed++
    else lookupBlocked++
  }

  console.log(
    ` Hasil Skenario 3: ${lookupAllowed} Diizinkan, ${lookupBlocked} Ditolak. (Target: 15 Diizinkan, 2 Ditolak)\n`
  )

  if (lookupAllowed !== 15 || lookupBlocked !== 2) {
    throw new Error('[ERROR] Skenario 3 gagal: Batas lookup wali tidak presisi.')
  }

  // -------------------------------------------------------------------------
  // SKENARIO 4: Pemulihan Kuota Otomatis & High Availability Fallback
  // -------------------------------------------------------------------------
  console.log('--- SKENARIO 4: Pengujian High Availability (In-Memory Fallback) & Reset ---')
  console.log(' Simulasi: Menghabiskan kuota pada mode fallback lokal lalu menguji reset...')

  const resetSession = `session-reset-${testRunId}`
  const resetTarget = `siswa.reset.${testRunId}@tadulako.sch.id`
  const startTime = Date.now()

  // Habiskan kuota pada t = startTime (forceMemory = true)
  for (let i = 1; i <= 5; i++) {
    await rateLimitService.enforce({
      tier: 'PUBLIC_REGISTRATION',
      action: 'reg:submit',
      targetId: resetTarget,
      contextOverride: {
        sessionId: resetSession,
        clientIp: sharedBimbelWifiIp,
        nowMs: startTime,
        forceMemory: true,
      },
    })
  }

  // Request pada t = startTime + 61 detik (jendela waktu sudah lewat)
  const resetResult = await rateLimitService.enforce({
    tier: 'PUBLIC_REGISTRATION',
    action: 'reg:submit',
    targetId: resetTarget,
    contextOverride: {
      sessionId: resetSession,
      clientIp: sharedBimbelWifiIp,
      nowMs: startTime + 61_000,
      forceMemory: true,
    },
  })

  const resetSuccess = resetResult === null
  console.log(
    ` [STATUS PULIH]: ${resetSuccess ? 'BERHASIL PULIH (Siswa kembali dapat request)' : 'MASIH TERKUNCI'}\n`
  )

  if (!resetSuccess) {
    throw new Error('[ERROR] Skenario 4 gagal: Kuota tidak pulih setelah 60 detik.')
  }

  console.log('======================================================================')
  console.log(' [OK] SELURUH PENGUJIAN VERIFIKASI UPSTASH RATE LIMITING BERHASIL 100%')
  console.log('======================================================================\n')
}

runVerification().catch((err) => {
  console.error('[ERROR] Verifikasi rate limiting gagal:', err)
  process.exit(1)
})
