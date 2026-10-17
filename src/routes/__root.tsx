import {
  HeadContent,
  Outlet,
  Scripts,
  createRootRoute,
} from '@tanstack/react-router'
import * as React from 'react'
import '../styles/globals.css'

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
  return (
    <html lang="id">
      <head>
        <HeadContent />
      </head>
      <body className="landing">
        <Outlet />
        <Scripts />
      </body>
    </html>
  )
}
