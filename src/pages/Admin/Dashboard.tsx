import { useMemo } from "react";

import {
    FaMoneyBillWave,
    FaClock,
    FaShoppingBag,
    FaCheckCircle,
    FaArrowUp,
    FaArrowDown,
} from "react-icons/fa";

import { calcularReporte } from "../../data/dashboardData";
import { formatearPrecio } from "../../utils/precio";
import type { Pedido, Producto } from "../../services/types";

import "./Dashboard.css";

function Variacion({ valor, invertir = false }: { valor: number; invertir?: boolean }) {
    const sube = valor >= 0;
    const buena = invertir ? !sube : sube;

    return (
        <span className={`dash-variacion ${buena ? "buena" : "mala"}`}>
            {sube ? <FaArrowUp /> : <FaArrowDown />}
            {Math.abs(valor).toFixed(1)}%
        </span>
    );
}

type Props = {
    productos?: Producto[];
    pedidos?: Pedido[];
    onIrA?: (id: string) => void;
};

function Dashboard({ productos = [], pedidos = [], onIrA }: Props) {
    const data = useMemo(
        () => calcularReporte(productos, pedidos, { soloMes: true }),
        [productos, pedidos]
    );

    const formatearL = (valor: number) => formatearPrecio(valor);

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
                            <FaShoppingBag />
                        </div>
                        <Variacion valor={data.variaciones.pedidosTotales} />
                    </div>
                    <span className="dash-card-etiqueta">Pedidos del mes</span>
                    <span className="dash-card-valor">{data.pedidosTotales}</span>
                </div>

                <div className="dash-card">
                    <div className="dash-card-top">
                        <div className="dash-card-icono">
                            <FaCheckCircle />
                        </div>
                        <Variacion valor={data.variaciones.entregados} />
                    </div>
                    <span className="dash-card-etiqueta">Entregados del mes</span>
                    <span className="dash-card-valor">{data.entregados}</span>
                    <button className="dash-card-link verde" onClick={() => onIrA && onIrA("pedidos")}>
                        Ver pedidos
                    </button>
                </div>
            </div>
        </div>
    );
}

export default Dashboard;
