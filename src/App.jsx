import { BrowserRouter, Routes, Route } from "react-router-dom";

import Home from "./pages/Home/Home";
import Admin from "./pages/Admin/Admin";
import ProductoDetalle from "./pages/ProductoDetalle/ProductoDetalle";
import Carrito from "./pages/Carrito/Carrito";
import Productos from "./pages/Productos/Productos";
import Categoria from "./pages/Categoria/Categoria";

function App() {
    return (
        <BrowserRouter>
            <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/productos" element={<Productos />} />
                <Route path="/categoria/:slug" element={<Categoria />} />
                <Route path="/producto/:id" element={<ProductoDetalle />} />
                <Route path="/carrito" element={<Carrito />} />
                <Route path="/admin" element={<Admin />} />
                <Route path="/admin/dashboard" element={<Admin />} />
                <Route path="/admin/productos" element={<Admin />} />
                <Route path="/admin/categorias" element={<Admin />} />
                <Route path="/admin/ofertas" element={<Admin />} />
                <Route path="/admin/pedidos" element={<Admin />} />
                <Route path="/admin/imagenes" element={<Admin />} />
                <Route path="/admin/reportes" element={<Admin />} />
            </Routes>
        </BrowserRouter>
    );
}

export default App;
