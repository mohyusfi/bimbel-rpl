export type PackageCode = 'UTBK' | 'SMA' | 'SMP' | 'SD'

export interface Registration {
  id: string
  studentName: string
  studentEmail: string
  studentPhone: string
  studentSchool: string
  packageCode: PackageCode
  packageName: string
  parentName: string
  parentEmail: string
  parentPhone: string
  parentJob?: string
  parentAddress?: string
  createdAt: string // ISO string
  status: 'menunggu' | 'terverifikasi' | 'ditolak'
  rejectedReason?: string
  assignedClassId?: string
}

export interface Student {
  id: string
  nis: string
  name: string
  email: string
  phone: string
  school: string
  packageCode: PackageCode
  classId: string
  className: string
  parentName: string
  parentPhone: string
  parentEmail?: string
  parentJob?: string
  parentAddress?: string
  joinDate: string
  status: 'aktif' | 'nonaktif'
}

export interface Tutor {
  id: string
  name: string
  phone: string
  education: string
  subjects: string[]
  weeklySessionsCount: number
  status: 'aktif' | 'nonaktif'
}

export interface Subject {
  id: string
  code: string
  name: string
  level: PackageCode
  tutorCount: number
}

export interface Room {
  id: string
  name: string
  capacity: number
  facilities: string
  isActive: boolean
}

export interface Course {
  id: string
  code: PackageCode
  name: string
  price: number
  maxStudents: number
  description: string
  activeClassesCount: number
}

export interface ClassGroup {
  id: string
  name: string
  courseCode: PackageCode
  courseName: string
  capacity: number
  studentCount: number
  tutorName: string
}

export interface Schedule {
  id: string
  classId: string
  className: string
  subjectName: string
  tutorId: string
  tutorName: string
  roomId: string
  roomName: string
  dayOfWeek: 'Senin' | 'Selasa' | 'Rabu' | 'Kamis' | 'Jumat' | 'Sabtu'
  startTime: string // "HH:mm"
  endTime: string // "HH:mm"
}

export interface Invoice {
  id: string
  studentId: string
  studentName: string
  nis: string
  programName: string
  amount: number
  dueDate: string
  transferReceiptFile?: string
  bankName?: string
  submittedAt?: string // ISO string
  status: 'menunggu' | 'lunas' | 'belum_dibayar' | 'ditolak'
  rejectedReason?: string
  receiptNumber?: string
  paymentMethod?: string
  verifiedAt?: string
  verifiedBy?: string
}

export interface Announcement {
  id: string
  title: string
  content: string
  targetAudience: 'Semua' | 'Siswa' | 'Orang Tua' | 'Tutor'
  publishedDate: string
  author: string
  isPinned: boolean
}

export interface AdminNotification {
  id: string
  title: string
  message: string
  timestamp: string
  isRead: boolean
  type: 'registration' | 'payment' | 'schedule' | 'general'
}

// Initial Data
const INITIAL_COURSES: Course[] = [
  {
    id: 'crs-1',
    code: 'SD',
    name: 'SD Cendekia',
    price: 300000,
    maxStudents: 10,
    description: 'Bimbingan calistung, matematika dasar, dan penguatan literasi SD.',
    activeClassesCount: 1,
  },
  {
    id: 'crs-2',
    code: 'SMP',
    name: 'SMP Prestasi',
    price: 350000,
    maxStudents: 12,
    description: 'Pendampingan IPA terpadu, matematika, dan persiapan asesmen nasional.',
    activeClassesCount: 1,
  },
  {
    id: 'crs-3',
    code: 'SMA',
    name: 'SMA Sukses',
    price: 400000,
    maxStudents: 12,
    description: 'Penguasaan konsep saintek/soshum dan persiapan ujian semester SMA.',
    activeClassesCount: 1,
  },
  {
    id: 'crs-4',
    code: 'UTBK',
    name: 'Intensif UTBK-SNBT',
    price: 450000,
    maxStudents: 12,
    description: 'Drilling soal TPS, Penalaran Matematika, Literasi, dan Try Out berkala.',
    activeClassesCount: 2,
  },
]

const INITIAL_ROOMS: Room[] = [
  {
    id: 'rm-1',
    name: 'Ruang Palu-1',
    capacity: 12,
    facilities: 'AC Daikin 1.5 PK, Proyektor Epson, Whiteboard Magnetik, Wi-Fi 50 Mbps',
    isActive: true,
  },
  {
    id: 'rm-2',
    name: 'Ruang Palu-2',
    capacity: 12,
    facilities: 'AC Daikin 1.5 PK, Smart TV 55 Inch, Whiteboard, Wi-Fi 50 Mbps',
    isActive: true,
  },
  {
    id: 'rm-3',
    name: 'Ruang Palu-3',
    capacity: 10,
    facilities: 'AC Daikin 1 PK, Whiteboard, Meja Diskusi Melingkar, Wi-Fi 50 Mbps',
    isActive: true,
  },
  {
    id: 'rm-4',
    name: 'Ruang Tadulako-4',
    capacity: 12,
    facilities: 'AC Daikin 1.5 PK, Proyektor, Sound Monitor, Whiteboard, Wi-Fi 50 Mbps',
    isActive: true,
  },
]

