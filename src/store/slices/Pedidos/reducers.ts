import { CreateReducer } from "../../../storeConfig";
import { Action, INIT } from "./namespace";

export default CreateReducer(INIT, ({ addCase }) => {
    addCase(Action.cleanStore, (state) => ({
        ...state,
        ...INIT,
    }));

    addCase(Action.setPedidos, (state, { payload }) => ({
        ...state,
        pedidos: payload,
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
