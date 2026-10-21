import { useEffect, useMemo, useState } from "react";
import { useParams, Link } from "react-router-dom";

import { FaWhatsapp, FaArrowLeft, FaCheckCircle, FaCartPlus, FaMinus, FaPlus, FaCheck, FaHome, FaChevronRight } from "react-icons/fa";

import { obtenerProducto, obtenerProductos } from "../../services/productoService";
import { rutaImagen } from "../../services/api";
import type { Producto, ProductoImagen, ProductoVariante } from "../../services/types";
import { useDispatch } from "../../store";
import { Action as ActionCarrito } from "../../store/slices/Carrito";
import Navbar from "../../components/Navbar/Navbar";
import ProductoCard from "../../components/ProductoCard/ProductoCard";
import site from "../../config/site";
import { toastExito } from "../../utils/toast";
import { formatearPrecio } from "../../utils/precio";

import "./ProductoDetalle.css";

/** Color vino de MD Beauty por defecto cuando una variante no tiene color */
const COLOR_TONO_POR_DEFECTO = "#701522";

// Una variante solo es comprable si existe, está activa y tiene stock confirmado.
// Nunca tratamos null/undefined como disponible.
const varianteDisponible = (v: ProductoVariante | null | undefined): boolean => {
    if (!v || typeof v !== "object") return false;
    if (v.estado === false) return false;

    const stock = Number(v.stock);
    return Number.isFinite(stock) && stock > 0;
};

const esVarianteValida = (v: unknown): v is ProductoVariante =>
    Boolean(v) && typeof v === "object" && Number.isFinite(Number((v as ProductoVariante).id_variante));

const imagenesDeVariante = (v: ProductoVariante | null | undefined): string[] => {
    if (!v || !Array.isArray(v.imagenes)) return [];
    return v.imagenes
        .map((img) => img.imagen)
        .filter((src): src is string => Boolean(src));
};

