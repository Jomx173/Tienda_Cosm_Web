import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";

import { FaChevronRight, FaHome } from "react-icons/fa";

import ProductoCard from "../ProductoCard/ProductoCard";
import SearchBar from "../SearchBar/SearchBar";

import productsData from "../../data/products";
import categoriesData from "../../data/categories";
import { obtenerProductos, obtenerCategorias } from "../../services/productoService";
import { slugify } from "../../utils/slugs";

import "./Products.css";

const nombreCategoria = (p) => p.categoria?.nombre ?? p.categoria;

const POR_PAGINA = 8;

const ORDENES = [
    { valor: "nuevos", etiqueta: "Más nuevos" },
    { valor: "precio-asc", etiqueta: "Precio: menor a mayor" },
    { valor: "precio-desc", etiqueta: "Precio: mayor a menor" },
];

function Products({ categoria }) {
    const [productos, setProductos] = useState(productsData);
    const [categorias, setCategorias] = useState(categoriesData);
    const [orden, setOrden] = useState("nuevos");
    const [soloOferta, setSoloOferta] = useState(false);
    const [visibles, setVisibles] = useState(POR_PAGINA);
    const [subcategoria, setSubcategoria] = useState(null);

    const [searchParams, setSearchParams] = useSearchParams();

    const activa = categoria ?? searchParams.get("categoria") ?? "Todos";
    const busqueda = searchParams.get("busqueda") ?? "";

    useEffect(() => {
        obtenerProductos()
            .then(setProductos)
            .catch(() => {});

        obtenerCategorias()
            .then(setCategorias)
            .catch(() => {});
    }, []);

    const subcategoriasDeCategoria = (nombre) => {
        const lista = productos
            .filter((p) => nombreCategoria(p) === nombre)
            .map((p) => p.subcategoria)
            .filter(Boolean);

        return [...new Set(lista)];
    };

    const seleccionarSubcategoria = (sub) => {
        setSubcategoria(sub);
        setVisibles(POR_PAGINA);
    };

    const texto = busqueda.trim().toLowerCase();

    const hayBusqueda = texto.length > 0;

    // Si hay búsqueda, se ignora la categoría/subcategoría activa y
    // se busca en todo el catálogo. Si no hay búsqueda, se filtra por categoría.
    const filtrados = productos.filter((p) => {
        if (!hayBusqueda && activa !== "Todos" && nombreCategoria(p) !== activa) return false;

        if (!hayBusqueda && subcategoria && p.subcategoria !== subcategoria) return false;

        return true;
    });

    const resultado = filtrados.filter((p) => {
        if (!texto) return true;

        return (
            p.nombre.toLowerCase().includes(texto) ||
            (p.descripcion || "").toLowerCase().includes(texto)
        );
    });

    const porRangoPrecio = resultado.filter((p) => {
        if (soloOferta) {
            const precio = Number(p.precio);
            const anterior = Number(p.precio_anterior ?? p.precioAnterior);
            if (!(anterior > 0 && anterior > precio)) return false;
        }

        return true;
    });

    const ordenados = [...porRangoPrecio].sort((a, b) => {
        const precioA = Number(a.precio);
        const precioB = Number(b.precio);

        if (orden === "precio-asc") return precioA - precioB;
        if (orden === "precio-desc") return precioB - precioA;

        const nuevoA = a.destacado ?? a.nuevo ? 1 : 0;
        const nuevoB = b.destacado ?? b.nuevo ? 1 : 0;
        return nuevoB - nuevoA;
    });

    const subcategoriasVisibles = subcategoriasDeCategoria(activa);

    const hayFiltros = soloOferta;

    const visiblesAhora = ordenados.slice(0, visibles);

    const restantes = ordenados.length - visibles;

    return (
        <section className="products" id="productos">
            <div className="products-breadcrumb">
                <Link to="/" className="products-breadcrumb-link">
                    <FaHome /> Inicio
                </Link>
                <FaChevronRight className="products-breadcrumb-sep" />
                <span>
                    {subcategoria
                        ? `${activa} · ${subcategoria}`
                        : activa === "Todos"
                        ? "Productos"
                        : activa}
                </span>
            </div>

            <div className="section-header">
                <span className="section-eyebrow">Nuestro catálogo</span>
                <h2>{activa === "Todos" ? "Productos" : activa}</h2>
                <p>Explora todos nuestros productos y encuentra tu favorito.</p>
            </div>

            <SearchBar
                busqueda={busqueda}
                onBuscar={(v) => {
                    setSearchParams(
                        (prev) => {
                            const p = new URLSearchParams(prev);
                            if (v) p.set("busqueda", v);
                            else p.delete("busqueda");
                            return p;
                        },
                        { replace: true }
                    );
                    setVisibles(POR_PAGINA);
                }}
                onLimpiar={() => {
                    setSearchParams(
                        (prev) => {
                            const p = new URLSearchParams(prev);
                            p.delete("busqueda");
                            return p;
                        },
                        { replace: true }
                    );
                    setVisibles(POR_PAGINA);
                }}
            />

            <div className="products-layout">
                <aside className="products-sidebar">
                    <h4 className="sidebar-titulo">Categorías</h4>

                    <Link
                        to="/productos"
                        className={activa === "Todos" ? "sidebar-item activo" : "sidebar-item"}
                    >
                        Todos
                    </Link>

                    {categorias.map((c) => {
                        const nombre = c.nombre;
                        const esActiva = activa === nombre;

                        return (
                            <div className="sidebar-grupo" key={c.id_categoria ?? nombre}>
                                <Link
                                    to={`/categoria/${slugify(nombre)}`}
                                    className={esActiva ? "sidebar-item activo" : "sidebar-item"}
                                >
                                    {nombre}
                                    <span className="sidebar-flecha">
                                        {esActiva && subcategoriasVisibles.length > 0 ? "▾" : "▸"}
                                    </span>
                                </Link>

                                {esActiva && subcategoriasVisibles.length > 0 && (
                                    <div className="sidebar-subcategorias">
                                        <button
                                            className={!subcategoria ? "sidebar-sub activo" : "sidebar-sub"}
                                            onClick={() => seleccionarSubcategoria(null)}
                                        >
                                            Todas
                                        </button>

                                        {subcategoriasVisibles.map((sub) => (
                                            <button
                                                key={sub}
                                                className={subcategoria === sub ? "sidebar-sub activo" : "sidebar-sub"}
                                                onClick={() => seleccionarSubcategoria(sub)}
                                            >
                                                {sub}
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>
                        );
                    })}

                    <div className="sidebar-filtros">
                        <h4 className="sidebar-titulo">Ofertas</h4>

                        <label className="sidebar-oferta">
                            <input
                                type="checkbox"
                                checked={soloOferta}
                                onChange={(e) => {
                                    setSoloOferta(e.target.checked);
                                    setVisibles(POR_PAGINA);
                                }}
                            />
                            Solo en oferta
                        </label>

                        {hayFiltros && (
                            <button
                                type="button"
                                className="sidebar-limpiar-filtros"
                                onClick={() => {
                                    setSoloOferta(false);
                                    setVisibles(POR_PAGINA);
                                }}
                            >
                                Limpiar filtro
                            </button>
                        )}
                    </div>
                </aside>

                <div className="products-content">
                    <div className="products-titulo">
                        {hayBusqueda
                            ? `Resultados para "${busqueda}"`
                            : subcategoria
                            ? `${subcategoria} · ${activa}`
                            : activa === "Todos"
                            ? "Todos los productos"
                            : activa}
                    </div>

                    <div className="products-toolbar">
                        <span className="products-contador">
                            {ordenados.length} producto{ordenados.length !== 1 ? "s" : ""}
                            {hayBusqueda || hayFiltros ? " encontrados" : ""}
                        </span>

                        <select
                            className="products-orden"
                            value={orden}
                            onChange={(e) => setOrden(e.target.value)}
                            aria-label="Ordenar productos"
                        >
                            {ORDENES.map((o) => (
                                <option key={o.valor} value={o.valor}>
                                    {o.etiqueta}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="products-grid">
                        {visiblesAhora.map((producto) => (
                            <ProductoCard
                                key={producto.id_producto ?? producto.id}
                                producto={producto}
                            />
                        ))}
                    </div>

                    {ordenados.length === 0 && (
                        <p className="sin-resultados">
                            {hayBusqueda || hayFiltros
                                ? "No hay productos que coincidan con tu búsqueda o filtros."
                                : "Aún no hay productos en esta categoría."}
                        </p>
                    )}

                    {restantes > 0 && (
                        <div className="products-mas">
                            <button
                                type="button"
                                className="products-mas-btn"
                                onClick={() => setVisibles((v) => v + POR_PAGINA)}
                            >
                                Cargar más productos ({restantes} restantes)
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </section>
    );
}

export default Products;
