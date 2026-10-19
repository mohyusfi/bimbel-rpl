import * as React from 'react'
import { Popover } from '@base-ui/react/popover'
import { Check, ChevronDown, Search, X } from 'lucide-react'
import { cn } from '../../lib/utils'

export interface SearchableSelectOption {
  value: string
  label: string
  sublabel?: string
  disabled?: boolean
}

export interface SearchableSelectProps {
  id?: string
  name?: string
  value: string
  onChange: (value: string) => void
  options: SearchableSelectOption[]
  placeholder?: string
  searchPlaceholder?: string
  emptyText?: string
  disabled?: boolean
  required?: boolean
  allowClear?: boolean
  clearText?: string
  className?: string
  triggerClassName?: string
}

export function SearchableSelect({
  id,
  name,
  value,
  onChange,
  options,
  placeholder = 'Pilih item...',
  searchPlaceholder = 'Cari...',
  emptyText = 'Tidak ada data ditemukan',
  disabled = false,
  required = false,
  allowClear = false,
  clearText = '— Kosongkan pilihan —',
  className,
  triggerClassName,
}: SearchableSelectProps) {
  const [open, setOpen] = React.useState(false)
  const [searchQuery, setSearchQuery] = React.useState('')
  const searchInputRef = React.useRef<HTMLInputElement>(null)

  const selectedOption = options.find((opt) => opt.value === value)

  const filteredOptions = React.useMemo(() => {
    if (!searchQuery.trim()) return options
    const query = searchQuery.toLowerCase().trim()
    return options.filter((opt) => {
      const matchLabel = opt.label.toLowerCase().includes(query)
      const matchSub = opt.sublabel?.toLowerCase().includes(query)
      return matchLabel || matchSub
    })
  }, [options, searchQuery])

  React.useEffect(() => {
    if (open) {
      setSearchQuery('')
      // Delay focus slightly so the popup DOM element is mounted
      const timer = setTimeout(() => {
        searchInputRef.current?.focus()
      }, 50)
      return () => clearTimeout(timer)
    }
  }, [open])

  return (
    <div className={cn('relative w-full', className)}>
      {/* Hidden input to support form validation if required */}
      {name && (
        <input
          type="hidden"
          name={name}
          value={value}
          required={required}
        />
      )}

      <Popover.Root open={open} onOpenChange={setOpen}>
        <Popover.Trigger
          render={
            <button
              id={id}
              type="button"
              disabled={disabled}
              className={cn(
                'w-full h-10 px-3 text-xs font-medium bg-[#F6F6F6] border border-[#D2D2D2] rounded-[10px] text-[#000000] focus:outline-none focus:border-[#000000] flex items-center justify-between gap-2 transition-colors cursor-pointer text-left',
                !selectedOption && 'text-[#888888] font-normal',
                disabled && 'opacity-50 cursor-not-allowed',
                open && 'border-[#000000] ring-1 ring-[#000000]',
                triggerClassName
              )}
            />
          }
        >
          <span className="truncate">
            {selectedOption ? (
              <>
                <span className="font-medium text-[#000000]">{selectedOption.label}</span>
                {selectedOption.sublabel && (
                  <span className="ml-1.5 text-[#555555] font-normal">
                    {selectedOption.sublabel}
                  </span>
                )}
              </>
            ) : (
              placeholder
            )}
          </span>
          <ChevronDown
            className={cn(
              'w-4 h-4 text-[#555555] shrink-0 transition-transform duration-200',
              open && 'rotate-180 text-[#000000]'
            )}
          />
        </Popover.Trigger>

        <Popover.Portal>
          <Popover.Positioner
            side="bottom"
            sideOffset={4}
            align="start"
            className="z-[70]"
          >
            <Popover.Popup className="w-[var(--anchor-width)] min-w-[220px] max-w-[90vw] bg-[#FFFFFF] border border-[#D2D2D2] rounded-[10px] shadow-xl overflow-hidden p-2 focus:outline-none">
              {/* Search Field */}
              <div className="relative mb-2">
                <Search className="w-3.5 h-3.5 text-[#555555] absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  ref={searchInputRef}
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={searchPlaceholder}
                  className="w-full h-8 pl-8 pr-7 text-xs bg-[#F6F6F6] border border-[#D2D2D2] rounded-[6px] text-[#000000] placeholder:text-[#888888] focus:outline-none focus:border-[#000000]"
                  onKeyDown={(e) => {
                    if (e.key === 'Escape') {
                      setOpen(false)
                    }
                  }}
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery('')}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-[#888888] hover:text-[#000000] p-0.5 rounded cursor-pointer"
                    aria-label="Bersihkan pencarian"
                  >
                    <X className="w-3 h-3" />
                  </button>
                )}
              </div>

              {/* Options List */}
              <div className="max-h-48 overflow-y-auto space-y-0.5 text-xs pr-0.5 scrollbar-thin">
                {allowClear && (
                  <button
                    type="button"
                    onClick={() => {
                      onChange('')
                      setOpen(false)
                    }}
                    className={cn(
                      'w-full text-left px-2.5 py-1.5 rounded-[6px] transition-colors flex items-center justify-between text-[#555555] hover:bg-[#F6F6F6] cursor-pointer italic text-xs',
                      !value && 'bg-[#F6F6F6] text-[#000000] font-medium not-italic'
                    )}
                  >
                    <span>{clearText}</span>
                    {!value && <Check className="w-3.5 h-3.5 text-[#000000] shrink-0" />}
                  </button>
                )}

                {filteredOptions.length === 0 ? (
                  <div className="py-4 text-center text-xs text-[#555555]">
                    {emptyText}
                  </div>
                ) : (
                  filteredOptions.map((opt) => {
                    const isSelected = opt.value === value
                    return (
                      <button
                        key={opt.value}
                        type="button"
                        disabled={opt.disabled}
                        onClick={() => {
                          onChange(opt.value)
                          setOpen(false)
                        }}
                        className={cn(
                          'w-full text-left px-2.5 py-2 rounded-[6px] transition-colors flex items-center justify-between gap-2 cursor-pointer',
                          isSelected
                            ? 'bg-[#000000] text-[#FFFFFF]'
                            : 'text-[#000000] hover:bg-[#F6F6F6]',
                          opt.disabled && 'opacity-50 cursor-not-allowed'
                        )}
                      >
                        <div className="truncate">
                          <span className="font-medium">{opt.label}</span>
                          {opt.sublabel && (
                            <span
                              className={cn(
                                'ml-1.5 text-[11px]',
                                isSelected ? 'text-[#D2D2D2]' : 'text-[#555555]'
                              )}
                            >
                              {opt.sublabel}
                            </span>
                          )}
                        </div>
                        {isSelected && (
                          <Check className="w-3.5 h-3.5 text-[#FFFFFF] shrink-0" />
                        )}
                      </button>
                    )
                  })
                )}
              </div>
            </Popover.Popup>
          </Popover.Positioner>
        </Popover.Portal>
      </Popover.Root>
    </div>
  )
}
