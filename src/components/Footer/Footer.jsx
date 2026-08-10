import { Link } from "react-router-dom";

import { FaFacebookF, FaInstagram, FaWhatsapp } from "react-icons/fa";

import site from "../../config/site";
import logo from "../../assets/logo/logo.png";

import "./Footer.css";

function Footer() {
  return (
    <footer className="footer" id="contacto">
      <div className="footer-main">
        <div className="footer-col footer-about">
          <h3 className="footer-brand">
            <img src={logo} alt="MD" className="footer-brand-logo" />
            <span className="footer-brand-texto">MD</span>
          </h3>
          <p>
            Tu tienda de cosméticos favorita. Maquillaje, perfumes y cuidado
            personal con los mejores precios y productos 100% originales.
          </p>
          <div className="footer-social">
            <a href={site.instagramUrl} aria-label="Instagram" target="_blank" rel="noopener noreferrer">
              <FaInstagram />
            </a>
            <a href={`${site.whatsappUrl}?text=${encodeURIComponent(site.whatsappMensaje)}`} aria-label="WhatsApp" target="_blank" rel="noopener noreferrer">
              <FaWhatsapp />
            </a>
            <a href="#" aria-label="Facebook">
              <FaFacebookF />
            </a>
          </div>
        </div>

        <div className="footer-col">
          <h4>Contacto</h4>
          <ul>
            <li>
              <FaWhatsapp />
              <a href={`${site.whatsappUrl}?text=${encodeURIComponent(site.whatsappMensaje)}`} target="_blank" rel="noopener noreferrer">
                {site.whatsappEtiqueta}
              </a>
            </li>
            <li>
              <FaInstagram />
              <a href={site.instagramUrl} target="_blank" rel="noopener noreferrer">
                {site.instagram}
              </a>
            </li>
          </ul>
        </div>

        <div className="footer-col">
          <h4>Categorías</h4>
          <ul>
            <li>
              <Link to="/categoria/maquillaje">Maquillaje</Link>
            </li>
            <li>
              <Link to="/categoria/perfumes">Perfumes</Link>
            </li>
            <li>
              <Link to="/categoria/joyeria">Joyería</Link>
            </li>
            <li>
              <Link to="/categoria/cuidado-personal">Cuidado Personal</Link>
            </li>
            <li>
              <Link to="/productos">Ver catálogo</Link>
            </li>
          </ul>
        </div>
      </div>

      <div className="footer-map-section">
        <div className="footer-map-embed">
          <iframe
            src={site.mapsEmbedUrl}
            title="Ubicación de MD"
            loading="lazy"
            allowFullScreen
            referrerPolicy="no-referrer-when-downgrade"
          />
        </div>
      </div>

      <div className="footer-bottom">
        <p>© {new Date().getFullYear()} MD. Todos los derechos reservados.</p>
      </div>
    </footer>
  );
}

export default Footer;
