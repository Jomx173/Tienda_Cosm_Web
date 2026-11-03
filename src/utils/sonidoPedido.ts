/**
 * Aviso sonoro de "pedido nuevo" del panel.
 *
 * Incluye varios timbres, la preferencia guardada en el dispositivo y la
 * duración del aviso continuo. El sonido se sintetiza con Web Audio (sin
 * archivos de audio): así no hay que descargar nada y se puede ajustar el
 * volumen y el patrón.
 *
 * Nota: el volumen final depende del dispositivo y del volumen del sistema.
 * En el móvil, con la app cerrada, suena la notificación del sistema (esa no
 * se puede ampliar desde aquí).
 */

export type TimbreId = "clasico" | "campana" | "puerta" | "alarma" | "suave";

export type Timbre = {
    id: TimbreId;
    nombre: string;
    descripcion: string;
    onda: OscillatorType;
    /** Frecuencias de cada nota, en Hz. */
    tonos: number[];
    /** Duración de cada nota, en segundos. */
    duracion: number;
    /** Silencio entre notas, en segundos. */
    separacion: number;
    /** Silencio después de la ráfaga, en segundos. */
    pausa: number;
    /** Cuántas veces se repite la ráfaga dentro de un aviso. */
    rafagas: number;
    /** Volumen del timbre (0 a 1). */
    volumen: number;
    /** Cada cuántos ms se repite el aviso mientras está activo. */
    intervalo: number;
};

export const TIMBRES: Timbre[] = [
    {
        id: "clasico",
        nombre: "Clásico",
        descripcion: "Pitido doble, insistente.",
        onda: "square",
        tonos: [988, 1319],
        duracion: 0.18,
        separacion: 0.06,
        pausa: 0.22,
        rafagas: 3,
        volumen: 0.85,
        intervalo: 2500,
    },
    {
        id: "campana",
        nombre: "Campana",
        descripcion: "Ding-dong largo y claro.",
        onda: "sine",
        tonos: [1046, 1568],
        duracion: 0.75,
        separacion: 0.06,
        pausa: 0.2,
        rafagas: 1,
        volumen: 0.95,
        intervalo: 2600,
    },
    {
        id: "puerta",
        nombre: "Timbre de puerta",
        descripcion: "Dos notas suaves.",
        onda: "sine",
        tonos: [659, 523],
        duracion: 0.5,
        separacion: 0.32,
        pausa: 0.3,
        rafagas: 1,
        volumen: 0.9,
        intervalo: 3000,
    },
    {
        id: "alarma",
        nombre: "Alarma",
        descripcion: "Rápida y urgente.",
        onda: "sawtooth",
        tonos: [740, 988],
        duracion: 0.13,
        separacion: 0.03,
        pausa: 0.08,
        rafagas: 6,
        volumen: 0.6,
        intervalo: 1600,
    },
    {
        id: "suave",
        nombre: "Suave",
        descripcion: "Aviso discreto.",
        onda: "triangle",
        tonos: [523, 659],
        duracion: 0.3,
        separacion: 0.1,
        pausa: 0.2,
        rafagas: 2,
        volumen: 0.55,
        intervalo: 2800,
    },
];

const TIMBRE_POR_DEFECTO: TimbreId = "clasico";
const DURACION_POR_DEFECTO = 90;

const CLAVE_TIMBRE = "md_aviso_timbre";
const CLAVE_DURACION = "md_aviso_duracion";

const obtenerTimbrePorId = (id: TimbreId): Timbre =>
    TIMBRES.find((timbre) => timbre.id === id) || TIMBRES[0];

export const obtenerTimbreGuardado = (): TimbreId => {
    try {
        const guardado = localStorage.getItem(CLAVE_TIMBRE);

        if (guardado && TIMBRES.some((timbre) => timbre.id === guardado)) {
            return guardado as TimbreId;
        }
    } catch {
        // Sin almacenamiento disponible.
    }

    return TIMBRE_POR_DEFECTO;
};

export const guardarTimbre = (id: TimbreId): void => {
    try {
        localStorage.setItem(CLAVE_TIMBRE, id);
    } catch {
        // Sin almacenamiento disponible.
    }
};

