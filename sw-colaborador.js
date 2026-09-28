// Service worker mínimo — solo lo necesario para que el navegador ofrezca
// "Instalar app". No cachea agresivamente porque la app siempre debe
// mostrar datos en vivo desde Supabase (padrón, organizaciones, registros).
const CACHE = 'atenas-colaborador-shell-v1';
const SHELL = ['./app_colaborador.html'];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE).then((cache) => cache.addAll(SHELL)).catch(() => {})
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener('fetch', (event) => {
  // Red primero (para que siempre veas datos actuales); si no hay internet,
  // intenta servir el cascarón guardado para que al menos abra la app.
  event.respondWith(
    fetch(event.request).catch(() => caches.match(event.request))
  );
});
