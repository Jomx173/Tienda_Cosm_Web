// ============================================================================
// Service worker mínimo del panel admin de MD.
//
// Requisitos:
//   1. No guarda en caché páginas ni respuestas de la API: la dueña nunca debe
//      ver datos viejos.
//   2. El manejador fetch solo deja pasar cada petición a la red (requisito
//      que Chrome pide para ofrecer la instalación de la PWA).
// ============================================================================

self.addEventListener("install", (event) => {
    // Activa el nuevo service worker sin esperar.
    event.waitUntil(self.skipWaiting());
});

self.addEventListener("activate", (event) => {
    // Reclama el control de las páginas abiertas de inmediato.
    event.waitUntil(self.clients.claim());
});

self.addEventListener("fetch", (event) => {
    // Deja pasar la petición a la red, sin caché.
    event.respondWith(fetch(event.request));
});
