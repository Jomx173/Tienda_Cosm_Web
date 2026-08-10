import { useMemo } from "react";

import {
    FaMoneyBillWave,
    FaChartLine,
    FaWallet,
    FaShoppingBag,
    FaClock,
    FaCheckCircle,
    FaTimesCircle,
    FaBoxOpen,
    FaArrowUp,
    FaArrowDown,
    FaExclamationTriangle,
} from "react-icons/fa";

import { rutaImagen } from "../../services/api";

import "./Dashboard.css";

// ============================================================
// DATOS DE EJEMPLO (mock)
// Reemplazar por llamadas reales a la API / base de datos.
// El componente intenta usar los pedidos y productos reales que
// recibe como props (productos, pedidos); si no hay datos reales,
// se muestran estos ejemplos para que la vista no quede vacía.
// ============================================================

const MOCK_PEDIDOS = [
    {
        id_pedido: 14,
        nombre_cliente: "María López",
        telefono_cliente: "50499999991",
        productos: [
            { nombre: "Labial Mate Líquido", cantidad: 2, precio: 180 },
            { nombre: "Perfume Floral 100ml", cantidad: 1, precio: 950 },
        ],
        total: 1310,
        estado: "pendiente",
        fecha: new Date(Date.now() - 10 * 60000),
    },
    {
        id_pedido: 13,
        nombre_cliente: "Ana Castillo",
        telefono_cliente: "50499999992",
        productos: [{ nombre: "Paleta de Sombras 12 Colores", cantidad: 1, precio: 420 }],
        total: 420,
        estado: "pendiente",
        fecha: new Date(Date.now() - 55 * 60000),
    },
    {
        id_pedido: 12,
        nombre_cliente: "Carlos Mejía",
        telefono_cliente: "50499999993",
        productos: [{ nombre: "Perfume Amaderado 50ml", cantidad: 1, precio: 780 }],
        total: 780,
        estado: "completado",
        fecha: new Date(Date.now() - 3 * 3600000),
    },
    {
        id_pedido: 11,
        nombre_cliente: "Lucía Fernández",
        telefono_cliente: "50499999994",
        productos: [
            { nombre: "Serum Antimanchas", cantidad: 1, precio: 320 },
            { nombre: "Base Líquida Full Cover", cantidad: 2, precio: 250 },
        ],
        total: 820,
        estado: "completado",
        fecha: new Date(Date.now() - 8 * 3600000),
    },
    {
        id_pedido: 10,
        nombre_cliente: "Jorge Reyes",
        telefono_cliente: "50499999995",
        productos: [{ nombre: "Collar de Perlas Finas", cantidad: 1, precio: 540 }],
        total: 540,
        estado: "cancelado",
        fecha: new Date(Date.now() - 26 * 3600000),
    },
    {
        id_pedido: 9,
        nombre_cliente: "Karla Pineda",
        telefono_cliente: "50499999996",
        productos: [
            { nombre: "Crema Facial Hidratante", cantidad: 1, precio: 300 },
            { nombre: "Protector Solar SPF50", cantidad: 1, precio: 280 },
        ],
        total: 580,
        estado: "completado",
        fecha: new Date(Date.now() - 50 * 3600000),
    },
];

// Ventas diarias de ejemplo para la gráfica (últimos 7 días)
const MOCK_VENTAS_DIARIAS = [
    { dia: "Lun", fecha: "Lun", ventas: 1450 },
    { dia: "Mar", fecha: "Mar", ventas: 980 },
    { dia: "Mié", fecha: "Mié", ventas: 1820 },
    { dia: "Jue", fecha: "Jue", ventas: 1240 },
    { dia: "Vie", fecha: "Vie", ventas: 2150 },
    { dia: "Sáb", fecha: "Sáb", ventas: 1760 },
    { dia: "Dom", fecha: "Dom", ventas: 1320 },
];

