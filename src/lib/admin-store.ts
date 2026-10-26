import { supabase } from './supabase/client'
import { isSessionLockedForTutor } from './attendance-helpers'
import { buildAttendanceNotifications } from './attendance-notifications'

export type PackageCode = 'UTBK' | 'SMA' | 'SMP' | 'SD'

export interface Registration {
  id: string
  registrationNumber?: string
  studentName: string
  studentEmail: string
  studentPhone: string
  studentSchool: string
  packageCode: PackageCode
  packageName: string
  parentName: string
  parentEmail?: string
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
  email?: string
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
  tutorId?: string
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
  invoiceNumber?: string
  studentId: string
  parentId?: string | null
  studentName: string
  nis: string
  programName: string
  amount: number
  dueDate: string
  transferReceiptFile?: string
  bankName?: string
  submittedAt?: string // ISO string
  submittedByRole?: 'student' | 'parent'
  submittedByName?: string
  status: 'menunggu' | 'lunas' | 'belum_dibayar' | 'ditolak' | 'dibatalkan'
  rejectedReason?: string
  receiptNumber?: string
  paymentMethod?: string
  verifiedAt?: string
  verifiedBy?: string
  description?: string
  storage_path?: string
  receiptUrl?: string
  payments?: Array<{
    id: string
    invoiceId: string
    amount: number
    amountPaid?: number | null
    transferReceiptFile?: string | null
    proofFileUrl?: string | null
    storagePath?: string | null
    bankName?: string | null
    paymentMethod?: string | null
    submittedAt: string
    paymentDate?: string | null
    verifiedAt?: string | null
    verifiedBy?: string | null
    receiptNumber?: string | null
    submittedByRole?: string | null
    submittedByName?: string | null
    status: string
    notes?: string | null
    createdAt: string
  }>
}

export type AttendanceStatus = 'hadir' | 'sakit' | 'izin' | 'alpa'

export interface AttendanceEntry {
  studentId: string
  studentName: string
  nis: string
  status: AttendanceStatus
  note?: string
  notes?: string
}

export interface AttendanceSession {
  id: string
  scheduleId: string
  classId: string
  className: string
  subjectName: string
  tutorId: string
  tutorName: string
  roomId: string
  roomName: string
  sessionDate: string
  dayOfWeek: string
  startTime: string
  endTime: string
  topic: string
  isCompleted: boolean
  completedAt?: string
  entries: AttendanceEntry[]
}

export interface LearningMaterial {
  id: string
  classId: string
  className: string
  subjectName: string
  title: string
  description: string
  category: string
  tutorId: string
  tutorName: string
  fileType: 'PDF' | 'PPTX'
  fileSize: string
  fileUrl: string
  storage_path?: string
  storagePath?: string
  uploadedAt: string
}

export interface GradeRecord {
  id: string
  studentId: string
  studentName: string
  nis: string
  classId: string
  className: string
  subjectName: string
  assessmentTitle: string
  category: 'Try Out' | 'Kuis' | 'Tugas'
  score: number
  classAverage: number
  tutorId: string
  tutorName: string
  tutorFeedback: string
  assessmentDate: string
}

