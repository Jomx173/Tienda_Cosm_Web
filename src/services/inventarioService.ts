import api from "./api";
import type {
    MovimientoInventario,
    ResumenInventario,
    ResultadoRestauracion,
    ValidacionRespaldo,
} from "./types";

const BASE = "/inventario";

/* =======================
   RESUMEN E HISTORIAL
   ======================= */

export const obtenerResumenInventario = async (
    umbral?: number
): Promise<ResumenInventario> => {
    const res = await api.get<{
        ok: boolean;
        umbral: number;
        resumen: Omit<ResumenInventario, "umbral">;
    }>(`${BASE}/resumen`, { params: umbral ? { umbral } : undefined });

    return { ...res.data.resumen, umbral: res.data.umbral };
};

export const listarMovimientos = async (
    limite = 50
): Promise<MovimientoInventario[]> => {
    const res = await api.get<{ ok: boolean; movimientos: MovimientoInventario[] }>(
        `${BASE}/movimientos`,
        { params: { limite } }
    );
    return res.data.movimientos;
};

/* =======================
   AJUSTES DE STOCK
   ======================= */

export type DatosAjuste = {
    tipo: "entrada" | "salida" | "correccion";
    id_producto: number;
    id_variante?: number | null;
    cantidad: number;
    motivo: string;
};

export type RespuestaAjuste = {
    ok: boolean;
    mensaje: string;
    stock_anterior: number;
    stock_nuevo: number;
    stock_producto: number;
    id_variante: number | null;
};

export const ajustarStock = async (datos: DatosAjuste): Promise<RespuestaAjuste> => {
    const res = await api.post<RespuestaAjuste>(`${BASE}/ajuste`, datos);
    return res.data;
};

/* =======================
   COPIAS DE SEGURIDAD
   ======================= */

/** Descarga el inventario actual y lo guarda en el equipo como archivo .json */
export const descargarRespaldo = async (): Promise<string> => {
    const res = await api.get(`${BASE}/respaldo`, { responseType: "blob" });

    const disposicion = String(res.headers["content-disposition"] || "");
    const coincidencia = disposicion.match(/filename="?([^";]+)"?/);
    const nombre = coincidencia ? coincidencia[1] : `md-beauty-inventario.json`;

    const url = URL.createObjectURL(res.data as Blob);
    const enlace = document.createElement("a");
    enlace.href = url;
    enlace.download = nombre;
    document.body.appendChild(enlace);
    enlace.click();
    document.body.removeChild(enlace);
    URL.revokeObjectURL(url);

    return nombre;
};

/** Valida un archivo de respaldo y devuelve el plan de restauración */
export const validarRespaldo = async (archivo: File): Promise<ValidacionRespaldo> => {
    const formData = new FormData();
    formData.append("respaldo", archivo);

    const res = await api.post<ValidacionRespaldo>(`${BASE}/respaldo/validar`, formData);
    return res.data;
};

/** Restaura el inventario desde un archivo de respaldo */
export const restaurarInventario = async (
    archivo: File,
    modo: "combinar" | "reemplazar"
): Promise<ResultadoRestauracion> => {
    const formData = new FormData();
    formData.append("respaldo", archivo);
    formData.append("modo", modo);
    formData.append("confirmado", "true");

    const res = await api.post<ResultadoRestauracion>(`${BASE}/restaurar`, formData);
    return res.data;
};
