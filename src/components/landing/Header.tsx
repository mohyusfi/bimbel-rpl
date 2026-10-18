import { Link } from '@tanstack/react-router'
import { Menu } from 'lucide-react'

interface HeaderProps {
  onOpenRegister: () => void
  onToggleMobileMenu: () => void
}

export function Header({ onOpenRegister, onToggleMobileMenu }: HeaderProps) {
  return (
    <header className="lp-header">
      <div className="container lp-header-inner">
        <a href="#beranda" className="lp-logo">
          Tadulako <span>Cendekia</span>
        </a>

        <nav className="lp-nav" aria-label="Navigasi utama">
          <a href="#program">Program</a>
          <a href="#orang-tua">Untuk Orang Tua</a>
          <a href="#cara-daftar">Cara Daftar</a>
          <a href="#faq">FAQ</a>
        </nav>

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
