import api from "./api";

export const crearPedido = async (datos) => {
    const res = await api.post("/pedidos", datos);
    return res.data.data;
};

export const obtenerPedidos = async () => {
    const res = await api.get("/pedidos");
    return res.data.data;
};

export const actualizarEstadoPedido = async (id, estado) => {
    const res = await api.put(`/pedidos/${id}/estado`, { estado });
    return res.data.data;
};

export const eliminarPedido = async (id) => {
    const res = await api.delete(`/pedidos/${id}`);
    return res.data;
};
