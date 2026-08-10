import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";

import { FaWhatsapp, FaArrowLeft, FaCheckCircle, FaCartPlus, FaMinus, FaPlus, FaCheck, FaHome, FaChevronRight } from "react-icons/fa";

import { obtenerProducto, obtenerProductos } from "../../services/productoService";
import { rutaImagen } from "../../services/api";
import { useCarrito } from "../../context/CarritoContext";
import Navbar from "../../components/Navbar/Navbar";
import ProductoCard from "../../components/ProductoCard/ProductoCard";
import site from "../../config/site";

import "./ProductoDetalle.css";

function ProductoDetalle() {
    const { id } = useParams();

    const { agregar } = useCarrito();

    const [producto, setProducto] = useState(null);
    const [cargando, setCargando] = useState(true);
    const [error, setError] = useState("");
    const [cantidad, setCantidad] = useState(1);
    const [agregado, setAgregado] = useState(false);
    const [relacionados, setRelacionados] = useState([]);

    useEffect(() => {
        let activo = true;

        obtenerProducto(id)
            .then((data) => {
                if (activo) setProducto(data);
            })
            .catch((err) => {
                if (activo) {
                    setError(
                        err.response?.status === 404
                            ? "El producto no existe o ya no está disponible."
                            : "No se pudo cargar el producto."
                    );
                }
            })
            .finally(() => {
                if (activo) setCargando(false);
            });

        return () => {
            activo = false;
        };
    }, [id]);

    useEffect(() => {
        let activo = true;

        obtenerProductos()
            .then((todos) => {
                if (!activo) return;

                const categoriaActual = producto?.categoria?.nombre ?? producto?.categoria;

                const mismos = todos
                    .filter(
                        (p) =>
                            (p.categoria?.nombre ?? p.categoria) === categoriaActual &&
                            (p.id_producto ?? p.id) !== Number(id)
                    )
                    .slice(0, 4);

                setRelacionados(mismos);
            })
            .catch(() => {});

        return () => {
            activo = false;
        };
    }, [producto, id]);

    if (cargando) {
        return (
            <div className="detalle">
                <Navbar />

                <div className="detalle-cargando">Cargando producto...</div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="detalle">
                <Navbar />

                <div className="detalle-error">
                    <h2>Producto no disponible</h2>
                    <p>{error}</p>
                    <Link to="/" className="detalle-volver">← Volver a la tienda</Link>
                </div>
            </div>
        );
    }

    const precioAnterior = producto.precio_anterior ?? producto.precioAnterior;
    const esNuevo = producto.destacado ?? producto.nuevo;
    const precioAnteriorNum = Number(precioAnterior);
    const precioNum = Number(producto.precio);
    const esOferta = precioAnteriorNum > 0 && precioNum > 0 && precioAnteriorNum > precioNum;
    const descuento = esOferta
        ? Math.round(((precioAnteriorNum - precioNum) / precioAnteriorNum) * 100)
        : 0;
    const nombreCategoria = producto.categoria?.nombre ?? producto.categoria;

    const mensaje = encodeURIComponent(
        `¡Hola! Quiero información sobre "${producto.nombre}". ¿Está disponible?`
    );

    const agregarAlCarrito = () => {
        agregar(producto, cantidad);
        setAgregado(true);

        setTimeout(() => setAgregado(false), 1500);
    };

    return (
        <div className="detalle">
            <Navbar />

            <div className="detalle-breadcrumb">
                <Link to="/" className="detalle-breadcrumb-link">
                    <FaHome /> Inicio
                </Link>
                <FaChevronRight className="detalle-breadcrumb-sep" />
                <span>{nombreCategoria || "Producto"}</span>
                <FaChevronRight className="detalle-breadcrumb-sep" />
                <span className="detalle-breadcrumb-actual">{producto.nombre}</span>
            </div>

            <div className="detalle-back">
                <Link to="/" className="detalle-volver">
                    <FaArrowLeft /> Volver a la tienda
                </Link>
            </div>

                <div className="detalle-card">
                    <a
                        href={`${site.whatsappUrl}?text=${mensaje}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="detalle-pregunta"
                    >
                        ¿Preguntas sobre el producto? Escríbenos por <strong>WhatsApp</strong>
                    </a>

                    <div className="detalle-img">
                        {producto.imagen ? (
                            <img src={rutaImagen(producto.imagen)} alt={producto.nombre} />
                        ) : (
                            <div className="detalle-sin-imagen">Sin imagen</div>
                        )}

                        {esOferta && (
                            <span className="badge-badge badge-oferta">-{descuento}%</span>
                        )}
                        {esNuevo && !esOferta && (
                            <span className="badge-badge badge-nuevo">Nuevo</span>
                        )}
                    </div>

                    <div className="detalle-info">
                        {nombreCategoria && (
                            <span className="detalle-categoria">
                                {producto.subcategoria
                                    ? `${nombreCategoria} · ${producto.subcategoria}`
                                    : nombreCategoria}
                            </span>
                        )}

                        <div className="detalle-precio-linea">
                            <span className="detalle-precio-nombre">{producto.nombre}</span>
                            <div className="producto-precio">
                                {esOferta && (
                                    <span className="precio-anterior">L {precioAnteriorNum}</span>
                                )}
                                <span className="precio-actual">L {precioNum}</span>
                            </div>
                        </div>

                        {producto.codigo && (
                            <div className="detalle-codigo">
                                Código: <span>{producto.codigo}</span>
                            </div>
                        )}

                        {producto.descripcion && (
                            <p className="detalle-desc">{producto.descripcion}</p>
                        )}

                        <div className="detalle-stock">
                            <FaCheckCircle />
                            {producto.stock > 0 ? "Disponible" : "Por consultar disponibilidad"}
                        </div>

                        <div className="detalle-comprar">
                            <div className="detalle-cantidad">
                                <button
                                    type="button"
                                    onClick={() => setCantidad((c) => Math.max(1, c - 1))}
                                >
                                    <FaMinus />
                                </button>
                                <span>{cantidad}</span>
                                <button
                                    type="button"
                                    onClick={() => setCantidad((c) => c + 1)}
                                >
                                    <FaPlus />
                                </button>
                            </div>

                            <button
                                type="button"
                                className={agregado ? "detalle-agregar agregado" : "detalle-agregar"}
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
                        </div>

                        <a
                            href={`${site.whatsappUrl}?text=${mensaje}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="detalle-whatsapp"
                        >
                            <FaWhatsapp /> Preguntar por este producto
                        </a>

                        <p className="detalle-retiro">
                            <FaCheckCircle /> Hacemos envíos dentro del área local. También podés retirar en tienda.
                        </p>
                    </div>
                </div>

                {relacionados.length > 0 && (
                    <div className="detalle-relacionados">
                        <h2 className="detalle-relacionados-titulo">También te puede gustar</h2>

                        <div className="products-grid">
                            {relacionados.map((rel) => (
                                <ProductoCard
                                    key={rel.id_producto ?? rel.id}
                                    producto={rel}
                                />
                            ))}
                        </div>
                    </div>
                )}
        </div>
    );
}

export default ProductoDetalle;
