import * as React from 'react'
import { Popover } from '@base-ui/react/popover'
import { Check, ChevronDown, X } from 'lucide-react'
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
  size?: 'sm' | 'md'
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
  size = 'sm',
}: SearchableSelectProps) {
  const [open, setOpen] = React.useState(false)
  const [searchQuery, setSearchQuery] = React.useState('')
  const [isTyping, setIsTyping] = React.useState(false)
  const inputRef = React.useRef<HTMLInputElement>(null)

  const selectedOption = options.find((opt) => opt.value === value)

  const filteredOptions = React.useMemo(() => {
    if (!isTyping || !searchQuery.trim()) return options
    const query = searchQuery.toLowerCase().trim()
    return options.filter((opt) => {
      const matchLabel = opt.label.toLowerCase().includes(query)
      const matchSub = opt.sublabel?.toLowerCase().includes(query)
      return matchLabel || matchSub
    })
  }, [options, searchQuery, isTyping])

  const handleOpenChange = (nextOpen: boolean) => {
    setOpen(nextOpen)
    if (!nextOpen) {
      setIsTyping(false)
      setSearchQuery('')
    }
  }

  const handleSelect = (val: string) => {
    onChange(val)
    setIsTyping(false)
    setSearchQuery('')
    setOpen(false)
  }

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation()
    onChange('')
    setIsTyping(false)
    setSearchQuery('')
    setOpen(false)
    inputRef.current?.focus()
  }

  const inputValue = isTyping
    ? searchQuery
    : selectedOption
      ? selectedOption.label
      : ''

  const isMedium = size === 'md'

  return (
    <div className={cn('relative w-full', className)}>
      {/* Hidden input to support native form validation if required */}
      {name && (
        <input
          type="hidden"
          name={name}
          value={value}
          required={required}
        />
      )}

      <Popover.Root open={open} onOpenChange={handleOpenChange}>
        <Popover.Trigger
          nativeButton={false}
          render={
            <div
              className={cn(
                'w-full font-medium bg-[#F6F6F6] border border-[#D2D2D2] rounded-[10px] text-[#000000] focus-within:border-[#000000] focus-within:ring-1 focus-within:ring-[#000000] focus-within:bg-[#FFFFFF] flex items-center justify-between gap-2 transition-all relative cursor-text',
                isMedium ? 'h-11 px-3.5 text-sm' : 'h-10 px-3 text-xs',
                disabled && 'opacity-50 cursor-not-allowed pointer-events-none',
                open && 'border-[#000000] ring-1 ring-[#000000] bg-[#FFFFFF]',
                triggerClassName
              )}
            />
          }
        >
          {/* Main inline text input directly in the form field */}
          <input
            ref={inputRef}
            id={id}
            type="text"
            disabled={disabled}
            value={inputValue}
            onChange={(e) => {
              setSearchQuery(e.target.value)
              setIsTyping(true)
              if (!open) setOpen(true)
            }}
            onClick={(e) => {
              e.stopPropagation()
              if (!open) {
                setOpen(true)
              }
            }}
            onFocus={() => {
              setIsTyping(true)
              setSearchQuery(selectedOption ? selectedOption.label : '')
              setOpen(true)
            }}
            onKeyDown={(e) => {
              if (e.key === 'Escape') {
                setOpen(false)
                setIsTyping(false)
                setSearchQuery('')
              } else if (e.key === 'Enter') {
                e.preventDefault()
                if (filteredOptions.length > 0) {
                  handleSelect(filteredOptions[0].value)
                }
              }
            }}
            placeholder={placeholder}
            className={cn(
              'w-full bg-transparent border-none outline-none font-medium text-[#000000] placeholder:text-[#888888] truncate',
              isMedium ? 'text-sm' : 'text-xs'
            )}
          />

          {/* Action icons: Clear button & Dropdown toggle */}
          <div className="flex items-center gap-1 shrink-0">
            {value && allowClear && (
              <button
                type="button"
                tabIndex={-1}
                onClick={handleClear}
                className="text-[#888888] hover:text-[#000000] p-1 rounded cursor-pointer transition-colors"
                aria-label="Kosongkan pilihan"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}

            <button
              type="button"
              tabIndex={-1}
              disabled={disabled}
              onClick={(e) => {
                e.stopPropagation()
                setOpen((prev) => !prev)
                if (!open) {
                  inputRef.current?.focus()
                }
              }}
              className="text-[#555555] hover:text-[#000000] p-1 rounded cursor-pointer transition-colors"
              aria-label={open ? 'Tutup daftar pilihan' : 'Buka daftar pilihan'}
            >
              <ChevronDown
                className={cn(
                  'w-4 h-4 transition-transform duration-200',
                  open && 'rotate-180 text-[#000000]'
                )}
              />
            </button>
          </div>
        </Popover.Trigger>

        <Popover.Portal>
          <Popover.Positioner
            side="bottom"
            sideOffset={4}
            align="start"
            className="z-[70]"
          >
            <Popover.Popup className="w-[var(--anchor-width)] min-w-[220px] max-w-[90vw] bg-[#FFFFFF] border border-[#D2D2D2] rounded-[10px] shadow-xl overflow-hidden p-1.5 focus:outline-none">
              {/* Clean Options List — No duplicate search box inside dropdown */}
              <div className="max-h-56 overflow-y-auto space-y-0.5 text-xs pr-0.5 scrollbar-thin">
                {allowClear && (
                  <button
                    type="button"
                    onMouseDown={(e) => {
                      e.preventDefault()
                      handleSelect('')
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
                        onMouseDown={(e) => {
                          e.preventDefault()
                          handleSelect(opt.value)
                        }}
                        className={cn(
                          'w-full text-left px-2.5 rounded-[6px] transition-colors flex items-center justify-between gap-2 cursor-pointer',
                          isMedium ? 'py-2.5 text-sm' : 'py-2 text-xs',
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
                                'ml-1.5',
                                isMedium ? 'text-xs' : 'text-[11px]',
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
