import * as React from 'react'
import { Toast } from '@base-ui/react/toast'
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react'
import { cn } from '../../lib/utils'

export type ToastType = 'success' | 'error' | 'info' | 'warning'

export interface ToastCustomData {
  type?: ToastType
}

export interface ToastOptions {
  description?: React.ReactNode
  timeout?: number
  priority?: 'low' | 'high'
}

export const toastManager = Toast.createToastManager<ToastCustomData>()

export const toast = {
  success: (title: string, options?: ToastOptions): string =>
    toastManager.add({
      title,
      description: options?.description,
      timeout: options?.timeout ?? 4000,
      priority: options?.priority ?? 'low',
      data: { type: 'success' },
    }),

  error: (title: string, options?: ToastOptions): string =>
    toastManager.add({
      title,
      description: options?.description,
      timeout: options?.timeout ?? 5000,
      priority: options?.priority ?? 'high',
      data: { type: 'error' },
    }),

  info: (title: string, options?: ToastOptions): string =>
    toastManager.add({
      title,
      description: options?.description,
      timeout: options?.timeout ?? 4000,
      priority: options?.priority ?? 'low',
      data: { type: 'info' },
    }),

  warning: (title: string, options?: ToastOptions): string =>
    toastManager.add({
      title,
      description: options?.description,
      timeout: options?.timeout ?? 4500,
      priority: options?.priority ?? 'low',
      data: { type: 'warning' },
    }),

  dismiss: (id?: string) => {
    toastManager.close(id)
  },
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  return <Toast.Provider toastManager={toastManager}>{children}</Toast.Provider>
}

export function Toaster() {
  const { toasts } = Toast.useToastManager<ToastCustomData>()

  return (
    <Toast.Portal>
      <Toast.Viewport
        className="fixed top-4 right-4 sm:top-5 sm:right-6 z-[100] flex flex-col gap-2.5 max-w-sm w-[calc(100vw-2rem)] pointer-events-none focus:outline-none"
        aria-label="Notifikasi Sistem"
      >
        {toasts.map((toastItem) => {
          const type = toastItem.data?.type ?? 'info'

          return (
            <Toast.Root
              key={toastItem.id}
              toast={toastItem}
              className={cn(
                'pointer-events-auto relative flex items-start gap-3 p-3.5 sm:p-4 bg-[#FFFFFF] border rounded-[10px] shadow-lg shadow-black/10 transition-all duration-200 ease-out',
                'data-starting-style:opacity-0 data-starting-style:-translate-y-2 data-ending-style:opacity-0 data-ending-style:-translate-y-2',
                type === 'success' && 'border-[#166534]',
                type === 'error' && 'border-[#901B14]',
                type === 'warning' && 'border-[#85600F]',
                type === 'info' && 'border-[#D2D2D2]'
              )}
            >
              <Toast.Content className="flex items-start gap-3 w-full">
                {/* Semantic Indicator Icon */}
                <div className="shrink-0 mt-0.5">
                  {type === 'success' && (
                    <CheckCircle2 className="w-4 h-4 text-[#166534]" />
                  )}
                  {type === 'error' && (
                    <AlertCircle className="w-4 h-4 text-[#901B14]" />
                  )}
                  {type === 'warning' && (
                    <AlertCircle className="w-4 h-4 text-[#85600F]" />
                  )}
                  {type === 'info' && (
                    <Info className="w-4 h-4 text-[#3A5A80]" />
                  )}
                </div>

                {/* Content details */}
                <div className="flex-1 min-w-0 space-y-0.5">
                  <Toast.Title className="text-xs font-semibold text-[#000000] block" />
                  {toastItem.description ? (
                    <Toast.Description className="text-xs text-[#555555] leading-relaxed block" />
                  ) : null}
                </div>

                {/* Dismiss Button */}
                <Toast.Close
                  className="shrink-0 -mr-1 -mt-1 p-1 text-[#888888] hover:text-[#000000] rounded-[4px] hover:bg-[#F6F6F6] transition-colors cursor-pointer"
                  aria-label="Tutup notifikasi"
                >
                  <X className="w-3.5 h-3.5" />
                </Toast.Close>
              </Toast.Content>
            </Toast.Root>
          )
        })}
      </Toast.Viewport>
    </Toast.Portal>
  )
}
