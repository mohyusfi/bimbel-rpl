import { motion } from 'motion/react'
import { fadeInUp, staggerContainer, viewportConfig } from '~/lib/motion'

interface ProgramsSectionProps {
  onSelectProgram: (code: string) => void
}

const PROGRAMS = [
  {
    num: '01',
    code: 'SD',
    name: 'SD Cendekia',
    grade: 'Kelas 1–6',
    desc: 'Membaca, menulis, berhitung, matematika dasar, dan IPA dengan contoh sehari-hari. Anak dibiasakan belajar sendiri tanpa dipaksa.',
    points: ['Paling banyak 10 siswa', 'Modul cetak & digital'],
    btnText: 'Pilih SD',
    btnClass: 'btn btn-outline',
    isFeatured: false,
  },
  {
    num: '02',
    code: 'SMP',
    name: 'SMP Prestasi',
    grade: 'Kelas 7–9',
    desc: 'Matematika, IPA, dan Bahasa Inggris dibahas sampai paham, untuk ujian sekolah dan asesmen. Anak juga bisa bertanya soal PR.',
    points: ['Paling banyak 12 siswa', 'Try out berkala'],
    btnText: 'Pilih SMP',
    btnClass: 'btn btn-outline',
    isFeatured: false,
  },
  {
    num: '03',
    code: 'SMA',
    name: 'SMA Sukses',
    grade: 'Kelas 10–12',
    desc: 'Pelajaran peminatan IPA atau IPS, menjaga nilai rapor, dan mulai bersiap masuk perguruan tinggi negeri.',
    points: ['Laporan perkembangan bulanan', 'Bank soal online'],
    btnText: 'Pilih SMA',
    btnClass: 'btn btn-outline',
    isFeatured: false,
  },
  {
    num: '04',
    code: 'UTBK',
    name: 'Intensif UTBK-SNBT',
    grade: 'Kelas 12, persiapan PTN',
    badge: 'Program unggulan',
    desc: 'Bedah soal TPS, literasi, dan penalaran matematika. Try out bertahap yang mirip UTBK asli, plus bantuan memilih jurusan yang realistis.',
    points: ['Try out mirip UTBK asli', 'Hitung peluang lolos jurusan'],
    btnText: 'Pilih UTBK',
    btnClass: 'btn btn-accent',
    isFeatured: true,
  },
] as const

export function ProgramsSection({ onSelectProgram }: ProgramsSectionProps) {
  return (
    <section id="program" className="lp-section">
      <div className="container">
        <motion.header
          className="lp-section-head"
          variants={fadeInUp}
          initial="hidden"
          whileInView="visible"
          viewport={viewportConfig}
        >
          <h2 className="lp-h2">Pilih sesuai jenjang anak</h2>
          <p>
            Setiap paket sudah termasuk modul, latihan soal online, dan try out. Tidak ada biaya tambahan.
          </p>
        </motion.header>

        <motion.ol
          className="lp-programs"
          variants={staggerContainer(0.09)}
          initial="hidden"
          whileInView="visible"
          viewport={viewportConfig}
        >
          {PROGRAMS.map((program) => (
            <motion.li
              key={program.num}
              variants={fadeInUp}
              whileHover={{ y: -4, transition: { duration: 0.2 } }}
              className={`lp-program${program.isFeatured ? ' is-featured' : ''}`}
            >
              <span className="lp-program-num">{program.num}</span>
              <div className="lp-program-name">
                {'badge' in program && (
                  <span className="lp-program-badge">{program.badge}</span>
                )}
                <h3>{program.name}</h3>
                <span>{program.grade}</span>
              </div>
              <div className="lp-program-desc-wrap">
                <p className="lp-program-desc">{program.desc}</p>
                <ul className="lp-program-points">
                  {program.points.map((point) => (
                    <li key={point}>{point}</li>
                  ))}
                </ul>
              </div>
              <button
                type="button"
                className={program.btnClass}
                onClick={() => onSelectProgram(program.code)}
              >
                {program.btnText}
              </button>
            </motion.li>
          ))}
        </motion.ol>
      </div>
    </section>
  )
}
