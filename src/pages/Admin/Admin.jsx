import { useEffect, useRef, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import Swal from "sweetalert2";

import {
    FaPlus,
    FaEdit,
    FaTrash,
    FaSignOutAlt,
    FaEye,
    FaEyeSlash,
    FaBoxOpen,
    FaTags,
    FaImages,
    FaShoppingBag,
    FaWhatsapp,
    FaExclamationTriangle,
    FaBell,
    FaVolumeUp,
    FaVolumeMute,
    FaTachometerAlt,
    FaBars,
    FaCaretDown,
    FaPercent,
    FaFire,
    FaChartBar,
    FaExternalLinkAlt,
    FaSearch,
    FaTimes,
    FaMapMarkerAlt,
} from "react-icons/fa";

import {
    login,
    logout,
    getAdmin,
    estaAutenticado,
} from "../../services/authService";
import {
    obtenerProductos,
    obtenerCategorias,
    crearProducto,
    actualizarProducto,
    eliminarProducto,
    crearCategoria,
    actualizarCategoria,
    eliminarCategoria,
    obtenerBanners,
    crearBanner,
    actualizarBanner,
    eliminarBanner,
} from "../../services/productoService";
import { rutaImagen } from "../../services/api";
import { toastExito, toastError } from "../../utils/toast";
import {
    obtenerPedidos,
    actualizarEstadoPedido,
    eliminarPedido,
} from "../../services/pedidoService";
import site from "../../config/site";
import logo from "../../assets/logo/logo.png";
import ProductoCard from "../../components/ProductoCard/ProductoCard";
import Dashboard from "./Dashboard";

import "./Admin.css";

const MENU = [
    { id: "dashboard", etiqueta: "Dashboard", icono: FaTachometerAlt, ruta: "/admin/dashboard" },
    { id: "productos", etiqueta: "Productos", icono: FaBoxOpen, ruta: "/admin/productos" },
    { id: "categorias", etiqueta: "Categorías", icono: FaTags, ruta: "/admin/categorias" },
    { id: "ofertas", etiqueta: "Ofertas y Descuentos", icono: FaPercent, ruta: "/admin/ofertas" },
    { id: "pedidos", etiqueta: "Pedidos", icono: FaShoppingBag, ruta: "/admin/pedidos" },
    { id: "carrusel", etiqueta: "Imágenes/Banners", icono: FaImages, ruta: "/admin/imagenes" },
    { id: "reportes", etiqueta: "Reportes", icono: FaChartBar, ruta: "/admin/reportes" },
];

const RUTA_POR_ID = Object.fromEntries(MENU.map((m) => [m.id, m.ruta]));

const ID_POR_RUTA = {
    "/admin": "dashboard",
    "/admin/dashboard": "dashboard",
    "/admin/productos": "productos",
    "/admin/categorias": "categorias",
    "/admin/ofertas": "ofertas",
    "/admin/pedidos": "pedidos",
    "/admin/imagenes": "carrusel",
    "/admin/reportes": "reportes",
};

const TITULOS_SECCION = {
    dashboard: "Dashboard",
    productos: "Productos",
    categorias: "Categorías",
    ofertas: "Ofertas y Descuentos",
    pedidos: "Pedidos",
    carrusel: "Imágenes / Banners",
    reportes: "Reportes",
};

const formularioVacio = {
    nombre: "",
    descripcion: "",
    precio: "",
    precio_anterior: "",
    stock: "",
    codigo: "",
    subcategoria: "",
    id_categoria: "",
    estado: true,
    destacado: false,
    imagen: null,
};

const categoriaVacia = {
    id_categoria: null,
    nombre: "",
    descripcion: "",
};

const bannerVacio = {
    titulo: "",
    descripcion: "",
    boton: "",
    orden: 0,
    estado: true,
    imagen: null,
};

function Admin() {
    const [autenticado, setAutenticado] = useState(() => estaAutenticado());

    const [identidad, setIdentidad] = useState("");
    const [password, setPassword] = useState("");
    const [verPassword, setVerPassword] = useState(false);
    const [error, setError] = useState("");

    const [productos, setProductos] = useState([]);
    const [categorias, setCategorias] = useState([]);
    const [banners, setBanners] = useState([]);
    const [pedidos, setPedidos] = useState([]);

    const ultimoIdPedido = useRef(0);
    const [sonidoActivo, setSonidoActivo] = useState(true);
    const sonidoActivoRef = useRef(true);
    const pedidosRef = useRef([]);

    const reproducirSonido = () => {
        if (!sonidoActivoRef.current) return;

        try {
            const ctx = new (window.AudioContext || window.webkitAudioContext)();

            const notas = [880, 1108];

            notas.forEach((frecuencia, i) => {
                const osc = ctx.createOscillator();
                const ganancia = ctx.createGain();

                osc.type = "sine";
                osc.frequency.value = frecuencia;

                ganancia.gain.setValueAtTime(0, ctx.currentTime + i * 0.2);
                ganancia.gain.linearRampToValueAtTime(0.3, ctx.currentTime + i * 0.2 + 0.02);
                ganancia.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + i * 0.2 + 0.4);

                osc.connect(ganancia);
                ganancia.connect(ctx.destination);

                osc.start(ctx.currentTime + i * 0.2);
                osc.stop(ctx.currentTime + i * 0.2 + 0.45);
            });
        } catch {
            // Sin audio disponible
        }
    };

    const mostrarNotificacion = (titulo, cuerpo) => {
        if (!("Notification" in window)) return;

        if (Notification.permission === "granted") {
            new Notification(titulo, { body: cuerpo, icon: "/favicon.ico" });
        } else if (Notification.permission !== "denied") {
            Notification.requestPermission();
        }
    };

    const navegar = useNavigate();
    const ubicacion = useLocation();

    const pestana = ID_POR_RUTA[ubicacion.pathname] || "dashboard";

    const [sidebarColapsada, setSidebarColapsada] = useState(() => {
        try {
            return localStorage.getItem("admin-sidebar-colapsada") === "1";
        } catch {
            return false;
        }
    });

    const [menuAbierto, setMenuAbierto] = useState(false);
    const [dropdownAbierto, setDropdownAbierto] = useState(false);
    const [reporteDesde, setReporteDesde] = useState("");
    const [reporteHasta, setReporteHasta] = useState("");
    const adminRef = useRef(null);
    const avatarRef = useRef(null);

    useEffect(() => {
        try {
            localStorage.setItem(
                "admin-sidebar-colapsada",
                sidebarColapsada ? "1" : "0"
            );
        } catch {
            // Sin almacenamiento disponible
        }
    }, [sidebarColapsada]);

    const alternarSidebar = () => {
        if (window.innerWidth <= 992) {
            setMenuAbierto(true);
        } else {
            setSidebarColapsada((c) => !c);
        }
    };

    useEffect(() => {
        const cerrar = (e) => {
            if (adminRef.current && !adminRef.current.contains(e.target)) {
                setDropdownAbierto(false);
                setMenuAbierto(false);
            }
        };

        document.addEventListener("click", cerrar);

        return () => document.removeEventListener("click", cerrar);
    }, []);

    useEffect(() => {
        const cerrar = (e) => {
            if (avatarRef.current && !avatarRef.current.contains(e.target)) {
                setDropdownAbierto(false);
            }
        };

        const onKey = (e) => {
            if (e.key === "Escape") {
                setDropdownAbierto(false);
            }
        };

        document.addEventListener("click", cerrar);
        document.addEventListener("keydown", onKey);

        return () => {
            document.removeEventListener("click", cerrar);
            document.removeEventListener("keydown", onKey);
        };
    }, []);

    const [formulario, setFormulario] = useState(formularioVacio);
    const [editando, setEditando] = useState(null);
    const [mostrarForm, setMostrarForm] = useState(false);
    const [imagenPrevia, setImagenPrevia] = useState("");
    const [productoVisto, setProductoVisto] = useState(null);
    const [busquedaProductos, setBusquedaProductos] = useState("");
    const [cargando, setCargando] = useState(false);

    const [catForm, setCatForm] = useState(categoriaVacia);
    const [editandoCat, setEditandoCat] = useState(null);
    const [mostrarCatForm, setMostrarCatForm] = useState(false);

    const [bannerForm, setBannerForm] = useState(bannerVacio);
    const [editandoBanner, setEditandoBanner] = useState(null);
    const [mostrarBannerForm, setMostrarBannerForm] = useState(false);
    const [bannerImagenPrevia, setBannerImagenPrevia] = useState("");

    const cerrarSesionSiNoAutorizado = (err) => {
        if (err.response?.status === 401) {
            logout();
            setAutenticado(false);
        }
    };

    const cargarDatos = async () => {
        try {
            const [prods, cats, banns, peds] = await Promise.all([
                obtenerProductos(true),
                obtenerCategorias(),
                obtenerBanners(true),
                obtenerPedidos(),
            ]);

            setProductos(prods);
            setCategorias(cats);
            setBanners(banns);
            setPedidos(peds);
        } catch (err) {
            cerrarSesionSiNoAutorizado(err);
            toastError(err.response?.data?.mensaje || "No se pudieron cargar los datos");
        }
    };

    useEffect(() => {
        if (!autenticado) return;

        let activo = true;

        Promise.all([obtenerProductos(true), obtenerCategorias(), obtenerBanners(true), obtenerPedidos()])
            .then(([prods, cats, banns, peds]) => {
                if (!activo) return;
                setProductos(prods);
                setCategorias(cats);
                setBanners(banns);
                setPedidos(peds);
            })
            .catch((err) => {
                if (!activo) return;
                cerrarSesionSiNoAutorizado(err);
                toastError("No se pudieron cargar los datos");
            });

        return () => {
            activo = false;
        };
    }, [autenticado]);

    // Rastrear pedidos nuevos: al cargar, registra el último id; luego avisa al detectar uno nuevo
    useEffect(() => {
        if (!autenticado) return;

        const actualizar = async () => {
            try {
                const peds = await obtenerPedidos();

                pedidosRef.current = peds;
                setPedidos(peds);

                const maxId = peds.length ? Math.max(...peds.map((p) => p.id_pedido)) : 0;

                if (ultimoIdPedido.current === 0) {
                    ultimoIdPedido.current = maxId;
                    return;
                }

                const nuevos = peds.filter(
                    (p) => p.id_pedido > ultimoIdPedido.current && p.estado === "pendiente"
                );

                if (nuevos.length > 0) {
                    ultimoIdPedido.current = maxId;

                    reproducirSonido();
                    mostrarNotificacion(
                        "Nuevo pedido en MD 🛍️",
                        `${nuevos.length} pedido${nuevos.length > 1 ? "s" : ""} nuevo${nuevos.length > 1 ? "s" : ""} de ${nuevos[0].nombre_cliente || "un cliente"} por L ${nuevos[0].total}`
                    );

                    Swal.fire({
                        icon: "info",
                        title: "¡Nuevo pedido! 🛍️",
                        html: `${nuevos.length} pedido${nuevos.length > 1 ? "s" : ""} nuevo${nuevos.length > 1 ? "s" : ""} recibido${nuevos.length > 1 ? "s" : ""}.<br><br><strong>${nuevos[0].nombre_cliente || "Cliente"}</strong> — L ${nuevos[0].total}`,
                        confirmButtonText: "Ver pedidos",
                        showCancelButton: true,
                        cancelButtonText: "Después",
                        confirmButtonColor: "#7B1023",
                    }).then((resultado) => {
                        if (resultado.isConfirmed) {
                            navegar("/admin/pedidos");
                        }
                    });
                } else {
                    ultimoIdPedido.current = maxId;
                }
            } catch (err) {
                cerrarSesionSiNoAutorizado(err);
            }
        };

        actualizar();

        const intervalo = setInterval(actualizar, 15000);

        return () => clearInterval(intervalo);
    }, [autenticado, navegar]);

    const handleLogin = async (e) => {
        e.preventDefault();
        setCargando(true);
        setError("");

        try {
            await login(identidad, password);
            setAutenticado(true);
        } catch (err) {
            setError(err.response?.data?.mensaje || "Error al iniciar sesión");
        } finally {
            setCargando(false);
        }
    };

    const handleLogout = () => {
        logout();
        setAutenticado(false);
        setProductos([]);
        setMenuAbierto(false);
        setDropdownAbierto(false);
    };

    // ------- Productos -------

    const abrirNuevo = () => {
        setEditando(null);
        setFormulario(formularioVacio);
        setImagenPrevia("");
        setMostrarForm(true);
        navegar("/admin/productos");
    };

    const abrirEdicion = (producto) => {
        setEditando(producto);
        setFormulario({
            nombre: producto.nombre,
            descripcion: producto.descripcion || "",
            precio: producto.precio,
            precio_anterior: producto.precio_anterior ?? "",
            stock: producto.stock,
            codigo: producto.codigo || "",
            subcategoria: producto.subcategoria || "",
            id_categoria: producto.id_categoria,
            estado: producto.estado,
            destacado: producto.destacado,
            imagen: null,
        });
        setImagenPrevia(producto.imagen ? rutaImagen(producto.imagen) : "");
        setMostrarForm(true);
        navegar("/admin/productos");
    };

    const cancelarForm = () => {
        setMostrarForm(false);
        setEditando(null);
        setFormulario(formularioVacio);
        setImagenPrevia("");
    };

    const verProducto = (producto) => {
        setProductoVisto(producto);
    };

    const cerrarVistaProducto = () => {
        setProductoVisto(null);
    };

    const editarProductoVisto = () => {
        const producto = productoVisto;
        cerrarVistaProducto();
        abrirEdicion(producto);
    };

    useEffect(() => {
        if (!productoVisto) return;

        const onKey = (e) => {
            if (e.key === "Escape") cerrarVistaProducto();
        };

        document.addEventListener("keydown", onKey);

        return () => document.removeEventListener("keydown", onKey);
    }, [productoVisto]);

    useEffect(() => {
        if (!mostrarForm) return;

        const onKey = (e) => {
            if (e.key === "Escape") cancelarForm();
        };

        document.addEventListener("keydown", onKey);

        return () => document.removeEventListener("keydown", onKey);
    }, [mostrarForm]);

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;

        setFormulario((prev) => ({
            ...prev,
            [name]: type === "checkbox" ? checked : value,
        }));
    };

    const handleImagen = (e) => {
        const archivo = e.target.files[0];

        setFormulario((prev) => ({ ...prev, imagen: archivo }));

        if (archivo) {
            setImagenPrevia(URL.createObjectURL(archivo));
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setCargando(true);

        try {
            const formData = new FormData();
            formData.append("nombre", formulario.nombre);
            formData.append("descripcion", formulario.descripcion);
            formData.append("precio", formulario.precio);
            formData.append("precio_anterior", formulario.precio_anterior || "");
            formData.append("stock", formulario.stock);
            formData.append("codigo", formulario.codigo || "");
            formData.append("subcategoria", formulario.subcategoria || "");
            formData.append("id_categoria", formulario.id_categoria);
            formData.append("estado", formulario.estado ? "1" : "0");
            formData.append("destacado", formulario.destacado ? "1" : "0");

            if (formulario.imagen) {
                formData.append("imagen", formulario.imagen);
            }

            if (editando) {
                await actualizarProducto(editando.id_producto, formData);
                toastExito("Producto actualizado");
            } else {
                await crearProducto(formData);
                toastExito("Producto creado");
            }

            cancelarForm();
            await cargarDatos();
        } catch (err) {
            cerrarSesionSiNoAutorizado(err);
            toastError(err.response?.data?.mensaje || "No se pudo guardar el producto. Intenta de nuevo.");
        } finally {
            setCargando(false);
        }
    };

    const handleEliminar = async (producto) => {
        const confirmacion = await Swal.fire({
            title: "¿Eliminar producto?",
            text: producto.nombre,
            icon: "warning",
            showCancelButton: true,
            confirmButtonText: "Sí, eliminar",
            cancelButtonText: "Cancelar",
            confirmButtonColor: "#d33",
        });

        if (!confirmacion.isConfirmed) return;

        try {
            await eliminarProducto(producto.id_producto);
            toastExito("Producto eliminado");
            await cargarDatos();
        } catch (err) {
            cerrarSesionSiNoAutorizado(err);
            toastError(err.response?.data?.mensaje || "No se pudo eliminar el producto");
        }
    };

    // ------- Categorías -------

    const abrirNuevaCategoria = () => {
        setEditandoCat(null);
        setCatForm(categoriaVacia);
        setMostrarCatForm(true);
    };

    const abrirEdicionCategoria = (categoria) => {
        setEditandoCat(categoria);
        setCatForm({
            id_categoria: categoria.id_categoria,
            nombre: categoria.nombre,
            descripcion: categoria.descripcion || "",
        });
        setMostrarCatForm(true);
    };

    const cancelarCatForm = () => {
        setMostrarCatForm(false);
        setEditandoCat(null);
        setCatForm(categoriaVacia);
    };

    const handleCatChange = (e) => {
        const { name, value } = e.target;
        setCatForm((prev) => ({ ...prev, [name]: value }));
    };

    useEffect(() => {
        if (!mostrarCatForm) return;

        const onKey = (e) => {
            if (e.key === "Escape") cancelarCatForm();
        };

        document.addEventListener("keydown", onKey);

        return () => document.removeEventListener("keydown", onKey);
    }, [mostrarCatForm]);

    const handleCatSubmit = async (e) => {
        e.preventDefault();
        setCargando(true);

        try {
            const datos = {
                nombre: catForm.nombre,
                descripcion: catForm.descripcion,
            };

            if (editandoCat) {
                await actualizarCategoria(editandoCat.id_categoria, datos);
                toastExito("Categoría actualizada");
            } else {
                await crearCategoria(datos);
                toastExito("Categoría creada");
            }

            cancelarCatForm();
            await cargarDatos();
        } catch (err) {
            cerrarSesionSiNoAutorizado(err);
            toastError(err.response?.data?.mensaje || "No se pudo guardar la categoría. Intenta de nuevo.");
        } finally {
            setCargando(false);
        }
    };

    const handleEliminarCategoria = async (categoria) => {
        const confirmacion = await Swal.fire({
            title: "¿Eliminar categoría?",
            text: `${categoria.nombre}. Los productos seguirán existiendo.`,
            icon: "warning",
            showCancelButton: true,
            confirmButtonText: "Sí, eliminar",
            cancelButtonText: "Cancelar",
            confirmButtonColor: "#d33",
        });

        if (!confirmacion.isConfirmed) return;

        try {
            await eliminarCategoria(categoria.id_categoria);
            toastExito("Categoría eliminada");
            await cargarDatos();
        } catch (err) {
            cerrarSesionSiNoAutorizado(err);
            toastError(err.response?.data?.mensaje || "No se pudo eliminar la categoría");
        }
    };

    const productosDeCategoria = (id) =>
        productos.filter((p) => p.id_categoria === id).length;

    // ------- Carrusel (Banners) -------

    const abrirNuevoBanner = () => {
        setEditandoBanner(null);
        setBannerForm(bannerVacio);
        setBannerImagenPrevia("");
        setMostrarBannerForm(true);
    };

    const abrirEdicionBanner = (banner) => {
        setEditandoBanner(banner);
        setBannerForm({
            titulo: banner.titulo,
            descripcion: banner.descripcion || "",
            boton: banner.boton || "",
            orden: banner.orden,
            estado: banner.estado,
            imagen: null,
        });
        setBannerImagenPrevia(banner.imagen ? rutaImagen(banner.imagen) : "");
        setMostrarBannerForm(true);
    };

    const cancelarBannerForm = () => {
        setMostrarBannerForm(false);
        setEditandoBanner(null);
        setBannerForm(bannerVacio);
        setBannerImagenPrevia("");
    };

    const handleBannerChange = (e) => {
        const { name, value, type, checked } = e.target;
        setBannerForm((prev) => ({
            ...prev,
            [name]: type === "checkbox" ? checked : value,
        }));
    };

    useEffect(() => {
        if (!mostrarBannerForm) return;

        const onKey = (e) => {
            if (e.key === "Escape") cancelarBannerForm();
        };

        document.addEventListener("keydown", onKey);

        return () => document.removeEventListener("keydown", onKey);
    }, [mostrarBannerForm]);

    const handleBannerImagen = (e) => {
        const archivo = e.target.files[0];
        setBannerForm((prev) => ({ ...prev, imagen: archivo }));

        if (archivo) {
            setBannerImagenPrevia(URL.createObjectURL(archivo));
        }
    };

    const handleBannerSubmit = async (e) => {
        e.preventDefault();
        setCargando(true);

        try {
            const formData = new FormData();
            formData.append("titulo", bannerForm.titulo);
            formData.append("descripcion", bannerForm.descripcion);
            formData.append("boton", bannerForm.boton);
            formData.append("orden", bannerForm.orden);
            formData.append("estado", bannerForm.estado ? "1" : "0");

            if (bannerForm.imagen) {
                formData.append("imagen", bannerForm.imagen);
            }

            if (editandoBanner) {
                await actualizarBanner(editandoBanner.id_banner, formData);
                toastExito("Banner actualizado");
            } else {
                await crearBanner(formData);
                toastExito("Banner creado");
            }

            cancelarBannerForm();
            await cargarDatos();
        } catch (err) {
            cerrarSesionSiNoAutorizado(err);
            toastError(err.response?.data?.mensaje || "No se pudo guardar el banner. Intenta de nuevo.");
        } finally {
            setCargando(false);
        }
    };

    const handleEliminarBanner = async (banner) => {
        const confirmacion = await Swal.fire({
            title: "¿Eliminar banner?",
            text: banner.titulo,
            icon: "warning",
            showCancelButton: true,
            confirmButtonText: "Sí, eliminar",
            cancelButtonText: "Cancelar",
            confirmButtonColor: "#d33",
        });

        if (!confirmacion.isConfirmed) return;

        try {
            await eliminarBanner(banner.id_banner);
            toastExito("Banner eliminado");
            await cargarDatos();
        } catch (err) {
            cerrarSesionSiNoAutorizado(err);
            toastError(err.response?.data?.mensaje || "No se pudo eliminar el banner");
        }
    };

    // ------- Pedidos -------

    const ESTADOS = {
        pendiente: "Pendiente",
        confirmado: "Confirmado",
        completado: "Completado",
        cancelado: "Cancelado",
    };

    const formatearFecha = (fecha) => {
        try {
            return new Date(fecha).toLocaleString("es-HN", {
                day: "2-digit",
                month: "2-digit",
                year: "numeric",
                hour: "2-digit",
                minute: "2-digit",
            });
        } catch {
            return fecha || "";
        }
    };

    const handleCambiarEstado = async (pedido, nuevoEstado) => {
        try {
            await actualizarEstadoPedido(pedido.id_pedido, nuevoEstado);
            toastExito("Estado del pedido actualizado");
            await cargarDatos();
        } catch (err) {
            cerrarSesionSiNoAutorizado(err);
            toastError(err.response?.data?.mensaje || "No se pudo actualizar el pedido");
        }
    };

    const handleEliminarPedido = async (pedido) => {
        const confirmacion = await Swal.fire({
            title: "¿Eliminar pedido?",
            text: `Pedido #${pedido.id_pedido}. Esta acción no se puede deshacer.`,
            icon: "warning",
            showCancelButton: true,
            confirmButtonText: "Sí, eliminar",
            cancelButtonText: "Cancelar",
            confirmButtonColor: "#d33",
        });

        if (!confirmacion.isConfirmed) return;

        try {
            await eliminarPedido(pedido.id_pedido);
            toastExito("Pedido eliminado");
            await cargarDatos();
        } catch (err) {
            cerrarSesionSiNoAutorizado(err);
            toastError(err.response?.data?.mensaje || "No se pudo eliminar el pedido");
        }
    };

    const mensajeWhatsAppPedido = (pedido) => {
        const lineas = (pedido.productos || [])
            .map(
                (item) =>
                    `• ${item.nombre} x${item.cantidad} — L ${(
                        Number(item.precio) * item.cantidad
                    ).toFixed(2)}`
            )
            .join("\n");

        const nombreCliente = pedido.nombre_cliente
            ? `, ${pedido.nombre_cliente}`
            : "";

        const direccion = pedido.direccion
            ? `\n\n📦 Dirección de entrega: ${pedido.direccion}`
            : "";

        const mensajesPorEstado = {
            pendiente:
                `¡Hola${nombreCliente}! 👋 Gracias por tu pedido en ${site.nombre}.\n\n` +
                `Recibimos tu orden y está en proceso de confirmación.\n\n` +
                `${lineas}\n\nTotal: L ${Number(pedido.total).toFixed(2)}\n\n` +
                `Pronto te escribimos para confirmar. ¡Gracias! 💜`,
            confirmado:
                `¡Hola${nombreCliente}! ✅ Tu pedido en ${site.nombre} fue CONFIRMADO.\n\n` +
                `${lineas}\n\nTotal: L ${Number(pedido.total).toFixed(2)}${direccion}\n\n` +
                `Te escribiremos para coordinar el envío dentro del área local o el retiro en tienda. ¡Gracias! 💜`,
            completado:
                `¡Hola${nombreCliente}! 🎉 Tu pedido en ${site.nombre} fue ENTREGADO.\n\n` +
                `${lineas}\n\nTotal: L ${Number(pedido.total).toFixed(2)}\n\n` +
                `¡Gracias por tu compra! Te esperamos pronto. 💜`,
            cancelado:
                `¡Hola${nombreCliente}! Lamentamos informarte que tu pedido en ${site.nombre} fue cancelado.\n\n` +
                `${lineas}\n\nSi tienes dudas, escríbenos. ¡Gracias! 💜`,
        };

        return encodeURIComponent(
            mensajesPorEstado[pedido.estado] || mensajesPorEstado.pendiente
        );
    };

    if (!autenticado) {
        return (
            <div className="admin-login">
                <form className="login-card" onSubmit={handleLogin}>
                    <h2>
                        MD <span>Admin</span>
                    </h2>
                    <p>Inicia sesión para administrar la tienda</p>

                    <input
                        type="text"
                        placeholder="Número de identidad"
                        value={identidad}
                        onChange={(e) => setIdentidad(e.target.value)}
                        required
                    />

                    <div className="password-wrapper">
                        <input
                            type={verPassword ? "text" : "password"}
                            placeholder="Contraseña"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                        />
                        <button
                            type="button"
                            className="password-toggle"
                            onClick={() => setVerPassword(!verPassword)}
                            title={verPassword ? "Ocultar contraseña" : "Ver contraseña"}
                        >
                            {verPassword ? <FaEyeSlash /> : <FaEye />}
                        </button>
                    </div>

                    {error && <p className="login-error">{error}</p>}

                    <button type="submit" disabled={cargando}>
                        {cargando ? "Entrando..." : "Ingresar"}
                    </button>

                    <a href="/" className="login-back">← Volver a la tienda</a>
                </form>
            </div>
        );
    }

    const STOCK_MINIMO = 5;

    const terminoBusqueda = busquedaProductos.trim().toLowerCase();

    const productosFiltrados = terminoBusqueda
        ? productos.filter((p) => {
              const coincideNombre = (p.nombre || "").toLowerCase().includes(terminoBusqueda);
              const coincideCategoria = (p.categoria?.nombre || "")
                  .toLowerCase()
                  .includes(terminoBusqueda);
              const coincideCodigo = (p.codigo || "").toLowerCase().includes(terminoBusqueda);
              const coincideSubcategoria = (p.subcategoria || "")
                  .toLowerCase()
                  .includes(terminoBusqueda);

              return (
                  coincideNombre ||
                  coincideCategoria ||
                  coincideCodigo ||
                  coincideSubcategoria
              );
          })
        : productos;

    const productosStockBajo = productos
        .filter((p) => p.estado && Number(p.stock) <= STOCK_MINIMO)
        .sort((a, b) => a.stock - b.stock);

    const pedidosEnRango = pedidos.filter((p) => {
        try {
            const fecha = new Date(p.fecha);

            if (reporteDesde) {
                const desde = new Date(`${reporteDesde}T00:00:00`);
                if (fecha < desde) return false;
            }

            if (reporteHasta) {
                const hasta = new Date(`${reporteHasta}T23:59:59`);
                if (fecha > hasta) return false;
            }

            return true;
        } catch {
            return true;
        }
    });

    return (
        <div className="admin" ref={adminRef}>
            <div className={`admin-layout ${sidebarColapsada ? "colapsada" : ""}`}>
                <aside className={`admin-sidebar ${menuAbierto ? "abierta" : ""}`}>
                    <div className="sidebar-logo">
                        <img src={logo} alt="MD" />
                    </div>

                    <nav className="sidebar-menu">
                        {MENU.map((item) => (
                            <button
                                key={item.id}
                                className={pestana === item.id ? "tab-admin activo" : "tab-admin"}
                                onClick={() => {
                                    navegar(item.ruta);
                                    setMenuAbierto(false);
                                }}
                            >
                                <item.icono className="tab-icono" />
                                <span className="tab-texto">{item.etiqueta}</span>
                                {item.id === "pedidos" && pedidos.filter((p) => p.estado === "pendiente").length > 0 && (
                                    <span className="tab-contador">
                                        {pedidos.filter((p) => p.estado === "pendiente").length}
                                    </span>
                                )}
                            </button>
                        ))}
                    </nav>

                    <button className="sidebar-cerrar" onClick={handleLogout}>
                        <FaSignOutAlt /> <span>Cerrar sesión</span>
                    </button>
                </aside>

                {menuAbierto && (
                    <div className="admin-overlay" onClick={() => setMenuAbierto(false)} />
                )}

                <main className="admin-content">
                    <header className="admin-topbar">
                        <div className="topbar-izq">
                            <button
                                className={`btn-menu ${sidebarColapsada ? "activo" : ""}`}
                                onClick={alternarSidebar}
                                aria-label="Expandir o contraer menú"
                            >
                                <FaBars />
                            </button>
                            <h2>{TITULOS_SECCION[pestana] || "Dashboard"}</h2>
                        </div>

                        <div className="topbar-der" ref={avatarRef}>
                            <button
                                className="topbar-icono topbar-bell"
                                onClick={() => setDropdownAbierto(!dropdownAbierto)}
                                title="Notificaciones"
                            >
                                <FaBell />
                                {pedidos.filter((p) => p.estado === "pendiente").length > 0 && (
                                    <span className="topbar-badge">
                                        {pedidos.filter((p) => p.estado === "pendiente").length}
                                    </span>
                                )}
                            </button>
                            <button
                                className="btn-sonido"
                                onClick={() => {
                                    sonidoActivoRef.current = !sonidoActivoRef.current;
                                    setSonidoActivo(sonidoActivoRef.current);
                                    reproducirSonido();
                                }}
                                title={sonidoActivo ? "Silenciar avisos" : "Activar avisos"}
                            >
                                {sonidoActivo ? <FaVolumeUp /> : <FaVolumeMute />}
                            </button>

                            <div className="topbar-avatar">
                                <button
                                    className="avatar-btn"
                                    onClick={() => setDropdownAbierto(!dropdownAbierto)}
                                >
                                    <span className="avatar-inicial">
                                        {(getAdmin()?.nombre || "Admin").charAt(0).toUpperCase()}
                                    </span>
                                    <span className="avatar-nombre">{getAdmin()?.nombre || "Admin"}</span>
                                    <FaCaretDown />
                                </button>

                                {dropdownAbierto && (
                                    <div className="avatar-dropdown">
                                        <a
                                            href="/"
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="dropdown-item"
                                            onClick={() => setDropdownAbierto(false)}
                                        >
                                            <FaExternalLinkAlt /> Ver tienda
                                        </a>
                                        <button
                                            className="dropdown-item"
                                            onClick={() => {
                                                setDropdownAbierto(false);
                                                handleLogout();
                                            }}
                                        >
                                            <FaSignOutAlt /> Cerrar sesión
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    </header>

                    <div className="admin-main">
                {pestana !== "dashboard" && productosStockBajo.length > 0 && (
                    <div className="alerta-stock" onClick={() => navegar("/admin/productos")}>
                        <FaExclamationTriangle />
                        <div>
                            <strong>Aviso de stock bajo</strong>
                            <span>
                                {productosStockBajo.length} producto{productosStockBajo.length > 1 ? "s" : ""} con pocas existencias:
                                {productosStockBajo
                                    .map((p) => ` ${p.nombre} (${p.stock})`)
                                    .join(",")}
                            </span>
                        </div>
                        <button type="button">Ver</button>
                    </div>
                )}

                {pestana === "dashboard" && (
                    <Dashboard
                        productos={productos}
                        pedidos={pedidos}
                        onIrA={(id) => navegar(RUTA_POR_ID[id] || "/admin/dashboard")}
                    />
                )}

                {pestana === "productos" && (
                    <>
                        <div className="admin-toolbar">
                            <button className="btn-nuevo" onClick={abrirNuevo}>
                                <FaPlus /> Nuevo producto
                            </button>
                            <div className="admin-busqueda">
                                <FaSearch className="admin-busqueda-icono" />
                                <input
                                    type="text"
                                    value={busquedaProductos}
                                    onChange={(e) => setBusquedaProductos(e.target.value)}
                                    placeholder="Buscar por nombre, categoría o código..."
                                />
                                {busquedaProductos && (
                                    <button
                                        type="button"
                                        className="admin-busqueda-limpiar"
                                        onClick={() => setBusquedaProductos("")}
                                        title="Limpiar búsqueda"
                                    >
                                        <FaTimes />
                                    </button>
                                )}
                            </div>
                        </div>

                        {mostrarForm && (
                            <div className="modal-overlay" onClick={cancelarForm}>
                                <div
                                    className="modal-contenido"
                                    onClick={(e) => e.stopPropagation()}
                                >
                            <form className="admin-form" onSubmit={handleSubmit}>
                                <h4>{editando ? "Editar producto" : "Nuevo producto"}</h4>

                                <div className="form-grid">
                                    <label>
                                        Nombre *
                                        <input
                                            name="nombre"
                                            value={formulario.nombre}
                                            onChange={handleChange}
                                            placeholder="Ej: Labial Mate"
                                            required
                                        />
                                    </label>

                                    <label>
                                        Categoría *
                                        <select
                                            name="id_categoria"
                                            value={formulario.id_categoria}
                                            onChange={handleChange}
                                            required
                                        >
                                            <option value="">Selecciona una categoría</option>
                                            {categorias.map((c) => (
                                                <option key={c.id_categoria} value={c.id_categoria}>
                                                    {c.nombre}
                                                </option>
                                            ))}
                                        </select>
                                    </label>

                                    <label>
                                        Precio (L) *
                                        <input
                                            name="precio"
                                            type="number"
                                            step="0.01"
                                            min="0"
                                            value={formulario.precio}
                                            onChange={handleChange}
                                            placeholder="0.00"
                                            required
                                        />
                                    </label>

                                    <label>
                                        Precio anterior (L)
                                        <input
                                            name="precio_anterior"
                                            type="number"
                                            step="0.01"
                                            min="0"
                                            value={formulario.precio_anterior}
                                            onChange={handleChange}
                                            placeholder="Opcional, se muestra tachado"
                                        />
                                    </label>

                                    <label>
                                        Stock *
                                        <input
                                            name="stock"
                                            type="number"
                                            min="0"
                                            value={formulario.stock}
                                            onChange={handleChange}
                                            placeholder="0"
                                            required
                                        />
                                    </label>

                                    <label>
                                        Código de barras
                                        <input
                                            name="codigo"
                                            value={formulario.codigo}
                                            onChange={handleChange}
                                            placeholder="Ej: 0609332599109"
                                        />
                                    </label>

                                    <label>
                                        Subcategoría
                                        <input
                                            name="subcategoria"
                                            value={formulario.subcategoria}
                                            onChange={handleChange}
                                            placeholder="Ej: Labiales, Bases, Perfumes"
                                        />
                                    </label>

                                    <label>
                                        Estado
                                        <select
                                            name="estado"
                                            value={formulario.estado ? "1" : "0"}
                                            onChange={handleChange}
                                        >
                                            <option value="1">Activo</option>
                                            <option value="0">Inactivo</option>
                                        </select>
                                    </label>

                                    <label className="form-checkbox">
                                        <input
                                            type="checkbox"
                                            name="destacado"
                                            checked={formulario.destacado}
                                            onChange={handleChange}
                                        />
                                        <span>Marcar como nuevo (etiqueta "Nuevo")</span>
                                    </label>

                                    <label className="form-full">
                                        Descripción
                                        <textarea
                                            name="descripcion"
                                            rows="3"
                                            value={formulario.descripcion}
                                            onChange={handleChange}
                                            placeholder="Descripción del producto"
                                        />
                                    </label>

                                    <label className="form-full">
                                        Imagen
                                        <input type="file" accept="image/*" onChange={handleImagen} />
                                        {imagenPrevia && (
                                            <img src={imagenPrevia} alt="Vista previa" className="form-preview" />
                                        )}
                                    </label>
                                </div>

                                <div className="form-actions">
                                    <button type="submit" className="btn-guardar" disabled={cargando}>
                                        {cargando ? "Guardando..." : "Guardar"}
                                    </button>
                                    <button type="button" className="btn-cancelar" onClick={cancelarForm}>
                                        Cancelar
                                    </button>
                                </div>
                            </form>
                                </div>
                            </div>
                        )}

                        {productoVisto && (
                            <div className="modal-overlay" onClick={cerrarVistaProducto}>
                                <div
                                    className="modal-contenido modal-contenido--vista"
                                    onClick={(e) => e.stopPropagation()}
                                >
                                    <h3 className="producto-vista-titulo">
                                        {productoVisto.nombre}
                                    </h3>

                                    <div className="producto-vista">
                                        <div className="producto-vista-card">
                                            <ProductoCard producto={productoVisto} soloLectura />
                                        </div>

                                        <div className="producto-vista-detalles">
                                            <div className="producto-vista-dato">
                                                <span className="producto-vista-etiqueta">Categoría</span>
                                                <span className="producto-vista-valor">
                                                    {productoVisto.categoria?.nombre || "—"}
                                                </span>
                                            </div>

                                            <div className="producto-vista-dato">
                                                <span className="producto-vista-etiqueta">Subcategoría</span>
                                                <span className="producto-vista-valor">
                                                    {productoVisto.subcategoria || "—"}
                                                </span>
                                            </div>

                                            <div className="producto-vista-dato">
                                                <span className="producto-vista-etiqueta">Código</span>
                                                <span className="producto-vista-valor">
                                                    {productoVisto.codigo || "—"}
                                                </span>
                                            </div>

                                            <div className="producto-vista-dato">
                                                <span className="producto-vista-etiqueta">Stock</span>
                                                <span className="producto-vista-valor">
                                                    {productoVisto.stock}
                                                </span>
                                            </div>

                                            <div className="producto-vista-dato">
                                                <span className="producto-vista-etiqueta">Estado</span>
                                                <span
                                                    className={
                                                        productoVisto.estado
                                                            ? "chip-activo"
                                                            : "chip-inactivo"
                                                    }
                                                >
                                                    {productoVisto.estado ? "Activo" : "Inactivo"}
                                                </span>
                                            </div>

                                            <div className="producto-vista-desc">
                                                <span className="producto-vista-etiqueta">Descripción</span>
                                                <p>
                                                    {productoVisto.descripcion || "Sin descripción."}
                                                </p>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="form-actions">
                                        <button
                                            type="button"
                                            className="btn-guardar"
                                            onClick={editarProductoVisto}
                                        >
                                            <FaEdit /> Editar
                                        </button>
                                        <button
                                            type="button"
                                            className="btn-cancelar"
                                            onClick={cerrarVistaProducto}
                                        >
                                            Cerrar
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}

                        <div className="admin-table">
                            <table>
                                <thead>
                                    <tr>
                                        <th>Imagen</th>
                                        <th>Nombre</th>
                                        <th>Categoría</th>
                                        <th>Subcategoría</th>
                                        <th>Código</th>
                                        <th>Precio</th>
                                        <th>Stock</th>
                                        <th>Estado</th>
                                        <th>Acciones</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {productosFiltrados.map((p) => (
                                        <tr key={p.id_producto} className={!p.estado ? "fila-inactiva" : ""}>
                                            <td>
                                                {p.imagen ? (
                                                    <img src={rutaImagen(p.imagen)} alt={p.nombre} className="tabla-img" />
                                                ) : (
                                                    <span className="sin-imagen">—</span>
                                                )}
                                            </td>
                                            <td>
                                                {p.nombre}
                                                {p.destacado && (
                                                    <span className="badge-nuevo-tabla">Nuevo</span>
                                                )}
                                            </td>
                                            <td>{p.categoria?.nombre || "—"}</td>
                                            <td>{p.subcategoria || "—"}</td>
                                            <td>{p.codigo || "—"}</td>
                                            <td>
                                                L {p.precio}
                                                {p.precio_anterior && (
                                                    <span className="precio-tachado"> L {p.precio_anterior}</span>
                                                )}
                                            </td>
                                            <td>{p.stock}</td>
                                            <td>
                                                <span className={p.estado ? "chip-activo" : "chip-inactivo"}>
                                                    {p.estado ? "Activo" : "Inactivo"}
                                                </span>
                                            </td>
                                            <td className="acciones">
                                                <button onClick={() => abrirEdicion(p)} title="Editar">
                                                    <FaEdit />
                                                </button>
                                                <button className="accion-ver" onClick={() => verProducto(p)} title="Ver">
                                                    <FaEye />
                                                </button>
                                                <button onClick={() => handleEliminar(p)} title="Eliminar">
                                                    <FaTrash />
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>

                            {productosFiltrados.length === 0 && (
                                <p className="sin-productos">
                                    {terminoBusqueda
                                        ? "No se encontraron productos con esa búsqueda."
                                        : "Aún no hay productos. Crea el primero."}
                                </p>
                            )}
                        </div>
                    </>
                )}

                {pestana === "categorias" && (
                    <>
                        <div className="admin-toolbar">
                            <button className="btn-nuevo" onClick={abrirNuevaCategoria}>
                                <FaPlus /> Nueva categoría
                            </button>
                        </div>

                        {mostrarCatForm && (
                            <div className="modal-overlay" onClick={cancelarCatForm}>
                                <div
                                    className="modal-contenido modal-contenido--compacto"
                                    onClick={(e) => e.stopPropagation()}
                                >
                                    <form className="admin-form" onSubmit={handleCatSubmit}>
                                        <h4>{editandoCat ? "Editar categoría" : "Nueva categoría"}</h4>

                                        <div className="form-grid">
                                            <label>
                                                Nombre *
                                                <input
                                                    name="nombre"
                                                    value={catForm.nombre}
                                                    onChange={handleCatChange}
                                                    placeholder="Ej: Cuidado Facial"
                                                    required
                                                />
                                            </label>

                                            <label>
                                                Descripción
                                                <input
                                                    name="descripcion"
                                                    value={catForm.descripcion}
                                                    onChange={handleCatChange}
                                                    placeholder="Opcional"
                                                />
                                            </label>
                                        </div>

                                        <div className="form-actions">
                                            <button type="submit" className="btn-guardar" disabled={cargando}>
                                                {cargando ? "Guardando..." : "Guardar"}
                                            </button>
                                            <button type="button" className="btn-cancelar" onClick={cancelarCatForm}>
                                                Cancelar
                                            </button>
                                        </div>
                                    </form>
                                </div>
                            </div>
                        )}

                        <div className="admin-table">
                            <table>
                                <thead>
                                    <tr>
                                        <th>Nombre</th>
                                        <th>Descripción</th>
                                        <th>Productos</th>
                                        <th>Acciones</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {categorias.map((c) => (
                                        <tr key={c.id_categoria}>
                                            <td>{c.nombre}</td>
                                            <td>{c.descripcion || "—"}</td>
                                            <td>{productosDeCategoria(c.id_categoria)}</td>
                                            <td className="acciones">
                                                <button onClick={() => abrirEdicionCategoria(c)} title="Editar">
                                                    <FaEdit />
                                                </button>
                                                <button onClick={() => handleEliminarCategoria(c)} title="Eliminar">
                                                    <FaTrash />
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>

                            {categorias.length === 0 && (
                                <p className="sin-productos">Aún no hay categorías.</p>
                            )}
                        </div>
                    </>
                )}

                {pestana === "carrusel" && (
                    <>
                        <div className="admin-toolbar">
                            <button className="btn-nuevo" onClick={abrirNuevoBanner}>
                                <FaPlus /> Nuevo banner
                            </button>
                        </div>

                        <p className="banner-ayuda">
                            Estas imágenes se muestran como portada en la tienda. Sube fotos anchas (1200px o más) para que se vean bien.
                        </p>

                        {mostrarBannerForm && (
                            <div className="modal-overlay" onClick={cancelarBannerForm}>
                                <div
                                    className="modal-contenido"
                                    onClick={(e) => e.stopPropagation()}
                                >
                                    <form className="admin-form" onSubmit={handleBannerSubmit}>
                                        <h4>{editandoBanner ? "Editar banner" : "Nuevo banner"}</h4>

                                        <div className="form-grid">
                                            <label>
                                                Título *
                                                <input
                                                    name="titulo"
                                                    value={bannerForm.titulo}
                                                    onChange={handleBannerChange}
                                                    placeholder="Ej: Maquillaje Profesional"
                                                    required
                                                />
                                            </label>

                                            <label>
                                                Texto del botón
                                                <input
                                                    name="boton"
                                                    value={bannerForm.boton}
                                                    onChange={handleBannerChange}
                                                    placeholder="Ej: Ver productos"
                                                />
                                            </label>

                                            <label>
                                                Orden
                                                <input
                                                    name="orden"
                                                    type="number"
                                                    min="0"
                                                    value={bannerForm.orden}
                                                    onChange={handleBannerChange}
                                                    placeholder="0"
                                                />
                                            </label>

                                            <label>
                                                Estado
                                                <select
                                                    name="estado"
                                                    value={bannerForm.estado ? "1" : "0"}
                                                    onChange={handleBannerChange}
                                                >
                                                    <option value="1">Activo</option>
                                                    <option value="0">Inactivo</option>
                                                </select>
                                            </label>

                                            <label className="form-full">
                                                Descripción
                                                <textarea
                                                    name="descripcion"
                                                    rows="2"
                                                    value={bannerForm.descripcion}
                                                    onChange={handleBannerChange}
                                                    placeholder="Descripción del banner"
                                                />
                                            </label>

                                            <label className="form-full">
                                                Imagen
                                                <input type="file" accept="image/*" onChange={handleBannerImagen} />
                                                {bannerImagenPrevia && (
                                                    <img src={bannerImagenPrevia} alt="Vista previa" className="form-preview" />
                                                )}
                                            </label>
                                        </div>

                                        <div className="form-actions">
                                            <button type="submit" className="btn-guardar" disabled={cargando}>
                                                {cargando ? "Guardando..." : "Guardar"}
                                            </button>
                                            <button type="button" className="btn-cancelar" onClick={cancelarBannerForm}>
                                                Cancelar
                                            </button>
                                        </div>
                                    </form>
                                </div>
                            </div>
                        )}

                        <div className="admin-table">
                            <table>
                                <thead>
                                    <tr>
                                        <th>Imagen</th>
                                        <th>Título</th>
                                        <th>Orden</th>
                                        <th>Estado</th>
                                        <th>Acciones</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {banners.map((b) => (
                                        <tr key={b.id_banner} className={!b.estado ? "fila-inactiva" : ""}>
                                            <td>
                                                {b.imagen ? (
                                                    <img src={rutaImagen(b.imagen)} alt={b.titulo} className="tabla-img" />
                                                ) : (
                                                    <span className="sin-imagen">—</span>
                                                )}
                                            </td>
                                            <td>{b.titulo}</td>
                                            <td>{b.orden}</td>
                                            <td>
                                                <span className={b.estado ? "chip-activo" : "chip-inactivo"}>
                                                    {b.estado ? "Activo" : "Inactivo"}
                                                </span>
                                            </td>
                                            <td className="acciones">
                                                <button onClick={() => abrirEdicionBanner(b)} title="Editar">
                                                    <FaEdit />
                                                </button>
                                                <button onClick={() => handleEliminarBanner(b)} title="Eliminar">
                                                    <FaTrash />
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>

                            {banners.length === 0 && (
                                <p className="sin-productos">Aún no hay banners. Crea el primero.</p>
                            )}
                        </div>
                    </>
                )}

                {pestana === "pedidos" && (
                    <>
                        <p className="banner-ayuda">
                            Aquí ves los pedidos que los clientes envían desde la tienda, con el
                            total que debes cobrar. Cambia el estado a medida que los atiendes.
                        </p>

                        {pedidos.length === 0 ? (
                            <p className="sin-productos">Aún no hay pedidos.</p>
                        ) : (
                            <div className="admin-table">
                                <table>
                                    <thead>
                                        <tr>
                                            <th>N°</th>
                                            <th>Fecha</th>
                                            <th>Cliente</th>
                                            <th>Productos</th>
                                            <th>Total</th>
                                            <th>Estado</th>
                                            <th>Acciones</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {pedidos.map((pedido) => (
                                            <tr key={pedido.id_pedido}>
                                                <td>#{pedido.id_pedido}</td>
                                                <td>{formatearFecha(pedido.fecha)}</td>
                                                <td>
                                                    <div>
                                                        {pedido.nombre_cliente || "Cliente"}
                                                    </div>
                                                    {pedido.telefono_cliente && (
                                                        <div className="pedido-telefono">
                                                            {pedido.telefono_cliente}
                                                        </div>
                                                    )}
                                                    {pedido.direccion && (
                                                        <div className="pedido-telefono">
                                                            <FaMapMarkerAlt /> {pedido.direccion}
                                                        </div>
                                                    )}
                                                </td>
                                                <td>
                                                    <ul className="pedido-productos">
                                                        {(pedido.productos || []).map((item, i) => (
                                                            <li key={i}>
                                                                {item.nombre} × {item.cantidad}
                                                            </li>
                                                        ))}
                                                    </ul>
                                                </td>
                                                <td className="pedido-total">
                                                    L {Number(pedido.total).toFixed(2)}
                                                </td>
                                                <td>
                                                    <select
                                                        className={`chip-estado ${pedido.estado}`}
                                                        value={pedido.estado}
                                                        onChange={(e) =>
                                                            handleCambiarEstado(pedido, e.target.value)
                                                        }
                                                    >
                                                        {Object.entries(ESTADOS).map(([valor, etiqueta]) => (
                                                            <option key={valor} value={valor}>
                                                                {etiqueta}
                                                            </option>
                                                        ))}
                                                    </select>
                                                </td>
                                                <td className="acciones">
                                                    {pedido.telefono_cliente && (
                                                        <a
                                                            href={`https://wa.me/${pedido.telefono_cliente.replace(/\D/g, "")}?text=${mensajeWhatsAppPedido(pedido)}`}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            title={`Avisar al cliente: pedido ${ESTADOS[pedido.estado] || pedido.estado}`}
                                                            className="accion-whatsapp"
                                                        >
                                                            <FaWhatsapp />
                                                        </a>
                                                    )}
                                                    <button
                                                        onClick={() => handleEliminarPedido(pedido)}
                                                        title="Eliminar"
                                                    >
                                                        <FaTrash />
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </>
                )}
                {pestana === "ofertas" && (
                    <>
                        <div className="admin-toolbar">
                            <button className="btn-nuevo" onClick={abrirNuevo}>
                                <FaPlus /> Nueva oferta
                            </button>
                        </div>

                        <p className="banner-ayuda">
                            Productos con precio anterior (descuento activo). Edítalos para
                            ajustar la oferta o quitar el precio anterior.
                        </p>

                        <div className="admin-table">
                            <table>
                                <thead>
                                    <tr>
                                        <th>Imagen</th>
                                        <th>Nombre</th>
                                        <th>Precio</th>
                                        <th>Antes</th>
                                        <th>Descuento</th>
                                        <th>Stock</th>
                                        <th>Acciones</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {productos
                                        .filter(
                                            (p) =>
                                                p.precio_anterior &&
                                                Number(p.precio_anterior) > Number(p.precio)
                                        )
                                        .map((p) => {
                                            const descuento = Math.round(
                                                ((Number(p.precio_anterior) - Number(p.precio)) /
                                                    Number(p.precio_anterior)) *
                                                    100
                                            );

                                            return (
                                                <tr key={p.id_producto}>
                                                    <td>
                                                        {p.imagen ? (
                                                            <img src={rutaImagen(p.imagen)} alt={p.nombre} className="tabla-img" />
                                                        ) : (
                                                            <span className="sin-imagen">—</span>
                                                        )}
                                                    </td>
                                                    <td>{p.nombre}</td>
                                                    <td>L {p.precio}</td>
                                                    <td>
                                                        <span className="precio-tachado">L {p.precio_anterior}</span>
                                                    </td>
                                                    <td>
                                                        <span className="chip-oferta">-{descuento}%</span>
                                                    </td>
                                                    <td>{p.stock}</td>
                                                    <td className="acciones">
                                                        <button onClick={() => abrirEdicion(p)} title="Editar">
                                                            <FaEdit />
                                                        </button>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                </tbody>
                            </table>

                            {productos.filter(
                                (p) =>
                                    p.precio_anterior &&
                                    Number(p.precio_anterior) > Number(p.precio)
                            ).length === 0 && (
                                <p className="sin-productos">Aún no hay ofertas activas.</p>
                            )}
                        </div>
                    </>
                )}

                {pestana === "reportes" && (
                    <>
                        <div className="reportes-filtros">
                            <label>
                                Desde
                                <input
                                    type="date"
                                    value={reporteDesde}
                                    onChange={(e) => setReporteDesde(e.target.value)}
                                />
                            </label>
                            <label>
                                Hasta
                                <input
                                    type="date"
                                    value={reporteHasta}
                                    min={reporteDesde || undefined}
                                    onChange={(e) => setReporteHasta(e.target.value)}
                                />
                            </label>
                            {(reporteDesde || reporteHasta) && (
                                <button
                                    className="reportes-limpiar"
                                    onClick={() => {
                                        setReporteDesde("");
                                        setReporteHasta("");
                                    }}
                                >
                                    Limpiar rango
                                </button>
                            )}
                        </div>

                        {(reporteDesde || reporteHasta) && (
                            <p className="reportes-resumen">
                                Mostrando pedidos del{" "}
                                <strong>
                                    {new Date(`${reporteDesde}T00:00:00`).toLocaleDateString("es-HN")}
                                </strong>{" "}
                                al{" "}
                                <strong>
                                    {new Date(`${reporteHasta}T00:00:00`).toLocaleDateString("es-HN")}
                                </strong>
                            </p>
                        )}

                        <div className="reportes-grid">
                            <div className="reporte-card">
                                <FaShoppingBag className="reporte-icono" />
                                <span className="reporte-etiqueta">Pedidos totales</span>
                                <span className="reporte-valor">{pedidosEnRango.length}</span>
                            </div>
                            <div className="reporte-card">
                                <FaChartBar className="reporte-icono" />
                                <span className="reporte-etiqueta">Ingresos totales</span>
                                <span className="reporte-valor">
                                    L{" "}
                                    {pedidosEnRango
                                        .filter((p) => p.estado !== "cancelado")
                                        .reduce((s, p) => s + Number(p.total), 0)
                                        .toLocaleString("es-HN", {
                                            minimumFractionDigits: 2,
                                            maximumFractionDigits: 2,
                                        })}
                                </span>
                            </div>
                            <div className="reporte-card">
                                <FaFire className="reporte-icono" />
                                <span className="reporte-etiqueta">Productos destacados</span>
                                <span className="reporte-valor">
                                    {productos.filter((p) => p.destacado).length}
                                </span>
                            </div>
                            <div className="reporte-card">
                                <FaExclamationTriangle className="reporte-icono" />
                                <span className="reporte-etiqueta">Stock bajo</span>
                                <span className="reporte-valor">{productosStockBajo.length}</span>
                            </div>
                        </div>
                    </>
                )}
                    </div>
            </main>
            </div>
        </div>
    );
}

export default Admin;
