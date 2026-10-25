import * as React from 'react'
import { createFileRoute } from '@tanstack/react-router'
import {
  Pencil,
  X,
  CheckCircle2,
  AlertCircle,
  Save,
  KeyRound,
  Loader2,
  Lock,
  Eye,
  EyeOff,
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

  // State Edit Mode Toggle
  const [isEditing, setIsEditing] = React.useState(false)

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

  const handleProfileSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault()
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
        setIsEditing(false)
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
    <div className="w-full space-y-6 pb-12">
      {/* Unified White Card Container */}
      <div className="bg-[#FFFFFF] border border-[#D2D2D2] rounded-[16px] p-6 sm:p-8 shadow-xs space-y-7">
        {/* Top Header: Title & Edit Mode Toggle */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-[#EAEAEA]">
          <div>
            <h1 className="font-display font-extrabold text-xl sm:text-2xl text-[#000000] tracking-tight">
              Profile Information
            </h1>
            <p className="text-xs text-[#555555] mt-0.5">
              Kelola data diri pengajar dan perbarui kata sandi masuk portal Tutor secara mandiri.
            </p>
          </div>

          <div>
            {!isEditing ? (
              <button
                type="button"
                onClick={() => {
                  setProfileSuccess(null)
                  setProfileError(null)
                  setIsEditing(true)
                }}
                className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-[#FFFFFF] bg-[#000000] hover:bg-[#292524] rounded-[8px] transition-colors cursor-pointer"
              >
                <Pencil className="w-3.5 h-3.5" />
                <span>Edit</span>
              </button>
            ) : (
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setIsEditing(false)
                    setProfileError(null)
                    if (user) {
                      setFullName(user.fullName || profile?.full_name || '')
                      setPhone(user.phone || profile?.phone_number || '')
                    }
                  }}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-[#555555] bg-[#FFFFFF] border border-[#D2D2D2] hover:bg-[#F6F6F6] rounded-[8px] transition-colors cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                  <span>Batal</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleProfileSubmit()}
                  disabled={isProfileSubmitting}
                  className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-[#FFFFFF] bg-[#000000] hover:bg-[#292524] rounded-[8px] transition-colors cursor-pointer disabled:opacity-50"
                >
                  {isProfileSubmitting ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Save className="w-3.5 h-3.5" />
                  )}
                  <span>Simpan</span>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* User Card (Avatar + Name + Role) */}
        <div className="flex items-center gap-3.5">
          <div className="w-14 h-14 rounded-full bg-[#000000] text-[#FFFFFF] font-display font-extrabold text-xl flex items-center justify-center shrink-0 border border-[#D2D2D2]">
            {userInitials}
          </div>
          <div className="min-w-0">
            <h2 className="font-display font-bold text-lg text-[#000000] truncate">
              {userDisplayName || 'Kak Dian Pratiwi, S.Si'}
            </h2>
            <p className="text-xs text-[#555555] font-medium mt-0.5">
              Tutor Pengajar UTBK & Penalaran Matematika
            </p>
          </div>
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

        {/* Section 1: Personal Details */}
        <div className="space-y-4 pt-2">
          <h3 className="font-display font-bold text-base text-[#000000]">
            Personal Details
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5">
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-[#555555]">
                Nama Lengkap & Gelar
              </label>
              <input
                type="text"
                disabled={!isEditing}
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className={`w-full px-3.5 py-2.5 text-xs rounded-[8px] border transition-colors ${
                  isEditing
                    ? 'bg-[#FFFFFF] border-[#000000] text-[#000000] focus:outline-none'
                    : 'bg-[#F9F9F9] border-[#E5E5E5] text-[#292524] cursor-default'
                }`}
                placeholder="Contoh: Kak Dian Pratiwi, S.Si"
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-[#555555]">
                Nomor WhatsApp / HP
              </label>
              <input
                type="text"
                disabled={!isEditing}
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className={`w-full px-3.5 py-2.5 text-xs rounded-[8px] border transition-colors ${
                  isEditing
                    ? 'bg-[#FFFFFF] border-[#000000] text-[#000000] focus:outline-none'
                    : 'bg-[#F9F9F9] border-[#E5E5E5] text-[#292524] cursor-default'
                }`}
                placeholder="Nomor Telepon Kontak"
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-[#555555]">
                Alamat Email Portal
              </label>
              <input
                type="email"
                disabled
                value={user?.email || 'dian.pratiwi@tadulakocendekia.sch.id'}
                className="w-full px-3.5 py-2.5 text-xs rounded-[8px] border bg-[#F9F9F9] border-[#E5E5E5] text-[#777777] cursor-not-allowed"
              />
              <p className="text-[11px] text-[#777777]">
                Alamat email resmi tutor dikelola oleh bagian Tata Usaha.
              </p>
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-[#555555]">
                Bidang Mapel Spesialisasi
              </label>
              <input
                type="text"
                disabled
                value="Tutor Matematika & Sains Penalaran"
                className="w-full px-3.5 py-2.5 text-xs rounded-[8px] border bg-[#F9F9F9] border-[#E5E5E5] text-[#777777] cursor-not-allowed"
              />
              <p className="text-[11px] text-[#777777]">
                Penetapan mapel bimbingan diatur oleh bagian Kurikulum & Akademik.
              </p>
            </div>
          </div>
        </div>

        {/* Section 2: Keamanan & Kata Sandi */}
        <div className="space-y-4 pt-6 border-t border-[#EAEAEA]">
          <div>
            <h3 className="font-display font-bold text-base text-[#000000] flex items-center gap-2">
              <KeyRound className="w-4 h-4 text-[#CB2957]" />
              <span>Keamanan & Kata Sandi</span>
            </h3>
            <p className="text-xs text-[#555555] mt-0.5">
              Perbarui kata sandi akun secara mandiri menggunakan verifikasi kata sandi lama.
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
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5">
              <div className="space-y-1.5 sm:col-span-2">
                <label className="block text-xs font-semibold text-[#555555]">
                  Kata Sandi Saat Ini (Lama)
                </label>
                <div className="relative max-w-md">
                  <input
                    type={showOldPass ? 'text' : 'password'}
                    required
                    value={oldPassword}
                    onChange={(e) => setOldPassword(e.target.value)}
                    className="w-full px-3.5 py-2.5 pr-10 text-xs text-[#000000] bg-[#FFFFFF] border border-[#D2D2D2] rounded-[8px] focus:outline-none focus:border-[#000000]"
                    placeholder="Masukkan kata sandi lama Anda"
                  />
                  <button
                    type="button"
                    onClick={() => setShowOldPass(!showOldPass)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[#555555] hover:text-[#000000]"
                    aria-label="Toggle password visibility"
                  >
                    {showOldPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-[#555555]">
                  Kata Sandi Baru (Minimal 6 Karakter)
                </label>
                <div className="relative">
                  <input
                    type={showNewPass ? 'text' : 'password'}
                    required
                    minLength={6}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full px-3.5 py-2.5 pr-10 text-xs text-[#000000] bg-[#FFFFFF] border border-[#D2D2D2] rounded-[8px] focus:outline-none focus:border-[#000000]"
                    placeholder="Masukkan kata sandi baru"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPass(!showNewPass)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[#555555] hover:text-[#000000]"
                    aria-label="Toggle password visibility"
                  >
                    {showNewPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-[#555555]">
                  Konfirmasi Kata Sandi Baru
                </label>
                <div className="relative">
                  <input
                    type={showConfirmPass ? 'text' : 'password'}
                    required
                    minLength={6}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full px-3.5 py-2.5 pr-10 text-xs text-[#000000] bg-[#FFFFFF] border border-[#D2D2D2] rounded-[8px] focus:outline-none focus:border-[#000000]"
                    placeholder="Ketik ulang kata sandi baru"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPass(!showConfirmPass)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[#555555] hover:text-[#000000]"
                    aria-label="Toggle password visibility"
                  >
                    {showConfirmPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="submit"
                disabled={isPasswordSubmitting}
                className="inline-flex items-center gap-2 px-5 py-2.5 text-xs font-bold text-[#FFFFFF] bg-[#CB2957] hover:bg-[#A81E46] rounded-[8px] transition-colors cursor-pointer disabled:opacity-50"
              >
                {isPasswordSubmitting ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Lock className="w-3.5 h-3.5" />
                )}
                <span>Perbarui Kata Sandi</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