const INITIAL_TUTORS: Tutor[] = [
  {
    id: 'tut-1',
    name: 'Kak Dian Pratiwi, S.Si',
    phone: '0812-4567-8901',
    education: 'S1 Fisika — Universitas Tadulako (IPK 3.84)',
    subjects: ['Fisika UTBK', 'IPA Terpadu SMP'],
    weeklySessionsCount: 4,
    status: 'aktif',
  },
  {
    id: 'tut-2',
    name: 'Pak Hendra Wijaya, M.Pd',
    phone: '0852-9876-5432',
    education: 'S2 Pendidikan Matematika — Universitas Tadulako',
    subjects: ['Matematika Sains', 'Penalaran Matematika & TPS'],
    weeklySessionsCount: 5,
    status: 'aktif',
  },
  {
    id: 'tut-3',
    name: 'Kak Nabila Syahputri, S.Pd',
    phone: '0821-3344-5566',
    education: 'S1 Pendidikan Bahasa Inggris — Universitas Tadulako',
    subjects: ['Bahasa Inggris & Literasi', 'Literasi B. Indonesia'],
    weeklySessionsCount: 3,
    status: 'aktif',
  },
  {
    id: 'tut-4',
    name: 'Kak Rizky Pratama, S.Kom',
    phone: '0813-7788-9900',
    education: 'S1 Teknik Informatika — STMIK Bina Mulia Palu',
    subjects: ['Penalaran Matematika & TPS', 'Matematika & Calistung SD'],
    weeklySessionsCount: 4,
    status: 'aktif',
  },
]

const INITIAL_SUBJECTS: Subject[] = [
  { id: 'sbj-1', code: 'FS-UTBK', name: 'Fisika UTBK', level: 'UTBK', tutorCount: 1 },
  { id: 'sbj-2', code: 'MT-SAINS', name: 'Matematika Sains', level: 'SMA', tutorCount: 1 },
  { id: 'sbj-3', code: 'TPS-PEN', name: 'Penalaran Matematika & TPS', level: 'UTBK', tutorCount: 2 },
  { id: 'sbj-4', code: 'ENG-LIT', name: 'Bahasa Inggris & Literasi', level: 'SMA', tutorCount: 1 },
  { id: 'sbj-5', code: 'IPA-SMP', name: 'IPA Terpadu SMP', level: 'SMP', tutorCount: 1 },
  { id: 'sbj-6', code: 'CAL-SD', name: 'Matematika & Calistung SD', level: 'SD', tutorCount: 1 },
]

const INITIAL_CLASSES: ClassGroup[] = [
  {
    id: 'cls-1',
    name: 'UTBK Intensif A',
    courseCode: 'UTBK',
    courseName: 'Intensif UTBK-SNBT',
    capacity: 12,
    studentCount: 10,
    tutorName: 'Pak Hendra Wijaya, M.Pd',
  },
  {
    id: 'cls-2',
    name: 'UTBK Intensif B',
    courseCode: 'UTBK',
    courseName: 'Intensif UTBK-SNBT',
    capacity: 12,
    studentCount: 8,
    tutorName: 'Kak Dian Pratiwi, S.Si',
  },
  {
    id: 'cls-3',
    name: 'SMA IPA 1',
    courseCode: 'SMA',
    courseName: 'SMA Sukses',
    capacity: 12,
    studentCount: 9,
    tutorName: 'Pak Hendra Wijaya, M.Pd',
  },
  {
    id: 'cls-4',
    name: 'SMP Prestasi A',
    courseCode: 'SMP',
    courseName: 'SMP Prestasi',
    capacity: 12,
    studentCount: 11,
    tutorName: 'Kak Dian Pratiwi, S.Si',
  },
  {
    id: 'cls-5',
    name: 'SD Cendekia A',
    courseCode: 'SD',
    courseName: 'SD Cendekia',
    capacity: 10,
    studentCount: 7,
    tutorName: 'Kak Rizky Pratama, S.Kom',
  },
]

