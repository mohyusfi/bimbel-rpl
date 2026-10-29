import * as React from 'react'
import { Link, useRouterState } from '@tanstack/react-router'
import { Menu, ChevronDown } from 'lucide-react'
import { LEARNING_METHODS } from '~/lib/learning-methods'

interface HeaderProps {
  onOpenRegister: () => void
  onToggleMobileMenu: () => void
}

export function Header({ onOpenRegister, onToggleMobileMenu }: HeaderProps) {
  const [isDropdownOpen, setIsDropdownOpen] = React.useState(false)
  const dropdownRef = React.useRef<HTMLDivElement | null>(null)
  const pathname = useRouterState({ select: (s) => s.location.pathname })
  const isHome = pathname === '/'

  // Tutup dropdown saat klik di luar atau tekan Escape
  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false)
      }
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsDropdownOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [])

  return (
    <header className="lp-header">
      <div className="container lp-header-inner">
        <Link to="/" className="lp-logo">
          Anemone <span>Cendekia</span>
        </Link>

        <nav className="lp-nav" aria-label="Navigasi utama">
          {/* Dropdown Metode Belajar */}
          <div className="lp-nav-dropdown-wrap" ref={dropdownRef}>
            <button
              type="button"
              className="lp-nav-dropdown-btn"
              onClick={() => setIsDropdownOpen((prev) => !prev)}
              aria-expanded={isDropdownOpen}
              aria-haspopup="true"
            >
              <span>Metode Belajar</span>
              <ChevronDown
                className="w-3.5 h-3.5 transition-transform duration-200"
                style={{ transform: isDropdownOpen ? 'rotate(180deg)' : 'none' }}
              />
            </button>

            {isDropdownOpen && (
              <ul className="lp-nav-dropdown-menu" role="menu">
                {LEARNING_METHODS.map((method) => (
                  <li key={method.slug} role="none">
                    <Link
                      to={`/metode/${method.slug}` as any}
                      className="lp-nav-dropdown-item"
                      role="menuitem"
                      onClick={() => setIsDropdownOpen(false)}
                    >
                      <div className="flex items-center">
                        <span className="lp-nav-dropdown-item-num">{method.number}</span>
                        <span className="lp-nav-dropdown-item-title">{method.shortName}</span>
                      </div>
                      <p className="lp-nav-dropdown-item-desc">{method.tagline}</p>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <a href={isHome ? '#program' : '/#program'}>Program</a>
          <a href={isHome ? '#orang-tua' : '/#orang-tua'}>Untuk Orang Tua</a>
          <a href={isHome ? '#cara-daftar' : '/#cara-daftar'}>Cara Daftar</a>
          <a href={isHome ? '#faq' : '/#faq'}>FAQ</a>
        </nav>

        <div className="lp-header-actions">
          <Link to="/masuk" className="lp-header-login">
            Masuk
          </Link>
          <button
            type="button"
            className="btn btn-primary btn-sm"
            onClick={onOpenRegister}
          >
            Daftar
          </button>
        </div>

        <button
          type="button"
          className="mobile-menu-btn"
          id="mobileMenuBtn"
          onClick={onToggleMobileMenu}
          aria-label="Buka menu"
        >
          <Menu className="lucide" />
        </button>
      </div>
    </header>
  )
}
