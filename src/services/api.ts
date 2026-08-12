import { API_URL } from "../utilities/axiosConfig";

export const rutaImagen = (imagen: string | null | undefined): string => {
    if (!imagen) return "";
    if (/^https?:\/\//.test(imagen)) return imagen;
    if (API_URL.startsWith("http")) {
        try {
            const origen = new URL(API_URL).origin;
            return `${origen}${imagen.startsWith("/") ? imagen : `/${imagen}`}`;
        } catch {
            return imagen;
        }
    }
    return imagen;
};

export { default } from "../utilities/axiosConfig";