const MOCK_TOP_PRODUCTOS = [
    { nombre: "Perfume Floral 100ml", vendidos: 24, precio: 950 },
    { nombre: "Labial Mate Líquido", vendidos: 31, precio: 180 },
    { nombre: "Base Líquida Full Cover", vendidos: 18, precio: 250 },
    { nombre: "Serum Antimanchas", vendidos: 12, precio: 320 },
    { nombre: "Crema Facial Hidratante", vendidos: 9, precio: 300 },
];

// Actividad reciente de ejemplo (pedidos nuevos, cambios de estado, productos agregados)
const MOCK_ACTIVIDAD = [
    { texto: "Nuevo pedido #14 de María López", tiempo: new Date(Date.now() - 10 * 60000) },
    { texto: "Cambio de estado: pedido #12 → Entregado", tiempo: new Date(Date.now() - 45 * 60000) },
    { texto: "Nuevo pedido #13 de Ana Castillo", tiempo: new Date(Date.now() - 55 * 60000) },
    { texto: "Producto agregado: Paleta de Sombras 12 Colores", tiempo: new Date(Date.now() - 2 * 3600000) },
    { texto: "Pedido #11 confirmado", tiempo: new Date(Date.now() - 7 * 3600000) },
];

const ESTADOS_LABEL = {
    pendiente: "Pendiente",
    confirmado: "Confirmado",
    completado: "Entregado",
    cancelado: "Cancelado",
};

function Variacion({ valor, invertir = false }) {
    const sube = valor >= 0;
    const buena = invertir ? !sube : sube;

    return (
        <span className={`dash-variacion ${buena ? "buena" : "mala"}`}>
            {sube ? <FaArrowUp /> : <FaArrowDown />}
            {Math.abs(valor).toFixed(1)}%
        </span>
    );
}

