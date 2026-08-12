import type { AdminInfo } from "../../../services/types";
import { CreateActions } from "../../../storeConfig";

export const NAME = "auth";

export declare namespace Type {
    export type AuthState = {
        admin: AdminInfo | null;
        autenticado: boolean;
    }
}

export const Action = CreateActions<{
    setAdmin: AdminInfo | null;
    setAutenticado: boolean;
    cleanStore: void;
}>(NAME, ["setAdmin", "setAutenticado", "cleanStore"]);

export const INIT: Type.AuthState = {
    admin: null,
    autenticado: false,
};
