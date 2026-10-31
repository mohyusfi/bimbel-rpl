import * as React from 'react'
import { Dialog } from '@base-ui/react/dialog'
import { Quote, X, CheckCircle2 } from 'lucide-react'

export interface StoryItem {
  id: string
  name: string
  program: string
  destination: string
  school: string
  initials: string
  avatarColor: string
  quote: string
  fullStory: string
}

const PTN_STORIES: StoryItem[] = [
  {
    id: 'ptn-1',
    name: 'Raihani Sofia',
    program: 'Intensif UTBK-SNBT',
    destination: 'Universitas Tadulako — Kedokteran',
    school: 'Alumni SMAN 1 Palu',
    initials: 'RS',
    avatarColor: '#1E3A8A',
    quote: 'Awalnya ragu bisa tembus Kedokteran Untad karena persaingan sangat ketat. Di Pintar Yuk, pembahasannya detail sampai ke konsep dasar bukan cuma hafalan rumus kilat. Try out berkala bikin terbiasa dengan ritme waktu ujian.',
    fullStory: 'Awalnya ragu bisa tembus Kedokteran Untad karena persaingan sangat ketat. Di Pintar Yuk, pembahasannya detail sampai ke konsep dasar bukan cuma hafalan rumus kilat.\n\nTutor selalu sabar mendampingi sesi tanya jawab sampai saya benar-benar menguasai logika soal. Try out berkala dengan sistem scoring mirip SNBT resmi sangat melatih ketenangan mental dan manajemen waktu saat hari pelaksanaan ujian.',
  },
  {
    id: 'ptn-2',
    name: 'Sultan Zahid',
    program: 'Intensif UTBK-SNBT',
    destination: 'Institut Teknologi Bandung — Teknik Elektro',
    school: 'Alumni SMAN 2 Palu',
    initials: 'SZ',
    avatarColor: '#7C2D12',
    quote: 'Bukan cuma latihan soal, tutor di sini melatih logika pemecahan masalah dari prinsip pertama. Pola pikir analitis ini yang paling krusial pas ngerjain soal penalaran matematika dan skolastik berbobot tinggi.',
    fullStory: 'Bukan cuma latihan soal, tutor di sini melatih logika pemecahan masalah dari prinsip pertama. Pola pikir analitis ini yang paling krusial pas ngerjain soal penalaran matematika dan skolastik berbobot tinggi.\n\nSetiap sesi evaluasi, tutor tidak sekadar menunjukkan kunci jawaban, melainkan membedah pola pikir saya dalam menarik inferensi. Fondasi ini terasa sangat kokoh bahkan saat saya menjalani perkuliahan di ITB.',
  },
  {
    id: 'ptn-3',
    name: 'Khansa Maghfirah Haris',
    program: 'Intensif UTBK-SNBT',
    destination: 'Universitas Gadjah Mada — Manajemen',
    school: 'Alumni SMAN Model Terpadu Madani',
    initials: 'KM',
    avatarColor: '#065F46',
    quote: 'Bukan cuma aku bahkan sepupuku ikut les di sini setelah lihat progres belajarku. Tutornya komunikatif, kelas dibatasi maksimal 12 siswa jadi tutor hafal gaya belajar tiap anak. Konsultasi jurusan juga objektif.',
    fullStory: 'Bukan cuma aku bahkan sepupuku ikut les di sini setelah lihat progres belajarku. Tutornya komunikatif, kelas dibatasi maksimal 12 siswa jadi tutor hafal gaya belajar tiap anak.\n\nKita tidak sungkan berdiskusi bila ada materi sekolah yang belum tuntas. Ditambah lagi, sesi pemetaan peluang prodi membantu saya menentukan prioritas pilihan jurusan dengan sangat rasional.',
  },
  {
    id: 'ptn-4',
    name: 'Fabiola Icasia Rahmah',
    program: 'SMA Sukses & SNBT',
    destination: 'Universitas Indonesia — Ilmu Komunikasi',
    school: 'Alumni SMAN 3 Palu',
    initials: 'FI',
    avatarColor: '#581C87',
    quote: 'Strategi pembagian waktu per subtes yang diajarkan tutor sangat berdampak. Dari yang awalnya sering kehabisan waktu di literasi bahasa, kecepatan membaca dan ketepatan analisis saya meningkat konsisten.',
    fullStory: 'Strategi pembagian waktu per subtes yang diajarkan tutor sangat berdampak. Dari yang awalnya sering kehabisan waktu di literasi bahasa, kecepatan membaca dan ketepatan analisis saya meningkat konsisten.\n\nModul pembelajarannya ringkas tapi padat esensi. Catatan materi digital yang bisa diakses kapan saja memudahkan review ulang materi setiap malam sebelum tidur.',
  },
  {
    id: 'ptn-5',
    name: 'Abdul Hafiz Al Fahrezi',
    program: 'Intensif UTBK-SNBT',
    destination: 'Universitas Hasanuddin — Farmasi',
    school: 'Alumni SMA Al-Azhar Mandiri Palu',
    initials: 'AH',
    avatarColor: '#14532D',
    quote: 'Latihan soal dan bank materinya selalu ter-update dengan model soal penalaran teranyar. Catatan evaluasi berkala dari tutor membantu saya tahu bab mana yang masih rapuh dan butuh pendalaman.',
    fullStory: 'Latihan soal dan bank materinya selalu ter-update dengan model soal penalaran teranyar. Catatan evaluasi berkala dari tutor membantu saya tahu bab mana yang masih rapuh dan butuh pendalaman.\n\nLingkungan belajar di kelas sangat suportif dan mendorong semangat kompetisi positif. Menghadapi soal sulit tidak lagi membuat panik karena sudah terbiasa dibedah bersama di ruang bimbingan.',
  },
  {
    id: 'ptn-6',
    name: 'Justine Erdjie',
    program: 'Intensif UTBK-SNBT',
    destination: 'ITS — Sistem Informasi',
    school: 'Alumni SMAN 1 Palu',
    initials: 'JE',
    avatarColor: '#7F1D1D',
    quote: 'Jadwal bimbingan tertata rapi dan tidak pernah bentrok dengan agenda sekolah. Tutor matematika dan penalaran logis sangat telaten membangun konsep dari nol sampai mampu menaklukkan soal-soal HOTS.',
    fullStory: 'Jadwal bimbingan tertata rapi dan tidak pernah bentrok dengan agenda sekolah. Tutor matematika dan penalaran logis sangat telaten membangun konsep dari nol sampai mampu menaklukkan soal-soal HOTS.\n\nSaya yang awalnya menghindari materi hitungan kuantitatif, berkat pendekatan tutor yang terstruktur jadi paham logika di baliknya dan berhasil mendongkrak skor penalaran secara signifikan.',
  },
  {
    id: 'ptn-7',
    name: 'Rahmah Nuuru',
    program: 'Intensif UTBK-SNBT',
    destination: 'Universitas Padjadjaran — Sastra Jepang',
    school: 'Alumni SMAN 2 Palu',
    initials: 'RN',
    avatarColor: '#991B1B',
    quote: 'Dulu bingung harus mulai belajar dari mana karena cakupan materi ujian terasa sangat luas. Pintar Yuk memberi peta jalan belajar mingguan yang terstruktur sehingga progres terasa nyata.',
    fullStory: 'Dulu bingung harus mulai belajar dari mana karena cakupan materi ujian terasa sangat luas. Pintar Yuk memberi peta jalan belajar mingguan yang terstruktur sehingga progres terasa nyata.\n\nSelain itu orang tua saya merasa tenang karena setiap pertemuan selalu ada pemberitahuan kehadiran otomatis, jadi proses belajar terpantau dengan transparan.',
  },
  {
    id: 'ptn-8',
    name: 'Dimas Kurniawan',
    program: 'Kedinasan & SNBT',
    destination: 'Politeknik Keuangan Negara STAN',
    school: 'Alumni SMAN 1 Palu',
    initials: 'DK',
    avatarColor: '#1F2937',
    quote: 'Fokus bimbingan di TPS dan tes skolastik sangat intensif. Tutor memberikan teknik penalaran dan eliminasi opsi yang logis, sehingga akurasi serta kecepatan jawaban saya meningkat tajam saat ujian.',
    fullStory: 'Fokus bimbingan di TPS dan tes skolastik sangat intensif. Tutor memberikan teknik penalaran dan eliminasi opsi yang logis, sehingga akurasi serta kecepatan jawaban saya meningkat tajam saat ujian.\n\nDisiplin dan pembiasaan mental yang dilatih para tutor terbukti menjadi kunci keberhasilan saya bersaing di seleksi nasional yang kompetitif.',
  },
]

