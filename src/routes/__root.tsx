import {
  HeadContent,
  Outlet,
  Scripts,
  createRootRoute,
  useRouterState,
} from '@tanstack/react-router'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import * as React from 'react'
import '../styles/globals.css'
import { ToastProvider, Toaster } from '../components/ui/toast'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60,
      refetchOnWindowFocus: false,
    },
  },
})

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: 'utf-8' },
      { name: 'viewport', content: 'width=device-width, initial-scale=1.0' },
      { title: 'Bimbel Tadulako Cendekia — Bimbingan Belajar SD, SMP, SMA & UTBK di Kota Palu' },
      {
        name: 'description',
        content: 'Bimbel tatap muka di Kota Palu untuk SD, SMP, SMA, dan persiapan UTBK. Paling banyak 12 siswa per kelas, orang tua dapat kabar kehadiran setiap pertemuan.',
      },
    ],
    links: [
      { rel: 'preconnect', href: 'https://fonts.googleapis.com' },
      { rel: 'preconnect', href: 'https://fonts.gstatic.com', crossOrigin: 'anonymous' },
      {
        rel: 'stylesheet',
        href: 'https://fonts.googleapis.com/css2?family=Archivo:wdth,wght@62..125,500..900&family=Instrument+Sans:wght@400..700&display=swap',
      },
    ],
  }),
  component: RootComponent,
})

function RootComponent() {
  const pathname = useRouterState({ select: (s) => s.location.pathname })
  const isLanding = pathname === '/'

  return (
    <html lang="id">
      <head>
        <HeadContent />
      </head>
      <body className={isLanding ? 'landing' : 'font-sans antialiased text-[#000000] bg-[#EEEEEE]'}>
        <QueryClientProvider client={queryClient}>
          <ToastProvider>
            <Outlet />
            <Toaster />
          </ToastProvider>
        </QueryClientProvider>
        <Scripts />
      </body>
    </html>
  )
}
