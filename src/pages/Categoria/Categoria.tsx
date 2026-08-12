import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";

import { FaSearch } from "react-icons/fa";

import TopBar from "../../components/TopBar/TopBar";
import Navbar from "../../components/Navbar/Navbar";
import Products from "../../components/Products/Products";
import Footer from "../../components/Footer/Footer";
import WhatsAppButton from "../../components/WhatsAppButton/WhatsAppButton";

import { obtenerCategorias } from "../../services/productoService";
import type { Categoria as TipoCategoria } from "../../services/types";
import { categoriaPorSlug } from "../../utils/slugs";
import "./Categoria.css";

function Categoria() {
    const { slug } = useParams();

    const [categorias, setCategorias] = useState<TipoCategoria[]>([]);
    const [cargando, setCargando] = useState(true);

    const categoria = categoriaPorSlug(categorias, slug);

    useEffect(() => {
        let activo = true;

        obtenerCategorias()
            .then((data) => {
                if (activo) setCategorias(data);
            })
            .catch(() => {})
            .finally(() => {
                if (activo) setCargando(false);
            });

        return () => {
            activo = false;
        };
    }, []);

    useEffect(() => {
        const nombre = categoria?.nombre ?? "Categoría no encontrada";
        const descripcion = categoria
            ? `Explora nuestros productos de ${nombre} en MD.`
            : "La categoría que buscas no existe o ya no está disponible.";

        document.title = `${nombre} | MD`;

        const meta = document.querySelector('meta[name="description"]');
        if (meta) meta.setAttribute("content", descripcion);

        return () => {
            document.title = "MD";
        };
    }, [categoria]);

    if (cargando) {
        return (
            <div className="categoria">
                <TopBar />
                <Navbar />
                <div className="categoria-cargando">Cargando categoría...</div>
                <Footer />
                <WhatsAppButton />
            </div>
        );
    }

    if (!categoria) {
        return (
            <div className="categoria">
                <TopBar />
                <Navbar />

                <div className="categoria-noencontrada">
                    <div className="categoria-noencontrada-icono">
                        <FaSearch />
                    </div>

                    <h1>404 · Categoría no encontrada</h1>
                    <p>
                        Lo sentimos, la categoría <strong>{slug}</strong> no existe o ya no
                        está disponible.
                    </p>
                    <Link to="/productos" className="categoria-volver">
                        ← Ver todos los productos
                    </Link>
                </div>

                <Footer />
                <WhatsAppButton />
            </div>
        );
    }

    return (
        <div className="categoria">
            <TopBar />
            <Navbar />

            <Products key={slug} categoria={categoria.nombre} />

            <Footer />
            <WhatsAppButton />
        </div>
    );
}

export default Categoria;
