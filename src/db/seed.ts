import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://rtamiwffuaxwzyjkocmj.supabase.co'
const supabaseAnonKey =
  process.env.VITE_SUPABASE_ANON_KEY ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ0YW1pd2ZmdWF4d3p5amtvY21qIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTE2MTQzNDksImV4cCI6MjEwNzE5MDM0OX0.bOIIpD_R-4lQW_T0MEnBsINYXTpwVjH3ExU9peF8XD0'

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('[ERROR] Supabase URL atau Anon Key tidak ditemukan di environment variable.')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function runSeed() {
  console.log('[SEED] [Tiket 01] Memulai Seeding Master Data ke Supabase...')

  // 1. Login sebagai Super Admin untuk bypass RLS
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
  console.log('[OK] Berhasil terautentikasi sebagai Super Admin.')

  // 2. Seed Courses (Paket Bimbingan Belajar)
  console.log('[SEED] Menyuntikkan master data courses (Paket Belajar)...')
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
        console.error(`  [ERROR] Gagal insert course ${c.course_code}:`, error.message)
      } else if (inserted) {
        courseMap.set(c.course_code, inserted.id)
        console.log(`  [OK] Course ${c.course_code} berhasil dibuat: ${inserted.id}`)
      }
    }
  }

  // 3. Seed Rooms (Ruangan Kelas Berkapasitas 10-12)
  console.log('[SEED] Menyuntikkan master data rooms (Ruangan Kelas)...')
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
        console.error(`  [ERROR] Gagal insert room ${r.room_name}:`, error.message)
      } else {
        console.log(`  [OK] Room ${r.room_name} berhasil dibuat: ${inserted?.id}`)
      }
    }
  }

  // 4. Seed Profiles & Tutors (Pengajar)
  console.log('[SEED] Menyuntikkan master data profiles & tutors...')
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
        console.warn(`  [WARN] Profile ${t.fullName} notice:`, profErr.message)
      } else {
        console.log(`  [OK] Profile tutor ${t.fullName} dibuat.`)
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
        console.error(`  [ERROR] Gagal insert tutor ${t.fullName}:`, tutErr.message)
      } else if (insertedTutor) {
        tutorMap.set(t.fullName, insertedTutor.id)
        console.log(`  [OK] Tutor ${t.fullName} berhasil dibuat: ${insertedTutor.id}`)
      }
    }
  }

  // 5. Seed Classes (Rombel Kelas)
  console.log('[SEED] Menyuntikkan master data classes (Rombel Kelas)...')
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
        console.error(`  [ERROR] Gagal update link class ${cls.class_name}:`, updErr.message)
      } else {
        console.log(`  [OK] Class ${cls.class_name} diperbarui dengan relasi course & tutor.`)
      }
    } else {
      const { error: insErr } = await supabase.from('classes').insert(cls)
      if (insErr) {
        console.error(`  [ERROR] Gagal insert class ${cls.class_name}:`, insErr.message)
      } else {
        console.log(`  [OK] Class ${cls.class_name} berhasil dibuat.`)
      }
    }
  }

  // 6. Link Child Alya Ramadhani to Ahmad Dahlan (Tiket 05 Multi-Child Support)
  console.log('[SEED] Memverifikasi relasi multi-child parent Ahmad Dahlan...')
  const ahmadDahlanParentId = '4ef83eaa-2764-4eec-9019-a987a34c4c7b'
  const alyaStudentId = 'e1a2a3a4-b5b6-c7c8-d9d0-e1e2e3e4e5e7'
  await supabase
    .from('students')
    .update({ parent_id: ahmadDahlanParentId })
    .eq('id', alyaStudentId)
  console.log('[OK] Alya Ramadhani terhubung ke wali murid Ahmad Dahlan.')

  // 7. Seed Materials (Modul Belajar - Tiket 05)
  console.log('[SEED] [Tiket 05] Menyuntikkan master data materials (Modul Pembelajaran)...')
  const initialMaterials = [
    {
      id: 'b1000000-0000-0000-0000-000000000001',
      class_id: 'c1000000-0000-0000-0000-000000000001', // UTBK Intensif A
      tutor_id: tutorMap.get('Kak Dian Pratiwi, S.Si'),
      title: 'Modul 01: Kinematika & Dinamika Gerak Lurus UTBK',
      description: 'Ringkasan konsep gerak lurus berubah beraturan (GLBB), gerak parabola, dan hukum Newton beserta contoh soal kontekstual.',
      category: 'Modul Teori',
      file_type: 'PDF',
      file_size: '3.7 MB',
      file_url: 'https://rtamiwffuaxwzyjkocmj.supabase.co/storage/v1/object/public/learning-materials/classes/c1000000-0000-0000-0000-000000000001/modul-01-kinematika-utbk.pdf',
      storage_path: 'classes/c1000000-0000-0000-0000-000000000001/modul-01-kinematika-utbk.pdf',
    },
    {
      id: 'b1000000-0000-0000-0000-000000000002',
      class_id: 'c1000000-0000-0000-0000-000000000001', // UTBK Intensif A
      tutor_id: tutorMap.get('Pak Hendra Wijaya, M.Pd'),
      title: 'Bank Soal: TPS Penalaran Matematika & Kuantitatif 2026',
      description: 'Kompilasi 50 soal prediksi penalaran umum dan pengetahuan kuantitatif SNBT dengan pembahasan komprehensif.',
      category: 'Bank Soal',
      file_type: 'PDF',
      file_size: '4.2 MB',
      file_url: 'https://rtamiwffuaxwzyjkocmj.supabase.co/storage/v1/object/public/learning-materials/classes/c1000000-0000-0000-0000-000000000001/bank-soal-tps-utbk-2026.pdf',
      storage_path: 'classes/c1000000-0000-0000-0000-000000000001/bank-soal-tps-utbk-2026.pdf',
    },
    {
      id: 'b1000000-0000-0000-0000-000000000004',
      class_id: 'c1000000-0000-0000-0000-000000000004', // SMP Prestasi A
      tutor_id: tutorMap.get('Kak Dian Pratiwi, S.Si'),
      title: 'Lembar Kerja Siswa: Sistem Peredaran Darah Manusia',
      description: 'LKS interaktif IPA Terpadu Kelas 8 persiapan asesmen formatif tengah semester.',
      category: 'Lembar Tugas',
      file_type: 'PDF',
      file_size: '2.1 MB',
      file_url: 'https://rtamiwffuaxwzyjkocmj.supabase.co/storage/v1/object/public/learning-materials/classes/c1000000-0000-0000-0000-000000000004/lks-peredaran-darah-smp.pdf',
      storage_path: 'classes/c1000000-0000-0000-0000-000000000004/lks-peredaran-darah-smp.pdf',
    },
  ]

  // Pastikan objek file contoh tersedia di bucket
  const samplePdf = Buffer.from('%PDF-1.4\n1 0 obj\n<< /Title (Modul Belajar Tadulako Cendekia) >>\nendobj\ntrailer\n<< /Root 1 0 R >>\n%%EOF')
  for (const m of initialMaterials) {
    if (m.storage_path) {
      await supabase.storage.from('learning-materials').upload(m.storage_path, samplePdf, {
        contentType: m.file_type === 'PDF' ? 'application/pdf' : 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
        upsert: true,
      })
    }

    const { data: existingMat } = await supabase
      .from('materials')
      .select('id')
      .eq('id', m.id)
      .maybeSingle()

    if (existingMat) {
      console.log(`  ↪ Material "${m.title}" sudah ada: ${m.id}`)
    } else {
      const { error: matErr } = await supabase.from('materials').insert(m)
      if (matErr) {
        console.error(`  [ERROR] Gagal insert material "${m.title}":`, matErr.message)
      } else {
        console.log(`  [OK] Material "${m.title}" berhasil dibuat.`)
      }
    }
  }

  // 8. Seed Grades (Nilai & Evaluasi Rapor - Tiket 05)
  console.log('[SEED] [Tiket 05] Menyuntikkan data grades (Nilai & Catatan Evaluasi)...')
  const fahriStudentId = 'd992d9fc-6f5b-434f-998b-358e54a754b7'
  const bintangStudentId = '921896b7-be81-4d51-af4a-6cc467757b03'
  const utbkClassId = 'c1000000-0000-0000-0000-000000000001'
  const smpClassId = 'c1000000-0000-0000-0000-000000000004'

  const initialGrades = [
    // Fahri Ramadhan (UTBK Intensif A)
    {
      id: 'de000000-0000-0000-0000-000000000001',
      student_id: fahriStudentId,
      class_id: utbkClassId,
      tutor_id: tutorMap.get('Kak Dian Pratiwi, S.Si'),
      subject_name: 'Fisika UTBK',
      assessment_title: 'Try Out 1 UTBK: Mekanika & Listrik',
      category: 'Try Out',
      score: 85,
      class_average: 78,
      tutor_feedback: 'Pemahaman konsep hukum Newton dan gerak parabola sangat kuat. Perlu ketelitian lebih pada perhitungan usaha dan energi kinetik.',
      assessment_date: '2026-10-10',
    },
    {
      id: 'de000000-0000-0000-0000-000000000002',
      student_id: fahriStudentId,
      class_id: utbkClassId,
      tutor_id: tutorMap.get('Pak Hendra Wijaya, M.Pd'),
      subject_name: 'Penalaran Matematika & TPS',
      assessment_title: 'Kuis 1: Penalaran Logika Kuantitatif',
      category: 'Kuis',
      score: 92,
      class_average: 80,
      tutor_feedback: 'Kecepatan pengerjaan pola barisan dan deret sangat baik. Pertahankan fokus pada soal cerita perbandingan rasio!',
      assessment_date: '2026-10-15',
    },
    {
      id: 'de000000-0000-0000-0000-000000000003',
      student_id: fahriStudentId,
      class_id: utbkClassId,
      tutor_id: tutorMap.get('Kak Dian Pratiwi, S.Si'),
      subject_name: 'Fisika UTBK',
      assessment_title: 'Tugas Mandiri: Gelombang Bunyi & Cahaya',
      category: 'Tugas',
      score: 88,
      class_average: 82,
      tutor_feedback: 'Analisis efek Doppler dan intensitas bunyi diselesaikan dengan runut dan lengkap.',
      assessment_date: '2026-10-19',
    },
    // Bintang Pratama (Teman Sekelas di UTBK Intensif A)
    {
      id: 'de000000-0000-0000-0000-000000000004',
      student_id: bintangStudentId,
      class_id: utbkClassId,
      tutor_id: tutorMap.get('Kak Dian Pratiwi, S.Si'),
      subject_name: 'Fisika UTBK',
      assessment_title: 'Try Out 1 UTBK: Mekanika & Listrik',
      category: 'Try Out',
      score: 71,
      class_average: 78,
      tutor_feedback: 'Bagus dalam memahami rumus dasar, perbanyak latihan soal variasi pada materi hukum gravitasi Newton.',
      assessment_date: '2026-10-10',
    },
    {
      id: 'de000000-0000-0000-0000-000000000005',
      student_id: bintangStudentId,
      class_id: utbkClassId,
      tutor_id: tutorMap.get('Pak Hendra Wijaya, M.Pd'),
      subject_name: 'Penalaran Matematika & TPS',
      assessment_title: 'Kuis 1: Penalaran Logika Kuantitatif',
      category: 'Kuis',
      score: 76,
      class_average: 80,
      tutor_feedback: 'Logika matematika baik, perlu akselerasi waktu pengerjaan untuk bagian TPS kuantitatif.',
      assessment_date: '2026-10-15',
    },
    // Alya Ramadhani (SMP Prestasi A)
    {
      id: 'de000000-0000-0000-0000-000000000006',
      student_id: alyaStudentId,
      class_id: smpClassId,
      tutor_id: tutorMap.get('Kak Dian Pratiwi, S.Si'),
      subject_name: 'IPA Terpadu SMP',
      assessment_title: 'Kuis Formatif: Sistem Organ Manusia',
      category: 'Kuis',
      score: 90,
      class_average: 84,
      tutor_feedback: 'Sangat aktif dan memahami fungsi jantung dan sirkulasi peredaran darah dengan sangat baik.',
      assessment_date: '2026-10-16',
    },
    {
      id: 'de000000-0000-0000-0000-000000000007',
      student_id: alyaStudentId,
      class_id: smpClassId,
      tutor_id: tutorMap.get('Kak Dian Pratiwi, S.Si'),
      subject_name: 'IPA Terpadu SMP',
      assessment_title: 'LKS Mandiri: Klasifikasi Makhluk Hidup',
      category: 'Tugas',
      score: 86,
      class_average: 81,
      tutor_feedback: 'Kunci dikotomi hewan avertebrata dibuat dengan rapi dan teliti.',
      assessment_date: '2026-10-18',
    },
  ]

  for (const g of initialGrades) {
    const { data: existingGrd } = await supabase
      .from('grades')
      .select('id')
      .eq('id', g.id)
      .maybeSingle()

    if (existingGrd) {
      console.log(`  ↪ Grade "${g.assessment_title}" untuk siswa ${g.student_id} sudah ada: ${g.id}`)
    } else {
      const { error: grdErr } = await supabase.from('grades').insert(g)
      if (grdErr) {
        console.error(`  [ERROR] Gagal insert grade "${g.assessment_title}":`, grdErr.message)
      } else {
        console.log(`  [OK] Grade "${g.assessment_title}" berhasil dibuat: skor ${g.score}`)
      }
    }
  }

  // 9. Seed Invoices & Payments (Tagihan SPP & Verifikasi Pembayaran - Tiket 06)
  console.log('[SEED] [Tiket 06] Menyuntikkan master data invoices & payments...')
  const samplePngBuffer = Buffer.from([
    0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0x00, 0x00, 0x0d,
    0x49, 0x48, 0x44, 0x52, 0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01,
    0x08, 0x06, 0x00, 0x00, 0x00, 0x1f, 0x15, 0xc4, 0x89, 0x00, 0x00, 0x00,
    0x0a, 0x49, 0x44, 0x41, 0x54, 0x78, 0x9c, 0x63, 0x00, 0x01, 0x00, 0x00,
    0x05, 0x00, 0x01, 0x0d, 0x0a, 0x2d, 0xb4, 0x00, 0x00, 0x00, 0x00, 0x49,
    0x45, 0x4e, 0x44, 0xae, 0x42, 0x60, 0x82,
  ])

  const sampleReceiptPath = 'proofs/sample-receipt.png'
  try {
    await supabase.storage.from('receipts').upload(sampleReceiptPath, samplePngBuffer, {
      contentType: 'image/png',
      upsert: true,
    })
  } catch (err) {
    console.warn('[WARN] Notice storage receipts upload:', err)
  }

  const { data: sampleReceiptPub } = supabase.storage.from('receipts').getPublicUrl(sampleReceiptPath)
  const sampleReceiptUrl = sampleReceiptPub?.publicUrl || ''

  const initialInvoices = [
    {
      id: 'f1000000-0000-0000-0000-000000000001',
      student_id: fahriStudentId,
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
      student_id: bintangStudentId,
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
      student_id: alyaStudentId,
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
      student_id: fahriStudentId,
      invoice_number: 'INV-202609-0014',
      program_name: 'Intensif UTBK-SNBT',
      description: 'SPP Bimbingan Belajar Periode September 2026',
      amount: 450000,
      due_date: '2026-09-10',
      status: 'ditolak',
      rejected_reason: 'Bukti transfer buram dan tidak menampilkan nomor referensi bank.',
    },
  ]

  for (const inv of initialInvoices) {
    const { data: existingInv } = await supabase
      .from('invoices')
      .select('id')
      .eq('id', inv.id)
      .maybeSingle()

    if (existingInv) {
      console.log(`  ↪ Invoice "${inv.invoice_number}" sudah ada: ${inv.id}`)
    } else {
      const { error: invErr } = await supabase.from('invoices').insert(inv as any)
      if (invErr) {
        console.error(`  [ERROR] Gagal insert invoice "${inv.invoice_number}":`, invErr.message)
      } else {
        console.log(`  [OK] Invoice "${inv.invoice_number}" berhasil dibuat.`)
      }
    }
  }

  // Payments Seeding
  const initialPayments = [
    {
      id: 'fa000000-0000-0000-0000-000000000001',
      invoice_id: 'f1000000-0000-0000-0000-000000000001',
      amount: 450000,
      amount_paid: '450000',
      transfer_receipt_file: 'bukti_transfer_bsi_oktober.png',
      proof_file_url: sampleReceiptUrl,
      storage_path: sampleReceiptPath,
      bank_name: 'Bank Syariah Indonesia (BSI)',
      payment_method: 'Transfer Bank Syariah Indonesia (BSI)',
      submitted_at: '2026-10-09T08:00:00.000Z',
      verified_at: '2026-10-10T09:15:00.000Z',
      receipt_number: 'KWT-202610-0011',
      submitted_by_role: 'student',
      submitted_by_name: 'Fahri Ramadhan',
      status: 'lunas',
      notes: 'Pembayaran SPP terverifikasi lunas oleh tata usaha.',
    },
    {
      id: 'fa000000-0000-0000-0000-000000000002',
      invoice_id: 'f1000000-0000-0000-0000-000000000002',
      amount: 300000,
      amount_paid: '300000',
      transfer_receipt_file: 'bukti_transfer_bsi_bintang.png',
      proof_file_url: sampleReceiptUrl,
      storage_path: sampleReceiptPath,
      bank_name: 'Bank Syariah Indonesia (BSI)',
      payment_method: 'Transfer Bank Syariah Indonesia (BSI)',
      submitted_at: '2026-10-22T10:00:00.000Z',
      submitted_by_role: 'parent',
      submitted_by_name: 'Ahmad Dahlan',
      status: 'menunggu',
      notes: null,
    },
    {
      id: 'fa000000-0000-0000-0000-000000000004',
      invoice_id: 'f1000000-0000-0000-0000-000000000004',
      amount: 450000,
      amount_paid: '450000',
      transfer_receipt_file: 'struk_tidak_jelas.jpg',
      proof_file_url: sampleReceiptUrl,
      storage_path: sampleReceiptPath,
      bank_name: 'Bank Mandiri',
      payment_method: 'Transfer Bank Mandiri',
      submitted_at: '2026-09-08T11:00:00.000Z',
      submitted_by_role: 'student',
      submitted_by_name: 'Fahri Ramadhan',
      status: 'ditolak',
      notes: 'Bukti transfer buram dan tidak menampilkan nomor referensi bank.',
    },
  ]

  for (const pay of initialPayments) {
    const { data: existingPay } = await supabase
      .from('payments')
      .select('id')
      .eq('id', pay.id)
      .maybeSingle()

    if (existingPay) {
      console.log(`  ↪ Payment "${pay.id}" sudah ada.`)
    } else {
      const { error: payErr } = await supabase.from('payments').insert(pay as any)
      if (payErr) {
        console.error(`  [ERROR] Gagal insert payment "${pay.id}":`, payErr.message)
      } else {
        console.log(`  [OK] Payment "${pay.id}" berhasil dibuat.`)
      }
    }
  }

  console.log('[DONE] [Tiket 01, Tiket 05 & Tiket 06] Database Seeding Selesai 100% Sukses!')
}

runSeed().catch((err) => {
  console.error('Fatal seed error:', err)
  process.exit(1)
})
