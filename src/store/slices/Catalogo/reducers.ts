import { CreateReducer } from "../../../storeConfig";
import { Action, INIT } from "./namespace";

export default CreateReducer(INIT, ({ addCase }) => {
    addCase(Action.cleanStore, (state) => ({
        ...state,
        ...INIT,
    }));

    addCase(Action.setProductos, (state, { payload }) => ({
        ...state,
        productos: payload,
    }));

    addCase(Action.setCategorias, (state, { payload }) => ({
        ...state,
        categorias: payload,
    }));

    addCase(Action.setBanners, (state, { payload }) => ({
        ...state,
        banners: payload,
    }));

    addCase(Action.setCargando, (state, { payload }) => ({
        ...state,
        cargando: payload,
    }));

    addCase(Action.setError, (state, { payload }) => ({
        ...state,
        error: payload,
    }));
});
