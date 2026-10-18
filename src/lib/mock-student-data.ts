export interface StudentProfile {
  id: string
  name: string
  school: string
  grade: string
  package: string
  avatar: string
  phone: string
  email: string
  parentName: string
}

export interface KpiMetric {
  title: string
  value: string | number
  max?: number
  subtext: string
  isPositive?: boolean
}

export interface ScheduleSession {
  id: string
  day: string
  date: string
  time: string
  subject: string
  topic: string
  tutor: string
  room: string
  status: 'Terjadwal' | 'Selesai' | 'Dibatalkan'
}

export interface MaterialPreviewPage {
  pageNum: number
  title: string
  content: string
}

export interface StudyMaterial {
  id: string
  title: string
  subject: string
  fileName: string
  size: string
  uploadDate: string
  uploadedBy: string
  downloadUrl: string
  preview: {
    summary: string
    keyPoints: string[]
    simulatedPages: MaterialPreviewPage[]
  }
}

export interface GradeRecord {
  id: string
  date: string
  testName: string
  subject: string
  score: number
  average: number
  tutorNote: string
}

export interface InvoiceRecord {
  id: string
  number: string
  period: string
  amount: number
  date: string
  status: 'lunas' | 'menunggu_verifikasi' | 'belum_bayar'
  method: string
  receiptAvailable: boolean
  proofUrl?: string
}

export const STUDENT_PROFILE: StudentProfile = {
  id: 'std_fahri_01',
  name: 'Fahri Ramadhan',
  school: 'SMAN 1 Palu',
  grade: 'Kelas 12 SMA',
  package: 'Paket Intensif UTBK-SNBT 2026',
  avatar: 'FR',
  phone: '0812-4567-8901',
  email: 'fahri.ramadhan@siswa.tadulakocendekia.id',
  parentName: 'Ir. H. Ahmad Dahlan',
}

export const KPI_METRICS: KpiMetric[] = [
  {
    title: 'Tingkat Kehadiran',
    value: '96%',
    subtext: '24 dari 25 sesi bimbingan dihadiri',
    isPositive: true,
  },
  {
    title: 'Rata-rata Skor Try Out',
    value: 88,
    max: 100,
    subtext: '+12 poin dibandingkan bulan lalu',
    isPositive: true,
  },
  {
    title: 'Modul Digital Tersedia',
    value: '14 Modul',
    subtext: 'Bisa diunduh bebas kapan saja',
  },
  {
    title: 'Status SPP Maret',
    value: 'Terverifikasi',
    subtext: 'Kwitansi resmi tersedia',
    isPositive: true,
  },
]

export const SCHEDULE_SESSIONS: ScheduleSession[] = [
  {
    id: 'sch_1',
    day: 'Senin',
    date: '2026-10-19',
    time: '16.00 – 17.30 WITA',
    subject: 'Fisika UTBK',
    topic: 'Mekanika & Hukum Gravitasi Newton',
    tutor: 'Kak Dian Pratiwi, S.Si',
    room: 'Ruang Palu-1',
    status: 'Terjadwal',
  },
  {
    id: 'sch_2',
    day: 'Rabu',
    date: '2026-10-21',
    time: '16.00 – 17.30 WITA',
    subject: 'Matematika Penalaran',
    topic: 'Penalaran Kuantitatif & Aljabar Lanjut',
    tutor: 'Kak Moh. Yusfi, S.Pd',
    room: 'Ruang Palu-2',
    status: 'Terjadwal',
  },
  {
    id: 'sch_3',
    day: 'Jumat',
    date: '2026-10-23',
    time: '15.30 – 17.00 WITA',
    subject: 'Kimia Dasar',
    topic: 'Stoikiometri & Larutan Asam-Basa',
    tutor: 'Kak Lidiya, M.Pd',
    room: 'Ruang Tadulako-1',
    status: 'Terjadwal',
  },
  {
    id: 'sch_4',
    day: 'Sabtu',
    date: '2026-10-24',
    time: '09.00 – 11.30 WITA',
    subject: 'Simulasi Try Out UTBK',
    topic: 'Try Out Nasional TPS & Penalaran Umum',
    tutor: 'Tim Pengajar Tadulako',
    room: 'Aula Lantai 2',
    status: 'Terjadwal',
  },
  {
    id: 'sch_5',
    day: 'Senin',
    date: '2026-10-26',
    time: '16.00 – 17.30 WITA',
    subject: 'Biologi UTBK',
    topic: 'Genetika & Bioteknologi Molekuler',
    tutor: 'Kak Fadil Maulana, S.Si',
    room: 'Ruang Palu-1',
    status: 'Terjadwal',
  },
]

