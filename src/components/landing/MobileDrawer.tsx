import { useEffect } from 'react'
import { X } from 'lucide-react'
import { cn } from '~/lib/utils'

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
            Tadulako <span>Cendekia</span>
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
          <a href="#program" onClick={onClose}>
            Program
          </a>
          <a href="#orang-tua" onClick={onClose}>
            Untuk Orang Tua
          </a>
          <a href="#cara-daftar" onClick={onClose}>
            Cara Daftar
          </a>
          <a href="#faq" onClick={onClose}>
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
          <a href="dashboard.html" className="btn btn-outline">
            Masuk
          </a>
        </div>
      </div>
    </>
  )
}
