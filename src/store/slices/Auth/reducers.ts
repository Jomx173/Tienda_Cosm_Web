import { CreateReducer } from "../../../storeConfig";
import { Action, INIT } from "./namespace";

export default CreateReducer(INIT, ({ addCase }) => {
    addCase(Action.cleanStore, (state) => ({
        ...state,
        ...INIT,
    }));

    addCase(Action.setAdmin, (state, { payload }) => ({
        ...state,
        admin: payload,
    }));

    addCase(Action.setAutenticado, (state, { payload }) => ({
        ...state,
        autenticado: payload,
    }));
});
