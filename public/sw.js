// ============================================================================
// Service worker mínimo del panel admin de MD.
//
// Requisitos:
//   1. No guarda en caché páginas ni respuestas de la API: la dueña nunca debe
//      ver datos viejos.
//   2. El manejador fetch NO intercepta ninguna petición (quedó vacío
//      a propósito para no romper subidas de fotos ni llamadas a la API).
//   3. Recibe notificaciones push y las muestra al usuario.
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

// ----------------------------------------------------------------------------
// Notificaciones push: nuevo pedido
// ----------------------------------------------------------------------------
self.addEventListener("push", (event) => {
    let datos = {
        title: "Nuevo pedido",
        body: "Tienes un pedido nuevo en MD.",
        icon: "/icons/icon-192.png",
        badge: "/icons/icon-192.png",
        tag: "pedido-nuevo",
        data: {},
    };

    if (event.data) {
        try {
            datos = { ...datos, ...event.data.json() };
        } catch {
            // Si el payload no es JSON válido, se usan los valores por defecto.
        }
    }

    const opciones = {
        body: datos.body || "Tienes un pedido nuevo en MD.",
        icon: datos.icon || "/icons/icon-192.png",
        badge: datos.badge || "/icons/icon-192.png",
        tag: datos.tag || "pedido-nuevo",
        data: datos.data || {},
        renotify: true,
        // Que no desaparezca sola: la dueña la ve aunque no esté mirando.
        requireInteraction: true,
        // Vibración en Android (en escritorio se ignora).
        vibrate: [300, 120, 300, 120, 300],
    };

    event.waitUntil(self.registration.showNotification(datos.title, opciones));
});

self.addEventListener("notificationclick", (event) => {
    // Cierra la notificación al hacer clic.
    event.notification.close();

    const url = "/admin/pedidos";

    // Si ya hay una ventana del admin abierta, la enfoca; si no, abre una nueva.
    event.waitUntil(
        self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((clientes) => {
            for (const cliente of clientes) {
                if (cliente.url.startsWith(self.location.origin + "/admin")) {
                    return cliente.focus();
                }
            }
            return self.clients.openWindow(url);
        })
    );
});
