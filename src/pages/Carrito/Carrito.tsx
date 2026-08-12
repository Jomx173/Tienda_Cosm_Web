import { useState, type ChangeEvent } from "react";
import { Link } from "react-router-dom";

import { FaArrowLeft, FaMinus, FaPlus, FaTrash, FaCheckCircle, FaMapMarkerAlt } from "react-icons/fa";

import TopBar from "../../components/TopBar/TopBar";
import Navbar from "../../components/Navbar/Navbar";
import Footer from "../../components/Footer/Footer";
import WhatsAppButton from "../../components/WhatsAppButton/WhatsAppButton";

import { useDispatch, useSelector } from "../../store";
import { Action as ActionCarrito } from "../../store/slices/Carrito";
import SelectorCarrito from "../../store/slices/Carrito/selectors";
import { crearPedido } from "../../services/pedidoService";
import { rutaImagen } from "../../services/api";
import { formatearPrecio } from "../../utils/precio";

import "./Carrito.css";

function Carrito() {
    const dispatch = useDispatch();
    const items = useSelector(SelectorCarrito.getItems);
    const total = useSelector(SelectorCarrito.getTotal);
    const cantidadTotal = useSelector(SelectorCarrito.getCantidadTotal);

    const [nombre, setNombre] = useState("");
    const [telefono, setTelefono] = useState("");
    const [direccion, setDireccion] = useState("");
    const [enviando, setEnviando] = useState(false);
    const [enviado, setEnviado] = useState(false);
    const [revisando, setRevisando] = useState(false);
    const [error, setError] = useState("");

    const soloLetras = (valor: string) => /^[a-zA-ZáéíóúÁÉÍÓÚñÑüÜ' ]*$/.test(valor);

    const manejarNombre = (e: ChangeEvent<HTMLInputElement>) => {
        const valor = e.target.value;

        if (soloLetras(valor)) {
            setNombre(valor);
        }
    };

    const manejarTelefono = (e: ChangeEvent<HTMLInputElement>) => {
        const valor = e.target.value.replace(/\D/g, "").slice(0, 8);
        setTelefono(valor);
    };

    const ordenar = () => {
        if (!nombre.trim()) {
            setError("Escribe tu nombre para poder realizar el pedido.");
            return;
        }

        if (!/^[a-zA-ZáéíóúÁÉÍÓÚñÑüÜ' ]+$/.test(nombre.trim())) {
            setError("El nombre solo puede contener letras.");
            return;
        }

        if (!/^\d{8}$/.test(telefono)) {
            setError("El número de teléfono debe tener 8 dígitos.");
            return;
        }

        if (!direccion.trim()) {
            setError("Escribe tu dirección para poder realizar el pedido.");
            return;
        }

        setError("");
        setRevisando(true);
    };

    const confirmar = async () => {
        setEnviando(true);
        setError("");

        try {
            await crearPedido({
                nombre_cliente: nombre,
                telefono_cliente: telefono,
                direccion: direccion.trim(),
                productos: items.map((item) => ({
                    id_producto: item.id,
                    nombre: item.nombre,
                    precio: item.precio,
                    cantidad: item.cantidad,
                })),
            });

            dispatch(ActionCarrito.vaciar());
            setNombre("");
            setTelefono("");
            setDireccion("");
            setRevisando(false);
            setEnviado(true);
        } catch (err) {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const axiosError = err as any;
            setError(
                axiosError?.response?.data?.mensaje ||
                    "No se pudo enviar el pedido. Intenta de nuevo."
            );
        } finally {
            setEnviando(false);
        }
    };

    return (
        <div className="carrito-page">
            <TopBar />

            <Navbar />

            <div className="carrito">
                <div className="carrito-back">
                    <Link to="/" className="carrito-volver">
                        <FaArrowLeft /> Seguir comprando
                    </Link>
                </div>

                <h1 className="carrito-titulo">Mi carrito</h1>

                {enviado ? (
                    <div className="carrito-vacio carrito-exito">
                        <FaCheckCircle className="carrito-exito-icono" />
                        <h2>¡Pedido enviado!</h2>
                        <p>
                            Tu pedido llegó a la tienda. Te contactarán a tu
                            teléfono para confirmarlo. Coordinaremos el envío.
                        </p>
                        <Link to="/" className="carrito-vacio-btn">Seguir comprando</Link>
                    </div>
                ) : revisando ? (
                    <div className="carrito-revision">
                        <div className="carrito-revision-cab">
                            <h2>Revisá tu pedido</h2>
                            <p>Confirmá tus datos y tu dirección para enviar el pedido.</p>
                        </div>

                        <div className="carrito-revision-grid">
                            <div className="carrito-revision-datos">
                                <h3>Tus datos</h3>

                                <div className="carrito-revision-fila">
                                    <span className="carrito-revision-label">Nombre</span>
                                    <span className="carrito-revision-valor">{nombre}</span>
                                </div>

                                <div className="carrito-revision-fila">
                                    <span className="carrito-revision-label">Teléfono</span>
                                    <span className="carrito-revision-valor">{telefono}</span>
                                </div>

                                <div className="carrito-revision-fila">
                                    <span className="carrito-revision-label">Dirección</span>
                                    <span className="carrito-revision-valor">{direccion}</span>
                                </div>
                            </div>

                            <div className="carrito-revision-productos">
                                <h3>Tus productos</h3>

                                <ul>
                                    {items.map((item) => (
                                        <li key={item.id}>
                                            <span>
                                                {item.nombre} x{item.cantidad}
                                            </span>
                                            <span>{formatearPrecio(Number(item.precio) * item.cantidad)}</span>
                                        </li>
                                    ))}
                                </ul>

                                <div className="carrito-revision-total">
                                    <span>Total</span>
                                    <span>{formatearPrecio(total)}</span>
                                </div>
                            </div>
                        </div>

                        {error && <p className="carrito-error">{error}</p>}

                        <div className="carrito-revision-acciones">
                            <button
                                type="button"
                                className="carrito-volver-editar"
                                onClick={() => setRevisando(false)}
                                disabled={enviando}
                            >
                                Volver
                            </button>

                            <button
                                type="button"
                                className="carrito-ordenar"
                                onClick={confirmar}
                                disabled={enviando}
                            >
                                {enviando ? "Enviando pedido..." : "Confirmar y enviar"}
                            </button>
                        </div>
                    </div>
                ) : items.length === 0 ? (
                    <div className="carrito-vacio">
                        <p>Tu carrito está vacío.</p>
                        <Link to="/" className="carrito-vacio-btn">Seguir comprando</Link>
                    </div>
                ) : (
                    <div className="carrito-grid">
                        <div className="carrito-lista">
                            {items.map((item) => (
                                <div className="carrito-item" key={item.id}>
                                    <div className="carrito-item-img">
                                        {item.imagen ? (
                                            <img src={rutaImagen(item.imagen)} alt={item.nombre} />
                                        ) : (
                                            <span className="sin-imagen">—</span>
                                        )}
                                    </div>

                                    <div className="carrito-item-info">
                                        <p className="carrito-item-nombre">{item.nombre}</p>
                                        <p className="carrito-item-precio">
                                            {formatearPrecio(item.precio)}
                                        </p>

                                        <div className="carrito-item-controls">
                                            <div className="carrito-cantidad">
                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        dispatch(
                                                            ActionCarrito.cambiarCantidad({
                                                                id: item.id,
                                                                cantidad: item.cantidad - 1,
                                                            })
                                                        )
                                                    }
                                                >
                                                    <FaMinus />
                                                </button>
                                                <span>{item.cantidad}</span>
                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        dispatch(
                                                            ActionCarrito.cambiarCantidad({
                                                                id: item.id,
                                                                cantidad: item.cantidad + 1,
                                                            })
                                                        )
                                                    }
                                                >
                                                    <FaPlus />
                                                </button>
                                            </div>

                                            <button
                                                type="button"
                                                className="carrito-item-eliminar"
                                                onClick={() => dispatch(ActionCarrito.quitar(item.id))}
                                                title="Quitar"
                                            >
                                                <FaTrash />
                                            </button>
                                        </div>
                                    </div>

                                    <p className="carrito-item-subtotal">
                                        {formatearPrecio(Number(item.precio) * item.cantidad)}
                                    </p>
                                </div>
                            ))}
                        </div>

                        <div className="carrito-resumen">
                            <h3>Resumen</h3>

                            <div className="carrito-resumen-linea">
                                <span>Productos ({cantidadTotal})</span>
                                <span>{formatearPrecio(total)}</span>
                            </div>

                            <div className="carrito-resumen-total">
                                <span>Total</span>
                                <span>{formatearPrecio(total)}</span>
                            </div>

                            <p className="carrito-retiro">
                                <FaMapMarkerAlt /> Envíos a nivel nacional
                            </p>

                            <div className="carrito-datos">
                                <input
                                    type="text"
                                    placeholder="Tu nombre *"
                                    value={nombre}
                                    onChange={manejarNombre}
                                    maxLength={80}
                                    required
                                />
                                <input
                                    type="tel"
                                    placeholder="Tu número de teléfono *"
                                    value={telefono}
                                    onChange={manejarTelefono}
                                    maxLength={8}
                                    inputMode="numeric"
                                    required
                                />
                                <input
                                    type="text"
                                    placeholder="Dirección de envío *"
                                    value={direccion}
                                    onChange={(e) => setDireccion(e.target.value)}
                                    maxLength={300}
                                    required
                                />
                            </div>

                            {error && <p className="carrito-error">{error}</p>}

                            <button
                                type="button"
                                className="carrito-ordenar"
                                onClick={ordenar}
                                disabled={enviando}
                            >
                                {enviando ? "Enviando pedido..." : "Enviar pedido"}
                            </button>

                            <Link to="/" className="carrito-seguir">
                                Seguir comprando
                            </Link>

                            <p className="carrito-ayuda">
                                Al enviar, tu pedido queda registrado en la tienda. Te
                                contactarán a tu teléfono para confirmarlo y coordinar el envío.
                            </p>
                        </div>
                    </div>
                )}
            </div>

            <Footer />

            <WhatsAppButton />
        </div>
    );
}

export default Carrito;
