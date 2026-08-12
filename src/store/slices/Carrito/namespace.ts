import type { ItemCarrito } from "../../../services/types";
import { CreateActions } from "../../../storeConfig";

export const NAME = "carrito";

export declare namespace Type {
    export type CarritoState = {
        items: ItemCarrito[];
    }
}

export const Action = CreateActions<{
    agregar: { producto: { id?: number; id_producto?: number; nombre: string; precio: number | string; imagen?: string | null }; cantidad: number };
    cambiarCantidad: { id: number; cantidad: number };
    quitar: number;
    vaciar: void;
}>(NAME, ["agregar", "cambiarCantidad", "quitar", "vaciar"]);

export const INIT: Type.CarritoState = {
    items: [],
};
