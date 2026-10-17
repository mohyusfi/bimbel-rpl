import { ArrowRight } from 'lucide-react'

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
    label: 'jenjang: SD, SMP, SMA, dan UTBK',
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
          <div className="lp-hero-main">
            <p className="lp-kicker">Bimbingan belajar tatap muka di Kota Palu</p>

            <h1 className="lp-hero-title">
              Kelas kecil, jadwal pasti, orang tua selalu <em>tahu.</em>
            </h1>

            <p className="lp-hero-lead">
              Untuk anak SD, SMP, SMA, dan yang sedang bersiap UTBK. Tutor mendampingi langsung, dan Anda dapat kabar lewat WhatsApp setiap kali anak hadir di kelas.
            </p>
            <div className="lp-hero-actions">
              <button
                type="button"
                className="btn btn-accent btn-lg"
                onClick={onOpenRegister}
              >
                Daftar sekarang <ArrowRight className="lucide" />
              </button>
              <a href="#program" className="lp-link">
                Lihat program
              </a>
            </div>
          </div>

          <aside className="lp-board" aria-label="Jadwal kelas mingguan">
            <div className="lp-board-head">
              <span className="lp-board-title">Jadwal Kelas Sore</span>
              <span className="lp-board-loc">Kota Palu</span>
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
          </aside>
        </div>

        <ul className="lp-facts">
          {FACTS.map((fact) => (
            <li key={fact.value} className="lp-fact">
              <span className="lp-fact-value">{fact.value}</span>
              <span className="lp-fact-label">{fact.label}</span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}
