import { CreateReducer } from "../../../storeConfig";
import { Action, INIT } from "./namespace";
import type { ItemCarrito } from "../../../services/types";

export default CreateReducer(INIT, ({ addCase }) => {
    addCase(Action.vaciar, (state) => ({
        ...state,
        items: [],
    }));

    addCase(Action.agregar, (state, { payload }) => {
        const id = payload.producto.id_producto ?? payload.producto.id ?? 0;
        const cantidad = payload.cantidad || 1;

        const existe = state.items.find((item) => item.id === id);

        if (existe) {
            return {
                ...state,
                items: state.items.map((item) =>
                    item.id === id
                        ? { ...item, cantidad: item.cantidad + cantidad }
                        : item
                ),
            };
        }

        const nuevo: ItemCarrito = {
            id,
            nombre: payload.producto.nombre,
            precio: payload.producto.precio,
            imagen: payload.producto.imagen || "",
            cantidad,
        };

        return {
            ...state,
            items: [...state.items, nuevo],
        };
    });

    addCase(Action.cambiarCantidad, (state, { payload }) => {
        if (payload.cantidad < 1) return state;

        return {
            ...state,
            items: state.items.map((item) =>
                item.id === payload.id ? { ...item, cantidad: payload.cantidad } : item
            ),
        };
    });

    addCase(Action.quitar, (state, { payload }) => ({
        ...state,
        items: state.items.filter((item) => item.id !== payload),
    }));
});
