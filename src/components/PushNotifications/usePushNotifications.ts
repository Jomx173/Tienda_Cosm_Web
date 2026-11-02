import { useCallback, useEffect, useState } from "react";

import api from "../../services/api";

type EstadoPush = "cargando" | "activadas" | "desactivadas" | "bloqueadas" | "no_compatibles";

/**
 * Lógica de notificaciones push de pedidos (sin interfaz).
 *
 * Se encarga de:
 *   - Comprobar al montar si ya hay una suscripción (getSubscription) y
 *     mostrar el estado real sin duplicar nada.
 *   - Activar: pedir permiso, registrar SW, obtener clave pública VAPID de
 *     GET /api/push/clave, suscribirse y enviar a POST /api/push/suscribir.
 *   - Desactivar: unsubscribe y DELETE /api/push/suscribir.
 *   - Manejar 401/403: mensaje "Tu sesión venció, vuelve a entrar" y deshacer
 *     la suscripción local si el POST falló.
 */
export function usePushNotifications() {
    const [estado, setEstado] = useState<EstadoPush>("cargando");
    const [cargando, setCargando] = useState(false);
    const [mensajeSesion, setMensajeSesion] = useState<string | null>(null);

    const esAdmin = window.location.pathname.startsWith("/admin");
    const haySesion = !!localStorage.getItem("token");

    const esCompatible =
        typeof window !== "undefined" &&
        typeof navigator !== "undefined" &&
        !!("serviceWorker" in navigator) &&
        !!("PushManager" in window) &&
        typeof Notification !== "undefined";

    // ------------------------------------------------------------------------
    // Comprueba el estado inicial al montar: ¿ya hay suscripción?
    // ------------------------------------------------------------------------
    useEffect(() => {
        if (!esAdmin || !haySesion) {
            setEstado("desactivadas");
            setMensajeSesion(null);
            return;
        }

        if (!esCompatible) {
            setEstado("no_compatibles");
            setMensajeSesion(null);
            return;
        }

        let montado = true;

        (async () => {
            try {
                const registro = await navigator.serviceWorker.getRegistration(
                    "/sw.js"
                );
                if (!registro) {
                    if (montado) {
                        setEstado("desactivadas");
                        setMensajeSesion(null);
                    }
                    return;
                }
                const suscripcion =
                    await registro.pushManager.getSubscription();
                if (montado) {
                    if (suscripcion) {
                        setEstado("activadas");
                        setMensajeSesion(null);
                    } else if (Notification.permission === "denied") {
                        setEstado("bloqueadas");
                        setMensajeSesion(null);
                    } else {
                        setEstado("desactivadas");
                        setMensajeSesion(null);
                    }
                }
            } catch {
                if (montado) {
                    setEstado(
                        Notification.permission === "denied"
                            ? "bloqueadas"
                            : "desactivadas"
                    );
                    setMensajeSesion(null);
                }
            }
        })();

        return () => {
            montado = false;
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [esAdmin, haySesion, esCompatible]);

    // ------------------------------------------------------------------------
    // Activa las notificaciones (solo por clic del usuario).
    // ------------------------------------------------------------------------
    const activar = useCallback(async () => {
        setCargando(true);
        setMensajeSesion(null);
        try {
            // 1. Pide permiso de notificaciones.
            const permiso = await Notification.requestPermission();
            if (permiso === "denied") {
                setEstado("bloqueadas");
                return;
            }
            if (permiso !== "granted") {
                setEstado("desactivadas");
                return;
            }

            // 2. Registra el service worker.
            const registro = await navigator.serviceWorker.register("/sw.js", {
                scope: "/",
            });

            // 3. Pide la clave pública VAPID.
            const respuestaClave = await api.get("/push/clave");
            const clavePublica =
                (respuestaClave.data as { clavePublica: string | null })?.clavePublica;
            if (!clavePublica) {
                setEstado("desactivadas");
                return;
            }

            // 4. Se suscribe al push.
            const claveUint8 = urlBase64ToUint8Array(clavePublica);
            const opciones: PushSubscriptionOptionsInit = {
                userVisibleOnly: true,
                applicationServerKey: claveUint8 as unknown as BufferSource,
            };
            const suscripcion =
                await registro.pushManager.subscribe(opciones);

            // 5. Envía la suscripción al servidor.
            const rawKey = suscripcion.getKey?.("p256dh");
            const rawAuth = suscripcion.getKey?.("auth");
            const p256dh = rawKey
                ? btoa(String.fromCharCode(...new Uint8Array(rawKey)))
                : "";
            const auth = rawAuth
                ? btoa(String.fromCharCode(...new Uint8Array(rawAuth)))
                : "";
            await api.post("/push/suscribir", {
                endpoint: suscripcion.endpoint,
                p256dh: p256dh,
                auth: auth,
                user_agent: navigator.userAgent,
            });

            setEstado("activadas");
            setMensajeSesion(null);
        } catch (error: any) {
            const status = error?.response?.status;
            if (status === 401 || status === 403) {
                // Sesión vencida: deshacer la suscripción local y avisar en español.
                try {
                    const registro = await navigator.serviceWorker.getRegistration(
                        "/sw.js"
                    );
                    const suscripcionLocal =
                        await registro?.pushManager.getSubscription();
                    if (suscripcionLocal) {
                        await suscripcionLocal.unsubscribe();
                    }
                } catch {
                    // Ignorar errores al deshacer la suscripción local.
                }
                setMensajeSesion("Tu sesión venció, vuelve a entrar");
                setEstado("desactivadas");
            } else {
                console.error("Error activando notificaciones:", error);
                setEstado("desactivadas");
            }
        } finally {
            setCargando(false);
        }
    }, []);

    // ------------------------------------------------------------------------
    // Desactiva las notificaciones.
    // ------------------------------------------------------------------------
    const desactivar = useCallback(async () => {
        setCargando(true);
        setMensajeSesion(null);
        try {
            const registro = await navigator.serviceWorker.getRegistration("/sw.js");
            if (!registro) {
                setEstado("desactivadas");
                return;
            }
            const suscripcion =
                await registro.pushManager.getSubscription();
            if (suscripcion) {
                const endpoint = suscripcion.endpoint;
                await suscripcion.unsubscribe();
                try {
                    await api.delete("/push/suscribir", {
                        data: { endpoint },
                    });
                } catch (error: any) {
                    const status = error?.response?.status;
                    if (status === 401 || status === 403) {
                        setMensajeSesion("Tu sesión venció, vuelve a entrar");
                    }
                }
            }
            setEstado("desactivadas");
        } catch (error: any) {
            const status = error?.response?.status;
            if (status === 401 || status === 403) {
                setMensajeSesion("Tu sesión venció, vuelve a entrar");
            } else {
                console.error("Error desactivando notificaciones:", error);
            }
            setEstado("desactivadas");
        } finally {
            setCargando(false);
        }
    }, []);

    return {
        estado,
        cargando,
        mensajeSesion,
        activar,
        desactivar,
        esAdmin,
        haySesion,
        esCompatible,
    };
}

/**
 * Convierte una clave VAPID en base64 URL-safe a un Uint8Array.
 */
function urlBase64ToUint8Array(base64String: string): Uint8Array {
    const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
    const base64 = (base64String + padding)
        .replace(/-/g, "+")
        .replace(/_/g, "/");
    const datos = atob(base64);
    const salida = new Uint8Array(datos.length);
    for (let i = 0; i < datos.length; i++) {
        salida[i] = datos.charCodeAt(i);
    }
    return salida;
}
