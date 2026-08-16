import { useEffect, useRef, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import Swal from "sweetalert2";

import {
    FaSignOutAlt,
    FaBoxOpen,
    FaTags,
    FaImages,
    FaShoppingBag,
    FaExclamationTriangle,
    FaBell,
    FaVolumeUp,
    FaVolumeMute,
    FaTachometerAlt,
    FaChevronLeft,
    FaChevronRight,
    FaCaretDown,
    FaPercent,
    FaChartBar,
    FaExternalLinkAlt,
    FaCog,
} from "react-icons/fa";

import { logout, getAdmin, estaAutenticado } from "../../services/authService";
import {
    obtenerProductos,
    obtenerCategorias,
    obtenerBanners,
} from "../../services/productoService";
import { toastError } from "../../utils/toast";
import { obtenerPedidos } from "../../services/pedidoService";
import type { Banner, Categoria, Pedido, Producto } from "../../services/types";
import logo from "../../assets/logo/logo.png";
import { formatearPrecio } from "../../utils/precio";
import Dashboard from "./Dashboard";
import Reportes from "./Reportes";
import Configuracion from "./Configuracion";
import ProductosSection from "./sections/ProductosSection";
import CategoriasSection from "./sections/CategoriasSection";
import BannersSection from "./sections/BannersSection";
import PedidosSection from "./sections/PedidosSection";

import { useDispatch, useSelector } from "../../store";
import { Action as ActionAuth } from "../../store/slices/Auth";
import SelectorAuth from "../../store/slices/Auth/selectors";

import "./Admin.css";

const MENU = [
    { id: "dashboard", etiqueta: "Dashboard", icono: FaTachometerAlt, ruta: "/admin/dashboard" },
    { id: "productos", etiqueta: "Productos", icono: FaBoxOpen, ruta: "/admin/productos" },
    { id: "categorias", etiqueta: "Categorías", icono: FaTags, ruta: "/admin/categorias" },
    { id: "ofertas", etiqueta: "Ofertas y Descuentos", icono: FaPercent, ruta: "/admin/ofertas" },
    { id: "pedidos", etiqueta: "Pedidos", icono: FaShoppingBag, ruta: "/admin/pedidos" },
    { id: "carrusel", etiqueta: "Imágenes/Banners", icono: FaImages, ruta: "/admin/imagenes" },
    { id: "reportes", etiqueta: "Reportes", icono: FaChartBar, ruta: "/admin/reportes" },
    { id: "configuracion", etiqueta: "Configuración", icono: FaCog, ruta: "/admin/configuracion" },
];

const RUTA_POR_ID: Record<string, string> = Object.fromEntries(MENU.map((m) => [m.id, m.ruta]));

const ID_POR_RUTA: Record<string, string> = {
    "/admin": "dashboard",
    "/admin/dashboard": "dashboard",
    "/admin/productos": "productos",
    "/admin/categorias": "categorias",
    "/admin/ofertas": "ofertas",
    "/admin/pedidos": "pedidos",
    "/admin/imagenes": "carrusel",
    "/admin/reportes": "reportes",
    "/admin/configuracion": "configuracion",
};

const TITULOS_SECCION: Record<string, string> = {
    dashboard: "Dashboard",
    productos: "Productos",
    categorias: "Categorías",
    ofertas: "Ofertas y Descuentos",
    pedidos: "Pedidos",
    carrusel: "Imágenes / Banners",
    reportes: "Reportes",
    configuracion: "Configuración",
};

const STOCK_MINIMO = 5;

function Admin() {
    const dispatch = useDispatch();
    const autenticado = useSelector(SelectorAuth.getAutenticado);
    const admin = useSelector(SelectorAuth.getAdmin);

    const [productos, setProductos] = useState<Producto[]>([]);
    const [categorias, setCategorias] = useState<Categoria[]>([]);
    const [banners, setBanners] = useState<Banner[]>([]);
    const [pedidos, setPedidos] = useState<Pedido[]>([]);

    const ultimoIdPedido = useRef(0);
    const [sonidoActivo, setSonidoActivo] = useState(true);
    const sonidoActivoRef = useRef(true);
    const pedidosRef = useRef<Pedido[]>([]);

    const reproducirSonido = () => {
        if (!sonidoActivoRef.current) return;

        try {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const Ctx: typeof AudioContext =
                window.AudioContext || (window as any).webkitAudioContext;

            const ctx = new Ctx();

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

    const mostrarNotificacion = (titulo: string, cuerpo: string) => {
        if (!("Notification" in window)) return;

        if (Notification.permission === "granted") {
            new Notification(titulo, { body: cuerpo, icon: "/favicon.ico" });
        } else if (Notification.permission !== "denied") {
            void Notification.requestPermission();
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
    const [esMovil, setEsMovil] = useState(() => window.innerWidth <= 992);
    const [dropdownAbierto, setDropdownAbierto] = useState(false);
    const adminRef = useRef<HTMLDivElement>(null);
    const avatarRef = useRef<HTMLDivElement>(null);
    const [perfilVersion, setPerfilVersion] = useState(0);

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

    useEffect(() => {
        const alRedimensionar = () => setEsMovil(window.innerWidth <= 992);
        window.addEventListener("resize", alRedimensionar);
        return () => window.removeEventListener("resize", alRedimensionar);
    }, []);

    const alternarSidebar = () => {
        if (esMovil) {
            setMenuAbierto((m) => !m);
        } else {
            setSidebarColapsada((c) => !c);
        }
    };

    const sidebarRevelado = esMovil ? menuAbierto : !sidebarColapsada;

    useEffect(() => {
        const cerrar = (e: MouseEvent) => {
            if (adminRef.current && !adminRef.current.contains(e.target as Node)) {
                setDropdownAbierto(false);
                setMenuAbierto(false);
            }
        };

        document.addEventListener("click", cerrar);

        return () => document.removeEventListener("click", cerrar);
    }, []);

    useEffect(() => {
        const cerrar = (e: MouseEvent) => {
            if (avatarRef.current && !avatarRef.current.contains(e.target as Node)) {
                setDropdownAbierto(false);
            }
        };

        const onKey = (e: KeyboardEvent) => {
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

    useEffect(() => {
        if (estaAutenticado()) {
            dispatch(ActionAuth.setAutenticado(true));
            const adminLocal = getAdmin();
            if (adminLocal) dispatch(ActionAuth.setAdmin(adminLocal));
        }
    }, [dispatch]);

    const handleLogout = () => {
        try {
            logout();
            dispatch(ActionAuth.setAutenticado(false));
            dispatch(ActionAuth.setAdmin(null));
            setProductos([]);
            setMenuAbierto(false);
            setDropdownAbierto(false);
            setSidebarColapsada(false);
            setSonidoActivo(true);
            sonidoActivoRef.current = true;
            setPerfilVersion(0);
        } finally {
            navegar("/login", { replace: true });
        }
    };

    const cerrarSesionSiNoAutorizado = (err: unknown) => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const axiosError = err as any;
        if (axiosError?.response?.status === 401) {
            handleLogout();
        }
    };

    const cargarDatos = async () => {
        try {
            const [prods, cats, banns, peds] = await Promise.all([
                obtenerProductos(true),
                obtenerCategorias(true),
                obtenerBanners(true),
                obtenerPedidos(),
            ]);

            setProductos(prods);
            setCategorias(cats);
            setBanners(banns);
            setPedidos(peds);
        } catch (err) {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const axiosError = err as any;
            cerrarSesionSiNoAutorizado(err);
            toastError(axiosError?.response?.data?.mensaje || "No se pudieron cargar los datos");
        }
    };

    useEffect(() => {
        if (!autenticado) return;

        let activo = true;

        Promise.all([obtenerProductos(true), obtenerCategorias(true), obtenerBanners(true), obtenerPedidos()])
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

                    const numeroNuevo = `#${nuevos[0].id_pedido}`;

                    reproducirSonido();
                    mostrarNotificacion(
                        "Nuevo pedido en MD 🛍️",
                        `${numeroNuevo} de ${nuevos[0].nombre_cliente || "un cliente"} por ${formatearPrecio(nuevos[0].total)}`
                    );

                    Swal.fire({
                        icon: "info",
                        title: "¡Nuevo pedido! 🛍️",
                        html: `${nuevos.length} pedido${nuevos.length > 1 ? "s" : ""} nuevo${nuevos.length > 1 ? "s" : ""} recibido${nuevos.length > 1 ? "s" : ""}.<br><br><strong>${numeroNuevo}</strong> — ${nuevos[0].nombre_cliente || "Cliente"} — ${formatearPrecio(nuevos[0].total)}`,
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
    }, [autenticado, navegar, dispatch]);

    const pedidosPendientes = pedidos.filter((p) => p.estado === "pendiente");

    const productosStockBajo = productos
        .filter((p) => p.estado && Number(p.stock) <= STOCK_MINIMO)
        .sort((a, b) => Number(a.stock) - Number(b.stock));

    const propsSeccion = {
        onRecargar: cargarDatos,
        onNoAutorizado: cerrarSesionSiNoAutorizado,
    };

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
                                {item.id === "pedidos" && pedidosPendientes.length > 0 && (
                                    <span className="tab-contador">
                                        {pedidosPendientes.length}
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
                                className="sidebar-toggle"
                                onClick={alternarSidebar}
                                aria-label={sidebarRevelado ? "Colapsar menú" : "Expandir menú"}
                            >
                                {sidebarRevelado ? <FaChevronLeft /> : <FaChevronRight />}
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
                                {pedidosPendientes.length > 0 && (
                                    <span className="topbar-badge">
                                        {pedidosPendientes.length}
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
                                        {(admin?.nombre || "Admin").charAt(0).toUpperCase()}
                                    </span>
                                    <span className="avatar-nombre">{admin?.nombre || "Admin"}</span>
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

                        {(pestana === "productos" || pestana === "ofertas") && (
                            <ProductosSection
                                pestana={pestana}
                                productos={productos}
                                categorias={categorias}
                                {...propsSeccion}
                            />
                        )}

                        {pestana === "categorias" && (
                            <CategoriasSection
                                categorias={categorias}
                                productos={productos}
                                {...propsSeccion}
                            />
                        )}

                        {pestana === "carrusel" && (
                            <BannersSection
                                banners={banners}
                                {...propsSeccion}
                            />
                        )}

                        {pestana === "pedidos" && (
                            <PedidosSection
                                pedidos={pedidos}
                                {...propsSeccion}
                            />
                        )}

                        {pestana === "reportes" && (
                            <Reportes
                                productos={productos}
                                pedidos={pedidos}
                                onIrA={(id) => navegar(RUTA_POR_ID[id] || "/admin/dashboard")}
                            />
                        )}

                        {pestana === "configuracion" && (
                            <Configuracion
                                key={perfilVersion}
                                onPerfilActualizado={() => setPerfilVersion((v) => v + 1)}
                                onCerrarSesion={handleLogout}
                            />
                        )}
                    </div>
                </main>
            </div>
        </div>
    );
}

export default Admin;
