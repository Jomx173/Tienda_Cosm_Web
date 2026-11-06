import type { Pedido } from "../services/types";
import { formatearPrecio } from "./precio";
import site from "../config/site";

/**
 * Mensajes de WhatsApp para el cliente según el estado del pedido.
 *
 * Nota: WhatsApp no permite enviar mensajes automáticos sin la API oficial
 * (WhatsApp Business / Cloud API). Esto genera el enlace con el texto listo
 * para que la dueña solo tenga que pulsar "Enviar".
 */

const numeroPedido = (pedido: Pedido) => `#${pedido.id_pedido}`;

/**
 * Normaliza el teléfono al formato internacional de Honduras.
 * - 8 dígitos -> 504 + 8 dígitos
 * - 11 dígitos que ya empiezan por 504 -> se dejan
 */
export const normalizarTelefono = (telefono?: string): string | null => {
    const digitos = String(telefono || "").replace(/\D/g, "");

    if (!digitos) return null;

    if (digitos.length === 8) return `504${digitos}`;

    if (digitos.length === 11 && digitos.startsWith("504")) return digitos;

    return digitos;
};

const lineasProductos = (pedido: Pedido): string =>
    (pedido.productos || [])
        .map(
            (item) =>
                `• ${item.nombre} x${item.cantidad} — ${formatearPrecio(
                    Number(item.precio) * Number(item.cantidad || 1)
                )}`
        )
        .join("\n");

export const mensajePedido = (
    pedido: Pedido,
    estado: string = pedido.estado || "pendiente"
): string => {
    const nombre = pedido.nombre_cliente ? `, ${pedido.nombre_cliente}` : "";
    const saludo = `¡Hola${nombre}!`;
    const productos = lineasProductos(pedido);
    const total = formatearPrecio(pedido.total);
    const direccion = pedido.direccion
        ? `\n📦 Entrega: ${pedido.direccion}`
        : "";

    switch (estado) {
        case "confirmado":
            return (
                `${saludo} ✅ Tu pedido en ${site.nombre} quedó CONFIRMADO.\n\n` +
                `📋 Pedido: ${numeroPedido(pedido)}\n` +
                `${productos}\n\nTotal: ${total}${direccion}\n\n` +
                `¡Gracias por tu compra! 💜 Coordinamos la entrega por aquí.`
            );

        case "completado":
            return (
                `${saludo} 🎉 Tu pedido ${numeroPedido(pedido)} fue ENTREGADO.\n\n` +
                `${productos}\n\nTotal: ${total}\n\n` +
                `¡Gracias por tu compra! 💜 Te esperamos pronto.`
            );

        case "cancelado":
            return (
                `${saludo} Lamentamos informarte que tu pedido ${numeroPedido(pedido)} fue cancelado.\n\n` +
                `${productos}\n\n` +
                `Si fue un error o quieres retomarlo, escríbenos por aquí y lo revisamos. 💜`
            );

        case "pendiente":
        default:
            return (
                `${saludo} 👋 ¡Gracias por tu pedido en ${site.nombre}!\n\n` +
                `📋 Pedido: ${numeroPedido(pedido)}\n` +
                `${productos}\n\nTotal: ${total}\n\n` +
                `Recibimos tu orden y estamos confirmando disponibilidad. ` +
                `En un momento te escribimos para coordinar. 💜`
            );
    }
};

/**
 * Enlace de WhatsApp con el mensaje del estado listo para enviar.
 * Devuelve null si el pedido no tiene teléfono.
 */
export const enlaceWhatsAppPedido = (
    pedido: Pedido,
    estado?: string
): string | null => {
    const telefono = normalizarTelefono(pedido.telefono_cliente);

    if (!telefono) return null;

    return `https://wa.me/${telefono}?text=${encodeURIComponent(
        mensajePedido(pedido, estado)
    )}`;
};

/**
 * Resumen que el cliente envía a la tienda al terminar su compra.
 */
export const mensajeConfirmacionPedido = (pedido: Pedido): string => {
    const detalle = (pedido.productos || [])
        .map((item) => {
            const cantidad = Number(item.cantidad || 1);
            const subtotal = Number(item.precio) * cantidad;
            const tono = item.tono ? ` (Tono: ${item.tono})` : " (Tono: No aplica)";

            return `- ${item.nombre}${tono} x${cantidad} - ${formatearPrecio(subtotal)}`;
        })
        .join("\n");

    return (
        `¡Hola! Acabo de hacer el pedido #${pedido.id_pedido} en la web.\n` +
        `Detalle:\n${detalle}\n\n` +
        `Total: ${formatearPrecio(pedido.total)}\n\n` +
        `Quedo a la espera de su confirmación.`
    );
};

/**
 * Enlace directo al WhatsApp de la tienda con el resumen del pedido.
 */
export const enlaceWhatsAppTienda = (pedido: Pedido): string =>
    `${site.whatsappUrl}?text=${encodeURIComponent(
        mensajeConfirmacionPedido(pedido)
    )}`;