function ProductoDetalle() {
    const { id } = useParams();
    const dispatch = useDispatch();

    const [producto, setProducto] = useState<Producto | null>(null);
    const [cargando, setCargando] = useState(true);
    const [error, setError] = useState("");
    const [cantidad, setCantidad] = useState(1);
    const [agregado, setAgregado] = useState(false);
    const [relacionados, setRelacionados] = useState<Producto[]>([]);

    const [idVarianteSel, setIdVarianteSel] = useState<number | null>(null);
    const [imagenActiva, setImagenActiva] = useState(0);

    useEffect(() => {
        let activo = true;

        if (!id) {
            setCargando(false);
            setError("El producto no existe o ya no está disponible.");
            return;
        }

        obtenerProducto(id)
            .then((data) => {
                if (activo) setProducto(data);
            })
            .catch((err) => {
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                const axiosError = err as any;
                if (activo) {
                    setError(
                        axiosError?.response?.status === 404
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
                            p.id_producto !== Number(id)
                    )
                    .slice(0, 4);

                setRelacionados(mismos);
            })
            .catch(() => {});

        return () => {
            activo = false;
        };
    }, [producto, id]);

    const variantes = useMemo(
        () =>
            (producto?.variantes ?? [])
                .filter(esVarianteValida)
                .filter((v) => v.estado !== false),
        [producto]
    );

    const tieneVariantes = variantes.length > 0;

    // Elegir por defecto la primera variante disponible
    useEffect(() => {
        if (!tieneVariantes) {
            setIdVarianteSel(null);
            return;
        }

        if (idVarianteSel && variantes.some((v) => v.id_variante === idVarianteSel)) {
            return;
        }

        const primeraDisponible = variantes.find(varianteDisponible) ?? variantes[0];
        setIdVarianteSel(primeraDisponible?.id_variante ?? null);
    }, [variantes, tieneVariantes, idVarianteSel]);

    const varianteActual = useMemo(
        () => variantes.find((v) => v.id_variante === idVarianteSel) ?? null,
        [variantes, idVarianteSel]
    );

    // Galería: imágenes propias de la variante primero; si no tiene, las del
    // producto más la imagen heredada del producto antiguo.
    const galeria = useMemo(() => {
        const propias = imagenesDeVariante(varianteActual);

        if (propias.length > 0) return propias;

        const delProducto = (producto?.imagenes ?? [])
            .map((img: ProductoImagen) => img.imagen)
            .filter((src): src is string => Boolean(src));

        if (producto?.imagen && !delProducto.includes(producto.imagen)) {
            delProducto.unshift(producto.imagen);
        }

        return delProducto;
    }, [varianteActual, producto]);

    useEffect(() => {
        setImagenActiva(0);
    }, [idVarianteSel]);

    // Ajustar la cantidad al stock de la variante seleccionada.
    // Con variantes sin selección válida, no exponemos stock del producto.
    const stockDisponible = varianteActual
        ? Number(varianteActual.stock)
        : tieneVariantes
            ? 0
            : Number(producto?.stock ?? 0);

    useEffect(() => {
        setCantidad((c) => Math.min(Math.max(1, c), Math.max(1, stockDisponible)));
    }, [stockDisponible]);

    if (cargando) {
        return (
            <>
                <Navbar />

                <div className="detalle">
                    <div className="detalle-cargando">Cargando producto...</div>
                </div>
            </>
        );
    }

    if (error || !producto) {
        return (
            <>
                <Navbar />

                <div className="detalle">
                    <div className="detalle-error">
                        <h2>Producto no disponible</h2>
                        <p>{error}</p>
                        <Link to="/" className="detalle-volver">← Volver a la tienda</Link>
                    </div>
                </div>
            </>
        );
    }

    const precioAnteriorRaw = varianteActual
        ? varianteActual.precio_anterior
        : producto.precio_anterior ?? producto.precioAnterior;

    const precioActualRaw = varianteActual ? varianteActual.precio : producto.precio;

    const esNuevo = producto.destacado ?? producto.nuevo;
    const precioAnteriorNum = Number(precioAnteriorRaw);
    const precioNum = Number(precioActualRaw);
    const esOferta = precioAnteriorNum > 0 && precioNum > 0 && precioAnteriorNum > precioNum;
    const descuento = esOferta
        ? Math.round(((precioAnteriorNum - precioNum) / precioAnteriorNum) * 100)
        : 0;
    const nombreCategoria =
        typeof producto.categoria === "string"
            ? producto.categoria
            : producto.categoria?.nombre ?? "";

    // Con variantes: solo se puede comprar si hay una variante seleccionada y disponible.
    // Sin variantes: se usa el stock del producto.
    const hayDisponible = tieneVariantes
        ? varianteDisponible(varianteActual)
        : Number.isFinite(Number(producto?.stock)) && Number(producto?.stock) > 0;

    const seleccionarVariante = (v: ProductoVariante) => {
        if (!varianteDisponible(v)) return;
        setIdVarianteSel(v.id_variante);
        setCantidad(1);
    };

    const agregarAlCarrito = () => {
        if (tieneVariantes && !varianteActual) {
            return;
        }

        if (!hayDisponible) return;

        dispatch(
            ActionCarrito.agregar({
                producto,
                cantidad,
                variante: varianteActual
                    ? {
                        id_variante: varianteActual.id_variante,
                        tono: varianteActual.tono,
                        precio: varianteActual.precio,
                        stock: Number(varianteActual.stock),
                    }
                    : null,
            })
        );

        setAgregado(true);
        toastExito(
            varianteActual
                ? `${producto.nombre} (${varianteActual.tono}) se agregó al carrito`
                : `${producto.nombre} se agregó al carrito`
        );

        setTimeout(() => setAgregado(false), 1500);
    };

    return (
        <>
            <Navbar />

            <div className="detalle">
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
                        href={site.whatsappUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="detalle-pregunta"
                    >
                        ¿Preguntas sobre el producto? Escríbenos por <strong>WhatsApp</strong>
                    </a>

                    <div className="detalle-galeria">
                        <div className="detalle-img">
                            {galeria.length > 0 ? (
                                <img
                                    src={rutaImagen(galeria[imagenActiva] ?? galeria[0])}
                                    alt={producto.nombre}
                                />
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

                        {galeria.length > 1 && (
                            <div className="detalle-miniaturas">
                                {galeria.map((src, i) => (
                                    <button
                                        key={`${src}-${i}`}
                                        type="button"
                                        className={
                                            i === imagenActiva
                                                ? "detalle-miniatura activo"
                                                : "detalle-miniatura"
                                        }
                                        onClick={() => setImagenActiva(i)}
                                        aria-label={`Ver imagen ${i + 1}`}
                                        aria-pressed={i === imagenActiva}
                                    >
                                        <img src={rutaImagen(src)} alt="" />
                                    </button>
                                ))}
                            </div>
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
                                    <span className="precio-anterior">{formatearPrecio(precioAnteriorNum)}</span>
                                )}
                                <span className="precio-actual">{formatearPrecio(precioNum)}</span>
                            </div>
                        </div>

                        {producto.descripcion && (
                            <p className="detalle-desc">{producto.descripcion}</p>
                        )}

                        {tieneVariantes && (
                            <div className="detalle-tonos">
                                <span className="detalle-tonos-etiqueta">Tono</span>

                                <div className="detalle-tonos-opciones" role="radiogroup" aria-label="Tono">
                                    {variantes.map((v) => {
                                        const disponible = varianteDisponible(v);
                                        const activa = v.id_variante === idVarianteSel;

                                        return (
                                            <button
                                                key={v.id_variante}
                                                type="button"
                                                role="radio"
                                                aria-checked={activa}
                                                className={
                                                    "detalle-tono" +
                                                    (activa ? " activo" : "") +
                                                    (disponible ? "" : " agotado")
                                                }
                                                onClick={() => seleccionarVariante(v)}
                                                disabled={!disponible}
                                                title={
                                                    disponible
                                                        ? v.tono
                                                        : `${v.tono} (agotado)`
                                                }
                                                style={
                                                    v.color
                                                        ? { borderColor: v.color }
                                                        : undefined
                                                }
                                            >
                                                <span
                                                    className="detalle-tono-color"
                                                    style={{ background: v.color || COLOR_TONO_POR_DEFECTO }}
                                                />
                                                <span className="detalle-tono-nombre">{v.tono}</span>
                                                {!disponible && (
                                                    <span className="detalle-tono-agotado">
                                                        Agotado
                                                    </span>
                                                )}
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>
                        )}

                        <div className="detalle-stock">
                            <FaCheckCircle />
                            {hayDisponible
                                ? `Disponible${tieneVariantes ? ` (${stockDisponible} en este tono)` : ""}`
                                : "Por consultar disponibilidad"}
                        </div>

                        <div className="detalle-comprar">
                            <div className="detalle-cantidad">
                                <button
                                    type="button"
                                    onClick={() => setCantidad((c) => Math.max(1, c - 1))}
                                    aria-label="Quitar una unidad"
                                >
                                    <FaMinus />
                                </button>
                                <span>{cantidad}</span>
                                <button
                                    type="button"
                                    onClick={() =>
                                        setCantidad((c) =>
                                            Math.min(stockDisponible > 0 ? stockDisponible : c + 1, c + 1)
                                        )
                                    }
                                    aria-label="Agregar una unidad"
                                >
                                    <FaPlus />
                                </button>
                            </div>

                            <button
                                type="button"
                                className={agregado ? "detalle-agregar agregado" : "detalle-agregar"}
                                onClick={agregarAlCarrito}
                                disabled={!hayDisponible}
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
                            href={site.whatsappUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="detalle-whatsapp"
                        >
                            <FaWhatsapp /> Preguntar por este producto
                        </a>

                        <p className="detalle-retiro">
                            <FaCheckCircle /> Envíos a nivel nacional
                        </p>
                    </div>
                </div>

                {relacionados.length > 0 && (
                    <div className="detalle-relacionados">
                        <h2 className="detalle-relacionados-titulo">También te puede gustar</h2>

                        <div className="products-grid">
                            {relacionados.map((rel) => (
                                <ProductoCard
                                    key={rel.id_producto}
                                    producto={rel}
                                />
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </>
    );
}

export default ProductoDetalle;