export const STUDY_MATERIALS: StudyMaterial[] = [
  {
    id: 'mat_01',
    title: 'Modul Pembahasan Tuntas Fisika UTBK 2026',
    subject: 'Fisika',
    fileName: 'Modul Pembahasan Tuntas Fisika UTBK 2026.pdf',
    size: '8.4 MB',
    uploadDate: '12 Maret 2026',
    uploadedBy: 'Kak Dian Pratiwi, S.Si',
    downloadUrl: '#',
    preview: {
      summary: 'Modul ini mencakup 45 latihan soal berbasis HOTS standar SNBT dengan pembahasan komprehensif langkah demi langkah, dilengkapi rumus cepat praktis.',
      keyPoints: [
        'Hukum Gravitasi Newton dan gerak melingkar beraturan pada orbit satelit.',
        'Kekekalan momentum sudut dan tumbukan dua dimensi.',
        'Trik cepat eliminasi opsi jawaban soal HOTS UTBK 3 menit per soal.',
      ],
      simulatedPages: [
        {
          pageNum: 1,
          title: 'Bab 1: Dinamika Partikel & Gerak Lurus Beraturan',
          content: 'Dinamika partikel meninjau hubungan antara resultan gaya luar yang bekerja pada benda dengan percepatan yang timbul (ΣF = m·a). Pada kerangka acuan inersial, hukum I Newton menetapkan bahwa benda akan tetap diam atau bergerak dengan kecepatan tetap jika resultan gaya sama dengan nol...',
        },
        {
          pageNum: 2,
          title: 'Contoh Soal HOTS 1.2 — Analisis Bidang Miring',
          content: 'Sebuah balok bermassa m ditarik ke atas bidang miring kasar dengan sudut kemiringan θ = 37° terhadap bidang horizontal. Koefisien gesek kinetis antara balok dan bidang adalah μk = 0.25. Tentukan gaya F minimum sejajar bidang agar balok bergerak dengan kecepatan konstan...',
        },
      ],
    },
  },
  {
    id: 'mat_02',
    title: 'Latihan Mandiri Penalaran Matematika Bab 4',
    subject: 'Matematika',
    fileName: 'Latihan Mandiri Penalaran Matematika Bab 4.pdf',
    size: '4.2 MB',
    uploadDate: '10 Maret 2026',
    uploadedBy: 'Kak Moh. Yusfi, S.Pd',
    downloadUrl: '#',
    preview: {
      summary: 'Lembar kerja intensif penalaran kuantitatif mengenai aljabar, barisan aritmetika tingkat dua, dan optimasi fungsi kuadrat.',
      keyPoints: [
        'Pola bilangan deret geometri konvergen dan divergen.',
        'Sistem pertidaksamaan linear dua variabel untuk program linear.',
        'Penerapan logika proposisi dan silogisme dalam soal cerita kuantitatif.',
      ],
      simulatedPages: [
        {
          pageNum: 1,
          title: 'Bagian A: Soal Penalaran Kuantitatif SNBT',
          content: 'Diketahui deret geometri tak hingga memiliki jumlah S = 16 dan suku pertama a = 8. Jika setiap suku kedua dan kelipatannya dikalikan faktor 2, berapakah jumlah baru deret tersebut? Analisis konvergensi rasio |r| < 1...',
        },
        {
          pageNum: 2,
          title: 'Kunci Pembahasan & Metode Subtitusi Cepat',
          content: 'Menggunakan rumus umum S_inf = a / (1 - r). Dengan a = 8 dan S = 16, diperoleh 1 - r = 0.5 sehingga r = 0.5. Transformasi deret baru dapat dihitung secara terpisah dengan memilah suku ganjil dan genap...',
        },
      ],
    },
  },
  {
    id: 'mat_03',
    title: 'Ringkasan Inti Kimia Dasar & Stoikiometri Larutan',
    subject: 'Kimia',
    fileName: 'Ringkasan Inti Kimia Dasar & Stoikiometri.pdf',
    size: '5.1 MB',
    uploadDate: '08 Maret 2026',
    uploadedBy: 'Kak Lidiya, M.Pd',
    downloadUrl: '#',
    preview: {
      summary: 'Ikhtisar padat mengenai perhitungan mol, konsentrasi molaritas/molalitas, serta pH larutan asam-basa kuat dan lemah beserta hidrolisis garam.',
      keyPoints: [
        'Konsep mol dan hukum dasar kimia (Lavoisier, Proust, Dalton, Gay-Lussac).',
        'Penentuan pereaksi pembatas pada reaksi kimia bertahap.',
        'Perhitungan pH larutan penyangga (buffer) dan hidrolisis garam.',
      ],
      simulatedPages: [
        {
          pageNum: 1,
          title: 'Bab 2: Hukum Gas Ideal & Pereaksi Pembatas',
          content: 'Pada suhu dan tekanan standar (STP, 0°C, 1 atm), volume 1 mol gas ideal adalah 22.4 Liter. Hubungan ini dirumuskan dalam persamaan PV = nRT. Jika diketahui reaksi 2Al + 6HCl → 2AlCl3 + 3H2, tentukan volume gas hidrogen yang dihasilkan jika 5.4 gram Al direaksikan dengan HCl berlebih...',
        },
      ],
    },
  },
  {
    id: 'mat_04',
    title: 'Paket Latihan TPS: Pemahaman Bacaan & Menulis (PBM)',
    subject: 'TPS UTBK',
    fileName: 'Paket Latihan TPS PBM 2026.pdf',
    size: '3.8 MB',
    uploadDate: '05 Maret 2026',
    uploadedBy: 'Tim Pengajar Tadulako',
    downloadUrl: '#',
    preview: {
      summary: 'Kumpulan 50 soal pemahaman bacaan dan menulis dengan teks wacana kontemporer, EYD V, kalimat efektif, dan konjungsi intrakalimat/antarkalimat.',
      keyPoints: [
        'Identifikasi ide pokok paragraf dan kalimat sumbang.',
        'Pedoman EYD V untuk huruf kapital, tanda baca titik dua dan titik koma.',
        'Strategi membaca cepat skimmimg & scanning 45 detik per wacana.',
      ],
      simulatedPages: [
        {
          pageNum: 1,
          title: 'Wacana 1: Transisi Energi Terbarukan di Wilayah Wallacea',
          content: 'Pemanfaatan potensi panas bumi dan energi surya di kawasan Indonesia Timur terus mengalami eskalasi. Pertanyaan nomor 1–5 menguji keutuhan logika kalimat dan pemilihan konjungsi kausalitas antaralinea...',
        },
      ],
    },
  },
]

