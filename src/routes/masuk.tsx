import * as React from 'react'
import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'
import {
  ShieldCheck,
  GraduationCap,
  BookOpen,
  Users,
  ArrowRight,
  Lock,
  Mail,
  Eye,
  EyeOff,
  UserPlus,
  AlertCircle,
  Loader2,
  Sparkles,
} from 'lucide-react'
import { Header } from '~/components/landing/Header'
import { CtaFooter } from '~/components/landing/CtaFooter'
import { RegisterModal } from '~/components/landing/RegisterModal'
import { MobileDrawer } from '~/components/landing/MobileDrawer'
import { authStore, DEMO_ACCOUNTS, type UserRole } from '~/lib/auth-store'

export const Route = createFileRoute('/masuk')({
  ssr: false,
  component: LoginPage,
})

interface RoleCard {
  role: UserRole
  title: string
  subtitle: string
  description: string
  href: string
  icon: React.ComponentType<{ className?: string }>
  badgeText: string
  demoAccount: string
  demoEmail: string
  demoPassword: string
}

const ROLES: RoleCard[] = [
  {
    role: 'admin',
    title: 'Portal Tata Usaha',
    subtitle: 'Pengelola Bimbel & Master Data',
    description:
      'Verifikasi pendaftaran mandiri calon siswa, manajemen jadwal anti-bentrok, dan verifikasi pembayaran SPP.',
    href: '/admin',
    icon: ShieldCheck,
    badgeText: 'Akses Penuh',
    demoAccount: DEMO_ACCOUNTS.admin.name,
    demoEmail: DEMO_ACCOUNTS.admin.email,
    demoPassword: DEMO_ACCOUNTS.admin.defaultPassword,
  },
  {
    role: 'tutor',
    title: 'Portal Pengajar',
    subtitle: 'Tenaga Pendidik Tadulako Cendekia',
    description:
      'Checklist presensi digital sesi kelas, input nilai latihan & try out, serta distribusi modul bimbingan.',
    href: '/tutor',
    icon: GraduationCap,
    badgeText: 'Akademik',
    demoAccount: DEMO_ACCOUNTS.tutor.name,
    demoEmail: DEMO_ACCOUNTS.tutor.email,
    demoPassword: DEMO_ACCOUNTS.tutor.defaultPassword,
  },
  {
    role: 'student',
    title: 'Portal Siswa',
    subtitle: 'Peserta Bimbingan Belajar',
    description:
      'Pantau jadwal bimbingan mingguan, unduh modul pelajaran, cek rapor nilai try out, dan status tagihan les.',
    href: '/student',
    icon: BookOpen,
    badgeText: 'Ruang Belajar',
    demoAccount: DEMO_ACCOUNTS.student.name,
    demoEmail: DEMO_ACCOUNTS.student.email,
    demoPassword: DEMO_ACCOUNTS.student.defaultPassword,
  },
  {
    role: 'parent',
    title: 'Portal Orang Tua / Wali',
    subtitle: 'Pemantauan Terpadu Putra-Putri',
    description:
      'Pantau kehadiran anak real-time, evaluasi rapor nilai, serta unggah bukti transfer SPP & unduh kwitansi resmi.',
    href: '/parent',
    icon: Users,
    badgeText: 'Multi-Child',
    demoAccount: DEMO_ACCOUNTS.parent.name,
    demoEmail: DEMO_ACCOUNTS.parent.email,
    demoPassword: DEMO_ACCOUNTS.parent.defaultPassword,
  },
]

