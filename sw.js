// ═══════════════════════════════════════════════════════════
// Service Worker — VotApp PRM SPM
// Caché offline + sincronización en background
// ═══════════════════════════════════════════════════════════
const CACHE_NAME = 'votapp-v1';
const ASSETS = [
  '/votapp/app.html',
  'https://unpkg.com/html5-qrcode@2.3.8/html5-qrcode.min.js',
  'https://fonts.googleapis.com/css2?family=Sora:wght@400;600;700;800&display=swap',
];

// Instalar — cachear assets estáticos
self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(ASSETS).catch(() => {}))
  );
  self.skipWaiting();
});

// Activar — limpiar caches viejos
self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// Fetch — servir desde caché si no hay red
self.addEventListener('fetch', e => {
  // Solo cachear GET de assets estáticos, no peticiones a Supabase
  if (e.request.url.includes('supabase.co')) return;
  if (e.request.method !== 'GET') return;

  e.respondWith(
    fetch(e.request)
      .then(res => {
        const clone = res.clone();
        caches.open(CACHE_NAME).then(cache => cache.put(e.request, clone));
        return res;
      })
      .catch(() => caches.match(e.request))
  );
});

// Sync — sincronizar datos pendientes cuando vuelve internet
self.addEventListener('sync', e => {
  if (e.tag === 'sync-pendientes') {
    e.waitUntil(syncPendientes());
  }
});

async function syncPendientes() {
  // Notificar a la app que debe sincronizar
  const clients = await self.clients.matchAll();
  clients.forEach(client => client.postMessage({ type: 'SYNC_NOW' }));
}
