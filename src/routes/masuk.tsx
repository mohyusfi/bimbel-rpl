import * as React from 'react'
import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'
import {
  ArrowLeft,
  Eye,
  EyeOff,
  AlertCircle,
  Loader2,
  HelpCircle,
  X,
  ShieldCheck,
  GraduationCap,
  BookOpen,
  Users,
} from 'lucide-react'
import { RegisterModal } from '~/components/landing/RegisterModal'
import { authStore, DEMO_ACCOUNTS, type UserRole } from '~/lib/auth-store'
import { isDemoLogin } from '~/lib/login-mode'

export const Route = createFileRoute('/masuk')({
  component: LoginPage,
})

export function LoginPage() {
  const navigate = useNavigate()
  const isDemo = isDemoLogin()

  // Form states
  const [emailOrId, setEmailOrId] = React.useState<string>(
    isDemo ? DEMO_ACCOUNTS.super_admin.email : ''
  )
  const [password, setPassword] = React.useState<string>(
    isDemo ? DEMO_ACCOUNTS.super_admin.defaultPassword : ''
  )
  const [showPassword, setShowPassword] = React.useState<boolean>(false)
  const [isSubmitting, setIsSubmitting] = React.useState<boolean>(false)
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null)
  const [fieldErrors, setFieldErrors] = React.useState<{ email?: string; password?: string }>({})

  // Admin role selection for demo mode (Super Admin vs TU Admin)
  const [adminRoleType, setAdminRoleType] = React.useState<'super_admin' | 'regular_admin'>('super_admin')

  // Modals & notices
  const [isRegisterOpen, setIsRegisterOpen] = React.useState<boolean>(false)
  const [isForgotPasswordOpen, setIsForgotPasswordOpen] = React.useState<boolean>(false)
  const [deactivatedNotice, setDeactivatedNotice] = React.useState<boolean>(false)
  const [redirectPath, setRedirectPath] = React.useState<string | null>(null)

  React.useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search)
      if (params.get('deactivated') === 'true') {
        setDeactivatedNotice(true)
      }
      const redirectParam = params.get('redirect')
      if (redirectParam) {
        setRedirectPath(redirectParam)
      }
    }
  }, [])

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMessage(null)
    const errors: { email?: string; password?: string } = {}

    const cleanInput = emailOrId.trim()
    if (!cleanInput) {
      errors.email = 'Masukkan alamat email yang valid atau NIS siswa.'
    }
    if (!password || !password.trim()) {
      errors.password = 'Kata sandi wajib diisi.'
    }

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors)
      return
    }
    setFieldErrors({})

    setIsSubmitting(true)
    try {
      // Login tunggal: role ditentukan otomatis oleh profil Supabase / email inference
      const result = await authStore.login(cleanInput, password)
      if (result.success && result.role) {
        const roleHref = result.href || `/${result.role}`
        const dest =
          redirectPath && redirectPath.startsWith(`/${result.role}`)
            ? redirectPath
            : roleHref
        navigate({ to: dest as any })
      } else {
        setErrorMessage(
          result.error ||
            'Email atau kata sandi yang Anda masukkan tidak sesuai. Silakan periksa kembali.'
        )
      }
    } catch (err: any) {
      setErrorMessage(
        err?.message ||
          'Terjadi kesalahan saat menghubungi server. Silakan coba beberapa saat lagi.'
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleQuickDemoLogin = async (role: UserRole) => {
    setErrorMessage(null)
    setFieldErrors({})
    setIsSubmitting(true)

    const isSuper = role === 'admin' && adminRoleType === 'super_admin'
    const targetRoleKey = isSuper ? 'super_admin' : role
    const demoInfo = DEMO_ACCOUNTS[targetRoleKey]

    // Set input form agar transparan terlihat oleh user
    setEmailOrId(demoInfo.email)
    setPassword(demoInfo.defaultPassword)

    try {
      const loginRes = await authStore.login(
        demoInfo.email,
        demoInfo.defaultPassword,
        demoInfo.role
      )
      if (loginRes.success && loginRes.role) {
        const roleHref = loginRes.href || `/${loginRes.role}`
        const dest =
          redirectPath && redirectPath.startsWith(`/${loginRes.role}`)
            ? redirectPath
            : roleHref
        navigate({ to: dest as any })
        return
      }
    } catch {
      // Fallback ke quickLogin langsung
    }

    const result = authStore.quickLogin(targetRoleKey)
    if (result.success && result.role) {
      const roleHref = result.href || `/${result.role}`
      const dest =
        redirectPath && redirectPath.startsWith(`/${result.role}`)
          ? redirectPath
          : roleHref
      navigate({ to: dest as any })
    } else {
      setErrorMessage(result.error || 'Gagal masuk akun demo.')
      setIsSubmitting(false)
    }
  }

  return (
    <main className="min-h-screen w-full bg-[#EEEEEE] text-[#000000] flex items-center justify-center p-4 md:p-8 font-sans">
      {/* Kontainer Utama Kartu Split */}
      <div className="w-full max-w-[1060px] bg-[#FFFFFF] border-2 border-[#000000] rounded-[14px] p-6 sm:p-8 lg:p-6 grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch shadow-sm">
        
        {/* Navigasi Kembali khusus Mobile/Tablet (< 1024px) */}
        <div className="lg:hidden flex items-center justify-between pb-3 border-b border-[#D2D2D2]">
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-sm font-semibold text-[#292524] hover:text-[#CB2957] transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Kembali ke beranda</span>
          </Link>
          <span className="font-display text-xs font-extrabold tracking-tight text-[#000000]">
            Tadulako Cendekia<span className="text-[#CB2957]">.</span>
          </span>
        </div>

        {/* KOLOM KIRI: Area Form Login (5 Kolom di Desktop) */}
        <section className="lg:col-span-5 flex flex-col justify-between py-2 sm:py-6 px-1 sm:px-4">
          <div className="w-full max-w-[380px] mx-auto my-auto">
            {/* Identitas Brand & Judul */}
            <div className="text-center mb-6">
              <Link
                to="/"
                className="inline-block font-display text-xl tracking-tight text-[#000000] mb-2.5"
              >
                <span className="font-extrabold">Tadulako</span>{' '}
                <span className="font-medium">Cendekia</span>
                <span className="text-[#CB2957] font-extrabold">.</span>
              </Link>
              <h1 className="font-display text-3xl sm:text-[32px] font-extrabold tracking-tight text-[#000000] leading-[1.1]">
                Selamat Datang Kembali!
              </h1>
              <p className="mt-2 text-sm text-[#555555] leading-relaxed">
                Masuk untuk mengakses jadwal, presensi, dan evaluasi belajar.
              </p>
            </div>

            {/* Banner Peringatan Akun Dinonaktifkan */}
            {deactivatedNotice && (
              <div
                role="alert"
                className="mb-5 flex items-start gap-2.5 bg-[#FBEAEF] border-l-4 border-[#A1301C] p-3 rounded-[6px] text-xs font-medium text-[#7A1534]"
              >
                <AlertCircle className="w-4 h-4 text-[#A1301C] shrink-0 mt-0.5" />
                <span>
                  Akun staf Anda telah dinonaktifkan oleh Pimpinan Lembaga. Silakan hubungi Tata Usaha untuk informasi pemulihan akun.
                </span>
              </div>
            )}

            {/* Banner Error Login */}
            {errorMessage && (
              <div
                role="alert"
                className="mb-5 flex items-start gap-2.5 bg-[#FBEAEF] border-l-4 border-[#A1301C] p-3 rounded-[6px] text-xs font-medium text-[#7A1534]"
              >
                <AlertCircle className="w-4 h-4 text-[#A1301C] shrink-0 mt-0.5" />
                <span>{errorMessage}</span>
              </div>
            )}

            {/* Formulir Autentikasi Tunggal */}
            <form onSubmit={handleLoginSubmit} className="space-y-4" noValidate>
              <div>
                <label
                  htmlFor="email"
                  className="block text-sm font-semibold text-[#292524] mb-1.5"
                >
                  Email atau NIS
                </label>
                <input
                  id="email"
                  name="email"
                  type="text"
                  autoComplete="username"
                  required
                  value={emailOrId}
                  onChange={(e) => {
                    setEmailOrId(e.target.value)
                    if (fieldErrors.email) {
                      setFieldErrors((prev) => ({ ...prev, email: undefined }))
                    }
                  }}
                  placeholder="nama@email.com atau NIS siswa"
                  className={`w-full h-11 px-3.5 bg-[#FFFFFF] text-[#292524] placeholder:text-[#555555] text-sm rounded-[8px] border-[1.5px] transition-colors focus:outline-none focus:ring-2 focus:ring-[#CB2957] ${
                    fieldErrors.email
                      ? 'border-[#A1301C] ring-1 ring-[#A1301C]'
                      : 'border-[#6B6B6B] hover:border-[#000000] focus:border-[#000000]'
                  }`}
                />
                {fieldErrors.email && (
                  <p className="mt-1 text-xs text-[#A1301C] flex items-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5 inline shrink-0" />
                    <span>{fieldErrors.email}</span>
                  </p>
                )}
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label
                    htmlFor="password"
                    className="block text-sm font-semibold text-[#292524]"
                  >
                    Kata Sandi
                  </label>
                  <button
                    type="button"
                    onClick={() => setIsForgotPasswordOpen(true)}
                    className="text-xs font-semibold text-[#A81E46] hover:text-[#CB2957] hover:underline cursor-pointer focus:outline-none"
                  >
                    Lupa sandi?
                  </button>
                </div>
                <div className="relative">
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="current-password"
                    required
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value)
                      if (fieldErrors.password) {
                        setFieldErrors((prev) => ({ ...prev, password: undefined }))
                      }
                    }}
                    placeholder="Masukkan kata sandi"
                    className={`w-full h-11 pl-3.5 pr-11 bg-[#FFFFFF] text-[#292524] placeholder:text-[#555555] text-sm rounded-[8px] border-[1.5px] transition-colors focus:outline-none focus:ring-2 focus:ring-[#CB2957] ${
                      fieldErrors.password
                        ? 'border-[#A1301C] ring-1 ring-[#A1301C]'
                        : 'border-[#6B6B6B] hover:border-[#000000] focus:border-[#000000]'
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((prev) => !prev)}
                    aria-label={showPassword ? 'Sembunyikan kata sandi' : 'Tampilkan kata sandi'}
                    className="absolute right-1.5 top-1/2 -translate-y-1/2 w-8 h-8 inline-flex items-center justify-center text-[#555555] hover:text-[#000000] rounded-[6px] focus:outline-none focus:ring-2 focus:ring-[#CB2957]"
                  >
                    {showPassword ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                </div>
                {fieldErrors.password && (
                  <p className="mt-1 text-xs text-[#A1301C] flex items-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5 inline shrink-0" />
                    <span>{fieldErrors.password}</span>
                  </p>
                )}
              </div>

              {/* Tombol CTA Primer (#CB2957) */}
              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full h-11 bg-[#CB2957] hover:bg-[#A81E46] text-[#FFFFFF] font-semibold text-sm rounded-[8px] border-2 border-[#000000] inline-flex items-center justify-center gap-2 transition-colors focus:outline-none focus:ring-2 focus:ring-[#CB2957] focus:ring-offset-2 disabled:opacity-70 cursor-pointer shadow-[2px_2px_0px_#000000] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Memverifikasi...</span>
                    </>
                  ) : (
                    <span>Masuk ke Akun</span>
                  )}
                </button>
              </div>
            </form>

            {/* BAGIAN DEMO / PENGEMBANGAN (Hanya muncul jika VITE_LOGIN_MODE=demo) */}
            {isDemo && (
              <div className="mt-6 pt-5 border-t border-[#D2D2D2]">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-semibold text-[#555555] uppercase tracking-wider">
                    Masuk Cepat Demo
                  </span>
                  {/* Toggle Varian Admin */}
                  <div className="inline-flex rounded-[6px] border border-[#000000] p-0.5 bg-[#EEEEEE] text-[11px]">
                    <button
                      type="button"
                      onClick={() => setAdminRoleType('super_admin')}
                      className={`px-2 py-0.5 rounded-[4px] font-medium transition-colors cursor-pointer ${
                        adminRoleType === 'super_admin'
                          ? 'bg-[#000000] text-[#FFFFFF]'
                          : 'text-[#555555] hover:text-[#000000]'
                      }`}
                    >
                      Pimpinan
                    </button>
                    <button
                      type="button"
                      onClick={() => setAdminRoleType('regular_admin')}
                      className={`px-2 py-0.5 rounded-[4px] font-medium transition-colors cursor-pointer ${
                        adminRoleType === 'regular_admin'
                          ? 'bg-[#000000] text-[#FFFFFF]'
                          : 'text-[#555555] hover:text-[#000000]'
                      }`}
                    >
                      Staf TU
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  <button
                    type="button"
                    onClick={() => handleQuickDemoLogin('admin')}
                    disabled={isSubmitting}
                    className="h-10 px-2 bg-[#FFFFFF] hover:bg-[#EEEEEE] text-[#292524] font-semibold text-xs rounded-[8px] border border-[#000000] transition-colors focus:outline-none focus:ring-2 focus:ring-[#CB2957] cursor-pointer flex items-center justify-center gap-1.5"
                    title={adminRoleType === 'super_admin' ? 'Masuk sebagai Pimpinan Lembaga' : 'Masuk sebagai Kepala Tata Usaha'}
                  >
                    <ShieldCheck className="w-3.5 h-3.5 text-[#000000]" />
                    <span>Admin</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleQuickDemoLogin('tutor')}
                    disabled={isSubmitting}
                    className="h-10 px-2 bg-[#FFFFFF] hover:bg-[#EEEEEE] text-[#292524] font-semibold text-xs rounded-[8px] border border-[#000000] transition-colors focus:outline-none focus:ring-2 focus:ring-[#CB2957] cursor-pointer flex items-center justify-center gap-1.5"
                    title="Masuk sebagai Tutor Fisika & UTBK (Kak Dian)"
                  >
                    <GraduationCap className="w-3.5 h-3.5 text-[#000000]" />
                    <span>Tutor</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleQuickDemoLogin('student')}
                    disabled={isSubmitting}
                    className="h-10 px-2 bg-[#FFFFFF] hover:bg-[#EEEEEE] text-[#292524] font-semibold text-xs rounded-[8px] border border-[#000000] transition-colors focus:outline-none focus:ring-2 focus:ring-[#CB2957] cursor-pointer flex items-center justify-center gap-1.5"
                    title="Masuk sebagai Siswa (Fahri Ramadhan)"
                  >
                    <BookOpen className="w-3.5 h-3.5 text-[#000000]" />
                    <span>Siswa</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleQuickDemoLogin('parent')}
                    disabled={isSubmitting}
                    className="h-10 px-2 bg-[#FFFFFF] hover:bg-[#EEEEEE] text-[#292524] font-semibold text-xs rounded-[8px] border border-[#000000] transition-colors focus:outline-none focus:ring-2 focus:ring-[#CB2957] cursor-pointer flex items-center justify-center gap-1.5"
                    title="Masuk sebagai Orang Tua / Wali (Ahmad Dahlan)"
                  >
                    <Users className="w-3.5 h-3.5 text-[#000000]" />
                    <span>Orang Tua</span>
                  </button>
                </div>
              </div>
            )}

            {/* Tautan Pendaftaran Siswa Baru */}
            <p className="mt-6 text-center text-sm text-[#555555]">
              Belum terdaftar sebagai siswa?{' '}
              <button
                type="button"
                onClick={() => setIsRegisterOpen(true)}
                className="font-bold text-[#000000] underline decoration-[#CB2957] decoration-2 underline-offset-4 hover:text-[#CB2957] cursor-pointer"
              >
                Daftar program sekarang
              </button>
            </p>
          </div>

          {/* Catatan Kaki Ketentuan */}
          <p className="mt-8 text-center text-[11px] text-[#555555] leading-relaxed">
            Dengan masuk ke sistem, Anda menyetujui Ketentuan Layanan & Kebijakan Privasi Tadulako Cendekia.
          </p>
        </section>

        {/* KOLOM KANAN: Panel Visual dengan Top-Left Cutout Notch (7 Kolom di Desktop) */}
        <aside className="hidden lg:block lg:col-span-7 relative min-h-[600px]">
          {/* Cutout Notch Sudut Kiri Atas + Tombol Bulat Kembali */}
          <div className="absolute top-0 left-0 w-[76px] h-[76px] bg-[#FFFFFF] rounded-br-[28px] z-20 flex items-start justify-start pr-3 pb-3 border-b-2 border-r-2 border-[#000000]">
            <Link
              to="/"
              aria-label="Kembali ke halaman utama"
              title="Kembali ke beranda"
              className="w-14 h-14 rounded-full bg-[#EEEEEE] hover:bg-[#CB2957] text-[#000000] hover:text-[#FFFFFF] border-2 border-[#000000] flex items-center justify-center transition-colors focus:outline-none focus:ring-2 focus:ring-[#CB2957] shadow-sm cursor-pointer"
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>
          </div>

          {/* Kontainer Gambar Utama dengan Garis Border Poster */}
          <div className="w-full h-full rounded-[16px] overflow-hidden border-2 border-[#000000] bg-[#000000] relative">
            <img
              src="/assets/login-showcase.jpg"
              alt="Suasana bimbingan belajar tatap muka intensif di Tadulako Cendekia"
              className="w-full h-full object-cover object-center contrast-[1.05] grayscale-[15%]"
            />

            {/* Gradien Gelap Tipis di Kaki Foto */}
            <div className="absolute inset-x-0 bottom-0 h-48 bg-gradient-to-t from-black/85 via-black/35 to-transparent pointer-events-none" />

            {/* Overlay Kartu Informasi Bawah (High-Contrast Poster Block) */}
            <div className="absolute bottom-5 left-5 right-5 bg-[#000000] text-[#EEEEEE] border-2 border-[#000000] border-l-4 border-l-[#CB2957] rounded-[10px] p-5 shadow-lg">
              <p className="text-sm leading-relaxed text-[#EEEEEE]">
                &ldquo;Kelas bimbingan intensif maksimal 12 siswa per rombel, jadwal terjamin anti-bentrok, serta rekap presensi dan grafik evaluasi belajar terpantau transparan setiap sesi.&rdquo;
              </p>
              <div className="mt-3.5 flex items-center justify-between border-t border-[#333333] pt-3">
                <div>
                  <p className="font-display font-bold text-xs text-[#FFFFFF] tracking-wide uppercase">
                    Tadulako Cendekia
                  </p>
                  <p className="font-mono text-[11px] text-[#A3A3A3] mt-0.5">
                    Sistem Akademik · Admin · Tutor · Siswa · Orang Tua
                  </p>
                </div>
                <span className="font-mono text-xs text-[#CB2957] font-bold px-2 py-0.5 bg-[#1F1F1F] rounded-[4px] border border-[#333333]">
                  SD — UTBK
                </span>
              </div>
            </div>
          </div>
        </aside>

      </div>

      {/* Modal Registrasi Siswa Baru */}
      <RegisterModal
        isOpen={isRegisterOpen}
        onClose={() => setIsRegisterOpen(false)}
      />

      {/* Dialog Info Lupa Kata Sandi */}
      {isForgotPasswordOpen && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs"
        >
          <div className="w-full max-w-md bg-[#FFFFFF] border-2 border-[#000000] rounded-[12px] p-6 shadow-xl relative">
            <button
              type="button"
              onClick={() => setIsForgotPasswordOpen(false)}
              className="absolute top-4 right-4 p-1 rounded-md text-[#555555] hover:text-[#000000] hover:bg-[#EEEEEE] transition-colors"
              aria-label="Tutup dialog"
            >
              <X className="w-5 h-5" />
            </button>
            <div className="flex items-start gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-[#EEEEEE] border border-[#000000] flex items-center justify-center shrink-0">
                <HelpCircle className="w-5 h-5 text-[#CB2957]" />
              </div>
              <div>
                <h3 className="font-display font-bold text-base text-[#000000]">
                  Bantuan Lupa Kata Sandi
                </h3>
                <p className="text-xs text-[#555555] mt-0.5">
                  Prosedur Pemulihan Akun Bimbingan Belajar
                </p>
              </div>
            </div>
            <div className="text-xs text-[#292524] space-y-2.5 leading-relaxed bg-[#EEEEEE] p-3.5 rounded-[8px] border border-[#D2D2D2]">
              <p>
                Untuk menjaga privasi dan keamanan data akademik siswa, reset kata sandi dilakukan secara terverifikasi melalui staf Tata Usaha:
              </p>
              <ul className="list-disc pl-4 space-y-1 text-[#555555]">
                <li>
                  <strong>Siswa & Wali:</strong> Silakan sampaikan permohonan reset sandi ke Tata Usaha dengan menyebutkan NIS atau nama lengkap siswa.
                </li>
                <li>
                  <strong>Kontak Tata Usaha:</strong> WhatsApp resmi di <strong>0812-4112-9090</strong> atau datang langsung ke meja administrasi.
                </li>
              </ul>
            </div>
            <div className="mt-5 flex justify-end">
              <button
                type="button"
                onClick={() => setIsForgotPasswordOpen(false)}
                className="h-9 px-4 bg-[#000000] hover:bg-[#292524] text-[#FFFFFF] text-xs font-semibold rounded-[6px] transition-colors cursor-pointer"
              >
                Tutup & Mengerti
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  )
}
