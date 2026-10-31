import * as React from 'react'
import { Megaphone, Pin } from 'lucide-react'
import type { Announcement } from '~/lib/admin-store'
import { cn } from '~/lib/utils'

interface PortalAnnouncementsWidgetProps {
  announcements: Announcement[]
  maxItems?: number
}

export function PortalAnnouncementsWidget({
  announcements,
  maxItems = 4,
}: PortalAnnouncementsWidgetProps) {
  if (!announcements || announcements.length === 0) return null

  const items = announcements.slice(0, maxItems)

  return (
    <div className="bg-[#FFFFFF] border border-[#D2D2D2] rounded-[14px] p-5 space-y-3.5">
      <div className="flex items-center justify-between pb-3 border-b border-[#D2D2D2]">
        <div className="flex items-center gap-2">
          <Megaphone className="w-4 h-4 text-[#CB2957]" />
          <h2 className="font-display font-bold text-base text-[#000000]">
            Pengumuman Resmi Pintar Yuk
          </h2>
        </div>
        <span className="text-xs font-medium text-[#555555]">
          {announcements.length} Pengumuman Aktif
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
        {items.map((ann) => (
          <div
            key={ann.id}
            className={cn(
              'p-4 bg-[#F6F6F6] rounded-[10px] border border-[#D2D2D2] space-y-2 flex flex-col justify-between',
              ann.isPinned && 'border-l-4 border-l-[#CB2957]'
            )}
          >
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                {ann.isPinned && (
                  <span className="inline-flex items-center gap-1 text-[#A81E46] text-[11px] font-bold uppercase tracking-wider">
                    <Pin className="w-3 h-3 fill-current" />
                    <span>Disematkan</span>
                  </span>
                )}
                <span className="text-[11px] text-[#555555]">
                  Untuk: {ann.targetAudience}
                </span>
              </div>
              <span className="text-[11px] text-[#555555] tabular-nums">
                {ann.publishedDate}
              </span>
            </div>

            <div>
              <h3 className="font-display font-bold text-sm text-[#000000] leading-snug">
                {ann.title}
              </h3>
              <p className="text-xs text-[#555555] mt-1.5 leading-relaxed line-clamp-3">
                {ann.content}
              </p>
            </div>

            <div className="pt-2 text-[11px] text-[#555555] border-t border-[#D2D2D2]/60">
              Diterbitkan oleh: <strong className="text-[#000000]">{ann.author}</strong>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
