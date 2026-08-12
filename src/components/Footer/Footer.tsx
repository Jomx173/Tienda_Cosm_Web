import { Link } from "react-router-dom";

import { FaInstagram, FaWhatsapp, FaFacebook } from "react-icons/fa";

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
          </h3>
          <p>
            Tu tienda de cosméticos favorita. Maquillaje, perfumes y cuidado
            personal con los mejores precios y productos 100% originales.
          </p>
        </div>

        <div className="footer-col">
          <h4>Contacto</h4>
          <ul>
            <li>
              <FaInstagram />
              <a href={site.instagramUrl} target="_blank" rel="noopener noreferrer">
                {site.instagram}
              </a>
            </li>
            <li>
              <FaFacebook />
              <a href={site.facebookUrl} target="_blank" rel="noopener noreferrer">
                Facebook
              </a>
            </li>
            <li>
              <FaWhatsapp />
              <a href={site.whatsappGrupoUrl} target="_blank" rel="noopener noreferrer">
                {site.whatsappGrupoEtiqueta}
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

      <div className="footer-bottom">
        <p>© {new Date().getFullYear()} MD. Todos los derechos reservados.</p>
      </div>
    </footer>
  );
}

export default Footer;
