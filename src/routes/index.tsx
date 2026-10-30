import { createFileRoute } from '@tanstack/react-router'
import * as React from 'react'
import { Header } from '~/components/landing/Header'
import { Hero } from '~/components/landing/Hero'
import { LearningMethodsSection } from '~/components/landing/LearningMethodsSection'
import { ProgramsSection } from '~/components/landing/ProgramsSection'
import { ParentsSection } from '~/components/landing/ParentsSection'
import { StepsSection } from '~/components/landing/StepsSection'
import { StoriesMarqueeSection } from '~/components/landing/StoriesMarqueeSection'
import { FaqSection } from '~/components/landing/FaqSection'
import { CtaFooter } from '~/components/landing/CtaFooter'
import { MobileDrawer } from '~/components/landing/MobileDrawer'

const RegisterModal = React.lazy(() =>
  import('~/components/landing/RegisterModal').then((mod) => ({
    default: mod.RegisterModal,
  }))
)

interface LandingSearchParams {
  daftar?: string
}

export const Route = createFileRoute('/')({
  validateSearch: (search: Record<string, unknown>): LandingSearchParams => {
    return {
      daftar: typeof search.daftar === 'string' ? search.daftar : undefined,
    }
  },
  component: LandingPage,
})

function LandingPage() {
  const search = Route.useSearch()
  const [isRegisterOpen, setIsRegisterOpen] = React.useState(false)
  const [selectedPackage, setSelectedPackage] = React.useState<string>('UTBK')
  const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false)

  React.useEffect(() => {
    if (search.daftar) {
      setSelectedPackage(search.daftar.toUpperCase())
      setIsRegisterOpen(true)
    }
  }, [search.daftar])

  const handleOpenRegister = () => {
    setIsRegisterOpen(true)
  }

  const handleSelectProgramAndRegister = (pkgCode: string) => {
    setSelectedPackage(pkgCode)
    setIsRegisterOpen(true)
  }

  const handleToggleMobileMenu = () => {
    setIsMobileMenuOpen((prev) => !prev)
  }

  const handleCloseMobileMenu = () => {
    setIsMobileMenuOpen(false)
  }

  return (
    <>
      <Header
        onOpenRegister={handleOpenRegister}
        onToggleMobileMenu={handleToggleMobileMenu}
      />
      <main>
        <Hero
          onOpenRegister={handleOpenRegister}
          onSelectProgram={handleSelectProgramAndRegister}
        />
        <LearningMethodsSection />
        <ProgramsSection onSelectProgram={handleSelectProgramAndRegister} />
        <ParentsSection />
        <StepsSection />
        <StoriesMarqueeSection />
        <FaqSection />
      </main>
      <CtaFooter onOpenRegister={handleOpenRegister} />

      <MobileDrawer
        isOpen={isMobileMenuOpen}
        onClose={handleCloseMobileMenu}
        onOpenRegister={handleOpenRegister}
      />

      <React.Suspense fallback={null}>
        {isRegisterOpen && (
          <RegisterModal
            isOpen={isRegisterOpen}
            onClose={() => setIsRegisterOpen(false)}
            defaultPackage={selectedPackage}
          />
        )}
      </React.Suspense>
    </>
  )
}
