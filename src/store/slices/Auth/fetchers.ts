import { CreateFetchers } from "../../../storeConfig";
import { NAME } from "./namespace";
import {
    login,
    logout,
    obtenerPerfil,
} from "../../../services/authService";
import type { AdminInfo } from "../../../services/types";

export default CreateFetchers(NAME, {
    async login(params: { identidad: string; password: string }): Promise<{ admin: AdminInfo }> {
        const admin = await login(params.identidad, params.password);
        return { admin };
    },
    async logout(): Promise<void> {
        logout();
    },
    async getPerfil(): Promise<{ admin: AdminInfo }> {
        const admin = await obtenerPerfil();
        return { admin };
    },
});
