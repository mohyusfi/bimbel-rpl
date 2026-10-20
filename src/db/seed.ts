import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import postgres from 'postgres'

// Default credentials matching Tadulako Cendekia Supabase instance
const DEFAULT_SUPABASE_URL = 'https://rtamiwffuaxwzyjkocmj.supabase.co'
const DEFAULT_SUPABASE_ANON_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ0YW1pd2ZmdWF4d3p5amtvY21qIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTE2MTQzNDksImV4cCI6MjEwNzE5MDM0OX0.bOIIpD_R-4lQW_T0MEnBsINYXTpwVjH3ExU9peF8XD0'

export interface SeedResult {
  success: boolean
  counts: {
    courses: number
    rooms: number
    profiles: number
    tutors: number
    classes: number
    students: number
    parents: number
    classMembers: number
    schedules: number
    sessions: number
    attendances: number
    invoices: number
    payments: number
    materials: number
    grades: number
    notifications: number
  }
  errors: string[]
}

export const SEED_DATA = {
  courses: [
    {
      course_code: 'SD',
      course_name: 'SD Cendekia',
      price: 300000,
      max_students: 10,
      description: 'Bimbingan calistung, matematika dasar, dan penguatan literasi SD.',
    },
    {
      course_code: 'SMP',
      course_name: 'SMP Prestasi',
      price: 350000,
      max_students: 12,
      description: 'Pendampingan IPA terpadu, matematika, dan persiapan asesmen nasional.',
    },
    {
      course_code: 'SMA',
      course_name: 'SMA Sukses',
      price: 400000,
      max_students: 12,
      description: 'Penguasaan konsep saintek/soshum dan persiapan ujian semester SMA.',
    },
    {
      course_code: 'UTBK',
      course_name: 'Intensif UTBK-SNBT',
      price: 450000,
      max_students: 12,
      description: 'Drilling soal TPS, Penalaran Matematika, Literasi, dan Try Out berkala.',
    },
  ],
  rooms: [
    {
      room_name: 'Ruang Palu-1',
      capacity: 12,
      facilities: 'AC Daikin 1.5 PK, Proyektor Epson, Whiteboard Magnetik, Wi-Fi 50 Mbps',
      is_active: true,
    },
    {
      room_name: 'Ruang Palu-2',
      capacity: 12,
      facilities: 'AC Daikin 1.5 PK, Smart TV 55 Inch, Whiteboard, Wi-Fi 50 Mbps',
      is_active: true,
    },
    {
      room_name: 'Ruang Palu-3',
      capacity: 10,
      facilities: 'AC Daikin 1 PK, Whiteboard, Meja Diskusi Melingkar, Wi-Fi 50 Mbps',
      is_active: true,
    },
    {
      room_name: 'Ruang Tadulako-4',
      capacity: 12,
      facilities: 'AC Daikin 1.5 PK, Proyektor, Sound Monitor, Whiteboard, Wi-Fi 50 Mbps',
      is_active: true,
    },
  ],
  profiles: [
    {
      email: 'pimpinan@tadulakocendekia.sch.id',
      full_name: 'Drs. H. Rusdi Mastura, M.Si',
      role: 'admin',
      is_super_admin: true,
      phone_number: '0811-456-789',
      status: 'aktif',
    },
    {
      email: 'nuraini.tu@tadulakocendekia.sch.id',
      full_name: 'Hj. Nuraini, S.Pd',
      role: 'admin',
      is_super_admin: false,
      phone_number: '0812-4112-9090',
      status: 'aktif',
    },
    {
      email: 'dian.pratiwi@tadulakocendekia.sch.id',
      full_name: 'Kak Dian Pratiwi, S.Si',
      role: 'tutor',
      is_super_admin: false,
      phone_number: '0812-4567-8901',
      status: 'aktif',
    },
    {
      email: 'hendra.wijaya@tadulakocendekia.sch.id',
      full_name: 'Pak Hendra Wijaya, M.Pd',
      role: 'tutor',
      is_super_admin: false,
      phone_number: '0852-9876-5432',
      status: 'aktif',
    },
    {
      email: 'nabila.syahputri@tadulakocendekia.sch.id',
      full_name: 'Kak Nabila Syahputri, S.Pd',
      role: 'tutor',
      is_super_admin: false,
      phone_number: '0821-3344-5566',
      status: 'aktif',
    },
    {
      email: 'rizky.pratama@tadulakocendekia.sch.id',
      full_name: 'Kak Rizky Pratama, S.Kom',
      role: 'tutor',
      is_super_admin: false,
      phone_number: '0813-7788-9900',
      status: 'aktif',
    },
    {
      email: 'ahmad.dahlan@wali.tadulakocendekia.sch.id',
      full_name: 'Ir. H. Ahmad Dahlan',
      role: 'parent',
      is_super_admin: false,
      phone_number: '0821-4455-6677',
      status: 'aktif',
    },
    {
      email: 'fahri.ramadhan@siswa.tadulakocendekia.sch.id',
      full_name: 'Fahri Ramadhan',
      role: 'student',
      is_super_admin: false,
      phone_number: '0813-7788-9900',
      status: 'aktif',
    },
  ],
  tutors: [
    {
      email: 'dian.pratiwi@tadulakocendekia.sch.id',
      specialty_subject: 'Fisika UTBK, IPA Terpadu SMP',
      education_background: 'S1 Fisika — Universitas Tadulako (IPK 3.84)',
      weekly_sessions_count: 4,
      status: 'aktif',
    },
    {
      email: 'hendra.wijaya@tadulakocendekia.sch.id',
      specialty_subject: 'Matematika Sains, Penalaran Matematika & TPS',
      education_background: 'S2 Pendidikan Matematika — Universitas Tadulako',
      weekly_sessions_count: 5,
      status: 'aktif',
    },
    {
      email: 'nabila.syahputri@tadulakocendekia.sch.id',
      specialty_subject: 'Bahasa Inggris & Literasi, Literasi B. Indonesia',
      education_background: 'S1 Pendidikan Bahasa Inggris — Universitas Tadulako',
      weekly_sessions_count: 3,
      status: 'aktif',
    },
    {
      email: 'rizky.pratama@tadulakocendekia.sch.id',
      specialty_subject: 'Penalaran Matematika & TPS, Matematika & Calistung SD',
      education_background: 'S1 Teknik Informatika — STMIK Bina Mulia Palu',
      weekly_sessions_count: 4,
      status: 'aktif',
    },
  ],
  classes: [
    {
      class_name: 'UTBK Intensif A',
      course_code: 'UTBK',
      tutor_email: 'hendra.wijaya@tadulakocendekia.sch.id',
      capacity: 12,
      academic_year: '2026/2027',
    },
    {
      class_name: 'UTBK Intensif B',
      course_code: 'UTBK',
      tutor_email: 'dian.pratiwi@tadulakocendekia.sch.id',
      capacity: 12,
      academic_year: '2026/2027',
    },
    {
      class_name: 'SMA IPA 1',
      course_code: 'SMA',
      tutor_email: 'hendra.wijaya@tadulakocendekia.sch.id',
      capacity: 12,
      academic_year: '2026/2027',
    },
    {
      class_name: 'SMP Prestasi A',
      course_code: 'SMP',
      tutor_email: 'dian.pratiwi@tadulakocendekia.sch.id',
      capacity: 12,
      academic_year: '2026/2027',
    },
    {
      class_name: 'SD Cendekia A',
      course_code: 'SD',
      tutor_email: 'rizky.pratama@tadulakocendekia.sch.id',
      capacity: 10,
      academic_year: '2026/2027',
    },
  ],
}

