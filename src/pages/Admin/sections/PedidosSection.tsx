import { useState } from "react";
import Swal from "sweetalert2";

import { FaSearch, FaTimes, FaWhatsapp, FaMapMarkerAlt, FaTrash, FaEye } from "react-icons/fa";

import {
    actualizarEstadoPedido,
    eliminarPedido,
} from "../../../services/pedidoService";
import type { Pedido } from "../../../services/types";
import { toastExito, toastError } from "../../../utils/toast";
import { formatearPrecio } from "../../../utils/precio";
import { enlaceWhatsAppPedido } from "../../../utils/mensajesPedido";

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

const escaparHtml = (texto: string) =>
    String(texto)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;");

function PedidosSection({ pedidos, onRecargar, onNoAutorizado }: Props) {
    const [busqueda, setBusqueda] = useState("");
    const [filtroEstado, setFiltroEstado] = useState("todos");

    const verDetalle = async (pedido: Pedido) => {
        const filas = (pedido.productos || [])
            .map((item) => {
                const cantidad = Number(item.cantidad || 0);
                const precio = Number(item.precio || 0);
                const subtotal = precio * cantidad;

                return (
                    `<tr style="border-bottom:1px solid #f3ece6">` +
                    `<td style="padding:7px 6px">${escaparHtml(item.nombre || "Producto")}</td>` +
                    `<td style="padding:7px 6px">${escaparHtml(item.tono || "No aplica")}</td>` +
                    `<td style="padding:7px 6px;text-align:center">${cantidad}</td>` +
                    `<td style="padding:7px 6px;text-align:right">${formatearPrecio(precio)}</td>` +
                    `<td style="padding:7px 6px;text-align:right">${formatearPrecio(subtotal)}</td>` +
                    `</tr>`
                );
            })
            .join("");

        await Swal.fire({
            title: `Pedido #${pedido.id_pedido}`,
            width: 720,
            html:
                `<div style="text-align:left;font-size:13px;line-height:1.6;color:#3A1F24">` +
                `<p><strong>Cliente:</strong> ${escaparHtml(pedido.nombre_cliente || "—")}</p>` +
                `<p><strong>Teléfono:</strong> ${escaparHtml(pedido.telefono_cliente || "—")}</p>` +
                `<p><strong>Dirección:</strong> ${escaparHtml(pedido.direccion || "—")}</p>` +
                `<p><strong>Fecha:</strong> ${escaparHtml(formatearFecha(pedido.fecha || ""))}</p>` +
                `<p><strong>Estado:</strong> ${escaparHtml(ESTADOS[pedido.estado || ""] || pedido.estado || "—")}</p>` +
                `<table style="width:100%;border-collapse:collapse;margin-top:10px">` +
                `<thead><tr style="text-align:left;border-bottom:1px solid #e8ddd3">` +
                `<th style="padding:6px">Descripción</th>` +
                `<th style="padding:6px">Tono</th>` +
                `<th style="padding:6px;text-align:center">Cant.</th>` +
                `<th style="padding:6px;text-align:right">P. Unit</th>` +
                `<th style="padding:6px;text-align:right">Subtotal</th>` +
                `</tr></thead><tbody>${filas}</tbody></table>` +
                `<p style="text-align:right;margin-top:12px"><strong>Total: ${formatearPrecio(pedido.total)}</strong></p>` +
                `</div>`,
            confirmButtonText: "Cerrar",
            confirmButtonColor: "#701522",
        });
    };

    const abrirEnlace = (url: string) => {
        window.open(url, "_blank", "noopener,noreferrer");
    };

    const ofrecerAvisoCliente = async (pedido: Pedido, nuevoEstado: string) => {
        const enlace = enlaceWhatsAppPedido(
            { ...pedido, estado: nuevoEstado },
            nuevoEstado
        );

        if (!enlace) return;

        const textos: Record<string, { titulo: string; mensaje: string }> = {
            confirmado: {
                titulo: "Pedido confirmado ✅",
                mensaje: "¿Le enviamos la confirmación al cliente por WhatsApp?",
            },
            completado: {
                titulo: "Pedido entregado 🎉",
                mensaje: "¿Le enviamos el agradecimiento por su compra?",
            },
            cancelado: {
                titulo: "Pedido cancelado",
                mensaje: "¿Le avisamos al cliente por WhatsApp?",
            },
        };

        const texto = textos[nuevoEstado];

        if (!texto) return;

        const resultado = await Swal.fire({
            icon: nuevoEstado === "cancelado" ? "info" : "success",
            title: texto.titulo,
            text: texto.mensaje,
            showCancelButton: true,
            confirmButtonText: "Enviar WhatsApp",
            cancelButtonText: "Ahora no",
            confirmButtonColor: "#25D366",
            cancelButtonColor: "#8d2033",
        });

        if (resultado.isConfirmed) abrirEnlace(enlace);
    };

    /**
     * Recorre los pedidos pendientes uno por uno con el mensaje listo:
     * "Enviar y siguiente" abre WhatsApp y pasa al siguiente; "Saltar" lo
     * omite; la X cierra la cola.
     */
    const atenderPendientes = async () => {
        const pendientes = pedidos
            .filter((pedido) => (pedido.estado || "pendiente") === "pendiente")
            .sort((a, b) => Number(a.id_pedido) - Number(b.id_pedido));

        if (pendientes.length === 0) {
            await Swal.fire({
                icon: "info",
                title: "Sin pedidos pendientes",
                text: "Todos los pedidos están atendidos.",
            });
            return;
        }

        for (let indice = 0; indice < pendientes.length; indice++) {
            const pedido = pendientes[indice];
            const enlace = enlaceWhatsAppPedido(pedido, "pendiente");
            const restantes = pendientes.length - indice;

            const resultado = await Swal.fire({
                title: `Pedido ${numeroPedido(pedido)}`,
                html:
                    `<div style="text-align:left;font-size:14px;line-height:1.7">` +
                    `<strong>${escaparHtml(pedido.nombre_cliente || "Cliente")}</strong><br>` +
                    `📞 ${escaparHtml(pedido.telefono_cliente || "sin teléfono")}<br>` +
                    `🛒 ${(pedido.productos || []).length} producto(s) · <strong>${formatearPrecio(pedido.total)}</strong><br>` +
                    `<span style="color:#8a7f81">Quedan ${restantes} pendiente(s)</span>` +
                    `</div>`,
                showCancelButton: true,
                showDenyButton: true,
                confirmButtonText: enlace ? "Enviar y siguiente" : "Siguiente",
                cancelButtonText: "Saltar",
                denyButtonText: "Cerrar",
                confirmButtonColor: "#25D366",
                cancelButtonColor: "#8d2033",
                denyButtonColor: "#6b6b6b",
            });

            if (resultado.isDenied || resultado.isDismissed) break;

            if (resultado.isConfirmed && enlace) {
                abrirEnlace(enlace);
            }
        }
    };

    const pendientesCount = pedidos.filter(
        (pedido) => (pedido.estado || "pendiente") === "pendiente"
    ).length;

    const handleCambiarEstado = async (pedido: Pedido, nuevoEstado: string) => {
        try {
            await actualizarEstadoPedido(pedido.id_pedido, nuevoEstado);
            toastExito("Estado del pedido actualizado");
            await onRecargar();

            if (["confirmado", "completado", "cancelado"].includes(nuevoEstado)) {
                await ofrecerAvisoCliente(pedido, nuevoEstado);
            }
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

                            {pendientesCount > 0 && (
                                <button
                                    type="button"
                                    className="btn-atender"
                                    onClick={atenderPendientes}
                                    title="Recorrer los pedidos pendientes y avisar a cada cliente"
                                >
                                    <FaWhatsapp />
                                    Atender pendientes ({pendientesCount})
                                </button>
                            )}
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
                                                <table className="pedido-recibo">
                                                    <thead>
                                                        <tr>
                                                            <th>Descripción</th>
                                                            <th>Tono</th>
                                                            <th className="recibo-centro">Cant.</th>
                                                            <th className="recibo-derecha">P. Unit</th>
                                                            <th className="recibo-derecha">Subtotal</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody>
                                                        {(pedido.productos || []).map((item, i) => {
                                                            const cantidad = Number(item.cantidad || 0);
                                                            const precio = Number(item.precio || 0);
                                                            const subtotal = precio * cantidad;

                                                            return (
                                                                <tr key={i}>
                                                                    <td className="recibo-desc">
                                                                        {item.nombre || "Producto"}
                                                                    </td>
                                                                    <td>{item.tono || "No aplica"}</td>
                                                                    <td className="recibo-centro">
                                                                        {cantidad}
                                                                    </td>
                                                                    <td className="recibo-derecha">
                                                                        {formatearPrecio(precio)}
                                                                    </td>
                                                                    <td className="recibo-derecha">
                                                                        {formatearPrecio(subtotal)}
                                                                    </td>
                                                                </tr>
                                                            );
                                                        })}
                                                    </tbody>
                                                </table>
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
                                                <button
                                                    type="button"
                                                    className="accion-ver"
                                                    onClick={() => verDetalle(pedido)}
                                                    title="Ver detalle del pedido"
                                                >
                                                    <FaEye />
                                                </button>
                                                {pedido.telefono_cliente && (
                                                    <a
                                                        href={enlaceWhatsAppPedido(pedido) || "#"}
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
