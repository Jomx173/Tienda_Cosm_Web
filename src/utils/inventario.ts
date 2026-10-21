import type { Producto } from "../services/types";

/**
 * Umbral de stock bajo. Es el mismo valor que usaba el aviso del panel,
 * ahora compartido entre el resumen, la tabla y el aviso compacto.
 */
export const STOCK_MINIMO = 5;

export type ItemInventario = {
    clave: string;
    id_producto: number;
    id_variante: number | null;
    nombre: string;
    tono: string | null;
    color: string | null;
    imagen: string | null;
    stock: number;
    precio: number | string;
    categoria: string;
    id_categoria: number | null;
    estado: boolean;
    esVariante: boolean;
};

export type EstadoStock = "agotado" | "bajo" | "disponible";

const imagenDe = (producto: Producto): string | null => {
    if (producto.imagen) return producto.imagen;

    const general = producto.imagenes?.find((i) => !i.id_variante)?.imagen;
    if (general) return general;

    return producto.variantes?.[0]?.imagenes?.[0]?.imagen || null;
};

/**
 * Convierte los productos en filas de inventario.
 * Un producto con variantes genera una fila por tono (su stock es el propio),
 * y un producto simple genera una sola fila con su stock.
 * De esta forma ninguna unidad se cuenta dos veces.
 */
export const construirItemsInventario = (productos: Producto[]): ItemInventario[] => {
    const items: ItemInventario[] = [];

    for (const producto of productos) {
        const imagenGeneral = imagenDe(producto);
        const variantes = producto.variantes || [];

        if (variantes.length > 0) {
            for (const variante of variantes) {
                items.push({
                    clave: `p${producto.id_producto}-v${variante.id_variante}`,
                    id_producto: producto.id_producto,
                    id_variante: variante.id_variante,
                    nombre: producto.nombre,
                    tono: variante.tono,
                    color: variante.color || null,
                    imagen: variante.imagenes?.[0]?.imagen || imagenGeneral,
                    stock: Number(variante.stock || 0),
                    precio: variante.precio ?? producto.precio,
                    categoria: producto.categoria?.nombre || "—",
                    id_categoria: producto.id_categoria,
                    estado: producto.estado !== false && variante.estado !== false,
                    esVariante: true,
                });
            }

            continue;
        }

        items.push({
            clave: `p${producto.id_producto}`,
            id_producto: producto.id_producto,
            id_variante: null,
            nombre: producto.nombre,
            tono: null,
            color: null,
            imagen: imagenGeneral,
            stock: Number(producto.stock || 0),
            precio: producto.precio,
            categoria: producto.categoria?.nombre || "—",
            id_categoria: producto.id_categoria,
            estado: producto.estado !== false,
            esVariante: false,
        });
    }

    return items;
};

export const estadoInventario = (stock: number, umbral: number = STOCK_MINIMO): EstadoStock => {
    if (stock <= 0) return "agotado";
    if (stock <= umbral) return "bajo";
    return "disponible";
};

export const ETIQUETA_ESTADO: Record<EstadoStock, string> = {
    agotado: "Agotado",
    bajo: "Stock bajo",
    disponible: "Disponible",
};
