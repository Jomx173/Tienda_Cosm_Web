import { useEffect, useMemo, useRef, useState } from "react";

import {
    FaShoppingBag,
    FaChartBar,
    FaMoneyBillWave,
    FaTimesCircle,
    FaFire,
    FaExclamationTriangle,
    FaBoxOpen,
    FaArrowUp,
    FaArrowDown,
    FaCalendarAlt,
    FaChevronDown,
    FaTimes,
} from "react-icons/fa";

import { rutaImagen } from "../../services/api";
import { calcularReporte } from "../../data/dashboardData";
import { formatearPrecio } from "../../utils/precio";
import type { Pedido, Producto } from "../../services/types";

import "./Reportes.css";
import "./Dashboard.css";

function VariacionRango({ valor, invertir = false }: { valor: number; invertir?: boolean }) {
    const sube = valor >= 0;
    const buena = invertir ? !sube : sube;

    return (
        <span
            className={`dash-variacion ${buena ? "buena" : "mala"}`}
            title="Comparado con el período anterior de la misma duración"
        >
            {sube ? <FaArrowUp /> : <FaArrowDown />}
            {Math.abs(valor).toFixed(1)}%
        </span>
    );
}

const formatearFechaCorta = (fecha: string) => {
    if (!fecha) return "";
    const [, mes, dia] = fecha.split("-");
    return `${dia}/${mes}`;
};

const formatearL = (valor: number | string) => formatearPrecio(valor);

const formatearK = (valor: number) => {
    if (valor >= 1000) return `L ${(valor / 1000).toFixed(1)}k`;
    return `L ${Math.round(valor)}`;
};

