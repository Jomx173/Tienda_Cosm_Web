import { CreateSelector } from "../../../storeConfig";
import type { StoreState } from "../../../store";
import type { Type } from "./namespace";
import { NAME } from "./namespace";

export default function Selector(store: StoreState): Type.CarritoState {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return ((store as any)[NAME] as Type.CarritoState) ?? { items: [] };
}

Selector.getItems = CreateSelector(Selector, (state) => state.items);

Selector.getCantidadTotal = CreateSelector(Selector, (state) =>
    state.items.reduce((suma, item) => suma + item.cantidad, 0)
);

Selector.getTotal = CreateSelector(Selector, (state) =>
    state.items.reduce(
        (suma, item) => suma + Number(item.precio) * item.cantidad,
        0
    )
);