function Dashboard({ productos = [], pedidos = [], onIrA }) {
    // -------- Datos reales o mock --------
    const data = useMemo(() => {
        const hayReales = pedidos.length > 0;
        const lista = hayReales ? pedidos : MOCK_PEDIDOS;
        const productosActivos = productos.filter((p) => p.estado);

        const ahora = new Date();
        const esMismoDia = (a, b) =>
            a.getFullYear() === b.getFullYear() &&
            a.getMonth() === b.getMonth() &&
            a.getDate() === b.getDate();
        const esMismoMes = (a, b) =>
            a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth();

        const pedidosValidos = lista.filter((p) => p.estado !== "cancelado");

        // --- Ventas del día y del mes (reales si hay datos) ---
        const ayer = new Date(ahora.getTime() - 86400000);

        const ventasDia = pedidosValidos
            .filter((p) => esMismoDia(new Date(p.fecha), ahora))
            .reduce((s, p) => s + Number(p.total), 0);

        const ventasAyer = pedidosValidos
            .filter((p) => esMismoDia(new Date(p.fecha), ayer))
            .reduce((s, p) => s + Number(p.total), 0);

        const ventasMes = pedidosValidos
            .filter((p) => esMismoMes(new Date(p.fecha), ahora))
            .reduce((s, p) => s + Number(p.total), 0);

        const ingresosTotales = pedidosValidos.reduce((s, p) => s + Number(p.total), 0);

        const pendientes = lista.filter((p) => p.estado === "pendiente").length;
        const confirmados = lista.filter((p) => p.estado === "confirmado").length;
        const entregados = lista.filter((p) => p.estado === "completado").length;
        const cancelados = lista.filter((p) => p.estado === "cancelado").length;
        const pedidosTotales = pedidosValidos.length;

        // Variaciones (reales donde se puede, mock en el resto)
        const variaciones = {
            ventasDia: hayReales && ventasAyer > 0
                ? Math.round(((ventasDia - ventasAyer) / ventasAyer) * 100)
                : 12.4,
            ventasMes: 8.1,
            ingresosTotales: 15.6,
            pedidosTotales: hayReales ? 9.3 : 6.8,
            pendientes: -4.2,
            entregados: 11.5,
            cancelados: -2.8,
        };

        // --- Stock bajo (real) ---
        const stockBajo = productosActivos
            .filter((p) => Number(p.stock) <= 5)
            .sort((a, b) => a.stock - b.stock)
            .slice(0, 5);

        // --- Ventas diarias de los últimos 7 días ---
        const dias = [];
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
            const f = new Date(p.fecha);
            const idx = dias.findIndex(
                (d) =>
                    d.fecha === `${f.getDate()}/${f.getMonth() + 1}`
            );

            if (idx !== -1) {
                dias[idx].ventas += Number(p.total);
            }
        });

        const ventasDiarias =
            hayReales && dias.some((d) => d.ventas > 0)
                ? dias
                : MOCK_VENTAS_DIARIAS;

        // --- Top productos más vendidos (con precio y thumbnail por nombre) ---
        const mapaProducto = {};
        productos.forEach((p) => {
            if (p.nombre) mapaProducto[p.nombre] = p;
        });

        const conteo = {};

        lista.forEach((p) => {
            (p.productos || []).forEach((item) => {
                if (!conteo[item.nombre]) {
                    conteo[item.nombre] = { vendidos: 0, ingreso: 0 };
                }

                conteo[item.nombre].vendidos += Number(item.cantidad || 1);
                conteo[item.nombre].ingreso +=
                    Number(item.precio) * Number(item.cantidad || 1);
            });
        });

        const topProductos = Object.entries(conteo)
            .map(([nombre, valores]) => ({
                nombre,
                ...valores,
                precio: valores.ingreso / Math.max(valores.vendidos, 1),
                producto: mapaProducto[nombre] || null,
            }))
            .sort((a, b) => b.vendidos - a.vendidos)
            .slice(0, 5);

        const topFinal =
            topProductos.length > 0
                ? topProductos
                : MOCK_TOP_PRODUCTOS.map((t) => ({
                      ...t,
                      producto: mapaProducto[t.nombre] || null,
                  }));

        // --- Actividad reciente ---
        const recientes = [...lista]
            .sort((a, b) => b.id_pedido - a.id_pedido)
            .slice(0, 5)
            .map((p) => ({
                texto: `Pedido #${p.id_pedido} ${p.nombre_cliente || "de un cliente"} — ${ESTADOS_LABEL[p.estado] || p.estado}`,
                tiempo: new Date(p.fecha),
            }));

        const actividad =
            hayReales && recientes.length > 0 ? recientes : MOCK_ACTIVIDAD;

        // --- Dona (proporción de estados) ---
        const totalEstados = pendientes + confirmados + entregados + cancelados;

        const dona = [
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
            entregados,
            cancelados,
            pedidosTotales,
            variaciones,
            stockBajo,
            ventasDiarias,
            topProductos: topFinal,
            actividad,
            dona,
            hayReales,
        };
    }, [productos, pedidos]);

    // -------- Gráfica de línea (SVG) --------
    const grafica = useMemo(() => {
        const puntos = data.ventasDiarias;

        if (puntos.length < 2) return null;

        const ancho = 620;
        const alto = 230;
        const paddingIzq = 52;
        const paddingDer = 16;
        const paddingSup = 22;
        const paddingInf = 34;

        const max = Math.max(...puntos.map((p) => p.ventas), 1);

        const coords = puntos.map((p, i) => {
            const x =
                paddingIzq +
                (i * (ancho - paddingIzq - paddingDer)) / (puntos.length - 1);
            const y =
                alto -
                paddingInf -
                (p.ventas / max) * (alto - paddingSup - paddingInf);
            return { x, y, ...p };
        });

        const linea = coords
            .map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`)
            .join(" ");

        const area = `${linea} L ${coords[coords.length - 1].x} ${alto - paddingInf} L ${
            coords[0].x
        } ${alto - paddingInf} Z`;

        // Líneas de eje Y (0, 25%, 50%, 75%, 100%)
        const yTicks = [0, 0.25, 0.5, 0.75, 1];

        return {
            coords,
            linea,
            area,
            max,
            ancho,
            alto,
            paddingIzq,
            paddingInf,
            yTicks,
        };
    }, [data.ventasDiarias]);

    const formatearL = (valor) =>
        `L ${Number(valor).toLocaleString("es-HN", {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        })}`;

    const formatearK = (valor) => {
        if (valor >= 1000) return `L ${(valor / 1000).toFixed(1)}k`;
        return `L ${Math.round(valor)}`;
    };

    const tiempoRelativo = (fecha) => {
        try {
            const dif = Math.max(0, new Date() - new Date(fecha).getTime());
            const min = Math.floor(dif / 60000);

            if (min < 1) return "Hace un momento";
            if (min < 60) return `Hace ${min} minuto${min !== 1 ? "s" : ""}`;

            const horas = Math.floor(min / 60);
            if (horas < 24) return `Hace ${horas} hora${horas !== 1 ? "s" : ""}`;

            const dias = Math.floor(horas / 24);
            return `Hace ${dias} día${dias !== 1 ? "s" : ""}`;
        } catch {
            return "";
        }
    };

    // -------- Dona (SVG) --------
    const donaGrafica = useMemo(() => {
        const radio = 52;
        const circunferencia = 2 * Math.PI * radio;
        const totalValores = data.dona.reduce((s, d) => s + d.valor, 0) || 1;

        const arcos = data.dona.map((seg, indice) => {
            const fraccion = seg.valor > 0 ? seg.valor / totalValores : 0;
            const longitud = fraccion * circunferencia;
            const offset = data.dona
                .slice(0, indice)
                .reduce((s, d) => s + (d.valor > 0 ? (d.valor / totalValores) * circunferencia : 0), 0);

            return {
                ...seg,
                fraccion,
                longitud,
                offset,
            };
        });

        return { radio, circunferencia, arcos };
    }, [data.dona]);

    const renderThumb = (producto, nombre) => {
        if (producto?.imagen) {
            return <img src={rutaImagen(producto.imagen)} alt={nombre} className="dash-mini-img" />;
        }

        return (
            <div className="dash-mini-img dash-mini-sin">
                <FaBoxOpen />
            </div>
        );
    };

    return (
        <div className="dashboard">
            {/* ---- Tarjetas de estadísticas ---- */}
            <div className="dash-stats">
                <div className="dash-card">
                    <div className="dash-card-top">
                        <div className="dash-card-icono">
                            <FaMoneyBillWave />
                        </div>
                        <Variacion valor={data.variaciones.ventasDia} />
                    </div>
                    <span className="dash-card-etiqueta">Ventas del día</span>
                    <span className="dash-card-valor">{formatearL(data.ventasDia)}</span>
                </div>

                <div className="dash-card">
                    <div className="dash-card-top">
                        <div className="dash-card-icono">
                            <FaChartLine />
                        </div>
                        <Variacion valor={data.variaciones.ventasMes} />
                    </div>
                    <span className="dash-card-etiqueta">Ventas del mes</span>
                    <span className="dash-card-valor">{formatearL(data.ventasMes)}</span>
                </div>

                <div className="dash-card">
                    <div className="dash-card-top">
                        <div className="dash-card-icono">
                            <FaWallet />
                        </div>
                        <Variacion valor={data.variaciones.ingresosTotales} />
                    </div>
                    <span className="dash-card-etiqueta">Ingresos totales</span>
                    <span className="dash-card-valor">{formatearL(data.ingresosTotales)}</span>
                </div>

                <div className="dash-card">
                    <div className="dash-card-top">
                        <div className="dash-card-icono">
                            <FaShoppingBag />
                        </div>
                        <Variacion valor={data.variaciones.pedidosTotales} />
                    </div>
                    <span className="dash-card-etiqueta">Pedidos totales</span>
                    <span className="dash-card-valor">{data.pedidosTotales}</span>
                </div>

                <div className="dash-card">
                    <div className="dash-card-top">
                        <div className="dash-card-icono">
                            <FaClock />
                        </div>
                        <Variacion valor={data.variaciones.pendientes} invertir />
                    </div>
                    <span className="dash-card-etiqueta">Pedidos pendientes</span>
                    <span className="dash-card-valor">{data.pendientes}</span>
                    <button className="dash-card-link dorado" onClick={() => onIrA && onIrA("pedidos")}>
                        Ver pedidos
                    </button>
                </div>

                <div className="dash-card">
                    <div className="dash-card-top">
                        <div className="dash-card-icono">
                            <FaCheckCircle />
                        </div>
                        <Variacion valor={data.variaciones.entregados} />
                    </div>
                    <span className="dash-card-etiqueta">Pedidos entregados</span>
                    <span className="dash-card-valor">{data.entregados}</span>
                    <button className="dash-card-link verde" onClick={() => onIrA && onIrA("pedidos")}>
                        Ver pedidos
                    </button>
                </div>

                <div className="dash-card">
                    <div className="dash-card-top">
                        <div className="dash-card-icono">
                            <FaTimesCircle />
                        </div>
                        <Variacion valor={data.variaciones.cancelados} invertir />
                    </div>
                    <span className="dash-card-etiqueta">Pedidos cancelados</span>
                    <span className="dash-card-valor">{data.cancelados}</span>
                    <button className="dash-card-link rojo" onClick={() => onIrA && onIrA("pedidos")}>
                        Ver pedidos
                    </button>
                </div>
            </div>

            {/* ---- Segunda fila: 4 columnas ---- */}
            <div className="dash-grid">
                {/* Gráfica 7 días */}
                <div className="dash-panel dash-panel-grafica">
                    <h3 className="dash-seccion-titulo">Ventas de los últimos 7 días</h3>

                    {grafica ? (
                        <svg
                            viewBox={`0 0 ${grafica.ancho} ${grafica.alto}`}
                            className="dash-svg"
                        >
                            <defs>
                                <linearGradient id="gradienteVentas" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="0%" stopColor="#6B1420" stopOpacity="0.35" />
                                    <stop offset="100%" stopColor="#6B1420" stopOpacity="0" />
                                </linearGradient>
                            </defs>

                            {grafica.yTicks.map((t, i) => {
                                const y =
                                    grafica.alto -
                                    grafica.paddingInf -
                                    t * (grafica.alto - grafica.paddingSup - grafica.paddingInf);
                                const valor = grafica.max * t;

                                return (
                                    <g key={i}>
                                        <line
                                            x1={grafica.paddingIzq}
                                            y1={y}
                                            x2={grafica.ancho - grafica.paddingDer}
                                            y2={y}
                                            stroke="#F0E6DD"
                                            strokeWidth="1"
                                        />
                                        <text
                                            x={grafica.paddingIzq - 8}
                                            y={y + 4}
                                            textAnchor="end"
                                            className="dash-svg-eje"
                                        >
                                            {formatearK(valor)}
                                        </text>
                                    </g>
                                );
                            })}

                            <path d={grafica.area} fill="url(#gradienteVentas)" />

                            <path
                                d={grafica.linea}
                                fill="none"
                                stroke="#6B1420"
                                strokeWidth="3"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                            />

                            {grafica.coords.map((p, i) => (
                                <g key={i}>
                                    <circle
                                        cx={p.x}
                                        cy={p.y}
                                        r="5"
                                        fill="#6B1420"
                                        stroke="#fff"
                                        strokeWidth="2"
                                    />
                                    <text
                                        x={p.x}
                                        y={grafica.alto - 8}
                                        textAnchor="middle"
                                        className="dash-svg-etiqueta"
                                    >
                                        {p.dia}
                                    </text>
                                </g>
                            ))}
                        </svg>
                    ) : (
                        <p className="dash-vacio">Sin datos suficientes para la gráfica.</p>
                    )}
                </div>

                {/* Productos más vendidos */}
                <div className="dash-panel">
                    <h3 className="dash-seccion-titulo">Productos más vendidos</h3>

                    <ul className="dash-lista">
                        {data.topProductos.map((p, i) => (
                            <li key={p.nombre} className="dash-lista-item">
                                <span className="dash-posicion">{i + 1}</span>
                                {renderThumb(p.producto, p.nombre)}
                                <div className="dash-lista-info">
                                    <span className="dash-lista-nombre">{p.nombre}</span>
                                    <span className="dash-lista-sub">
                                        {p.vendidos} vendidos · {formatearL(p.precio)}
                                    </span>
                                </div>
                            </li>
                        ))}
                    </ul>
                </div>

                {/* Productos con poco stock */}
                <div className="dash-panel">
                    <h3 className="dash-seccion-titulo">Productos con poco stock</h3>

                    {data.stockBajo.length === 0 ? (
                        <p className="dash-vacio">Sin alertas de stock.</p>
                    ) : (
                        <ul className="dash-lista">
                            {data.stockBajo.map((p) => {
                                const critico = Number(p.stock) <= 2;

                                return (
                                    <li key={p.id_producto} className="dash-lista-item">
                                        {renderThumb(p, p.nombre)}
                                        <div className="dash-lista-info">
                                            <span className="dash-lista-nombre">{p.nombre}</span>
                                            <span
                                                className={`dash-stock-badge ${critico ? "critico" : ""}`}
                                            >
                                                {p.stock} en stock
                                            </span>
                                        </div>
                                        {critico && <FaExclamationTriangle className="dash-stock-alerta" />}
                                    </li>
                                );
                            })}
                        </ul>
                    )}

                    <button
                        className="dash-ver-mas"
                        onClick={() => onIrA && onIrA("productos")}
                    >
                        Ver inventario completo
                    </button>
                </div>

                {/* Resumen de pedidos (dona) + actividad */}
                <div className="dash-panel">
                    <h3 className="dash-seccion-titulo">Resumen de pedidos</h3>

                    <div className="dash-dona">
                        <svg viewBox="0 0 140 140" className="dash-dona-svg">
                            <circle
                                cx="70"
                                cy="70"
                                r={donaGrafica.radio}
                                fill="none"
                                stroke="#F0E6DD"
                                strokeWidth="18"
                            />
                            {donaGrafica.arcos.map((arc, i) =>
                                arc.fraccion > 0 ? (
                                    <circle
                                        key={i}
                                        cx="70"
                                        cy="70"
                                        r={donaGrafica.radio}
                                        fill="none"
                                        stroke={arc.color}
                                        strokeWidth="18"
                                        strokeDasharray={`${arc.longitud} ${
                                            donaGrafica.circunferencia - arc.longitud
                                        }`}
                                        strokeDashoffset={-arc.offset}
                                        strokeLinecap="butt"
                                        transform="rotate(-90 70 70)"
                                    />
                                ) : null
                            )}
                            <text
                                x="70"
                                y="66"
                                textAnchor="middle"
                                className="dash-dona-total"
                            >
                                {data.dona.reduce((s, d) => s + d.valor, 0)}
                            </text>
                            <text
                                x="70"
                                y="84"
                                textAnchor="middle"
                                className="dash-dona-sub"
                            >
                                pedidos
                            </text>
                        </svg>

                        <div className="dash-leyenda">
                            {data.dona.map((seg, i) => (
                                <div key={i} className="dash-leyenda-item">
                                    <span
                                        className="dash-leyenda-color"
                                        style={{ background: seg.color }}
                                    />
                                    <span className="dash-leyenda-nombre">{seg.etiqueta}</span>
                                    <span className="dash-leyenda-porc">{seg.porcentaje}%</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    <h4 className="dash-subtitulo">Actividad reciente</h4>

                    <ul className="dash-actividad">
                        {data.actividad.slice(0, 4).map((a, i) => (
                            <li key={i} className="dash-actividad-item">
                                <span className="dash-actividad-punto" />
                                <div className="dash-actividad-info">
                                    <span className="dash-actividad-texto">{a.texto}</span>
                                    <span className="dash-actividad-tiempo">
                                        {tiempoRelativo(a.tiempo)}
                                    </span>
                                </div>
                            </li>
                        ))}
                    </ul>
                </div>
            </div>
        </div>
    );
}

export default Dashboard;
