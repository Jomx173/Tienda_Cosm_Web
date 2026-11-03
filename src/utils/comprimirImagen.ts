/**
 * Compresión de fotos en el navegador antes de subirlas.
 *
 * La API corre como función de Vercel, que rechaza peticiones de más de ~4.5 MB
 * (error 413). Para que cada foto quepa en una petición propia, la reducimos en
 * el navegador: lado mayor de 1600 px y reencodeo a JPEG/WebP con calidad ~0.82,
 * conservando la orientación EXIF de las fotos de celular.
 *
 * Si el navegador no logra abrir la foto de una forma, se prueban otras (plan B).
 * Como último recurso, si es una imagen válida y pequeña, se sube el original.
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

/** Marcas de archivos HEIC/HEIF (fotos de iPhone y algunos Android). */
const MARCAS_HEIF = ["heic", "heix", "hevc", "hevx", "heim", "heis", "mif1", "msf1"];

// Los motivos continúan el mensaje que arma el formulario: `"nombre.jpg" <motivo>`
const MOTIVO_NUBE =
    "no se pudo leer desde el teléfono. Si la foto está en la nube (por ejemplo Google Fotos), descárgala primero a la galería, o hazle una captura de pantalla y sube la captura.";
const MOTIVO_HEIC =
    "está en formato HEIC/HEIF, que el navegador no puede procesar. Conviértela a JPG o hazle una captura de pantalla y sube la captura.";
const MOTIVO_ILEGIBLE =
    "no se pudo leer en el navegador. Puede estar dañada, no ser JPG, PNG o WEBP, o ser demasiado grande para el teléfono. Prueba con otra copia o hazle una captura de pantalla.";
const motivoMuyGrande = (bytes: number): string =>
    `es muy grande (${(bytes / (1024 * 1024)).toFixed(1)} MB) y el navegador no pudo reducirla. Prueba con una foto más pequeña o hazle una captura de pantalla.`;

export type ResultadoCompresion =
    | { ok: true; archivo: File }
    | { ok: false; motivo: string };

type Fuente = {
    origen: CanvasImageSource;
    ancho: number;
    alto: number;
    liberar: () => void;
};

/** Lee los primeros bytes del archivo. Devuelve null si el archivo no se puede leer. */
const leerCabecera = async (archivo: File): Promise<string | null> => {
    try {
        const bytes = new Uint8Array(await archivo.slice(0, 12).arrayBuffer());
        return Array.from(bytes, (b) => String.fromCharCode(b)).join("");
    } catch {
        return null;
    }
};

/** Detecta HEIC/HEIF por tipo, extensión o contenido del archivo. */
const esHeif = (archivo: File, cabecera: string): boolean => {
    const tipo = archivo.type.toLowerCase();
    if (tipo.includes("heic") || tipo.includes("heif")) return true;
    const extension = archivo.name.split(".").pop()?.toLowerCase() ?? "";
    if (extension === "heic" || extension === "heif") return true;
    return cabecera.slice(4, 8) === "ftyp" && MARCAS_HEIF.includes(cabecera.slice(8, 12));
};

/** Tipo real de la imagen según su contenido ("" si no es JPG, PNG, WEBP ni GIF). */
const tipoPorContenido = (cabecera: string): string => {
    if (cabecera.startsWith("\xFF\xD8\xFF")) return "image/jpeg";
    if (cabecera.startsWith("\x89PNG")) return "image/png";
    if (cabecera.startsWith("RIFF") && cabecera.slice(8, 12) === "WEBP") return "image/webp";
    if (cabecera.startsWith("GIF8")) return "image/gif";
    return "";
};

const desdeBitmap = (bitmap: ImageBitmap): Fuente => ({
    origen: bitmap,
    ancho: bitmap.width,
    alto: bitmap.height,
    liberar: () => bitmap.close(),
});

const desdeImg = (archivo: File): Promise<Fuente> =>
    new Promise((resolve, reject) => {
        const url = URL.createObjectURL(archivo);
        const img = new Image();
        img.onload = () =>
            resolve({
                origen: img,
                ancho: img.naturalWidth,
                alto: img.naturalHeight,
                liberar: () => URL.revokeObjectURL(url),
            });
        img.onerror = () => {
            URL.revokeObjectURL(url);
            reject(new Error("El navegador no pudo abrir la imagen con ."));
        };
        img.src = url;
    });