// Current date for relative calculation: 2026-10-17T15:43:00+08:00
const INITIAL_REGISTRATIONS: Registration[] = [
  {
    id: 'reg-001',
    studentName: 'Muhammad Fadhil Al-Ghifari',
    studentEmail: 'fadhil.palu@gmail.com',
    studentPhone: '0812-4411-2233',
    studentSchool: 'SMAN 1 Palu',
    packageCode: 'UTBK',
    packageName: 'Intensif UTBK-SNBT',
    parentName: 'Ir. Ruslan Abdullah',
    parentEmail: 'ruslan.abdullah@gmail.com',
    parentPhone: '0811-450-889',
    parentJob: 'PNS Pemprov Sulteng',
    parentAddress: 'Jl. Sam Ratulangi No. 14, Palu Timur',
    createdAt: new Date(Date.now() - 35 * 60 * 1000).toISOString(), // 35 minutes ago (<48h)
    status: 'menunggu',
  },
  {
    id: 'reg-002',
    studentName: 'Siti Nurhaliza Putri',
    studentEmail: 'siti.putri@gmail.com',
    studentPhone: '0852-7788-9911',
    studentSchool: 'SMAN 2 Palu',
    packageCode: 'SMA',
    packageName: 'SMA Sukses',
    parentName: 'Dra. Fatimah Zahra',
    parentEmail: 'fatimah.zahra@gmail.com',
    parentPhone: '0853-9911-2233',
    parentJob: 'Dosen Universitas Tadulako',
    parentAddress: 'Perum Dosen UNTAD Blok C No. 5, Tondo',
    createdAt: new Date(Date.now() - 52 * 3600 * 1000).toISOString(), // 52 hours ago (>48h -> late!)
    status: 'menunggu',
  },
  {
    id: 'reg-003',
    studentName: 'Ahmad Al-Baqir',
    studentEmail: 'ahmad.baqir@gmail.com',
    studentPhone: '0821-9900-1122',
    studentSchool: 'SMPN 1 Palu',
    packageCode: 'SMP',
    packageName: 'SMP Prestasi',
    parentName: 'H. Syamsuddin, S.E',
    parentEmail: 'syamsuddin.se@gmail.com',
    parentPhone: '0812-4488-3322',
    parentJob: 'Wiraswasta',
    parentAddress: 'Jl. Gajah Mada No. 88, Palu Barat',
    createdAt: new Date(Date.now() - 4 * 86400 * 1000).toISOString(),
    status: 'terverifikasi',
    assignedClassId: 'cls-4',
  },
  {
    id: 'reg-004',
    studentName: 'Ananda Bagas Pratama',
    studentEmail: 'bagas.pratama@gmail.com',
    studentPhone: '0813-1122-3344',
    studentSchool: 'SD Inpres Tondo',
    packageCode: 'SD',
    packageName: 'SD Cendekia',
    parentName: 'Wahyudi Pratama',
    parentEmail: 'wahyudi.pratama@gmail.com',
    parentPhone: '0813-5566-7788',
    parentJob: 'Karyawan BUMN',
    parentAddress: 'Jl. RE Martadinata No. 20, Tondo',
    createdAt: new Date(Date.now() - 5 * 86400 * 1000).toISOString(),
    status: 'ditolak',
    rejectedReason: 'Nomor telepon orang tua tidak aktif & domisili di luar jangkauan bimbingan tatap muka.',
  },
]

const INITIAL_STUDENTS: Student[] = [
  {
    id: 'stu-1',
    nis: 'TC-2026-001',
    name: 'Muhammad Rafly',
    email: 'rafly.palu@gmail.com',
    phone: '0821-9988-7711',
    school: 'SMAN 1 Palu',
    packageCode: 'UTBK',
    classId: 'cls-1',
    className: 'UTBK Intensif A',
    parentName: 'Ahmad Dahlan',
    parentPhone: '0821-4455-6677',
    parentEmail: 'ahmad.dahlan@gmail.com',
    parentJob: 'Pegawai BNI Palu',
    parentAddress: 'Jl. Jenderal Sudirman No. 25, Palu',
    joinDate: '10 Januari 2026',
    status: 'aktif',
  },
  {
    id: 'stu-2',
    nis: 'TC-2026-002',
    name: 'Alya Salsabila',
    email: 'alya.salsa@gmail.com',
    phone: '0812-9933-2211',
    school: 'SMAN 2 Palu',
    packageCode: 'UTBK',
    classId: 'cls-1',
    className: 'UTBK Intensif A',
    parentName: 'Dr. Hendra Gunawan, Sp.A',
    parentPhone: '0811-456-789',
    parentEmail: 'dr.hendra@gmail.com',
    parentJob: 'Dokter RS Undata Palu',
    parentAddress: 'Jl. Suprapto No. 12, Besusu',
    joinDate: '12 Januari 2026',
    status: 'aktif',
  },
  {
    id: 'stu-3',
    nis: 'TC-2026-003',
    name: 'Rizki Kurniawan',
    email: 'rizki.k@gmail.com',
    phone: '0852-4433-2211',
    school: 'SMAN Model Terpadu Madani Palu',
    packageCode: 'SMA',
    classId: 'cls-3',
    className: 'SMA IPA 1',
    parentName: 'Drs. Herman Rusli',
    parentPhone: '0852-9900-1122',
    parentEmail: 'herman.rusli@gmail.com',
    parentJob: 'Guru SMAN Madani',
    parentAddress: 'Jl. Soekarno-Hatta KM 9, Mamboro',
    joinDate: '15 Januari 2026',
    status: 'aktif',
  },
  {
    id: 'stu-4',
    nis: 'TC-2026-004',
    name: 'Ahmad Al-Baqir',
    email: 'ahmad.baqir@gmail.com',
    phone: '0821-9900-1122',
    school: 'SMPN 1 Palu',
    packageCode: 'SMP',
    classId: 'cls-4',
    className: 'SMP Prestasi A',
    parentName: 'H. Syamsuddin, S.E',
    parentPhone: '0812-4488-3322',
    parentEmail: 'syamsuddin.se@gmail.com',
    parentJob: 'Wiraswasta',
    parentAddress: 'Jl. Gajah Mada No. 88, Palu Barat',
    joinDate: '01 Februari 2026',
    status: 'aktif',
  },
]

