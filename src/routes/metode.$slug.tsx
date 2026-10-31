import * as React from 'react'
import { createFileRoute, Link, notFound } from '@tanstack/react-router'
import { motion, AnimatePresence } from 'motion/react'
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  XCircle,
  Clock,
  Sparkles,
  HelpCircle,
  Layers,
} from 'lucide-react'
import { Header } from '~/components/landing/Header'
import { CtaFooter } from '~/components/landing/CtaFooter'
import { MobileDrawer } from '~/components/landing/MobileDrawer'
import { LEARNING_METHODS, getLearningMethodBySlug } from '~/lib/learning-methods'
import { fadeInUp, staggerContainer, viewportConfig } from '~/lib/motion'

const RegisterModal = React.lazy(() =>
  import('~/components/landing/RegisterModal').then((mod) => ({
    default: mod.RegisterModal,
  }))
)

export const Route = createFileRoute('/metode/$slug')({
  loader: ({ params }) => {
    const method = getLearningMethodBySlug(params.slug)
    if (!method) {
      throw notFound()
    }
    return { method }
  },
  head: ({ loaderData }) => {
    const method = loaderData?.method
    const title = method
      ? `${method.title} — Pintar Yuk Palu`
      : 'Metode Belajar — Pintar Yuk'
    const desc = method
      ? method.heroLead
      : 'Metodologi bimbingan belajar tatap muka terarah di Pintar Yuk Kota Palu.'
    return {
      meta: [
        { title },
        { name: 'description', content: desc },
      ],
    }
  },
  component: LearningMethodDetailPage,
})

