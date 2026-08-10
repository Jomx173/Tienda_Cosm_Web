import axios from "axios";

const api = axios.create({
    baseURL: "/api",
});

api.interceptors.request.use((config) => {
    const token = localStorage.getItem("token");

    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
});

api.interceptors.response.use(
    (res) => res,
    (error) => {
        if (error.response?.status === 401) {
            const url = error.config?.url || "";

            if (!url.includes("/auth/login")) {
                localStorage.removeItem("token");
                localStorage.removeItem("admin");
            }
        }

        return Promise.reject(error);
    }
);

export const rutaImagen = (imagen) => imagen || "";

export default api;
