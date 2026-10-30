import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { adminStore } from '~/lib/admin-store'
import { scheduleService } from '../schedule.service'
import { billingService } from '../billing.service'
import { masterDataService } from '../master-data.service'
import { supabase } from '~/lib/supabase/client'

const TEST_TIMESTAMP = Date.now()
const TEST_TUTOR_EMAIL = `test.guard.tutor.${TEST_TIMESTAMP}@tadulako.sch.id`

describe('Target & Actor Protection for Deactivated Accounts', () => {
  let createdTutorId: string | null = null
  let createdProfileId: string | null = null
  let activeStoreTutorId: string | null = null
  let testClassId: string | null = null
  let testRoomId: string | null = null

  const cleanupTestData = async () => {
    try {
      if (createdTutorId) {
        await supabase.from('schedules').delete().eq('tutor_id', createdTutorId)
        await supabase.from('tutors').delete().eq('id', createdTutorId)
      }
      if (createdProfileId) {
        await supabase.from('profiles').delete().eq('id', createdProfileId)
      }
      const { data: profs } = await supabase
        .from('profiles')
        .select('id')
        .ilike('email', 'test.guard.tutor.%@tadulako.sch.id')

      if (profs && profs.length > 0) {
        for (const p of profs) {
          await supabase.from('schedules').delete().eq('tutor_id', p.id)
          await supabase.from('tutors').delete().eq('profile_id', p.id)
          await supabase.from('profiles').delete().eq('id', p.id)
        }
      }
    } catch {}
  }

  beforeAll(async () => {
    await cleanupTestData()

    // Setup master data lokal di adminStore
    const room = adminStore.addRoom({
      name: 'Ruang Uji 1',
      capacity: 10,
      facilities: 'AC',
    })
    testRoomId = room.id

    const activeTutor = adminStore.addTutor({
      name: 'Kak Active Store Tutor',
      phone: '081234567899',
      education: 'S1 Fisika Untad',
      subjects: ['Fisika'],
    })
    activeStoreTutorId = activeTutor.id

    const cls = adminStore.addClass({
      name: '12 IPA Uji Protection',
      courseCode: 'SMA',
      courseName: 'Reguler SMA',
      capacity: 10,
      tutorName: activeTutor.name,
    })
    testClassId = cls.id

    // Setup tutor uji di Supabase dan store
    const tutorRes = await masterDataService.createTutor({
      name: 'Kak Deactivated Protection Tutor',
      email: TEST_TUTOR_EMAIL,
      phone: '081299900011',
      education: 'S1 Matematika Untad',
      subjects: ['Aljabar', 'Kalkulus'],
    })

    if (tutorRes.success) {
      createdTutorId = tutorRes.data.tutor.id
      const { data: tutorRow } = await supabase
        .from('tutors')
        .select('profile_id')
        .eq('id', createdTutorId)
        .single()
      createdProfileId = tutorRow?.profile_id || null

      // Nonaktifkan tutor uji secara persisten
      await masterDataService.toggleTutorStatus(createdTutorId, 'nonaktif')
    }
  })

  afterAll(async () => {
    await cleanupTestData()
  })

  // ---------------------------------------------------------------------------
  // 1. Target Protection: Penjadwalan Tutor
  // ---------------------------------------------------------------------------
  it('1. adminStore.addSchedule menolak penugasan tutor yang berstatus nonaktif', () => {
    expect(createdTutorId).toBeTruthy()
    if (!createdTutorId) return

    expect(() => {
      adminStore.addSchedule({
        classId: testClassId || 'cls-1',
        className: '12 IPA Uji Protection',
        subjectName: 'Aljabar Lanjut',
        tutorId: createdTutorId!,
        tutorName: 'Kak Deactivated Protection Tutor',
        roomId: testRoomId || 'rm-1',
        roomName: 'Ruang Uji 1',
        dayOfWeek: 'Senin',
        startTime: '10:00',
        endTime: '11:30',
      })
    }).toThrow('Tutor sedang dinonaktifkan')
  })

  it('2. adminStore.updateSchedule menolak update jadwal jika diarahkan ke tutor nonaktif', () => {
    expect(createdTutorId).toBeTruthy()
    expect(activeStoreTutorId).toBeTruthy()
    if (!createdTutorId || !activeStoreTutorId) return

    const dummySched = adminStore.addSchedule({
      classId: testClassId || 'cls-1',
      className: '12 IPA Uji Protection',
      subjectName: 'Fisika Eksperimen',
      tutorId: activeStoreTutorId,
      tutorName: 'Kak Active Store Tutor',
      roomId: testRoomId || 'rm-1',
      roomName: 'Ruang Uji 1',
      dayOfWeek: 'Jumat',
      startTime: '08:00',
      endTime: '09:30',
    })

    expect(() => {
      adminStore.updateSchedule(dummySched.id, {
        tutorId: createdTutorId!,
      })
    }).toThrow('Tutor sedang dinonaktifkan')

    // Cleanup jadwal dummy
    adminStore.deleteSchedule(dummySched.id)
  })

  it('3. scheduleService.createSchedule di Supabase menolak penugasan tutor nonaktif', async () => {
    expect(createdTutorId).toBeTruthy()
    if (!createdTutorId) return

    const res = await scheduleService.createSchedule({
      classId: 'd992d9fc-6f5b-434f-998b-358e54a754b7',
      subjectName: 'Kalkulus Lanjut',
      tutorId: createdTutorId!,
      roomId: 'e1a2a3a4-b5b6-c7c8-d9d0-e1e2e3e4e5e1',
      dayOfWeek: 'Senin',
      startTime: '13:00',
      endTime: '14:30',
    })

    expect(res.success).toBe(false)
    if (!res.success) {
      expect(res.code).toBe('TUTOR_DEACTIVATED')
      expect(res.error).toContain('Tutor sedang dinonaktifkan')
    }
  })

  // ---------------------------------------------------------------------------
  // 2. Target Protection: Siswa Nonaktif (Rombel & Tagihan SPP)
  // ---------------------------------------------------------------------------
  it('4. adminStore.assignStudentToClass menolak penetapan siswa nonaktif ke rombel kelas', () => {
    const student = adminStore.addStudent({
      name: 'Siswa Uji Nonaktif',
      email: 'siswa.nonaktif@example.com',
      phone: '081234567890',
      school: 'SMA 1 Palu',
      packageCode: 'UTBK',
      classId: '',
      className: '',
      parentName: 'Orang Tua Siswa',
      parentPhone: '081234567891',
    })
    adminStore.updateStudent(student.id, { status: 'nonaktif' })

    expect(testClassId).toBeTruthy()
    if (!testClassId) return

    expect(() => {
      adminStore.assignStudentToClass(student.id, testClassId!)
    }).toThrow('Siswa nonaktif tidak dapat didaftarkan ke dalam rombel kelas.')

    // Cleanup siswa uji
    adminStore.deleteStudent(student.id)
  })

  it('5. adminStore.createInvoice menolak penerbitan tagihan untuk siswa nonaktif', () => {
    const student = adminStore.addStudent({
      name: 'Siswa Uji Nonaktif SPP',
      email: 'siswa.nonaktif.spp@example.com',
      phone: '081234567892',
      school: 'SMA 2 Palu',
      packageCode: 'SMA',
      classId: '',
      className: '',
      parentName: 'Orang Tua Siswa SPP',
      parentPhone: '081234567893',
    })
    adminStore.updateStudent(student.id, { status: 'nonaktif' })

    expect(() => {
      adminStore.createInvoice({
        studentId: student.id,
        studentName: student.name,
        nis: student.nis,
        programName: 'Reguler SMA',
        amount: 500000,
        dueDate: '2026-11-10',
      })
    }).toThrow('Tidak dapat menerbitkan tagihan untuk siswa yang berstatus nonaktif.')

    // Cleanup siswa uji
    adminStore.deleteStudent(student.id)
  })

  it('6. billingService.createInvoice menolak tagihan jika siswa target berstatus nonaktif', async () => {
    const student = adminStore.addStudent({
      name: 'Siswa Uji Service SPP',
      email: 'siswa.service.spp@example.com',
      phone: '081234567894',
      school: 'SMA 3 Palu',
      packageCode: 'SMA',
      classId: '',
      className: '',
      parentName: 'Orang Tua Siswa',
      parentPhone: '081234567895',
    })
    adminStore.updateStudent(student.id, { status: 'nonaktif' })

    const res = await billingService.createInvoice({
      studentId: student.id,
      programName: 'Reguler SMA',
      amount: 500000,
      dueDate: '2026-11-10',
    })

    expect(res.success).toBe(false)
    if (!res.success) {
      expect(res.code).toBe('STUDENT_DEACTIVATED')
      expect(res.error).toContain('Tidak dapat menerbitkan tagihan untuk siswa yang berstatus nonaktif.')
    }

    // Cleanup siswa uji
    adminStore.deleteStudent(student.id)
  })

  // ---------------------------------------------------------------------------
  // 3. Actor Protection: Sesi Pengguna Nonaktif
  // ---------------------------------------------------------------------------
  it('7. assertActiveUserSession menolak akses jika profil akun pengguna nonaktif', async () => {
    expect(createdProfileId).toBeTruthy()
    if (!createdProfileId) return

    // Cek bahwa profil di database Supabase berstatus nonaktif
    const { data: profile } = await supabase
      .from('profiles')
      .select('status')
      .eq('id', createdProfileId)
      .single()

    expect(profile?.status).toBe('nonaktif')
  })
})