function LearningMethodDetailPage() {
  const { method } = Route.useLoaderData()
  const [activeStepIndex, setActiveStepIndex] = React.useState<number>(0)
  const [checkedSymptoms, setCheckedSymptoms] = React.useState<Record<string, boolean>>({})
  const [isRegisterOpen, setIsRegisterOpen] = React.useState<boolean>(false)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState<boolean>(false)
  const navBarRef = React.useRef<HTMLDivElement>(null)

  // Reset active step saat slug metode berganti
  React.useEffect(() => {
    setActiveStepIndex(0)
    setCheckedSymptoms({})
  }, [method.slug])

  // Auto-scroll active tab into view di mobile saat metode dipilih
  React.useEffect(() => {
    if (navBarRef.current) {
      const activeEl = navBarRef.current.querySelector<HTMLElement>('.lp-method-nav-pill.is-active')
      if (activeEl) {
        activeEl.scrollIntoView({
          behavior: 'smooth',
          block: 'nearest',
          inline: 'center',
        })
      }
    }
  }, [method.slug])

  const currentStep = method.simulationSteps[activeStepIndex] || method.simulationSteps[0]

  const checkedCount = Object.values(checkedSymptoms).filter(Boolean).length
  const matchPercentage =
    method.symptoms.length > 0
      ? Math.min(100, Math.round(((checkedCount + 1) / (method.symptoms.length + 1)) * 100))
      : 85

  const handleToggleSymptom = (id: string) => {
    setCheckedSymptoms((prev) => ({
      ...prev,
      [id]: !prev[id],
    }))
  }

  const handleOpenRegister = () => {
    setIsRegisterOpen(true)
  }

  return (
    <>
      <Header
        onOpenRegister={handleOpenRegister}
        onToggleMobileMenu={() => setIsMobileMenuOpen(true)}
      />

      <main>
        {/* HERO SECTION METODE */}
        <section className="lp-method-hero">
          <div className="container">
            <motion.div
              variants={staggerContainer(0.08)}
              initial="hidden"
              animate="visible"
            >
              {/* Breadcrumb */}
              <motion.div variants={fadeInUp} className="lp-method-breadcrumb">
                <Link to="/" className="inline-flex items-center gap-1.5 hover:text-[#CB2957]">
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Beranda</span>
                </Link>
                <span>/</span>
                <span>Metode Belajar</span>
                <span>/</span>
                <span className="text-[#000000] font-bold">{method.shortName}</span>
              </motion.div>

              {/* Badges & Navigation Switcher */}
              <motion.div variants={fadeInUp} className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
                <div className="inline-flex items-center gap-2">
                  <span className="px-2.5 py-0.5 text-xs font-bold uppercase tracking-wider bg-[#000000] text-[#FFFFFF] rounded-[2px]">
                    Metode {method.number}
                  </span>
                  <span className="px-2.5 py-0.5 text-xs font-bold uppercase tracking-wider bg-[#FBEAEF] text-[#A81E46] border border-[#CB2957]/30 rounded-[2px]">
                    {method.badge}
                  </span>
                </div>

                <div className="lp-method-nav-wrapper">
                  <div className="lp-method-nav-bar" ref={navBarRef} role="navigation" aria-label="Pilihan metode belajar">
                    {LEARNING_METHODS.map((m) => (
                      <Link
                        key={m.slug}
                        to={`/metode/${m.slug}` as any}
                        className={`lp-method-nav-pill ${m.slug === method.slug ? 'is-active' : ''}`}
                      >
                        <span className="mr-1.5 font-mono font-bold text-[#CB2957]">{m.number}</span>
                        {m.shortName}
                      </Link>
                    ))}
                  </div>
                  <div className="lp-method-nav-fade" aria-hidden="true" />
                </div>
              </motion.div>

              {/* Title & Tagline */}
              <motion.h1
                variants={fadeInUp}
                className="font-display font-extrabold text-3xl sm:text-5xl lg:text-6xl text-[#000000] tracking-tight leading-[1.05] max-w-4xl mb-3"
              >
                {method.title}
              </motion.h1>

              <motion.p
                variants={fadeInUp}
                className="text-lg sm:text-xl font-medium text-[#CB2957] max-w-3xl mb-6"
              >
                {method.tagline}
              </motion.p>

              <motion.p
                variants={fadeInUp}
                className="text-base sm:text-lg text-[#555555] leading-relaxed max-w-3xl mb-8"
              >
                {method.heroLead}
              </motion.p>

              {/* Facts / Metrics Strip */}
              <motion.div
                variants={fadeInUp}
                className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-6 border-t-2 border-[#000000]"
              >
                {method.metrics.map((metric) => (
                  <div key={metric.label} className="p-4 bg-[#FFFFFF] border border-[#000000] rounded-[2px]">
                    <div className="font-display font-black text-3xl sm:text-4xl text-[#000000] tabular-nums mb-1">
                      {metric.value}
                    </div>
                    <div className="text-xs sm:text-sm text-[#555555]">
                      {metric.label}
                    </div>
                  </div>
                ))}
              </motion.div>
            </motion.div>
          </div>
        </section>

        {/* SECTION 1: SIMULATOR LANGKAH BELAJAR INTERAKTIF (motion/react) */}
        <section className="lp-section">
          <div className="container">
            <div className="lp-section-head">
              <div>
                <span className="block mb-2 text-xs font-mono font-bold uppercase tracking-wider text-[#CB2957]">
                  Simulasi Interaktif
                </span>
                <h2 className="lp-h2">Bagaimana metode ini dijalankan di dalam kelas?</h2>
              </div>
              <p>
                Klik setiap tahapan di bawah untuk melihat alur pendampingan tutor Pintar Yuk bersama siswa secara langkah demi langkah.
              </p>
            </div>

            {/* Stepper Selector */}
            <div className="lp-step-stepper" role="tablist" aria-label="Tahapan simulasi metode">
              {method.simulationSteps.map((step, idx) => {
                const isActive = idx === activeStepIndex
                return (
                  <button
                    key={step.stepNumber}
                    type="button"
                    role="tab"
                    aria-selected={isActive}
                    className={`lp-step-stepper-btn ${isActive ? 'is-active' : ''}`}
                    onClick={() => setActiveStepIndex(idx)}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-mono font-bold uppercase">
                        Tahap {step.stepNumber}
                      </span>
                      {isActive && <Sparkles className="w-3.5 h-3.5 text-[#CB2957]" />}
                    </div>
                    <div className="font-display font-bold text-sm leading-snug">
                      {step.title}
                    </div>
                  </button>
                )
              })}
            </div>

            {/* Panel Simulasi Aktif */}
            <div className="lp-interactive-simulator">
              <AnimatePresence mode="wait">
                <motion.div
                  key={currentStep.stepNumber}
                  initial={{ opacity: 0, x: 16 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -16 }}
                  transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
                  className="space-y-6"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b-2 border-[#000000]">
                    <div>
                      <span className="text-xs font-mono font-bold uppercase tracking-wider text-[#CB2957] block">
                        Langkah {currentStep.stepNumber} dari 04
                      </span>
                      <h3 className="font-display font-black text-2xl sm:text-3xl text-[#000000] mt-1">
                        {currentStep.title}
                      </h3>
                    </div>
                    <span className="px-3 py-1 bg-[#EEEEEE] text-[#000000] border border-[#000000] text-xs font-mono font-semibold rounded-[2px] self-start sm:self-auto">
                      {currentStep.realExample}
                    </span>
                  </div>

                  <p className="text-base text-[#292524] leading-relaxed">
                    {currentStep.description}
                  </p>

                  {/* Split Box: Peran Tutor vs Respons Siswa */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="p-5 bg-[#EEEEEE] border-2 border-[#000000] rounded-[2px] space-y-2">
                      <div className="flex items-center gap-2 text-xs font-mono font-bold uppercase text-[#000000]">
                        <Clock className="w-4 h-4 text-[#CB2957]" />
                        <span>Aksi Tutor di Kelas</span>
                      </div>
                      <p className="text-sm font-semibold text-[#000000] leading-relaxed">
                        {currentStep.tutorAction}
                      </p>
                    </div>

                    <div className="p-5 bg-[#FFFFFF] border-2 border-[#000000] rounded-[2px] space-y-2">
                      <div className="flex items-center gap-2 text-xs font-mono font-bold uppercase text-[#000000]">
                        <CheckCircle2 className="w-4 h-4 text-[#166534]" />
                        <span>Respon & Aktivitas Siswa</span>
                      </div>
                      <p className="text-sm font-medium text-[#292524] leading-relaxed">
                        {currentStep.studentAction}
                      </p>
                    </div>
                  </div>

                  {/* Tombol Navigasi Antar Step */}
                  <div className="flex items-center justify-between pt-4 border-t border-[#D2D2D2]">
                    <button
                      type="button"
                      disabled={activeStepIndex === 0}
                      onClick={() => setActiveStepIndex((prev) => Math.max(0, prev - 1))}
                      className="btn btn-outline btn-sm inline-flex items-center gap-1.5 disabled:opacity-30 disabled:pointer-events-none"
                    >
                      <ArrowLeft className="w-3.5 h-3.5" />
                      <span>Tahap Sebelumnya</span>
                    </button>

                    <button
                      type="button"
                      disabled={activeStepIndex === method.simulationSteps.length - 1}
                      onClick={() => setActiveStepIndex((prev) => Math.min(method.simulationSteps.length - 1, prev + 1))}
                      className="btn btn-primary btn-sm inline-flex items-center gap-1.5 disabled:opacity-30 disabled:pointer-events-none"
                    >
                      <span>Tahap Berikutnya</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </motion.div>
              </AnimatePresence>
            </div>
          </div>
        </section>

        {/* SECTION 2: PERBANDINGAN CARA LAMA VS METODE ANEMONE */}
        <section className="lp-section bg-[#F6F6F6] border-y-2 border-[#000000]">
          <div className="container">
            <div className="lp-section-head">
              <div>
                <span className="block mb-2 text-xs font-mono font-bold uppercase tracking-wider text-[#CB2957]">
                  Perbandingan Nyata
                </span>
                <h2 className="lp-h2">Cara belajar konvensional vs Metode Pintar Yuk</h2>
              </div>
              <p>
                Lihat perbedaan mendasar antara pola belajar hafalan pasif dengan pembiasaan nalar aktif di kelas Pintar Yuk.
              </p>
            </div>

            <div className="lp-comparison-table-wrap mt-8">
              <table className="lp-comparison-table">
                <thead>
                  <tr>
                    <th style={{ width: '25%' }}>Aspek Belajar</th>
                    <th style={{ width: '37.5%' }}>Cara Konvensional / Hafalan</th>
                    <th style={{ width: '37.5%' }}>Pendekatan Pintar Yuk</th>
                  </tr>
                </thead>
                <tbody>
                  {method.comparisons.map((row) => (
                    <tr key={row.aspect}>
                      <td className="font-bold text-[#000000]">{row.aspect}</td>
                      <td>
                        <div className="flex items-start gap-2">
                          <XCircle className="w-4 h-4 text-[#A1301C] shrink-0 mt-0.5" />
                          <span>{row.conventional}</span>
                        </div>
                      </td>
                      <td>
                        <div className="flex items-start gap-2">
                          <CheckCircle2 className="w-4 h-4 text-[#166534] shrink-0 mt-0.5" />
                          <span>{row.anemone}</span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>

        {/* SECTION 3: CHECKLIST DIAGNOSTIK KECOCOKAN SISWA (Interaktif) */}
        <section className="lp-section">
          <div className="container">
            <div className="max-w-3xl mx-auto bg-[#FFFFFF] border-2 border-[#000000] rounded-[4px] p-6 sm:p-10">
              <div className="flex items-start gap-3 mb-6 pb-4 border-b-2 border-[#000000]">
                <div className="w-10 h-10 rounded-full bg-[#EEEEEE] border-2 border-[#000000] flex items-center justify-center shrink-0">
                  <HelpCircle className="w-5 h-5 text-[#CB2957]" />
                </div>
                <div>
                  <h3 className="font-display font-extrabold text-xl sm:text-2xl text-[#000000]">
                    Apakah metode ini yang paling dibutuhkan anak Anda?
                  </h3>
                  <p className="text-xs sm:text-sm text-[#555555] mt-1">
                    Centang kondisi belajar yang sedang dihadapi anak saat ini untuk melihat tingkat kecocokan metode:
                  </p>
                </div>
              </div>

              {/* Checklist */}
              <div className="space-y-3 mb-8">
                {method.symptoms.map((symptom) => {
                  const isChecked = Boolean(checkedSymptoms[symptom.id])
                  return (
                    <label
                      key={symptom.id}
                      className={`flex items-start gap-3 p-3.5 border-2 rounded-[2px] cursor-pointer transition-colors ${
                        isChecked
                          ? 'bg-[#FBEAEF] border-[#CB2957] text-[#000000]'
                          : 'bg-[#EEEEEE] border-[#000000] text-[#292524] hover:bg-[#E2E2E2]'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => handleToggleSymptom(symptom.id)}
                        className="mt-0.5 w-4 h-4 accent-[#CB2957] cursor-pointer"
                      />
                      <span className="text-xs sm:text-sm font-medium leading-relaxed">
                        {symptom.text}
                      </span>
                    </label>
                  )
                })}
              </div>

              {/* Bar Hasil Kecocokan */}
              <div className="p-4 bg-[#EEEEEE] border-2 border-[#000000] rounded-[2px] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-display font-black text-2xl text-[#CB2957] tabular-nums">
                      {matchPercentage}% Cocok
                    </span>
                    <span className="text-xs font-semibold text-[#000000]">
                      dengan program {method.recommendedPackageName}
                    </span>
                  </div>
                  <p className="text-xs text-[#555555] mt-0.5">
                    Metode ini dirancang tepat untuk menyelesaikan kendala belajar di atas.
                  </p>
                </div>

                <button
                  type="button"
                  className="btn btn-accent btn-sm shrink-0"
                  onClick={handleOpenRegister}
                >
                  Daftar kelas coba gratis
                </button>
              </div>
            </div>
          </div>
        </section>
      </main>

      <CtaFooter onOpenRegister={handleOpenRegister} />

      <MobileDrawer
        isOpen={isMobileMenuOpen}
        onClose={() => setIsMobileMenuOpen(false)}
        onOpenRegister={handleOpenRegister}
      />

      <React.Suspense fallback={null}>
        {isRegisterOpen && (
          <RegisterModal
            isOpen={isRegisterOpen}
            onClose={() => setIsRegisterOpen(false)}
            defaultPackage={method.recommendedPackage}
          />
        )}
      </React.Suspense>
    </>
  )
}
