import { useState } from "react";
import Swal from "sweetalert2";

import { FaSearch, FaTimes, FaWhatsapp, FaMapMarkerAlt, FaTrash } from "react-icons/fa";

import {
    actualizarEstadoPedido,
    eliminarPedido,
} from "../../../services/pedidoService";
import type { Pedido } from "../../../services/types";
import { toastExito, toastError } from "../../../utils/toast";
import { formatearPrecio } from "../../../utils/precio";
import site from "../../../config/site";

const ESTADOS: Record<string, string> = {
    pendiente: "Pendiente",
    confirmado: "Confirmado",
    completado: "Completado",
    cancelado: "Cancelado",
};

type Props = {
    pedidos: Pedido[];
    onRecargar: () => Promise<void>;
    onNoAutorizado: (err: unknown) => void;
};

const numeroPedido = (pedido: Pedido) => `#${pedido.id_pedido}`;

const formatearFecha = (fecha: string) => {
    try {
        return new Date(fecha).toLocaleString("es-HN", {
            day: "2-digit",
            month: "2-digit",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
        });
    } catch {
        return fecha || "";
    }
};

const mensajeWhatsAppPedido = (pedido: Pedido) => {
    const lineas = (pedido.productos || [])
        .map(
            (item) =>
                `• ${item.nombre} x${item.cantidad} — ${formatearPrecio(
                    Number(item.precio) * Number(item.cantidad || 1)
                )}`
        )
        .join("\n");

    const nombreCliente = pedido.nombre_cliente ? `, ${pedido.nombre_cliente}` : "";
    const direccion = pedido.direccion
        ? `\n\n📦 Dirección de entrega: ${pedido.direccion}`
        : "";

    const mensajesPorEstado: Record<string, string> = {
        pendiente:
            `¡Hola${nombreCliente}! 👋 Gracias por tu pedido en ${site.nombre}.\n\n` +
            `📋 N.º de pedido: ${numeroPedido(pedido)}\n` +
            `Recibimos tu orden y está en proceso de confirmación.\n\n` +
            `${lineas}\n\nTotal: ${formatearPrecio(pedido.total)}\n\n` +
            `Pronto te escribimos para confirmar. ¡Gracias! 💜`,
        confirmado:
            `¡Hola${nombreCliente}! ✅ Tu pedido en ${site.nombre} fue CONFIRMADO.\n\n` +
            `📋 N.º de pedido: ${numeroPedido(pedido)}\n` +
            `${lineas}\n\nTotal: ${formatearPrecio(pedido.total)}${direccion}\n\n` +
            `Te escribiremos para coordinar el envío. ¡Gracias! 💜`,
        completado:
            `¡Hola${nombreCliente}! 🎉 Tu pedido en ${site.nombre} fue ENTREGADO.\n\n` +
            `📋 N.º de pedido: ${numeroPedido(pedido)}\n` +
            `${lineas}\n\nTotal: ${formatearPrecio(pedido.total)}\n\n` +
            `¡Gracias por tu compra! Te esperamos pronto. 💜`,
        cancelado:
            `¡Hola${nombreCliente}! Lamentamos informarte que tu pedido en ${site.nombre} fue cancelado.\n\n` +
            `📋 N.º de pedido: ${numeroPedido(pedido)}\n` +
            `${lineas}\n\nSi tienes dudas, escríbenos. ¡Gracias! 💜`,
    };

    return encodeURIComponent(
        mensajesPorEstado[pedido.estado || ""] || mensajesPorEstado.pendiente
    );
};

