import type { Banner, Categoria, Producto } from "../../../services/types";
import { CreateActions } from "../../../storeConfig";

export const NAME = "catalogo";

export declare namespace Type {
    export type CatalogoState = {
        productos: Producto[];
        categorias: Categoria[];
        banners: Banner[];
        cargando: boolean;
        error: string | null;
    }
}

export const Action = CreateActions<{
    setProductos: Producto[];
    setCategorias: Categoria[];
    setBanners: Banner[];
    setCargando: boolean;
    setError: string | null;
    cleanStore: void;
}>(NAME, ["setProductos", "setCategorias", "setBanners", "setCargando", "setError", "cleanStore"]);

export const INIT: Type.CatalogoState = {
    productos: [],
    categorias: [],
    banners: [],
    cargando: false,
    error: null,
};