const INITIAL_SCHEDULES: Schedule[] = [
  {
    id: 'sch-1',
    classId: 'cls-1',
    className: 'UTBK Intensif A',
    subjectName: 'Penalaran Matematika & TPS',
    tutorId: 'tut-2',
    tutorName: 'Pak Hendra Wijaya, M.Pd',
    roomId: 'rm-1',
    roomName: 'Ruang Palu-1',
    dayOfWeek: 'Senin',
    startTime: '16:00',
    endTime: '17:30',
  },
  {
    id: 'sch-2',
    classId: 'cls-3',
    className: 'SMA IPA 1',
    subjectName: 'Fisika UTBK',
    tutorId: 'tut-1',
    tutorName: 'Kak Dian Pratiwi, S.Si',
    roomId: 'rm-2',
    roomName: 'Ruang Palu-2',
    dayOfWeek: 'Senin',
    startTime: '16:00',
    endTime: '17:30',
  },
  {
    id: 'sch-3',
    classId: 'cls-4',
    className: 'SMP Prestasi A',
    subjectName: 'IPA Terpadu SMP',
    tutorId: 'tut-1',
    tutorName: 'Kak Dian Pratiwi, S.Si',
    roomId: 'rm-1',
    roomName: 'Ruang Palu-1',
    dayOfWeek: 'Rabu',
    startTime: '15:30',
    endTime: '17:00',
  },
  {
    id: 'sch-4',
    classId: 'cls-2',
    className: 'UTBK Intensif B',
    subjectName: 'Bahasa Inggris & Literasi',
    tutorId: 'tut-3',
    tutorName: 'Kak Nabila Syahputri, S.Pd',
    roomId: 'rm-2',
    roomName: 'Ruang Palu-2',
    dayOfWeek: 'Kamis',
    startTime: '16:00',
    endTime: '17:30',
  },
  {
    id: 'sch-5',
    classId: 'cls-5',
    className: 'SD Cendekia A',
    subjectName: 'Matematika & Calistung SD',
    tutorId: 'tut-4',
    tutorName: 'Kak Rizky Pratama, S.Kom',
    roomId: 'rm-3',
    roomName: 'Ruang Palu-3',
    dayOfWeek: 'Jumat',
    startTime: '15:00',
    endTime: '16:30',
  },
  {
    id: 'sch-6',
    classId: 'cls-1',
    className: 'UTBK Intensif A',
    subjectName: 'Fisika UTBK',
    tutorId: 'tut-1',
    tutorName: 'Kak Dian Pratiwi, S.Si',
    roomId: 'rm-1',
    roomName: 'Ruang Palu-1',
    dayOfWeek: 'Sabtu',
    startTime: '09:00',
    endTime: '11:00',
  },
]

const INITIAL_INVOICES: Invoice[] = [
  {
    id: 'INV-2026-0301',
    studentId: 'stu-1',
    studentName: 'Muhammad Rafly',
    nis: 'TC-2026-001',
    programName: 'Intensif UTBK-SNBT',
    amount: 450000,
    dueDate: '10 Maret 2026',
    transferReceiptFile: 'transfer_bsi_rafly_okt.jpg',
    bankName: 'BSI Cabang Palu Hasanuddin',
    submittedAt: new Date(Date.now() - 40 * 60 * 1000).toISOString(), // 40 minutes ago
    status: 'menunggu',
    paymentMethod: 'Transfer BSI',
  },
  {
    id: 'INV-2026-0298',
    studentId: 'stu-2',
    studentName: 'Alya Salsabila',
    nis: 'TC-2026-002',
    programName: 'Intensif UTBK-SNBT',
    amount: 450000,
    dueDate: '10 Maret 2026',
    transferReceiptFile: 'bukti_bni_alya.png',
    bankName: 'BNI Cabang Palu Sudirman',
    submittedAt: new Date(Date.now() - 60 * 3600 * 1000).toISOString(), // 60 hours ago (>48h -> late!)
    status: 'menunggu',
    paymentMethod: 'Transfer BNI',
  },
  {
    id: 'INV-2026-0290',
    studentId: 'stu-3',
    studentName: 'Rizki Kurniawan',
    nis: 'TC-2026-003',
    programName: 'SMA Sukses',
    amount: 400000,
    dueDate: '10 Maret 2026',
    transferReceiptFile: 'struk_atm_mandiri_rizki.jpg',
    bankName: 'Mandiri Cabang Palu Tadulako',
    submittedAt: new Date(Date.now() - 4 * 86400 * 1000).toISOString(),
    status: 'lunas',
    receiptNumber: 'KWT-2026-0290',
    paymentMethod: 'Transfer Bank Mandiri',
    verifiedAt: '13 Oktober 2026, 10:15 WITA',
    verifiedBy: 'Hj. Nuraini, S.Pd',
  },
  {
    id: 'INV-2026-0285',
    studentId: 'stu-4',
    studentName: 'Ahmad Al-Baqir',
    nis: 'TC-2026-004',
    programName: 'SMP Prestasi',
    amount: 350000,
    dueDate: '10 Maret 2026',
    transferReceiptFile: 'transfer_gagal.jpg',
    bankName: 'BSI Cabang Palu Hasanuddin',
    submittedAt: new Date(Date.now() - 5 * 86400 * 1000).toISOString(),
    status: 'ditolak',
    rejectedReason: 'Foto struk buram dan nominal transfer (Rp 250.000) tidak sesuai tagihan SPP (Rp 350.000).',
    paymentMethod: 'Transfer BSI',
  },
  {
    id: 'INV-2026-0305',
    studentId: 'stu-1',
    studentName: 'Muhammad Rafly',
    nis: 'TC-2026-001',
    programName: 'Intensif UTBK-SNBT',
    amount: 450000,
    dueDate: '10 April 2026',
    status: 'belum_dibayar',
    paymentMethod: 'Menunggu transfer orang tua',
  },
]

