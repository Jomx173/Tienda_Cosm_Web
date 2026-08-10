import { FaWhatsapp, FaShoppingCart, FaInstagram } from "react-icons/fa";
import { Link } from "react-router-dom";

import { useCarrito } from "../../context/CarritoContext";
import site from "../../config/site";

import "./WhatsAppButton.css";

function WhatsAppButton() {
  const { cantidadTotal } = useCarrito();

  return (
    <div className="floating-buttons">
      <Link
        to="/carrito"
        className="float-btn float-cart"
        aria-label="Ver mi carrito"
      >
        <FaShoppingCart />
        {cantidadTotal > 0 && (
          <span className="float-cart-contador">{cantidadTotal}</span>
        )}
        <span className="float-label">Carrito</span>
      </Link>

      <a
        href={`${site.whatsappUrl}?text=${encodeURIComponent(site.whatsappMensaje)}`}
        target="_blank"
        rel="noopener noreferrer"
        className="float-btn float-whatsapp"
        aria-label="Chatear por WhatsApp"
      >
        <FaWhatsapp />
        <span className="float-label">WhatsApp</span>
      </a>

      <a
        href={site.instagramUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="float-btn float-instagram"
        aria-label="Seguir en Instagram"
      >
        <FaInstagram />
        <span className="float-label">Instagram</span>
      </a>
    </div>
  );
}

export default WhatsAppButton;
