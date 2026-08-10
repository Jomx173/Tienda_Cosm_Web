import { FaInstagram } from "react-icons/fa";

import "./Instagram.css";

const fotos = [
  "https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?w=400&auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=400&auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1556228578-8c89e6adf883?w=400&auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1512496015851-a90fb38ba796?w=400&auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1617038220319-276d3cfab638?w=400&auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?w=400&auto=format&fit=crop&q=80",
];

function Instagram() {
  return (
    <section className="instagram">
      <div className="section-header">
        <span className="section-eyebrow">Síguenos</span>
        <h2>@md_beauty_21</h2>
        <p>Comparte tus compras y etiquétanos para aparecer en nuestra página.</p>
      </div>

      <div className="instagram-grid">
        {fotos.map((foto, index) => (
          <a href="#" className="instagram-item" key={index}>
            <img src={foto} alt="Instagram" loading="lazy" />
            <div className="instagram-overlay">
              <FaInstagram />
            </div>
          </a>
        ))}
      </div>
    </section>
  );
}

export default Instagram;
