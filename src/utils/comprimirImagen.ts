/**
 * Compresión de fotos en el navegador antes de subirlas.
 *
 * La API corre como función de Vercel, que rechaza peticiones de más de ~4.5 MB
 * (error 413). Para que cada foto quepa en una petición propia, la reducimos en
 * el navegador: lado mayor de 1600 px y reencodeo a JPEG/WebP con calidad ~0.82,
 * conservando la orientación EXIF de las fotos de celular.
 */

const LADO_MAXIMO = 1600;
const CALIDAD = 0.82;

/** Cada petición de subida debe quedar por debajo del límite de Vercel (~4.5 MB). */
const MAX_SUBIDA_BYTES = 4 * 1024 * 1024;

/** Formatos de salida con pérdida; se prueban en este orden. */
const FORMATOS_SALIDA = [
    { mime: "image/jpeg", ext: "jpg" },
    { mime: "image/webp", ext: "webp" },
];

/** Formatos sin pérdida: si la foto es pequeña y no hace falta reducirla, se envía tal cual. */
const FORMATOS_CONSERVADOS = ["image/png", "image/gif"];

export type ResultadoCompresion =
    | { ok: true; archivo: File }
    | { ok: false; motivo: string };

const decodificar = async (archivo: File): Promise<ImageBitmap> => {
    // "from-image" aplica la orientación EXIF (fotos de celular rotadas)
    try {
        return await createImageBitmap(archivo, { imageOrientation: "from-image" });
    } catch {
        return await createImageBitmap(archivo);
    }
};

const dibujarEnCanvas = (bitmap: ImageBitmap): { canvas: HTMLCanvasElement; reducida: boolean } => {
    const factor = Math.min(1, LADO_MAXIMO / Math.max(bitmap.width, bitmap.height));

    const canvas = document.createElement("canvas");
    canvas.width = Math.max(1, Math.round(bitmap.width * factor));
    canvas.height = Math.max(1, Math.round(bitmap.height * factor));

    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("No se pudo preparar la imagen en el navegador.");
    ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);

    return { canvas, reducida: factor < 1 };
};

const aBlob = (canvas: HTMLCanvasElement, mime: string, calidad?: number): Promise<Blob | null> =>
    new Promise((resolve) => canvas.toBlob(resolve, mime, calidad));

const renombrar = (original: string, ext: string): string => {
    const base = original.replace(/\.[^.]+$/, "");
    return `${base || "foto"}.${ext}`;
};

export async function comprimirImagen(archivo: File): Promise<ResultadoCompresion> {
    try {
        const bitmap = await decodificar(archivo);
        const { canvas, reducida } = dibujarEnCanvas(bitmap);
        bitmap.close();

        // PNG/GIF pequeños que no se redujeron: se envían tal cual para no degradarlos
        if (!reducida && FORMATOS_CONSERVADOS.includes(archivo.type) && archivo.size <= MAX_SUBIDA_BYTES) {
            return { ok: true, archivo };
        }

        // Un PNG gigante casi nunca entra en 4 MB: se intenta primero sin pérdida y
        // luego con los formatos con pérdida; para el resto va directo a JPEG/WebP.
        const intentos: Array<{ mime: string; ext: string; calidad?: number }> =
            archivo.type === "image/png"
                ? [{ mime: "image/png", ext: "png" }, ...FORMATOS_SALIDA]
                : FORMATOS_SALIDA;

        for (const { mime, ext } of intentos) {
            const calidad = mime === "image/png" ? undefined : CALIDAD;
            const blob = await aBlob(canvas, mime, calidad);
            if (!blob) continue;

            if (blob.size <= MAX_SUBIDA_BYTES) {
                return {
                    ok: true,
                    archivo: new File([blob], renombrar(archivo.name, ext), {
                        type: mime,
                        lastModified: Date.now(),
                    }),
                };
            }
        }

        return {
            ok: false,
            motivo:
                "incluso comprimida sigue pesando más de 4 MB. Prueba con una foto más pequeña o con menos resolución.",
        };
    } catch {
        return {
            ok: false,
            motivo: "no se pudo leer en el navegador. Asegúrate de que sea una imagen JPG, PNG o WEBP válida.",
        };
    }
}
