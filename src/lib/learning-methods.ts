export interface LearningMethodStep {
  stepNumber: string
  title: string
  description: string
  tutorAction: string
  studentAction: string
  realExample: string
}

export interface LearningMethodComparison {
  aspect: string
  conventional: string
  anemone: string
}

export interface LearningMethodItem {
  slug: string
  number: string
  shortName: string
  title: string
  tagline: string
  cardLine: string
  cardMetric: {
    value: string
    label: string
  }
  badge: string
  heroLead: string
  recommendedPackage: 'SD' | 'SMP' | 'SMA' | 'UTBK'
  recommendedPackageName: string
  metrics: {
    value: string
    label: string
  }[]
  overviewPoints: string[]
  simulationSteps: LearningMethodStep[]
  comparisons: LearningMethodComparison[]
  symptoms: {
    id: string
    text: string
  }[]
}

export const LEARNING_METHODS: LearningMethodItem[] = [
  {
    slug: 'konsep-dasar',
    number: '01',
    shortName: 'Konsep Dasar',
    title: 'Metode Konsep Dasar (First-Principles)',
    tagline: 'Membedah Logika dari Akar, Bukan Hafalan Rumus Cepat',
    cardLine: 'Paham alasan di balik rumus.',
    cardMetric: {
      value: '4 tahap',
      label: 'alur bedah konsep per topik',
    },
    badge: 'Fondasi Utama',
    heroLead:
      'Siswa sering kesulitan saat tipe soal sedikit dimodifikasi karena hanya menghafal rumus. Di Pintar Yuk, setiap topik diurai dari prinsip pertama hingga siswa paham mengapa rumus itu ada dan kapan harus dipakai.',
    recommendedPackage: 'SMP',
    recommendedPackageName: 'SMP Prestasi & SD Cendekia',
    metrics: [
      { value: '100%', label: 'pemahaman logika konsep sebelum latihan soal' },
      { value: '0', label: 'hafalan rumus buta tanpa konteks' },
      { value: '3x', label: 'lebih adaptif saat menghadapi variasi soal baru' },
    ],
    overviewPoints: [
      'Visualisasi konsep abstrak menggunakan contoh kejadian sehari-hari.',
      'Penurunan rumus secara bertahap bersama siswa di papan tulis.',
      'Diskusi kritis untuk menguji batas pemahaman sebelum beralih bab.',
    ],
    simulationSteps: [
      {
        stepNumber: '01',
        title: 'Pemantik Fenomena Konkret',
        description: 'Tutor membuka sesi dengan kasus nyata yang relevan dengan kehidupan siswa sebelum menulis simbol atau variabel matematis.',
        tutorAction: 'Mengajukan pertanyaan: "Mengapa saat mengerem mendadak, tubuh kita terdorong ke depan?"',
        studentAction: 'Mencoba mengutarakan pengamatan dengan bahasa sendiri tanpa takut salah.',
        realExample: 'Fisika Kelas 7 / 10 — Konsep Inersia dan Hukum I Newton.',
      },
      {
        stepNumber: '02',
        title: 'Dekomposisi Logika Matematika',
        description: 'Menyusun hubungan sebab-akibat antarvariabel sebelum membentuk formula resmi.',
        tutorAction: 'Memandu menurunkan formula gaya (F = m × a) dari tabel percobaan massa dan percepatan.',
        studentAction: 'Menghubungkan pola angka menjadi sebuah relasi proporsional yang logis.',
        realExample: 'Mengetahui kenapa percepatan berbanding terbalik dengan massa benda.',
      },
      {
        stepNumber: '03',
        title: 'Uji Ekstrem & Batas Konsep',
        description: 'Mengubah skenario ke kondisi ekstrem untuk melihat apakah siswa benar-benar paham batasan rumus.',
        tutorAction: '"Bagaimana jika massanya nol, atau percepatannya nol? Apa yang terjadi pada gaya total?"',
        studentAction: 'Menalar kondisi batas tanpa perlu mencari contekan catatan rumus.',
        realExample: 'Mendeteksi jebakan soal gerak tanpa gesekan vs gerak dengan hambatan udara.',
      },
      {
        stepNumber: '04',
        title: 'Aplikasi Soal Konseptual',
        description: 'Menyelesaikan 3 variasi soal HOTS yang tidak bisa dijawab dengan trik cepat biasa.',
        tutorAction: 'Memberikan umpan balik langsung pada alur berpikir pengerjaan siswa.',
        studentAction: 'Menjelaskan langkah penyelesaian kembali kepada tutor secara runtut.',
        realExample: 'Soal penalaran analitis tipe asesmen nasional dan UTBK.',
      },
    ],
    comparisons: [
      {
        aspect: 'Menghadapi Rumus',
        conventional: 'Diberi daftar rumus jadi dan disuruh hafal sebelum latihan.',
        anemone: 'Membangun logika rumus bersama, sehingga otomatis teringat tanpa dihafal paksa.',
      },
      {
        aspect: 'Variasi Soal Berubah',
        conventional: 'Bingung dan panik karena pola kalimat berbeda dari contoh guru.',
        anemone: 'Tenang mengenali variabel kunci karena memegang prinsip dasar.',
      },
      {
        aspect: 'Ketahanan Memori',
        conventional: 'Lupa dalam 2 minggu setelah ujian sekolah selesai.',
        anemone: 'Melekat sebagai kerangka berpikir hingga jenjang perguruan tinggi.',
      },
    ],
    symptoms: [
      { id: 's1', text: 'Anak sering mengeluh: "Di catatan bisa, pas ujian soalnya beda jadi bingung."' },
      { id: 's2', text: 'Menghafal rumus matematika/fisika tapi tidak tahu kapan harus menggunakannya.' },
      { id: 's3', text: 'Cepat lupa materi pelajaran bab sebelumnya saat masuk bab baru.' },
    ],
  },
  {
    slug: 'active-recall',
    number: '02',
    shortName: 'Active Recall',
    title: 'Metode Active Recall & Kelas Kecil',
    tagline: 'Diskusi Terarah Maksimal 12 Siswa, Tanpa Menonton Pasif',
    cardLine: 'Maks. 12 siswa, semua ikut bicara.',
    cardMetric: {
      value: '12',
      label: 'siswa maksimal per kelas',
    },
    badge: 'Interaktif Nyata',
    heroLead:
      'Membaca buku berulang kali hanya memberi ilusi pemahaman. Pintar Yuk membatasi rombel maksimal 10–12 siswa dan mewajibkan uji panggil memori aktif (active recall) di setiap pertemuan kelas.',
    recommendedPackage: 'SMA',
    recommendedPackageName: 'SMA Sukses & SMP Prestasi',
    metrics: [
      { value: '12', label: 'siswa maksimal per rombongan belajar' },
      { value: '100%', label: 'siswa ditanya dan aktif berpendapat di kelas' },
      { value: '2x', label: 'retensi memori materi lebih tahan lama' },
    ],
    overviewPoints: [
      'Rombel kecil memastikan tutor mengenali karakter dan kecepatan belajar tiap anak.',
      'Sesi retrieval practice 10 menit di awal dan akhir tiap pertemuan.',
      'Kultur kelas terbuka yang mendorong siswa berani bertanya tanpa rasa malu.',
    ],
    simulationSteps: [
      {
        stepNumber: '01',
        title: 'Pemanasan Retrieval 7 Menit',
        description: 'Tutup buku catatan. Siswa menuliskan konsep kunci pertemuan lalu dari ingatan sendiri.',
        tutorAction: 'Menampilkan 3 pertanyaan pemantik di layar tanpa menyertakan pilihan jawaban.',
        studentAction: 'Menggali memori dan menuliskan pemahaman inti di lembar latihan ringkas.',
        realExample: 'Memetakan kembali siklus sel biologi atau rumus turunan aljabar.',
      },
      {
        stepNumber: '02',
        title: 'Diskusi Melingkar & Socratic Questioning',
        description: 'Tutor melempar pertanyaan berantai untuk membangun argumen kelas yang kolaboratif.',
        tutorAction: '"Fahri, mengapa langkah kedua menghasilkan nilai negatif? Menurut Laras bagaimana?"',
        studentAction: 'Mengevaluasi jawaban teman sebangku dan menyempurnakan argumen bersama.',
        realExample: 'Analisis teks literasi bahasa Indonesia dan penalaran kritis.',
      },
      {
        stepNumber: '03',
        title: 'Micro-Challenge Papan Tulis',
        description: 'Siswa bergantian maju atau menjelaskan potongan langkah pengerjaan di hadapan kelompok kecil.',
        tutorAction: 'Mengoreksi miskonsepsi tepat di titik kesalahan tanpa membuat anak merasa dihakimi.',
        studentAction: 'Melatih kepercayaan diri berbicara dan menyampaikan penalaran matematis.',
        realExample: 'Penyelesaian soal persamaan kuadrat atau stoikiometri kimia.',
      },
      {
        stepNumber: '04',
        title: 'Exit Ticket Refleksi Pemahaman',
        description: 'Sebelum kelas berakhir, tiap anak menuliskan satu hal yang paling dipahami dan satu hal yang masih ragu.',
        tutorAction: 'Membaca tiket keluar untuk bahan catatan evaluasi mingguan ke portal orang tua.',
        studentAction: 'Melakukan metakognisi terhadap progres belajarnya hari ini.',
        realExample: 'Catatan langsung terhubung ke dashboard evaluasi tutor.',
      },
    ],
    comparisons: [
      {
        aspect: 'Aktivitas Kelas',
        conventional: 'Mendengarkan ceramah satu arah guru di kelas besar 30+ siswa.',
        anemone: 'Tutor memancing dialog aktif di kelas kecil maks. 12 siswa.',
      },
      {
        aspect: 'Deteksi Kesalahan',
        conventional: 'Baru ketahuan tidak paham saat nilai ujian sekolah keluar anjlok.',
        anemone: 'Langsung terdeteksi dan diluruskan di menit pertama saat diskusi berlangsung.',
      },
      {
        aspect: 'Keterlibatan Siswa',
        conventional: 'Hanya 2–3 siswa yang berani angkat tangan, sisanya diam.',
        anemone: 'Setiap anak mendapat giliran menjawab dan berkonsultasi langsung.',
      },
    ],
    symptoms: [
      { id: 'ar1', text: 'Anak pasif di sekolah karena malu bertanya di kelas yang terlalu ramai.' },
      { id: 'ar2', text: 'Merasa sudah paham saat membaca catatan, tapi mendadak blank saat diminta menjawab.' },
      { id: 'ar3', text: 'Belajar hanya dengan membaca ulang buku teks tanpa latihan panggil ingatan.' },
    ],
  },
  {
    slug: 'deliberate-practice',
    number: '03',
    shortName: 'Deliberate Practice',
    title: 'Metode Deliberate Practice & Simulasi Adaptif',
    tagline: 'Latihan Terarah pada Titik Lemah Spesifik dengan Ritme UTBK Nyata',
    cardLine: 'Latihan tepat di bagian yang lemah.',
    cardMetric: {
      value: '4x',
      label: 'simulasi try out per semester',
    },
    badge: 'Hasil Terukur',
    heroLead:
      'Bukan sekadar memperbanyak latihan soal acak. Deliberate practice Pintar Yuk memetakan subtes mana yang masih rapuh, melatih manajemen waktu per soal, dan memberi simulasi try out terstandar.',
    recommendedPackage: 'UTBK',
    recommendedPackageName: 'Intensif UTBK-SNBT 2026',
    metrics: [
      { value: '100%', label: 'soal berbobot penalaran analitis & HOTS terkini' },
      { value: 'IRT', label: 'sistem penilaian simulasi try out mirip standar SNPMB' },
      { value: '+140', label: 'rata-rata kenaikan skor try out setelah 8 sesi berkala' },
    ],
    overviewPoints: [
      'Peta jalan mingguan yang memecah target skor ambisius menjadi target harian.',
      'Analisis butir soal pasca-try out untuk mendeteksi distractor dan perangkap opsi.',
      'Latihan kecepatan: teknik eliminasi opsi logis di bawah 90 detik per nomor.',
    ],
    simulationSteps: [
      {
        stepNumber: '01',
        title: 'Diagnostic Test & Pemetaan Kelemahan',
        description: 'Tes awal untuk mengidentifikasi topik spesifik yang sering salah (misal: Geometri vs Aljabar).',
        tutorAction: 'Menganalisis matriks kesalahan siswa per subtes TPS dan Literasi.',
        studentAction: 'Mengetahui dengan persis area prioritas yang wajib diperbaiki terlebih dahulu.',
        realExample: 'Laporan diagnostik: "Akurasi Penalaran Induktif 85%, Penalaran Matematika 42%."',
      },
      {
        stepNumber: '02',
        title: 'Latihan Fokus Titik Rapuh (Targeted Drills)',
        description: 'Siswa hanya melatih tipe soal yang skornya masih di bawah ambang batas aman jurusan impian.',
        tutorAction: 'Menyediakan bank soal bertingkat dari level intermediate hingga super-HOTS.',
        studentAction: 'Fokus membedah pola jebakan soal di bab yang sebelumnya dihindari.',
        realExample: 'Paket latihan intensif soal Penalaran Matematika berbasis grafik dan data.',
      },
      {
        stepNumber: '03',
        title: 'Simulasi Waktu Nyata Berbasis Komputer',
        description: 'Mengerjakan paket try out dengan batas waktu per subtes tanpa jeda.',
        tutorAction: 'Mengawasi kedisiplinan dan strategi pembagian waktu siswa per nomor.',
        studentAction: 'Melatih ketenangan mental, ritme napas, dan keputusan melepas soal sulit.',
        realExample: 'Simulasi TPS 60 menit dengan penghitungan skor sistem Item Response Theory.',
      },
      {
        stepNumber: '04',
        title: 'Bedah Solusi & Rasionalisasi Pilihan Prodi',
        description: 'Tutor mengevaluasi skor try out terhadap passing score realistis prodi Untad, ITB, UI, UGM.',
        tutorAction: 'Memberikan feedback strategi: "Tingkatkan 4 nomor di Literasi Inggris untuk mengamankan FK Untad."',
        studentAction: 'Menyesuaikan rencana belajar mingguan berikutnya berdasarkan rekomendasi tutor.',
        realExample: 'Sesi konsultasi jurusan berbasis data historis kelulusan alumni.',
      },
    ],
    comparisons: [
      {
        aspect: 'Strategi Latihan',
        conventional: 'Mengerjakan 100 soal acak tanpa tahu bagian mana yang salah.',
        anemone: 'Mengerjakan 25 soal terarah khusus pada bab yang masih rapuh sampai tuntas.',
      },
      {
        aspect: 'Evaluasi Try Out',
        conventional: 'Hanya diberi nilai total tanpa bedah per subtes atau rekomendasi.',
        anemone: 'Mendapat analisis akurasi per subtes dan peta peluang lolos program studi.',
      },
      {
        aspect: 'Manajemen Waktu',
        conventional: 'Sering kehabisan waktu di 10 soal terakhir karena terjebak nomor rumit.',
        anemone: 'Terbiasa dengan strategi alokasi waktu dan eliminasi cerdas per nomor.',
      },
    ],
    symptoms: [
      { id: 'dp1', text: 'Skor try out mandiri mandek di angka 500-an dan tidak kunjung naik.' },
      { id: 'dp2', text: 'Sering panik dan kehabisan waktu saat mengerjakan soal teks panjang.' },
      { id: 'dp3', text: 'Bingung memilih jurusan kuliah yang realistis dengan kemampuan akademik saat ini.' },
    ],
  },
  {
    slug: 'klinik-personal',
    number: '04',
    shortName: 'Klinik Personal',
    title: 'Metode Pendampingan Personal & Klinik PR',
    tagline: 'Solusi Tugas Sekolah dan Konsultasi Belajar Tanpa Tekanan',
    cardLine: 'PR selesai, anak paham caranya.',
    cardMetric: {
      value: '1-on-1',
      label: 'sesi klinik pendampingan PR',
    },
    badge: 'Dukungan Penuh',
    heroLead:
      'Setiap anak memiliki ritme belajar yang berbeda. Melalui klinik personal Pintar Yuk, siswa dapat berkonsultasi mengenai tugas harian sekolah, persiapan ulangan harian, serta konsultasi psikologis belajar.',
    recommendedPackage: 'SD',
    recommendedPackageName: 'SD Cendekia & SMP Prestasi',
    metrics: [
      { value: '1-on-1', label: 'sesi pendampingan personal dengan tutor bidang studi' },
      { value: 'Harian', label: 'akses konsultasi PR dan pemecahan tugas sekolah' },
      { value: 'Realtime', label: 'laporan perkembangan langsung terkirim ke portal orang tua' },
    ],
    overviewPoints: [
      'Bantuan PR yang membangun kemandirian, bukan memberikan contekan jawaban jadi.',
      'Persiapan intensif H-3 sebelum ulangan harian dan asesmen sumatif sekolah.',
      'Sinergi transparan dengan orang tua melalui portal pantau kehadiran dan nilai harian.',
    ],
    simulationSteps: [
      {
        stepNumber: '01',
        title: 'Check-in Kendala Sekolah',
        description: 'Siswa membawa tugas atau materi sekolah yang belum dipahami saat di kelas pagi.',
        tutorAction: 'Meminta siswa membaca instruksi tugas sekolah dan mengidentifikasi apa yang diminta.',
        studentAction: 'Menunjukkan bagian langkah yang membuatnya buntu atau ragu.',
        realExample: 'Tugas Matematika pembagian bersusun atau soal cerita IPA SD.',
      },
      {
        stepNumber: '02',
        title: 'Scaffolding Pemecahan Masalah',
        description: 'Tutor memberikan petunjuk bertahap (scaffolding) tanpa menuliskan jawaban akhir.',
        tutorAction: '"Coba perhatikan satuan di soal. Jika diketahui km dan jam, kecepatan satuannya apa?"',
        studentAction: 'Menemukan sendiri kaitan rumus dan menyelesaikan perhitungan mandiri.',
        realExample: 'Soal konversi satuan dan perhitungan kecepatan rata-rata.',
      },
      {
        stepNumber: '03',
        title: 'Latihan Uji Cermin (Mirror Problem)',
        description: 'Tutor membuatkan satu soal serupa dengan angka berbeda untuk memastikan siswa paham.',
        tutorAction: 'Menyajikan soal modifikasi cepat di lembar kerja.',
        studentAction: 'Mengerjakan dari awal sampai akhir tanpa intervensi tutor.',
        realExample: 'Memastikan PR bukan sekadar selesai, tapi ilmunya benar-benar terserap.',
      },
      {
        stepNumber: '04',
        title: 'Rangkuman & Notifikasi Orang Tua',
        description: 'Catatan progres dan tugas yang tuntas dicatat tutor ke dalam sistem Pintar Yuk.',
        tutorAction: 'Menyimpan progres evaluasi di dashboard kelas.',
        studentAction: 'Merasa tenang dan siap menghadapi ujian sekolah keesokan harinya.',
        realExample: 'Notifikasi otomatis terkirim ke WhatsApp / portal orang tua murid.',
      },
    ],
    comparisons: [
      {
        aspect: 'Bantuan PR',
        conventional: 'Tutor mengerjakan PR siswa agar cepat selesai tanpa pemahaman.',
        anemone: 'Tutor memandu siswa menemukan sendiri jawaban melalui pertanyaan bertahap.',
      },
      {
        aspect: 'Peran Orang Tua',
        conventional: 'Orang tua bingung dan stres membimbing PR anak di rumah setiap malam.',
        anemone: 'Orang tua tenang karena tugas tuntas dibimbing tutor di sesi les.',
      },
      {
        aspect: 'Pemantauan Hasil',
        conventional: 'Hanya menunggu nilai rapor akhir semester tanpa tahu proses hariannya.',
        anemone: 'Update perkembangan belajar terdata transparan di portal orang tua.',
      },
    ],
    symptoms: [
      { id: 'kp1', text: 'Anak sering stres atau menangis saat menghadapi PR sekolah yang menumpuk.' },
      { id: 'kp2', text: 'Orang tua tidak memiliki cukup waktu atau kesulitan menerangkan materi kurikulum baru.' },
      { id: 'kp3', text: 'Nilai ulangan harian anak sering tidak stabil tergantung mood belajarnya.' },
    ],
  },
]

export function getLearningMethodBySlug(slug: string): LearningMethodItem | undefined {
  return LEARNING_METHODS.find((m) => m.slug === slug)
}
