import { motion } from 'motion/react'
import {
  fadeInUp,
  fadeInLeft,
  fadeInRight,
  staggerContainer,
  viewportConfig,
} from '~/lib/motion'

const BENEFITS = [
  {
    title: 'Kabar setiap pertemuan',
    desc: 'Tutor mencatat kehadiran di awal kelas. Anda langsung tahu anak hadir, sakit, izin, atau tidak datang.',
  },
  {
    title: 'Nilai dan catatan tutor',
    desc: 'Hasil try out dan catatan perkembangan dari tutor bisa dibuka kapan saja. Lebih dari satu anak? Semuanya ada di satu akun.',
  },
  {
    title: 'Jadwal tidak pernah bentrok',
    desc: 'Jadwal tutor dan ruang kelas dicek otomatis sebelum disusun, jadi tidak ada dua kelas di ruangan atau jam yang sama.',
  },
  {
    title: 'Bayar les tanpa repot',
    desc: 'Kirim foto bukti transfer dari HP. Setelah dicek admin, kwitansi resmi bisa langsung diunduh dan dicetak.',
  },
] as const

export function ParentsSection() {
  return (
    <section id="orang-tua" className="lp-section lp-parents">
      <div className="container lp-parents-grid">
        <motion.div
          className="lp-parents-intro"
          variants={fadeInLeft}
          initial="hidden"
          whileInView="visible"
          viewport={viewportConfig}
        >
          <h2 className="lp-h2">Anak sudah sampai di kelas? Anda langsung tahu.</h2>
          <p>
            Tidak perlu menelepon tutor atau menunggu rapor akhir semester. Semua kabar penting soal belajar anak bisa Anda lihat dari HP.
          </p>

          <motion.figure
            className="lp-message"
            whileHover={{ scale: 1.01 }}
            transition={{ duration: 0.2 }}
          >
            <div className="lp-message-bubble">
              <div className="lp-message-head">
                <strong>Pintar Yuk</strong>
                <span>16.02</span>
              </div>
              <p>Fahri sudah hadir di kelas Fisika UTBK hari ini, pukul 16.00–17.30.</p>
              <span className="lp-message-tag">Hadir</span>
            </div>
            <figcaption>Contoh notifikasi presensi langsung di portal orang tua.</figcaption>
          </motion.figure>

          <p className="mt-6 text-sm text-[#555555]">
            Semua laporan perkembangan dan presensi dapat diakses langsung oleh orang tua wali setelah pendaftaran.
          </p>
        </motion.div>

        <motion.ul
          className="lp-benefits"
          variants={staggerContainer(0.08)}
          initial="hidden"
          whileInView="visible"
          viewport={viewportConfig}
        >
          {BENEFITS.map((benefit) => (
            <motion.li
              key={benefit.title}
              variants={fadeInRight}
              className="lp-benefit"
            >
              <h3>{benefit.title}</h3>
              <p>{benefit.desc}</p>
            </motion.li>
          ))}
        </motion.ul>
      </div>
    </section>
  )
}
