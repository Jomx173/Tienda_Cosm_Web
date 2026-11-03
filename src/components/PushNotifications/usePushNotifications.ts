import { useCallback, useEffect, useState } from "react";

import api from "../../services/api";

type EstadoPush =
    | "cargando"
    | "activadas"
    | "desactivadas"
    | "bloqueadas"
    | "no_compatibles"
    | "error_servidor";

/**
 * Lógica de notificaciones push de pedidos (sin interfaz).
 *
 * Se encarga de:
 *   - Comprobar al montar si ya hay una suscripción en el navegador y, si la
 *     hay, reenviarla a POST /api/push/suscribir. Solo se muestra "activadas"
 *     si el servidor la aceptó (200/201).
 *   - Activar: pedir permiso, registrar SW, obtener clave pública VAPID de
 *     GET /api/push/clave, suscribirse y enviar a POST /api/push/suscribir.
 *     No se confirma hasta que el POST responda bien; si falla, se hace
 *     unsubscribe local para no dejar una suscripción a medias.
 *   - Desactivar: unsubscribe y DELETE /api/push/suscribir.
 *   - Reintentar: reenvía la suscripción local existente al servidor.
 *   - Manejar 401/403: mensaje "Tu sesión venció, vuelve a entrar".
 */
export function usePushNotifications() {
    const [estado, setEstado] = useState<EstadoPush>("cargando");
    const [cargando, setCargando] = useState(false);
    const [registrando, setRegistrando] = useState(false);
    const [mensajeSesion, setMensajeSesion] = useState<string | null>(null);
    const [mensajeServidor, setMensajeServidor] = useState<string | null>(null);

    const esAdmin = window.location.pathname.startsWith("/admin");
    const haySesion = !!localStorage.getItem("token");

    const esCompatible =
        typeof window !== "undefined" &&
        typeof navigator !== "undefined" &&
        !!("serviceWorker" in navigator) &&
        !!("PushManager" in window) &&
        typeof Notification !== "undefined";

    /**
     * Envía una suscripción ya existente al servidor.
     * Devuelve true si el servidor aceptó (200/201). En caso contrario pone el
     * estado y mensaje adecuados y devuelve false.
     */
    const registrarEnServidor = async (
        suscripcion: PushSubscription
    ): Promise<boolean> => {
        const rawKey = suscripcion.getKey?.("p256dh");
        const rawAuth = suscripcion.getKey?.("auth");
        const p256dh = rawKey
            ? btoa(String.fromCharCode(...new Uint8Array(rawKey)))
            : "";
        const auth = rawAuth
            ? btoa(String.fromCharCode(...new Uint8Array(rawAuth)))
            : "";
        try {
            const respuesta = await api.post("/push/suscribir", {
                endpoint: suscripcion.endpoint,
                p256dh,
                auth,
                user_agent: navigator.userAgent,
            });
            const status = respuesta.status;
            if (status === 200 || status === 201) {
                setMensajeServidor(null);
                return true;
            }
            throw new Error(`Status ${status}`);
        } catch (error: any) {
            const status = error?.response?.status;
            const data = error?.response?.data;
            const mensajeDelServidor =
                data?.mensaje || error?.message || "Error desconocido";
            console.error(
                `[push] POST /push/suscribir falló (${status}): ${mensajeDelServidor}`
            );
            if (status === 401 || status === 403) {
                setMensajeServidor(null);
                setMensajeSesion("Tu sesión venció, vuelve a entrar");
                setEstado("desactivadas");
            } else {
                setMensajeSesion(null);
                setMensajeServidor(
                    "No se pudo registrar este dispositivo en el servidor"
                );
                setEstado("error_servidor");
            }
            return false;
        }
    };

    // ------------------------------------------------------------------------
    // Comprueba el estado inicial al montar: ¿ya hay suscripción local?
    // Si la hay, la reenvía al servidor. Solo se muestra "activadas" si el
    // servidor la aceptó.
    // ------------------------------------------------------------------------
    useEffect(() => {
        if (!esAdmin || !haySesion) {
            setEstado("desactivadas");
            setMensajeSesion(null);
            setMensajeServidor(null);
            return;
        }

        if (!esCompatible) {
            setEstado("no_compatibles");
            setMensajeSesion(null);
            setMensajeServidor(null);
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
                        setMensajeServidor(null);
                    }
                    return;
                }
                const suscripcion =
                    await registro.pushManager.getSubscription();
                if (montado) {
                    if (suscripcion) {
                        const aceptada = await registrarEnServidor(suscripcion);
                        if (montado && aceptada) {
                            setEstado("activadas");
                            setMensajeSesion(null);
                            setMensajeServidor(null);
                        }
                        // Si no fue aceptada, registrarEnServidor ya puso el
                        // estado (error_servidor o desactivadas por 401/403).
                    } else if (Notification.permission === "denied") {
                        setEstado("bloqueadas");
                        setMensajeSesion(null);
                        setMensajeServidor(null);
                    } else {
                        setEstado("desactivadas");
                        setMensajeSesion(null);
                        setMensajeServidor(null);
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
                    setMensajeServidor(null);
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
        setMensajeServidor(null);
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

            // 5. Envía la suscripción al servidor. No se confirma hasta que
            //    responda bien; si falla, se deshace la suscripción local.
            const aceptada = await registrarEnServidor(suscripcion);
            if (aceptada) {
                setEstado("activadas");
                setMensajeSesion(null);
                setMensajeServidor(null);
            } else {
                // Si el servidor no la aceptó, quitar la suscripción local
                // para no dejarla a medias. (registrarEnServidor ya puso el
                // estado: error_servidor o desactivadas por 401/403.)
                try {
                    await suscripcion.unsubscribe();
                } catch {
                    // Ignorar errores al deshacer la suscripción local.
                }
            }
        } catch (error: any) {
            const status = error?.response?.status;
            if (status === 401 || status === 403) {
                setMensajeServidor(null);
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
    // Reintenta registrar la suscripción local existente en el servidor.
    // ------------------------------------------------------------------------
    const reintentar = useCallback(async () => {
        setRegistrando(true);
        setMensajeServidor(null);
        try {
            const registro = await navigator.serviceWorker.getRegistration(
                "/sw.js"
            );
            if (!registro) {
                setRegistrando(false);
                setEstado("desactivadas");
                return;
            }
            const suscripcion =
                await registro.pushManager.getSubscription();
            if (!suscripcion) {
                setRegistrando(false);
                setEstado("desactivadas");
                return;
            }
            const aceptada = await registrarEnServidor(suscripcion);
            setRegistrando(false);
            if (aceptada) {
                setEstado("activadas");
                setMensajeSesion(null);
            }
            // Si no fue aceptada, registrarEnServidor ya puso el estado.
        } catch {
            setRegistrando(false);
            setMensajeServidor(
                "No se pudo registrar este dispositivo en el servidor"
            );
            setEstado("error_servidor");
        }
    }, []);

    // ------------------------------------------------------------------------
    // Desactiva las notificaciones.
    // ------------------------------------------------------------------------
    const desactivar = useCallback(async () => {
        setCargando(true);
        setMensajeSesion(null);
        setMensajeServidor(null);
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
        registrando,
        mensajeSesion,
        mensajeServidor,
        activar,
        desactivar,
        reintentar,
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
