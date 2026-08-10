import api from "./api";

export const login = async (identidad, password) => {
    const res = await api.post("/auth/login", { identidad, password });

    const { token, admin } = res.data.data;

    localStorage.setItem("token", token);
    localStorage.setItem("admin", JSON.stringify(admin));

    return admin;
};

export const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("admin");
};

export const getAdmin = () => {
    const raw = localStorage.getItem("admin");
    return raw ? JSON.parse(raw) : null;
};

export const estaAutenticado = () => Boolean(localStorage.getItem("token"));
