import * as React from 'react'
import { createFileRoute } from '@tanstack/react-router'
import {
  User,
  GraduationCap,
  KeyRound,
  Eye,
  EyeOff,
  CheckCircle2,
  AlertCircle,
  Save,
  Lock,
  Loader2,
} from 'lucide-react'
import { useAuth } from '~/hooks/use-auth'

export const Route = createFileRoute('/tutor/profil')({
  ssr: false,
  component: TutorProfilePage,
})

function TutorProfilePage() {
  const {
    user,
    profile,
    userDisplayName,
    userInitials,
    updateProfile,
    updatePassword,
  } = useAuth()

  // State Form Profil
  const [fullName, setFullName] = React.useState('')
  const [phone, setPhone] = React.useState('')
  const [isProfileSubmitting, setIsProfileSubmitting] = React.useState(false)
  const [profileSuccess, setProfileSuccess] = React.useState<string | null>(null)
  const [profileError, setProfileError] = React.useState<string | null>(null)

  // State Form Kata Sandi
  const [oldPassword, setOldPassword] = React.useState('')
  const [newPassword, setNewPassword] = React.useState('')
  const [confirmPassword, setConfirmPassword] = React.useState('')
  const [showOldPass, setShowOldPass] = React.useState(false)
  const [showNewPass, setShowNewPass] = React.useState(false)
  const [showConfirmPass, setShowConfirmPass] = React.useState(false)
  const [isPasswordSubmitting, setIsPasswordSubmitting] = React.useState(false)
  const [passwordSuccess, setPasswordSuccess] = React.useState<string | null>(null)
  const [passwordError, setPasswordError] = React.useState<string | null>(null)

  React.useEffect(() => {
    if (user) {
      setFullName(user.fullName || profile?.full_name || '')
      setPhone(user.phone || profile?.phone_number || '')
    }
  }, [user, profile])

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setProfileSuccess(null)
    setProfileError(null)
    setIsProfileSubmitting(true)

    try {
      const res = await updateProfile({
        fullName,
        phone,
      })
      if (res.success) {
        setProfileSuccess('[OK] Data profil tutor berhasil diperbarui.')
      } else {
        setProfileError(res.error || '[ERROR] Gagal memperbarui data profil.')
      }
    } catch {
      setProfileError('[ERROR] Terjadi kesalahan saat menyimpan profil tutor.')
    } finally {
      setIsProfileSubmitting(false)
    }
  }

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setPasswordSuccess(null)
    setPasswordError(null)

    if (newPassword !== confirmPassword) {
      setPasswordError('[ERROR] Konfirmasi kata sandi baru tidak cocok.')
      return
    }

    if (newPassword.length < 6) {
      setPasswordError('[ERROR] Kata sandi baru minimal harus 6 karakter.')
      return
    }

    setIsPasswordSubmitting(true)
    try {
      const res = await updatePassword(oldPassword, newPassword)
      if (res.success) {
        setPasswordSuccess('[OK] Kata sandi berhasil diperbarui. Gunakan kata sandi baru saat login berikutnya.')
        setOldPassword('')
        setNewPassword('')
        setConfirmPassword('')
      } else {
        setPasswordError(res.error || '[ERROR] Gagal memperbarui kata sandi.')
      }
    } catch {
      setPasswordError('[ERROR] Terjadi kesalahan saat memproses pembaruan kata sandi.')
    } finally {
      setIsPasswordSubmitting(false)
    }
  }

  return (
    <div className="space-y-6 max-w-4xl pb-10">
      {/* Header Halaman */}
      <div className="border-b border-[#D2D2D2] pb-4">
        <h1 className="font-display font-bold text-2xl text-[#000000] tracking-tight">
          Profil Saya & Keamanan Akun
        </h1>
        <p className="text-xs text-[#555555] mt-1">
          Kelola data diri pengajar dan perbarui kata sandi masuk portal Tutor secara mandiri.
        </p>
      </div>

      {/* Ringkasan Akun */}
      <div className="bg-[#FFFFFF] border border-[#D2D2D2] rounded-[10px] p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-14 h-14 rounded-[8px] bg-[#000000] text-[#FFFFFF] font-display font-bold text-xl flex items-center justify-center shrink-0">
            {userInitials}
          </div>
          <div className="min-w-0">
            <h2 className="font-display font-bold text-lg text-[#000000] truncate">
              {userDisplayName || 'Kak Dian Pratiwi, S.Si'}
            </h2>
            <p className="text-xs text-[#555555] flex items-center gap-2 mt-0.5">
              <span>{user?.email || 'dian.pratiwi@tadulakocendekia.sch.id'}</span>
              <span className="text-[#D2D2D2]">|</span>
              <span className="font-medium text-[#CB2957]">Tutor Pengajar UTBK</span>
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1.5 text-xs font-medium text-[#166534]">
          <CheckCircle2 className="w-4 h-4 text-[#166534]" />
          <span>Status Akun Aktif</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Formulir 1: Edit Data Diri */}
        <div className="bg-[#FFFFFF] border border-[#D2D2D2] rounded-[10px] p-5 space-y-4">
          <div className="border-b border-[#D2D2D2] pb-3">
            <h3 className="font-display font-bold text-base text-[#000000] flex items-center gap-2">
              <User className="w-4 h-4 text-[#CB2957]" />
              <span>Informasi Pengajar</span>
            </h3>
            <p className="text-xs text-[#555555] mt-0.5">
              Perbarui nama gelar dan nomor WhatsApp kontak komunikasi akademik.
            </p>
          </div>

          {profileSuccess && (
            <div className="p-3 bg-[#F0FDF4] border border-[#86EFAC] rounded-[8px] flex items-center gap-2 text-xs font-medium text-[#166534]">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{profileSuccess}</span>
            </div>
          )}

          {profileError && (
            <div className="p-3 bg-[#FEF2F2] border border-[#FCA5A5] rounded-[8px] flex items-center gap-2 text-xs font-medium text-[#991B1B]">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{profileError}</span>
            </div>
          )}

          <form onSubmit={handleProfileSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-[#000000]">
                Nama Lengkap & Gelar
              </label>
              <input
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full px-3 py-2 text-xs text-[#000000] bg-[#FFFFFF] border border-[#D2D2D2] rounded-[8px] focus:outline-none focus:border-[#000000]"
                placeholder="Contoh: Kak Dian Pratiwi, S.Si"
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-[#000000]">
                Nomor WhatsApp / HP
              </label>
              <input
                type="text"
                required
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full px-3 py-2 text-xs text-[#000000] bg-[#FFFFFF] border border-[#D2D2D2] rounded-[8px] focus:outline-none focus:border-[#000000]"
                placeholder="Contoh: 0852-9988-1122"
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-[#000000]">
                Alamat Email Portal
              </label>
              <input
                type="email"
                disabled
                value={user?.email || ''}
                className="w-full px-3 py-2 text-xs text-[#555555] bg-[#F6F6F6] border border-[#D2D2D2] rounded-[8px] cursor-not-allowed"
              />
              <p className="text-[11px] text-[#555555]">
                Alamat email resmi tutor ditentukan oleh bagian Tata Usaha.
              </p>
            </div>

            <button
              type="submit"
              disabled={isProfileSubmitting}
              className="w-full py-2.5 px-4 text-xs font-bold text-[#FFFFFF] bg-[#000000] hover:bg-[#292524] rounded-[8px] transition-colors flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {isProfileSubmitting ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Save className="w-3.5 h-3.5" />
              )}
              <span>Simpan Perubahan Profil</span>
            </button>
          </form>
        </div>

        {/* Formulir 2: Ubah Kata Sandi */}
        <div className="bg-[#FFFFFF] border border-[#D2D2D2] rounded-[10px] p-5 space-y-4">
          <div className="border-b border-[#D2D2D2] pb-3">
            <h3 className="font-display font-bold text-base text-[#000000] flex items-center gap-2">
              <KeyRound className="w-4 h-4 text-[#CB2957]" />
              <span>Ganti Kata Sandi</span>
            </h3>
            <p className="text-xs text-[#555555] mt-0.5">
              Masukkan kata sandi lama Anda untuk menetapkan kata sandi baru.
            </p>
          </div>

          {passwordSuccess && (
            <div className="p-3 bg-[#F0FDF4] border border-[#86EFAC] rounded-[8px] flex items-center gap-2 text-xs font-medium text-[#166534]">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{passwordSuccess}</span>
            </div>
          )}

          {passwordError && (
            <div className="p-3 bg-[#FEF2F2] border border-[#FCA5A5] rounded-[8px] flex items-center gap-2 text-xs font-medium text-[#991B1B]">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{passwordError}</span>
            </div>
          )}

          <form onSubmit={handlePasswordSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-[#000000]">
                Kata Sandi Saat Ini (Lama)
              </label>
              <div className="relative">
                <input
                  type={showOldPass ? 'text' : 'password'}
                  required
                  value={oldPassword}
                  onChange={(e) => setOldPassword(e.target.value)}
                  className="w-full px-3 py-2 pr-9 text-xs text-[#000000] bg-[#FFFFFF] border border-[#D2D2D2] rounded-[8px] focus:outline-none focus:border-[#000000]"
                  placeholder="Masukkan kata sandi lama"
                />
                <button
                  type="button"
                  onClick={() => setShowOldPass(!showOldPass)}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#555555] hover:text-[#000000]"
                  aria-label="Toggle password visibility"
                >
                  {showOldPass ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-[#000000]">
                Kata Sandi Baru (Minimal 6 Karakter)
              </label>
              <div className="relative">
                <input
                  type={showNewPass ? 'text' : 'password'}
                  required
                  minLength={6}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full px-3 py-2 pr-9 text-xs text-[#000000] bg-[#FFFFFF] border border-[#D2D2D2] rounded-[8px] focus:outline-none focus:border-[#000000]"
                  placeholder="Masukkan kata sandi baru"
                />
                <button
                  type="button"
                  onClick={() => setShowNewPass(!showNewPass)}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#555555] hover:text-[#000000]"
                  aria-label="Toggle password visibility"
                >
                  {showNewPass ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-[#000000]">
                Konfirmasi Kata Sandi Baru
              </label>
              <div className="relative">
                <input
                  type={showConfirmPass ? 'text' : 'password'}
                  required
                  minLength={6}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full px-3 py-2 pr-9 text-xs text-[#000000] bg-[#FFFFFF] border border-[#D2D2D2] rounded-[8px] focus:outline-none focus:border-[#000000]"
                  placeholder="Ketik ulang kata sandi baru"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPass(!showConfirmPass)}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#555555] hover:text-[#000000]"
                  aria-label="Toggle password visibility"
                >
                  {showConfirmPass ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isPasswordSubmitting}
              className="w-full py-2.5 px-4 text-xs font-bold text-[#FFFFFF] bg-[#CB2957] hover:bg-[#A81E46] rounded-[8px] transition-colors flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {isPasswordSubmitting ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Lock className="w-3.5 h-3.5" />
              )}
              <span>Perbarui Kata Sandi</span>
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
