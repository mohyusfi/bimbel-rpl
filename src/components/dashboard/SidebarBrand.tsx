import { Link } from '@tanstack/react-router'

export function SidebarBrand() {
  return (
    <Link
      to="/admin"
      className="flex flex-col justify-center min-w-0 focus:outline-none group select-none transition-opacity"
      title="Bimbel Tadulako Cendekia — Panel Administrasi"
    >
      <div className="flex items-baseline gap-1.5 leading-none">
        <span className="font-display font-black text-[18.5px] tracking-[-0.035em] text-[#000000] group-hover:text-[#CB2957] transition-colors">
          Tadulako
        </span>
        <span className="font-display font-medium text-[18.5px] tracking-[-0.02em] text-[#CB2957]">
          Cendekia
        </span>
      </div>
      <div className="text-[10px] font-mono font-semibold tracking-[0.16em] uppercase text-[#666666] mt-1.5 leading-none">
        Panel Administrasi
      </div>
    </Link>
  )
}
