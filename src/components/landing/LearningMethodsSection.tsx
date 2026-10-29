import { Link } from '@tanstack/react-router'
import { motion } from 'motion/react'
import { ArrowRight } from 'lucide-react'
import { LEARNING_METHODS } from '~/lib/learning-methods'
import { fadeInUp, staggerContainer, viewportConfig } from '~/lib/motion'

export function LearningMethodsSection() {
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
          <h2 className="lp-h2">Empat cara kami membuat anak paham</h2>
          <p>Pilih satu untuk melihat cara kerjanya di kelas.</p>
        </motion.header>

        <motion.ol
          className="lp-methods-poster-grid"
          variants={staggerContainer(0.08)}
          initial="hidden"
          whileInView="visible"
          viewport={viewportConfig}
        >
          {LEARNING_METHODS.map((method, idx) => {
            const isInverse = idx % 2 === 1
            return (
              <motion.li key={method.slug} variants={fadeInUp} className="lp-method-poster-item">
                <Link
                  to={`/metode/${method.slug}` as any}
                  className={`lp-method-poster-card${isInverse ? ' is-inverse' : ''}`}
                >
                  <span className="lp-method-poster-watermark" aria-hidden="true">
                    {method.number}
                  </span>

                  <div className="lp-method-poster-top">
                    <span className="lp-method-poster-num">{method.number}</span>
                    <h3 className="lp-method-poster-title">{method.shortName}</h3>
                    <p className="lp-method-poster-line">{method.cardLine}</p>
                  </div>

                  <div className="lp-method-poster-reveal">
                    <div className="lp-method-poster-metric">
                      <span className="lp-method-poster-metric-val">
                        {method.cardMetric.value}
                      </span>
                      <span className="lp-method-poster-metric-lbl">
                        {method.cardMetric.label}
                      </span>
                    </div>
                    <span className="lp-method-poster-cta">
                      <span>Lihat cara kerjanya</span>
                      <ArrowRight className="lucide" />
                    </span>
                  </div>
                </Link>
              </motion.li>
            )
          })}
        </motion.ol>
      </div>
    </section>
  )
}
