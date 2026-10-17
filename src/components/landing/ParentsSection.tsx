import { ArrowRight } from 'lucide-react'

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
        <div className="lp-parents-intro">
          <h2 className="lp-h2">Anak sudah sampai di kelas? Anda langsung tahu.</h2>
          <p>
            Tidak perlu menelepon tutor atau menunggu rapor akhir semester. Semua kabar penting soal belajar anak bisa Anda lihat dari HP.
          </p>

          <figure className="lp-message">
            <div className="lp-message-bubble">
              <div className="lp-message-head">
                <strong>Tadulako Cendekia</strong>
                <span>16.02</span>
              </div>
              <p>Fahri sudah hadir di kelas Fisika UTBK hari ini, pukul 16.00–17.30.</p>
              <span className="lp-message-tag">Hadir</span>
            </div>
            <figcaption>Contoh pesan yang Anda terima di WhatsApp.</figcaption>
          </figure>

          <a href="dashboard.html?role=parent" className="lp-link">
            Lihat contoh halaman orang tua <ArrowRight className="lucide" />
          </a>
        </div>

        <ul className="lp-benefits">
          {BENEFITS.map((benefit) => (
            <li key={benefit.title} className="lp-benefit">
              <h3>{benefit.title}</h3>
              <p>{benefit.desc}</p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}
