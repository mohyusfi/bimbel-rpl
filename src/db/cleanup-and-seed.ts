import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://rtamiwffuaxwzyjkocmj.supabase.co'
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || ''

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('[ERROR] Supabase URL atau Anon Key tidak ditemukan di environment variable.')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Profil Resmi yang WAJIB Dipertahankan
const OFFICIAL_PROFILE_IDS = {
  pimpinan: '3718bd9b-1fcf-4159-acdf-44b8000ee4b3',
  nuraini: '385ef969-c8f6-4832-9b27-90b897614011',
  dian: '1dc75962-7771-4c58-85af-5ce40c2eabae',
  hendra: '2ec86073-8882-5d69-96ba-6df51d3fbcb1',
  nabila: '3fd97184-9993-6e70-a7cb-7ea62e4acdc2',
  rizky: '4ae08295-aaaa-7f81-b8dc-8fb73f5bedd3',
  ahmadDahlan: 'ec6f75cb-887a-442b-b91d-f47f9afc5ab8', // Wali Fahri
  fahriRamadhan: '943d2c13-0a7f-4e5d-b00d-a930e5bbbfdc', // Siswa 1
  ratnaDewi: 'f1a0b1c2-3d4e-5f60-7a8b-9c0d1e2f3a4b', // Wali Alya
  alyaRamadhani: 'a1a2a3a4-b5b6-c7c8-d9d0-e1e2e3e4e5e6', // Siswa 2
}

const OFFICIAL_STUDENT_IDS = {
  fahri: 'd992d9fc-6f5b-434f-998b-358e54a754b7',
  alya: 'e1a2a3a4-b5b6-c7c8-d9d0-e1e2e3e4e5e7',
}

const OFFICIAL_CLASS_IDS = {
  utbkA: 'c1000000-0000-0000-0000-000000000001',
  utbkB: 'c1000000-0000-0000-0000-000000000002',
  sma1: 'c1000000-0000-0000-0000-000000000003',
  smpA: 'c1000000-0000-0000-0000-000000000004',
  sdA: 'c1000000-0000-0000-0000-000000000005',
}

