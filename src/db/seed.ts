import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://rtamiwffuaxwzyjkocmj.supabase.co'
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || ''

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Supabase URL atau Anon Key tidak ditemukan di environment variable.')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function runSeed() {
  console.log('🌱 [Tiket 01] Memulai Seeding Master Data ke Supabase...')

  // 1. Login sebagai Super Admin untuk bypass RLS
  const adminEmail = 'pimpinan@tadulakocendekia.sch.id'
  const adminPassword = 'password123'
  console.log(`🔐 Mengautentikasi sebagai Super Admin (${adminEmail})...`)

  const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
    email: adminEmail,
    password: adminPassword,
  })

  if (authError || !authData?.session) {
    console.error('❌ Gagal login sebagai Super Admin:', authError?.message)
    process.exit(1)
  }
  console.log('✅ Berhasil terautentikasi sebagai Super Admin.')

  // 2. Seed Courses (Paket Bimbingan Belajar)
  console.log('📦 Menyuntikkan master data courses (Paket Belajar)...')
  const initialCourses = [
    {
      course_code: 'SD',
      course_name: 'SD Cendekia',
      price: 300000,
      description: 'Bimbingan calistung, matematika dasar, dan penguatan literasi SD.',
      max_students: 10,
    },
    {
      course_code: 'SMP',
      course_name: 'SMP Prestasi',
      price: 350000,
      description: 'Pendampingan IPA terpadu, matematika, dan persiapan asesmen nasional.',
      max_students: 12,
    },
    {
      course_code: 'SMA',
      course_name: 'SMA Sukses',
      price: 400000,
      description: 'Penguasaan konsep saintek/soshum dan persiapan ujian semester SMA.',
      max_students: 12,
    },
    {
      course_code: 'UTBK',
      course_name: 'Intensif UTBK-SNBT',
      price: 450000,
      description: 'Drilling soal TPS, Penalaran Matematika, Literasi, dan Try Out berkala.',
      max_students: 12,
    },
  ]

  const courseMap = new Map<string, string>()

  for (const c of initialCourses) {
    const { data: existing } = await supabase
      .from('courses')
      .select('id, course_code')
      .eq('course_code', c.course_code)
      .maybeSingle()

    if (existing) {
      courseMap.set(c.course_code, existing.id)
      console.log(`  ↪ Course ${c.course_code} sudah ada: ${existing.id}`)
    } else {
      const { data: inserted, error } = await supabase
        .from('courses')
        .insert(c)
        .select('id, course_code')
        .single()
      if (error) {
        console.error(`  ❌ Gagal insert course ${c.course_code}:`, error.message)
      } else if (inserted) {
        courseMap.set(c.course_code, inserted.id)
        console.log(`  ✅ Course ${c.course_code} berhasil dibuat: ${inserted.id}`)
      }
    }
  }

  // 3. Seed Rooms (Ruangan Kelas Berkapasitas 10-12)
  console.log('🏫 Menyuntikkan master data rooms (Ruangan Kelas)...')
  const initialRooms = [
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
  ]

  for (const r of initialRooms) {
    const { data: existing } = await supabase
      .from('rooms')
      .select('id, room_name')
      .eq('room_name', r.room_name)
      .maybeSingle()

    if (existing) {
      console.log(`  ↪ Room ${r.room_name} sudah ada: ${existing.id}`)
    } else {
      const { data: inserted, error } = await supabase.from('rooms').insert(r).select('id').single()
      if (error) {
        console.error(`  ❌ Gagal insert room ${r.room_name}:`, error.message)
      } else {
        console.log(`  ✅ Room ${r.room_name} berhasil dibuat: ${inserted?.id}`)
      }
    }
  }

  // 4. Seed Profiles & Tutors (Pengajar)
  console.log('👨‍🏫 Menyuntikkan master data profiles & tutors...')
  const initialTutorData = [
    {
      profileId: '1dc75962-7771-4c58-85af-5ce40c2eabae', // Dian Pratiwi (existing)
      email: 'dian.pratiwi@tadulakocendekia.sch.id',
      fullName: 'Kak Dian Pratiwi, S.Si',
      phone: '0812-4567-8901',
      education: 'S1 Fisika — Universitas Tadulako (IPK 3.84)',
      specialty: 'Fisika UTBK, IPA Terpadu SMP',
      weeklySessions: 4,
    },
    {
      profileId: '2ec86073-8882-5d69-96ba-6df51d3fbcb1',
      email: 'hendra.wijaya@tutor.tadulakocendekia.sch.id',
      fullName: 'Pak Hendra Wijaya, M.Pd',
      phone: '0852-9876-5432',
      education: 'S2 Pendidikan Matematika — Universitas Tadulako',
      specialty: 'Matematika Sains, Penalaran Matematika & TPS',
      weeklySessions: 5,
    },
    {
      profileId: '3fd97184-9993-6e70-a7cb-7ea62e4acdc2',
      email: 'nabila.syahputri@tutor.tadulakocendekia.sch.id',
      fullName: 'Kak Nabila Syahputri, S.Pd',
      phone: '0821-3344-5566',
      education: 'S1 Pendidikan Bahasa Inggris — Universitas Tadulako',
      specialty: 'Bahasa Inggris & Literasi, Literasi B. Indonesia',
      weeklySessions: 3,
    },
    {
      profileId: '4ae08295-aaaa-7f81-b8dc-8fb73f5bedd3',
      email: 'rizky.pratama@tutor.tadulakocendekia.sch.id',
      fullName: 'Kak Rizky Pratama, S.Kom',
      phone: '0813-7788-9900',
      education: 'S1 Teknik Informatika — STMIK Bina Mulia Palu',
      specialty: 'Penalaran Matematika & TPS, Matematika & Calistung SD',
      weeklySessions: 4,
    },
  ]

  const tutorMap = new Map<string, string>()

  for (const t of initialTutorData) {
    // Pastikan profile ada
    const { data: existingProfile } = await supabase
      .from('profiles')
      .select('id, full_name')
      .eq('id', t.profileId)
      .maybeSingle()

    if (!existingProfile) {
      const { error: profErr } = await supabase.from('profiles').insert({
        id: t.profileId,
        email: t.email,
        full_name: t.fullName,
        role: 'tutor',
        phone_number: t.phone,
        status: 'aktif',
      })
      if (profErr) {
        console.warn(`  ⚠️ Profile ${t.fullName} notice:`, profErr.message)
      } else {
        console.log(`  ✅ Profile tutor ${t.fullName} dibuat.`)
      }
    }

    // Pastikan tutor record ada
    const { data: existingTutor } = await supabase
      .from('tutors')
      .select('id, profile_id')
      .eq('profile_id', t.profileId)
      .maybeSingle()

    if (existingTutor) {
      tutorMap.set(t.fullName, existingTutor.id)
      console.log(`  ↪ Tutor ${t.fullName} sudah ada: ${existingTutor.id}`)
    } else {
      const { data: insertedTutor, error: tutErr } = await supabase
        .from('tutors')
        .insert({
          profile_id: t.profileId,
          specialty_subject: t.specialty,
          education_background: t.education,
          weekly_sessions_count: t.weeklySessions,
          status: 'aktif',
        })
        .select('id')
        .single()

      if (tutErr) {
        console.error(`  ❌ Gagal insert tutor ${t.fullName}:`, tutErr.message)
      } else if (insertedTutor) {
        tutorMap.set(t.fullName, insertedTutor.id)
        console.log(`  ✅ Tutor ${t.fullName} berhasil dibuat: ${insertedTutor.id}`)
      }
    }
  }

  // 5. Seed Classes (Rombel Kelas)
  console.log('👥 Menyuntikkan master data classes (Rombel Kelas)...')
  const initialClasses = [
    {
      id: 'c1000000-0000-0000-0000-000000000001',
      class_name: 'UTBK Intensif A',
      course_id: courseMap.get('UTBK'),
      tutor_id: tutorMap.get('Kak Dian Pratiwi, S.Si'),
      academic_year: '2026/2027',
      capacity: 12,
    },
    {
      id: 'c1000000-0000-0000-0000-000000000002',
      class_name: 'UTBK Intensif B',
      course_id: courseMap.get('UTBK'),
      tutor_id: tutorMap.get('Pak Hendra Wijaya, M.Pd'),
      academic_year: '2026/2027',
      capacity: 12,
    },
    {
      id: 'c1000000-0000-0000-0000-000000000003',
      class_name: 'SMA IPA 1',
      course_id: courseMap.get('SMA'),
      tutor_id: tutorMap.get('Pak Hendra Wijaya, M.Pd'),
      academic_year: '2026/2027',
      capacity: 12,
    },
    {
      id: 'c1000000-0000-0000-0000-000000000004',
      class_name: 'SMP Prestasi A',
      course_id: courseMap.get('SMP'),
      tutor_id: tutorMap.get('Kak Dian Pratiwi, S.Si'),
      academic_year: '2026/2027',
      capacity: 12,
    },
    {
      id: 'c1000000-0000-0000-0000-000000000005',
      class_name: 'SD Cendekia A',
      course_id: courseMap.get('SD'),
      tutor_id: tutorMap.get('Kak Rizky Pratama, S.Kom'),
      academic_year: '2026/2027',
      capacity: 10,
    },
  ]

  for (const cls of initialClasses) {
    const { data: existing } = await supabase
      .from('classes')
      .select('id, class_name')
      .eq('id', cls.id)
      .maybeSingle()

    if (existing) {
      // Update link foreign key
      const { error: updErr } = await supabase
        .from('classes')
        .update({
          class_name: cls.class_name,
          course_id: cls.course_id,
          tutor_id: cls.tutor_id,
          academic_year: cls.academic_year,
          capacity: cls.capacity,
        })
        .eq('id', cls.id)

      if (updErr) {
        console.error(`  ❌ Gagal update link class ${cls.class_name}:`, updErr.message)
      } else {
        console.log(`  ✅ Class ${cls.class_name} diperbarui dengan relasi course & tutor.`)
      }
    } else {
      const { error: insErr } = await supabase.from('classes').insert(cls)
      if (insErr) {
        console.error(`  ❌ Gagal insert class ${cls.class_name}:`, insErr.message)
      } else {
        console.log(`  ✅ Class ${cls.class_name} berhasil dibuat.`)
      }
    }
  }

  console.log('🎉 [Tiket 01] Database Seeding Master Data Selesai 100% Sukses!')
}

runSeed().catch((err) => {
  console.error('Fatal seed error:', err)
  process.exit(1)
})