/**
 * Duración en segundos. 0 significa "hasta que lo atienda".
 */
export const obtenerDuracionGuardada = (): number => {
    try {
        const guardado = localStorage.getItem(CLAVE_DURACION);

        if (guardado !== null) {
            const numero = Number(guardado);

            if (Number.isFinite(numero) && numero >= 0) return numero;
        }
    } catch {
        // Sin almacenamiento disponible.
    }

    return DURACION_POR_DEFECTO;
};

export const guardarDuracion = (segundos: number): void => {
    try {
        localStorage.setItem(CLAVE_DURACION, String(segundos));
    } catch {
        // Sin almacenamiento disponible.
    }
};

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

const programarTimbre = (
    ctx: AudioContext,
    timbre: Timbre,
    cuando: number
): void => {
    const maestro = ctx.createGain();
    maestro.gain.value = timbre.volumen;
    maestro.connect(ctx.destination);

    const duracionRafaga =
        timbre.tonos.length * (timbre.duracion + timbre.separacion) +
        timbre.pausa;

    for (let rafaga = 0; rafaga < timbre.rafagas; rafaga++) {
        const inicioRafaga = cuando + rafaga * duracionRafaga;

        timbre.tonos.forEach((frecuencia, indice) => {
            const inicio = inicioRafaga + indice * (timbre.duracion + timbre.separacion);

            const oscilador = ctx.createOscillator();
            const ganancia = ctx.createGain();

            oscilador.type = timbre.onda;
            oscilador.frequency.setValueAtTime(frecuencia, inicio);

            ganancia.gain.setValueAtTime(0.0001, inicio);
            ganancia.gain.exponentialRampToValueAtTime(1, inicio + 0.012);
            ganancia.gain.exponentialRampToValueAtTime(
                0.0001,
                inicio + timbre.duracion
            );

            oscilador.connect(ganancia);
            ganancia.connect(maestro);

            osciladoresActivos.push(oscilador);
            oscilador.onended = () => {
                const posicion = osciladoresActivos.indexOf(oscilador);
                if (posicion >= 0) osciladoresActivos.splice(posicion, 1);
            };

            oscilador.start(inicio);
            oscilador.stop(inicio + timbre.duracion + 0.02);
        });
    }
};

/**
 * Reproduce una sola vez el timbre indicado (o el guardado si no se indica).
 */
export const reproducirSonidoPedido = (timbreId?: TimbreId): void => {
    const ctx = obtenerContexto();

    if (!ctx) return;

    const timbre = obtenerTimbrePorId(timbreId || obtenerTimbreGuardado());

    try {
        programarTimbre(ctx, timbre, ctx.currentTime);

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
 * Arranca el aviso continuo.
 *
 * @param duracionMaximaSegundos 0 = "hasta que lo atienda" (sin límite).
 * @param detenerAlTocar         si true, cualquier clic/toque lo detiene.
 * @param timbreId               fuerza un timbre (para la prueba); si no, usa el guardado.
 */
export const iniciarAvisoPedido = (
    duracionMaximaSegundos?: number,
    detenerAlTocar = true,
    timbreId?: TimbreId
): void => {
    const duracion = duracionMaximaSegundos ?? obtenerDuracionGuardada();
    const timbre = obtenerTimbrePorId(timbreId || obtenerTimbreGuardado());

    // Si ya estaba sonando, se reinicia (pedido nuevo, cuenta nueva).
    detenerAvisoPedido();

    reproducirSonidoPedido(timbre.id);

    temporizadorRepeticion = window.setInterval(() => {
        reproducirSonidoPedido(timbre.id);
    }, timbre.intervalo);

    if (detenerAlTocar) {
        // Cualquier toque/clic en el panel se considera "ya lo atendió".
        pararPorInteraccion = () => detenerAvisoPedido();
        window.addEventListener("pointerdown", pararPorInteraccion, {
            once: true,
        });
    }

    if (duracion > 0) {
        temporizadorMaximo = window.setTimeout(() => {
            detenerAvisoPedido();
        }, duracion * 1000);
    }
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
