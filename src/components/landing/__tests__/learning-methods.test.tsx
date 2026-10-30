import { describe, it, expect, vi } from 'vitest'
import * as React from 'react'
import { renderToString } from 'react-dom/server'
import { LEARNING_METHODS, getLearningMethodBySlug } from '~/lib/learning-methods'

vi.mock('@tanstack/react-router', () => ({
  Link: ({ children, to, className, ...props }: any) => (
    <a href={to} className={className} {...props}>
      {children}
    </a>
  ),
  useRouterState: () => '/',
}))

import { LearningMethodsSection } from '../LearningMethodsSection'

describe('Metode Belajar Anemone — Data & Komponen', () => {
  it('menyediakan 4 metode belajar unggulan dengan struktur lengkap termasuk cardLine dan cardMetric', () => {
    expect(LEARNING_METHODS.length).toBe(4)

    const slugs = LEARNING_METHODS.map((m) => m.slug)
    expect(slugs).toEqual(['konsep-dasar', 'active-recall', 'deliberate-practice', 'klinik-personal'])

    for (const method of LEARNING_METHODS) {
      expect(method.number).toMatch(/^0[1-4]$/)
      expect(method.title).toBeTruthy()
      expect(method.cardLine).toBeTruthy()
      expect(method.cardMetric.value).toBeTruthy()
      expect(method.cardMetric.label).toBeTruthy()
      expect(method.heroLead).toBeTruthy()
      expect(method.metrics.length).toBeGreaterThanOrEqual(3)
      expect(method.simulationSteps.length).toBe(4)
      expect(method.comparisons.length).toBe(3)
      expect(method.symptoms.length).toBeGreaterThanOrEqual(3)
    }
  })

  it('dapat menemukan metode belajar berdasarkan slug yang valid', () => {
    const found = getLearningMethodBySlug('konsep-dasar')
    expect(found).toBeDefined()
    expect(found?.shortName).toBe('Konsep Dasar')
    expect(found?.recommendedPackage).toBe('SMP')

    const notFound = getLearningMethodBySlug('metode-tidak-ada')
    expect(notFound).toBeUndefined()
  })

  it('mematuhi aturan AGENTS.md: seluruh teks metode belajar bebas dari karakter emoji', () => {
    const jsonString = JSON.stringify(LEARNING_METHODS)
    const emojiRegex = /[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/u
    expect(emojiRegex.test(jsonString)).toBe(false)
  })

  it('merender LearningMethodsSection sebagai grid 4 kartu poster yang ringkas', () => {
    const html = renderToString(<LearningMethodsSection />)

    expect(html).toContain('id="metode-belajar"')
    expect(html).toContain('Empat cara kami membuat anak paham')
    expect(html).toContain('Pilih satu untuk melihat cara kerjanya di kelas.')
    expect(html).toContain('lp-methods-poster-grid')
    expect(html).toContain('Paham alasan di balik rumus.')
    expect(html).toContain('Maks. 12 siswa, semua ikut bicara.')
    expect(html).toContain('Latihan tepat di bagian yang lemah.')
    expect(html).toContain('PR selesai, anak paham caranya.')
    expect(html).toContain('Lihat cara kerjanya')
  })
})
