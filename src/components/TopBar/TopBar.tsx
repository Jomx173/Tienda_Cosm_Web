import { FaTruck } from "react-icons/fa";

import "./TopBar.css";

function TopBar() {
  return (
    <div className="topbar">
      <span className="topbar-item">
        <FaTruck />
        <span>Envíos a nivel nacional</span>
      </span>
    </div>
  );
}

export default TopBar;
