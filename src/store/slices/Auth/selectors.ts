import { CreateSelector } from "../../../storeConfig";
import type { StoreState } from "../../../store";
import type { Type } from "./namespace";
import { NAME } from "./namespace";

export default function Selector(store: StoreState): Type.AuthState {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return ((store as any)[NAME] as Type.AuthState) ?? {
        admin: null,
        autenticado: false,
    };
}

Selector.getAdmin = CreateSelector(Selector, (state) => state.admin);
Selector.getAutenticado = CreateSelector(Selector, (state) => state.autenticado);
