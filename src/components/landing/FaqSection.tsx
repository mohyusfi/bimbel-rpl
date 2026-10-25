import { Accordion } from '@base-ui/react/accordion'
import { ChevronDown } from 'lucide-react'
import { cn } from '~/lib/utils'

const FAQ_ITEMS = [
  {
    id: 'faq-ans-1',
    question: 'Apa bedanya dengan bimbel lain?',
    answer:
      'Kelasnya kecil, paling banyak 12 siswa, jadi tutor bisa memperhatikan tiap anak. Jadwal disusun supaya tidak bentrok, dan orang tua menerima notifikasi kehadiran langsung di portal setiap pertemuan. Materinya mengikuti kurikulum sekolah di Palu dan standar UTBK-SNBT.',
  },
  {
    id: 'faq-ans-2',
    question: 'Di YouTube banyak video materi gratis. Kenapa harus ikut bimbel?',
    answer:
      'Video tidak bisa menjawab saat anak bingung di soal yang sulit, dan tidak ada yang mengecek apakah anak benar-benar paham. Di sini tutor mendampingi langkah demi langkah, dan try out rutin menunjukkan seberapa siap anak sebenarnya.',
  },
  {
    id: 'faq-ans-3',
    question: 'Apakah ada kelas percobaan gratis?',
    answer:
      'Ada. Calon siswa bisa ikut konsultasi belajar dan satu kelas pertama tanpa biaya. Setelah merasakan cara tutor mengajar, baru putuskan mau lanjut atau tidak.',
  },
  {
    id: 'faq-ans-4',
    question: 'Kalau daftar satu paket, bisa ikut kelas jenjang lain?',
    answer:
      'Tidak. Setiap pendaftaran untuk satu jenjang (SD, SMP, SMA, atau UTBK) supaya belajarnya fokus. Di dalam paket itu, modul cetak, latihan soal online, bantuan PR, dan try out sudah termasuk. Tidak ada biaya tambahan.',
  },
  {
    id: 'faq-ans-5',
    question: 'Materinya sampai mana?',
    answer:
      'Mulai dari konsep dasar kurikulum nasional, bantuan PR, persiapan ujian semester, sampai soal penalaran, TPS, dan literasi untuk masuk PTN seperti Untad, Unhas, UI, dan ITB.',
  },
  {
    id: 'faq-ans-6',
    question: 'Ada aplikasinya?',
    answer:
      'Ada, berupa website yang bisa dibuka dari HP, tablet, atau laptop tanpa perlu instal. Siswa melihat jadwal dan materi. Orang tua melihat kehadiran, nilai, dan tagihan.',
  },
  {
    id: 'faq-ans-7',
    question: 'Bagaimana cara mendaftar?',
    answer:
      'Klik tombol Daftar, lalu isi data anak dan nomor WhatsApp orang tua. Admin kami mengecek kursi yang tersedia dan menghubungi Anda untuk jadwal kelas pertama.',
  },
] as const

export function FaqSection() {
  return (
    <section id="faq" className="lp-section lp-faq">
      <div className="container lp-faq-grid">
        <h2 className="lp-h2">Yang sering ditanyakan</h2>

        <Accordion.Root className="faq-list" defaultValue={['faq-ans-1']}>
          {FAQ_ITEMS.map((faq) => (
            <Accordion.Item
              key={faq.id}
              value={faq.id}
              className={(state) => cn('faq-item', state.open && 'active')}
            >
              <Accordion.Trigger className="faq-trigger">
                <span>{faq.question}</span>
                <span className="faq-icon">
                  <ChevronDown className="lucide" />
                </span>
              </Accordion.Trigger>
              <Accordion.Panel className="faq-panel" keepMounted>
                <div className="faq-answer">
                  <p>{faq.answer}</p>
                </div>
              </Accordion.Panel>
            </Accordion.Item>
          ))}
        </Accordion.Root>
      </div>
    </section>
  )
}
