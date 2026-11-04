import React from "react";
import ReactDOM from "react-dom/client";

import "bootstrap/dist/css/bootstrap.min.css";
import "./styles/global.css";

import App from "./App";
import { ProviderStore } from "./storeConfig";
import { Store } from "./store";

// Último: afina tamaños en teléfonos por encima de los estilos de cada página.
import "./styles/mobile.css";

ReactDOM.createRoot(document.getElementById("root")!).render(
    <React.StrictMode>
        <ProviderStore store={Store}>
            <App />
        </ProviderStore>
    </React.StrictMode>
);
