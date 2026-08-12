import { useState } from "react";
import { FaWhatsapp, FaCartPlus, FaCheck } from "react-icons/fa";
import { Link } from "react-router-dom";

import { rutaImagen } from "../../services/api";
import type { Producto } from "../../services/types";
import { useDispatch } from "../../store";
import { Action as ActionCarrito } from "../../store/slices/Carrito";
import site from "../../config/site";
import { formatearPrecio } from "../../utils/precio";

import "./ProductoCard.css";

type Props = {
    producto: Producto;
    soloLectura?: boolean;
};

function ProductoCard({ producto, soloLectura = false }: Props) {
    const { nombre, categoria, descripcion, precio, imagen } = producto;

    const dispatch = useDispatch();

    const [agregado, setAgregado] = useState(false);

    const precioAnterior = producto.precio_anterior ?? producto.precioAnterior;
    const esNuevo = producto.destacado ?? producto.nuevo;

    const precioAnteriorNum = Number(precioAnterior);
    const precioNum = Number(precio);
    const esOferta = precioAnteriorNum > 0 && precioNum > 0 && precioAnteriorNum > precioNum;
    const descuento = esOferta
        ? Math.round(((precioAnteriorNum - precioNum) / precioAnteriorNum) * 100)
        : 0;

    const nombreCategoria = categoria?.nombre ?? categoria;

    const enlaceDetalle = `/producto/${producto.id_producto}`;

    const agregarAlCarrito = () => {
        dispatch(
            ActionCarrito.agregar({
                producto,
                cantidad: 1,
            })
        );
        setAgregado(true);

        setTimeout(() => setAgregado(false), 1500);
    };

    return (
        <div className="producto-card">
            <Link to={enlaceDetalle} className="producto-img">
                {imagen ? (
                    <img src={rutaImagen(imagen)} alt={nombre} loading="lazy" />
                ) : (
                    <div className="producto-sin-imagen">Sin imagen</div>
                )}

                {esOferta && (
                    <span className="badge-badge badge-oferta">-{descuento}%</span>
                )}
                {esNuevo && !esOferta && (
                    <span className="badge-badge badge-nuevo">Nuevo</span>
                )}
            </Link>

            <div className="producto-info">
                {nombreCategoria && (
                    <span className="producto-categoria">
                        {producto.subcategoria
                            ? `${producto.subcategoria}`
                            : String(nombreCategoria)}
                    </span>
                )}

                <Link to={enlaceDetalle} className="producto-nombre">
                    <h3>{nombre}</h3>
                </Link>

                {descripcion && <p className="producto-desc">{descripcion}</p>}

                <div className="producto-precio">
                    {esOferta && <span className="precio-anterior">{formatearPrecio(precioAnteriorNum)}</span>}
                    <span className="precio-actual">{formatearPrecio(precioNum)}</span>
                </div>

                {!soloLectura && (
                    <>
                        <button
                            type="button"
                            className={agregado ? "btn-agregar-carrito agregado" : "btn-agregar-carrito"}
                            onClick={agregarAlCarrito}
                        >
                            {agregado ? (
                                <>
                                    <FaCheck /> ¡Agregado!
                                </>
                            ) : (
                                <>
                                    <FaCartPlus /> Agregar al carrito
                                </>
                            )}
                        </button>

                        <a href={site.whatsappGrupoUrl} target="_blank" rel="noopener noreferrer" className="btn-preguntar">
                            <FaWhatsapp /> Preguntar por este producto
                        </a>

                        <p className="producto-retiro">
                            <FaCheck /> Envíos a nivel nacional
                        </p>
                    </>
                )}
            </div>
        </div>
    );
}

export default ProductoCard;
