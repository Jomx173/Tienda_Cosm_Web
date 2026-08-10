import { useState } from "react";
import { Link } from "react-router-dom";

import { FaArrowLeft, FaMinus, FaPlus, FaTrash, FaCheckCircle, FaMapMarkerAlt } from "react-icons/fa";

import TopBar from "../../components/TopBar/TopBar";
import Navbar from "../../components/Navbar/Navbar";
import Footer from "../../components/Footer/Footer";
import WhatsAppButton from "../../components/WhatsAppButton/WhatsAppButton";

import { useCarrito } from "../../context/CarritoContext";
import { crearPedido } from "../../services/pedidoService";
import { rutaImagen } from "../../services/api";

import "./Carrito.css";

function Carrito() {
    const { items, cambiarCantidad, quitar, vaciar, total, cantidadTotal } = useCarrito();

    const [nombre, setNombre] = useState("");
    const [telefono, setTelefono] = useState("");
    const [direccion, setDireccion] = useState("");
    const [enviando, setEnviando] = useState(false);
    const [enviado, setEnviado] = useState(false);
    const [error, setError] = useState("");

    const soloLetras = (valor) => /^[a-zA-ZáéíóúÁÉÍÓÚñÑüÜ' ]*$/.test(valor);

    const soloNumeros = (valor) => /^[0-9+()\- ]*$/.test(valor);

    const manejarNombre = (e) => {
        const valor = e.target.value;

        if (soloLetras(valor)) {
            setNombre(valor);
        }
    };

    const manejarTelefono = (e) => {
        const valor = e.target.value;

        if (soloNumeros(valor)) {
            setTelefono(valor);
        }
    };

    const ordenar = async () => {
        if (!nombre.trim()) {
            setError("Escribe tu nombre para poder realizar el pedido.");
            return;
        }

        if (!/^[a-zA-ZáéíóúÁÉÍÓÚñÑüÜ' ]+$/.test(nombre.trim())) {
            setError("El nombre solo puede contener letras.");
            return;
        }

        if (!telefono.trim()) {
            setError("Escribe tu número de teléfono para poder realizar el pedido.");
            return;
        }

        if (!/^[0-9+()\- ]+$/.test(telefono.trim())) {
            setError("El teléfono solo puede contener números.");
            return;
        }

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

            vaciar();
            setNombre("");
            setTelefono("");
            setDireccion("");
            setEnviado(true);
        } catch (err) {
            setError(err.response?.data?.mensaje || "No se pudo enviar el pedido. Intenta de nuevo.");
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
                            Tu pedido llegó a la tienda. Te contactarán a tu teléfono para
                            confirmarlo. Coordinaremos el envío o el retiro en nuestro local.
                        </p>
                        <Link to="/" className="carrito-vacio-btn">Seguir comprando</Link>
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
                                            L {Number(item.precio).toFixed(2)}
                                        </p>

                                        <div className="carrito-item-controls">
                                            <div className="carrito-cantidad">
                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        cambiarCantidad(item.id, item.cantidad - 1)
                                                    }
                                                >
                                                    <FaMinus />
                                                </button>
                                                <span>{item.cantidad}</span>
                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        cambiarCantidad(item.id, item.cantidad + 1)
                                                    }
                                                >
                                                    <FaPlus />
                                                </button>
                                            </div>

                                            <button
                                                type="button"
                                                className="carrito-item-eliminar"
                                                onClick={() => quitar(item.id)}
                                                title="Quitar"
                                            >
                                                <FaTrash />
                                            </button>
                                        </div>
                                    </div>

                                    <p className="carrito-item-subtotal">
                                        L {(Number(item.precio) * item.cantidad).toFixed(2)}
                                    </p>
                                </div>
                            ))}
                        </div>

                        <div className="carrito-resumen">
                            <h3>Resumen</h3>

                            <div className="carrito-resumen-linea">
                                <span>Productos ({cantidadTotal})</span>
                                <span>L {total.toFixed(2)}</span>
                            </div>

                            <div className="carrito-resumen-total">
                                <span>Total</span>
                                <span>L {total.toFixed(2)}</span>
                            </div>

                            <p className="carrito-retiro">
                                <FaMapMarkerAlt /> Hacemos envíos dentro del área local. También podés retirar en tienda.
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
                                    maxLength={20}
                                    inputMode="tel"
                                    required
                                />
                                <input
                                    type="text"
                                    placeholder="Dirección para envío local (opcional)"
                                    value={direccion}
                                    onChange={(e) => setDireccion(e.target.value)}
                                    maxLength={300}
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
                                contactarán a tu teléfono para confirmarlo y coordinar el
                                envío dentro del área local o el retiro en nuestro local.
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
