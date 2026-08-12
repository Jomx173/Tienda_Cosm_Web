import axios from "axios";
import type { AxiosRequestConfig } from "axios";

import { traducirMensajeError } from "../utils/errores";

// La API se sirve bajo /api (proxy de Vite en desarrollo).
export const API_URL: string = import.meta.env.VITE_API_URL || "/api";

export const config: AxiosRequestConfig = {
  baseURL: API_URL,
  headers: {
    "X-Requested-With": "XMLHttpRequest",
  },
};

const api = axios.create(config);

api.interceptors.request.use(
    async (config) => {
        const TOKEN = localStorage.getItem("token");
        if (TOKEN) {
            config.headers.set({ Authorization: `Bearer ${TOKEN}` });
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    });

api.interceptors.response.use(
    (response) => response,
    (error) => {
        const status = error?.response?.status;
        const url = error?.config?.url || "";
        const esEndpointLogin = url.includes("/auth/login") || url.includes("/auth/register");

        if (status === 401 && !esEndpointLogin) {
            localStorage.removeItem("token");
            localStorage.removeItem("admin");
            window.location.href = "/login";
        }

        const respuesta = error?.response?.data;
        if (respuesta && typeof respuesta.mensaje === "string") {
            respuesta.mensaje = traducirMensajeError(respuesta.mensaje);
        }

        return Promise.reject(error);
    });

export default api;
