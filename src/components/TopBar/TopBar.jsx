import { FaTruck, FaMapMarkerAlt } from "react-icons/fa";

import "./TopBar.css";

function TopBar() {
  return (
    <div className="topbar">
      <span className="topbar-item">
        <FaTruck />
        <span>Hacemos envíos dentro del área local · Retiro en tienda también disponible</span>
      </span>

      <span className="topbar-item">
        <FaMapMarkerAlt />
        <span>Pedidos por WhatsApp · Te esperamos en el local</span>
      </span>
    </div>
  );
}

export default TopBar;