const MINDSET_STORIES: StoryItem[] = [
  {
    id: 'mindset-1',
    name: 'Faradilla AlFath',
    program: 'Alumni 2022',
    destination: 'Data Analyst — Perusahaan Teknologi',
    school: 'Alumni UI & Pintar Yuk',
    initials: 'FA',
    avatarColor: '#0F172A',
    quote: 'Cara mikir runtut dan penalaran kritis yang dilatih tutor beneran kepake pas kuliah sampai kerja. Kita dibiasakan jangan cuma meniru formula orang lain, tapi memahami alasan di balik setiap langkah solusi.',
    fullStory: 'Cara mikir runtut dan penalaran kritis yang dilatih tutor beneran kepake pas kuliah sampai kerja. Kita dibiasakan jangan cuma meniru formula orang lain, tapi memahami alasan di balik setiap langkah solusi.\n\nKetika menghadapi analisis data yang belum terstruktur dalam pekerjaan saat ini, pendekatan perumusan hipotesis yang diajarkan tutor dulu terasa sangat aplikatif dan teruji.',
  },
  {
    id: 'mindset-2',
    name: 'Bimantara Hanumpraja',
    program: 'Alumni 2023',
    destination: 'Software Engineer — Agensi Digital',
    school: 'Alumni Informatika Untad',
    initials: 'BH',
    avatarColor: '#1E293B',
    quote: 'Metode deliberate practice dan pemetaan materi yang diajarkan dulu, sekarang saya terapkan tiap kali mempelajari teknologi baru. Belajar hal rumit jadi terasa sistematis dan tidak membuat cemas.',
    fullStory: 'Metode deliberate practice dan pemetaan materi yang diajarkan dulu, sekarang saya terapkan tiap kali mempelajari teknologi baru. Belajar hal rumit jadi terasa sistematis dan tidak membuat cemas.\n\nKuncinya adalah mengidentifikasi bagian mana yang belum dipahami secara spesifik, lalu memperbaikinya berulang kali. Mentalitas belajar terarah ini tertanam kuat selama bimbingan.',
  },
  {
    id: 'mindset-3',
    name: 'Okeu Yudipratomo',
    program: 'Alumni 2021',
    destination: 'Project Coordinator — Konsultan Infrastruktur',
    school: 'Alumni Teknik Sipil UGM',
    initials: 'OY',
    avatarColor: '#166534',
    quote: 'Dulu saya tipe anak yang belajar sistem kebut semalam pas mau ujian. Di sini dibentuk kebiasaan belajar bertahap dengan ritme mingguan. Pola manajemen waktu itu yang menyelamatkan saya di kampus.',
    fullStory: 'Dulu saya tipe anak yang belajar sistem kebut semalam pas mau ujian. Di sini dibentuk kebiasaan belajar bertahap dengan ritme mingguan. Pola manajemen waktu itu yang menyelamatkan saya di kampus.\n\nKemampuan memecah target belajar besar menjadi bagian-bagian harian yang terukur merupakan kebiasaan paling bernilai yang saya bawa ke kehidupan profesional.',
  },
  {
    id: 'mindset-4',
    name: 'Aisyah Humaira',
    program: 'Alumni 2022',
    destination: 'Mahasiswa Magister Hukum — Universitas Indonesia',
    school: 'Alumni SMAN 1 Palu',
    initials: 'AH',
    avatarColor: '#6B21A8',
    quote: 'Bimbingan penalaran literasi melatih daya kritis saya dalam membedah teks panjang dan menemukan premis tersembunyi. Sangat terasa manfaatnya saat menyusun telaah hukum dan analisis putusan.',
    fullStory: 'Bimbingan penalaran literasi melatih daya kritis saya dalam membedah teks panjang dan menemukan premis tersembunyi. Sangat terasa manfaatnya saat menyusun telaah hukum dan analisis putusan.\n\nSaya belajar membaca secara aktif untuk menguji keabsahan sebuah argumen, bukan sekadar menyerap kata-kata secara pasif.',
  },
  {
    id: 'mindset-5',
    name: 'Izul Ramadhan',
    program: 'Alumni 2023',
    destination: 'Mahasiswa Kedokteran Gigi — Universitas Airlangga',
    school: 'Alumni SMAN 2 Palu',
    initials: 'IR',
    avatarColor: '#365314',
    quote: 'Mental tahan banting saat ketemu masalah rumit terbentuk di ruang kelas bimbingan. Tutor tidak langsung memberi jawaban cepat, tapi memandu kita dengan pertanyaan pemantik sampai kita mandiri.',
    fullStory: 'Mental tahan banting saat ketemu masalah rumit terbentuk di ruang kelas bimbingan. Tutor tidak langsung memberi jawaban cepat, tapi memandu kita dengan pertanyaan pemantik sampai kita mandiri.\n\nProses tersebut menumbuhkan keyakinan diri bahwa selama kita memiliki kerangka pemikiran yang benar, tantangan seberat apa pun dapat diuraikan secara runut.',
  },
  {
    id: 'mindset-6',
    name: 'Rabbani Malik',
    program: 'Alumni 2022',
    destination: 'Asisten Peneliti Psikologi — Universitas Gadjah Mada',
    school: 'Alumni SMAN Madani Palu',
    initials: 'RM',
    avatarColor: '#064E3B',
    quote: 'Di Pintar Yuk, kita diajarin cara merefleksikan proses belajar sendiri. Sekarang di dunia riset, saya bisa mandiri menyusun metodologi dan mencari solusi tanpa harus selalu menunggu arahan.',
    fullStory: 'Di Pintar Yuk, kita diajarin cara merefleksikan proses belajar sendiri. Sekarang di dunia riset, saya bisa mandiri menyusun metodologi dan mencari solusi tanpa harus selalu menunggu arahan.\n\nKemampuan mengenali batas kemampuan dan menyusun strategi belajar mandiri adalah bekal jangka panjang yang sangat berarti.',
  },
  {
    id: 'mindset-7',
    name: 'Fujima Nurhaliza',
    program: 'Alumni 2021',
    destination: 'Junior Architect — Studio Desain',
    school: 'Alumni Arsitektur ITB',
    initials: 'FN',
    avatarColor: '#881337',
    quote: 'Kombinasi bimbingan akademik dan dukungan mentor di sini sangat tulus. Mereka bukan sekadar mengajarkan trik praktis, tapi menanamkan disiplin berproses dan kejujuran dalam menyelesaikan target.',
    fullStory: 'Kombinasi bimbingan akademik dan dukungan mentor di sini sangat tulus. Mereka bukan sekadar mengajarkan trik praktis, tapi menanamkan disiplin berproses dan kejujuran dalam menyelesaikan target.\n\nDalam dunia kerja perancangan saat ini, integritas dan konsistensi kerja menjadi fondasi utama dalam berkolaborasi pada proyek-proyek penting.',
  },
  {
    id: 'mindset-8',
    name: 'Rifkie Pratama',
    program: 'Alumni 2023',
    destination: 'Cybersecurity Associate — Bank Nasional',
    school: 'Alumni Fasilkom UI',
    initials: 'RP',
    avatarColor: '#134E4A',
    quote: 'Penjelasan tutor selalu to the point dan kontekstual. Kebiasaan berpikir runtut itu membuat saya cepat beradaptasi dengan materi sertifikasi keamanan siber yang membutuhkan analisis mendalam.',
    fullStory: 'Penjelasan tutor selalu to the point dan kontekstual. Kebiasaan berpikir runtut itu membuat saya cepat beradaptasi dengan materi sertifikasi keamanan siber yang membutuhkan analisis mendalam.\n\nPondasi logika komputasi dan penalaran matematis yang kokoh menghindarkan rasa gentar saat menghadapi skenario keamanan siber yang rumit.',
  },
]