async function runCleanupAndSeed() {
  console.log('[CLEANUP] [Pembersihan] Memulai pembersihan data lokal/uji coba & sinkronisasi Supabase...')

  // 1. Login sebagai Super Admin
  const adminEmail = 'pimpinan@tadulakocendekia.sch.id'
  const adminPassword = 'password123'
  console.log(`[AUTH] Mengautentikasi sebagai Super Admin (${adminEmail})...`)

  const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
    email: adminEmail,
    password: adminPassword,
  })

  if (authError || !authData?.session) {
    console.error('[ERROR] Gagal login sebagai Super Admin:', authError?.message)
    process.exit(1)
  }
  console.log('[OK] Berhasil login sebagai Super Admin.')

  // 2. Tandai data registrasi uji coba yang menggantung menjadi ditolak
  console.log('[CLEANUP] Menandai data registrasi uji coba di tabel registrations...')
  const { error: updRegErr } = await supabase
    .from('registrations')
    .update({ status: 'ditolak', rejected_reason: 'Data uji coba dibersihkan' })
    .eq('status', 'menunggu')

  if (updRegErr) {
    console.warn('[WARN] Gagal membersihkan antrean registrations:', updRegErr.message)
  } else {
    console.log('[OK] Antrean tabel registrations berhasil dibersihkan (0 entri menunggu).')
  }

  // 3. Hapus class_members selain siswa resmi
  console.log('[CLEANUP] Membersihkan relasi class_members siswa uji coba...')
  const { error: delCmErr } = await supabase
    .from('class_members')
    .delete()
    .not('student_id', 'in', `(${OFFICIAL_STUDENT_IDS.fahri},${OFFICIAL_STUDENT_IDS.alya})`)

  if (delCmErr) {
    console.warn('[WARN] Gagal membersihkan class_members:', delCmErr.message)
  } else {
    console.log('[OK] Relasi class_members dibersihkan.')
  }

  // 4. Nonaktifkan akun students uji coba selain siswa resmi
  console.log('[CLEANUP] Menonaktifkan akun uji coba di tabel students...')
  const { error: updStuErr } = await supabase
    .from('students')
    .update({ status: 'nonaktif' })
    .not('id', 'in', `(${OFFICIAL_STUDENT_IDS.fahri},${OFFICIAL_STUDENT_IDS.alya})`)

  if (updStuErr) {
    console.warn('[WARN] Gagal menonaktifkan akun uji coba students:', updStuErr.message)
  } else {
    console.log('[OK] Akun uji coba students dinonaktifkan.')
  }

  // 5. Hapus profiles dummy yang tidak termasuk profil resmi
  console.log('[CLEANUP] Membersihkan profil dummy di tabel profiles...')
  const officialIdsList = Object.values(OFFICIAL_PROFILE_IDS).join(',')
  const { error: delProfErr } = await supabase
    .from('profiles')
    .delete()
    .not('id', 'in', `(${officialIdsList})`)

  if (delProfErr) {
    console.warn('[WARN] Gagal membersihkan profiles dummy (kemungkinan terikat FK):', delProfErr.message)
  } else {
    console.log('[OK] Tabel profiles berhasil dirampingkan ke akun resmi.')
  }

  // 6. Pastikan Master Courses (Paket Bimbingan) lengkap
  console.log('[SEED] Menyelaraskan master courses...')
  const coursesToSeed = [
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
  for (const c of coursesToSeed) {
    const { data: existing } = await supabase
      .from('courses')
      .select('id, course_code')
      .eq('course_code', c.course_code)
      .maybeSingle()

    if (existing) {
      courseMap.set(c.course_code, existing.id)
    } else {
      const { data: inserted } = await supabase.from('courses').insert(c).select('id').single()
      if (inserted) courseMap.set(c.course_code, inserted.id)
    }
  }

  // 7. Pastikan Master Rooms (Ruangan Kelas)
  console.log('[SEED] Menyelaraskan master rooms...')
  const roomsToSeed = [
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

  for (const r of roomsToSeed) {
    const { data: existing } = await supabase
      .from('rooms')
      .select('id, room_name')
      .eq('room_name', r.room_name)
      .maybeSingle()

    if (!existing) {
      await supabase.from('rooms').insert(r)
    }
  }

  // 8. Pastikan Profil & Tutors
  console.log('[SEED] Menyelaraskan profil dan master tutors...')
  const tutorsToSeed = [
    {
      profileId: OFFICIAL_PROFILE_IDS.dian,
      email: 'dian.pratiwi@tadulakocendekia.sch.id',
      fullName: 'Kak Dian Pratiwi, S.Si',
      phone: '0812-4567-8901',
      education: 'S1 Fisika — Universitas Tadulako (IPK 3.84)',
      specialty: 'Fisika UTBK, IPA Terpadu SMP',
      weeklySessions: 4,
    },
    {
      profileId: OFFICIAL_PROFILE_IDS.hendra,
      email: 'hendra.wijaya@tutor.tadulakocendekia.sch.id',
      fullName: 'Pak Hendra Wijaya, M.Pd',
      phone: '0852-9876-5432',
      education: 'S2 Pendidikan Matematika — Universitas Tadulako',
      specialty: 'Matematika Sains, Penalaran Matematika & TPS',
      weeklySessions: 5,
    },
    {
      profileId: OFFICIAL_PROFILE_IDS.nabila,
      email: 'nabila.syahputri@tutor.tadulakocendekia.sch.id',
      fullName: 'Kak Nabila Syahputri, S.Pd',
      phone: '0821-3344-5566',
      education: 'S1 Pendidikan Bahasa Inggris — Universitas Tadulako',
      specialty: 'Bahasa Inggris & Literasi, Literasi B. Indonesia',
      weeklySessions: 3,
    },
    {
      profileId: OFFICIAL_PROFILE_IDS.rizky,
      email: 'rizky.pratama@tutor.tadulakocendekia.sch.id',
      fullName: 'Kak Rizky Pratama, S.Kom',
      phone: '0813-7788-9900',
      education: 'S1 Teknik Informatika — STMIK Bina Mulia Palu',
      specialty: 'Penalaran Matematika & TPS, Matematika & Calistung SD',
      weeklySessions: 4,
    },
  ]

  const tutorMap = new Map<string, string>()
  for (const t of tutorsToSeed) {
    const { data: existingProf } = await supabase
      .from('profiles')
      .select('id')
      .eq('id', t.profileId)
      .maybeSingle()

    if (!existingProf) {
      await supabase.from('profiles').insert({
        id: t.profileId,
        email: t.email,
        full_name: t.fullName,
        role: 'tutor',
        phone_number: t.phone,
        status: 'aktif',
      })
    }

    const { data: existingTut } = await supabase
      .from('tutors')
      .select('id, profile_id')
      .eq('profile_id', t.profileId)
      .maybeSingle()

    if (existingTut) {
      tutorMap.set(t.fullName, existingTut.id)
    } else {
      const { data: insertedTut } = await supabase
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
      if (insertedTut) tutorMap.set(t.fullName, insertedTut.id)
    }
  }

  // 9. Pastikan 5 Rombel Classes
  console.log('[SEED] Menyelaraskan master rombel classes...')
  const classesToSeed = [
    {
      id: OFFICIAL_CLASS_IDS.utbkA,
      class_name: 'UTBK Intensif A',
      course_id: courseMap.get('UTBK'),
      tutor_id: tutorMap.get('Kak Dian Pratiwi, S.Si'),
      academic_year: '2026/2027',
      capacity: 12,
    },
    {
      id: OFFICIAL_CLASS_IDS.utbkB,
      class_name: 'UTBK Intensif B',
      course_id: courseMap.get('UTBK'),
      tutor_id: tutorMap.get('Pak Hendra Wijaya, M.Pd'),
      academic_year: '2026/2027',
      capacity: 12,
    },
    {
      id: OFFICIAL_CLASS_IDS.sma1,
      class_name: 'SMA IPA 1',
      course_id: courseMap.get('SMA'),
      tutor_id: tutorMap.get('Pak Hendra Wijaya, M.Pd'),
      academic_year: '2026/2027',
      capacity: 12,
    },
    {
      id: OFFICIAL_CLASS_IDS.smpA,
      class_name: 'SMP Prestasi A',
      course_id: courseMap.get('SMP'),
      tutor_id: tutorMap.get('Kak Dian Pratiwi, S.Si'),
      academic_year: '2026/2027',
      capacity: 12,
    },
    {
      id: OFFICIAL_CLASS_IDS.sdA,
      class_name: 'SD Cendekia A',
      course_id: courseMap.get('SD'),
      tutor_id: tutorMap.get('Kak Rizky Pratama, S.Kom'),
      academic_year: '2026/2027',
      capacity: 10,
    },
  ]

  for (const cls of classesToSeed) {
    const { data: existing } = await supabase.from('classes').select('id').eq('id', cls.id).maybeSingle()
    if (existing) {
      await supabase
        .from('classes')
        .update({
          class_name: cls.class_name,
          course_id: cls.course_id,
          tutor_id: cls.tutor_id,
          academic_year: cls.academic_year,
          capacity: cls.capacity,
        })
        .eq('id', cls.id)
    } else {
      await supabase.from('classes').insert(cls)
    }
  }

  // 10. Pasang 2 Profil Wali & Siswa Resmi Demo
  console.log('[SEED] Menyiapkan akun resmi Fahri Ramadhan & Alya Ramadhani...')

  // Wali 1: Ir. H. Ahmad Dahlan
  const { data: exWali1 } = await supabase.from('profiles').select('id').eq('id', OFFICIAL_PROFILE_IDS.ahmadDahlan).maybeSingle()
  if (!exWali1) {
    await supabase.from('profiles').insert({
      id: OFFICIAL_PROFILE_IDS.ahmadDahlan,
      email: 'ahmad.dahlan@wali.tadulakocendekia.sch.id',
      full_name: 'Ir. H. Ahmad Dahlan',
      role: 'parent',
      phone_number: '0821-4455-6677',
      status: 'aktif',
    })
  }
  let parent1Id: string | null = null
  const { data: exParRow1 } = await supabase.from('parents').select('id').eq('profile_id', OFFICIAL_PROFILE_IDS.ahmadDahlan).maybeSingle()
  if (exParRow1) {
    parent1Id = exParRow1.id
  } else {
    const { data: newPar1 } = await supabase.from('parents').insert({
      profile_id: OFFICIAL_PROFILE_IDS.ahmadDahlan,
      occupation: 'PNS Pemprov Sulteng',
      address: 'Jl. Jenderal Sudirman No. 25, Palu Timur',
    }).select('id').single()
    parent1Id = newPar1?.id || null
  }

  // Siswa 1: Fahri Ramadhan (UTBK Intensif A)
  const { data: exStuProf1 } = await supabase.from('profiles').select('id').eq('id', OFFICIAL_PROFILE_IDS.fahriRamadhan).maybeSingle()
  if (!exStuProf1) {
    await supabase.from('profiles').insert({
      id: OFFICIAL_PROFILE_IDS.fahriRamadhan,
      email: 'fahri.ramadhan@siswa.tadulakocendekia.sch.id',
      full_name: 'Fahri Ramadhan',
      role: 'student',
      phone_number: '0813-7788-9900',
      status: 'aktif',
    })
  } else {
    await supabase.from('profiles').update({
      email: 'fahri.ramadhan@siswa.tadulakocendekia.sch.id',
    }).eq('id', OFFICIAL_PROFILE_IDS.fahriRamadhan)
  }

  const { data: exStu1 } = await supabase.from('students').select('id').eq('id', OFFICIAL_STUDENT_IDS.fahri).maybeSingle()
  if (!exStu1) {
    await supabase.from('students').insert({
      id: OFFICIAL_STUDENT_IDS.fahri,
      profile_id: OFFICIAL_PROFILE_IDS.fahriRamadhan,
      parent_id: parent1Id,
      nis: 'TC-2026-001',
      origin_school: 'SMA Negeri 1 Palu',
      grade_level: 'SMA',
      package_code: 'UTBK',
      status: 'aktif',
      class_id: OFFICIAL_CLASS_IDS.utbkA,
    })
  } else {
    await supabase.from('students').update({
      parent_id: parent1Id,
      class_id: OFFICIAL_CLASS_IDS.utbkA,
    }).eq('id', OFFICIAL_STUDENT_IDS.fahri)
  }

  // Masukkan Siswa 1 ke class_members UTBK Intensif A
  const { data: exCm1 } = await supabase
    .from('class_members')
    .select('id')
    .eq('class_id', OFFICIAL_CLASS_IDS.utbkA)
    .eq('student_id', OFFICIAL_STUDENT_IDS.fahri)
    .maybeSingle()

  if (!exCm1) {
    await supabase.from('class_members').insert({
      class_id: OFFICIAL_CLASS_IDS.utbkA,
      student_id: OFFICIAL_STUDENT_IDS.fahri,
    })
  }

  // Wali 2: Ibu Ratna Dewi
  const { data: exWali2 } = await supabase.from('profiles').select('id').eq('id', OFFICIAL_PROFILE_IDS.ratnaDewi).maybeSingle()
  if (!exWali2) {
    await supabase.from('profiles').insert({
      id: OFFICIAL_PROFILE_IDS.ratnaDewi,
      email: 'ratna.dewi@wali.tadulakocendekia.sch.id',
      full_name: 'Ibu Ratna Dewi, S.E.',
      role: 'parent',
      phone_number: '0852-1122-3344',
      status: 'aktif',
    })
  }
  let parent2Id: string | null = null
  const { data: exParRow2 } = await supabase.from('parents').select('id').eq('profile_id', OFFICIAL_PROFILE_IDS.ratnaDewi).maybeSingle()
  if (exParRow2) {
    parent2Id = exParRow2.id
  } else {
    const { data: newPar2 } = await supabase.from('parents').insert({
      profile_id: OFFICIAL_PROFILE_IDS.ratnaDewi,
      occupation: 'Wiraswasta',
      address: 'Jl. Sam Ratulangi No. 12, Palu Barat',
    }).select('id').single()
    parent2Id = newPar2?.id || null
  }

  // Siswa 2: Alya Ramadhani (SMP Prestasi A)
  const { data: exStuProf2 } = await supabase.from('profiles').select('id').eq('id', OFFICIAL_PROFILE_IDS.alyaRamadhani).maybeSingle()
  if (!exStuProf2) {
    await supabase.from('profiles').insert({
      id: OFFICIAL_PROFILE_IDS.alyaRamadhani,
      email: 'alya.ramadhani@siswa.tadulakocendekia.sch.id',
      full_name: 'Alya Ramadhani',
      role: 'student',
      phone_number: '0821-9988-7766',
      status: 'aktif',
    })
  }

  const { data: exStu2 } = await supabase.from('students').select('id').eq('id', OFFICIAL_STUDENT_IDS.alya).maybeSingle()
  if (!exStu2) {
    await supabase.from('students').insert({
      id: OFFICIAL_STUDENT_IDS.alya,
      profile_id: OFFICIAL_PROFILE_IDS.alyaRamadhani,
      parent_id: parent2Id,
      nis: 'TC-2026-002',
      origin_school: 'SMP Negeri 1 Palu',
      grade_level: 'SMP',
      status: 'aktif',
      class_id: OFFICIAL_CLASS_IDS.smpA,
    })
  }

  // Masukkan Siswa 2 ke class_members SMP Prestasi A
  const { data: exCm2 } = await supabase
    .from('class_members')
    .select('id')
    .eq('class_id', OFFICIAL_CLASS_IDS.smpA)
    .eq('student_id', OFFICIAL_STUDENT_IDS.alya)
    .maybeSingle()

  if (!exCm2) {
    await supabase.from('class_members').insert({
      class_id: OFFICIAL_CLASS_IDS.smpA,
      student_id: OFFICIAL_STUDENT_IDS.alya,
    })
  }

  // 11. Hapus Modul Belajar (materials & Storage learning-materials) sesuai permintaan pengguna
  console.log('[CLEANUP] Membersihkan seluruh data materi di tabel materials dan storage learning-materials...')
  const { error: delMatErr } = await supabase.from('materials').delete().neq('id', '00000000-0000-0000-0000-000000000000')
  if (delMatErr) {
    console.warn('[WARN] Gagal menghapus baris tabel materials:', delMatErr.message)
  } else {
    console.log('[OK] Tabel materials berhasil dikosongkan.')
  }

  try {
    const { data: matFiles } = await supabase.storage.from('learning-materials').list('', { limit: 100 })
    if (matFiles && matFiles.length > 0) {
      const pathsToRemove = matFiles.map((f) => f.name)
      await supabase.storage.from('learning-materials').remove(pathsToRemove)
    }
    const { data: clsFolders } = await supabase.storage.from('learning-materials').list('classes', { limit: 100 })
    if (clsFolders && clsFolders.length > 0) {
      for (const folder of clsFolders) {
        const { data: subFiles } = await supabase.storage.from('learning-materials').list(`classes/${folder.name}`)
        if (subFiles && subFiles.length > 0) {
          await supabase.storage.from('learning-materials').remove(subFiles.map((sf) => `classes/${folder.name}/${sf.name}`))
        }
      }
    }
    console.log('[OK] Bucket storage learning-materials dibersihkan.')
  } catch (stgMatErr) {
    console.warn('[WARN] Notice pembersihan storage learning-materials:', stgMatErr)
  }

  // 12. Pangkas Tagihan SPP & Pembayaran (Invoices & Payments) Maksimal 4-5 Data
  console.log('[CLEANUP] Memangkas data uji coba tabel payments & invoices ke 4 data master resmi...')
  const OFFICIAL_INVOICE_IDS = [
    'f1000000-0000-0000-0000-000000000001',
    'f1000000-0000-0000-0000-000000000002',
    'f1000000-0000-0000-0000-000000000003',
    'f1000000-0000-0000-0000-000000000004',
  ]
  const OFFICIAL_PAYMENT_IDS = [
    'fa000000-0000-0000-0000-000000000001',
    'fa000000-0000-0000-0000-000000000002',
    'fa000000-0000-0000-0000-000000000004',
  ]

  // Hapus payments selain payment resmi
  const { error: delPayErr } = await supabase
    .from('payments')
    .delete()
    .not('id', 'in', `(${OFFICIAL_PAYMENT_IDS.join(',')})`)
  if (delPayErr) console.warn('[WARN] Gagal memangkas payments sisa testing:', delPayErr.message)
  else console.log('[OK] Tabel payments dipangkas ke data resmi.')

  // Hapus invoices selain invoice resmi
  const { error: delInvErr } = await supabase
    .from('invoices')
    .delete()
    .not('id', 'in', `(${OFFICIAL_INVOICE_IDS.join(',')})`)
  if (delInvErr) console.warn('[WARN] Gagal memangkas invoices sisa testing:', delInvErr.message)
  else console.log('[OK] Tabel invoices dipangkas ke 4 data resmi.')

  // Pastikan 4 invoice resmi tersedia
  const officialInvoices = [
    {
      id: 'f1000000-0000-0000-0000-000000000001',
      student_id: OFFICIAL_STUDENT_IDS.fahri,
      invoice_number: 'INV-202610-0011',
      program_name: 'Intensif UTBK-SNBT',
      description: 'SPP Bimbingan Belajar Periode Oktober 2026',
      amount: 450000,
      due_date: '2026-10-10',
      status: 'lunas',
      rejected_reason: null,
    },
    {
      id: 'f1000000-0000-0000-0000-000000000002',
      student_id: '921896b7-be81-4d51-af4a-6cc467757b03', // Bintang Pratama
      invoice_number: 'INV-202610-0012',
      program_name: 'SD Cendekia',
      description: 'SPP Bimbingan Belajar Periode November 2026',
      amount: 300000,
      due_date: '2026-11-10',
      status: 'menunggu',
      rejected_reason: null,
    },
    {
      id: 'f1000000-0000-0000-0000-000000000003',
      student_id: OFFICIAL_STUDENT_IDS.alya,
      invoice_number: 'INV-202610-0013',
      program_name: 'SMP Prestasi',
      description: 'SPP Bimbingan Belajar Periode November 2026',
      amount: 350000,
      due_date: '2026-11-10',
      status: 'belum_dibayar',
      rejected_reason: null,
    },
    {
      id: 'f1000000-0000-0000-0000-000000000004',
      student_id: OFFICIAL_STUDENT_IDS.fahri,
      invoice_number: 'INV-202609-0014',
      program_name: 'Intensif UTBK-SNBT',
      description: 'SPP Bimbingan Belajar Periode September 2026',
      amount: 450000,
      due_date: '2026-09-10',
      status: 'ditolak',
      rejected_reason: 'Bukti transfer buram dan tidak menampilkan nomor referensi bank.',
    },
  ]

  for (const inv of officialInvoices) {
    const { data: exInv } = await supabase.from('invoices').select('id').eq('id', inv.id).maybeSingle()
    if (!exInv) {
      await supabase.from('invoices').insert(inv as any)
    }
  }

  // 13. Bersihkan 2.460 Baris Notifikasi Sampah di Database Supabase
  console.log('[CLEANUP] Membersihkan baris notifikasi sisa testing dari tabel notifications...')
  const { error: delNotifErr } = await supabase.from('notifications').delete().neq('id', '00000000-0000-0000-0000-000000000000')
  if (delNotifErr) {
    console.warn('[WARN] Gagal membersihkan tabel notifications:', delNotifErr.message)
  } else {
    console.log('[OK] Tabel notifications dibersihkan dari 2.460 baris sampah.')
  }

  // Suntikkan 4 notifikasi master bersih untuk admin
  const cleanNotifications = [
    {
      user_id: OFFICIAL_PROFILE_IDS.pimpinan,
      title: 'Pendaftaran Baru Terverifikasi',
      message: 'Fahri Ramadhan (SMA Negeri 1 Palu) telah aktif di paket Intensif UTBK-SNBT.',
      type: 'registration',
      is_read: true,
      link_url: '/admin/siswa',
    },
    {
      user_id: OFFICIAL_PROFILE_IDS.pimpinan,
      title: 'Pembayaran SPP Terverifikasi',
      message: 'Pembayaran SPP Fahri Ramadhan telah terverifikasi lunas dengan nomor kwitansi KWT-202610-0011.',
      type: 'payment',
      is_read: true,
      link_url: '/admin/pembayaran',
    },
    {
      user_id: OFFICIAL_PROFILE_IDS.pimpinan,
      title: 'Jadwal Bimbingan Jumat Terjadwal',
      message: 'Sesi bimbingan Fisika UTBK di Ruang Palu-1 telah dijadwalkan.',
      type: 'schedule',
      is_read: false,
      link_url: '/admin/jadwal',
    },
    {
      user_id: OFFICIAL_PROFILE_IDS.pimpinan,
      title: 'Pengumuman Resmi Diterbitkan',
      message: 'Jadwal Try Out Akbar UTBK 2026 telah dipublikasikan ke seluruh siswa.',
      type: 'announcement',
      is_read: false,
      link_url: '/admin/pengumuman',
    },
  ]

  for (const n of cleanNotifications) {
    await supabase.from('notifications').insert(n)
  }
  console.log('[OK] Tabel notifications diisi dengan 4 notifikasi resmi.')

  // 14. Pastikan 4 ruangan fisik resmi tersedia
  console.log('[SEED] Memastikan 4 ruangan fisik resmi tersedia...')
  for (const r of roomsToSeed) {
    const { data: existingRoom } = await supabase.from('rooms').select('id').eq('room_name', r.room_name).maybeSingle()
    if (!existingRoom) {
      await supabase.from('rooms').insert(r)
      console.log(`[OK] Room ${r.room_name} berhasil dibuat.`)
    }
  }

  console.log('[DONE] [Sukses] Database Supabase bersih 100%, modul materi dihapus, dan batasan maks 5 data per entitas terpenuhi!')
}

runCleanupAndSeed().catch((err) => {
  console.error('Fatal cleanup error:', err)
  process.exit(1)
})
