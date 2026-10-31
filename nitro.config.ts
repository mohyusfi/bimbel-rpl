import { defineNitroConfig } from 'nitro/config'

export default defineNitroConfig({
  preset: 'vercel',
  routeRules: {
    // Cache halaman utama di Edge CDN selama 1 jam, background revalidate (SWR)
    '/': {
      isr: 3600,
      headers: {
        'cache-control': 'public, max-age=60, s-maxage=3600, stale-while-revalidate=86400',
      },
    },
    // Cache halaman detail metode belajar
    '/metode/**': {
      isr: 3600,
      headers: {
        'cache-control': 'public, max-age=60, s-maxage=3600, stale-while-revalidate=86400',
      },
    },
    // Halaman dinamis / autentikasi & dashboard wajib selalu segar tanpa cache
    '/masuk': { cache: false },
    '/admin/**': { cache: false },
    '/tutor/**': { cache: false },
    '/student/**': { cache: false },
    '/parent/**': { cache: false },
  },
})