const INITIAL_ANNOUNCEMENTS: Announcement[] = [
  {
    id: 'ann-1',
    title: 'Simulasi Try Out Akbar UTBK-SNBT 2026 Wilayah Sulawesi Tengah',
    content:
      'Seluruh siswa program Intensif UTBK wajib mengikuti Try Out Berbasis Komputer (CBT) yang akan dilaksanakan pada hari Sabtu, 24 Oktober 2026 pukul 08.00–12.00 WITA di Ruang Palu-1 & Ruang Palu-2.',
    targetAudience: 'Semua',
    publishedDate: '15 Oktober 2026',
    author: 'Hj. Nuraini, S.Pd',
    isPinned: true,
  },
  {
    id: 'ann-2',
    title: 'Penyesuaian Jadwal Bimbingan Selama Pekan Asesmen Tengah Semester',
    content:
      'Bagi siswa jenjang SMP dan SMA, kelas bimbingan sore dimajukan 30 menit untuk mengakomodasi waktu istirahat setelah ujian di sekolah. Harap periksa matriks jadwal mingguan.',
    targetAudience: 'Siswa',
    publishedDate: '12 Oktober 2026',
    author: 'Hj. Nuraini, S.Pd',
    isPinned: false,
  },
  {
    id: 'ann-3',
    title: 'Laporan Perkembangan Bulanan & Pengambilan Lembar Evaluasi',
    content:
      'Bapak/Ibu orang tua/wali siswa dapat melihat rapor kehadiran dan progres nilai harian siswa langsung melalui portal atau berkonsultasi langsung dengan tutor pendamping.',
    targetAudience: 'Orang Tua',
    publishedDate: '10 Oktober 2026',
    author: 'Hj. Nuraini, S.Pd',
    isPinned: false,
  },
]

const INITIAL_NOTIFICATIONS: AdminNotification[] = [
  {
    id: 'notif-1',
    title: 'Pendaftaran Baru Masuk',
    message: 'Muhammad Fadhil Al-Ghifari (SMAN 1 Palu) mendaftar untuk paket Intensif UTBK-SNBT.',
    timestamp: '35 menit lalu',
    isRead: false,
    type: 'registration',
  },
  {
    id: 'notif-2',
    title: 'Bukti Pembayaran Diunggah',
    message: 'Orang tua Muhammad Rafly mengunggah bukti transfer BSI Rp 450.000 untuk tagihan INV-2026-0301.',
    timestamp: '40 menit lalu',
    isRead: false,
    type: 'payment',
  },
  {
    id: 'notif-3',
    title: 'Pendaftaran Terlambat',
    message: 'Pendaftaran Siti Nurhaliza Putri telah menunggu verifikasi lebih dari 48 jam.',
    timestamp: '4 jam lalu',
    isRead: false,
    type: 'registration',
  },
  {
    id: 'notif-4',
    title: 'Jadwal Akhir Pekan Terkonfirmasi',
    message: 'Sesi Drilling Fisika UTBK Sabtu telah dijadwalkan di Ruang Palu-1.',
    timestamp: 'Kemarin',
    isRead: true,
    type: 'schedule',
  },
]

// State Container & LocalStorage Sync
interface AdminState {
  registrations: Registration[]
  students: Student[]
  tutors: Tutor[]
  subjects: Subject[]
  rooms: Room[]
  courses: Course[]
  classes: ClassGroup[]
  schedules: Schedule[]
  invoices: Invoice[]
  announcements: Announcement[]
  notifications: AdminNotification[]
}

const STORAGE_KEY = 'tc_bimbel_admin_state_v1'

