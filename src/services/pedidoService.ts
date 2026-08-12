import api from "./api";
import type { ItemPedido, Pedido, RespuestaApi } from "./types";

export type CrearPedidoPayload = {
    nombre_cliente: string;
    telefono_cliente: string;
    direccion: string;
    productos: ItemPedido[];
};

export const crearPedido = async (datos: CrearPedidoPayload): Promise<Pedido> => {
    const res = await api.post<RespuestaApi<Pedido>>("/pedidos", datos);
    return res.data.data;
};

export const obtenerPedidos = async (): Promise<Pedido[]> => {
    const res = await api.get<RespuestaApi<Pedido[]>>("/pedidos");
    return res.data.data;
};

export const actualizarEstadoPedido = async (
    id: number,
    estado: string
): Promise<Pedido> => {
    const res = await api.put<RespuestaApi<Pedido>>(`/pedidos/${id}/estado`, { estado });
    return res.data.data;
};

export const eliminarPedido = async (id: number): Promise<RespuestaApi> => {
    const res = await api.delete<RespuestaApi>(`/pedidos/${id}`);
    return res.data;
};
