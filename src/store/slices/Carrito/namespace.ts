import type { ItemCarrito } from "../../../services/types";
import { CreateActions } from "../../../storeConfig";

export const NAME = "carrito";

export declare namespace Type {
    export type CarritoState = {
        items: ItemCarrito[];
    }
}

export type ProductoCarrito = {
    id?: number;
    id_producto?: number;
    nombre: string;
    precio: number | string;
    imagen?: string | null;
    stock?: number | string;
};

export type VarianteCarrito = {
    id_variante: number;
    tono: string;
    precio?: number | string;
    stock?: number;
};

export const Action = CreateActions<{
    agregar: {
        producto: ProductoCarrito;
        cantidad: number;
        variante?: VarianteCarrito | null;
    };
    /** id es la clave de la linea del carrito: `${id_producto}::${id_variante ?? 0}` */
    cambiarCantidad: { id: string; cantidad: number };
    quitar: string;
    vaciar: void;
}>(NAME, ["agregar", "cambiarCantidad", "quitar", "vaciar"]);

export const INIT: Type.CarritoState = {
    items: [],
};

/** Clave única de una línea: producto + variante */
export const claveItem = (idProducto: number, idVariante?: number | null) =>
    `${idProducto}::${idVariante ?? 0}`;
