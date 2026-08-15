import { FaWhatsapp, FaInstagram, FaFacebook } from "react-icons/fa";

import site from "../../config/site";

import "./WhatsAppButton.css";

function WhatsAppButton() {
  return (
    <div className="floating-buttons">
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