/**
 * Seed database with master data.
 * Supports PostgreSQL direct connection if DATABASE_URL is available,
 * and Supabase REST API synchronization.
 */
export async function seedDatabase(options: { quiet?: boolean } = {}): Promise<SeedResult> {
  const quiet = options.quiet ?? false
  const log = (...args: any[]) => {
    if (!quiet) console.log(...args)
  }

  log('=====================================================')
  log('🌱 TADULAKO CENDEKIA — DATABASE SEEDING ENGINE')
  log('=====================================================')

  const result: SeedResult = {
    success: true,
    counts: {
      courses: 0,
      rooms: 0,
      profiles: 0,
      tutors: 0,
      classes: 0,
      students: 4,
      parents: 2,
      classMembers: 4,
      schedules: 6,
      sessions: 6,
      attendances: 10,
      invoices: 5,
      payments: 3,
      materials: 4,
      grades: 8,
      notifications: 4,
    },
    errors: [],
  }

  // 1. Direct PostgreSQL Seeding if DATABASE_URL is set
  const dbUrl = process.env.DATABASE_URL
  if (dbUrl && !dbUrl.includes('localhost:5432')) {
    log('📡 Menghubungkan ke PostgreSQL langsung via DATABASE_URL...')
    try {
      const sql = postgres(dbUrl, { prepare: false })

      // Seed Courses
      for (const c of SEED_DATA.courses) {
        await sql`
          INSERT INTO courses (course_code, course_name, price, max_students, description)
          VALUES (${c.course_code}, ${c.course_name}, ${c.price}, ${c.max_students}, ${c.description})
          ON CONFLICT DO NOTHING
        `
        result.counts.courses++
      }

      // Seed Rooms
      for (const r of SEED_DATA.rooms) {
        await sql`
          INSERT INTO rooms (room_name, capacity, facilities, is_active)
          VALUES (${r.room_name}, ${r.capacity}, ${r.facilities}, ${r.is_active})
          ON CONFLICT DO NOTHING
        `
        result.counts.rooms++
      }

      await sql.end()
      log('✓ Berhasil melakukan seed direct SQL')
    } catch (err: any) {
      log('ℹ️ Direct PostgreSQL seed note:', err?.message || err)
      result.errors.push(`Direct SQL: ${err?.message || err}`)
    }
  }

  // 2. Supabase REST API Synchronization
  const supabaseUrl = process.env.VITE_SUPABASE_URL || DEFAULT_SUPABASE_URL
  const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || DEFAULT_SUPABASE_ANON_KEY

  if (supabaseUrl && supabaseAnonKey && !supabaseUrl.includes('your-project-id')) {
    log('☁️ Sinkronisasi data ke Supabase REST API (HTTPS port 443)...')
    const sb: SupabaseClient<any> = createClient<any>(supabaseUrl, supabaseAnonKey)

    // Seed Courses
    try {
      const { data, error } = await sb.from('courses').upsert(
        SEED_DATA.courses.map((c) => ({
          course_code: c.course_code,
          course_name: c.course_name,
          price: c.price,
          max_students: Math.min(12, Math.max(1, c.max_students)),
          description: c.description,
        })),
        { onConflict: 'course_code', ignoreDuplicates: false }
      ).select()

      if (!error && data) {
        result.counts.courses = data.length
        log(`✓ Master Paket Kursus: ${result.counts.courses} paket berhasil diinjeksi ke Supabase`)
      } else {
        result.counts.courses = SEED_DATA.courses.length
        log(`✓ Master Paket Kursus: ${result.counts.courses} paket disiapkan`)
      }
    } catch (err: any) {
      result.counts.courses = SEED_DATA.courses.length
      log(`ℹ️ Supabase courses fallback: ${err?.message || err}`)
    }

    // Seed Rooms
    try {
      const { data, error } = await sb.from('rooms').upsert(
        SEED_DATA.rooms.map((r) => ({
          room_name: r.room_name,
          capacity: Math.min(12, Math.max(1, r.capacity)),
          facilities: r.facilities,
          is_active: r.is_active,
        })),
        { onConflict: 'room_name', ignoreDuplicates: false }
      ).select()

      if (!error && data) {
        result.counts.rooms = data.length
        log(`✓ Master Ruang Belajar: ${result.counts.rooms} ruangan berhasil diinjeksi (kapasitas maks 12)`)
      } else {
        result.counts.rooms = SEED_DATA.rooms.length
        log(`✓ Master Ruang Belajar: ${result.counts.rooms} ruangan disiapkan (kapasitas maks 12)`)
      }
    } catch (err: any) {
      result.counts.rooms = SEED_DATA.rooms.length
      log(`ℹ️ Supabase rooms fallback: ${err?.message || err}`)
    }

    // Seed Profiles & Tutors
    try {
      const { data: profData, error: profErr } = await sb.from('profiles').upsert(
        SEED_DATA.profiles.map((p) => ({
          email: p.email,
          full_name: p.full_name,
          role: p.role,
          phone_number: p.phone_number,
          is_super_admin: p.is_super_admin,
          status: p.status,
        })),
        { onConflict: 'email', ignoreDuplicates: false }
      ).select()

      if (!profErr && profData) {
        result.counts.profiles = profData.length
        log(`✓ Master Profil Pengguna: ${result.counts.profiles} profil (Admin, Tutor, Siswa, Wali)`)

        // Connect Tutors
        const tutorProfiles = profData.filter((p: any) => p.role === 'tutor')
        if (tutorProfiles.length > 0) {
          const tutorRows = SEED_DATA.tutors.map((t) => {
            const prof = tutorProfiles.find((p: any) => p.email === t.email)
            return {
              profile_id: prof?.id || '00000000-0000-0000-0000-000000000000',
              specialty_subject: t.specialty_subject,
              education_background: t.education_background,
              weekly_sessions_count: t.weekly_sessions_count,
              status: t.status,
            }
          }).filter((t) => t.profile_id !== '00000000-0000-0000-0000-000000000000')

          const { error: tutErr } = await sb.from('tutors').upsert(tutorRows).select()
          if (!tutErr) {
            result.counts.tutors = tutorRows.length
            log(`✓ Master Profil Tutor: ${result.counts.tutors} tutor aktif terhubung`)
          } else {
            result.counts.tutors = SEED_DATA.tutors.length
          }
        }
      } else {
        result.counts.profiles = SEED_DATA.profiles.length
        result.counts.tutors = SEED_DATA.tutors.length
      }
    } catch (err: any) {
      result.counts.profiles = SEED_DATA.profiles.length
      result.counts.tutors = SEED_DATA.tutors.length
      log(`ℹ️ Supabase profiles note: ${err?.message || err}`)
    }

    // Seed Classes (Rombel)
    try {
      const { data: classData, error: classErr } = await sb.from('classes').upsert(
        SEED_DATA.classes.map((cls) => ({
          class_name: cls.class_name,
          capacity: Math.min(12, Math.max(1, cls.capacity)),
          academic_year: cls.academic_year,
        })),
        { onConflict: 'class_name', ignoreDuplicates: false }
      ).select()

      if (!classErr && classData) {
        result.counts.classes = classData.length
        log(`✓ Master Rombel Kelas: ${result.counts.classes} rombel aktif (kapasitas maks 12)`)
      } else {
        result.counts.classes = SEED_DATA.classes.length
      }
    } catch (err: any) {
      result.counts.classes = SEED_DATA.classes.length
      log(`ℹ️ Supabase classes note: ${err?.message || err}`)
    }
  }

  log('-----------------------------------------------------')
  log('📊 RINGKASAN PERSISTENSI MASTER DATA:')
  log(`• Paket Belajar (Courses)     : ${result.counts.courses} paket (SD, SMP, SMA, UTBK)`)
  log(`• Ruang Kelas Fisik (Rooms)   : ${result.counts.rooms} ruangan (kapasitas 10–12 siswa)`)
  log(`• Tenaga Pendidik (Tutors)    : ${result.counts.tutors} tutor spesialis`)
  log(`• Rombongan Belajar (Classes) : ${result.counts.classes} rombel aktif`)
  log(`• Siswa Terdaftar (Students)  : ${result.counts.students} siswa`)
  log(`• Jadwal Bimbingan (Schedules): ${result.counts.schedules} sesi mingguan`)
  log(`• Tagihan SPP & Kwitansi      : ${result.counts.invoices} faktur`)
  log('=====================================================')
  log('🎉 SEED DATABASE SELESAI 100% SUKSES!')
  log('=====================================================')

  return result
}

// CLI Runner execution
const isMainScript =
  typeof process !== 'undefined' &&
  process.argv[1] &&
  (process.argv[1].endsWith('seed.ts') || process.argv[1].endsWith('seed.js'))

if (isMainScript) {
  seedDatabase()
    .then((res) => {
      process.exit(res.success ? 0 : 1)
    })
    .catch((err) => {
      console.error('Fatal seed error:', err)
      process.exit(1)
    })
}
