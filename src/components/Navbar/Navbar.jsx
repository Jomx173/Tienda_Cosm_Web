import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";

import { FaChevronDown } from "react-icons/fa";

import logo from "../../assets/logo/logo.png";
import categoriesData from "../../data/categories";
import { obtenerCategorias } from "../../services/productoService";
import { slugify } from "../../utils/slugs";

import "./Navbar.css";

function Navbar() {
    const [categorias, setCategorias] = useState(categoriesData);
    const [masAbierto, setMasAbierto] = useState(false);
    const [viewport, setViewport] = useState(() => window.innerWidth);

    const masRef = useRef(null);

    useEffect(() => {
        obtenerCategorias()
            .then(setCategorias)
            .catch(() => {});
    }, []);

    useEffect(() => {
        const onResize = () => setViewport(window.innerWidth);

        window.addEventListener("resize", onResize);

        return () => window.removeEventListener("resize", onResize);
    }, []);

    useEffect(() => {
        const cerrar = (e) => {
            if (masRef.current && !masRef.current.contains(e.target)) {
                setMasAbierto(false);
            }
        };

        document.addEventListener("click", cerrar);

        return () => document.removeEventListener("click", cerrar);
    }, []);

    const maxVisibles = viewport > 992 ? categorias.length : viewport > 576 ? 3 : 2;
    const visibles = categorias.slice(0, maxVisibles);
    const restantes = categorias.slice(maxVisibles);

    return (
        <nav className="navbar">
            <Link to="/" className="logo" aria-label="MD - Inicio">
                <img src={logo} alt="MD" />
            </Link>

            <div className="navbar-nav">
                <Link to="/productos" className="navbar-link">
                    Productos
                </Link>

                {visibles.map((c) => (
                    <Link
                        key={c.id_categoria ?? c.id}
                        to={`/categoria/${slugify(c.nombre)}`}
                        className="navbar-link"
                    >
                        {c.nombre}
                    </Link>
                ))}

                {restantes.length > 0 && viewport <= 992 && (
                    <div className="navbar-mas" ref={masRef}>
                        <button
                            type="button"
                            className={`navbar-link navbar-mas-btn ${masAbierto ? "abierto" : ""}`}
                            aria-expanded={masAbierto}
                            onClick={() => setMasAbierto((v) => !v)}
                        >
                            Más <FaChevronDown className="navbar-mas-flecha" />
                        </button>

                        {masAbierto && (
                            <div className="navbar-dropdown">
                                {restantes.map((c) => (
                                    <Link
                                        to={`/categoria/${slugify(c.nombre)}`}
                                        key={c.id_categoria ?? c.id}
                                        className="navbar-dropdown-item"
                                        onClick={() => setMasAbierto(false)}
                                    >
                                        {c.nombre}
                                    </Link>
                                ))}
                            </div>
                        )}
                    </div>
                )}
            </div>
        </nav>
    );
}

export default Navbar;
