import { Link, useLocation } from "react-router-dom";

import { FaCheckCircle, FaWhatsapp } from "react-icons/fa";

import TopBar from "../../components/TopBar/TopBar";
import Navbar from "../../components/Navbar/Navbar";
import Footer from "../../components/Footer/Footer";

import type { Pedido } from "../../services/types";
import { formatearPrecio } from "../../utils/precio";
import { enlaceWhatsAppTienda } from "../../utils/mensajesPedido";

import "./PedidoConfirmado.css";

type EstadoNavegacion = {
    pedido?: Pedido;
};

function PedidoConfirmado() {
    const location = useLocation();
    const pedido = (location.state as EstadoNavegacion | null)?.pedido;

    if (!pedido) {
        return (
            <div className="confirmado-page">
                <TopBar />
                <Navbar />

                <div className="confirmado">
                    <div className="confirmado-cab">
                        <h1>Pedido confirmado</h1>
                        <p>No encontramos el resumen de este pedido.</p>
                    </div>

                    <Link to="/productos" className="confirmado-seguir">
                        Ver productos
                    </Link>
                </div>

                <Footer />
            </div>
        );
    }

    return (
        <div className="confirmado-page">
            <TopBar />
            <Navbar />

            <div className="confirmado">
                <div className="confirmado-cab">
                    <FaCheckCircle className="confirmado-icono" />
                    <h1>¡Pedido recibido!</h1>
                    <p className="confirmado-numero">Pedido #{pedido.id_pedido}</p>
                    <span className="confirmado-estado">
                        Pendiente de confirmación por el administrador
                    </span>
                </div>

                <div className="confirmado-recibo">
                    <table>
                        <thead>
                            <tr>
                                <th>Producto</th>
                                <th>Tono</th>
                                <th className="centro">Cant.</th>
                                <th className="derecha">P. Unit</th>
                                <th className="derecha">Subtotal</th>
                            </tr>
                        </thead>
                        <tbody>
                            {(pedido.productos || []).map((item, index) => {
                                const cantidad = Number(item.cantidad || 0);
                                const precio = Number(item.precio || 0);

                                return (
                                    <tr key={`${item.id_producto}-${index}`}>
                                        <td>{item.nombre || "Producto"}</td>
                                        <td>{item.tono || "No aplica"}</td>
                                        <td className="centro">{cantidad}</td>
                                        <td className="derecha">
                                            {formatearPrecio(precio)}
                                        </td>
                                        <td className="derecha">
                                            {formatearPrecio(precio * cantidad)}
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>

                    <div className="confirmado-total">
                        <span>Total</span>
                        <strong>{formatearPrecio(pedido.total)}</strong>
                    </div>
                </div>

                <a
                    href={enlaceWhatsAppTienda(pedido)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="confirmado-whatsapp"
                >
                    <FaWhatsapp /> Confirmar por WhatsApp
                </a>

                <Link to="/productos" className="confirmado-seguir">
                    Seguir comprando
                </Link>
            </div>

            <Footer />
        </div>
    );
}

export default PedidoConfirmado;
