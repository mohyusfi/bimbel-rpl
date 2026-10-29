import * as React from 'react'
import { createFileRoute, Link } from '@tanstack/react-router'
import {
  ArrowLeft,
  Edit,
  GraduationCap,
  Users,
  Calendar,
  CheckCircle2,
  Clock,
  MapPin,
  Briefcase,
  Phone,
  Mail,
  School,
  AlertCircle,
  X,
  BookOpen,
  KeyRound,
  Copy,
  Check,
  Lock,
  Loader2,
} from 'lucide-react'
import { Dialog } from '@base-ui/react/dialog'
import {
  useAdminStudentDetail,
  useAdminClasses,
  useAdminMutations,
} from '~/hooks/use-admin-data'
import { StatusBadge } from '~/components/ui/status-badge'
import { SearchableSelect } from '~/components/ui/searchable-select'
import { useAuth } from '~/hooks/use-auth'
import { cn } from '~/lib/utils'
import type { Student } from '~/lib/admin-store'

export const Route = createFileRoute('/admin/siswa_/$studentId')({
  ssr: false,
  component: AdminStudentDetailPage,
})

function AdminStudentDetailPage() {
  const { studentId } = Route.useParams()
  const { data: student, isLoading, error } = useAdminStudentDetail(studentId)
  const { data: classes = [] } = useAdminClasses()
  const { updateStudent } = useAdminMutations()
  const { adminResetUserPassword } = useAuth()

  // Modal edit state
  const [isEditModalOpen, setIsEditModalOpen] = React.useState(false)
  const [editError, setEditError] = React.useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = React.useState(false)

  // Reset Password Modal State
  const [isResetModalOpen, setIsResetModalOpen] = React.useState(false)
  const [resetRole, setResetRole] = React.useState<'student' | 'parent'>('student')
  const [resetNewPassword, setResetNewPassword] = React.useState('')
  const [isResetSubmitting, setIsResetSubmitting] = React.useState(false)
  const [resetSuccessData, setResetSuccessData] = React.useState<{
    targetRole: 'student' | 'parent'
    targetName: string
    emailOrNis: string
    password: string
  } | null>(null)
  const [resetError, setResetError] = React.useState<string | null>(null)
  const [isCopied, setIsCopied] = React.useState(false)

  const handleOpenReset = () => {
    setResetRole('student')
    setResetNewPassword('')
    setResetSuccessData(null)
    setResetError(null)
    setIsCopied(false)
    setIsResetModalOpen(true)
  }

  const handleExecuteReset = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!student) return
    setIsResetSubmitting(true)
    setResetError(null)
    setResetSuccessData(null)

    const isTargetStudent = resetRole === 'student'
    const targetEmail = isTargetStudent
      ? student.email
      : student.parentEmail || `${student.name.toLowerCase().replace(/[^a-z0-9]/g, '')}.wali@tadulakocendekia.sch.id`
    const targetName = isTargetStudent ? student.name : student.parentName

    try {
      const res = await adminResetUserPassword({
        targetRole: resetRole,
        targetId: student.id,
        email: targetEmail,
        newPassword: resetNewPassword || undefined,
      })

      if (res.success && res.newPassword) {
        setResetSuccessData({
          targetRole: resetRole,
          targetName,
          emailOrNis: isTargetStudent ? `${student.email} (NIS: ${student.nis})` : targetEmail,
          password: res.newPassword,
        })
      } else {
        setResetError(res.error || '[ERROR] Gagal mereset kata sandi.')
      }
    } catch {
      setResetError('[ERROR] Terjadi kesalahan saat memproses reset kata sandi.')
    } finally {
      setIsResetSubmitting(false)
    }
  }

  const handleCopyCredentials = () => {
    if (!resetSuccessData) return
    const textToCopy = `[Anemone Cendekia] Kredensial Akses Akun\nNama: ${resetSuccessData.targetName}\nPeran: ${resetSuccessData.targetRole === 'student' ? 'Siswa' : 'Orang Tua / Wali'}\nAkun Masuk: ${resetSuccessData.emailOrNis}\nKata Sandi Baru: ${resetSuccessData.password}\n\nSilakan masuk melalui portal resmi: /masuk`
    navigator.clipboard.writeText(textToCopy)
    setIsCopied(true)
    setTimeout(() => setIsCopied(false), 3000)
  }

  const [editForm, setEditForm] = React.useState({
    name: '',
    email: '',
    phone: '',
    school: '',
    classId: '',
    parentName: '',
    parentPhone: '',
    parentEmail: '',
    parentJob: '',
    parentAddress: '',
    status: 'aktif' as 'aktif' | 'nonaktif',
  })

  const handleOpenEdit = () => {
    if (!student) return
    setEditError(null)
    setEditForm({
      name: student.name,
      email: student.email || '',
      phone: student.phone || '',
      school: student.school,
      classId: student.classId,
      parentName: student.parentName,
      parentPhone: student.parentPhone,
      parentEmail: student.parentEmail || '',
      parentJob: student.parentJob || '',
      parentAddress: student.parentAddress || '',
      status: student.status,
    })
    setIsEditModalOpen(true)
  }

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!student) return

    setEditError(null)
    setIsSubmitting(true)
    const targetClass = classes.find((c) => c.id === editForm.classId)

    try {
      await updateStudent({
        id: student.id,
        updates: {
          name: editForm.name,
          email: editForm.email,
          phone: editForm.phone,
          school: editForm.school,
          classId: editForm.classId,
          className: targetClass?.name || student.className,
          parentName: editForm.parentName,
          parentPhone: editForm.parentPhone,
          parentEmail: editForm.parentEmail,
          parentJob: editForm.parentJob,
          parentAddress: editForm.parentAddress,
          status: editForm.status,
        },
      })
      setIsEditModalOpen(false)
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Gagal menyimpan perubahan data siswa.'
      setEditError(message)
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-8 bg-[#D2D2D2]/30 rounded-[8px] w-48" />
        <div className="h-24 bg-[#FFFFFF] border border-[#D2D2D2] rounded-[14px]" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="h-48 bg-[#FFFFFF] border border-[#D2D2D2] rounded-[14px] md:col-span-2" />
          <div className="h-48 bg-[#FFFFFF] border border-[#D2D2D2] rounded-[14px]" />
        </div>
      </div>
    )
  }

  if (error || !student) {
    return (
      <div className="space-y-6">
        <div className="bg-[#FFFFFF] border border-[#D2D2D2] rounded-[14px] p-8 text-center space-y-4 max-w-lg mx-auto mt-12">
          <div className="w-12 h-12 rounded-full bg-[#CB2957]/10 text-[#CB2957] flex items-center justify-center mx-auto">
            <AlertCircle className="w-6 h-6" />
          </div>
          <div>
            <h2 className="font-display font-bold text-lg text-[#000000]">
              Data Siswa Tidak Ditemukan
            </h2>
            <p className="text-xs text-[#555555] mt-1 leading-relaxed">
              Siswa dengan ID <span className="font-mono text-[#000000]">{studentId}</span> tidak tercatat dalam basis data direktori akademik.
            </p>
          </div>
          <Link
            to="/admin/siswa"
            className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-[#000000] text-[#FFFFFF] text-xs font-semibold rounded-[8px] hover:bg-[#262626] transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Kembali ke Direktori Siswa</span>
          </Link>
        </div>
      </div>
    )
  }

  const currentStudentsCount = student.classDetails?.currentStudents ?? 1
  const capacity = student.classDetails?.capacity ?? 12

  return (
    <div className="space-y-6">
      {/* Header & Breadcrumb Nav */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-[#D2D2D2]">
        <div className="space-y-1">
          <Link
            to="/admin/siswa"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#555555] hover:text-[#000000] transition-colors mb-2 cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Kembali ke Direktori Siswa</span>
          </Link>
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="font-display font-extrabold text-2xl sm:text-[28px] text-[#000000] tracking-tight leading-tight">
              {student.name}
            </h1>
            <span className="font-mono text-xs text-[#555555]">
              NIS: {student.nis}
            </span>
            <StatusBadge status={student.status} />
          </div>
          <p className="text-xs text-[#555555] mt-0.5">
            Terdaftar di rombel <span className="font-medium text-[#000000]">{student.className}</span> sejak {student.joinDate}.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto shrink-0">
          <button
            type="button"
            onClick={handleOpenReset}
            className="inline-flex items-center gap-2 px-3.5 py-2.5 text-xs font-semibold text-[#CB2957] bg-[#FFFFFF] border border-[#D2D2D2] rounded-[10px] hover:border-[#CB2957] hover:bg-[#FEF2F2] transition-colors cursor-pointer"
            title="Reset Kata Sandi Akun Siswa & Wali"
          >
            <KeyRound className="w-4 h-4 text-[#CB2957]" />
            <span>Reset Password</span>
          </button>
          <button
            type="button"
            onClick={handleOpenEdit}
            className="inline-flex items-center gap-2 px-4 py-2.5 text-xs font-semibold text-[#FFFFFF] bg-[#000000] rounded-[10px] hover:bg-[#262626] transition-colors cursor-pointer"
          >
            <Edit className="w-4 h-4" />
            <span>Edit Data Siswa</span>
          </button>
        </div>
      </div>

      {/* Summary KPI Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        <div className="bg-[#FFFFFF] border border-[#D2D2D2] rounded-[14px] p-4 flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-[10px] bg-[#F6F6F6] border border-[#D2D2D2] flex items-center justify-center shrink-0">
            <GraduationCap className="w-5 h-5 text-[#000000]" />
          </div>
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#6B6B6B] block">
              Program Belajar
            </span>
            <span className="font-bold text-sm text-[#000000] block mt-0.5">
              Paket {student.packageCode}
            </span>
            <span className="text-[11px] text-[#555555]">Kurikulum Terpadu</span>
          </div>
        </div>

        <div className="bg-[#FFFFFF] border border-[#D2D2D2] rounded-[14px] p-4 flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-[10px] bg-[#F6F6F6] border border-[#D2D2D2] flex items-center justify-center shrink-0">
            <Users className="w-5 h-5 text-[#000000]" />
          </div>
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#6B6B6B] block">
              Rombel Kelas
            </span>
            <span className="font-bold text-sm text-[#000000] block mt-0.5 truncate max-w-[160px]">
              {student.className}
            </span>
            <span className="text-[11px] text-[#555555]">
              {currentStudentsCount}/{capacity} Kursi Terisi
            </span>
          </div>
        </div>

        <div className="bg-[#FFFFFF] border border-[#D2D2D2] rounded-[14px] p-4 flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-[10px] bg-[#F6F6F6] border border-[#D2D2D2] flex items-center justify-center shrink-0">
            <Calendar className="w-5 h-5 text-[#000000]" />
          </div>
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#6B6B6B] block">
              Jadwal Mingguan
            </span>
            <span className="font-bold text-sm text-[#000000] block mt-0.5">
              {student.schedules?.length ?? 0} Sesi Belajar
            </span>
            <span className="text-[11px] text-[#555555]">Pertemuan per pekan</span>
          </div>
        </div>

        <div className="bg-[#FFFFFF] border border-[#D2D2D2] rounded-[14px] p-4 flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-[10px] bg-[#F6F6F6] border border-[#D2D2D2] flex items-center justify-center shrink-0">
            <CheckCircle2 className="w-5 h-5 text-[#CB2957]" />
          </div>
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#6B6B6B] block">
              Status Presensi
            </span>
            <span className="font-bold text-sm text-[#000000] block mt-0.5 capitalize">
              {student.status}
            </span>
            <span className="text-[11px] text-[#555555]">Hak Akses Aktif</span>
          </div>
        </div>
      </div>

      {/* Main Grid: Data Sections */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Biodata & Kontak Orang Tua */}
        <div className="lg:col-span-2 space-y-6">
          {/* Card 1: Identitas Siswa */}
          <div className="bg-[#FFFFFF] border border-[#D2D2D2] rounded-[14px] p-5 sm:p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#D2D2D2]">
              <div className="flex items-center gap-2">
                <School className="w-4 h-4 text-[#CB2957]" />
                <h3 className="font-display font-bold text-sm text-[#000000] uppercase tracking-wide">
                  1. Biodata & Identitas Akademik Siswa
                </h3>
              </div>
              <span className="font-mono text-xs text-[#555555]">
                {student.nis}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="space-y-1">
                <span className="text-[#6B6B6B] block">Nama Lengkap</span>
                <span className="font-semibold text-sm text-[#000000] block">
                  {student.name}
                </span>
              </div>

              <div className="space-y-1">
                <span className="text-[#6B6B6B] block">Sekolah Asal</span>
                <span className="font-semibold text-[#000000] block">
                  {student.school}
                </span>
              </div>

              <div className="space-y-1">
                <span className="text-[#6B6B6B] block">Email Siswa</span>
                <div className="flex items-center gap-1.5 font-medium text-[#000000]">
                  <Mail className="w-3.5 h-3.5 text-[#555555]" />
                  <span>{student.email || '—'}</span>
                </div>
              </div>

              <div className="space-y-1">
                <span className="text-[#6B6B6B] block">Nomor Telepon / WhatsApp</span>
                <div className="flex items-center gap-1.5 font-medium text-[#000000]">
                  <Phone className="w-3.5 h-3.5 text-[#555555]" />
                  <span className="font-mono">{student.phone || '—'}</span>
                </div>
              </div>

              <div className="space-y-1">
                <span className="text-[#6B6B6B] block">Jenjang Program</span>
                <span className="font-medium text-[#000000] block">
                  Program {student.packageCode}
                </span>
              </div>

              <div className="space-y-1">
                <span className="text-[#6B6B6B] block">Tanggal Bergabung</span>
                <span className="font-medium text-[#000000] block">
                  {student.joinDate}
                </span>
              </div>
            </div>
          </div>

          {/* Card 2: Data Orang Tua / Wali Murid */}
          <div className="bg-[#FFFFFF] border border-[#D2D2D2] rounded-[14px] p-5 sm:p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#D2D2D2]">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-[#CB2957]" />
                <h3 className="font-display font-bold text-sm text-[#000000] uppercase tracking-wide">
                  2. Kontak & Data Orang Tua / Wali Murid
                </h3>
              </div>
              <span className="text-xs text-[#555555]">Kontak Darurat</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="space-y-1">
                <span className="text-[#6B6B6B] block">Nama Orang Tua / Wali</span>
                <span className="font-semibold text-sm text-[#000000] block">
                  {student.parentName}
                </span>
              </div>

              <div className="space-y-1">
                <span className="text-[#6B6B6B] block">Nomor WhatsApp Orang Tua</span>
                <div className="flex items-center gap-1.5 font-medium text-[#000000]">
                  <Phone className="w-3.5 h-3.5 text-[#25D366]" />
                  <span className="font-mono">{student.parentPhone}</span>
                </div>
              </div>

              <div className="space-y-1">
                <span className="text-[#6B6B6B] block">Pekerjaan Orang Tua / Wali</span>
                <div className="flex items-center gap-1.5 font-medium text-[#000000]">
                  <Briefcase className="w-3.5 h-3.5 text-[#555555]" />
                  <span>{student.parentJob || 'Wiraswasta / Pegawai'}</span>
                </div>
              </div>

              <div className="space-y-1">
                <span className="text-[#6B6B6B] block">Email Wali Murid</span>
                <div className="flex items-center gap-1.5 font-medium text-[#000000]">
                  <Mail className="w-3.5 h-3.5 text-[#555555]" />
                  <span>{student.parentEmail || `${student.email.split('@')[0]}.wali@tadulakocendekia.sch.id`}</span>
                </div>
              </div>

              <div className="sm:col-span-2 space-y-1 pt-1">
                <span className="text-[#6B6B6B] block">Alamat Domisili Siswa</span>
                <div className="flex items-start gap-1.5 font-medium text-[#000000]">
                  <MapPin className="w-3.5 h-3.5 text-[#555555] shrink-0 mt-0.5" />
                  <span>{student.parentAddress || 'Alamat tempat tinggal terdaftar'}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Card 3: Jadwal Bimbingan Rombel */}
          <div className="bg-[#FFFFFF] border border-[#D2D2D2] rounded-[14px] p-5 sm:p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#D2D2D2]">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-[#CB2957]" />
                <h3 className="font-display font-bold text-sm text-[#000000] uppercase tracking-wide">
                  3. Jadwal Bimbingan Rombel {student.className}
                </h3>
              </div>
              <span className="text-xs text-[#555555]">
                {student.schedules?.length ?? 0} Sesi Mingguan
              </span>
            </div>

            {student.schedules && student.schedules.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-[#D2D2D2] text-[#6B6B6B] text-left">
                      <th className="pb-2.5 font-bold uppercase tracking-wider text-[11px]">Hari</th>
                      <th className="pb-2.5 font-bold uppercase tracking-wider text-[11px]">Waktu</th>
                      <th className="pb-2.5 font-bold uppercase tracking-wider text-[11px]">Mata Pelajaran</th>
                      <th className="pb-2.5 font-bold uppercase tracking-wider text-[11px]">Tutor</th>
                      <th className="pb-2.5 font-bold uppercase tracking-wider text-[11px]">Ruangan</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#D2D2D2]/50">
                    {student.schedules.map((sch) => (
                      <tr key={sch.id} className="hover:bg-[#F6F6F6] transition-colors">
                        <td className="py-2.5 font-semibold text-[#000000]">{sch.dayOfWeek}</td>
                        <td className="py-2.5 font-mono text-[#555555] whitespace-nowrap">
                          {sch.startTime} – {sch.endTime}
                        </td>
                        <td className="py-2.5 font-medium text-[#000000]">{sch.subjectName}</td>
                        <td className="py-2.5 text-[#555555]">{sch.tutorName}</td>
                        <td className="py-2.5 text-[#555555]">{sch.roomName}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="p-6 text-center border border-dashed border-[#D2D2D2] rounded-[10px]">
                <Clock className="w-5 h-5 text-[#6B6B6B] mx-auto mb-1.5" />
                <p className="font-medium text-xs text-[#000000]">
                  Belum Ada Jadwal Bimbingan Aktif
                </p>
                <p className="text-[11px] text-[#555555] mt-0.5">
                  Rombel ini belum memiliki jadwal bimbingan belajar mingguan yang dikonfigurasi oleh administrator.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Rombel Placement & Quick Actions */}
        <div className="space-y-6">
          {/* Card: Status Penempatan Rombel */}
          <div className="bg-[#FFFFFF] border border-[#D2D2D2] rounded-[14px] p-5 sm:p-6 space-y-4">
            <div className="flex items-center gap-2 pb-3 border-b border-[#D2D2D2]">
              <BookOpen className="w-4 h-4 text-[#CB2957]" />
              <h3 className="font-display font-bold text-sm text-[#000000] uppercase tracking-wide">
                Penempatan Kelas
              </h3>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <span className="text-[#6B6B6B] block">Nama Rombel</span>
                <span className="font-bold text-base text-[#000000] block mt-0.5">
                  {student.className}
                </span>
              </div>

              {student.classDetails?.tutorName && (
                <div>
                  <span className="text-[#6B6B6B] block">Tutor Wali Rombel</span>
                  <span className="font-medium text-[#000000] block mt-0.5">
                    {student.classDetails.tutorName}
                  </span>
                </div>
              )}

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[#6B6B6B]">Kapasitas Kursi</span>
                  <span className="font-semibold text-[#000000]">
                    {currentStudentsCount} / {capacity} Siswa
                  </span>
                </div>
                <div className="w-full bg-[#EEEEEE] h-2 rounded-full overflow-hidden">
                  <div
                    className="bg-[#000000] h-full rounded-full transition-all"
                    style={{
                      width: `${Math.min(100, (currentStudentsCount / capacity) * 100)}%`,
                    }}
                  />
                </div>
                <span className="text-[11px] text-[#555555] mt-1 block">
                  Batas pedagogis maksimal 12 siswa per rombel bimbingan.
                </span>
              </div>
            </div>

            <div className="pt-2 border-t border-[#D2D2D2]">
              <button
                type="button"
                onClick={handleOpenEdit}
                className="w-full py-2.5 px-3 text-xs font-semibold text-[#000000] bg-[#FFFFFF] border border-[#D2D2D2] rounded-[8px] hover:bg-[#F6F6F6] hover:border-[#000000] transition-colors cursor-pointer flex items-center justify-center gap-2"
              >
                <Edit className="w-3.5 h-3.5" />
                <span>Pindah Rombel / Ubah Data</span>
              </button>
            </div>
          </div>

          {/* Card: Panduan Administrasi */}
          <div className="bg-[#FFFFFF] border border-[#D2D2D2] rounded-[14px] p-5 sm:p-6 space-y-3 text-xs text-[#555555]">
            <h4 className="font-bold text-xs text-[#000000] uppercase tracking-wider">
              Tata Usaha Akademik
            </h4>
            <p className="leading-relaxed">
              Pembaruan nomor telepon dan alamat orang tua akan otomatis tersinkronisasi ke kontak darurat tutor dan lembar presensi sesi belajar.
            </p>
            <p className="leading-relaxed">
              Jika siswa pindah rombel, kuota kelas lama akan otomatis terbebaskan dan riwayat kehadiran sebelumnya tetap tersimpan utuh.
            </p>
          </div>
        </div>
      </div>

      {/* DIALOG: Edit Siswa dari Halaman Detail */}
      <Dialog.Root
        open={isEditModalOpen}
        onOpenChange={(open) => !open && setIsEditModalOpen(false)}
      >
        <Dialog.Portal>
          <Dialog.Backdrop className="fixed inset-0 bg-black/60 z-50 backdrop-blur-xs" />
          <Dialog.Viewport className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
            <Dialog.Popup className="w-full max-w-lg bg-[#FFFFFF] border border-[#D2D2D2] rounded-[14px] p-4 sm:p-6 shadow-xl space-y-5 my-8 max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between border-b border-[#D2D2D2] pb-3.5">
                <div>
                  <Dialog.Title className="font-display font-bold text-base text-[#000000]">
                    Edit Data Siswa — {student.nis}
                  </Dialog.Title>
                  <p className="text-xs text-[#555555] mt-0.5">
                    Perbarui kontak, penempatan kelas, atau ubah status keaktifan siswa.
                  </p>
                </div>
                <Dialog.Close
                  render={
                    <button
                      type="button"
                      className="p-1.5 text-[#555555] hover:text-[#000000] hover:bg-[#F6F6F6] rounded-[6px]"
                    />
                  }
                >
                  <X className="w-4 h-4" />
                </Dialog.Close>
              </div>

              <form onSubmit={handleEditSubmit} className="space-y-4 text-xs">
                {editError && (
                  <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-[8px] text-xs text-red-700">
                    <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-red-600" />
                    <span>{editError}</span>
                  </div>
                )}

                <div className="space-y-1.5">
                  <label className="font-semibold text-[#000000] block">
                    Nama Lengkap Siswa <span className="text-[#A1301C]">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={editForm.name}
                    onChange={(e) =>
                      setEditForm({ ...editForm, name: e.target.value })
                    }
                    className="w-full h-10 px-3 text-xs border border-[#D2D2D2] rounded-[8px] focus:outline-none focus:border-[#000000]"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="font-semibold text-[#000000] block">
                      Email Siswa <span className="text-[#A1301C]">*</span>
                    </label>
                    <input
                      type="email"
                      required
                      value={editForm.email}
                      onChange={(e) =>
                        setEditForm({ ...editForm, email: e.target.value })
                      }
                      className="w-full h-10 px-3 text-xs border border-[#D2D2D2] rounded-[8px] focus:outline-none focus:border-[#000000]"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="font-semibold text-[#000000] block">
                      Telepon / WhatsApp Siswa
                    </label>
                    <input
                      type="tel"
                      value={editForm.phone}
                      onChange={(e) =>
                        setEditForm({ ...editForm, phone: e.target.value })
                      }
                      className="w-full h-10 px-3 text-xs border border-[#D2D2D2] rounded-[8px] focus:outline-none focus:border-[#000000]"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="font-semibold text-[#000000] block">
                    Sekolah Asal
                  </label>
                  <input
                    type="text"
                    value={editForm.school}
                    onChange={(e) =>
                      setEditForm({ ...editForm, school: e.target.value })
                    }
                    className="w-full h-10 px-3 text-xs border border-[#D2D2D2] rounded-[8px] focus:outline-none focus:border-[#000000]"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="font-semibold text-[#000000] block">
                      Rombel / Kelas
                    </label>
                    <SearchableSelect
                      value={editForm.classId}
                      onChange={(val) =>
                        setEditForm({ ...editForm, classId: val })
                      }
                      options={classes.map((c) => ({
                        value: c.id,
                        label: c.name,
                        sublabel: `(${c.studentCount}/${c.capacity} kursi)`,
                      }))}
                      placeholder="Pilih rombel / kelas..."
                      searchPlaceholder="Cari kelas..."
                      required
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="font-semibold text-[#000000] block">
                      Status Keaktifan
                    </label>
                    <select
                      value={editForm.status}
                      onChange={(e) =>
                        setEditForm({
                          ...editForm,
                          status: e.target.value as Student['status'],
                        })
                      }
                      className="w-full h-10 px-3 text-xs border border-[#D2D2D2] rounded-[8px] bg-[#FFFFFF] focus:outline-none focus:border-[#000000]"
                    >
                      <option value="aktif">Aktif</option>
                      <option value="nonaktif">Nonaktif</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  <div className="space-y-1.5">
                    <label className="font-semibold text-[#000000] block">
                      Nama Orang Tua / Wali
                    </label>
                    <input
                      type="text"
                      value={editForm.parentName}
                      onChange={(e) =>
                        setEditForm({
                          ...editForm,
                          parentName: e.target.value,
                        })
                      }
                      className="w-full h-10 px-3 text-xs border border-[#D2D2D2] rounded-[8px] focus:outline-none focus:border-[#000000]"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="font-semibold text-[#000000] block">
                      WhatsApp Orang Tua
                    </label>
                    <input
                      type="tel"
                      value={editForm.parentPhone}
                      onChange={(e) =>
                        setEditForm({
                          ...editForm,
                          parentPhone: e.target.value,
                        })
                      }
                      className="w-full h-10 px-3 text-xs border border-[#D2D2D2] rounded-[8px] focus:outline-none focus:border-[#000000]"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="font-semibold text-[#000000] block">
                      Pekerjaan Orang Tua / Wali
                    </label>
                    <input
                      type="text"
                      placeholder="Contoh: Pegawai Negeri, Wiraswasta"
                      value={editForm.parentJob}
                      onChange={(e) =>
                        setEditForm({
                          ...editForm,
                          parentJob: e.target.value,
                        })
                      }
                      className="w-full h-10 px-3 text-xs border border-[#D2D2D2] rounded-[8px] focus:outline-none focus:border-[#000000]"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="font-semibold text-[#000000] block">
                      Alamat Domisili Siswa
                    </label>
                    <input
                      type="text"
                      placeholder="Contoh: Jl. Tadulako No. 5"
                      value={editForm.parentAddress}
                      onChange={(e) =>
                        setEditForm({
                          ...editForm,
                          parentAddress: e.target.value,
                        })
                      }
                      className="w-full h-10 px-3 text-xs border border-[#D2D2D2] rounded-[8px] focus:outline-none focus:border-[#000000]"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-[#D2D2D2]">
                  <button
                    type="button"
                    onClick={() => setIsEditModalOpen(false)}
                    className="px-4 py-2 text-xs font-semibold text-[#292524] bg-[#FFFFFF] border border-[#D2D2D2] rounded-[8px] hover:bg-[#F6F6F6] cursor-pointer"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="px-4 py-2 text-xs font-semibold text-[#FFFFFF] bg-[#000000] rounded-[8px] hover:bg-[#262626] disabled:opacity-50 cursor-pointer"
                  >
                    {isSubmitting ? 'Menyimpan...' : 'Simpan Perubahan'}
                  </button>
                </div>
              </form>
            </Dialog.Popup>
          </Dialog.Viewport>
        </Dialog.Portal>
      </Dialog.Root>

      {/* Modal Dialog: Reset Password Siswa & Wali */}
      <Dialog.Root
        open={isResetModalOpen}
        onOpenChange={(open) => {
          if (!open) {
            setIsResetModalOpen(false)
          }
        }}
      >
        <Dialog.Portal>
          <Dialog.Backdrop className="fixed inset-0 bg-black/45 z-50 backdrop-blur-xs transition-opacity duration-200" />
          <Dialog.Viewport className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <Dialog.Popup className="w-full max-w-md bg-[#FFFFFF] border border-[#D2D2D2] rounded-[12px] shadow-2xl p-6 focus:outline-none">
              <div className="flex items-center justify-between pb-3 border-b border-[#D2D2D2]">
                <div className="flex items-center gap-2">
                  <KeyRound className="w-5 h-5 text-[#CB2957]" />
                  <Dialog.Title className="font-display font-bold text-base text-[#000000]">
                    Reset Kata Sandi Akun
                  </Dialog.Title>
                </div>
                <button
                  type="button"
                  onClick={() => setIsResetModalOpen(false)}
                  className="p-1 text-[#555555] hover:text-[#000000] rounded-[6px]"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {student && (
                <div className="mt-4 space-y-4">
                  <div className="p-3 bg-[#F6F6F6] rounded-[8px] border border-[#D2D2D2] space-y-1 text-xs">
                    <p className="font-bold text-[#000000]">
                      {student.name} <span className="font-normal text-[#555555]">(NIS: {student.nis})</span>
                    </p>
                    <p className="text-[#555555]">
                      Wali: <span className="font-medium text-[#000000]">{student.parentName}</span>
                    </p>
                  </div>

                  {resetSuccessData ? (
                    <div className="space-y-3">
                      <div className="p-3.5 bg-[#F0FDF4] border border-[#86EFAC] rounded-[8px] space-y-2">
                        <div className="flex items-center gap-2 text-xs font-bold text-[#166534]">
                          <CheckCircle2 className="w-4 h-4 shrink-0" />
                          <span>Kata Sandi Berhasil Direset</span>
                        </div>
                        <div className="text-xs text-[#292524] space-y-1 bg-[#FFFFFF] p-2.5 rounded-[6px] border border-[#86EFAC]">
                          <p><span className="text-[#555555]">Akun:</span> <strong className="font-mono">{resetSuccessData.emailOrNis}</strong></p>
                          <p><span className="text-[#555555]">Kata Sandi Baru:</span> <strong className="font-mono text-sm text-[#CB2957]">{resetSuccessData.password}</strong></p>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={handleCopyCredentials}
                        className="w-full py-2.5 px-4 text-xs font-bold text-[#FFFFFF] bg-[#000000] hover:bg-[#292524] rounded-[8px] flex items-center justify-center gap-2 transition-colors cursor-pointer"
                      >
                        {isCopied ? <Check className="w-4 h-4 text-[#86EFAC]" /> : <Copy className="w-4 h-4" />}
                        <span>{isCopied ? 'Kredensial Berhasil Disalin!' : 'Salin Kredensial untuk WhatsApp'}</span>
                      </button>

                      <div className="flex justify-end pt-2">
                        <button
                          type="button"
                          onClick={() => setIsResetModalOpen(false)}
                          className="px-4 py-2 text-xs font-semibold text-[#555555] hover:text-[#000000] cursor-pointer"
                        >
                          Tutup
                        </button>
                      </div>
                    </div>
                  ) : (
                    <form onSubmit={handleExecuteReset} className="space-y-4">
                      {resetError && (
                        <div className="p-3 bg-[#FEF2F2] border border-[#FCA5A5] rounded-[8px] flex items-center gap-2 text-xs font-medium text-[#991B1B]">
                          <AlertCircle className="w-4 h-4 shrink-0" />
                          <span>{resetError}</span>
                        </div>
                      )}

                      <div className="space-y-2">
                        <label className="block text-xs font-bold text-[#000000]">
                          Pilih Akun yang Ingin Di-reset:
                        </label>
                        <div className="grid grid-cols-2 gap-2">
                          <button
                            type="button"
                            onClick={() => setResetRole('student')}
                            className={cn(
                              'p-2.5 text-xs text-left rounded-[8px] border transition-colors cursor-pointer',
                              resetRole === 'student'
                                ? 'border-[#000000] bg-[#000000] text-[#FFFFFF] font-bold'
                                : 'border-[#D2D2D2] bg-[#FFFFFF] text-[#292524] hover:bg-[#F6F6F6]'
                            )}
                          >
                            <p className="font-bold">Akun Siswa</p>
                            <p className={cn('text-[11px] truncate', resetRole === 'student' ? 'text-[#D2D2D2]' : 'text-[#555555]')}>
                              {student.name}
                            </p>
                          </button>

                          <button
                            type="button"
                            onClick={() => setResetRole('parent')}
                            className={cn(
                              'p-2.5 text-xs text-left rounded-[8px] border transition-colors cursor-pointer',
                              resetRole === 'parent'
                                ? 'border-[#000000] bg-[#000000] text-[#FFFFFF] font-bold'
                                : 'border-[#D2D2D2] bg-[#FFFFFF] text-[#292524] hover:bg-[#F6F6F6]'
                            )}
                          >
                            <p className="font-bold">Akun Orang Tua / Wali</p>
                            <p className={cn('text-[11px] truncate', resetRole === 'parent' ? 'text-[#D2D2D2]' : 'text-[#555555]')}>
                              {student.parentName}
                            </p>
                          </button>
                        </div>
                      </div>

                      <div className="space-y-1.5">
                        <label className="block text-xs font-bold text-[#000000]">
                          Kata Sandi Baru (Opsional)
                        </label>
                        <input
                          type="text"
                          value={resetNewPassword}
                          onChange={(e) => setResetNewPassword(e.target.value)}
                          placeholder="Kosongkan untuk bawaan: password123"
                          className="w-full px-3 py-2 text-xs text-[#000000] bg-[#FFFFFF] border border-[#D2D2D2] rounded-[8px] focus:outline-none focus:border-[#000000]"
                        />
                        <p className="text-[11px] text-[#555555]">
                          Jika dikosongkan, kata sandi otomatis diatur menjadi <strong>password123</strong>.
                        </p>
                      </div>

                      <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-[#D2D2D2]">
                        <button
                          type="button"
                          onClick={() => setIsResetModalOpen(false)}
                          className="px-4 py-2 text-xs font-semibold text-[#292524] bg-[#FFFFFF] border border-[#D2D2D2] rounded-[8px] hover:bg-[#F6F6F6] cursor-pointer"
                        >
                          Batal
                        </button>
                        <button
                          type="submit"
                          disabled={isResetSubmitting}
                          className="px-4 py-2 text-xs font-bold text-[#FFFFFF] bg-[#CB2957] hover:bg-[#A81E46] rounded-[8px] transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                        >
                          {isResetSubmitting ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            <KeyRound className="w-3.5 h-3.5" />
                          )}
                          <span>Konfirmasi Reset</span>
                        </button>
                      </div>
                    </form>
                  )}
                </div>
              )}
            </Dialog.Popup>
          </Dialog.Viewport>
        </Dialog.Portal>
      </Dialog.Root>
    </div>
  )
}
