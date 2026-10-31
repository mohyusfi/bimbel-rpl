import { useEffect } from 'react'
import { Link } from '@tanstack/react-router'
import { X } from 'lucide-react'
import { cn } from '~/lib/utils'
import { LEARNING_METHODS } from '~/lib/learning-methods'

interface MobileDrawerProps {
  isOpen: boolean
  onClose: () => void
  onOpenRegister: () => void
}

export function MobileDrawer({
  isOpen,
  onClose,
  onOpenRegister,
}: MobileDrawerProps) {
  useEffect(() => {
    if (!isOpen) return

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose()
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, onClose])

  return (
    <>
      <div
        id="mobileDrawerOverlay"
        className={cn('mobile-drawer-overlay', isOpen && 'active')}
        onClick={onClose}
      />
      <div
        id="mobileDrawer"
        className={cn('mobile-drawer', isOpen && 'active')}
        role="dialog"
        aria-label="Menu"
        aria-modal={isOpen}
      >
        <div className="mobile-drawer-header">
          <span className="lp-logo">
            Pintar <span>Yuk</span>
          </span>
          <button
            type="button"
            className="mobile-drawer-close"
            onClick={onClose}
            aria-label="Tutup menu"
          >
            <X className="lucide" />
          </button>
        </div>
        <nav className="mobile-drawer-nav" aria-label="Navigasi utama">
          <div className="pt-2 pb-1 border-b border-[#D2D2D2]">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#777777] block mb-2">
              Metode Belajar
            </span>
            <div className="space-y-1.5 pl-2">
              {LEARNING_METHODS.map((m) => (
                <Link
                  key={m.slug}
                  to={`/metode/${m.slug}` as any}
                  onClick={onClose}
                  className="block text-sm font-semibold text-[#000000] hover:text-[#CB2957] py-1"
                >
                  <span className="text-xs font-mono font-bold text-[#CB2957] mr-2">{m.number}</span>
                  {m.shortName}
                </Link>
              ))}
            </div>
          </div>

          <a href="/#program" onClick={onClose}>
            Program
          </a>
          <a href="/#orang-tua" onClick={onClose}>
            Untuk Orang Tua
          </a>
          <a href="/#cara-daftar" onClick={onClose}>
            Cara Daftar
          </a>
          <a href="/#faq" onClick={onClose}>
            FAQ
          </a>
        </nav>
        <div className="mobile-drawer-actions">
          <button
            type="button"
            className="btn btn-primary"
            onClick={() => {
              onClose()
              onOpenRegister()
            }}
          >
            Daftar
          </button>
          <Link to="/masuk" className="btn btn-outline" onClick={onClose}>
            Masuk
          </Link>
        </div>
      </div>
    </>
  )
}
