import api from "./api";

export const obtenerProductos = async (todos = false) => {
    const res = await api.get(`/productos${todos ? "?todos=1" : ""}`);
    return res.data.data;
};

export const obtenerProducto = async (id) => {
    const res = await api.get(`/productos/${id}`);
    return res.data.data;
};

export const obtenerCategorias = async () => {
    const res = await api.get("/categorias");
    return res.data.data;
};

export const crearCategoria = async (datos) => {
    const res = await api.post("/categorias", datos);
    return res.data.data;
};

export const actualizarCategoria = async (id, datos) => {
    const res = await api.put(`/categorias/${id}`, datos);
    return res.data.data;
};

export const eliminarCategoria = async (id) => {
    const res = await api.delete(`/categorias/${id}`);
    return res.data;
};

export const crearProducto = async (datos) => {
    const res = await api.post("/productos", datos);
    return res.data.data;
};

export const actualizarProducto = async (id, datos) => {
    const res = await api.put(`/productos/${id}`, datos);
    return res.data.data;
};

export const eliminarProducto = async (id) => {
    const res = await api.delete(`/productos/${id}`);
    return res.data;
};

export const obtenerBanners = async (todos = false) => {
    const res = await api.get(`/banners${todos ? "?todos=1" : ""}`);
    return res.data.data;
};

export const crearBanner = async (datos) => {
    const res = await api.post("/banners", datos);
    return res.data.data;
};

export const actualizarBanner = async (id, datos) => {
    const res = await api.put(`/banners/${id}`, datos);
    return res.data.data;
};

export const eliminarBanner = async (id) => {
    const res = await api.delete(`/banners/${id}`);
    return res.data;
};
