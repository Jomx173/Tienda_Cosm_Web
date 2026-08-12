import type { Pedido } from "../../../services/types";
import { CreateActions } from "../../../storeConfig";

export const NAME = "pedidos";

export declare namespace Type {
    export type PedidosState = {
        pedidos: Pedido[];
        cargando: boolean;
        error: string | null;
    }
}

export const Action = CreateActions<{
    setPedidos: Pedido[];
    setCargando: boolean;
    setError: string | null;
    cleanStore: void;
}>(NAME, ["setPedidos", "setCargando", "setError", "cleanStore"]);

export const INIT: Type.PedidosState = {
    pedidos: [],
    cargando: false,
    error: null,
};
