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
import { NavigationProgressBar } from '../components/ui/navigation-progress-bar'

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
      { title: 'Pintar Yuk — Lembaga Belajar SD, SMP, SMA & Intensif UTBK di Kota Palu' },
      {
        name: 'description',
        content: 'Pendampingan belajar tatap muka di Kota Palu untuk SD, SMP, SMA, dan persiapan UTBK-SNBT. Kelas kecil maksimal 12 siswa, paham dari konsep dasar, dan kehadiran terpantau real-time.',
      },
    ],
    links: [
      { rel: 'dns-prefetch', href: 'https://fonts.googleapis.com' },
      { rel: 'dns-prefetch', href: 'https://fonts.gstatic.com' },
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
  const isLanding = pathname === '/' || pathname.startsWith('/metode')

  return (
    <html lang="id">
      <head>
        <HeadContent />
      </head>
      <body className={isLanding ? 'landing' : 'font-sans antialiased text-[#000000] bg-[#EEEEEE]'}>
        <NavigationProgressBar />
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
