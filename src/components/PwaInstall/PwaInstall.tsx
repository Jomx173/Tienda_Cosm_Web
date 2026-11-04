import { useCallback, useEffect, useState } from "react";
import { useLocation } from "react-router-dom";

const ADMIN_PREFIX = "/admin";
const LOGIN_ROUTE = "/login";

type BeforeInstallPromptEvent = Event & {
    prompt?: () => Promise<void>;
    userChoice?: Promise<{ outcome: "accepted" | "dismissed" }>;
};

/**
 * Integra la PWA del panel admin de MD:
 *  - Enlaza el manifest solo en /admin y /login (la tienda pública no lo ve).
 *  - Registra el service worker solo desde el admin.
 *  - Muestra el botón "Instalar app" dentro del admin usando beforeinstallprompt,
 *    oculto cuando ya está instalada.
 *
 * No redirige las rutas de la tienda: así "Ver tienda" funciona también con la
 * app instalada (antes saltaba de vuelta a /admin/pedidos).
 */
export default function PwaInstall() {
    const { pathname } = useLocation();

    const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
    const [installed, setInstalled] = useState(false);

    const isAdmin = pathname.startsWith(ADMIN_PREFIX);
    const isLogin = pathname === LOGIN_ROUTE;
    const isStandalone = window.matchMedia("(display-mode: standalone)").matches;

    // 1. Enlaza el manifest solo en las rutas del admin y de login.
    // 2. Registra el service worker solo desde el admin.
    useEffect(() => {
        if (isAdmin || isLogin) {
            if (!document.querySelector('link[rel="manifest"]')) {
                const link = document.createElement("link");
                link.rel = "manifest";
                link.href = "/manifest.webmanifest";
                document.head.appendChild(link);
            }
        }

        if (isAdmin && "serviceWorker" in navigator) {
            navigator.serviceWorker
                .register("/sw.js", { scope: "/" })
                .catch(() => {
                    // El registro falló silenciosamente; la app sigue funcionando.
                });
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isAdmin, isLogin]);

    // Captura el evento beforeinstallprompt para instalar bajo demanda.
    useEffect(() => {
        const onBeforeInstallPrompt = (event: Event) => {
            event.preventDefault();
            setDeferredPrompt(event as BeforeInstallPromptEvent);
        };
        window.addEventListener("beforeinstallprompt", onBeforeInstallPrompt);
        return () => {
            window.removeEventListener("beforeinstallprompt", onBeforeInstallPrompt);
        };
    }, []);

    // Cuando se completa la instalación, oculta el botón.
    useEffect(() => {
        const onAppInstalled = () => setInstalled(true);
        window.addEventListener("appinstalled", onAppInstalled);
        return () => {
            window.removeEventListener("appinstalled", onAppInstalled);
        };
    }, []);

    const instalarApp = useCallback(async () => {
        if (!deferredPrompt) return;
        try {
            await deferredPrompt.prompt?.();
            const { outcome } = await deferredPrompt.userChoice!;
            setInstalled(outcome === "accepted");
        } catch {
            // Error de instalación: se ignora, la app sigue funcionando.
        } finally {
            setDeferredPrompt(null);
        }
    }, [deferredPrompt]);

    // El botón solo aparece dentro del admin, si no está instalada y hay prompt disponible.
    if (!isAdmin || installed || isStandalone || !deferredPrompt) {
        return null;
    }

    return (
        <button
            type="button"
            onClick={instalarApp}
            title="Instalar la app del panel admin de MD"
            aria-label="Instalar app"
            style={{
                position: "fixed",
                bottom: 24,
                right: 24,
                zIndex: 1000,
                display: "inline-flex",
                alignItems: "center",
                gap: 8,
                padding: "10px 16px",
                borderRadius: 30,
                border: "1.5px solid #701522",
                background: "#fff",
                color: "#701522",
                fontWeight: 600,
                fontSize: 14,
                cursor: "pointer",
                boxShadow: "0 4px 12px rgba(0, 0, 0, 0.15)",
            }}
        >
            <span>Instalar app</span>
        </button>
    );
}