const tiempoRelativo = (fecha: Date) => {
    try {
        const dif = Math.max(0, new Date().getTime() - new Date(fecha).getTime());
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

type Props = {
    productos?: Producto[];
    pedidos?: Pedido[];
    onIrA?: (id: string) => void;
};

function Reportes({ productos = [], pedidos = [], onIrA }: Props) {
    const [reporteDesde, setReporteDesde] = useState("");
    const [reporteHasta, setReporteHasta] = useState("");
    const [filtroAbierto, setFiltroAbierto] = useState(false);
    const [draftDesde, setDraftDesde] = useState("");
    const [draftHasta, setDraftHasta] = useState("");
    const [hintFiltro, setHintFiltro] = useState("");
    const filtrosRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!filtroAbierto) return;

        const onKey = (e: KeyboardEvent) => {
            if (e.key === "Escape") setFiltroAbierto(false);
        };

        const onDown = (e: MouseEvent) => {
            if (filtrosRef.current && !filtrosRef.current.contains(e.target as Node)) {
                setFiltroAbierto(false);
            }
        };

        window.addEventListener("keydown", onKey);
        document.addEventListener("mousedown", onDown);

        return () => {
            window.removeEventListener("keydown", onKey);
            document.removeEventListener("mousedown", onDown);
        };
    }, [filtroAbierto]);

    const abrirFiltro = () => {
        setDraftDesde(reporteDesde);
        setDraftHasta(reporteHasta);
        setHintFiltro("");
        setFiltroAbierto(true);
    };

    const aplicarRango = () => {
        if (!draftDesde || !draftHasta) {
            setHintFiltro("Elige las fechas de inicio y fin del rango.");
            return;
        }

        if (draftHasta < draftDesde) {
            setHintFiltro("La fecha de fin debe ser igual o posterior a la de inicio.");
            return;
        }

        setReporteDesde(draftDesde);
        setReporteHasta(draftHasta);
        setHintFiltro("");
        setFiltroAbierto(false);
    };

    const limpiarRango = () => {
        setReporteDesde("");
        setReporteHasta("");
        setDraftDesde("");
        setDraftHasta("");
        setHintFiltro("");
        setFiltroAbierto(false);
    };

    // -------- Cálculos (con filtro de fechas) --------
    const rangoEfectivo = { desde: reporteDesde, hasta: reporteHasta };

    const data = useMemo(
        () => calcularReporte(productos, pedidos, rangoEfectivo),
        [productos, pedidos, rangoEfectivo.desde, rangoEfectivo.hasta]
    );

    const rangoActivo = !!(rangoEfectivo.desde || rangoEfectivo.hasta);

    const productosDestacados = productos.filter((p) => p.destacado).length;

    // -------- Período anterior (misma duración que el rango) --------
    const formatearFecha = (fecha: Date) =>
        `${fecha.getFullYear()}-${String(fecha.getMonth() + 1).padStart(2, "0")}-${String(
            fecha.getDate()
        ).padStart(2, "0")}`;

    const periodoAnterior = useMemo(() => {
        if (!rangoEfectivo.desde) return null;

        const inicio = new Date(`${rangoEfectivo.desde}T00:00:00`);
        const fin = rangoEfectivo.hasta
            ? new Date(`${rangoEfectivo.hasta}T00:00:00`)
            : new Date();

        if (isNaN(inicio.getTime()) || isNaN(fin.getTime()) || fin < inicio) return null;

        const duracion = Math.round((fin.getTime() - inicio.getTime()) / 86400000) + 1;
        const inicioPrev = new Date(inicio.getTime() - duracion * 86400000);
        const finPrev = new Date(inicio.getTime() - 86400000);

        return {
            datos: calcularReporte(productos, pedidos, {
                desde: formatearFecha(inicioPrev),
                hasta: formatearFecha(finPrev),
            }),
            desde: formatearFecha(inicioPrev),
            hasta: formatearFecha(finPrev),
        };
    }, [productos, pedidos, rangoEfectivo.desde, rangoEfectivo.hasta]);

    const variacionesRango = useMemo(() => {
        if (!rangoActivo || !periodoAnterior) return null;

        const pct = (actual: number, anterior: number) => {
            const a = Number(actual) || 0;
            const prev = Number(anterior) || 0;
            if (prev === 0) return a === 0 ? 0 : 100;
            return ((a - prev) / prev) * 100;
        };

        return {
            totalPedidos: pct(data.totalPedidos, periodoAnterior.datos.totalPedidos),
            ingresosTotales: pct(data.ingresosTotales, periodoAnterior.datos.ingresosTotales),
            ventasPeriodo: pct(data.ingresosTotales, periodoAnterior.datos.ingresosTotales),
            cancelados: pct(data.cancelados, periodoAnterior.datos.cancelados),
        };
    }, [rangoActivo, periodoAnterior, data]);

    const ventasCard = rangoActivo ? data.ingresosTotales : data.ventasMes;
    const ventasEtiqueta = rangoActivo ? "Ventas del período" : "Ventas del mes";

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
            return { x, y, dia: p.dia, ventas: p.ventas };
        });

        const linea = coords
            .map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`)
            .join(" ");

        const area = `${linea} L ${coords[coords.length - 1].x} ${alto - paddingInf} L ${
            coords[0].x
        } ${alto - paddingInf} Z`;

        const yTicks = [0, 0.25, 0.5, 0.75, 1];

        return {
            coords,
            linea,
            area,
            max,
            ancho,
            alto,
            paddingIzq,
            paddingSup,
            paddingDer,
            paddingInf,
            yTicks,
        };
    }, [data.ventasDiarias]);

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
                .reduce(
                    (s, d) =>
                        s +
                        (d.valor > 0 ? (d.valor / totalValores) * circunferencia : 0),
                    0
                );

            return {
                etiqueta: seg.etiqueta,
                valor: seg.valor,
                color: seg.color,
                porcentaje: seg.porcentaje,
                fraccion,
                longitud,
                offset,
            };
        });

        return { radio, circunferencia, arcos };
    }, [data.dona]);

    const renderThumb = (producto: Producto | null | undefined, nombre: string) => {
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
        <div className="reportes">
            {/* ---- Filtro de fechas (popover) ---- */}
            <div className="reportes-filtros" ref={filtrosRef}>
                <div className="reportes-filtro-boton-grupo">
                    <button
                        type="button"
                        className={`reportes-filtro-btn ${rangoActivo ? "activo" : ""}`}
                        onClick={() => (filtroAbierto ? setFiltroAbierto(false) : abrirFiltro())}
                    >
                        <FaCalendarAlt />
                        <span>
                            {rangoActivo
                                ? `${formatearFechaCorta(reporteDesde)} - ${formatearFechaCorta(reporteHasta)}`
                                : "Filtrar por fecha"}
                        </span>
                        <FaChevronDown className="reportes-filtro-chevron" />
                    </button>

                    {rangoActivo && (
                        <button
                            type="button"
                            className="reportes-filtro-x"
                            onClick={limpiarRango}
                            aria-label="Limpiar filtro de fecha"
                            title="Limpiar rango"
                        >
                            <FaTimes />
                        </button>
                    )}

                    {filtroAbierto && (
                        <div className="reportes-popover">
                            <label>
                                Desde
                                <input
                                    type="date"
                                    value={draftDesde}
                                    onChange={(e) => setDraftDesde(e.target.value)}
                                />
                            </label>

                            <label>
                                Hasta
                                <input
                                    type="date"
                                    value={draftHasta}
                                    min={draftDesde || undefined}
                                    onChange={(e) => setDraftHasta(e.target.value)}
                                />
                            </label>

                            {hintFiltro && <p className="reportes-popover-hint">{hintFiltro}</p>}

                            <div className="reportes-popover-acciones">
                                {rangoActivo && (
                                    <button
                                        type="button"
                                        className="reportes-popover-limpiar"
                                        onClick={limpiarRango}
                                    >
                                        Limpiar rango
                                    </button>
                                )}

                                <button
                                    type="button"
                                    className="reportes-popover-aplicar"
                                    onClick={aplicarRango}
                                >
                                    Aplicar
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {rangoActivo && (
                <p className="reportes-resumen">
                    Mostrando pedidos del{" "}
                    <strong>
                        {new Date(`${rangoEfectivo.desde}T00:00:00`).toLocaleDateString("es-HN")}
                    </strong>{" "}
                    al{" "}
                    <strong>
                        {new Date(`${rangoEfectivo.hasta}T00:00:00`).toLocaleDateString("es-HN")}
                    </strong>
                    {periodoAnterior && (
                        <>
                            {" "}· comparado con el período anterior{" "}
                            <strong>
                                {new Date(`${periodoAnterior.desde}T00:00:00`).toLocaleDateString("es-HN")}
                            </strong>{" "}
                            al{" "}
                            <strong>
                                {new Date(`${periodoAnterior.hasta}T00:00:00`).toLocaleDateString("es-HN")}
                            </strong>
                        </>
                    )}
                </p>
            )}

            {/* ---- Tarjetas de resumen ---- */}
            <div className="reportes-grid">
                <div className="reporte-card">
                    <div className="reporte-card-top">
                        <FaShoppingBag className="reporte-icono" />
                        {variacionesRango && <VariacionRango valor={variacionesRango.totalPedidos} />}
                    </div>
                    <span className="reporte-etiqueta">Pedidos totales</span>
                    <span className="reporte-valor">{data.totalPedidos}</span>
                </div>

                <div className="reporte-card">
                    <div className="reporte-card-top">
                        <FaChartBar className="reporte-icono" />
                        {variacionesRango && <VariacionRango valor={variacionesRango.ingresosTotales} />}
                    </div>
                    <span className="reporte-etiqueta">Ingresos totales</span>
                    <span className="reporte-valor">{formatearL(data.ingresosTotales)}</span>
                </div>

                <div className="reporte-card">
                    <div className="reporte-card-top">
                        <FaMoneyBillWave className="reporte-icono" />
                        {variacionesRango && <VariacionRango valor={variacionesRango.ventasPeriodo} />}
                    </div>
                    <span className="reporte-etiqueta">{ventasEtiqueta}</span>
                    <span className="reporte-valor">{formatearL(ventasCard)}</span>
                </div>

                <div className="reporte-card">
                    <div className="reporte-card-top">
                        <FaTimesCircle className="reporte-icono" />
                        {variacionesRango && <VariacionRango valor={variacionesRango.cancelados} invertir />}
                    </div>
                    <span className="reporte-etiqueta">Pedidos cancelados</span>
                    <span className="reporte-valor">{data.cancelados}</span>
                </div>

                <div className="reporte-card">
                    <div className="reporte-card-top">
                        <FaFire className="reporte-icono" />
                        {rangoActivo && <span className="reporte-fijo">Valor actual</span>}
                    </div>
                    <span className="reporte-etiqueta">Productos destacados</span>
                    <span className="reporte-valor">{productosDestacados}</span>
                </div>

                <div className="reporte-card">
                    <div className="reporte-card-top">
                        <FaExclamationTriangle className="reporte-icono" />
                        {rangoActivo && <span className="reporte-fijo">Valor actual</span>}
                    </div>
                    <span className="reporte-etiqueta">Stock bajo</span>
                    <span className="reporte-valor">{data.stockBajo.length}</span>
                </div>
            </div>

            {/* ---- Paneles detallados ---- */}
            <div className="reportes-paneles">
                {/* Gráfica 7 días */}
                <div className="dash-panel reportes-panel-grafica">
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

                    {data.topProductos.length === 0 ? (
                        <p className="dash-vacio">Sin ventas registradas en el período.</p>
                    ) : (
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
                    )}
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

                    {data.actividad.length === 0 ? (
                        <p className="dash-vacio">Sin actividad reciente.</p>
                    ) : (
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
                    )}
                </div>
            </div>
        </div>
    );
}

export default Reportes;
