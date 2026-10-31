import * as React from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { type ColumnDef } from '@tanstack/react-table'
import { Dialog } from '@base-ui/react/dialog'
import {
  UserPlus,
  X,
  Plus,
  GraduationCap,
  BookOpen,
  Loader2,
  AlertCircle,
  KeyRound,
  Copy,
  Check,
} from 'lucide-react'
import {
  useAdminTutors,
  useAdminSubjects,
  useAdminMutations,
} from '~/hooks/use-admin-data'
import { DataTable } from '~/components/ui/data-table'
import { StatusBadge } from '~/components/ui/status-badge'
import { SummaryMetricCard } from '~/components/dashboard/SummaryMetricCard'
import type { Tutor, Subject, PackageCode } from '~/lib/admin-store'
import { cn } from '~/lib/utils'

export const Route = createFileRoute('/admin/tutor')({
  ssr: false,
  component: AdminTutorPage,
})

export interface TutorCredentialsData {
  name: string
  email: string
  password: string
  phone: string
  education: string
  subjects: string[]
}

function AdminTutorPage() {
  const { data: tutors = [] } = useAdminTutors()
  const { data: subjects = [] } = useAdminSubjects()
  const { addTutor, updateTutor, addSubject } = useAdminMutations()

  // Tab State
  const [activeTab, setActiveTab] = React.useState<'tutors' | 'subjects'>(
    'tutors'
  )

  // Modals state
  const [isAddTutorOpen, setIsAddTutorOpen] = React.useState(false)
  const [isAddSubjectOpen, setIsAddSubjectOpen] = React.useState(false)
  const [isSubmittingTutor, setIsSubmittingTutor] = React.useState(false)
  const [tutorError, setTutorError] = React.useState<string | null>(null)
  const [isSubmittingSubject, setIsSubmittingSubject] = React.useState(false)
  const [subjectError, setSubjectError] = React.useState<string | null>(null)

  // Credentials Modal state
  const [credentialsModalData, setCredentialsModalData] =
    React.useState<TutorCredentialsData | null>(null)
  const [isTemplateCopied, setIsTemplateCopied] = React.useState(false)

  // Confirmation Modal for Deactivate / Activate Tutor
  const [statusTargetTutor, setStatusTargetTutor] = React.useState<Tutor | null>(
    null
  )
  const [isSubmittingStatus, setIsSubmittingStatus] = React.useState(false)

  // Form states
  const [tutorForm, setTutorForm] = React.useState({
    name: '',
    email: '',
    phone: '',
    education: '',
    subjectsString: '',
  })

  const [subjectForm, setSubjectForm] = React.useState({
    code: '',
    name: '',
    level: 'UTBK' as PackageCode,
  })

  // Add Tutor Submit
  const handleAddTutorSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (isSubmittingTutor) return
    const subjectList = tutorForm.subjectsString
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean)

    const cleanEmail = tutorForm.email.trim().toLowerCase()
    if (!cleanEmail || !cleanEmail.includes('@')) {
      setTutorError('Alamat email tutor tidak valid.')
      return
    }

    setTutorError(null)
    setIsSubmittingTutor(true)
    try {
      const res = await addTutor({
        name: tutorForm.name,
        email: cleanEmail,
        phone: tutorForm.phone,
        education: tutorForm.education,
        subjects: subjectList,
        password: 'tutor2026',
      })

      setIsAddTutorOpen(false)
      const submittedName = tutorForm.name
      const submittedPhone = tutorForm.phone
      const submittedEdu = tutorForm.education

      setTutorForm({
        name: '',
        email: '',
        phone: '',
        education: '',
        subjectsString: '',
      })

      // Buka dialog kredensial setelah berhasil disimpan
      if (res && (res as any).credentials) {
        setCredentialsModalData((res as any).credentials)
      } else {
        setCredentialsModalData({
          name: submittedName,
          email: cleanEmail,
          password: 'tutor2026',
          phone: submittedPhone,
          education: submittedEdu,
          subjects: subjectList,
        })
      }
    } catch (err: unknown) {
      setTutorError(err instanceof Error ? err.message : 'Gagal menyimpan data tutor.')
    } finally {
      setIsSubmittingTutor(false)
    }
  }

  // Copy WhatsApp template
  const handleCopyWhatsAppTemplate = () => {
    if (!credentialsModalData) return
    const text = `*PINTAR YUK — KREDENSIAL AKSES PORTAL PENGAJAR*
Yth. Bapak/Ibu/Kak ${credentialsModalData.name},
Akun portal pengajar Anda di Bimbel Pintar Yuk telah aktif.

*Akses Portal Pengajar:*
• Email: ${credentialsModalData.email}
• Kata Sandi: ${credentialsModalData.password}
• Tautan Masuk: https://tadulakocendekia.sch.id/masuk

Gunakan akun ini untuk memantau jadwal mengajar, pengisian presensi kelas, modul ajar, dan penilaian siswa. Mohon segera ganti kata sandi setelah berhasil masuk. Terima kasih atas dedikasi Anda.`

    try {
      if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
        navigator.clipboard.writeText(text).catch(() => {})
      }
    } catch {}
    setIsTemplateCopied(true)
    setTimeout(() => setIsTemplateCopied(false), 2500)
  }

  // View credentials from table row
  const handleViewCredentials = (tutor: Tutor) => {
    setCredentialsModalData({
      name: tutor.name,
      email:
        tutor.email ||
        `${tutor.name.toLowerCase().replace(/[^a-z0-9]/g, '')}@tutor.tadulakocendekia.sch.id`,
      password: tutor.temporaryPassword || 'tutor2026',
      phone: tutor.phone,
      education: tutor.education,
      subjects: tutor.subjects || [],
    })
  }

  // Confirm Status Change
  const handleConfirmStatusChange = async () => {
    if (!statusTargetTutor || isSubmittingStatus) return
    setIsSubmittingStatus(true)
    try {
      await updateTutor({
        id: statusTargetTutor.id,
        updates: {
          status: statusTargetTutor.status === 'aktif' ? 'nonaktif' : 'aktif',
        },
      })
      setStatusTargetTutor(null)
    } catch (err: unknown) {
      setTutorError(
        err instanceof Error ? err.message : 'Gagal mengubah status tutor.'
      )
    } finally {
      setIsSubmittingStatus(false)
    }
  }

  // Add Subject Submit
  const handleAddSubjectSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (isSubmittingSubject) return
    setSubjectError(null)
    setIsSubmittingSubject(true)
    try {
      await addSubject({
        code: subjectForm.code.toUpperCase(),
        name: subjectForm.name,
        level: subjectForm.level,
      })

      setIsAddSubjectOpen(false)
      setSubjectForm({
        code: '',
        name: '',
        level: 'UTBK',
      })
    } catch (err: unknown) {
      setSubjectError(err instanceof Error ? err.message : 'Gagal menyimpan mata pelajaran.')
    } finally {
      setIsSubmittingSubject(false)
    }
  }

  // Calculate summary metrics
  const totalWeeklySessions = tutors.reduce(
    (sum, t) => sum + (t.weeklySessionsCount || 0),
    0
  )

  const tabCards = [
    {
      key: 'tutors' as const,
      label: 'Direktori Pengajar',
      count: tutors.length,
      unit: 'Tutor',
      description: 'Tenaga pengajar aktif & pemetaan beban mengajar mingguan',
      sub: `${totalWeeklySessions} total sesi bimbingan / minggu`,
      icon: GraduationCap,
    },
    {
      key: 'subjects' as const,
      label: 'Mata Pelajaran Pintar Yuk',
      count: subjects.length,
      unit: 'Bidang Studi',
      description: 'Kurikulum materi bimbingan lintas 4 jenjang program',
      sub: 'Kurikulum lintas 4 jenjang program',
      icon: BookOpen,
    },
  ]

  // Tutor Columns (Clean Editorial Hierarchy)
  const tutorColumns: ColumnDef<Tutor>[] = [
    {
      accessorKey: 'name',
      header: 'Pengajar & kontak',
      cell: ({ row }) => {
        const t = row.original
        return (
          <div className="min-w-[200px]">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-sm text-[#000000] leading-snug">
                {t.name}
              </span>
              <span className="font-mono text-xs text-[#6B6B6B] tabular-nums">
                {t.id}
              </span>
            </div>
            <p className="text-xs text-[#6B6B6B] mt-0.5">
              {t.education}
            </p>
          </div>
        )
      },
    },
    {
      accessorKey: 'subjects',
      header: 'Spesialisasi mapel',
      cell: ({ row }) => (
        <div className="text-sm font-normal text-[#292524] max-w-[280px]">
          {row.original.subjects.join(', ')}
        </div>
      ),
    },
    {
      accessorKey: 'weeklySessionsCount',
      header: 'Beban sesi mingguan',
      cell: ({ getValue }) => (
        <span className="text-sm font-normal tabular-nums text-[#292524] whitespace-nowrap">
          {getValue() as number} sesi / minggu
        </span>
      ),
    },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: ({ row }) => <StatusBadge status={row.original.status} />,
    },
    {
      id: 'actions',
      header: 'Aksi',
      cell: ({ row }) => {
        const t = row.original
        return (
          <div className="flex items-center gap-2 whitespace-nowrap">
            <button
              type="button"
              onClick={() => handleViewCredentials(t)}
              className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold text-[#000000] bg-[#FFFFFF] border border-[#D2D2D2] rounded-[8px] hover:bg-[#F6F6F6] hover:border-[#000000] transition-colors cursor-pointer"
              title="Lihat Kredensial Akun Tutor"
            >
              <KeyRound className="w-3.5 h-3.5 text-[#CB2957]" />
              <span>Kredensial</span>
            </button>
            <button
              type="button"
              onClick={() => setStatusTargetTutor(t)}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-[8px] border transition-colors cursor-pointer ${
                t.status === 'aktif'
                  ? 'text-[#901B14] bg-[#FFFFFF] border-[#D2D2D2] hover:bg-[#F6E7E3] hover:border-[#901B14]'
                  : 'text-[#166534] bg-[#FFFFFF] border-[#D2D2D2] hover:bg-[#EAF5EC] hover:border-[#166534]'
              }`}
            >
              <span>{t.status === 'aktif' ? 'Nonaktifkan' : 'Aktifkan'}</span>
            </button>
          </div>
        )
      },
    },
  ]

  // Subject Columns
  const subjectColumns: ColumnDef<Subject>[] = [
    {
      accessorKey: 'code',
      header: 'Kode mapel',
      cell: ({ getValue }) => (
        <span className="font-mono text-xs text-[#6B6B6B] tabular-nums">
          {getValue() as string}
        </span>
      ),
    },
    {
      accessorKey: 'name',
      header: 'Nama mata pelajaran',
      cell: ({ getValue }) => (
        <span className="font-normal text-sm text-[#000000]">
          {getValue() as string}
        </span>
      ),
    },
    {
      accessorKey: 'level',
      header: 'Jenjang program',
      cell: ({ getValue }) => (
        <span className="text-sm font-normal text-[#555555]">
          Program {getValue() as string}
        </span>
      ),
    },
    {
      accessorKey: 'tutorCount',
      header: 'Tutor pengampu',
      cell: ({ getValue }) => (
        <span className="text-xs font-semibold text-[#000000] tabular-nums">
          {getValue() as number} pengajar
        </span>
      ),
    },
  ]

  return (
    <div className="space-y-6">
      {/* Editorial Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-5 border-b border-[#D2D2D2]">
        <div>
          <span className="text-[11px] font-bold uppercase tracking-[0.08em] text-[#A81E46] block mb-1">
            Tenaga Pendidik & Kurikulum
          </span>
          <h1 className="font-display font-extrabold text-2xl sm:text-[28px] text-[#000000] tracking-tight leading-tight">
            Direktori Tutor & Mata Pelajaran
          </h1>
          <p className="text-xs sm:text-sm text-[#555555] mt-1">
            Manajemen pengajar Pintar Yuk, kualifikasi akademik, dan distribusi kurikulum mata pelajaran.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto shrink-0">
          {activeTab === 'tutors' ? (
            <button
              type="button"
              onClick={() => setIsAddTutorOpen(true)}
              className="inline-flex items-center gap-2 px-4 py-2.5 text-xs font-semibold text-[#FFFFFF] bg-[#000000] rounded-[10px] hover:bg-[#262626] transition-colors cursor-pointer"
            >
              <UserPlus className="w-4 h-4" />
              <span>Tambah Tutor Baru</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={() => setIsAddSubjectOpen(true)}
              className="inline-flex items-center gap-2 px-4 py-2.5 text-xs font-semibold text-[#FFFFFF] bg-[#000000] rounded-[10px] hover:bg-[#262626] transition-colors cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Tambah Mata Pelajaran</span>
            </button>
          )}
        </div>
      </div>

      {/* 2 Standardized Tab / Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {tabCards.map((card) => {
          const isSelected = activeTab === card.key
          return (
            <SummaryMetricCard
              key={card.key}
              title={card.label}
              value={card.count}
              unit={card.unit}
              description={card.description}
              icon={card.icon}
              isSelected={isSelected}
              onClick={() => setActiveTab(card.key)}
              className="rounded-[14px]"
              footer={
                <div className="text-xs">
                  <span>{card.sub}</span>
                </div>
              }
            />
          )
        })}
      </div>

      {/* Tab Content */}
      {activeTab === 'tutors' ? (
        <DataTable
          columns={tutorColumns}
          data={tutors}
          searchPlaceholder="Cari nama pengajar, ID, spesialisasi, atau kontak..."
        />
      ) : (
        <DataTable
          columns={subjectColumns}
          data={subjects}
          searchPlaceholder="Cari kode mapel, nama mata pelajaran, atau jenjang..."
        />
      )}

      {/* DIALOG 1: Tambah Tutor Baru */}
      <Dialog.Root
        open={isAddTutorOpen}
        onOpenChange={(open) => {
          if (!open && !isSubmittingTutor) {
            setIsAddTutorOpen(false)
            setTutorError(null)
          }
        }}
      >
        <Dialog.Portal>
          <Dialog.Backdrop className="fixed inset-0 bg-black/60 z-50 backdrop-blur-xs" />
          <Dialog.Viewport className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
            <Dialog.Popup className="w-full max-w-md bg-[#FFFFFF] border border-[#D2D2D2] rounded-[14px] p-4 sm:p-6 shadow-xl space-y-4 my-8 max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between border-b border-[#D2D2D2] pb-3">
                <Dialog.Title className="font-display font-bold text-base text-[#000000]">
                  Tambah Data Tutor / Pengajar
                </Dialog.Title>
                <Dialog.Close
                  disabled={isSubmittingTutor}
                  render={
                    <button
                      type="button"
                      disabled={isSubmittingTutor}
                      onClick={() => setTutorError(null)}
                      className="p-1 text-[#555555] hover:text-[#000000] rounded-[6px] disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                    />
                  }
                >
                  <X className="w-4 h-4" />
                </Dialog.Close>
              </div>

              <form onSubmit={handleAddTutorSubmit} className="space-y-3.5 text-xs">
                {tutorError && (
                  <div
                    className="p-3 bg-[#F6E7E3] border border-[#901B14]/30 rounded-[8px] flex items-start gap-2.5 text-xs text-[#901B14]"
                    role="alert"
                  >
                    <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                    <span>{tutorError}</span>
                  </div>
                )}
                <div className="space-y-1">
                  <label className="font-medium text-[#000000]">
                    Nama Lengkap & Gelar *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Contoh: Kak Dian Pratiwi, S.Si"
                    value={tutorForm.name}
                    onChange={(e) =>
                      setTutorForm({ ...tutorForm, name: e.target.value })
                    }
                    className="w-full h-10 px-3 text-xs bg-[#F6F6F6] border border-[#D2D2D2] rounded-[10px] text-[#000000] focus:outline-none focus:border-[#000000]"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-medium text-[#000000]">
                    Alamat Email (Akun Portal) *
                  </label>
                  <input
                    type="email"
                    required
                    placeholder="contoh: dian.pratiwi@tutor.tadulakocendekia.sch.id"
                    value={tutorForm.email}
                    onChange={(e) =>
                      setTutorForm({ ...tutorForm, email: e.target.value })
                    }
                    className="w-full h-10 px-3 text-xs bg-[#F6F6F6] border border-[#D2D2D2] rounded-[10px] text-[#000000] focus:outline-none focus:border-[#000000]"
                  />
                  <p className="text-[11px] text-[#555555]">
                    Kata sandi login diterbitkan otomatis: <span className="font-mono font-semibold text-[#CB2957]">tutor2026</span>
                  </p>
                </div>

                <div className="space-y-1">
                  <label className="font-medium text-[#000000]">
                    Nomor WhatsApp *
                  </label>
                  <input
                    type="tel"
                    required
                    placeholder="0812-xxxx-xxxx"
                    value={tutorForm.phone}
                    onChange={(e) =>
                      setTutorForm({ ...tutorForm, phone: e.target.value })
                    }
                    className="w-full h-10 px-3 text-xs bg-[#F6F6F6] border border-[#D2D2D2] rounded-[10px] text-[#000000] focus:outline-none focus:border-[#000000]"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-medium text-[#000000]">
                    Latar Pendidikan / Almamater *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Contoh: S1 Fisika — Universitas Tadulako"
                    value={tutorForm.education}
                    onChange={(e) =>
                      setTutorForm({ ...tutorForm, education: e.target.value })
                    }
                    className="w-full h-10 px-3 text-xs bg-[#F6F6F6] border border-[#D2D2D2] rounded-[10px] text-[#000000] focus:outline-none focus:border-[#000000]"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-medium text-[#000000]">
                    Mata Pelajaran (pisahkan dengan koma) *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Contoh: Fisika UTBK, IPA Terpadu SMP"
                    value={tutorForm.subjectsString}
                    onChange={(e) =>
                      setTutorForm({
                        ...tutorForm,
                        subjectsString: e.target.value,
                      })
                    }
                    className="w-full h-10 px-3 text-xs bg-[#F6F6F6] border border-[#D2D2D2] rounded-[10px] text-[#000000] focus:outline-none focus:border-[#000000]"
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#D2D2D2]">
                  <button
                    type="button"
                    disabled={isSubmittingTutor}
                    onClick={() => {
                      setIsAddTutorOpen(false)
                      setTutorError(null)
                    }}
                    className="px-3.5 py-2 text-xs font-semibold text-[#000000] bg-[#FFFFFF] border border-[#D2D2D2] rounded-[8px] hover:bg-[#F6F6F6] disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmittingTutor}
                    className="inline-flex items-center justify-center gap-1.5 px-4 py-2 text-xs font-semibold text-[#FFFFFF] bg-[#000000] rounded-[8px] hover:bg-[#262626] disabled:opacity-50 disabled:cursor-not-allowed transition-colors cursor-pointer"
                  >
                    {isSubmittingTutor ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        <span>Menyimpan Data Tutor...</span>
                      </>
                    ) : (
                      <span>Simpan Data Tutor</span>
                    )}
                  </button>
                </div>
              </form>
            </Dialog.Popup>
          </Dialog.Viewport>
        </Dialog.Portal>
      </Dialog.Root>

      {/* DIALOG 2: Tambah Mata Pelajaran Baru */}
      <Dialog.Root
        open={isAddSubjectOpen}
        onOpenChange={(open) => {
          if (!open && !isSubmittingSubject) {
            setIsAddSubjectOpen(false)
            setSubjectError(null)
          }
        }}
      >
        <Dialog.Portal>
          <Dialog.Backdrop className="fixed inset-0 bg-black/60 z-50 backdrop-blur-xs" />
          <Dialog.Viewport className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4">
            <Dialog.Popup className="w-full max-w-md bg-[#FFFFFF] border border-[#D2D2D2] rounded-[14px] p-4 sm:p-6 shadow-xl space-y-4 max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between border-b border-[#D2D2D2] pb-3">
                <Dialog.Title className="font-display font-bold text-base text-[#000000]">
                  Tambah Mata Pelajaran Baru
                </Dialog.Title>
                <Dialog.Close
                  disabled={isSubmittingSubject}
                  render={
                    <button
                      type="button"
                      disabled={isSubmittingSubject}
                      onClick={() => setSubjectError(null)}
                      className="p-1 text-[#555555] hover:text-[#000000] rounded-[6px] disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                    />
                  }
                >
                  <X className="w-4 h-4" />
                </Dialog.Close>
              </div>

              <form onSubmit={handleAddSubjectSubmit} className="space-y-3.5 text-xs">
                {subjectError && (
                  <div
                    className="p-3 bg-[#F6E7E3] border border-[#901B14]/30 rounded-[8px] flex items-start gap-2.5 text-xs text-[#901B14]"
                    role="alert"
                  >
                    <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                    <span>{subjectError}</span>
                  </div>
                )}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="font-medium text-[#000000]">
                      Kode Mapel *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="FS-UTBK"
                      value={subjectForm.code}
                      onChange={(e) =>
                        setSubjectForm({ ...subjectForm, code: e.target.value })
                      }
                      className="w-full h-10 px-3 text-xs bg-[#F6F6F6] border border-[#D2D2D2] rounded-[10px] text-[#000000] focus:outline-none focus:border-[#000000] font-mono"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="font-medium text-[#000000]">
                      Jenjang Program *
                    </label>
                    <select
                      value={subjectForm.level}
                      onChange={(e) =>
                        setSubjectForm({
                          ...subjectForm,
                          level: e.target.value as PackageCode,
                        })
                      }
                      className="w-full h-10 px-3 text-xs font-medium bg-[#F6F6F6] border border-[#D2D2D2] rounded-[10px] text-[#000000] focus:outline-none focus:border-[#000000]"
                    >
                      <option value="UTBK">UTBK-SNBT</option>
                      <option value="SMA">SMA</option>
                      <option value="SMP">SMP</option>
                      <option value="SD">SD</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="font-medium text-[#000000]">
                    Nama Mata Pelajaran *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Contoh: Penalaran Umum & Logika"
                    value={subjectForm.name}
                    onChange={(e) =>
                      setSubjectForm({ ...subjectForm, name: e.target.value })
                    }
                    className="w-full h-10 px-3 text-xs bg-[#F6F6F6] border border-[#D2D2D2] rounded-[10px] text-[#000000] focus:outline-none focus:border-[#000000]"
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#D2D2D2]">
                  <button
                    type="button"
                    disabled={isSubmittingSubject}
                    onClick={() => {
                      setIsAddSubjectOpen(false)
                      setSubjectError(null)
                    }}
                    className="px-3.5 py-2 text-xs font-semibold text-[#000000] bg-[#FFFFFF] border border-[#D2D2D2] rounded-[8px] hover:bg-[#F6F6F6] disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmittingSubject}
                    className="inline-flex items-center justify-center gap-1.5 px-4 py-2 text-xs font-semibold text-[#FFFFFF] bg-[#000000] rounded-[8px] hover:bg-[#262626] disabled:opacity-50 disabled:cursor-not-allowed transition-colors cursor-pointer"
                  >
                    {isSubmittingSubject ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        <span>Menyimpan Mapel...</span>
                      </>
                    ) : (
                      <span>Simpan Mapel</span>
                    )}
                  </button>
                </div>
              </form>
            </Dialog.Popup>
          </Dialog.Viewport>
        </Dialog.Portal>
      </Dialog.Root>
      {/* DIALOG 3: Kredensial Akses Akun Tutor */}
      <Dialog.Root
        open={Boolean(credentialsModalData)}
        onOpenChange={(open) => !open && setCredentialsModalData(null)}
      >
        <Dialog.Portal>
          <Dialog.Backdrop className="fixed inset-0 bg-black/60 z-50 backdrop-blur-xs" />
          <Dialog.Viewport className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
            <Dialog.Popup className="w-full max-w-lg bg-[#FFFFFF] border border-[#D2D2D2] rounded-[14px] p-5 sm:p-6 shadow-xl space-y-5 my-8 max-h-[90vh] overflow-y-auto overflow-x-hidden">
              <div className="flex items-start justify-between border-b border-[#D2D2D2] pb-3.5">
                <div>
                  <Dialog.Title className="font-display font-bold text-base text-[#000000] flex items-center gap-2">
                    <KeyRound className="w-4 h-4 text-[#CB2957]" />
                    <span>Kredensial Akses Akun Tutor</span>
                  </Dialog.Title>
                  <p className="text-xs text-[#555555] mt-0.5">
                    Akun pengajar resmi terdaftar. Kirimkan detail akun login berikut kepada tutor yang bersangkutan.
                  </p>
                </div>
                <Dialog.Close
                  render={
                    <button
                      type="button"
                      className="p-1 text-[#555555] hover:text-[#000000] rounded-[6px] cursor-pointer"
                      onClick={() => setCredentialsModalData(null)}
                      aria-label="Tutup dialog kredensial"
                    />
                  }
                >
                  <X className="w-4 h-4" />
                </Dialog.Close>
              </div>

              {credentialsModalData && (
                <div className="space-y-4 text-xs">
                  {/* Card: Akun Tutor */}
                  <div className="p-4 bg-[#FFFFFF] border border-[#D2D2D2] rounded-[10px] space-y-2.5">
                    <div className="flex items-center justify-between pb-2 border-b border-[#D2D2D2] gap-2 flex-wrap">
                      <span className="font-bold text-[#000000] text-xs uppercase tracking-wide flex items-center gap-1.5 shrink-0">
                        <GraduationCap className="w-3.5 h-3.5 text-[#000000]" />
                        <span>Akun Portal Pengajar</span>
                      </span>
                      <span className="text-[11px] font-semibold text-[#166534] truncate max-w-[200px]">
                        {Array.isArray(credentialsModalData.subjects) &&
                        credentialsModalData.subjects.length > 0
                          ? credentialsModalData.subjects.join(', ')
                          : 'Tutor'}
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                      <div className="min-w-0 space-y-0.5">
                        <span className="text-[#555555] block text-[11px]">Nama Tutor:</span>
                        <strong
                          className="text-[#000000] font-medium block truncate"
                          title={credentialsModalData.name}
                        >
                          {credentialsModalData.name}
                        </strong>
                      </div>
                      <div className="min-w-0 space-y-0.5">
                        <span className="text-[#555555] block text-[11px]">Nomor WhatsApp:</span>
                        <span className="font-mono text-[#000000] block select-all">
                          {credentialsModalData.phone}
                        </span>
                      </div>
                      <div className="min-w-0 space-y-0.5">
                        <span className="text-[#555555] block text-[11px]">Email Login:</span>
                        <span className="font-mono text-[#000000] block break-all select-all font-semibold">
                          {credentialsModalData.email}
                        </span>
                      </div>
                      <div className="min-w-0 space-y-0.5">
                        <span className="text-[#555555] block text-[11px]">Kata Sandi Sementara:</span>
                        <span className="font-mono text-[#CB2957] font-bold block select-all">
                          {credentialsModalData.password}
                        </span>
                      </div>
                      <div className="min-w-0 space-y-0.5 sm:col-span-2">
                        <span className="text-[#555555] block text-[11px]">Latar Pendidikan:</span>
                        <span
                          className="text-[#000000] block truncate"
                          title={credentialsModalData.education}
                        >
                          {credentialsModalData.education}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* WhatsApp Copy Template Box */}
                  <div className="p-3.5 bg-[#F6F6F6] rounded-[8px] border border-[#D2D2D2] text-[11px] text-[#555555] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <span className="min-w-0 leading-relaxed">
                      Salin format pesan siap kirim untuk disampaikan langsung kepada pengajar melalui WhatsApp.
                    </span>
                    <button
                      type="button"
                      onClick={handleCopyWhatsAppTemplate}
                      className="shrink-0 inline-flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-semibold text-[#FFFFFF] bg-[#000000] hover:bg-[#262626] rounded-[6px] transition-colors cursor-pointer"
                    >
                      {isTemplateCopied ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-[#166534]" />
                          <span>Format Disalin</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" />
                          <span>Salin Format WhatsApp</span>
                        </>
                      )}
                    </button>
                  </div>

                  {/* Footer Actions */}
                  <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#D2D2D2]">
                    <button
                      type="button"
                      onClick={() => setCredentialsModalData(null)}
                      className="px-4 py-2 text-xs font-semibold text-[#FFFFFF] bg-[#000000] hover:bg-[#262626] rounded-[8px] transition-colors cursor-pointer"
                    >
                      Tutup & Selesai
                    </button>
                  </div>
                </div>
              )}
            </Dialog.Popup>
          </Dialog.Viewport>
        </Dialog.Portal>
      </Dialog.Root>

      {/* DIALOG 4: Konfirmasi Ubah Status Tutor */}
      <Dialog.Root
        open={Boolean(statusTargetTutor)}
        onOpenChange={(open) => !open && setStatusTargetTutor(null)}
      >
        <Dialog.Portal>
          <Dialog.Backdrop className="fixed inset-0 bg-black/60 z-50 backdrop-blur-xs" />
          <Dialog.Viewport className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
            <Dialog.Popup className="w-full max-w-md bg-[#FFFFFF] border border-[#D2D2D2] rounded-[14px] p-5 sm:p-6 shadow-xl space-y-4 my-8">
              <div className="flex items-center justify-between border-b border-[#D2D2D2] pb-3">
                <Dialog.Title className="font-display font-bold text-base text-[#000000] flex items-center gap-2">
                  <AlertCircle
                    className={`w-4 h-4 ${
                      statusTargetTutor?.status === 'aktif' ? 'text-[#901B14]' : 'text-[#166534]'
                    }`}
                  />
                  <span>
                    {statusTargetTutor?.status === 'aktif'
                      ? 'Konfirmasi Nonaktifkan Tutor'
                      : 'Konfirmasi Aktifkan Tutor'}
                  </span>
                </Dialog.Title>
                <Dialog.Close
                  disabled={isSubmittingStatus}
                  render={
                    <button
                      type="button"
                      disabled={isSubmittingStatus}
                      onClick={() => setStatusTargetTutor(null)}
                      className="p-1 text-[#555555] hover:text-[#000000] rounded-[6px] disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                    />
                  }
                >
                  <X className="w-4 h-4" />
                </Dialog.Close>
              </div>

              {statusTargetTutor && (
                <div className="space-y-4 text-xs">
                  <p className="text-[#000000] leading-relaxed">
                    {statusTargetTutor.status === 'aktif' ? (
                      <>
                        Apakah Anda yakin ingin menonaktifkan akun pengajar{' '}
                        <strong className="text-[#000000]">{statusTargetTutor.name}</strong>?
                        Tutor yang dinonaktifkan tidak akan dapat masuk ke portal bimbingan dan tidak muncul di alokasi jadwal aktif.
                      </>
                    ) : (
                      <>
                        Apakah Anda yakin ingin mengaktifkan kembali akun pengajar{' '}
                        <strong className="text-[#000000]">{statusTargetTutor.name}</strong>?
                        Tutor akan dapat kembali masuk ke portal pengajar dan menerima jadwal bimbingan.
                      </>
                    )}
                  </p>

                  <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#D2D2D2]">
                    <button
                      type="button"
                      disabled={isSubmittingStatus}
                      onClick={() => setStatusTargetTutor(null)}
                      className="px-3.5 py-2 text-xs font-semibold text-[#000000] bg-[#FFFFFF] border border-[#D2D2D2] rounded-[8px] hover:bg-[#F6F6F6] disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
                    >
                      Batal
                    </button>
                    <button
                      type="button"
                      disabled={isSubmittingStatus}
                      onClick={handleConfirmStatusChange}
                      className={`inline-flex items-center justify-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-[8px] transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed ${
                        statusTargetTutor.status === 'aktif'
                          ? 'bg-[#901B14] hover:bg-[#721510] text-[#FFFFFF]'
                          : 'bg-[#000000] hover:bg-[#262626] text-[#FFFFFF]'
                      }`}
                    >
                      {isSubmittingStatus ? (
                        <>
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          <span>Memproses...</span>
                        </>
                      ) : (
                        <span>
                          {statusTargetTutor.status === 'aktif'
                            ? 'Ya, Nonaktifkan Tutor'
                            : 'Ya, Aktifkan Tutor'}
                        </span>
                      )}
                    </button>
                  </div>
                </div>
              )}
            </Dialog.Popup>
          </Dialog.Viewport>
        </Dialog.Portal>
      </Dialog.Root>
    </div>
  )
}