export const GRADE_RECORDS: GradeRecord[] = [
  {
    id: 'gr_1',
    date: '15 Maret 2026',
    testName: 'Try Out 3 UTBK-SNBT Nasional',
    subject: 'Tes Potensi Skolastik (TPS)',
    score: 92,
    average: 74,
    tutorNote: 'Peningkatan signifikan pada penalaran analitik. Pertahankan kecepatan pengerjaan saat menjawab soal PBM.',
  },
  {
    id: 'gr_2',
    date: '08 Maret 2026',
    testName: 'Kuis Mingguan Fisika Mekanika',
    subject: 'Fisika',
    score: 85,
    average: 70,
    tutorNote: 'Analisis grafik kecepatan-waktu sudah sangat baik. Perhatikan ketelitian tanda vektor pada gerak dua dimensi.',
  },
  {
    id: 'gr_3',
    date: '01 Maret 2026',
    testName: 'Try Out 2 UTBK-SNBT',
    subject: 'Matematika Penalaran',
    score: 88,
    average: 68,
    tutorNote: 'Pemahaman soal cerita fungsi kuadrat matang. Latih lagi variasi soal geometri analitik dan trigonometri.',
  },
  {
    id: 'gr_4',
    date: '22 Februari 2026',
    testName: 'Kuis Kimia Stoikiometri',
    subject: 'Kimia',
    score: 86,
    average: 72,
    tutorNote: 'Konsep mol dan reaksi pembatas dikuasai dengan tepat. Kerjakan latihan lanjutan tentang larutan asam-basa.',
  },
  {
    id: 'gr_5',
    date: '15 Februari 2026',
    testName: 'Try Out 1 UTBK-SNBT',
    subject: 'TPS & Penalaran Kuantitatif',
    score: 79,
    average: 65,
    tutorNote: 'Awal yang baik untuk simulasi perdana. Perlu menambah jam latihan mandiri untuk mempercepat kalkulasi.',
  },
]

export const INVOICE_RECORDS: InvoiceRecord[] = [
  {
    id: 'inv_1',
    number: 'INV-2026-0301',
    period: 'Maret 2026',
    amount: 450000,
    date: '10 Maret 2026 (WITA)',
    status: 'lunas',
    method: 'Transfer Bank BNI (Verifikasi Admin)',
    receiptAvailable: true,
    proofUrl: 'https://images.unsplash.com/photo-1554224155-6726b3ff858f?auto=format&fit=crop&w=400&q=80',
  },
  {
    id: 'inv_2',
    number: 'INV-2026-0401',
    period: 'April 2026',
    amount: 450000,
    date: '10 April 2026 (WITA)',
    status: 'belum_bayar',
    method: 'Belum Dibayar',
    receiptAvailable: false,
  },
  {
    id: 'inv_3',
    number: 'INV-2026-0201',
    period: 'Februari 2026',
    amount: 450000,
    date: '10 Februari 2026 (WITA)',
    status: 'lunas',
    method: 'Transfer Bank BSI (Verifikasi Admin)',
    receiptAvailable: true,
    proofUrl: 'https://images.unsplash.com/photo-1554224155-6726b3ff858f?auto=format&fit=crop&w=400&q=80',
  },
]
