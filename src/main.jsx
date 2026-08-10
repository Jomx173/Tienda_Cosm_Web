import React from "react";
import ReactDOM from "react-dom/client";

import "bootstrap/dist/css/bootstrap.min.css";
import "./styles/global.css";

import App from "./App";
import { CarritoProvider } from "./context/CarritoContext";

ReactDOM.createRoot(document.getElementById("root")).render(
    <React.StrictMode>
        <CarritoProvider>
            <App />
        </CarritoProvider>
    </React.StrictMode>
);