export interface ParentProfile {
  id: string
  name: string
  email: string
  phone: string
  job: string
  address: string
  studentIds: string[]
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

export type NotificationType =
  | 'attendance'
  | 'billing'
  | 'academic'
  | 'announcement'
  | 'registration'
  | 'general'
  | 'payment'
  | 'schedule'

export interface AdminNotification {
  id: string
  userId?: string
  title: string
  message: string
  timestamp: string
  isRead: boolean
  type: NotificationType
  linkUrl?: string
  metadata?: Record<string, any>
  data?: Record<string, any>
  createdAt?: string
}

// Test Fixtures (In-Memory Only for Vitest Test Harness, No LocalStorage Persistence)
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
  {
    id: 'cls-full',
    name: 'UTBK Kuota Penuh',
    courseCode: 'UTBK',
    courseName: 'Intensif UTBK-SNBT',
    capacity: 12,
    studentCount: 12,
    tutorName: 'Pak Hendra Wijaya, M.Pd',
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
    studentName: 'Alya Ramadhani',
    studentEmail: 'alya.ramadhani@gmail.com',
    studentPhone: '0821-9900-1122',
    studentSchool: 'SMPN 1 Palu',
    packageCode: 'SMP',
    packageName: 'SMP Prestasi',
    parentName: 'Ir. H. Ahmad Dahlan',
    parentEmail: 'ahmad.dahlan@wali.tadulakocendekia.sch.id',
    parentPhone: '0821-4455-6677',
    parentJob: 'Pegawai BNI Cabang Palu',
    parentAddress: 'Jl. Jenderal Sudirman No. 25, Palu Timur',
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
    name: 'Fahri Ramadhan',
    email: 'fahri.ramadhan@siswa.tadulakocendekia.sch.id',
    phone: '0821-9988-7711',
    school: 'SMAN 1 Palu',
    packageCode: 'UTBK',
    classId: 'cls-1',
    className: 'UTBK Intensif A',
    parentName: 'Ir. H. Ahmad Dahlan',
    parentPhone: '0821-4455-6677',
    parentEmail: 'ahmad.dahlan@wali.tadulakocendekia.sch.id',
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
    name: 'Alya Ramadhani',
    email: 'alya.ramadhani@gmail.com',
    phone: '0821-9900-1122',
    school: 'SMPN 1 Palu',
    packageCode: 'SMP',
    classId: 'cls-4',
    className: 'SMP Prestasi A',
    parentName: 'Ir. H. Ahmad Dahlan',
    parentPhone: '0821-4455-6677',
    parentEmail: 'ahmad.dahlan@wali.tadulakocendekia.sch.id',
    parentJob: 'Pegawai BNI Cabang Palu',
    parentAddress: 'Jl. Jenderal Sudirman No. 25, Palu Timur',
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
    studentName: 'Fahri Ramadhan',
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
    studentName: 'Alya Ramadhani',
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
    studentName: 'Fahri Ramadhan',
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
    message: 'Orang tua Fahri Ramadhan mengunggah bukti transfer BSI Rp 450.000 untuk tagihan INV-2026-0301.',
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

const INITIAL_PARENTS: ParentProfile[] = [
  {
    id: 'par-1',
    name: 'Ir. H. Ahmad Dahlan',
    email: 'ahmad.dahlan@wali.tadulakocendekia.sch.id',
    phone: '0821-4455-6677',
    job: 'Pegawai BNI Cabang Palu',
    address: 'Jl. Jenderal Sudirman No. 25, Palu Timur',
    studentIds: ['stu-1', 'stu-4', 'd992d9fc-6f5b-434f-998b-358e54a754b7', 'e1a2a3a4-b5b6-c7c8-d9d0-e1e2e3e4e5e7'],
  },
  {
    id: 'par-2',
    name: 'Dr. Hendra Gunawan, Sp.A',
    email: 'dr.hendra@gmail.com',
    phone: '0811-456-789',
    job: 'Dokter RS Undata Palu',
    address: 'Jl. Suprapto No. 12, Besusu',
    studentIds: ['stu-2'],
  },
]

const INITIAL_ATTENDANCE_SESSIONS: AttendanceSession[] = [
  {
    id: 'ses-1',
    scheduleId: 'sch-1',
    classId: 'cls-1',
    className: 'UTBK Intensif A',
    subjectName: 'Penalaran Matematika & TPS',
    tutorId: 'tut-2',
    tutorName: 'Pak Hendra Wijaya, M.Pd',
    roomId: 'rm-1',
    roomName: 'Ruang Palu-1',
    sessionDate: '2026-10-19',
    dayOfWeek: 'Senin',
    startTime: '15:30',
    endTime: '17:00',
    topic: 'Penalaran Aljabar & Analisis Grafik UTBK',
    isCompleted: true,
    entries: [
      { studentId: 'stu-1', studentName: 'Fahri Ramadhan', nis: 'TC-2026-001', status: 'hadir', note: 'Sangat aktif dalam sesi tanya jawab' },
      { studentId: 'stu-2', studentName: 'Alya Salsabila', nis: 'TC-2026-002', status: 'hadir' },
      { studentId: 'stu-3', studentName: 'Rizki Kurniawan', nis: 'TC-2026-003', status: 'izin', note: 'Izin kegiatan OSIS' },
    ],
  },
  {
    id: 'ses-2',
    scheduleId: 'sch-2',
    classId: 'cls-1',
    className: 'UTBK Intensif A',
    subjectName: 'Fisika UTBK',
    tutorId: 'tut-1',
    tutorName: 'Kak Dian Pratiwi, S.Si',
    roomId: 'rm-1',
    roomName: 'Ruang Palu-1',
    sessionDate: '2026-10-21',
    dayOfWeek: 'Rabu',
    startTime: '16:00',
    endTime: '17:30',
    topic: 'Mekanika Dinamika & Hukum Newton Lanjutan',
    isCompleted: true,
    entries: [
      { studentId: 'stu-1', studentName: 'Fahri Ramadhan', nis: 'TC-2026-001', status: 'hadir' },
      { studentId: 'stu-2', studentName: 'Alya Salsabila', nis: 'TC-2026-002', status: 'hadir' },
      { studentId: 'stu-3', studentName: 'Rizki Kurniawan', nis: 'TC-2026-003', status: 'sakit', note: 'Demam' },
    ],
  },
  {
    id: 'ses-3',
    scheduleId: 'sch-2',
    classId: 'cls-1',
    className: 'UTBK Intensif A',
    subjectName: 'Fisika UTBK',
    tutorId: 'tut-1',
    tutorName: 'Kak Dian Pratiwi, S.Si',
    roomId: 'rm-1',
    roomName: 'Ruang Palu-1',
    sessionDate: '2026-10-24',
    dayOfWeek: 'Sabtu',
    startTime: '09:00',
    endTime: '11:00',
    topic: 'Drilling Soal Try Out Fisika UTBK 2026',
    isCompleted: false,
    entries: [
      { studentId: 'stu-1', studentName: 'Fahri Ramadhan', nis: 'TC-2026-001', status: 'hadir' },
      { studentId: 'stu-2', studentName: 'Alya Salsabila', nis: 'TC-2026-002', status: 'hadir' },
      { studentId: 'stu-3', studentName: 'Rizki Kurniawan', nis: 'TC-2026-003', status: 'hadir' },
    ],
  },
]

const INITIAL_MATERIALS: LearningMaterial[] = []

const INITIAL_GRADES: GradeRecord[] = [
  {
    id: 'grd-1',
    studentId: 'stu-1',
    studentName: 'Fahri Ramadhan',
    nis: 'TC-2026-001',
    classId: 'cls-1',
    className: 'UTBK Intensif A',
    subjectName: 'Fisika UTBK',
    assessmentTitle: 'Try Out 1 UTBK Fisika',
    category: 'Try Out',
    score: 88,
    classAverage: 76,
    tutorId: 'tut-1',
    tutorName: 'Kak Dian Pratiwi, S.Si',
    tutorFeedback: 'Rafly sangat cepat memahami hukum Newton & usaha energi. Perbanyak latihan soal dinamika rotasi.',
    assessmentDate: '15 Okt 2026',
  },
  {
    id: 'grd-2',
    studentId: 'stu-1',
    studentName: 'Fahri Ramadhan',
    nis: 'TC-2026-001',
    classId: 'cls-1',
    className: 'UTBK Intensif A',
    subjectName: 'Penalaran Matematika & TPS',
    assessmentTitle: 'Simulasi Logika Deret & Aritmetika',
    category: 'Kuis',
    score: 85,
    classAverage: 72,
    tutorId: 'tut-2',
    tutorName: 'Pak Hendra Wijaya, M.Pd',
    tutorFeedback: 'Pemahaman logika aljabar sangat kokoh. Tingkatkan kecepatan pengerjaan per butir soal.',
    assessmentDate: '12 Okt 2026',
  },
  {
    id: 'grd-3',
    studentId: 'stu-1',
    studentName: 'Fahri Ramadhan',
    nis: 'TC-2026-001',
    classId: 'cls-1',
    className: 'UTBK Intensif A',
    subjectName: 'Fisika UTBK',
    assessmentTitle: 'Kuis Singkat Vektor & Kinematika',
    category: 'Kuis',
    score: 92,
    classAverage: 80,
    tutorId: 'tut-1',
    tutorName: 'Kak Dian Pratiwi, S.Si',
    tutorFeedback: 'Perhitungan analitis sangat teliti tanpa ada kesalahan desimal. Pertahankan!',
    assessmentDate: '08 Okt 2026',
  },
  {
    id: 'grd-4',
    studentId: 'stu-4',
    studentName: 'Alya Ramadhani',
    nis: 'TC-2026-004',
    classId: 'cls-4',
    className: 'SMP Prestasi A',
    subjectName: 'IPA Terpadu SMP',
    assessmentTitle: 'Uji Modul Ekosistem & Klasifikasi',
    category: 'Tugas',
    score: 90,
    classAverage: 78,
    tutorId: 'tut-1',
    tutorName: 'Kak Dian Pratiwi, S.Si',
    tutorFeedback: 'Pemahaman konsep rantai makanan dan ekologi sangat baik. Catatan rapi.',
    assessmentDate: '14 Okt 2026',
  },
]

// State Container (In-Memory Only)
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
  attendanceSessions: AttendanceSession[]
  learningMaterials: LearningMaterial[]
  gradeRecords: GradeRecord[]
  parents: ParentProfile[]
  selectedChildId: string
  activeTutorId: string
  activeStudentId: string
  activeParentId: string
}

function loadInitialState(): AdminState {
  if (typeof window !== "undefined") {
    // In browser client: clean initial state without dummy data, loading 100% from Supabase Database
    return {
      registrations: [],
      students: [],
      tutors: [],
      subjects: [],
      rooms: [],
      courses: [],
      classes: [],
      schedules: [],
      invoices: [],
      announcements: [],
      notifications: [],
      attendanceSessions: [],
      learningMaterials: [],
      gradeRecords: [],
      parents: [],
      selectedChildId: "",
      activeTutorId: "",
      activeStudentId: "",
      activeParentId: "",
    }
  }

  // In test environment (Node/Vitest): populate test fixtures
  return {
    registrations: [],
    students: [],
    tutors: INITIAL_TUTORS.map((t) => ({ ...t })),
    subjects: INITIAL_SUBJECTS.map((s) => ({ ...s })),
    rooms: INITIAL_ROOMS.map((r) => ({ ...r })),
    courses: INITIAL_COURSES.map((c) => ({ ...c })),
    classes: INITIAL_CLASSES.map((c) => ({ ...c })),
    schedules: [],
    invoices: INITIAL_INVOICES.map((i) => ({ ...i })),
    announcements: INITIAL_ANNOUNCEMENTS.map((a) => ({ ...a })),
    notifications: INITIAL_NOTIFICATIONS.map((n) => ({ ...n })),
    attendanceSessions: INITIAL_ATTENDANCE_SESSIONS.map((a) => ({ ...a })),
    learningMaterials: INITIAL_MATERIALS.map((m) => ({ ...m })),
    gradeRecords: INITIAL_GRADES.map((g) => ({ ...g })),
    parents: INITIAL_PARENTS.map((p) => ({ ...p })),
    selectedChildId: 'd992d9fc-6f5b-434f-998b-358e54a754b7',
    activeTutorId: '9383fc09-99fc-423c-ac09-e3f94c26f5e9',
    activeStudentId: 'd992d9fc-6f5b-434f-998b-358e54a754b7',
    activeParentId: 'ec6f75cb-887a-442b-b91d-f47f9afc5ab8',
  }
}

let state: AdminState = loadInitialState()
const listeners = new Set<() => void>()

let idCounter = 0
function generateUniqueId(prefix: string): string {
  idCounter += 1
  return `${prefix}-${Date.now().toString().slice(-4)}-${idCounter}`
}

function clampCapacity(capacity: unknown, defaultCap = 12): number {
  const num = Number(capacity)
  if (isNaN(num)) return defaultCap
  return Math.min(12, Math.max(1, num))
}

function saveAndNotify() {
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
      registrations: INITIAL_REGISTRATIONS.map((r) => ({ ...r })),
      students: INITIAL_STUDENTS.map((s) => ({ ...s })),
      tutors: INITIAL_TUTORS.map((t) => ({ ...t })),
      subjects: INITIAL_SUBJECTS.map((s) => ({ ...s })),
      rooms: INITIAL_ROOMS.map((r) => ({ ...r })),
      courses: INITIAL_COURSES.map((c) => ({ ...c })),
      classes: INITIAL_CLASSES.map((c) => ({ ...c })),
      schedules: INITIAL_SCHEDULES.map((s) => ({ ...s })),
      invoices: INITIAL_INVOICES.map((i) => ({ ...i })),
      announcements: INITIAL_ANNOUNCEMENTS.map((a) => ({ ...a })),
      notifications: INITIAL_NOTIFICATIONS.map((n) => ({ ...n })),
      attendanceSessions: INITIAL_ATTENDANCE_SESSIONS.map((a) => ({ ...a })),
      learningMaterials: INITIAL_MATERIALS.map((m) => ({ ...m })),
      gradeRecords: INITIAL_GRADES.map((g) => ({ ...g })),
      parents: INITIAL_PARENTS.map((p) => ({ ...p })),
      selectedChildId: "stu-1",
      activeTutorId: "tut-1",
      activeStudentId: "stu-1",
      activeParentId: "par-1",
    }
    saveAndNotify()
  },

  // REGISTRATIONS
  addRegistration(input: Omit<Registration, 'id' | 'createdAt' | 'status'> & { registrationNumber?: string }) {
    const regNum =
      input.registrationNumber ||
      `REG-${new Date().getFullYear()}${String(new Date().getMonth() + 1).padStart(2, '0')}-${String(
        state.registrations.length + 1
      ).padStart(4, '0')}`

    const newReg: Registration = {
      ...input,
      id: generateUniqueId('reg'),
      registrationNumber: regNum,
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

  approveRegistration(regId: string, classId: string, fallbackReg?: Registration) {
    let reg = state.registrations.find((r) => r.id === regId || r.registrationNumber === regId)
    if (!reg && fallbackReg) {
      reg = { ...fallbackReg, id: regId }
      state.registrations = [reg, ...state.registrations]
    }
    if (!reg) return null

    const targetClass = state.classes.find((c) => c.id === classId)
    if (!targetClass) return null

    // Validasi kapasitas kelas maksimal 12 siswa (CONTEXT.md)
    const maxCapacity = Math.min(12, targetClass.capacity || 12)
    if (targetClass.studentCount >= maxCapacity) {
      throw new Error(
        `Rombel ${targetClass.name} sudah penuh (${targetClass.studentCount}/${maxCapacity} siswa). Batas maksimal adalah 12 siswa.`
      )
    }

    // Update status pendaftaran
    reg.status = 'terverifikasi'
    reg.assignedClassId = classId

    // Tambah ke tabel siswa aktif jika belum ada
    let studentRecord = state.students.find((s) => s.email === reg.studentEmail)
    if (!studentRecord) {
      const nisNumber = (state.students.length + 1).toString().padStart(3, '0')
      studentRecord = {
        id: generateUniqueId('stu'),
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
      state.students = [studentRecord, ...state.students]

      // Increment jumlah siswa di kelas
      targetClass.studentCount += 1
    }

    // Hubungkan atau daftarkan profil orang tua
    let parentRecord = state.parents.find(
      (p) =>
        (reg.parentEmail && p.email.toLowerCase() === reg.parentEmail.toLowerCase()) ||
        p.phone.replace(/[^0-9]/g, '') === reg.parentPhone.replace(/[^0-9]/g, '')
    )

    if (parentRecord) {
      if (!parentRecord.studentIds.includes(studentRecord.id)) {
        parentRecord.studentIds = [...parentRecord.studentIds, studentRecord.id]
      }
    } else {
      parentRecord = {
        id: generateUniqueId('par'),
        name: reg.parentName,
        email: reg.parentEmail || `${reg.studentEmail.split('@')[0]}.wali@tadulakocendekia.sch.id`,
        phone: reg.parentPhone,
        job: reg.parentJob || 'Wali Murid',
        address: reg.parentAddress || 'Kota Palu',
        studentIds: [studentRecord.id],
      }
      state.parents = [parentRecord, ...state.parents]
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

    return {
      success: true,
      student: studentRecord,
      parent: parentRecord,
      credentials: {
        studentNis: studentRecord.nis,
        studentName: studentRecord.name,
        studentEmail: studentRecord.email,
        studentPassword: 'siswa2026',
        className: targetClass.name,
        parentName: parentRecord.name,
        parentEmail: parentRecord.email,
        parentPhone: parentRecord.phone,
        parentPassword: 'wali2026',
      },
    }
  },

  rejectRegistration(regId: string, reason: string, fallbackReg?: Registration) {
    let reg = state.registrations.find((r) => r.id === regId || r.registrationNumber === regId)
    if (!reg && fallbackReg) {
      reg = { ...fallbackReg, id: regId }
      state.registrations = [reg, ...state.registrations]
    }
    if (!reg) return false

    reg.status = 'ditolak'
    reg.rejectedReason = reason

    saveAndNotify()
    return true
  },

  // STUDENTS
  addStudent(input: Omit<Student, 'id' | 'nis' | 'joinDate' | 'status'>) {
    const cls = state.classes.find((c) => c.id === input.classId)
    if (cls) {
      const maxCap = Math.min(12, cls.capacity || 12)
      if (cls.studentCount >= maxCap) {
        throw new Error(`Rombel ${cls.name} sudah penuh (${cls.studentCount}/${maxCap} siswa).`)
      }
    }

    const nisNumber = (state.students.length + 1).toString().padStart(3, '0')
    const newStudent: Student = {
      ...input,
      id: generateUniqueId('stu'),
      nis: `TC-2026-${nisNumber}`,
      joinDate: new Intl.DateTimeFormat('id-ID', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      }).format(new Date()),
      status: 'aktif',
    }

    state.students = [newStudent, ...state.students]

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

  assignStudentToClass(studentId: string, targetClassId: string) {
    const student = state.students.find((s) => s.id === studentId)
    if (!student) throw new Error('Siswa tidak ditemukan.')

    const targetClass = state.classes.find((c) => c.id === targetClassId)
    if (!targetClass) throw new Error('Rombel tujuan tidak ditemukan.')

    if (student.classId === targetClassId) {
      return student
    }

    const maxCap = Math.min(12, targetClass.capacity || 12)
    if (targetClass.studentCount >= maxCap) {
      throw new Error(
        `Rombel ${targetClass.name} sudah penuh (${targetClass.studentCount}/${maxCap} siswa). Batas maksimal adalah 12 siswa.`
      )
    }

    const oldClass = state.classes.find((c) => c.id === student.classId)
    if (oldClass && oldClass.studentCount > 0) {
      oldClass.studentCount -= 1
    }

    targetClass.studentCount += 1
    student.classId = targetClass.id
    student.className = targetClass.name

    saveAndNotify()
    return student
  },

  // TUTORS
  addTutor(input: Omit<Tutor, 'id' | 'weeklySessionsCount' | 'status'>) {
    const newTutor: Tutor = {
      ...input,
      id: generateUniqueId('tut'),
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
      id: generateUniqueId('sbj'),
      tutorCount: 1,
    }
    state.subjects = [...state.subjects, newSubj]
    saveAndNotify()
    return newSubj
  },

  // ROOMS
  addRoom(input: Omit<Room, 'id' | 'isActive'> & { id?: string }) {
    const capacity = clampCapacity(input.capacity, 12)
    const newRoom: Room = {
      ...input,
      capacity,
      id: input.id || generateUniqueId('rm'),
      isActive: true,
    }
    state.rooms = [...state.rooms, newRoom]
    saveAndNotify()
    return newRoom
  },

  updateRoom(id: string, updates: Partial<Omit<Room, 'id'>>) {
    const index = state.rooms.findIndex((r) => r.id === id)
    if (index === -1) return false

    const sanitizedUpdates = { ...updates }
    if (sanitizedUpdates.capacity !== undefined) {
      sanitizedUpdates.capacity = clampCapacity(sanitizedUpdates.capacity, 12)
    }

    state.rooms[index] = { ...state.rooms[index], ...sanitizedUpdates }
    saveAndNotify()
    return state.rooms[index]
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

    const sanitizedUpdates = { ...updates }
    if (sanitizedUpdates.maxStudents !== undefined) {
      sanitizedUpdates.maxStudents = clampCapacity(sanitizedUpdates.maxStudents, 12)
    }

    state.courses[index] = { ...state.courses[index], ...sanitizedUpdates }
    saveAndNotify()
    return true
  },

  // CLASSES
  addClass(input: Omit<ClassGroup, 'id' | 'studentCount'>) {
    const capacity = clampCapacity(input.capacity, 12)
    const newClass: ClassGroup = {
      ...input,
      capacity,
      id: generateUniqueId('cls'),
      studentCount: 0,
    }
    state.classes = [...state.classes, newClass]

    const crs = state.courses.find((c) => c.code === input.courseCode)
    if (crs) crs.activeClassesCount += 1

    saveAndNotify()
    return newClass
  },

  updateClass(id: string, updates: Partial<Omit<ClassGroup, 'id'>>) {
    const index = state.classes.findIndex((c) => c.id === id)
    if (index === -1) return false

    const sanitizedUpdates = { ...updates }
    if (sanitizedUpdates.capacity !== undefined) {
      sanitizedUpdates.capacity = clampCapacity(sanitizedUpdates.capacity, 12)
    }

    state.classes[index] = { ...state.classes[index], ...sanitizedUpdates }
    saveAndNotify()
    return state.classes[index]
  },

  // SCHEDULES & CONFLICT DETECTION (SCHED-02)
  addSchedule(input: Omit<Schedule, 'id'>) {
    const conflict = detectScheduleConflicts(input, state.schedules, state.rooms)
    if (conflict.hasConflict) {
      throw new Error(
        conflict.errorMessage ||
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
      id: generateUniqueId('sch'),
    }

    state.schedules = [...state.schedules, newSchedule]

    // Update tutor weekly sessions count
    const tutor = state.tutors.find((t) => t.id === input.tutorId)
    if (tutor) tutor.weeklySessionsCount += 1

    // Otomatis generate 1 entri sesi bimbingan perdana di attendanceSessions (SCHED-02)
    const DAY_INDEX: Record<string, number> = {
      Minggu: 0,
      Senin: 1,
      Selasa: 2,
      Rabu: 3,
      Kamis: 4,
      Jumat: 5,
      Sabtu: 6,
    }
    const targetDay = DAY_INDEX[newSchedule.dayOfWeek] ?? 1
    const fromDate = new Date()
    let diff = targetDay - fromDate.getDay()
    if (diff <= 0) diff += 7
    const nextDate = new Date(fromDate.getTime())
    nextDate.setDate(fromDate.getDate() + diff)
    const yyyy = nextDate.getFullYear()
    const mm = String(nextDate.getMonth() + 1).padStart(2, '0')
    const dd = String(nextDate.getDate()).padStart(2, '0')
    const sessionDate = `${yyyy}-${mm}-${dd}`
    const topic = `${newSchedule.subjectName} — Pertemuan 1`

    const enrolledStudents = state.students.filter((s) => s.classId === newSchedule.classId)
    const initialEntries: AttendanceEntry[] = enrolledStudents.map((s) => ({
      studentId: s.id,
      studentName: s.name,
      nis: s.nis,
      status: 'hadir',
    }))

    const initialSession: AttendanceSession = {
      id: `ses-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      scheduleId: newSchedule.id,
      classId: newSchedule.classId,
      className: newSchedule.className,
      subjectName: newSchedule.subjectName,
      tutorId: newSchedule.tutorId,
      tutorName: newSchedule.tutorName,
      roomId: newSchedule.roomId,
      roomName: newSchedule.roomName,
      sessionDate,
      dayOfWeek: newSchedule.dayOfWeek,
      startTime: newSchedule.startTime,
      endTime: newSchedule.endTime,
      topic,
      isCompleted: false,
      entries: initialEntries,
    }

    state.attendanceSessions = [initialSession, ...state.attendanceSessions]

    saveAndNotify()
    return newSchedule
  },

  updateSchedule(id: string, input: Partial<Omit<Schedule, 'id'>>) {
    const index = state.schedules.findIndex((s) => s.id === id)
    if (index === -1) {
      throw new Error(`Jadwal dengan ID "${id}" tidak ditemukan`)
    }
    const oldSchedule = state.schedules[index]

    const mergedCandidate: ScheduleCandidate = {
      id,
      roomId: input.roomId ?? oldSchedule.roomId,
      tutorId: input.tutorId ?? oldSchedule.tutorId,
      dayOfWeek: input.dayOfWeek ?? oldSchedule.dayOfWeek,
      startTime: input.startTime ?? oldSchedule.startTime,
      endTime: input.endTime ?? oldSchedule.endTime,
    }

    const conflict = detectScheduleConflicts(mergedCandidate, state.schedules, state.rooms)
    if (conflict.hasConflict) {
      throw new Error(
        conflict.errorMessage ||
          conflict.timeError ||
          (conflict.roomConflict
            ? `Bentrok Ruangan: ${conflict.roomConflict.roomName} sudah digunakan oleh ${conflict.roomConflict.className} (${conflict.roomConflict.startTime}–${conflict.roomConflict.endTime})`
            : conflict.tutorConflict
              ? `Bentrok Tutor: ${conflict.tutorConflict.tutorName} sudah mengajar ${conflict.tutorConflict.className} (${conflict.tutorConflict.startTime}–${conflict.tutorConflict.endTime})`
              : 'Jadwal bentrok dengan jadwal lain')
      )
    }

    if (input.tutorId && oldSchedule.tutorId !== input.tutorId) {
      const oldTutor = state.tutors.find((t) => t.id === oldSchedule.tutorId)
      if (oldTutor && oldTutor.weeklySessionsCount > 0) oldTutor.weeklySessionsCount -= 1
      const newTutor = state.tutors.find((t) => t.id === input.tutorId)
      if (newTutor) newTutor.weeklySessionsCount += 1
    }

    const targetClass = input.classId ? state.classes.find((c) => c.id === input.classId) : undefined
    const targetTutor = input.tutorId ? state.tutors.find((t) => t.id === input.tutorId) : undefined
    const targetRoom = input.roomId ? state.rooms.find((r) => r.id === input.roomId) : undefined

    const updated: Schedule = {
      ...oldSchedule,
      ...input,
      id,
      className: input.className ?? (targetClass ? targetClass.name : oldSchedule.className),
      tutorName: input.tutorName ?? (targetTutor ? targetTutor.name : oldSchedule.tutorName),
      roomName: input.roomName ?? (targetRoom ? targetRoom.name : oldSchedule.roomName),
    }
    state.schedules[index] = updated

    // Sinkronkan perubahan jadwal ke sesi mendatang yang belum selesai
    state.attendanceSessions = state.attendanceSessions.map((s) => {
      if (s.scheduleId === id && !s.isCompleted) {
        return {
          ...s,
          className: updated.className,
          tutorId: updated.tutorId,
          tutorName: updated.tutorName,
          roomId: updated.roomId,
          roomName: updated.roomName,
          dayOfWeek: updated.dayOfWeek,
          startTime: updated.startTime,
          endTime: updated.endTime,
        }
      }
      return s
    })

    saveAndNotify()
    return updated
  },

  deleteSchedule(id: string) {
    const sch = state.schedules.find((s) => s.id === id)
    if (sch) {
      const tutor = state.tutors.find((t) => t.id === sch.tutorId)
      if (tutor && tutor.weeklySessionsCount > 0) tutor.weeklySessionsCount -= 1
    }
    state.schedules = state.schedules.filter((s) => s.id !== id)
    // Hapus sesi mendatang yang belum selesai dari jadwal yang dihapus
    state.attendanceSessions = state.attendanceSessions.filter(
      (s) => !(s.scheduleId === id && !s.isCompleted)
    )
    saveAndNotify()
    return true
  },

  // INVOICES & VERIFICATION (BILL-01 s/d BILL-03)
  createInvoice(input: {
    studentId: string
    studentName: string
    nis: string
    programName: string
    amount: number
    dueDate: string
    description?: string
  }) {
    const invId = `INV-2026-${(state.invoices.length + 306).toString().padStart(4, '0')}`
    const newInvoice: Invoice = {
      ...input,
      id: invId,
      status: 'belum_dibayar',
    }
    state.invoices = [newInvoice, ...state.invoices]
    this.recordInvoiceNotifications(newInvoice)
    saveAndNotify()
    return newInvoice
  },

  addInvoice(invoice: Invoice) {
    const existing = state.invoices.find((i) => i.id === invoice.id || i.invoiceNumber === invoice.invoiceNumber)
    if (existing) return existing
    state.invoices = [invoice, ...state.invoices]
    this.recordInvoiceNotifications(invoice)
    saveAndNotify()
    return invoice
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

    const student = state.students.find(
      (s) => s.id === inv.studentId || s.name === inv.studentName
    )
    const parent = state.parents.find(
      (p) =>
        (student ? p.studentIds.includes(student.id) : false) ||
        p.name === student?.parentName
    )

    this.addNotification({
      id: `notif-inv-${inv.id}-verified`,
      userId: student?.id || inv.studentId,
      title: 'Pembayaran SPP Terverifikasi Lunas',
      message: `Pembayaran SPP ${inv.id} Terverifikasi Lunas. Kwitansi ${inv.receiptNumber} resmi terbit untuk siswa ${inv.studentName} (${inv.programName}).`,
      timestamp: 'Baru saja',
      isRead: false,
      type: 'billing',
      linkUrl: '/parent/tagihan',
      metadata: {
        invoiceId: inv.id,
        receiptNumber: inv.receiptNumber,
        studentId: inv.studentId,
        studentName: inv.studentName,
        parentId: parent?.id,
        parentName: parent?.name,
        targetRoles: ['student', 'parent', 'admin'],
      },
    })

    saveAndNotify()
    return true
  },

  rejectInvoice(invoiceId: string, reason: string) {
    const inv = state.invoices.find((i) => i.id === invoiceId)
    if (!inv) return false

    inv.status = 'ditolak'
    inv.rejectedReason = reason

    const student = state.students.find(
      (s) => s.id === inv.studentId || s.name === inv.studentName
    )
    const parent = state.parents.find(
      (p) =>
        (student ? p.studentIds.includes(student.id) : false) ||
        p.name === student?.parentName
    )

    this.addNotification({
      id: `notif-inv-${inv.id}-rejected`,
      userId: student?.id || inv.studentId,
      title: 'Bukti Pembayaran SPP Ditolak',
      message: `Bukti Pembayaran SPP Ditolak untuk tagihan ${inv.id} (${inv.studentName} - ${inv.programName}). Alasan: ${reason}`,
      timestamp: 'Baru saja',
      isRead: false,
      type: 'billing',
      linkUrl: '/parent/tagihan',
      metadata: {
        invoiceId: inv.id,
        studentId: inv.studentId,
        studentName: inv.studentName,
        parentId: parent?.id,
        parentName: parent?.name,
        rejectedReason: reason,
        targetRoles: ['student', 'parent', 'admin'],
      },
    })

    saveAndNotify()
    return true
  },

  submitPaymentProof(input: {
    invoiceId: string
    fileName: string
    bankName: string
    paymentMethod: string
    submittedByRole: 'student' | 'parent'
    submittedByName: string
    storage_path?: string
    receiptUrl?: string
  }) {
    const inv = state.invoices.find((i) => i.id === input.invoiceId)
    if (!inv) return false

    inv.status = 'menunggu'
    inv.transferReceiptFile = input.fileName
    inv.bankName = input.bankName
    inv.paymentMethod = input.paymentMethod
    inv.submittedByRole = input.submittedByRole
    inv.submittedByName = input.submittedByName
    inv.submittedAt = new Date().toISOString()
    inv.rejectedReason = undefined
    if (input.storage_path) inv.storage_path = input.storage_path
    if (input.receiptUrl) inv.receiptUrl = input.receiptUrl

    state.notifications = [
      {
        id: `notif-${Date.now()}`,
        title: 'Bukti Pembayaran Diunggah',
        message: `${input.submittedByName} mengunggah bukti transfer untuk tagihan ${inv.id} (${inv.studentName} - ${inv.programName}).`,
        timestamp: 'Baru saja',
        isRead: false,
        type: 'payment',
      },
      ...state.notifications,
    ]

    saveAndNotify()
    return true
  },

  // SESSIONS & ATTENDANCE
  createSessionFromSchedule(
    scheduleId: string,
    sessionDate: string,
    topic: string = ''
  ): AttendanceSession {
    const schedule = state.schedules.find((s) => s.id === scheduleId)
    if (!schedule) {
      throw new Error(`Jadwal bimbingan dengan ID "${scheduleId}" tidak ditemukan.`)
    }

    // Cek apakah sesi aktual untuk jadwal dan tanggal ini sudah pernah dibuat (pencegahan duplikasi sesi)
    const existing = state.attendanceSessions.find(
      (s) => s.scheduleId === scheduleId && s.sessionDate === sessionDate
    )
    if (existing) {
      return existing
    }

    // Ambil siswa yang terdaftar pada kelas rombel bersangkutan
    const enrolledStudents = state.students.filter((s) => s.classId === schedule.classId)
    const initialEntries: AttendanceEntry[] = enrolledStudents.map((s) => ({
      studentId: s.id,
      studentName: s.name,
      nis: s.nis,
      status: 'hadir',
    }))

    const newSession: AttendanceSession = {
      id: `ses-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      scheduleId: schedule.id,
      classId: schedule.classId,
      className: schedule.className,
      subjectName: schedule.subjectName,
      tutorId: schedule.tutorId,
      tutorName: schedule.tutorName,
      roomId: schedule.roomId,
      roomName: schedule.roomName,
      sessionDate,
      dayOfWeek: schedule.dayOfWeek,
      startTime: schedule.startTime,
      endTime: schedule.endTime,
      topic,
      isCompleted: false,
      entries: initialEntries,
    }

    state.attendanceSessions = [newSession, ...state.attendanceSessions]
    saveAndNotify()
    return newSession
  },

  saveSessionAttendance(
    sessionId: string,
    topic: string,
    entries: AttendanceEntry[]
  ) {
    const session = state.attendanceSessions.find((s) => s.id === sessionId)
    if (!session) return false

    // Pemeriksaan Audit Lock & 2h Grace Period
    if (isSessionLockedForTutor(session)) {
      throw new Error(
        'Pencegahan manipulasi presensi: Sesi bimbingan telah selesai lebih dari 2 jam dan telah dikunci untuk menjaga integritas data presensi.'
      )
    }

    // Pencegahan duplikasi presensi siswa pada sesi yang sama
    const seenStudentIds = new Set<string>()
    for (const entry of entries) {
      if (seenStudentIds.has(entry.studentId)) {
        throw new Error(
          `Pencegahan duplikasi presensi: Siswa "${entry.studentName || entry.studentId}" memiliki lebih dari satu entri presensi pada sesi yang sama.`
        )
      }
      seenStudentIds.add(entry.studentId)
    }

    // Simpan notifikasi hanya pada penyimpanan PERTAMA sesi ini (anti-spam).
    const isFirstSave = !session.isCompleted

    session.topic = topic
    session.entries = entries
    session.isCompleted = true
    if (!session.completedAt) {
      session.completedAt = new Date().toISOString()
    }

    if (isFirstSave) {
      const recipients = entries.map((entry) => {
        const student = state.students.find(
          (s) => s.id === entry.studentId || s.name === entry.studentName
        )
        const parent = state.parents.find(
          (p) =>
            (student ? p.studentIds.includes(student.id) : false) ||
            p.name === student?.parentName
        )
        return { studentId: entry.studentId, parentProfileId: parent?.id || '' }
      })

      const drafts = buildAttendanceNotifications({
        session: {
          id: session.id,
          subjectName: session.subjectName,
          dayOfWeek: session.dayOfWeek,
          startTime: session.startTime,
        },
        entries,
        recipients,
      })

      if (drafts.length > 0) {
        // Ganti notifikasi presensi lama untuk sesi ini (anti-duplikat).
        state.notifications = state.notifications.filter(
          (n) => !(n.type === 'attendance' && (n.metadata?.sessionId === session.id || n.data?.sessionId === session.id))
        )
        for (const draft of drafts) {
          this.addNotification({
            id: `notif-att-${session.id}-${draft.metadata.studentId}`,
            userId: draft.userId,
            title: draft.title,
            message: draft.message,
            type: 'attendance',
            linkUrl: draft.linkUrl,
            metadata: draft.metadata,
          })
        }
      }
    }

    saveAndNotify()
    return true
  },

  recordStudentAttendance(sessionId: string, entry: AttendanceEntry) {
    const session = state.attendanceSessions.find((s) => s.id === sessionId)
    if (!session) {
      throw new Error(`Sesi dengan ID "${sessionId}" tidak ditemukan.`)
    }

    const existingIndex = session.entries.findIndex((e) => e.studentId === entry.studentId)
    if (existingIndex >= 0) {
      // Perbarui status presensi siswa yang sudah ada tanpa membuat entri ganda
      session.entries[existingIndex] = { ...session.entries[existingIndex], ...entry }
    } else {
      session.entries.push(entry)
    }

    if (entry.status === 'alpa') {
      const student = state.students.find(
        (s) => s.id === entry.studentId || s.name === entry.studentName
      )
      const parent = state.parents.find(
        (p) =>
          (student ? p.studentIds.includes(student.id) : false) ||
          p.name === student?.parentName
      )

      this.addNotification({
        id: `notif-alpa-${session.id}-${entry.studentId}`,
        userId: student?.id || entry.studentId,
        title: 'Peringatan Ketidakhadiran Siswa (Alpa)',
        message: `Ketidakhadiran (Alpa): Siswa ${entry.studentName} tidak hadir pada sesi ${session.subjectName} (${session.dayOfWeek}, ${session.startTime} WITA).`,
        timestamp: 'Baru saja',
        isRead: false,
        type: 'attendance',
        linkUrl: '/student/presensi',
        metadata: {
          studentId: entry.studentId,
          studentName: entry.studentName,
          parentId: parent?.id,
          parentName: parent?.name || student?.parentName,
          sessionId: session.id,
          sessionName: session.subjectName,
          targetRoles: ['student', 'parent', 'admin'],
        },
      })
    }

    saveAndNotify()
    return session
  },

  // LEARNING MATERIALS
  addLearningMaterial(input: Omit<LearningMaterial, 'id' | 'uploadedAt'>) {
    const storagePath = input.storage_path || input.storagePath
    const newMaterial: LearningMaterial = {
      ...input,
      storage_path: storagePath,
      storagePath: storagePath,
      id: `mat-${Date.now().toString().slice(-4)}`,
      uploadedAt: new Intl.DateTimeFormat('id-ID', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      }).format(new Date()),
    }
    state.learningMaterials = [newMaterial, ...state.learningMaterials]

    state.notifications = [
      {
        id: `notif-${Date.now()}`,
        title: 'Modul Belajar Baru Diunggah',
        message: `${newMaterial.tutorName} mengunggah materi "${newMaterial.title}" untuk kelas ${newMaterial.className}.`,
        timestamp: 'Baru saja',
        isRead: false,
        type: 'general',
      },
      ...state.notifications,
    ]

    saveAndNotify()
    return newMaterial
  },

  deleteLearningMaterial(id: string) {
    state.learningMaterials = state.learningMaterials.filter((m) => m.id !== id)
    saveAndNotify()
    return true
  },

  // GRADE RECORDS
  addGradeRecord(
    input: Omit<GradeRecord, 'id' | 'assessmentDate' | 'classAverage'> & {
      classAverage?: number
      assessmentDate?: string
    }
  ) {
    const newGrade: GradeRecord = {
      ...input,
      id: (input as any).id || `grd-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      classAverage: input.classAverage ?? input.score,
      assessmentDate:
        input.assessmentDate ||
        new Intl.DateTimeFormat('id-ID', {
          day: 'numeric',
          month: 'short',
          year: 'numeric',
        }).format(new Date()),
    }
    state.gradeRecords = [newGrade, ...state.gradeRecords]

    // Calculate classAverage for all records in the same class and assessment
    const matchingRecords = state.gradeRecords.filter(
      (g) => g.classId === newGrade.classId && g.assessmentTitle === newGrade.assessmentTitle
    )
    const totalScore = matchingRecords.reduce((sum, g) => sum + g.score, 0)
    const classAverage = matchingRecords.length > 0
      ? Math.round(totalScore / matchingRecords.length)
      : newGrade.score

    // Synchronize calculated classAverage across all records of that assessment in that class
    state.gradeRecords = state.gradeRecords.map((g) => {
      if (g.classId === newGrade.classId && g.assessmentTitle === newGrade.assessmentTitle) {
        return { ...g, classAverage }
      }
      return g
    })
    newGrade.classAverage = classAverage

    const student = state.students.find(
      (s) => s.id === newGrade.studentId || s.name === newGrade.studentName
    )
    const parent = state.parents.find(
      (p) =>
        (student ? p.studentIds.includes(student.id) : false) ||
        p.name === student?.parentName
    )

    this.addNotification({
      id: `notif-grade-${newGrade.id}`,
      userId: newGrade.studentId,
      title: 'Nilai Evaluasi Rapor Baru',
      message: `Nilai ${newGrade.assessmentTitle} (${newGrade.score}/100) telah diinput untuk siswa ${newGrade.studentName}.`,
      timestamp: 'Baru saja',
      isRead: false,
      type: 'academic',
      linkUrl: '/student/rapor',
      metadata: {
        gradeId: newGrade.id,
        studentId: newGrade.studentId,
        studentName: newGrade.studentName,
        parentId: parent?.id,
        classId: newGrade.classId,
        score: newGrade.score,
        assessmentTitle: newGrade.assessmentTitle,
        targetRoles: ['student', 'parent', 'admin'],
      },
    })

    saveAndNotify()
    return newGrade
  },

  updateGradeRecord(id: string, updates: Partial<GradeRecord>) {
    const index = state.gradeRecords.findIndex((g) => g.id === id)
    if (index === -1) return null

    const oldRecord = state.gradeRecords[index]
    const updatedRecord: GradeRecord = { ...oldRecord, ...updates }
    state.gradeRecords[index] = updatedRecord

    const syncClassAverage = (classId: string, assessmentTitle: string) => {
      const matching = state.gradeRecords.filter(
        (g) => g.classId === classId && g.assessmentTitle === assessmentTitle
      )
      if (matching.length === 0) return
      const totalScore = matching.reduce((sum, g) => sum + g.score, 0)
      const classAverage = Math.round(totalScore / matching.length)
      state.gradeRecords = state.gradeRecords.map((g) => {
        if (g.classId === classId && g.assessmentTitle === assessmentTitle) {
          return { ...g, classAverage }
        }
        return g
      })
    }

    // Synchronize for target assessment and class
    syncClassAverage(updatedRecord.classId, updatedRecord.assessmentTitle)

    // If classId or assessmentTitle changed, also resync old group
    if (oldRecord.classId !== updatedRecord.classId || oldRecord.assessmentTitle !== updatedRecord.assessmentTitle) {
      syncClassAverage(oldRecord.classId, oldRecord.assessmentTitle)
    }

    saveAndNotify()
    return state.gradeRecords.find((g) => g.id === id) ?? updatedRecord
  },

  // SESSIONS & PROFILES
  setSelectedChildId(childId: string) {
    state.selectedChildId = childId
    saveAndNotify()
  },

  setActiveTutorId(tutorId: string) {
    state.activeTutorId = tutorId
    saveAndNotify()
  },

  setActiveStudentId(studentId: string) {
    state.activeStudentId = studentId
    saveAndNotify()
  },

  setActiveParentId(parentId: string) {
    state.activeParentId = parentId
    saveAndNotify()
  },

  addParent(input: Omit<ParentProfile, 'id'>) {
    const newParent: ParentProfile = {
      ...input,
      id: `par-${Date.now().toString().slice(-4)}`,
    }
    state.parents = [newParent, ...state.parents]
    saveAndNotify()
    return newParent
  },

  updateParent(id: string, updates: Partial<ParentProfile>) {
    state.parents = state.parents.map((p) => (p.id === id ? { ...p, ...updates } : p))
    saveAndNotify()
  },

  // ANNOUNCEMENTS
  addAnnouncement(
    input: Omit<Announcement, 'id' | 'publishedDate' | 'author'> & {
      id?: string
      author?: string
      publishedDate?: string
    }
  ) {
    const annId = input.id || `ann-${Date.now().toString().slice(-4)}`
    const existing = state.announcements.find((a) => a.id === annId)
    if (existing) {
      return existing
    }

    const newAnn: Announcement = {
      ...input,
      id: annId,
      publishedDate:
        input.publishedDate ||
        new Intl.DateTimeFormat('id-ID', {
          day: 'numeric',
          month: 'long',
          year: 'numeric',
        }).format(new Date()),
      author: input.author || 'Hj. Nuraini, S.Pd',
    }
    state.announcements = [newAnn, ...state.announcements]
    saveAndNotify()
    this.broadcastAnnouncement(newAnn)
    return newAnn
  },

  togglePinAnnouncement(id: string, isPinned?: boolean) {
    state.announcements = state.announcements.map((a) => {
      if (a.id === id) {
        return { ...a, isPinned: isPinned !== undefined ? isPinned : !a.isPinned }
      }
      return a
    })
    saveAndNotify()
    return true
  },

  deleteAnnouncement(id: string) {
    state.announcements = state.announcements.filter((a) => a.id !== id && a.title !== id)
    state.notifications = state.notifications.filter(
      (n) => n.metadata?.announcementId !== id && n.id !== id && n.data?.id !== id
    )
    saveAndNotify()
    return true
  },

  // NOTIFICATIONS
  addNotification(
    input: Omit<AdminNotification, 'id' | 'timestamp' | 'isRead'> & {
      id?: string
      timestamp?: string
      isRead?: boolean
    }
  ) {
    const notifId =
      input.id || `notif-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`
    let meta = input.metadata || input.data
    if (typeof meta === 'string') {
      try {
        meta = JSON.parse(meta)
      } catch {}
    }

    const annId =
      (meta as any)?.announcementId ||
      (input.type === 'announcement' ? input.id : null)

    const existing = state.notifications.find((n) => {
      if (n.id === notifId) return true
      if (annId) {
        let existingMeta = n.metadata || n.data
        if (typeof existingMeta === 'string') {
          try {
            existingMeta = JSON.parse(existingMeta)
          } catch {}
        }
        const existingAnnId =
          (existingMeta as any)?.announcementId ||
          (n.type === 'announcement' ? n.id : null)
        if (existingAnnId === annId) return true
      }
      // Deduplikasi berdasarkan kesamaan judul dan isi pesan hanya untuk notif non-announcement
      // Untuk announcement, gunakan announcementId sebagai sumber kebenaran
      if (!annId && n.title === input.title && n.message === input.message) return true
      return false
    })
    if (existing) return existing

    const newNotif: AdminNotification = {
      id: notifId,
      title: input.title,
      message: input.message,
      timestamp: input.timestamp || 'Baru saja',
      isRead: input.isRead ?? false,
      type: input.type,
      userId: input.userId,
      linkUrl: input.linkUrl,
      metadata: input.metadata || input.data,
      data: input.data || input.metadata,
    }
    state.notifications = [newNotif, ...state.notifications]
    saveAndNotify()
    return newNotif
  },

  broadcastAnnouncement(ann: Announcement) {
    const target = ann.targetAudience
    const recipients: Array<{ userId: string; role: string }> = []

    if (target === 'Semua' || target === 'Siswa') {
      state.students
        .filter((s) => s.status === 'aktif')
        .forEach((s) => recipients.push({ userId: s.id, role: 'student' }))
    }

    if (target === 'Semua' || target === 'Orang Tua') {
      state.parents.forEach((p) => recipients.push({ userId: p.id, role: 'parent' }))
    }

    if (target === 'Semua' || target === 'Tutor') {
      state.tutors
        .filter((t) => t.status === 'aktif')
        .forEach((t) => recipients.push({ userId: t.id, role: 'tutor' }))
    }

    const newNotifs: AdminNotification[] = []

    for (const r of recipients) {
      newNotifs.push({
        id: `notif-ann-${ann.id}-${r.userId}`,
        userId: r.userId,
        title: ann.title,
        message:
          ann.content.length > 140
            ? `${ann.content.substring(0, 137)}...`
            : ann.content,
        timestamp: 'Baru saja',
        isRead: false,
        type: 'announcement',
        linkUrl:
          r.role === 'student'
            ? '/student'
            : r.role === 'parent'
            ? '/parent'
            : r.role === 'tutor'
            ? '/tutor'
            : '/admin/pengumuman',
        metadata: {
          announcementId: ann.id,
          targetAudience: ann.targetAudience,
          recipientRole: r.role,
        },
        data: ann,
      })
    }

    // Hanya buat notifikasi personal tata usaha jika pengumuman memang menyasar semua audiens
    if (target === 'Semua') {
      const generalNotif: AdminNotification = {
        id: `notif-ann-${ann.id}-admin`,
        title: ann.title,
        message:
          ann.content.length > 140
            ? `${ann.content.substring(0, 137)}...`
            : ann.content,
        type: 'announcement',
        timestamp: 'Baru saja',
        isRead: false,
        linkUrl: '/admin/pengumuman',
        metadata: {
          announcementId: ann.id,
          targetAudience: ann.targetAudience,
          recipientRole: 'admin',
        },
        data: ann,
      }
      newNotifs.push(generalNotif)
    }

    state.notifications = [...newNotifs, ...state.notifications]
    saveAndNotify()

    try {
      if (typeof supabase !== 'undefined' && supabase) {
        const channel = supabase.channel('broadcast:announcements')
        channel.subscribe((status) => {
          if (status === 'SUBSCRIBED') {
            const expectedRole =
              target === 'Siswa'
                ? 'student'
                : target === 'Orang Tua'
                ? 'parent'
                : target === 'Tutor'
                ? 'tutor'
                : undefined

            channel
              .send({
                type: 'broadcast',
                event: 'announcement',
                payload: {
                  id: ann.id,
                  title: ann.title,
                  message: ann.content,
                  type: 'announcement',
                  targetAudience: ann.targetAudience,
                  metadata: {
                    announcementId: ann.id,
                    targetAudience: ann.targetAudience,
                    recipientRole: expectedRole,
                  },
                },
              })
              .then(() => {
                setTimeout(() => {
                  try {
                    supabase.removeChannel(channel)
                  } catch {
                    // ignore cleanup error
                  }
                }, 1000)
              })
              .catch((err) => {
                console.warn('Realtime broadcast error:', err)
                try {
                  supabase.removeChannel(channel)
                } catch {
                  // ignore
                }
              })
          }
        })
      }
    } catch (err) {
      console.warn('Realtime channel error:', err)
    }

    return newNotifs
  },

  markAllNotificationsRead(
    userId?: string,
    targetIds?: string[],
    announcementIds?: string[]
  ) {
    const idSet = targetIds && targetIds.length > 0 ? new Set(targetIds) : null
    const annSet =
      announcementIds && announcementIds.length > 0 ? new Set(announcementIds) : null

    state.notifications = state.notifications.map((n) => {
      if (idSet && idSet.has(n.id)) {
        return { ...n, isRead: true }
      }
      const annId =
        (n.metadata?.announcementId as string) ||
        (n.type === 'announcement' ? n.id : null)
      if (annSet && annId && annSet.has(annId)) {
        return { ...n, isRead: true }
      }
      if (userId) {
        if (
          n.userId === userId ||
          n.metadata?.studentId === userId ||
          n.metadata?.parentId === userId
        ) {
          return { ...n, isRead: true }
        }
        return n
      }
      return { ...n, isRead: true }
    })
    saveAndNotify()
  },

  markNotificationRead(id: string, announcementId?: string) {
    let matchedNotif: AdminNotification | null = null
    state.notifications = state.notifications.map((n) => {
      const isIdMatch = n.id === id
      const isAnnMatch =
        announcementId &&
        (n.metadata?.announcementId === announcementId || n.id === announcementId)
      if (isIdMatch || isAnnMatch) {
        matchedNotif = { ...n, isRead: true }
        return matchedNotif
      }
      return n
    })
    saveAndNotify()
    return matchedNotif
  },

  getNotifications(userId?: string) {
    if (!userId) return state.notifications
    return state.notifications.filter(
      (n) =>
        n.userId === userId ||
        n.metadata?.studentId === userId ||
        n.metadata?.parentId === userId
    )
  },

  approvePaymentProof(invoiceId: string) {
    return this.verifyInvoice(invoiceId)
  },

  notifyAttendanceAlpa(sessionId: string, studentId: string) {
    const session = state.attendanceSessions.find((s) => s.id === sessionId)
    const student = state.students.find(
      (s) => s.id === studentId || s.name === studentId
    )
    const parent = state.parents.find(
      (p) =>
        (student ? p.studentIds.includes(student.id) : false) ||
        p.studentIds.includes(studentId) ||
        p.name === student?.parentName
    )

    const createdNotifs: AdminNotification[] = []
    const now = new Date().toISOString()
    const subj = session?.subjectName || 'Bimbingan Belajar'

    // Student notification
    if (student) {
      createdNotifs.push(
        this.addNotification({
          id: `notif-alpa-${sessionId}-${student.id}-student`,
          userId: student.id,
          title: 'Peringatan Ketidakhadiran Siswa (Alpa)',
          message: `Ketidakhadiran (Alpa): Anda tidak hadir pada sesi ${subj}.`,
          type: 'attendance',
          createdAt: now,
          metadata: {
            sessionId,
            studentId: student.id,
            targetRoles: ['student'],
          },
        })
      )
    }

    // Parent notification
    if (parent) {
      createdNotifs.push(
        this.addNotification({
          id: `notif-alpa-${sessionId}-${student?.id || studentId}-parent`,
          userId: parent.id,
          title: 'Peringatan Ketidakhadiran Siswa (Alpa)',
          message: `Ketidakhadiran (Alpa): Putra/Putri Anda (${student?.name || 'Siswa'}) tidak hadir pada sesi ${subj}.`,
          type: 'attendance',
          createdAt: now,
          metadata: {
            sessionId,
            studentId: student?.id,
            parentId: parent.id,
            targetRoles: ['parent'],
          },
        })
      )
    }

    return createdNotifs
  },

  // INVOICE BILLING NOTIFICATIONS (BILL-01 & Web Push Sync)
  recordInvoiceNotifications(invoice: {
    id: string
    studentId: string
    studentName?: string
    programName: string
    amount: number
    dueDate: string
    invoiceNumber?: string
  }): AdminNotification[] {
    const createdNotifs: AdminNotification[] = []
    const invNum = invoice.invoiceNumber || invoice.id
    const formattedAmount = `Rp ${Number(invoice.amount).toLocaleString('id-ID')}`
    const student = state.students.find(
      (s) =>
        s.id === invoice.studentId ||
        (s as any).profileId === invoice.studentId ||
        (invoice.studentName && s.name.toLowerCase() === invoice.studentName.toLowerCase()) ||
        (s.id === 'stu-1' && invoice.studentId?.includes('d992d9fc')) ||
        (s.id === 'd992d9fc-6f5b-434f-998b-358e54a754b7' && invoice.studentId === 'stu-1')
    )
    const studentName = invoice.studentName || student?.name || 'Siswa'
    const parent = state.parents.find(
      (p) =>
        (student && p.studentIds?.includes(student.id)) ||
        p.id === (invoice as any).parentId ||
        (student && p.phone === student.parentPhone) ||
        (student && p.name.toLowerCase() === student.parentName?.toLowerCase()) ||
        (studentName.toLowerCase().includes('fahri') && p.name.toLowerCase().includes('dahlan')) ||
        p.id === 'ec6f75cb-887a-442b-b91d-f47f9afc5ab8' ||
        p.id === 'par-1'
    )

    // 1. Notifikasi untuk Admin (Tata Usaha)
    createdNotifs.push(
      this.addNotification({
        id: `notif-inv-${invoice.id}-admin`,
        title: 'Tagihan SPP Diterbitkan',
        message: `Tagihan ${invNum} untuk ${studentName} sebesar ${formattedAmount} telah diterbitkan. Jatuh tempo: ${invoice.dueDate}.`,
        type: 'billing',
        linkUrl: '/admin/pembayaran',
        metadata: {
          invoiceId: invoice.id,
          studentId: invoice.studentId,
          targetRoles: ['admin'],
        },
      })
    )

    // 2. Notifikasi untuk Wali Murid (Parent)
    const targetStudentId = student?.id || invoice.studentId
    const targetParentId = parent?.id || (invoice as any).parentId || (targetStudentId === 'stu-1' || targetStudentId === 'd992d9fc-6f5b-434f-998b-358e54a754b7' ? 'par-1' : null)
    if (targetParentId) {
      createdNotifs.push(
        this.addNotification({
          id: `notif-inv-${invoice.id}-parent`,
          userId: targetParentId,
          title: 'Tagihan SPP Putra/Putri',
          message: `Tagihan SPP an. ${studentName} sebesar ${formattedAmount} telah diterbitkan. Jatuh tempo: ${invoice.dueDate}.`,
          type: 'billing',
          linkUrl: '/parent/tagihan',
          metadata: {
            invoiceId: invoice.id,
            studentId: targetStudentId,
            parentId: targetParentId,
            targetRoles: ['parent'],
          },
        })
      )
    }

    // 3. Notifikasi untuk Siswa
    if (targetStudentId) {
      createdNotifs.push(
        this.addNotification({
          id: `notif-inv-${invoice.id}-student`,
          userId: targetStudentId,
          title: 'Tagihan SPP Baru',
          message: `Tagihan SPP periode ${invoice.programName} sebesar ${formattedAmount} telah diterbitkan. Jatuh tempo: ${invoice.dueDate}.`,
          type: 'billing',
          linkUrl: '/student/tagihan',
          metadata: {
            invoiceId: invoice.id,
            studentId: targetStudentId,
            targetRoles: ['student'],
          },
        })
      )
    }

    return createdNotifs
  },
}

// Conflict Detection Engine (SCHED-02 Pure Function)
export interface ScheduleCandidate {
  id?: string
  classId?: string
  className?: string
  subjectName?: string
  roomId: string
  roomName?: string
  tutorId: string
  tutorName?: string
  dayOfWeek: string
  startTime: string
  endTime: string
}

export interface ConflictCheckResult {
  hasConflict: boolean
  timeError?: string
  roomConflict?: Schedule
  tutorConflict?: Schedule
  errorMessage?: string
  suggestedRooms?: Room[]
}

export function detectScheduleConflicts(
  candidate: ScheduleCandidate,
  schedules: Schedule[],
  allRooms: Room[]
): ConflictCheckResult {
  // 1. Validasi urutan waktu: endTime > startTime
  if (!candidate.startTime || !candidate.endTime) {
    return { hasConflict: false }
  }

  if (candidate.endTime <= candidate.startTime) {
    const timeError = 'Jam selesai bimbingan harus lebih besar daripada jam mulai.'
    return {
      hasConflict: true,
      timeError,
      errorMessage: timeError,
    }
  }

  // 2. Evaluasi bentrok ruangan & tutor
  // Bentrok Ruangan: (Ruangan_A == Ruangan_B) && (Hari_A == Hari_B) && (Mulai_A < Selesai_B) && (Selesai_A > Mulai_B)
  // Bentrok Tutor: (Tutor_A == Tutor_B) && (Hari_A == Hari_B) && (Mulai_A < Selesai_B) && (Selesai_A > Mulai_B)
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
      if (candidate.roomId && existing.roomId === candidate.roomId && !roomConflict) {
        roomConflict = existing
      }
      if (candidate.tutorId && existing.tutorId === candidate.tutorId && !tutorConflict) {
        tutorConflict = existing
      }
    }
  }

  const hasConflict = Boolean(roomConflict || tutorConflict)

  // Pesan error deskriptif yang memuat nama ruangan/tutor, nama kelas, dan rentang jam bentrok
  let errorMessage: string | undefined
  if (roomConflict && tutorConflict) {
    const rName = roomConflict.roomName || allRooms.find((r) => r.id === roomConflict?.roomId)?.name || 'Ruangan'
    errorMessage = `Bentrok Ruangan & Tutor: Ruangan "${rName}" sudah digunakan oleh kelas "${roomConflict.className}" (${roomConflict.startTime}–${roomConflict.endTime}) dan Tutor "${tutorConflict.tutorName}" sudah mengajar kelas "${tutorConflict.className}" (${tutorConflict.startTime}–${tutorConflict.endTime}) pada hari ${candidate.dayOfWeek}.`
  } else if (roomConflict) {
    const rName = roomConflict.roomName || allRooms.find((r) => r.id === roomConflict?.roomId)?.name || 'Ruangan'
    errorMessage = `Bentrok Ruangan: Ruangan "${rName}" sudah digunakan oleh kelas "${roomConflict.className}" (${roomConflict.startTime}–${roomConflict.endTime}) pada hari ${candidate.dayOfWeek}.`
  } else if (tutorConflict) {
    errorMessage = `Bentrok Tutor: Tutor "${tutorConflict.tutorName}" sudah mengajar kelas "${tutorConflict.className}" (${tutorConflict.startTime}–${tutorConflict.endTime}) pada hari ${candidate.dayOfWeek}.`
  }

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
    timeError: candidate.endTime <= candidate.startTime ? 'Jam selesai bimbingan harus lebih besar daripada jam mulai.' : undefined,
    roomConflict,
    tutorConflict,
    errorMessage,
    suggestedRooms,
  }
}

/**
 * Formula kalkulasi persentase kehadiran: Math.round((hadirCount / totalCount) * 100)
 */
export function calculateAttendancePercentage(hadirCount: number, totalCount: number): number {
  if (totalCount <= 0) return 0
  return Math.round((hadirCount / totalCount) * 100)
}

export interface StudentAttendanceSummary {
  studentId: string
  hadirCount: number
  sakitCount: number
  izinCount: number
  alpaCount: number
  totalSessions: number
  percentage: number
}

/**
 * Rekapitulasi kehadiran seorang siswa dari kumpulan sesi bimbingan
 */
export function getStudentAttendanceSummary(
  studentId: string,
  sessions: AttendanceSession[]
): StudentAttendanceSummary {
  let hadirCount = 0
  let sakitCount = 0
  let izinCount = 0
  let alpaCount = 0
  let totalSessions = 0

  for (const session of sessions) {
    const entry = session.entries.find((e) => e.studentId === studentId)
    if (entry) {
      totalSessions++
      if (entry.status === 'hadir') hadirCount++
      else if (entry.status === 'sakit') sakitCount++
      else if (entry.status === 'izin') izinCount++
      else if (entry.status === 'alpa') alpaCount++
    }
  }

  const percentage = calculateAttendancePercentage(hadirCount, totalSessions)

  return {
    studentId,
    hadirCount,
    sakitCount,
    izinCount,
    alpaCount,
    totalSessions,
    percentage,
  }
}
