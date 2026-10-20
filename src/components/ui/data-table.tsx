import * as React from 'react'
import {
  type ColumnDef,
  type SortingState,
  type ColumnFiltersState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from '@tanstack/react-table'
import {
  Search,
  ChevronDown,
  ChevronUp,
  ChevronsUpDown,
  ChevronLeft,
  ChevronRight,
  X,
} from 'lucide-react'
import { cn } from '~/lib/utils'

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[]
  data: TData[]
  searchPlaceholder?: string
  searchColumn?: string
  filterSlot?: React.ReactNode
  emptyState?: React.ReactNode
  renderMobileCard?: (row: TData) => React.ReactNode
  pageSize?: number
  className?: string
  totalCount?: number
  counterLabel?: string
}

export function DataTable<TData, TValue>({
  columns,
  data,
  searchPlaceholder = 'Cari data...',
  filterSlot,
  emptyState,
  renderMobileCard,
  pageSize = 10,
  className,
  totalCount,
  counterLabel,
}: DataTableProps<TData, TValue>) {
  const [sorting, setSorting] = React.useState<SortingState>([])
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>(
    []
  )
  const [globalFilter, setGlobalFilter] = React.useState('')

  const table = useReactTable({
    data,
    columns,
    state: {
      sorting,
      columnFilters,
      globalFilter,
    },
    globalFilterFn: (row, _columnId, filterValue) => {
      const query = String(filterValue ?? '')
        .toLowerCase()
        .trim()
      if (!query) return true

      const original = row.original as Record<string, unknown>
      return Object.values(original).some((val) => {
        if (val == null) return false
        if (Array.isArray(val)) {
          return val.join(' ').toLowerCase().includes(query)
        }
        if (typeof val === 'string' || typeof val === 'number') {
          return String(val).toLowerCase().includes(query)
        }
        return false
      })
    },
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onGlobalFilterChange: setGlobalFilter,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    initialState: {
      pagination: {
        pageSize,
      },
    },
  })

  const totalRows = table.getFilteredRowModel().rows.length
  const pageIndex = table.getState().pagination.pageIndex
  const startRow = totalRows === 0 ? 0 : pageIndex * pageSize + 1
  const endRow = Math.min((pageIndex + 1) * pageSize, totalRows)

  return (
    <div
      className={cn(
        'w-full bg-[#FFFFFF] border border-[#D2D2D2] rounded-[14px] overflow-hidden font-sans',
        className
      )}
    >
      {/* Tier 1: Search Toolbar & Live Counter */}
      <div
        className={cn(
          'px-4 sm:px-5 py-3 sm:py-3.5 bg-[#FFFFFF] flex flex-col sm:flex-row sm:items-center justify-between gap-3',
          !filterSlot && 'border-b border-[#D2D2D2]'
        )}
      >
        <div className="relative w-full sm:max-w-sm">
          <Search
            className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#555555] pointer-events-none"
            aria-hidden="true"
          />
          <input
            type="text"
            value={globalFilter}
            onChange={(e) => setGlobalFilter(e.target.value)}
            placeholder={searchPlaceholder}
            className="w-full h-10 pl-10 pr-8 text-xs font-medium bg-[#F6F6F6] focus:bg-[#FFFFFF] text-[#000000] border border-[#D2D2D2] rounded-[10px] focus:outline-none focus:border-[#000000] transition-colors placeholder:text-[#555555]"
          />
          {globalFilter && (
            <button
              type="button"
              onClick={() => setGlobalFilter('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-[#555555] hover:text-[#000000] rounded-[4px] cursor-pointer"
              aria-label="Bersihkan pencarian"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        <div className="flex items-center gap-2 text-xs text-[#555555] self-start sm:self-center shrink-0">
          <span>
            Menampilkan{' '}
            <strong className="font-semibold text-[#000000] tabular-nums">
              {totalRows}
            </strong>{' '}
            {counterLabel ?? 'baris data'}
            {totalCount != null && totalCount !== totalRows && (
              <span className="text-[#888888]"> (dari total {totalCount})</span>
            )}
          </span>
        </div>
      </div>

      {/* Tier 2: Filter Section (Visible when filterSlot is provided) */}
      {filterSlot && (
        <div className="border-t border-b border-[#D2D2D2]/60 bg-[#FAFAFA] p-3 sm:p-3.5">
          {filterSlot}
        </div>
      )}

      {/* Mobile Card List View (if provided) */}
      {renderMobileCard && (
        <div className="md:hidden divide-y divide-[#D2D2D2]">
          {table.getRowModel().rows.length > 0 ? (
            table.getRowModel().rows.map((row) => (
              <div
                key={row.id}
                className="p-4 hover:bg-[#F6F6F6]/60 transition-colors"
              >
                {renderMobileCard(row.original)}
              </div>
            ))
          ) : (
            <div className="p-8 text-center text-xs text-[#555555]">
              {emptyState || 'Tidak ada data yang cocok'}
            </div>
          )}
        </div>
      )}

      {/* Responsive Table Container (Desktop / Default) */}
      <div className={cn('overflow-x-auto', renderMobileCard && 'hidden md:block')}>
        <table className="w-full text-left border-collapse font-sans">
          <thead>
            {table.getHeaderGroups().map((headerGroup) => (
              <tr
                key={headerGroup.id}
                className="border-b border-[#D2D2D2] bg-[#F6F6F6]"
              >
                {headerGroup.headers.map((header) => {
                  const canSort = header.column.getCanSort()
                  const isSorted = header.column.getIsSorted()

                  return (
                    <th
                      key={header.id}
                      scope="col"
                      className={cn(
                        'px-5 py-3.5 text-xs font-semibold text-[#555555] select-none whitespace-nowrap transition-colors tracking-tight',
                        canSort && 'cursor-pointer hover:text-[#000000] hover:bg-[#E3E3E3]/50'
                      )}
                      onClick={header.column.getToggleSortingHandler()}
                    >
                      <div className="inline-flex items-center gap-1.5">
                        {header.isPlaceholder
                          ? null
                          : flexRender(
                              header.column.columnDef.header,
                              header.getContext()
                            )}
                        {canSort && (
                          <span className="text-[#555555]">
                            {isSorted === 'asc' ? (
                              <ChevronUp className="w-3.5 h-3.5 text-[#000000]" />
                            ) : isSorted === 'desc' ? (
                              <ChevronDown className="w-3.5 h-3.5 text-[#000000]" />
                            ) : (
                              <ChevronsUpDown className="w-3.5 h-3.5 opacity-45" />
                            )}
                          </span>
                        )}
                      </div>
                    </th>
                  )
                })}
              </tr>
            ))}
          </thead>

          <tbody className="divide-y divide-[#D2D2D2]">
            {table.getRowModel().rows.length > 0 ? (
              table.getRowModel().rows.map((row) => (
                <tr
                  key={row.id}
                  className="hover:bg-[#F6F6F6]/65 transition-colors"
                >
                  {row.getVisibleCells().map((cell) => (
                    <td
                      key={cell.id}
                      className="px-5 py-4.5 text-sm text-[#292524] align-middle"
                    >
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
                    </td>
                  ))}
                </tr>
              ))
            ) : (
              <tr>
                <td
                  colSpan={columns.length}
                  className="px-5 py-14 text-center text-[#555555]"
                >
                  {emptyState || (
                    <div className="space-y-1.5 max-w-sm mx-auto">
                      <p className="text-sm font-semibold text-[#000000]">
                        Tidak ada data yang cocok
                      </p>
                      <p className="text-xs text-[#555555] leading-relaxed">
                        Coba gunakan kata kunci pencarian lain atau atur ulang filter di atas.
                      </p>
                      {globalFilter && (
                        <button
                          type="button"
                          onClick={() => setGlobalFilter('')}
                          className="mt-2 inline-flex items-center px-3 py-1.5 text-xs font-semibold text-[#000000] bg-[#F6F6F6] border border-[#D2D2D2] rounded-[8px] hover:bg-[#E3E3E3] transition-colors"
                        >
                          Reset pencarian
                        </button>
                      )}
                    </div>
                  )}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Table Footer / Pagination */}
      <div className="px-5 py-3.5 border-t border-[#D2D2D2] flex flex-col sm:flex-row items-center justify-between gap-3 bg-[#F6F6F6]/50">
        <div className="text-xs text-[#555555]">
          Menampilkan{' '}
          <span className="tabular-nums font-semibold text-[#000000]">
            {startRow}–{endRow}
          </span>{' '}
          dari{' '}
          <span className="tabular-nums font-semibold text-[#000000]">
            {totalRows}
          </span>{' '}
          baris data
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
            className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-[#000000] bg-[#FFFFFF] border border-[#D2D2D2] rounded-[8px] hover:bg-[#F6F6F6] disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
            <span>Sebelumnya</span>
          </button>

          <span className="text-xs font-medium text-[#555555] px-2 tabular-nums">
            Halaman{' '}
            <strong className="text-[#000000]">
              {table.getState().pagination.pageIndex + 1}
            </strong>{' '}
            / {Math.max(1, table.getPageCount())}
          </span>

          <button
            type="button"
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
            className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-[#000000] bg-[#FFFFFF] border border-[#D2D2D2] rounded-[8px] hover:bg-[#F6F6F6] disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
          >
            <span>Berikutnya</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  )
}
