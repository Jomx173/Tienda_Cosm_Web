import { CreateFetchers } from "../../../storeConfig";
import { NAME } from "./namespace";
import {
    obtenerPedidos,
    actualizarEstadoPedido,
    eliminarPedido,
} from "../../../services/pedidoService";

export default CreateFetchers(NAME, {
    async getPedidos() {
        const data = await obtenerPedidos();
        return { pedidos: data ?? [] };
    },
    async updateEstado(params: { id: number; estado: string }) {
        const data = await actualizarEstadoPedido(params.id, params.estado);
        return { pedido: data };
    },
    async removePedido(id: number) {
        await eliminarPedido(id);
        return { id };
    },
});
