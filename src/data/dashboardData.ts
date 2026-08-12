import type { Pedido, Producto } from "../services/types";

export const STOCK_MINIMO = 5;

export const ESTADOS_LABEL: Record<string, string> = {
    pendiente: "Pendiente",
    confirmado: "Confirmado",
    completado: "Entregado",
    cancelado: "Cancelado",
};

export type RangoReporte = {
    desde?: string;
    hasta?: string;
    soloMes?: boolean;
};

type PuntoDia = {
    dia: string;
    fecha: string;
    ventas: number;
};

type TopProducto = {
    nombre: string;
    vendidos: number;
    ingreso: number;
    precio: number;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    producto: any;
};

type Actividad = {
    texto: string;
    tiempo: Date;
};

type SegmentoDona = {
    etiqueta: string;
    valor: number;
    color: string;
    porcentaje: number;
};

export type ReporteData = {
    ventasDia: number;
    ventasMes: number;
    ingresosTotales: number;
    pendientes: number;
    confirmados: number;
    entregados: number;
    cancelados: number;
    pedidosTotales: number;
    totalPedidos: number;
    variaciones: Record<string, number>;
    stockBajo: Producto[];
    ventasDiarias: PuntoDia[];
    topProductos: TopProducto[];
    actividad: Actividad[];
    dona: SegmentoDona[];
    hayReales: boolean;
    rangoActivo: boolean;
};

const esMismoDia = (a: Date, b: Date) =>
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate();

const esMismoMes = (a: Date, b: Date) =>
    a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth();

export function calcularReporte(
    productos: Producto[] = [],
    pedidos: Pedido[] = [],
    { desde = "", hasta = "", soloMes = false }: RangoReporte = {}
): ReporteData {
    const hayReales = pedidos.length > 0;
    let lista = hayReales ? pedidos : [];

    const rangoActivo = !!(desde || hasta);

    if (hayReales && rangoActivo) {
        lista = lista.filter((p) => {
            const f = new Date(p.fecha || "");
            if (isNaN(f.getTime())) return true;

            const local = `${f.getFullYear()}-${String(f.getMonth() + 1).padStart(2, "0")}-${String(
                f.getDate()
            ).padStart(2, "0")}`;

            if (desde && local < desde) return false;
            if (hasta && local > hasta) return false;

            return true;
        });
    }

    const productosActivos = productos.filter((p) => p.estado);

    const ahora = new Date();

    const listaMes = soloMes
        ? lista.filter((p) => esMismoMes(new Date(p.fecha || ""), ahora))
        : lista;

    const pedidosValidos = listaMes.filter((p) => p.estado !== "cancelado");

    const ayer = new Date(ahora.getTime() - 86400000);

    const ventasDia = pedidosValidos
        .filter((p) => esMismoDia(new Date(p.fecha || ""), ahora))
        .reduce((s, p) => s + Number(p.total), 0);

    const ventasAyer = pedidosValidos
        .filter((p) => esMismoDia(new Date(p.fecha || ""), ayer))
        .reduce((s, p) => s + Number(p.total), 0);

    const ventasMes = pedidosValidos
        .filter((p) => esMismoMes(new Date(p.fecha || ""), ahora))
        .reduce((s, p) => s + Number(p.total), 0);

    const ingresosTotales = pedidosValidos.reduce((s, p) => s + Number(p.total), 0);

    const pendientes = lista.filter((p) => p.estado === "pendiente").length;
    const confirmados = lista.filter((p) => p.estado === "confirmado").length;
    const entregados = pedidosValidos.filter((p) => p.estado === "completado").length;
    const cancelados = lista.filter((p) => p.estado === "cancelado").length;
    const pedidosTotales = pedidosValidos.length;
    const totalPedidos = lista.length;

    const variaciones: Record<string, number> = {
        ventasDia: hayReales && ventasAyer > 0
            ? Math.round(((ventasDia - ventasAyer) / ventasAyer) * 100)
            : 0,
        ventasMes: 0,
        ingresosTotales: 0,
        pedidosTotales: 0,
        pendientes: 0,
        entregados: 0,
        cancelados: 0,
    };

    const stockBajo = productosActivos
        .filter((p) => Number(p.stock) <= STOCK_MINIMO)
        .sort((a, b) => Number(a.stock) - Number(b.stock))
        .slice(0, 5);

    const dias: PuntoDia[] = [];
    for (let i = 6; i >= 0; i--) {
        const d = new Date(ahora.getTime() - i * 86400000);
        const etiqueta = d.toLocaleDateString("es-HN", { weekday: "short" });

        dias.push({
            dia: etiqueta.charAt(0).toUpperCase() + etiqueta.slice(1),
            fecha: `${d.getDate()}/${d.getMonth() + 1}`,
            ventas: 0,
        });
    }

    pedidosValidos.forEach((p) => {
        const f = new Date(p.fecha || "");
        if (isNaN(f.getTime())) return;

        const idx = dias.findIndex(
            (d) => d.fecha === `${f.getDate()}/${f.getMonth() + 1}`
        );

        if (idx !== -1) {
            dias[idx].ventas += Number(p.total);
        }
    });

    const ventasDiarias = dias;

    const mapaProducto: Record<string, Producto> = {};
    productos.forEach((p) => {
        if (p.nombre) mapaProducto[p.nombre] = p;
    });

    const conteo: Record<string, { vendidos: number; ingreso: number }> = {};
    lista.forEach((p) => {
        (p.productos || []).forEach((item) => {
            if (!item.nombre) return;

            if (!conteo[item.nombre]) {
                conteo[item.nombre] = { vendidos: 0, ingreso: 0 };
            }

            conteo[item.nombre].vendidos += Number(item.cantidad || 1);
            conteo[item.nombre].ingreso +=
                Number(item.precio) * Number(item.cantidad || 1);
        });
    });

    const topProductos: TopProducto[] = Object.entries(conteo)
        .map(([nombre, valores]) => ({
            nombre,
            ...valores,
            precio: valores.ingreso / Math.max(valores.vendidos, 1),
            producto: mapaProducto[nombre] || null,
        }))
        .sort((a, b) => b.vendidos - a.vendidos)
        .slice(0, 5);

    const recientes = [...lista]
        .sort((a, b) => b.id_pedido - a.id_pedido)
        .slice(0, 5)
        .map((p) => ({
            texto: `Pedido #${p.id_pedido} ${p.nombre_cliente || "de un cliente"} — ${ESTADOS_LABEL[p.estado || ""] || p.estado}`,
            tiempo: new Date(p.fecha || ""),
        }));

    const actividad = recientes;

    const totalEstados = pendientes + confirmados + entregados + cancelados;

    const dona: SegmentoDona[] = [
        { etiqueta: "Pendientes", valor: pendientes, color: "#D9AE55" },
        { etiqueta: "Enviados", valor: confirmados, color: "#3F7A5D" },
        { etiqueta: "Entregados", valor: entregados, color: "#6B1420" },
        { etiqueta: "Cancelados", valor: cancelados, color: "#C9542E" },
    ].map((seg) => ({
        ...seg,
        porcentaje:
            totalEstados > 0 ? Math.round((seg.valor / totalEstados) * 100) : 0,
    }));

    return {
        ventasDia,
        ventasMes,
        ingresosTotales,
        pendientes,
        confirmados,
        entregados,
        cancelados,
        pedidosTotales,
        totalPedidos,
        variaciones,
        stockBajo,
        ventasDiarias,
        topProductos,
        actividad,
        dona,
        hayReales,
        rangoActivo,
    };
}
