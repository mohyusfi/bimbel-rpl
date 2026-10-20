import * as React from 'react'
import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'
import {
  ShieldCheck,
  GraduationCap,
  BookOpen,
  Users,
  ArrowRight,
  Sparkles,
  Lock,
} from 'lucide-react'
import { Header } from '~/components/landing/Header'
import { CtaFooter } from '~/components/landing/CtaFooter'
import { RegisterModal } from '~/components/landing/RegisterModal'
import { MobileDrawer } from '~/components/landing/MobileDrawer'

export const Route = createFileRoute('/masuk')({
  ssr: false,
  component: LoginPage,
})

interface RoleCard {
  role: 'admin' | 'tutor' | 'student' | 'parent'
  title: string
  subtitle: string
  description: string
  href: string
  icon: React.ComponentType<{ className?: string }>
  badgeText: string
  demoAccount: string
  accentColor: string
}

const ROLES: RoleCard[] = [
  {
    role: 'admin',
    title: 'Portal Tata Usaha (Admin)',
    subtitle: 'Pengelola Bimbel & Master Data',
    description:
      'Verifikasi pendaftaran mandiri calon siswa, manajemen jadwal anti-bentrok, dan verifikasi bukti pembayaran SPP.',
    href: '/admin',
    icon: ShieldCheck,
    badgeText: 'Akses Penuh',
    demoAccount: 'Hj. Nuraini, S.Pd (Kepala TU)',
    accentColor: '#000000',
  },
  {
    role: 'tutor',
    title: 'Portal Pengajar (Tutor)',
    subtitle: 'Tenaga Pendidik Tadulako Cendekia',
    description:
      'Checklist presensi digital sesi kelas hari ini, input nilai latihan & try out, serta distribusi modul dan tugas mandiri.',
    href: '/tutor',
    icon: GraduationCap,
    badgeText: 'Akademik',
    demoAccount: 'Kak Dian Pratiwi, S.Si (Fisika)',
    accentColor: '#CB2957',
  },
  {
    role: 'student',
    title: 'Portal Siswa',
    subtitle: 'Peserta Bimbingan Belajar',
    description:
      'Pantau jadwal bimbingan les mingguan, unduh modul pelajaran, cek rapor nilai try out, dan lihat status SPP.',
    href: '/student',
    icon: BookOpen,
    badgeText: 'Ruang Belajar',
    demoAccount: 'Fahri Ramadhan (Kelas 12 UTBK)',
    accentColor: '#000000',
  },
  {
    role: 'parent',
    title: 'Portal Orang Tua / Wali',
    subtitle: 'Pemantauan Terpadu Putra-Putri',
    description:
      'Pantau kehadiran anak real-time, evaluasi rapor perkembangan nilai dari tutor, serta unggah bukti transfer SPP & unduh kwitansi.',
    href: '/parent',
    icon: Users,
    badgeText: 'Multi-Child',
    demoAccount: 'Ir. H. Ahmad Dahlan (Wali 2 Siswa)',
    accentColor: '#A81E46',
  },
]

