import * as React from 'react'
import { Link } from '@tanstack/react-router'
import { motion, AnimatePresence } from 'motion/react'
import { ArrowRight, CheckCircle2 } from 'lucide-react'
import { LEARNING_METHODS, type LearningMethodItem } from '~/lib/learning-methods'
import { fadeInUp, staggerContainer, viewportConfig } from '~/lib/motion'

interface LearningMethodsSectionProps {
  onSelectProgram: (packageCode: string) => void
}

export function LearningMethodsSection({ onSelectProgram }: LearningMethodsSectionProps) {
  const [activeSlug, setActiveSlug] = React.useState<string>(LEARNING_METHODS[0].slug)

  const activeMethod: LearningMethodItem =
    LEARNING_METHODS.find((m) => m.slug === activeSlug) || LEARNING_METHODS[0]

  return (
    <section id="metode-belajar" className="lp-section">
      <div className="container">
        <motion.header
          className="lp-section-head"
          variants={fadeInUp}
          initial="hidden"
          whileInView="visible"
          viewport={viewportConfig}
        >
          <div className="inline-flex items-center gap-2 mb-2 text-xs font-mono font-bold tracking-wider uppercase text-[#CB2957]">
            <span>Metodologi Pembelajaran Anemone</span>
          </div>
          <h2 className="lp-h2">Empat metode agar anak paham, bukan sekadar hafal</h2>
          <p>
            Anak sering buntu saat tipe soal berubah karena hanya menghafal rumus. Kami menerapkan kerangka belajar terstruktur agar logika berpikir terbentuk kokoh.
          </p>
        </motion.header>

        {/* Tab Pemilih Metode 01 - 04 */}
        <div className="lp-methods-tabs" role="tablist" aria-label="Pilih metode belajar">
          {LEARNING_METHODS.map((method) => {
            const isActive = method.slug === activeSlug
            return (
              <button
                key={method.slug}
                type="button"
                role="tab"
                aria-selected={isActive}
                aria-controls={`method-panel-${method.slug}`}
                id={`method-tab-${method.slug}`}
                className={`lp-method-tab-btn ${isActive ? 'is-active' : ''}`}
                onClick={() => setActiveSlug(method.slug)}
              >
                <span className="lp-method-tab-num">{method.number}</span>
                <span className="lp-method-tab-title">{method.shortName}</span>
              </button>
            )
          })}
        </div>

        {/* Card Pratinjau Interaktif dengan AnimatePresence */}
        <div className="lp-method-preview-card" id={`method-panel-${activeMethod.slug}`} role="tabpanel" aria-labelledby={`method-tab-${activeMethod.slug}`}>
          <AnimatePresence mode="wait">
            <motion.div
              key={activeMethod.slug}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.24, ease: [0.22, 1, 0.36, 1] }}
              className="lp-method-preview-grid"
            >
              {/* Kolom Kiri: Penjelasan & Poin Inti */}
              <div>
                <div className="flex items-center gap-2.5 mb-3">
                  <span className="inline-block px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wider bg-[#FBEAEF] text-[#A81E46] border border-[#CB2957]/30 rounded-[2px]">
                    {activeMethod.badge}
                  </span>
                  <span className="text-xs text-[#555555] font-mono">
                    Rekomendasi untuk: <strong className="text-[#000000]">{activeMethod.recommendedPackageName}</strong>
                  </span>
                </div>

                <h3 className="font-display font-extrabold text-2xl sm:text-3xl text-[#000000] tracking-tight leading-tight mb-2">
                  {activeMethod.title}
                </h3>
                <p className="text-sm sm:text-base font-medium text-[#CB2957] mb-4">
                  {activeMethod.tagline}
                </p>
                <p className="text-sm sm:text-base text-[#555555] leading-relaxed mb-6">
                  {activeMethod.heroLead}
                </p>

                <ul className="space-y-2.5 mb-8">
                  {activeMethod.overviewPoints.map((point) => (
                    <li key={point} className="flex items-start gap-2.5 text-xs sm:text-sm text-[#000000]">
                      <CheckCircle2 className="w-4 h-4 text-[#CB2957] shrink-0 mt-0.5" />
                      <span>{point}</span>
                    </li>
                  ))}
                </ul>

                <div className="flex flex-wrap items-center gap-3">
                  <Link
                    to={`/metode/${activeMethod.slug}` as any}
                    className="btn btn-primary btn-sm inline-flex items-center gap-1.5"
                  >
                    <span>Simulasi langkah kelas</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>

                  <button
                    type="button"
                    className="btn btn-outline btn-sm"
                    onClick={() => onSelectProgram(activeMethod.recommendedPackage)}
                  >
                    Ikut 1x kelas gratis
                  </button>
                </div>
              </div>

              {/* Kolom Kanan: Metrik Hasil Terukur */}
              <div className="p-6 bg-[#EEEEEE] border-2 border-[#000000] rounded-[4px] space-y-4">
                <span className="text-xs font-mono font-bold uppercase tracking-wider text-[#000000] block pb-2 border-b border-[#000000]">
                  Fakta Terukur di Kelas
                </span>
                <div className="space-y-4">
                  {activeMethod.metrics.map((metric) => (
                    <div key={metric.label} className="flex items-baseline justify-between gap-4 pb-3 border-b border-[#D2D2D2] last:border-b-0 last:pb-0">
                      <span className="font-display font-black text-3xl sm:text-4xl text-[#000000] tabular-nums">
                        {metric.value}
                      </span>
                      <span className="text-xs sm:text-sm text-right text-[#555555] max-w-[22ch]">
                        {metric.label}
                      </span>
                    </div>
                  ))}
                </div>
                <div className="pt-3 text-[11px] text-[#555555] italic">
                  * Diterapkan langsung oleh tutor bersertifikasi di seluruh sesi bimbingan tatap muka Anemone.
                </div>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </section>
  )
}