/** Prueba varias formas de abrir la imagen; la primera que funcione gana. */
const decodificar = async (archivo: File): Promise<Fuente> => {
    const intentos: Array<{ nombre: string; abrir: () => Promise<Fuente> }> = [
        {
            // "from-image" aplica la orientación EXIF (fotos de celular rotadas)
            nombre: "bitmap con orientación",
            abrir: async () => desdeBitmap(await createImageBitmap(archivo, { imageOrientation: "from-image" })),
        },
        {
            // Reduce mientras decodifica: ayuda con fotos enormes que agotan la memoria
            nombre: "bitmap reducido",
            abrir: async () =>
                desdeBitmap(
                    await createImageBitmap(archivo, {
                        imageOrientation: "from-image",
                        resizeWidth: LADO_MAXIMO,
                        resizeQuality: "medium",
                    }),
                ),
        },
        {
            nombre: "bitmap simple",
            abrir: async () => desdeBitmap(await createImageBitmap(archivo)),
        },
        {
            nombre: "elemento img",
            abrir: () => desdeImg(archivo),
        },
    ];

    let ultimoError: unknown = new Error("No se pudo abrir la imagen.");
    for (const intento of intentos) {
        try {
            return await intento.abrir();
        } catch (error) {
            ultimoError = error;
            console.warn(`[comprimirImagen] falló "${intento.nombre}" con ${archivo.name}`, error);
        }
    }
    throw ultimoError;
};

const dibujarEnCanvas = (fuente: Fuente): { canvas: HTMLCanvasElement; reducida: boolean } => {
    if (!(fuente.ancho > 0 && fuente.alto > 0)) {
        throw new Error("La imagen no tiene dimensiones válidas.");
    }

    const factor = Math.min(1, LADO_MAXIMO / Math.max(fuente.ancho, fuente.alto));

    const canvas = document.createElement("canvas");
    canvas.width = Math.max(1, Math.round(fuente.ancho * factor));
    canvas.height = Math.max(1, Math.round(fuente.alto * factor));

    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("No se pudo preparar la imagen en el navegador.");
    ctx.drawImage(fuente.origen, 0, 0, canvas.width, canvas.height);

    return { canvas, reducida: factor < 1 };
};

const aBlob = (canvas: HTMLCanvasElement, mime: string, calidad?: number): Promise<Blob | null> =>
    new Promise((resolve) => canvas.toBlob(resolve, mime, calidad));

const renombrar = (original: string, ext: string): string => {
    const base = original.replace(/\.[^.]+$/, "");
    return `${base || "foto"}.${ext}`;
};

export async function comprimirImagen(archivo: File): Promise<ResultadoCompresion> {
    const cabecera = await leerCabecera(archivo);

    // Archivo vacío o ilegible: suele ser una foto que está en la nube y no se descargó
    if (archivo.size === 0 || cabecera === null) {
        return { ok: false, motivo: MOTIVO_NUBE };
    }

    if (esHeif(archivo, cabecera)) {
        return { ok: false, motivo: MOTIVO_HEIC };
    }

    try {
        const fuente = await decodificar(archivo);

        let dibujo: { canvas: HTMLCanvasElement; reducida: boolean };
        try {
            dibujo = dibujarEnCanvas(fuente);
        } finally {
            fuente.liberar();
        }
        const { canvas, reducida } = dibujo;

        // PNG/GIF pequeños que no se redujeron: se envían tal cual para no degradarlos
        if (!reducida && FORMATOS_CONSERVADOS.includes(archivo.type) && archivo.size <= MAX_SUBIDA_BYTES) {
            return { ok: true, archivo };
        }

        // Un PNG gigante casi nunca entra en 4 MB: se intenta primero sin pérdida y
        // luego con los formatos con pérdida; para el resto va directo a JPEG/WebP.
        const intentos: Array<{ mime: string; ext: string }> =
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
    } catch (error) {
        console.error("[comprimirImagen] no se pudo procesar la foto", {
            nombre: archivo.name,
            tipo: archivo.type,
            bytes: archivo.size,
            mensaje: error instanceof Error ? error.message : String(error),
        });

        // Último recurso: es una imagen válida y cabe en una petición, se sube el original
        const tipoReal = tipoPorContenido(cabecera);
        if (tipoReal && archivo.size <= MAX_SUBIDA_BYTES) {
            return {
                ok: true,
                archivo: new File([archivo], archivo.name, {
                    type: tipoReal,
                    lastModified: archivo.lastModified,
                }),
            };
        }

        return {
            ok: false,
            motivo: archivo.size > MAX_SUBIDA_BYTES ? motivoMuyGrande(archivo.size) : MOTIVO_ILEGIBLE,
        };
    }
}
