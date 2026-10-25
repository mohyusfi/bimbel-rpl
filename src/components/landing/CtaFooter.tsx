import { Link } from '@tanstack/react-router'
import { ArrowRight } from 'lucide-react'
import { motion } from 'motion/react'
import { fadeInUp, viewportConfig } from '~/lib/motion'

interface CtaFooterProps {
  onOpenRegister: () => void
}

const PROGRAM_LINKS = [
  { label: 'SD Cendekia', href: '#program' },
  { label: 'SMP Prestasi', href: '#program' },
  { label: 'SMA Sukses', href: '#program' },
  { label: 'Intensif UTBK-SNBT', href: '#program' },
] as const

const LOGIN_LINKS = [
  { label: 'Siswa', to: '/student' },
  { label: 'Orang tua', to: '/parent' },
  { label: 'Tutor', to: '/tutor' },
  { label: 'Admin', to: '/admin' },
] as const

export function CtaFooter({ onOpenRegister }: CtaFooterProps) {
  return (
    <div className="lp-end">
      <motion.section
        className="container lp-cta"
        variants={fadeInUp}
        initial="hidden"
        whileInView="visible"
        viewport={viewportConfig}
      >
        <h2 className="lp-cta-title">
          Coba satu kelas dulu. <em>Gratis.</em>
        </h2>
        <div className="lp-cta-bottom">
          <p>
            Daftar dalam beberapa menit. Admin kami akan menghubungi lewat WhatsApp untuk mengatur jadwal kelas pertama.
          </p>
          <div className="lp-cta-actions">
            <button
              type="button"
              className="btn btn-accent btn-lg"
              onClick={onOpenRegister}
            >
              Daftar sekarang <ArrowRight className="lucide" />
            </button>
            <a
              href="https://wa.me/6282199887766"
              className="btn btn-ghost-light btn-lg"
              target="_blank"
              rel="noopener noreferrer"
            >
              Tanya lewat WhatsApp
            </a>
          </div>
        </div>
      </motion.section>

      <footer className="container lp-footer">
        <div className="lp-footer-grid">
          <div>
            <Link to="/" className="lp-logo">
              Tadulako <span>Cendekia</span>
            </Link>
            <p>
              Bimbingan belajar tatap muka untuk SD, SMP, SMA, dan UTBK di Kota Palu, Sulawesi Tengah.
            </p>
          </div>

          <nav aria-label="Program">
            <h2>Program</h2>
            <ul>
              {PROGRAM_LINKS.map((link) => (
                <li key={link.label}>
                  <a href={link.href}>{link.label}</a>
                </li>
              ))}
            </ul>
          </nav>

          <nav aria-label="Masuk portal">
            <h2>Masuk</h2>
            <ul>
              {LOGIN_LINKS.map((link) => (
                <li key={link.label}>
                  <Link to={link.to as any}>{link.label}</Link>
                </li>
              ))}
            </ul>
          </nav>

          <div>
            <h2>Kontak</h2>
            <address>
              Jl. Soekarno-Hatta, area Kampus Bumi Tadulako
              <br />
              Kota Palu, Sulawesi Tengah 94118
              <br />
              WhatsApp:{' '}
              <a
                href="https://wa.me/6282199887766"
                target="_blank"
                rel="noopener noreferrer"
              >
                0821-9988-7766
              </a>
            </address>
          </div>
        </div>

        <div className="lp-footer-bottom">
          © 2026 Bimbel Tadulako Cendekia, Kota Palu.
        </div>
      </footer>
    </div>
  )
}
