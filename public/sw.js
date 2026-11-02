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

self.addEventListener("fetch", () => {
    // No intercepta ninguna petición: ni subidas de fotos (POST multipart),
    // ni imágenes de Cloudinary, ni llamadas a la API. El service worker se
    // registra solo para cumplir el requisito de instalación de la PWA, pero
    // nunca toca el tráfico de red, por lo que la dueña nunca verá datos
    // viejos ni fallarán las subidas.
});
