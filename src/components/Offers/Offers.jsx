import { useEffect, useState } from "react";

import { FaPercent } from "react-icons/fa";

import OfertaCard from "../OfertaCard/OfertaCard";

import productsData from "../../data/products";
import { obtenerProductos } from "../../services/productoService";

import "./Offers.css";

const nombreCategoria = (p) => p.categoria?.nombre ?? p.categoria;

const esOferta = (p) =>
    nombreCategoria(p) === "Ofertas" || Boolean(p.precio_anterior ?? p.precioAnterior);

function Offers() {
    const [ofertas, setOfertas] = useState(
        productsData.filter((p) => esOferta(p))
    );

    useEffect(() => {
        obtenerProductos()
            .then((data) => setOfertas(data.filter((p) => esOferta(p))))
            .catch(() => {});
    }, []);

    return (
        <section className="offers" id="ofertas">
            <div className="offers-banner">
                <div className="offers-banner-text">
                    <FaPercent className="offers-icon" />
                    <span className="offers-eyebrow">Solo por tiempo limitado</span>
                    <h2>Ofertas Especiales</h2>
                    <p>Descuentos exclusivos que no encontrarás en otro lugar.</p>
                </div>
            </div>

            <div className="offers-list">
                {ofertas.map((producto) => (
                    <OfertaCard
                        key={producto.id_producto ?? producto.id}
                        producto={producto}
                    />
                ))}
            </div>

            {ofertas.length === 0 && (
                <p className="sin-resultados">Aún no hay ofertas disponibles.</p>
            )}
        </section>
    );
}

export default Offers;
