import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

import categoriesData from "../../data/categories";
import { obtenerCategorias } from "../../services/productoService";
import { slugify } from "../../utils/slugs";

import "./Categories.css";

const IMAGENES = {
    Maquillaje: "https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?w=600",
    Perfumes: "https://images.unsplash.com/photo-1541643600914-78b084683601?w=600",
    "Joyería": "https://images.unsplash.com/photo-1617038220319-276d3cfab638?w=600",
    Ofertas: "https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=600",
    "Cuidado Personal": "https://images.unsplash.com/photo-1556228578-8c89e6adf883?w=600",
};

const imagenDe = (categoria) => categoria.imagen || IMAGENES[categoria.nombre] || "";

function Categories() {
    const [categorias, setCategorias] = useState(categoriesData);

    useEffect(() => {
        obtenerCategorias()
            .then(setCategorias)
            .catch(() => {});
    }, []);

    return (
        <section className="categories" id="categorias">
            <h4>EXPLORA NUESTRAS</h4>

            <h2>Categorías</h2>

            <div className="categories-grid">
                {categorias.map((categoria) => (
                    <div className="category-card" key={categoria.id_categoria ?? categoria.id}>
                        {imagenDe(categoria) ? (
                            <img src={imagenDe(categoria)} alt={categoria.nombre} />
                        ) : (
                            <div className="category-sin-imagen">{categoria.nombre[0]}</div>
                        )}
                        <h3>{categoria.nombre}</h3>
                        <Link
                            to={`/categoria/${slugify(categoria.nombre)}`}
                            className="category-btn"
                        >
                            Ver productos
                        </Link>
                    </div>
                ))}
            </div>
        </section>
    );
}

export default Categories;
