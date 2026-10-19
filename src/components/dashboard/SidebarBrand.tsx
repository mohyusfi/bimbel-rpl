import { Link } from '@tanstack/react-router'

interface SidebarBrandProps {
  role?: 'admin' | 'tutor' | 'student' | 'parent'
  portalName?: string
}

export function SidebarBrand({ role = 'admin', portalName }: SidebarBrandProps) {
  const homeHref = `/${role}` as any
  const displayPortalName =
    portalName ||
    (role === 'admin'
      ? 'Panel Administrasi'
      : role === 'tutor'
      ? 'Portal Pengajar'
      : role === 'student'
      ? 'Portal Siswa'
      : 'Portal Orang Tua')

  return (
    <Link
      to={homeHref}
      className="flex flex-col justify-center min-w-0 focus:outline-none group select-none transition-opacity"
      title={`Bimbel Tadulako Cendekia — ${displayPortalName}`}
    >
      <div className="flex items-baseline gap-1.5 leading-none">
        <span className="font-display font-black text-[18.5px] tracking-[-0.035em] text-[#000000] group-hover:text-[#CB2957] transition-colors">
          Tadulako
        </span>
        <span className="font-display font-medium text-[18.5px] tracking-[-0.02em] text-[#CB2957]">
          Cendekia
        </span>
      </div>
      <div className="text-[10px] font-mono font-semibold tracking-[0.16em] uppercase text-[#666666] mt-1.5 leading-none truncate">
        {displayPortalName}
      </div>
    </Link>
  )
}
