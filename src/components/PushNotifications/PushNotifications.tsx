import { useCallback, useEffect, useState } from "react";

import api from "../../services/api";

type EstadoPush =
    | "cargando"
    | "activadas"
    | "desactivadas"
    | "bloqueadas"
    | "no_compatibles";

/**
 * Botón para activar/desactivar las notificaciones push de pedidos nuevos
 * en el panel admin de MD.
 *
 * Solo se muestra cuando hay una sesión de administrador válida y la ruta
 * empieza con /admin. No aparece en /login ni en la tienda pública.
 *
 * Flujo de activación (desencadenado por clic del usuario):
 *   1. Pide permiso de notificaciones (Notification.requestPermission).
 *   2. Registra el service worker (/sw.js).
 *   3. Pide la clave pública VAPID a GET /api/push/clave.
 *   4. Se suscribe con pushManager.subscribe({ userVisibleOnly: true, applicationServerKey }).
 *   5. Envía { endpoint, p256dh, auth, user_agent } a POST /api/push/suscribir.
 *
 * Flujo de desactivación:
 *   pushManager.getSubscription().unsubscribe() y DELETE /api/push/suscribir.
 *
 * Si el servidor responde 401/403 (sesión vencida), se muestra un mensaje en
 * español y se hace unsubscribe para no dejar una suscripción a medias.
 *
 * Al abrir el admin comprueba si ya hay una suscripción (getSubscription) y,
 * si la hay, muestra el estado "activadas" sin duplicar nada.
 */
export default function PushNotifications() {
    const [estado, setEstado] = useState<EstadoPush>("cargando");
    const [cargando, setCargando] = useState(false);
    const [mensajeSesion, setMensajeSesion] = useState<string | null>(null);

    const pathname = window.location.pathname;
    const esAdmin = pathname.startsWith("/admin");

    const token = localStorage.getItem("token");
    const haySesion = !!token;

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

    const textoAyudaBloqueado =
        "Las notificaciones están bloqueadas para este sitio. Para reactivarlas:" +
        " en Chrome, toca el ícono de candado (o de ajustes de sitio) junto a la " +
        "dirección web, busca 'Notificaciones' y cámbialo a 'Permitir'. Luego " +
        "vuelve a abrir el panel admin y presiona 'Activar notificaciones'.";

    if (!esAdmin || !haySesion) {
        return null;
    }

    if (!esCompatible) {
        return (
            <button
                type="button"
                disabled
                title="Este navegador no soporta notificaciones push"
                style={{
                    position: "fixed",
                    bottom: 80,
                    right: 24,
                    zIndex: 999,
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 8,
                    padding: "10px 16px",
                    borderRadius: 30,
                    border: "1.5px solid #b00020",
                    background: "#fff",
                    color: "#b00020",
                    fontWeight: 600,
                    fontSize: 14,
                    cursor: "not-allowed",
                    boxShadow: "0 4px 12px rgba(0, 0, 0, 0.15)",
                }}
            >
                <span>Notificaciones no disponibles</span>
            </button>
        );
    }

    if (mensajeSesion) {
        return (
            <div
                style={{
                    position: "fixed",
                    bottom: 80,
                    right: 24,
                    zIndex: 1000,
                    maxWidth: 320,
                    padding: "10px 14px",
                    borderRadius: 12,
                    background: "#fdeaea",
                    color: "#b00020",
                    fontSize: 13,
                    lineHeight: 1.4,
                    border: "1px solid #f5c6c6",
                    boxShadow: "0 4px 12px rgba(0, 0, 0, 0.15)",
                }}
            >
                {mensajeSesion}
            </div>
        );
    }

    const estaActiva = estado === "activadas";

    return (
        <>
            <button
                type="button"
                onClick={estaActiva ? desactivar : activar}
                disabled={cargando}
                title={
                    estaActiva
                        ? "Desactivar notificaciones de pedidos"
                        : "Activar notificaciones de pedidos"
                }
                aria-label={
                    estaActiva
                        ? "Desactivar notificaciones de pedidos"
                        : "Activar notificaciones de pedidos"
                }
                style={{
                    position: "fixed",
                    bottom: 80,
                    right: 24,
                    zIndex: 1000,
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 8,
                    padding: "10px 16px",
                    borderRadius: 30,
                    border: `1.5px solid ${estaActiva ? "#b00020" : "#701522"}`,
                    background: estaActiva ? "#fdeaea" : "#fff",
                    color: estaActiva ? "#b00020" : "#701522",
                    fontWeight: 600,
                    fontSize: 14,
                    cursor: cargando ? "not-allowed" : "pointer",
                    boxShadow: "0 4px 12px rgba(0, 0, 0, 0.15)",
                    opacity: cargando ? 0.7 : 1,
                }}
            >
                <span>
                    {cargando
                        ? "Procesando..."
                        : estaActiva
                        ? "Desactivar notificaciones"
                        : "Activar notificaciones"}
                </span>
            </button>

            {estado === "bloqueadas" && (
                <div
                    style={{
                        position: "fixed",
                        bottom: 136,
                        right: 24,
                        zIndex: 1000,
                        maxWidth: 320,
                        padding: "10px 14px",
                        borderRadius: 12,
                        background: "#fff3cd",
                        color: "#856404",
                        fontSize: 13,
                        lineHeight: 1.4,
                        border: "1px solid #ffeeba",
                        boxShadow: "0 4px 12px rgba(0, 0, 0, 0.15)",
                    }}
                >
                    {textoAyudaBloqueado}
                </div>
            )}
        </>
    );
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
