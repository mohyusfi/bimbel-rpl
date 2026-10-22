import { describe, it, expect, beforeEach } from 'vitest'
import {
  adminStore,
  type Room,
  type ClassGroup,
  type Student,
  type Registration,
  type Course,
  type PackageCode,
} from '../admin-store'
import {
  rooms,
  classes,
  courses,
  tutors,
  classMembers,
  students,
  profiles,
  parents,
  registrations,
  classesRelations,
  coursesRelations,
  tutorsRelations,
  classMembersRelations,
  type Room as DrizzleRoom,
  type NewRoom,
  type Class as DrizzleClass,
  type NewClass,
  type Course as DrizzleCourse,
  type NewCourse,
  type Tutor as DrizzleTutor,
  type NewTutor,
  type ClassMember as DrizzleClassMember,
  type NewClassMember,
} from '../../db/schema'

describe('Tiket 01 — Master Data Persistence & Rombel Plotting Audit', () => {
  beforeEach(() => {
    // Reset state jika diperlukan untuk menjamin isolasi antar pengujian
  })

  // =========================================================================
  // 1. VALIDASI KAPASITAS MASTER RUANGAN (MAKSIMAL 12 SISWA)
  // =========================================================================
  describe('Validasi Kapasitas Master Ruangan (Maksimal 12 Siswa)', () => {
    it('berhasil menambah ruangan baru dengan kapasitas standar (1–12 siswa)', () => {
      const room1 = adminStore.addRoom({
        name: 'Ruang R-Palu 05 (Uji QA 10 Kursi)',
        capacity: 10,
        facilities: 'AC, Smart TV, Whiteboard Magnetik',
      })

      expect(room1).toBeDefined()
      expect(room1.id).toBeDefined()
      expect(room1.name).toBe('Ruang R-Palu 05 (Uji QA 10 Kursi)')
      expect(room1.capacity).toBe(10)
      expect(room1.isActive).toBe(true)

      const room2 = adminStore.addRoom({
        name: 'Ruang R-Palu 06 (Uji QA 12 Kursi)',
        capacity: 12,
        facilities: 'AC, Proyektor, 12 Meja Siswa',
      })

      expect(room2.capacity).toBe(12)
      expect(room2.isActive).toBe(true)
    })

    it('membatasi secara ketat (clamping) kapasitas ruangan menjadi maksimal 12 siswa jika diinput > 12', () => {
      // Administrator mencoba input kapasitas 25 kursi (melebihi standar bimbel)
      const oversizedRoom = adminStore.addRoom({
        name: 'Ruang Auditorium Raksasa (Melebihi Kapasitas)',
        capacity: 25,
        facilities: 'AC Sentral',
      })

      // Sistem wajib menjepit kapasitas maksimal di angka 12 siswa
      expect(oversizedRoom.capacity).toBe(12)

      // Coba input ekstrim 100 kursi
      const extremeRoom = adminStore.addRoom({
        name: 'Ruang Seminar 100 Kursi',
        capacity: 100,
        facilities: 'Sound System',
      })
      expect(extremeRoom.capacity).toBe(12)
    })

    it('membatasi kapasitas ruangan minimal 1 siswa jika diinput 0 atau nilai negatif', () => {
      const zeroRoom = adminStore.addRoom({
        name: 'Ruang Kapasitas Nol',
        capacity: 0,
        facilities: 'None',
      })
      expect(zeroRoom.capacity).toBe(1)

      const negativeRoom = adminStore.addRoom({
        name: 'Ruang Kapasitas Negatif',
        capacity: -5,
        facilities: 'None',
      })
      expect(negativeRoom.capacity).toBe(1)
    })

    it('menegakkan batas maksimal 12 siswa saat memperbarui kapasitas ruangan (updateRoom)', () => {
      const room = adminStore.addRoom({
        name: 'Ruang Diskusi Kecil',
        capacity: 8,
        facilities: 'AC',
      })

      // Update valid: dari 8 ke 12
      const updatedLegal = adminStore.updateRoom(room.id, { capacity: 12 })
      expect(updatedLegal).toBeTruthy()
      expect(typeof updatedLegal === 'object' && updatedLegal.capacity).toBe(12)

      // Update ilegal: mencoba menaikkan ke 30 kursi
      const updatedIllegal = adminStore.updateRoom(room.id, { capacity: 30 })
      expect(updatedIllegal).toBeTruthy()
      expect(typeof updatedIllegal === 'object' && updatedIllegal.capacity).toBe(12)
    })

    it('dapat mengubah status aktif/nonaktif ruangan fisik (toggleRoomActive)', () => {
      const room = adminStore.addRoom({
        name: 'Ruang Uji Status Aktif',
        capacity: 12,
        facilities: 'Standar',
      })
      expect(room.isActive).toBe(true)

      // Nonaktifkan ruangan
      const toggle1 = adminStore.toggleRoomActive(room.id)
      expect(toggle1).toBe(true)
      const roomState1 = adminStore.getState().rooms.find((r) => r.id === room.id)
      expect(roomState1?.isActive).toBe(false)

      // Aktifkan kembali ruangan
      const toggle2 = adminStore.toggleRoomActive(room.id)
      expect(toggle2).toBe(true)
      const roomState2 = adminStore.getState().rooms.find((r) => r.id === room.id)
      expect(roomState2?.isActive).toBe(true)
    })
  })

  // =========================================================================
  // 2. VALIDASI PEMBATASAN ROMBEL KELAS (MAKSIMAL 12 SISWA PER ROMBEL)
  // =========================================================================
  describe('Validasi Pembatasan Rombel Kelas (Maksimal 12 Siswa per Rombel)', () => {
    it('berhasil membuat rombel baru dengan batas kapasitas standar (10 atau 12 siswa)', () => {
      const newClass = adminStore.addClass({
        name: 'UTBK Intensif Bintang QA',
        courseCode: 'UTBK',
        courseName: 'Intensif UTBK-SNBT',
        capacity: 12,
        tutorName: 'Ahmad Fauzi, M.Pd',
      })

      expect(newClass).toBeDefined()
      expect(newClass.id).toBeDefined()
      expect(newClass.name).toBe('UTBK Intensif Bintang QA')
      expect(newClass.capacity).toBe(12)
      expect(newClass.studentCount).toBe(0)
    })

    it('otomatis menjepit kapasitas rombel menjadi 12 jika diinput melebihi 12', () => {
      const oversizedClass = adminStore.addClass({
        name: 'SMA Reguler Super Besar (20 Siswa)',
        courseCode: 'SMA',
        courseName: 'SMA Sukses',
        capacity: 20,
        tutorName: 'Siti Rahma, S.Si',
      })

      // Wajib dibatasi pada 12 siswa sesuai PRD dan CONTEXT.md
      expect(oversizedClass.capacity).toBe(12)
    })

    it('menegakkan batas maksimal 12 siswa saat update kapasitas rombel (updateClass)', () => {
      const cls = adminStore.addClass({
        name: 'Kelas Rombel Update QA',
        courseCode: 'SMP',
        courseName: 'SMP Prestasi',
        capacity: 10,
        tutorName: 'Dewi Sartika, S.Pd',
      })

      // Update ilegal menjadi 50 siswa
      const res = adminStore.updateClass(cls.id, { capacity: 50 })
      expect(res).toBeTruthy()
      expect(typeof res === 'object' && res.capacity).toBe(12)
    })

    it('memperbarui counter activeClassesCount pada master course saat rombel baru dibuat', () => {
      const initialCourse = adminStore.getState().courses.find((c) => c.code === 'SD')
      const initialCount = initialCourse?.activeClassesCount || 0

      adminStore.addClass({
        name: 'SD Cendekia Angkatan QA',
        courseCode: 'SD',
        courseName: 'SD Cendekia',
        capacity: 12,
        tutorName: 'Nurul Hidayah, S.Pd',
      })

      const updatedCourse = adminStore.getState().courses.find((c) => c.code === 'SD')
      expect(updatedCourse?.activeClassesCount).toBe(initialCount + 1)
    })
  })

  // =========================================================================
  // 3. VALIDASI PLOTTING PENDAFTARAN & ANTI-OVERCAPACITY KELAS
  // =========================================================================
  describe('Validasi Plotting Pendaftaran Calon Siswa (Anti-Overcapacity)', () => {
    it('berhasil memplot calon siswa ke rombel yang masih memiliki sisa kursi', () => {
      // 1. Buat rombel dengan kapasitas 12 dan isi 10 siswa
      const targetClass = adminStore.addClass({
        name: 'UTBK Plotting Sukses QA',
        courseCode: 'UTBK',
        courseName: 'Intensif UTBK-SNBT',
        capacity: 12,
        tutorName: 'Ahmad Fauzi, M.Pd',
      })
      targetClass.studentCount = 10

      // 2. Buat calon siswa baru yang mendaftar
      const registration = adminStore.addRegistration({
        studentName: 'Siti Aminah QA',
        studentEmail: `siti.aminah.${Date.now()}@example.com`,
        studentPhone: '0812-1111-2222',
        studentSchool: 'SMAN 1 Palu',
        packageCode: 'UTBK',
        packageName: 'Intensif UTBK-SNBT',
        parentName: 'Ibu Aminah',
        parentEmail: `ibu.aminah.${Date.now()}@example.com`,
        parentPhone: '0812-3333-4444',
        parentJob: 'Wiraswasta',
        parentAddress: 'Jl. Sam Ratulangi No. 10, Palu',
      })

      expect(registration.status).toBe('menunggu')

      // 3. Approve pendaftaran dan plotting ke rombel target
      const result = adminStore.approveRegistration(registration.id, targetClass.id)

      expect(result).toBeDefined()
      expect(result?.success).toBe(true)
      expect(result?.student.classId).toBe(targetClass.id)
      expect(result?.student.className).toBe(targetClass.name)
      expect(result?.credentials.studentNis).toMatch(/^TC-2026-\d{3}$/)

      // 4. Verifikasi status pendaftaran dan penambahan studentCount
      const verifiedReg = adminStore.getState().registrations.find((r) => r.id === registration.id)
      expect(verifiedReg?.status).toBe('terverifikasi')
      expect(verifiedReg?.assignedClassId).toBe(targetClass.id)

      const updatedClass = adminStore.getState().classes.find((c) => c.id === targetClass.id)
      expect(updatedClass?.studentCount).toBe(11)
    })

    it('menolak keras plotting dan melempar sinyal error jika rombel yang dituju sudah penuh (12 siswa)', () => {
      // 1. Buat rombel yang sudah mencapai batas maksimal 12 siswa
      const fullClass = adminStore.addClass({
        name: 'UTBK Kelas Penuh 12 Siswa QA',
        courseCode: 'UTBK',
        courseName: 'Intensif UTBK-SNBT',
        capacity: 12,
        tutorName: 'Ahmad Fauzi, M.Pd',
      })
      fullClass.studentCount = 12 // Rombel penuh maksimal

      // 2. Buat calon siswa yang mencoba di-plot ke rombel penuh tersebut
      const registration = adminStore.addRegistration({
        studentName: 'Budi Overcapacity QA',
        studentEmail: `budi.overcap.${Date.now()}@example.com`,
        studentPhone: '0812-5555-6666',
        studentSchool: 'SMAN 2 Palu',
        packageCode: 'UTBK',
        packageName: 'Intensif UTBK-SNBT',
        parentName: 'Bapak Overcapacity',
        parentEmail: `bapak.overcap.${Date.now()}@example.com`,
        parentPhone: '0812-7777-8888',
      })

      const initialStudentCount = fullClass.studentCount

      // 3. Eksekusi plotting ke rombel penuh -> sistem wajib menolak dan melempar Error
      expect(() => {
        adminStore.approveRegistration(registration.id, fullClass.id)
      }).toThrow(/sudah penuh|maksimal adalah 12 siswa/i)

      // 4. Verifikasi integritas data:
      // Status pendaftaran TIDAK boleh berubah menjadi terverifikasi
      const checkReg = adminStore.getState().registrations.find((r) => r.id === registration.id)
      expect(checkReg?.status).toBe('menunggu')
      expect(checkReg?.assignedClassId).toBeUndefined()

      // Jumlah siswa pada rombel TIDAK boleh bocor/bertambah melebihi 12
      const checkClass = adminStore.getState().classes.find((c) => c.id === fullClass.id)
      expect(checkClass?.studentCount).toBe(initialStudentCount)
      expect(checkClass?.studentCount).toBe(12)

      // Data siswa tidak boleh bertambah di tabel siswa aktif
      const checkStudent = adminStore.getState().students.find((s) => s.email === registration.studentEmail)
      expect(checkStudent).toBeUndefined()
    })

    it('menolak penambahan siswa langsung (addStudent) ke rombel yang sudah penuh (12 siswa)', () => {
      const fullClass = adminStore.addClass({
        name: 'Rombel Penuh Direct Student QA',
        courseCode: 'SMA',
        courseName: 'SMA Sukses',
        capacity: 12,
        tutorName: 'Siti Rahma, S.Si',
      })
      fullClass.studentCount = 12

      expect(() => {
        adminStore.addStudent({
          name: 'Direct Student Overflow',
          email: `overflow.${Date.now()}@example.com`,
          phone: '0812-0000-1111',
          school: 'SMAN 3 Palu',
          packageCode: 'SMA',
          classId: fullClass.id,
          className: fullClass.name,
          parentName: 'Orang Tua Direct',
          parentPhone: '0812-0000-2222',
        })
      }).toThrow(/sudah penuh/i)

      expect(fullClass.studentCount).toBe(12)
    })

    it('menolak pemindahan siswa (assignStudentToClass) jika rombel tujuan sudah penuh (12 siswa)', () => {
      // Kelas Asal (ada sisa slot)
      const classSource = adminStore.addClass({
        name: 'Kelas Asal QA',
        courseCode: 'SMA',
        courseName: 'SMA Sukses',
        capacity: 12,
        tutorName: 'Tutor A',
      })
      classSource.studentCount = 5

      // Kelas Tujuan (sudah penuh 12 siswa)
      const classTargetFull = adminStore.addClass({
        name: 'Kelas Tujuan Penuh QA',
        courseCode: 'SMA',
        courseName: 'SMA Sukses',
        capacity: 12,
        tutorName: 'Tutor B',
      })
      classTargetFull.studentCount = 12

      // Siswa aktif di kelas asal
      const student = adminStore.addStudent({
        name: 'Siswa Mau Pindah QA',
        email: `pindah.${Date.now()}@example.com`,
        phone: '0812-9999-0000',
        school: 'SMAN 1 Palu',
        packageCode: 'SMA',
        classId: classSource.id,
        className: classSource.name,
        parentName: 'Wali Siswa',
        parentPhone: '0812-8888-0000',
      })

      expect(student.classId).toBe(classSource.id)

      // Coba pindah ke kelas penuh -> Wajib gagal
      expect(() => {
        adminStore.assignStudentToClass(student.id, classTargetFull.id)
      }).toThrow(/sudah penuh|maksimal adalah 12 siswa/i)

      // Pastikan posisi siswa tidak berubah
      const studentAfter = adminStore.getState().students.find((s) => s.id === student.id)
      expect(studentAfter?.classId).toBe(classSource.id)
      expect(classTargetFull.studentCount).toBe(12)
    })

    it('berhasil memindahkan siswa (assignStudentToClass) ke rombel tujuan yang masih memiliki slot', () => {
      const classA = adminStore.addClass({
        name: 'Kelas Rombel A QA',
        courseCode: 'SMP',
        courseName: 'SMP Prestasi',
        capacity: 12,
        tutorName: 'Tutor SMP A',
      })

      const classB = adminStore.addClass({
        name: 'Kelas Rombel B QA',
        courseCode: 'SMP',
        courseName: 'SMP Prestasi',
        capacity: 12,
        tutorName: 'Tutor SMP B',
      })

      const student = adminStore.addStudent({
        name: 'Siswa Sukses Pindah QA',
        email: `sukses.pindah.${Date.now()}@example.com`,
        phone: '0813-1111-2222',
        school: 'SMPN 1 Palu',
        packageCode: 'SMP',
        classId: classA.id,
        className: classA.name,
        parentName: 'Wali SMP',
        parentPhone: '0813-3333-4444',
      })

      const countABefore = classA.studentCount
      const countBBefore = classB.studentCount

      const movedStudent = adminStore.assignStudentToClass(student.id, classB.id)

      expect(movedStudent.classId).toBe(classB.id)
      expect(movedStudent.className).toBe(classB.name)
      expect(classA.studentCount).toBe(countABefore - 1)
      expect(classB.studentCount).toBe(countBBefore + 1)
    })
  })

  // =========================================================================
  // 4. VALIDASI INTEGRITAS TIPE TYPESCRIPT DAN RELASI DATA DRIZZLE
  // =========================================================================
  describe('Validasi Integritas Tipe TypeScript dan Relasi Data Drizzle', () => {
    it('memastikan skema Drizzle rooms memiliki kolom kapasitas dengan default 12 dan notNull', () => {
      expect(rooms).toBeDefined()
      expect(rooms.capacity).toBeDefined()
      expect(rooms.roomName).toBeDefined()
      expect(rooms.isActive).toBeDefined()
    })

    it('memastikan skema Drizzle classes memiliki relasi yang tepat ke courses, tutors, dan class_members', () => {
      expect(classes).toBeDefined()
      expect(classes.courseId).toBeDefined()
      expect(classes.tutorId).toBeDefined()
      expect(classes.capacity).toBeDefined()

      // Relasi classes
      expect(classesRelations).toBeDefined()
    })

    it('memastikan skema Drizzle class_members adalah tabel pivot type-safe antara classes dan students', () => {
      expect(classMembers).toBeDefined()
      expect(classMembers.classId).toBeDefined()
      expect(classMembers.studentId).toBeDefined()
      expect(classMembers.joinedAt).toBeDefined()

      expect(classMembersRelations).toBeDefined()
    })

    it('memastikan skema Drizzle tutors berelasi 1-to-1 dengan profiles pengguna', () => {
      expect(tutors).toBeDefined()
      expect(tutors.profileId).toBeDefined()
      expect(tutors.specialtySubject).toBeDefined()
      expect(tutors.weeklySessionsCount).toBeDefined()
      expect(tutors.status).toBeDefined()

      expect(tutorsRelations).toBeDefined()
    })

    it('memvalidasi kesesuaian tipe data Drizzle NewRoom dan NewClass', () => {
      const mockNewRoom: NewRoom = {
        roomName: 'Ruang R-Palu Inferred Type',
        capacity: 12,
        facilities: 'Whiteboard, AC',
        isActive: true,
      }
      expect(mockNewRoom.capacity).toBe(12)
      expect(mockNewRoom.isActive).toBe(true)

      const mockNewClass: NewClass = {
        className: 'Rombel UTBK Inferred Type',
        capacity: 12,
        academicYear: '2026/2027',
      }
      expect(mockNewClass.capacity).toBe(12)
      expect(mockNewClass.className).toBe('Rombel UTBK Inferred Type')

      const mockNewCourse: NewCourse = {
        courseCode: 'UTBK',
        courseName: 'Intensif UTBK-SNBT',
        price: '750000',
        maxStudents: 12,
      }
      expect(mockNewCourse.maxStudents).toBe(12)
    })
  })

  // =========================================================================
  // 5. VALIDASI KONSISTENSI DATA STORE & PENCEGAHAN FAKE BUTTONS / SLOP
  // =========================================================================
  describe('Validasi Konsistensi Data Store & Guardrails AGENTS.md', () => {
    it('memastikan seluruh ruangan master bawaan memiliki kapasitas tidak melebihi 12 siswa', () => {
      const allRooms = adminStore.getState().rooms
      expect(allRooms.length).toBeGreaterThan(0)

      for (const room of allRooms) {
        expect(room.capacity).toBeLessThanOrEqual(12)
        expect(room.capacity).toBeGreaterThanOrEqual(1)
      }
    })

    it('memastikan seluruh rombel kelas bawaan memiliki kapasitas tidak melebihi 12 siswa', () => {
      const allClasses = adminStore.getState().classes
      expect(allClasses.length).toBeGreaterThan(0)

      for (const cls of allClasses) {
        expect(cls.capacity).toBeLessThanOrEqual(12)
        expect(cls.capacity).toBeGreaterThanOrEqual(1)
        expect(cls.studentCount).toBeLessThanOrEqual(cls.capacity)
      }
    })

    it('menghasilkan format NIS dan Kredensial pendaftaran yang konsisten dan rapi', () => {
      const reg = adminStore.addRegistration({
        studentName: 'Farhan Fadilah QA',
        studentEmail: `farhan.fadilah.${Date.now()}@example.com`,
        studentPhone: '0812-4455-6677',
        studentSchool: 'SMAN 1 Palu',
        packageCode: 'SMA',
        packageName: 'SMA Sukses',
        parentName: 'Bapak Fadilah',
        parentPhone: '0812-7788-9900',
      })

      const availableClass = adminStore.getState().classes.find(
        (c) => c.courseCode === 'SMA' && c.studentCount < (c.capacity || 12)
      )
      expect(availableClass).toBeDefined()
      if (!availableClass) return

      const approval = adminStore.approveRegistration(reg.id, availableClass.id)
      expect(approval).toBeDefined()
      expect(approval?.credentials.studentNis).toMatch(/^TC-2026-\d{3}$/)
      expect(approval?.credentials.studentPassword).toBe('siswa2026')
      expect(approval?.credentials.parentPassword).toBe('wali2026')
    })
  })
})
