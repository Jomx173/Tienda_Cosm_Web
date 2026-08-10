import { FaEye } from "react-icons/fa";

import { rutaImagen } from "../../services/api";

import "./OfertaCard.css";

function OfertaCard({ producto }) {
    const { nombre, precio, imagen } = producto;

    const precioAnterior = producto.precio_anterior ?? producto.precioAnterior;

    const descuento = precioAnterior
        ? Math.round(((precioAnterior - precio) / precioAnterior) * 100)
        : 0;

    return (
        <div className="oferta-card">
            <div className="oferta-img">
                {imagen ? (
                    <img src={rutaImagen(imagen)} alt={nombre} loading="lazy" />
                ) : (
                    <div className="oferta-sin-imagen">Sin imagen</div>
                )}

                {precioAnterior && (
                    <span className="oferta-discount">-{descuento}%</span>
                )}
            </div>

            <div className="oferta-info">
                <h3>{nombre}</h3>

                <div className="oferta-precio">
                    {precioAnterior && (
                        <span className="oferta-precio-anterior">L {precioAnterior}</span>
                    )}
                    <span className="oferta-precio-actual">L {precio}</span>
                </div>

                <button className="oferta-btn">
                    <FaEye /> Ver producto
                </button>
            </div>
        </div>
    );
}

export default OfertaCard;
