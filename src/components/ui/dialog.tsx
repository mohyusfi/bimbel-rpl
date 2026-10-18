import * as React from 'react'
import { Dialog } from '@base-ui/react/dialog'
import { X } from 'lucide-react'
import { cn } from '../../lib/utils'

export const DialogRoot = Dialog.Root
export const DialogTrigger = Dialog.Trigger
export const DialogPortal = Dialog.Portal
export const DialogClose = Dialog.Close

export function DialogOverlay({ className, ...props }: React.ComponentPropsWithoutRef<typeof Dialog.Backdrop>) {
  return (
    <Dialog.Backdrop
      className={cn(
        'fixed inset-0 z-50 bg-black/60 backdrop-blur-xs transition-opacity',
        className
      )}
      {...props}
    />
  )
}

export function DialogContent({
  className,
  children,
  ...props
}: React.ComponentPropsWithoutRef<typeof Dialog.Popup>) {
  return (
    <Dialog.Portal>
      <DialogOverlay />
      <Dialog.Viewport className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto">
        <Dialog.Popup
          className={cn(
            'relative w-full max-w-2xl bg-white border border-neutral-300 rounded-lg shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-150',
            className
          )}
          {...props}
        >
          {children}
        </Dialog.Popup>
      </Dialog.Viewport>
    </Dialog.Portal>
  )
}

export function DialogHeader({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn('flex items-start justify-between p-6 border-b border-neutral-200 bg-neutral-50/50', className)}
      {...props}
    />
  )
}

export function DialogTitle({ className, ...props }: React.ComponentPropsWithoutRef<typeof Dialog.Title>) {
  return (
    <Dialog.Title
      render={<h2 className={cn('text-xl font-bold font-archivo tracking-tight text-neutral-900', className)} />}
      {...props}
    />
  )
}

export function DialogDescription({ className, ...props }: React.ComponentPropsWithoutRef<typeof Dialog.Description>) {
  return (
    <Dialog.Description
      render={<p className={cn('text-xs text-neutral-500 font-instrument mt-1', className)} />}
      {...props}
    />
  )
}

export function DialogFooter({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn('flex items-center justify-end gap-3 p-4 border-t border-neutral-200 bg-neutral-50/80', className)}
      {...props}
    />
  )
}

export function DialogCloseButton({ className }: { className?: string }) {
  return (
    <Dialog.Close
      render={
        <button
          type="button"
          className={cn(
            'inline-flex items-center justify-center w-8 h-8 rounded text-neutral-500 hover:text-neutral-900 hover:bg-neutral-100 transition-colors',
            className
          )}
          aria-label="Tutup dialog"
        />
      }
    >
      <X className="w-4 h-4" />
    </Dialog.Close>
  )
}
