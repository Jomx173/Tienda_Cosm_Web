const MAPA_ERRORES: Array<[RegExp, string]> = [
    [/string violation[:\s]*[^\n]*imagen[^\n]*/i, "Hubo un problema con la imagen del producto. Intenta subir el archivo de nuevo."],
    [/cannot be an array or an object/i, "Uno de los campos tiene un valor inválido. Intenta de nuevo."],
    [/notnull violation|cannot be null/i, "Faltan campos obligatorios. Revisa el formulario."],
    [/validation error/i, "Los datos ingresados no son válidos. Revisa los campos e inténtalo de nuevo."],
    [/unique.*constraint|must be unique|duplicate entry/i, "El dato ingresado ya está registrado."],
    [/invalid input/i, "Los datos ingresados no son válidos."],
    [/sql syntax|unknown column|errno/i, "Ocurrió un error con la base de datos. Intenta de nuevo."],
    [/network error/i, "No se pudo conectar con el servidor. Verifica tu conexión."],
    [/timed? out|timeout/i, "La solicitud tardó demasiado. Intenta de nuevo."],
    [/cannot read propert/i, "Ocurrió un error inesperado. Intenta de nuevo."],
];

export const traducirMensajeError = (mensaje: string): string => {
    const limpio = String(mensaje).trim();
    if (!limpio) return limpio;

    for (const [patron, traduccion] of MAPA_ERRORES) {
        if (patron.test(limpio)) return traduccion;
    }

    return limpio;
};
