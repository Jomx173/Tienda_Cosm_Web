import api from "./api";
import type { AdminInfo, RespuestaApi } from "./types";

export const login = async (identidad: string, password: string): Promise<AdminInfo> => {
    const res = await api.post<RespuestaApi<{ token: string; admin: AdminInfo }>>(
        "/auth/login",
        { identidad, password }
    );

    const { token, admin } = res.data.data;

    localStorage.setItem("token", token);
    localStorage.setItem("admin", JSON.stringify(admin));

    return admin;
};

export const logout = (): void => {
    localStorage.removeItem("token");
    localStorage.removeItem("admin");
};

export const getAdmin = (): AdminInfo | null => {
    const raw = localStorage.getItem("admin");
    if (!raw) return null;
    try {
        return JSON.parse(raw) as AdminInfo;
    } catch {
        return null;
    }
};

export const guardarAdmin = (admin: AdminInfo): void => {
    localStorage.setItem("admin", JSON.stringify(admin));
};

export const estaAutenticado = (): boolean => Boolean(localStorage.getItem("token"));

export const obtenerPerfil = async (): Promise<AdminInfo> => {
    const res = await api.get<RespuestaApi<AdminInfo>>("/administradores/me");
    return res.data.data;
};

export const actualizarPerfil = async (datos: Partial<AdminInfo>): Promise<AdminInfo> => {
    const res = await api.put<RespuestaApi<AdminInfo>>("/administradores/me", datos);
    return res.data.data;
};

export const cambiarPassword = async (datos: {
    passwordActual: string;
    passwordNueva: string;
}): Promise<RespuestaApi> => {
    const res = await api.put<RespuestaApi>("/administradores/me/password", datos);
    return res.data;
};
