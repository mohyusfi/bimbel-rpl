import * as React from 'react'
import { Link } from '@tanstack/react-router'
import { cn } from '~/lib/utils'
import { Skeleton } from '~/components/ui/skeleton'

export interface SummaryMetricCardProps {
  title: string
  value: string | number
  unit?: string
  description?: string
  footer?: React.ReactNode
  icon: React.ComponentType<{ className?: string }>
  variant?: 'default' | 'urgent'
  isSelected?: boolean
  onClick?: () => void
  to?: string
  className?: string
  isLoading?: boolean
}

export function SummaryMetricCard({
  title,
  value,
  unit,
  description,
  footer,
  icon: Icon,
  variant = 'default',
  isSelected = false,
  onClick,
  to,
  className,
  isLoading = false,
}: SummaryMetricCardProps) {
  const isUrgent = variant === 'urgent'

  const commonClasses = cn(
    'bg-[#FFFFFF] text-[#000000] p-4 sm:p-5 flex flex-col justify-between transition-all select-none group rounded-[14px]',
    isSelected
      ? 'border-2 border-[#000000]'
      : 'border border-[#D2D2D2] hover:border-[#000000]',
    className
  )

  if (isLoading) {
    return (
      <div
        data-testid="summary-metric-card-skeleton"
        className={cn(commonClasses, 'pointer-events-none')}
      >
        <div className="flex items-center justify-between gap-2">
          <Skeleton className="h-4 w-28" />
          <Skeleton className="w-8 h-8 sm:w-9 sm:h-9 rounded-full shrink-0" />
        </div>

        <div className="mt-3 space-y-2">
          <Skeleton className="h-8 w-24" />
          {description && <Skeleton className="h-3.5 w-3/4 mt-1.5" />}
        </div>

        {footer && (
          <div className="mt-3 pt-2.5 border-t border-[#D2D2D2]/60">
            <Skeleton className="h-3 w-20" />
          </div>
        )}
      </div>
    )
  }

  const content = (
    <>
      {/* Top Header: Title & Consistent Icon Badge */}
      <div className="flex items-center justify-between gap-2">
        <span className="text-sm font-semibold text-[#292524] group-hover:text-[#000000] transition-colors">
          {title}
        </span>

        <div className="flex items-center gap-1.5 shrink-0">
          <div
            className={cn(
              'w-8 h-8 sm:w-9 sm:h-9 rounded-full flex items-center justify-center transition-colors shrink-0',
              isSelected
                ? 'bg-[#CB2957] text-[#FFFFFF] border border-[#CB2957]'
                : isUrgent
                  ? 'bg-[#FFFFFF] text-[#CB2957] border border-[#CB2957]/40 group-hover:border-[#CB2957]'
                  : 'bg-[#FFFFFF] text-[#292524] border border-[#D2D2D2] group-hover:border-[#000000]'
            )}
          >
            <Icon className="w-4 h-4 shrink-0" />
          </div>
        </div>
      </div>

      {/* Main Metric Value & Descriptive Explanation */}
      <div className="mt-3">
        <div className="flex items-baseline gap-1.5">
          <span className="font-display font-extrabold text-[26px] sm:text-[30px] text-[#000000] tabular-nums tracking-tight leading-none">
            {value}
          </span>
          {unit && (
            <span className="text-xs font-semibold text-[#555555]">
              {unit}
            </span>
          )}
        </div>

        {description && (
          <p className="text-xs text-[#555555] mt-1.5 leading-relaxed line-clamp-2">
            {description}
          </p>
        )}
      </div>

      {/* Bottom Status / Trend Context */}
      {footer && (
        <div className="mt-3 pt-2.5 border-t border-[#D2D2D2]/60 text-xs text-[#555555]">
          {footer}
        </div>
      )}
    </>
  )

  if (to) {
    return (
      <Link to={to} className={cn(commonClasses, 'cursor-pointer')}>
        {content}
      </Link>
    )
  }

  if (onClick) {
    return (
      <button
        type="button"
        onClick={onClick}
        className={cn(commonClasses, 'text-left cursor-pointer')}
      >
        {content}
      </button>
    )
  }

  return <div className={commonClasses}>{content}</div>
}
