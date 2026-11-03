/**
 * Aviso sonoro de "pedido nuevo" del panel.
 *
 * El sonido anterior (dos pitidos senoidales a 0.3 de volumen) se perdía con
 * el ruido de la tienda. Este usa onda cuadrada (más penetrante), tres
 * ráfagas de dos tonos y un volumen alto, sin llegar a saturar.
 *
 * Nota: el volumen final depende del dispositivo y del volumen del sistema.
 * En el móvil, con la app cerrada, suena la notificación del sistema (esa no
 * se puede ampliar desde aquí).
 */

let contexto: AudioContext | null = null;

const obtenerContexto = (): AudioContext | null => {
    try {
        const Ctx =
            window.AudioContext ||
            (window as unknown as { webkitAudioContext?: typeof AudioContext })
                .webkitAudioContext;

        if (!Ctx) return null;

        if (!contexto || contexto.state === "closed") {
            contexto = new Ctx();
        }

        // Si el navegador lo dejó suspendido por falta de interacción,
        // intentamos reanudarlo (si hay gesto del usuario, funciona).
        if (contexto.state === "suspended") {
            void contexto.resume();
        }

        return contexto;
    } catch {
        return null;
    }
};

/**
 * Crea/reanuda el contexto de audio. Conviene llamarlo tras el primer clic
 * del usuario para que el navegador permita reproducir sonido más tarde.
 */
export const prepararAudio = (): void => {
    obtenerContexto();
};

/**
 * Reproduce el aviso de pedido nuevo: 3 ráfagas de dos tonos (~1,6 s).
 */
export const reproducirSonidoPedido = (): void => {
    const ctx = obtenerContexto();

    if (!ctx) return;

    try {
        const ahora = ctx.currentTime;

        // Volumen general. 0.7 con onda cuadrada suena bastante más fuerte
        // que el 0.3 senoidal anterior sin distorsionar en altavoces normales.
        const maestro = ctx.createGain();
        maestro.gain.value = 0.7;
        maestro.connect(ctx.destination);

        const TONOS = [988, 1319]; // B5 y E6: muy audibles en móvil
        const DURACION = 0.18;
        const SEPARACION = 0.06;
        const PAUSA_ENTRE_RAFAGAS = 0.22;
        const RAFAGAS = 3;

        const duracionRafaga =
            TONOS.length * (DURACION + SEPARACION) + PAUSA_ENTRE_RAFAGAS;

        for (let rafaga = 0; rafaga < RAFAGAS; rafaga++) {
            const inicioRafaga = ahora + rafaga * duracionRafaga;

            TONOS.forEach((frecuencia, indice) => {
                const inicio =
                    inicioRafaga + indice * (DURACION + SEPARACION);

                const oscilador = ctx.createOscillator();
                const ganancia = ctx.createGain();

                oscilador.type = "square";
                oscilador.frequency.setValueAtTime(frecuencia, inicio);

                ganancia.gain.setValueAtTime(0.0001, inicio);
                ganancia.gain.exponentialRampToValueAtTime(0.7, inicio + 0.01);
                ganancia.gain.exponentialRampToValueAtTime(
                    0.0001,
                    inicio + DURACION
                );

                oscilador.connect(ganancia);
                ganancia.connect(maestro);

                oscilador.start(inicio);
                oscilador.stop(inicio + DURACION + 0.02);
            });
        }

        // Vibración en Android (en escritorio no hace nada).
        if (typeof navigator !== "undefined" && "vibrate" in navigator) {
            try {
                navigator.vibrate([300, 120, 300, 120, 300]);
            } catch {
                // Sin vibración disponible.
            }
        }
    } catch {
        // Sin audio disponible: el aviso visual sigue funcionando.
    }
};