function PedidosSection({ pedidos, onRecargar, onNoAutorizado }: Props) {
    const [busqueda, setBusqueda] = useState("");
    const [filtroEstado, setFiltroEstado] = useState("todos");

    const handleCambiarEstado = async (pedido: Pedido, nuevoEstado: string) => {
        try {
            await actualizarEstadoPedido(pedido.id_pedido, nuevoEstado);
            toastExito("Estado del pedido actualizado");
            await onRecargar();
        } catch (err) {
            onNoAutorizado(err);
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const axiosError = err as any;
            toastError(axiosError?.response?.data?.mensaje || "No se pudo actualizar el pedido");
        }
    };

    const handleEliminar = async (pedido: Pedido) => {
        const confirmacion = await Swal.fire({
            title: "¿Eliminar pedido?",
            text: `Pedido ${numeroPedido(pedido)}. Esta acción no se puede deshacer.`,
            icon: "warning",
            showCancelButton: true,
            confirmButtonText: "Sí, eliminar",
            cancelButtonText: "Cancelar",
            confirmButtonColor: "#d33",
        });

        if (!confirmacion.isConfirmed) return;

        try {
            await eliminarPedido(pedido.id_pedido);
            toastExito("Pedido eliminado");
            await onRecargar();
        } catch (err) {
            onNoAutorizado(err);
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const axiosError = err as any;
            toastError(axiosError?.response?.data?.mensaje || "No se pudo eliminar el pedido");
        }
    };

    const termino = busqueda.trim().toLowerCase();

    const filtrados = pedidos.filter((pedido) => {
        if (filtroEstado !== "todos" && pedido.estado !== filtroEstado) return false;

        if (termino) {
            const numero = numeroPedido(pedido).toLowerCase();
            const nombre = (pedido.nombre_cliente || "").toLowerCase();
            const telefono = (pedido.telefono_cliente || "").toLowerCase();

            if (!numero.includes(termino) && !nombre.includes(termino) && !telefono.includes(termino)) {
                return false;
            }
        }

        return true;
    });

    return (
        <>
            <p className="banner-ayuda">
                Aquí ves los pedidos que los clientes envían desde la tienda, con el
                total que debes cobrar. Cambia el estado a medida que los atiendes.
            </p>

            {pedidos.length === 0 ? (
                <p className="sin-productos">Aún no hay pedidos.</p>
            ) : (
                <>
                    <div className="admin-toolbar">
                        <div className="admin-busqueda">
                            <FaSearch className="admin-busqueda-icono" />
                            <input
                                type="text"
                                value={busqueda}
                                onChange={(e) => setBusqueda(e.target.value)}
                                placeholder="Buscar por número, cliente o teléfono..."
                            />
                            {busqueda && (
                                <button
                                    type="button"
                                    className="admin-busqueda-limpiar"
                                    onClick={() => setBusqueda("")}
                                    title="Limpiar búsqueda"
                                >
                                    <FaTimes />
                                </button>
                            )}
                        </div>

                        <div className="admin-filtros">
                            <select
                                className="admin-filtro-select"
                                value={filtroEstado}
                                onChange={(e) => setFiltroEstado(e.target.value)}
                                aria-label="Filtrar por estado"
                            >
                                <option value="todos">Todos los estados</option>
                                {Object.entries(ESTADOS).map(([valor, etiqueta]) => (
                                    <option key={valor} value={valor}>
                                        {etiqueta}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {filtrados.length === 0 ? (
                        <p className="sin-productos">No se encontraron pedidos con esos criterios.</p>
                    ) : (
                        <div className="admin-table">
                            <table>
                                <thead>
                                    <tr>
                                        <th>N°</th>
                                        <th>Fecha</th>
                                        <th>Cliente</th>
                                        <th>Productos</th>
                                        <th>Total</th>
                                        <th>Estado</th>
                                        <th>Acciones</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filtrados.map((pedido) => (
                                        <tr key={pedido.id_pedido}>
                                            <td>{numeroPedido(pedido)}</td>
                                            <td>{formatearFecha(pedido.fecha || "")}</td>
                                            <td>
                                                <div>{pedido.nombre_cliente || "Cliente"}</div>
                                                {pedido.telefono_cliente && (
                                                    <div className="pedido-telefono">
                                                        {pedido.telefono_cliente}
                                                    </div>
                                                )}
                                                {pedido.direccion && (
                                                    <div className="pedido-telefono">
                                                        <FaMapMarkerAlt /> {pedido.direccion}
                                                    </div>
                                                )}
                                            </td>
                                            <td>
                                                <ul className="pedido-productos">
                                                    {(pedido.productos || []).map((item, i) => (
                                                        <li key={i}>
                                                            {item.nombre} × {item.cantidad}
                                                        </li>
                                                    ))}
                                                </ul>
                                            </td>
                                            <td className="pedido-total">
                                                {formatearPrecio(pedido.total)}
                                            </td>
                                            <td>
                                                <select
                                                    className={`chip-estado ${pedido.estado}`}
                                                    value={pedido.estado}
                                                    onChange={(e) =>
                                                        handleCambiarEstado(pedido, e.target.value)
                                                    }
                                                >
                                                    {Object.entries(ESTADOS).map(([valor, etiqueta]) => (
                                                        <option key={valor} value={valor}>
                                                            {etiqueta}
                                                        </option>
                                                    ))}
                                                </select>
                                            </td>
                                            <td className="acciones">
                                                {pedido.telefono_cliente && (
                                                    <a
                                                        href={`https://wa.me/${pedido.telefono_cliente.replace(/\D/g, "")}?text=${mensajeWhatsAppPedido(pedido)}`}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        title={`Avisar al cliente: pedido ${ESTADOS[pedido.estado || ""] || pedido.estado}`}
                                                        className="accion-whatsapp"
                                                    >
                                                        <FaWhatsapp />
                                                    </a>
                                                )}
                                                <button
                                                    onClick={() => handleEliminar(pedido)}
                                                    title="Eliminar"
                                                >
                                                    <FaTrash />
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </>
            )}
        </>
    );
}

export default PedidosSection;
