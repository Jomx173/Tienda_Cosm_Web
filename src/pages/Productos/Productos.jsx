import { useEffect } from "react";

import TopBar from "../../components/TopBar/TopBar";
import Navbar from "../../components/Navbar/Navbar";
import Products from "../../components/Products/Products";
import Footer from "../../components/Footer/Footer";
import WhatsAppButton from "../../components/WhatsAppButton/WhatsAppButton";

import "./Productos.css";

function Productos() {
    useEffect(() => {
        document.title = "Productos | MD";

        const meta = document.querySelector('meta[name="description"]');
        if (meta) {
            meta.setAttribute(
                "content",
                "Explora todos nuestros productos en MD: maquillaje, perfumes, joyería, ofertas y cuidado personal."
            );
        }

        return () => {
            document.title = "MD";
        };
    }, []);

    return (
        <div className="productos">
            <TopBar />
            <Navbar />
            <Products />
            <Footer />
            <WhatsAppButton />
        </div>
    );
}

export default Productos;
