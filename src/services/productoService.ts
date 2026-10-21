import api from "./api";
import type {
    Banner,
    Categoria,
    Producto,
    ProductoImagen,
    ProductoVariante,
    RespuestaApi,
} from "./types";

export const obtenerProductos = async (todos = false): Promise<Producto[]> => {
    const res = await api.get<RespuestaApi<Producto[]>>(`/productos${todos ? "?todos=1" : ""}`);
    return res.data.data;
};

export const obtenerProducto = async (id: number | string): Promise<Producto> => {
    const res = await api.get<RespuestaApi<Producto>>(`/productos/${id}`);
    return res.data.data;
};

export const obtenerCategorias = async (todos = false): Promise<Categoria[]> => {
    const res = await api.get<RespuestaApi<Categoria[]>>(`/categorias${todos ? "?todos=1" : ""}`);
    return res.data.data;
};

export const crearCategoria = async (datos: Partial<Categoria>): Promise<Categoria> => {
    const res = await api.post<RespuestaApi<Categoria>>("/categorias", datos);
    return res.data.data;
};

export const actualizarCategoria = async (
    id: number,
    datos: Partial<Categoria>
): Promise<Categoria> => {
    const res = await api.put<RespuestaApi<Categoria>>(`/categorias/${id}`, datos);
    return res.data.data;
};

export const eliminarCategoria = async (id: number): Promise<RespuestaApi> => {
    const res = await api.delete<RespuestaApi>(`/categorias/${id}`);
    return res.data;
};

export const crearProducto = async (datos: FormData): Promise<Producto> => {
    const res = await api.post<RespuestaApi<Producto>>("/productos", datos);
    return res.data.data;
};

export const actualizarProducto = async (id: number, datos: FormData): Promise<Producto> => {
    const res = await api.put<RespuestaApi<Producto>>(`/productos/${id}`, datos);
    return res.data.data;
};

export const eliminarProducto = async (id: number): Promise<RespuestaApi> => {
    const res = await api.delete<RespuestaApi>(`/productos/${id}`);
    return res.data;
};

/* =======================
   VARIANTES (tonos)
======================= */

export type DatosVariante = {
    tono: string;
    color?: string | null;
    precio: number | string;
    precio_anterior?: number | string | null;
    stock: number | string;
    codigo?: string | null;
    orden?: number;
    estado?: boolean;
};

export const crearVariante = async (
    idProducto: number,
    datos: DatosVariante
): Promise<ProductoVariante> => {
    const res = await api.post<RespuestaApi<ProductoVariante>>(
        `/productos/${idProducto}/variantes`,
        datos
    );
    return res.data.data;
};

export const actualizarVariante = async (
    idVariante: number,
    datos: DatosVariante
): Promise<ProductoVariante> => {
    const res = await api.put<RespuestaApi<ProductoVariante>>(
        `/productos/variantes/${idVariante}`,
        datos
    );
    return res.data.data;
};

export const eliminarVariante = async (idVariante: number): Promise<RespuestaApi> => {
    const res = await api.delete<RespuestaApi>(`/productos/variantes/${idVariante}`);
    return res.data;
};

/* =======================
   IMAGENES
======================= */

export const subirImagenesProducto = async (
    idProducto: number,
    imagenes: File[],
    idVariante?: number | null
): Promise<ProductoImagen[]> => {
    const formData = new FormData();

    imagenes.forEach((imagen) => formData.append("imagenes", imagen));

    if (idVariante) {
        formData.append("id_variante", String(idVariante));
    }

    const res = await api.post<RespuestaApi<ProductoImagen[]>>(
        `/productos/${idProducto}/imagenes`,
        formData
    );
    return res.data.data;
};

export const eliminarImagenProducto = async (idImagen: number): Promise<RespuestaApi> => {
    const res = await api.delete<RespuestaApi>(`/productos/imagenes/${idImagen}`);
    return res.data;
};

export const buscarProductoDuplicado = async (params: {
    nombre: string;
    id_categoria: number | string | null;
    subcategoria?: string;
    excluir?: number;
}): Promise<Producto | null> => {
    const res = await api.get<RespuestaApi<Producto | null>>("/productos/duplicados", { params });
    return res.data.data;
};

export const obtenerBanners = async (todos = false): Promise<Banner[]> => {
    const res = await api.get<RespuestaApi<Banner[]>>(`/banners${todos ? "?todos=1" : ""}`);
    return res.data.data;
};

export const crearBanner = async (datos: FormData): Promise<Banner> => {
    const res = await api.post<RespuestaApi<Banner>>("/banners", datos);
    return res.data.data;
};

export const actualizarBanner = async (id: number, datos: FormData): Promise<Banner> => {
    const res = await api.put<RespuestaApi<Banner>>(`/banners/${id}`, datos);
    return res.data.data;
};

export const eliminarBanner = async (id: number): Promise<RespuestaApi> => {
    const res = await api.delete<RespuestaApi>(`/banners/${id}`);
    return res.data;
};