function loadInitialState(): AdminState {
  if (typeof window !== 'undefined') {
    try {
      const saved = localStorage.getItem(STORAGE_KEY)
      if (saved) {
        return JSON.parse(saved)
      }
    } catch (e) {
      console.warn('Gagal memuat admin state dari localStorage:', e)
    }
  }

  return {
    registrations: INITIAL_REGISTRATIONS,
    students: INITIAL_STUDENTS,
    tutors: INITIAL_TUTORS,
    subjects: INITIAL_SUBJECTS,
    rooms: INITIAL_ROOMS,
    courses: INITIAL_COURSES,
    classes: INITIAL_CLASSES,
    schedules: INITIAL_SCHEDULES,
    invoices: INITIAL_INVOICES,
    announcements: INITIAL_ANNOUNCEMENTS,
    notifications: INITIAL_NOTIFICATIONS,
  }
}

let state: AdminState = loadInitialState()
const listeners = new Set<() => void>()

function saveAndNotify() {
  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
    } catch (e) {
      console.warn('Gagal menyimpan admin state ke localStorage:', e)
    }
  }
  listeners.forEach((listener) => listener())
}

export const adminStore = {
  subscribe(listener: () => void) {
    listeners.add(listener)
    return () => {
      listeners.delete(listener)
    }
  },

  getState(): AdminState {
    return state
  },

  resetToDefault() {
    state = {
      registrations: INITIAL_REGISTRATIONS,
      students: INITIAL_STUDENTS,
      tutors: INITIAL_TUTORS,
      subjects: INITIAL_SUBJECTS,
      rooms: INITIAL_ROOMS,
      courses: INITIAL_COURSES,
      classes: INITIAL_CLASSES,
      schedules: INITIAL_SCHEDULES,
      invoices: INITIAL_INVOICES,
      announcements: INITIAL_ANNOUNCEMENTS,
      notifications: INITIAL_NOTIFICATIONS,
    }
    saveAndNotify()
  },

  // REGISTRATIONS
  addRegistration(input: Omit<Registration, 'id' | 'createdAt' | 'status'>) {
    const newReg: Registration = {
      ...input,
      id: `reg-${Date.now().toString().slice(-4)}`,
      createdAt: new Date().toISOString(),
      status: 'menunggu',
    }
    state.registrations = [newReg, ...state.registrations]

    // Tambah notifikasi admin
    state.notifications = [
      {
        id: `notif-${Date.now()}`,
        title: 'Pendaftaran Baru Masuk',
        message: `${newReg.studentName} (${newReg.studentSchool}) mendaftar untuk paket ${newReg.packageName}.`,
        timestamp: 'Baru saja',
        isRead: false,
        type: 'registration',
      },
      ...state.notifications,
    ]

    saveAndNotify()
    return newReg
  },

  approveRegistration(regId: string, classId: string) {
    const reg = state.registrations.find((r) => r.id === regId)
    if (!reg) return false

    const targetClass = state.classes.find((c) => c.id === classId)
    if (!targetClass) return false

    // Update status pendaftaran
    reg.status = 'terverifikasi'
    reg.assignedClassId = classId

    // Tambah ke tabel siswa aktif jika belum ada
    const studentExists = state.students.some((s) => s.email === reg.studentEmail)
    if (!studentExists) {
      const nisNumber = (state.students.length + 1).toString().padStart(3, '0')
      const newStudent: Student = {
        id: `stu-${Date.now().toString().slice(-4)}`,
        nis: `TC-2026-${nisNumber}`,
        name: reg.studentName,
        email: reg.studentEmail,
        phone: reg.studentPhone,
        school: reg.studentSchool,
        packageCode: reg.packageCode,
        classId: targetClass.id,
        className: targetClass.name,
        parentName: reg.parentName,
        parentPhone: reg.parentPhone,
        parentEmail: reg.parentEmail,
        parentJob: reg.parentJob,
        parentAddress: reg.parentAddress,
        joinDate: new Intl.DateTimeFormat('id-ID', {
          day: 'numeric',
          month: 'long',
          year: 'numeric',
        }).format(new Date()),
        status: 'aktif',
      }
      state.students = [newStudent, ...state.students]

      // Increment jumlah siswa di kelas
      targetClass.studentCount += 1
    }

    // Tambah notifikasi
    state.notifications = [
      {
        id: `notif-${Date.now()}`,
        title: 'Pendaftaran Disetujui',
        message: `${reg.studentName} berhasil diverifikasi dan diplotting ke kelas ${targetClass.name}.`,
        timestamp: 'Baru saja',
        isRead: false,
        type: 'registration',
      },
      ...state.notifications,
    ]

    saveAndNotify()
    return true
  },

  rejectRegistration(regId: string, reason: string) {
    const reg = state.registrations.find((r) => r.id === regId)
    if (!reg) return false

    reg.status = 'ditolak'
    reg.rejectedReason = reason

    saveAndNotify()
    return true
  },

  // STUDENTS
  addStudent(input: Omit<Student, 'id' | 'nis' | 'joinDate' | 'status'>) {
    const nisNumber = (state.students.length + 1).toString().padStart(3, '0')
    const newStudent: Student = {
      ...input,
      id: `stu-${Date.now().toString().slice(-4)}`,
      nis: `TC-2026-${nisNumber}`,
      joinDate: new Intl.DateTimeFormat('id-ID', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      }).format(new Date()),
      status: 'aktif',
    }

    state.students = [newStudent, ...state.students]

    const cls = state.classes.find((c) => c.id === input.classId)
    if (cls) cls.studentCount += 1

    saveAndNotify()
    return newStudent
  },

  updateStudent(id: string, updates: Partial<Student>) {
    const index = state.students.findIndex((s) => s.id === id)
    if (index === -1) return false

    state.students[index] = { ...state.students[index], ...updates }
    saveAndNotify()
    return true
  },

  // TUTORS
  addTutor(input: Omit<Tutor, 'id' | 'weeklySessionsCount' | 'status'>) {
    const newTutor: Tutor = {
      ...input,
      id: `tut-${Date.now().toString().slice(-4)}`,
      weeklySessionsCount: 0,
      status: 'aktif',
    }
    state.tutors = [...state.tutors, newTutor]
    saveAndNotify()
    return newTutor
  },

  updateTutor(id: string, updates: Partial<Tutor>) {
    const index = state.tutors.findIndex((t) => t.id === id)
    if (index === -1) return false

    state.tutors[index] = { ...state.tutors[index], ...updates }
    saveAndNotify()
    return true
  },

  // SUBJECTS
  addSubject(input: Omit<Subject, 'id' | 'tutorCount'>) {
    const newSubj: Subject = {
      ...input,
      id: `sbj-${Date.now().toString().slice(-4)}`,
      tutorCount: 1,
    }
    state.subjects = [...state.subjects, newSubj]
    saveAndNotify()
    return newSubj
  },

  // ROOMS
  addRoom(input: Omit<Room, 'id' | 'isActive'>) {
    const newRoom: Room = {
      ...input,
      id: `rm-${Date.now().toString().slice(-4)}`,
      isActive: true,
    }
    state.rooms = [...state.rooms, newRoom]
    saveAndNotify()
    return newRoom
  },

  toggleRoomActive(id: string) {
    const room = state.rooms.find((r) => r.id === id)
    if (!room) return false
    room.isActive = !room.isActive
    saveAndNotify()
    return true
  },

  // COURSES
  updateCourse(id: string, updates: Partial<Course>) {
    const index = state.courses.findIndex((c) => c.id === id)
    if (index === -1) return false

    state.courses[index] = { ...state.courses[index], ...updates }
    saveAndNotify()
    return true
  },

  // CLASSES
  addClass(input: Omit<ClassGroup, 'id' | 'studentCount'>) {
    const newClass: ClassGroup = {
      ...input,
      id: `cls-${Date.now().toString().slice(-4)}`,
      studentCount: 0,
    }
    state.classes = [...state.classes, newClass]

    const crs = state.courses.find((c) => c.code === input.courseCode)
    if (crs) crs.activeClassesCount += 1

    saveAndNotify()
    return newClass
  },

  // SCHEDULES & CONFLICT DETECTION (SCHED-02)
  addSchedule(input: Omit<Schedule, 'id'>) {
    const conflict = detectScheduleConflicts(input, state.schedules, state.rooms)
    if (conflict.hasConflict) {
      throw new Error(
        conflict.timeError ||
          (conflict.roomConflict
            ? `Bentrok Ruangan: ${conflict.roomConflict.roomName} sudah digunakan oleh ${conflict.roomConflict.className} (${conflict.roomConflict.startTime}–${conflict.roomConflict.endTime})`
            : conflict.tutorConflict
              ? `Bentrok Tutor: ${conflict.tutorConflict.tutorName} sudah mengajar ${conflict.tutorConflict.className} (${conflict.tutorConflict.startTime}–${conflict.tutorConflict.endTime})`
              : 'Jadwal bentrok dengan jadwal lain')
      )
    }

    const newSchedule: Schedule = {
      ...input,
      id: `sch-${Date.now().toString().slice(-4)}`,
    }

    state.schedules = [...state.schedules, newSchedule]

    // Update tutor weekly sessions count
    const tutor = state.tutors.find((t) => t.id === input.tutorId)
    if (tutor) tutor.weeklySessionsCount += 1

    saveAndNotify()
    return newSchedule
  },

  deleteSchedule(id: string) {
    const sch = state.schedules.find((s) => s.id === id)
    if (sch) {
      const tutor = state.tutors.find((t) => t.id === sch.tutorId)
      if (tutor && tutor.weeklySessionsCount > 0) tutor.weeklySessionsCount -= 1
    }
    state.schedules = state.schedules.filter((s) => s.id !== id)
    saveAndNotify()
    return true
  },

  // INVOICES & VERIFICATION (BILL-01 s/d BILL-03)
  createInvoice(input: Omit<Invoice, 'id' | 'status'>) {
    const invId = `INV-2026-${(state.invoices.length + 306).toString().padStart(4, '0')}`
    const newInvoice: Invoice = {
      ...input,
      id: invId,
      status: 'belum_dibayar',
    }
    state.invoices = [newInvoice, ...state.invoices]
    saveAndNotify()
    return newInvoice
  },

  verifyInvoice(invoiceId: string) {
    const inv = state.invoices.find((i) => i.id === invoiceId)
    if (!inv) return false

    inv.status = 'lunas'
    inv.receiptNumber = `KWT-${inv.id.replace('INV-', '')}`
    inv.verifiedAt = new Intl.DateTimeFormat('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date()) + ' WITA'
    inv.verifiedBy = 'Hj. Nuraini, S.Pd'

    state.notifications = [
      {
        id: `notif-${Date.now()}`,
        title: 'Pembayaran SPP Diverifikasi',
        message: `Kwitansi ${inv.receiptNumber} resmi terbit untuk siswa ${inv.studentName} (${inv.programName}).`,
        timestamp: 'Baru saja',
        isRead: false,
        type: 'payment',
      },
      ...state.notifications,
    ]

    saveAndNotify()
    return true
  },

  rejectInvoice(invoiceId: string, reason: string) {
    const inv = state.invoices.find((i) => i.id === invoiceId)
    if (!inv) return false

    inv.status = 'ditolak'
    inv.rejectedReason = reason

    saveAndNotify()
    return true
  },

  // ANNOUNCEMENTS
  addAnnouncement(input: Omit<Announcement, 'id' | 'publishedDate' | 'author'>) {
    const newAnn: Announcement = {
      ...input,
      id: `ann-${Date.now().toString().slice(-4)}`,
      publishedDate: new Intl.DateTimeFormat('id-ID', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      }).format(new Date()),
      author: 'Hj. Nuraini, S.Pd',
    }
    state.announcements = [newAnn, ...state.announcements]
    saveAndNotify()
    return newAnn
  },

  deleteAnnouncement(id: string) {
    state.announcements = state.announcements.filter((a) => a.id !== id)
    saveAndNotify()
    return true
  },

  // NOTIFICATIONS
  markAllNotificationsRead() {
    state.notifications = state.notifications.map((n) => ({ ...n, isRead: true }))
    saveAndNotify()
  },

  markNotificationRead(id: string) {
    const notif = state.notifications.find((n) => n.id === id)
    if (notif) notif.isRead = true
    saveAndNotify()
  },
}

