import { FaSearch, FaTimes } from "react-icons/fa";

import "./SearchBar.css";

function SearchBar({ busqueda, onBuscar, onLimpiar }) {
    return (
        <div className="searchbar">
            <FaSearch className="searchbar-icon" />
            <input
                type="text"
                value={busqueda}
                onChange={(e) => onBuscar(e.target.value)}
                placeholder="Buscar productos..."
                aria-label="Buscar productos"
            />
            {busqueda && (
                <button className="searchbar-limpiar" onClick={onLimpiar} title="Limpiar búsqueda">
                    <FaTimes />
                </button>
            )}
        </div>
    );
}

export default SearchBar;
