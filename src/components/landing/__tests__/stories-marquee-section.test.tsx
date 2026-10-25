import { describe, it, expect } from 'vitest'
import * as React from 'react'
import { renderToString } from 'react-dom/server'
import { StoriesMarqueeSection } from '../StoriesMarqueeSection'

describe('StoriesMarqueeSection — Testimoni Poster Kontras Tinggi', () => {
  it('merender container section cerita siswa dengan id dan struktur aksesibilitas yang tepat', () => {
    const html = renderToString(<StoriesMarqueeSection />)

    expect(html).toContain('id="cerita-siswa"')
    expect(html).toContain('class="lp-stories-section"')
    expect(html).toContain('aria-label="Cerita dan testimoni alumni"')
  })

  it('memiliki dua baris marquee dengan arah gerakan yang berlawanan sesuai spesifikasi', () => {
    const html = renderToString(<StoriesMarqueeSection />)

    // Baris 1: kanan ke kiri (lp-marquee-left)
    expect(html).toContain('lp-marquee-left')
    expect(html).toContain('Daftar testimoni kelulusan PTN')

    // Baris 2: kiri ke kanan (lp-marquee-right)
    expect(html).toContain('lp-marquee-right')
    expect(html).toContain('Daftar testimoni pola pikir dan kebiasaan belajar')
  })

  it('merender data alumni dummy dan menduplikasi track untuk infinite marquee loop seamless', () => {
    const html = renderToString(<StoriesMarqueeSection />)

    // Cek keberadaan nama alumni
    expect(html).toContain('Raihani Sofia')
    expect(html).toContain('Sultan Zahid')
    expect(html).toContain('Faradilla AlFath')
    expect(html).toContain('Bimantara Hanumpraja')

    // Cek target kampus / institusi
    expect(html).toContain('Universitas Tadulako — Kedokteran')
    expect(html).toContain('Institut Teknologi Bandung — Teknik Elektro')
    expect(html).toContain('Politeknik Keuangan Negara STAN')

    // Tombol baca selengkapnya harus tersedia di setiap kartu
    const expandButtons = html.match(/Baca selengkapnya/g)
    expect(expandButtons).not.toBeNull()
    // 8 item x 2 duplikat untuk row 1 + 8 item x 2 duplikat untuk row 2 = 32 tombol
    expect(expandButtons?.length).toBe(32)
  })

  it('mematuhi aturan AGENTS.md: bebas karakter emoji', () => {
    const html = renderToString(<StoriesMarqueeSection />)

    // Regex untuk mendeteksi berbagai rentang karakter emoji
    const emojiRegex = /[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/u
    expect(emojiRegex.test(html)).toBe(false)
  })

  it('mencegah bug black screen: memisahkan backdrop dan viewport serta menghapus display: flex yang menimpa hidden', async () => {
    const fs = await import('fs')
    const landingCss = fs.readFileSync('landing.css', 'utf-8')

    // Memastikan kelas lama yang bermasalah (.lp-story-modal-overlay) sudah tidak ada
    expect(landingCss).not.toContain('.lp-story-modal-overlay')

    // Memastikan kelas baru terdaftar dengan pelindung [hidden] display: none !important
    expect(landingCss).toContain('.lp-story-modal-backdrop')
    expect(landingCss).toContain('.lp-story-modal-viewport')
    expect(landingCss).toMatch(/\.lp-story-modal-backdrop\[hidden\][\s\S]*?display:\s*none\s*!important/)
    expect(landingCss).toMatch(/\.lp-story-modal-viewport\[hidden\][\s\S]*?display:\s*none\s*!important/)
  })

  it('memastikan deretan kartu tetap berjalan setelah modal ditutup (tanpa focus-within yang menahan pause) dan pewarnaan selaras', async () => {
    const fs = await import('fs')
    const landingCss = fs.readFileSync('landing.css', 'utf-8')

    // Tidak boleh ada focus-within pada marquee track agar animasi tidak berhenti permanen seusai klik tombol kartu
    expect(landingCss).not.toContain('.lp-marquee-track:focus-within')

    // Pewarnaan section menyatu dengan kanvas utama var(--background) dan kartu memakai var(--surface)
    expect(landingCss).toMatch(/\.lp-stories-section\s*\{[\s\S]*?background:\s*var\(--background\)/)
    expect(landingCss).toMatch(/\.lp-story-card\s*\{[\s\S]*?background:\s*var\(--surface\)/)
  })

  it('tidak merender popup cerita saat dialog dalam status tertutup', () => {
    const html = renderToString(<StoriesMarqueeSection />)

    // Saat status tertutup, popup cerita tidak boleh terender di markup
    expect(html).not.toContain('id="story-modal-title"')
    expect(html).not.toContain('class="lp-story-modal-popup"')
  })
})
