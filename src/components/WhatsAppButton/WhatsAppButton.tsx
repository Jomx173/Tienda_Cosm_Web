import { FaWhatsapp, FaShoppingCart, FaInstagram, FaFacebook } from "react-icons/fa";
import { Link } from "react-router-dom";

import { useSelector } from "../../store";
import SelectorCarrito from "../../store/slices/Carrito/selectors";
import site from "../../config/site";

import "./WhatsAppButton.css";

function WhatsAppButton() {
  const cantidadTotal = useSelector(SelectorCarrito.getCantidadTotal);

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
        href={site.whatsappGrupoUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="float-btn float-whatsapp"
        aria-label="Unirse al grupo de WhatsApp"
      >
        <FaWhatsapp />
        <span className="float-label">Grupo WhatsApp</span>
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

      <a
        href={site.facebookUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="float-btn float-facebook"
        aria-label="Seguir en Facebook"
      >
        <FaFacebook />
        <span className="float-label">Facebook</span>
      </a>
    </div>
  );
}

export default WhatsAppButton;
