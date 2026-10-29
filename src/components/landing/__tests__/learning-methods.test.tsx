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
  it('menyediakan 4 metode belajar unggulan dengan struktur lengkap', () => {
    expect(LEARNING_METHODS.length).toBe(4)

    const slugs = LEARNING_METHODS.map((m) => m.slug)
    expect(slugs).toEqual(['konsep-dasar', 'active-recall', 'deliberate-practice', 'klinik-personal'])

    for (const method of LEARNING_METHODS) {
      expect(method.number).toMatch(/^0[1-4]$/)
      expect(method.title).toBeTruthy()
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
    // Regex untuk mendeteksi berbagai rentang karakter emoji
    const emojiRegex = /[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/u
    expect(emojiRegex.test(jsonString)).toBe(false)
  })

  it('merender LearningMethodsSection dengan 4 tab metode belajar', () => {
    const onSelectProgram = vi.fn()
    const html = renderToString(<LearningMethodsSection onSelectProgram={onSelectProgram} />)

    expect(html).toContain('id="metode-belajar"')
    expect(html).toContain('Empat metode agar anak paham, bukan sekadar hafal')
    expect(html).toContain('Konsep Dasar')
    expect(html).toContain('Active Recall')
    expect(html).toContain('Deliberate Practice')
    expect(html).toContain('Klinik Personal')
  })
})