// Conflict Detection Engine (SCHED-02 Pure Function)
export interface ScheduleCandidate {
  id?: string
  roomId: string
  tutorId: string
  dayOfWeek: string
  startTime: string
  endTime: string
}

export interface ConflictCheckResult {
  hasConflict: boolean
  timeError?: string
  roomConflict?: Schedule
  tutorConflict?: Schedule
  suggestedRooms?: Room[]
}

export function detectScheduleConflicts(
  candidate: ScheduleCandidate,
  schedules: Schedule[],
  allRooms: Room[]
): ConflictCheckResult {
  // 1. Validasi urutan waktu
  if (!candidate.startTime || !candidate.endTime) {
    return { hasConflict: false }
  }

  if (candidate.endTime <= candidate.startTime) {
    return {
      hasConflict: true,
      timeError: 'Jam selesai bimbingan harus lebih besar daripada jam mulai.',
    }
  }

  // 2. Evaluasi bentrok ruangan & tutor
  let roomConflict: Schedule | undefined
  let tutorConflict: Schedule | undefined

  for (const existing of schedules) {
    // Jangan bandingkan dengan sesi itu sendiri jika sedang proses edit
    if (candidate.id && existing.id === candidate.id) continue

    // Hari harus sama
    if (existing.dayOfWeek !== candidate.dayOfWeek) continue

    // Formula irisan waktu: Mulai_A < Selesai_B && Selesai_A > Mulai_B
    const timeOverlap =
      candidate.startTime < existing.endTime && candidate.endTime > existing.startTime

    if (timeOverlap) {
      if (existing.roomId === candidate.roomId) {
        roomConflict = existing
      }
      if (existing.tutorId === candidate.tutorId) {
        tutorConflict = existing
      }
    }
  }

  const hasConflict = Boolean(roomConflict || tutorConflict)

  // 3. Jika bentrok ruangan, cari ruangan alternatif yang kosong di jam itu
  let suggestedRooms: Room[] | undefined
  if (roomConflict) {
    suggestedRooms = allRooms.filter((room) => {
      if (!room.isActive || room.id === candidate.roomId) return false

      // Cek apakah room ini dipakai di jam yang sama pada hari tersebut
      const isRoomOccupied = schedules.some((s) => {
        if (candidate.id && s.id === candidate.id) return false
        return (
          s.dayOfWeek === candidate.dayOfWeek &&
          s.roomId === room.id &&
          candidate.startTime < s.endTime &&
          candidate.endTime > s.startTime
        )
      })

      return !isRoomOccupied
    })
  }

  return {
    hasConflict,
    roomConflict,
    tutorConflict,
    suggestedRooms,
  }
}
