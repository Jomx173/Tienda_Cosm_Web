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
let temporizadorRepeticion: number | null = null;
let temporizadorMaximo: number | null = null;
let pararPorInteraccion: (() => void) | null = null;
// Osciladores en curso, para poder cortar el sonido al instante al detenerlo.
const osciladoresActivos: OscillatorNode[] = [];

const limpiarTemporizadores = (): void => {
    if (temporizadorRepeticion !== null) {
        window.clearInterval(temporizadorRepeticion);
        temporizadorRepeticion = null;
    }

    if (temporizadorMaximo !== null) {
        window.clearTimeout(temporizadorMaximo);
        temporizadorMaximo = null;
    }

    if (pararPorInteraccion) {
        window.removeEventListener("pointerdown", pararPorInteraccion);
        pararPorInteraccion = null;
    }
};

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

        // Volumen general. 0.85 con onda cuadrada suena fuerte sin saturar.
        const maestro = ctx.createGain();
        maestro.gain.value = 0.85;
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
                ganancia.gain.exponentialRampToValueAtTime(1, inicio + 0.01);
                ganancia.gain.exponentialRampToValueAtTime(
                    0.0001,
                    inicio + DURACION
                );

                oscilador.connect(ganancia);
                ganancia.connect(maestro);

                osciladoresActivos.push(oscilador);
                oscilador.onended = () => {
                    const indice = osciladoresActivos.indexOf(oscilador);
                    if (indice >= 0) osciladoresActivos.splice(indice, 1);
                };

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

/**
 * Arranca el aviso continuo: repite el sonido cada 2,5 s hasta que el usuario
 * toque la pantalla o pase el tiempo máximo (90 s por defecto).
 *
 * Pensado para que un pedido no se pierda si la dueña está lejos del móvil,
 * sin quedar sonando para siempre si nadie lo atiende.
 */
export const iniciarAvisoPedido = (
    duracionMaximaSegundos = 90,
    detenerAlTocar = true
): void => {
    // Si ya estaba sonando, se reinicia (pedido nuevo, cuenta nueva).
    detenerAvisoPedido();

    reproducirSonidoPedido();

    temporizadorRepeticion = window.setInterval(() => {
        reproducirSonidoPedido();
    }, 2500);

    if (detenerAlTocar) {
        // Cualquier toque/clic en el panel se considera "ya lo atendió".
        pararPorInteraccion = () => detenerAvisoPedido();
        window.addEventListener("pointerdown", pararPorInteraccion, {
            once: true,
        });
    }

    temporizadorMaximo = window.setTimeout(() => {
        detenerAvisoPedido();
    }, duracionMaximaSegundos * 1000);
};

/**
 * Indica si el aviso continuo está sonando ahora mismo.
 */
export const hayAvisoActivo = (): boolean => temporizadorRepeticion !== null;

/**
 * Detiene el aviso continuo (también se llama solo al tocar la pantalla).
 */
export const detenerAvisoPedido = (): void => {
    limpiarTemporizadores();

    // Corta también lo que esté sonando ahora mismo.
    for (const oscilador of osciladoresActivos.splice(0)) {
        try {
            oscilador.stop();
        } catch {
            // Ya estaba detenido.
        }

        try {
            oscilador.disconnect();
        } catch {
            // Ya estaba desconectado.
        }
    }
};
