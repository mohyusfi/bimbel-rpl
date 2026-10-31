import { ArrowRight } from 'lucide-react'
import { motion } from 'motion/react'
import { fadeInUp, fadeInRight, staggerContainer, viewportConfig } from '~/lib/motion'

interface HeroProps {
  onOpenRegister: () => void
  onSelectProgram: (code: string) => void
}

const SCHEDULE_BOARD_ITEMS = [
  {
    code: 'SD',
    title: 'SD Cendekia',
    seat: 'Sisa 3 kursi',
    isHot: false,
    isUtbk: false,
    time: 'Senin, Rabu, Jumat · 15.00–16.30',
  },
  {
    code: 'SMP',
    title: 'SMP Prestasi',
    seat: 'Sisa 4 kursi',
    isHot: false,
    isUtbk: false,
    time: 'Selasa, Kamis, Sabtu · 15.30–17.00',
  },
  {
    code: 'SMA',
    title: 'SMA Sukses',
    seat: 'Sisa 2 kursi',
    isHot: false,
    isUtbk: false,
    time: 'Senin, Rabu, Jumat · 16.30–18.00',
  },
  {
    code: 'UTBK',
    title: 'Intensif UTBK-SNBT',
    seat: 'Sisa 2 kursi',
    isHot: true,
    isUtbk: true,
    time: 'Selasa, Kamis, Sabtu · 16.00–18.00',
  },
] as const

const FACTS = [
  {
    value: '12',
    label: 'siswa paling banyak dalam satu kelas',
  },
  {
    value: '4',
    label: 'metode belajar terarah & teruji',
  },
  {
    value: 'Gratis',
    label: 'kelas pertama dan konsultasi belajar',
  },
] as const

export function Hero({ onOpenRegister, onSelectProgram }: HeroProps) {
  return (
    <section id="beranda" className="lp-hero">
      <div className="container">
        <div className="lp-hero-grid">
          <motion.div
            className="lp-hero-main"
            variants={staggerContainer(0.08, 0.05)}
            initial={false}
            animate="visible"
          >
            <motion.h1 variants={fadeInUp} className="lp-hero-title">
              Paham dari konsep dasar, jadwal pasti, orang tua selalu <em>tahu.</em>
            </motion.h1>

            <motion.p variants={fadeInUp} className="lp-hero-lead">
              Untuk siswa SD, SMP, SMA, dan persiapan UTBK. Kelas kecil maksimal 12 siswa, tutor mendampingi logika berpikir sampai paham, dan notifikasi kehadiran langsung masuk ke akun portal orang tua setiap sesi.
            </motion.p>
            <motion.div variants={fadeInUp} className="lp-hero-actions">
              <motion.button
                type="button"
                className="btn btn-accent btn-lg"
                onClick={onOpenRegister}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                Daftar sekarang <ArrowRight className="lucide" />
              </motion.button>
              <a href="#metode-belajar" className="lp-link">
                Pelajari metode kami
              </a>
            </motion.div>
          </motion.div>

          <motion.aside
            className="lp-board"
            aria-label="Jadwal kelas mingguan"
            variants={fadeInRight}
            initial={false}
            animate="visible"
          >
            <div className="lp-board-head">
              <span className="lp-board-title">Jadwal Kelas</span>
            </div>
            <ul className="lp-board-list">
              {SCHEDULE_BOARD_ITEMS.map((item) => (
                <li key={item.code}>
                  <button
                    type="button"
                    className={`lp-board-row${item.isUtbk ? ' is-utbk' : ''}`}
                    onClick={() => onSelectProgram(item.code)}
                  >
                    <div className="lp-board-row-top">
                      <strong>{item.title}</strong>
                      <span className={`lp-board-seat${item.isHot ? ' is-hot' : ''}`}>
                        {item.seat}
                      </span>
                    </div>
                    <span className="lp-board-time">{item.time}</span>
                  </button>
                </li>
              ))}
            </ul>
            <div className="lp-board-foot">
              <span>Klik jenjang untuk daftar &amp; ikut 1x kelas gratis.</span>
            </div>
          </motion.aside>
        </div>

        <motion.ul
          className="lp-facts"
          variants={staggerContainer(0.08)}
          initial="hidden"
          whileInView="visible"
          viewport={viewportConfig}
        >
          {FACTS.map((fact) => (
            <motion.li key={fact.value} variants={fadeInUp} className="lp-fact">
              <span className="lp-fact-value">{fact.value}</span>
              <span className="lp-fact-label">{fact.label}</span>
            </motion.li>
          ))}
        </motion.ul>
      </div>
    </section>
  )
}
