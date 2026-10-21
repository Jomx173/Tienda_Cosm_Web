import { CreateReducer } from "../../../storeConfig";
import { Action, INIT, claveItem } from "./namespace";
import type { ItemCarrito } from "../../../services/types";

export default CreateReducer(INIT, ({ addCase }) => {
    addCase(Action.vaciar, (state) => ({
        ...state,
        items: [],
    }));

    addCase(Action.agregar, (state, { payload }) => {
        const idProductoReal =
            payload.producto.id_producto ?? payload.producto.id ?? 0;

        const idVariante = payload.variante?.id_variante ?? null;
        const cantidad = payload.cantidad || 1;

        // Clave unica de la linea: producto + variante.
        // Para productos sin variantes conserva el comportamiento antiguo.
        const clave = claveItem(idProductoReal, idVariante);

        const existe = state.items.find((item) => item.id === clave);

        if (existe) {
            return {
                ...state,
                items: state.items.map((item) =>
                    item.id === clave
                        ? { ...item, cantidad: item.cantidad + cantidad }
                        : item
                ),
            };
        }

        const precio = payload.variante?.precio ?? payload.producto.precio;

        const stock = payload.variante?.stock ?? payload.producto.stock;

        const nuevo: ItemCarrito = {
            id: clave,
            id_producto: idProductoReal,
            id_variante: idVariante,
            tono: payload.variante?.tono ?? null,
            nombre: payload.producto.nombre,
            precio,
            imagen: payload.producto.imagen || "",
            cantidad,
            stock: stock === undefined || stock === null ? undefined : Number(stock),
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
                item.id === payload.id
                    ? {
                        ...item,
                        cantidad:
                            item.stock !== undefined && item.stock > 0
                                ? Math.min(payload.cantidad, item.stock)
                                : payload.cantidad,
                    }
                    : item
            ),
        };
    });

    addCase(Action.quitar, (state, { payload }) => ({
        ...state,
        items: state.items.filter((item) => item.id !== payload),
    }));
});
