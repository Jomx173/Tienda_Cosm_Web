import { CreateSelector } from "../../../storeConfig";
import type { StoreState } from "../../../store";
import type { Type } from "./namespace";
import { NAME } from "./namespace";

export default function Selector(store: StoreState): Type.PedidosState {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return ((store as any)[NAME] as Type.PedidosState) ?? {
        pedidos: [],
        cargando: false,
        error: null,
    };
}

Selector.getPedidos = CreateSelector(Selector, (state) => state.pedidos);
Selector.getCargando = CreateSelector(Selector, (state) => state.cargando);
