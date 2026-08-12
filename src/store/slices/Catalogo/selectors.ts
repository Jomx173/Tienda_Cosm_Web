import { CreateSelector } from "../../../storeConfig";
import type { StoreState } from "../../../store";
import type { Type } from "./namespace";
import { NAME } from "./namespace";

export default function Selector(store: StoreState): Type.CatalogoState {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return ((store as any)[NAME] as Type.CatalogoState) ?? {
        productos: [],
        categorias: [],
        banners: [],
        cargando: false,
        error: null,
    };
}

Selector.getProductos = CreateSelector(Selector, (state) => state.productos);
Selector.getCategorias = CreateSelector(Selector, (state) => state.categorias);
Selector.getBanners = CreateSelector(Selector, (state) => state.banners);
Selector.getCargando = CreateSelector(Selector, (state) => state.cargando);