function LoginPage() {
  const navigate = useNavigate()
  const [isRegisterOpen, setIsRegisterOpen] = React.useState(false)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false)

  const [selectedRole, setSelectedRole] = React.useState<RoleCard>(ROLES[0])
  const [email, setEmail] = React.useState('nuraini.tu@tadulakocendekia.sch.id')
  const [password, setPassword] = React.useState('password123')

  const handleRoleSelect = (roleCard: RoleCard) => {
    setSelectedRole(roleCard)
    if (roleCard.role === 'admin') {
      setEmail('nuraini.tu@tadulakocendekia.sch.id')
    } else if (roleCard.role === 'tutor') {
      setEmail('dian.pratiwi@tadulakocendekia.sch.id')
    } else if (roleCard.role === 'student') {
      setEmail('fahri.ramadhan@siswa.tadulakocendekia.sch.id')
    } else {
      setEmail('ahmad.dahlan@wali.tadulakocendekia.sch.id')
    }
  }

  const handleDirectLogin = (e: React.FormEvent) => {
    e.preventDefault()
    navigate({ to: selectedRole.href as any })
  }

  return (
    <div className="min-h-screen bg-[#EEEEEE] flex flex-col font-sans">
      <Header
        onOpenRegister={() => setIsRegisterOpen(true)}
        onToggleMobileMenu={() => setIsMobileMenuOpen(true)}
      />

      <main className="flex-1 max-w-[1200px] w-full mx-auto px-4 sm:px-6 py-10 sm:py-14 space-y-8">
        {/* Editorial Header */}
        <div className="text-center max-w-2xl mx-auto space-y-2">
          <span className="text-xs font-bold uppercase tracking-[0.08em] text-[#A81E46]">
            Autentikasi & Hak Akses Berbasis Peran (RBAC)
          </span>
          <h1 className="font-display font-extrabold text-3xl sm:text-4xl text-[#000000] tracking-tight">
            Masuk ke Portal Layanan
          </h1>
          <p className="text-sm text-[#555555] leading-relaxed">
            Pilih salah satu peran pengguna di bawah ini untuk langsung mengakses panel kerja operasional atau uji coba akun demo simulasi.
          </p>
        </div>

        {/* 4 Role Selection Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {ROLES.map((item) => {
            const Icon = item.icon
            const isSelected = selectedRole.role === item.role

            return (
              <div
                key={item.role}
                onClick={() => handleRoleSelect(item)}
                className={`bg-[#FFFFFF] border rounded-[14px] p-5 flex flex-col justify-between transition-all cursor-pointer relative group select-none ${
                  isSelected
                    ? 'border-2 border-[#000000]'
                    : 'border-[#D2D2D2] hover:border-[#000000]'
                }`}
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between gap-2">
                    <div
                      className={`w-9 h-9 rounded-full flex items-center justify-center border transition-colors ${
                        isSelected
                          ? 'bg-[#000000] text-[#FFFFFF] border-[#000000]'
                          : 'bg-[#F6F6F6] text-[#292524] border-[#D2D2D2] group-hover:border-[#000000]'
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                    </div>
                    <span className="text-[11px] font-semibold text-[#555555] uppercase tracking-wider">
                      {item.badgeText}
                    </span>
                  </div>

                  <div>
                    <h3 className="font-display font-bold text-base text-[#000000] leading-snug">
                      {item.title}
                    </h3>
                    <p className="text-xs font-semibold text-[#A81E46] mt-0.5">
                      {item.subtitle}
                    </p>
                    <p className="text-xs text-[#555555] mt-2 leading-relaxed">
                      {item.description}
                    </p>
                  </div>
                </div>

                <div className="pt-4 mt-4 border-t border-[#D2D2D2] space-y-2">
                  <div className="text-[11px] text-[#555555]">
                    Akun Demo:
                    <strong className="block text-[#000000] truncate mt-0.5">
                      {item.demoAccount}
                    </strong>
                  </div>

                  <Link
                    to={item.href as any}
                    className="inline-flex items-center justify-between w-full px-3 py-2 text-xs font-semibold rounded-[8px] bg-[#F6F6F6] hover:bg-[#000000] hover:text-[#FFFFFF] border border-[#D2D2D2] hover:border-[#000000] transition-colors"
                  >
                    <span>Buka Portal Langsung</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            )
          })}
        </div>

        {/* Quick Simulation Form */}
        <div className="max-w-md mx-auto bg-[#FFFFFF] border border-[#D2D2D2] rounded-[14px] p-6 sm:p-7 space-y-5">
          <div className="flex items-center gap-2.5 pb-4 border-b border-[#D2D2D2]">
            <div className="w-8 h-8 rounded-full bg-[#CB2957]/10 text-[#CB2957] flex items-center justify-center shrink-0">
              <Lock className="w-4 h-4" />
            </div>
            <div>
              <h2 className="font-display font-bold text-sm text-[#000000]">
                Simulasi Form Masuk ({selectedRole.title})
              </h2>
              <p className="text-xs text-[#555555]">
                Klik "Masuk Sekarang" untuk langsung menuju dashboard.
              </p>
            </div>
          </div>

          <form onSubmit={handleDirectLogin} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-[#292524] block">
                Alamat Email Pengguna
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full h-10 px-3 text-xs bg-[#F6F6F6] focus:bg-[#FFFFFF] text-[#000000] border border-[#D2D2D2] rounded-[8px] focus:outline-none focus:border-[#000000] focus:ring-2 focus:ring-[#CB2957]/20 transition-all font-mono"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-[#292524] block">
                Kata Sandi
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full h-10 px-3 text-xs bg-[#F6F6F6] focus:bg-[#FFFFFF] text-[#000000] border border-[#D2D2D2] rounded-[8px] focus:outline-none focus:border-[#000000] focus:ring-2 focus:ring-[#CB2957]/20 transition-all font-mono"
              />
            </div>

            <button
              type="submit"
              className="w-full h-10 inline-flex items-center justify-center gap-2 text-xs font-semibold text-[#FFFFFF] bg-[#000000] hover:bg-[#262626] rounded-[8px] transition-colors cursor-pointer"
            >
              <span>Masuk Sekarang ({selectedRole.role.toUpperCase()})</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </form>
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