function LoginPage() {
  const navigate = useNavigate()
  const [isRegisterOpen, setIsRegisterOpen] = React.useState(false)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false)

  const [adminRoleType, setAdminRoleType] = React.useState<'super_admin' | 'regular_admin'>('super_admin')
  const [selectedRole, setSelectedRole] = React.useState<RoleCard>(ROLES[0])
  const [emailOrId, setEmailOrId] = React.useState(DEMO_ACCOUNTS.super_admin.email)
  const [password, setPassword] = React.useState(DEMO_ACCOUNTS.super_admin.defaultPassword)
  const [showPassword, setShowPassword] = React.useState(false)
  const [isSubmitting, setIsSubmitting] = React.useState(false)
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null)
  const [deactivatedNotice, setDeactivatedNotice] = React.useState(false)
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

  const handleRoleCardClick = (roleCard: RoleCard) => {
    setSelectedRole(roleCard)
    if (roleCard.role === 'admin') {
      const isSuper = adminRoleType === 'super_admin'
      setEmailOrId(isSuper ? DEMO_ACCOUNTS.super_admin.email : DEMO_ACCOUNTS.admin.email)
      setPassword(isSuper ? DEMO_ACCOUNTS.super_admin.defaultPassword : DEMO_ACCOUNTS.admin.defaultPassword)
    } else {
      setEmailOrId(roleCard.demoEmail)
      setPassword(roleCard.demoPassword)
    }
    setErrorMessage(null)
  }

  // 1-Click Quick Demo Login
  const handleQuickDemoLogin = async (role: UserRole) => {
    setIsSubmitting(true)
    const isSuper = role === 'admin' && adminRoleType === 'super_admin'
    const targetAccount = isSuper
      ? DEMO_ACCOUNTS.super_admin
      : role === 'admin'
      ? DEMO_ACCOUNTS.admin
      : DEMO_ACCOUNTS[role]

    try {
      const loginRes = await authStore.login(targetAccount.email, targetAccount.defaultPassword, targetAccount.role)
      if (loginRes.success && loginRes.href) {
        const dest = redirectPath || loginRes.href
        navigate({ to: dest as any })
        return
      }
      if (!loginRes.success && loginRes.error) {
        setErrorMessage(loginRes.error)
        return
      }
    } catch (err) {
      console.warn('Quick login Supabase auth fallback:', err)
    } finally {
      setIsSubmitting(false)
    }

    const result = authStore.quickLogin(isSuper ? 'super_admin' : role)
    if (result.success && result.href) {
      const dest = redirectPath || result.href
      navigate({ to: dest as any })
    } else if (result.error) {
      setErrorMessage(result.error)
    }
  }

  // Interactive Form Login
  const handleFormLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMessage(null)
    setIsSubmitting(true)

    try {
      const result = await authStore.login(emailOrId, password, selectedRole.role)
      if (result.success && result.href) {
        const dest = redirectPath || result.href
        navigate({ to: dest as any })
      } else {
        setErrorMessage(
          result.error ||
            'Email atau kata sandi tidak cocok. Silakan gunakan akun demo atau periksa kembali input Anda.'
        )
      }
    } catch {
      setErrorMessage('Terjadi kesalahan saat memproses login. Silakan coba kembali.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#EEEEEE] flex flex-col font-sans">
      <Header
        onOpenRegister={() => setIsRegisterOpen(true)}
        onToggleMobileMenu={() => setIsMobileMenuOpen(true)}
      />

      <main className="flex-1 max-w-[1200px] w-full mx-auto px-4 sm:px-6 py-10 sm:py-14 space-y-10">
        {/* Editorial Header */}
        <div className="text-center max-w-2xl mx-auto space-y-2.5">
          <span className="text-[11px] font-bold uppercase tracking-[0.08em] text-[#A81E46]">
            Autentikasi & Hak Akses Berbasis Peran
          </span>
          <h1 className="font-display font-extrabold text-3xl sm:text-4xl text-[#000000] tracking-tight">
            Masuk ke Portal Layanan
          </h1>
          <p className="text-xs sm:text-sm text-[#555555] leading-relaxed">
            Pilih portal layanan yang sesuai atau gunakan tombol <strong>Masuk Cepat Demo</strong> untuk uji coba instan panel kerja operasional tanpa konfigurasi.
          </p>
        </div>

        {deactivatedNotice && (
          <div
            className="p-4 bg-[#F6E7E3] border border-[#901B14]/40 rounded-[4px] flex items-start gap-3 text-xs text-[#901B14] max-w-2xl mx-auto"
            role="alert"
          >
            <AlertCircle className="w-5 h-5 shrink-0 mt-0.5 text-[#901B14]" />
            <div className="space-y-1">
              <strong className="font-bold text-[#901B14] block">
                Sesi Dihentikan — Akun Staf Dinonaktifkan
              </strong>
              <p className="text-[#901B14]/90 leading-relaxed">
                Akses login Anda telah dicabut karena akun telah dinonaktifkan oleh Pimpinan Lembaga. Silakan hubungi kantor Tata Usaha untuk informasi dan pemulihan akses.
              </p>
            </div>
          </div>
        )}

        {/* 4 Role Selection & Quick Demo Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {ROLES.map((item) => {
            const Icon = item.icon
            const isSelected = selectedRole.role === item.role
            const currentDemoName =
              item.role === 'admin'
                ? adminRoleType === 'super_admin'
                  ? DEMO_ACCOUNTS.super_admin.name
                  : DEMO_ACCOUNTS.admin.name
                : item.demoAccount
            const currentDemoEmail =
              item.role === 'admin'
                ? adminRoleType === 'super_admin'
                  ? DEMO_ACCOUNTS.super_admin.email
                  : DEMO_ACCOUNTS.admin.email
                : item.demoEmail

            return (
              <div
                key={item.role}
                className={`bg-[#FFFFFF] rounded-[14px] p-5 flex flex-col justify-between transition-all relative select-none ${
                  isSelected
                    ? 'border-2 border-[#000000] shadow-sm'
                    : 'border border-[#D2D2D2] hover:border-[#000000]'
                }`}
              >
                <div
                  className="space-y-3 cursor-pointer"
                  onClick={() => handleRoleCardClick(item)}
                >
                  <div className="flex items-center justify-between gap-2">
                    <div
                      className={`w-9 h-9 rounded-full flex items-center justify-center border transition-colors ${
                        isSelected
                          ? 'bg-[#000000] text-[#FFFFFF] border-[#000000]'
                          : 'bg-[#F6F6F6] text-[#292524] border-[#D2D2D2]'
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                    </div>
                    <span className="text-[10px] font-bold text-[#555555] uppercase tracking-wider">
                      {item.badgeText}
                    </span>
                  </div>

                  <div>
                    <h2 className="font-display font-bold text-base text-[#000000] leading-snug">
                      {item.title}
                    </h2>
                    <p className="text-xs font-semibold text-[#A81E46] mt-0.5">
                      {item.subtitle}
                    </p>
                    <p className="text-xs text-[#555555] mt-2 leading-relaxed">
                      {item.description}
                    </p>
                  </div>
                </div>

                <div className="pt-4 mt-4 border-t border-[#D2D2D2] space-y-3">
                  {item.role === 'admin' && (
                    <div className="space-y-1.5">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-[#555555]">
                        Tingkat Akses Demo:
                      </span>
                      <div className="grid grid-cols-2 gap-1 p-0.5 bg-[#F6F6F6] border border-[#D2D2D2] rounded-[4px] text-[10px]">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation()
                            setAdminRoleType('super_admin')
                            if (selectedRole.role === 'admin') {
                              setEmailOrId(DEMO_ACCOUNTS.super_admin.email)
                              setPassword(DEMO_ACCOUNTS.super_admin.defaultPassword)
                            }
                          }}
                          className={`py-1 px-1.5 rounded-[2px] font-medium transition-all text-center cursor-pointer ${
                            adminRoleType === 'super_admin'
                              ? 'bg-[#000000] text-[#FFFFFF]'
                              : 'text-[#555555] hover:text-[#000000]'
                          }`}
                        >
                          Super Admin
                        </button>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation()
                            setAdminRoleType('regular_admin')
                            if (selectedRole.role === 'admin') {
                              setEmailOrId(DEMO_ACCOUNTS.admin.email)
                              setPassword(DEMO_ACCOUNTS.admin.defaultPassword)
                            }
                          }}
                          className={`py-1 px-1.5 rounded-[2px] font-medium transition-all text-center cursor-pointer ${
                            adminRoleType === 'regular_admin'
                              ? 'bg-[#000000] text-[#FFFFFF]'
                              : 'text-[#555555] hover:text-[#000000]'
                          }`}
                        >
                          Staf Tata Usaha
                        </button>
                      </div>
                    </div>
                  )}

                  <div className="text-[11px] text-[#555555]">
                    Akun Demo:
                    <strong className="block text-[#000000] truncate mt-0.5 font-medium">
                      {currentDemoName}
                    </strong>
                    <span className="font-mono text-[10px] text-[#555555] block truncate mt-0.5">
                      {currentDemoEmail}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 gap-2">
                    {/* Quick Demo 1-Click Button */}
                    <button
                      type="button"
                      onClick={() => handleQuickDemoLogin(item.role)}
                      className="w-full inline-flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-[8px] bg-[#000000] text-[#FFFFFF] hover:bg-[#262626] transition-colors cursor-pointer"
                    >
                      <Sparkles className="w-3.5 h-3.5 text-[#CB2957]" />
                      <span>Masuk Cepat Demo</span>
                    </button>

                    {/* Choose to fill interactive form */}
                    <button
                      type="button"
                      onClick={() => handleRoleCardClick(item)}
                      className={`w-full inline-flex items-center justify-between px-3 py-1.5 text-[11px] font-medium rounded-[8px] transition-colors cursor-pointer border ${
                        isSelected
                          ? 'bg-[#F6F6F6] text-[#000000] border-[#000000]'
                          : 'bg-[#FFFFFF] text-[#555555] border-[#D2D2D2] hover:text-[#000000] hover:border-[#000000]'
                      }`}
                    >
                      <span>Isi Form Login</span>
                      <ArrowRight className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        {/* Interactive Login Form */}
        <div className="max-w-md mx-auto bg-[#FFFFFF] border border-[#D2D2D2] rounded-[14px] p-6 sm:p-7 space-y-5 shadow-xs">
          <div className="flex items-center gap-3 pb-4 border-b border-[#D2D2D2]">
            <div className="w-9 h-9 rounded-full bg-[#000000] text-[#FFFFFF] flex items-center justify-center shrink-0">
              <Lock className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-display font-bold text-sm text-[#000000]">
                Formulir Masuk ({selectedRole.title})
              </h3>
              <p className="text-xs text-[#555555]">
                Masukkan email atau NIS beserta kata sandi Anda.
              </p>
            </div>
          </div>

          {errorMessage && (
            <div
              className="p-3 bg-[#F6E7E3] border border-[#901B14]/30 rounded-[8px] flex items-start gap-2.5 text-xs text-[#901B14]"
              role="alert"
            >
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}

          <form onSubmit={handleFormLogin} className="space-y-4">
            <div className="space-y-1.5">
              <label
                htmlFor="login-email"
                className="text-xs font-semibold text-[#292524] flex items-center justify-between"
              >
                <span>Alamat Email atau NIS</span>
                <span className="text-[10px] font-mono text-[#555555] font-normal">
                  {selectedRole.role === 'student' ? 'Email / NIS' : 'Email Terdaftar'}
                </span>
              </label>
              <div className="relative">
                <input
                  id="login-email"
                  type="text"
                  value={emailOrId}
                  onChange={(e) => setEmailOrId(e.target.value)}
                  placeholder="nama@tadulakocendekia.sch.id"
                  required
                  className="w-full h-10 pl-3 pr-9 text-xs bg-[#F6F6F6] focus:bg-[#FFFFFF] text-[#000000] border border-[#D2D2D2] rounded-[8px] focus:outline-none focus:border-[#000000] transition-all font-mono"
                />
                <Mail className="w-4 h-4 text-[#555555] absolute right-3 top-3 pointer-events-none" />
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label
                  htmlFor="login-password"
                  className="text-xs font-semibold text-[#292524] block"
                >
                  Kata Sandi
                </label>
                <span className="text-[10px] text-[#555555]">
                  Demo: <code className="font-mono text-[#000000]">{selectedRole.demoPassword}</code>
                </span>
              </div>
              <div className="relative">
                <input
                  id="login-password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Masukkan kata sandi"
                  required
                  className="w-full h-10 pl-3 pr-9 text-xs bg-[#F6F6F6] focus:bg-[#FFFFFF] text-[#000000] border border-[#D2D2D2] rounded-[8px] focus:outline-none focus:border-[#000000] transition-all font-mono"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-3 text-[#555555] hover:text-[#000000] cursor-pointer"
                  aria-label={showPassword ? 'Sembunyikan kata sandi' : 'Tampilkan kata sandi'}
                >
                  {showPassword ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full h-10 inline-flex items-center justify-center gap-2 text-xs font-semibold text-[#FFFFFF] bg-[#000000] hover:bg-[#262626] disabled:opacity-50 rounded-[8px] transition-colors cursor-pointer mt-2"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Memproses Masuk...</span>
                </>
              ) : (
                <>
                  <span>Masuk ke {selectedRole.title}</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </>
              )}
            </button>
          </form>

          {/* Registration Prompt Link */}
          <div className="pt-4 border-t border-[#D2D2D2] text-center space-y-2">
            <p className="text-xs text-[#555555]">
              Belum terdaftar sebagai siswa bimbingan?
            </p>
            <button
              type="button"
              onClick={() => setIsRegisterOpen(true)}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#CB2957] hover:text-[#A81E46] transition-colors cursor-pointer"
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>Daftar Calon Siswa Baru Sekarang</span>
            </button>
          </div>
        </div>
      </main>

      <CtaFooter onOpenRegister={() => setIsRegisterOpen(true)} />

      <RegisterModal
        isOpen={isRegisterOpen}
        onClose={() => setIsRegisterOpen(false)}
      />

      <MobileDrawer
        isOpen={isMobileMenuOpen}
        onClose={() => setIsMobileMenuOpen(false)}
        onOpenRegister={() => {
          setIsMobileMenuOpen(false)
          setIsRegisterOpen(true)
        }}
      />
    </div>
  )
}