export function StoriesMarqueeSection() {
  const [selectedStory, setSelectedStory] = React.useState<StoryItem | null>(null)

  const handleOpenStory = React.useCallback((story: StoryItem) => {
    setSelectedStory(story)
  }, [])

  const handleCloseStory = React.useCallback(() => {
    setSelectedStory(null)
  }, [])

  return (
    <section
      id="cerita-siswa"
      className="lp-stories-section"
      aria-label="Cerita dan testimoni alumni"
      data-modal-open={Boolean(selectedStory)}
    >
      <div className="container lp-stories-head">
        <span className="lp-stories-tag">Rekam Jejak Belajar</span>
        <h2 className="lp-stories-title">
          Ini cerita siswa Pintar Yuk yang <span>lolos PTN</span> dan kampus impian:
        </h2>
      </div>

      {/* Baris 1: Marquee bergerak dari Kanan ke Kiri */}
      <div className="lp-stories-row-block">
        <div className="lp-marquee-container" aria-label="Daftar testimoni kelulusan PTN">
          <div className="lp-marquee-track lp-marquee-left">
            {/* Set 1 */}
            {PTN_STORIES.map((story) => (
              <StoryCard
                key={`row1-a-${story.id}`}
                story={story}
                onSelect={handleOpenStory}
              />
            ))}
            {/* Set 2 (duplikat untuk infinite loop seamless) */}
            {PTN_STORIES.map((story) => (
              <StoryCard
                key={`row1-b-${story.id}`}
                story={story}
                onSelect={handleOpenStory}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Judul Baris 2 */}
      <div className="container lp-stories-head lp-stories-subhead">
        <h2 className="lp-stories-title">
          Pola mikir dan cara belajar yang <span>kepake pas kuliah</span>, kerja, dan kehidupan:
        </h2>
      </div>

      {/* Baris 2: Marquee bergerak dari Kiri ke Kanan */}
      <div className="lp-stories-row-block">
        <div className="lp-marquee-container" aria-label="Daftar testimoni pola pikir dan kebiasaan belajar">
          <div className="lp-marquee-track lp-marquee-right">
            {/* Set 1 */}
            {MINDSET_STORIES.map((story) => (
              <StoryCard
                key={`row2-a-${story.id}`}
                story={story}
                onSelect={handleOpenStory}
              />
            ))}
            {/* Set 2 (duplikat untuk infinite loop seamless) */}
            {MINDSET_STORIES.map((story) => (
              <StoryCard
                key={`row2-b-${story.id}`}
                story={story}
                onSelect={handleOpenStory}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Dialog Modal Cerita Lengkap */}
      <Dialog.Root
        open={Boolean(selectedStory)}
        onOpenChange={(open) => !open && handleCloseStory()}
      >
        <Dialog.Portal>
          <Dialog.Backdrop className="lp-story-modal-backdrop" />
          <Dialog.Viewport className="lp-story-modal-viewport">
            {selectedStory && (
              <Dialog.Popup
                className="lp-story-modal-popup"
                role="dialog"
                aria-modal="true"
                aria-labelledby="story-modal-title"
                finalFocus={false}
              >
                <div className="lp-story-modal-header">
                  <div className="flex items-center gap-3">
                    <div
                      className="lp-story-avatar"
                      style={{ backgroundColor: selectedStory.avatarColor }}
                      aria-hidden="true"
                    >
                      {selectedStory.initials}
                    </div>
                    <div>
                      <Dialog.Title
                        render={
                          <h3 id="story-modal-title" className="font-display text-base font-bold text-[#000000]" />
                        }
                      >
                        {selectedStory.name}
                      </Dialog.Title>
                      <Dialog.Description
                        render={
                          <p className="text-xs text-[#555555] mt-0.5" />
                        }
                      >
                        {selectedStory.destination}
                      </Dialog.Description>
                    </div>
                  </div>
                  <Dialog.Close
                    render={
                      <button
                        type="button"
                        className="lp-story-modal-close"
                        aria-label="Tutup cerita"
                        onClick={handleCloseStory}
                      />
                    }
                  >
                    <X className="w-4 h-4" />
                  </Dialog.Close>
                </div>

                <div className="mb-4 flex items-center gap-2 text-xs text-[#555555] font-medium">
                  <CheckCircle2 className="w-3.5 h-3.5 text-[#CB2957]" />
                  <span>{selectedStory.school} &bull; {selectedStory.program}</span>
                </div>

                <div className="lp-story-modal-text">
                  <Quote className="w-5 h-5 text-[#CB2957] mb-3" />
                  {selectedStory.fullStory}
                </div>

                <div className="lp-story-modal-footer">
                  <button
                    type="button"
                    className="btn btn-outline btn-sm"
                    onClick={handleCloseStory}
                  >
                    Tutup
                  </button>
                </div>
              </Dialog.Popup>
            )}
          </Dialog.Viewport>
        </Dialog.Portal>
      </Dialog.Root>
    </section>
  )
}

interface StoryCardProps {
  story: StoryItem
  onSelect: (story: StoryItem) => void
}

const StoryCard = React.memo(function StoryCard({ story, onSelect }: StoryCardProps) {
  const handleClick = React.useCallback(() => {
    onSelect(story)
  }, [story, onSelect])

  return (
    <article className="lp-story-card">
      <div>
        <Quote className="lp-story-quote-icon w-4 h-4" aria-hidden="true" />
        <p className="lp-story-body">{story.quote}</p>
        <button
          type="button"
          className="lp-story-expand-btn"
          onClick={handleClick}
          aria-label={`Baca cerita lengkap dari ${story.name}`}
        >
          Baca selengkapnya
        </button>
      </div>

      <div className="lp-story-author">
        <div
          className="lp-story-avatar"
          style={{ backgroundColor: story.avatarColor }}
          aria-hidden="true"
        >
          {story.initials}
        </div>
        <div className="lp-story-info">
          <div className="lp-story-name">{story.name}</div>
          <div className="lp-story-role">{story.destination}</div>
        </div>
      </div>
    </article>
  )
})
