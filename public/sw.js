// Service Worker Tadulako Cendekia (Web Push dinonaktifkan)
self.addEventListener('install', () => {
  self.skipWaiting()
})

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim())
})
